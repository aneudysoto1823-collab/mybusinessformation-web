'use client'

import { useEffect, useState } from 'react'
import { getConsent, setConsent } from '@/lib/consent'

type Lang = 'en' | 'es'

const COPY = {
  en: {
    title: 'Cookie preferences',
    body: 'We use cookies to make this site work and to understand how people use it. You decide what is OK with you.',
    acceptAll: 'Accept all',
    onlyNecessary: 'Only necessary',
    customize: 'Customize',
    save: 'Save preferences',
    necessary: 'Necessary',
    necessaryDesc: 'Required for the site to work (login, security). Always on.',
    analytics: 'Analytics',
    analyticsDesc: 'Helps us understand which pages people use, anonymously.',
    marketing: 'Marketing',
    marketingDesc: 'Used to measure ads we run on other platforms.',
  },
  es: {
    title: 'Preferencias de cookies',
    body: 'Usamos cookies para que el sitio funcione y para entender cómo lo usa la gente. Vos decidís qué te parece bien.',
    acceptAll: 'Aceptar todo',
    onlyNecessary: 'Solo necesarias',
    customize: 'Personalizar',
    save: 'Guardar preferencias',
    necessary: 'Necesarias',
    necessaryDesc: 'Requeridas para que el sitio funcione (login, seguridad). Siempre activas.',
    analytics: 'Analíticas',
    analyticsDesc: 'Nos ayudan a entender qué páginas usa la gente, de forma anónima.',
    marketing: 'Marketing',
    marketingDesc: 'Usadas para medir anuncios que hacemos en otras plataformas.',
  },
} as const

// Detecta el idioma desde la URL. `/es` o `?lang=es` → 'es'; resto → 'en'.
function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const path = window.location.pathname
  if (path === '/es' || path.startsWith('/es/') || path.startsWith('/new-business/es')) return 'es'
  const params = new URLSearchParams(window.location.search)
  if (params.get('lang') === 'es') return 'es'
  return 'en'
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    // Hidratamos en cliente: mostramos el banner solo si nunca se decidió.
    const existing = getConsent()
    if (!existing) {
      // Pequeño delay para no aparecer antes del first paint.
      const t = setTimeout(() => setVisible(true), 500)
      setLang(detectLang())
      return () => clearTimeout(t)
    }
  }, [])

  if (!visible) return null

  const t = COPY[lang]

  const acceptAll = () => {
    setConsent({ analytics: true, marketing: true })
    setVisible(false)
  }
  const onlyNecessary = () => {
    setConsent({ analytics: false, marketing: false })
    setVisible(false)
  }
  const saveCustom = () => {
    setConsent({ analytics, marketing })
    setVisible(false)
  }

  return (
    <>
      <style>{`
        .cc-overlay {
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          z-index: 9000;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          pointer-events: none;
        }
        .cc-card {
          max-width: 560px;
          margin: 0 auto;
          background: #1C2E44;
          color: #fff;
          border-radius: 14px;
          padding: 20px 22px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
          border: 1px solid #2c4060;
          pointer-events: auto;
          animation: cc-slide-up 0.3s ease-out;
        }
        @keyframes cc-slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .cc-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 6px;
          color: #fff;
        }
        .cc-body {
          font-size: 13.5px;
          line-height: 1.55;
          margin: 0 0 14px;
          color: #cbd5e1;
        }
        .cc-btn-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cc-btn {
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          border: none;
          transition: background 0.15s, transform 0.05s;
          min-height: 40px;
        }
        .cc-btn:active { transform: translateY(1px); }
        .cc-btn-primary {
          background: #2563EB;
          color: #fff;
          flex: 1;
        }
        .cc-btn-primary:hover { background: #1d4ed8; }
        .cc-btn-secondary {
          background: transparent;
          color: #cbd5e1;
          border: 1px solid #475569;
          flex: 1;
        }
        .cc-btn-secondary:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .cc-btn-link {
          background: transparent;
          color: #60a5fa;
          text-decoration: underline;
          padding: 10px 8px;
          min-height: auto;
        }
        .cc-options {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #2c4060;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cc-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .cc-toggle {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .cc-toggle input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .cc-toggle input:disabled { cursor: not-allowed; opacity: 0.5; }
        .cc-option-text { flex: 1; }
        .cc-option-name {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 2px;
        }
        .cc-option-desc {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
          line-height: 1.45;
        }
        @media (max-width: 480px) {
          .cc-overlay { bottom: 8px; left: 8px; right: 8px; }
          .cc-card { padding: 16px; border-radius: 12px; }
          .cc-btn { font-size: 12.5px; padding: 9px 12px; }
        }
      `}</style>
      <div className="cc-overlay" role="dialog" aria-label={t.title}>
        <div className="cc-card">
          <p className="cc-title">{t.title}</p>
          <p className="cc-body">{t.body}</p>

          {!expanded && (
            <div className="cc-btn-row">
              <button className="cc-btn cc-btn-primary" onClick={acceptAll}>
                {t.acceptAll}
              </button>
              <button className="cc-btn cc-btn-secondary" onClick={onlyNecessary}>
                {t.onlyNecessary}
              </button>
              <button className="cc-btn cc-btn-link" onClick={() => setExpanded(true)}>
                {t.customize}
              </button>
            </div>
          )}

          {expanded && (
            <>
              <div className="cc-options">
                <div className="cc-option">
                  <span className="cc-toggle">
                    <input type="checkbox" checked disabled />
                  </span>
                  <div className="cc-option-text">
                    <p className="cc-option-name">{t.necessary}</p>
                    <p className="cc-option-desc">{t.necessaryDesc}</p>
                  </div>
                </div>
                <div className="cc-option">
                  <span className="cc-toggle">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      aria-label={t.analytics}
                    />
                  </span>
                  <div className="cc-option-text">
                    <p className="cc-option-name">{t.analytics}</p>
                    <p className="cc-option-desc">{t.analyticsDesc}</p>
                  </div>
                </div>
                <div className="cc-option">
                  <span className="cc-toggle">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                      aria-label={t.marketing}
                    />
                  </span>
                  <div className="cc-option-text">
                    <p className="cc-option-name">{t.marketing}</p>
                    <p className="cc-option-desc">{t.marketingDesc}</p>
                  </div>
                </div>
              </div>
              <div className="cc-btn-row" style={{ marginTop: 14 }}>
                <button className="cc-btn cc-btn-primary" onClick={saveCustom}>
                  {t.save}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
