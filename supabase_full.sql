
-- FULL SCHEMA (profiles, deposits, withdrawals, earnings, video_views, RLS, RPCs)
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ref_code text unique,
  upline_id uuid references public.profiles(id) on delete set null,
  wallet text,
  level int not null default 0,
  rate numeric(5,2) not null default 0.00,
  capital numeric(18,2) not null default 0.00,
  views int not null default 0,
  ref_count int not null default 0,
  status text not null default 'inactive',
  activation_at timestamptz,
  last_withdraw_req_at timestamptz
);

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(18,2) not null check (amount>0),
  txid text not null unique,
  from_address text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(18,2) not null check (amount>0),
  wallet text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.video_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.earnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(18,2) not null,
  source text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create or replace view public.v_user_balance as
select p.id as user_id,
       coalesce((select sum(d.amount) from public.deposits d where d.user_id=p.id and d.status='confirmed'),0)
       + coalesce((select sum(e.amount) from public.earnings e where e.user_id=p.id),0)
       - coalesce((select sum(w.amount) from public.withdrawals w where w.user_id=p.id and w.status='confirmed'),0) as balance
from public.profiles p;

alter table public.profiles enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;
alter table public.video_views enable row level security;
alter table public.earnings enable row level security;

create policy prof_select_self on public.profiles for select using (auth.uid() = id);
create policy prof_update_self on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy dep_select_self on public.deposits for select using (auth.uid() = user_id);
create policy dep_insert_self on public.deposits for insert with check (auth.uid() = user_id);
create policy wd_select_self  on public.withdrawals for select using (auth.uid() = user_id);
create policy wd_insert_self  on public.withdrawals for insert with check (auth.uid() = user_id);
create policy vv_select_self  on public.video_views for select using (auth.uid() = user_id);
create policy vv_insert_self  on public.video_views for insert with check (auth.uid() = user_id);
create policy earn_select_self on public.earnings for select using (auth.uid() = user_id);
create policy earn_insert_self on public.earnings for insert with check (auth.uid() = user_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.f_generate_ref_code(uid uuid)
returns text language sql immutable as $$ select substr(encode(digest(uid::text,'sha256'),'hex'),1,8); $$;

create or replace function public.f_profile_init()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, email, phone, ref_code, status)
  values (new.id, new.email, new.phone, public.f_generate_ref_code(new.id), 'inactive')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists trg_profile_init on auth.users;
create trigger trg_profile_init after insert on auth.users for each row execute function public.f_profile_init();

create or replace function public.is_email_confirmed(uid uuid)
returns boolean language sql security definer stable as $$
  select coalesce(u.email_confirmed_at is not null, false) from auth.users u where u.id = uid;
$$;

create or replace function public.compute_level()
returns table(level int, rate numeric, base_cap numeric, next_target text, progress text)
language plpgsql security definer as $$
declare
  me uuid := auth.uid();
  cap numeric := 0; refs int := 0; lvl int := 0; r numeric := 0; cap_ceiling numeric := 0;
  next_t text; prog text; confirmed boolean := false;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select coalesce(capital,0), coalesce(ref_count,0) into cap, refs from public.profiles where id = me;
  select public.is_email_confirmed(me) into confirmed;

  if cap >= 1000 and refs >= 30 then lvl := 4; r := 5.00; cap_ceiling := 3000;
  elsif cap >= 500 and refs >= 15 then lvl := 3; r := 4.00; cap_ceiling := 1000;
  elsif cap >= 300 and refs >= 5 then lvl := 2; r := 3.00; cap_ceiling := 500;
  elsif cap >= 29 then lvl := 1; r := 2.50; cap_ceiling := 300;
  else lvl := 0; r := 0.00; cap_ceiling := 0;
  end if;

  update public.profiles
     set level=lvl, rate=r,
         status = case when (cap >= 29 and confirmed) then 'active' else 'inactive' end
   where id = me;

  if lvl = 0 then next_t := 'Подтвердите email и достигните 29 USDT для Starter'; prog := concat(cap::int,'/29 USDT; email=',case when confirmed then 'OK' else '—' end);
  elsif lvl = 1 then next_t := '300 USDT и 5 рефералов для Advanced'; prog := concat(least(cap::int,300),'/300 USDT; ', refs,'/5 реф.; email=OK');
  elsif lvl = 2 then next_t := '500 USDT и 15 рефералов для Pro Elite'; prog := concat(least(cap::int,500),'/500 USDT; ', refs,'/15 реф.; email=OK');
  elsif lvl = 3 then next_t := '1000 USDT и 30 рефералов для Titanium'; prog := concat(least(cap::int,1000),'/1000 USDT; ', refs,'/30 реф.; email=OK');
  else next_t := null; prog := 'Макс. уровень';
  end if;

  return query select lvl, r, case when cap_ceiling>0 then least(cap, cap_ceiling) else 0 end, next_t, prog;
