// assets/js/settings.js
;(function(){
  if (!window.sb) return;
  function q(id){ return document.getElementById(id); }

  async function saveWallet(){
    const addr = (q('wallet')?.value || '').trim();
    if (!addr){ alert('Укажите адрес кошелька (TRC20)'); return; }
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user){ alert('Войдите в аккаунт'); return; }
    // Пишем адрес кошелька в таблицу wallets (upsert по user_id)
    const payload = { user_id: user.id, address: addr };
    const { error } = await window.sb.from('wallets').upsert(payload, { onConflict: 'user_id' });
    if (error){ alert(error.message || 'Ошибка сохранения'); return; }
    alert('Кошелёк сохранён');
  }

  async function setPass(){
    const oldp = (q('oldPass')?.value || '').trim(); // не обязателен для supabase
    const p1 = (q('newPass')?.value || '').trim();
    const p2 = (q('newPass2')?.value || '').trim();
    if (!p1 || !p2){ alert('Введите новый пароль дважды'); return; }
    if (p1 !== p2){ alert('Пароли не совпадают'); return; }
    const { error } = await window.sb.auth.updateUser({ password: p1 });
    if (error){ alert(error.message || 'Ошибка смены пароля'); return; }
    alert('Пароль обновлён');
    q('newPass').value = q('newPass2').value = '';
    if (q('oldPass')) q('oldPass').value = '';
  }

  document.addEventListener('DOMContentLoaded', function(){
    const btnSave = q('saveWallet');
    const btnPass = q('setPass');
    if (btnSave) btnSave.addEventListener('click', function(e){ e.preventDefault(); saveWallet(); });
    if (btnPass) btnPass.addEventListener('click', function(e){ e.preventDefault(); setPass(); });
  });
})();