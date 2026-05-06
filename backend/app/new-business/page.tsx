'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Company = {
  document_id: string
  company_name: string
  company_type: string
  owner_name: string | null
  address: string | null
  city: string | null
  state: string
  zip: string | null
  email: string | null
  status: string
  id?: string
}

type PageView = 'id-entry' | 'landing'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── HEADER ── */
  .nb-header {
    background: #1B3A6B;
    height: 64px;
    padding: 0 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,.25);
  }
  .nb-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .nb-logo-mark {
    width: 38px;
    height: 38px;
    background: #2563EB;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: 'Fraunces', serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -.5px;
    flex-shrink: 0;
  }
  .nb-logo-text {
    line-height: 1.25;
  }
  .nb-logo-text .l1 {
    color: #fff;
    font-family: 'Fraunces', serif;
    font-size: .95rem;
    font-weight: 700;
  }
  .nb-logo-text .l2 {
    color: #93c5fd;
    font-size: .68rem;
    font-weight: 500;
    letter-spacing: .3px;
  }
  .nb-header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .nb-phone {
    color: rgba(255,255,255,.85);
    font-size: .82rem;
    font-weight: 600;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color .15s;
  }
  .nb-phone:hover { color: #fff; }
  .nb-lang {
    display: flex;
    background: rgba(255,255,255,.12);
    border-radius: 20px;
    padding: 3px;
    gap: 2px;
  }
  .nb-lang button {
    padding: 4px 13px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    font-size: .72rem;
    font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .15s;
  }
  .nb-lang button.active  { background: #fff; color: #1B3A6B; }
  .nb-lang button:not(.active) { background: transparent; color: rgba(255,255,255,.65); }

  /* ── WELCOME ── */
  .nb-welcome {
    background: #fff;
    padding: 52px 40px 56px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
  }
  .nb-welcome-inner {
    max-width: 680px;
    margin: 0 auto;
  }
  .nb-welcome-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: 20px;
    padding: 5px 14px;
    font-size: .72rem;
    font-weight: 700;
    color: #1d4ed8;
    letter-spacing: .4px;
    margin-bottom: 20px;
  }
  .nb-welcome h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(1.3rem, 2.5vw, 1.75rem);
    font-weight: 700;
    color: #1B3A6B;
    line-height: 1.2;
    margin-bottom: 12px;
  }
  .nb-welcome h1 span {
    color: #2563EB;
  }
  .nb-welcome p {
    color: #475569;
    font-size: .9rem;
    line-height: 1.8;
    max-width: 560px;
    margin: 0 auto;
  }

  /* ── ID ENTRY ── */
  .entry-wrap {
    min-height: calc(100vh - 64px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F5F9;
    padding: 40px 24px;
  }
  .entry-card {
    background: #fff;
    border-radius: 16px;
    padding: 40px 44px;
    max-width: 460px;
    width: 100%;
    box-shadow: 0 8px 40px rgba(27,58,107,.14);
    border: 1px solid #e2e8f0;
  }
  .entry-tag {
    display: inline-block;
    background: #EFF6FF;
    color: #2563EB;
    font-size: .68rem;
    font-weight: 700;
    letter-spacing: .8px;
    text-transform: uppercase;
    padding: 4px 11px;
    border-radius: 20px;
    margin-bottom: 14px;
  }
  .entry-title {
    font-family: 'Fraunces', serif;
    font-size: 1.55rem;
    font-weight: 900;
    color: #1B3A6B;
    line-height: 1.2;
    margin-bottom: 8px;
  }
  .entry-sub {
    color: #64748b;
    font-size: .86rem;
    line-height: 1.65;
    margin-bottom: 24px;
  }
  .entry-label {
    display: block;
    font-size: .67rem;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: .5px;
    margin-bottom: 5px;
  }
  .entry-input {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: .92rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1e293b;
    outline: none;
    transition: all .2s;
    background: #f8fafc;
    letter-spacing: .5px;
  }
  .entry-input:focus {
    border-color: #2563EB;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(37,99,235,.08);
  }
  .entry-input.err { border-color: #ef4444; background: #fef2f2; }
  .entry-err {
    font-size: .74rem;
    color: #dc2626;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .entry-btn {
    width: 100%;
    padding: 13px;
    border-radius: 8px;
    background: #1B3A6B;
    color: #fff;
    font-size: .92rem;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin-top: 14px;
    transition: all .2s;
    box-shadow: 0 4px 14px rgba(27,58,107,.3);
  }
  .entry-btn:hover:not(:disabled) {
    background: #15306090;
    transform: translateY(-1px);
    box-shadow: 0 7px 20px rgba(27,58,107,.38);
  }
  .entry-btn:disabled { opacity: .55; cursor: not-allowed; }
  .entry-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 18px 0;
    color: #cbd5e1;
    font-size: .72rem;
  }
  .entry-divider::before, .entry-divider::after {
    content: ''; flex: 1; height: 1px; background: #e2e8f0;
  }

  @media (max-width: 600px) {
    .nb-header { padding: 0 16px; }
    .nb-welcome { padding: 44px 20px 52px; }
    .entry-card { padding: 28px 22px; }
  }
`

function NewBusinessContent() {
  const sp = useSearchParams()
  const [lang, setLang] = useState<'en' | 'es'>('en')

  const [view, setView]           = useState<PageView>('id-entry')
  const [docInput, setDocInput]   = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [company, setCompany]     = useState<Company | null>(null)
  const [lookupErr, setLookupErr] = useState('')

  const lookup = useCallback(async (id: string): Promise<boolean> => {
    if (!id.trim()) return false
    setLookingUp(true); setLookupErr('')
    try {
      const res  = await fetch(`/api/sunbiz?document_id=${encodeURIComponent(id.trim())}`)
      const data = await res.json()
      if (!res.ok || !data.company) {
        setLookupErr(lang === 'es' ? 'Document ID no encontrado. Verifica e intenta de nuevo.' : 'Document ID not found. Please verify and try again.')
        return false
      }
      setCompany(data.company)
      return true
    } catch {
      setLookupErr(lang === 'es' ? 'Error de conexión. Intenta de nuevo.' : 'Connection error. Please try again.')
      return false
    } finally {
      setLookingUp(false)
    }
  }, [lang])

  useEffect(() => {
    const id = sp.get('id')
    const l  = sp.get('lang')
    if (l === 'es') setLang('es')
    if (id) { setDocInput(id); setView('landing'); lookup(id) }
  }, [sp, lookup])

  async function handleIdEntry() {
    const empty = lang === 'es' ? 'Por favor ingresa tu Document ID.' : 'Please enter your Document ID.'
    if (!docInput.trim()) { setLookupErr(empty); return }
    const found = await lookup(docInput)
    if (found) { setView('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  const welcomeTitle = lang === 'es'
    ? company ? <>¡Felicidades, <span>{company.company_name}!</span></> : <>¡Bienvenido a Florida Business Formation Center!</>
    : company ? <>Congratulations, <span>{company.company_name}!</span></> : <>Welcome to Florida Business Formation Center!</>

  const welcomeSub = lang === 'es'
    ? 'Tu registro en el Estado de Florida ha sido exitoso. Estamos aquí para ayudarte a completar los pasos finales para que tu negocio sea plenamente operativo y cumpla con todas las normativas.'
    : 'Your registration with the State of Florida was successful. We are here to help you complete the final steps so your business is fully operational and compliant with all regulations.'

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', background: '#F1F5F9' }}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <header className="nb-header">
        <div className="nb-logo">
          <div className="nb-logo-mark">FL</div>
          <div className="nb-logo-text">
            <div className="l1">Florida Business Formation Center</div>
            <div className="l2">mybusinessformation.com</div>
          </div>
        </div>
        <div className="nb-header-right">
          <div className="nb-lang">
            {(['en', 'es'] as const).map(l => (
              <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <a href="tel:8001234567" className="nb-phone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.86 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            (800) 123-4567
          </a>
        </div>
      </header>

      {/* ── ID ENTRY ── */}
      {view === 'id-entry' && (
        <div className="entry-wrap">
          <div className="entry-card">
            <span className="entry-tag">
              {lang === 'es' ? 'Cumplimiento Empresarial' : 'Business Compliance'}
            </span>
            <h1 className="entry-title">
              {lang === 'es' ? 'Completa tu solicitud' : 'Complete your request'}
            </h1>
            <p className="entry-sub">
              {lang === 'es'
                ? 'Ingresa el Document ID del aviso que recibiste para localizar la información de tu empresa.'
                : 'Enter the Document ID from the notice you received to locate your business information.'}
            </p>
            <label className="entry-label" htmlFor="nb-doc">Document ID</label>
            <input
              id="nb-doc"
              className={`entry-input${lookupErr ? ' err' : ''}`}
              value={docInput}
              onChange={e => { setDocInput(e.target.value.toUpperCase()); setLookupErr('') }}
              onKeyDown={e => e.key === 'Enter' && handleIdEntry()}
              placeholder={lang === 'es' ? 'ej. L26000098321' : 'e.g. L26000098321'}
            />
            {lookupErr && <p className="entry-err">⚠ {lookupErr}</p>}
            <button className="entry-btn" onClick={handleIdEntry} disabled={lookingUp}>
              {lookingUp
                ? (lang === 'es' ? 'Buscando...' : 'Looking up...')
                : (lang === 'es' ? 'Buscar mi empresa' : 'Find my business')}
            </button>

            {/* TEMP — remove before launch */}
            <div className="entry-divider">o</div>
            <button
              onClick={() => { setView('landing') }}
              style={{ width:'100%', background:'none', border:'1px dashed #cbd5e1', borderRadius:8, padding:'9px', fontSize:'.74rem', color:'#94a3b8', cursor:'pointer', fontFamily:'inherit' }}
            >
              [TEMP] Ver landing sin Document ID →
            </button>
          </div>
        </div>
      )}

      {/* ── LANDING ── */}
      {view === 'landing' && (
        <>
          {/* WELCOME */}
          <section className="nb-welcome">
            <div className="nb-welcome-inner">
              <div className="nb-welcome-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {lang === 'es' ? 'Registro Confirmado — Florida' : 'Registration Confirmed — Florida'}
              </div>

              {lookingUp ? (
                <h1 style={{ color: 'rgba(255,255,255,.5)', fontSize: '1.5rem' }}>
                  {lang === 'es' ? 'Buscando tu empresa...' : 'Looking up your business...'}
                </h1>
              ) : (
                <h1>{welcomeTitle}</h1>
              )}

              <p>{welcomeSub}</p>
            </div>
          </section>

          {/* placeholder — next sections go here */}
          <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '.85rem' }}>
            — Próximas secciones —
          </div>
        </>
      )}
    </div>
  )
}

export default function NewBusinessPage() {
  return (
    <Suspense>
      <NewBusinessContent />
    </Suspense>
  )
}
