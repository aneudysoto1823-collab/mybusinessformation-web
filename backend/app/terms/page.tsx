import type { Metadata } from 'next'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for MyBusinessFormation. Review our service agreement, refund policy, and conditions for Florida LLC and Corporation formation services.',
  alternates: { canonical: 'https://mybusinessformation.com/terms' },
  openGraph: { url: 'https://mybusinessformation.com/terms' },
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
    <div class="breadcrumb"><a href="/">Home</a> <span>/</span> <span class="en-inline">Terms &amp; Conditions</span><span class="es-inline" style="display:none">T&eacute;rminos y Condiciones</span></div>
    <div class="hero-badge en">Legal</div><div class="hero-badge es" style="display:none">Legal</div>
    <h1 class="en">Terms &amp; Conditions</h1>
    <h1 class="es" style="display:none">T&eacute;rminos y Condiciones</h1>
    <p class="en">Please read these terms carefully before using our services. By using Florida Business Formation Center, you agree to be bound by these terms.</p>
    <p class="es" style="display:none">Por favor lea estos t&eacute;rminos cuidadosamente antes de usar nuestros servicios. Al usar Florida Business Formation Center, usted acepta estar sujeto a estos t&eacute;rminos.</p>
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
      <a href="#liability">6. <span class="en-inline">Limitation of Liability</span><span class="es-inline" style="display:none">Limitaci&oacute;n de Responsabilidad</span></a>
      <a href="#governing">7. <span class="en-inline">Governing Law</span><span class="es-inline" style="display:none">Ley Aplicable</span></a>
    </nav>
  </aside>

  <div class="doc-content">
    <div class="doc-updated">
      <span class="en">Last Updated: January 1, 2025</span><span class="es" style="display:none">&Uacute;ltima Actualizaci&oacute;n: 1 de enero de 2025</span>
      <span>&bull;</span>
      <span class="en">Effective: January 1, 2025</span><span class="es" style="display:none">Efectivo: 1 de enero de 2025</span>
    </div>

    <div class="warn-box en">&#9888; <strong>Not a Law Firm:</strong> Florida Business Formation Center is a document preparation and filing service. We do not provide legal, tax, or financial advice. Use of our services does not create an attorney-client relationship.</div>
    <div class="warn-box es" style="display:none">&#9888; <strong>No somos un bufete:</strong> Florida Business Formation Center es un servicio de preparaci&oacute;n de documentos. No brindamos asesor&iacute;a legal, fiscal ni financiera. El uso de nuestros servicios no crea una relaci&oacute;n abogado-cliente.</div>

    <div class="doc-section" id="acceptance">
      <h2>1. <span class="en-inline">Acceptance of Terms</span><span class="es-inline" style="display:none">Aceptaci&oacute;n de T&eacute;rminos</span></h2>
      <p class="en">By accessing or using the services offered by Florida Business Formation Center ("Company," "we," "us," or "our") through mybusinessformation.com, you ("Client" or "you") agree to be fully bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.</p>
      <p class="es" style="display:none">Al acceder o utilizar los servicios ofrecidos por Florida Business Formation Center ("Empresa", "nosotros" o "nuestro") a trav&eacute;s de mybusinessformation.com, usted ("Cliente") acepta quedar sujeto a estos T&eacute;rminos y Condiciones. Si no est&aacute; de acuerdo con alguna parte de estos t&eacute;rminos, no debe utilizar nuestros servicios.</p>
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
      <h2>3. <span class="en-inline">Client Responsibilities</span><span class="es-inline" style="display:none">Responsabilidades del Cliente</span></h2>
      <p class="en">By using our services, you represent and warrant that all information you provide is accurate, complete, and truthful. You are solely responsible for providing accurate information. Florida Business Formation Center is not liable for rejection, delay, or additional fees resulting from inaccurate or incomplete information provided by you.</p>
      <p class="es" style="display:none">Al utilizar nuestros servicios, usted declara y garantiza que toda la informaci&oacute;n que proporciona es precisa, completa y veraz. Usted es el &uacute;nico responsable de proporcionar informaci&oacute;n precisa. Florida Business Formation Center no es responsable por rechazos, demoras o cargos adicionales resultantes de informaci&oacute;n inexacta o incompleta proporcionada por usted.</p>
      <p class="en">You must be at least 18 years of age and have the legal authority to enter into this agreement. The business you are forming must be used only for lawful purposes permitted under Florida law.</p>
      <p class="es" style="display:none">Debe tener al menos 18 a&ntilde;os de edad y tener la autoridad legal para celebrar este acuerdo. El negocio que est&aacute; formando debe utilizarse &uacute;nicamente para fines l&iacute;citos permitidos por la ley de Florida.</p>
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

    <div class="doc-section" id="liability">
      <h2>6. <span class="en-inline">Limitation of Liability</span><span class="es-inline" style="display:none">Limitaci&oacute;n de Responsabilidad</span></h2>
      <p class="en">To the maximum extent permitted by applicable law, Florida Business Formation Center shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Our total liability for any claim shall not exceed the total amount of service fees paid by you for the specific service giving rise to the claim.</p>
      <p class="es" style="display:none">En la m&aacute;xima medida permitida por la ley aplicable, Florida Business Formation Center no ser&aacute; responsable por da&ntilde;os indirectos, incidentales, especiales, consecuentes o punitivos. Nuestra responsabilidad total por cualquier reclamaci&oacute;n no exceder&aacute; el monto total de las tarifas de servicio pagadas por usted por el servicio espec&iacute;fico que dio origen a la reclamaci&oacute;n.</p>
    </div>

    <div class="doc-section" id="governing">
      <h2>7. <span class="en-inline">Governing Law</span><span class="es-inline" style="display:none">Ley Aplicable</span></h2>
      <p class="en">These Terms shall be governed by and construed in accordance with the laws of the State of Florida. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Miami-Dade County, Florida.</p>
      <p class="es" style="display:none">Estos T&eacute;rminos se regir&aacute;n e interpretar&aacute;n de acuerdo con las leyes del Estado de Florida. Cualquier disputa que surja de estos T&eacute;rminos estar&aacute; sujeta a la jurisdicci&oacute;n exclusiva de los tribunales estatales y federales ubicados en el Condado de Miami-Dade, Florida.</p>
      <div class="info-box en">&#128231; Questions about these Terms? Contact us at <strong><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="b5dcdbd3daf5d8ccd7c0c6dcdbd0c6c6d3dac7d8d4c1dcdadb9bd6dad8">[email&#160;protected]</a></strong></div>
      <div class="info-box es" style="display:none">&#128231; &iquest;Preguntas sobre estos T&eacute;rminos? Cont&aacute;ctenos en <strong><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="751c1b131a35180c1700061c1b100606131a071814011c1a1b5b161a18">[email&#160;protected]</a></strong></div>
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