end $$;

create or replace function public.get_uplines_3(p_user uuid default null)
returns table(gen int, upline_id uuid)
language sql security definer stable as $$
  with recursive tree as (
    select 1 as gen, p.upline_id from public.profiles p where p.id = coalesce(p_user, auth.uid())
    union all
    select t.gen + 1, p.upline_id from tree t join public.profiles p on p.id = t.upline_id where t.gen < 3 and t.upline_id is not null
  ) select gen, upline_id from tree where upline_id is not null order by gen;
$$;

create or replace function public.award_view(p_video_id text default null)
returns table(total_views int, added_earning numeric, per_view numeric, lvl int, rate numeric, base_cap numeric)
language plpgsql security definer as $$
declare
  me uuid := auth.uid(); lvl_ int; r_ numeric; base_ numeric; tv int; earn numeric := 0;
  g int; up uuid; ref_pct numeric; ref_amt numeric; confirmed boolean := false; cap numeric := 0;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select public.is_email_confirmed(me) into confirmed;
  select capital into cap from public.profiles where id=me;
  if not confirmed or cap < 29 then raise exception 'Требуется подтверждение email и минимум 29 USDT капитала для старта'; end if;

  select level, rate, base_cap into lvl_, r_, base_ from public.compute_level();

  insert into public.video_views(user_id, video_id) values (me, p_video_id);
  update public.profiles set views = views + 1 where id = me;
  select views into tv from public.profiles where id = me;

  earn := round(((r_/100.0) * base_ / 5.0)::numeric, 2);
  if earn > 0 then insert into public.earnings(user_id, amount, source, meta) values (me, earn, 'view', jsonb_build_object('video_id', p_video_id, 'per_view', true)); end if;

  if earn > 0 then
    for g, up in select gen, upline_id from public.get_uplines_3(me) loop
      if g=1 then ref_pct := 0.13; elsif g=2 then ref_pct := 0.05; elsif g=3 then ref_pct := 0.01; else ref_pct := 0; end if;
      if ref_pct > 0 then
        ref_amt := round((earn * ref_pct)::numeric, 2);
        if ref_amt > 0 then insert into public.earnings(user_id, amount, source, meta) values (up, ref_amt, 'referral', jsonb_build_object('from_user', me, 'gen', g, 'video_id', p_video_id, 'base_earning', earn)); end if;
      end if;
    end loop;
  end if;

  return query select tv, earn, round(((r_/100.0) * base_ / 5.0)::numeric, 2), lvl_, r_, base_;
end $$;

create or replace function public.get_dashboard()
returns table(balance numeric, lvl int, rate numeric, cap numeric, base_cap numeric, per_view numeric, views int, refs int, status text, next_target text, progress text)
language plpgsql security definer stable as $$
declare
  me uuid := auth.uid(); lvl_ int; rate_ numeric; base_ numeric; next_t text; prog text; cap_ numeric; refs_ int; stat text; bal numeric;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select level, rate, base_cap, next_target, progress into lvl_, rate_, base_, next_t, prog from public.compute_level();
  select capital, ref_count, status into cap_, refs_, stat from public.profiles where id = me;
  select balance into bal from public.v_user_balance where user_id = me;
  return query select bal, lvl_, rate_, cap_, base_, round(((rate_/100.0) * base_ / 5.0)::numeric, 2), (select views from public.profiles where id=me), refs_, stat, next_t, prog;
end $$;

create or replace function public.get_referral_income()
returns table(gen1_income numeric, gen2_income numeric, gen3_income numeric, total_ref_income numeric)
language sql security definer stable as $$
  select
    coalesce(sum(case when (e.source='referral' and (e.meta->>'gen')::int = 1) then e.amount end),0),
    coalesce(sum(case when (e.source='referral' and (e.meta->>'gen')::int = 2) then e.amount end),0),
    coalesce(sum(case when (e.source='referral' and (e.meta->>'gen')::int = 3) then e.amount end),0),
    coalesce(sum(case when e.source='referral' then e.amount end),0)
  from public.earnings e where e.user_id = auth.uid();
