import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions — Florida Business Formation Center',
  robots: { index: false, follow: false },
}

export default function NewBusinessTermsPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--gold:#F59E0B;--white:#fff;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',sans-serif;color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3{font-family:'Fraunces',serif;line-height:1.2}
a{text-decoration:none;color:inherit}
header{background:rgba(255,255,255,.97);border-bottom:1px solid var(--gray200);padding:0 32px;}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:66px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;background:linear-gradient(135deg,var(--navy),var(--blue));border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Fraunces',serif;font-size:1rem;font-weight:700;flex-shrink:0}
.logo-text{font-family:'Fraunces',serif;font-size:.95rem;color:var(--navy);font-weight:700;line-height:1.2}
.logo-text span{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:.63rem;color:var(--gray400);font-weight:400;letter-spacing:.8px;text-transform:uppercase}
.back-btn{display:flex;align-items:center;gap:7px;font-size:.82rem;font-weight:600;color:var(--blue);padding:8px 16px;border-radius:8px;border:1.5px solid var(--blue);transition:all .2s}
.back-btn:hover{background:var(--blue-light)}
.lang-toggle{display:flex;background:var(--gray100);border-radius:20px;padding:3px;gap:2px}
.lang-btn{padding:5px 12px;border-radius:16px;border:none;cursor:pointer;font-size:.77rem;font-weight:600;font-family:inherit;transition:all .2s;color:var(--gray400);background:transparent}
.lang-btn.active{background:var(--navy);color:#fff}
.page-hero{background:linear-gradient(135deg,var(--navy) 0%,#1a3a6b 100%);padding:56px 32px 48px;color:#fff;position:relative;overflow:hidden}
.page-hero::after{content:'';position:absolute;right:-80px;top:-80px;width:360px;height:360px;background:radial-gradient(circle,rgba(37,99,235,.2) 0%,transparent 70%);pointer-events:none}
.page-hero-inner{max-width:1280px;margin:0 auto;position:relative;z-index:1}
.hero-badge{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.9);font-size:.7rem;font-weight:600;padding:4px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px}
.page-hero h1{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;margin-bottom:10px;letter-spacing:-.5px}
.page-hero p{font-size:.88rem;color:rgba(255,255,255,.65);max-width:520px;line-height:1.75}
.hero-meta{display:flex;align-items:center;gap:16px;margin-top:16px;flex-wrap:wrap}
.hero-meta-item{font-size:.75rem;color:rgba(255,255,255,.5);display:flex;align-items:center;gap:5px}
.page-layout{max-width:1280px;margin:0 auto;padding:52px 32px 80px;display:grid;grid-template-columns:220px 1fr;gap:48px;flex:1}
@media(max-width:900px){.page-layout{grid-template-columns:1fr;padding:32px 20px 60px}}
.sidebar{position:sticky;top:24px;align-self:start}
.sidebar-title{font-size:.71rem;font-weight:600;color:var(--gray400);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px}
.sidebar-nav a{display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--gray600);padding:8px 12px;border-radius:7px;margin-bottom:3px;transition:all .2s;border-left:2px solid transparent}
.sidebar-nav a:hover,.sidebar-nav a.active{color:var(--navy);background:var(--blue-light);border-left-color:var(--blue)}
.doc-content{min-width:0}
.doc-updated{font-size:.75rem;color:var(--gray400);padding-bottom:14px;border-bottom:1px solid var(--gray200);margin-bottom:32px}
.doc-section{margin-bottom:36px;scroll-margin-top:24px}
.doc-section h2{font-size:1.15rem;color:var(--navy);font-weight:700;margin-bottom:12px;padding-bottom:9px;border-bottom:2px solid var(--blue-light);display:flex;align-items:center;gap:9px}
.doc-section h3{font-size:.95rem;color:var(--navy);font-weight:600;margin:16px 0 7px}
.doc-section p{font-size:.875rem;color:var(--gray600);line-height:1.82;margin-bottom:10px}
.doc-section ul{padding-left:20px;margin-bottom:12px}
.doc-section li{font-size:.875rem;color:var(--gray600);line-height:1.8;margin-bottom:4px}
.warn-box{background:#FEF3C7;border-left:3px solid var(--gold);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:#92400E;line-height:1.7}
.info-box{background:var(--blue-light);border-left:3px solid var(--blue);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:var(--navy);line-height:1.7}
.en{display:block}.es{display:none}
footer{background:var(--navy);color:rgba(255,255,255,.55);padding:32px 32px 20px;margin-top:auto}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-divider{border:none;border-top:1px solid rgba(255,255,255,.1);margin-bottom:16px}
.footer-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.footer-copy{font-size:.73rem;color:rgba(255,255,255,.35)}
.footer-links{display:flex;gap:14px;flex-wrap:wrap}
.footer-links a{font-size:.75rem;color:rgba(255,255,255,.4);transition:color .2s}
.footer-links a:hover{color:#fff}
`
  const body = `
<header>
  <div class="header-inner">
    <a href="/new-business" class="logo">
      <div class="logo-mark">FL</div>
      <div class="logo-text">Florida Business Formation Center<span>mybusinessformation.com</span></div>
    </a>
    <div style="display:flex;align-items:center;gap:12px">
      <div class="lang-toggle">
        <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
      </div>
      <a href="/new-business" class="back-btn">&#8592; <span class="en-inline">Back</span><span class="es-inline" style="display:none">&Aacute;tr&aacute;s</span></a>
    </div>
  </div>
</header>

<section class="page-hero">
  <div class="page-hero-inner">
    <div class="hero-badge">Legal</div>
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
      <a href="#indemnification">5. <span class="en-inline">Indemnification</span><span class="es-inline" style="display:none">Indemnizaci&oacute;n</span></a>
      <a href="#electronic-consent">6. <span class="en-inline">Electronic Consent</span><span class="es-inline" style="display:none">Consentimiento Electr&oacute;nico</span></a>
      <a href="#liability">7. <span class="en-inline">Limitation of Liability</span><span class="es-inline" style="display:none">Limitaci&oacute;n de Responsabilidad</span></a>
      <a href="#arbitration">8. <span class="en-inline">Arbitration</span><span class="es-inline" style="display:none">Arbitraje</span></a>
      <a href="#governing">9. <span class="en-inline">Governing Law</span><span class="es-inline" style="display:none">Ley Aplicable</span></a>
      <a href="#submission">10. <span class="en-inline">Submission Deadline</span><span class="es-inline" style="display:none">Plazo de Entrega</span></a>
      <a href="#termination">11. <span class="en-inline">Right to Refuse Service</span><span class="es-inline" style="display:none">Derecho a Rechazar</span></a>
      <a href="#third-party">12. <span class="en-inline">Third-Party Systems</span><span class="es-inline" style="display:none">Sistemas de Terceros</span></a>
      <a href="#assignment">13. <span class="en-inline">Assignment</span><span class="es-inline" style="display:none">Cesi&oacute;n</span></a>
    </nav>
  </aside>

  <div class="doc-content">
    <div class="doc-updated">
      <span class="en">Last Updated: January 1, 2025 &bull; Effective: January 1, 2025</span>
      <span class="es" style="display:none">&Uacute;ltima Actualizaci&oacute;n: 1 de enero de 2025 &bull; Efectivo: 1 de enero de 2025</span>
    </div>

    <div class="doc-section" id="acceptance">
      <h2>1. <span class="en-inline">Acceptance of Terms</span><span class="es-inline" style="display:none">Aceptaci&oacute;n de T&eacute;rminos</span></h2>
      <p class="en">By accessing or using the services offered by Florida Business Formation Center (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) through mybusinessformation.com, you (&ldquo;Client&rdquo; or &ldquo;you&rdquo;) agree to be fully bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.</p>
      <p class="es" style="display:none">Al acceder o utilizar los servicios ofrecidos por Florida Business Formation Center (&ldquo;Empresa&rdquo;, &ldquo;nosotros&rdquo; o &ldquo;nuestro&rdquo;) a trav&eacute;s de mybusinessformation.com, usted (&ldquo;Cliente&rdquo;) acepta quedar sujeto a estos T&eacute;rminos y Condiciones. Si no est&aacute; de acuerdo con alguna parte de estos t&eacute;rminos, no debe utilizar nuestros servicios.</p>
      <p class="en">Florida Business Formation Center is a document preparation service. We do not provide legal, tax, or financial advice. Use of our services does not create an attorney-client relationship.</p>
      <p class="es" style="display:none">Florida Business Formation Center es un servicio de preparaci&oacute;n de documentos. No brindamos asesor&iacute;a legal, fiscal ni financiera. El uso de nuestros servicios no crea una relaci&oacute;n abogado-cliente.</p>
      <p class="en">We reserve the right to modify these Terms at any time. Your continued use of our services after any modification constitutes acceptance of the revised Terms.</p>
      <p class="es" style="display:none">Nos reservamos el derecho de modificar estos T&eacute;rminos en cualquier momento. El uso continuo de nuestros servicios despu&eacute;s de cualquier modificaci&oacute;n constituye la aceptaci&oacute;n de los T&eacute;rminos revisados.</p>
    </div>

    <div class="doc-section" id="services">
      <h2>2. <span class="en-inline">Description of Services</span><span class="es-inline" style="display:none">Descripci&oacute;n de Servicios</span></h2>
      <p class="en">Florida Business Formation Center provides document preparation and compliance services for existing Florida businesses, including but not limited to:</p>
      <p class="es" style="display:none">Florida Business Formation Center proporciona servicios de preparaci&oacute;n de documentos y cumplimiento normativo para negocios existentes en Florida, incluyendo pero no limitado a:</p>
      <ul>
        <li class="en">EIN (Employer Identification Number) application assistance</li><li class="es" style="display:none">Asistencia para solicitud de EIN (N&uacute;mero de Identificaci&oacute;n del Empleador)</li>
        <li class="en">Labor Law Poster compliance (2026 edition)</li><li class="es" style="display:none">Cumplimiento de p&oacute;ster de Leyes Laborales (edici&oacute;n 2026)</li>
        <li class="en">Certificate of Status (Florida)</li><li class="es" style="display:none">Certificado de Estatus (Florida)</li>
      </ul>
    </div>

    <div class="doc-section" id="responsibilities">
      <h2>3. <span class="en-inline">Client Responsibilities &amp; Authorization</span><span class="es-inline" style="display:none">Responsabilidades y Autorizaci&oacute;n del Cliente</span></h2>
      <p class="en">By using our services, you represent and warrant that all information you provide is accurate, complete, and truthful. You are solely responsible for providing accurate information. Florida Business Formation Center is not liable for rejection, delay, or additional fees resulting from inaccurate or incomplete information provided by you.</p>
      <p class="es" style="display:none">Al utilizar nuestros servicios, usted declara y garantiza que toda la informaci&oacute;n que proporciona es precisa, completa y veraz. Usted es el &uacute;nico responsable de proporcionar informaci&oacute;n precisa. Florida Business Formation Center no es responsable por rechazos, demoras o cargos adicionales resultantes de informaci&oacute;n inexacta o incompleta proporcionada por usted.</p>
      <p class="en">You must be at least 18 years of age and have the legal authority to enter into this agreement. The business for which you are requesting services must be used only for lawful purposes permitted under Florida law.</p>
      <p class="es" style="display:none">Debe tener al menos 18 a&ntilde;os de edad y tener la autoridad legal para celebrar este acuerdo. El negocio para el que solicita servicios debe utilizarse &uacute;nicamente para fines l&iacute;citos permitidos por la ley de Florida.</p>
      <p class="en">By submitting your order and completing payment, you expressly authorize Florida Business Formation Center to prepare and submit on your behalf the applications and documents included in your selected services, including EIN applications with the IRS, Labor Law Poster orders, and Certificate of Status requests with the Florida Division of Corporations. This authorization remains in effect until the ordered services have been fulfilled or you notify us in writing to cancel prior to any submission.</p>
      <p class="es" style="display:none">Al someter su orden y completar el pago, usted autoriza expresamente a Florida Business Formation Center a preparar y tramitar en su nombre las solicitudes y documentos incluidos en los servicios seleccionados, incluyendo solicitudes de EIN ante el IRS, &oacute;rdenes del P&oacute;ster de Leyes Laborales y solicitudes del Certificado de Estatus ante la Divisi&oacute;n de Corporaciones de Florida. Esta autorizaci&oacute;n permanece vigente hasta que los servicios ordenados sean completados o hasta que usted nos notifique por escrito para cancelar antes de cualquier tr&aacute;mite.</p>
    </div>

    <div class="doc-section" id="fees">
      <h2>4. <span class="en-inline">Fees &amp; Payments</span><span class="es-inline" style="display:none">Tarifas y Pagos</span></h2>
      <h3 class="en">4.1 Service Fees</h3><h3 class="es" style="display:none">4.1 Tarifas de Servicio</h3>
      <p class="en">Our service fees are clearly displayed during the order process. Current pricing: Labor Law Poster $120.00 &bull; EIN / Tax ID $161.00 &bull; Certificate of Status $79.00 &bull; Business Essentials Bundle (3 services) $324.00. Fees are subject to change without notice.</p>
      <p class="es" style="display:none">Nuestras tarifas de servicio se muestran claramente durante el proceso de pedido. Precios actuales: P&oacute;ster de Leyes Laborales $120.00 &bull; EIN / Tax ID $161.00 &bull; Certificado de Estatus $79.00 &bull; Bundle Esenciales del Negocio (3 servicios) $324.00. Las tarifas est&aacute;n sujetas a cambio sin previo aviso.</p>
      <p class="en">All sales are final and non-refundable. These are administrative and processing fees for document preparation services.</p>
      <p class="es" style="display:none">Todas las ventas son finales y no reembolsables. Estas son tarifas administrativas y de procesamiento por servicios de preparaci&oacute;n de documentos.</p>
    </div>

    <div class="doc-section" id="indemnification">
      <h2>5. <span class="en-inline">Indemnification</span><span class="es-inline" style="display:none">Indemnizaci&oacute;n</span></h2>
      <p class="en">You agree to indemnify, defend, and hold harmless Florida Business Formation Center and its officers, employees, and agents from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys&rsquo; fees) arising out of or related to: (a) your use of our services; (b) any information you provide that is inaccurate, incomplete, or misleading; (c) your violation of these Terms; or (d) your violation of any applicable law or the rights of any third party. This indemnification obligation survives the termination of these Terms.</p>
      <p class="es" style="display:none">Usted acepta indemnizar, defender y mantener indemne a Florida Business Formation Center y a sus directivos, empleados y agentes de y contra cualquier reclamaci&oacute;n, da&ntilde;o, p&eacute;rdida, costo y gasto (incluyendo honorarios razonables de abogados) que surja de o est&eacute; relacionado con: (a) su uso de nuestros servicios; (b) cualquier informaci&oacute;n que usted proporcione que sea inexacta, incompleta o engañosa; (c) su incumplimiento de estos T&eacute;rminos; o (d) su violaci&oacute;n de cualquier ley aplicable o de los derechos de terceros. Esta obligaci&oacute;n de indemnizaci&oacute;n sobrevive la terminaci&oacute;n de estos T&eacute;rminos.</p>
    </div>

    <div class="doc-section" id="electronic-consent">
      <h2>6. <span class="en-inline">Electronic Communication Consent</span><span class="es-inline" style="display:none">Consentimiento de Comunicaci&oacute;n Electr&oacute;nica</span></h2>
      <p class="en">By using our services and providing your email address or phone number, you consent to receive electronic communications from Florida Business Formation Center, including order confirmations, status updates, service notices, and other information related to your account. You agree that all notices, disclosures, and communications we provide electronically satisfy any legal requirement that such communications be in writing. Standard message and data rates may apply for SMS communications. You may opt out of marketing communications at any time by contacting us at info@mybusinessformation.com.</p>
      <p class="es" style="display:none">Al utilizar nuestros servicios y proporcionar su direcci&oacute;n de correo electr&oacute;nico o n&uacute;mero de tel&eacute;fono, usted consiente en recibir comunicaciones electr&oacute;nicas de Florida Business Formation Center, incluyendo confirmaciones de pedidos, actualizaciones de estado, avisos de servicio y otra informaci&oacute;n relacionada con su cuenta. Usted acepta que todos los avisos, divulgaciones y comunicaciones que proporcionamos electr&oacute;nicamente satisfacen cualquier requisito legal de que dichas comunicaciones sean por escrito. Pueden aplicarse tarifas est&aacute;ndar de mensajes y datos para comunicaciones por SMS. Puede optar por no recibir comunicaciones de marketing en cualquier momento contact&aacute;ndonos en info@mybusinessformation.com.</p>
    </div>

    <div class="doc-section" id="liability">
      <h2>7. <span class="en-inline">Limitation of Liability</span><span class="es-inline" style="display:none">Limitaci&oacute;n de Responsabilidad</span></h2>
      <p class="en">To the maximum extent permitted by applicable law, Florida Business Formation Center shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, even if advised of the possibility of such damages. Our total aggregate liability for any and all claims arising out of or related to these Terms or your use of our services shall not exceed one hundred fifty dollars ($150.00) or the total amount of fees paid by you in the three (3) months preceding the claim, whichever is less.</p>
      <p class="es" style="display:none">En la m&aacute;xima medida permitida por la ley aplicable, Florida Business Formation Center no ser&aacute; responsable por da&ntilde;os indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pero no limitado a p&eacute;rdida de ganancias, datos u oportunidades de negocio, incluso si se ha advertido de la posibilidad de dichos da&ntilde;os. Nuestra responsabilidad total agregada por todas las reclamaciones que surjan de o est&eacute;n relacionadas con estos T&eacute;rminos o su uso de nuestros servicios no exceder&aacute; ciento cincuenta d&oacute;lares ($150.00) o el monto total de las tarifas pagadas por usted en los tres (3) meses anteriores a la reclamaci&oacute;n, lo que sea menor.</p>
    </div>

    <div class="doc-section" id="arbitration">
      <h2>8. <span class="en-inline">Dispute Resolution &amp; Arbitration</span><span class="es-inline" style="display:none">Resoluci&oacute;n de Disputas y Arbitraje</span></h2>
      <p class="en"><strong>Please read this section carefully. It affects your legal rights.</strong></p>
      <p class="es" style="display:none"><strong>Lea esta secci&oacute;n cuidadosamente. Afecta sus derechos legales.</strong></p>
      <p class="en">Any dispute, claim, or controversy arising out of or relating to these Terms or the use of our services shall be resolved exclusively through binding individual arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules, rather than in court. <strong>YOU AND FLORIDA BUSINESS FORMATION CENTER EACH WAIVE THE RIGHT TO A JURY TRIAL AND THE RIGHT TO PARTICIPATE IN A CLASS ACTION OR CLASS ARBITRATION.</strong> All claims must be brought in your individual capacity and not as a plaintiff or class member in any purported class or representative proceeding.</p>
      <p class="es" style="display:none">Cualquier disputa, reclamaci&oacute;n o controversia que surja de o est&eacute; relacionada con estos T&eacute;rminos o el uso de nuestros servicios se resolver&aacute; exclusivamente mediante arbitraje individual vinculante administrado por la Asociaci&oacute;n Americana de Arbitraje (AAA) bajo sus Reglas de Arbitraje del Consumidor, en lugar de en los tribunales. <strong>USTED Y FLORIDA BUSINESS FORMATION CENTER RENUNCIAN AL DERECHO A UN JUICIO CON JURADO Y AL DERECHO A PARTICIPAR EN UNA ACCI&Oacute;N COLECTIVA O ARBITRAJE COLECTIVO.</strong> Todas las reclamaciones deben presentarse en su capacidad individual y no como demandante o miembro de clase en ning&uacute;n proceso colectivo.</p>
      <p class="en">Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in a court of competent jurisdiction to prevent actual or threatened infringement, misappropriation, or violation of intellectual property rights. The arbitration shall take place in the State of Florida, or via video conference at the option of either party.</p>
      <p class="es" style="display:none">No obstante lo anterior, cualquiera de las partes puede solicitar medidas cautelares u otro remedio equitativo ante un tribunal competente para prevenir infracci&oacute;n real o amenazada de derechos de propiedad intelectual. El arbitraje se llevar&aacute; a cabo en el Estado de Florida, o por videoconferencia a opci&oacute;n de cualquiera de las partes.</p>
    </div>

    <div class="doc-section" id="governing">
      <h2>9. <span class="en-inline">Governing Law</span><span class="es-inline" style="display:none">Ley Aplicable</span></h2>
      <p class="en">These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law principles. To the extent any dispute is not subject to arbitration under Section 8, such dispute shall be subject to the exclusive jurisdiction of the state and federal courts located in Miami-Dade County, Florida, and you consent to personal jurisdiction in such courts.</p>
      <p class="es" style="display:none">Estos T&eacute;rminos se regir&aacute;n e interpretar&aacute;n de acuerdo con las leyes del Estado de Florida, sin tener en cuenta sus principios de conflicto de leyes. En la medida en que alguna disputa no est&eacute; sujeta a arbitraje bajo la Secci&oacute;n 8, dicha disputa estar&aacute; sujeta a la jurisdicci&oacute;n exclusiva de los tribunales estatales y federales ubicados en el Condado de Miami-Dade, Florida, y usted consiente la jurisdicci&oacute;n personal en dichos tribunales.</p>
      <div class="info-box en">&#128231; Questions about these Terms? Contact us at <strong>info@mybusinessformation.com</strong></div>
      <div class="info-box es" style="display:none">&#128231; &iquest;Preguntas sobre estos T&eacute;rminos? Cont&aacute;ctenos en <strong>info@mybusinessformation.com</strong></div>
    </div>

    <div class="doc-section" id="submission">
      <h2>10. <span class="en-inline">Information Submission Deadline</span><span class="es-inline" style="display:none">Plazo para Env&iacute;o de Informaci&oacute;n</span></h2>
      <p class="en">To begin processing your order, you must provide all required information within five (5) business days of completing your purchase. This includes personal details, SSN/ITIN, business information, or any other documentation we request in connection with your selected services. If the required information is not received within this period, we cannot guarantee processing timelines and Florida Business Formation Center shall bear no responsibility for resulting delays. You will receive reminder notifications every three (3) days until all required information has been submitted.</p>
      <p class="es" style="display:none">Para comenzar a procesar su orden, debe proporcionar toda la informaci&oacute;n requerida dentro de los cinco (5) d&iacute;as h&aacute;biles siguientes a completar su compra. Esto incluye datos personales, SSN/ITIN, informaci&oacute;n del negocio, u otra documentaci&oacute;n que solicitemos en relaci&oacute;n con los servicios seleccionados. Si la informaci&oacute;n requerida no se recibe dentro de este per&iacute;odo, no podemos garantizar los tiempos de procesamiento y Florida Business Formation Center no ser&aacute; responsable por las demoras resultantes. Usted recibir&aacute; recordatorios cada tres (3) d&iacute;as hasta que toda la informaci&oacute;n requerida haya sido enviada.</p>
    </div>

    <div class="doc-section" id="termination">
      <h2>11. <span class="en-inline">Right to Refuse or Terminate Service</span><span class="es-inline" style="display:none">Derecho a Rechazar o Cancelar el Servicio</span></h2>
      <p class="en">Florida Business Formation Center reserves the right to refuse, suspend, or terminate service to any person or entity at our sole discretion and at any time, without prior notice. Grounds for termination include, but are not limited to, providing false or misleading information, violating these Terms, or engaging in conduct that we determine to be harmful, fraudulent, or unlawful. If a service is cancelled before any work has begun, we will evaluate refund eligibility on a case-by-case basis consistent with our refund policy.</p>
      <p class="es" style="display:none">Florida Business Formation Center se reserva el derecho de rechazar, suspender o cancelar el servicio a cualquier persona o entidad a nuestra sola discreci&oacute;n y en cualquier momento, sin previo aviso. Los motivos de cancelaci&oacute;n incluyen, entre otros, proporcionar informaci&oacute;n falsa o enga&ntilde;osa, incumplir estos T&eacute;rminos, o incurrir en conductas que consideremos perjudiciales, fraudulentas o ilegales. Si un servicio se cancela antes de que haya comenzado cualquier trabajo, evaluaremos la elegibilidad para reembolso caso por caso, conforme a nuestra pol&iacute;tica de reembolsos.</p>
    </div>

    <div class="doc-section" id="third-party">
      <h2>12. <span class="en-inline">Third-Party Systems &amp; Tools</span><span class="es-inline" style="display:none">Sistemas y Herramientas de Terceros</span></h2>
      <p class="en">Certain aspects of our services depend on systems and platforms operated by third parties, including but not limited to the IRS online portal, the Florida Division of Corporations (Sunbiz), and Stripe for payment processing. We have no control over these external systems and are not responsible for any delays, errors, outages, processing backlogs, or rejections caused by them. Delays attributable to government agencies or third-party platforms do not entitle you to a refund or cancellation of services. Your use of any third-party platform in connection with our services is subject to that platform&rsquo;s own terms, conditions, and privacy policies.</p>
      <p class="es" style="display:none">Ciertos aspectos de nuestros servicios dependen de sistemas y plataformas operados por terceros, incluyendo pero no limitado al portal en l&iacute;nea del IRS, la Divisi&oacute;n de Corporaciones de Florida (Sunbiz) y Stripe para el procesamiento de pagos. No tenemos control sobre estos sistemas externos y no somos responsables por demoras, errores, interrupciones, atrasos en el procesamiento o rechazos causados por ellos. Las demoras atribuibles a agencias gubernamentales o plataformas de terceros no le dan derecho a reembolso ni cancelaci&oacute;n de los servicios. Su uso de cualquier plataforma de terceros en relaci&oacute;n con nuestros servicios est&aacute; sujeto a los propios t&eacute;rminos, condiciones y pol&iacute;ticas de privacidad de esa plataforma.</p>
    </div>

    <div class="doc-section" id="assignment">
      <h2>13. <span class="en-inline">Assignment of Rights</span><span class="es-inline" style="display:none">Cesi&oacute;n de Derechos</span></h2>
      <p class="en">You may not assign, transfer, or delegate any of your rights or obligations under these Terms to any third party without our prior written consent. Any attempted assignment without such consent shall be null and void. Florida Business Formation Center reserves the right to assign or transfer its rights and obligations under these Terms to any affiliate, successor entity, or third party, provided that such transfer does not materially diminish your rights as a client.</p>
      <p class="es" style="display:none">Usted no puede ceder, transferir ni delegar ninguno de sus derechos u obligaciones bajo estos T&eacute;rminos a ning&uacute;n tercero sin nuestro consentimiento previo y por escrito. Cualquier intento de cesi&oacute;n sin dicho consentimiento ser&aacute; nulo y sin efecto. Florida Business Formation Center se reserva el derecho de ceder o transferir sus derechos y obligaciones bajo estos T&eacute;rminos a cualquier afiliada, entidad sucesora o tercero, siempre que dicha transferencia no disminuya materialmente sus derechos como cliente.</p>
    </div>
  </div>
</div>

<footer>
  <div class="footer-inner">
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div class="footer-copy">&#169; 2025 Florida Business Formation Center &middot; All Rights Reserved.</div>
      <div class="footer-links">
        <a href="/new-business/terms">Terms &amp; Conditions</a>
        <a href="/new-business/privacy">Privacy Policy</a>
        <a href="/new-business/legal">Legal Disclaimer</a>
        <a href="/new-business">&#8592; New Business</a>
      </div>
    </div>
  </div>
</footer>

<script>
function setLang(lang){
  localStorage.setItem('flbc_lang',lang);
  var isEs=lang==='es';
  document.getElementById('btn-en').classList.toggle('active',lang==='en');
  document.getElementById('btn-es').classList.toggle('active',lang==='es');
  document.querySelectorAll('.en').forEach(function(el){el.style.display=isEs?'none':'block';});
  document.querySelectorAll('.es').forEach(function(el){el.style.display=isEs?'block':'none';});
  document.querySelectorAll('.en-inline').forEach(function(el){el.style.display=isEs?'none':'inline';});
  document.querySelectorAll('.es-inline').forEach(function(el){el.style.display=isEs?'inline':'none';});
}
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
    <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
  )
}
