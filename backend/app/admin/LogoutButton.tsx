'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      title="Cerrar sesión"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '8px 16px',
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#374151',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'border-color 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = '#b91c1c'
        el.style.color = '#b91c1c'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = '#e5e7eb'
        el.style.color = '#374151'
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Cerrar sesión
    </button>
  )
}
