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

  // 2) Хелпер (оставлен)
  async function getSession() {
    if (!window.sb) return { session: null };
    const { data: { session } } = await window.sb.auth.getSession();
    return { session };
  }

  // 3) Глобальный LC
  window.LC = {
    async afterAuth() {
      await this.ensureProfile();
      await this.applyReferral();
      await this.refreshBalance();
      await this.refreshLevelInfo?.();
      await this.mountReferral();
    },

    async ensureProfile() {
      try {
        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) return;
        const { data, error } = await window.sb
          .from('profiles').select('id').eq('id', user.id).maybeSingle();
        if (!error && data) return;
        const { error: insErr } = await window.sb.from('profiles').insert({ id: user.id });
        if (insErr) console.error('insert profile error', insErr);
      } catch (e) { console.error('ensureProfile error', e); }
    },

    async applyReferral() {
      try {
        const urlParams = new URLSearchParams(location.search);
        const refParam = urlParams.get('ref') || localStorage.getItem('lc_ref_code');
        if (!refParam) return;
        localStorage.setItem('lc_ref_code', refParam);
        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) return;

        const { data: prof, error: e1 } = await window.sb
          .from('profiles').select('referred_by').eq('id', user.id).maybeSingle();
        if (e1 || (prof && prof.referred_by)) return;

        const { data: refOwner, error: e2 } = await window.sb
          .from('profiles').select('id').eq('ref_code', refParam).maybeSingle();
        if (e2 || !refOwner || refOwner.id === user.id) return;

        await window.sb.from('profiles')
          .update({ referred_by: refOwner.id })
          .eq('id', user.id);
      } catch (e) { console.error(e); }
    },

    async setupVideoTracking() {
      try {
        const videos = Array.from(document.querySelectorAll('video[data-video-id]'));
        for (const v of videos) {
          let credited = false;
          let watched = 0;
          const required = 30;
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

async function refreshBalance() {
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

      // 29,2 / 1 234,56 — RU формат, без принудительных двух знаков
      const fmtRU = (cents) =>
        ((cents ?? 0) / 100).toLocaleString('ru-RU', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });

      if (el) el.textContent = fmtRU(data.balance_cents); // без «$», только число с запятой
    }
  } catch (e) {
    console.error('refreshBalance error:', e);
  }
}
    // ====== Просмотры
    async creditView(videoId, watchedSeconds) {
      const { data: { user } } = await window.sb.auth.getUser();
      if (!user) { alert('Войдите в аккаунт'); return; }
      const { data, error } = await window.sb.rpc('credit_view', {
        p_video_id: String(videoId || 'video'),
        p_watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
      });
      if (error) { console.error(error); alert(error.message || 'Ошибка начисления'); return; }
      if (!data?.ok) { alert(data?.message || 'Начисление отклонено'); return; }
      await window.LC.refreshBalance();
      await window.LC.refreshLevelInfo?.();
      return data;
    },

    // ====== Вывод (RPC)
    async requestWithdrawal(amountCents, method, address) {
      try {
        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) { alert('Войдите в аккаунт'); return; }

        const network = method || 'TRC20';
        const { data, error } = await window.sb.rpc('request_withdrawal', {
          p_amount_cents: Math.max(0, Math.floor(amountCents || 0)),
          p_network: network,
          p_address: String(address || ''),
          p_currency: 'USDT'
        });
        if (error) { console.error(error); alert(error.message || 'Ошибка запроса вывода'); return; }

        const row = Array.isArray(data) ? data[0] : data;
        if (!row?.ok) { alert(row?.reason || 'Заявка отклонена'); return; }

        await window.LC.refreshBalance();
        alert('Заявка на вывод создана: pending');
        return row;
      } catch (e) { console.error(e); alert('Ошибка запроса вывода'); }
    },

    // ====== Депозит (RPC)
    async createDeposit(amountCents, network = 'TRC20', currency = 'USDT', address = '') {
      try {
        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) { alert('Войдите в аккаунт'); return; }

        const { data, error } = await window.sb.rpc('create_deposit', {
          p_amount_cents: Math.max(0, Math.floor(amountCents || 0)),
          p_network: String(network || 'TRC20'),
          p_currency: String(currency || 'USDT'),
          p_address: String(address || '')
        });

        if (error) { console.error(error); alert(error.message || 'Ошибка создания заявки'); return; }

        const rec = Array.isArray(data) ? data[0] : data;
        // ожидаемые поля: id, address, amount_cents, currency, network, status
        if (rec?.address) {
          const addrEl = document.getElementById('depositAddress');
          if (addrEl) addrEl.textContent = rec.address;
        }
        if (rec?.id) {
          const idEl = document.getElementById('createdDepositId');
          if (idEl) idEl.textContent = rec.id;
        }
        window.LC_TOAST?.ok('Заявка на пополнение создана');
        return rec;
      } catch (e) { console.error(e); alert('Ошибка создания заявки'); }
    },

    async attachTxToDeposit(depositId, txHash) {
      try {
        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) { alert('Войдите в аккаунт'); return; }

        // Имена параметров предположительные: p_deposit_id, p_tx_hash
        const { data, error } = await window.sb.rpc('attach_tx_to_deposit', {
          p_deposit_id: String(depositId),
          p_tx_hash: String(txHash)
        });

        if (error) { console.error(error); alert(error.message || 'Ошибка сохранения TX'); return; }
        const row = Array.isArray(data) ? data[0] : data;
        window.LC_TOAST?.ok('TX сохранён. Ожидайте подтверждение.');
        return row;
      } catch (e) { console.error(e); alert('Ошибка сохранения TX'); }
    },

    async mountReferral() {
      try {
        const wrap = document.getElementById('refLinkWrap');
        const input = document.getElementById('refLink');
        if (!wrap || !input) return;

        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) return;

        const { data, error } = await window.sb
          .from('profiles').select('ref_code').eq('id', user.id).maybeSingle();

        if (!error && data?.ref_code) {
          const url = new URL(location.origin + '/register_single.html');
          url.searchParams.set('ref', data.ref_code);
          input.value = url.toString();
          wrap.style.display = 'block';
        }
      } catch (e) { console.error(e); }
    },

    async refreshLevelInfo() {
      try {
        const { data, error } = await window.sb.rpc('get_level_info');
        if (error || !Array.isArray(data) || !data.length) return;

        const info = data[0];
        const setTxt = (sel, val) => { const el = document.querySelector(sel); if (el != null) el.textContent = String(val); };

        setTxt('[data-level-name]', info.level_name ?? '');
        setTxt('[data-views-left]', info.views_left_today ?? 0);

        const perView = (info.reward_per_view_cents ?? 0) / 100;
        const daily   = (info.daily_reward_cents ?? 0) / 100;

        setTxt('[data-reward-per-view]', perView.toFixed(2) + ' USDT');
        setTxt('[data-daily-reward]', daily.toFixed(2) + ' USDT');
      } catch (e) { console.error(e); }
    },

    async logout() { if (!window.sb) return; await window.sb.auth.signOut(); location.href = '/'; }
  };

  // ----- Auth UI (nav)
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

  // 4) Автоподключение кнопок/форм
  document.addEventListener('DOMContentLoaded', async () => {
    window.LC.setupVideoTracking();

    try {
      const { data: { session } } = await window.sb.auth.getSession();
      renderAuthUI(session);
      window.sb.auth.onAuthStateChange((_evt, sess) => renderAuthUI(sess));
    } catch (_) {}

    // Кнопка тестового начисления
    const btnCredit = document.getElementById('btnCreditView');
    if (btnCredit) {
      btnCredit.addEventListener('click', async () => {
        const vid = btnCredit.getAttribute('data-video-id') || 'video1';
        await window.LC.creditView(vid, 35);
      });
    }

    // Форма вывода
    const wForm = document.getElementById('withdrawForm');
    if (wForm) {
      wForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount  = parseFloat(document.getElementById('amount')?.value || '0');
        const method  = document.getElementById('method')?.value || 'TRC20';
        const address = document.getElementById('address')?.value || '';
        await window.LC.requestWithdrawal(Math.round(amount * 100), method, address);
      });
    }

    // Форма депозита (мягкая автоподвязка)
    const dForm = document.getElementById('depositForm');
    if (dForm) {
      dForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const get = (id, def='') => document.getElementById(id)?.value || def;
        const amount   = parseFloat(get('dAmount', '0'));
        const network  = get('dNetwork', 'TRC20');
        const currency = get('dCurrency', 'USDT');
        const addr     = get('dAddress', '');
        const rec = await window.LC.createDeposit(Math.round(amount * 100), network, currency, addr);
        if (rec?.address) {
          const a = document.getElementById('depositAddress');
          if (a) a.textContent = rec.address;
        }
      });
    }

    // Форма привязки TX
    const tForm = document.getElementById('attachTxForm');
    if (tForm) {
      tForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const depId = document.getElementById('depositId')?.value || '';
        const tx    = document.getElementById('txHash')?.value || '';
        if (!depId || !tx) { alert('Укажите ID депозита и TX hash'); return; }
        await window.LC.attachTxToDeposit(depId, tx);
      });
    }

    // первичное наполнение UI
    window.LC.refreshBalance();
    window.LC.refreshLevelInfo?.();
    window.LC.mountReferral();
  });
})();
