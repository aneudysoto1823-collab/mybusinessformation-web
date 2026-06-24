import type { Metadata } from 'next'
import ChatWidget from '@/components/ChatWidget'

// Schema.org @graph para AboutPage. Reusa @id de la Organization declarada en
// el home (relacion mainEntity), evitando duplicar info. BreadcrumbList ayuda
// a Google/Bing a entender la jerarquia del sitio.
const aboutSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      '@id': 'https://opabiz.com/about',
      url: 'https://opabiz.com/about',
      name: 'About OpaBiz',
      description:
        'Bilingual Florida business filing service. LLC and Corporation formation for entrepreneurs and investors throughout Florida.',
      inLanguage: 'en-US',
      isPartOf: { '@id': 'https://opabiz.com/#website' },
      mainEntity: { '@id': 'https://opabiz.com/#organization' },
      breadcrumb: { '@id': 'https://opabiz.com/about#breadcrumb' },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://opabiz.com/about#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://opabiz.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'About',
          item: 'https://opabiz.com/about',
        },
      ],
    },
  ],
}

export const metadata: Metadata = {
  title: 'About OpaBiz — Florida Business Formation Experts',
  description: 'Learn about OpaBiz — a bilingual Florida business filing service dedicated to making LLC and Corporation formation accessible for every entrepreneur.',
  alternates: {
    canonical: 'https://opabiz.com/about',
    languages: {
      'en-US': 'https://opabiz.com/about',
      'es-US': 'https://opabiz.com/about?lang=es',
    },
  },
  openGraph: {
    url: 'https://opabiz.com/about',
    title: 'About OpaBiz — Florida Business Formation Experts',
    description: 'Bilingual Florida business filing service. LLC and Corporation formation made simple for entrepreneurs and investors throughout Florida.',
  },
}

