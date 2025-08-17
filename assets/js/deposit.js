// assets/js/deposit.js
(async function(){
  if (!window.sb) return;
  const form = document.getElementById('depositForm');
  const out = document.getElementById('depositResult');
  if (!form || !out) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('depAmount') && document.getElementById('depAmount').value || '0');
    if (!amount || amount <= 0) { alert('Введите сумму'); return; }
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) { alert('Войдите в аккаунт'); return; }
    const base = window.SUPABASE_URL.replace('.co', '.co/functions/v1');
    const res = await fetch(`${base}/create-deposit-intent`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},
      body: JSON.stringify({ amount_cents: Math.round(amount * 100), currency: 'USDT', network: 'TRC20' })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Ошибка'); return; }
    out.innerHTML = `
      <div class="card" style="margin-top:12px">
        <div><b>Отправьте:</b> ${ (data.amount_cents/100).toFixed(2) } USDT (TRC20)</div>
        <div><b>Адрес:</b> <code>${data.address}</code></div>
        <div><b>Memo:</b> <code>${data.memo}</code></div>
        <div class="muted" style="margin-top:8px">После поступления и подтверждения платежа в сети ваш баланс обновится автоматически (или после проверки админом).</div>
      </div>`;
  });
})();