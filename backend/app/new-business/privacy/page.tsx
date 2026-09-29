import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  robots: { index: false, follow: false },
}

export default function NewBusinessPrivacyPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--gold:#F59E0B;--white:#fff;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-sans);color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3{font-family:var(--font-serif);line-height:1.2}
a{text-decoration:none;color:inherit}
header{background:rgba(255,255,255,.97);border-bottom:1px solid var(--gray200);padding:0 32px;}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:66px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;flex-shrink:0}
.logo-mark img{width:100%;height:100%;object-fit:contain}
.logo-text{font-family:var(--font-serif);font-size:1.05rem;color:var(--navy);font-weight:700;line-height:1.2}
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
.doc-section h3{font-size:.95rem;color:var(--navy);font-weight:600;margin:16px 0 8px}
.doc-section p{font-size:.875rem;color:var(--gray600);line-height:1.82;margin-bottom:10px}
.doc-section ul{padding-left:20px;margin-bottom:12px}
.doc-section li{font-size:.875rem;color:var(--gray600);line-height:1.8;margin-bottom:4px}
.info-box{background:var(--blue-light);border-left:3px solid var(--blue);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:var(--navy);line-height:1.7}
.green-box{background:var(--green-light);border-left:3px solid var(--green);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:var(--green-dark);line-height:1.7}
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
    <a href="/" class="logo">
      <div class="logo-mark"><img src="/fbfc-seal.png" alt="Florida Business Formation Center"/></div>
      <div class="logo-text">Florida Business Formation Center</div>
    </a>
    <div style="display:flex;align-items:center;gap:12px">
      <div class="lang-toggle">
        <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
      </div>
      <a href="/" class="back-btn">&#8592; <span class="en-inline">Back</span><span class="es-inline" style="display:none">&Aacute;tr&aacute;s</span></a>
    </div>
  </div>
</header>

<section class="page-hero">
  <div class="page-hero-inner">
    <div class="hero-badge">Privacy</div>
    <h1 class="en">Privacy Policy</h1><h1 class="es" style="display:none">Pol&iacute;tica de Privacidad</h1>
    <p class="en">We take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
    <p class="es" style="display:none">Nos tomamos su privacidad muy en serio. Esta pol&iacute;tica explica c&oacute;mo recopilamos, usamos y protegemos su informaci&oacute;n personal.</p>
    <div class="hero-meta">
      <div class="hero-meta-item">&#128197; <span class="en-inline">Last Updated: September 29, 2026</span><span class="es-inline" style="display:none">&Uacute;lt. Actualiz.: 29 de septiembre de 2026</span></div>
    </div>
  </div>
</section>

