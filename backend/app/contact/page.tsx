import type { Metadata } from 'next'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'Contact OpaBiz — Florida LLC & Corporation Formation Help',
  description:
    'Get in touch with OpaBiz. Send us a message, schedule a free 30-minute appointment, or reach us by WhatsApp. We reply within 24 business hours.',
  alternates: {
    canonical: 'https://opabiz.com/contact',
    languages: {
      'en-US': 'https://opabiz.com/contact',
      'es-US': 'https://opabiz.com/contact?lang=es',
    },
  },
  openGraph: {
    url: 'https://opabiz.com/contact',
    title: 'Contact OpaBiz — Florida LLC & Corporation Formation Help',
    description:
      'Send us a message, schedule a free 30-minute appointment, or reach us by WhatsApp. We reply within 24 business hours.',
  },
}

// Schema.org @graph para la página de contacto. Reusa la Organization del home
// como mainEntity para no duplicar info.
const contactSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ContactPage',
      '@id': 'https://opabiz.com/contact',
      url: 'https://opabiz.com/contact',
      name: 'Contact OpaBiz',
      description:
        'Get in touch with OpaBiz. Send us a message, schedule an appointment, or reach us by WhatsApp. We reply within 24 hours.',
      inLanguage: 'en-US',
      isPartOf: { '@id': 'https://opabiz.com/#website' },
      mainEntity: { '@id': 'https://opabiz.com/#organization' },
      breadcrumb: { '@id': 'https://opabiz.com/contact#breadcrumb' },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://opabiz.com/contact#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://opabiz.com' },
        { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://opabiz.com/contact' },
      ],
    },
  ],
}

