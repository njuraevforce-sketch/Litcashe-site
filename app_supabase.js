
// === Video playlist & anti-spam ===
window.LC_VIDEO = (function(){
  const state = {
    list: [
      {src: 'assets/videos/ad1.mp4', id: 'ad1'},
      {src: 'assets/videos/ad2.mp4', id: 'ad2'},
      {src: 'assets/videos/ad3.mp4', id: 'ad3'}
    ],
    idx: 0,
    playing: false,
    cooldown: false,
    awardedForCurrent: false,
    lastStartTs: 0
  };
  function current(){ return state.list[state.idx % state.list.length]; }
  function next(){ state.idx = (state.idx + 1) % state.list.length; return current(); }
  function loadInto(videoEl){
    const v = current();
    if(!videoEl) return;
    videoEl.innerHTML = '';
    const s = document.createElement('source');
    s.src = v.src; s.type = 'video/mp4';
    videoEl.appendChild(s);
    videoEl.load();
    state.awardedForCurrent = false;
  }
  function debounceStart(cb){
    const now = Date.now();
    if (state.cooldown || (now - state.lastStartTs) < 1200) { return; }
    state.lastStartTs = now;
    state.cooldown = true;
    setTimeout(()=> state.cooldown=false, 1200);
    cb && cb();
  }
  const TAB_KEY = 'lc_active_tab';
  function isOtherTabActive(){
    try{
      const stamp = localStorage.getItem(TAB_KEY);
      const mine = String(window.__lc_tab_id || (window.__lc_tab_id = Math.random().toString(36).slice(2)));
      localStorage.setItem(TAB_KEY, mine + ':' + Date.now());
      const cur = localStorage.getItem(TAB_KEY)||'';
      const curId = cur.split(':')[0];
      return (curId && curId !== mine);
    }catch(_){ return false; }
  }
  return { state, current, next, loadInto, debounceStart, isOtherTabActive };
})();


