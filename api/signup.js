// /api/signup.js  (Node/Serverless on Vercel)
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ВАЖНО: только на сервере!
);

export default async function handler(req, res) {
  // CORS (если дергаете с другого домена)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Проверим, не существует ли уже
    const { data: existing, error: getErr } =
      await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (getErr && getErr.message && getErr.status !== 404) {
      // редкая сеть/ошибка — покажем её
      return res.status(500).json({ error: getErr.message });
    }

    if (existing?.user) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Создаём подтвержденного пользователя БЕЗ писем
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ ok: true, user_id: data.user.id });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
