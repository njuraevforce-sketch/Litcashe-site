(function(){
  let deferred;
  const btn = document.createElement('button');
  btn.textContent = 'Установить приложение';
  btn.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9999;padding:10px 14px;border-radius:12px;border:none;background:#1e88e5;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.25);display:none;';
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    btn.style.display = 'none';
    console.log('[PWA] install choice:', outcome);
  });
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone) btn.style.display = 'block';
  });
  window.addEventListener('appinstalled', () => { btn.style.display = 'none'; deferred = null; });
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
})();