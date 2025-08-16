// Minimal i18n (RU/EN). Use data-i18n="key" on elements.
(function(){
  const i18n = {
    lang: localStorage.getItem('lang') || 'ru',
    dict: {
      ru: {
        start: 'Старт', balance: 'Баланс', deposit: 'Пополнить', withdraw: 'Вывести',
        referrals: 'Рефералы', login: 'Войти', register: 'Регистрация', logout: 'Выйти',
        dashboard: 'Дашборд', settings: 'Настройки', faq: 'FAQ'
      },
      en: {
        start: 'Start', balance: 'Balance', deposit: 'Deposit', withdraw: 'Withdraw',
        referrals: 'Referrals', login: 'Login', register: 'Register', logout: 'Logout',
        dashboard: 'Dashboard', settings: 'Settings', faq: 'FAQ'
      }
    },
    t(key){ const d=this.dict[this.lang]||{}; return d[key]||key; },
    apply(){
      document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = this.t(el.dataset.i18n); });
    },
    set(lang){ this.lang=lang; localStorage.setItem('lang', lang); this.apply(); }
  };
  window.i18n = i18n;
  document.addEventListener('DOMContentLoaded', ()=> i18n.apply());
})();
