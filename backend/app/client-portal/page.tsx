'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const T = {
  en: {
    eyebrow: 'Client Access',
    title: 'Track your order',
    subtitle: 'Enter your email and confirmation number from your order receipt to access your filing status.',
    email: 'Email address',
    emailPlaceholder: 'you@example.com',
    confNum: 'Confirmation number',
    confPlaceholder: 'FBFC-00000000 or FBNB-00000000',
    confHint: 'Found in your order confirmation email',
    btn: 'Access My Order →',
    btnLoading: 'Accessing…',
    noConf: "Don't have your confirmation number?",
    contact: 'Contact us',
    terms: 'By accessing this portal you agree to our',
    termsLink: 'Terms of Service',
    and: 'and',
    privacyLink: 'Privacy Policy',
    error: "We couldn't find an order matching that email and confirmation number.",
    portal: 'Client Portal',
    footer: '© 2026 Florida Business Formation Center — mybusinessformation.com',
  },
  es: {
    eyebrow: 'Acceso de Clientes',
    title: 'Rastrea tu orden',
    subtitle: 'Ingresa tu correo y número de confirmación de tu recibo para acceder al estado de tu trámite.',
    email: 'Correo electrónico',
    emailPlaceholder: 'tú@ejemplo.com',
    confNum: 'Número de confirmación',
    confPlaceholder: 'FBFC-00000000 o FBNB-00000000',
    confHint: 'Lo encuentras en el email de confirmación de tu orden',
    btn: 'Acceder a Mi Orden →',
    btnLoading: 'Accediendo…',
    noConf: '¿No tienes tu número de confirmación?',
    contact: 'Contáctanos',
    terms: 'Al acceder aceptas nuestros',
    termsLink: 'Términos de Servicio',
    and: 'y la',
    privacyLink: 'Política de Privacidad',
    error: 'No encontramos una orden con ese correo y número de confirmación.',
    portal: 'Portal de Clientes',
    footer: '© 2026 Florida Business Formation Center — mybusinessformation.com',
  },
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [confirmationNumber, setConfirmationNumber] = useState(searchParams.get('order') ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'en' | 'es'>('en')
  const [showContact, setShowContact] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('portal_lang')
    if (saved === 'en' || saved === 'es') setLang(saved)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setShowContact(false)
      }
    }
    if (showContact) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showContact])

  function switchLang(l: 'en' | 'es') {
    setLang(l)
    localStorage.setItem('portal_lang', l)
  }

  const t = T[lang]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/client-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, confirmationNumber }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/client-portal/dashboard')
    } else {
      setError(t.error)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #0f1c2e;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
        }

        /* ── Page wrapper ── */
        .portal-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          width: 100%;
          max-width: 860px;
        }

        /* ── Welcome header above card ── */
        .portal-header {
          text-align: center;
        }
        .portal-header-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .portal-header-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }
        .portal-header-name {
          font-family: 'Fraunces', serif;
          font-size: 22px; font-weight: 700;
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.4px;
          line-height: 1.1;
          text-align: left;
        }
        .portal-header-name span {
          display: block;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.35);
          letter-spacing: 1.2px; text-transform: uppercase;
          margin-top: 4px;
        }
        .portal-header-rule {
          width: 48px; height: 1.5px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          margin: 0 auto 12px;
        }
        .portal-header-tagline {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.3px;
          line-height: 1.5;
        }

        /* ── Centered card ── */
        .card {
          display: flex;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08);
          width: 100%;
        }

        /* ── Photo side ── */
        .card-photo {
          display: none;
          flex-shrink: 0;
          position: relative;
        }
        @media (min-width: 720px) { .card-photo { display: block; } }

        .card-photo img {
          display: block;
          width: 380px;
          height: auto;
        }

        /* Subtle vignette on right edge so it blends with form */
        .card-photo::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 60px;
          background: linear-gradient(to right, transparent, rgba(248,250,252,0.5));
          pointer-events: none;
        }

        /* ── Form side ── */
        .card-form {
          flex: 1;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          padding: 36px 40px 28px;
          position: relative;
          min-height: 560px;
        }

        /* Lang toggle */
        .lang-toggle {
          position: absolute;
          top: 20px; right: 20px;
          display: flex;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .lang-btn {
          padding: 4px 10px; font-size: 11px; font-weight: 700;
          color: #94a3b8; background: transparent; border: none;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
          letter-spacing: 0.3px;
        }
        .lang-btn.active { background: #1C2E44; color: #ffffff; }
        .lang-btn:hover:not(.active) { color: #374151; }
        .lang-sep { width: 1px; background: #e2e8f0; }

        /* Form content */
        .form-body { flex: 1; }

        .form-eyebrow { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 7px; }
        .form-title { font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 6px; }
        .form-sub { font-size: 13px; color: #64748b; line-height: 1.55; margin-bottom: 24px; }

        .form-group { margin-bottom: 14px; }
        .form-group label { display: block; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .form-group input {
          width: 100%; padding: 10px 13px;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          font-size: 14px; color: #0f172a; background: #ffffff;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .form-group input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .input-hint { font-size: 11px; color: #9ca3af; margin-top: 4px; }

        .btn-access {
          width: 100%; padding: 11px;
          background: #1C2E44; color: #ffffff; border: none;
          border-radius: 8px; font-size: 14px; font-weight: 700;
          cursor: pointer; margin-top: 6px; font-family: inherit;
          transition: background 0.15s, transform 0.1s;
        }
        .btn-access:hover:not(:disabled) { background: #2563eb; }
        .btn-access:active:not(:disabled) { transform: scale(0.99); }
        .btn-access:disabled { background: #94a3b8; cursor: not-allowed; }

        .error-msg {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          border-radius: 8px; padding: 10px 13px; font-size: 13px;
          font-weight: 600; margin-bottom: 14px; line-height: 1.5;
        }

        .contact-note { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 12px; }
        .contact-btn {
          color: #2563eb; font-weight: 600; font-size: 12px;
          background: none; border: none; cursor: pointer;
          font-family: inherit; padding: 0;
        }
        .contact-btn:hover { text-decoration: underline; }

        .contact-options {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
          margin-top: 10px;
        }
        .contact-option {
          display: flex; flex-direction: column; align-items: center;
          gap: 5px; padding: 10px 8px; border-radius: 10px;
          text-decoration: none; color: #0f172a;
          border: 1.5px solid #e2e8f0;
          font-size: 12px; font-weight: 600;
          transition: border-color 0.15s, background 0.15s;
          background: #ffffff;
        }
        .contact-option:hover { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
        .contact-option-icon { font-size: 18px; line-height: 1; }

        .terms-note { text-align: center; font-size: 11px; color: #cbd5e1; line-height: 1.55; margin-top: auto; padding-top: 20px; }
        .terms-note a { color: #94a3b8; text-decoration: underline; }
        .terms-note a:hover { color: #64748b; }

        .copyright { text-align: center; font-size: 10px; color: #cbd5e1; margin-top: 8px; }

        @media (max-width: 480px) {
          body { padding: 20px 12px; }
          .portal-wrapper { gap: 18px; }
          .portal-header-name { font-size: 18px; }
          .card-form { padding: 24px 20px 20px; min-height: unset; }
          .form-title { font-size: 20px; }
          .btn-access { padding: 13px; font-size: 15px; min-height: 48px; }
          .contact-options { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="portal-wrapper">

        {/* ── Welcome header above card ── */}
        <div className="portal-header">
          <div className="portal-header-brand">
            <div className="portal-header-icon">🏛️</div>
            <div className="portal-header-name">
              Florida Business Formation Center
              <span>{t.portal}</span>
            </div>
          </div>
          <div className="portal-header-rule" />
          <p className="portal-header-tagline">
            {lang === 'en'
              ? 'Secure access to your order status and filing documents'
              : 'Acceso seguro al estado de tu orden y documentos de trámite'}
          </p>
        </div>

        {/* ── Card ── */}
        <div className="card">

          {/* ── Photo — natural size ── */}
          <div className="card-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/client-portal-bg.jpg" alt="" />
          </div>

          {/* ── Form ── */}
          <div className="card-form">

            {/* Language toggle */}
            <div className="lang-toggle">
              <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => switchLang('en')}>EN</button>
              <div className="lang-sep" />
              <button className={`lang-btn${lang === 'es' ? ' active' : ''}`} onClick={() => switchLang('es')}>ES</button>
            </div>

            <div className="form-body">
              {/* Heading */}
              <div className="form-eyebrow">{t.eyebrow}</div>
              <div className="form-title">{t.title}</div>
              <p className="form-sub">{t.subtitle}</p>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {error && <div className="error-msg">{error}</div>}

                <div className="form-group">
                  <label htmlFor="email">{t.email}</label>
                  <input
                    id="email" type="text" inputMode="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmationNumber">{t.confNum}</label>
                  <input
                    id="confirmationNumber" type="text" value={confirmationNumber}
                    onChange={e => setConfirmationNumber(e.target.value.toUpperCase())}
                    placeholder={t.confPlaceholder}
                    required
                  />
                  <p className="input-hint">{t.confHint}</p>
                </div>

                <button type="submit" className="btn-access" disabled={loading}>
                  {loading ? t.btnLoading : t.btn}
                </button>

                <div className="contact-note" ref={contactRef}>
                  {t.noConf}{' '}
                  <button type="button" className="contact-btn" onClick={() => setShowContact(v => !v)}>
                    {t.contact}
                  </button>
                  {showContact && (
                    <div className="contact-options">
                      <a className="contact-option" href="mailto:support@mybusinessformation.com">
                        <span className="contact-option-icon">✉️</span>
                        Email
                      </a>
                      <a className="contact-option" href="https://wa.me/13528377755" target="_blank" rel="noopener noreferrer">
                        <span className="contact-option-icon">💬</span>
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <p className="terms-note">
              {t.terms}{' '}
              <a href="/terms">{t.termsLink}</a> {t.and}{' '}
              <a href="/privacy">{t.privacyLink}</a>.
            </p>
            <p className="copyright">{t.footer}</p>

          </div>
        </div>
      </div>
    </>
  )
}

export default function ClientPortalPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