<div class="page-layout">
  <aside class="sidebar">
    <div class="sidebar-title en">Contents</div><div class="sidebar-title es" style="display:none">Contenido</div>
    <nav class="sidebar-nav">
      <a href="#collect" class="active">1. <span class="en-inline">Information We Collect</span><span class="es-inline" style="display:none">Informaci&oacute;n que Recopilamos</span></a>
      <a href="#use">2. <span class="en-inline">How We Use It</span><span class="es-inline" style="display:none">C&oacute;mo la Usamos</span></a>
      <a href="#share">3. <span class="en-inline">Sharing Information</span><span class="es-inline" style="display:none">Compartir Informaci&oacute;n</span></a>
      <a href="#security">4. <span class="en-inline">Data Security</span><span class="es-inline" style="display:none">Seguridad de Datos</span></a>
      <a href="#rights">5. <span class="en-inline">Your Rights</span><span class="es-inline" style="display:none">Sus Derechos</span></a>
      <a href="#cookies">6. Cookies</a>
      <a href="#contact-privacy">7. <span class="en-inline">Contact</span><span class="es-inline" style="display:none">Contacto</span></a>
    </nav>
  </aside>

  <div class="doc-content">
    <div class="doc-updated">
      <span class="en">Last Updated: September 29, 2026</span><span class="es" style="display:none">&Uacute;ltima Actualizaci&oacute;n: 29 de septiembre de 2026</span>
    </div>

    <div class="doc-section" id="collect">
      <h2>1. <span class="en-inline">Information We Collect</span><span class="es-inline" style="display:none">Informaci&oacute;n que Recopilamos</span></h2>
      <p class="en">We collect information you provide directly when you use our services, including:</p>
      <p class="es" style="display:none">Recopilamos informaci&oacute;n que usted proporciona directamente cuando utiliza nuestros servicios, incluyendo:</p>
      <ul>
        <li class="en">Full legal name, address, email address, and phone number</li><li class="es" style="display:none">Nombre legal completo, direcci&oacute;n, correo electr&oacute;nico y n&uacute;mero de tel&eacute;fono</li>
        <li class="en">Business information (name, address, purpose, ownership structure)</li><li class="es" style="display:none">Informaci&oacute;n empresarial (nombre, direcci&oacute;n, prop&oacute;sito, estructura de propiedad)</li>
        <li class="en">Social Security Number or ITIN (required for EIN applications only)</li><li class="es" style="display:none">N&uacute;mero de Seguro Social o ITIN (requerido &uacute;nicamente para solicitudes de EIN)</li>
        <li class="en">Payment information (processed securely &mdash; we do not store card numbers)</li><li class="es" style="display:none">Informaci&oacute;n de pago (procesada de forma segura; no almacenamos n&uacute;meros de tarjeta)</li>
        <li class="en">Electronic signatures and authorization records</li><li class="es" style="display:none">Firmas electr&oacute;nicas y registros de autorizaci&oacute;n</li>
      </ul>
      <div class="info-box en">&#128274; We use SSL encryption on all pages. Your data is transmitted securely at all times.</div>
      <div class="info-box es" style="display:none">&#128274; Usamos cifrado SSL en todas las p&aacute;ginas. Sus datos se transmiten de forma segura en todo momento.</div>

      <h3 class="en">Information We Obtain From Other Sources</h3><h3 class="es" style="display:none">Informaci&oacute;n que Obtenemos de Otras Fuentes</h3>
      <p class="en">In addition to information you provide directly, we also obtain limited information about business owners from other sources, so that we can send them information about compliance services that may be relevant to their newly formed company:</p>
      <p class="es" style="display:none">Adem&aacute;s de la informaci&oacute;n que usted nos proporciona directamente, tambi&eacute;n obtenemos informaci&oacute;n limitada sobre due&ntilde;os de negocio de otras fuentes, con el fin de poder enviarles informaci&oacute;n sobre servicios de cumplimiento que puedan ser relevantes para su empresa reci&eacute;n formada:</p>
      <ul>
        <li class="en"><strong>Public government records</strong> &mdash; such as the Florida Division of Corporations&rsquo; public database (company name, filing date, entity type, and registered address of newly formed Florida businesses)</li><li class="es" style="display:none"><strong>Registros p&uacute;blicos gubernamentales</strong> &mdash; como la base de datos p&uacute;blica de la Divisi&oacute;n de Corporaciones de Florida (nombre de la empresa, fecha de registro, tipo de entidad y direcci&oacute;n registrada de negocios reci&eacute;n formados en Florida)</li>
        <li class="en"><strong>Third-party data enrichment / people-search services</strong> (such as Enformion) &mdash; used to identify likely contact information (email address, phone number) for the owner of a newly formed business, based on their name and the business address on file with the state</li><li class="es" style="display:none"><strong>Servicios externos de enriquecimiento de datos / b&uacute;squeda de personas</strong> (como Enformion) &mdash; utilizados para identificar posible informaci&oacute;n de contacto (correo electr&oacute;nico, tel&eacute;fono) del due&ntilde;o de un negocio reci&eacute;n formado, a partir de su nombre y la direcci&oacute;n del negocio registrada ante el estado</li>
        <li class="en">Applicants to our <strong>Affiliate and Field Agent Program</strong> &mdash; full name, email, phone number, residential address, employment status, and Preparer Tax Identification Number (PTIN), submitted voluntarily when applying at mybusinessformation.com/afiliados</li><li class="es" style="display:none">Solicitantes de nuestro <strong>Programa de Afiliados y Agentes de Campo</strong> &mdash; nombre completo, correo electr&oacute;nico, tel&eacute;fono, direcci&oacute;n residencial, situaci&oacute;n laboral, y N&uacute;mero de Identificaci&oacute;n de Preparador de Impuestos (PTIN), enviados voluntariamente al aplicar en mybusinessformation.com/afiliados</li>
      </ul>
      <p class="en">If you received a marketing email or letter from us and did not directly provide us your information, you can opt out at any time using the unsubscribe link included in that communication, or by contacting us at <strong>info@mybusinessformation.com</strong>.</p>
      <p class="es" style="display:none">Si usted recibi&oacute; un correo o carta de marketing de nuestra parte y no nos proporcion&oacute; su informaci&oacute;n directamente, puede darse de baja en cualquier momento usando el enlace de cancelaci&oacute;n incluido en esa comunicaci&oacute;n, o cont&aacute;ctenos en <strong>info@mybusinessformation.com</strong>.</p>
    </div>

    <div class="doc-section" id="use">
      <h2>2. <span class="en-inline">How We Use Your Information</span><span class="es-inline" style="display:none">C&oacute;mo Usamos Su Informaci&oacute;n</span></h2>
      <p class="en">We use the information we collect to:</p>
      <p class="es" style="display:none">Usamos la informaci&oacute;n que recopilamos para:</p>
      <ul>
        <li class="en">Submit EIN applications to the IRS on your behalf</li><li class="es" style="display:none">Enviar solicitudes de EIN al IRS en su nombre</li>
        <li class="en">Process and deliver your requested compliance documents</li><li class="es" style="display:none">Procesar y entregar sus documentos de cumplimiento solicitados</li>
        <li class="en">Communicate with you about your order status and service updates</li><li class="es" style="display:none">Comunicarnos con usted sobre el estado de su pedido y actualizaciones del servicio</li>
        <li class="en">Fulfill our contractual obligations and provide customer support</li><li class="es" style="display:none">Cumplir nuestras obligaciones contractuales y brindar atenci&oacute;n al cliente</li>
        <li class="en">Comply with legal and regulatory requirements</li><li class="es" style="display:none">Cumplir con requisitos legales y regulatorios</li>
      </ul>
      <p class="en">We do not sell your personal information to third parties for marketing purposes.</p>
      <p class="es" style="display:none">No vendemos su informaci&oacute;n personal a terceros con fines de marketing.</p>
    </div>

    <div class="doc-section" id="share">
      <h2>3. <span class="en-inline">Sharing Your Information</span><span class="es-inline" style="display:none">Compartir Su Informaci&oacute;n</span></h2>
      <p class="en">We may share your information in the following limited circumstances:</p>
      <p class="es" style="display:none">Podemos compartir su informaci&oacute;n en las siguientes circunstancias limitadas:</p>
      <ul>
        <li class="en"><strong>Internal Revenue Service (IRS)</strong> &mdash; for EIN applications</li><li class="es" style="display:none"><strong>Servicio de Impuestos Internos (IRS)</strong> &mdash; para solicitudes de EIN</li>
        <li class="en"><strong>Payment processors</strong> (Stripe) &mdash; to securely process your payments</li><li class="es" style="display:none"><strong>Procesadores de pago</strong> (Stripe) &mdash; para procesar sus pagos de forma segura</li>
        <li class="en"><strong>Registered Agent service partners</strong> &mdash; when you purchase our Registered Agent service, we share the necessary business information with our registered agent service provider so they can act as your agent for service of process</li><li class="es" style="display:none"><strong>Socios proveedores del servicio de Agente Registrado</strong> &mdash; cuando usted compra nuestro servicio de Agente Registrado, compartimos la informaci&oacute;n necesaria del negocio con nuestro proveedor de agente registrado para que pueda actuar como su agente ante el estado</li>
        <li class="en"><strong>Data enrichment / people-search providers</strong> (Enformion) &mdash; to identify contact information for newly formed businesses we have not yet worked with, for outbound marketing purposes described above</li><li class="es" style="display:none"><strong>Proveedores de enriquecimiento de datos / b&uacute;squeda de personas</strong> (Enformion) &mdash; para identificar informaci&oacute;n de contacto de negocios reci&eacute;n formados con los que a&uacute;n no hemos trabajado, con fines de marketing saliente descritos arriba</li>
        <li class="en"><strong>Email delivery &amp; validation services</strong> (Resend, ZeroBounce) &mdash; to send our communications and verify that an email address is real before we send to it</li><li class="es" style="display:none"><strong>Servicios de env&iacute;o y validaci&oacute;n de correo</strong> (Resend, ZeroBounce) &mdash; para enviar nuestras comunicaciones y verificar que una direcci&oacute;n de correo sea real antes de enviarle</li>
        <li class="en"><strong>Address validation services</strong> (Google Address Validation, Lob.com) &mdash; to verify that a mailing or business address is deliverable</li><li class="es" style="display:none"><strong>Servicios de validaci&oacute;n de direcci&oacute;n</strong> (Google Address Validation, Lob.com) &mdash; para verificar que una direcci&oacute;n postal o de negocio sea entregable</li>
        <li class="en"><strong>Cloud data storage &amp; hosting providers</strong> (Supabase, Turso, Vercel) &mdash; to securely store and process the information described in this policy</li><li class="es" style="display:none"><strong>Proveedores de almacenamiento y hosting en la nube</strong> (Supabase, Turso, Vercel) &mdash; para almacenar y procesar de forma segura la informaci&oacute;n descrita en esta pol&iacute;tica</li>
        <li class="en"><strong>Legal requirements</strong> &mdash; when required by law, court order, or government authority</li><li class="es" style="display:none"><strong>Requisitos legales</strong> &mdash; cuando lo exija la ley, una orden judicial o una autoridad gubernamental</li>
      </ul>
    </div>

    <div class="doc-section" id="security">
      <h2>4. <span class="en-inline">Data Security</span><span class="es-inline" style="display:none">Seguridad de Datos</span></h2>
      <p class="en">We implement industry-standard security measures to protect your personal information, including SSL encryption, secure data storage, and restricted access controls. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
      <p class="es" style="display:none">Implementamos medidas de seguridad est&aacute;ndar de la industria para proteger su informaci&oacute;n personal, incluyendo cifrado SSL, almacenamiento seguro de datos y controles de acceso restringidos. Sin embargo, ning&uacute;n m&eacute;todo de transmisi&oacute;n por Internet es 100% seguro y no podemos garantizar seguridad absoluta.</p>
      <p class="en">We retain your information only as long as necessary to fulfill the services you requested and to comply with our legal obligations.</p>
      <p class="es" style="display:none">Conservamos su informaci&oacute;n solo durante el tiempo necesario para cumplir los servicios que solicit&oacute; y para cumplir con nuestras obligaciones legales.</p>
    </div>

    <div class="doc-section" id="rights">
      <h2>5. <span class="en-inline">Your Rights</span><span class="es-inline" style="display:none">Sus Derechos</span></h2>
      <p class="en">You have the right to:</p>
      <p class="es" style="display:none">Usted tiene derecho a:</p>
      <ul>
        <li class="en">Access the personal information we hold about you</li><li class="es" style="display:none">Acceder a la informaci&oacute;n personal que tenemos sobre usted</li>
        <li class="en">Request correction of inaccurate information</li><li class="es" style="display:none">Solicitar la correcci&oacute;n de informaci&oacute;n inexacta</li>
        <li class="en">Request deletion of your data, subject to our legal retention obligations</li><li class="es" style="display:none">Solicitar la eliminaci&oacute;n de sus datos, sujeto a nuestras obligaciones legales de retenci&oacute;n</li>
        <li class="en">Opt out of marketing communications at any time</li><li class="es" style="display:none">Optar por no recibir comunicaciones de marketing en cualquier momento</li>
      </ul>
      <p class="en">To exercise any of these rights, please contact us at <strong>info@mybusinessformation.com</strong>.</p>
      <p class="es" style="display:none">Para ejercer cualquiera de estos derechos, cont&aacute;ctenos en <strong>info@mybusinessformation.com</strong>.</p>
    </div>

    <div class="doc-section" id="cookies">
      <h2>6. Cookies</h2>
      <p class="en">Our website uses cookies to improve your browsing experience and analyze site traffic. Cookies are small text files stored on your device. You can control cookie settings through your browser. Disabling cookies may affect some website functionality.</p>
      <p class="es" style="display:none">Nuestro sitio web utiliza cookies para mejorar su experiencia de navegaci&oacute;n y analizar el tr&aacute;fico del sitio. Las cookies son peque&ntilde;os archivos de texto almacenados en su dispositivo. Puede controlar la configuraci&oacute;n de cookies a trav&eacute;s de su navegador. Deshabilitar las cookies puede afectar algunas funcionalidades del sitio.</p>
    </div>

    <div class="doc-section" id="contact-privacy">
      <h2>7. <span class="en-inline">Contact Us</span><span class="es-inline" style="display:none">Cont&aacute;ctenos</span></h2>
      <p class="en">If you have questions about this Privacy Policy or how we handle your data, please contact us:</p>
      <p class="es" style="display:none">Si tiene preguntas sobre esta Pol&iacute;tica de Privacidad o c&oacute;mo manejamos sus datos, cont&aacute;ctenos:</p>
      <div class="green-box">
        <strong>Florida Business Formation Center</strong><br/>
        &#128231; info@mybusinessformation.com<br/>
        &#127760; mybusinessformation.com<br/>
        &#128205; Florida, United States
      </div>
    </div>
  </div>
</div>

<footer>
  <div class="footer-inner">
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div class="footer-copy">&#169; 2025 Florida Business Formation Center &middot; All Rights Reserved.</div>
      <div class="footer-links">
        <a href="/terms">Terms &amp; Conditions</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/legal">Legal Disclaimer</a>
        <a href="/">&#8592; <span class="en-inline">New Business</span><span class="es-inline" style="display:none">Nuevo Negocio</span></a>
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
