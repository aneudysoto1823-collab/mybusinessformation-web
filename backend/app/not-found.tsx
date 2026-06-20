'use client'

import { useEffect, useState } from 'react'

export default function NotFound() {
  const [lang, setLang] = useState<'en' | 'es'>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('flbc_lang')
      if (saved === 'es' || saved === 'en') setLang(saved)
    } catch {}
  }, [])

  const t = {
    en: {
      title: 'Page not found',
      sub: 'The page you are looking for does not exist or may have moved.',
      home: 'Back to Home',
      services: 'View Services',
    },
    es: {
      title: 'Página no encontrada',
      sub: 'La página que buscas no existe o pudo haber sido movida.',
      home: 'Volver al Inicio',
      services: 'Ver Servicios',
    },
  }[lang]

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 24px',
      background: 'linear-gradient(160deg, #0f1c2e 0%, #1C2E44 100%)',
      color: '#fff',
    }}>
      {/* Marca */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 40 }}>
        <div style={{
          width: 44, height: 44, background: '#2563EB', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.5px',
        }}>OB</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
          <span style={{ color: '#e2e8f0' }}>Opa</span><span style={{ color: '#60a5fa' }}>Biz</span>
        </div>
      </a>

      <div style={{
        fontFamily: "'Fraunces', serif", fontSize: 'clamp(4rem, 18vw, 8rem)',
        fontWeight: 700, lineHeight: 1, color: '#2563EB', marginBottom: 8,
      }}>404</div>

      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.4rem, 5vw, 2rem)', fontWeight: 600, margin: '0 0 12px' }}>
        {t.title}
      </h1>

      <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: 440, margin: '0 0 32px', lineHeight: 1.6 }}>
        {t.sub}
      </p>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="/" style={{
          background: '#2563EB', color: '#fff', textDecoration: 'none',
          padding: '13px 26px', borderRadius: 8, fontWeight: 600, fontSize: '0.95rem', minHeight: 44,
          display: 'inline-flex', alignItems: 'center',
        }}>{t.home}</a>
        <a href="/servicios" style={{
          background: 'transparent', color: '#e2e8f0', textDecoration: 'none',
          padding: '13px 26px', borderRadius: 8, fontWeight: 600, fontSize: '0.95rem', minHeight: 44,
          display: 'inline-flex', alignItems: 'center', border: '1.5px solid rgba(255,255,255,0.2)',
        }}>{t.services}</a>
      </div>
    </div>
  )
}