$$;

create or replace function public.get_referral_recent(p_limit int default 10)
returns table(created_at timestamptz, amount numeric, gen int, from_user uuid, video_id text)
language sql security definer stable as $$
  select e.created_at, e.amount, nullif((e.meta->>'gen')::int,0), nullif((e.meta->>'from_user')::uuid,'00000000-0000-0000-0000-000000000000'::uuid), (e.meta->>'video_id')
  from public.earnings e where e.user_id=auth.uid() and e.source='referral' order by e.created_at desc limit greatest(p_limit,1);
$$;

create or replace function public.get_referral_tree()
returns table(gen int, user_id uuid, email text, phone text, level int, capital numeric, created_at timestamptz)
language sql security definer stable as $$
  with recursive t as (
    select 1 as gen, p2.id, p2.email, p2.phone, p2.level, p2.capital, p2.created_at
    from public.profiles p join public.profiles p2 on p2.upline_id = p.id where p.id = auth.uid()
    union all
    select t.gen+1, p3.id, p3.email, p3.phone, p3.level, p3.capital, p3.created_at
    from t join public.profiles p3 on p3.upline_id = t.id where t.gen < 3
  ) select * from t order by gen, created_at desc;
$$;

create or replace function public.set_referral_by_code(p_ref_code text)
returns boolean language plpgsql security definer as $$
declare me uuid := auth.uid(); up_id uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if exists(select 1 from public.profiles where id=me and upline_id is not null) then return false; end if;
  select id into up_id from public.profiles where ref_code = p_ref_code;
  if up_id is null or up_id = me then return false; end if;
  update public.profiles set upline_id = up_id where id = me;
  update public.profiles set ref_count = ref_count + 1 where id = up_id;
  return true;
end $$;

create or replace function public.request_deposit(p_amount numeric, p_txid text)
returns uuid language plpgsql security definer as $$
declare me uuid := auth.uid(); rid uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  insert into public.deposits(user_id, amount, txid) values (me, p_amount, p_txid) returning id into rid;
  return rid;
end $$;

create or replace function public.request_withdrawal(p_amount numeric, p_wallet text)
returns uuid language plpgsql security definer as $$
declare me uuid := auth.uid(); rid uuid; w text; bal numeric; act_at timestamptz; last_req timestamptz;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select wallet, activation_at into w, act_at from public.profiles where id=me;
  -- If wallet provided, use it and persist to profile
  w := coalesce(nullif(p_wallet,''), w);
  if coalesce(w,'') <> '' then
    begin
      update public.profiles set wallet = w where id = me;
    exception when others then null; end;
  end if;
  if coalesce(w,'') = '' then raise exception 'Wallet not set'; end if;
  if act_at is null or now() < act_at + interval '5 days' then raise exception 'Первый вывод доступен через 5 дней после активации'; end if;
  select balance into bal from public.v_user_balance where user_id=me;
  if coalesce(bal,0) < p_amount then raise exception 'Insufficient balance'; end if;
  if p_amount < 10 then raise exception 'Minimum withdrawal is 10'; end if;
  select max(created_at) into last_req from public.withdrawals where user_id=me;
  if last_req is not null and now() < last_req + interval '24 hours' then raise exception 'Следующий вывод возможен не ранее чем через 24 часа после предыдущего'; end if;
  insert into public.withdrawals(user_id, amount, wallet) values (me, p_amount, w) returning id into rid;
  update public.profiles set last_withdraw_req_at = now() where id = me;
  return rid;
end $$;

create or replace function public.after_deposit_confirm()
returns trigger language plpgsql security definer as $$
declare new_cap numeric;
begin
  if(new.status='confirmed' and old.status is distinct from 'confirmed') then
    update public.profiles set capital = capital + new.amount where id = new.user_id;
    insert into public.earnings(user_id, amount, source, meta) values (new.user_id, new.amount, 'deposit', jsonb_build_object('txid', new.txid, 'from', new.from_address));
    select capital into new_cap from public.profiles where id = new.user_id;
    if new_cap >= 29 then update public.profiles set activation_at = coalesce(activation_at, now()) where id = new.user_id; end if;
  end if; return new;
end $$;
drop trigger if exists trg_deposit_confirm on public.deposits;
create trigger trg_deposit_confirm after update on public.deposits for each row execute function public.after_deposit_confirm();
