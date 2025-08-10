(function(){
  if (!window.supabase) { console.error('supabase-js not loaded'); return; }

  const cfg = window.__SUPABASE__ || {};
  if (!cfg.url || !cfg.anon) {
    alert('Supabase config not loaded');
    throw new Error('No Supabase config');
  }

  const sb = supabase.createClient(cfg.url, cfg.anon, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  // доступно в консоли
  window.sb = sb;
  window._supabase = sb;

  // ---------------- auth state ----------------
  function syncFromSession(session){
    if (session?.user) {
      localStorage.setItem('auth', 'true');
      localStorage.setItem('user', JSON.stringify(session.user));
    } else {
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
    }
  }

  sb.auth.onAuthStateChange((_ev, session) => {
    console.log('[auth]', _ev, session);
    syncFromSession(session);
  });

  (async () => {
    const { data: { session } } = await sb.auth.getSession();
    syncFromSession(session);
  })();

  // ---------------- guards ----------------
  const PRIVATE = [
    'dashboard_single.html',
    'settings_single.html',
    'deposit_single.html',
    'withdraw_single.html'
  ];
  if (PRIVATE.some(p => location.pathname.endsWith(p))) {
    (async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) location.href = 'login_single.html';
    })();
  }

  // ---------------- helpers ----------------
  function getInputValue(form, placeholder){
    const el = Array.from(form.querySelectorAll('input'))
      .find(i => (i.getAttribute('placeholder')||'').trim() === placeholder);
    return el ? el.value : '';
  }
  async function getUid(){
    const { data: { user } } = await sb.auth.getUser();
    return user?.id || null;
  }

  // ---------------- register ----------------
const reg = document.getElementById("regForm");
if (reg) {
  reg.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = getInputValue(reg, "Email") || reg.querySelector('input[type="email"]')?.value || "";
    const pass  = getInputValue(reg, "Пароль")|| reg.querySelector('input[type="password"]')?.value || "";
    if (!email || !pass) { alert("Email и пароль обязательны"); return; }

    try {
      // 1) создаём пользователя на сервере (без писем)
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const payload = await res.json();

      if (!res.ok || payload?.error) {
        alert("Ошибка регистрации: " + (payload?.error || res.status));
        return;
      }

      // 2) сразу логинимся обычным способом
      const { error: loginErr } = await sb.auth.signInWithPassword({ email, password: pass });
      if (loginErr) {
        alert("Пользователь создан, но вход не удался: " + loginErr.message);
        return;
      }

      alert("Аккаунт создан и вход выполнен");
      window.location.href = "dashboard_single.html";
    } catch (err) {
      alert("Ошибка регистрации: " + String(err));
    }
  });
}

  // ---------------- login ----------------
  const login = document.getElementById('loginForm');
  if (login) {
    login.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = getInputValue(login,'Email') || login.querySelector('input[type="email"]')?.value || '';
      const pass  = getInputValue(login,'Пароль')|| login.querySelector('input[type="password"]')?.value || '';
      if (!email || !pass) { alert('Email и пароль обязательны'); return; }

      const { error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) { alert('Ошибка входа: ' + error.message); return; }

      location.href = 'dashboard_single.html';
    });
  }

  // ---------------- logout ----------------
  ['nav-logout', 'drawerLogout'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await sb.auth.signOut();
      alert('Вы вышли из аккаунта');
      location.href = 'login_single.html';
    });
  });

  // ---------------- deposit ----------------
  const depB = document.getElementById('depSubmit');
  if (depB) {
    depB.addEventListener('click', async () => {
      const amt = parseFloat(document.getElementById('depAmount')?.value||'0');
      const tx  = (document.getElementById('depTxid')?.value||'').trim();
      if (!(amt>0) || !tx) { alert('Введите сумму и TXID'); return; }
      const user = await getUid(); if (!user) { alert('Сначала войдите'); location.href='login_single.html'; return; }
      const { error } = await sb.from('deposits').insert({ user_id: user, amount: amt, txid: tx });
      if (error) { alert('Ошибка: ' + error.message); return; }
      alert('Заявка на пополнение создана. Ожидайте подтверждения.');
      location.href = 'dashboard_single.html';
    });
  }

  // ---------------- withdraw ----------------
  const wdB = document.getElementById('wdSubmit');
  if (wdB) {
    wdB.addEventListener('click', async () => {
      const addr = (document.getElementById('wdAddress')?.value||'').trim();
      const amt  = parseFloat(document.getElementById('wdAmount')?.value||'0');
      if (!addr || !(amt>=10)) { alert('Адрес обязателен, минимум 10 USDT'); return; }
      const user = await getUid(); if (!user) { alert('Сначала войдите'); location.href='login_single.html'; return; }
      const { error } = await sb.from('withdrawals').insert({ user_id: user, address: addr, amount: amt });
      if (error) { alert('Ошибка: ' + error.message); return; }
      alert('Заявка на вывод создана. Комиссия 1 USDT будет удержана.');
      location.href = 'dashboard_single.html';
    });
  }

  // ---------------- settings: wallet ----------------
  const setSave = document.getElementById('setSave');
  if (setSave) {
    setSave.addEventListener('click', async () => {
      const w = (document.getElementById('setWallet')?.value||'').trim();
      if (!w) { alert('Введите TRC20-кошелек'); return; }
      const user = await getUid(); if (!user) { alert('Сначала войдите'); location.href='login_single.html'; return; }
      const { error } = await sb.from('profiles').update({ wallet_trc20: w }).eq('user_id', user);
      if (error) { alert('Ошибка: ' + error.message); return; }
      alert('Кошелёк сохранён');
    });
  }

  // ---------------- settings: password ----------------
  const setPass = document.getElementById('setPass');
  if (setPass) {
    setPass.addEventListener('click', async () => {
      const b = document.getElementById('newPass')?.value||'';
      const c = document.getElementById('newPass2')?.value||'';
      if (!b || b!==c) { alert('Пароли не совпадают'); return; }
      const { error } = await sb.auth.updateUser({ password: b });
      if (error) { alert('Ошибка: ' + error.message); return; }
      alert('Пароль обновлён');
    });
  }
})();
