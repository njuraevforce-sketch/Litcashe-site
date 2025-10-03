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

// --- Patch: ensure phone is saved into user metadata on signUp (non-breaking) ---
;(function(){
  try {
    var sb = window && window.sb;
    if (sb && sb.auth && typeof sb.auth.signUp === 'function' && !sb._signUpPatched) {
      var _origSignUp = sb.auth.signUp.bind(sb.auth);
      sb.auth.signUp = async function(params){
        try {
          var p = params || {};
          var options = p.options || {};
          var meta = options.data || {};
          // Try to read phone from multiple places if not explicitly passed
          var phone = (meta && (meta.phone || meta.phone_number || meta.tel)) || null;
          if (!phone && typeof document !== 'undefined') {
            var el = document.querySelector('input[name="phone"], input#phone, input[data-phone]');
            if (el && el.value) phone = (''+el.value).trim();
          }
          if (!phone && typeof localStorage !== 'undefined') {
            var lp = localStorage.getItem('reg_phone');
            if (lp) phone = (''+lp).trim();
          }
          if (phone) {
            options = Object.assign({}, options, { data: Object.assign({}, meta, { phone: phone }) });
          }
          return await _origSignUp(Object.assign({}, p, { options: options }));
        } catch (e) {
          return await _origSignUp(params);
        }
      };
      sb._signUpPatched = true;
    }
  } catch (e) {}
})();

