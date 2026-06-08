import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Florida Business Formation Center',
  robots: { index: false, follow: false },
}

export default function NewBusinessPrivacyPage() {
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
    <a href="/new-business" class="logo">
      <div class="logo-mark">FL</div>
      <div class="logo-text">Florida Business Formation Center<span>opabiz.com</span></div>
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
    <div class="hero-badge">Privacy</div>
    <h1 class="en">Privacy Policy</h1><h1 class="es" style="display:none">Pol&iacute;tica de Privacidad</h1>
    <p class="en">We take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
    <p class="es" style="display:none">Nos tomamos su privacidad muy en serio. Esta pol&iacute;tica explica c&oacute;mo recopilamos, usamos y protegemos su informaci&oacute;n personal.</p>
    <div class="hero-meta">
      <div class="hero-meta-item">&#128197; <span class="en-inline">Last Updated: January 1, 2025</span><span class="es-inline" style="display:none">&Uacute;lt. Actualiz.: 1 de enero de 2025</span></div>
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
      <span class="en">Last Updated: January 1, 2025</span><span class="es" style="display:none">&Uacute;ltima Actualizaci&oacute;n: 1 de enero de 2025</span>
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
        <li class="en"><strong>Payment processors</strong> &mdash; to securely process your payments</li><li class="es" style="display:none"><strong>Procesadores de pago</strong> &mdash; para procesar sus pagos de forma segura</li>
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
      <p class="en">To exercise any of these rights, please contact us at <strong>info@opabiz.com</strong>.</p>
      <p class="es" style="display:none">Para ejercer cualquiera de estos derechos, cont&aacute;ctenos en <strong>info@opabiz.com</strong>.</p>
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
        &#128231; info@opabiz.com<br/>
        &#127760; opabiz.com<br/>
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
