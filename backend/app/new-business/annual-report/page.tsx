import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'File Your Annual Report | Florida Business Formation Center',
  description: 'File this year\'s Florida Annual Report, a one-time filing with no subscription.',
  robots: { index: false, follow: false },
}

// Landing compañero de /vip (2026-09-11) — prefill del carrito compartido +
// redirect a /servicios (no directo a checkout, a diferencia de /vip: acá el
// cliente ve el resto del catálogo y puede sumar más antes de pagar). Para
// UNA sola presentación de la Declaración Anual en vez del combo con Agente
// Registrado. Es el link que usa la Opción 1 del email recordatorio de
// cumplimiento (lib/vip-reminder-email.ts), antes de ofrecer el upsell al
// VIP Compliance Package.
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
.ar-page{max-width:640px;margin:0 auto;padding:56px 24px 80px;flex:1;width:100%}
.ar-badge{display:inline-block;background:#ECFDF5;color:var(--green);font-size:.7rem;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px}
.ar-hero{text-align:center;margin-bottom:36px}
.ar-hero h1{font-size:clamp(1.7rem,4vw,2.3rem);color:var(--navy);font-weight:800;letter-spacing:-.5px;margin-bottom:14px}
.ar-hero p.lead{font-size:1.02rem;color:var(--gray600);line-height:1.65;max-width:540px;margin:0 auto}
.ar-company{display:none;font-size:.86rem;color:var(--green);font-weight:700;margin-bottom:8px}
.ar-company.show{display:block}
.ar-card{border:1.5px solid var(--green);border-radius:16px;padding:32px 28px;box-shadow:0 8px 32px rgba(27,58,107,.10);position:relative}
.ar-card-title{font-size:1.3rem;color:var(--navy);font-weight:800;text-align:center;margin-bottom:6px}
.ar-price-row{text-align:center;margin-bottom:22px}
.ar-price{font-family:var(--font-serif);font-size:2.4rem;color:var(--navy);font-weight:800}
.ar-price-suffix{font-size:.95rem;color:var(--gray500);font-weight:600}
.ar-state-fee{font-size:.78rem;color:var(--gray400);margin-top:4px}
.ar-items{list-style:none;display:flex;flex-direction:column;gap:14px;margin-bottom:26px;padding-top:20px;border-top:1px solid var(--gray100)}
.ar-items li{display:flex;align-items:flex-start;gap:10px;font-size:.92rem;color:var(--gray600);line-height:1.55}
.ar-items li .check{flex-shrink:0;width:20px;height:20px;border-radius:50%;background:var(--green);color:#fff;font-size:.72rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
.ar-items li strong{color:var(--navy)}
.ar-cta{display:block;width:100%;background:var(--green);color:#fff;border:none;padding:15px 24px;border-radius:10px;font-size:.98rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;text-align:center}
.ar-cta:hover{background:#047857}
.ar-cta-note{text-align:center;font-size:.76rem;color:var(--gray400);margin-top:10px}
.ar-alt{margin-top:40px;text-align:center;padding-top:28px;border-top:1px solid var(--gray100)}
.ar-alt p{font-size:.86rem;color:var(--gray500);margin-bottom:10px}
.ar-alt a{font-size:.86rem;font-weight:700;color:var(--blue)}
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
@media(max-width:600px){.ar-page{padding:40px 18px 60px}.ar-card{padding:26px 20px}.header-links a:not(:last-child){display:none}}
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
  <div class="ar-hero">
    <div class="ar-company" id="ar-company"></div>
    <div class="ar-badge en-inline">One-Time Filing</div><div class="ar-badge es-inline" style="display:none">Presentación Única</div>
    <h1 class="en">File this year's Annual Report.</h1>
    <h1 class="es" style="display:none">Presente su Declaración Anual de este año.</h1>
    <p class="lead en">Every Florida LLC and Corporation must file an Annual Report each year to stay active with the State. File it now as a one-time filing.</p>
    <p class="lead es" style="display:none">Toda LLC y Corporación de Florida debe presentar una Declaración Anual cada año para seguir activa ante el Estado. Preséntela ahora como un trámite único.</p>
  </div>

  <div class="ar-card">
    <div class="ar-card-title en">Annual Report Filing</div>
    <div class="ar-card-title es" style="display:none">Presentación de Declaración Anual</div>
    <div class="ar-price-row">
      <span class="ar-price">$99</span><span class="ar-price-suffix en-inline">/year</span><span class="ar-price-suffix es-inline" style="display:none">/año</span>
      <div class="ar-state-fee en">+ $139 Florida state filing fee (paid to the state, not to us)</div>
      <div class="ar-state-fee es" style="display:none">+ $139 de tarifa estatal de Florida (se paga al estado, no a nosotros)</div>
    </div>
    <ul class="ar-items">
      <li><span class="check">&#10003;</span><span class="en">Filed directly with the Florida Division of Corporations, on your behalf.</span><span class="es" style="display:none">Presentada directamente ante la División de Corporaciones de Florida, en su nombre.</span></li>
      <li><span class="check">&#10003;</span><span class="en">Keeps your entity active and in good standing for the year.</span><span class="es" style="display:none">Mantiene su entidad activa y en buen estado durante el año.</span></li>
      <li><span class="check">&#10003;</span><span class="en">Confirmation emailed to you once it's filed.</span><span class="es" style="display:none">Confirmación enviada por correo una vez presentada.</span></li>
    </ul>
    <button class="ar-cta" id="ar-cta" onclick="arGoToServices()">
      <span class="en-inline">File My Annual Report &#8594;</span><span class="es-inline" style="display:none">Presentar mi Declaración Anual &#8594;</span>
    </button>
    <p class="ar-cta-note en">Your information is pre-filled. Just review and confirm.</p>
    <p class="ar-cta-note es" style="display:none">Su información ya está pre-cargada. Solo revise y confirme.</p>
  </div>

  <div class="ar-alt">
    <p class="en">Want this handled automatically every year, plus a Registered Agent?</p>
    <p class="es" style="display:none">¿Prefiere que esto se maneje solo cada año, además de un Agente Registrado?</p>
    <a href="/vip" class="en-inline" id="ar-vip-link">Get the VIP Compliance Package &#8594;</a><a href="/vip" class="es-inline" id="ar-vip-link-es" style="display:none">Obtener el Paquete VIP de Cumplimiento &#8594;</a>
  </div>
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
// A diferencia de /vip (combo, va directo a pagar), esto manda al catálogo
// con Annual Report ya agregado en vez de saltar directo al checkout: el
// cliente ve el resto de los servicios y puede sumar más antes de pagar
// (decisión founder 2026-09-11 — la compra de un solo servicio es buena
// oportunidad para mostrar el catálogo, a diferencia del combo VIP que ya es
// una decisión tomada).
function arGoToServices(){
  try {
    localStorage.setItem('flbc_svc_cart', JSON.stringify(['annual-report']));
    localStorage.removeItem('flbc_svc_bundles');
    localStorage.removeItem('flbc_svc_bundle_added');
    localStorage.removeItem('flbc_svc_bundle_claimed');
    if (window.__arDocId) {
      localStorage.setItem('flbc_svc_company', JSON.stringify({ documentId: window.__arDocId }));
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
  if (id) {
    var vipLink = document.getElementById('ar-vip-link');
    var vipLinkEs = document.getElementById('ar-vip-link-es');
    var qs = '?id=' + encodeURIComponent(id.trim()) + (isEs ? '&lang=es' : '');
    if (vipLink) vipLink.setAttribute('href', '/vip' + qs);
    if (vipLinkEs) vipLinkEs.setAttribute('href', '/vip' + qs);

    fetch('/api/sunbiz?document_id=' + encodeURIComponent(id.trim()))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.company && data.company.company_name) {
          window.__arDocId = id.trim().toUpperCase();
          var box = document.getElementById('ar-company');
          box.textContent = (isEs ? 'Para ' : 'For ') + data.company.company_name;
          box.classList.add('show');
        }
      })
      .catch(function(){});
  }
})();
</script>
`

  return <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
}
