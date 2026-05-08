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
    <div class="logo">
      <div class="logo-mark">FL</div>
      <div class="logo-text">Florida Business Formation Center<span>mybusinessformation.com</span></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <div class="lang-toggle">
        <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
      </div>
      <a href="/new-business" class="back-btn">&#8592; <span class="en-inline">Back to New Business</span><span class="es-inline" style="display:none">Regresar</span></a>
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
      <a href="#liability">5. <span class="en-inline">Limitation of Liability</span><span class="es-inline" style="display:none">Limitaci&oacute;n de Responsabilidad</span></a>
      <a href="#governing">6. <span class="en-inline">Governing Law</span><span class="es-inline" style="display:none">Ley Aplicable</span></a>
    </nav>
  </aside>

  <div class="doc-content">
    <div class="doc-updated">
      <span class="en">Last Updated: January 1, 2025 &bull; Effective: January 1, 2025</span>
      <span class="es" style="display:none">&Uacute;ltima Actualizaci&oacute;n: 1 de enero de 2025 &bull; Efectivo: 1 de enero de 2025</span>
    </div>

    <div class="warn-box en">&#9888; <strong>Not a Law Firm:</strong> Florida Business Formation Center is a document preparation service. We do not provide legal, tax, or financial advice. Use of our services does not create an attorney-client relationship.</div>
    <div class="warn-box es" style="display:none">&#9888; <strong>No somos un bufete:</strong> Florida Business Formation Center es un servicio de preparaci&oacute;n de documentos. No brindamos asesor&iacute;a legal, fiscal ni financiera. El uso de nuestros servicios no crea una relaci&oacute;n abogado-cliente.</div>

    <div class="doc-section" id="acceptance">
      <h2>1. <span class="en-inline">Acceptance of Terms</span><span class="es-inline" style="display:none">Aceptaci&oacute;n de T&eacute;rminos</span></h2>
      <p class="en">By accessing or using the services offered by Florida Business Formation Center (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) through mybusinessformation.com, you (&ldquo;Client&rdquo; or &ldquo;you&rdquo;) agree to be fully bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.</p>
      <p class="es" style="display:none">Al acceder o utilizar los servicios ofrecidos por Florida Business Formation Center (&ldquo;Empresa&rdquo;, &ldquo;nosotros&rdquo; o &ldquo;nuestro&rdquo;) a trav&eacute;s de mybusinessformation.com, usted (&ldquo;Cliente&rdquo;) acepta quedar sujeto a estos T&eacute;rminos y Condiciones. Si no est&aacute; de acuerdo con alguna parte de estos t&eacute;rminos, no debe utilizar nuestros servicios.</p>
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
      <h2>3. <span class="en-inline">Client Responsibilities</span><span class="es-inline" style="display:none">Responsabilidades del Cliente</span></h2>
      <p class="en">By using our services, you represent and warrant that all information you provide is accurate, complete, and truthful. You are solely responsible for providing accurate information. Florida Business Formation Center is not liable for rejection, delay, or additional fees resulting from inaccurate or incomplete information provided by you.</p>
      <p class="es" style="display:none">Al utilizar nuestros servicios, usted declara y garantiza que toda la informaci&oacute;n que proporciona es precisa, completa y veraz. Usted es el &uacute;nico responsable de proporcionar informaci&oacute;n precisa. Florida Business Formation Center no es responsable por rechazos, demoras o cargos adicionales resultantes de informaci&oacute;n inexacta o incompleta proporcionada por usted.</p>
      <p class="en">You must be at least 18 years of age and have the legal authority to enter into this agreement. The business for which you are requesting services must be used only for lawful purposes permitted under Florida law.</p>
      <p class="es" style="display:none">Debe tener al menos 18 a&ntilde;os de edad y tener la autoridad legal para celebrar este acuerdo. El negocio para el que solicita servicios debe utilizarse &uacute;nicamente para fines l&iacute;citos permitidos por la ley de Florida.</p>
    </div>

    <div class="doc-section" id="fees">
      <h2>4. <span class="en-inline">Fees &amp; Payments</span><span class="es-inline" style="display:none">Tarifas y Pagos</span></h2>
      <h3 class="en">4.1 Service Fees</h3><h3 class="es" style="display:none">4.1 Tarifas de Servicio</h3>
      <p class="en">Our service fees are clearly displayed during the order process. Current pricing: Labor Law Poster $120.00 &bull; EIN / Tax ID $161.00 &bull; Certificate of Status $79.00 &bull; Business Essentials Bundle (3 services) $324.00. Fees are subject to change without notice.</p>
      <p class="es" style="display:none">Nuestras tarifas de servicio se muestran claramente durante el proceso de pedido. Precios actuales: P&oacute;ster de Leyes Laborales $120.00 &bull; EIN / Tax ID $161.00 &bull; Certificado de Estatus $79.00 &bull; Bundle Esenciales del Negocio (3 servicios) $324.00. Las tarifas est&aacute;n sujetas a cambio sin previo aviso.</p>
      <div class="warn-box en">&#9888; <strong>All Sales Final:</strong> All sales are final and non-refundable. These are administrative and processing fees for document preparation services.</div>
      <div class="warn-box es" style="display:none">&#9888; <strong>Ventas Finales:</strong> Todas las ventas son finales y no reembolsables. Estas son tarifas administrativas y de procesamiento por servicios de preparaci&oacute;n de documentos.</div>
    </div>

    <div class="doc-section" id="liability">
      <h2>5. <span class="en-inline">Limitation of Liability</span><span class="es-inline" style="display:none">Limitaci&oacute;n de Responsabilidad</span></h2>
      <p class="en">To the maximum extent permitted by applicable law, Florida Business Formation Center shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Our total liability for any claim shall not exceed the total amount of service fees paid by you for the specific service giving rise to the claim.</p>
      <p class="es" style="display:none">En la m&aacute;xima medida permitida por la ley aplicable, Florida Business Formation Center no ser&aacute; responsable por da&ntilde;os indirectos, incidentales, especiales, consecuentes o punitivos. Nuestra responsabilidad total por cualquier reclamaci&oacute;n no exceder&aacute; el monto total de las tarifas de servicio pagadas por usted por el servicio espec&iacute;fico que dio origen a la reclamaci&oacute;n.</p>
    </div>

    <div class="doc-section" id="governing">
      <h2>6. <span class="en-inline">Governing Law</span><span class="es-inline" style="display:none">Ley Aplicable</span></h2>
      <p class="en">These Terms shall be governed by and construed in accordance with the laws of the State of Florida. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Miami-Dade County, Florida.</p>
      <p class="es" style="display:none">Estos T&eacute;rminos se regir&aacute;n e interpretar&aacute;n de acuerdo con las leyes del Estado de Florida. Cualquier disputa que surja de estos T&eacute;rminos estar&aacute; sujeta a la jurisdicci&oacute;n exclusiva de los tribunales estatales y federales ubicados en el Condado de Miami-Dade, Florida.</p>
      <div class="info-box en">&#128231; Questions about these Terms? Contact us at <strong>info@mybusinessformation.com</strong></div>
      <div class="info-box es" style="display:none">&#128231; &iquest;Preguntas sobre estos T&eacute;rminos? Cont&aacute;ctenos en <strong>info@mybusinessformation.com</strong></div>
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
