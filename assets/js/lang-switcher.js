/*
 * Language switcher component.  This script is designed to work on pages that
 * either already contain a `.lc-lang` element in the markup or that need the
 * switcher injected.  If an existing `.lc-lang` container is found, the
 * script will attach click/keyboard handlers to it so users can toggle
 * between languages.  Otherwise it will construct a new switcher and
 * mount it into the first suitable header container.  The current language
 * label will update based on localStorage (`litcash_lang`) and
 * LC_I18N.getLang() if available.
 */
(function(){
  /**
   * Helper to create DOM elements with optional className.
   * @param {string} tag HTML tag
   * @param {string} cls Optional class name
   * @returns {HTMLElement}
   */
  function createEl(tag, cls){
    const el = document.createElement(tag);
    if(cls) el.className = cls;
    return el;
  }

  /**
   * Build markup for a fresh language switcher.  The button contains an icon
   * and a label; the menu lists available languages with both locale code
   * and human‑readable language name.  We include the label in the button so
   * the current language can be displayed (e.g., RU or EN).
   * @returns {HTMLElement}
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
        <li role="option" data-lang="ru">RU Русский</li>
        <li role="option" data-lang="en">EN English</li>
      </ul>
    `;
    return container;
  }

  /**
   * Attach click/keyboard handlers to the switcher container.  If a label is
   * present it will be kept in sync with the current language.  The handler
   * uses LC_I18N if available to set/apply language and always writes the
   * selection into localStorage under `litcash_lang`.
   * @param {HTMLElement} container
   */
  function bind(container){
    const btn = container.querySelector('.lc-lang__btn');
    const menu = container.querySelector('.lc-lang__menu');
    const label = container.querySelector('.lc-lang__label');
    if (!btn || !menu) return;

    // Retrieve current language from localStorage or LC_I18N, default ru
    function getLang(){
      try { return localStorage.getItem('litcash_lang') || (window.LC_I18N && LC_I18N.getLang ? LC_I18N.getLang() : 'ru'); } catch(e) { return 'ru'; }
    }
    // Update storage, LC_I18N, and label when language changes
    function setLang(l){
      try{ localStorage.setItem('litcash_lang', l); }catch(_){}
      if (window.LC_I18N) {
        try{ LC_I18N.setLang(l); LC_I18N.apply(); }catch(_){}
      }
      if (label) {
        label.textContent = (l === 'ru' ? 'RU' : 'EN');
      }
      try{ document.documentElement.setAttribute('lang', l); }catch(_){}
    }
    // Initialize label with current language
    const current = getLang();
    if (label) label.textContent = (current === 'ru' ? 'RU' : 'EN');

    function openMenu() {
      btn.setAttribute('aria-expanded','true');
      container.classList.add('is-open');
      menu.focus();
    }
    function closeMenu() {
      btn.setAttribute('aria-expanded','false');
      container.classList.remove('is-open');
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
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
   * Find a suitable header or nav element to mount our switcher into.  A list
   * of selectors is attempted in order; the first match will be used.  If
   * nothing is found the switcher is added to the body and positioned via
   * CSS.
   * @returns {HTMLElement|null}
   */
  function findHeaderMount(){
    const selectors = [
      'header .container', 'header .wrapper', 'header nav', 'header',
      '.header .container', '.header .wrapper', '.header nav', '.header',
      '.navbar', '.topbar', '.top-bar', '.nav', '.site-header'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  /**
   * Main entry point: ensure exactly one language switcher exists.  If one
   * already exists in the markup (`.lc-lang`), attach handlers to it.  If
   * not, create a new switcher and append it to a header/nav container or
   * fallback to the body.
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
      mountPoint.appendChild(container);
    } else {
      container.classList.add('lc-floating');
      (document.body || document.documentElement).appendChild(container);
    }
    bind(container);
  }

  /**
   * Call mount() when the document is ready.  This ensures we can attach
   * events and find header elements even if this script is loaded with
   * `defer`.
   */
  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(mount);
})();