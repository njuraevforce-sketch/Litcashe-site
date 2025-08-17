// /api/confirm-tron.js
// Проверяет TRC20 USDT-транзакцию через TronGrid и подтверждает депозит в БД.
// Требуемые ENV (Vercel → Project Settings → Environment Variables):
//  - SUPABASE_URL               (например: https://einpfuegfsilnoiareco.supabase.co)
//  - SUPABASE_SERVICE_ROLE      (секретный service role key — ТОЛЬКО на сервере)
//  - LITCASH_TRON_WALLET        (твой проектный USDT TRC20 кошелёк, адрес T...)
//  - TRON_API_KEY               (опционально, ключ TronGrid для повышенных лимитов)
//
// БД: использует RPC confirm_deposit(p_tx_hash, p_amount)
//     который обновляет deposits и profiles.deposit_total

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { txid, deposit_id, expected_amount } = req.body || {};
    if (!txid) return res.status(400).json({ error: 'Missing txid' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    const LITCASH_TRON_WALLET = process.env.LITCASH_TRON_WALLET;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !LITCASH_TRON_WALLET) {
      return res.status(500).json({ error: 'Server env is not configured' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // 1) Проверяем, что транзакция существует
    const headers = {};
    if (process.env.TRON_API_KEY) headers['TRON-PRO-API-KEY'] = process.env.TRON_API_KEY;

    const txResp = await fetch(`https://api.trongrid.io/v1/transactions/${txid}`, { headers });
    if (!txResp.ok) return res.status(400).json({ error: 'TX not found on TronGrid' });
    const txJson = await txResp.json();
    const tx = txJson?.data?.[0] || null;
    if (!tx) return res.status(400).json({ error: 'No tx data' });

    // Желательно проверить успешность выполнения контракта
    const contractRet = (tx.ret && tx.ret[0] && tx.ret[0].contractRet) || tx.contractRet;
    if (contractRet && String(contractRet).toUpperCase() !== 'SUCCESS') {
      return res.status(400).json({ error: `TX status is ${contractRet}` });
    }

    // 2) Вынимаем события Transfer USDT TRC20
    const USDT_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
    const evResp = await fetch(
      `https://api.trongrid.io/v1/contracts/${USDT_CONTRACT}/events?event_name=Transfer&limit=20&transaction_id=${txid}`,
      { headers }
    );
    if (!evResp.ok) return res.status(400).json({ error: 'Event lookup failed' });
    const evJson = await evResp.json();
    const evt = evJson?.data?.[0] || null;
    if (!evt) return res.status(400).json({ error: 'No USDT Transfer event for tx' });

    const toAddr = evt?.result?.to;
    const fromAddr = evt?.result?.from;
    const rawVal = evt?.result?.value;            // в самых маленьких единицах (6 знаков для USDT)
    const amountUSDT = rawVal ? Number(rawVal) / 1e6 : null;

    if (!toAddr || !amountUSDT) {
      return res.status(400).json({ error: 'Cannot parse USDT transfer' });
    }
    if (toAddr !== LITCASH_TRON_WALLET) {
      return res.status(400).json({ error: 'USDT not sent to project wallet' });
    }
    if (expected_amount && amountUSDT + 1e-6 < Number(expected_amount)) {
      return res.status(400).json({ error: 'Amount less than expected' });
    }

    // 3) (необязательно) Привяжем tx к заявке, если передан deposit_id и в заявке пустой tx_hash
    if (deposit_id) {
      await supabase
        .from('deposits')
        .update({ tx_hash: txid })
        .eq('id', deposit_id)
        .is('tx_hash', null);
      // c service_role это допустимо; RLS обходится
    }

    // 4) Подтверждаем депозит через RPC, это также обновит profiles.deposit_total
    const { error: rpcErr } = await supabase.rpc('confirm_deposit', {
      p_tx_hash: txid,
      p_amount: amountUSDT
    });
    if (rpcErr) {
      return res.status(400).json({ error: 'DB RPC error', details: rpcErr.message });
    }

    return res.status(200).json({
      ok: true,
      txid,
      amount: amountUSDT,
      from: fromAddr,
      to: toAddr
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal error', details: String(e) });
  }
}

