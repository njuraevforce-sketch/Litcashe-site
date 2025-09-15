;(function(){
  try{
    if (!window.sb || typeof window.sb.from !== 'function') {
      if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        window.sb = window.supabase.createClient(
          window.SUPABASE_URL,
          window.SUPABASE_ANON_KEY,
          { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
        );
      }
    }
  }catch(_){}
})();
// app_supabase.full.js — единый файл для дашборда
// Требует: window.SUPABASE_URL / window.SUPABASE_ANON_KEY, supabase-js v2
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

  // ===== Утилиты =============================================================
  const $ = (sel) => document.querySelector(sel);
  const fmtMoney = (v) => `$${Number(v || 0).toFixed(2)}`;
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso || ''; } };
  const pickNum = (v, d=0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

  function parseMoneyTextToNumber(txt) {
    if (!txt) return null;
    const normalized = String(txt).replace(/[^\d.,-]/g, '').replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  function bumpBalanceByCents(cents) {
    if (!cents) return;
    const el = $('[data-balance]');
    if (!el) return;
    const current = parseMoneyTextToNumber(el.textContent);
    if (current === null) return;
    const next = current + (Number(cents) / 100);
    el.textContent = next.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  async function getUser() {
    const { data, error } = await sb.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  // Глобальный объект
  const LC = window.LC = window.LC || {};

/* =========================  WITHDRAWALS — FRONTEND  =========================
   Ненавязчивые добавления: подписка на статус, фолбэки для разных id полей,
   и рендер истории заявок — только если на странице есть соответствующие узлы.
   Ничего существующего не ломает.
=============================================================================*/

// Подписка на обновления статуса заявок для текущего пользователя
LC.subscribeWithdrawalStatus = async function () {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user || LC._wdSub) return;
    LC._wdSub = sb.channel('wd-status-' + user.id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'withdrawals',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        try {
          const st = String(payload?.new?.status || '').toLowerCase();
          if (st === 'paid') {
            alert('Вывод подтверждён ✅');
          } else if (st === 'rejected') {
            alert('Заявка отклонена, средства возвращены ↩︎');
            if (typeof LC.refreshBalance === 'function') LC.refreshBalance();
          }
          // Обновим список, если он смонтирован
          if (typeof LC.loadWithdrawalsList === 'function') LC.loadWithdrawalsList();
        } catch(_){}
      })
      .subscribe();
  } catch(_){}
};

// Универсальный сабмит формы вывода (поддерживает разные id полей)
LC.bindWithdrawControls = function () {
  // Вариант 1: полноценная форма с id="withdrawForm"
  const form = document.getElementById('withdrawForm');
  if (form && !form.dataset.lcInit) {
    form.dataset.lcInit = '1';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const get = (sel, def='') => (document.querySelector(sel)?.value ?? def);
      const amount  = parseFloat(get('#amount','0'));
      const method  = get('#method','TRC20') || 'TRC20';
      const address = get('#address','');
      await LC.requestWithdrawal(Math.round((Number.isFinite(amount)?amount:0) * 100), method, address);
    });
  }

  // Вариант 2: кнопка + поля c id="withAmount" и id="wallet", как на старой странице
  const btn = document.getElementById('withSubmit');
  if (btn && !btn.dataset.lcInit) {
    btn.dataset.lcInit = '1';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      const amount  = parseFloat(document.getElementById('withAmount')?.value || '0');
      const address = document.getElementById('wallet')?.value || '';
      try {
        const row = await LC.requestWithdrawal(Math.round((Number.isFinite(amount)?amount:0) * 100), 'TRC20', address);
        if (row?.ok) { btn.textContent = 'Заявка создана — ожидание'; }
      } catch(e) {
        console.warn(e);
      } finally {
        setTimeout(()=>{ try{ btn.disabled = false; btn.textContent = 'Отправить заявку'; }catch(_){} }, 1200);
      }
    });
  }
};

