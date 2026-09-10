import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VIP Compliance Package — Florida Business Formation Center',
  description:
    'Registered Agent + Annual Report Filing bundled together, renewed automatically every year. Stay compliant with the State of Florida without lifting a finger.',
  robots: { index: false, follow: false },
}

// Landing dedicado para el link único que va en el email de recordatorio de
// cumplimiento (2026-09-11) — inspirado en un email de un competidor (US
// Filing Services) que el founder recibió, pero NO copia su combo tal cual:
// solo Agente Registrado + Declaración Anual (los 2 servicios que ya son
// suscripción real en Stripe, ver lib/order-subscriptions.ts), sin inventar
// "ongoing compliance support" como servicio aparte — es la MISMA promesa que
// "we monitor & file your Annual Report every year", confirmada con el founder.
// Precio: reusa el combo bundle-compliance-ra-ar ya existente en el checkout
// ($178 = 10% off $99+$99) — a propósito, para no mostrar un precio distinto
// según la puerta de entrada del cliente.
export default function VipCompliancePage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-dark:#1D4ED8;--blue-light:#EFF6FF;--gold:#F59E0B;--green:#059669;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray300:#CBD5E1;--gray400:#94A3B8;--gray500:#64748B;--gray600:#475569;--gray800:#1E293B;}
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
/* PAGE */
.vip-page{max-width:640px;margin:0 auto;padding:56px 24px 80px;flex:1;width:100%}
.vip-badge{display:inline-block;background:var(--blue-light);color:var(--blue);font-size:.7rem;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px}
.vip-hero{text-align:center;margin-bottom:36px}
.vip-hero h1{font-size:clamp(1.7rem,4vw,2.3rem);color:var(--navy);font-weight:800;letter-spacing:-.5px;margin-bottom:14px}
.vip-hero p.lead{font-size:1.02rem;color:var(--gray600);line-height:1.65;max-width:540px;margin:0 auto}
.vip-company{display:none;font-size:.86rem;color:var(--blue);font-weight:700;margin-bottom:8px}
.vip-company.show{display:block}
/* Pricing card */
.vip-card{border:1.5px solid var(--blue);border-radius:16px;padding:32px 28px;box-shadow:0 8px 32px rgba(27,58,107,.10);position:relative}
.vip-card-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--blue);color:#fff;font-size:.68rem;font-weight:700;padding:4px 16px;border-radius:20px;white-space:nowrap;letter-spacing:.3px}
.vip-card-title{font-size:1.3rem;color:var(--navy);font-weight:800;text-align:center;margin-bottom:6px}
.vip-price-row{text-align:center;margin-bottom:22px}
.vip-price{font-family:var(--font-serif);font-size:2.4rem;color:var(--navy);font-weight:800}
.vip-price-suffix{font-size:.95rem;color:var(--gray500);font-weight:600}
.vip-state-fee{font-size:.78rem;color:var(--gray400);margin-top:4px}
.vip-items{list-style:none;display:flex;flex-direction:column;gap:14px;margin-bottom:26px;padding-top:20px;border-top:1px solid var(--gray100)}
.vip-items li{display:flex;align-items:flex-start;gap:10px;font-size:.92rem;color:var(--gray600);line-height:1.55}
.vip-items li .check{flex-shrink:0;width:20px;height:20px;border-radius:50%;background:var(--green);color:#fff;font-size:.72rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
.vip-items li strong{color:var(--navy)}
.vip-cta{display:block;width:100%;background:var(--blue);color:#fff;border:none;padding:15px 24px;border-radius:10px;font-size:.98rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;text-align:center}
.vip-cta:hover{background:var(--blue-dark)}
.vip-cta-note{text-align:center;font-size:.76rem;color:var(--gray400);margin-top:10px}
/* How it works */
.vip-how{margin-top:48px}
.vip-how h2{font-size:1.15rem;color:var(--navy);font-weight:800;text-align:center;margin-bottom:24px}
.vip-steps{display:flex;flex-direction:column;gap:18px}
.vip-step{display:flex;gap:14px;align-items:flex-start}
.vip-step-num{flex-shrink:0;width:28px;height:28px;border-radius:50%;background:var(--blue-light);color:var(--blue);font-weight:800;font-size:.86rem;display:flex;align-items:center;justify-content:center}
.vip-step-text{font-size:.9rem;color:var(--gray600);line-height:1.6;padding-top:3px}
.vip-step-text strong{color:var(--navy)}
/* Alt path */
.vip-alt{margin-top:40px;text-align:center;padding-top:28px;border-top:1px solid var(--gray100)}
.vip-alt p{font-size:.86rem;color:var(--gray500);margin-bottom:10px}
.vip-alt a{font-size:.86rem;font-weight:700;color:var(--blue)}
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
@media(max-width:600px){.vip-page{padding:40px 18px 60px}.vip-card{padding:26px 20px}.header-links a:not(:last-child){display:none}}
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

<div class="vip-page">
  <div class="vip-hero">
    <div class="vip-company" id="vip-company"></div>
    <div class="vip-badge en-inline">Compliance Reminder</div><div class="vip-badge es-inline" style="display:none">Recordatorio de Cumplimiento</div>
    <h1 class="en">Keep your Florida business compliant — without thinking about it.</h1>
    <h1 class="es" style="display:none">Mantenga su negocio de Florida en cumplimiento — sin tener que pensarlo.</h1>
    <p class="lead en">Every Florida LLC and Corporation must file an Annual Report each year and maintain a Registered Agent. Our VIP Compliance Package handles both automatically, every year.</p>
    <p class="lead es" style="display:none">Toda LLC y Corporación de Florida debe presentar una Declaración Anual cada año y mantener un Agente Registrado. Nuestro Paquete VIP de Cumplimiento se encarga de ambos automáticamente, cada año.</p>
  </div>

  <div class="vip-card">
    <div class="vip-card-badge en-inline">VIP Compliance Package</div><div class="vip-card-badge es-inline" style="display:none">Paquete VIP de Cumplimiento</div>
    <div class="vip-card-title en">Registered Agent + Annual Report</div>
    <div class="vip-card-title es" style="display:none">Agente Registrado + Declaración Anual</div>
    <div class="vip-price-row">
      <span class="vip-price">$178</span><span class="vip-price-suffix en-inline">/year</span><span class="vip-price-suffix es-inline" style="display:none">/año</span>
      <div class="vip-state-fee en">+ $139 Florida state filing fee (paid to the state, not to us)</div>
      <div class="vip-state-fee es" style="display:none">+ $139 de tarifa estatal de Florida (se paga al estado, no a nosotros)</div>
    </div>
    <ul class="vip-items">
      <li><span class="check">&#10003;</span><span class="en"><strong>Registered Agent</strong> — an official Florida address for state &amp; legal correspondence, renewed automatically every year.</span><span class="es" style="display:none"><strong>Agente Registrado</strong> — una dirección oficial en Florida para correspondencia legal y estatal, renovada automáticamente cada año.</span></li>
      <li><span class="check">&#10003;</span><span class="en"><strong>Annual Report Filing</strong> — required every year to keep your entity active with the State of Florida, renewed automatically.</span><span class="es" style="display:none"><strong>Declaración Anual</strong> — requerida cada año para mantener su entidad activa ante el Estado de Florida, renovada automáticamente.</span></li>
      <li><span class="check">&#10003;</span><span class="en">We monitor your compliance and file your Annual Report every year, right on time.</span><span class="es" style="display:none">Nosotros monitoreamos y presentamos su Declaración Anual cada año, dentro del plazo correspondiente.</span></li>
    </ul>
    <button class="vip-cta" id="vip-cta" onclick="vipGoToCheckout()">
      <span class="en-inline">Get VIP Compliance Package &#8594;</span><span class="es-inline" style="display:none">Obtener Paquete VIP &#8594;</span>
    </button>
    <p class="vip-cta-note en">Cancel anytime. No long-term contract.</p>
    <p class="vip-cta-note es" style="display:none">Cancele cuando quiera. Sin contrato a largo plazo.</p>
  </div>

  <div class="vip-how">
    <h2 class="en">How it works</h2><h2 class="es" style="display:none">Cómo funciona</h2>
    <div class="vip-steps">
      <div class="vip-step">
        <div class="vip-step-num">1</div>
        <div class="vip-step-text en">Sign up today — takes about 2 minutes.</div>
        <div class="vip-step-text es" style="display:none">Regístrese hoy — toma unos 2 minutos.</div>
      </div>
      <div class="vip-step">
        <div class="vip-step-num">2</div>
        <div class="vip-step-text en">We become your <strong>Registered Agent</strong> and prepare your <strong>Annual Report</strong> every year before the deadline.</div>
        <div class="vip-step-text es" style="display:none">Nos convertimos en su <strong>Agente Registrado</strong> y preparamos su <strong>Declaración Anual</strong> cada año antes de la fecha límite.</div>
      </div>
      <div class="vip-step">
        <div class="vip-step-num">3</div>
        <div class="vip-step-text en">You get an email confirmation each time it's filed — nothing to remember, nothing to miss.</div>
        <div class="vip-step-text es" style="display:none">Recibe una confirmación por correo cada vez que se presenta — nada que recordar, nada que se le pase.</div>
      </div>
    </div>
  </div>

  <div class="vip-alt">
    <p class="en">Only need one of these, or something else entirely?</p>
    <p class="es" style="display:none">¿Solo necesita uno de estos, u otra cosa?</p>
    <a href="/servicios" class="en-inline">Browse all services &#8594;</a><a href="/servicios" class="es-inline" style="display:none">Ver todos los servicios &#8594;</a>
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
function vipSetLang(lang){
  var isEs = lang === 'es';
  document.querySelectorAll('.en').forEach(function(el){ el.style.display = isEs ? 'none' : 'block'; });
  document.querySelectorAll('.es').forEach(function(el){ el.style.display = isEs ? 'block' : 'none'; });
  document.querySelectorAll('.en-inline').forEach(function(el){ el.style.display = isEs ? 'none' : 'inline'; });
  document.querySelectorAll('.es-inline').forEach(function(el){ el.style.display = isEs ? 'inline' : 'none'; });
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){
    el.innerHTML = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });
}

