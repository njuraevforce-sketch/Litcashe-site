// app_supabase.js (autowired)
;(function(){
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('Supabase config missing'); return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    // Expecting supabase-js to be loaded via script tag on pages
    console.warn('supabase global not found. Make sure <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> is included.');
  }
  window.sb = window.supabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
if (window.sb) { document.dispatchEvent(new Event('sb-ready')); }
  async function getSession() {
    if (!window.sb) return { session: null };
    const { data: { session } } = await window.sb.auth.getSession();
    return { session };
  }

  window.LC = {
    async afterAuth() {
      await this.applyReferral();
      await this.refreshBalance();
      await this.mountReferral();
    },

    async applyReferral() {
      try {
        const urlParams = new URLSearchParams(location.search);
        const refParam = urlParams.get('ref') || localStorage.getItem('lc_ref_code');
        if (!refParam) return;
        localStorage.setItem('lc_ref_code', refParam);
        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) return;
        const { data: prof, error: e1 } = await window.sb.from('profiles').select('referred_by').eq('id', user.id).maybeSingle();
        if (e1) return;
        if (prof && prof.referred_by) return; // already set
        const { data: refOwner, error: e2 } = await window.sb.from('profiles').select('id').eq('ref_code', refParam).maybeSingle();
        if (e2 || !refOwner || refOwner.id === user.id) return;
        await window.sb.from('profiles').update({ referred_by: refOwner.id }).eq('id', user.id);
      } catch(e){ console.error(e); }
    },

    async setupVideoTracking() {
      try {
        const videos = Array.from(document.querySelectorAll('video[data-video-id]'));
        for (const v of videos) {
          let credited = false;
          let watched = 0;
          const required = 30; // seconds
          v.addEventListener('timeupdate', async () => {
            if (v.seeking || v.paused) return;
            watched = Math.floor(v.currentTime);
            if (!credited && watched >= required) {
              credited = true;
              const vid = v.getAttribute('data-video-id') || 'video';
              try { await window.LC.creditView(vid, watched); } catch(e){ console.error(e); }
            }
          });
        }
      } catch (e) { console.error(e); }
    },

    async refreshBalance() {
      try {
        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) return;
        const { data, error } = await window.sb.from('wallets').select('balance_cents').eq('user_id', user.id).maybeSingle();
        if (!error && data) {
          const el = document.querySelector('[data-balance]');
          if (el) el.textContent = (data.balance_cents / 100).toFixed(2) + ' $';
        }
      } catch(e) { console.error(e); }
    },
    async creditView(videoId, watchedSeconds) {
      const { session } = await getSession();
      if (!session) { alert('Войдите в аккаунт'); return; }
      const base = window.SUPABASE_URL.replace('.co', '.co/functions/v1');
      const res = await fetch(`${base}/credit-view`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},
        body: JSON.stringify({ video_id: videoId, watched_seconds: watchedSeconds })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Ошибка начисления'); return; }
      await window.LC.refreshBalance();
      return data;
    },
    async requestWithdrawal(amountCents, method, address) {
      const { session } = await getSession();
      if (!session) { alert('Войдите в аккаунт'); return; }
      const base = window.SUPABASE_URL.replace('.co', '.co/functions/v1');
      const res = await fetch(`${base}/request-withdrawal`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},
        body: JSON.stringify({ amount_cents: amountCents, method, address })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Ошибка запроса вывода'); return; }
      await window.LC.refreshBalance();
      alert('Заявка на вывод создана: pending');
      return data;
    },
    async mountReferral() {
      try {
        const wrap = document.getElementById('refLinkWrap');
        const input = document.getElementById('refLink');
        if (!wrap || !input) return;
        const { data: { user } } = await window.sb.auth.getUser();
        if (!user) return;
        const { data, error } = await window.sb.from('profiles').select('ref_code').eq('id', user.id).maybeSingle();
        if (!error && data?.ref_code) {
          const url = new URL(location.origin + '/register_single.html');
          url.searchParams.set('ref', data.ref_code);
          input.value = url.toString();
          wrap.style.display = 'block';
        }
      } catch(e) { console.error(e); }
    },
    async logout() {
      if (!window.sb) return;
      await window.sb.auth.signOut();
      location.href = '/';
    }
  };

  // Auto-wire buttons/forms by id if present
  document.addEventListener('DOMContentLoaded', () => { window.LC.setupVideoTracking();
    const btnCredit = document.getElementById('btnCreditView');
    if (btnCredit) {
      btnCredit.addEventListener('click', async () => {
        const vid = btnCredit.getAttribute('data-video-id') || 'video1';
        await window.LC.creditView(vid, 35);
      });
    }
    const wForm = document.getElementById('withdrawForm');
    if (wForm) {
      wForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('amount').value || '0');
        const method = document.getElementById('method').value || 'tron';
        const address = document.getElementById('address').value || '';
        await window.LC.requestWithdrawal(Math.round(amount * 100), method, address);
      });
    }
    window.LC.refreshBalance();
    window.LC.mountReferral();
  });
})();