// Рендерим историю заявок пользователя, если на странице есть место под неё
LC.loadWithdrawalsList = async function () {
  const tbody = document.getElementById('wd-table-body');
  const list  = document.getElementById('wdList');
  if (!tbody && !list) return;

  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data, error } = await sb
      .from('withdrawals')
      .select('id, created_at, amount_cents, status, txid, network, address')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];

    const renderStatus = (s) => {
      s = String(s||'').toLowerCase();
      if (s === 'paid') return 'подтверждено';
      if (s === 'rejected') return 'отменено';
      return 'ожидание';
    };
    const fmtAmt = (c) => (Number(c||0)/100).toLocaleString('ru-RU', {minimumFractionDigits: 0, maximumFractionDigits: 2});

    if (tbody) {
      tbody.innerHTML = '';
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:10px 0;">Пока нет заявок</td></tr>`;
      } else {
        rows.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${new Date(r.created_at).toLocaleString()}</td>
                          <td>${fmtAmt(r.amount_cents)} USDT</td>
                          <td>${(r.network||'TRC20')}</td>
                          <td>${renderStatus(r.status)}</td>
                          <td>${r.txid? `<code>${r.txid}</code>` : '—'}</td>`;
          tbody.appendChild(tr);
        });
      }
    }

    if (list) {
      list.innerHTML = '';
      if (!rows.length) {
        list.innerHTML = `<div class="empty">Пока нет заявок</div>`;
      } else {
        rows.forEach(r => {
          const item = document.createElement('div');
          item.className = 'wd-item';
          item.innerHTML = `<div class="wd-row">
                              <div class="wd-date">${new Date(r.created_at).toLocaleString()}</div>
                              <div class="wd-amount">${fmtAmt(r.amount_cents)} USDT</div>
                              <div class="wd-status">${renderStatus(r.status)}</div>
                              <div class="wd-tx">${r.txid? `<code>${r.txid}</code>` : ''}</div>
                            </div>`;
          list.appendChild(item);
        });
      }
    }
  } catch (e) {
    console.warn('[LC] loadWithdrawalsList', e?.message || e);
  }
};


  // ===== Профиль + Реф-код ====================================================
  LC.ensureProfile = async function() {
try {
  const { data, error } = await sb.auth.getUser();
  const user = data?.user; if (!user) return;

  const { data: row } = await sb
    .from('profiles')
    .select('user_id, ref_code')
    .eq('user_id', user.id)
    .maybeSingle();
  if (row) return;

  const ins = await sb.from('profiles').insert({ user_id: user.id });
  if (ins.error && ins.error.code !== '23505') {
    console.warn('[LC] ensureProfile insert error', ins.error);
  }
} catch(e) { console.warn('[LC] ensureProfile', e?.message||e); }


};

  LC.applyReferral = async function() {
try {
  const params = new URLSearchParams(location.search);
  const refParam = params.get('ref') || localStorage.getItem('lc_ref_code');
  if (!refParam) return;
  localStorage.setItem('lc_ref_code', refParam);

  const { data, error } = await sb.auth.getUser();
  const user = data?.user; if (error || !user) return;

  // Server-side will ensure profile via trigger, and apply referral safely
  await sb.rpc('apply_referral', { p_ref_code: refParam });
} catch(e) {
  console.warn('[LC] applyReferral', e?.message||e);
}



};

  LC.mountReferral = async function() {
try {
  const wrap = document.querySelector('#refLinkWrap');
  const input = document.querySelector('#refLink');
  if (!wrap || !input) return;
  const { data, error } = await sb.auth.getUser();
  const user = data?.user; if (!user) return;
  const { data: row, error: e1 } = await sb
    .from('profiles')
    .select('ref_code')
    .eq('user_id', user.id)
    .maybeSingle();
  if (e1 || !row?.ref_code) return;
  const url = new URL(location.origin + '/register_single.html');
  url.searchParams.set('ref', row.ref_code);
  input.value = url.toString();
  wrap.style.display = 'block';
  const btn = document.querySelector('#btnCopyRef');
  if (btn) btn.addEventListener('click', async ()=>{
    try { await navigator.clipboard.writeText(input.value); btn.textContent='Скопировано'; setTimeout(()=>btn.textContent='Скопировать', 1200); } catch(_){}
  });
} catch(e) { console.error('[LC] mountReferral', e?.message||e); }

};

  // ===== Активные рефералы (фильтр по балансу) ===============================
  // Активным считаем пользователя, у которого balance_cents >= minCents (по умолчанию 2900 = 29 USDT)
  LC.getActiveReferrals = async function(level = 1, minCents = 2900) {
    try {
      const { data, error } = await sb.rpc('get_referrals_by_generation', {
        p_level: level,
        p_min_cents: minCents
      });
      if (error) { console.warn('[LC] getActiveReferrals', error); return []; }
      return Array.isArray(data) ? data : (data ? [data] : []);
    } catch (e) {
      console.warn('[LC] getActiveReferrals', e);
      return [];
    }
  };

  LC.getActiveReferralCounts = async function(minCents = 2900) {
    try {
      const { data, error } = await sb.rpc('get_referral_counts_active', { p_min_cents: minCents });
      if (error) { console.warn('[LC] getActiveReferralCounts', error); return { gen1:0, gen2:0, gen3:0 }; }
      const row = Array.isArray(data) ? (data[0] || {}) : (data || {});
      return { gen1: Number(row.gen1||0), gen2: Number(row.gen2||0), gen3: Number(row.gen3||0) };
    } catch (e) {
      console.warn('[LC] getActiveReferralCounts', e);
      return { gen1:0, gen2:0, gen3:0 };
    }
  };

  // ===== Баланс / Уровни =====================================================
  LC.refreshBalance = async function() {
    try {
      const user = await getUser(); if (!user) return;
      const { data, error } = await sb.from('wallets').select('balance_cents').eq('user_id', user.id).maybeSingle();
      if (error) return;
      if (data && typeof data.balance_cents === 'number') {
        const el = $('[data-balance]');
        if (el) {
          const formatted = (data.balance_cents / 100).toLocaleString('ru-RU', {
            minimumFractionDigits: 0, maximumFractionDigits: 2
          });
          el.textContent = formatted;
        }
      }
    } catch(e) { console.warn('[LC] refreshBalance', e?.message||e); }
  };

  LC.getLevelInfo = async function() {
    try {
      const r2 = await sb.rpc('get_level_info_v2');
      if (!r2.error && r2.data) return Array.isArray(r2.data) ? r2.data[0] : r2.data;
    } catch(_){}
    try {
      const r1 = await sb.rpc('get_level_info');
      if (!r1.error && r1.data) return Array.isArray(r1.data) ? r1.data[0] : r1.data;
    } catch(_){}
    return null;
  };

  // --- помощник: проставить текст цели куда угодно, не меняя верстку
  function renderNextLevelGoal(text) {
    const safe = text || '—';

    // 1) приоритет — явный placeholder
    const el = document.querySelector('[data-next-target]');
    if (el) { el.textContent = safe; return; }

    // 2) fallback: найти узел с точной фразой и записать в соседнюю «ячейку»
    const labels = Array.from(document.querySelectorAll('*')).filter(n=>{
      try { return n.childElementCount===0 && /цель следующего уровня/i.test(n.textContent.trim()); }
      catch { return false; }
    });
    if (!labels.length) return;

    const label = labels[0];
    let target = label.nextElementSibling;

    if (!target) {
      const tr = label.closest('tr');
      if (tr) target = tr.querySelector('td:last-child, th:last-child');
    }
    if (!target) {
      const row = label.parentElement;
      if (row) {
        const kids = Array.from(row.children);
        if (kids.length >= 2) target = kids[kids.length - 1];
      }
    }
    if (!target) target = label.parentElement?.querySelector('.value, .stat-value, .data-value, b, strong, span');

    if (target) target.textContent = safe;
  }

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

      // Цель следующего уровня — из RPC next_level_goal()
      try {
        const r = await sb.rpc('next_level_goal');
        if (!r.error && r.data) {
          const row = Array.isArray(r.data) ? r.data[0] : r.data;
          if (row && row.goal_text) { renderNextLevelGoal(row.goal_text); return; }
        }
      } catch(_) {}
      renderNextLevelGoal('—');
    } catch(e) { console.error('[LC] refreshLevelInfo', e); }
  };

  // ===== Начисление за просмотр ==============================================
  LC.creditView = async function(videoId, watchedSeconds) {
    const user = await getUser(); if (!user) { alert('Войдите в аккаунт'); return null; }
    const { data, error } = await sb.rpc('credit_view', {
      p_video_id: String(videoId || 'video'),
      p_watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
    });
    if (error) { console.error(error); alert(error.message || 'Ошибка начисления'); return null; }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.ok) { alert(row?.message || 'Начисление отклонено'); return null; }
    // (removed optimistic bump to avoid flicker)
    // if (typeof row.reward_per_view_cents === 'number') { /* bumpBalanceByCents(row.reward_per_view_cents); */ }
if (typeof row.views_left === 'number') {
      const el = document.querySelector('[data-views-left]');
      if (el) el.textContent = String(row.views_left);
    }

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
  const video    = document.getElementById('promoVid');
  const startBtn = document.getElementById('startBtn');
  const bar      = document.getElementById('progressFill');
  const txt      = document.getElementById('progressText');
  if (!video || !startBtn) return;

  // ⚑ Идемпотентная инициализация (не даём навесить события повторно)
  if (video.dataset.lcInit === '1') return;
  video.dataset.lcInit = '1';

  let allowed = false, credited = false, acc = 0, lastT = 0;
  let creditPromise = null; // single-flight: не позволяем второй одновременный вызов

  const ui = (m)=> { if (txt) txt.textContent = m; };
  const setBar = (p)=> { if (bar) bar.style.width = Math.max(0, Math.min(100, p)) + '%'; };
  const pickVideo = ()=> LC_VIDEO_LIST[Math.floor(Math.random()*LC_VIDEO_LIST.length)];
  const reset = ()=> { credited=false; acc=0; lastT=0; setBar(0); ui('Прогресс…'); };

  async function refreshState(){
    try {
      const info = await LC.getLevelInfo(); if (!info) throw new Error('no level');
      const left = Number(info.views_left_today ?? 0);
      const isActive = (info.level_key && info.level_key !== 'guest') ||
                       Number(info.reward_percent_bp || 0) > 0;
      allowed = isActive && left > 0;
      startBtn.disabled = !allowed;
      if (!isActive) ui('Аккаунт не активен. Пополните баланс/рефералов.');
      else if (left <= 0) ui('Лимит на сегодня исчерпан.');
      else ui(`Доступно просмотров сегодня: ${left}`);
    } catch {
      startBtn.disabled = true;
      ui('Не удалось получить лимит.');
    }
  }

  function creditOnce(){
    if (creditPromise) return creditPromise; // уже в работе — повтор не нужен
    creditPromise = (async () => {
      try {
        credited = true;
        startBtn.disabled = true;
        const vidId = (video.currentSrc || '').split('/').pop() || 'video';
        const row = await LC.creditView(vidId, Math.round(acc));

        if (row) {
          const cents = Number(row.reward_per_view_cents ?? row.reward_cents ?? 0);
          const usdt = (cents / 100).toFixed(2);
          ui(`Зачислено +${usdt} USDT`);
          setBar(100);

          // Обновляем «остаток просмотров» на странице, если есть такой элемент
          const el = document.querySelector('[data-views-left]');
          if (el && typeof row.views_left === 'number') el.textContent = String(row.views_left);

          // При наличии хелпера — обновить хедер/баланс без перезагрузки
          if (typeof LC.refreshHeader === 'function') LC.refreshHeader();
        }
      } catch (e) {
        console.warn('[LC] creditView muted:', e); // глушим системные сплывашки
      } finally {
        setTimeout(() => { startBtn.disabled = false; creditPromise = null; }, 800);
      }
      return true;
    })();
    return creditPromise;
  }

  // Считаем секунды и триггерим кредит ровно один раз
  video.addEventListener('timeupdate', () => {
    const t = Math.max(0, video.currentTime || 0);
    if (t > lastT) { acc += (t - lastT); lastT = t; setBar(Math.round((acc / LC_MIN_SECONDS) * 100)); }
    else { lastT = t; }
    if (!credited && acc >= LC_MIN_SECONDS) creditOnce();
  }, { passive: true });

  video.addEventListener('ended', () => {
    if (!credited && acc >= LC_MIN_SECONDS) creditOnce();
  }, { passive: true });

  startBtn.addEventListener('click', async () => {
    await refreshState();
    if (!allowed) return;
    reset();
    video.src = pickVideo();
    video.currentTime = 0;
    video.muted = true;
    video.play().catch(()=>{});
  });

  refreshState();
};


  // ===== Карточки дашборда + Реф-панель ======================================
  LC.refreshDashboardCards = async function() {
    try {
      const user = await getUser(); if (!user) return;
      const [info, wal] = await Promise.all([
        LC.getLevelInfo(),
        sb.from('wallets').select('balance_cents').eq('user_id', user.id).maybeSingle()
      ]);
      if (!info) return;

      const balanceCents = (wal && wal.data && typeof wal.data.balance_cents === 'number')
        ? wal.data.balance_cents : null;

      if (balanceCents !== null) {
        const el = $('[data-balance]');
        if (el) {
          const formatted = (balanceCents / 100).toLocaleString('ru-RU', {
            minimumFractionDigits: 0, maximumFractionDigits: 2
          });
          el.textContent = formatted;
        }
      }

      const baseCents = info.level_base_cents ?? info.base_cents ??
        Math.min(Number(balanceCents||0), Number(info.level_cap_cents||balanceCents||0));
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
        const nodes = Array.from(document.querySelectorAll('*')).filter(n=>{
          try { return n.childElementCount===0 && n.textContent.trim()===label; } catch { return false; }
        });
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
      if (!used) {
        byLabel('Ставка',`${ratePct.toFixed(2)} %`);
        byLabel('Капитал (расч.)',`$${baseUSDT.toFixed(2)}`);
        byLabel('Рефералы',String(info.refs_total??0));
        byLabel('Просмотры',String(done));
      }

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

      // Реф-панель: суммы
      let sumsRows=null, eS=null;
      try {
        const resp = await sb.from('referral_payouts')
          .select('level,reward_usdt')
          .eq('referrer_user_id', user.id);
        sumsRows = resp.data; eS = resp.error;
      } catch(e){ eS=e; }
      if (eS || !Array.isArray(sumsRows)) {
        try {
          // ФОЛБЭК — правильные поля в твоей схеме: reward_usdt
          const resp2 = await sb.from('referral_rewards')
            .select('level,reward_usdt')
            .eq('referrer_user_id', user.id);
          if (!resp2.error) {
            sumsRows = (resp2.data||[]).map(r=>({
              level: r.level,
              reward_usdt: Number(r.reward_usdt || 0)
            }));
          }
        } catch(_){}
      }
      const sumBy = {1:0,2:0,3:0};
      (sumsRows||[]).forEach(r=>{
        const lvl = Number(r.level);
        if (lvl===1||lvl===2||lvl===3) sumBy[lvl] += Number(r.reward_usdt||0);
      });
      $('#ref-sum-l1')&&($('#ref-sum-l1').textContent=fmtMoney(sumBy[1]));
      $('#ref-sum-l2')&&($('#ref-sum-l2').textContent=fmtMoney(sumBy[2]));
      $('#ref-sum-l3')&&($('#ref-sum-l3').textContent=fmtMoney(sumBy[3]));
      $('#ref-sum-total')&&($('#ref-sum-total').textContent=fmtMoney(sumBy[1]+sumBy[2]+sumBy[3]));

      // Реф-панель: последние выплаты
      const tbody = $('#ref-last-tbody');
      if (tbody) {
        let lastRows=null, eL=null;
        try {
          const resp = await sb.from('v_referral_payouts')
            .select('created_at, level, reward_usdt, source_type')
            .eq('referrer_user_id', user.id)
            .order('created_at',{ascending:false})
            .limit(10);
          lastRows = resp.data; eL = resp.error;
        } catch(e){ eL=e; }
        if (eL || !Array.isArray(lastRows) || !lastRows.length) {
          try {
            // ФОЛБЭК — правильные поля: reward_usdt (+ source в твоей схеме)
            const resp2 = await sb.from('referral_rewards')
              .select('created_at, level, reward_usdt, source')
              .eq('referrer_user_id', user.id)
              .order('created_at',{ascending:false})
              .limit(10);
            if (!resp2.error) {
              lastRows = (resp2.data||[]).map(r=>({
                created_at: r.created_at,
                level: r.level,
                reward_usdt: Number(r.reward_usdt || 0),
                source_type: r.source || 'доход'
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
    [logout1, logout2].forEach(el=>{
      if (el) el.addEventListener('click', async (e)=>{ e.preventDefault(); await LC.logout(); });
    });
  }

  // ===== Инициализация DOM ====================================================
  document.addEventListener('DOMContentLoaded', async ()=>{
    // Чтобы «0» не мигал до загрузки — заменим на тире, потом обновим точным значением
    const balEl = document.querySelector('[data-balance]');
    if (balEl && /^\$?\s*0([.,]0+)?$/.test(balEl.textContent.trim())) balEl.textContent = '—';

    LC.initVideoWatch();

    try {
      const { data: { session } } = await sb.auth.getSession();
      renderAuthUI(session);
      sb.auth.onAuthStateChange((_evt, sess)=>renderAuthUI(sess));
    } catch(_){}

    // Кнопка тестового начисления (если есть)
    const btnCredit = document.getElementById('btnCreditView');
    if (btnCredit) btnCredit.addEventListener('click', async ()=>{
      const vid = btnCredit.getAttribute('data-video-id')||'video1';
      await LC.creditView(vid, 35);
    });

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
    // --- Withdrawals wiring (safe & optional)
    if (typeof LC.bindWithdrawControls === 'function') LC.bindWithdrawControls();
    if (typeof LC.subscribeWithdrawalStatus === 'function') LC.subscribeWithdrawalStatus();
    if (typeof LC.loadWithdrawalsList === 'function') LC.loadWithdrawalsList();

  });
})();
