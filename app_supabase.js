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

// --- Patch: ensure phone is saved into user metadata on signUp ---
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

// app_supabase.js — полностью переработанный файл
;(function () {
  if (window.__LC_SINGLETON__) {
    try { console.warn('[LC] main app already initialized:', window.__LC_SINGLETON__); } catch(_){}
    return;
  }
  window.__LC_SINGLETON__ = 'app_supabase@2025-09-20';

  // Конфиг + клиент
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

  // ===== УТИЛИТЫ =============================================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
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

  // ===== КОНФИГУРАЦИЯ СИСТЕМЫ =====
  LC.config = {
    MIN_ACTIVE_BALANCE: 2900, // 29 USDT в центах
    DAILY_VIEWS_LIMIT: 5,
    MIN_VIEW_SECONDS: 10,
    LEVELS: [
      { name: 'Starter', min_balance: 2900, min_refs: 0, percent: 2.5, cap: 30000 },
      { name: 'Advanced', min_balance: 30000, min_refs: 5, percent: 3.0, cap: 100000 },
      { name: 'Pro Elite', min_balance: 100000, min_refs: 10, percent: 4.0, cap: 300000 },
      { name: 'Titanium', min_balance: 300000, min_refs: 30, percent: 5.0, cap: 1000000 }
    ],
    REFERRAL_PERCENTS: [13, 5, 1], // 1st, 2nd, 3rd generation
    VIP_LEVELS: [
      { id: 1, name: "Vip1", min_percent: 2.5, max_percent: 3, price: 10000 },
      { id: 2, name: "Vip2", min_percent: 3, max_percent: 3.5, price: 25000 },
      { id: 3, name: "Vip3", min_percent: 4, max_percent: 4.5, price: 100000 },
      { id: 4, name: "Vip4", min_percent: 5, max_percent: 6, price: 500000 },
      { id: 5, name: "Vip5", min_percent: 6, max_percent: 7, price: 1200000 },
      { id: 6, name: "Vip6", min_percent: 7, max_percent: 10, price: 5000000 }
    ]
  };

  // ===== БАЛАНС И АКТИВНОСТЬ ================================================
  LC.refreshBalance = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;
      
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

  LC.isActiveUser = async function() {
    try {
      const user = await getUser();
      if (!user) return false;
      
      const { data, error } = await sb.from('wallets').select('balance_cents').eq('user_id', user.id).maybeSingle();
      if (error || !data) return false;
      
      return data.balance_cents >= LC.config.MIN_ACTIVE_BALANCE;
    } catch(e) {
      console.warn('[LC] isActiveUser', e?.message||e);
      return false;
    }
  };

  // ===== СИСТЕМА УРОВНЕЙ ===================================================
  LC.getLevelInfo = async function() {
    try {
      const { data, error } = await sb.rpc('get_level_info');
      if (error) throw error;
      
      // Функция возвращает таблицу, берем первую строку
      const row = Array.isArray(data) ? data[0] : data;
      console.log('Level info response:', row);
      
      return row;
    } catch(e) {
      console.warn('[LC] getLevelInfo', e);
      return null;
    }
  };

  LC.refreshLevelInfo = async function() {
    try {
      const info = await LC.getLevelInfo(); 
      if (!info) return;
      
      console.log('Refreshing level info:', info);
      
      const set = (sel, val) => { 
        const el = $(sel); 
        if (el) el.textContent = String(val); 
      };

      const perView = pickNum(info.reward_per_view_cents)/100;
      const daily   = pickNum(info.daily_reward_cents)/100;
      const base    = pickNum(info.base_amount_cents)/100;
      const rate    = pickNum(info.level_percent);

      set('[data-level-name]', info.level_name ?? '');
      set('[data-views-left]', info.views_left_today ?? 0);
      set('[data-reward-per-view]', `${perView.toFixed(2)} USDT`);
      set('[data-daily-reward]', `${daily.toFixed(2)} USDT`);
      set('[data-level-base]', `$${base.toFixed(2)}`);
      set('[data-level-percent]', `${rate.toFixed(2)}%`);

      const badge = $('#perViewBadge'); 
      if (badge) badge.textContent = `+${perView.toFixed(2)} USDT за просмотр`;

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

      if (info.next_level_goal) {
        const nextTargetEl = $('#nextTargetCell');
        if (nextTargetEl) nextTargetEl.textContent = info.next_level_goal;
      } else {
        const nextTargetEl = $('#nextTargetCell');
        if (nextTargetEl) nextTargetEl.textContent = '—';
      }
    } catch(e) { 
      console.error('[LC] refreshLevelInfo', e); 
    }
  };

  // ===== НАЧИСЛЕНИЕ ЗА ПРОСМОТР =============================================
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

    console.log('Calling credit_view with:', { videoId, watchedSeconds, userId: user.id });

    try {
      // Сначала проверим текущий уровень и лимиты
      const levelInfo = await LC.getLevelInfo();
      console.log('Current level info before credit:', levelInfo);
      
      if (levelInfo && levelInfo.views_left_today <= 0) {
        alert('Лимит просмотров на сегодня исчерпан');
        return null;
      }

      const { data, error } = await sb.rpc('credit_view', {
        p_video_id: String(videoId || 'video'),
        p_watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
      });
      
      if (error) { 
        console.error('Credit view error:', error); 
        alert(error.message || 'Ошибка начисления'); 
        return null; 
      }
      
      console.log('Credit view response:', data);
      
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.ok) { 
        alert(row?.message || 'Начисление отклонено'); 
        return null; 
      }
      
      // Обновляем интерфейс
      if (typeof row.views_left === 'number') {
        const el = document.querySelector('[data-views-left]');
        if (el) el.textContent = String(row.views_left);
      }
      
      // Обновляем данные
      await LC.refreshBalance();
      await LC.refreshLevelInfo();
      await LC.loadReferralEarnings();
      
      // Показываем уведомление о начислении
      if (row.reward_cents) {
        const reward = (row.reward_cents / 100).toFixed(2);
        alert(`✅ Начислено $${reward} за просмотр!`);
      }
      
      return row;
    } catch (error) {
      console.error('Exception in creditView:', error);
      alert('Ошибка при начислении: ' + error.message);
      return null;
    }
  };

  // ===== РЕФЕРАЛЬНАЯ СИСТЕМА ===============================================
  LC.ensureProfile = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;

      // Проверяем существующий профиль
      const { data: existingProfile } = await sb
        .from('profiles')
        .select('user_id, ref_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) return;

      // Генерируем уникальный реферальный код
      const refCode = 'LC' + Math.random().toString(36).substr(2, 8).toUpperCase();
      
      // Создаем профиль с реферальным кодом
      const { error } = await sb
        .from('profiles')
        .insert({ 
          user_id: user.id, 
          ref_code: refCode,
          created_at: new Date().toISOString()
        });

      if (error && error.code !== '23505') {
        console.warn('[LC] ensureProfile insert error', error);
      }
    } catch(e) { 
      console.warn('[LC] ensureProfile', e?.message||e); 
    }
  };

  LC.applyReferral = async function() {
    try {
      const params = new URLSearchParams(location.search);
      const refParam = params.get('ref') || localStorage.getItem('lc_ref_code');
      if (!refParam) return;

      const user = await getUser();
      if (!user) {
        // Сохраняем код для применения после регистрации
        localStorage.setItem('lc_ref_code', refParam);
        return;
      }

      // Применяем реферальный код
      const { error } = await sb.rpc('apply_referral', { 
        p_ref_code: refParam 
      });

      if (!error) {
        localStorage.removeItem('lc_ref_code');
      }
    } catch(e) {
      console.warn('[LC] applyReferral', e?.message||e);
    }
  };

  LC.mountReferral = async function() {
    try {
      const wrap = document.querySelector('#refLinkWrap');
      const input = document.querySelector('#refLink');
      if (!wrap || !input) return;

      const user = await getUser();
      if (!user) return;

      // Получаем реферальный код пользователя
      const { data: profile } = await sb
        .from('profiles')
        .select('ref_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.ref_code) return;

      // Формируем реферальную ссылку
      const url = new URL(location.origin + '/register_single.html');
      url.searchParams.set('ref', profile.ref_code);
      input.value = url.toString();
      wrap.style.display = 'block';

      // Настраиваем копирование
      const btn = document.querySelector('#btnCopyRef');
      if (btn) {
        btn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(input.value);
            btn.textContent = 'Скопировано!';
            setTimeout(() => btn.textContent = 'Копировать', 2000);
          } catch (err) {
            // Fallback для старых браузеров
            input.select();
            document.execCommand('copy');
            btn.textContent = 'Скопировано!';
            setTimeout(() => btn.textContent = 'Копировать', 2000);
          }
        });
      }
    } catch(e) { 
      console.error('[LC] mountReferral', e?.message||e); 
    }
  };

  // ИСПРАВЛЕННЫЕ ФУНКЦИИ - используем новые функции без фильтра по балансу
  LC.getActiveReferralCounts = async function() {
    try {
      const { data, error } = await sb.rpc('get_referral_counts_active');
      if (error) throw error;
      const row = Array.isArray(data) ? (data[0] || {}) : (data || {});
      return { 
        gen1: Number(row.gen1||0), 
        gen2: Number(row.gen2||0), 
        gen3: Number(row.gen3||0) 
      };
    } catch (e) {
      console.warn('[LC] getActiveReferralCounts', e);
      return { gen1:0, gen2:0, gen3:0 };
    }
  };

  LC.getActiveReferrals = async function(level = 1) {
    try {
      const { data, error } = await sb.rpc('get_referrals_by_generation', {
        p_level: level
      });
      if (error) throw error;
      return Array.isArray(data) ? data : (data ? [data] : []);
    } catch (e) {
      console.warn('[LC] getActiveReferrals', e);
      return [];
    }
  };

  LC.loadReferralEarnings = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;

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

      // Загружаем последние начисления
      const { data: recentData, error: recentError } = await sb.rpc('get_recent_referral_earnings');
      if (!recentError && recentData) {
        const list = $('#refList');
        if (list) {
          list.innerHTML = '';
          const rows = Array.isArray(recentData) ? recentData : (recentData ? [recentData] : []);
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
    } catch(e) { 
      console.error('[LC] loadReferralEarnings', e); 
    }
  };

  // ===== ВИДЕО ПЛЕЙЕР =======================================================
  const LC_VIDEO_LIST = [
    '/assets/videos/ad1.MP4','/assets/videos/ad2.MP4','/assets/videos/ad3.MP4',
    '/assets/videos/ad4.MP4','/assets/videos/ad5.MP4','/assets/videos/ad6.MP4',
    '/assets/videos/ad7.MP4','/assets/videos/ad8.MP4','/assets/videos/ad9.MP4',
    '/assets/videos/ad10.MP4','/assets/videos/ad11.MP4','/assets/videos/ad12.MP4'
  ];

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

    const ui = (m)=> { if (txt) txt.textContent = m; };
    const setBar = (p)=> { if (bar) bar.style.width = Math.max(0, Math.min(100, p)) + '%'; };
    const pickVideo = ()=> LC_VIDEO_LIST[Math.floor(Math.random() * LC_VIDEO_LIST.length)];

    const reset = ()=> {
      allowed = false; credited = false; acc = 0; lastT = 0;
      video.currentTime = 0; video.pause();
      setBar(0); 
      startBtn.disabled = false; 
      startBtn.textContent = '🎬 Заработать за просмотр';
      checkVideoAvailability();
    };

    const checkVideoAvailability = async () => {
      try {
        const isActive = await LC.isActiveUser();
        const levelInfo = await LC.getLevelInfo();
        const viewsLeft = levelInfo ? levelInfo.views_left_today : 0;
        
        console.log('Video availability check:', { isActive, viewsLeft, levelInfo });
        
        if (!isActive) {
          ui('Пополните баланс от $29 для заработка');
          startBtn.disabled = true;
          startBtn.textContent = '❌ Неактивный аккаунт';
          if (overlay) {
            overlay.style.display = 'flex';
            overlay.textContent = 'Для заработка пополните баланс от $29';
          }
        } else if (viewsLeft <= 0) {
          ui('Лимит просмотров исчерпан');
          startBtn.disabled = true;
          startBtn.textContent = '⏳ Лимит исчерпан';
          if (overlay) {
            overlay.style.display = 'flex';
            overlay.textContent = 'Лимит просмотров исчерпан';
          }
        } else {
          ui(`Нажмите «Заработать за просмотр» (осталось: ${viewsLeft})`);
          startBtn.disabled = false;
          startBtn.textContent = '🎬 Заработать за просмотр';
          if (overlay) overlay.style.display = 'none';
        }
      } catch (error) {
        console.error('Error checking video availability:', error);
      }
    };

    video.addEventListener('timeupdate', ()=> {
      if (!allowed) return;
      const t = video.currentTime, dur = video.duration;
      if (t < 0 || !dur || dur < 1) return;
      const p = Math.max(0, Math.min(100, (t/dur)*100));
      setBar(p);
      if (t > lastT) { acc += (t - lastT); lastT = t; }
      
      // Начисляем после 10 секунд просмотра
      if (acc >= LC.config.MIN_VIEW_SECONDS && !credited) {
        credited = true; 
        console.log('Calling creditView with seconds:', Math.floor(acc));
        LC.creditView(video.src.split('/').pop() || 'video', Math.floor(acc));
      }
      
      if (t >= dur - 0.5) {
        video.pause();
        ui('Начисление завершено');
        setTimeout(reset, 1500);
      }
    });

    video.addEventListener('ended', ()=> {
      if (!allowed) return;
      video.pause();
      ui('Начисление завершено');
      setTimeout(reset, 1500);
    });

    startBtn.addEventListener('click', async (e)=> {
      e.preventDefault();
      if (allowed) return;
      
      const isActive = await LC.isActiveUser();
      const levelInfo = await LC.getLevelInfo();
      const viewsLeft = levelInfo ? levelInfo.views_left_today : 0;
      
      console.log('Start button clicked:', { isActive, viewsLeft });
      
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
      
      try {
        await video.play();
        ui('Смотрите видео до конца'); 
        setBar(0);
        startBtn.disabled = true; 
        startBtn.textContent = '⏳ Ожидание...';
        if (overlay) overlay.style.display = 'none';
      } catch (err) {
        console.warn('Autoplay failed:', err);
        reset();
      }
    });

    // Инициализация проверки доступности
    setTimeout(checkVideoAvailability, 500);
    reset();
  };

