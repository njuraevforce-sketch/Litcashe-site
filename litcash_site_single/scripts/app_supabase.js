(function(){
  if (!window.supabase) { console.error('supabase-js not loaded'); return; }

  const cfg = window.__SUPABASE__ || {};
  if (!cfg.url || !cfg.anon) {
    alert('Supabase config not loaded');
    throw new Error('No Supabase config');
  }

  const sb = window.sb = supabase.createClient(cfg.url, cfg.anon, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  // Синхронизируем localStorage только от реальной сессии
  function syncFromSession(session){
    if (session?.user) {
      localStorage.setItem('auth', 'true');
      localStorage.setItem('user', JSON.stringify(session.user));
    } else {
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
    }
  }

  // 1) При изменениях (логин/логаут/рефреш)
  sb.auth.onAuthStateChange((_ev, session) => {
    console.log('[auth]', _ev, session);
    syncFromSession(session);
  });

  // 2) При загрузке страницы
  (async () => {
    const { data: { session } } = await sb.auth.getSession();
    syncFromSession(session);
  })();

  // ========= ГАРДЫ для приватных страниц =========
  const PRIVATE = [
    'dashboard_single.html',
    'settings_single.html',
    'deposit_single.html',
    'withdraw_single.html'
    // добавь сюда все приватные страницы
  ];
  if (PRIVATE.some(p => location.pathname.endsWith(p))) {
    (async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) location.href = 'login_single.html';
    })();
  }

  // helper
  function qs(sel){ return document.querySelector(sel); }
  function getInputValue(form, placeholder){
    const el = Array.from(form.querySelectorAll('input'))
      .find(i => (i.getAttribute('placeholder')||'').trim() === placeholder);
    return el ? el.value : '';
  }

  // ===== Регистрация =====
  const reg = document.getElementById('regForm');
  if (reg) {
    reg.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = getInputValue(reg,'Email') || reg.querySelector('input[type="email"]')?.value || '';
      const pass  = getInputValue(reg,'Пароль')|| reg.querySelector('input[type="password"]')?.value || '';
      if (!email || !pass) { alert('Email и пароль обязательны'); return; }

      const { data, error } = await sb.auth.signUp({ email, password: pass });
      if (error) { alert('Ошибка регистрации: ' + error.message); return; }

      // Привязка реферала (если есть)
      try {
        const url  = new URL(location.href);
        const code = url.searchParams.get('ref') || document.getElementById('refId')?.value || '';
        if (code) await sb.rpc('set_referral_by_code', { p_ref_code: code });
      } catch(e){}

      // Если включено подтверждение email — сессии пока нет, редирект может не сработать
      const { data: { session } } = await sb.auth.getSession();
      if (session) location.href = 'dashboard_single.html';
      else alert('Аккаунт создан. Проверьте почту для подтверждения.');
    });
  }

  // ===== Вход =====
  const login = document.getElementById('loginForm');
  if (login) {
    login.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = getInputValue(login,'Email') || login.querySelector('input[type="email"]')?.value || '';
      const pass  = getInputValue(login,'Пароль')|| login.querySelector('input[type="password"]')?.value || '';
      if (!email || !pass) { alert('Email и пароль обязательны'); return; }

      const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) { alert('Ошибка входа: ' + error.message); return; }

      location.href = 'dashboard_single.html';
    });
  }

  // ===== Выход =====
  ['nav-logout', 'drawerLogout'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await sb.auth.signOut();
      alert('Вы вышли из аккаунта');
      location.href = 'login_single.html';
    });
  });

  // Остальной код (депозиты/вывод/настройки) можно оставить как есть
})();

  // Expose for console debug
  window._supabase = sb;
})();
;(function(){
  var sb = window._supabase; if(!sb) return;

  function uid(){ return (JSON.parse(localStorage.getItem("user")||"{}")).id || null; }

  // Deposit
  var depB = document.getElementById("depSubmit");
  if(depB){
    depB.addEventListener("click", async function(){
      var amtEl = document.getElementById("depAmount");
      var txEl = document.getElementById("depTxid");
      var amt = parseFloat(amtEl?.value||"0"); var tx = (txEl?.value||"").trim();
      if(!(amt>0) || !tx){ alert("Введите сумму и TXID"); return; }
      var user = uid(); if(!user){ alert("Сначала войдите"); window.location.href="login_single.html"; return; }
      const { data, error } = await sb.from("deposits").insert({ user_id: user, amount: amt, txid: tx }).select().single();
      if(error){ alert("Ошибка: "+error.message); return; }
      alert("Заявка на пополнение создана. Ожидайте подтверждения.");
      window.location.href = "dashboard_single.html";
    });
  }

  // Withdraw
  var wdB = document.getElementById("wdSubmit");
  if(wdB){
    wdB.addEventListener("click", async function(){
      var addr = (document.getElementById("wdAddress")?.value||"").trim();
      var amt = parseFloat(document.getElementById("wdAmount")?.value||"0");
      if(!addr || !(amt>=10)){ alert("Адрес обязателен, минимум 10 USDT"); return; }
      var user = uid(); if(!user){ alert("Сначала войдите"); window.location.href="login_single.html"; return; }
      const { data, error } = await sb.from("withdrawals").insert({ user_id: user, address: addr, amount: amt }).select().single();
      if(error){ alert("Ошибка: "+error.message); return; }
      alert("Заявка на вывод создана. Комиссия 1 USDT будет удержана.");
      window.location.href = "dashboard_single.html";
    });
  }

  // Settings: save wallet
  var setSave = document.getElementById("setSave");
  if(setSave){
    setSave.addEventListener("click", async function(){
      var w = (document.getElementById("setWallet")?.value||"").trim();
      if(!w){ alert("Введите TRC20-кошелек"); return; }
      var user = uid(); if(!user){ alert("Сначала войдите"); window.location.href="login_single.html"; return; }
      const { error } = await sb.from("profiles").update({ wallet_trc20: w }).eq("user_id", user);
      if(error){ alert("Ошибка: "+error.message); return; }
      alert("Кошелёк сохранён");
    });
  }

  // Settings: change password
  var setPass = document.getElementById("setPass");
  if(setPass){
    setPass.addEventListener("click", async function(){
      var a = document.getElementById("oldPass")?.value||"";
      var b = document.getElementById("newPass")?.value||"";
      var c = document.getElementById("newPass2")?.value||"";
      if(!b || b!==c){ alert("Пароли не совпадают"); return; }
      // Supabase auth v2 does not require old password for update
      const { data, error } = await sb.auth.updateUser({ password: b });
      if(error){ alert("Ошибка: "+error.message); return; }
      alert("Пароль обновлён");
    });
  }
})();
