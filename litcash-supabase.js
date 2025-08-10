// litcash-supabase.js — drop-in integration (keeps your design)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient("https://einpfuegfsilnoiareco.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbnBmdWVnZnNpbG5vaWFyZWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjM3NzAsImV4cCI6MjA2OTk5OTc3MH0.6wF-8yaV38LrXH6Ptm3KIO34wRklJKbNCVoqIGNKh_w", {
  auth: { persistSession: true, autoRefreshToken: true }
});
window.sb = sb;

const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const ready = (fn)=> (document.readyState!=='loading'? fn(): document.addEventListener('DOMContentLoaded', fn));

function hideAuthLinks() {
  const isIndex = /(^|\/)(index.*\.html?)$/i.test(location.pathname) || location.pathname==='/' || location.pathname==='';
  if (!isIndex) $$('a[href*="login"], a[href*="register"]').forEach(a=>a.style.display='none');
}

function attachAuth() {
  const lf = $('#loginForm') || $('#lcLoginForm');
  if (lf) lf.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = (lf.querySelector('[name=email]')||{}).value || (lf.querySelector('#email')||{}).value;
    const password = (lf.querySelector('[name=password]')||{}).value || (lf.querySelector('#password')||{}).value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else location.href='dashboard_supabase.html';
  });

  const rf = $('#registerForm') || $('#lcRegisterForm');
  if (rf) rf.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = (rf.querySelector('[name=email]')||{}).value || (rf.querySelector('#email')||{}).value;
    const password = (rf.querySelector('[name=password]')||{}).value || (rf.querySelector('#password')||{}).value;
    const ref = new URLSearchParams(location.search).get('ref');
    const { error } = await sb.auth.signUp({ email, password, options: { data: ref ? { referred_by: ref } : {} } });
    if (error) alert(error.message); else location.href='login_supabase.html';
  });

  $('#logoutBtn')?.addEventListener('click', async ()=>{ await sb.auth.signOut(); location.href='index.html'; });
}

async function fillDashboard() {
  const { data: { user } } = await sb.auth.getUser(); if (!user) return;

  const prof = await sb.from('profiles').select('is_active, level, level_rate, level_cap, referrals_count').eq('user_id', user.id).maybeSingle();
  const views = await sb.from('video_views').select('id', { count:'exact', head:true }).eq('user_id', user.id);
  const earn  = await sb.from('earnings').select('amount').eq('user_id', user.id);

  const p = prof.data || {};
  const vcount = views.count || 0;
  const balance = (earn.data||[]).reduce((s,r)=> s + Number(r.amount||0), 0);

  const set = (sel, val)=> { const el = document.querySelector(sel); if (el) el.textContent = val; };
  set('[data-balance]', balance.toFixed(2) + ' USDT');
  set('[data-views]', vcount);
  set('[data-level]', p.level ?? '—');
  set('[data-rate]',  p.level_rate!=null ? (Number(p.level_rate).toFixed(2)+'%') : '—');
  set('[data-cap]',   p.level_cap!=null ? (Number(p.level_cap).toFixed(2)+' USDT') : '—');
  set('[data-refs]',  p.referrals_count ?? '0');
  set('[data-status]', p.is_active ? 'Активен' : 'Не активен');

  const progFill = $('#progressFill');
  const progText = $('#progressText');
  if (progFill) progFill.style.width = Math.round((vcount%5)/5*100)+'%';
  if (progText) progText.textContent = `Прогресс до 1%: ${vcount%5}/5`;
}

function findStart(){
  return $('#startBtn') || $('#start') || $('[data-action="start"]') ||
         $$('button,a').find(b=>/\b(старт|start)\b/i.test(b.textContent||''));
}

function bindStart(){
  const btn = findStart(); if (!btn) return;
  btn.addEventListener('click', async (e)=>{
    e.preventDefault(); btn.disabled = true;
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { alert('Нужно войти'); location.href='login_supabase.html'; return; }
      await sb.rpc('compute_level', { uid: user.id });
      const r = await sb.rpc('award_view');
      if (r.error) throw r.error;
      const amount = Array.isArray(r.data) ? (r.data[0]?.amount ?? 0) : (r.data?.amount ?? 0);
      if (amount!=null) alert(`+${Number(amount).toFixed(2)} USDT`);
      await fillDashboard();
    } catch(e) { alert(e.message||String(e)); } finally { btn.disabled = false; }
  });
}

ready(()=>{ hideAuthLinks(); attachAuth(); bindStart(); fillDashboard(); });
