// assets/js/auth.js
;(function () {
  function q(id) { return document.getElementById(id); }
  function goto(url) { window.location.href = url; }

  function startAuth() {
    if (!window.sb) { console.error('Supabase client not ready'); return; }

    // ---------- handlers ----------
    async function handleLogin(e) {
      e.preventDefault();
      const email = (q('loginEmail')?.value || '').trim();
      const pass  = (q('loginPass')?.value  || '').trim();
      if (!email || !pass) { alert('Введите email и пароль'); return; }

      const { error } = await window.sb.auth.signInWithPassword({ email, password: pass });
      if (error) { alert(error.message || 'Ошибка входа'); return; }

      try { if (window.LC?.afterAuth) await window.LC.afterAuth(); } catch (_) {}
      goto('dashboard_single.html');
    }

    async function handleRegister(e) {
      e.preventDefault();
      const email = (q('regEmail')?.value || '').trim();
      const pass  = (q('regPass')?.value  || '').trim();
      const ref   = (q('refId')?.value   || '').trim();

      if (!email || !pass) { alert('Введите email и пароль'); return; }
      if (ref) { try { localStorage.setItem('lc_ref_code', ref); } catch (_) {} }

      // редирект после подтверждения email (если включено в Supabase)
      const options = { emailRedirectTo: `${location.origin}/login_single.html` };

      const { error } = await window.sb.auth.signUp({ email, password: pass, options });
      if (error) { alert(error.message || 'Ошибка регистрации'); return; }

      try { if (window.LC?.afterAuth) await window.LC.afterAuth(); } catch (_) {}
      alert('Регистрация успешна. Подтвердите email (если требуется).');
      goto('dashboard_single.html');
    }

    // ---------- wiring ----------
    document.addEventListener('DOMContentLoaded', async () => {
      const loginForm = q('loginForm');
      const regForm   = q('regForm');
      if (loginForm) loginForm.addEventListener('submit', handleLogin);
      if (regForm)   regForm.addEventListener('submit', handleRegister);

      // если уже авторизован — уводим с login/register
      try {
        const { data: { session } } = await window.sb.auth.getSession();
        const here = location.pathname.split('/').pop();
        if (session && (here === 'login_single.html' || here === 'register_single.html')) {
          goto('dashboard_single.html');
        }
      } catch (_) {}

      // резервный логаут
      ['nav-logout', 'drawerLogout'].forEach((id) => {
        const el = q(id);
        if (el) el.addEventListener('click', async (e) => {
          e.preventDefault();
          try { await window.sb.auth.signOut(); } catch (_) {}
          goto('login_single.html');
        });
      });
    });
  }

  // ждём, пока app_supabase.js создаст window.sb
  if (window.sb) startAuth();
  else document.addEventListener('sb-ready', startAuth, { once: true });
})();