// ===== ВЫВОД СРЕДСТВ =====================================================
LC.requestWithdrawal = async function(amountCents, method = 'TRC20', address = '') {
    try {
        const user = await getUser();
        if (!user) {
            alert('Войдите в аккаунт');
            return null;
        }

        console.log('Requesting withdrawal:', { amountCents, method, address, userId: user.id });

        // Проверяем минимальную сумму
        if (amountCents < 2900) {
            alert('Минимальная сумма вывода: $29');
            return null;
        }

        // Проверяем баланс
        const { data: wallet, error: walletError } = await sb.from('wallets')
            .select('balance_cents')
            .eq('user_id', user.id)
            .single();

        if (walletError || !wallet) {
            alert('Ошибка проверки баланса');
            return null;
        }

        if (wallet.balance_cents < amountCents) {
            alert('Недостаточно средств на балансе');
            return null;
        }

        // Проверяем возможность вывода по времени
        const eligibility = await LC.checkWithdrawalEligibility(user.id);
        if (!eligibility.eligible) {
            alert(eligibility.reason);
            return null;
        }

        // Используем новую простую функцию без конфликта типов
        const { data, error } = await sb.rpc('create_withdrawal_simple', {
            p_user_id: user.id,
            p_amount_cents: Number(amountCents),
            p_network: String(method || 'TRC20'),
            p_address: String(address || '')
        });

        if (error) {
            console.error('Withdrawal RPC error:', error);
            alert('Ошибка создания заявки: ' + error.message);
            return null;
        }

        console.log('Withdrawal response:', data);

        // Обрабатываем ответ от RPC функции
        const result = Array.isArray(data) ? data[0] : data;
        
        if (!result?.ok) {
            alert(result?.message || 'Заявка отклонена системой');
            return null;
        }

        // Успешное создание заявки
        alert('✅ Заявка на вывод создана и ожидает подтверждения администратора');
        
        // Обновляем интерфейс
        await LC.refreshBalance();
        await LC.loadWithdrawalsList();
        
        return result;

    } catch (error) {
        console.error('Withdrawal request error:', error);
        alert('Ошибка при создании заявки: ' + error.message);
        return null;
    }
};

