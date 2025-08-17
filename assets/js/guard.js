// assets/js/guard.js
;(function(){
  if (!window.sb) return;
  document.addEventListener('DOMContentLoaded', async function(){
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session){
      // защищённые страницы
      const p = location.pathname.split('/').pop();
      if (['dashboard_single.html','deposit_single.html','withdraw_single.html','settings_single.html'].includes(p)){
        location.href = 'login_single.html';
      }
    }
  });
})();