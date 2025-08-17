// assets/js/auth.js
;(function () {
  function q(id) { return document.getElementById(id); }
  function goto(url) { window.location.href = url; }

  function startAuth() {
    if (!window.sb) { console.error('Supabase client not ready'); return; }

    // --- handlers ---
    async function handleLogin(e) {
      e.preventDefault();
      const email = (q('loginEmail')?.value || '').trim();
      const pass  = (q('loginPass')?.value  || '').trim();
      if (!email || !pass) { alert('Введите email и пароль'); return; }

      const { error } = await window.sb.auth.signInWithPassword({ email, password: pass });
      if (error) { alert(error.message || 'Ошибка входа'); return; }

      try { if (window.LC?.afterAuth) await window.LC.afterAuth(); } catch (_){}
      goto('dashboard_single.html');
    }

    async function handleRegister(e) {
      e.preventDefault();
      const email = (q('regEmail')?.value || '').trim();
      const pass  = (q('regPass')?.value  || '').trim();
      const ref   = (q('refId')?.value   || '').trim();
      if (!email || !pass) { alert('Введите email и пароль'); return; }
      if (ref) { try { localStorage.setItem('lc_ref_code', ref); } catch(_){} }

      const { error } = await window.sb.auth.signUp({
        email,
        password: pass,
        options: { emailRedirectTo: location.origin + '/login_single.html' }
      });
      if (error) { alert(error.message || 'Ошибка регистрации'); return; }

      try { if (window.LC?.afterAuth) await window.LC.afterAuth(); } catch (_){}
      alert('Регистрация успешна.');
      goto('dashboard_single.html');
    }

    // --- wiring ---
    document.addEventListener('DOMContentLoaded', async function () {
      const loginForm = q('loginForm');
      const regForm   = q('regForm');
      if (loginForm) loginForm.addEventListener('submit', handleLogin);
      if (regForm)   regForm.addEventListener('submit', handleRegister);

      // редиректим ТОЛЬКО со страницы логина, если уже есть сессия
      try {
        const { data: { session } } = await window.sb.auth.getSession();
        const here = location.pathname.split('/').pop();

        if (session && here === 'login_single.html') {
          goto('dashboard_single.html');
          return;
        }

        // на странице регистрации не редиректим
        // если хочешь — можно разлогинить автоматически:
        // if (session && here === 'register_single.html') await window.sb.auth.signOut();
      } catch (_){}

      // резервный логаут
      ['nav-logout','drawerLogout'].forEach((id) => {
        const el = q(id);
        if (el) el.addEventListener('click', async (e) => {
          e.preventDefault();
          try { await window.sb.auth.signOut(); } catch(_){}
          goto('login_single.html');
        });
      });
    });
  }

  // ждём готовности клиента из app_supabase.js
  if (window.sb) startAuth();
  else document.addEventListener('sb-ready', startAuth, { once: true });
})();