// app_supabase.js — единый файл для дашборда с исправленными вызовами БД
;(function () {
  // === Singleton guard (main app) ===
  if (window.__LC_SINGLETON__) {
    try { console.warn('[LC] main app already initialized:', window.__LC_SINGLETON__); } catch(_){}
    return;
  }
  window.__LC_SINGLETON__ = 'app_supabase@2025-09-20';

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

  async function getUser() {
    const { data, error } = await sb.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  // Глобальный объект
  const LC = window.LC = window.LC || {};

  /* =========================  WITHDRAWALS — FRONTEND  =======================*/
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
            if (typeof LC.loadWithdrawalsList === 'function') LC.loadWithdrawalsList();
          } catch(_){}
        })
        .subscribe();
    } catch(_){}
  };

  LC.bindWithdrawControls = function () {
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

  // ===== Профиль + Реф-код ===================================================
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

      // ранний биндинг на копирование
      try {
        const btnEarly = document.querySelector('#btnCopyRef');
        if (btnEarly) {
          if (!btnEarly.type) btnEarly.type = 'button';
          if (!btnEarly.dataset.lcInit && !btnEarly.dataset.lcCopyBound) {
            btnEarly.dataset.lcInit = '1'; btnEarly.dataset.lcCopyBound = '1';
            btnEarly.addEventListener('click', async (e) => {
              try { if (e && e.preventDefault) e.preventDefault(); } catch(_) {}
              let copied = false;
              try { await navigator.clipboard.writeText(input.value || ''); copied = true; } catch(_) {}
              if (!copied) {
                try {
                  const ta = document.createElement('textarea');
                  ta.value = input.value || '';
                  ta.style.position='fixed'; ta.style.opacity='0';
                  document.body.appendChild(ta); ta.focus(); ta.select();
                  try { document.execCommand('copy'); copied = true; } catch(_) {}
                  document.body.removeChild(ta);
                } catch(_) {}
              }
              try { if (copied) { btnEarly.textContent='Скопировано'; setTimeout(()=>btnEarly.textContent='Скопировать', 1200); } } catch(_) {}
            });
          }
        }
      } catch(_) {}

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
      if (btn && !btn.dataset.lcCopyBound) { btn.dataset.lcCopyBound='1';
        try { if (!btn.type) btn.type = 'button'; } catch(_) {}
        btn.addEventListener('click', async (e) => {
          try { if (e && e.preventDefault) e.preventDefault(); } catch(_) {}
          let copied = false;
          try {
            await navigator.clipboard.writeText(input.value);
            copied = true;
          } catch(_) {}
          if (!copied) {
            try {
              const ta = document.createElement('textarea');
              ta.value = input.value; ta.style.position='fixed'; ta.style.opacity='0';
              document.body.appendChild(ta); ta.focus(); ta.select();
              try { document.execCommand('copy'); copied = true; } catch(_) {}
              document.body.removeChild(ta);
            } catch(_) {}
          }
          if (copied) {
            try { btn.textContent = 'Скопировано'; setTimeout(()=> btn.textContent = 'Скопировать', 1200); } catch(_) {}
          }
        });
      }
    } catch(e) { console.error('[LC] mountReferral', e?.message||e); }
  };

  // ===== Активные рефералы ===================================================
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

  // НОВАЯ ФУНКЦИЯ: Проверка активного пользователя
  LC.isActiveUser = async function() {
    try {
      const user = await getUser();
      if (!user) return false;
      
      const { data, error } = await sb.from('wallets').select('balance_cents').eq('user_id', user.id).maybeSingle();
      if (error || !data) return false;
      
      return data.balance_cents >= 2900; // 29 USDT в центах
    } catch(e) {
      console.warn('[LC] isActiveUser', e?.message||e);
      return false;
    }
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

  function renderNextLevelGoal(text) {
    const safe = text || '—';
    const el = document.querySelector('[data-next-target]');
    if (el) { el.textContent = safe; return; }
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

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ refreshLevelInfo - убраны дублирующие вызовы
  LC.refreshLevelInfo = async function() {
    try {
      const info = await LC.getLevelInfo(); 
      if (!info) return;
      
      const set = (sel, val) => { 
        const el = $(sel); 
        if (el) el.textContent = String(val); 
      };

      const perView = pickNum(info.reward_per_view_cents)/100;
      const daily   = pickNum(info.daily_reward_cents)/100;
      const base    = pickNum(info.base_amount_cents ?? info.level_base_cents ?? info.base_cents)/100;
      const bp      = pickNum(info.reward_percent_bp ?? info.level_percent_bp ?? info.rate_bp);
      const rate    = bp ? (bp/100) : pickNum(info.level_percent ?? info.rate_percent);

      set('[data-level-name]', info.level_name ?? '');
      set('[data-views-left]', info.views_left_today ?? 0);
      set('[data-reward-per-view]', `${perView.toFixed(2)} USDT`);
      set('[data-daily-reward]', `${daily.toFixed(2)} USDT`);
      set('[data-level-base]', `$${base.toFixed(2)}`);
      set('[data-level-percent]', `${rate.toFixed(2)}%`);

      const badge = $('#perViewBadge'); 
      if (badge) badge.textContent = `+${perView.toFixed(2)} USDT за просмотр`;

      // Обновляем дополнительные поля
      const levelEl = $('[data-level]');
      if (levelEl) levelEl.textContent = info.level_name || '—';
      
      const rateEl = $('[data-rate]');
      if (rateEl) rateEl.textContent = `${rate.toFixed(2)}%`;
      
      const capEl = $('[data-cap]');
      if (capEl) capEl.textContent = `$${base.toFixed(2)}`;
      
      const refsEl = $('[data-refs]');
      if (refsEl && info.total_referrals !== undefined) {
        refsEl.textContent = info.total_referrals;
      }

      const baseCapEl = $('#baseCapCell');
      if (baseCapEl) baseCapEl.textContent = `$${base.toFixed(2)}`;

      // УБРАН ДУБЛИРУЮЩИЙ ВЫЗОВ - используем данные из info
      if (info.next_level_goal) {
        renderNextLevelGoal(info.next_level_goal);
        const nextTargetEl = $('#nextTargetCell');
        if (nextTargetEl) nextTargetEl.textContent = info.next_level_goal;
      } else {
        renderNextLevelGoal('—');
        const nextTargetEl = $('#nextTargetCell');
        if (nextTargetEl) nextTargetEl.textContent = '—';
      }
    } catch(e) { 
      console.error('[LC] refreshLevelInfo', e); 
    }
  };

  // ===== Начисление за просмотр ==============================================
  LC.creditView = async function(videoId, watchedSeconds) {
    const user = await getUser(); 
    if (!user) { 
      alert('Войдите в аккаунт'); 
      return null; 
    }

    // Проверяем активность пользователя
    const isActive = await LC.isActiveUser();
    if (!isActive) {
      alert('Для заработка на просмотрах необходимо пополнить баланс минимум на $29');
      return null;
    }

    const { data, error } = await sb.rpc('credit_view', {
      p_video_id: String(videoId || 'video'),
      p_watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
    });
    
    if (error) { 
      console.error(error); 
      alert(error.message || 'Ошибка начисления'); 
      return null; 
    }
    
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.ok) { 
      alert(row?.message || 'Начисление отклонено'); 
      return null; 
    }
    
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
      p_network: String(method || 'TRC20'),
      p_address: String(address || ''),
      p_currency: 'USDT'
    });
    if (error) { console.error(error); alert('Ошибка запроса вывода'); return; }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.ok) { alert('Заявка отклонена'); return; }
    await LC.refreshBalance();
    alert('Заявка на вывод создана');
    return row;
  };

  LC.cancelWithdrawal = async function(withdrawalId) {
    const user = await getUser(); if (!user) { alert('Войдите в аккаунт'); return; }
    try {
      const { error } = await sb.rpc('user_cancel_withdrawal', { p_id: String(withdrawalId) });
      if (error) { console.error(error); alert('Не удалось отменить заявку'); return; }
      await LC.refreshBalance();
      if (typeof LC.loadWithdrawalsList === 'function') LC.loadWithdrawalsList();
      alert('Заявка отменена');
    } catch (e) {
      console.error(e);
      alert('Не удалось отменить заявку');
    }
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
    if (rec?.id) { 
      const i = $('#createdDepositId'); 
      if (i) i.textContent = rec.id; 
      // Обновляем баланс после пополнения
      setTimeout(() => LC.refreshBalance(), 1000);
    }
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

  // ===== VIP Trading Portal Functions ========================================
  LC.getUserVipData = async function() {
    try {
      const user = await getUser();
      if (!user) return null;
      
      const { data, error } = await sb.rpc('get_user_vip_data');
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting user VIP data:', error);
      return null;
    }
  };

  LC.getVipProfitHistory = async function() {
    try {
      const user = await getUser();
      if (!user) return [];
      
      const { data, error } = await sb.rpc('get_vip_profit_history');
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting VIP profit history:', error);
      return [];
    }
  };

  LC.buyVipLevel = async function(vipLevel, price) {
    try {
      const user = await getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await sb.rpc('buy_vip_level', {
        p_vip_level: vipLevel,
        p_price: price
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error buying VIP level:', error);
      throw error;
    }
  };

  LC.claimVipProfit = async function() {
    try {
      const user = await getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await sb.rpc('claim_vip_profit');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error claiming VIP profit:', error);
      throw error;
    }
  };

  // ===== Виджет «Видео» ======================================================
  const LC_VIDEO_LIST = ['/assets/videos/ad1.MP4','/assets/videos/ad2.MP4','/assets/videos/ad3.MP4','/assets/videos/ad4.MP4','/assets/videos/ad5.MP4','/assets/videos/ad6.MP4','/assets/videos/ad7.MP4','/assets/videos/ad8.MP4','/assets/videos/ad9.MP4','/assets/videos/ad10.MP4','/assets/videos/ad11.MP4','/assets/videos/ad12.MP4','/assets/videos/ad13.mp4','/assets/videos/ad14.mp4','/assets/videos/ad15.mp4','/assets/videos/ad16.mp4','/assets/videos/ad17.mp4','/assets/videos/ad18.MP4','/assets/videos/ad19.MP4','/assets/videos/ad20.MP4'];
  const LC_MIN_SECONDS = 10;

  // НОВАЯ ФУНКЦИЯ: Проверка доступности видео
  const checkVideoAvailability = async () => {
    const startBtn = document.getElementById('startBtn');
    const txt = document.getElementById('progressText');
    const overlay = document.getElementById('limitOverlay');
    
    if (!startBtn || !txt) return;

    const isActive = await LC.isActiveUser();
    const viewsLeft = parseInt(document.querySelector('[data-views-left]')?.textContent || 0);
    
    if (!isActive) {
      txt.textContent = 'Пополните баланс от $29 для заработка';
      startBtn.disabled = true;
      startBtn.textContent = '❌ Неактивный аккаунт';
      if (overlay) {
        overlay.style.display = 'flex';
        overlay.textContent = 'Для заработка пополните баланс от $29';
      }
    } else if (viewsLeft <= 0) {
      txt.textContent = 'Лимит просмотров исчерпан';
      startBtn.disabled = true;
      startBtn.textContent = '⏳ Лимит исчерпан';
      if (overlay) {
        overlay.style.display = 'flex';
        overlay.textContent = 'Лимит просмотров исчерпан';
      }
    } else {
      txt.textContent = 'Нажмите «Заработать за просмотр»';
      startBtn.disabled = false;
      startBtn.textContent = '🎬 Заработать за просмотр';
      if (overlay) overlay.style.display = 'none';
    }
  };

  LC.initVideoWatch = function () {
    const video    = document.getElementById('promoVid');
    const startBtn = document.getElementById('startBtn');
    const bar      = document.getElementById('progressFill');
    const txt      = document.getElementById('progressText');
    const overlay  = document.getElementById('limitOverlay');
    
    if (!video || !startBtn) return;

    if (video.dataset.lcInit === '1') return;
    video.dataset.lcInit = '1';

    let allowed = false, credited = false, acc = 0, lastT = 0;
    let creditPromise = null;

    const ui = (m)=> { if (txt) txt.textContent = m; };
    const setBar = (p)=> { if (bar) bar.style.width = Math.max(0, Math.min(100, p)) + '%'; };
    const pickVideo = ()=> LC_VIDEO_LIST[Math.floor(Math.random()*LC_VIDEO_LIST.length)];

    const reset = ()=> {
      allowed = false; credited = false; acc = 0; lastT = 0;
      video.currentTime = 0; video.pause();
      setBar(0); 
      startBtn.disabled = false; 
      startBtn.textContent = '🎬 Заработать за просмотр';
      
      // Проверяем доступность видео после сброса
      setTimeout(checkVideoAvailability, 100);
    };

    video.addEventListener('loadedmetadata', ()=> {
      const dur = video.duration; if (!dur || dur < 1) { reset(); return; }
      if (allowed) { setBar(0); ui(`Смотрите видео ${Math.round(dur)} сек`); }
    });

    video.addEventListener('timeupdate', ()=> {
      if (!allowed) return;
      const t = video.currentTime, dur = video.duration;
      if (t < 0 || !dur || dur < 1) return;
      const p = Math.max(0, Math.min(100, (t/dur)*100));
      setBar(p);
      if (t > lastT) { acc += (t - lastT); lastT = t; }
      if (acc >= LC_MIN_SECONDS && !credited && !creditPromise) {
        credited = true; 
        creditPromise = (async ()=>{
          const vidId = video.src.split('/').pop() || 'video';
          await LC.creditView(vidId, Math.floor(acc));
          creditPromise = null;
        })();
      }
      if (t >= dur - 0.5) {
        video.pause();
        ui('Начисление завершено');
        startBtn.disabled = false; 
        startBtn.textContent = '🎬 Заработать за просмотр';
        setTimeout(reset, 1500);
      }
    });

    video.addEventListener('ended', ()=> {
      if (!allowed) return;
      video.pause();
      ui('Начисление завершено');
      startBtn.disabled = false; 
      startBtn.textContent = '🎬 Заработать за просмотр';
      setTimeout(reset, 1500);
    });

    startBtn.addEventListener('click', async (e)=> {
      e.preventDefault();
      if (allowed) return;
      
      // Дополнительная проверка активности
      const isActive = await LC.isActiveUser();
      const viewsLeft = parseInt(document.querySelector('[data-views-left]')?.textContent || 0);
      
      if (!isActive) {
        alert('Для заработка на просмотрах необходимо пополнить баланс минимум на $29');
        return;
      }
      
      if (viewsLeft <= 0) {
        alert('Лимит просмотров на сегодня исчерпан');
        return;
      }
      
      video.src = pickVideo(); 
      video.load();
      allowed = true; credited = false; acc = 0; lastT = 0;
      video.play().catch(console.warn);
      ui('Смотрите видео до конца'); 
      setBar(0);
      startBtn.disabled = true; 
      startBtn.textContent = '⏳ Ожидание...';
      if (overlay) overlay.style.display = 'none';
    });

    // Инициализируем проверку доступности при загрузке
    setTimeout(checkVideoAvailability, 500);
    reset();
  };

  // ===== Виджет «Рефералы» ===================================================
  LC.refreshDashboardCards = async function() {
    try {
      const user = await getUser(); if (!user) return;

      const [counts, refs] = await Promise.all([
        LC.getActiveReferralCounts(),
        LC.getActiveReferrals(1, 2900)
      ]);

      const set = (sel, val) => { const el = $(sel); if (el) el.textContent = String(val); };
      set('#gen1Count', counts.gen1);
      set('#gen2Count', counts.gen2);
      set('#gen3Count', counts.gen3);

      const tbody = $('#refTree');
      if (tbody) {
        tbody.innerHTML = '';
        if (!refs.length) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:10px 0;">Нет активных рефералов</td></tr>`;
        } else {
          refs.slice(0, 20).forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${r.generation || 1}</td>
                            <td>${r.email || r.user_email || '—'}</td>
                            <td>${fmtMoney(pickNum(r.capital_cents)/100)}</td>
                            <td>${r.level_name || '—'}</td>
                            <td>${fmtDate(r.created_at)}</td>`;
            tbody.appendChild(tr);
          });
        }
      }
    } catch(e) { console.error('[LC] refreshDashboardCards', e); }
  };

  // ===== Реферальный доход ===================================================
  LC.loadReferralEarnings = async function() {
    try {
      const user = await getUser(); if (!user) return;

      const { data, error } = await sb.rpc('get_referral_earnings');
      if (error) throw error;
      const earnings = Array.isArray(data) ? data : (data ? [data] : []);

      const gen1 = earnings.find(e => e.generation === 1) || {};
      const gen2 = earnings.find(e => e.generation === 2) || {};
      const gen3 = earnings.find(e => e.generation === 3) || {};

      const set = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };
      set('#gen1Cell', fmtMoney(pickNum(gen1.total_cents)/100));
      set('#gen2Cell', fmtMoney(pickNum(gen2.total_cents)/100));
      set('#gen3Cell', fmtMoney(pickNum(gen3.total_cents)/100));

      const total = (pickNum(gen1.total_cents) + pickNum(gen2.total_cents) + pickNum(gen3.total_cents)) / 100;
      set('#refTotalCell', fmtMoney(total));

      const recent = await sb.rpc('get_recent_referral_earnings');
      if (!recent.error && recent.data) {
        const list = $('#refList');
        if (list) {
          list.innerHTML = '';
          const rows = Array.isArray(recent.data) ? recent.data : (recent.data ? [recent.data] : []);
          if (!rows.length) {
            list.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:10px 0;">Нет данных</td></tr>`;
          } else {
            rows.slice(0, 20).forEach(r => {
              const tr = document.createElement('tr');
              tr.innerHTML = `<td>${fmtDate(r.created_at)}</td>
                              <td>${r.generation || 1}</td>
                              <td>${fmtMoney(pickNum(r.amount_cents)/100)}</td>
                              <td>${r.source_email || r.user_email || '—'}</td>`;
              list.appendChild(tr);
            });
          }
        }
      }
    } catch(e) { console.error('[LC] loadReferralEarnings', e); }
  };

  // ===== Инициализация дашборда ==============================================
  LC.initDashboard = async function() {
    try {
      const user = await getUser(); 
      if (!user) { 
        location.href = '/login_single.html'; 
        return; 
      }
      
      await LC.ensureProfile();
      await LC.applyReferral();
      await LC.mountReferral();
      await LC.refreshBalance();
      await LC.refreshLevelInfo();
      await LC.refreshDashboardCards();
      await LC.loadReferralEarnings();
      LC.initVideoWatch();
      LC.subscribeWithdrawalStatus();
      
      // Обновляем информацию каждые 30 секунд
      setInterval(async () => {
        await LC.refreshBalance();
        await LC.refreshLevelInfo();
      }, 30000);
      
    } catch(e) { console.error('[LC] initDashboard', e); }
  };

  // ===== Инициализация страницы вывода =======================================
  LC.initWithdrawPage = async function() {
    try {
      const user = await getUser(); if (!user) { location.href = '/login_single.html'; return; }
      await LC.refreshBalance();
      LC.bindWithdrawControls();
      LC.loadWithdrawalsList();
      LC.subscribeWithdrawalStatus();
    } catch(e) { console.error('[LC] initWithdrawPage', e); }
  };

  // ===== Инициализация страницы пополнения ===================================
  LC.initDepositPage = async function() {
    try {
      const user = await getUser(); if (!user) { location.href = '/login_single.html'; return; }
      await LC.refreshBalance();
      const form = document.getElementById('depositForm');
      if (form && !form.dataset.lcInit) {
        form.dataset.lcInit = '1';
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const amount = parseFloat(document.getElementById('amount')?.value || '0');
          const network = document.getElementById('network')?.value || 'TRC20';
          await LC.createDeposit(Math.round(amount * 100), network, 'USDT');
        });
      }
      const btn = document.getElementById('createDeposit');
      if (btn && !btn.dataset.lcInit) {
        btn.dataset.lcInit = '1';
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const amount = parseFloat(document.getElementById('depAmount')?.value || '0');
          const network = document.getElementById('depNetwork')?.value || 'TRC20';
          await LC.createDeposit(Math.round(amount * 100), network, 'USDT');
        });
      }
    } catch(e) { console.error('[LC] initDepositPage', e); }
  };

  // ===== Автозапуск ==========================================================
  const path = location.pathname;
  if (path.includes('dashboard')) {
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(LC.initDashboard, 50));
  } else if (path.includes('withdraw')) {
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(LC.initWithdrawPage, 50));
  } else if (path.includes('deposit')) {
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(LC.initDepositPage, 50));
  }
})();
