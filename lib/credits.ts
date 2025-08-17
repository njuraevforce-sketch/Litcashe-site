export async function creditView(videoId: string, watchedSeconds: number) {
  const token = (await import('./supabaseClient')).supabase.auth.getSession().then(r=>r.data.session?.access_token)
  const t = await token
  if (!t) throw new Error('Not authenticated')
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('.co', '.co/functions/v1')
  const res = await fetch(`${base}/credit-view`,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},
    body: JSON.stringify({ video_id: videoId, watched_seconds: watchedSeconds })
  })
  if(!res.ok){ throw new Error(await res.text())}
  return await res.json()
}

export async function requestWithdrawal(amountCents: number, method: string, address: string) {
  const token = (await import('./supabaseClient')).supabase.auth.getSession().then(r=>r.data.session?.access_token)
  const t = await token
  if (!t) throw new Error('Not authenticated')
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('.co', '.co/functions/v1')
  const res = await fetch(`${base}/request-withdrawal`,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},
    body: JSON.stringify({ amount_cents: amountCents, method, address })
  })
  if(!res.ok){ throw new Error(await res.text())}
  return await res.json()
}
