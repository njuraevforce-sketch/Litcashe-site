'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ReferralLink() {
  const [link, setLink] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data, error } = await supabase
        .from('profiles')
        .select('ref_code')
        .eq('id', user.id)
        .maybeSingle()
      if (!error && data?.ref_code) {
        const url = new URL(window.location.origin)
        url.pathname = '/signup'
        url.searchParams.set('ref', data.ref_code)
        setLink(url.toString())
      }
      setLoading(false)
    })()
  }, [])

  if (loading) return <span>...</span>
  if (!link) return null
  return (
    <div className="ref-block">
      <span>Ваша реферальная ссылка:</span>
      <input readOnly value={link} onClick={(e) => (e.target as HTMLInputElement).select()} />
    </div>
  )
}
