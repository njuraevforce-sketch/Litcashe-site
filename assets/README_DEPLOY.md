# Litcash — Ready for Vercel

Готовый пакет для деплоя. Что сделать:

1) **В Supabase → SQL**: выполните `supabase_full.sql` (из этого архива).
2) **В Supabase → Authentication → URL**: добавьте `https://<ваш-проект>.vercel.app/*` и `http://localhost:3000/*`.
3) **В Vercel → Settings → Environment Variables** добавьте:
   - `SUPABASE_URL = https://einpfuegfsilnoiareco.supabase.co`
   - `SUPABASE_SERVICE_ROLE = <ваш service_role (секрет, не публиковать)>`
   - `LITCASH_TRON_WALLET = TJa8ncBTn1FtW78JqbPXR3TAUq4qHBXpcG`
   - (опционально) `TRON_API_KEY = <TronGrid API key>`

4) **Деплой**: импортируйте репозиторий/загрузите папку в Vercel. Ничего собирать не нужно.

## Файлы
- `supabaseConfig.js` — публичный клиент с anon key (без секретов).
- `i18n.js` — переключатель языка RU/EN (атрибуты `data-i18n`).
- `api/confirm-tron.js` — серверная проверка TRC20 и подтверждение депозита.
- `vercel.json`, `package.json` — конфигурация для Vercel/API и зависимость `@supabase/supabase-js`.

## Важно
- **Никогда** не кладите `service_role` в клиентские файлы.
- После успешного деплоя **ротация service_role** ключа в Supabase.
