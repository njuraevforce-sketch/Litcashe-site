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
      const user = await getUser();
      if (!user) return null;

      let levelInfo = null;
      
      // Приоритет 1: get_level_info (основная функция)
      try {
        const { data, error } = await sb.rpc('get_level_info');
        if (!error && data) {
          levelInfo = Array.isArray(data) ? data[0] : data;
          console.log('✅ Level info from get_level_info:', levelInfo);
        }
      } catch (e1) {
        console.warn('get_level_info failed:', e1);
      }

      // Приоритет 2: get_level_info_v2 (резервная)
      if (!levelInfo) {
        try {
          const { data, error } = await sb.rpc('get_level_info_v2');
          if (!error && data) {
            levelInfo = Array.isArray(data) ? data[0] : data;
            console.log('✅ Level info from get_level_info_v2:', levelInfo);
          }
        } catch (e2) {
          console.warn('get_level_info_v2 failed:', e2);
        }
      }

      // Приоритет 3: compute_level (аварийная)
      if (!levelInfo) {
        try {
          const { data, error } = await sb.rpc('compute_level', { _uid: user.id });
          if (!error && data) {
            levelInfo = Array.isArray(data) ? data[0] : data;
            console.log('✅ Level info from compute_level:', levelInfo);
          }
        } catch (e3) {
          console.warn('compute_level failed:', e3);
        }
      }

      return levelInfo;
    } catch(e) {
      console.error('[LC] getLevelInfo', e);
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

      // Обрабатываем разные форматы ответов от разных функций
      const perView = pickNum(info.reward_per_view_cents || info.per_view_reward_cents)/100;
      const daily = pickNum(info.daily_reward_cents)/100;
      const base = pickNum(info.base_amount_cents || info.base_cents || info.capital_cap_cents)/100;
      const rate = pickNum(info.level_percent || info.rate_percent || (info.rate_bp ? info.rate_bp/100 : 0));
      const levelName = info.level_name || 'Starter';
      const viewsLeft = info.views_left_today ?? 0;
      const totalRefs = info.total_referrals || info.refs_total || 0;

      set('[data-level-name]', levelName);
      set('[data-views-left]', viewsLeft);
      set('[data-reward-per-view]', `${perView.toFixed(2)} USDT`);
      set('[data-daily-reward]', `${daily.toFixed(2)} USDT`);
      set('[data-level-base]', `$${base.toFixed(2)}`);
      set('[data-level-percent]', `${rate.toFixed(2)}%`);

      const badge = $('#perViewBadge'); 
      if (badge) badge.textContent = `+${perView.toFixed(2)} USDT за просмотр`;

      // Обновляем только информационные элементы (не карточки карусели)
      const levelEl = $('[data-level]');
      if (levelEl && !levelEl.closest('.level-card-carousel')) {
        levelEl.textContent = levelName;
      }
      
      const rateEl = $('[data-rate]');
      if (rateEl && !rateEl.closest('.level-card-carousel')) {
        rateEl.textContent = `${rate.toFixed(2)}%`;
      }
      
      const capEl = $('[data-cap]');
      if (capEl && !capEl.closest('.level-card-carousel')) {
        capEl.textContent = `$${base.toFixed(2)}`;
      }
      
      const refsEl = $('[data-refs]');
      if (refsEl && !refsEl.closest('.level-card-carousel')) {
        refsEl.textContent = totalRefs;
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

      console.log('🔄 Level info updated - CARDS LEFT UNTOUCHED');

    } catch(e) { 
      console.error('[LC] refreshLevelInfo', e); 
    }
  };

  // ===== НАЧИСЛЕНИЕ ЗА ПРОСМОТР =============================================
  LC.creditView = async function(videoId, watchedSeconds) {
    const user = await getUser(); 
    if (!user) { 
      alert(window.LC_I18N ? window.LC_I18N.t('notification_login_required') : '❌ Войдите в аккаунт'); 
      return null; 
    }

    // Проверяем активность пользователя
    const isActive = await LC.isActiveUser();
    if (!isActive) {
      alert(window.LC_I18N ? window.LC_I18N.t('notification_insufficient_balance') : '❌ Для заработка на просмотрах необходимо пополнить баланс минимум на $29');
      return null;
    }

    console.log('Calling credit_view_v3 with:', { videoId, watchedSeconds, userId: user.id });

    try {
      // Сначала проверим текущий уровень и лимиты
      const levelInfo = await LC.getLevelInfo();
      console.log('Current level info before credit:', levelInfo);
      
      if (levelInfo && levelInfo.views_left_today <= 0) {
        alert(window.LC_I18N ? window.LC_I18N.t('notification_view_limit_reached') : '❌ Лимит просмотров исчерпан');
        return null;
      }

      // Используем credit_view_v3 с правильными параметрами
      const { data, error } = await sb.rpc('credit_view_v3', {
        p_user_id: user.id,
        p_video_id: String(videoId || 'video'),
        p_watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
      });
      
      if (error) { 
        console.error('Credit view error:', error); 
        
        // Fallback: пробуем award_view_v2
        console.log('Trying award_view_v2 as fallback...');
        const { data: fallbackData, error: fallbackError } = await sb.rpc('award_view_v2', {
          p_video_id: String(videoId || 'video'),
          p_watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
        });
        
        if (fallbackError) {
          alert(window.LC_I18N ? window.LC_I18N.t('notification_award_error') : '❌ Ошибка начисления'); 
          return null;
        }
        
        console.log('Fallback award_view_v2 response:', fallbackData);
        data = fallbackData;
      }
      
      console.log('Credit view response:', data);
      
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.ok) { 
        alert(row?.message || (window.LC_I18N ? window.LC_I18N.t('notification_award_error') : '❌ Начисление отклонено')); 
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
      await LC.refreshDashboardCards();
      
      // Показываем уведомление о начислении
      if (row.reward_per_view_cents || row.reward_cents) {
        const rewardCents = row.reward_per_view_cents || row.reward_cents;
        const reward = (rewardCents / 100).toFixed(2);
        alert(window.LC_I18N ? window.LC_I18N.t('notification_award_success', { amount: reward }) : `✅ Начислено $${reward} за просмотр!`);
      }
      
      return row;
    } catch (error) {
      console.error('Exception in creditView:', error);
      alert((window.LC_I18N ? window.LC_I18N.t('notification_award_error') : '❌ Ошибка при начислении') + ': ' + error.message);
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

      // Применяем реферальный код через правильную функцию
      const { data, error } = await sb.rpc('apply_referral_code', { 
        p_ref_code: refParam 
      });

      if (error) {
        console.warn('apply_referral_code failed, trying manual:', error);
        
        // Fallback: manual_apply_referral
        const { data: manualData, error: manualError } = await sb.rpc('manual_apply_referral', {
          p_user_id: user.id,
          p_ref_code: refParam
        });
        
        if (manualError) {
          console.warn('Manual referral application also failed:', manualError);
          return;
        }
      }

      // Успешно применено
      localStorage.removeItem('lc_ref_code');
      console.log('✅ Referral code applied successfully');
      
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
            btn.textContent = window.LC_I18N ? window.LC_I18N.t('notification_copied') : '✅ Скопировано!';
            setTimeout(() => btn.textContent = '📋 Копировать', 2000);
          } catch (err) {
            input.select();
            document.execCommand('copy');
            btn.textContent = window.LC_I18N ? window.LC_I18N.t('notification_copied') : '✅ Скопировано!';
            setTimeout(() => btn.textContent = '📋 Копировать', 2000);
          }
        });
      }
      
      console.log('mountReferral completed successfully');
    } catch(e) { 
      console.error('[LC] mountReferral error', e); 
    }
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ - правильный подсчет рефералов
  LC.getActiveReferralCounts = async function() {
    try {
      const user = await getUser();
      if (!user) return { gen1: 0, gen2: 0, gen3: 0 };

      let counts = { gen1: 0, gen2: 0, gen3: 0 };
      
      // Приоритет 1: get_my_ref_counts (основная функция)
      try {
        const { data, error } = await sb.rpc('get_my_ref_counts');
        if (!error && data) {
          const row = Array.isArray(data) ? data[0] : data;
          counts = {
            gen1: Number(row.gen1 || 0),
            gen2: Number(row.gen2 || 0),
            gen3: Number(row.gen3 || 0)
          };
          console.log('✅ Referral counts from get_my_ref_counts:', counts);
        }
      } catch (e1) {
        console.warn('get_my_ref_counts failed:', e1);
      }

      // Приоритет 2: count_refs (резервная)
      if (counts.gen1 === 0 && counts.gen2 === 0 && counts.gen3 === 0) {
        try {
          const { data, error } = await sb.rpc('count_refs', {
            p_user: user.id
          });
          
          if (!error && data) {
            const row = Array.isArray(data) ? data[0] : data;
            counts = {
              gen1: Number(row.gen1 || 0),
              gen2: Number(row.gen2 || 0),
              gen3: Number(row.gen3 || 0)
            };
            console.log('✅ Referral counts from count_refs:', counts);
          }
        } catch (e2) {
          console.warn('count_refs failed:', e2);
        }
      }

      // Приоритет 3: Прямой запрос к referrals (аварийный)
      if (counts.gen1 === 0 && counts.gen2 === 0 && counts.gen3 === 0) {
        try {
          const { data: refs1 } = await sb
            .from('referrals')
            .select('id')
            .eq('referrer_id', user.id)
            .eq('generation', 1);

          const { data: refs2 } = await sb
            .from('referrals')
            .select('id')
            .eq('referrer_id', user.id)
            .eq('generation', 2);

          const { data: refs3 } = await sb
            .from('referrals')
            .select('id')
            .eq('referrer_id', user.id)
            .eq('generation', 3);

          counts = {
            gen1: refs1?.length || 0,
            gen2: refs2?.length || 0,
            gen3: refs3?.length || 0
          };
          console.log('✅ Referral counts from direct query:', counts);
        } catch (e3) {
          console.warn('Direct referrals query failed:', e3);
        }
      }

      return counts;
    } catch(e) {
      console.warn('[LC] getActiveReferralCounts error:', e);
      return { gen1: 0, gen2: 0, gen3: 0 };
    }
  };

  // ===== РЕФЕРАЛЬНАЯ СИСТЕМА - ИСПРАВЛЕННАЯ ВЕРСИЯ ===============================================
  LC.loadReferralEarnings = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;

      console.log('🔄 Loading referral earnings for user:', user.id);

      let gen1Total = 0, gen2Total = 0, gen3Total = 0;
      let dataFound = false;

      // Приоритет 1: get_referral_earnings_simple (основная функция)
      try {
        const { data, error } = await sb.rpc('get_referral_earnings_simple');
        
        if (!error && data) {
          console.log('📊 Data from get_referral_earnings_simple:', data);
          
          // Эта функция возвращает JSON объект
          if (data.gen1) gen1Total = Math.round(data.gen1 * 100);
          if (data.gen2) gen2Total = Math.round(data.gen2 * 100);
          if (data.gen3) gen3Total = Math.round(data.gen3 * 100);
          
          dataFound = true;
          console.log('✅ Data from get_referral_earnings_simple processed:', {
            gen1: gen1Total/100,
            gen2: gen2Total/100,
            gen3: gen3Total/100
          });
        }
      } catch (e1) {
        console.warn('get_referral_earnings_simple failed:', e1);
      }

      // Приоритет 2: get_referral_earnings (резервная)
      if (!dataFound) {
        try {
          const { data, error } = await sb.rpc('get_referral_earnings');
          
          if (!error && data) {
            console.log('📊 Data from get_referral_earnings:', data);
            
            const earnings = Array.isArray(data) ? data : [data];
            
            earnings.forEach(earning => {
              const generation = earning.generation;
              const totalCents = earning.total_cents || 0;
              
              switch(generation) {
                case 1: gen1Total = totalCents; break;
                case 2: gen2Total = totalCents; break;
                case 3: gen3Total = totalCents; break;
              }
            });
            
            dataFound = true;
            console.log('✅ Data from get_referral_earnings processed:', {
              gen1: gen1Total/100,
              gen2: gen2Total/100,
              gen3: gen3Total/100
            });
          }
        } catch (e2) {
          console.warn('get_referral_earnings failed:', e2);
        }
      }

      // Приоритет 3: my_ref_income_summary (аварийная)
      if (!dataFound) {
        try {
          const { data, error } = await sb.rpc('my_ref_income_summary');
          
          if (!error && data) {
            console.log('📊 Data from my_ref_income_summary:', data);
            
            const row = Array.isArray(data) ? data[0] : data;
            gen1Total = Math.round((row.lvl1_usdt || 0) * 100);
            gen2Total = Math.round((row.lvl2_usdt || 0) * 100);
            gen3Total = Math.round((row.lvl3_usdt || 0) * 100);
            
            dataFound = true;
            console.log('✅ Data from my_ref_income_summary processed:', {
              gen1: gen1Total/100,
              gen2: gen2Total/100,
              gen3: gen3Total/100
            });
          }
        } catch (e3) {
          console.warn('my_ref_income_summary failed:', e3);
        }
      }

      // Обновляем интерфейс ДАЖЕ ЕСЛИ ДАННЫЕ = 0
      const set = (sel, val) => { 
        const el = $(sel); 
        if (el) el.textContent = val; 
      };
      
      // Обновляем основную панель
      set('#gen1Cell', fmtMoney(gen1Total/100));
      set('#gen2Cell', fmtMoney(gen2Total/100));
      set('#gen3Cell', fmtMoney(gen3Total/100));

      const total = (gen1Total + gen2Total + gen3Total) / 100;
      set('#refTotalCell', fmtMoney(total));

      // Обновляем модальное окно
      set('#gen1CellModal', fmtMoney(gen1Total/100));
      set('#gen2CellModal', fmtMoney(gen2Total/100));
      set('#gen3CellModal', fmtMoney(gen3Total/100));
      set('#refTotalCellModal', fmtMoney(total));

      console.log('🎯 Final referral earnings:', { 
        gen1: fmtMoney(gen1Total/100), 
        gen2: fmtMoney(gen2Total/100), 
        gen3: fmtMoney(gen3Total/100), 
        total: fmtMoney(total)
      });

      // Обновляем круговую диаграмму на основе данных
      this.updateReferralChart(gen1Total, gen2Total, gen3Total);

    } catch(e) { 
      console.error('❌ [LC] loadReferralEarnings error:', e); 
    }
  };

  // Функция для обновления круговой диаграммы реферальных доходов
  LC.updateReferralChart = function(gen1Cents, gen2Cents, gen3Cents) {
    try {
      const total = gen1Cents + gen2Cents + gen3Cents;
      
      if (total === 0) {
        // Если нет доходов, показываем равномерное распределение
        this.updateChartAppearance(40, 30, 30);
        return;
      }

      const gen1Percent = Math.round((gen1Cents / total) * 100);
      const gen2Percent = Math.round((gen2Cents / total) * 100);
      const gen3Percent = 100 - gen1Percent - gen2Percent;

      this.updateChartAppearance(gen1Percent, gen2Percent, gen3Percent);
    } catch (error) {
      console.error('Ошибка обновления диаграммы:', error);
    }
  };

  // Функция для обновления внешнего вида диаграммы
  LC.updateChartAppearance = function(gen1Percent, gen2Percent, gen3Percent) {
    const chart = document.querySelector('.referral-chart');
    if (chart) {
      chart.style.background = `conic-gradient(
        var(--primary) 0% ${gen1Percent}%,
        var(--primary-light) ${gen1Percent}% ${gen1Percent + gen2Percent}%,
        #e2e8f0 ${gen1Percent + gen2Percent}% 100%
      )`;
    }
    
    const donutChart = document.querySelector('.donut-chart');
    if (donutChart) {
      donutChart.style.background = `conic-gradient(
        var(--primary) 0% ${gen1Percent}%,
        var(--primary-light) ${gen1Percent}% ${gen1Percent + gen2Percent}%,
        #e2e8f0 ${gen1Percent + gen2Percent}% 100%
      )`;
    }
  };

  // ===== ОБНОВЛЕНИЕ ДАННЫХ ДАШБОРДА ========================================
  LC.refreshDashboardCards = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;

      // Получаем количество рефералов по поколениям
      const counts = await LC.getActiveReferralCounts();

      const set = (sel, val) => { const el = $(sel); if (el) el.textContent = String(val); };
      
      // Обновляем основную панель
      set('#gen1Count', counts.gen1);
      set('#gen2Count', counts.gen2);
      set('#gen3Count', counts.gen3);

      // Обновляем модальное окно
      set('#gen1CountModal', counts.gen1);
      set('#gen2CountModal', counts.gen2);
      set('#gen3CountModal', counts.gen3);

      console.log('📊 Referral counts updated:', counts);

    } catch(e) { 
      console.error('[LC] refreshDashboardCards error:', e); 
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
      startBtn.textContent = window.LC_I18N ? window.LC_I18N.t('dashboard_earn_by_view') : '🎬 Заработать за просмотр';
      checkVideoAvailability();
    };

    const checkVideoAvailability = async () => {
      try {
        const isActive = await LC.isActiveUser();
        const levelInfo = await LC.getLevelInfo();
        const viewsLeft = levelInfo ? levelInfo.views_left_today : 0;
        
        console.log('Video availability check:', { isActive, viewsLeft, levelInfo });
        
        if (!isActive) {
          ui(window.LC_I18N ? window.LC_I18N.t('notification_insufficient_balance') : 'Пополните баланс от $29 для заработка');
          startBtn.disabled = true;
          startBtn.textContent = window.LC_I18N ? window.LC_I18N.t('notification_failed') + ' Неактивный аккаунт' : '❌ Неактивный аккаунт';
          if (overlay) {
            overlay.style.display = 'flex';
            overlay.textContent = window.LC_I18N ? window.LC_I18N.t('notification_insufficient_balance') : 'Для заработка пополните баланс от $29';
          }
        } else if (viewsLeft <= 0) {
          ui(window.LC_I18N ? window.LC_I18N.t('notification_view_limit_reached') : 'Лимит просмотров исчерпан');
          startBtn.disabled = true;
          startBtn.textContent = window.LC_I18N ? window.LC_I18N.t('notification_view_limit_reached') : '⏳ Лимит исчерпан';
          if (overlay) {
            overlay.style.display = 'flex';
            overlay.textContent = window.LC_I18N ? window.LC_I18N.t('notification_view_limit_reached') : 'Лимит просмотров исчерпан';
          }
        } else {
          ui(window.LC_I18N ? window.LC_I18N.t('progress_views_left', { count: viewsLeft }) : `Нажмите «Заработать за просмотр» (осталось: ${viewsLeft})`);
          startBtn.disabled = false;
          startBtn.textContent = window.LC_I18N ? window.LC_I18N.t('dashboard_earn_by_view') : '🎬 Заработать за просмотр';
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
        ui(window.LC_I18N ? window.LC_I18N.t('notification_success') + ' Начисление завершено' : 'Начисление завершено');
        setTimeout(reset, 1500);
      }
    });

    video.addEventListener('ended', ()=> {
      if (!allowed) return;
      video.pause();
      ui(window.LC_I18N ? window.LC_I18N.t('notification_success') + ' Начисление завершено' : 'Начисление завершено');
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
        alert(window.LC_I18N ? window.LC_I18N.t('notification_insufficient_balance') : '❌ Для заработка на просмотрах необходимо пополнить баланс минимум на $29');
        return;
      }
      
      if (viewsLeft <= 0) {
        alert(window.LC_I18N ? window.LC_I18N.t('notification_view_limit_reached') : '❌ Лимит просмотров на сегодня исчерпан');
        return;
      }
      
      video.src = pickVideo(); 
      video.load();
      allowed = true; credited = false; acc = 0; lastT = 0;
      
      try {
        await video.play();
        ui(window.LC_I18N ? window.LC_I18N.t('notification_processing') + ' Смотрите видео до конца' : 'Смотрите видео до конца'); 
        setBar(0);
        startBtn.disabled = true; 
        startBtn.textContent = window.LC_I18N ? window.LC_I18N.t('notification_processing') : '⏳ Ожидание...';
        if (overlay) overlay.style.display = 'none';
      } catch (err) {
        console.warn('Autoplay failed:', err);
        alert(window.LC_I18N ? window.LC_I18N.t('notification_autoplay_blocked') : '❌ Автовоспроизведение заблокировано');
        reset();
      }
    });

    // Инициализация проверки доступности
    setTimeout(checkVideoAvailability, 500);
    reset();
  };

  // ===== СИСТЕМА ВЫВОДА СРЕДСТВ =====

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ - исправлена синтаксическая ошибка
  LC.requestWithdrawal = async function(amountCents, method = 'TRC20', address = '') {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) {
        alert(window.LC_I18N ? window.LC_I18N.t('notification_network_error') : '❌ Ошибка подключения к базе данных');
        return null;
      }
      
      // Получаем текущего пользователя
      const { data: { user }, error: userError } = await sb.auth.getUser();
      if (userError || !user) {
        alert(window.LC_I18N ? window.LC_I18N.t('notification_login_required') : '❌ Войдите в аккаунт');
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
          alert(window.LC_I18N ? window.LC_I18N.t('notification_insufficient_balance') : '❌ Недостаточно средств на балансе');
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
          alert((window.LC_I18N ? window.LC_I18N.t('notification_withdrawal_error') : '❌ Не удалось создать заявку') + ': ' + directError.message);
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
          message: window.LC_I18N ? window.LC_I18N.t('notification_withdrawal_success') : '✅ Заявка на вывод создана и отправлена на обработку администратору',
          id: directData.id 
        };
      }

      console.log('✅ Ответ от RPC функции:', data);
      
      // Обрабатываем ответ от RPC функции
      const result = typeof data === 'object' ? data : JSON.parse(data);
      
      if (!result?.ok) {
        alert('❌ ' + (result?.message || (window.LC_I18N ? window.LC_I18N.t('notification_withdrawal_error') : 'Заявка отклонена системой')));
        return null;
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Withdrawal request error:', error);
      alert((window.LC_I18N ? window.LC_I18N.t('notification_withdrawal_error') : '❌ Ошибка при создании заявки') + ': ' + error.message);
      return null;
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
      
      console.log('🔄 Initializing dashboard for user:', user.id);
      
      // Последовательная инициализация с задержками
      await LC.ensureProfile();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await LC.applyReferral();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await LC.mountReferral();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await LC.refreshBalance();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await LC.refreshLevelInfo();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await LC.refreshDashboardCards();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await LC.loadReferralEarnings();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      LC.initVideoWatch();
      
      console.log('✅ Dashboard successfully initialized');
      
      // Периодическое обновление
      setInterval(async () => {
        await LC.refreshBalance();
        await LC.refreshLevelInfo();
        await LC.loadReferralEarnings();
      }, 30000);
      
    } catch(e) { 
      console.error('[LC] initDashboard error:', e); 
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
