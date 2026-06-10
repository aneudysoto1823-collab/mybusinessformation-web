import type { Metadata } from 'next'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for OpaBiz. Review our service agreement, refund policy, and conditions for Florida LLC and Corporation formation services.',
  alternates: { canonical: 'https://opabiz.com/terms' },
  openGraph: { url: 'https://opabiz.com/terms' },
  robots: { index: true, follow: false },
}

export default function TermsPage() {
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
.logo-text{font-family:'Fraunces',serif;font-size:1.5rem;color:var(--navy);font-weight:700;line-height:1.2}
.logo-text span{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:.63rem;color:var(--gray400);font-weight:400;letter-spacing:.8px;text-transform:uppercase}
.logo-text span.logo-opa{display:inline;font-size:1.5rem;color:var(--navy);font-style:normal;letter-spacing:-.5px;text-transform:none;font-family:'Fraunces',serif;font-weight:700}
.logo-text span.logo-biz{display:inline;font-size:1.5rem;color:#2563EB;font-style:normal;letter-spacing:-.5px;text-transform:none;font-family:'Fraunces',serif;font-weight:700}
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
@media(max-width:768px){nav{display:none}nav.open{display:flex;flex-direction:column;position:absolute;top:62px;left:-16px;right:-16px;background:#fff;padding:10px 16px 14px;border-bottom:1px solid var(--gray200);box-shadow:0 8px 24px rgba(0,0,0,.08);z-index:200;gap:2px}nav.open a{padding:11px 12px;font-size:.92rem;border-radius:8px;font-weight:500;margin-left:0}nav.open a:hover{background:var(--gray100)}.hamburger{display:flex}header{padding:0 16px}.logo-text{font-size:1rem}.logo-text span{display:none}}
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
@media(max-width:768px){.page-hero{padding:24px 20px 22px;position:sticky;top:66px;z-index:100}.page-hero p{display:none}.hero-meta{display:none}.breadcrumb{display:none}.sidebar{position:static}}
`
  const body = `
<div class="topbar" data-en="&#127775; Florida's trusted business formation experts — <strong>LLC &amp; Corporation</strong> filing made simple." data-es="&#127775; Expertos de confianza en formación empresarial en Florida — <strong>LLC y Corporación</strong> fácil y rápido.">&#127775; Florida's trusted business formation experts — <strong>LLC &amp; Corporation</strong> filing made simple.</div>
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
    <div class="breadcrumb"><a href="/">Home</a> <span>/</span> <span class="en-inline">Terms &amp; Conditions</span><span class="es-inline" style="display:none">T&eacute;rminos y Condiciones</span></div>
    <div class="hero-badge en">Legal</div><div class="hero-badge es" style="display:none">Legal</div>
    <h1 class="en">Terms &amp; Conditions</h1>
    <h1 class="es" style="display:none">T&eacute;rminos y Condiciones</h1>
    <p class="en">Please read these terms carefully before using our services. OpaBiz is a trade name of Florida Business Formation Center. By using OpaBiz, you agree to be bound by these terms.</p>
    <p class="es" style="display:none">Por favor lea estos t&eacute;rminos cuidadosamente antes de usar nuestros servicios. OpaBiz es un nombre comercial de Florida Business Formation Center. Al usar OpaBiz, usted acepta estar sujeto a estos t&eacute;rminos.</p>
    <div class="hero-meta">
      <div class="hero-meta-item">&#128197; <span class="en-inline">Last Updated: January 1, 2025</span><span class="es-inline" style="display:none">&Uacute;ltima Actualizaci&oacute;n: 1 de enero de 2025</span></div>
      <div class="hero-meta-item">&#9881; <span class="en-inline">Effective: January 1, 2025</span><span class="es-inline" style="display:none">Efectivo: 1 de enero de 2025</span></div>
    </div>
  </div>
</section>

<div class="page-layout">
  <aside class="sidebar">
    <div class="sidebar-title en">Contents</div>
    <div class="sidebar-title es" style="display:none">Contenido</div>
    <nav class="sidebar-nav">
      <a href="#acceptance" class="active">1. <span class="en-inline">Acceptance</span><span class="es-inline" style="display:none">Aceptaci&oacute;n</span></a>
      <a href="#services">2. <span class="en-inline">Services</span><span class="es-inline" style="display:none">Servicios</span></a>
      <a href="#responsibilities">3. <span class="en-inline">Responsibilities</span><span class="es-inline" style="display:none">Responsabilidades</span></a>
      <a href="#fees">4. <span class="en-inline">Fees &amp; Payments</span><span class="es-inline" style="display:none">Tarifas y Pagos</span></a>
      <a href="#processing">5. <span class="en-inline">Processing Times</span><span class="es-inline" style="display:none">Tiempos de Proceso</span></a>
      <a href="#indemnification">6. <span class="en-inline">Indemnification</span><span class="es-inline" style="display:none">Indemnizaci&oacute;n</span></a>
      <a href="#electronic-consent">7. <span class="en-inline">Electronic Consent</span><span class="es-inline" style="display:none">Consentimiento Electr&oacute;nico</span></a>
      <a href="#liability">8. <span class="en-inline">Limitation of Liability</span><span class="es-inline" style="display:none">Limitaci&oacute;n de Responsabilidad</span></a>
      <a href="#arbitration">9. <span class="en-inline">Arbitration</span><span class="es-inline" style="display:none">Arbitraje</span></a>
      <a href="#governing">10. <span class="en-inline">Governing Law</span><span class="es-inline" style="display:none">Ley Aplicable</span></a>
      <a href="#submission">11. <span class="en-inline">Submission Deadline</span><span class="es-inline" style="display:none">Plazo de Entrega</span></a>
      <a href="#termination">12. <span class="en-inline">Right to Refuse Service</span><span class="es-inline" style="display:none">Derecho a Rechazar</span></a>
      <a href="#third-party">13. <span class="en-inline">Third-Party Systems</span><span class="es-inline" style="display:none">Sistemas de Terceros</span></a>
      <a href="#assignment">14. <span class="en-inline">Assignment</span><span class="es-inline" style="display:none">Cesi&oacute;n</span></a>
    </nav>
  </aside>

  <div class="doc-content">
    <div class="doc-updated">
      <span class="en">Last Updated: January 1, 2025</span><span class="es" style="display:none">&Uacute;ltima Actualizaci&oacute;n: 1 de enero de 2025</span>
      <span>&bull;</span>
      <span class="en">Effective: January 1, 2025</span><span class="es" style="display:none">Efectivo: 1 de enero de 2025</span>
    </div>

    <div class="doc-section" id="acceptance">
      <h2>1. <span class="en-inline">Acceptance of Terms</span><span class="es-inline" style="display:none">Aceptaci&oacute;n de T&eacute;rminos</span></h2>
      <p class="en">By accessing or using the services offered by Florida Business Formation Center ("Company," "we," "us," or "our") through opabiz.com, you ("Client" or "you") agree to be fully bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.</p>
      <p class="es" style="display:none">Al acceder o utilizar los servicios ofrecidos por Florida Business Formation Center ("Empresa", "nosotros" o "nuestro") a trav&eacute;s de opabiz.com, usted ("Cliente") acepta quedar sujeto a estos T&eacute;rminos y Condiciones. Si no est&aacute; de acuerdo con alguna parte de estos t&eacute;rminos, no debe utilizar nuestros servicios.</p>
      <p class="en">Florida Business Formation Center is a document preparation and filing service. We do not provide legal, tax, or financial advice. Use of our services does not create an attorney-client relationship.</p>
      <p class="es" style="display:none">Florida Business Formation Center es un servicio de preparaci&oacute;n y presentaci&oacute;n de documentos. No brindamos asesor&iacute;a legal, fiscal ni financiera. El uso de nuestros servicios no crea una relaci&oacute;n abogado-cliente.</p>
      <p class="en">We reserve the right to modify these Terms at any time. Your continued use of our services after any modification constitutes acceptance of the revised Terms.</p>
      <p class="es" style="display:none">Nos reservamos el derecho de modificar estos T&eacute;rminos en cualquier momento. El uso continuo de nuestros servicios despu&eacute;s de cualquier modificaci&oacute;n constituye la aceptaci&oacute;n de los T&eacute;rminos revisados.</p>
    </div>

    <div class="doc-section" id="services">
      <h2>2. <span class="en-inline">Description of Services</span><span class="es-inline" style="display:none">Descripci&oacute;n de Servicios</span></h2>
      <p class="en">Florida Business Formation Center provides document preparation and filing services, including but not limited to:</p>
      <p class="es" style="display:none">Florida Business Formation Center proporciona servicios de preparaci&oacute;n y presentaci&oacute;n de documentos, incluyendo pero no limitado a:</p>
      <ul>
        <li class="en">LLC and Corporation formation filing with the Florida Division of Corporations</li><li class="es" style="display:none">Formaci&oacute;n de LLC y Corporaci&oacute;n ante la Divisi&oacute;n de Corporaciones de Florida</li>
        <li class="en">EIN (Employer Identification Number) application assistance</li><li class="es" style="display:none">Asistencia para solicitud de EIN (N&uacute;mero de Identificaci&oacute;n del Empleador)</li>
        <li class="en">Operating Agreement preparation</li><li class="es" style="display:none">Preparaci&oacute;n del Acuerdo Operativo</li>
        <li class="en">Registered Agent service</li><li class="es" style="display:none">Servicio de Agente Registrado</li>
        <li class="en">ITIN application assistance</li><li class="es" style="display:none">Asistencia para solicitud de ITIN</li>
        <li class="en">DBA / Fictitious Name registration</li><li class="es" style="display:none">Registro de DBA / Nombre Ficticio</li>
        <li class="en">Articles of Amendment preparation and filing</li><li class="es" style="display:none">Preparaci&oacute;n y presentaci&oacute;n de Art&iacute;culos de Enmienda</li>
        <li class="en">Annual Report filing assistance</li><li class="es" style="display:none">Asistencia para declaraci&oacute;n anual</li>
      </ul>
    </div>

    <div class="doc-section" id="responsibilities">
      <h2>3. <span class="en-inline">Client Responsibilities &amp; Authorization</span><span class="es-inline" style="display:none">Responsabilidades y Autorizaci&oacute;n del Cliente</span></h2>
      <p class="en">By using our services, you represent and warrant that all information you provide is accurate, complete, and truthful. You are solely responsible for providing accurate information. Florida Business Formation Center is not liable for rejection, delay, or additional fees resulting from inaccurate or incomplete information provided by you.</p>
      <p class="es" style="display:none">Al utilizar nuestros servicios, usted declara y garantiza que toda la informaci&oacute;n que proporciona es precisa, completa y veraz. Usted es el &uacute;nico responsable de proporcionar informaci&oacute;n precisa. Florida Business Formation Center no es responsable por rechazos, demoras o cargos adicionales resultantes de informaci&oacute;n inexacta o incompleta proporcionada por usted.</p>
      <p class="en">You must be at least 18 years of age and have the legal authority to enter into this agreement. The business you are forming must be used only for lawful purposes permitted under Florida law.</p>
      <p class="es" style="display:none">Debe tener al menos 18 a&ntilde;os de edad y tener la autoridad legal para celebrar este acuerdo. El negocio que est&aacute; formando debe utilizarse &uacute;nicamente para fines l&iacute;citos permitidos por la ley de Florida.</p>
      <p class="en">By submitting your order and completing payment, you expressly authorize Florida Business Formation Center to prepare and submit on your behalf the formation documents, applications, and filings included in your selected package, including but not limited to Articles of Organization or Incorporation with the Florida Division of Corporations, EIN applications with the IRS, and any other documents necessary to fulfill your order. This authorization remains in effect until the ordered services have been fulfilled or you notify us in writing to cancel prior to any submission.</p>
      <p class="es" style="display:none">Al someter su orden y completar el pago, usted autoriza expresamente a Florida Business Formation Center a preparar y tramitar en su nombre los documentos de formaci&oacute;n, solicitudes y tr&aacute;mites incluidos en el paquete seleccionado, incluyendo pero no limitado a los Art&iacute;culos de Organizaci&oacute;n o Incorporaci&oacute;n ante la Divisi&oacute;n de Corporaciones de Florida, solicitudes de EIN ante el IRS, y cualquier otro documento necesario para cumplir su orden. Esta autorizaci&oacute;n permanece vigente hasta que los servicios ordenados sean completados o hasta que usted nos notifique por escrito para cancelar antes de cualquier tr&aacute;mite.</p>
    </div>

    <div class="doc-section" id="fees">
      <h2>4. <span class="en-inline">Fees &amp; Payments</span><span class="es-inline" style="display:none">Tarifas y Pagos</span></h2>
      <h3 class="en">4.1 Service Fees</h3><h3 class="es" style="display:none">4.1 Tarifas de Servicio</h3>
      <p class="en">Our service fees are clearly displayed during the order process. Current pricing: Basic $49, Standard $149, Premium $249. Add-on service fees vary and are disclosed at the time of selection.</p>
      <p class="es" style="display:none">Nuestras tarifas de servicio se muestran claramente durante el proceso de pedido. Precios actuales: Basic $49, Standard $149, Premium $249. Las tarifas de servicios adicionales var&iacute;an y se revelan al momento de la selecci&oacute;n.</p>
      <h3 class="en">4.2 Florida State Filing Fees</h3><h3 class="es" style="display:none">4.2 Tarifas Estatales de Florida</h3>
      <p class="en">Florida state filing fees are separate from our service fees and are paid directly to the State of Florida. Current state fees: LLC formation $125, Corporation formation $70. These fees are subject to change by the State of Florida without notice.</p>
      <p class="es" style="display:none">Las tarifas estatales de Florida son independientes de nuestras tarifas de servicio y se pagan directamente al Estado de Florida. Tarifas actuales: formaci&oacute;n de LLC $125, formaci&oacute;n de Corporaci&oacute;n $70. Estas tarifas est&aacute;n sujetas a cambios por el Estado de Florida sin previo aviso.</p>
      <div class="warn-box en">&#9888; <strong>No Refunds on State Fees:</strong> Florida state filing fees paid to the Division of Corporations are non-refundable once submitted.</div>
      <div class="warn-box es" style="display:none">&#9888; <strong>Sin Reembolso de Tarifas Estatales:</strong> Las tarifas estatales pagadas a la Divisi&oacute;n de Corporaciones no son reembolsables una vez enviadas.</div>
      <h3 class="en">4.3 Service Fee Refunds</h3><h3 class="es" style="display:none">4.3 Reembolsos de Tarifas de Servicio</h3>
      <p class="en">Service fee refunds may be requested within 24 hours of order placement and before any filing has been initiated. Once documents have been prepared or submitted, no refund will be issued. All refund requests must be submitted in writing to <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="0e676068614e63776c7b7d67606b7d7d68617c636f7a676160206d6163">[email&#160;protected]</a>.</p>
      <p class="es" style="display:none">Los reembolsos de tarifas de servicio pueden solicitarse dentro de las 24 horas posteriores a la realizaci&oacute;n del pedido y antes de que se haya iniciado cualquier tr&aacute;mite. Una vez preparados o enviados los documentos, no se emitir&aacute;n reembolsos. Todas las solicitudes de reembolso deben enviarse por escrito a <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="422b2c242d022f3b2037312b2c273131242d302f23362b2d2c6c212d2f">[email&#160;protected]</a>.</p>
    </div>

    <div class="doc-section" id="processing">
      <h2>5. <span class="en-inline">Processing Times</span><span class="es-inline" style="display:none">Tiempos de Procesamiento</span></h2>
      <p class="en">Processing times are estimates only and are not guaranteed. Standard filing typically takes 7&ndash;10 business days after submission to the Florida Division of Corporations. Expedited filing typically takes 1&ndash;3 business days. These timeframes are subject to the Florida Division of Corporations&rsquo; current processing volume and are beyond our control.</p>
      <p class="es" style="display:none">Los tiempos de procesamiento son estimados solamente y no est&aacute;n garantizados. La tramitaci&oacute;n est&aacute;ndar suele tardar entre 7 y 10 d&iacute;as h&aacute;biles despu&eacute;s de la presentaci&oacute;n ante la Divisi&oacute;n de Corporaciones de Florida. La tramitaci&oacute;n acelerada suele tardar entre 1 y 3 d&iacute;as h&aacute;biles. Estos plazos dependen del volumen actual de la Divisi&oacute;n de Corporaciones de Florida y est&aacute;n fuera de nuestro control.</p>
    </div>

    <div class="doc-section" id="indemnification">
      <h2>6. <span class="en-inline">Indemnification</span><span class="es-inline" style="display:none">Indemnizaci&oacute;n</span></h2>
      <p class="en">You agree to indemnify, defend, and hold harmless Florida Business Formation Center and its officers, employees, and agents from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys&rsquo; fees) arising out of or related to: (a) your use of our services; (b) any information you provide that is inaccurate, incomplete, or misleading; (c) your violation of these Terms; or (d) your violation of any applicable law or the rights of any third party. This indemnification obligation survives the termination of these Terms.</p>
      <p class="es" style="display:none">Usted acepta indemnizar, defender y mantener indemne a Florida Business Formation Center y a sus directivos, empleados y agentes de y contra cualquier reclamaci&oacute;n, da&ntilde;o, p&eacute;rdida, costo y gasto (incluyendo honorarios razonables de abogados) que surja de o est&eacute; relacionado con: (a) su uso de nuestros servicios; (b) cualquier informaci&oacute;n que usted proporcione que sea inexacta, incompleta o enga&ntilde;osa; (c) su incumplimiento de estos T&eacute;rminos; o (d) su violaci&oacute;n de cualquier ley aplicable o de los derechos de terceros. Esta obligaci&oacute;n de indemnizaci&oacute;n sobrevive la terminaci&oacute;n de estos T&eacute;rminos.</p>
    </div>

    <div class="doc-section" id="electronic-consent">
      <h2>7. <span class="en-inline">Electronic Communication Consent</span><span class="es-inline" style="display:none">Consentimiento de Comunicaci&oacute;n Electr&oacute;nica</span></h2>
      <p class="en">By using our services and providing your email address or phone number, you consent to receive electronic communications from Florida Business Formation Center, including order confirmations, status updates, service notices, and other information related to your account. You agree that all notices, disclosures, and communications we provide electronically satisfy any legal requirement that such communications be in writing. Standard message and data rates may apply for SMS communications. You may opt out of marketing communications at any time by contacting us at info@opabiz.com.</p>
      <p class="es" style="display:none">Al utilizar nuestros servicios y proporcionar su direcci&oacute;n de correo electr&oacute;nico o n&uacute;mero de tel&eacute;fono, usted consiente en recibir comunicaciones electr&oacute;nicas de Florida Business Formation Center, incluyendo confirmaciones de pedidos, actualizaciones de estado, avisos de servicio y otra informaci&oacute;n relacionada con su cuenta. Usted acepta que todos los avisos, divulgaciones y comunicaciones que proporcionamos electr&oacute;nicamente satisfacen cualquier requisito legal de que dichas comunicaciones sean por escrito. Pueden aplicarse tarifas est&aacute;ndar de mensajes y datos para comunicaciones por SMS. Puede optar por no recibir comunicaciones de marketing en cualquier momento contact&aacute;ndonos en info@opabiz.com.</p>
    </div>

    <div class="doc-section" id="liability">
      <h2>8. <span class="en-inline">Limitation of Liability</span><span class="es-inline" style="display:none">Limitaci&oacute;n de Responsabilidad</span></h2>
      <p class="en">To the maximum extent permitted by applicable law, Florida Business Formation Center shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, even if advised of the possibility of such damages. Our total aggregate liability for any and all claims arising out of or related to these Terms or your use of our services shall not exceed one hundred fifty dollars ($150.00) or the total amount of fees paid by you in the three (3) months preceding the claim, whichever is less.</p>
      <p class="es" style="display:none">En la m&aacute;xima medida permitida por la ley aplicable, Florida Business Formation Center no ser&aacute; responsable por da&ntilde;os indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pero no limitado a p&eacute;rdida de ganancias, datos u oportunidades de negocio, incluso si se ha advertido de la posibilidad de dichos da&ntilde;os. Nuestra responsabilidad total agregada por todas las reclamaciones que surjan de o est&eacute;n relacionadas con estos T&eacute;rminos o su uso de nuestros servicios no exceder&aacute; ciento cincuenta d&oacute;lares ($150.00) o el monto total de las tarifas pagadas por usted en los tres (3) meses anteriores a la reclamaci&oacute;n, lo que sea menor.</p>
    </div>

    <div class="doc-section" id="arbitration">
      <h2>9. <span class="en-inline">Dispute Resolution &amp; Arbitration</span><span class="es-inline" style="display:none">Resoluci&oacute;n de Disputas y Arbitraje</span></h2>
      <p class="en"><strong>Please read this section carefully. It affects your legal rights.</strong></p>
      <p class="es" style="display:none"><strong>Lea esta secci&oacute;n cuidadosamente. Afecta sus derechos legales.</strong></p>
      <p class="en">Any dispute, claim, or controversy arising out of or relating to these Terms or the use of our services shall be resolved exclusively through binding individual arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules, rather than in court. <strong>YOU AND FLORIDA BUSINESS FORMATION CENTER EACH WAIVE THE RIGHT TO A JURY TRIAL AND THE RIGHT TO PARTICIPATE IN A CLASS ACTION OR CLASS ARBITRATION.</strong> All claims must be brought in your individual capacity and not as a plaintiff or class member in any purported class or representative proceeding.</p>
      <p class="es" style="display:none">Cualquier disputa, reclamaci&oacute;n o controversia que surja de o est&eacute; relacionada con estos T&eacute;rminos o el uso de nuestros servicios se resolver&aacute; exclusivamente mediante arbitraje individual vinculante administrado por la Asociaci&oacute;n Americana de Arbitraje (AAA) bajo sus Reglas de Arbitraje del Consumidor, en lugar de en los tribunales. <strong>USTED Y FLORIDA BUSINESS FORMATION CENTER RENUNCIAN AL DERECHO A UN JUICIO CON JURADO Y AL DERECHO A PARTICIPAR EN UNA ACCI&Oacute;N COLECTIVA O ARBITRAJE COLECTIVO.</strong> Todas las reclamaciones deben presentarse en su capacidad individual y no como demandante o miembro de clase en ning&uacute;n proceso colectivo.</p>
      <p class="en">Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in a court of competent jurisdiction to prevent actual or threatened infringement of intellectual property rights. The arbitration shall take place in the State of Florida, or via video conference at the option of either party.</p>
      <p class="es" style="display:none">No obstante lo anterior, cualquiera de las partes puede solicitar medidas cautelares ante un tribunal competente para prevenir infracci&oacute;n de derechos de propiedad intelectual. El arbitraje se llevar&aacute; a cabo en el Estado de Florida, o por videoconferencia a opci&oacute;n de cualquiera de las partes.</p>
    </div>

    <div class="doc-section" id="governing">
      <h2>10. <span class="en-inline">Governing Law</span><span class="es-inline" style="display:none">Ley Aplicable</span></h2>
      <p class="en">These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law principles. To the extent any dispute is not subject to arbitration under Section 9, such dispute shall be subject to the exclusive jurisdiction of the state and federal courts located in Miami-Dade County, Florida, and you consent to personal jurisdiction in such courts.</p>
      <p class="es" style="display:none">Estos T&eacute;rminos se regir&aacute;n e interpretar&aacute;n de acuerdo con las leyes del Estado de Florida, sin tener en cuenta sus principios de conflicto de leyes. En la medida en que alguna disputa no est&eacute; sujeta a arbitraje bajo la Secci&oacute;n 9, dicha disputa estar&aacute; sujeta a la jurisdicci&oacute;n exclusiva de los tribunales estatales y federales ubicados en el Condado de Miami-Dade, Florida, y usted consiente la jurisdicci&oacute;n personal en dichos tribunales.</p>
      <div class="info-box en">&#128231; Questions about these Terms? Contact us at <strong>info@opabiz.com</strong></div>
      <div class="info-box es" style="display:none">&#128231; &iquest;Preguntas sobre estos T&eacute;rminos? Cont&aacute;ctenos en <strong>info@opabiz.com</strong></div>
    </div>

    <div class="doc-section" id="submission">
      <h2>11. <span class="en-inline">Information Submission Deadline</span><span class="es-inline" style="display:none">Plazo para Env&iacute;o de Informaci&oacute;n</span></h2>
      <p class="en">To begin processing your order, you must provide all required information within five (5) business days of completing your purchase. This includes personal details, SSN/ITIN, business information, formation documents, or any other documentation we request in connection with your selected package. If the required information is not received within this period, we cannot guarantee processing timelines and Florida Business Formation Center shall bear no responsibility for resulting delays. You will receive reminder notifications every three (3) days until all required information has been submitted.</p>
      <p class="es" style="display:none">Para comenzar a procesar su orden, debe proporcionar toda la informaci&oacute;n requerida dentro de los cinco (5) d&iacute;as h&aacute;biles siguientes a completar su compra. Esto incluye datos personales, SSN/ITIN, informaci&oacute;n del negocio, documentos de formaci&oacute;n, u otra documentaci&oacute;n que solicitemos en relaci&oacute;n con el paquete seleccionado. Si la informaci&oacute;n requerida no se recibe dentro de este per&iacute;odo, no podemos garantizar los tiempos de procesamiento y Florida Business Formation Center no ser&aacute; responsable por las demoras resultantes. Usted recibir&aacute; recordatorios cada tres (3) d&iacute;as hasta que toda la informaci&oacute;n requerida haya sido enviada.</p>
    </div>

    <div class="doc-section" id="termination">
      <h2>12. <span class="en-inline">Right to Refuse or Terminate Service</span><span class="es-inline" style="display:none">Derecho a Rechazar o Cancelar el Servicio</span></h2>
      <p class="en">Florida Business Formation Center reserves the right to refuse, suspend, or terminate service to any person or entity at our sole discretion and at any time, without prior notice. Grounds for termination include, but are not limited to, providing false or misleading information, violating these Terms, or engaging in conduct that we determine to be harmful, fraudulent, or unlawful. If a service is cancelled before any work has begun, we will evaluate refund eligibility on a case-by-case basis consistent with our refund policy.</p>
      <p class="es" style="display:none">Florida Business Formation Center se reserva el derecho de rechazar, suspender o cancelar el servicio a cualquier persona o entidad a nuestra sola discreci&oacute;n y en cualquier momento, sin previo aviso. Los motivos de cancelaci&oacute;n incluyen, entre otros, proporcionar informaci&oacute;n falsa o enga&ntilde;osa, incumplir estos T&eacute;rminos, o incurrir en conductas que consideremos perjudiciales, fraudulentas o ilegales. Si un servicio se cancela antes de que haya comenzado cualquier trabajo, evaluaremos la elegibilidad para reembolso caso por caso, conforme a nuestra pol&iacute;tica de reembolsos.</p>
    </div>

    <div class="doc-section" id="third-party">
      <h2>13. <span class="en-inline">Third-Party Systems &amp; Tools</span><span class="es-inline" style="display:none">Sistemas y Herramientas de Terceros</span></h2>
      <p class="en">Certain aspects of our services depend on systems and platforms operated by third parties, including but not limited to the Florida Division of Corporations (Sunbiz), the IRS online portal, and Stripe for payment processing. We have no control over these external systems and are not responsible for any delays, errors, outages, processing backlogs, or rejections caused by them. Delays attributable to government agencies or third-party platforms do not entitle you to a refund or cancellation of services. Your use of any third-party platform in connection with our services is subject to that platform&rsquo;s own terms, conditions, and privacy policies.</p>
      <p class="es" style="display:none">Ciertos aspectos de nuestros servicios dependen de sistemas y plataformas operados por terceros, incluyendo pero no limitado a la Divisi&oacute;n de Corporaciones de Florida (Sunbiz), el portal en l&iacute;nea del IRS y Stripe para el procesamiento de pagos. No tenemos control sobre estos sistemas externos y no somos responsables por demoras, errores, interrupciones, atrasos en el procesamiento o rechazos causados por ellos. Las demoras atribuibles a agencias gubernamentales o plataformas de terceros no le dan derecho a reembolso ni cancelaci&oacute;n de los servicios. Su uso de cualquier plataforma de terceros en relaci&oacute;n con nuestros servicios est&aacute; sujeto a los propios t&eacute;rminos, condiciones y pol&iacute;ticas de privacidad de esa plataforma.</p>
    </div>

    <div class="doc-section" id="assignment">
      <h2>14. <span class="en-inline">Assignment of Rights</span><span class="es-inline" style="display:none">Cesi&oacute;n de Derechos</span></h2>
      <p class="en">You may not assign, transfer, or delegate any of your rights or obligations under these Terms to any third party without our prior written consent. Any attempted assignment without such consent shall be null and void. Florida Business Formation Center reserves the right to assign or transfer its rights and obligations under these Terms to any affiliate, successor entity, or third party, provided that such transfer does not materially diminish your rights as a client.</p>
      <p class="es" style="display:none">Usted no puede ceder, transferir ni delegar ninguno de sus derechos u obligaciones bajo estos T&eacute;rminos a ning&uacute;n tercero sin nuestro consentimiento previo y por escrito. Cualquier intento de cesi&oacute;n sin dicho consentimiento ser&aacute; nulo y sin efecto. Florida Business Formation Center se reserva el derecho de ceder o transferir sus derechos y obligaciones bajo estos T&eacute;rminos a cualquier afiliada, entidad sucesora o tercero, siempre que dicha transferencia no disminuya materialmente sus derechos como cliente.</p>
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
        <div style="margin-top:8px;font-size:0.77rem;color:rgba(255,255,255,0.45)">&#128231; <a href="mailto:info@opabiz.com" style="color:inherit">info@opabiz.com</a></div>
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
    <><main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} /><ChatWidget /></>
  )
}
