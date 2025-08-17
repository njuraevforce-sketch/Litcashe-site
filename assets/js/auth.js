;(function(){

  function q(id){ return document.getElementById(id); }
  function goto(url){ window.location.href = url; }

  function startAuth(){
    if (!window.sb) { console.error('Supabase client not ready'); return; }
    // весь твой остальной код остаётся тут
    // handleLogin, handleRegister и т.д.
  }

  if (window.sb) startAuth();
  else document.addEventListener('sb-ready', startAuth, { once: true });
})();
  async function handleLogin(e){
    e.preventDefault();
    const email = (q('loginEmail')?.value || '').trim();
    const pass  = (q('loginPass')?.value  || '').trim();
    if(!email || !pass){ alert('Введите email и пароль'); return; }
    const { data, error } = await window.sb.auth.signInWithPassword({ email, password: pass });
    if(error){ alert(error.message || 'Ошибка входа'); return; }
    try { if (window.LC && window.LC.afterAuth) await window.LC.afterAuth(); } catch(_){}
    goto('dashboard_single.html');
  }

  async function handleRegister(e){
    e.preventDefault();
    const email = (q('regEmail')?.value || '').trim();
    const pass  = (q('regPass')?.value  || '').trim();
    const ref   = (q('refId')?.value   || '').trim();
    if(!email || !pass){ alert('Введите email и пароль'); return; }
    if (ref) { try { localStorage.setItem('lc_ref_code', ref); } catch(_){ } }
    const { data, error } = await window.sb.auth.signUp({ email, password: pass });
    if(error){ alert(error.message || 'Ошибка регистрации'); return; }
    try { if (window.LC && window.LC.afterAuth) await window.LC.afterAuth(); } catch(_){}
    alert('Регистрация успешна. Подтвердите email (если требуется)');
    goto('dashboard_single.html');
  }

  document.addEventListener('DOMContentLoaded', async function(){
    const loginForm = q('loginForm');
    const regForm   = q('regForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (regForm)   regForm.addEventListener('submit', handleRegister);

    // если уже авторизован — уводим с login/register
    const { data: { session } } = await window.sb.auth.getSession();
    const here = location.pathname.split('/').pop();
    if (session && (here === 'login_single.html' || here === 'register_single.html')) {
      goto('dashboard_single.html');
    }

    // резервный обработчик логаута
    ['nav-logout','drawerLogout'].forEach(function(id){
      const el = q(id);
      if (el) el.addEventListener('click', async function(e){
        e.preventDefault();
        await window.sb.auth.signOut();
        goto('login_single.html');
      });
    });
  });
})();
