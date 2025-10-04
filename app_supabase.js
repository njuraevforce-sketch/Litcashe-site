;(function(){
  if (window.__LC_SINGLETON__) {
    try { console.warn('[LC] app_supabase уже инициализирован'); } catch(_){}
    return;
  }
  window.__LC_SINGLETON__ = 'app_supabase@2025-09-20-fixed-registration';

  // ===== КОНФИГУРАЦИЯ =====
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('[LC] Отсутствует конфигурация Supabase');
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[LC] Библиотека supabase-js не найдена');
    return;
  }

  // Инициализация клиента Supabase
  const sb = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
    { 
      auth: { 
        persistSession: true, 
        autoRefreshToken: true, 
        detectSessionInUrl: true 
      } 
    }
  );
  window.sb = sb;
  window.supabaseClient = sb;

  // ===== УТИЛИТЫ =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const fmtMoney = (v) => `$${Number(v || 0).toFixed(2)}`;
  const fmtDate = (iso) => { 
    try { 
      return new Date(iso).toLocaleString('ru-RU'); 
    } catch { 
      return iso || ''; 
    }
  };
  const pickNum = (v, d = 0) => { 
    const n = Number(v); 
    return Number.isFinite(n) ? n : d; 
  };

  async function getUser() {
    const { data, error } = await sb.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  // Глобальный объект Litcash
  const LC = window.LC = window.LC || {};

  // ===== КОНФИГУРАЦИЯ СИСТЕМЫ =====
  LC.config = {
    MIN_ACTIVE_BALANCE: 2900,
    DAILY_VIEWS_LIMIT: 5,
    MIN_VIEW_SECONDS: 10,
    LEVELS: [
      { name: 'Starter', min_balance: 2900, min_refs: 0, percent: 2.5, cap: 30000 },
      { name: 'Advanced', min_balance: 30000, min_refs: 5, percent: 3.0, cap: 100000 },
      { name: 'Pro Elite', min_balance: 100000, min_refs: 10, percent: 4.0, cap: 300000 },
      { name: 'Titanium', min_balance: 300000, min_refs: 30, percent: 5.0, cap: 1000000 }
    ],
    REFERRAL_PERCENTS: [13, 5, 1],
    VIP_LEVELS: [
      { id: 1, name: "Vip1", min_percent: 2.5, max_percent: 3, price: 10000 },
      { id: 2, name: "Vip2", min_percent: 3, max_percent: 3.5, price: 25000 },
      { id: 3, name: "Vip3", min_percent: 4, max_percent: 4.5, price: 100000 },
      { id: 4, name: "Vip4", min_percent: 5, max_percent: 6, price: 500000 },
      { id: 5, name: "Vip5", min_percent: 6, max_percent: 7, price: 1200000 },
      { id: 6, name: "Vip6", min_percent: 7, max_percent: 10, price: 5000000 }
    ]
  };

  // ===== ИСПРАВЛЕНИЯ ДЛЯ РЕГИСТРАЦИИ =====

  // ГАРАНТИРОВАННОЕ СОЗДАНИЕ ПРОФИЛЯ И КОШЕЛЬКА
  LC.ensureUserProfile = async function(user) {
    try {
      if (!user) {
        console.error('Нет пользователя для создания профиля');
        return false;
      }

      console.log('Создание профиля для пользователя:', user.id);

      // Проверяем существующий профиль
      const { data: existingProfile, error: profileError } = await sb
        .from('profiles')
        .select('user_id, ref_code, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Ошибка проверки профиля:', profileError);
        return false;
      }

      let profile = existingProfile;

      // Создаем профиль если не существует
      if (!profile) {
        const refCode = 'LC' + Math.random().toString(36).substr(2, 8).toUpperCase();
        console.log('Создаем новый профиль с кодом:', refCode);

        const { data: newProfile, error: createError } = await sb
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            ref_code: refCode,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Ошибка создания профиля:', createError);
          return false;
        }

        profile = newProfile;
        console.log('Профиль создан:', profile);
      } else {
        console.log('Профиль уже существует:', profile);
      }

      // Проверяем и создаем кошелек
      const { data: wallet, error: walletError } = await sb
        .from('wallets')
        .select('user_id, balance_cents')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError) {
        console.error('Ошибка проверки кошелька:', walletError);
        return false;
      }

      if (!wallet) {
        console.log('Создаем новый кошелек');
        const { error: walletCreateError } = await sb
          .from('wallets')
          .insert({
            user_id: user.id,
            balance_cents: 0,
            updated_at: new Date().toISOString()
          });

        if (walletCreateError) {
          console.error('Ошибка создания кошелька:', walletCreateError);
          return false;
        }
        console.log('Кошелек создан');
      } else {
        console.log('Кошелек уже существует');
      }

      return true;
    } catch (error) {
      console.error('Критическая ошибка в ensureUserProfile:', error);
      return false;
    }
  };

  // ОБРАБОТКА ПОСЛЕ РЕГИСТРАЦИИ
  LC.handlePostRegistration = async function(user) {
    try {
      console.log('Обработка пост-регистрации для:', user.id);
      
      // Создаем профиль и кошелек
      const profileCreated = await LC.ensureUserProfile(user);
      
      if (!profileCreated) {
        console.error('Не удалось создать профиль/кошелек');
        return false;
      }

      // Применяем реферальный код
      await LC.applyReferralCode();

      console.log('Пост-регистрация завершена успешно');
      return true;
    } catch (error) {
      console.error('Ошибка пост-регистрации:', error);
      return false;
    }
  };

  // ПРИМЕНЕНИЕ РЕФЕРАЛЬНОГО КОДА
  LC.applyReferralCode = async function() {
    try {
      const refCode = localStorage.getItem('lc_ref_code');
      if (!refCode) {
        console.log('Реферальный код не найден');
        return;
      }

      const user = await getUser();
      if (!user) {
        console.log('Пользователь не авторизован для применения реферального кода');
        return;
      }

      console.log('Применяем реферальный код:', refCode);

      const { data, error } = await sb.rpc('apply_referral_code', {
        p_ref_code: refCode
      });

      if (error) {
        console.error('Ошибка применения реферального кода:', error);
        return;
      }

      if (data && data.success) {
        console.log('Реферальный код успешно применен');
        localStorage.removeItem('lc_ref_code');
      } else {
        console.warn('Реферальный код не применен:', data?.message);
      }
    } catch (error) {
      console.error('Ошибка в applyReferralCode:', error);
    }
  };

  // ===== СУЩЕСТВУЮЩИЕ ФУНКЦИИ (БЕЗ ИЗМЕНЕНИЙ) =====

  // БАЛАНС И АКТИВНОСТЬ
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

  // СИСТЕМА УРОВНЕЙ
  LC.getLevelInfo = async function() {
    try {
      const { data, error } = await sb.rpc('get_level_info');
      if (error) throw error;
      
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

  // НАЧИСЛЕНИЕ ЗА ПРОСМОТР
  LC.creditView = async function(videoId, watchedSeconds) {
    const user = await getUser(); 
    if (!user) { 
      alert('Войдите в аккаунт'); 
      return null; 
    }

    const isActive = await LC.isActiveUser();
    if (!isActive) {
      alert('Для заработка на просмотрах необходимо пополнить баланс минимум на $29');
      return null;
    }

    console.log('Calling credit_view with:', { videoId, watchedSeconds, userId: user.id });

    try {
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
      
      if (typeof row.views_left === 'number') {
        const el = document.querySelector('[data-views-left]');
        if (el) el.textContent = String(row.views_left);
      }
      
      await LC.refreshBalance();
      await LC.refreshLevelInfo();
      await LC.loadReferralEarnings();
      
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

  // РЕФЕРАЛЬНАЯ СИСТЕМА
  LC.ensureProfile = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;

      const { data: existingProfile } = await sb
        .from('profiles')
        .select('user_id, ref_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) return;

      const refCode = 'LC' + Math.random().toString(36).substr(2, 8).toUpperCase();
      
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
        localStorage.setItem('lc_ref_code', refParam);
        return;
      }

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

      const { data: profile } = await sb
        .from('profiles')
        .select('ref_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.ref_code) return;

      const url = new URL(location.origin + '/register_single.html');
      url.searchParams.set('ref', profile.ref_code);
      input.value = url.toString();
      wrap.style.display = 'block';

      const btn = document.querySelector('#btnCopyRef');
      if (btn) {
        btn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(input.value);
            btn.textContent = 'Скопировано!';
            setTimeout(() => btn.textContent = 'Копировать', 2000);
          } catch (err) {
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

  // ВИДЕО ПЛЕЙЕР
  const LC_VIDEO_LIST = ['/assets/videos/ad1.MP4'];

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

    setTimeout(checkVideoAvailability, 500);
    reset();
  };

  // СИСТЕМА ВЫВОДА СРЕДСТВ
  LC.requestWithdrawal = async function(amountCents, method = 'TRC20', address = '') {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) {
        alert('❌ Ошибка подключения к базе данных');
        return null;
      }
      
      const { data: { user }, error: userError } = await sb.auth.getUser();
      if (userError || !user) {
        alert('❌ Войдите в аккаунт');
        return null;
      }
      
      console.log('🔄 Запрос вывода:', {
        userId: user.id,
        amountCents,
        method,
        address
      });

      const { data, error } = await sb.rpc('request_withdrawal', {
        p_amount_cents: parseInt(amountCents),
        p_network: String(method),
        p_address: String(address),
        p_currency: 'USDT'
      });

      if (error) {
        console.error('❌ Withdrawal RPC error:', error);
        
        console.log('🔄 Пробуем создать заявку напрямую...');
        
        const { data: wallet } = await sb
          .from('wallets')
          .select('balance_cents')
          .eq('user_id', user.id)
          .single();
          
        if (!wallet || wallet.balance_cents < amountCents) {
          alert('❌ Недостаточно средств на балансе');
          return null;
        }
        
        const { data: directData, error: directError } = await sb
          .from('withdrawals')
          .insert({
            user_id: user.id,
            amount_cents: amountCents,
            network: method,
            address: address,
            currency: 'USDT',
            status: 'pending',
            fee_cents: 0,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (directError) {
          console.error('❌ Ошибка прямой вставки:', directError);
          alert('❌ Не удалось создать заявку: ' + directError.message);
          return null;
        }
        
        await sb
          .from('wallets')
          .update({ 
            balance_cents: wallet.balance_cents - amountCents,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        console.log('✅ Заявка создана напрямую:', directData);
        
        return { 
          ok: true, 
          message: 'Заявка на вывод создана и отправлена на обработку администратору',
          id: directData.id 
        };
      }

      console.log('✅ Ответ от RPC функции:', data);
      
      const result = typeof data === 'object' ? data : JSON.parse(data);
      
      if (!result?.ok) {
        alert('❌ ' + (result?.message || 'Заявка отклонена системой'));
        return null;
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Withdrawal request error:', error);
      alert('❌ Ошибка при создании заявки: ' + error.message);
      return null;
    }
  };

  LC.checkWithdrawalEligibility = async function(userId) {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) return { eligible: false, reason: 'База данных недоступна' };
      
      const { data: profile, error: profileError } = await sb
        .from('profiles')
        .select('created_at')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        console.error('❌ Ошибка профиля:', profileError);
        return { eligible: false, reason: 'Ошибка получения данных профиля' };
      }
      
      const registrationDate = new Date(profile.created_at);
      const now = new Date();
      const daysSinceRegistration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
      
      console.log('📅 Дней с регистрации:', daysSinceRegistration);
      
      const { data: previousWithdrawals, error: withdrawalsError } = await sb
        .from('withdrawals')
        .select('id, created_at, status')
        .eq('user_id', userId)
        .in('status', ['paid', 'pending'])
        .order('created_at', { ascending: false });
      
      if (withdrawalsError) {
        console.error('❌ Ошибка проверки истории выводов:', withdrawalsError);
        return { eligible: false, reason: 'Ошибка проверки истории выводов' };
      }
      
      const hasPreviousWithdrawals = previousWithdrawals && previousWithdrawals.length > 0;
      
      if (!hasPreviousWithdrawals && daysSinceRegistration < 5) {
        const daysLeft = 5 - daysSinceRegistration;
        return { 
          eligible: false, 
          reason: `Первый вывод доступен через ${daysLeft} ${daysLeft === 1 ? 'день' : 'дня'} после регистрации` 
        };
      }
      
      if (hasPreviousWithdrawals) {
        const lastWithdrawal = previousWithdrawals[0];
        const lastWithdrawalDate = new Date(lastWithdrawal.created_at);
        const hoursSinceLastWithdrawal = Math.floor((now - lastWithdrawalDate) / (1000 * 60 * 60));
        
        console.log('⏰ Часов с последнего вывода:', hoursSinceLastWithdrawal);
        
        if (hoursSinceLastWithdrawal < 24) {
          const hoursLeft = 24 - hoursSinceLastWithdrawal;
          return { 
            eligible: false, 
            reason: `Следующий вывод доступен через ${hoursLeft} ${hoursLeft === 1 ? 'час' : 'часов'}` 
          };
        }
      }
      
      const { data: wallet, error: walletError } = await sb
        .from('wallets')
        .select('balance_cents')
        .eq('user_id', userId)
        .single();
        
      if (walletError || !wallet) {
        return { eligible: false, reason: 'Ошибка проверки баланса' };
      }
      
      if (wallet.balance_cents < 2900) {
        return { eligible: false, reason: 'Минимальная сумма для вывода: $29' };
      }
      
      console.log('✅ Все проверки пройдены');
      return { eligible: true };
      
    } catch (error) {
      console.error('❌ Ошибка проверки возможности вывода:', error);
      return { eligible: false, reason: 'Ошибка проверки возможности вывода' };
    }
  };

  LC.loadWithdrawalsList = async function() {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) {
        console.error('❌ Supabase not available');
        return;
      }
      
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      
      const tbody = document.getElementById('wd-table-body');
      if (!tbody) return;
      
      const { data, error } = await sb
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      tbody.innerHTML = '';
      
      if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Пока нет заявок</td></tr>';
        return;
      }
      
      data.forEach(withdrawal => {
        const tr = document.createElement('tr');
        const amount = (withdrawal.amount_cents / 100).toFixed(2);
        const date = new Date(withdrawal.created_at).toLocaleString();
        const fee = withdrawal.fee_cents ? (withdrawal.fee_cents / 100).toFixed(2) : '0.00';
        const total = ((withdrawal.amount_cents + (withdrawal.fee_cents || 0)) / 100).toFixed(2);
        
        let statusBadge = '';
        switch (withdrawal.status) {
          case 'paid':
            statusBadge = '<span class="pill paid">Выплачено</span>';
            break;
          case 'rejected':
            statusBadge = '<span class="pill rejected">Отклонено</span>';
            break;
          case 'cancelled':
            statusBadge = '<span class="pill rejected">Отменено</span>';
            break;
          default:
            statusBadge = '<span class="pill pending">Ожидание</span>';
        }
        
        const canCancel = withdrawal.status === 'pending' && 
          (Date.now() - new Date(withdrawal.created_at).getTime()) < 5 * 3600 * 1000;
        
        tr.innerHTML = `
          <td>${date}</td>
          <td class="right">${total} $</td>
          <td>${withdrawal.network || 'TRC20'}</td>
          <td>${statusBadge}</td>
          <td>${withdrawal.txid ? `<code title="${withdrawal.txid}">${withdrawal.txid.substring(0, 8)}...</code>` : '—'}</td>
          <td>
            ${canCancel ? 
              `<button class="btn bad" data-cancel="${withdrawal.id}">Отменить</button>` : 
              '<span class="small muted">—</span>'
            }
          </td>
        `;
        tbody.appendChild(tr);
      });
      
      tbody.querySelectorAll('[data-cancel]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const withdrawalId = e.target.getAttribute('data-cancel');
          await LC.cancelWithdrawal(withdrawalId);
        });
      });
      
    } catch (error) {
      console.error('❌ Load withdrawals error:', error);
      const tbody = document.getElementById('wd-table-body');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Ошибка загрузки</td></tr>';
      }
    }
  };

  LC.cancelWithdrawal = async function(withdrawalId) {
    if (!confirm('Отменить заявку на вывод? Средства вернутся на баланс.')) {
      return;
    }
    
    try {
      const sb = window.sb || window.supabase;
      if (!sb) {
        alert('❌ Ошибка подключения к базе данных');
        return;
      }
      
      const { data, error } = await sb.rpc('user_cancel_withdrawal', {
        p_id: parseInt(withdrawalId)
      });
      
      if (error) {
        console.error('❌ Cancel withdrawal RPC error:', error);
        throw new Error('Не удалось отменить заявку: ' + error.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Ошибка отмены заявки');
      }
      
      alert('✅ ' + (data.message || 'Заявка отменена'));
      
      await LC.refreshBalance();
      
    } catch (error) {
      console.error('❌ Cancel withdrawal error:', error);
      alert('❌ Ошибка отмены заявки: ' + error.message);
    }
  };

  LC.subscribeToWithdrawals = async function() {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) return;
      
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      
      console.log('🔔 Подписываемся на обновления выводов для пользователя:', user.id);
      
      const channel = sb.channel('withdrawals-' + user.id)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'withdrawals',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('🔄 Получено обновление вывода:', payload);
            LC.loadWithdrawalsList();
            LC.refreshBalance();
          }
        )
        .subscribe((status) => {
          console.log('📡 Статус подписки на выводы:', status);
        });
      
      return channel;
    } catch (error) {
      console.error('❌ Subscribe to withdrawals error:', error);
    }
  };

  LC.initWithdrawPage = async function() {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) {
        console.error('❌ Supabase not available');
        return;
      }
      
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        window.location.href = 'login_single.html';
        return;
      }
      
      console.log('🚀 Инициализация страницы вывода для пользователя:', user.id);
      
      await LC.refreshBalance();
      await LC.loadWithdrawalsList();
      await LC.subscribeToWithdrawals();
      
      console.log('✅ Страница вывода успешно инициализирована');
      
    } catch (error) {
      console.error('❌ Withdraw page init error:', error);
    }
  };

  // VIP TRADING PORTAL
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

  // ОБНОВЛЕНИЕ ДАННЫХ ДАШБОРДА
  LC.refreshDashboardCards = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;

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

  // ИНИЦИАЛИЗАЦИЯ ДАШБОРДА
  LC.initDashboard = async function() {
    try {
      const user = await getUser(); 
      if (!user) { 
        location.href = '/login_single.html'; 
        return; 
      }
      
      // ИСПРАВЛЕНИЕ: Используем новую функцию для гарантированного создания профиля
      await LC.ensureUserProfile(user);
      
      await LC.applyReferral();
      await LC.mountReferral();
      await LC.refreshBalance();
      await LC.refreshLevelInfo();
      await LC.refreshDashboardCards();
      await LC.loadReferralEarnings();
      LC.initVideoWatch();
      
      setInterval(async () => {
        await LC.refreshBalance();
        await LC.refreshLevelInfo();
      }, 30000);
      
    } catch(e) { 
      console.error('[LC] initDashboard', e); 
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

  // АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ
  const init = function() {
    const path = location.pathname;
    if (path.includes('dashboard')) {
      LC.initDashboard();
    } else if (path.includes('withdraw')) {
      LC.initWithdrawPage();
    } else if (path.includes('deposit')) {
      LC.initDepositPage();
    } else if (path.includes('login') || path.includes('register')) {
      setTimeout(() => {
        LC.applyReferralCode();
      }, 1000);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

  window.LC = LC;
  
  console.log('Litcash App Supabase инициализирован с исправлениями для регистрации');
})();
