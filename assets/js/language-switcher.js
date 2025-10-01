// unified-language-switcher-fixed.js
(function(){
  console.log('Fixed Language Switcher: Loading...');

  // Supported languages with flags and names
  const languages = {
    'ru': { name: 'RU', flag: 'ru' },
    'en': { name: 'EN', flag: 'en' },
    'cn': { name: '中文', flag: 'cn' },
    'es': { name: 'ES', flag: 'es' },
    'fr': { name: 'FR', flag: 'fr' },
    'de': { name: 'DE', flag: 'de' }
  };

  /**
   * Get current language from storage
   */
  function getCurrentLang() {
    try { 
      return localStorage.getItem('lc_lang') || 'ru';
    } catch(e) { 
      return 'ru'; 
    }
  }

  /**
   * Set language and update UI
   */
  function setLang(lang) {
    if (!languages[lang]) {
      console.error('Language switcher: Unknown language:', lang);
      return;
    }
    
    console.log('Language switcher: Setting language to', lang);
    
    try { 
      localStorage.setItem('lc_lang', lang); 
    } catch(e) {
      console.error('Language switcher: Failed to save to localStorage:', e);
    }
    
    // Update LC_I18N if available
    if (window.LC_I18N && typeof window.LC_I18N.set === 'function') {
      try { 
        window.LC_I18N.set(lang);
        console.log('Language switcher: LC_I18N.set called successfully');
      } catch(e) {
        console.error('Language switcher: Error calling LC_I18N.set:', e);
        setTimeout(() => window.location.reload(), 100);
      }
    } else {
      console.warn('Language switcher: LC_I18N not available, reloading page');
      setTimeout(() => window.location.reload(), 100);
    }
    
    // Update button label
    document.querySelectorAll('.lang-btn .lang-code').forEach(element => {
      element.textContent = languages[lang].name;
    });
    
    // Update active state in dropdown
    document.querySelectorAll('.lang-item').forEach(item => {
      if (item.getAttribute('data-lang') === lang) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Update HTML lang attribute
    try { 
      document.documentElement.setAttribute('lang', lang); 
    } catch(e) {
      console.error('Language switcher: Failed to set lang attribute:', e);
    }
  }

  /**
   * Initialize existing switchers
   */
  function initExistingSwitchers() {
    const switchers = document.querySelectorAll('.language-switcher');
    
    if (switchers.length === 0) {
      console.warn('Language switcher: No switcher elements found');
      return false;
    }

    console.log('Language switcher: Found', switchers.length, 'existing switcher(s)');

    // Initialize each existing switcher
    switchers.forEach(switcher => {
      const btn = switcher.querySelector('.lang-btn');
      const dropdown = switcher.querySelector('.lang-dropdown');
      const langItems = switcher.querySelectorAll('.lang-item');
      
      if (!btn || !dropdown) {
        console.error('Language switcher: Missing required elements in existing switcher');
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

      // Event handlers
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switcher.classList.contains('active') ? closeDropdown() : openDropdown();
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!switcher.contains(e.target)) {
          closeDropdown();
        }
      });
      
      // Handle language selection
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
      
      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && switcher.classList.contains('active')) {
          closeDropdown();
        }
      });
    });

    return true;
  }

  /**
   * Main entry point
   */
  function init() {
    console.log('Language switcher: Initializing...');
    
    // Initialize existing switchers
    if (initExistingSwitchers()) {
      // Set current language
      const currentLang = getCurrentLang();
      document.querySelectorAll('.lang-btn .lang-code').forEach(element => {
        element.textContent = languages[currentLang] ? languages[currentLang].name : 'RU';
      });
      
      console.log('Language switcher: Successfully initialized existing switchers');
    } else {
      console.error('Language switcher: Failed to initialize any switchers');
    }
  }

  // Запуск после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
