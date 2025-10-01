/*
 * Language switcher component for 14 languages - FIXED
 */
(function(){
  console.log('Language switcher: Loading...');

  // Supported languages with flags and names
  const languages = {
    'ru': { name: 'RU', flag: 'ru' },
    'en': { name: 'EN', flag: 'en' },
    'cn': { name: '中文', flag: 'cn' },
    'es': { name: 'ES', flag: 'es' },
    'fr': { name: 'FR', flag: 'fr' },
    'de': { name: 'DE', flag: 'de' },
    'pt': { name: 'PT', flag: 'pt' },
    'ar': { name: 'AR', flag: 'ar' },
    'ja': { name: 'JA', flag: 'jp' },
    'ko': { name: 'KO', flag: 'kr' },
    'tr': { name: 'TR', flag: 'tr' },
    'it': { name: 'IT', flag: 'it' },
    'hi': { name: 'HI', flag: 'in' },
    'pl': { name: 'PL', flag: 'pl' }
  };

  /**
   * Build markup for language switcher
   */
  function buildMarkup(){
    const container = document.createElement('div');
    container.className = 'language-switcher';
    container.id = 'languageSwitcher';
    
    const currentLang = getCurrentLang();
    const currentLangData = languages[currentLang] || languages.ru;

    let menuHTML = '';
    for (const [code, lang] of Object.entries(languages)) {
      const isActive = code === currentLang ? 'active' : '';
      menuHTML += `
        <div class="lang-item ${isActive}" data-lang="${code}">
          <span class="lang-flag ${lang.flag}"></span>
          <span class="lang-name">${getLangName(code)}</span>
          <span class="lang-code">${lang.name}</span>
        </div>
      `;
    }

    container.innerHTML = `
      <button class="lang-btn" id="langBtn" aria-label="Выбор языка">
        <svg class="lang-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 0 1 0-16v16zm1-16a8 8 0 0 1 0 16V4zM4.7 7h14.6M4.7 17h14.6M12 2a15 15 0 0 0 0 20M12 2a15 15 0 0 1 0 20" 
                fill="none" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <span class="lang-code">${currentLangData.name}</span>
        <svg class="lang-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div class="lang-dropdown" id="langDropdown">
        <div class="lang-list">
          ${menuHTML}
        </div>
      </div>
    `;
    return container;
  }

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
   * Get full language name
   */
  function getLangName(code) {
    const names = {
      'ru': 'Русский',
      'en': 'English', 
      'cn': '中文',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'pt': 'Português',
      'ar': 'العربية',
      'ja': '日本語',
      'ko': '한국어',
      'tr': 'Türkçe',
      'it': 'Italiano',
      'hi': 'हिन्दी',
      'pl': 'Polski'
    };
    return names[code] || code;
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
      }
    } else {
      console.warn('Language switcher: LC_I18N not available, reloading page');
      setTimeout(() => window.location.reload(), 100);
    }
    
    // Update button label
    const langBtn = document.querySelector('.lang-btn .lang-code');
    if (langBtn && languages[lang]) {
      langBtn.textContent = languages[lang].name;
    }
    
    // Update active state in dropdown
    updateActiveLang(lang);
    
    // Update HTML lang attribute
    try { 
      document.documentElement.setAttribute('lang', lang); 
    } catch(e) {
      console.error('Language switcher: Failed to set lang attribute:', e);
    }
  }

  /**
   * Update active state in dropdown
   */
  function updateActiveLang(lang) {
    const dropdown = document.querySelector('.lang-dropdown');
    if (!dropdown) return;
    
    dropdown.querySelectorAll('.lang-item').forEach(item => {
      if (item.getAttribute('data-lang') === lang) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Attach handlers to the switcher container
   */
  function bind(container){
    const btn = container.querySelector('.lang-btn');
    const dropdown = container.querySelector('.lang-dropdown');
    const langItems = container.querySelectorAll('.lang-item');
    
    if (!btn || !dropdown) {
      console.error('Language switcher: Could not find button or dropdown elements');
      return;
    }

    function openDropdown() {
      container.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
    }
    
    function closeDropdown() {
      container.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    }

    // Initialize with current language
    const currentLang = getCurrentLang();
    console.log('Language switcher: Current language is', currentLang);
    setLang(currentLang);

    // Event handlers
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.contains('active') ? closeDropdown() : openDropdown();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        closeDropdown();
      }
    });
    
    // Handle language selection
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
      if (e.key === 'Escape' && container.classList.contains('active')) {
        closeDropdown();
      }
    });
  }

  /**
   * Find header mount point - IMPROVED
   */
  function findHeaderMount(){
    // Priority 1: nav-cta in header
    const headerNavCta = document.querySelector('header .nav-cta');
    if (headerNavCta) {
      console.log('Language switcher: Found header .nav-cta');
      return headerNavCta;
    }
    
    // Priority 2: any nav-cta
    const navCta = document.querySelector('.nav-cta');
    if (navCta) {
      console.log('Language switcher: Found .nav-cta');
      return navCta;
    }
    
    // Priority 3: header container
    const selectors = [
      '.header .container',
      'header .container', 
      '.header',
      'header',
      '.navbar',
      'nav'
    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        console.log('Language switcher: Found mount point:', sel);
        return el;
      }
    }
    
    console.error('Language switcher: No mount point found');
    return null;
  }

  /**
   * Initialize existing language switcher if present
   */
  function initExisting() {
    const existingSwitcher = document.getElementById('languageSwitcher');
    if (!existingSwitcher) return false;

    console.log('Language switcher: Found existing switcher, initializing...');
    
    const btn = existingSwitcher.querySelector('.lang-btn');
    const dropdown = existingSwitcher.querySelector('.lang-dropdown');
    const langItems = existingSwitcher.querySelectorAll('.lang-item');
    
    if (!btn || !dropdown) {
      console.error('Language switcher: Existing switcher missing required elements');
      return false;
    }

    function openDropdown() {
      existingSwitcher.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
    }
    
    function closeDropdown() {
      existingSwitcher.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    }

    // Initialize with current language
    const currentLang = getCurrentLang();
    console.log('Language switcher: Current language is', currentLang);
    
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
      existingSwitcher.classList.contains('active') ? closeDropdown() : openDropdown();
    });
    
    document.addEventListener('click', (e) => {
      if (!existingSwitcher.contains(e.target)) {
        closeDropdown();
      }
    });
    
    langItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = item.getAttribute('data-lang');
        if (!lang) return;
        
        setLang(lang);
        closeDropdown();
      });
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && existingSwitcher.classList.contains('active')) {
        closeDropdown();
      }
    });

    return true;
  }

  /**
   * Main entry point
   */
  function mount(){
    console.log('Language switcher: Mounting...');
    
    // First try to initialize existing switcher
    if (initExisting()) {
      console.log('Language switcher: Successfully initialized existing switcher');
      return;
    }
    
    // If no existing switcher, create and insert new one
    console.log('Language switcher: No existing switcher found, creating new...');
    
    const container = buildMarkup();
    const mountPoint = findHeaderMount();
    
    if (mountPoint) {
      if (mountPoint.classList.contains('nav-cta')) {
        mountPoint.insertBefore(container, mountPoint.firstChild);
        console.log('Language switcher: Inserted into nav-cta');
      } else {
        mountPoint.appendChild(container);
        console.log('Language switcher: Appended to container');
      }
      
      bind(container);
      console.log('Language switcher: Successfully mounted and bound');
    } else {
      // Fallback: add to body
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.zIndex = '1000';
      document.body.appendChild(container);
      bind(container);
      console.warn('Language switcher: Mounted as floating element');
    }
  }

  // Add CSS styles if not already present
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

      .lang-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
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
        display: inline-block;
        border: 1px solid rgba(255,255,255,0.2);
        flex-shrink: 0;
      }

      .lang-name {
        flex: 1;
        text-align: left;
      }

      .lang-code {
        font-size: 10px;
        opacity: 0.7;
        font-weight: 600;
      }

      /* Флаги языков */
      .lang-flag.ru { background: linear-gradient(to bottom, #fff 33%, #0039a6 33%, #0039a6 66%, #d52b1e 66%); }
      .lang-flag.en { background: linear-gradient(135deg, #012169 0%, #012169 40%, #C8102E 40%, #C8102E 60%, #FFFFFF 60%, #FFFFFF 100%); }
      .lang-flag.cn { background: linear-gradient(to bottom, #de2910 0%, #de2910 50%, #ffde00 50%, #ffde00 100%); }
      .lang-flag.es { background: linear-gradient(to bottom, #aa151b 25%, #f1bf00 25%, #f1bf00 75%, #aa151b 75%); }
      .lang-flag.fr { background: linear-gradient(to right, #0055a4 33%, #ffffff 33%, #ffffff 66%, #ef4135 66%); }
      .lang-flag.de { background: linear-gradient(to bottom, #000000 33%, #dd0000 33%, #dd0000 66%, #ffce00 66%); }
      .lang-flag.pt { background: linear-gradient(to right, #006600 40%, #ff0000 40%, #ff0000 60%, #ffcc00 60%); }
      .lang-flag.ar { background: linear-gradient(to bottom, #ce1126 33%, #ffffff 33%, #ffffff 66%, #000000 66%); }
      .lang-flag.jp { background: radial-gradient(circle, #bc002d 30%, white 30%); }
      .lang-flag.kr { background: linear-gradient(to bottom, #ffffff 50%, #000000 50%); }
      .lang-flag.tr { background: linear-gradient(to bottom, #e30a17 0%, #e30a17 100%); }
      .lang-flag.it { background: linear-gradient(to right, #009246 33%, #ffffff 33%, #ffffff 66%, #ce2b37 66%); }
      .lang-flag.in { background: linear-gradient(to bottom, #ff9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%); }
      .lang-flag.pl { background: linear-gradient(to bottom, #ffffff 50%, #dc143c 50%); }

      @media (max-width: 768px) {
        .language-switcher {
          margin-right: 0;
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

  // Wait for DOM ready with better timing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectStyles();
      setTimeout(mount, 100);
    });
  } else {
    injectStyles();
    setTimeout(mount, 100);
  }
})();
