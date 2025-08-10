
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, referrer_id } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const url = process.env.SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY; // именно service-role!

    if (!url || !service) {
      return res.status(500).json({ error: 'Server is not configured (env vars missing)' });
    }

    const sb = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createErr) {
      return res.status(400).json({ error: createErr.message });
    }

    const userId = created?.user?.id;

    const { error: profErr } = await sb.from('profiles').upsert({
      id: userId,
      email,
      referrer_id: referrer_id || null
    });
    if (profErr) {
      return res.status(500).json({ error: 'Database error saving new user', details: profErr.message });
    }

    const anon = process.env.SUPABASE_ANON_KEY;
    const sbPublic = createClient(url, anon);
    const { data: signInData, error: signErr } = await sbPublic.auth.signInWithPassword({ email, password });
    if (signErr) {

      return res.status(200).json({
        ok: true,
        created: true,
        loggedIn: false,
        message: `User created, but auto-login failed: ${signErr.message}`
      });
    }

    return res.status(200).json({
      ok: true,
      created: true,
      loggedIn: true,
      user: { id: signInData.user.id, email }
    });
  } catch (e) {

    return res.status(500).json({ error: 'Internal error', details: String(e) });
  }
}