// Остальные функции остаются без изменений
LC.checkWithdrawalEligibility = async function(userId) {
    try {
        // Получаем профиль пользователя для проверки даты регистрации
        const { data: profile, error: profileError } = await sb
            .from('profiles')
            .select('created_at')
            .eq('user_id', userId)
            .single();
        
        if (profileError) {
            console.error('Profile error:', profileError);
            return { eligible: false, reason: 'Ошибка получения данных профиля' };
        }
        
        const registrationDate = new Date(profile.created_at);
        const now = new Date();
        const daysSinceRegistration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
        
        // Проверяем историю выводов
        const { data: withdrawals, error: withdrawalsError } = await sb
            .from('withdrawals')
            .select('id, created_at, status')
            .eq('user_id', userId)
            .in('status', ['paid', 'pending'])
            .order('created_at', { ascending: false });
        
        if (withdrawalsError) {
            console.error('Withdrawals error:', withdrawalsError);
            return { eligible: false, reason: 'Ошибка проверки истории выводов' };
        }
        
        const successfulWithdrawals = withdrawals ? withdrawals.filter(w => w.status === 'paid') : [];
        const hasSuccessfulWithdrawals = successfulWithdrawals.length > 0;
        
        // Если НЕТ успешных выводов - проверяем 5 дней с регистрации
        if (!hasSuccessfulWithdrawals) {
            if (daysSinceRegistration < 5) {
                const daysLeft = 5 - daysSinceRegistration;
                return { 
                    eligible: false, 
                    reason: `Первый вывод доступен через ${daysLeft} ${LC.getDaysText(daysLeft)} после регистрации` 
                };
            }
        } else {
            // Если ЕСТЬ успешные выводы - проверяем 24 часа с последнего
            const lastWithdrawal = successfulWithdrawals[0];
            const lastWithdrawalDate = new Date(lastWithdrawal.created_at);
            const hoursSinceLastWithdrawal = Math.floor((now - lastWithdrawalDate) / (1000 * 60 * 60));
            
            if (hoursSinceLastWithdrawal < 24) {
                const hoursLeft = 24 - hoursSinceLastWithdrawal;
                return { 
                    eligible: false, 
                    reason: `Следующий вывод доступен через ${hoursLeft} ${LC.getHoursText(hoursLeft)}` 
                };
            }
        }
        
        return { eligible: true };
        
    } catch (error) {
        console.error('Withdrawal eligibility check error:', error);
        return { eligible: false, reason: 'Ошибка проверки возможности вывода' };
    }
};

