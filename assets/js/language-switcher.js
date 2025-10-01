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
    container.className = 'lc-lang';
    
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
    
    if (!btn || !menu) {
      console.error('Language switcher: Could not find button or menu elements');
      return;
    }

    // Retrieve current language
    function getLang(){
      try { 
        return localStorage.getItem('lc_lang') || 'ru';
      } catch(e) { 
        return 'ru'; 
      }
    }

    // Update storage and apply translations
    function setLang(lang){
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
      
      // Update label
      if (label) {
        label.textContent = languages[lang].name;
      }
      
      // Update HTML lang attribute
      try { 
        document.documentElement.setAttribute('lang', lang); 
      } catch(e) {
        console.error('Language switcher: Failed to set lang attribute:', e);
      }
      
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

    // Initialize with current language
    const currentLang = getLang();
    console.log('Language switcher: Current language is', currentLang);
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
   * Main entry point
   */
  function mount(){
    console.log('Language switcher: Mounting...');
    
    // Check if already mounted
    const existing = document.querySelector('.lc-lang');
    if (existing) {
      console.log('Language switcher: Found existing, rebinding...');
      bind(existing);
      return;
    }
    
    // Build and insert switcher
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
      container.classList.add('lc-floating');
      document.body.appendChild(container);
      bind(container);
      console.warn('Language switcher: Mounted as floating element');
    }
  }

  // Wait for DOM ready with better timing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(mount, 100); // Small delay to ensure other scripts are loaded
    });
  } else {
    setTimeout(mount, 100);
  }
})();
