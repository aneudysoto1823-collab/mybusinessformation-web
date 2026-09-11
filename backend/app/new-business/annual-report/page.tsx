import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'File Your Annual Report | Florida Business Formation Center',
  description: 'File this year\'s Florida Annual Report, a one-time filing with no subscription.',
  robots: { index: false, follow: false },
}

// Puente invisible (2026-09-11) — prefill del carrito compartido + redirect
// automático a /servicios, sin que el cliente tenga que apretar un segundo
// botón (antes esta página mostraba su propia tarjeta de precio con un botón
// "File My Annual Report" que recién ahí redirigía; el founder pidió que el
// link del email vaya "directo" a /servicios). Sigue siendo una página propia
// (no un link directo desde el email a /servicios) porque necesita JS de
// cliente para leer el Document ID de la URL y escribir en localStorage
// antes de navegar. Con Annual Report ya agregado, el
// cliente ve el resto del catálogo en /servicios y puede sumar más antes de
// pagar (a diferencia de /vip, que sí va directo al checkout).
export default function AnnualReportPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-dark:#1D4ED8;--blue-light:#EFF6FF;--green:#059669;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray300:#CBD5E1;--gray400:#94A3B8;--gray500:#64748B;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-sans);color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3,h4{font-family:var(--font-serif);line-height:1.2}
a{text-decoration:none;color:inherit}
header{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray200);padding:0 32px}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:70px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;border-radius:9px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--navy)}
.logo-mark img{width:100%;height:100%;object-fit:contain}
.logo-text{font-family:var(--font-serif);font-size:1.08rem;color:var(--navy);font-weight:700;line-height:1.25}
.header-links{display:flex;align-items:center;gap:18px}
.header-links a{font-size:.84rem;font-weight:600;color:var(--gray600)}
.header-links a:hover{color:var(--navy)}
.ar-page{max-width:480px;margin:0 auto;padding:120px 24px;flex:1;width:100%;text-align:center}
.ar-spinner{width:36px;height:36px;border-radius:50%;border:3px solid var(--gray200);border-top-color:var(--green);margin:0 auto 22px;animation:ar-spin .8s linear infinite}
@keyframes ar-spin{to{transform:rotate(360deg)}}
.ar-page h1{font-size:1.3rem;color:var(--navy);font-weight:800;margin-bottom:10px}
.ar-page p.lead{font-size:.95rem;color:var(--gray600);line-height:1.6}
.ar-page p.lead a{color:var(--blue);font-weight:700}
.en{display:block}.es{display:none}
.en-inline{display:inline}.es-inline{display:none}
footer{background:var(--navy);color:rgba(255,255,255,.55);padding:40px 32px 22px;margin-top:auto}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-divider{border:none;border-top:1px solid rgba(255,255,255,.1);margin-bottom:18px}
.footer-bottom{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px}
.footer-copy{font-size:.73rem;color:rgba(255,255,255,.35)}
.footer-links{display:flex;gap:14px;flex-wrap:wrap;margin-top:5px}
.footer-links a{font-size:.75rem;color:rgba(255,255,255,.4);transition:color .2s}
.footer-links a:hover{color:#fff}
.footer-disclaimer{font-size:.7rem;color:rgba(255,255,255,.28);max-width:540px;line-height:1.6}
@media(max-width:600px){.ar-page{padding:80px 18px}.header-links a:not(:last-child){display:none}}
`

  const body = `
<header>
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-mark"><img src="/fbfc-seal.png" alt="Florida Business Formation Center"/></div>
      <div class="logo-text">Florida Business<br/>Formation Center</div>
    </a>
    <div class="header-links">
      <a href="/servicios" class="en-inline">Services</a><a href="/servicios" class="es-inline" style="display:none">Servicios</a>
      <a href="/" class="en-inline">Login</a><a href="/" class="es-inline" style="display:none">Iniciar sesión</a>
    </div>
  </div>
</header>

<div class="ar-page">
  <div class="ar-spinner"></div>
  <h1 class="en">Taking you to our services...</h1>
  <h1 class="es" style="display:none">Llevándolo a nuestros servicios...</h1>
  <p class="lead en">Annual Report Filing is already added to your cart. If this doesn't redirect automatically, <a href="/servicios" class="en-inline">click here</a>.</p>
  <p class="lead es" style="display:none">La Declaración Anual ya está agregada a su carrito. Si esto no lo redirige automáticamente, <a href="/servicios" class="es-inline">haga clic aquí</a>.</p>
</div>

<footer>
  <div class="footer-inner">
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div>
        <div class="footer-copy">&#169; 2026 Florida Business Formation Center &middot; mybusinessformation.com &middot; All Rights Reserved.</div>
        <div class="footer-links" style="margin-top:6px">
          <a href="/terms" data-en="Terms &amp; Conditions" data-es="T&eacute;rminos y Condiciones">Terms &amp; Conditions</a>
          <a href="/privacy" data-en="Privacy Policy" data-es="Pol&iacute;tica de Privacidad">Privacy Policy</a>
          <a href="/legal" data-en="Legal Disclaimer" data-es="Aviso Legal">Legal Disclaimer</a>
        </div>
      </div>
      <div class="footer-disclaimer">
        <strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>
        Florida Business Formation Center is a professional document preparation and filing service. We are not affiliated with, endorsed by, or approved by any government agency. We are not a law firm and do not provide legal, tax, or financial advice. This is not a bill, invoice, or demand for payment. The services described are optional.
      </div>
    </div>
  </div>
</footer>

<script>
function arSetLang(lang){
  var isEs = lang === 'es';
  document.querySelectorAll('.en').forEach(function(el){ el.style.display = isEs ? 'none' : 'block'; });
  document.querySelectorAll('.es').forEach(function(el){ el.style.display = isEs ? 'block' : 'none'; });
  document.querySelectorAll('.en-inline').forEach(function(el){ el.style.display = isEs ? 'none' : 'inline'; });
  document.querySelectorAll('.es-inline').forEach(function(el){ el.style.display = isEs ? 'inline' : 'none'; });
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){
    el.innerHTML = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });
}

// Mismo contrato de carrito compartido que /vip y /servicios (flbc_svc_cart
// lo lee /servicios/page.tsx al cargar) — pero sin bundle, un solo servicio.
// Sin fetch a /api/sunbiz (a diferencia de /vip): esta página ya no muestra
// el nombre de la empresa en pantalla, así que no hay necesidad de esperar
// una respuesta de red antes de redirigir — el Document ID de la URL se
// guarda tal cual, /servicios hace su propia validación cuando lo necesite.
function arGoToServices(docId){
  try {
    localStorage.setItem('flbc_svc_cart', JSON.stringify(['annual-report']));
    localStorage.removeItem('flbc_svc_bundles');
    localStorage.removeItem('flbc_svc_bundle_added');
    localStorage.removeItem('flbc_svc_bundle_claimed');
    if (docId) {
      localStorage.setItem('flbc_svc_company', JSON.stringify({ documentId: docId }));
    }
  } catch (e) {}
  window.location.href = '/servicios';
}

(function(){
  var p = new URLSearchParams(window.location.search);
  var lang = p.get('lang') || localStorage.getItem('flbc_lang');
  var isEs = lang === 'es';
  if (isEs) arSetLang('es');

  var id = p.get('id');
  arGoToServices(id ? id.trim().toUpperCase() : null);
})();
</script>
`

  return <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
}