// Precarga el combo Agente Registrado + Declaración Anual en el carrito
// compartido (mismo contrato que /servicios/checkout y el Step 4 de
// new-business/page.tsx: flbc_svc_cart/bundles/bundle_added/bundle_claimed)
// y, si el link trajo un Document ID válido, precarga también la empresa
// (flbc_svc_company) para que el checkout autocomplete el paso "Su empresa".
function vipGoToCheckout(){
  try {
    localStorage.setItem('flbc_svc_cart', JSON.stringify(['registered-agent','annual-report']));
    localStorage.setItem('flbc_svc_bundles', JSON.stringify(['bundle-compliance-ra-ar']));
    var claim = JSON.stringify({ 'bundle-compliance-ra-ar': ['registered-agent','annual-report'] });
    localStorage.setItem('flbc_svc_bundle_added', claim);
    localStorage.setItem('flbc_svc_bundle_claimed', claim);
    if (window.__vipDocId) {
      localStorage.setItem('flbc_svc_company', JSON.stringify({ documentId: window.__vipDocId }));
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
  if (id) {
    fetch('/api/sunbiz?document_id=' + encodeURIComponent(id.trim()))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.company && data.company.company_name) {
          window.__vipDocId = id.trim().toUpperCase();
          var box = document.getElementById('vip-company');
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
