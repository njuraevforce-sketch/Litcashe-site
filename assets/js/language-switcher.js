/*
 * Language switcher component for 14 languages
 */
(function(){
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
   * Helper to create DOM elements with optional className.
   */
  function createEl(tag, cls){
    const el = document.createElement(tag);
    if(cls) el.className = cls;
    return el;
  }

  /**
   * Build markup for language switcher with 14 languages
   */
  function buildMarkup(){
    const container = createEl('div','lc-lang');
    
    let menuHTML = '';
    for (const [code, lang] of Object.entries(languages)) {
      menuHTML += `
        <li role="option" data-lang="${code}">
          <span class="lang-flag ${lang.flag}"></span>
          <span>${lang.name}</span>
        </li>
      `;
    }

    container.innerHTML = `
      <button class="lc-lang__btn" aria-haspopup="listbox" aria-expanded="false">
        <svg viewBox="0 0 24 24" class="lc-lang__icon" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 0 1 0-16v16zm1-16a8 8 0 0 1 0 16V4zM4.7 7h14.6M4.7 17h14.6M12 2a15 15 0 0 0 0 20M12 2a15 15 0 0 1 0 20" fill="none" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <span class="lc-lang__label">RU</span>
      </button>
      <ul class="lc-lang__menu" role="listbox" tabindex="-1">
        ${menuHTML}
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
      if (!languages[lang]) return;
      
      try{ 
        localStorage.setItem('lc_lang', lang); 
      } catch(_){}
      
      // Update LC_I18N if available
      if (window.LC_I18N) {
        try{ 
          LC_I18N.set(lang);
        } catch(_){}
      }
      
      // Update label
      if (label) {
        label.textContent = languages[lang].name;
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
      // Add scroll for many languages
      menu.style.maxHeight = '300px';
      menu.style.overflowY = 'auto';
      menu.focus();
    }
    
    function closeMenu() {
      btn.setAttribute('aria-expanded','false');
      container.classList.remove('is-open');
      menu.style.maxHeight = '';
      menu.style.overflowY = '';
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
      '.nav-cta', '.header .container', 'header .container', 
      'header', '.header', '.navbar'
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