LC.getDaysText = function(days) {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
};

LC.getHoursText = function(hours) {
    if (hours === 1) return 'час';
    if (hours >= 2 && hours <= 4) return 'часа';
    return 'часов';
};

// Остальные функции (loadWithdrawalsList, cancelWithdrawal, subscribeToWithdrawals, initWithdrawPage) 
// остаются БЕЗ ИЗМЕНЕНИЙ из предыдущего кода
// Удаляем несуществующую функцию и исправляем инициализацию
LC.bindWithdrawControls = function() {
    // Эта функция больше не нужна, логика перенесена в initWithdrawPage
    console.log('bindWithdrawControls is deprecated');
};

// Исправленная инициализация страницы вывода
LC.initWithdrawPage = async function() {
    try {
        const user = await getUser(); 
        if (!user) { 
            location.href = '/login_single.html'; 
            return; 
        }
        
        await LC.refreshBalance();
        await LC.loadWithdrawalsList();
        
        // Инициализируем real-time подписку
        await LC.subscribeToWithdrawals();
        
        // Добавляем обработчик для кнопки вывода
        const withdrawBtn = document.getElementById('withSubmit');
        if (withdrawBtn && !withdrawBtn.dataset.lcBound) {
            withdrawBtn.dataset.lcBound = 'true';
            
            withdrawBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                
                const amountInput = document.getElementById('withAmount');
                const walletInput = document.getElementById('wallet');
                
                if (!amountInput || !walletInput) return;
                
                const amount = parseFloat(amountInput.value);
                const address = walletInput.value.trim();
                
                // Проверка минимальной суммы
                if (!amount || amount < 29) {
                    alert('Минимальная сумма вывода: $29');
                    return;
                }
                
                // Проверка TRC20 адреса
                if (!address || !address.startsWith('T') || address.length < 20) {
                    alert('Введите корректный TRC20-адрес USDT (должен начинаться с T)');
                    return;
                }
                
                // Блокируем кнопку
                withdrawBtn.disabled = true;
                withdrawBtn.textContent = 'Проверка...';
                
                try {
                    // Проверяем возможность вывода
                    const eligibility = await LC.checkWithdrawalEligibility(user.id);
                    if (!eligibility.eligible) {
                        alert(eligibility.reason);
                        return;
                    }
                    
                    withdrawBtn.textContent = 'Создание заявки...';
                    
                    // Создаем заявку
                    await LC.requestWithdrawal(
                        Math.round(amount * 100), 
                        'TRC20', 
                        address
                    );
                    
                    // Очищаем форму после успеха
                    amountInput.value = '';
                    walletInput.value = '';
                    
                } catch (error) {
                    console.error('Withdrawal error:', error);
                } finally {
                    withdrawBtn.disabled = false;
                    withdrawBtn.textContent = 'Отправить заявку';
                }
            });
        }
        
    } catch(e) { 
        console.error('[LC] initWithdrawPage', e); 
    }
};
  // ===== VIP TRADING PORTAL =================================================
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

  // ===== ОБНОВЛЕНИЕ ДАННЫХ ДАШБОРДА ========================================
  LC.refreshDashboardCards = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;

      // Загружаем все 3 поколения рефералов
      const [refs1, refs2, refs3] = await Promise.all([
        LC.getActiveReferrals(1),
        LC.getActiveReferrals(2), 
        LC.getActiveReferrals(3)
      ]);

      const counts = {
        gen1: refs1.length,
        gen2: refs2.length,
        gen3: refs3.length
      };

      const set = (sel, val) => { const el = $(sel); if (el) el.textContent = String(val); };
      set('#gen1Count', counts.gen1);
      set('#gen2Count', counts.gen2);
      set('#gen3Count', counts.gen3);

      // Объединяем все рефералы для таблицы
      const allRefs = [...refs1, ...refs2, ...refs3];
      
      const tbody = $('#refTree');
      if (tbody) {
        tbody.innerHTML = '';
        if (!allRefs.length) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:10px 0;">Нет активных рефералов</td></tr>`;
        } else {
          allRefs.slice(0, 20).forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${r.generation || 1}</td>
                            <td>${r.user_email || '—'}</td>
                            <td>${fmtMoney(pickNum(r.capital_cents)/100)}</td>
                            <td>${r.level_name || '—'}</td>
                            <td>${fmtDate(r.created_at)}</td>`;
            tbody.appendChild(tr);
          });
        }
      }
    } catch(e) { 
      console.error('[LC] refreshDashboardCards', e); 
    }
  };

  // ===== ИНИЦИАЛИЗАЦИЯ ДАШБОРДА ============================================
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
      
      // Обновляем информацию каждые 30 секунд
      setInterval(async () => {
        await LC.refreshBalance();
        await LC.refreshLevelInfo();
      }, 30000);
      
    } catch(e) { 
      console.error('[LC] initDashboard', e); 
    }
  };

  // ===== ИНИЦИАЛИЗАЦИЯ СТРАНИЦ =============================================
  LC.initWithdrawPage = async function() {
    try {
      const user = await getUser(); 
      if (!user) { 
        location.href = '/login_single.html'; 
        return; 
      }
      await LC.refreshBalance();
      LC.bindWithdrawControls();
      LC.loadWithdrawalsList();
    } catch(e) { 
      console.error('[LC] initWithdrawPage', e); 
    }
  };

  LC.initDepositPage = async function() {
    try {
      const user = await getUser(); 
      if (!user) { 
        location.href = '/login_single.html'; 
        return; 
      }
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
    } catch(e) { 
      console.error('[LC] initDepositPage', e); 
    }
  };

  LC.createDeposit = async function(amountCents, network='TRC20', currency='USDT') {
    const user = await getUser(); 
    if (!user) { 
      alert('Войдите в аккаунт'); 
      return; 
    }
    
    const { data, error } = await sb.rpc('create_deposit', {
      p_amount_cents: Math.max(0, Math.floor(amountCents || 0)),
      p_network: String(network || 'TRC20'),
      p_currency: String(currency || 'USDT')
    });
    
    if (error) { 
      console.error(error); 
      alert('Ошибка создания депозита'); 
      return; 
    }
    
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.ok) { 
      alert(row?.message || 'Депозит отклонен'); 
      return; 
    }
    
    alert('Депозит создан');
    return row;
  };

  // ===== АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ ======================================
  const init = function() {
    const path = location.pathname;
    if (path.includes('dashboard')) {
      LC.initDashboard();
    } else if (path.includes('withdraw')) {
      LC.initWithdrawPage();
    } else if (path.includes('deposit')) {
      LC.initDepositPage();
    } else if (path.includes('login') || path.includes('register')) {
      // Автоматически применяем реферальный код после регистрации
      setTimeout(() => {
        LC.applyReferral();
      }, 1000);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

  // Экспортируем объект
  window.LC = LC;
})();
