-- === SUPABASE SQL PATCHES (run in SQL editor) ===

-- Profiles expected: id UUID PK, ref_code text unique, balance numeric default 0, is_active bool, deposit_total numeric default 0, lvl int default 0, per_view numeric default 0.02

-- Generate referral by code procedure (id -> code set elsewhere). Code is already set on client fallback.
create or replace function set_referral_by_code(p_ref_code text)
returns void language plpgsql security definer as $$
declare parent uuid;
begin
  if p_ref_code is null or length(p_ref_code)=0 then return; end if;
  select id into parent from profiles where ref_code = p_ref_code;
  if parent is null then return; end if;
  -- attach relation if not exists
  insert into referrals(child_id, parent_id) values (auth.uid(), parent) on conflict do nothing;
end $$;

-- Determine active: deposit_total >= 29
create or replace view referrals_active as
select r.child_id, r.parent_id
from referrals r
join profiles p on p.id = r.child_id
where coalesce(p.deposit_total,0) >= 29;

-- Award view with daily limit and active check
create or replace function award_view(p_video_id text)
returns void language plpgsql security definer as $$
declare today date := current_date;
declare views_today int;
declare p record;
begin
  select * into p from profiles where id = auth.uid();
  if p is null then raise exception 'No profile'; end if;
  if coalesce(p.deposit_total,0) < 29 then raise exception 'Account not active'; end if;

  select count(*) into views_today from views where user_id = auth.uid() and created_at::date = today;
  if views_today >= 5 then raise exception 'Daily views limit reached'; end if;

  insert into views(user_id, video_id) values (auth.uid(), coalesce(p_video_id,'video'));
  update profiles set balance = coalesce(balance,0) + coalesce(p.per_view,0.02) where id = auth.uid();
end $$;

-- Dashboard aggregates
create or replace function get_dashboard()
returns table(balance numeric, views int, refs int, lvl int, rate numeric, cap numeric, base_cap numeric, next_target text, per_view numeric, progress text, views_left_today int, is_active bool) 
language sql security definer as $$
  with v as (
    select count(*) c from views where user_id = auth.uid() and created_at::date = current_date
  ), r as (
    select count(*) c from referrals_active where parent_id = auth.uid()
  ), p as (
    select * from profiles where id = auth.uid()
  )
  select p.balance, (select c from v), (select c from r), p.lvl, p.rate, p.cap, p.base_cap,
         '—'::text as next_target, p.per_view,
         '...'::text as progress,
         greatest(0, 5 - coalesce((select c from v),0)) as views_left_today,
         coalesce(p.deposit_total,0) >= 29 as is_active
  from p;
$$;


-- === Referral income aggregates (per user) ===
create or replace function get_referral_income()
returns table(gen1_income numeric, gen2_income numeric, gen3_income numeric, total_ref_income numeric)
language sql security definer as $$
  with s as (
    select
      sum(case when level = 1 then amount else 0 end) as g1,
      sum(case when level = 2 then amount else 0 end) as g2,
      sum(case when level = 3 then amount else 0 end) as g3
    from referral_payouts
    where user_id = auth.uid()
  )
  select coalesce(g1,0)::numeric, coalesce(g2,0)::numeric, coalesce(g3,0)::numeric,
         (coalesce(g1,0)+coalesce(g2,0)+coalesce(g3,0))::numeric
  from s;
$$;

-- === Recent referral payouts (for the right table) ===
create or replace function get_referral_recent(p_limit int default 10)
returns table(created_at timestamptz, level int, amount numeric, video_id text)
language sql security definer as $$
  select created_at, level, amount, coalesce(from_user::text,'—') as video_id
  from referral_payouts
  where user_id = auth.uid()
  order by created_at desc
  limit coalesce(p_limit, 10);
$$;

-- === Referral tree up to 3 generations (active only) ===
create or replace function get_referral_tree()
returns table(gen int, user_id uuid, email text, level int, created_at timestamptz)
language sql security definer as $$
  with
  g1 as (
    select 1 as gen, r.child_id as user_id, r.created_at
    from referrals_active r
    where r.parent_id = auth.uid()
  ),
  g2 as (
    select 2 as gen, r.child_id as user_id, r.created_at
    from referrals_active r
    join g1 on r.parent_id = g1.user_id
  ),
  g3 as (
    select 3 as gen, r.child_id as user_id, r.created_at
    from referrals_active r
    join g2 on r.parent_id = g2.user_id
  ),
  allg as (
    select * from g1
    union all select * from g2
    union all select * from g3
  )
  select a.gen, a.user_id, u.email, coalesce(p.lvl,0) as level, a.created_at
  from allg a
  left join auth.users u on u.id = a.user_id
  left join profiles p on p.id = a.user_id
  order by a.gen, a.created_at desc;
$$;