export default function AboutPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--gold:#F59E0B;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray600:#475569;--gray800:#1E293B;}
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
/* HERO */
.page-hero{background:linear-gradient(135deg,var(--navy) 0%,#1a3a6b 100%);padding:36px 32px 32px;color:#fff;position:relative;overflow:hidden}
.page-hero::after{content:'';position:absolute;right:-80px;top:-80px;width:360px;height:360px;background:radial-gradient(circle,rgba(37,99,235,.2) 0%,transparent 70%);pointer-events:none}
.page-hero-inner{max-width:1280px;margin:0 auto;position:relative;z-index:1}
.breadcrumb{display:none}
.breadcrumb a{color:rgba(255,255,255,.5);transition:color .2s}
.breadcrumb a:hover{color:#fff}
.hero-badge{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.9);font-size:.7rem;font-weight:600;padding:4px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px}
.page-hero h1{font-size:clamp(2rem,4vw,3rem);font-weight:900;margin-bottom:0;letter-spacing:-.5px}
.page-hero p{display:none}
.hero-meta{display:none}
.hero-meta-item{font-size:.75rem;color:rgba(255,255,255,.5);display:flex;align-items:center;gap:5px}
/* LAYOUT */
.page-layout{max-width:1280px;margin:0 auto;padding:56px 32px 80px;display:grid;grid-template-columns:240px 1fr;gap:48px;flex:1}
@media(max-width:900px){.page-layout{grid-template-columns:1fr;padding:32px 20px 60px}}
/* SIDEBAR */
.sidebar{position:sticky;top:90px;align-self:start}
.sidebar-title{font-size:.71rem;font-weight:600;color:var(--gray400);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px}
.sidebar-nav a{display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--gray600);padding:8px 12px;border-radius:7px;margin-bottom:3px;transition:all .2s;border-left:2px solid transparent}
.sidebar-nav a:hover,.sidebar-nav a.active{color:var(--navy);background:var(--blue-light);border-left-color:var(--blue)}
.sidebar-box{background:var(--green-light);border:1px solid #a7f3d0;border-radius:10px;padding:16px;margin-top:20px}
.sidebar-box h4{font-size:.86rem;color:var(--green-dark);font-weight:600;margin-bottom:6px}
.sidebar-box p{font-size:.77rem;color:var(--green-dark);line-height:1.6;margin-bottom:10px}
.sidebar-box a{display:block;font-size:.8rem;font-weight:600;color:var(--green-dark)}
/* CONTENT */
.doc-content{min-width:0}
.doc-updated{font-size:.75rem;color:var(--gray400);padding-bottom:14px;border-bottom:1px solid var(--gray200);margin-bottom:32px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.doc-section{margin-bottom:36px;scroll-margin-top:90px}
.doc-section h2{font-size:1.2rem;color:var(--navy);font-weight:700;margin-bottom:14px;padding-bottom:9px;border-bottom:2px solid var(--blue-light);display:flex;align-items:center;gap:9px}
.doc-section h3{font-size:.97rem;color:var(--navy);font-weight:600;margin:18px 0 8px}
.doc-section p{font-size:.875rem;color:var(--gray600);line-height:1.82;margin-bottom:10px}
.doc-section ul,.doc-section ol{padding-left:20px;margin-bottom:12px}
.doc-section li{font-size:.875rem;color:var(--gray600);line-height:1.8;margin-bottom:4px}
.info-box{background:var(--blue-light);border-left:3px solid var(--blue);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:var(--navy);line-height:1.7}
.warn-box{background:#FEF3C7;border-left:3px solid var(--gold);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:#92400E;line-height:1.7}
.green-box{background:var(--green-light);border-left:3px solid var(--green);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:var(--green-dark);line-height:1.7}
/* LANG */
.en{display:block}.es{display:none}
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
.hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:8px;margin-right:-6px;flex-shrink:0}
.hamburger span{display:block;width:22px;height:2px;background:var(--navy);border-radius:2px;transition:all .3s}
.hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.hamburger.open span:nth-child(2){opacity:0}
.hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.why-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:4px}
.contact-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
.contact-card{border:1.5px solid var(--gray200);border-radius:12px;padding:22px;background:var(--gray50);display:flex;flex-direction:column;gap:8px}
.contact-card-icon{font-size:1.4rem}
.contact-card strong{font-size:.92rem;color:var(--navy)}
.contact-card p{font-size:.8rem;color:var(--gray600);line-height:1.7;flex:1}
.contact-card a.card-btn{display:block;text-align:center;padding:9px 14px;border-radius:8px;font-size:.82rem;font-weight:600;margin-top:6px}
.callout-quote{background:var(--navy);color:#fff;border-radius:12px;padding:20px 24px;margin:22px 0;font-family:var(--font-serif);font-size:1.05rem;font-weight:700;letter-spacing:-.2px;line-height:1.5}
@media(max-width:768px){nav{display:none}nav.open{display:flex;flex-direction:column;position:absolute;top:62px;left:-16px;right:-16px;background:#fff;padding:10px 16px 14px;border-bottom:1px solid var(--gray200);box-shadow:0 8px 24px rgba(0,0,0,.08);z-index:200;gap:2px}nav.open a{padding:11px 12px;font-size:.92rem;border-radius:8px;font-weight:500;margin-left:0}nav.open a:hover{background:var(--gray100)}.hamburger{display:flex}header{padding:0 16px}.logo-text{font-size:1rem}.logo-text span{display:none}.page-hero{padding:24px 20px 22px;position:sticky;top:66px;z-index:100}.page-hero p{display:none}.hero-meta{display:none}.breadcrumb{display:none}.sidebar{position:static}}
@media(max-width:768px){.contact-grid{grid-template-columns:1fr}}
@media(max-width:480px){.why-grid{grid-template-columns:1fr}}
`
  const body = `
<div class="topbar">Florida's trusted business formation experts &mdash; <strong>LLC &amp; Corporation</strong> filing made simple.</div>
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
      <a href="/#contact" data-en="Contact" data-es="Contacto">Contact</a>
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
<section class="page-hero">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="/">Home</a> <span>/</span> <span class="en-inline">About Us</span><span class="es-inline" style="display:none">Qui&eacute;nes Somos</span></div>
    <div class="hero-badge en">About Us</div><div class="hero-badge es" style="display:none">Qui&eacute;nes Somos</div>
    <h1 class="en">Straightforward, Personal,<br/>Built for You</h1>
    <h1 class="es" style="display:none">Sencillo, Personal,<br/>Hecho para Usted</h1>
  </div>
</section>

<div class="page-layout">
  <aside class="sidebar">
    <div class="sidebar-title en">On This Page</div><div class="sidebar-title es" style="display:none">En Esta P&aacute;gina</div>
    <nav class="sidebar-nav">
      <a href="#mission" class="active"><span class="en-inline">Our Mission</span><span class="es-inline" style="display:none">Nuestra Misi&oacute;n</span></a>
      <a href="#what-we-do"><span class="en-inline">What We Do</span><span class="es-inline" style="display:none">Lo Que Hacemos</span></a>
      <a href="#who-we-serve"><span class="en-inline">Who We Serve</span><span class="es-inline" style="display:none">A Qui&eacute;n Servimos</span></a>
      <a href="#why-us"><span class="en-inline">Why Choose Us</span><span class="es-inline" style="display:none">&iquest;Por Qu&eacute; Nosotros?</span></a>
      <a href="#bilingual"><span class="en-inline">Bilingual Service</span><span class="es-inline" style="display:none">Servicio Biling&uuml;e</span></a>
      <a href="#contact-about"><span class="en-inline">Get In Touch</span><span class="es-inline" style="display:none">Cont&aacute;ctanos</span></a>
    </nav>
  </aside>

  <div class="doc-content">

    <div class="doc-section" id="mission">
      <h2><span class="en-inline">Our Mission</span><span class="es-inline" style="display:none">Nuestra Misi&oacute;n</span></h2>
      <p class="en">We&rsquo;re here to make starting your business in Florida straightforward &mdash; and personal.</p>
      <p class="es" style="display:none">Estamos aqu&iacute; para hacer que iniciar su negocio en Florida sea sencillo &mdash; y personal.</p>
      <p class="en">Florida Business Formation Center was created to help entrepreneurs, small business owners, and anyone ready to take the next step get their business registered quickly, correctly, and without the headache of navigating government paperwork alone.</p>
      <p class="es" style="display:none">Florida Business Formation Center fue creado para ayudar a emprendedores, peque&ntilde;os empresarios y a cualquier persona lista para dar el siguiente paso a registrar su negocio de forma r&aacute;pida, correcta y sin el dolor de cabeza de navegar los tr&aacute;mites gubernamentales solo.</p>
      <p class="en">We know that starting a business can feel overwhelming. Between choosing the right structure, understanding state requirements, and filling out the correct forms, many people put off taking action simply because they don&rsquo;t know where to begin. That&rsquo;s exactly why we exist.</p>
      <p class="es" style="display:none">Sabemos que iniciar un negocio puede sentirse abrumador. Entre elegir la estructura correcta, entender los requisitos del estado y completar los formularios adecuados, muchas personas posponen actuar simplemente porque no saben por d&oacute;nde empezar. Eso es exactamente por lo que existimos.</p>
      <p class="en">Our team handles the entire filing process on your behalf &mdash; from preparing your documents to submitting them directly with the Florida Division of Corporations. Whether you&rsquo;re forming an LLC, a corporation, or any other business entity, we make sure everything is done right the first time.</p>
      <p class="es" style="display:none">Nuestro equipo gestiona todo el proceso de presentaci&oacute;n en su nombre &mdash; desde la preparaci&oacute;n de sus documentos hasta su env&iacute;o directo ante la Divisi&oacute;n de Corporaciones de Florida. Ya sea que est&eacute; formando una LLC, una corporaci&oacute;n u otra entidad empresarial, nos aseguramos de que todo est&eacute; hecho correctamente desde la primera vez.</p>
      <p class="en">What sets us apart is the attention we give to each client. We don&rsquo;t believe in one-size-fits-all solutions. Every business is different, and so is every entrepreneur behind it. That&rsquo;s why we take the time to understand your specific situation before recommending the best path forward.</p>
      <p class="es" style="display:none">Lo que nos distingue es la atenci&oacute;n que brindamos a cada cliente. No creemos en soluciones &uacute;nicas para todos. Cada negocio es diferente, y tambi&eacute;n lo es cada emprendedor detr&aacute;s de &eacute;l. Por eso nos tomamos el tiempo de entender su situaci&oacute;n espec&iacute;fica antes de recomendar el mejor camino a seguir.</p>
      <p class="en">From your very first question to the moment you receive your official documents, you&rsquo;ll have a real person guiding you &mdash; someone who listens, explains things clearly, and makes sure you feel confident every step of the way.</p>
      <p class="es" style="display:none">Desde su primera pregunta hasta el momento en que recibe sus documentos oficiales, tendr&aacute; a una persona real gui&aacute;ndole &mdash; alguien que escucha, explica las cosas con claridad y se asegura de que se sienta seguro en cada paso del camino.</p>
    </div>

    <div class="doc-section" id="what-we-do">
      <h2><span class="en-inline">What We Do</span><span class="es-inline" style="display:none">Lo Que Hacemos</span></h2>
      <p class="en">Florida Business Formation Center specializes in preparing and filing business formation documents with the Florida Division of Corporations and the IRS. We manage the entire process from document preparation to submission, so you receive a complete and properly filed entity.</p>
      <p class="es" style="display:none">Florida Business Formation Center se especializa en preparar y presentar documentos de formaci&oacute;n empresarial ante la Divisi&oacute;n de Corporaciones de Florida y el IRS. Gestionamos todo el proceso, desde la preparaci&oacute;n de documentos hasta la presentaci&oacute;n, para que reciba una entidad completa y debidamente registrada.</p>
      <p class="en">Our services include:</p>
      <p class="es" style="display:none">Nuestros servicios incluyen:</p>
      <ul>
        <li class="en">LLC and Corporation formation filing with the Florida Division of Corporations</li><li class="es" style="display:none">Formaci&oacute;n de LLC y Corporaci&oacute;n ante la Divisi&oacute;n de Corporaciones de Florida</li>
        <li class="en">EIN (Employer Identification Number) applications with the IRS</li><li class="es" style="display:none">Solicitudes de EIN (N&uacute;mero de Identificaci&oacute;n del Empleador) ante el IRS</li>
        <li class="en">Operating Agreement and Corporate Bylaws preparation</li><li class="es" style="display:none">Preparaci&oacute;n de Acuerdo Operativo y Estatutos Corporativos</li>
        <li class="en">S-Corporation tax election (IRS Form 2553)</li><li class="es" style="display:none">Elecci&oacute;n de tratamiento fiscal como S-Corporation (Formulario IRS 2553)</li>
        <li class="en">ITIN applications for foreign nationals (IRS Form W-7)</li><li class="es" style="display:none">Solicitudes de ITIN para extranjeros (Formulario IRS W-7)</li>
        <li class="en">DBA / Fictitious Name registration</li><li class="es" style="display:none">Registro de DBA / Nombre Ficticio</li>
        <li class="en">Registered Agent service</li><li class="es" style="display:none">Servicio de Agente Registrado</li>
        <li class="en">Annual Report filing</li><li class="es" style="display:none">Presentaci&oacute;n de Informe Anual</li>
        <li class="en">Articles of Amendment filing</li><li class="es" style="display:none">Presentaci&oacute;n de Art&iacute;culos de Enmienda</li>
        <li class="en">Virtual Mailing Address service</li><li class="es" style="display:none">Servicio de Direcci&oacute;n Postal Virtual</li>
        <li class="en">Banking Resolution document preparation</li><li class="es" style="display:none">Preparaci&oacute;n de Resoluci&oacute;n Bancaria</li>
        <li class="en">Business Tax Receipt (occupational license) filing</li><li class="es" style="display:none">Tramitaci&oacute;n de Recibo de Impuesto Empresarial (licencia ocupacional)</li>
        <li class="en">Sales Tax Registration with the Florida Department of Revenue</li><li class="es" style="display:none">Registro de Impuesto sobre Ventas ante el Departamento de Ingresos de Florida</li>
        <li class="en">Certificate of Good Standing</li><li class="es" style="display:none">Certificado de Buena Reputaci&oacute;n</li>
        <li class="en">Foreign LLC / Corporation registration in Florida</li><li class="es" style="display:none">Registro de LLC / Corporaci&oacute;n Extranjera en Florida</li>
        <li class="en">Business License research and filing</li><li class="es" style="display:none">Investigaci&oacute;n y tramitaci&oacute;n de Licencia Comercial</li>
        <li class="en">Business Dissolution filing</li><li class="es" style="display:none">Tramitaci&oacute;n de Disoluci&oacute;n de Negocio</li>
        <li class="en">Tax Account Closure (IRS and Florida DOR)</li><li class="es" style="display:none">Cierre de Cuenta Fiscal (IRS y Departamento de Ingresos de Florida)</li>
        <li class="en">Exclusive post-formation compliance guide</li><li class="es" style="display:none">Gu&iacute;a exclusiva de cumplimiento post-formaci&oacute;n</li>
      </ul>
      <div class="info-box en">Florida Business Formation Center is a document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. For guidance specific to your situation, consult a licensed Florida attorney or CPA.</div>
      <div class="info-box es" style="display:none">Florida Business Formation Center es un servicio de preparaci&oacute;n y presentaci&oacute;n de documentos. No somos una firma de abogados y no brindamos asesor&iacute;a legal, fiscal ni financiera. Para orientaci&oacute;n espec&iacute;fica a su situaci&oacute;n, consulte con un abogado licenciado en Florida o un CPA.</div>
    </div>

    <div class="doc-section" id="who-we-serve">
      <h2><span class="en-inline">Who We Serve</span><span class="es-inline" style="display:none">A Qui&eacute;n Servimos</span></h2>
      <p class="en">Florida draws entrepreneurs from across the United States and around the world. We work with a wide range of clients at every stage of their business journey:</p>
      <p class="es" style="display:none">Florida atrae emprendedores de todo Estados Unidos y del mundo. Trabajamos con una amplia variedad de clientes en cada etapa de su recorrido empresarial:</p>
      <ul>
        <li class="en"><strong>First-time entrepreneurs</strong> launching their first Florida business entity and navigating the formation process for the first time</li><li class="es" style="display:none"><strong>Emprendedores primerizos</strong> que inician su primera entidad empresarial en Florida y navegan el proceso de formaci&oacute;n por primera vez</li>
        <li class="en"><strong>Foreign nationals and international investors</strong> establishing a U.S. business presence from outside the country</li><li class="es" style="display:none"><strong>Extranjeros e inversionistas internacionales</strong> que establecen presencia empresarial en EE.UU. desde el exterior</li>
        <li class="en"><strong>Established business owners</strong> adding new entities, subsidiaries, or DBAs to their existing operations</li><li class="es" style="display:none"><strong>Propietarios de negocios establecidos</strong> que agregan nuevas entidades, subsidiarias o DBAs a sus operaciones existentes</li>
        <li class="en"><strong>Latin American and Caribbean entrepreneurs</strong> relocating to or investing in Florida, many of whom require bilingual guidance throughout the process</li><li class="es" style="display:none"><strong>Emprendedores latinoamericanos y caribe&ntilde;os</strong> que se reubican en Florida o invierten en el estado, muchos de los cuales requieren orientaci&oacute;n biling&uuml;e durante todo el proceso</li>
        <li class="en"><strong>Freelancers, consultants, and independent professionals</strong> formalizing their business structure to open bank accounts, sign contracts, or take on clients professionally</li><li class="es" style="display:none"><strong>Freelancers, consultores y profesionales independientes</strong> que formalizan su estructura empresarial para abrir cuentas bancarias, firmar contratos o atender clientes de forma profesional</li>
        <li class="en"><strong>Real estate investors</strong> forming LLCs to hold and protect property assets under a separate legal entity</li><li class="es" style="display:none"><strong>Inversionistas en bienes ra&iacute;ces</strong> que forman LLCs para poseer y proteger activos inmobiliarios bajo una entidad legal separada</li>
        <li class="en"><strong>E-commerce sellers and online businesses</strong> requiring a registered Florida entity to operate under a legitimate business structure</li><li class="es" style="display:none"><strong>Vendedores de comercio electr&oacute;nico y negocios en l&iacute;nea</strong> que necesitan una entidad registrada en Florida para operar bajo una estructura empresarial leg&iacute;tima</li>
      </ul>
    </div>

    <div class="doc-section" id="why-us">
      <h2><span class="en-inline">Why Choose Florida Business Formation Center</span><span class="es-inline" style="display:none">&iquest;Por Qu&eacute; Elegirnos?</span></h2>
      <div class="why-grid">
        <div style="background:var(--gray50);border:1px solid var(--gray200);border-radius:10px;padding:16px">
          <strong style="font-size:.9rem;color:var(--navy)" class="en">Florida Specialists</strong>
          <strong style="font-size:.9rem;color:var(--navy)" class="es" style="display:none">Especialistas en Florida</strong>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="en">We focus exclusively on Florida business formations. We know the Division of Corporations process, the IRS requirements, and the timelines &mdash; because this is all we do.</p>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="es" style="display:none">Nos enfocamos exclusivamente en formaciones empresariales en Florida. Conocemos el proceso de la Divisi&oacute;n de Corporaciones, los requisitos del IRS y los plazos, porque esto es todo lo que hacemos.</p>
        </div>
        <div style="background:var(--gray50);border:1px solid var(--gray200);border-radius:10px;padding:16px">
          <strong style="font-size:.9rem;color:var(--navy)" class="en">Bilingual EN / ES</strong>
          <strong style="font-size:.9rem;color:var(--navy)" class="es" style="display:none">Biling&uuml;e EN / ES</strong>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="en">Full service in English and Spanish &mdash; from initial inquiry to final document delivery. No language barriers, no misunderstandings.</p>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="es" style="display:none">Servicio completo en ingl&eacute;s y espa&ntilde;ol, desde la consulta inicial hasta la entrega final de documentos. Sin barreras de idioma ni malentendidos.</p>
        </div>
        <div style="background:var(--gray50);border:1px solid var(--gray200);border-radius:10px;padding:16px">
          <strong style="font-size:.9rem;color:var(--navy)" class="en">End-to-End Filing</strong>
          <strong style="font-size:.9rem;color:var(--navy)" class="es" style="display:none">Tramitaci&oacute;n Completa</strong>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="en">From LLC formation to EIN, Operating Agreement, Annual Report, and beyond &mdash; we support your business at every stage, not just at startup.</p>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="es" style="display:none">Desde la formaci&oacute;n de la LLC hasta el EIN, el Acuerdo Operativo, el Informe Anual y m&aacute;s &mdash; apoyamos su negocio en cada etapa, no solo al inicio.</p>
        </div>
        <div style="background:var(--gray50);border:1px solid var(--gray200);border-radius:10px;padding:16px">
          <strong style="font-size:.9rem;color:var(--navy)" class="en">Direct Human Support</strong>
          <strong style="font-size:.9rem;color:var(--navy)" class="es" style="display:none">Soporte Humano Directo</strong>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="en">No bots, no call centers. When you contact us by WhatsApp or email, you reach a real person who knows your case and can answer your questions.</p>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="es" style="display:none">Sin bots ni centros de llamadas. Cuando nos contacta por WhatsApp o correo electr&oacute;nico, llega a una persona real que conoce su caso y puede responder sus preguntas.</p>
        </div>
      </div>
    </div>

    <div class="doc-section" id="bilingual">
      <h2><span class="en-inline">Proudly Bilingual</span><span class="es-inline" style="display:none">Orgullosamente Biling&uuml;es</span></h2>
      <p class="en">Florida attracts entrepreneurs from every background, culture, and corner of the world &mdash; lifelong residents, newcomers to the state, and international investors alike. Our team is here to serve all of them, and we do it fully in both English and Spanish so that clear communication is never an obstacle.</p>
      <p class="es" style="display:none">Florida atrae emprendedores de todos los or&iacute;genes, culturas y rincones del mundo &mdash; residentes de toda la vida, reci&eacute;n llegados al estado e inversionistas internacionales por igual. Nuestro equipo est&aacute; aqu&iacute; para servir a todos ellos, y lo hacemos completamente en ingl&eacute;s y espa&ntilde;ol para que la comunicaci&oacute;n clara nunca sea un obst&aacute;culo.</p>
      <p class="en">Language should never be a barrier to starting a business. That&rsquo;s why our entire service operates fully in both English and Spanish &mdash; from our website and intake forms to our client portal, support communications, and document delivery. When you contact us, you will always speak with someone who understands you, in the language you prefer.</p>
      <p class="es" style="display:none">El idioma nunca debe ser un obst&aacute;culo para iniciar un negocio. Por eso, todo nuestro servicio opera completamente en ingl&eacute;s y espa&ntilde;ol &mdash; desde nuestro sitio web y formularios hasta el portal del cliente, las comunicaciones de soporte y la entrega de documentos. Cuando nos contacte, siempre hablar&aacute; con alguien que le entienda, en el idioma que prefiera.</p>
      <p class="en">Whether you are filing from Miami, Tampa, Orlando, Jacksonville, or from outside the United States entirely, we are equipped to guide you through every step of the Florida business formation process.</p>
      <p class="es" style="display:none">Ya sea que est&eacute; tramitando desde Miami, Tampa, Orlando, Jacksonville o desde fuera de los Estados Unidos, estamos preparados para guiarle en cada paso del proceso de formaci&oacute;n empresarial en Florida.</p>
    </div>

    <div class="doc-section" id="contact-about">
      <h2><span class="en-inline">Ready to Get Started? Reach Us Your Way.</span><span class="es-inline" style="display:none">&iquest;Listo para Comenzar? Cont&aacute;ctenos a Su Manera.</span></h2>
      <p class="en">We make it easy to connect with us &mdash; no complicated processes, no waiting in line. Choose the option that works best for you:</p>
      <p class="es" style="display:none">Le facilitamos comunicarse con nosotros &mdash; sin procesos complicados ni filas de espera. Elija la opci&oacute;n que mejor le funcione:</p>
      <div class="contact-grid">
        <div class="contact-card">
          <div class="contact-card-icon">&#128197;</div>
          <strong class="en">Book an Appointment</strong><strong class="es" style="display:none">Reserve una Cita</strong>
          <p class="en">Schedule a one-on-one consultation at a time that works for you. We&rsquo;ll walk you through your options and answer every question you have.</p>
          <p class="es" style="display:none">Programe una consulta personalizada a la hora que mejor le convenga. Le guiaremos por sus opciones y responderemos cada pregunta.</p>
          <a id="cal-book-btn" href="/booking?lang=en" class="card-btn" style="background:#fff;color:var(--blue);border:1.5px solid var(--blue)">
            <span class="en-inline">Schedule Now &#8594;</span><span class="es-inline" style="display:none">Reservar Ahora &#8594;</span>
          </a>
        </div>
        <div class="contact-card">
          <div class="contact-card-icon">&#128172;</div>
          <strong class="en">WhatsApp</strong><strong class="es" style="display:none">WhatsApp</strong>
          <p class="en">Prefer to chat? Message us directly on WhatsApp for a fast, personal response from our team &mdash; no bots, no automated replies.</p>
          <p class="es" style="display:none">&iquest;Prefiere chatear? Esc&iacute;banos directamente por WhatsApp para una respuesta r&aacute;pida y personal de nuestro equipo &mdash; sin bots ni respuestas autom&aacute;ticas.</p>
          <a href="https://wa.me/13528377755" target="_blank" class="card-btn" style="background:#25D366;color:#fff">
            <span class="en-inline">WhatsApp Consultation &#8594;</span><span class="es-inline" style="display:none">Consulta por WhatsApp &#8594;</span>
          </a>
        </div>
        <div class="contact-card">
          <div class="contact-card-icon">&#9993;</div>
          <strong class="en">Email</strong><strong class="es" style="display:none">Correo Electr&oacute;nico</strong>
          <p class="en">Send us your questions at any time and we&rsquo;ll get back to you promptly with a clear, detailed response tailored to your situation.</p>
          <p class="es" style="display:none">Env&iacute;enos sus preguntas en cualquier momento y le responderemos prontamente con una respuesta clara y detallada adaptada a su situaci&oacute;n.</p>
          <!--email_off--><a href="mailto:info@opabiz.com" class="card-btn" style="background:#fff;color:var(--blue);border:1.5px solid var(--blue)">info@opabiz.com</a><!--/email_off-->
        </div>
      </div>
    </div>

  </div>
</div>
<footer>
  <div class="footer-inner">
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div>
        <div class="footer-copy">&#169; 2025 Florida Business Formation Center &middot; opabiz.com &middot; All Rights Reserved.</div>
        <div class="footer-links" style="margin-top:6px">
          <a href="/terms" data-en="Terms &amp; Conditions" data-es="Términos y Condiciones">Terms &amp; Conditions</a>
          <a href="/privacy" data-en="Privacy Policy" data-es="Política de Privacidad">Privacy Policy</a>
          <a href="/legal" data-en="Legal Disclaimer" data-es="Aviso Legal">Legal Disclaimer</a>
          <a href="/about" data-en="About Us" data-es="Nosotros">About Us</a>
        </div>
        <div style="margin-top:8px;font-size:0.77rem;color:rgba(255,255,255,0.45)"><!--email_off--><a href="mailto:info@opabiz.com" style="color:inherit">info@opabiz.com</a><!--/email_off--></div>
      </div>
      <div class="footer-disclaimer">
        <strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>
        OpaBiz is a trade name of Florida Business Formation Center — a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant.
      </div>
    </div>
  </div>
</footer>
<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js">( function(){var p=new URLSearchParams(window.location.search);var l=p.get('lang')||localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();
</script><script>
function setLang(lang){
  localStorage.setItem('flbc_lang', lang);
  var isEs = lang === 'es';
  document.getElementById('btn-en').classList.toggle('active', lang==='en');
  document.getElementById('btn-es').classList.toggle('active', lang==='es');

  // Show/hide .en and .es content blocks
  document.querySelectorAll('.en').forEach(function(el){ el.style.display = isEs ? 'none' : 'block'; });
  document.querySelectorAll('.es').forEach(function(el){ el.style.display = isEs ? 'block' : 'none'; });
  document.querySelectorAll('.en-inline').forEach(function(el){ el.style.display = isEs ? 'none' : 'inline'; });
  document.querySelectorAll('.es-inline').forEach(function(el){ el.style.display = isEs ? 'inline' : 'none'; });

  // Translate all data-en/data-es elements (nav, footer)
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){
    el.innerHTML = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });
  // Calendar link
  var calBtn=document.getElementById('cal-book-btn'); if(calBtn) calBtn.setAttribute('href',isEs?'/booking?lang=es':'/booking?lang=en');
  // Nav links
  var navM={'Home':isEs?'Inicio':'Home','Packages':isEs?'Paquetes':'Packages','Services':isEs?'Servicios':'Services','FAQ':isEs?'Preguntas':'FAQ','Contact':isEs?'Contacto':'Contact'};
  document.querySelectorAll('nav a').forEach(function(a){var t=a.textContent.trim();if(navM[t])a.textContent=navM[t];});

  // Footer brand
  var fbrand=document.querySelector('.footer-brand p');
  if(fbrand)fbrand.textContent=isEs?'Servicios profesionales de formación empresarial para emprendedores e inversionistas en toda Florida.':'Professional business formation services for entrepreneurs and investors throughout Florida.';

  // Footer disclaimer
  var fd=document.querySelector('.footer-disclaimer');
  if(fd){
    var fds=fd.querySelector('strong');if(fds)fds.textContent=isEs?'Aviso Importante':'Important Notice';
    var fdt=Array.from(fd.childNodes).find(function(n){return n.nodeType===3&&n.textContent.trim().length>10;});
    if(fdt)fdt.textContent=isEs?' OpaBiz es un nombre comercial de Florida Business Formation Center — un servicio profesional de preparación y presentación de documentos. No somos una firma de abogados y no brindamos asesoría legal, fiscal ni financiera. Nuestros servicios no constituyen el ejercicio del derecho ni crean una relación abogado-cliente. Todos los trámites están sujetos a aprobación por la División de Corporaciones de Florida y el IRS. Para orientación legal o fiscal específica a su situación, le recomendamos consultar con un abogado licenciado en Florida o un contador público certificado.':' OpaBiz is a trade name of Florida Business Formation Center — a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant.';
  }

  // Copyright
  var copy=document.querySelector('.footer-copy');
  if(copy)copy.innerHTML=isEs?'&#169; 2025 Florida Business Formation Center &middot; opabiz.com &middot; Todos los Derechos Reservados.':'&#169; 2025 Florida Business Formation Center &middot; opabiz.com &middot; All Rights Reserved.';
}
// Sidebar active state
document.querySelectorAll('.sidebar-nav a').forEach(function(link){
  link.addEventListener('click',function(){
    document.querySelectorAll('.sidebar-nav a').forEach(function(a){a.classList.remove('active');});
    link.classList.add('active');
  });
});
( function(){var p=new URLSearchParams(window.location.search);var l=p.get('lang')||localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();
function toggleNav(){var nav=document.querySelector('nav');var btn=document.getElementById('hamburger-btn');if(!nav||!btn)return;var open=nav.classList.toggle('open');btn.classList.toggle('open',open);if(open){document.addEventListener('click',function c(e){if(!nav.contains(e.target)&&!btn.contains(e.target)){nav.classList.remove('open');btn.classList.remove('open');document.removeEventListener('click',c);}});}}
</script>
`
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
      <ChatWidget />
    </>
  )
}
