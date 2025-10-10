(function () {
  // Заглушка для LanguageSwitcher чтобы избежать ошибок
  if (typeof window.LanguageSwitcher === 'undefined') {
    window.LanguageSwitcher = {
      t: function(key) {
        // Просто возвращаем ключ как есть
        return key;
      }
    };
  }

  if (window.__LC_SINGLETON__) {
    try { console.warn('[LC] main app already initialized:', window.__LC_SINGLETON__); } catch(_){}
    return;
  }
  window.__LC_SINGLETON__ = 'app_supabase@2025-09-20';
 
  // ===== ПОДКЛЮЧЕНИЕ ПЕРЕВОДОВ ===============================================
  // Ждем загрузки переводов из внешних файлов
  if (!window.LC_I18N) {
    // Проверяем, есть ли уже загруженные переводы
    if (window.i18n && window.i18n.t) {
      window.LC_I18N = window.i18n;
      console.log('✅ Translations loaded from i18n.js');
    } else {
      // Заглушка на случай если переводы не загрузились
      console.warn('⚠️ Translations not found, using fallback');
      window.LC_I18N = {
        t: (key, params) => {
          // Просто возвращаем ключ - система переводов сама подставит значения
          if (params) {
            let result = key;
            Object.keys(params).forEach(k => {
              result = result.replace(`{${k}}`, params[k]);
            });
            return result;
          }
          return key;
        }
      };
    }
  }
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

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ - ОБНОВЛЯЕТ КАРТОЧКИ С АКТИВНЫМ СТАТУСОМ
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
      if (badge) badge.textContent = `+${perView.toFixed(2)} USDT per view`;

      // Обновляем информационные элементы
      const levelEl = $('[data-level]');
      if (levelEl && !levelEl.closest('.level-card-carousel')) {
        levelEl.textContent = info.level_name || '—';
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
      if (refsEl && info.total_referrals !== undefined && !refsEl.closest('.level-card-carousel')) {
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

      // ВАЖНОЕ ИСПРАВЛЕНИЕ: ОБНОВЛЯЕМ АКТИВНЫЙ СТАТУС НА КАРТОЧКАХ
      this.updateActiveLevelCard(info.level_name);

      console.log('🔄 Level info updated - CARDS UPDATED WITH ACTIVE STATUS');

    } catch(e) { 
      console.error('[LC] refreshLevelInfo', e); 
    }
  };

  // НОВАЯ ФУНКЦИЯ: Обновление активного статуса на карточках уровней
  LC.updateActiveLevelCard = function(currentLevelName) {
    try {
      // Скрываем все статусы "Активен"
      document.querySelectorAll('.level-status').forEach(statusEl => {
        statusEl.style.display = 'none';
      });
      
      // Определяем какая карточка должна быть активной
      const levelMapping = {
        'Starter': 'starter',
        'Advanced': 'advanced', 
        'Pro Elite': 'proelite',
        'Titanium': 'titanium'
      };
      
      const currentLevelKey = levelMapping[currentLevelName];
      if (currentLevelKey) {
        const activeCard = document.querySelector(`.level-card-carousel[data-level="${currentLevelKey}"]`);
        if (activeCard) {
          const statusEl = activeCard.querySelector('.level-status');
          if (statusEl) {
            statusEl.style.display = 'block';
            console.log(`✅ Active level set: ${currentLevelName}`);
          }
        }
      }
    } catch (error) {
      console.error('Error updating active card:', error);
    }
  };

  // ===== НАЧИСЛЕНИЕ ЗА ПРОСМОТР =============================================
  LC.creditView = async function(videoId, watchedSeconds) {
    const user = await getUser(); 
    if (!user) { 
      alert('❌ Please login to your account'); 
      return null; 
    }

    // Проверяем активность пользователя
    const isActive = await LC.isActiveUser();
    if (!isActive) {
      alert('❌ To earn from views, you need to deposit at least $29');
      return null;
    }

    console.log('Calling credit_view with:', { videoId, watchedSeconds, userId: user.id });

    try {
      // Сначала проверим текущий уровень и лимиты
      const levelInfo = await LC.getLevelInfo();
      console.log('Current level info before credit:', levelInfo);
      
      if (levelInfo && levelInfo.views_left_today <= 0) {
        alert('❌ Daily view limit reached');
        return null;
      }

      const { data, error } = await sb.rpc('credit_view', {
        p_video_id: String(videoId || 'video'),
        p_watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
      });
      
      if (error) { 
        console.error('Credit view error:', error); 
        alert('❌ Award error'); 
        return null; 
      }
      
      console.log('Credit view response:', data);
      
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.ok) { 
        alert(row?.message || '❌ Award rejected'); 
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
      if (row.reward_cents) {
        const reward = (row.reward_cents / 100).toFixed(2);
        alert(`✅ $${reward} credited for viewing!`);
      }
      
      return row;
    } catch (error) {
      console.error('Exception in creditView:', error);
      alert('❌ Error during crediting: ' + error.message);
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
            btn.textContent = '✅ Copied!';
            setTimeout(() => btn.textContent = '📋 Copy', 2000);
          } catch (err) {
            input.select();
            document.execCommand('copy');
            btn.textContent = '✅ Copied!';
            setTimeout(() => btn.textContent = '📋 Copy', 2000);
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
      let counts = { gen1: 0, gen2: 0, gen3: 0 };
      
      // Способ 1: Пробуем get_all_referral_counts
      try {
        const { data, error } = await sb.rpc('get_all_referral_counts');
        if (!error && data) {
          const row = Array.isArray(data) ? data[0] : data;
          counts = {
            gen1: Number(row.gen1 || row.lvl1 || 0),
            gen2: Number(row.gen2 || row.lvl2 || 0),
            gen3: Number(row.gen3 || row.lvl3 || 0)
          };
          console.log('✅ Referral counts from get_all_referral_counts:', counts);
        }
      } catch (e1) {
        console.warn('❌ get_all_referral_counts failed:', e1);
      }

      // Способ 2: Если первый не сработал, пробуем get_referral_counts_active
      if (counts.gen1 === 0 && counts.gen2 === 0 && counts.gen3 === 0) {
        try {
          const { data, error } = await sb.rpc('get_referral_counts_active');
          if (!error && data) {
            const row = Array.isArray(data) ? data[0] : data;
            counts = {
              gen1: Number(row.gen1 || row.lvl1 || 0),
              gen2: Number(row.gen2 || row.lvl2 || 0),
              gen3: Number(row.gen3 || row.lvl3 || 0)
            };
            console.log('✅ Referral counts from get_referral_counts_active:', counts);
          }
        } catch (e2) {
          console.warn('❌ get_referral_counts_active failed:', e2);
        }
      }

      // Способ 3: Прямой запрос к таблице referrals
      if (counts.gen1 === 0 && counts.gen2 === 0 && counts.gen3 === 0) {
        try {
          const user = await getUser();
          if (!user) return counts;

          const { data: refs1, error: error1 } = await sb
            .from('referrals')
            .select('id')
            .eq('referrer_id', user.id)
            .eq('generation', 1);

          const { data: refs2, error: error2 } = await sb
            .from('referrals')
            .select('id')
            .eq('referrer_id', user.id)
            .eq('generation', 2);

          const { data: refs3, error: error3 } = await sb
            .from('referrals')
            .select('id')
            .eq('referrer_id', user.id)
            .eq('generation', 3);

          if (!error1) counts.gen1 = refs1?.length || 0;
          if (!error2) counts.gen2 = refs2?.length || 0;
          if (!error3) counts.gen3 = refs3?.length || 0;

          console.log('✅ Referral counts from direct query:', counts);
        } catch (e3) {
          console.warn('❌ Direct referrals query failed:', e3);
        }
      }

      return counts;
    } catch (e) {
      console.warn('[LC] getActiveReferralCounts error:', e);
      return { gen1: 0, gen2: 0, gen3: 0 };
    }
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ - получаем рефералов по поколениям
  LC.getActiveReferrals = async function(level = 1) {
    try {
      const { data, error } = await sb.rpc('get_all_referrals_by_generation', {
        p_level: level
      });
      
      if (error) {
        console.warn('get_all_referrals_by_generation failed, trying alternative:', error);
        // Fallback на альтернативную функцию
        const { data: altData, error: altError } = await sb.rpc('get_referrals_by_generation', {
          p_level: level
        });
        
        if (altError) throw altError;
        return Array.isArray(altData) ? altData : (altData ? [altData] : []);
      }
      
      return Array.isArray(data) ? data : (data ? [data] : []);
    } catch (e) {
      console.warn('[LC] getActiveReferrals', e);
      return [];
    }
  };

  // ===== РЕФЕРАЛЬНАЯ СИСТЕМА - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ ===============
  LC.loadReferralEarnings = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;

      console.log('🔄 Loading referral earnings for user:', user.id);

      let gen1Total = 0;
      let gen2Total = 0;
      let gen3Total = 0;
      let dataFound = false;

      // Способ 1: Пробуем получить данные через get_referral_earnings
      try {
        const { data: refData, error: refError } = await sb.rpc('get_referral_earnings');
        
        if (!refError && refData) {
          console.log('📊 Data from get_referral_earnings:', refData);
          
          const earnings = Array.isArray(refData) ? refData : (refData ? [refData] : []);
          
          earnings.forEach(earning => {
            const generation = earning.generation;
            const totalCents = earning.total_cents || 0;
            
            switch(generation) {
              case 1:
                gen1Total = totalCents;
                break;
              case 2:
                gen2Total = totalCents;
                break;
              case 3:
                gen3Total = totalCents;
                break;
            }
          });
          
          dataFound = true;
          console.log('✅ Data from get_referral_earnings processed:', {
            gen1: gen1Total/100,
            gen2: gen2Total/100,
            gen3: gen3Total/100
          });
        }
      } catch (refErr) {
        console.warn('❌ get_referral_earnings failed:', refErr);
      }

      // Способ 2: Если первый способ не дал ВООБЩЕ данных, пробуем transactions
      if (!dataFound) {
        try {
          const { data: transactions, error: transError } = await sb
            .from('transactions')
            .select('amount_cents, metadata')
            .eq('user_id', user.id)
            .eq('type', 'referral')
            .eq('status', 'completed');

          if (!transError && transactions) {
            console.log('📊 Data from transactions:', transactions);
            
            transactions.forEach(trans => {
              const generation = trans.metadata?.generation || 1;
              const amount = trans.amount_cents || 0;
              
              switch(generation) {
                case 1:
                  gen1Total += amount;
                  break;
                case 2:
                  gen2Total += amount;
                  break;
                case 3:
                  gen3Total += amount;
                  break;
              }
            });
            
            dataFound = true;
            console.log('✅ Data from transactions processed:', {
              gen1: gen1Total/100,
              gen2: gen2Total/100,
              gen3: gen3Total/100
            });
          }
        } catch (transErr) {
          console.warn('❌ Transactions query failed:', transErr);
        }
      }

      // Способ 3: Если все еще нет данных, пробуем ref_income_totals
      if (!dataFound) {
        try {
          const { data: totalsData, error: totalsError } = await sb.rpc('ref_income_totals');
          
          if (!totalsError && totalsData) {
            console.log('📊 Data from ref_income_totals:', totalsData);
            
            const totalsArray = Array.isArray(totalsData) ? totalsData : (totalsData ? [totalsData] : []);
            
            totalsArray.forEach(item => {
              const level = item.lvl;
              const amountUsd = item.amount_usd || 0;
              
              switch(level) {
                case 1:
                  gen1Total = Math.round(amountUsd * 100);
                  break;
                case 2:
                  gen2Total = Math.round(amountUsd * 100);
                  break;
                case 3:
                  gen3Total = Math.round(amountUsd * 100);
                  break;
              }
            });
            
            dataFound = true;
            console.log('✅ Data from ref_income_totals processed:', {
              gen1: gen1Total/100,
              gen2: gen2Total/100,
              gen3: gen3Total/100
            });
          }
        } catch (totalsErr) {
          console.warn('❌ ref_income_totals failed:', totalsErr);
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

      // Обновляем круговые диаграммы на основе данных
      this.updateReferralCharts(gen1Total, gen2Total, gen3Total);

    } catch(e) { 
      console.error('❌ [LC] loadReferralEarnings error:', e); 
    }
  };

  // НОВАЯ ФУНКЦИЯ: Обновление всех диаграмм реферальных доходов
  LC.updateReferralCharts = function(gen1Cents, gen2Cents, gen3Cents) {
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
      console.error('Chart update error:', error);
    }
  };

  // НОВАЯ ФУНКЦИЯ: Обновление внешнего вида всех диаграмм
  LC.updateChartAppearance = function(gen1Percent, gen2Percent, gen3Percent) {
    // Основная диаграмма на дашборде
    const chart = document.querySelector('.referral-chart');
    if (chart) {
      chart.style.background = `conic-gradient(
        var(--primary) 0% ${gen1Percent}%,
        var(--primary-light) ${gen1Percent}% ${gen1Percent + gen2Percent}%,
        #e2e8f0 ${gen1Percent + gen2Percent}% 100%
      )`;
    }
    
    // Диаграмма в модальном окне информации
    const infoDonut = document.getElementById('infoDonutChart');
    if (infoDonut) {
      infoDonut.style.background = `conic-gradient(
        var(--primary) 0% ${gen1Percent}%,
        var(--primary-light) ${gen1Percent}% ${gen1Percent + gen2Percent}%,
        #e2e8f0 ${gen1Percent + gen2Percent}% 100%
      )`;
    }
    
    // Диаграмма в модальном окне рефералов
    const referralDonut = document.getElementById('referralDonutChart');
    if (referralDonut) {
      referralDonut.style.background = `conic-gradient(
        var(--primary) 0% ${gen1Percent}%,
        var(--primary-light) ${gen1Percent}% ${gen1Percent + gen2Percent}%,
        #e2e8f0 ${gen1Percent + gen2Percent}% 100%
      )`;
    }
  };

  // Новая функция для загрузки деталей рефералов в таблицу
  LC.loadReferralDetailsTable = async function() {
    try {
      const user = await getUser();
      if (!user) return;

      const tbody = $('#refTree');
      if (!tbody) return;

      let allRefs = [];

      // Пробуем несколько способов получить данные о рефералах
      try {
        // Способ 1: get_all_referrals_by_generation
        for (let level = 1; level <= 3; level++) {
          try {
            const { data, error } = await sb.rpc('get_all_referrals_by_generation', {
              p_level: level
            });
            
            if (!error && data) {
              const refs = Array.isArray(data) ? data : [data];
              refs.forEach(ref => {
                allRefs.push({
                  ...ref,
                  generation: level
                });
              });
            }
          } catch (levelErr) {
            console.warn(`Failed to get referrals ${level} generation:`, levelErr);
          }
        }
      } catch (method1Err) {
        console.warn('First method of getting referrals failed:', method1Err);
      }

      // Способ 2: Прямой запрос к referrals
      if (allRefs.length === 0) {
        try {
          const { data: referrals, error } = await sb
            .from('referrals')
            .select(`
              generation,
              referred_id,
              created_at,
              profiles:referred_id (email)
            `)
            .eq('referrer_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && referrals) {
            allRefs = referrals.map(ref => ({
              generation: ref.generation,
              user_email: ref.profiles?.email || '—',
              capital_cents: 0,
              level_name: 'Starter',
              created_at: ref.created_at
            }));
          }
        } catch (method2Err) {
          console.warn('Second method of getting referrals failed:', method2Err);
        }
      }

      // Обновляем таблицу
      tbody.innerHTML = '';
      
      if (allRefs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:10px 0;">No active referrals</td></tr>`;
      } else {
        allRefs.slice(0, 20).forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${r.generation || 1}</td>
                          <td>${r.user_email || r.email || '—'}</td>
                          <td>${fmtMoney(pickNum(r.capital_cents || r.balance_cents)/100)}</td>
                          <td>${r.level_name || 'Starter'}</td>
                          <td>${fmtDate(r.created_at || r.joined_at)}</td>`;
          tbody.appendChild(tr);
        });
      }

      console.log('✅ Referrals table updated, records:', allRefs.length);
    } catch (error) {
      console.error('❌ Error loading referrals table:', error);
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
      set('#totalRefsCount', counts.gen1 + counts.gen2 + counts.gen3);

      // Обновляем модальное окно
      set('#gen1CountModal', counts.gen1);
      set('#gen2CountModal', counts.gen2);
      set('#gen3CountModal', counts.gen3);

      console.log('📊 Referral counts updated:', counts);

      // Загружаем детальную информацию о рефералах для таблицы
      await this.loadReferralDetailsTable();

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
      startBtn.textContent = '🎬 Earn by viewing';
      checkVideoAvailability();
    };

    const checkVideoAvailability = async () => {
      try {
        const isActive = await LC.isActiveUser();
        const levelInfo = await LC.getLevelInfo();
        const viewsLeft = levelInfo ? levelInfo.views_left_today : 0;
        
        console.log('Video availability check:', { isActive, viewsLeft, levelInfo });
        
        if (!isActive) {
          ui('Deposit at least $29 to earn');
          startBtn.disabled = true;
          startBtn.textContent = '❌ Inactive account';
          if (overlay) {
            overlay.style.display = 'flex';
            overlay.textContent = 'Deposit at least $29 to earn';
          }
        } else if (viewsLeft <= 0) {
          ui('Daily view limit reached');
          startBtn.disabled = true;
          startBtn.textContent = '⏳ Limit reached';
          if (overlay) {
            overlay.style.display = 'flex';
            overlay.textContent = 'Daily view limit reached';
          }
        } else {
          ui(`Click "Earn by viewing" (left: ${viewsLeft})`);
          startBtn.disabled = false;
          startBtn.textContent = '🎬 Earn by viewing';
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
        ui('Success! Crediting completed');
        setTimeout(reset, 1500);
      }
    });

    video.addEventListener('ended', ()=> {
      if (!allowed) return;
      video.pause();
      ui('Success! Crediting completed');
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
        alert('❌ To earn from views, you need to deposit at least $29');
        return;
      }
      
      if (viewsLeft <= 0) {
        alert('❌ Daily view limit reached');
        return;
      }
      
      video.src = pickVideo(); 
      video.load();
      allowed = true; credited = false; acc = 0; lastT = 0;
      
      try {
        await video.play();
        ui('Watch video till the end'); 
        setBar(0);
        startBtn.disabled = true; 
        startBtn.textContent = '⏳ Processing...';
        if (overlay) overlay.style.display = 'none';
      } catch (err) {
        console.warn('Autoplay failed:', err);
        alert('❌ Autoplay blocked');
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
        alert('❌ Database connection error');
        return null;
      }
      
      // Получаем текущего пользователя
      const { data: { user }, error: userError } = await sb.auth.getUser();
      if (userError || !user) {
        alert('❌ Please login to your account');
        return null;
      }
      
      console.log('🔄 Withdrawal request:', {
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
        console.log('🔄 Trying to create application directly...');
        
        const { data: wallet } = await sb
          .from('wallets')
          .select('balance_cents')
          .eq('user_id', user.id)
          .single();
          
        if (!wallet || wallet.balance_cents < amountCents) {
          alert('❌ Insufficient balance');
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
          console.error('❌ Direct insert error:', directError);
          alert('❌ Failed to create application: ' + directError.message);
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
        
        console.log('✅ Application created directly:', directData);
        
        return { 
          ok: true, 
          message: '✅ Withdrawal application created and sent for processing',
          id: directData.id 
        };
      }

      console.log('✅ Response from RPC function:', data);
      
      // Обрабатываем ответ от RPC функции
      const result = typeof data === 'object' ? data : JSON.parse(data);
      
      if (!result?.ok) {
        alert('❌ ' + (result?.message || 'Application rejected by system'));
        return null;
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Withdrawal request error:', error);
      alert('❌ Error creating application: ' + error.message);
      return null;
    }
  };

  // Функция проверки возможности вывода
  LC.checkWithdrawalEligibility = async function(userId) {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) return { eligible: false, reason: 'Database unavailable' };
      
      // Получаем профиль пользователя
      const { data: profile, error: profileError } = await sb
        .from('profiles')
        .select('created_at')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        console.error('❌ Profile error:', profileError);
        return { eligible: false, reason: 'Error getting profile data' };
      }
      
      const registrationDate = new Date(profile.created_at);
      const now = new Date();
      const daysSinceRegistration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
      
      console.log('📅 Days since registration:', daysSinceRegistration);
      
      // Проверяем историю выводов
      const { data: previousWithdrawals, error: withdrawalsError } = await sb
        .from('withdrawals')
        .select('id, created_at, status')
        .eq('user_id', userId)
        .in('status', ['paid', 'pending'])
        .order('created_at', { ascending: false });
      
      if (withdrawalsError) {
        console.error('❌ Withdrawal history check error:', withdrawalsError);
        return { eligible: false, reason: 'Error checking withdrawal history' };
      }
      
      const hasPreviousWithdrawals = previousWithdrawals && previousWithdrawals.length > 0;
      
      // Первый вывод - минимум 5 дней после регистрации
      if (!hasPreviousWithdrawals && daysSinceRegistration < 5) {
        const daysLeft = 5 - daysSinceRegistration;
        return { 
          eligible: false, 
          reason: `First withdrawal available in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} after registration` 
        };
      }
      
      // Проверяем последний вывод (не чаще 1 раза в 24 часа)
      if (hasPreviousWithdrawals) {
        const lastWithdrawal = previousWithdrawals[0];
        const lastWithdrawalDate = new Date(lastWithdrawal.created_at);
        const hoursSinceLastWithdrawal = Math.floor((now - lastWithdrawalDate) / (1000 * 60 * 60));
        
        console.log('⏰ Hours since last withdrawal:', hoursSinceLastWithdrawal);
        
        if (hoursSinceLastWithdrawal < 24) {
          const hoursLeft = 24 - hoursSinceLastWithdrawal;
          return { 
            eligible: false, 
            reason: `Next withdrawal available in ${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'}` 
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
        return { eligible: false, reason: 'Balance check error' };
      }
      
      if (wallet.balance_cents < 2900) {
        return { eligible: false, reason: 'Minimum withdrawal amount: $29' };
      }
      
      console.log('✅ All checks passed');
      return { eligible: true };
      
    } catch (error) {
      console.error('❌ Withdrawal eligibility check error:', error);
      return { eligible: false, reason: 'Withdrawal eligibility check error' };
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
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No applications yet</td></tr>';
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
            statusBadge = '<span class="pill paid">Paid</span>';
            break;
          case 'rejected':
            statusBadge = '<span class="pill rejected">Rejected</span>';
            break;
          case 'cancelled':
            statusBadge = '<span class="pill rejected">Cancelled</span>';
            break;
          default:
            statusBadge = '<span class="pill pending">Pending</span>';
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
              `<button class="btn bad" data-cancel="${withdrawal.id}">Cancel</button>` : 
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
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading error</td></tr>';
      }
    }
  };

  // ИСПРАВЛЕННАЯ Функция отмены вывода
  LC.cancelWithdrawal = async function(withdrawalId) {
    if (!confirm('Cancel withdrawal application? Funds will return to balance.')) {
      return;
    }
    
    try {
      const sb = window.sb || window.supabase;
      if (!sb) {
        alert('❌ Database connection error');
        return;
      }
      
      // Используем RPC функцию для отмены
      const { data, error } = await sb.rpc('user_cancel_withdrawal', {
        p_id: parseInt(withdrawalId)
      });
      
      if (error) {
        console.error('❌ Cancel withdrawal RPC error:', error);
        throw new Error('Failed to cancel application: ' + error.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Application cancellation error');
      }
      
      alert('✅ ' + (data.message || 'Application cancelled'));
      
      // Обновляем интерфейс
      await LC.refreshBalance();
      
    } catch (error) {
      console.error('❌ Cancel withdrawal error:', error);
      alert('❌ Application cancellation error: ' + error.message);
    }
  };

  // Real-time подписка на выводы
  LC.subscribeToWithdrawals = async function() {
    try {
      const sb = window.sb || window.supabase;
      if (!sb) return;
      
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      
      console.log('🔔 Subscribing to withdrawal updates for user:', user.id);
      
      const channel = sb.channel('withdrawals-' + user.id)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'withdrawals',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('🔄 Received withdrawal update:', payload);
            LC.loadWithdrawalsList();
            LC.refreshBalance();
          }
        )
        .subscribe((status) => {
          console.log('📡 Withdrawal subscription status:', status);
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
      
      console.log('🚀 Withdraw page initialization for user:', user.id);
      
      // Обновляем баланс
      await LC.refreshBalance();
      
      // Загружаем историю выводов
      await LC.loadWithdrawalsList();
      
      // Инициализируем real-time подписку
      await LC.subscribeToWithdrawals();
      
      console.log('✅ Withdraw page successfully initialized');
      
    } catch (error) {
      console.error('❌ Withdraw page init error:', error);
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
      
      console.log('🔄 Dashboard initialization for user:', user.id);
      
      await LC.ensureProfile();
      await LC.applyReferral();
      await LC.mountReferral();
      await LC.refreshBalance();
      await LC.refreshLevelInfo();
      await LC.refreshDashboardCards();
      await LC.loadReferralEarnings();
      LC.initVideoWatch();
      
      console.log('✅ Dashboard successfully initialized');
      
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
      alert('❌ Please login to your account'); 
      return; 
    }
    
    const { data, error } = await sb.rpc('create_deposit', {
      p_amount_cents: Math.max(0, Math.floor(amountCents || 0)),
      p_network: String(network || 'TRC20'),
      p_currency: String(currency || 'USDT')
    });
    
    if (error) { 
      console.error(error); 
      alert('❌ Deposit error'); 
      return; 
    }
    
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.ok) { 
      alert(row?.message || '❌ Deposit rejected'); 
      return; 
    }
    
    alert('✅ Deposit created');
    return row;
  };

  // ===== ФУНКЦИИ ДЕПОЗИТОВ =================================================

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Создание депозита с защитой от дублирования TXID
  LC.createDepositWithTx = async function(amountCents, network = 'TRC20', currency = 'USDT', txid = '') {
    try {
      const user = await getUser();
      if (!user) {
        alert('❌ Please login to your account');
        return null;
      }

      console.log('🔄 Creating deposit:', {
        userId: user.id,
        amountCents,
        network,
        currency,
        txid
      });

      // 🔒 ПРОВЕРКА: Если указан TXID, проверяем его уникальность
      if (txid && txid.trim() !== '') {
        const { data: existingDeposit, error: checkError } = await sb
          .from('deposits')
          .select('id, user_id, status, amount_cents')
          .eq('txid', txid.trim())
          .maybeSingle();

        if (checkError) {
          console.error('❌ TXID check error:', checkError);
        }

        if (existingDeposit) {
          if (existingDeposit.user_id === user.id) {
            alert('❌ This TXID is already used in your another deposit');
          } else {
            alert('❌ This TXID is already used by another user');
          }
          return null;
        }
      }

      // Создаем депозит
      const { data, error } = await sb
        .from('deposits')
        .insert({
          user_id: user.id,
          amount_cents: amountCents,
          network: network,
          currency: currency,
          txid: txid && txid.trim() !== '' ? txid.trim() : null,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Deposit creation error:', error);
        
        // 🔒 Обработка ошибки уникальности TXID
        if (error.code === '23505' && error.message.includes('txid')) {
          alert('❌ This TXID is already used in the system');
          return null;
        }
        
        alert('❌ Failed to create deposit: ' + error.message);
        return null;
      }

      console.log('✅ Deposit created:', data);
      return { 
        ok: true, 
        id: data.id, 
        message: '✅ Deposit created successfully' 
      };
        
    } catch (error) {
      console.error('❌ Deposit creation error:', error);
      alert('❌ Error creating deposit: ' + error.message);
      return null;
    }
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Прикрепление TXID с защитой от дублирования
  LC.attachTxToDeposit = async function(depositId, txid) {
    try {
      const user = await getUser();
      if (!user) {
        alert('❌ Please login to your account');
        return null;
      }

      // 🔒 ПРОВЕРКА: Проверяем уникальность TXID
      if (txid && txid.trim() !== '') {
        const { data: existingDeposit, error: checkError } = await sb
          .from('deposits')
          .select('id, user_id, status')
          .eq('txid', txid.trim())
          .maybeSingle();

        if (checkError) {
          console.error('❌ TXID check error:', checkError);
        }

        if (existingDeposit) {
          if (existingDeposit.user_id === user.id) {
            alert('❌ This TXID is already used in your another deposit');
          } else {
            alert('❌ This TXID is already used by another user');
          }
          return null;
        }
      }

      // 🔒 ПРОВЕРКА: Получаем текущий депозит
      const { data: currentDeposit, error: getError } = await sb
        .from('deposits')
        .select('id, status, txid, user_id')
        .eq('id', depositId)
        .single();

      if (getError || !currentDeposit) {
        alert('❌ Deposit not found');
        return null;
      }

      // 🔒 ПРОВЕРКА: Проверяем владельца депозита
      if (currentDeposit.user_id !== user.id) {
        alert('❌ Access denied');
        return null;
      }

      // 🔒 ПРОВЕРКА: Нельзя изменить подтвержденный депозит
      if (currentDeposit.status !== 'pending') {
        alert('❌ Cannot modify confirmed deposit');
        return null;
      }

      // 🔒 ПРОВЕРКА: Нельзя изменить если уже есть TXID
      if (currentDeposit.txid) {
        alert('❌ TXID already attached to this deposit');
        return null;
      }

      // Обновляем депозит с защитой от race condition
      const { data, error } = await sb
        .from('deposits')
        .update({ 
          txid: txid && txid.trim() !== '' ? txid.trim() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', depositId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .is('txid', null)
        .select()
        .single();

      if (error) {
        console.error('❌ TXID attachment error:', error);
        
        // 🔒 Обработка ошибки уникальности
        if (error.code === '23505' && error.message.includes('txid')) {
          alert('❌ This TXID is already used in the system');
          return null;
        }
        
        alert('❌ Failed to attach TXID: ' + error.message);
        return null;
      }

      console.log('✅ TXID attached:', data);
      return data;
      
    } catch (error) {
      console.error('❌ TXID attachment error:', error);
      alert('❌ Error attaching TXID: ' + error.message);
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
