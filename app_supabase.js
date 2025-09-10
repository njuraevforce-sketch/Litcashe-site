// app_supabase.js (autowired, cleaned)
;(function () {
  // 0) Проверка конфига и наличие supabase-js
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('[LC] Supabase config missing (SUPABASE_URL/ANON_KEY).');
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[LC] supabase-js global not found. Include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    return;
  }

  // 1) Клиент (создаём один раз, экспортим глобально)
  window.sb = window.sb || window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );
  window.supabaseClient = window.sb;
  document.dispatchEvent(new Event('sb-ready'));

  // --- утилиты
  const $ = (sel) => document.querySelector(sel);
  const fmtMoney = (v) => `$${Number(v || 0).toFixed(2)}`;
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso || ''; } };

  async function getUser() {
    const { data, error } = await window.sb.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  // 3) Глобальный LC
  window.LC = {
    async afterAuth() {
      await this.ensureProfile();
      await this.applyReferral();
      await this.refreshBalance();
      await this.refreshLevelInfo?.();
      await this.mountReferral();
      await this.loadReferralWidgets();
    },

    async ensureProfile() {
      try {
        const user = await getUser(); if (!user) return;
        const { data, error } = await window.sb
          .from('profiles').select('id').eq('id', user.id).maybeSingle();
        if (!error && data) return;
        const { error: insErr } = await window.sb.from('profiles').insert({ id: user.id });
        if (insErr) console.warn('[LC] insert profile error', insErr.message || insErr);
      } catch (e) { console.warn('[LC] ensureProfile error', e?.message || e); }
    },

    async applyReferral() {
      try {
        const params = new URLSearchParams(location.search);
        const refParam = params.get('ref') || localStorage.getItem('lc_ref_code');
        if (!refParam) return;
        localStorage.setItem('lc_ref_code', refParam);

        const user = await getUser(); if (!user) return;

        const { data: cur, error: e0 } = await window.sb
          .from('user_referrals').select('referrer_user_id')
          .eq('user_id', user.id).maybeSingle();
        if (!e0 && cur?.referrer_user_id) return;

        const { data: refOwner, error: e1 } = await window.sb
          .from('profiles').select('id').eq('ref_code', refParam).maybeSingle();
        if (e1 || !refOwner || refOwner.id === user.id) return;

        const { error: e2 } = await window.sb
          .from('user_referrals')
          .upsert({ user_id: user.id, referrer_user_id: refOwner.id }, { onConflict: 'user_id' });
        if (e2) console.warn('[LC] user_referrals upsert error', e2.message || e2);
      } catch (e) { console.warn('[LC] applyReferral error', e?.message || e); }
    },

    async refreshBalance() {
      try {
        const user = await getUser(); if (!user) return;
        const { data, error } = await window.sb
          .from('wallets').select('balance_cents').eq('user_id', user.id).maybeSingle();
        if (error) return;
        const el = document.querySelector('[data-balance]');
        if (el) {
          const formatted = ((data?.balance_cents ?? 0) / 100).toLocaleString('ru-RU', {
            minimumFractionDigits: 0, maximumFractionDigits: 2,
          });
          el.textContent = formatted;
        }
      } catch (e) { console.error(e); }
    },

    // ====== Просмотры
    async creditView(videoId, watchedSeconds) {
      const user = await getUser(); if (!user) { alert('Войдите в аккаунт'); return; }
      const { data, error } = await window.sb.rpc('credit_view', {
        p_video_id: String(videoId || 'video'),
        p_watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
      });
      if (error) { console.error(error); alert(error.message || 'Ошибка начисления'); return; }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.ok) { alert(row?.message || 'Начисление отклонено'); return; }
      await this.refreshBalance();
      await this.refreshLevelInfo?.();
      return row;
    },

    // ====== Вывод (RPC)
    async requestWithdrawal(amountCents, method, address) {
      try {
        const user = await getUser(); if (!user) { alert('Войдите в аккаунт'); return; }
        const network = method || 'TRC20';
        const { data, error } = await window.sb.rpc('request_withdrawal', {
          p_amount_cents: Math.max(0, Math.floor(amountCents || 0)),
          p_network: String(network), p_address: String(address || ''), p_currency: 'USDT'
        });
        if (error) { console.error(error); alert(error.message || 'Ошибка запроса вывода'); return; }
        const row = Array.isArray(data) ? data[0] : data;
        if (!row?.ok) { alert(row?.reason || 'Заявка отклонена'); return; }
        await this.refreshBalance();
        alert('Заявка на вывод создана: pending');
        return row;
      } catch (e) { console.error(e); alert('Ошибка запроса вывода'); }
    },

    // ====== Депозит (RPC)
    async createDeposit(amountCents, network = 'TRC20', currency = 'USDT', address = '') {
      try {
        const user = await getUser(); if (!user) { alert('Войдите в аккаунт'); return; }
        const { data, error } = await window.sb.rpc('create_deposit', {
          p_amount_cents: Math.max(0, Math.floor(amountCents || 0)),
          p_network: String(network), p_currency: String(currency), p_address: String(address || '')
        });
        if (error) { console.error(error); alert(error.message || 'Ошибка создания заявки'); return; }
        const rec = Array.isArray(data) ? data[0] : data;
        if (rec?.address) { const a = $('#depositAddress'); if (a) a.textContent = rec.address; }
        if (rec?.id) { const idEl = $('#createdDepositId'); if (idEl) idEl.textContent = rec.id; }
        window.LC_TOAST?.ok('Заявка на пополнение создана');
        return rec;
      } catch (e) { console.error(e); alert('Ошибка создания заявки'); }
    },

    async attachTxToDeposit(depositId, txHash) {
      try {
        const user = await getUser(); if (!user) { alert('Войдите в аккаунт'); return; }
        const { data, error } = await window.sb.rpc('attach_tx_to_deposit', {
          p_deposit_id: String(depositId), p_tx_hash: String(txHash)
        });
        if (error) { console.error(error); alert(error.message || 'Ошибка сохранения TX'); return; }
        const row = Array.isArray(data) ? data[0] : data;
        window.LC_TOAST?.ok('TX сохранён. Ожидайте подтверждение.');
        return row;
      } catch (e) { console.error(e); alert('Ошибка сохранения TX'); }
    },

    async mountReferral() {
      try {
        const wrap = $('#refLinkWrap');
        const input = $('#refLink');
        if (!wrap || !input) return;
        const user = await getUser(); if (!user) return;
        const { data, error } = await window.sb
          .from('profiles').select('ref_code').eq('id', user.id).maybeSingle();
        if (error || !data?.ref_code) return;
        const url = new URL(location.origin + '/register_single.html');
        url.searchParams.set('ref', data.ref_code);
        input.value = url.toString();
        wrap.style.display = 'block';
      } catch (e) { console.error(e); }
    },

    async refreshLevelInfo() {
      try {
        const { data, error } = await window.sb.rpc('get_level_info');
        if (error || !Array.isArray(data) || !data.length) return;
        const info = data[0];
        const setTxt = (sel, val) => { const el = $(sel); if (el) el.textContent = String(val); };
        setTxt('[data-level-name]', info.level_name ?? '');
        setTxt('[data-views-left]', info.views_left_today ?? 0);
        const perView = (info.reward_per_view_cents ?? 0) / 100;

        // Верхняя карточка
        const badgeEl = document.getElementById('perViewBadge');
        if (badgeEl) badgeEl.textContent = `+${perView.toFixed(2)} USDT за просмотр`;
        const levelTop = document.querySelector('[data-level]');
        if (levelTop) levelTop.textContent = info.level_name || '—';
        const refsTop = document.querySelector('[data-refs-total]');
        if (refsTop != null && info.refs_total != null) refsTop.textContent = info.refs_total;

        const daily = (info.daily_reward_cents ?? 0) / 100;
        setTxt('[data-reward-per-view]', perView.toFixed(2) + ' USDT');
        setTxt('[data-daily-reward]', daily.toFixed(2) + ' USDT');
      } catch (e) { console.error(e); }
    },

    // -------- Реферальные виджеты (ОСНОВНАЯ версия)
    async loadReferralWidgets() {
      try {
        const user = await getUser(); if (!user) return;

        // --- суммы по уровням (фильтр по user_id)
        const { data: sumsRows, error: eS } = await window.sb
          .from('referral_payouts')
          .select('level,reward_usdt,user_id')
          .eq('user_id', user.id);

        if (!eS && Array.isArray(sumsRows)) {
          const sums = { 1: 0, 2: 0, 3: 0 };
          for (const r of sumsRows) {
            const lvl = Number(r.level);
            const v = Number(r.reward_usdt || 0);
            if (lvl >= 1 && lvl <= 3) sums[lvl] += v;
          }
          const put = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = fmtMoney(val); };
          put('#ref-sum-l1', sums[1]);
          put('#ref-sum-l2', sums[2]);
          put('#ref-sum-l3', sums[3]);
          const total = sums[1] + sums[2] + sums[3];
          const elTotal = document.querySelector('#ref-sum-total'); if (elTotal) elTotal.textContent = fmtMoney(total);
        }

        // --- последние начисления (по user_id; колонка source_user_id)
        const tbody = document.querySelector('#ref-last-tbody');
        if (tbody) {
          const { data: lastRows, error: eL } = await window.sb
            .from('v_referral_payouts')
            .select('created_at, level, reward_usdt, source_user_id, source_type, user_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!eL && Array.isArray(lastRows) && lastRows.length) {
            tbody.innerHTML = lastRows.map(r => `
              <tr>
                <td>${fmtDate(r.created_at)}</td>
                <td>${r.level ?? ''}</td>
                <td>${fmtMoney(r.reward_usdt)}</td>
                <td>${r.source_user_id ? 'доход от реферала' : (r.source_type || 'доход')}</td>
              </tr>`).join('');
          } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:12px 0;">Нет данных</td></tr>`;
          }
        }

        // --- счётчики L1/L2/L3 (RPC без аргументов). Поддержим оба набора id.
        const l1a = document.querySelector('#ref-cnt-l1'); const l1b = document.querySelector('#gen1Count');
        const l2a = document.querySelector('#ref-cnt-l2'); const l2b = document.querySelector('#gen2Count');
        const l3a = document.querySelector('#ref-cnt-l3'); const l3b = document.querySelector('#gen3Count');
        const totalEl = document.querySelector('#refsTotal');

        try {
          const { data, error } = await window.sb.rpc('ref_counts', {}); // без p_user
          if (!error && data) {
            const row = Array.isArray(data) ? data[0] : data;
            const vals = Object.values(row || {}).map(Number);
            const [v1 = 0, v2 = 0, v3 = 0] = vals;
            [l1a, l1b].forEach(el => el && (el.textContent = v1));
            [l2a, l2b].forEach(el => el && (el.textContent = v2));
            [l3a, l3b].forEach(el => el && (el.textContent = v3));
            if (totalEl) totalEl.textContent = (v1 + v2 + v3);
          }
        } catch (_) {}
      } catch (e) {
        console.error('[LC] loadReferralWidgets error', e?.message || e);
      }
    },

    async logout() { try { await window.sb.auth.signOut(); } finally { location.href = '/'; } }
  };

  // === ВИДЕО: конфиг + логика просмотра ======================================
  const LC_VIDEO_LIST = ['/assets/videos/ad1.mp4','/assets/videos/ad2.mp4','/assets/videos/ad3.mp4'];
  const LC_MIN_SECONDS = 30;

  window.LC.initVideoWatch = function () {
    const video = document.getElementById('promoVid');
    const startBtn = document.getElementById('startBtn');
    const bar = document.getElementById('progressFill');
    const txt = document.getElementById('progressText');
    if (!video || !startBtn) return;

    let allowed = false, credited = false, acc = 0, lastT = 0;
    const ui = (m) => { if (txt) txt.textContent = m; };
    const setBar = (pct) => { if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + '%'; };
    const pickVideo = () => LC_VIDEO_LIST[Math.floor(Math.random() * LC_VIDEO_LIST.length)];
    const resetProgress = () => { credited = false; acc = 0; lastT = 0; setBar(0); ui('Прогресс…'); };

    async function refreshState() {
      try {
        const { data, error } = await window.sb.rpc('get_level_info');
        if (error) throw error;
        const info = Array.isArray(data) ? data[0] : data;
        const left = Number(info?.views_left_today ?? 0);
        const isActive = (info?.level_key && info.level_key !== 'guest');
        allowed = isActive && left > 0;
        startBtn.disabled = !allowed;
        if (!isActive) ui('Аккаунт не активен. Пополните баланс и/или пригласите рефералов.');
        else if (left <= 0) ui('Лимит на сегодня исчерпан.');
        else ui(`Доступно просмотров сегодня: ${left}`);
      } catch (e) {
        console.error(e); startBtn.disabled = true; ui('Не удалось получить лимит. Повторите позже.');
      }
    }

    async function credit() {
      try {
        credited = true; startBtn.disabled = true;
        const vidId = (video.currentSrc || '').split('/').pop() || 'video';
        await window.LC.creditView(vidId, Math.round(acc));
        await window.LC.refreshBalance();
        await window.LC.refreshLevelInfo();
        await refreshState();
      } catch (e) {
        console.error(e); ui('Ошибка начисления. Попробуйте ещё раз.');
      } finally {
        startBtn.disabled = false;
      }
    }

    video.addEventListener('timeupdate', () => {
      const t = Math.max(0, video.currentTime || 0);
      if (t > lastT) { acc += (t - lastT); lastT = t; setBar(Math.round((acc / LC_MIN_SECONDS) * 100)); }
      else { lastT = t; }
      if (!credited && acc >= LC_MIN_SECONDS) credit();
    });
    video.addEventListener('ended', () => { if (!credited && acc >= LC_MIN_SECONDS) credit(); });

    startBtn.addEventListener('click', async () => {
      await refreshState();
      if (!allowed) return;
      resetProgress();
      video.src = pickVideo();
      video.muted = true;
      video.play().catch(() => {});
    });

    refreshState();
  };
  // ===========================================================================

  // ----- Auth UI (nav)
  function renderAuthUI(session) {
    const cta = document.querySelector('.nav-cta');
    const drawerCta = document.getElementById('lc-drawer-cta');
    if (!cta) return;
    if (session) {
      cta.innerHTML = `
        <a class="btn ghost" href="dashboard_single.html" id="nav-dashboard">Кабинет</a>
        <a class="btn" href="#" id="nav-logout">Выход</a>`;
    } else {
      cta.innerHTML = `
        <a class="btn ghost" href="login_single.html">Вход</a>
        <a class="btn primary" href="register_single.html">Регистрация</a>`;
    }
    if (drawerCta) drawerCta.innerHTML = cta.innerHTML.replace('id="nav-logout"', 'id="drawerLogout"');
    const logout1 = document.getElementById('nav-logout');
    const logout2 = document.getElementById('drawerLogout');
    [logout1, logout2].forEach(el => {
      if (el) el.addEventListener('click', async (e) => {
        e.preventDefault();
        try { await window.LC.logout(); } catch (_) {}
      });
    });
  }

  // 4) Автоподключение кнопок/форм и первичное наполнение
  document.addEventListener('DOMContentLoaded', async () => {
    window.LC.initVideoWatch?.();

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
        const amount  = parseFloat($('#amount')?.value || '0');
        const method  = $('#method')?.value || 'TRC20';
        const address = $('#address')?.value || '';
        await window.LC.requestWithdrawal(Math.round(amount * 100), method, address);
      });
    }

    // Форма депозита
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
        if (rec?.address) { const a = $('#depositAddress'); if (a) a.textContent = rec.address; }
      });
    }

    // Форма привязки TX
    const tForm = document.getElementById('attachTxForm');
    if (tForm) {
      tForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const depId = $('#depositId')?.value || '';
        const tx    = $('#txHash')?.value || '';
        if (!depId || !tx) { alert('Укажите ID депозита и TX hash'); return; }
        await window.LC.attachTxToDeposit(depId, tx);
      });
    }

    // первичное наполнение UI
    await window.LC.refreshBalance();
    await window.LC.refreshLevelInfo?.();
    await window.LC.mountReferral();
    await window.LC.loadReferralWidgets();
  });
})();
