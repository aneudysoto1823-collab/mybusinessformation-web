import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VIP Compliance Package | Florida Business Formation Center',
  description:
    'Registered Agent + Annual Report Filing bundled together, renewed automatically every year.',
  robots: { index: false, follow: false },
}

// Puente invisible (2026-09-11) — mismo patrón que /new-business/annual-report:
// prefill del carrito compartido + redirect automático a /servicios/checkout,
// sin página intermedia ni segundo clic. Antes esta página mostraba su propia
// tarjeta de precio con botón "Get VIP Compliance Package"; el founder pidió
// que cayera directo en el Paso 1 del formulario real (ya autocompletado).
// Se evaluó embeber las 2 cajas explicativas (Agente Registrado + Declaración
// Anual) + el wizard de /servicios/checkout en una sola pantalla, estilo
// /new-business — se descartó: ambas páginas son ~2600-3000 líneas cada una
// con su propio bloque de script "crudo" (no componentes React normales),
// juntarlas arriesgaba colisión de nombres de función/IDs globales. Las
// definiciones de RA/AR ya están en el email que el cliente lee antes de
// hacer clic (lib/vip-reminder-email.ts), así que no hace falta repetirlas
// acá.
export default function VipCompliancePage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--green:#059669;--white:#fff;--gray200:#E2E8F0;--gray600:#475569;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font-sans);color:#1E293B;background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1{font-family:var(--font-serif);line-height:1.2}
a{text-decoration:none;color:inherit}
header{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray200);padding:0 32px}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:70px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;border-radius:9px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--navy)}
.logo-mark img{width:100%;height:100%;object-fit:contain}
.logo-text{font-family:var(--font-serif);font-size:1.08rem;color:var(--navy);font-weight:700;line-height:1.25}
.vip-page{max-width:480px;margin:0 auto;padding:120px 24px;flex:1;width:100%;text-align:center}
.vip-spinner{width:36px;height:36px;border-radius:50%;border:3px solid var(--gray200);border-top-color:var(--green);margin:0 auto 22px;animation:vip-spin .8s linear infinite}
@keyframes vip-spin{to{transform:rotate(360deg)}}
.vip-page h1{font-size:1.3rem;color:var(--navy);font-weight:800;margin-bottom:10px}
.vip-page p.lead{font-size:.95rem;color:var(--gray600);line-height:1.6}
.vip-page p.lead a{color:var(--blue);font-weight:700}
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
@media(max-width:600px){.vip-page{padding:80px 18px}}
`

  const body = `
<header>
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-mark"><img src="/fbfc-seal.png" alt="Florida Business Formation Center"/></div>
      <div class="logo-text">Florida Business<br/>Formation Center</div>
    </a>
  </div>
</header>

<div class="vip-page">
  <div class="vip-spinner"></div>
  <h1 class="en">Taking you to checkout...</h1>
  <h1 class="es" style="display:none">Llevándolo al checkout...</h1>
  <p class="lead en">Your VIP Compliance Package (Registered Agent + Annual Report) is already added to your cart. If this doesn't redirect automatically, <a href="/servicios/checkout" class="en-inline">click here</a>.</p>
  <p class="lead es" style="display:none">Su Paquete VIP de Cumplimiento (Agente Registrado + Declaración Anual) ya está agregado a su carrito. Si esto no lo redirige automáticamente, <a href="/servicios/checkout" class="es-inline">haga clic aquí</a>.</p>
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
function vipSetLang(lang){
  var isEs = lang === 'es';
  document.querySelectorAll('.en').forEach(function(el){ el.style.display = isEs ? 'none' : 'block'; });
  document.querySelectorAll('.es').forEach(function(el){ el.style.display = isEs ? 'block' : 'none'; });
  document.querySelectorAll('.en-inline').forEach(function(el){ el.style.display = isEs ? 'none' : 'inline'; });
  document.querySelectorAll('.es-inline').forEach(function(el){ el.style.display = isEs ? 'inline' : 'none'; });
}

// Mismo contrato de carrito compartido que /servicios/checkout (Step 4 de
// new-business/page.tsx: flbc_svc_cart/bundles/bundle_added/bundle_claimed).
// Sin fetch a /api/sunbiz: esta página ya no muestra el nombre de la empresa
// en pantalla, el Document ID de la URL se guarda tal cual y /servicios/checkout
// hace su propia búsqueda silenciosa al cargar (mismo mecanismo que ya usa
// /new-business/annual-report).
function vipGoToCheckout(docId){
  try {
    localStorage.setItem('flbc_svc_cart', JSON.stringify(['registered-agent','annual-report']));
    localStorage.setItem('flbc_svc_bundles', JSON.stringify(['bundle-compliance-ra-ar']));
    var claim = JSON.stringify({ 'bundle-compliance-ra-ar': ['registered-agent','annual-report'] });
    localStorage.setItem('flbc_svc_bundle_added', claim);
    localStorage.setItem('flbc_svc_bundle_claimed', claim);
    // Le dice a /servicios/checkout que este combo ya venía elegido de
    // antemano (link del email VIP) — así no vuelve a ofrecer el hub
    // "Cumplimiento anual" como si fuera una decisión pendiente.
    localStorage.setItem('flbc_svc_vip_source', '1');
    if (docId) {
      localStorage.setItem('flbc_svc_company', JSON.stringify({ documentId: docId }));
    }
  } catch (e) {}
  window.location.href = '/servicios/checkout';
}

(function(){
  var p = new URLSearchParams(window.location.search);
  var lang = p.get('lang') || localStorage.getItem('flbc_lang');
  var isEs = lang === 'es';
  if (isEs) vipSetLang('es');

  var id = p.get('id');
  vipGoToCheckout(id ? id.trim().toUpperCase() : null);
})();
</script>
`

  return <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
}
