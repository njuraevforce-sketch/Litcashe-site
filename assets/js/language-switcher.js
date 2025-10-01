/*
 * Unified Language Switcher - COMPLETE 14 LANGUAGES
 */
(function(){
  console.log('Language switcher: Loading optimized version...');

  // Supported languages with flags and names
  const languages = {
    'ru': { name: 'RU', flag: 'ru', fullName: 'Русский' },
    'en': { name: 'EN', flag: 'en', fullName: 'English' },
    'cn': { name: '中文', flag: 'cn', fullName: '中文' },
    'es': { name: 'ES', flag: 'es', fullName: 'Español' },
    'fr': { name: 'FR', flag: 'fr', fullName: 'Français' },
    'de': { name: 'DE', flag: 'de', fullName: 'Deutsch' },
    'pt': { name: 'PT', flag: 'pt', fullName: 'Português' },
    'ar': { name: 'AR', flag: 'ar', fullName: 'العربية' },
    'ja': { name: 'JA', flag: 'jp', fullName: '日本語' },
    'ko': { name: 'KO', flag: 'kr', fullName: '한국어' },
    'tr': { name: 'TR', flag: 'tr', fullName: 'Türkçe' },
    'it': { name: 'IT', flag: 'it', fullName: 'Italiano' },
    'hi': { name: 'HI', flag: 'in', fullName: 'हिन्दी' },
    'pl': { name: 'PL', flag: 'pl', fullName: 'Polski' }
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
    
    // Update button label on all switchers
    document.querySelectorAll('.lang-btn .lang-code').forEach(langBtn => {
      if (languages[lang]) {
        langBtn.textContent = languages[lang].name;
      }
    });
    
    // Update active state in all dropdowns
    updateActiveLang(lang);
    
    // Update HTML lang attribute
    try { 
      document.documentElement.setAttribute('lang', lang); 
    } catch(e) {
      console.error('Language switcher: Failed to set lang attribute:', e);
    }
    
    // Apply translations via LC_I18N
    if (window.LC_I18N && typeof window.LC_I18N.set === 'function') {
      try { 
        window.LC_I18N.set(lang);
        console.log('Language switcher: LC_I18N.set called successfully');
      } catch(e) {
        console.error('Language switcher: Error calling LC_I18N.set:', e);
        // Fallback: reload page if i18n fails
        setTimeout(() => window.location.reload(), 100);
      }
    } else {
      console.warn('Language switcher: LC_I18N not available, reloading page');
      setTimeout(() => window.location.reload(), 100);
    }
  }

  /**
   * Update active state in all dropdowns
   */
  function updateActiveLang(lang) {
    document.querySelectorAll('.lang-dropdown').forEach(dropdown => {
      dropdown.querySelectorAll('.lang-item').forEach(item => {
        if (item.getAttribute('data-lang') === lang) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    });
    
    // Update mobile language items
    document.querySelectorAll('.mobile-lang-item').forEach(item => {
      if (item.getAttribute('data-lang') === lang) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Initialize existing language switcher
   */
  function initExistingSwitcher(switcher) {
    const btn = switcher.querySelector('.lang-btn');
    const dropdown = switcher.querySelector('.lang-dropdown');
    const langItems = switcher.querySelectorAll('.lang-item');
    
    if (!btn || !dropdown) {
      console.error('Language switcher: Missing required elements');
      return false;
    }

    function openDropdown() {
      switcher.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
    }
    
    function closeDropdown() {
      switcher.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    }

    // Initialize with current language
    const currentLang = getCurrentLang();
    
    // Update button label
    const langBtnCode = btn.querySelector('.lang-code');
    if (langBtnCode && languages[currentLang]) {
      langBtnCode.textContent = languages[currentLang].name;
    }
    
    // Update active state
    updateActiveLang(currentLang);

    // Event handlers
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      switcher.classList.contains('active') ? closeDropdown() : openDropdown();
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) {
        closeDropdown();
      }
    });
    
    // Language selection
    langItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = item.getAttribute('data-lang');
        if (!lang) return;
        
        setLang(lang);
        closeDropdown();
      });
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && switcher.classList.contains('active')) {
        closeDropdown();
      }
    });

    return true;
  }

  /**
   * Create mobile language switcher for mobile menu
   */
  function createMobileSwitcher() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu) return;

    // Check if mobile switcher already exists
    if (mobileMenu.querySelector('.mobile-lang-switcher')) return;

    const mobileSwitcher = document.createElement('div');
    mobileSwitcher.className = 'mobile-lang-switcher';
    mobileSwitcher.innerHTML = `
      <div class="mobile-lang-title" data-i18n="language">Язык</div>
      <div class="mobile-lang-list">
        ${Object.entries(languages).map(([code, lang]) => `
          <div class="mobile-lang-item ${code === getCurrentLang() ? 'active' : ''}" data-lang="${code}">
            <span class="lang-flag ${lang.flag}"></span>
            <span class="lang-name">${lang.fullName}</span>
          </div>
        `).join('')}
      </div>
    `;

    mobileMenu.appendChild(mobileSwitcher);

    // Add event listeners for mobile items
    mobileSwitcher.querySelectorAll('.mobile-lang-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = item.getAttribute('data-lang');
        if (!lang) return;
        
        setLang(lang);
        
        // Close mobile menu after selection
        const mobileMenu = document.getElementById('mobileMenu');
        const burgerBtn = document.getElementById('burgerBtn');
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (burgerBtn) burgerBtn.classList.remove('active');
      });
    });
  }

  /**
   * Ensure all language switchers have complete language list
   */
  function ensureCompleteLanguageList() {
    document.querySelectorAll('.lang-dropdown .lang-list').forEach(list => {
      // Check if we have all 14 languages
      const currentItems = list.querySelectorAll('.lang-item');
      if (currentItems.length < 14) {
        // Rebuild the list with all languages
        let newHTML = '';
        Object.entries(languages).forEach(([code, lang]) => {
          const isActive = code === getCurrentLang() ? 'active' : '';
          newHTML += `
            <div class="lang-item ${isActive}" data-lang="${code}">
              <span class="lang-flag ${lang.flag}"></span>
              <span class="lang-name">${lang.fullName}</span>
              <span class="lang-code">${lang.name}</span>
            </div>
          `;
        });
        list.innerHTML = newHTML;
      }
    });
  }

  /**
   * Main initialization function
   */
  function init() {
    console.log('Language switcher: Initializing...');
    
    // Ensure complete language list in all dropdowns
    ensureCompleteLanguageList();
    
    // Initialize all existing switchers
    const existingSwitchers = document.querySelectorAll('.language-switcher');
    let initializedCount = 0;
    
    existingSwitchers.forEach(switcher => {
      if (initExistingSwitcher(switcher)) {
        initializedCount++;
      }
    });
    
    console.log(`Language switcher: Initialized ${initializedCount} existing switcher(s)`);
    
    // Create mobile switcher if mobile menu exists
    createMobileSwitcher();
    
    // Set initial language
    const currentLang = getCurrentLang();
    setLang(currentLang);
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 100);
    });
  } else {
    setTimeout(init, 100);
  }

  // Export for global access
  window.LanguageSwitcher = {
    setLang: setLang,
    getCurrentLang: getCurrentLang
  };
})();
