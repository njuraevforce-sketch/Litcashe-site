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
    MIN_ACTIVE_BALANCE: 2900,
    DAILY_VIEWS_LIMIT: 5,
    MIN_VIEW_SECONDS: 10,
    LEVELS: [
      { name: 'Starter', min_balance: 2900, min_refs: 0, percent: 2.5, cap: 30000 },
      { name: 'Advanced', min_balance: 30000, min_refs: 5, percent: 3.0, cap: 100000 },
      { name: 'Pro Elite', min_balance: 100000, min_refs: 10, percent: 4.0, cap: 300000 },
      { name: 'Titanium', min_balance: 300000, min_refs: 30, percent: 5.0, cap: 1000000 }
    ],
    REFERRAL_PERCENTS: [13, 5, 1]
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

  // ⭐ ИСПРАВЛЕННАЯ ФУНКЦИЯ - ТОЛЬКО СТАТУС "АКТИВЕН"
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

      // ⭐ ОБНОВЛЕНИЕ КАРТОЧЕК - ТОЛЬКО СТАТУС
      try {
        const levelCards = document.querySelectorAll('.level-card-carousel');
        console.log('Found level cards:', levelCards.length);
        
        if (levelCards.length) {
          const currentLevelName = info.level_name?.toLowerCase().replace(/\s+/g, '');
          
          console.log('Current active level:', currentLevelName);
          
          levelCards.forEach(card => {
            const cardLevel = card.getAttribute('data-level');
            const statusElement = card.querySelector('.level-status');
            
            // ⭐ ВАЖНО: НЕ МЕНЯЕМ КЛАССЫ, НЕ ТРОГАЕМ СТИЛИ - ТОЛЬКО СТАТУС
            if (statusElement) {
              if (cardLevel === currentLevelName) {
                statusElement.textContent = 'Активен';
                statusElement.style.display = 'block';
              } else {
                statusElement.style.display = 'none';
              }
            }
          });
        }
      } catch (error) {
        console.error('Error updating level cards status:', error);
      }

      // Обновление остальных элементов
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
      alert(window.LC_I18N ? window.LC_I18N.t('notification_login_required') : '❌ Войдите в аккаунт'); 
      return null; 
    }

    const isActive = await LC.isActiveUser();
    if (!isActive) {
      alert(window.LC_I18N ? window.LC_I18N.t('notification_insufficient_balance') : '❌ Для заработка на просмотрах необходимо пополнить баланс минимум на $29');
      return null;
    }

    console.log('Calling credit_view with:', { videoId, watchedSeconds, userId: user.id });

    try {
      const levelInfo = await LC.getLevelInfo();
      console.log('Current level info before credit:', levelInfo);
      
      if (levelInfo && levelInfo.views_left_today <= 0) {
        alert(window.LC_I18N ? window.LC_I18N.t('notification_view_limit_reached') : '❌ Лимит просмотров исчерпан');
        return null;
      }

      const { data, error } = await sb.rpc('credit_view', {
        p_video_id: String(videoId || 'video'),
        p_watched_seconds: Math.max(0, Math.floor(watchedSeconds || 0)),
      });
      
      if (error) { 
        console.error('Credit view error:', error); 
        alert(window.LC_I18N ? window.LC_I18N.t('notification_award_error') : '❌ Ошибка начисления'); 
        return null; 
      }
      
      console.log('Credit view response:', data);
      
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.ok) { 
        alert(row?.message || (window.LC_I18N ? window.LC_I18N.t('notification_award_error') : '❌ Начисление отклонено')); 
        return null; 
      }
      
      if (typeof row.views_left === 'number') {
        const el = document.querySelector('[data-views-left]');
        if (el) el.textContent = String(row.views_left);
      }
      
      await LC.refreshBalance();
      await LC.refreshLevelInfo();
      await LC.loadReferralEarnings();
      await LC.refreshDashboardCards();
      
      if (row.reward_cents) {
        const reward = (row.reward_cents / 100).toFixed(2);
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
      
      console.log('mountReferral started', { wrap, input });

      const user = await getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

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

  LC.getActiveReferralCounts = async function() {
    try {
      let counts = { gen1: 0, gen2: 0, gen3: 0 };
      
      try {
        const { data, error } = await sb.rpc('get_all_referral_counts');
        if (!error && data) {
          const row = Array.isArray(data) ? data[0] : data;
          counts = {
            gen1: Number(row.gen1 || row.lvl1 || 0),
            gen2: Number(row.gen2 || row.lvl2 || 0),
            gen3: Number(row.gen3 || row.lvl3 || 0)
          };
          console.log('✅ Количество рефералов из get_all_referral_counts:', counts);
        }
      } catch (e1) {
        console.warn('❌ get_all_referral_counts не сработал:', e1);
      }

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
            console.log('✅ Количество рефералов из get_referral_counts_active:', counts);
          }
        } catch (e2) {
          console.warn('❌ get_referral_counts_active не сработал:', e2);
        }
      }

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

          console.log('✅ Количество рефералов из прямого запроса:', counts);
        } catch (e3) {
          console.warn('❌ Прямой запрос к referrals не сработал:', e3);
        }
      }

      return counts;
    } catch (e) {
      console.warn('[LC] getActiveReferralCounts ошибка:', e);
      return { gen1: 0, gen2: 0, gen3: 0 };
    }
  };

  LC.loadReferralEarnings = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;

      console.log('🔄 Загрузка реферальных доходов для пользователя:', user.id);

      let gen1Total = 0;
      let gen2Total = 0;
      let gen3Total = 0;
      let dataFound = false;

      try {
        const { data: summaryData, error: summaryError } = await sb.rpc('my_ref_income_summary');
        
        if (!summaryError && summaryData) {
          console.log('📊 Данные из my_ref_income_summary:', summaryData);
          
          const row = Array.isArray(summaryData) ? summaryData[0] : summaryData;
          
          if (row) {
            gen1Total = Math.round((row.lvl1_usdt || 0) * 100);
            gen2Total = Math.round((row.lvl2_usdt || 0) * 100);
            gen3Total = Math.round((row.lvl3_usdt || 0) * 100);
            
            dataFound = true;
            console.log('✅ Данные из my_ref_income_summary обработаны:', {
              gen1: gen1Total/100,
              gen2: gen2Total/100, 
              gen3: gen3Total/100
            });
          }
        }
      } catch (summaryErr) {
        console.warn('❌ my_ref_income_summary не сработал:', summaryErr);
      }

      if (!dataFound) {
        try {
          const { data: refData, error: refError } = await sb.rpc('get_referral_earnings');
          
          if (!refError && refData) {
            console.log('📊 Данные из get_referral_earnings:', refData);
            
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
            console.log('✅ Данные из get_referral_earnings обработаны:', {
              gen1: gen1Total/100,
              gen2: gen2Total/100,
              gen3: gen3Total/100
            });
          }
        } catch (refErr) {
          console.warn('❌ get_referral_earnings не сработал:', refErr);
        }
      }

      if (!dataFound) {
        try {
          const { data: totalsData, error: totalsError } = await sb.rpc('ref_income_totals');
          
          if (!totalsError && totalsData) {
            console.log('📊 Данные из ref_income_totals:', totalsData);
            
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
            console.log('✅ Данные из ref_income_totals обработаны:', {
              gen1: gen1Total/100,
              gen2: gen2Total/100,
              gen3: gen3Total/100
            });
          }
        } catch (totalsErr) {
          console.warn('❌ ref_income_totals не сработал:', totalsErr);
        }
      }

      if (!dataFound) {
        try {
          const { data: rewardsData, error: rewardsError } = await sb
            .from('referral_rewards')
            .select('level, reward_usdt')
            .eq('referrer_user_id', user.id);
            
          if (!rewardsError && rewardsData) {
            console.log('📊 Данные из таблицы referral_rewards:', rewardsData);
            
            rewardsData.forEach(reward => {
              const level = reward.level;
              const amountUsd = reward.reward_usdt || 0;
              
              switch(level) {
                case 1:
                  gen1Total += Math.round(amountUsd * 100);
                  break;
                case 2:
                  gen2Total += Math.round(amountUsd * 100);
                  break;
                case 3:
                  gen3Total += Math.round(amountUsd * 100);
                  break;
              }
            });
            
            dataFound = true;
            console.log('✅ Данные из referral_rewards обработаны:', {
              gen1: gen1Total/100,
              gen2: gen2Total/100,
              gen3: gen3Total/100
            });
          }
        } catch (rewardsErr) {
          console.warn('❌ Прямой запрос к referral_rewards не сработал:', rewardsErr);
        }
      }

      const set = (sel, val) => { 
        const el = $(sel); 
        if (el) el.textContent = val; 
      };
      
      set('#gen1Cell', fmtMoney(gen1Total/100));
      set('#gen2Cell', fmtMoney(gen2Total/100));
      set('#gen3Cell', fmtMoney(gen3Total/100));

      const total = (gen1Total + gen2Total + gen3Total) / 100;
      set('#refTotalCell', fmtMoney(total));

      set('#gen1CellModal', fmtMoney(gen1Total/100));
      set('#gen2CellModal', fmtMoney(gen2Total/100));
      set('#gen3CellModal', fmtMoney(gen3Total/100));
      set('#refTotalCellModal', fmtMoney(total));

      console.log('🎯 Итоговые реферальные доходы:', { 
        gen1: fmtMoney(gen1Total/100), 
        gen2: fmtMoney(gen2Total/100), 
        gen3: fmtMoney(gen3Total/100), 
        total: fmtMoney(total)
      });

    } catch(e) { 
      console.error('❌ [LC] loadReferralEarnings ошибка:', e); 
    }
  };

  LC.refreshDashboardCards = async function() {
    try {
      const user = await getUser(); 
      if (!user) return;

      const counts = await LC.getActiveReferralCounts();

      const set = (sel, val) => { const el = $(sel); if (el) el.textContent = String(val); };
      
      set('#gen1Count', counts.gen1);
      set('#gen2Count', counts.gen2);
      set('#gen3Count', counts.gen3);

      set('#gen1CountModal', counts.gen1);
      set('#gen2CountModal', counts.gen2);
      set('#gen3CountModal', counts.gen3);

      console.log('📊 Количество рефералов обновлено:', counts);

    } catch(e) { 
      console.error('[LC] refreshDashboardCards ошибка:', e); 
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

    setTimeout(checkVideoAvailability, 500);
    reset();
  };

  // ===== ИНИЦИАЛИЗАЦИЯ ДАШБОРДА ============================================
  LC.initDashboard = async function() {
    try {
      const user = await getUser(); 
      if (!user) { 
        location.href = '/login_single.html'; 
        return; 
      }
      
      console.log('🔄 Инициализация дашборда для пользователя:', user.id);
      
      await LC.ensureProfile();
      await LC.applyReferral();
      await LC.mountReferral();
      await LC.refreshBalance();
      await LC.refreshLevelInfo();
      await LC.refreshDashboardCards();
      await LC.loadReferralEarnings();
      LC.initVideoWatch();
      
      console.log('✅ Дашборд успешно инициализирован');
      
      setInterval(async () => {
        await LC.refreshBalance();
        await LC.refreshLevelInfo();
        await LC.loadReferralEarnings();
      }, 30000);
      
    } catch(e) { 
      console.error('[LC] initDashboard', e); 
    }
  };

  // ===== АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ ======================================
  const init = function() {
    const path = location.pathname;
    if (path.includes('dashboard')) {
      LC.initDashboard();
    } else if (path.includes('withdraw')) {
      // LC.initWithdrawPage();
    } else if (path.includes('deposit')) {
      // LC.initDepositPage();
    } else if (path.includes('login') || path.includes('register')) {
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

  window.LC = LC;
})();