export default function ContactPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-dark:#1D4ED8;--blue-light:#EFF6FF;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--gold:#F59E0B;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray300:#CBD5E1;--gray400:#94A3B8;--gray500:#64748B;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-sans);color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3,h4{font-family:var(--font-serif);line-height:1.2}
a{text-decoration:none;color:inherit}
.topbar{background:var(--navy);color:#fff;font-size:.77rem;padding:9px 24px;text-align:center}
.topbar strong{color:var(--gold)}
header{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray200);padding:0 32px;transition:box-shadow .3s}
header.scrolled{box-shadow:0 2px 20px rgba(28,46,68,.1)}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:66px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;background:linear-gradient(135deg,var(--navy),var(--blue));border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-serif);font-size:1rem;font-weight:700;flex-shrink:0}
.logo-text{font-family:var(--font-serif);font-size:1.5rem;color:var(--navy);font-weight:700;line-height:1.2}
.logo-text span{display:block;font-family:var(--font-sans);font-size:.63rem;color:var(--gray400);font-weight:400;letter-spacing:.8px;text-transform:uppercase}
.logo-text span.logo-opa{display:inline;font-size:1.5rem;color:var(--navy);font-style:normal;letter-spacing:-.5px;text-transform:none;font-family:var(--font-serif);font-weight:700}
.logo-text span.logo-biz{display:inline;font-size:1.5rem;color:#2563EB;font-style:normal;letter-spacing:-.5px;text-transform:none;font-family:var(--font-serif);font-weight:700}
nav a{font-size:.82rem;font-weight:500;color:var(--gray600);padding:6px 10px;border-radius:6px;transition:all .2s;margin-left:2px}
nav a:hover{color:var(--navy);background:var(--gray100)}
.lang-toggle{display:flex;background:var(--gray100);border-radius:20px;padding:3px;gap:2px}
.lang-btn{padding:5px 12px;border-radius:16px;border:none;cursor:pointer;font-size:.77rem;font-weight:600;font-family:inherit;transition:all .2s;color:var(--gray400);background:transparent}
.lang-btn.active{background:var(--navy);color:#fff}
.hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:8px;margin-right:-6px;flex-shrink:0}
.hamburger span{display:block;width:22px;height:2px;background:var(--navy);border-radius:2px;transition:all .3s}
.hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.hamburger.open span:nth-child(2){opacity:0}
.hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
/* PAGE WRAPPER */
.contact-page{max-width:1180px;margin:0 auto;padding:48px 32px 64px;flex:1}
.contact-mini-head{text-align:center;margin-bottom:32px}
.contact-mini-head .badge{display:inline-block;background:var(--blue-light);color:var(--blue);font-size:.7rem;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px}
.contact-mini-head h1{font-size:clamp(1.7rem,3vw,2.2rem);color:var(--navy);font-weight:800;letter-spacing:-.5px;font-family:var(--font-serif)}
.contact-mini-head p{font-size:.95rem;color:var(--gray500);margin-top:6px}
/* SPLIT CARD */
.split-card{display:grid;grid-template-columns:1fr 1fr;background:#fff;border:1px solid var(--gray200);border-radius:22px;overflow:hidden;box-shadow:0 24px 56px rgba(15,23,42,.10),0 2px 6px rgba(15,23,42,.04);min-height:620px}
.split-left{background:linear-gradient(135deg,var(--navy) 0%,#1a3a6b 50%,#2052a8 100%);padding:48px 44px;color:#fff;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;gap:28px}
.split-left::before{content:'';position:absolute;left:-100px;top:-100px;width:340px;height:340px;background:radial-gradient(circle,rgba(96,165,250,.35) 0%,transparent 70%);pointer-events:none;filter:blur(20px)}
.split-left::after{content:'';position:absolute;right:-80px;bottom:-80px;width:260px;height:260px;background:radial-gradient(circle,rgba(37,99,235,.4) 0%,transparent 70%);pointer-events:none;filter:blur(20px)}
.split-left>*{position:relative;z-index:1}
.left-hero .left-badge{display:inline-block;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);color:#fff;font-size:.68rem;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px}
.left-hero h2{font-family:var(--font-serif);font-size:clamp(1.7rem,2.6vw,2.2rem);font-weight:800;line-height:1.1;letter-spacing:-.5px;margin-bottom:14px}
.left-hero p.left-lead{font-size:1rem;color:rgba(255,255,255,.82);line-height:1.6}
.left-promise{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px}
.left-promise-icon{font-size:1.2rem;flex-shrink:0}
.left-promise-text{font-size:.86rem;color:rgba(255,255,255,.92);line-height:1.5}
.left-promise-text strong{color:#fff}
.left-actions{display:flex;flex-direction:column;gap:12px}
.left-action{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:14px 18px;cursor:pointer;transition:all .2s}
.left-action:hover{background:rgba(255,255,255,.13);border-color:rgba(255,255,255,.3);transform:translateX(3px)}
.left-action-icon{width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.left-action-icon svg{width:22px;height:22px;fill:#fff}
.left-action.wa .left-action-icon{background:#25D366}
.left-action.cal .left-action-icon{background:var(--blue)}
.left-action-text{flex:1;display:flex;flex-direction:column}
.left-action-text strong{font-size:.95rem;color:#fff;font-weight:700;line-height:1.2}
.left-action-text span{font-size:.78rem;color:rgba(255,255,255,.68);margin-top:2px;line-height:1.4}
.left-action-arrow{color:rgba(255,255,255,.6);font-size:1.1rem;flex-shrink:0;transition:transform .2s}
.left-action:hover .left-action-arrow{color:#fff;transform:translateX(2px)}
.left-footer{font-size:.78rem;color:rgba(255,255,255,.55);line-height:1.55;border-top:1px solid rgba(255,255,255,.12);padding-top:16px}
.left-footer strong{color:rgba(255,255,255,.8)}
.left-footer a{color:#93c5fd;font-weight:600}
/* SPLIT RIGHT (FORM) */
.split-right{padding:44px 40px;background:#fff;display:flex;flex-direction:column;justify-content:center}
.form-title{font-size:1.35rem;color:var(--navy);font-weight:800;margin-bottom:6px;font-family:var(--font-sans)}
.form-sub{font-size:.88rem;color:var(--gray500);margin-bottom:22px;line-height:1.55}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.form-group{display:flex;flex-direction:column;gap:5px}
.form-label{font-size:.78rem;font-weight:600;color:var(--gray800)}
.form-label .req{color:#ef4444}
.form-label .opt{color:var(--gray400);font-weight:500;font-size:.72rem}
.form-input,.form-textarea{font-family:inherit;font-size:.9rem;color:var(--gray800);border:1.5px solid var(--gray200);border-radius:9px;padding:10px 13px;background:var(--gray50);transition:all .15s;width:100%}
.form-input:focus,.form-textarea:focus{outline:none;border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
.form-textarea{min-height:120px;resize:vertical;line-height:1.55}
.form-submit{margin-top:8px;background:linear-gradient(135deg,var(--blue) 0%,var(--blue-dark) 100%);color:#fff;border:none;padding:13px 26px;border-radius:10px;font-size:.92rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:8px;width:100%;justify-content:center;box-shadow:0 6px 14px rgba(37,99,235,.25)}
.form-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 20px rgba(37,99,235,.35)}
.form-submit:disabled{opacity:.6;cursor:not-allowed}
.form-error{margin-top:12px;background:#FEE2E2;border:1px solid #FCA5A5;color:#991B1B;border-radius:9px;padding:10px 14px;font-size:.82rem;display:none}
.form-error.show{display:block}
.form-success-panel{padding:48px 40px;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:#fff}
.form-success-panel.show{display:flex}
.form-success-panel .success-icon{font-size:3rem;margin-bottom:12px}
.form-success-panel h3{font-size:1.5rem;color:var(--green-dark);font-weight:800;margin-bottom:10px;font-family:var(--font-serif)}
.form-success-panel p{font-size:.95rem;color:var(--gray600);line-height:1.65;max-width:340px}
.form-meta{margin-top:14px;font-size:.74rem;color:var(--gray400);line-height:1.55;text-align:center}
.form-meta a{color:var(--blue);font-weight:600}
/* LANG */
.en{display:block}.es{display:none}
.en-inline{display:inline}.es-inline{display:none}
/* FOOTER */
footer{background:var(--navy);color:rgba(255,255,255,.55);padding:40px 32px 22px;margin-top:auto}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-divider{border:none;border-top:1px solid rgba(255,255,255,.1);margin-bottom:18px}
.footer-bottom{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px}
.footer-copy{font-size:.73rem;color:rgba(255,255,255,.35)}
.footer-links{display:flex;gap:14px;flex-wrap:wrap;margin-top:5px}
.footer-links a{font-size:.75rem;color:rgba(255,255,255,.4);transition:color .2s}
.footer-links a:hover{color:#fff}
.footer-disclaimer{font-size:.7rem;color:rgba(255,255,255,.28);max-width:540px;line-height:1.6}
.wa-float{position:fixed;bottom:26px;right:26px;z-index:500;background:#25D366;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.5);cursor:pointer;transition:all .25s}
.wa-float:hover{transform:scale(1.1)}
.wa-float svg{width:24px;height:24px;fill:#fff}
@media(max-width:900px){.split-card{grid-template-columns:1fr;min-height:0}.split-left{padding:36px 28px 32px}.split-right{padding:32px 28px 36px}}
@media(max-width:768px){nav{display:none}nav.open{display:flex;flex-direction:column;position:absolute;top:62px;left:-16px;right:-16px;background:#fff;padding:10px 16px 14px;border-bottom:1px solid var(--gray200);box-shadow:0 8px 24px rgba(0,0,0,.08);z-index:200;gap:2px}nav.open a{padding:11px 12px;font-size:.92rem;border-radius:8px;font-weight:500;margin-left:0}nav.open a:hover{background:var(--gray100)}.hamburger{display:flex}header{padding:0 16px}.logo-text{font-size:1rem}.logo-text span{display:none}.contact-page{padding:28px 16px 50px}.form-row{grid-template-columns:1fr;gap:12px}.form-input,.form-textarea{font-size:16px}.contact-mini-head{margin-bottom:22px}}
`
  const body = `
<div class="topbar"><span class="en-inline">Florida's trusted business formation experts &mdash; <strong>LLC &amp; Corporation</strong> filing made simple.</span><span class="es-inline" style="display:none">Expertos de confianza en formaci&oacute;n de empresas en Florida &mdash; <strong>LLC y Corporaci&oacute;n</strong> de manera sencilla.</span></div>
<header id="mainHeader">
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-mark">OB</div>
      <div class="logo-text"><span class="logo-opa">Opa</span><span class="logo-biz">Biz</span><span>Florida Business Formation Center</span></div>
    </a>
    <nav>
      <a href="/" data-en="Home" data-es="Inicio">Home</a>
      <a href="/#pricing" data-en="Packages" data-es="Paquetes">Packages</a>
      <a href="/servicios" data-en="Services" data-es="Servicios">Services</a>
      <a href="/#faq" data-en="FAQ" data-es="Preguntas">FAQ</a>
      <a href="/contact" data-en="Contact" data-es="Contacto">Contact</a>
    </nav>
    <div style="display:flex;align-items:center;gap:11px">
      <div class="lang-toggle">
        <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
      </div>
      <button class="hamburger" id="hamburger-btn" aria-label="Toggle menu" onclick="toggleNav()">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<div class="contact-page">

  <div class="contact-mini-head">
    <div class="badge en-inline">Contact</div><div class="badge es-inline" style="display:none">Contacto</div>
    <h1 class="en">Get in touch with us.</h1>
    <h1 class="es" style="display:none">Cont&aacute;ctanos.</h1>
    <p class="en">Pick the option that works best for you. We read every message.</p>
    <p class="es" style="display:none">Elige la opci&oacute;n que m&aacute;s te convenga. Leemos cada mensaje.</p>
  </div>

  <div class="split-card" id="form-card">

    <!-- LEFT: brand + promise + quick actions -->
    <div class="split-left">
      <div class="left-hero">
        <div class="left-badge en-inline">We're here for you</div><div class="left-badge es-inline" style="display:none">Estamos para ayudarte</div>
        <h2 class="en">Talk to a Florida formation specialist.</h2>
        <h2 class="es" style="display:none">Habla con un especialista en formaci&oacute;n de empresas en Florida.</h2>
        <p class="left-lead en">Have a question about your LLC, pricing, EIN or your order? We answer real questions from real people &mdash; bilingual, no jargon.</p>
        <p class="left-lead es" style="display:none">&iquest;Tienes una pregunta sobre tu LLC, precios, EIN o tu orden? Respondemos preguntas reales de personas reales &mdash; biling&uuml;e, sin tecnicismos.</p>
      </div>

      <div class="left-promise">
        <span class="left-promise-icon">&#9989;</span>
        <span class="left-promise-text en">We reply within <strong>24 business hours</strong>. Need it faster? Use WhatsApp.</span>
        <span class="left-promise-text es" style="display:none">Respondemos en menos de <strong>24 horas h&aacute;biles</strong>. &iquest;Lo necesitas m&aacute;s r&aacute;pido? Usa WhatsApp.</span>
      </div>

      <div class="left-actions">
        <a href="https://wa.me/13528377755" target="_blank" rel="noopener" class="left-action wa">
          <div class="left-action-icon">
            <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <div class="left-action-text">
            <strong class="en-inline">WhatsApp Consultation</strong><strong class="es-inline" style="display:none">Consulta por WhatsApp</strong>
            <span class="en-inline">Chat now &mdash; bilingual EN / ES</span><span class="es-inline" style="display:none">Habla ya &mdash; ingl&eacute;s o espa&ntilde;ol</span>
          </div>
          <span class="left-action-arrow">&rarr;</span>
        </a>
        <a href="/booking?lang=en" id="cal-link" class="left-action cal">
          <div class="left-action-icon">
            <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM7 12h5v5H7v-5z"/></svg>
          </div>
          <div class="left-action-text">
            <strong class="en-inline">Schedule an Appointment</strong><strong class="es-inline" style="display:none">Agendar una Cita</strong>
            <span class="en-inline">Free 30-min call &middot; Mon &mdash; Sat</span><span class="es-inline" style="display:none">Llamada gratis 30 min &middot; Lun &mdash; S&aacute;b</span>
          </div>
          <span class="left-action-arrow">&rarr;</span>
        </a>
      </div>

      <div class="left-footer">
        <span class="en-inline">Or write us directly at <a href="mailto:info@opabiz.com">info@opabiz.com</a></span>
        <span class="es-inline" style="display:none">O escr&iacute;benos directamente a <a href="mailto:info@opabiz.com">info@opabiz.com</a></span>
      </div>
    </div>

    <!-- RIGHT: form -->
    <div class="split-right">
      <h2 class="form-title en">Send us a message</h2>
      <h2 class="form-title es" style="display:none">Env&iacute;anos un mensaje</h2>
      <p class="form-sub en">Fill out the form &mdash; we'll reply to your email within 24 business hours.</p>
      <p class="form-sub es" style="display:none">Completa el formulario &mdash; te responderemos por correo en menos de 24 horas h&aacute;biles.</p>
      <form id="contact-form" onsubmit="return contactSubmit(event)" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="cf-name"><span class="en-inline">Full Name</span><span class="es-inline" style="display:none">Nombre Completo</span> <span class="req">*</span></label>
            <input class="form-input" id="cf-name" name="name" type="text" required maxlength="120" autocomplete="name"/>
          </div>
          <div class="form-group">
            <label class="form-label" for="cf-email"><span class="en-inline">Email</span><span class="es-inline" style="display:none">Correo</span> <span class="req">*</span></label>
            <input class="form-input" id="cf-email" name="email" type="email" required maxlength="254" autocomplete="email"/>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="cf-phone"><span class="en-inline">Phone</span><span class="es-inline" style="display:none">Tel&eacute;fono</span> <span class="opt">(<span class="en-inline">optional</span><span class="es-inline" style="display:none">opcional</span>)</span></label>
            <input class="form-input" id="cf-phone" name="phone" type="tel" maxlength="40" autocomplete="tel"/>
          </div>
          <div class="form-group">
            <label class="form-label" for="cf-subject"><span class="en-inline">Subject</span><span class="es-inline" style="display:none">Asunto</span> <span class="req">*</span></label>
            <select class="form-input" id="cf-subject" name="subject" required>
              <option value="">-- Select a reason --</option>
              <option value="Pricing or package question">Pricing or package question</option>
              <option value="LLC formation question">LLC formation question</option>
              <option value="Corporation formation question">Corporation formation question</option>
              <option value="EIN / Tax ID question">EIN / Tax ID question</option>
              <option value="Order status / existing order">Order status / existing order</option>
              <option value="Registered Agent question">Registered Agent question</option>
              <option value="Refund or billing question">Refund or billing question</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label" for="cf-message"><span class="en-inline">Message</span><span class="es-inline" style="display:none">Mensaje</span> <span class="req">*</span></label>
          <textarea class="form-textarea" id="cf-message" name="message" required maxlength="4000" placeholder=""></textarea>
        </div>
        <button class="form-submit" id="cf-submit" type="submit">
          <span class="en-inline">Send Message</span><span class="es-inline" style="display:none">Enviar Mensaje</span> &rarr;
        </button>
        <div class="form-error" id="cf-error"></div>
      </form>
      <p class="form-meta en">We respect your privacy. Your info is only used to reply to you.</p>
      <p class="form-meta es" style="display:none">Respetamos tu privacidad. Solo usaremos tus datos para responderte.</p>
    </div>

  </div>

  <!-- SUCCESS PANEL (replaces split-card after submit) -->
  <div class="split-card form-success-panel" id="form-success">
    <div class="success-icon">&#127881;</div>
    <h3 class="en">Got it &mdash; thank you!</h3>
    <h3 class="es" style="display:none">&iexcl;Recibido &mdash; gracias!</h3>
    <p class="en">Your message landed in our inbox. We'll reply to your email within <strong>24 business hours</strong>. Need it sooner? <a href="https://wa.me/13528377755" target="_blank" rel="noopener" style="color:var(--green-dark);font-weight:700;text-decoration:underline">Message us on WhatsApp</a>.</p>
    <p class="es" style="display:none">Tu mensaje lleg&oacute; a nuestra bandeja. Te responderemos por correo en menos de <strong>24 horas h&aacute;biles</strong>. &iquest;Lo necesitas antes? <a href="https://wa.me/13528377755" target="_blank" rel="noopener" style="color:var(--green-dark);font-weight:700;text-decoration:underline">Escr&iacute;benos por WhatsApp</a>.</p>
  </div>

</div>

<a class="wa-float" href="https://wa.me/13528377755" target="_blank" rel="noopener" aria-label="WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>

<footer>
  <div class="footer-inner">
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div>
        <div class="footer-copy">&#169; 2025 Florida Business Formation Center &middot; opabiz.com &middot; All Rights Reserved.</div>
        <div class="footer-links" style="margin-top:6px">
          <a href="/terms" data-en="Terms &amp; Conditions" data-es="T&eacute;rminos y Condiciones">Terms &amp; Conditions</a>
          <a href="/privacy" data-en="Privacy Policy" data-es="Pol&iacute;tica de Privacidad">Privacy Policy</a>
          <a href="/legal" data-en="Legal Disclaimer" data-es="Aviso Legal">Legal Disclaimer</a>
          <a href="/about" data-en="About Us" data-es="Nosotros">About Us</a>
        </div>
        <div style="margin-top:8px;font-size:0.77rem;color:rgba(255,255,255,0.45)"><a href="mailto:info@opabiz.com" style="color:inherit">info@opabiz.com</a></div>
      </div>
      <div class="footer-disclaimer">
        <strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>
        OpaBiz is a trade name of Florida Business Formation Center &mdash; a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant.
      </div>
    </div>
  </div>
</footer>

<script>
function setLang(lang){
  localStorage.setItem('flbc_lang', lang);
  var isEs = lang === 'es';
  document.getElementById('btn-en').classList.toggle('active', lang==='en');
  document.getElementById('btn-es').classList.toggle('active', lang==='es');
  document.querySelectorAll('.en').forEach(function(el){ el.style.display = isEs ? 'none' : 'block'; });
  document.querySelectorAll('.es').forEach(function(el){ el.style.display = isEs ? 'block' : 'none'; });
  document.querySelectorAll('.en-inline').forEach(function(el){ el.style.display = isEs ? 'none' : 'inline'; });
  document.querySelectorAll('.es-inline').forEach(function(el){ el.style.display = isEs ? 'inline' : 'none'; });
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){
    el.innerHTML = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });
  // Calendar link lang
  var cal = document.getElementById('cal-link'); if(cal) cal.setAttribute('href', isEs ? '/booking?lang=es' : '/booking?lang=en');
  // Subject placeholder
  var sel = document.getElementById('cf-subject');
  if(sel){
    var first = sel.querySelector('option[value=""]');
    if(first) first.textContent = isEs ? '-- Selecciona un motivo --' : '-- Select a reason --';
    var labels = isEs ? {
      'Pricing or package question':'Precios o paquete',
      'LLC formation question':'Formación de LLC',
      'Corporation formation question':'Formación de Corporación',
      'EIN / Tax ID question':'EIN / ID Fiscal',
      'Order status / existing order':'Estado de orden existente',
      'Registered Agent question':'Agente Registrado',
      'Refund or billing question':'Reembolso o facturación',
      'Other':'Otro'
    } : null;
    Array.prototype.forEach.call(sel.options, function(o){
      if(!o.value) return;
      var orig = o.getAttribute('data-orig') || o.value;
      o.setAttribute('data-orig', orig);
      o.textContent = labels && labels[orig] ? labels[orig] : orig;
    });
  }
  // Message placeholder
  var msg = document.getElementById('cf-message');
  if(msg) msg.placeholder = isEs ? 'Cuéntanos en qué podemos ayudarte...' : 'Tell us how we can help you...';
}
function toggleNav(){var nav=document.querySelector('nav');var btn=document.getElementById('hamburger-btn');if(!nav||!btn)return;var open=nav.classList.toggle('open');btn.classList.toggle('open',open);if(open){document.addEventListener('click',function c(e){if(!nav.contains(e.target)&&!btn.contains(e.target)){nav.classList.remove('open');btn.classList.remove('open');document.removeEventListener('click',c);}});}}

async function contactSubmit(ev){
  ev.preventDefault();
  var isEs = document.getElementById('btn-es').classList.contains('active');
  var btn = document.getElementById('cf-submit');
  var errBox = document.getElementById('cf-error');
  errBox.classList.remove('show'); errBox.textContent = '';
  var data = {
    name:    document.getElementById('cf-name').value.trim(),
    email:   document.getElementById('cf-email').value.trim(),
    phone:   document.getElementById('cf-phone').value.trim(),
    subject: document.getElementById('cf-subject').value,
    message: document.getElementById('cf-message').value.trim()
  };
  if(!data.name || !data.email || !data.subject || !data.message){
    errBox.textContent = isEs ? 'Por favor completa los campos obligatorios.' : 'Please fill out the required fields.';
    errBox.classList.add('show');
    return false;
  }
  btn.disabled = true;
  var origLabel = btn.innerHTML;
  btn.innerHTML = isEs ? 'Enviando...' : 'Sending...';
  try {
    var res = await fetch('/api/contact', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    var json = await res.json().catch(function(){ return {}; });
    if(!res.ok || !json.success){
      var msg = json.error || (isEs ? 'No pudimos enviar el mensaje. Por favor intenta de nuevo.' : 'We could not send the message. Please try again.');
      if(res.status === 429) msg = isEs ? 'Demasiados mensajes desde tu IP. Intenta de nuevo en una hora.' : 'Too many messages from this IP. Please try again in an hour.';
      throw new Error(msg);
    }
    document.getElementById('form-card').style.display = 'none';
    document.getElementById('form-success').classList.add('show');
    if(isEs){
      document.querySelector('#form-success .en').style.display = 'none';
      document.querySelector('#form-success .es').style.display = 'block';
    }
    window.scrollTo({top:0,behavior:'smooth'});
  } catch(err){
    errBox.textContent = err.message || (isEs ? 'Error de red. Verifica tu conexión.' : 'Network error. Check your connection.');
    errBox.classList.add('show');
    btn.disabled = false;
    btn.innerHTML = origLabel;
  }
  return false;
}

( function(){var p=new URLSearchParams(window.location.search);var l=p.get('lang')||localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();
</script>
`
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
      <ChatWidget />
    </>
  )
}
