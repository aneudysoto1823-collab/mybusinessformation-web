// /servicios/checkout — Checkout à la carte de servicios (Fase 1).
//
// Lee el carrito (localStorage flbc_svc_cart) que se arma en /servicios.
// Paso 1: captura de datos (bloque común una vez + extras por servicio).
// Paso 2: review de la orden + Stripe Embedded Checkout al lado (paga sin salir).
// Al volver con ?paid=1 muestra la confirmación. El webhook (kind='services')
// marca la orden pagada y envía los emails.
//
// CSS-in-JS + script inline, mismo patrón que el resto de páginas marketing.

export const dynamic = 'force-dynamic'

import { SERVICE_FIELDS, SHARED_FIELDS } from '@/lib/service-fields'

export default function ServiciosCheckoutPage() {
  const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--green:#059669;--green-light:#ECFDF5;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray500:#64748B;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font-sans),'Plus Jakarta Sans',system-ui,sans-serif;color:var(--gray800);background:var(--gray50);line-height:1.6;min-height:100vh}
.co-header{background:#fff;border-bottom:1px solid var(--gray200);position:sticky;top:0;z-index:50}
.co-header-inner{max-width:880px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.co-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.co-logo-mark{width:36px;height:36px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem}
.co-logo-text{font-family:var(--font-serif),serif;font-size:1.15rem;font-weight:700}
.co-logo-text .o{color:var(--navy)}.co-logo-text .b{color:var(--blue)}
.co-back{font-size:.85rem;color:var(--gray500);text-decoration:none;font-weight:600}
.co-back:hover{color:var(--blue)}
.co-lang{display:flex;gap:2px;background:var(--gray100);border-radius:8px;padding:3px}
.co-lang button{border:none;background:none;padding:5px 11px;border-radius:6px;font-size:.78rem;font-weight:700;color:var(--gray500);cursor:pointer;font-family:inherit}
.co-lang button.active{background:#fff;color:var(--navy);box-shadow:0 1px 3px rgba(0,0,0,.1)}
.co-wrap{max-width:880px;margin:0 auto;padding:30px 24px 80px}
.co-steps{display:flex;align-items:center;gap:10px;margin-bottom:24px;font-size:.82rem;color:var(--gray400);font-weight:600}
.co-step.active{color:var(--blue)}
.co-step-num{display:inline-flex;width:22px;height:22px;border-radius:50%;background:var(--gray200);color:var(--gray500);align-items:center;justify-content:center;font-size:.74rem;margin-right:6px}
.co-step.active .co-step-num{background:var(--blue);color:#fff}
.co-step-sep{flex:0 0 30px;height:2px;background:var(--gray200)}
.co-h1{font-family:var(--font-serif),serif;font-size:1.7rem;font-weight:700;color:var(--navy);margin-bottom:6px}
.co-sub{font-size:.92rem;color:var(--gray600);margin-bottom:24px}
.co-card{background:#fff;border:1px solid var(--gray200);border-radius:14px;padding:22px 24px;margin-bottom:18px}
.co-card-title{font-family:var(--font-serif),serif;font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:4px}
.co-card-svc{font-size:.72rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.6px;margin-bottom:16px}
.co-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.co-field{display:flex;flex-direction:column;gap:5px}
.co-field.full{grid-column:1/-1}
.co-label{font-size:.8rem;font-weight:600;color:var(--gray600)}
.co-label .req{color:#dc2626}
.co-input,.co-select,.co-textarea{border:1.5px solid var(--gray200);border-radius:9px;padding:11px 13px;font-size:.9rem;font-family:inherit;color:var(--gray800);background:#fff;width:100%}
.co-input:focus,.co-select:focus,.co-textarea:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.12)}
.co-textarea{resize:vertical;min-height:64px}
.co-rep-count{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:.82rem;font-weight:600;color:var(--gray600)}
.co-rep-count select{width:auto;min-width:64px;padding:7px 10px;font-size:.86rem}
.rep-host{display:flex;flex-direction:column;gap:8px}
.rep-row{display:flex;gap:8px;align-items:center}
.rep-row .rep-cell{flex:1;min-width:0;padding:9px 11px;font-size:.86rem}
.rep-del{flex:0 0 auto;width:30px;height:30px;border:1.5px solid var(--gray200);background:#fff;border-radius:7px;color:var(--gray400);font-size:1rem;cursor:pointer;line-height:1}
.rep-del:hover{background:#fee2e2;color:#dc2626;border-color:#fecaca}
.co-rep-add{align-self:flex-start;margin-top:8px;background:var(--blue-light);color:var(--blue);border:1.5px dashed var(--blue);padding:8px 16px;border-radius:8px;font-size:.82rem;font-weight:600;cursor:pointer;font-family:inherit}
.co-rep-add:hover{background:#dbeafe}
.co-hint{font-size:.72rem;color:var(--gray400)}
.co-status{font-size:.78rem;min-height:16px;margin-top:8px}
.co-lookup-row{display:flex;gap:10px;align-items:stretch}
.co-lookup-row .co-input{flex:1;font-size:1.05rem;letter-spacing:.5px}
.co-lookup-btn{background:var(--blue);color:#fff;border:none;padding:0 24px;border-radius:9px;font-size:.92rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:background .2s}
.co-lookup-btn:hover{background:#1d4ed8}.co-lookup-btn:disabled{opacity:.6;cursor:default}
.co-found{background:var(--green-light);border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin-top:12px}
.co-found-name{font-weight:700;color:var(--green-dark);font-size:.95rem}
.co-found-meta{font-size:.8rem;color:var(--gray600);margin-top:2px}
.co-edit-link{display:inline-block;margin-top:8px;background:none;border:none;color:var(--blue);font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;padding:0}
.co-edit-link:hover{text-decoration:underline}
.co-manual-link{display:inline-block;margin-top:12px;background:none;border:none;color:var(--gray500);font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;padding:0;text-decoration:underline}
.co-manual-link:hover{color:var(--navy)}
.co-err{color:#dc2626;font-size:.84rem;margin:10px 0 0;min-height:1px}
.co-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:8px}
.co-btn{background:var(--blue);color:#fff;border:none;padding:14px 26px;border-radius:11px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:inherit;min-height:48px;transition:background .2s}
.co-btn:hover{background:#1d4ed8}
.co-btn:disabled{opacity:.6;cursor:default}
.co-btn-ghost{background:none;color:var(--gray500);border:none;font-size:.86rem;font-weight:600;cursor:pointer;font-family:inherit}
.co-btn-ghost:hover{color:var(--navy)}
.co-pay-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:22px;align-items:start}
.co-review{background:#fff;border:1px solid var(--gray200);border-radius:14px;padding:22px 24px;position:sticky;top:90px}
.co-review-row{display:flex;justify-content:space-between;gap:10px;font-size:.86rem;padding:8px 0;border-bottom:1px solid var(--gray100);color:var(--gray600)}
.co-review-row span:last-child{font-weight:600;color:var(--gray800);white-space:nowrap}
.co-review-total{display:flex;justify-content:space-between;align-items:center;padding-top:14px;margin-top:6px;font-size:1rem;font-weight:700;color:var(--navy)}
.co-review-total strong{font-family:var(--font-serif),serif;font-size:1.5rem}
.co-embed{background:#fff;border:1px solid var(--gray200);border-radius:14px;padding:18px;min-height:380px}
.co-empty,.co-success{text-align:center;background:#fff;border:1px solid var(--gray200);border-radius:14px;padding:50px 28px;max-width:560px;margin:20px auto}
.co-success-icon{font-size:3rem;margin-bottom:10px}
.co-success h2{font-family:var(--font-serif),serif;font-size:1.6rem;color:var(--navy);margin-bottom:10px}
.co-success p{color:var(--gray600);margin-bottom:18px}
.co-success-num{display:inline-block;background:var(--blue-light);border:1px solid #bfdbfe;border-radius:10px;padding:12px 22px;margin-bottom:20px}
.co-success-num span{display:block;font-size:.7rem;color:var(--gray500);text-transform:uppercase;letter-spacing:.6px}
.co-success-num strong{font-family:var(--font-serif),serif;font-size:1.5rem;color:var(--blue);letter-spacing:.5px}
.co-spinner{display:inline-block;width:30px;height:30px;border:3px solid var(--gray200);border-top-color:var(--blue);border-radius:50%;animation:cospin .7s linear infinite}
@keyframes cospin{to{transform:rotate(360deg)}}
@media(max-width:760px){.co-grid{grid-template-columns:1fr}.co-pay-grid{grid-template-columns:1fr}.co-review{position:static}}
`

  const body = `
<header class="co-header">
  <div class="co-header-inner">
    <a href="/servicios" class="co-logo">
      <div class="co-logo-mark">OB</div>
      <div class="co-logo-text"><span class="o">Opa</span><span class="b">Biz</span></div>
    </a>
    <div style="display:flex;align-items:center;gap:14px">
      <a href="/servicios" class="co-back" data-en="&#8592; Back to services" data-es="&#8592; Volver a servicios">&#8592; Volver a servicios</a>
      <div class="co-lang">
        <button id="co-en" onclick="coSetLang('en')">EN</button>
        <button id="co-es" class="active" onclick="coSetLang('es')">ES</button>
      </div>
    </div>
  </div>
</header>

<div class="co-wrap">
  <div class="co-steps" id="co-steps">
    <span class="co-step active" id="co-step1"><span class="co-step-num">1</span><span data-en="Your details" data-es="Tus datos">Tus datos</span></span>
    <span class="co-step-sep"></span>
    <span class="co-step" id="co-step2"><span class="co-step-num">2</span><span data-en="Review &amp; pay" data-es="Revisar y pagar">Revisar y pagar</span></span>
  </div>

  <!-- EMPTY -->
  <div class="co-empty" id="co-empty" style="display:none">
    <div style="font-size:2.4rem;margin-bottom:8px">&#128722;</div>
    <h2 class="co-h1" data-en="Your order is empty" data-es="Tu pedido está vacío">Tu pedido está vacío</h2>
    <p class="co-sub" data-en="Add the services you need and come back here to complete your order." data-es="Agrega los servicios que necesitas y vuelve aquí para completar tu pedido.">Agrega los servicios que necesitas y vuelve aquí para completar tu pedido.</p>
    <a href="/servicios" class="co-btn" style="display:inline-block;text-decoration:none" data-en="Browse services" data-es="Ver servicios">Ver servicios</a>
  </div>

  <!-- STEP 1: INTAKE -->
  <div id="co-intake" style="display:none">
    <h1 class="co-h1" data-en="Complete your order" data-es="Completa tu pedido">Completa tu pedido</h1>
    <p class="co-sub" data-en="We need a few details to prepare your filings." data-es="Necesitamos algunos datos para preparar tus trámites.">Necesitamos algunos datos para preparar tus trámites.</p>

    <!-- Card 1: número de registro PRIMERO (oculto en modo formación) -->
    <div class="co-card" id="co-lookup-card">
      <div class="co-card-title" data-en="Start here: your company" data-es="Empieza aquí: tu empresa">Empieza aquí: tu empresa</div>
      <div class="co-lookup-row">
        <input class="co-input" id="f-flDoc" placeholder="L23000123456 / P23000012345"/>
        <button class="co-lookup-btn" id="co-lookup-btn" onclick="coLookupCompany()"><span data-en="Search" data-es="Buscar">Buscar</span></button>
      </div>
      <div class="co-status" id="f-flDoc-status"></div>
      <div class="co-found" id="co-company-found" style="display:none"></div>
      <button type="button" class="co-manual-link" id="co-manual-toggle" onclick="coToggleManual()" data-en="I don't have a number / new company — enter manually" data-es="No tengo número / empresa nueva — ingresar manualmente">No tengo número / empresa nueva — ingresar manualmente</button>
    </div>

    <!-- Card 2: datos de empresa (oculto hasta autollenar o entrada manual) -->
    <div class="co-card" id="co-company-card" style="display:none">
      <div class="co-card-title" id="co-company-title" data-en="Company details" data-es="Datos de la empresa">Datos de la empresa</div>
      <div class="co-grid">
        <div class="co-field" id="co-entity-field"><label class="co-label" data-en="Entity type" data-es="Tipo de entidad">Tipo de entidad</label><select class="co-select" id="f-entityType"><option value="llc">LLC</option><option value="corp" data-en="Corporation" data-es="Corporación">Corporación</option></select></div>
        <div class="co-field"><label class="co-label" id="co-name-label" data-en="Legal business name" data-es="Nombre legal del negocio">Nombre legal del negocio</label><input class="co-input" id="f-legalName"/></div>
        <div class="co-field" id="co-designator-field" style="display:none"><label class="co-label" data-en="Name ending" data-es="Terminación del nombre">Terminación del nombre</label><select class="co-select" id="f-designator"></select></div>
        <div class="co-field full"><label class="co-label" data-en="Business street address" data-es="Dirección del negocio">Dirección del negocio</label><input class="co-input" id="f-street"/></div>
        <div class="co-field"><label class="co-label" data-en="City" data-es="Ciudad">Ciudad</label><input class="co-input" id="f-city"/></div>
        <div class="co-field"><label class="co-label" data-en="ZIP" data-es="Código postal">Código postal</label><input class="co-input" id="f-zip"/></div>
      </div>
    </div>

    <!-- Card 3: tu información personal (siempre) -->
    <div class="co-card">
      <div class="co-card-title" data-en="Your information" data-es="Tu información">Tu información</div>
      <div class="co-card-svc" data-en="So we can contact you about your order" data-es="Para poder contactarte sobre tu pedido">Para poder contactarte sobre tu pedido</div>
      <div class="co-grid">
        <div class="co-field"><label class="co-label" data-en="First name" data-es="Nombre">Nombre</label><input class="co-input" id="f-firstName"/></div>
        <div class="co-field"><label class="co-label" data-en="Last name" data-es="Apellido">Apellido</label><input class="co-input" id="f-lastName"/></div>
        <div class="co-field"><label class="co-label" data-en="Email" data-es="Correo">Correo</label><input class="co-input" type="email" id="f-email"/></div>
        <div class="co-field"><label class="co-label" data-en="Phone / WhatsApp" data-es="Teléfono / WhatsApp">Teléfono / WhatsApp</label><input class="co-input" type="tel" id="f-phone"/></div>
        <div class="co-field full"><label class="co-label" data-en="Electronic signature (type your full legal name)" data-es="Firma electrónica (escribe tu nombre legal completo)">Firma electrónica (escribe tu nombre legal completo)</label><input class="co-input" id="f-signature"/></div>
      </div>
    </div>

    <div id="co-shared-section"></div>

    <div id="co-svc-sections"></div>

    <div class="co-err" id="co-intake-err"></div>
    <div class="co-actions">
      <a href="/servicios" class="co-btn-ghost" data-en="&#8592; Edit services" data-es="&#8592; Editar servicios">&#8592; Editar servicios</a>
      <button class="co-btn" id="co-to-pay" onclick="coGoToPayment()"><span data-en="Continue to payment" data-es="Continuar al pago">Continuar al pago</span> &#8594;</button>
    </div>
  </div>

  <!-- STEP 2: REVIEW + PAY -->
  <div id="co-pay" style="display:none">
    <h1 class="co-h1" data-en="Review &amp; pay" data-es="Revisar y pagar">Revisar y pagar</h1>
    <p class="co-sub" data-en="Confirm your order and pay securely. You won't leave this page." data-es="Confirma tu pedido y paga de forma segura. No saldrás de esta página.">Confirma tu pedido y paga de forma segura. No saldrás de esta página.</p>
    <div class="co-pay-grid">
      <div class="co-review">
        <div class="co-card-title" style="margin-bottom:12px" data-en="Order summary" data-es="Resumen del pedido">Resumen del pedido</div>
        <div id="co-review-lines"></div>
        <div class="co-review-total"><span data-en="Total" data-es="Total">Total</span><strong id="co-review-total">$0</strong></div>
        <button class="co-btn-ghost" style="margin-top:14px" onclick="coBackToIntake()" data-en="&#8592; Edit details" data-es="&#8592; Editar datos">&#8592; Editar datos</button>
      </div>
      <div class="co-embed" id="embedded-checkout"><div style="text-align:center;padding:60px 0"><div class="co-spinner"></div></div></div>
    </div>
  </div>

  <!-- SUCCESS -->
  <div class="co-success" id="co-success" style="display:none">
    <div class="co-success-icon">&#9989;</div>
    <h2 data-en="Order received" data-es="Orden recibida">Orden recibida</h2>
    <p data-en="Thank you! We received your payment. Our team will contact you within 1 business day with the next steps." data-es="¡Gracias! Recibimos tu pago. Nuestro equipo te contactará en 1 día hábil con los próximos pasos.">¡Gracias! Recibimos tu pago. Nuestro equipo te contactará en 1 día hábil con los próximos pasos.</p>
    <div class="co-success-num"><span data-en="Your order number" data-es="Tu número de orden">Tu número de orden</span><strong id="co-success-num">—</strong></div>
    <div><a href="/client-portal" class="co-btn" style="display:inline-block;text-decoration:none" data-en="Go to client portal" data-es="Ir al portal de clientes">Ir al portal de clientes</a></div>
  </div>
</div>

<script src="https://js.stripe.com/v3/"></script>
<script>window.__OPABIZ_PK__='${PK}';</script>
<script>
${scriptBody()}
</script>
`

  return <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
}

// El script del cliente vive en una función aparte para mantener el JSX legible.
function scriptBody() {
  return String.raw`
var coLang = 'es';
(function(){ try{ var p=new URLSearchParams(location.search); coLang = p.get('lang') || localStorage.getItem('flbc_lang') || 'es'; }catch(e){} })();

// Catálogo de extras por servicio (campos específicos, además del bloque común).
// type: text | tel | email | date | select | textarea. opts solo para select.
var SVC_EXTRAS = ${JSON.stringify(SERVICE_FIELDS)};
var SHARED_CFG = ${JSON.stringify(SHARED_FIELDS)};

var cart = [];
try { cart = JSON.parse(localStorage.getItem('flbc_svc_cart')||'[]'); if(!Array.isArray(cart)) cart=[]; } catch(e){ cart=[]; }
var stripeCheckout = null;

// Formación de empresa NUEVA: el checkout se adapta (no se busca empresa
// existente; se pide el nombre NUEVO + designador segun LLC/Corp).
var FORMATION_MAP = { 'llc-formation':'llc', 'corp-formation':'corp' };
var DESIGNATORS = { llc:['LLC','L.L.C.','Limited Liability Company'], corp:['Inc.','Corp.','Corporation','Incorporated'] };
function coFormationType(){ for(var i=0;i<cart.length;i++){ if(FORMATION_MAP[cart[i]]) return FORMATION_MAP[cart[i]]; } return null; }

function coIsEs(){ return coLang==='es'; }
function $(id){ return document.getElementById(id); }
function coShow(id){ ['co-empty','co-intake','co-pay','co-success'].forEach(function(s){ var el=$(s); if(el) el.style.display = (s===id?'':'none'); }); }

function coSetLang(l){
  coLang=l; try{ localStorage.setItem('flbc_lang',l); }catch(e){}
  $('co-en').classList.toggle('active', l==='en');
  $('co-es').classList.toggle('active', l==='es');
  var isEs=coIsEs();
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){ el.textContent = isEs?el.getAttribute('data-es'):el.getAttribute('data-en'); });
  // re-render dynamic service sections in the new language (preserve values)
  if($('co-intake').style.display!=='none'){ var vals=coCollectExtras(); var sh=coCollectShared(); renderSvcSections(); renderSharedSection(); restoreExtras(vals); restoreShared(sh); }
}

function repRowHtml(svcId, f){
  var isEs=coIsEs();
  var cells=(f.cols||[]).map(function(col){
    var lbl=isEs?col.es:col.en;
    if(col.type==='select'){ return '<select class="co-select rep-cell" data-col="'+col.k+'"><option value="">'+lbl+'</option>'+(col.opts||[]).map(function(o){return '<option>'+o+'</option>';}).join('')+'</select>'; }
    return '<input class="co-input rep-cell" data-col="'+col.k+'" placeholder="'+lbl+'"/>';
  }).join('');
  return '<div class="rep-row">'+cells+'<button type="button" class="rep-del" title="Quitar" onclick="coDelRepRow(this)">&#215;</button></div>';
}
// Repeaters manejados por un selector de cantidad: el cliente elige cuántas
// personas y se abren esas filas. El botón de borrar y el restore sincronizan
// el selector con el número real de filas.
function coRepField(svcId, fk){ var def=SVC_EXTRAS[svcId]; var f=null; if(def&&def.fields) def.fields.forEach(function(x){ if(x.k===fk) f=x; }); return f; }
function coSyncRepCount(host){
  if(!host) return; var sel=document.getElementById('repcount-'+host.getAttribute('data-svc')+'-'+host.getAttribute('data-fk'));
  if(sel){ var n=host.querySelectorAll('.rep-row').length; sel.value=String(n); }
}
function coSetRepCount(svcId, fk, n){
  var host=document.getElementById('rep-'+svcId+'-'+fk); var f=coRepField(svcId,fk); if(!host||!f) return;
  n=parseInt(n,10)||1; if(n<1) n=1;
  var rows=host.querySelectorAll('.rep-row').length;
  if(n>rows){ for(var i=rows;i<n;i++) host.insertAdjacentHTML('beforeend', repRowHtml(svcId,f)); }
  else if(n<rows){ for(var j=rows-1;j>=n;j--) host.children[j].remove(); }
}
function coDelRepRow(btn){
  var host=btn.closest('.rep-host'); btn.parentNode.remove(); if(!host) return;
  // siempre dejar al menos una fila
  if(!host.querySelector('.rep-row')){ var f=coRepField(host.getAttribute('data-svc'),host.getAttribute('data-fk')); if(f) host.insertAdjacentHTML('beforeend', repRowHtml(host.getAttribute('data-svc'),f)); }
  coSyncRepCount(host);
}
function fieldHtml(svcId, f){
  var isEs=coIsEs(); var lbl=isEs?f.es:f.en; var id='x-'+svcId+'-'+f.k;
  if(f.type==='repeater'){
    var cl=isEs?(f.countEs||'Cantidad'):(f.countEn||'How many');
    var opts=''; for(var n=1;n<=10;n++){ opts+='<option'+(n===1?' selected':'')+'>'+n+'</option>'; }
    return '<div class="co-field full"><label class="co-label">'+lbl+'</label>'
      +'<div class="co-rep-count"><span>'+cl+'</span><select class="co-select" id="repcount-'+svcId+'-'+f.k+'" onchange="coSetRepCount(\'' + svcId + '\',\'' + f.k + '\',this.value)">'+opts+'</select></div>'
      +'<div class="rep-host" id="rep-'+svcId+'-'+f.k+'" data-svc="'+svcId+'" data-fk="'+f.k+'">'+repRowHtml(svcId,f)+'</div></div>';
  }
  var full = (f.type==='textarea')?' full':'';
  var inner='';
  if(f.type==='select'){
    inner='<select class="co-select" id="'+id+'">'+f.opts.map(function(o){return '<option>'+o+'</option>';}).join('')+'</select>';
  } else if(f.type==='textarea'){
    inner='<textarea class="co-textarea" id="'+id+'"></textarea>';
  } else {
    inner='<input class="co-input" type="'+(f.type||'text')+'" id="'+id+'"/>';
  }
  return '<div class="co-field'+full+'"><label class="co-label">'+lbl+'</label>'+inner+'</div>';
}

function renderSvcSections(){
  var host=$('co-svc-sections'); if(!host) return;
  var isEs=coIsEs(); var html='';
  cart.forEach(function(svcId){
    var def=SVC_EXTRAS[svcId];
    var name = def ? (isEs?def.name_es:def.name_en) : svcId;
    html += '<div class="co-card"><div class="co-card-title">'+name+'</div>';
    if(def && def.fields && def.fields.length){
      var noteEn=(def.note_en!=null)?def.note_en:'Specific details for this service';
      var noteEs=(def.note_es!=null)?def.note_es:'Detalles específicos de este servicio';
      html += '<div class="co-card-svc" data-en="'+noteEn+'" data-es="'+noteEs+'">'+(isEs?noteEs:noteEn)+'</div>';
      html += '<div class="co-grid">'+def.fields.map(function(f){return fieldHtml(svcId,f);}).join('')+'</div>';
    } else {
      html += '<div class="co-card-svc">'+(isEs?'No requiere datos adicionales':'No extra details required')+'</div>';
    }
    html += '</div>';
  });
  host.innerHTML=html;
}

function sharedKeys(){
  var keys=[];
  cart.forEach(function(svcId){ var def=SVC_EXTRAS[svcId]; if(def&&def.shared) def.shared.forEach(function(k){ if(keys.indexOf(k)<0) keys.push(k); }); });
  return keys;
}
function renderSharedSection(){
  var host=$('co-shared-section'); if(!host) return;
  var isEs=coIsEs(); var keys=sharedKeys();
  if(!keys.length){ host.innerHTML=''; return; }
  var fields=keys.map(function(k){ var f=SHARED_CFG[k]; if(!f) return ''; var lbl=isEs?f.es:f.en;
    var inner;
    if(f.type==='select'){ inner='<select class="co-select" id="s-'+k+'">'+(f.opts||[]).map(function(o){return '<option>'+o+'</option>';}).join('')+'</select>'; }
    else { inner='<input class="co-input" type="'+(f.type||'text')+'" id="s-'+k+'"/>'; }
    return '<div class="co-field"><label class="co-label">'+lbl+'</label>'+inner+'</div>';
  }).join('');
  host.innerHTML='<div class="co-card"><div class="co-card-title">'+(isEs?'Datos requeridos':'Required details')+'</div>'
    +'<div class="co-grid">'+fields+'</div></div>';
}
function coCollectShared(){ var out={}; sharedKeys().forEach(function(k){ var el=$('s-'+k); if(el) out[k]=el.value; }); return out; }
function restoreShared(vals){ Object.keys(vals).forEach(function(k){ var el=$('s-'+k); if(el) el.value=vals[k]; }); }
function coCollectExtras(){
  var out={};
  cart.forEach(function(svcId){
    var def=SVC_EXTRAS[svcId]; if(!def||!def.fields) return;
    def.fields.forEach(function(f){
      if(f.type==='repeater'){
        var host=document.getElementById('rep-'+svcId+'-'+f.k); var rows=[];
        if(host){ host.querySelectorAll('.rep-row').forEach(function(r){
          var obj={}, any=false;
          r.querySelectorAll('.rep-cell').forEach(function(c){ obj[c.getAttribute('data-col')]=c.value; if(c.value) any=true; });
          if(any) rows.push(obj);
        }); }
        out[svcId+'.'+f.k]=JSON.stringify(rows);
      } else {
        var el=$('x-'+svcId+'-'+f.k); if(el) out[svcId+'.'+f.k]=el.value;
      }
    });
  });
  return out;
}
function restoreExtras(vals){
  Object.keys(vals).forEach(function(key){
    var parts=key.split('.'); var svcId=parts[0]; var fk=parts.slice(1).join('.');
    var def=SVC_EXTRAS[svcId]; var f=null; if(def&&def.fields) def.fields.forEach(function(x){ if(x.k===fk) f=x; });
    if(f && f.type==='repeater'){
      var host=document.getElementById('rep-'+svcId+'-'+fk); if(!host) return;
      var rows=[]; try{ rows=JSON.parse(vals[key]||'[]'); }catch(e){ rows=[]; }
      host.innerHTML='';
      if(!rows.length){ host.insertAdjacentHTML('beforeend', repRowHtml(svcId,f)); coSyncRepCount(host); return; }
      rows.forEach(function(row){
        host.insertAdjacentHTML('beforeend', repRowHtml(svcId,f));
        var rowEl=host.lastElementChild;
        rowEl.querySelectorAll('.rep-cell').forEach(function(c){ var k=c.getAttribute('data-col'); if(row[k]!=null) c.value=row[k]; });
      });
      coSyncRepCount(host);
    } else {
      var el=$('x-'+svcId+'-'+fk); if(el) el.value=vals[key];
    }
  });
}

function coRevealManual(){ $('co-company-card').style.display=''; var mt=$('co-manual-toggle'); if(mt) mt.style.display='none'; }
function coToggleManual(){ coRevealManual(); }
function coLookupCompany(){
  var doc=($('f-flDoc').value||'').trim().toUpperCase();
  var st=$('f-flDoc-status'); var isEs=coIsEs();
  if(doc.length<5){ if(st) st.innerHTML='<span style="color:#dc2626">'+(isEs?'Ingresa un número de registro válido.':'Enter a valid registration number.')+'</span>'; return; }
  if(st) st.innerHTML='<span style="color:#64748b">'+(isEs?'Buscando en Sunbiz...':'Searching Sunbiz...')+'</span>';
  var btn=$('co-lookup-btn'); if(btn) btn.disabled=true;
  fetch('/api/sunbiz/company?document_number='+encodeURIComponent(doc)).then(function(r){return r.json().then(function(d){return {ok:r.ok,status:r.status,d:d};});}).then(function(res){
    if(btn) btn.disabled=false;
    if(res.status===404||!res.d.company){
      if(st) st.innerHTML='<span style="color:#dc2626">'+(isEs?'No encontramos esa empresa. Ingresa los datos manualmente abajo.':'Company not found. Enter the details manually below.')+'</span>';
      coRevealManual(); return;
    }
    if(!res.ok){ if(st) st.innerHTML='<span style="color:#dc2626">'+((res.d&&res.d.error)||(isEs?'Error en la búsqueda.':'Lookup error.'))+'</span>'; return; }
    var c=res.d.company;
    // Autollenar campos OCULTOS (no se le piden al cliente — están en Turso)
    $('f-legalName').value=c.entity_name||'';
    $('f-entityType').value=(c.entity_type_normalized==='CORP'?'corp':'llc');
    $('f-street').value=c.principal_address||'';
    $('f-city').value=c.principal_city||'';
    $('f-zip').value=c.principal_zip||'';
    if(st) st.innerHTML='';
    var addr=[c.principal_address,c.principal_city,c.principal_state,c.principal_zip].filter(Boolean).join(', ');
    var found=$('co-company-found'); found.style.display='';
    found.innerHTML='<div class="co-found-name">&#10003; '+(c.entity_name||'')+'</div>'
      +'<div class="co-found-meta">'+[c.entity_type_normalized,c.status].filter(Boolean).join(' &middot; ')+'</div>'
      +(addr?'<div class="co-found-meta">'+addr+'</div>':'')
      +(c.registered_agent_name?'<div class="co-found-meta">'+(isEs?'Agente: ':'Agent: ')+c.registered_agent_name+'</div>':'')
      +'<button type="button" class="co-edit-link" onclick="coRevealManual()">'+(isEs?'Editar datos de la empresa':'Edit company details')+'</button>';
    var mt=$('co-manual-toggle'); if(mt) mt.style.display='none';
    $('co-company-card').style.display='none';
  }).catch(function(){ if(btn) btn.disabled=false; if(st) st.innerHTML='<span style="color:#dc2626">'+(isEs?'Error de conexión.':'Connection error.')+'</span>'; });
}

function coGetIntake(){
  var ft=coFormationType();
  var name=$('f-legalName').value.trim();
  var desig=(ft && $('f-designator')) ? $('f-designator').value : '';
  return {
    firstName:$('f-firstName').value.trim(), lastName:$('f-lastName').value.trim(),
    email:$('f-email').value.trim(), phone:$('f-phone').value.trim(),
    entityType:$('f-entityType').value,
    legalName:(ft && desig && name) ? (name+' '+desig) : name,
    formationType:ft||'', designator:desig,
    flDoc:$('f-flDoc').value.trim(), street:$('f-street').value.trim(),
    city:$('f-city').value.trim(), zip:$('f-zip').value.trim(),
    signature:$('f-signature').value.trim(), extras:coCollectExtras(), shared:coCollectShared()
  };
}

function coGoToPayment(){
  var isEs=coIsEs(); var err=$('co-intake-err'); err.textContent='';
  var intake=coGetIntake();
  if(intake.firstName.length<1||intake.lastName.length<1){ err.textContent=isEs?'Ingresa tu nombre y apellido.':'Please enter your first and last name.'; return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intake.email)){ err.textContent=isEs?'Ingresa un correo válido.':'Please enter a valid email.'; return; }
  if(intake.phone.replace(/[^0-9]/g,'').length<7){ err.textContent=isEs?'Ingresa un teléfono válido.':'Please enter a valid phone.'; return; }
  if(coFormationType()){
    if(($('f-legalName').value||'').trim().length<2){ err.textContent=isEs?'Escribe el nombre deseado de tu nueva empresa.':'Enter the desired name for your new company.'; return; }
  } else if(intake.legalName.length<2){ err.textContent=isEs?'Busca tu empresa por número de registro, o ingresa los datos manualmente.':'Search your company by registration number, or enter the details manually.'; coRevealManual(); return; }
  if(intake.signature.length<2){ err.textContent=isEs?'Escribe tu firma electrónica.':'Please type your electronic signature.'; return; }

  var btn=$('co-to-pay'); btn.disabled=true; var prev=btn.innerHTML; btn.innerHTML=isEs?'Creando pago...':'Creating payment...';
  fetch('/api/checkout/embedded-services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({services:cart,intake:intake,lang:coLang})})
    .then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d};});})
    .then(function(res){
      if(!res.ok||!res.d.clientSecret){ err.textContent=(res.d&&res.d.error)||(isEs?'No se pudo crear el pago.':'Could not create payment.'); btn.disabled=false; btn.innerHTML=prev; return; }
      try{ localStorage.setItem('flbc_svc_order', res.d.fbfc||''); }catch(e){}
      coRenderReview(res.d.lines, res.d.total);
      coShow('co-pay'); $('co-step1').classList.remove('active'); $('co-step2').classList.add('active');
      window.scrollTo(0,0);
      coMountStripe(res.d.clientSecret);
    })
    .catch(function(){ err.textContent=isEs?'Error de conexión. Intenta de nuevo.':'Connection error. Please try again.'; btn.disabled=false; btn.innerHTML=prev; });
}

function coRenderReview(lines, total){
  var host=$('co-review-lines'); if(!host) return;
  host.innerHTML=(lines||[]).map(function(l){ return '<div class="co-review-row"><span>'+l.label+'</span><span>$'+l.amount+'</span></div>'; }).join('');
  $('co-review-total').textContent='$'+(total||0);
}

function coMountStripe(clientSecret){
  var pk=window.__OPABIZ_PK__;
  if(!pk||typeof Stripe==='undefined'){ $('embedded-checkout').innerHTML='<p style="color:#dc2626;padding:20px">Stripe no está configurado.</p>'; return; }
  var stripe=Stripe(pk);
  stripe.initEmbeddedCheckout({clientSecret:clientSecret}).then(function(c){ stripeCheckout=c; $('embedded-checkout').innerHTML=''; c.mount('#embedded-checkout'); });
}

function coBackToIntake(){
  if(stripeCheckout){ try{ stripeCheckout.destroy(); }catch(e){} stripeCheckout=null; }
  $('embedded-checkout').innerHTML='<div style="text-align:center;padding:60px 0"><div class="co-spinner"></div></div>';
  coShow('co-intake'); $('co-step2').classList.remove('active'); $('co-step1').classList.add('active'); window.scrollTo(0,0);
}

// ── Init ──
// Modo formación: oculta el lookup de empresa existente y convierte el card de
// empresa en "tu nueva empresa" (nombre deseado + designador + tipo fijo).
function coApplyFormationMode(){
  var t=coFormationType(); if(!t) return;
  var isEs=coIsEs();
  var lk=$('co-lookup-card'); if(lk) lk.style.display='none';
  var cc=$('co-company-card'); if(cc) cc.style.display='';
  var et=$('f-entityType'); if(et) et.value=t;
  var ef=$('co-entity-field'); if(ef) ef.style.display='none';
  var title=$('co-company-title'); if(title){ title.setAttribute('data-en','Your new company'); title.setAttribute('data-es','Tu nueva empresa'); title.textContent=isEs?'Tu nueva empresa':'Your new company'; }
  var nl=$('co-name-label'); if(nl){ nl.setAttribute('data-en','Desired company name'); nl.setAttribute('data-es','Nombre deseado de la empresa'); nl.textContent=isEs?'Nombre deseado de la empresa':'Desired company name'; }
  var df=$('co-designator-field'), ds=$('f-designator');
  if(df&&ds){ df.style.display=''; ds.innerHTML=(DESIGNATORS[t]||[]).map(function(o){return '<option>'+o+'</option>';}).join(''); }
  var sub=document.querySelector('#co-intake .co-sub');
  if(sub){ var en='Enter your new company name and details to start the filing.'; var es='Ingresa el nombre y los datos de tu nueva empresa para iniciar el trámite.'; sub.setAttribute('data-en',en); sub.setAttribute('data-es',es); sub.textContent=isEs?es:en; }
}

(function init(){
  coSetLang(coLang);
  var paid=false; try{ paid=new URLSearchParams(location.search).get('paid')==='1'; }catch(e){}
  if(paid){
    var num=''; try{ num=localStorage.getItem('flbc_svc_order')||''; }catch(e){}
    $('co-success-num').textContent=num||'—';
    try{ localStorage.removeItem('flbc_svc_cart'); localStorage.removeItem('flbc_svc_order'); }catch(e){}
    $('co-steps').style.display='none';
    coShow('co-success'); return;
  }
  if(!cart.length){ $('co-steps').style.display='none'; coShow('co-empty'); return; }
  renderSvcSections();
  renderSharedSection();
  coApplyFormationMode();
  coShow('co-intake');
})();
`
}
