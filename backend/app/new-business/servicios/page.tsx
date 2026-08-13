import type { Metadata } from 'next'
import { SERVICES_CATALOG } from '@/lib/services-pricing'

export const metadata: Metadata = {
  title: 'Additional Services — Florida Business Formation Center',
  description: 'Compliance and business services for Florida companies: Registered Agent, EIN, Operating Agreement, Virtual Address, Annual Report and more.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://mybusinessformation.com/servicios' },
}

// Clon de /servicios re-marcado para mybusinessformation.com (separación de
// dominios 2026-08-13). A diferencia de /servicios/page.tsx (que mantiene su
// propio catálogo hardcodeado, deuda técnica preexistente que no se toca acá),
// esta página SÍ importa el catálogo real de lib/services-pricing.ts para no
// sumar una cuarta copia de los mismos datos. Excluye llc-formation/
// corp-formation a propósito — los paquetes de formación siguen siendo
// exclusivos de opabiz.com.
const EXCLUDED_IDS = new Set(['llc-formation', 'corp-formation'])

const services = Object.entries(SERVICES_CATALOG)
  .filter(([id]) => !EXCLUDED_IDS.has(id))
  .map(([id, def]) => ({
    id,
    nameEn: def.name_en,
    nameEs: def.name_es,
    descEn: def.desc_en,
    descEs: def.desc_es,
    price: def.serviceFee + def.stateFee,
    billing: def.billing ?? null,
  }))

