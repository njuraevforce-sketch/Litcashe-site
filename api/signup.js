// /api/signup.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, referrer_id } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return res.status(500).json({ error: 'Server is not configured (env vars missing)' });
    }

    const sb = createClient(url, serviceKey);

    // создаем юзера через service role
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) {
      return res.status(400).json({ error: 'Auth error', details: createErr.message });
    }

    const userId = created?.user?.id;

    // пишем профиль
    const { error: profErr } = await sb.from('profiles').upsert({
      id: userId,
      email,
      referrer_id: referrer_id || null,
    });
    if (profErr) {
      return res.status(500).json({ error: 'Database error saving new user', details: profErr.message });
    }

    // можно сразу автологиниться анонимным ключом, если хочешь (необязательно)
    return res.status(200).json({
      ok: true,
      user: { id: userId, email },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Internal error', details: String(e) });
  }
}
