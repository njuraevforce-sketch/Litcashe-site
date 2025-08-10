Litcash — Supabase integration (v1)
-----------------------------------

1) In Supabase SQL editor, run in order:
   - db/01_schema.sql
   - db/02_policies.sql

2) In your site:
   - Copy scripts/supabaseConfig.sample.js to scripts/supabaseConfig.js
   - Put your Supabase URL and anon key.

3) Deploy (or test locally via a web server).

What works now:
- Sign up / Sign in (login/register pages)
- One-time referral binding via ?ref=CODE or input field on registration
- Deposit request (manual confirmation in Supabase -> deposits.status = confirmed)
- Withdraw request
- Wallet save / Password change
- Referral commissions auto-accrue 13%/5%/1% when earnings are inserted for an ACTIVE user (activation = confirmed deposits sum >= 29).

Next steps (optional):
- Add an Edge Function to award earnings per video-view.
- Admin UI to confirm deposits / process withdrawals.