/*
 * Unified Language Switcher - унифицированная версия
 */
(function(){
  console.log('Language switcher: Loading unified version...');

  // Поддерживаемые языки
  const languages = {
    'ru': { name: 'RU', flag: 'ru', fullName: 'Русский' },
    'en': { name: 'EN', flag: 'en', fullName: 'English' },
    'cn': { name: '中文', flag: 'cn', fullName: '中文' },
    'es': { name: 'ES', flag: 'es', fullName: 'Español' },
    'fr': { name: 'FR', flag: 'fr', fullName: 'Français' },
    'de': { name: 'DE', flag: 'de', fullName: 'Deutsch' }
  };

  /**
   * Получить текущий язык
   */
  function getCurrentLang() {
    try { 
      return localStorage.getItem('lc_lang') || 'ru';
    } catch(e) { 
      return 'ru'; 
    }
  }

  /**
   * Установить язык
   */
  function setLang(lang) {
    if (!languages[lang]) {
      console.error('Language switcher: Unknown language:', lang);
      return;
    }
    
    console.log('Language switcher: Setting language to', lang);
    
    // Сохраняем в localStorage
    try { 
      localStorage.setItem('lc_lang', lang); 
    } catch(e) {
      console.error('Language switcher: Failed to save to localStorage:', e);
    }
    
    // Обновляем интерфейс переключателя
    updateSwitcherUI(lang);
    
    // Обновляем системe перевода
    if (window.LC_I18N && typeof window.LC_I18N.set === 'function') {
      try { 
        window.LC_I18N.set(lang);
        console.log('Language switcher: LC_I18N.set called successfully');
      } catch(e) {
        console.error('Language switcher: Error calling LC_I18N.set:', e);
        // Fallback: перезагрузка страницы
        setTimeout(() => window.location.reload(), 100);
      }
    } else {
      console.warn('Language switcher: LC_I18N not available, reloading page');
      setTimeout(() => window.location.reload(), 100);
    }
    
    // Обновляем атрибут lang у html
    try { 
      document.documentElement.setAttribute('lang', lang); 
    } catch(e) {
      console.error('Language switcher: Failed to set lang attribute:', e);
    }
  }

  /**
   * Обновить интерфейс переключателя
   */
  function updateSwitcherUI(lang) {
    const langData = languages[lang];
    if (!langData) return;
    
    // Обновляем все кнопки переключателя
    document.querySelectorAll('.lang-btn .lang-code').forEach(element => {
      element.textContent = langData.name;
    });
    
    // Обновляем активное состояние в выпадающем списке
    document.querySelectorAll('.lang-item').forEach(item => {
      if (item.getAttribute('data-lang') === lang) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Инициализация переключателя
   */
  function initSwitcher() {
    const switchers = document.querySelectorAll('.language-switcher');
    
    if (switchers.length === 0) {
      console.warn('Language switcher: No switcher elements found');
      return;
    }

    console.log('Language switcher: Found', switchers.length, 'switcher(s)');

    // Инициализируем каждый переключатель
    switchers.forEach(switcher => {
      const btn = switcher.querySelector('.lang-btn');
      const dropdown = switcher.querySelector('.lang-dropdown');
      const langItems = switcher.querySelectorAll('.lang-item');
      
      if (!btn || !dropdown) {
        console.error('Language switcher: Missing required elements');
        return;
      }

      function openDropdown() {
        switcher.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
      
      function closeDropdown() {
        switcher.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
      }

      // Обработчик клика по кнопке
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switcher.classList.contains('active') ? closeDropdown() : openDropdown();
      });
      
      // Обработчики для элементов языка
      langItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const lang = item.getAttribute('data-lang');
          if (lang) {
            setLang(lang);
            closeDropdown();
          }
        });
      });

      // Закрытие при клике вне переключателя
      document.addEventListener('click', (e) => {
        if (!switcher.contains(e.target)) {
          closeDropdown();
        }
      });

      // Закрытие по Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && switcher.classList.contains('active')) {
          closeDropdown();
        }
      });
    });

    // Устанавливаем начальный язык
    const currentLang = getCurrentLang();
    updateSwitcherUI(currentLang);
  }

  /**
   * Добавление стилей
   */
  function injectStyles() {
    if (document.querySelector('#language-switcher-styles')) return;
    
    const styles = `
      .language-switcher {
        position: relative;
        display: inline-block;
        z-index: 1001;
      }

      .lang-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 32px;
        padding: 0 12px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        color: var(--text);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        white-space: nowrap;
      }

      .lang-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25);
      }

      .lang-icon {
        width: 14px;
        height: 14px;
      }

      .lang-arrow {
        width: 12px;
        height: 12px;
        transition: transform 0.3s ease;
      }

      .language-switcher.active .lang-arrow {
        transform: rotate(180deg);
      }

      .lang-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 5px;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 8px;
        min-width: 140px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(20px);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s ease;
        z-index: 1002;
      }

      .language-switcher.active .lang-dropdown {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .lang-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 11px;
        font-weight: 500;
        color: var(--text);
      }

      .lang-item:hover {
        background: rgba(16, 185, 129, 0.15);
        color: var(--primary-light);
      }

      .lang-item.active {
        background: rgba(16, 185, 129, 0.2);
        color: var(--primary);
        font-weight: 600;
      }

      .lang-flag {
        width: 16px;
        height: 12px;
        border-radius: 2px;
        border: 1px solid rgba(255,255,255,0.2);
        flex-shrink: 0;
      }

      .lang-name {
        flex: 1;
      }

      .lang-code {
        font-size: 10px;
        opacity: 0.7;
        font-weight: 600;
      }

      /* Флаги */
      .lang-flag.ru { background: linear-gradient(to bottom, #fff 33%, #0039a6 33%, #0039a6 66%, #d52b1e 66%); }
      .lang-flag.en { background: linear-gradient(135deg, #012169 0%, #012169 40%, #C8102E 40%, #C8102E 60%, #FFFFFF 60%, #FFFFFF 100%); }
      .lang-flag.cn { background: linear-gradient(to bottom, #de2910 0%, #de2910 50%, #ffde00 50%, #ffde00 100%); }
      .lang-flag.es { background: linear-gradient(to bottom, #aa151b 25%, #f1bf00 25%, #f1bf00 75%, #aa151b 75%); }
      .lang-flag.fr { background: linear-gradient(to right, #0055a4 33%, #ffffff 33%, #ffffff 66%, #ef4135 66%); }
      .lang-flag.de { background: linear-gradient(to bottom, #000000 33%, #dd0000 33%, #dd0000 66%, #ffce00 66%); }

      /* Мобильная адаптация */
      @media (max-width: 768px) {
        .language-switcher {
          width: 100%;
          margin-bottom: 10px;
        }

        .lang-btn {
          width: 100%;
          justify-content: center;
        }

        .lang-dropdown {
          position: static;
          margin-top: 8px;
          transform: none;
          width: 100%;
        }
      }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'language-switcher-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Основная функция инициализации
   */
  function init() {
    injectStyles();
    initSwitcher();
    console.log('Language switcher: Unified version initialized successfully');
  }

  // Запуск после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
