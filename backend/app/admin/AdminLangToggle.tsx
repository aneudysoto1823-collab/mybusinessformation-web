'use client'

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function Toggle() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const lang        = searchParams.get('lang') || 'es'

  useEffect(() => {
    localStorage.setItem('admin_lang', lang)
  }, [lang])

  function switchLang(l: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', l)
    router.push(`${pathname}?${params.toString()}`)
  }

  const btnBase: React.CSSProperties = {
    padding: '4px 10px', fontSize: '12px', fontWeight: 700,
    border: 'none', cursor: 'pointer', borderRadius: '6px',
    fontFamily: 'inherit', transition: 'all 0.15s',
  }
  const active:   React.CSSProperties = { background: '#1C2E44', color: '#fff' }
  const inactive: React.CSSProperties = { background: 'transparent', color: '#6b7280' }

  return (
    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
      <button style={{ ...btnBase, ...(lang === 'en' ? active : inactive) }} onClick={() => switchLang('en')}>EN</button>
      <button style={{ ...btnBase, ...(lang === 'es' ? active : inactive) }} onClick={() => switchLang('es')}>ES</button>
    </div>
  )
}

export default function AdminLangToggle() {
  return <Suspense><Toggle /></Suspense>
}
