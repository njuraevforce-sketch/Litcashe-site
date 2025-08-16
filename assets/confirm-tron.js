// Serverless: /api/confirm-tron.js (Vercel)
// Verifies a TRC20 USDT transaction and confirms the corresponding deposit.
// ENV required in Vercel:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE, LITCASH_TRON_WALLET, TRON_API_KEY (optional)

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { txid, deposit_id, expected_amount } = req.body || {};
    if (!txid || !deposit_id) {
      return res.status(400).json({ error: 'Missing txid or deposit_id' });
    }
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    const LITCASH_TRON_WALLET = process.env.LITCASH_TRON_WALLET;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !LITCASH_TRON_WALLET) {
      return res.status(500).json({ error: 'Server env is not configured' });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Basic TronGrid fetch
    const headers = {};
    if (process.env.TRON_API_KEY) headers['TRON-PRO-API-KEY'] = process.env.TRON_API_KEY;
    const r = await fetch(`https://api.trongrid.io/v1/transactions/${txid}`, { headers });
    if (!r.ok) {
      return res.status(400).json({ error: 'TX not found on TronGrid' });
    }
    const data = await r.json();
    const tx = (data && data.data && data.data[0]) || null;
    if (!tx) return res.status(400).json({ error: 'No tx data' });

    // Parse USDT TRC20 transfer from logs
    // USDT TRC20 contract: TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj
    const USDT_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
    const toEvents = (tx.log || []).filter(e => e.address === USDT_CONTRACT);
    let amountUSDT = null;
    let toAddr = null;
    let fromAddr = null;

    for (const e of toEvents) {
      try {
        const topics = e.topics || [];
        // Transfer(address,address,uint256) topic[0] hash
        const TRANSFER_TOPIC = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        if (topics[0] && topics[0].toLowerCase().includes(TRANSFER_TOPIC)) {
          // addresses are in topics[1] (from), topics[2] (to); data is amount (hex)
          // Tron keeps addresses in base58 elsewhere; here use contractData if available
        }
      } catch {}
    }

    // Fallback: use event endpoint (more reliable)
    const er = await fetch(`https://api.trongrid.io/v1/contracts/${USDT_CONTRACT}/events?event_name=Transfer&limit=20&transaction_id=${txid}`, { headers });
    const ej = await er.json();
    const evt = (ej && ej.data && ej.data[0]) || null;
    if (!evt) return res.status(400).json({ error: 'No USDT Transfer event for tx' });
    toAddr = evt.result && evt.result.to;
    fromAddr = evt.result && evt.result.from;
    // amount is in "value" with 6 decimals for USDT on Tron
    const rawVal = evt.result && evt.result.value;
    amountUSDT = rawVal ? Number(rawVal) / 1e6 : null;

    if (!toAddr || !amountUSDT) {
      return res.status(400).json({ error: 'Cannot parse USDT transfer' });
    }
    if (toAddr !== LITCASH_TRON_WALLET) {
      return res.status(400).json({ error: 'USDT not sent to the project wallet' });
    }
    if (expected_amount && amountUSDT + 1e-6 < Number(expected_amount)) {
      return res.status(400).json({ error: 'Amount less than expected' });
    }

    // Confirm deposit in DB
    const { data: updated, error } = await supabase
      .from('deposits')
      .update({ status: 'confirmed', from_address: fromAddr, amount: amountUSDT })
      .eq('id', deposit_id)
      .select()
      .single();
    if (error) throw error;

    return res.status(200).json({ ok: true, deposit: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal error', details: String(e) });
  }
}