export default function NewBusinessServiciosPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-sans);color:var(--gray800);background:var(--gray100);line-height:1.6;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3{font-family:var(--font-serif);line-height:1.2}
a{text-decoration:none;color:inherit}
.svc-header{background:#1B3A6B;padding:0 32px;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,.25)}
.svc-header-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:64px;gap:20px}
.svc-logo{display:flex;align-items:center;gap:11px}
.svc-logo-mark{width:42px;height:42px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:3px}
.svc-logo-mark img{width:100%;height:100%;object-fit:contain}
.svc-logo-text{font-family:var(--font-serif);font-size:1.02rem;font-weight:700;color:#fff;line-height:1.15}
.svc-header-right{display:flex;align-items:center;gap:14px}
.svc-back{color:rgba(255,255,255,.85);font-size:.82rem;font-weight:700;padding:6px 14px;border:1.5px solid rgba(255,255,255,.35);border-radius:6px;transition:all .15s}
.svc-back:hover{color:#fff;border-color:#fff}
.svc-lang{display:flex;background:rgba(255,255,255,.12);border-radius:20px;padding:3px;gap:2px}
.svc-lang button{padding:4px 13px;border-radius:16px;border:none;cursor:pointer;font-size:.72rem;font-weight:700;font-family:var(--font-sans);transition:all .15s;background:transparent;color:rgba(255,255,255,.65)}
.svc-lang button.active{background:#fff;color:#1B3A6B}
.svc-hero{background:#fff;padding:40px 32px 34px;text-align:center;border-bottom:1px solid var(--gray200)}
.svc-hero-inner{max-width:680px;margin:0 auto}
.svc-hero h1{font-size:clamp(1.4rem,3vw,1.9rem);color:var(--navy);margin-bottom:10px}
.svc-hero p{color:var(--gray600);font-size:.92rem;line-height:1.7}
.svc-grid-wrap{max-width:1200px;margin:0 auto;padding:36px 32px 120px;flex:1;width:100%}
.svc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.svc-card{background:#fff;border:1px solid var(--gray200);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:10px;transition:border-color .15s,box-shadow .15s}
.svc-card.sel{border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.12)}
.svc-card-name{font-family:var(--font-serif);font-weight:700;font-size:1.02rem;color:var(--navy)}
.svc-card-desc{font-size:.82rem;color:var(--gray600);line-height:1.6;flex:1}
.svc-card-bottom{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:4px}
.svc-card-price{font-weight:800;color:var(--navy);font-size:1.05rem}
.svc-card-price span{font-weight:500;font-size:.72rem;color:var(--gray400)}
.svc-add{background:#fff;color:var(--blue);border:1.5px solid var(--blue);border-radius:7px;padding:7px 16px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;min-height:36px}
.svc-add:hover{background:var(--blue-light)}
.svc-add.added{background:var(--blue);color:#fff}
.svc-bar{position:fixed;left:0;right:0;bottom:0;background:var(--navy);color:#fff;padding:14px 32px;display:none;align-items:center;justify-content:center;gap:24px;z-index:200;box-shadow:0 -4px 20px rgba(0,0,0,.2)}
.svc-bar.show{display:flex}
.svc-bar-count{font-size:.88rem;font-weight:600}
.svc-bar-total{font-weight:800;font-size:1.05rem}
.svc-bar-btn{background:var(--blue);color:#fff;border:none;border-radius:8px;padding:11px 26px;font-size:.88rem;font-weight:700;cursor:pointer;font-family:inherit;min-height:44px}
.svc-footer{background:var(--navy);color:rgba(255,255,255,.6);padding:20px 32px;font-size:.75rem;text-align:center;line-height:1.7}
.svc-footer a{color:rgba(255,255,255,.8);margin:0 6px}
.svc-footer a:hover{color:#fff}
.en{display:inline}.es{display:none}
@media(max-width:640px){.svc-header{padding:0 16px}.svc-hero{padding:28px 16px}.svc-grid-wrap{padding:24px 16px 130px}.svc-bar{padding:12px 16px;gap:14px;flex-wrap:wrap}}
`

  const cardsHtml = services.map(s => `
    <div class="svc-card" id="card-${s.id}" data-id="${s.id}">
      <div class="svc-card-name"><span class="en">${s.nameEn}</span><span class="es">${s.nameEs}</span></div>
      <div class="svc-card-desc"><span class="en">${s.descEn}</span><span class="es">${s.descEs}</span></div>
      <div class="svc-card-bottom">
        <div class="svc-card-price">$${s.price.toFixed(2)}${s.billing ? `<span> / ${s.billing === 'annual' ? '<span class="en">yr</span><span class="es">año</span>' : '<span class="en">mo</span><span class="es">mes</span>'}</span>` : ''}</div>
        <button class="svc-add" onclick="svcToggle('${s.id}')">
          <span class="en">Add</span><span class="es">Agregar</span>
        </button>
      </div>
    </div>`).join('')

  const body = `
<header class="svc-header">
  <div class="svc-header-inner">
    <a href="/" class="svc-logo">
      <div class="svc-logo-mark"><img src="/fbfc-seal.png" alt="Florida Business Formation Center"/></div>
      <div class="svc-logo-text">Florida Business<br/>Formation Center</div>
    </a>
    <div class="svc-header-right">
      <a href="/" class="svc-back"><span class="en">Home</span><span class="es">Inicio</span></a>
      <div class="svc-lang">
        <button class="active" onclick="svcSetLang('en')">EN</button>
        <button onclick="svcSetLang('es')">ES</button>
      </div>
    </div>
  </div>
</header>

<section class="svc-hero">
  <div class="svc-hero-inner">
    <h1><span class="en">Additional Services</span><span class="es">Servicios Adicionales</span></h1>
    <p>
      <span class="en">Keep your Florida business compliant and growing. Add any service below — you can select more than one.</span>
      <span class="es">Mantenga su negocio en Florida al día y en crecimiento. Agregue cualquier servicio a continuación — puede seleccionar más de uno.</span>
    </p>
  </div>
</section>

<div class="svc-grid-wrap">
  <div class="svc-grid">${cardsHtml}</div>
</div>

<div class="svc-bar" id="svc-bar">
  <div class="svc-bar-count"><span id="svc-bar-n">0</span> <span class="en">services selected</span><span class="es">servicios seleccionados</span></div>
  <div class="svc-bar-total">$<span id="svc-bar-total">0.00</span></div>
  <button class="svc-bar-btn" onclick="svcContinue()"><span class="en">Continue</span><span class="es">Continuar</span></button>
</div>

<footer class="svc-footer">
  <div>
    <a href="/terms"><span class="en">Terms &amp; Conditions</span><span class="es">Términos y Condiciones</span></a>
    <a href="/privacy"><span class="en">Privacy Policy</span><span class="es">Política de Privacidad</span></a>
    <a href="/legal"><span class="en">Legal Disclaimer</span><span class="es">Aviso Legal</span></a>
  </div>
  <div style="margin-top:8px">
    <span class="en">Florida Business Formation Center is a privately owned third-party document preparation service and is not affiliated with or endorsed by any government agency.</span>
    <span class="es">Florida Business Formation Center es un servicio privado de preparación de documentos de terceros y no está afiliado ni respaldado por ninguna agencia gubernamental.</span>
  </div>
</footer>

<script>
(function(){
  var PRICES = ${JSON.stringify(Object.fromEntries(services.map(s => [s.id, s.price])))};
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem('flbc_svc_cart') || '[]'); if (!Array.isArray(cart)) cart = []; } catch(e) { cart = []; }
  cart = cart.filter(function(id){ return PRICES.hasOwnProperty(id); });

  function persist(){ try { localStorage.setItem('flbc_svc_cart', JSON.stringify(cart)); } catch(e){} }

  function render(){
    var n = cart.length;
    var total = cart.reduce(function(sum, id){ return sum + (PRICES[id] || 0); }, 0);
    var bar = document.getElementById('svc-bar');
    if (bar) bar.className = 'svc-bar' + (n > 0 ? ' show' : '');
    var nEl = document.getElementById('svc-bar-n'); if (nEl) nEl.textContent = n;
    var tEl = document.getElementById('svc-bar-total'); if (tEl) tEl.textContent = total.toFixed(2);
    cart.forEach(function(id){
      var card = document.getElementById('card-' + id);
      if (card) card.classList.add('sel');
      var btn = card ? card.querySelector('.svc-add') : null;
      if (btn) btn.classList.add('added');
    });
  }

  window.svcToggle = function(id){
    var idx = cart.indexOf(id);
    var card = document.getElementById('card-' + id);
    var btn = card ? card.querySelector('.svc-add') : null;
    if (idx === -1) {
      cart.push(id);
      if (card) card.classList.add('sel');
      if (btn) btn.classList.add('added');
    } else {
      cart.splice(idx, 1);
      if (card) card.classList.remove('sel');
      if (btn) btn.classList.remove('added');
    }
    persist();
    render();
  };

  window.svcContinue = function(){
    if (cart.length === 0) return;
    persist();
    try { localStorage.removeItem('flbc_svc_bundles'); } catch(e){}
    window.location.href = '/servicios/checkout';
  };

  window.svcSetLang = function(lang){
    document.querySelectorAll('.en').forEach(function(el){ el.style.display = lang === 'en' ? '' : 'none'; });
    document.querySelectorAll('.es').forEach(function(el){ el.style.display = lang === 'es' ? '' : 'none'; });
    document.querySelectorAll('.svc-lang button').forEach(function(b, i){ b.className = (i === (lang === 'en' ? 0 : 1)) ? 'active' : ''; });
    try { localStorage.setItem('flbc_lang', lang); } catch(e){}
  };

  render();
  try {
    var savedLang = localStorage.getItem('flbc_lang');
    var params = new URLSearchParams(window.location.search);
    var urlLang = params.get('lang');
    var lang = urlLang === 'es' || urlLang === 'en' ? urlLang : (savedLang === 'es' ? 'es' : 'en');
    if (lang === 'es') window.svcSetLang('es');
  } catch(e) {}
})();
</script>
`

  return (
    <div>
      <style>{styles}</style>
      <main dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  )
}
