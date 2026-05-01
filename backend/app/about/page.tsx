import type { Metadata } from 'next'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about MyBusinessFormation — a bilingual Florida business filing service dedicated to making LLC and Corporation formation accessible for every entrepreneur.',
  alternates: { canonical: 'https://mybusinessformation.com/about' },
  openGraph: { url: 'https://mybusinessformation.com/about' },
}

export default function AboutPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--gold:#F59E0B;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',sans-serif;color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3,h4{font-family:'Fraunces',serif;line-height:1.2}
a{text-decoration:none;color:inherit}
.topbar{background:var(--navy);color:#fff;font-size:.77rem;padding:9px 24px;text-align:center}
.topbar strong{color:var(--gold)}
header{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray200);padding:0 32px;transition:box-shadow .3s}
header.scrolled{box-shadow:0 2px 20px rgba(28,46,68,.1)}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:66px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;background:linear-gradient(135deg,var(--navy),var(--blue));border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Fraunces',serif;font-size:1rem;font-weight:700;flex-shrink:0}
.logo-text{font-family:'Fraunces',serif;font-size:.95rem;color:var(--navy);font-weight:700;line-height:1.2}
.logo-text span{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:.63rem;color:var(--gray400);font-weight:400;letter-spacing:.8px;text-transform:uppercase}
nav a{font-size:.82rem;font-weight:500;color:var(--gray600);padding:6px 10px;border-radius:6px;transition:all .2s;margin-left:2px}
nav a:hover{color:var(--navy);background:var(--gray100)}
.lang-toggle{display:flex;background:var(--gray100);border-radius:20px;padding:3px;gap:2px}
.lang-btn{padding:5px 12px;border-radius:16px;border:none;cursor:pointer;font-size:.77rem;font-weight:600;font-family:inherit;transition:all .2s;color:var(--gray400);background:transparent}
.lang-btn.active{background:var(--navy);color:#fff}
.btn-start{background:var(--green);color:#fff;padding:9px 18px;border-radius:8px;font-size:.85rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-start:hover{background:var(--green-dark)}
/* HERO */
.page-hero{background:linear-gradient(135deg,var(--navy) 0%,#1a3a6b 100%);padding:64px 32px 56px;color:#fff;position:relative;overflow:hidden}
.page-hero::after{content:'';position:absolute;right:-80px;top:-80px;width:360px;height:360px;background:radial-gradient(circle,rgba(37,99,235,.2) 0%,transparent 70%);pointer-events:none}
.page-hero-inner{max-width:1280px;margin:0 auto;position:relative;z-index:1}
.breadcrumb{display:flex;align-items:center;gap:7px;font-size:.74rem;color:rgba(255,255,255,.5);margin-bottom:16px}
.breadcrumb a{color:rgba(255,255,255,.5);transition:color .2s}
.breadcrumb a:hover{color:#fff}
.hero-badge{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.9);font-size:.7rem;font-weight:600;padding:4px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px}
.page-hero h1{font-size:clamp(2rem,4vw,3rem);font-weight:900;margin-bottom:12px;letter-spacing:-.5px}
.page-hero p{font-size:.9rem;color:rgba(255,255,255,.65);max-width:560px;line-height:1.75}
.hero-meta{display:flex;align-items:center;gap:16px;margin-top:18px;flex-wrap:wrap}
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
`
  const body = `
<div class="topbar">&#127775; Florida's trusted business formation experts &mdash; <strong>LLC &amp; Corporation</strong> filing made simple.</div>
<header id="mainHeader">
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-mark">FL</div>
      <div class="logo-text">Florida Business Formation Center<span>mybusinessformation.com</span></div>
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
      <a href="/"><button class="btn-start">Start My Business &#8594;</button></a>
    </div>
  </div>
</header>
<section class="page-hero">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="/">Home</a> <span>/</span> <span class="en-inline">About Us</span><span class="es-inline" style="display:none">Qui&eacute;nes Somos</span></div>
    <div class="hero-badge en">About Us</div><div class="hero-badge es" style="display:none">Qui&eacute;nes Somos</div>
    <h1 class="en">We Help Entrepreneurs <br/>Build Their Dream</h1>
    <h1 class="es" style="display:none">Ayudamos a Emprendedores <br/>a Construir Su Sue&ntilde;o</h1>
    <p class="en">Florida Business Formation Center was founded with a clear mission: make business formation accessible, affordable, and stress-free for every entrepreneur &mdash; regardless of language or background.</p>
    <p class="es" style="display:none">Florida Business Formation Center fue fundado con una misi&oacute;n clara: hacer la formaci&oacute;n empresarial accesible, asequible y sin complicaciones para todo emprendedor, sin importar idioma ni procedencia.</p>
  </div>
</section>

<div class="page-layout">
  <aside class="sidebar">
    <div class="sidebar-title en">On This Page</div><div class="sidebar-title es" style="display:none">En Esta P&aacute;gina</div>
    <nav class="sidebar-nav">
      <a href="#mission" class="active">&#127919; <span class="en-inline">Our Mission</span><span class="es-inline" style="display:none">Nuestra Misi&oacute;n</span></a>
      <a href="#what-we-do">&#128196; <span class="en-inline">What We Do</span><span class="es-inline" style="display:none">Lo Que Hacemos</span></a>
      <a href="#why-us">&#11088; <span class="en-inline">Why Choose Us</span><span class="es-inline" style="display:none">&iquest;Por Qu&eacute; Nosotros?</span></a>
      <a href="#bilingual">&#127760; <span class="en-inline">Bilingual Service</span><span class="es-inline" style="display:none">Servicio Biling&uuml;e</span></a>
      <a href="#contact-about">&#128231; <span class="en-inline">Get In Touch</span><span class="es-inline" style="display:none">Cont&aacute;ctanos</span></a>
    </nav>
    <div class="sidebar-box">
      <h4 class="en">Ready to Start?</h4><h4 class="es" style="display:none">&iquest;Listo para Empezar?</h4>
      <p class="en">Form your LLC or Corporation today from $49 + state fee.</p>
      <p class="es" style="display:none">Forma tu LLC o Corporaci&oacute;n hoy desde $49 + cargo estatal.</p>
      <a href="/#pricing" style="display:block;background:var(--green);color:#fff;padding:9px 14px;border-radius:7px;font-size:.83rem;font-weight:600;text-align:center;margin-top:8px">Start My Business &#8594;</a>
    </div>
  </aside>

  <div class="doc-content">

    <div class="doc-section" id="mission">
      <h2>&#127919; <span class="en-inline">Our Mission</span><span class="es-inline" style="display:none">Nuestra Misi&oacute;n</span></h2>
      <p class="en">We believe that every entrepreneur &mdash; whether a first-time founder in Miami, a foreign investor in Orlando, or a small business owner in Tampa &mdash; deserves professional, affordable support when starting a business in Florida.</p>
      <p class="es" style="display:none">Creemos que todo emprendedor &mdash; ya sea un fundador primerizo en Miami, un inversionista extranjero en Orlando o un peque&ntilde;o empresario en Tampa &mdash; merece apoyo profesional y asequible al iniciar un negocio en Florida.</p>
      <p class="en">We cut through the red tape so you can focus on what matters most: building your business, serving your customers, and achieving your goals.</p>
      <p class="es" style="display:none">Eliminamos la burocracia para que pueda concentrarse en lo que m&aacute;s importa: construir su negocio, atender a sus clientes y alcanzar sus metas.</p>
      <div class="green-box en">&#10003; Over 500 Florida businesses formed and counting &mdash; LLCs, Corporations, DBAs and more.</div>
      <div class="green-box es" style="display:none">&#10003; M&aacute;s de 500 negocios en Florida formados y contando &mdash; LLCs, Corporaciones, DBAs y m&aacute;s.</div>
    </div>

    <div class="doc-section" id="what-we-do">
      <h2>&#128196; <span class="en-inline">What We Do</span><span class="es-inline" style="display:none">Lo Que Hacemos</span></h2>
      <p class="en">Florida Business Formation Center specializes in preparing and filing business formation documents with the Florida Division of Corporations and the IRS. Our services include:</p>
      <p class="es" style="display:none">Florida Business Formation Center se especializa en preparar y presentar documentos de formaci&oacute;n empresarial ante la Divisi&oacute;n de Corporaciones de Florida y el IRS. Nuestros servicios incluyen:</p>
      <ul>
        <li class="en">LLC and Corporation formation filing</li><li class="es" style="display:none">Formaci&oacute;n de LLC y Corporaci&oacute;n</li>
        <li class="en">EIN (Employer Identification Number) applications</li><li class="es" style="display:none">Solicitudes de EIN (N&uacute;mero de Identificaci&oacute;n del Empleador)</li>
        <li class="en">Operating Agreement and Corporate Bylaws preparation</li><li class="es" style="display:none">Preparaci&oacute;n de Acuerdo Operativo y Estatutos Corporativos</li>
        <li class="en">ITIN applications for foreign nationals</li><li class="es" style="display:none">Solicitudes de ITIN para extranjeros</li>
        <li class="en">DBA / Fictitious Name registration</li><li class="es" style="display:none">Registro de DBA / Nombre Ficticio</li>
        <li class="en">Registered Agent service</li><li class="es" style="display:none">Servicio de Agente Registrado</li>
        <li class="en">Annual Report filing</li><li class="es" style="display:none">Presentaci&oacute;n de Declaraci&oacute;n Anual</li>
        <li class="en">Articles of Amendment filing</li><li class="es" style="display:none">Presentaci&oacute;n de Art&iacute;culos de Enmienda</li>
        <li class="en">Virtual Mailing Address service</li><li class="es" style="display:none">Servicio de Direcci&oacute;n Postal Virtual</li>
      </ul>
      <div class="info-box en">&#128204; We are a document preparation service, not a law firm. For legal advice, please consult a licensed Florida attorney.</div>
      <div class="info-box es" style="display:none">&#128204; Somos un servicio de preparaci&oacute;n de documentos, no un bufete de abogados. Para asesor&iacute;a legal, consulte con un abogado licenciado en Florida.</div>
    </div>

    <div class="doc-section" id="why-us">
      <h2>&#11088; <span class="en-inline">Why Choose Florida Business Formation Center</span><span class="es-inline" style="display:none">&iquest;Por Qu&eacute; Elegirnos?</span></h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:4px">
        <div style="background:var(--gray50);border:1px solid var(--gray200);border-radius:10px;padding:16px">
          <div style="font-size:1.4rem;margin-bottom:8px">&#128205;</div>
          <strong style="font-size:.9rem;color:var(--navy)" class="en">Florida Specialists</strong>
          <strong style="font-size:.9rem;color:var(--navy)" class="es" style="display:none">Especialistas en Florida</strong>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="en">We focus exclusively on Florida LLC and Corporation filings. We know the process inside and out.</p>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="es" style="display:none">Nos enfocamos exclusivamente en tr&aacute;mites de LLC y Corporaci&oacute;n en Florida. Conocemos el proceso a fondo.</p>
        </div>
        <div style="background:var(--gray50);border:1px solid var(--gray200);border-radius:10px;padding:16px">
          <div style="font-size:1.4rem;margin-bottom:8px">&#127760;</div>
          <strong style="font-size:.9rem;color:var(--navy)" class="en">Bilingual EN / ES</strong>
          <strong style="font-size:.9rem;color:var(--navy)" class="es" style="display:none">Biling&uuml;e EN / ES</strong>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="en">Full service in English and Spanish. No language barriers &mdash; ever.</p>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="es" style="display:none">Servicio completo en ingl&eacute;s y espa&ntilde;ol. Sin barreras de idioma.</p>
        </div>
        <div style="background:var(--gray50);border:1px solid var(--gray200);border-radius:10px;padding:16px">
          <div style="font-size:1.4rem;margin-bottom:8px">&#128297;</div>
          <strong style="font-size:.9rem;color:var(--navy)" class="en">Transparent Pricing</strong>
          <strong style="font-size:.9rem;color:var(--navy)" class="es" style="display:none">Precios Transparentes</strong>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="en">Starting at $49. No hidden fees. You always know exactly what you&rsquo;re paying.</p>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="es" style="display:none">Desde $49. Sin cargos ocultos. Siempre sabe exactamente lo que paga.</p>
        </div>
        <div style="background:var(--gray50);border:1px solid var(--gray200);border-radius:10px;padding:16px">
          <div style="font-size:1.4rem;margin-bottom:8px">&#128241;</div>
          <strong style="font-size:.9rem;color:var(--navy)" class="en">WhatsApp Support</strong>
          <strong style="font-size:.9rem;color:var(--navy)" class="es" style="display:none">Soporte por WhatsApp</strong>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="en">Real people, real answers. Reach us on WhatsApp &mdash; in English or Spanish.</p>
          <p style="font-size:.79rem;color:var(--gray600);margin-top:4px" class="es" style="display:none">Personas reales, respuestas reales. Cont&aacute;ctenos por WhatsApp en espa&ntilde;ol o ingl&eacute;s.</p>
        </div>
      </div>
    </div>

    <div class="doc-section" id="bilingual">
      <h2>&#127760; <span class="en-inline">Proudly Bilingual</span><span class="es-inline" style="display:none">Orgullosamente Biling&uuml;es</span></h2>
      <p class="en">Florida is home to one of the largest Spanish-speaking entrepreneur communities in the United States. We built Florida Business Formation Center to serve everyone &mdash; from native English speakers to recent arrivals from Latin America, the Caribbean, and Spain. Our entire website, forms, and support team operate fully in both English and Spanish.</p>
      <p class="es" style="display:none">Florida es hogar de una de las comunidades de emprendedores hispanohablantes m&aacute;s grandes de los Estados Unidos. Construimos Florida Business Formation Center para servir a todos &mdash; desde angloparlantes nativos hasta reci&eacute;n llegados de Am&eacute;rica Latina, el Caribe y Espa&ntilde;a. Nuestro sitio web, formularios y equipo de soporte operan completamente en ingl&eacute;s y espa&ntilde;ol.</p>
    </div>

    <div class="doc-section" id="contact-about">
      <h2>&#128231; <span class="en-inline">Get In Touch</span><span class="es-inline" style="display:none">Cont&aacute;ctanos</span></h2>
      <p class="en">Have questions before you start? We&rsquo;re happy to help. Reach out via email or WhatsApp &mdash; no obligation, no pressure.</p>
      <p class="es" style="display:none">&iquest;Tienes preguntas antes de empezar? Estamos felices de ayudarte. Esc&iacute;benos por correo o WhatsApp &mdash; sin compromiso ni presi&oacute;n.</p>
      <div class="green-box">
        &#128231; <strong><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="563f383039163b2f3423253f383325253039243b37223f39387835393b">[email&#160;protected]</a></strong><br/>
        <span class="en">&#128205; Florida, United States &nbsp;&bull;&nbsp; &#127760; mybusinessformation.com</span>
        <span class="es" style="display:none">&#128205; Florida, Estados Unidos &nbsp;&bull;&nbsp; &#127760; mybusinessformation.com</span>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px">
        <a href="https://wa.me/1XXXXXXXXXX" target="_blank" style="background:#25D366;color:#fff;padding:11px 22px;border-radius:8px;font-size:.88rem;font-weight:600;display:inline-flex;align-items:center;gap:7px">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          <span class="en-inline">Chat on WhatsApp</span><span class="es-inline" style="display:none">Chatea por WhatsApp</span>
        </a>
        <a href="/#pricing" style="background:var(--navy);color:#fff;padding:11px 22px;border-radius:8px;font-size:.88rem;font-weight:600;display:inline-flex;align-items:center;gap:7px">
          <span class="en-inline">View Our Packages &#8594;</span><span class="es-inline" style="display:none">Ver Nuestros Paquetes &#8594;</span>
        </a>
      </div>
    </div>

  </div>
</div>
<footer>
  <div class="footer-inner">
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div>
        <div class="footer-copy">&#169; 2025 Florida Business Formation Center &middot; mybusinessformation.com &middot; All Rights Reserved.</div>
        <div class="footer-links" style="margin-top:6px">
          <a href="/terms" data-en="Terms &amp; Conditions" data-es="Términos y Condiciones">Terms &amp; Conditions</a>
          <a href="/privacy" data-en="Privacy Policy" data-es="Política de Privacidad">Privacy Policy</a>
          <a href="/legal" data-en="Legal Disclaimer" data-es="Aviso Legal">Legal Disclaimer</a>
          <a href="/about" data-en="About Us" data-es="Nosotros">About Us</a>
        </div>
      </div>
      <div class="footer-disclaimer">
        <strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>
        Florida Business Formation Center is a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant.
      </div>
    </div>
  </div>
</footer>
<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js">(function(){var l=localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();
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
    if(fdt)fdt.textContent=isEs?' Florida Business Formation Center es un servicio profesional de preparación de documentos. No somos una firma legal y no brindamos asesoría legal, fiscal ni financiera. Para asesoría legal, consulta un abogado licenciado en Florida.':' Florida Business Formation Center is a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. For legal advice, please consult a licensed Florida attorney.';
  }

  // Copyright
  var copy=document.querySelector('.footer-copy');
  if(copy)copy.innerHTML=isEs?'&#169; 2025 Florida Business Formation Center &middot; mybusinessformation.com &middot; Todos los Derechos Reservados.':'&#169; 2025 Florida Business Formation Center &middot; mybusinessformation.com &middot; All Rights Reserved.';
}
// Sidebar active state
document.querySelectorAll('.sidebar-nav a').forEach(function(link){
  link.addEventListener('click',function(){
    document.querySelectorAll('.sidebar-nav a').forEach(function(a){a.classList.remove('active');});
    link.classList.add('active');
  });
});
(function(){var l=localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();
</script>
`
  return (
    <><main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} /><ChatWidget /></>
  )
}
