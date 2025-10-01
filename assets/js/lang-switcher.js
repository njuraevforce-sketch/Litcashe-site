/*
 * Language switcher component. Updated to work with LC_I18N system
 */
(function(){
  /**
   * Helper to create DOM elements with optional className.
   */
  function createEl(tag, cls){
    const el = document.createElement(tag);
    if(cls) el.className = cls;
    return el;
  }

  /**
   * Build markup for language switcher with 3 languages
   */
  function buildMarkup(){
    const container = createEl('div','lc-lang');
    container.innerHTML = `
      <button class="lc-lang__btn" aria-haspopup="listbox" aria-expanded="false">
        <svg viewBox="0 0 24 24" class="lc-lang__icon" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 0 1 0-16v16zm1-16a8 8 0 0 1 0 16V4zM4.7 7h14.6M4.7 17h14.6M12 2a15 15 0 0 0 0 20M12 2a15 15 0 0 1 0 20" fill="none" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <span class="lc-lang__label"></span>
      </button>
      <ul class="lc-lang__menu" role="listbox" tabindex="-1">
        <li role="option" data-lang="ru">
          <span class="lang-flag ru"></span>
          <span>Русский</span>
        </li>
        <li role="option" data-lang="en">
          <span class="lang-flag en"></span>
          <span>English</span>
        </li>
        <li role="option" data-lang="cn">
          <span class="lang-flag cn"></span>
          <span>中文</span>
        </li>
      </ul>
    `;
    return container;
  }

  /**
   * Attach handlers to the switcher container
   */
  function bind(container){
    const btn = container.querySelector('.lc-lang__btn');
    const menu = container.querySelector('.lc-lang__menu');
    const label = container.querySelector('.lc-lang__label');
    if (!btn || !menu) return;

    // Retrieve current language - use same key as i18n.js
    function getLang(){
      try { 
        return localStorage.getItem('lc_lang') || 'ru';
      } catch(e) { 
        return 'ru'; 
      }
    }

    // Update storage and apply translations
    function setLang(lang){
      try{ 
        localStorage.setItem('lc_lang', lang); 
      } catch(_){}
      
      // Update LC_I18N if available
      if (window.LC_I18N) {
        try{ 
          LC_I18N.set(lang);
          LC_I18N.apply();
        } catch(_){}
      }
      
      // Update label
      if (label) {
        const langNames = {
          'ru': 'RU',
          'en': 'EN', 
          'cn': '中文'
        };
        label.textContent = langNames[lang] || 'RU';
      }
      
      // Update HTML lang attribute
      try{ 
        document.documentElement.setAttribute('lang', lang); 
      } catch(_){}
      
      // Update active state in dropdown
      updateActiveLang(lang);
    }

    // Update active state in dropdown menu
    function updateActiveLang(lang) {
      menu.querySelectorAll('li').forEach(li => {
        if (li.getAttribute('data-lang') === lang) {
          li.classList.add('active');
        } else {
          li.classList.remove('active');
        }
      });
    }

    function openMenu() {
      btn.setAttribute('aria-expanded','true');
      container.classList.add('is-open');
      menu.focus();
    }
    
    function closeMenu() {
      btn.setAttribute('aria-expanded','false');
      container.classList.remove('is-open');
    }

    // Initialize
    const currentLang = getLang();
    setLang(currentLang);

    // Event handlers
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) closeMenu();
    });
    
    menu.addEventListener('click', (e) => {
      const li = e.target.closest('[data-lang]');
      if (!li) return;
      const lang = li.getAttribute('data-lang');
      if (!lang) return;
      setLang(lang);
      closeMenu();
    });
    
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /**
   * Find header mount point
   */
  function findHeaderMount(){
    const selectors = [
      '.nav-cta', '.nav-links', '.header .container', 'header .container', 
      'header .wrapper', 'header nav', 'header',
      '.header .wrapper', '.header nav', '.header',
      '.navbar', '.topbar', '.top-bar', '.nav', '.site-header'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  /**
   * Main entry point
   */
  function mount(){
    const existing = document.querySelector('.lc-lang');
    if (existing) {
      bind(existing);
      return;
    }
    
    const container = buildMarkup();
    const mountPoint = findHeaderMount();
    
    if (mountPoint) {
      // Insert at beginning of nav-cta or append to other containers
      if (mountPoint.classList.contains('nav-cta')) {
        mountPoint.insertBefore(container, mountPoint.firstChild);
      } else {
        mountPoint.appendChild(container);
      }
    } else {
      container.classList.add('lc-floating');
      document.body.appendChild(container);
    }
    
    bind(container);
  }

  // Wait for DOM ready
  if (document.readyState !== 'loading') {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount);
  }
})();
