'use client'
import React from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LogoutButton({ className = '' }: { className?: string }) {
  const onClick = async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }
  return (
    <button onClick={onClick} className={className}>
      Выйти
    </button>
  )
}
