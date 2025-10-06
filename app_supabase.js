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
    REFERRAL_PERCENTS: [13, 5, 1] // 1st, 2nd, 3rd generation
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
      
      const row = Array.isArray(data) ? data[0] : data;
      console.log('Level info response:', row);
      
      return row;
    } catch(e) {
      console.warn('[LC] getLevelInfo', e);
      return null;
    }
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ - КАРТОЧКИ НЕ ПРОПАДАЮТ
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

      // ===== ИСПРАВЛЕННОЕ ОБНОВЛЕНИЕ КАРТОЧЕК УРОВНЕЙ ========================
      try {
        const levelCards = document.querySelectorAll('.level-card-carousel');
        console.log('Found level cards:', levelCards.length);
        
        if (levelCards.length) {
          const currentLevelName = info.level_name?.toLowerCase().replace(' ', '');
          
          console.log('Current active level:', currentLevelName);
          
          levelCards.forEach(card => {
            const cardLevel = card.getAttribute('data-level');
            const statusElement = card.querySelector('.level-status');
            
            // ВСЕГДА ПОКАЗЫВАЕМ КАРТОЧКУ - НИКОГДА НЕ СКРЫВАЕМ
            card.style.display = 'block';
            card.style.visibility = 'visible';
            card.style.opacity = '1';
            
            // Убираем активный класс у всех
            card.classList.remove('active');
            
            // Добавляем активный класс только текущему уровню
            if (cardLevel === currentLevelName) {
              console.log('Setting active level:', cardLevel);
              card.classList.add('active');
              if (statusElement) {
                statusElement.textContent = 'Активен';
                statusElement.style.display = 'block';
              }
            } else {
              if (statusElement) {
                statusElement.style.display = 'none';
              }
            }
          });
        }
      } catch (error) {
        console.error('Error updating level cards:', error);
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

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ - РЕФЕРАЛЬНАЯ ССЫЛКА РАБОТАЕТ
  LC.mountReferral = async function() {
    try {
      const wrap = document.querySelector('#refLinkWrap');
      const input = document.querySelector('#refLink');
      
      console.log('mountReferral started', { wrap, input });

      const user = await getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      // Получаем реферальный код пользователя
      const { data: profile, error } = await sb
        .from('profiles')
        .select('ref_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile error:', error);
        return;
      }

      if (!profile?.ref_code) {
        console.log('No ref code found');
        return;
      }

      // Формируем реферальную ссылку
      const url = new URL(location.origin + '/register_single.html');
      url.searchParams.set('ref', profile.ref_code);
      
      if (input) {
        input.value = url.toString();
        console.log('Ref link set:', input.value);
      }
      
      if (wrap) {
        wrap.style.display = 'block';
        console.log('Ref panel displayed');
      }

      // Настраиваем копирование
      const btn = document.querySelector('#btnCopyRef');
      if (btn) {
        btn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(input.value);
            btn.textContent = 'Скопировано!';
            setTimeout(() => btn.textContent = '📋 Копировать', 2000);
          } catch (err) {
            input.select();
            document.execCommand('copy');
            btn.textContent = 'Скопировано!';
            setTimeout(() => btn.textContent = '📋 Копировать', 2000);
          }
        });
      }
      
      console.log('mountReferral completed successfully');
    } catch(e) { 
      console.error('[LC] mountReferral error', e); 
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

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ - ПОКАЗЫВАЕТ ДОХОДЫ ВСЕХ ПОКОЛЕНИЙ
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

      const set = (sel, val) => { 
        const el = $(sel); 
        if (el) el.textContent = val; 
      };
      
      set('#gen1Cell', fmtMoney(pickNum(gen1.total_cents)/100));
      set('#gen2Cell', fmtMoney(pickNum(gen2.total_cents)/100));
      set('#gen3Cell', fmtMoney(pickNum(gen3.total_cents)/100));

      const total = (pickNum(gen1.total_cents) + pickNum(gen2.total_cents) + pickNum(gen3.total_cents)) / 100;
      set('#refTotalCell', fmtMoney(total));

      console.log('Referral earnings loaded:', { gen1: gen1.total_cents, gen2: gen2.total_cents, gen3: gen3.total_cents, total });

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
    '/assets/videos/ad1.MP4'
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

  // ===== СИСТЕМА ВЫВОДА СРЕДСТВ =====

  // Полная рабочая функция запроса вывода
  LC.requestWithdrawal = async function(amountCents, method = 'TRC20', address = '') {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) {
        alert('❌ Ошибка подключения к базе данных');
        return null;
      }
      
      // Получаем текущего пользователя
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

      // Используем RPC функцию
      const { data, error } = await sb.rpc('request_withdrawal', {
        p_amount_cents: parseInt(amountCents),
        p_network: String(method),
        p_address: String(address),
        p_currency: 'USDT'
      });

      if (error) {
        console.error('❌ Withdrawal RPC error:', error);
        
        // Fallback: создаем заявку напрямую
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
        
        // Списываем средства
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
      
      // Обрабатываем ответ от RPC функции
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

  // Функция проверки возможности вывода
  LC.checkWithdrawalEligibility = async function(userId) {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) return { eligible: false, reason: 'База данных недоступна' };
      
      // Получаем профиль пользователя
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
      
      // Проверяем историю выводов
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
      
      // Первый вывод - минимум 5 дней после регистрации
      if (!hasPreviousWithdrawals && daysSinceRegistration < 5) {
        const daysLeft = 5 - daysSinceRegistration;
        return { 
          eligible: false, 
          reason: `Первый вывод доступен через ${daysLeft} ${daysLeft === 1 ? 'день' : 'дня'} после регистрации` 
        };
      }
      
      // Проверяем последний вывод (не чаще 1 раза в 24 часа)
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
      
      // Проверяем баланс
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

  // Функция загрузки истории выводов
  LC.loadWithdrawalsList = async function() {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) {
        console.error('❌ Supabase not available');
        return;
      }
      
      // Получаем текущего пользователя
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      
      const tbody = document.getElementById('wd-table-body');
      if (!tbody) return;
      
      // Загружаем заявки пользователя
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
      
      // Рендерим таблицу
      data.forEach(withdrawal => {
        const tr = document.createElement('tr');
        const amount = (withdrawal.amount_cents / 100).toFixed(2);
        const date = new Date(withdrawal.created_at).toLocaleString();
        const fee = withdrawal.fee_cents ? (withdrawal.fee_cents / 100).toFixed(2) : '0.00';
        const total = ((withdrawal.amount_cents + (withdrawal.fee_cents || 0)) / 100).toFixed(2);
        
        // Статусы
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
        
        // Можно отменить только pending заявки в течение 5 часов
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
      
      // Добавляем обработчики для кнопок отмены
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

  // ИСПРАВЛЕННАЯ Функция отмены вывода
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
      
      // Используем RPC функцию для отмены
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
      
      // Обновляем интерфейс
      await LC.refreshBalance();
      
    } catch (error) {
      console.error('❌ Cancel withdrawal error:', error);
      alert('❌ Ошибка отмены заявки: ' + error.message);
    }
  };

  // Real-time подписка на выводы
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

  // Инициализация страницы вывода
  LC.initWithdrawPage = async function() {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) {
        console.error('❌ Supabase not available');
        return;
      }
      
      // Проверяем авторизацию
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        window.location.href = 'login_single.html';
        return;
      }
      
      console.log('🚀 Инициализация страницы вывода для пользователя:', user.id);
      
      // Обновляем баланс
      await LC.refreshBalance();
      
      // Загружаем историю выводов
      await LC.loadWithdrawalsList();
      
      // Инициализируем real-time подписку
      await LC.subscribeToWithdrawals();
      
      console.log('✅ Страница вывода успешно инициализирована');
      
    } catch (error) {
      console.error('❌ Withdraw page init error:', error);
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

      console.log('Referral counts:', counts);

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

  // ===== ФУНКЦИИ ДЕПОЗИТОВ =================================================

  // Создание депозита с прикреплением TXID
  LC.createDepositWithTx = async function(amountCents, network = 'TRC20', currency = 'USDT', txid = '') {
    try {
      const user = await getUser();
      if (!user) {
        alert('Войдите в аккаунт');
        return null;
      }

      console.log('🔄 Создание депозита:', {
        userId: user.id,
        amountCents,
        network,
        currency,
        txid
      });

      // Создаем депозит напрямую
      const { data, error } = await sb
        .from('deposits')
        .insert({
          user_id: user.id,
          amount_cents: amountCents,
          network: network,
          currency: currency,
          txid: txid || null,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Ошибка создания депозита:', error);
        alert('❌ Не удалось создать депозит: ' + error.message);
        return null;
      }

      console.log('✅ Депозит создан:', data);
      return { ok: true, id: data.id, message: 'Депозит создан' };
        
    } catch (error) {
      console.error('❌ Ошибка создания депозита:', error);
      alert('❌ Ошибка при создании депозита: ' + error.message);
      return null;
    }
  };

  // Прикрепление TXID к существующему депозиту
  LC.attachTxToDeposit = async function(depositId, txid) {
    try {
      const user = await getUser();
      if (!user) {
        alert('Войдите в аккаунт');
        return null;
      }

      const { data, error } = await sb
        .from('deposits')
        .update({ 
          txid: txid,
          updated_at: new Date().toISOString()
        })
        .eq('id', depositId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Ошибка прикрепления TXID:', error);
        alert('❌ Не удалось прикрепить TXID: ' + error.message);
        return null;
      }

      console.log('✅ TXID прикреплен:', data);
      return data;
        
    } catch (error) {
      console.error('❌ Ошибка прикрепления TXID:', error);
      alert('❌ Ошибка при прикреплении TXID: ' + error.message);
      return null;
    }
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