(function(){
  const sb = window._supabase;
  if(!sb){ return; }

  // Auth guard for protected pages
  (async function(){
    const protected = ['dashboard_single.html','deposit_single.html','withdraw_single.html','settings_single.html'];
    const pub = ['index.html','login_single.html','register_single.html','faq_single.html'];
    const path = location.pathname.split('/').pop() || '';
    try{
      const { data } = await sb.auth.getUser();
      const isAuth = !!(data && data.user);
      if (protected.includes(path) && !isAuth) {
        location.href = 'login_single.html';
      }
      if ((path==='login_single.html' || path==='register_single.html' || path==='index.html') && isAuth) {
        // If already logged in, send to dashboard
        // Avoid redirect loop on dashboard
        location.href = 'dashboard_single.html';
      }
    }catch(_){}
  })();


  const $  = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  const setText = (sel, val)=> $$(sel).forEach(el=> el.textContent = val);
  function levelName(n){ return ['Гость','Starter','Advanced','Pro Elite','Titanium'][n||0] || 'Гость'; }

  // ---------------- AUTH ----------------
  async function registerUser({email, phone, password, ref}){
  // Email+Phone+Password signup (no confirmations expected; disable in Supabase settings)
  const payload = { password };
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  const { data, error } = await sb.auth.signUp(payload);
  if (error) throw error;
  // Optional: store phone in user metadata if provided
  if (phone) { try { await sb.auth.updateUser({ data: { phone } }); } catch(_){} }
  if (ref)  { try { await sb.rpc('set_referral_by_code', { p_ref_code: ref }); } catch(_){} }
  return data;
} = await sb.auth.signUp({
      email, password,
      options: { data: { phone }, emailRedirectTo: location.origin + '/login_single.html' }
    });
    if(error) throw error;
    try{ if(phone){ await sb.auth.updateUser({ phone }); } }catch(e){ }
    if(ref){ try{ await sb.rpc('set_referral_by_code', { p_ref_code: ref }); }catch(e){ } }
    return data;
  }

  async function loginUser({email, phone, password}){
    if (phone && password){
      const r = await sb.auth.signInWithPassword({ phone, password }); if(r.error) throw r.error; return r.data;
    } else if (email && password){
      const r = await sb.auth.signInWithPassword({ email, password }); if(r.error) throw r.error; return r.data;
    } else { throw new Error('Укажите телефон+пароль или email+пароль'); }
  }

async function logout(){
    await sb.auth.signOut();
    localStorage.removeItem('auth');
    // Redirect to the existing landing page. index_single.html does not exist in this project.
    location.href='index.html';
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const loginForm = $('#loginForm');
    if(loginForm){
      loginForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        try{
          await loginUser({ email: $('#loginEmail')?.value.trim(), phone: $('#loginPhone')?.value.trim(), password: $('#loginPass')?.value });
          localStorage.setItem('auth','1'); location.href='dashboard_single.html';
        }catch(err){ alert('Ошибка входа: '+ err.message); }
      });
    }
    const regForm = $('#regForm');
    if(regForm){
      
regForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  try{
    const email = $('#regEmail')?.value.trim();
    const phone = $('#regPhone')?.value.trim();
    const password = $('#regPass')?.value;
    const ref = $('#refId')?.value.trim();
    await registerUser({ email, phone, password, ref });
    // Auto-login using phone or email
    if (phone)      { await loginUser({ phone, password }); }
    else if (email) { await loginUser({ email, password }); }
    alert('Регистрация успешна! Добро пожаловать.');
    localStorage.setItem('auth','1');
    location.href='dashboard_single.html';
  }catch(err){ alert('Ошибка регистрации: '+ err.message); }
});
    }
    const navLogout = $('#nav-logout'); if(navLogout){ navLogout.addEventListener('click', (e)=>{ e.preventDefault(); logout(); }); }
  });

  // ---------------- DASHBOARD ----------------
  async function refreshDashboard(){
    let UI_isActive=false; let UI_viewsLeft=5;
    const { data: dash, error } = await sb.rpc('get_dashboard');
    if(error){ return; }
    const d = dash?.[0] || {};
    setText('[data-balance]', (Number(d.balance)||0).toFixed(2)+' USDT');
    setText('[data-views]', d.views ?? '0');
    setText('[data-refs]', d.refs ?? '0');
    setText('[data-level]', levelName(d.lvl)+(d.lvl?` (L${d.lvl})`:'') );
    setText('[data-rate]', (Number(d.rate)||0).toFixed(2)+'%');
    setText('[data-cap]', (Number(d.cap)||0).toFixed(2)+' USDT');
    const badge = $('#perViewBadge'); if(badge) badge.textContent = `+${(Number(d.per_view)||0).toFixed(2)} USDT за просмотр`;
    const perCell = $('#perViewCell'); if(perCell) perCell.textContent = (Number(d.per_view)||0).toFixed(2)+' USDT';
    const baseCell = $('#baseCapCell'); if(baseCell) baseCell.textContent = (Number(d.base_cap)||0).toFixed(2)+' USDT';
    const targetCell = $('#nextTargetCell'); if(targetCell) targetCell.textContent = d.next_target || '—';
    \1
    // Determine active state & views-left if back-end provides it
    UI_isActive = !!(Number(d.balance)||0) >= 29 || (d.is_active===true);
    UI_viewsLeft = typeof d.views_left_today==='number' ? d.views_left_today : (clientCanWatchToday(5) ? 5-Number(localStorage.getItem('lc_views_'+(new Date()).toISOString().slice(0,10))||'0') : 0);
    const warn = document.getElementById('notActiveWarn');
    if(warn){ warn.style.display = UI_isActive ? 'none' : 'block'; }
    const quota = document.getElementById('viewsLeftToday');
    if(quota){ quota.textContent = String(UI_viewsLeft); }
    const m = (pText.match(/(\d+)\s*\/\s*(\d+)\s*USDT/i)||[]);
    if(m.length===3){ const pct = Math.max(0, Math.min(100, (Number(m[1])/Number(m[2]))*100 )); const pf = $('#progressFill'); if(pf) pf.style.width = pct.toFixed(0)+'%'; }

    // referral totals
    try{
      const { data: ref } = await sb.rpc('get_referral_income'); const r = ref?.[0] || {};
      const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = Number(val||0).toFixed(2)+' USDT'; }
      set('gen1Cell', r.gen1_income); set('gen2Cell', r.gen2_income); set('gen3Cell', r.gen3_income); set('refTotalCell', r.total_ref_income);
      // recent
      const { data: lst } = await sb.rpc('get_referral_recent', { p_limit: 10 });
      const tbody = document.getElementById('refList');
      if(tbody){
        tbody.innerHTML='';
        if(!lst || lst.length===0){ tbody.innerHTML='<tr><td colspan="4" class="muted">Нет данных</td></tr>'; }
        else{
          lst.forEach(row=>{
            const tr=document.createElement('tr'); const dt=new Date(row.created_at);
            tr.innerHTML = `<td>${dt.toLocaleString()}</td><td>${row.gen||'-'}</td><td>${Number(row.amount||0).toFixed(2)} USDT</td><td>${row.video_id||'-'}</td>`;
            tbody.appendChild(tr);
          });
        }
      }
      // tree
      const { data: tree } = await sb.rpc('get_referral_tree');
      const tBody = document.getElementById('refTree');
      if(tBody){
        tBody.innerHTML='';
        if(!tree || tree.length===0){ tBody.innerHTML='<tr><td colspan="5" class="muted">Нет данных</td></tr>'; }
        else{
          let c1=0,c2=0,c3=0;
          tree.forEach(row=>{
            if(row.gen===1) c1++; else if(row.gen===2) c2++; else if(row.gen===3) c3++;
            const tr=document.createElement('tr'); const dt=new Date(row.created_at);
            tr.innerHTML = `<td>${row.gen}</td><td>${row.email||'-'}</td><td>${Number(row.capital||0).toFixed(2)} USDT</td><td>${levelName(row.level)}</td><td>${dt.toLocaleDateString()}</td>`;
            tBody.appendChild(tr);
          });
          const g1=document.getElementById('gen1Count'); if(g1) g1.textContent=c1;
          const g2=document.getElementById('gen2Count'); if(g2) g2.textContent=c2;
          const g3=document.getElementById('gen3Count'); if(g3) g3.textContent=c3;
        }
      }
    }catch(e){ }

    
    // ref link
    try{
      const { data: u } = await sb.auth.getUser();
      const refLink = document.getElementById('refLink');
      if(u && refLink){
        let code = '';
        try{
          const rc = await sb.from('profiles').select('ref_code').eq('id', u.user.id).single();
          code = rc?.data?.ref_code || '';
          if(!code){
            // Fallback: generate deterministic code from user UUID (first 8 chars without dashes)
            const uid = String(u.user.id).replace(/-/g,'').slice(0,8);
            const newCode = 'u' + uid;
            // Try to save it; if conflicts, ignore error
            try{ await sb.from('profiles').update({ ref_code: newCode }).eq('id', u.user.id); code = newCode; }catch(_){}
          }
        }catch(_){}
        refLink.value = `${location.origin}/register_single.html?ref=${code}`;
      }
    }catch(e){}
  }

  if (location.pathname.endsWith('dashboard_single.html')){
    document.addEventListener('DOMContentLoaded', refreshDashboard);
    const startBtn = document.getElementById('startBtn');
    const quotaEl = document.getElementById('viewsLeftToday');
    if(startBtn){
      startBtn.addEventListener('click', async ()=>{
        if(window.LC_VIDEO && LC_VIDEO.isOtherTabActive()){
          alert('Откройте только одну вкладку для просмотра.');
          return;
        }
        if(typeof UI_isActive!=='undefined' && !UI_isActive){ alert('Аккаунт не активен: пополните на 29 USDT'); return; }
        if(typeof UI_viewsLeft!=='undefined' && UI_viewsLeft<=0){ alert('Лимит просмотров на сегодня исчерпан'); return; }
        LC_VIDEO.debounceStart(async ()=>{
          const v = document.getElementById('promoVid');
          if(v){
            if(!v.querySelector('source')){ LC_VIDEO.loadInto(v); }
            else { LC_VIDEO.next(); LC_VIDEO.loadInto(v); }
            try{ await v.play(); }catch(e){}
            if(!v._lc_award_bound){
              v._lc_award_bound = true;
              v.addEventListener('ended', async ()=>{
                if(LC_VIDEO.state.awardedForCurrent) return;
                LC_VIDEO.state.awardedForCurrent = true;
                try{
                  const { error } = await sb.rpc('award_view', { p_video_id: LC_VIDEO.current().id });
                  if(error) throw error;
                  clientIncWatchToday();
                  await refreshDashboard();
                  if(window.LC_TOAST){ LC_TOAST.ok('Зачислено'); }
                }catch(e){
                  alert('Ошибка начисления: ' + (e?.message||e));
                }
              });
            }
          }
          try{
          if(!UI_isActive){ alert('Аккаунт не активен: пополните на 29 USDT'); return; }
          if(UI_viewsLeft<=0){ alert('Лимит просмотров на сегодня исчерпан'); return; }
          const v = document.getElementById('promoVid'); if(v){ try{ await v.play(); }catch(e){} }
          const { error } = await sb.rpc('award_view', { p_video_id: 'video_1' });
          if(error) throw error;
          clientIncWatchToday(); await refreshDashboard();
        }catch(e){ alert(e.message || 'Ошибка'); }
      });
    }
    const copyBtn = document.getElementById('copyRef');
    if(copyBtn){
      copyBtn.addEventListener('click', ()=>{
        const input = document.getElementById('refLink');
        input.select(); input.setSelectionRange(0, 99999);
        document.execCommand('copy');
        copyBtn.textContent = 'Скопировано!';
        setTimeout(()=> copyBtn.textContent='Скопировать', 1200);
      });
    }
  }

  // ---------------- DEPOSIT ----------------
  if (location.pathname.endsWith('deposit_single.html')){
    document.addEventListener('DOMContentLoaded', ()=>{
      const walletEl = document.getElementById('globalWallet'); if(walletEl){ walletEl.textContent='TJa8ncBTn1FtW78JqbPXR3TAUq4qHBXpcG'; }
      const depBtn = document.getElementById('depSubmit'); if(depBtn){ depBtn.addEventListener('click', async ()=>{
        const amount = Number(document.getElementById('depAmount')?.value||0);
        const txid   = document.getElementById('depTxid')?.value?.trim();
        const lang = (function(){ try{ return localStorage.getItem('litcash_lang')||'ru'; }catch(_){ return 'ru'; }})();
        if(!amount||!txid){
          return alert(lang === 'en' ? 'Enter amount and TXID' : 'Укажите сумму и TXID');
        }
        try{
          const { data: depId, error: depErr } = await sb.rpc('request_deposit', { p_amount: amount, p_txid: txid });
          if(depErr) throw depErr;
          try{
            await fetch('/api/confirm-tron', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ txid, deposit_id: depId, expected_amount: amount })
            });
          }catch(_){ /* optional, non-fatal */ }
          
          alert(lang === 'en' ? 'Request created. We will try to auto-confirm. Your balance will be credited after network confirmation.' : 'Заявка создана. Баланс пополнится после подтверждения сети.');
        }
        catch(e){ alert('Ошибка: ' + e.message); }
      }); }
    });
  }

  // ---------------- WITHDRAW ----------------
  // Adds a handler for the withdraw form on withdraw_single.html. This client‑side check ensures
  // both wallet and amount are provided before attempting to call the Supabase stored procedure.
  if (location.pathname.endsWith('withdraw_single.html')){
    document.addEventListener('DOMContentLoaded', ()=>{
      const btn = document.getElementById('withSubmit');
      if(btn){
        btn.addEventListener('click', async ()=>{
          const wallet = document.getElementById('wallet')?.value?.trim();
          const amount = Number(document.getElementById('withAmount')?.value||0);
          const lang = (function(){ try{ return localStorage.getItem('litcash_lang')||'ru'; }catch(_){ return 'ru'; }})();
          if(!wallet || !amount || amount<=0){
            return alert(lang === 'en' ? 'Enter wallet and amount' : 'Укажите кошелёк и сумму');

          }
          try{
            // Adjust the RPC name and parameters to match your Supabase implementation.
            const { data: userData } = await sb.auth.getUser();
            if(userData && userData.user){ try{ await sb.from('profiles').update({ wallet }).eq('id', userData.user.id); }catch(_){}}
            const { error } = await sb.rpc('request_withdrawal', { p_amount: amount, p_wallet: wallet });
            if(error) throw error;
            alert(lang === 'en' ? 'Withdrawal request created. Balance will decrease after confirmation.' : 'Заявка на вывод создана. Баланс уменьшится после подтверждения.');
          }catch(e){ alert((lang === 'en' ? 'Error: ' : 'Ошибка: ') + (e?.message||e)); }
        });
      }
    });
  }

})();

  // ---------------- SETTINGS (wallet save) ----------------
  if (location.pathname.endsWith('settings_single.html')){
    document.addEventListener('DOMContentLoaded', ()=>{
      const btn = document.getElementById('saveWallet');
      const input = document.getElementById('wallet');
      if(btn && input){
        btn.addEventListener('click', async ()=>{
          const wallet = input.value?.trim();
          const lang = (function(){ try{ return localStorage.getItem('litcash_lang')||'ru'; }catch(_){ return 'ru'; }})();
          if(!(wallet && wallet[0]==='T' && wallet.length>=34)){
            return alert(lang==='en' ? 'Enter valid TRC20 wallet (starts with T)' : 'Укажите корректный TRC20 кошелёк (начинается с T)');
          }
          try{
            const { data: u } = await sb.auth.getUser();
            if(!u || !u.user) throw new Error('Not authenticated');
            const { error } = await sb.from('profiles').update({ wallet }).eq('id', u.user.id);
            if(error) throw error;
            alert(lang==='en' ? 'Wallet saved' : 'Кошелёк сохранён');
          }catch(e){
            alert((lang==='en' ? 'Error: ' : 'Ошибка: ') + (e?.message||e));
          }
        });
      }
    });
  }


// ---- Client guards (UI only; server must enforce) ----
function clientCanWatchToday(maxPerDay){
  try{
    const key = 'lc_views_'+(new Date()).toISOString().slice(0,10);
    const used = Number(localStorage.getItem(key)||'0');
    return used < (maxPerDay||5);
  }catch(_){ return true; }
}
function clientIncWatchToday(){
  try{
    const key = 'lc_views_'+(new Date()).toISOString().slice(0,10);
    const used = Number(localStorage.getItem(key)||'0') + 1;
    localStorage.setItem(key, String(used));
  }catch(_){}
}
