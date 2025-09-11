// app_supabase.full.js — единый файл для дашборда
// Содержит: создание клиента, auth-обвязку, начисление за просмотр,
// депозит/вывод, реф.панель, карточки и фолбэки для referral_*
// Требования: window.SUPABASE_URL / window.SUPABASE_ANON_KEY, supabase-js v2

;(function () {
  // 0) Конфиг + клиент
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('[LC] Supabase config missing.');
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[LC] supabase-js not found. Include @supabase/supabase-js v2');
    return;
  }
  const sb = window.sb || window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );
  window.sb = sb; window.supabaseClient = sb;

  // Утилиты
  const $ = (sel) => document.querySelector(sel);
  const fmtMoney = (v) => `$${Number(v || 0).toFixed(2)}`;
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso || ''; } };
  const pickNum = (v, d=0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

  async function getUser() {
    const { data, error } = await sb.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  // Глобальный объект
  const LC = window.LC = window.LC || {};

  // ===== Профиль + Реф-код ====================================================
  LC.ensureProfile = async function() {
    try {
      const user = await getUser(); if (!user) return;
      const { data, error } = await sb.from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (!error && data) return;
      await sb.from('profiles').insert({ id: user.id });
    } catch(e) { console.warn('[LC] ensureProfile', e?.message||e); }
  };

  LC.applyReferral = async function() {
    try {
      const params = new URLSearchParams(location.search);
      const refParam = params.get('ref') || localStorage.getItem('lc_ref_code');
      if (!refParam) return;
      localStorage.setItem('lc_ref_code', refParam);
      const user = await getUser(); if (!user) return;

      const cur = await sb.from('user_referrals').select('referrer_user_id').eq('user_id', user.id).maybeSingle();
      if (!cur.error && cur.data?.referrer_user_id) return;

      const owner = await sb.from('profiles').select('id').eq('ref_code', refParam).maybeSingle();
      if (owner.error || !owner.data || owner.data.id === user.id) return;

      await sb.from('user_referrals').upsert(
        { user_id: user.id, referrer_user_id: owner.data.id },
        { onConflict: 'user_id' }
      );
    } catch(e) { console.warn('[LC] applyReferral', e?.message||e); }
  };

  LC.mountReferral = async function() {
    try {
      const wrap = $('#refLinkWrap'), input = $('#refLink');
      if (!wrap || !input) return;
      const user = await getUser(); if (!user) return;
      const { data, error } = await sb.from('profiles').select('ref_code').eq('id', user.id).maybeSingle();
      if (error || !data?.ref_code) return;
      const url = new URL(location.origin + '/register_single.html');
      url.searchParams.set('ref', data.ref_code);
      input.value = url.toString(); wrap.style.display = 'block';
      const btn = $('#btnCopyRef');
      if (btn) btn.addEventListener('click', async ()=>{
        try { await navigator.clipboard.writeText(input.value); btn.textContent='Скопировано'; setTimeout(()=>btn.textContent='Скопировать',1200); } catch(_){}
      });
    } catch(e) { console.error('[LC] mountReferral', e?.message||e); }
  };

  // ===== Баланс / Уровни =====================================================
  LC.refreshBalance = async function() {
    const user = await getUser(); if (!user) return;
    const { data, error } = await sb.from('wallets').select('balance_cents').eq('user_id', user.id).maybeSingle();
    if (error) return;
    const el = $('[data-balance]');
    if (el) {
      const formatted = ((data?.balance_cents ?? 0) / 100).toLocaleString('ru-RU', {minimumFractionDigits:0,maximumFractionDigits:2});
      el.textContent = formatted;
    }
  };

  LC.getLevelInfo = async function() {
    // v1
    try {
    const r2 = await sb.rpc('get_level_info_v2');
if (!r2.error && r2?.data) return r2?.data?.[0] ?? r2?.data;

const r1 = await sb.rpc('get_level_info');
if (!r1.error && r1?.data) return r1?.data?.[0] ?? r1?.data;
    return null;
  };

  LC.refreshLevelInfo = async function() {
    try {
      const info = await LC.getLevelInfo(); if (!info) return;
      const set = (sel, val) => { const el = $(sel); if (el) el.textContent = String(val); };

      const perView = pickNum(info.reward_per_view_cents)/100;
      const daily   = pickNum(info.daily_reward_cents)/100;
      const base    = pickNum(info.base_amount_cents ?? info.level_base_cents ?? info.base_cents)/100;
      const bp      = pickNum(info.reward_percent_bp ?? info.level_percent_bp ?? info.rate_bp);
      const rate    = bp ? (bp/100) : pickNum(info.level_percent ?? info.rate_percent);

      set('[data-level-name]', info.level_name ?? '');
      set('[data-views-left]', info.views_left_today ?? 0);
      set('[data-reward-per-view]', `${perView.toFixed(2)} USDT`);
      set('[data-daily-reward]',    `${daily.toFixed(2)} USDT`);
      set('[data-level-base]',      `$${base.toFixed(2)}`);
      set('[data-level-percent]',   `${rate.toFixed(2)} %`);

      const badge = $('#perViewBadge'); if (badge) badge.textContent = `+${perView.toFixed(2)} USDT за просмотр`;

      // Цель следующего уровня (клиентская логика)
      const goalEl = document.querySelector('[data-next-target]');
      if (goalEl) {
        let key = (info.level_key || info.level_name || '').toString().toLowerCase().replace(/\s+/g,'_');
        const need = (b, r) => `Баланс ≥ $${b} и рефералы ≥ ${r}`;
        let goal = '—';
        if (key === 'guest' || key === '') goal = need(29, 0);
        else if (key === 'starter')        goal = need(300, 5);
        else if (key === 'advanced')       goal = need(1000, 15);
        else if (key === 'pro_elite' || key === 'proelite') goal = need(2000, 30);
        else if (key === 'titanium')       goal = 'Максимальный уровень';
        goalEl.textContent = goal;
      }
    } catch(e) { console.error('[LC] refreshLevelInfo', e); }
  };

  // ===== Начисление за просмотр ==============================================
  LC.creditView = async function(videoId, watchedSeconds) {
    const user = await getUser(); if (!user) { alert('Войдите в аккаунт'); return; }
    const { data, error } = await sb.rpc('credit_view', {
      p_video_id: String(videoId || 'video'),
      p_watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
    });
    if (error) { console.error(error); alert(error.message || 'Ошибка начисления'); return; }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.ok) { alert(row?.message || 'Начисление отклонено'); return; }
    await LC.refreshBalance();
    await LC.refreshLevelInfo();
    return row;
  };

  // ===== Вывод / Депозит =====================================================
  LC.requestWithdrawal = async function(amountCents, method='TRC20', address='') {
    const user = await getUser(); if (!user) { alert('Войдите в аккаунт'); return; }
    const { data, error } = await sb.rpc('request_withdrawal', {
      p_amount_cents: Math.max(0, Math.floor(amountCents || 0)),
      p_network: String(method), p_address: String(address||''), p_currency: 'USDT'
    });
    if (error) { console.error(error); alert(error.message || 'Ошибка запроса вывода'); return; }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.ok) { alert(row?.reason || 'Заявка отклонена'); return; }
    await LC.refreshBalance();
    alert('Заявка на вывод создана');
    return row;
  };

  LC.createDeposit = async function(amountCents, network='TRC20', currency='USDT', address='') {
    const user = await getUser(); if (!user) { alert('Войдите в аккаунт'); return; }
    const { data, error } = await sb.rpc('create_deposit', {
      p_amount_cents: Math.max(0, Math.floor(amountCents || 0)),
      p_network: String(network), p_currency: String(currency), p_address: String(address||'')
    });
    if (error) { console.error(error); alert(error.message || 'Ошибка создания заявки'); return; }
    const rec = Array.isArray(data) ? data[0] : data;
    if (rec?.address) { const a = $('#depositAddress'); if (a) a.textContent = rec.address; }
    if (rec?.id)      { const i = $('#createdDepositId'); if (i) i.textContent = rec.id; }
    return rec;
  };

  LC.attachTxToDeposit = async function(depositId, txHash) {
    const user = await getUser(); if (!user) { alert('Войдите в аккаунт'); return; }
    const { data, error } = await sb.rpc('attach_tx_to_deposit', {
      p_deposit_id: String(depositId), p_tx_hash: String(txHash)
    });
    if (error) { console.error(error); alert(error.message || 'Ошибка сохранения TX'); return; }
    return Array.isArray(data) ? data[0] : data;
  };

  LC.logout = async function() { try { await sb.auth.signOut(); } finally { location.href = '/'; } };

  // ===== Виджет «Видео» ======================================================
  const LC_VIDEO_LIST = ['/assets/videos/ad1.mp4','/assets/videos/ad2.mp4','/assets/videos/ad3.mp4'];
  const LC_MIN_SECONDS = 10;

  LC.initVideoWatch = function () {
    const video    = $('#promoVid');
    const startBtn = $('#startBtn');
    const bar      = $('#progressFill');
    const txt      = $('#progressText');
    if (!video || !startBtn) return;

    let allowed = false, credited = false, acc = 0, lastT = 0;

    function ui(msg){ if (txt) txt.textContent = msg; }
    function setBar(p){ if (bar) bar.style.width = Math.max(0,Math.min(100,p)) + '%'; }
    function pickVideo(){ return LC_VIDEO_LIST[Math.floor(Math.random()*LC_VIDEO_LIST.length)]; }
    function reset(){ credited=false; acc=0; lastT=0; setBar(0); ui('Прогресс…'); }

    async function refreshState(){
      try {
        const info = await LC.getLevelInfo(); if (!info) throw new Error('no level');
        const left = Number(info.views_left_today ?? 0);
        const isActive = (info.level_key && info.level_key !== 'guest') || Number(info.reward_percent_bp||0) > 0;
        allowed = isActive && left > 0;
        startBtn.disabled = !allowed;
        if (!isActive) ui('Аккаунт не активен. Пополните баланс и/или пригласите рефералов.');
        else if (left <= 0) ui('Лимит на сегодня исчерпан.');
        else ui(`Доступно просмотров сегодня: ${left}`);
      } catch(e) { startBtn.disabled = true; ui('Не удалось получить лимит.'); }
    }
    async function credit(){
      try {
        credited = true; startBtn.disabled = true;
        const vidId = (video.currentSrc||'').split('/').pop() || 'video';
        await LC.creditView(vidId, Math.round(acc));
        await LC.refreshBalance();
        await LC.refreshLevelInfo();
        await refreshState();
      } catch(e) { console.error(e); ui('Ошибка начисления'); }
      finally { startBtn.disabled = false; }
    }

    video.addEventListener('timeupdate', ()=>{
      const t = Math.max(0, video.currentTime || 0);
      if (t > lastT) { acc += (t - lastT); lastT = t; setBar(Math.round((acc/LC_MIN_SECONDS)*100)); }
      else { lastT = t; }
      if (!credited && acc >= LC_MIN_SECONDS) credit();
    });
    video.addEventListener('ended', ()=>{ if (!credited && acc >= LC_MIN_SECONDS) credit(); });
    startBtn.addEventListener('click', async ()=>{
      await refreshState(); if (!allowed) return;
      reset(); video.src = pickVideo(); video.muted = true; video.play().catch(()=>{});
    });
    refreshState();
  };

  // ===== Карточки дашборда + Реф-панель ======================================
  LC.refreshDashboardCards = async function() {
    try {
      const user = await getUser(); if (!user) return;
      const [info, wal] = await Promise.all([LC.getLevelInfo(), sb.from('wallets').select('balance_cents').eq('user_id', user.id).maybeSingle()]);
      if (!info) return;
      const balanceCents = wal?.data?.balance_cents ?? 0;

      const baseCents = info.level_base_cents ?? info.base_cents ?? Math.min(Number(balanceCents||0), Number(info.level_cap_cents||balanceCents||0));
      const perViewUSDT = Number(info.reward_per_view_cents||0)/100;
      const dailyUSDT   = Number(info.daily_reward_cents||0)/100;
      const baseUSDT    = Number(baseCents||0)/100;
      const bp          = pickNum(info.reward_percent_bp ?? info.level_percent_bp ?? info.rate_bp);
      const ratePct     = bp ? (bp/100) : pickNum(info.level_percent ?? info.rate_percent);
      const totalPerDay = Number(info.views_total_per_day ?? 5);
      const left        = Number(info.views_left_today ?? totalPerDay);
      const done        = Math.max(0, totalPerDay - left);

      const set = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };
      const byLabel = (label, value)=>{
        const nodes = Array.from(document.querySelectorAll('*')).filter(n=>{try{return n.childElementCount===0&&n.textContent.trim()===label;}catch{return false;}});
        nodes.forEach(node=>{
          let card = node.closest('.card') || node.parentElement;
          if (!card) return;
          const cands = Array.from(card.querySelectorAll('b,strong,span,div,h1,h2,h3,p'));
          let target = null;
          for (const c of cands.reverse()) {
            const t = (c.textContent || '').trim();
            if (/^[\$\d].*%?$/.test(t)) { target = c; break; }
          }
          if (!target) target = card.querySelector('span,div,strong') || card;
          target.textContent = value;
        });
      };

      let used = false;
      if (document.querySelector('[data-card-rate]'))     { set('[data-card-rate]', `${ratePct.toFixed(2)} %`); used = true; }
      if (document.querySelector('[data-level-percent]')) { set('[data-level-percent]', `${ratePct.toFixed(2)} %`); }
      if (document.querySelector('[data-card-capital]'))  { set('[data-card-capital]', `$${baseUSDT.toFixed(2)}`); used = true; }
      if (document.querySelector('[data-refs-total]'))    { set('[data-refs-total]', String(info.refs_total ?? 0)); used = true; }
      if (document.querySelector('[data-card-views]'))    { set('[data-card-views]', String(done)); used = true; }
      if (!used) { byLabel('Ставка',`${ratePct.toFixed(2)} %`); byLabel('Капитал (расч.)',`$${baseUSDT.toFixed(2)}`); byLabel('Рефералы',String(info.refs_total??0)); byLabel('Просмотры',String(done)); }

      set('[data-level-name]', info.level_name || '—');
      set('[data-reward-per-view]', `${perViewUSDT.toFixed(2)} USDT`);
      set('[data-daily-reward]',    `${dailyUSDT.toFixed(2)} USDT`);
      set('[data-level-base]',      `$${baseUSDT.toFixed(2)}`);
      const badge = $('#perViewBadge'); if (badge) badge.textContent = `+${perViewUSDT.toFixed(2)} USDT за просмотр`;

      // Реф-панель: счётчики
      try {
        const r = await sb.rpc('ref_counts', { p_user: user.id });
        if (!r.error) {
          const row = Array.isArray(r.data) ? r.data[0] : r.data;
          const vals = Object.values(row||{}).map(n=>Number(n)||0);
          const [c1=0,c2=0,c3=0] = vals;
          $('#gen1Count')&&($('#gen1Count').textContent=c1);
          $('#gen2Count')&&($('#gen2Count').textContent=c2);
          $('#gen3Count')&&($('#gen3Count').textContent=c3);
          $('#refsTotal')&&($('#refsTotal').textContent=c1+c2+c3);
        }
      } catch(_) {}

      // Реф-панель: суммы (referral_payouts.reward_usdt → fallback referral_rewards.amount_cents)
      let sumsRows=null, eS=null;
      try {
        const resp = await sb.from('referral_payouts').select('level,reward_usdt').eq('referrer_user_id', user.id);
        sumsRows = resp.data; eS = resp.error;
      } catch(e){ eS=e; }
      if (eS || !Array.isArray(sumsRows)) {
        try {
          const resp2 = await sb.from('referral_rewards').select('level,amount_cents').eq('referrer_user_id', user.id);
          if (!resp2.error) sumsRows = (resp2.data||[]).map(r=>({level:r.level, reward_usdt: Number(r.amount_cents||0)/100}));
        } catch(_){}
      }
      const sumBy = {1:0,2:0,3:0};
      (sumsRows||[]).forEach(r=>{ const lvl=Number(r.level); if (lvl===1||lvl===2||lvl===3) sumBy[lvl]+=Number(r.reward_usdt||0); });
      $('#ref-sum-l1')&&($('#ref-sum-l1').textContent=fmtMoney(sumBy[1]));
      $('#ref-sum-l2')&&($('#ref-sum-l2').textContent=fmtMoney(sumBy[2]));
      $('#ref-sum-l3')&&($('#ref-sum-l3').textContent=fmtMoney(sumBy[3]));
      $('#ref-sum-total')&&($('#ref-sum-total').textContent=fmtMoney(sumBy[1]+sumBy[2]+sumBy[3]));

      // Реф-панель: последние выплаты (v_referral_payouts → fallback referral_rewards)
      const tbody = $('#ref-last-tbody');
      if (tbody) {
        let lastRows=null, eL=null;
        try {
          const resp = await sb.from('v_referral_payouts')
            .select('created_at, level, reward_usdt, source_type')
            .eq('referrer_user_id', user.id).order('created_at',{ascending:false}).limit(10);
          lastRows = resp.data; eL = resp.error;
        } catch(e){ eL=e; }
        if (eL || !Array.isArray(lastRows) || !lastRows.length) {
          try {
            const resp2 = await sb.from('referral_rewards')
              .select('created_at, level, amount_cents, source')
              .eq('referrer_user_id', user.id).order('created_at',{ascending:false}).limit(10);
            if (!resp2.error) {
              lastRows = (resp2.data||[]).map(r=>({
                created_at: r.created_at, level: r.level,
                reward_usdt: Number(r.amount_cents||0)/100, source_type: r.source || 'доход'
              }));
            }
          } catch(_){}
        }
        tbody.innerHTML = '';
        if (!lastRows || !lastRows.length) {
          tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:12px 0;">Нет данных</td></tr>`;
        } else {
          lastRows.forEach(r=>{
            const tr=document.createElement('tr');
            tr.innerHTML = `<td>${fmtDate(r.created_at)}</td><td>${r.level??''}</td><td>${fmtMoney(r.reward_usdt)}</td><td>${r.source_type||'доход'}</td>`;
            tbody.appendChild(tr);
          });
        }
      }
    } catch(e) { console.error('[LC] refreshDashboardCards', e); }
  };

  // ===== Навигация (кнопки вход/выход в шапке) ===============================
  function renderAuthUI(session) {
    const cta = document.querySelector('.nav-cta');
    const drawerCta = document.getElementById('lc-drawer-cta');
    if (!cta) return;
    if (session) {
      cta.innerHTML = `<a class="btn ghost" href="dashboard_single.html" id="nav-dashboard">Кабинет</a>
                       <a class="btn" href="#" id="nav-logout">Выход</a>`;
    } else {
      cta.innerHTML = `<a class="btn ghost" href="login_single.html">Вход</a>
                       <a class="btn primary" href="register_single.html">Регистрация</a>`;
    }
    if (drawerCta) drawerCta.innerHTML = cta.innerHTML.replace('id="nav-logout"','id="drawerLogout"');
    const logout1 = document.getElementById('nav-logout');
    const logout2 = document.getElementById('drawerLogout');
    [logout1, logout2].forEach(el=>{ if (el) el.addEventListener('click', async (e)=>{ e.preventDefault(); await LC.logout(); }); });
  }

  // ===== Инициализация DOM ====================================================
  document.addEventListener('DOMContentLoaded', async ()=>{
    // Видео-виджет
    LC.initVideoWatch();

    try {
      const { data: { session } } = await sb.auth.getSession();
      renderAuthUI(session);
      sb.auth.onAuthStateChange((_evt, sess)=>renderAuthUI(sess));
    } catch(_){}

    // Кнопка тестового начисления (если есть)
    const btnCredit = document.getElementById('btnCreditView');
    if (btnCredit) btnCredit.addEventListener('click', async ()=>{ const vid = btnCredit.getAttribute('data-video-id')||'video1'; await LC.creditView(vid, 35); });

    // Форма вывода
    const wForm = document.getElementById('withdrawForm');
    if (wForm) wForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const amount  = parseFloat($('#amount')?.value || '0');
      const method  = $('#method')?.value || 'TRC20';
      const address = $('#address')?.value || '';
      await LC.requestWithdrawal(Math.round(amount*100), method, address);
    });

    // Форма депозита
    const dForm = document.getElementById('depositForm');
    if (dForm) dForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const get=(id,def='')=>document.getElementById(id)?.value||def;
      const amount=parseFloat(get('dAmount','0'));
      const network=get('dNetwork','TRC20');
      const currency=get('dCurrency','USDT');
      const addr=get('dAddress','');
      await LC.createDeposit(Math.round(amount*100), network, currency, addr);
    });

    // Привязка TX
    const tForm = document.getElementById('attachTxForm');
    if (tForm) tForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const depId=$('#depositId')?.value||'';
      const tx=$('#txHash')?.value||'';
      if(!depId||!tx){ alert('Укажите ID депозита и TX hash'); return; }
      await LC.attachTxToDeposit(depId, tx);
    });

    await LC.ensureProfile();
    await LC.applyReferral();
    await LC.refreshBalance();
    await LC.mountReferral();
    await LC.refreshLevelInfo();
    await LC.refreshDashboardCards();
  });
})();
