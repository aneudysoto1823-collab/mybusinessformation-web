import type { Metadata } from 'next'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy of MyBusinessFormation. Learn how we collect, use, and protect your personal information when you use our Florida business filing services.',
  alternates: { canonical: 'https://mybusinessformation.com/privacy' },
  openGraph: { url: 'https://mybusinessformation.com/privacy' },
  robots: { index: true, follow: false },
}

export default function PrivacyPage() {
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
    <div class="breadcrumb"><a href="/">Home</a> <span>/</span> <span class="en-inline">Privacy Policy</span><span class="es-inline" style="display:none">Pol&iacute;tica de Privacidad</span></div>
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
      <a href="#cookies">6. <span class="en-inline">Cookies</span><span class="es-inline" style="display:none">Cookies</span></a>
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
        <li class="en">Social Security Number or ITIN (required for EIN and ITIN applications)</li><li class="es" style="display:none">N&uacute;mero de Seguro Social o ITIN (requerido para solicitudes de EIN e ITIN)</li>
        <li class="en">Payment information (processed securely — we do not store card numbers)</li><li class="es" style="display:none">Informaci&oacute;n de pago (procesada de forma segura; no almacenamos n&uacute;meros de tarjeta)</li>
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
        <li class="en">Prepare and file your business formation documents with the Florida Division of Corporations</li><li class="es" style="display:none">Preparar y presentar sus documentos de formaci&oacute;n ante la Divisi&oacute;n de Corporaciones de Florida</li>
        <li class="en">Submit EIN, ITIN, and other applications to the IRS on your behalf</li><li class="es" style="display:none">Enviar solicitudes de EIN, ITIN y otras al IRS en su nombre</li>
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
        <li class="en"><strong>Florida Division of Corporations</strong> &mdash; to file your formation documents</li><li class="es" style="display:none"><strong>Divisi&oacute;n de Corporaciones de Florida</strong> &mdash; para presentar sus documentos de formaci&oacute;n</li>
        <li class="en"><strong>Internal Revenue Service (IRS)</strong> &mdash; for EIN and ITIN applications</li><li class="es" style="display:none"><strong>Servicio de Impuestos Internos (IRS)</strong> &mdash; para solicitudes de EIN e ITIN</li>
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
      <p class="en">To exercise any of these rights, please contact us at <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="deb7b0b8b19eb3a7bcabadb7b0bbadadb8b1acb3bfaab7b1b0f0bdb1b3">[email&#160;protected]</a>.</p>
      <p class="es" style="display:none">Para ejercer cualquiera de estos derechos, cont&aacute;ctenos en <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="96fff8f0f9d6fbeff4e3e5fff8f3e5e5f0f9e4fbf7e2fff9f8b8f5f9fb">[email&#160;protected]</a>.</p>
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
        &#128231; <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="3d54535b527d50445f484e5453584e4e5b524f505c49545253135e5250">[email&#160;protected]</a><br/>
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
