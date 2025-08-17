// app_supabase.js (autowired)
;(function () {
  // 0) Проверка конфига и наличие supabase-js
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('Supabase config missing'); return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.warn('supabase global not found. Make sure <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> is included.');
  }

  // 1) Клиент
  window.sb = window.supabase
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

  // событие «клиент готов» для скриптов, которые ждут его
  if (window.sb) { document.dispatchEvent(new Event('sb-ready')); }

  // 2) Хелпер для serverless-функций
  async function getSession() {
    if (!window.sb) return { session: null };
    const { data: { session } } = await window.sb.auth.getSession();
    return { session };
  }

  // 3) Глобальный LC
  window.LC = {
    // вызываем после успешной аутентификации
    async afterAuth() {
      await this.ensureProfile();       // гарантируем, что есть строка в profiles
      await this.applyReferral();       // применяем реферальный код, если есть
      await this.refreshBalance();      // обновляем баланс, если есть таблица wallets
      await this.mountReferral();       // показываем реф-ссылку, если есть
    },

    // создаёт профайл, если его ещё нет (разрешено политикой profiles_insert_own)
    async ensureProfile() {
      try {
        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) return;

        const { data, error } = await window.sb
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) return; // профиль уже есть

        const { error: insErr } = await window.sb
          .from('profiles')
          .insert({ id: user.id });

        if (insErr) console.error('insert profile error', insErr);
      } catch (e) {
        console.error('ensureProfile error', e);
      }
    },

    // применяем реферальный код из URL/localStorage
    async applyReferral() {
      try {
        const urlParams = new URLSearchParams(location.search);
        const refParam = urlParams.get('ref') || localStorage.getItem('lc_ref_code');
        if (!refParam) return;

        localStorage.setItem('lc_ref_code', refParam);

        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) return;

        // если уже установлен — выходим
        const { data: prof, error: e1 } = await window.sb
          .from('profiles')
          .select('referred_by')
          .eq('id', user.id)
          .maybeSingle();
        if (e1 || (prof && prof.referred_by)) return;

        // находим владельца кода и проставляем ссылку
        const { data: refOwner, error: e2 } = await window.sb
          .from('profiles')
          .select('id')
          .eq('ref_code', refParam)
          .maybeSingle();
        if (e2 || !refOwner || refOwner.id === user.id) return;

        await window.sb
          .from('profiles')
          .update({ referred_by: refOwner.id })
          .eq('id', user.id);
      } catch (e) {
        console.error(e);
      }
    },

    // учёт просмотра видео (по достижении N сек)
    async setupVideoTracking() {
      try {
        const videos = Array.from(document.querySelectorAll('video[data-video-id]'));
        for (const v of videos) {
          let credited = false;
          let watched = 0;
          const required = 30; // секунд
          v.addEventListener('timeupdate', async () => {
            if (v.seeking || v.paused) return;
            watched = Math.floor(v.currentTime);
            if (!credited && watched >= required) {
              credited = true;
              const vid = v.getAttribute('data-video-id') || 'video';
              try { await window.LC.creditView(vid, watched); } catch (e) { console.error(e); }
            }
          });
        }
      } catch (e) { console.error(e); }
    },

    // обновление баланса (если таблица wallets присутствует)
    async refreshBalance() {
      try {
        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) return;
        const { data, error } = await window.sb
          .from('wallets')
          .select('balance_cents')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!error && data) {
          const el = document.querySelector('[data-balance]');
          if (el) el.textContent = (data.balance_cents / 100).toFixed(2) + ' $';
        }
      } catch (e) { console.error(e); }
    },

    // начисление за просмотр с функцией
    async creditView(videoId, watchedSeconds) {
      const { session } = await getSession();
      if (!session) { alert('Войдите в аккаунт'); return; }
      const base = window.SUPABASE_URL.replace('.co', '.co/functions/v1');
      const res = await fetch(`${base}/credit-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ video_id: videoId, watched_seconds: watchedSeconds })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Ошибка начисления'); return; }
      await window.LC.refreshBalance();
      return data;
    },

    // запрос на вывод
    async requestWithdrawal(amountCents, method, address) {
      const { session } = await getSession();
      if (!session) { alert('Войдите в аккаунт'); return; }
      const base = window.SUPABASE_URL.replace('.co', '.co/functions/v1');
      const res = await fetch(`${base}/request-withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ amount_cents: amountCents, method, address })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Ошибка запроса вывода'); return; }
      await window.LC.refreshBalance();
      alert('Заявка на вывод создана: pending');
      return data;
    },

    // отображение личной реф-ссылки
    async mountReferral() {
      try {
        const wrap = document.getElementById('refLinkWrap');
        const input = document.getElementById('refLink');
        if (!wrap || !input) return;

        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) return;

        const { data, error } = await window.sb
          .from('profiles')
          .select('ref_code')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data?.ref_code) {
          const url = new URL(location.origin + '/register_single.html');
          url.searchParams.set('ref', data.ref_code);
          input.value = url.toString();
          wrap.style.display = 'block';
        }
      } catch (e) { console.error(e); }
    },

    async logout() {
      if (!window.sb) return;
      await window.sb.auth.signOut();
      location.href = '/';
    }
  };

  // ----- Auth UI (nav) -----
  function renderAuthUI(session) {
    const cta = document.querySelector('.nav-cta');
    const drawerCta = document.getElementById('lc-drawer-cta');
    if (!cta) return;

    if (session) {
      cta.innerHTML = `
        <a class="btn ghost" href="dashboard_single.html" id="nav-dashboard">Кабинет</a>
        <a class="btn" href="#" id="nav-logout">Выход</a>
      `;
    } else {
      cta.innerHTML = `
        <a class="btn ghost" href="login_single.html">Вход</a>
        <a class="btn primary" href="register_single.html">Регистрация</a>
      `;
    }

    if (drawerCta) {
      drawerCta.innerHTML = cta.innerHTML.replace('id="nav-logout"', 'id="drawerLogout"');
    }

    const logout1 = document.getElementById('nav-logout');
    const logout2 = document.getElementById('drawerLogout');
    [logout1, logout2].forEach(el => {
      if (el) el.addEventListener('click', async (e) => {
        e.preventDefault();
        try { await window.LC.logout(); } catch (_) {}
      });
    });
  }
  // --------------------------

  // 4) Автоподключение кнопок/форм (если есть на странице)
  document.addEventListener('DOMContentLoaded', async () => {
    window.LC.setupVideoTracking();

    // нарисовать правильные кнопки в шапке и подписаться на изменения сессии
    try {
      const { data: { session } } = await window.sb.auth.getSession();
      renderAuthUI(session);
      window.sb.auth.onAuthStateChange((_evt, sess) => renderAuthUI(sess));
    } catch (_) {}

    const btnCredit = document.getElementById('btnCreditView');
    if (btnCredit) {
      btnCredit.addEventListener('click', async () => {
        const vid = btnCredit.getAttribute('data-video-id') || 'video1';
        await window.LC.creditView(vid, 35);
      });
    }

    const wForm = document.getElementById('withdrawForm');
    if (wForm) {
      wForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('amount').value || '0');
        const method = document.getElementById('method').value || 'tron';
        const address = document.getElementById('address').value || '';
        await window.LC.requestWithdrawal(Math.round(amount * 100), method, address);
      });
    }

    window.LC.refreshBalance();
    window.LC.mountReferral();
  });
})();
