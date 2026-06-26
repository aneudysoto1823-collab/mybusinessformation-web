// /servicios/checkout — Checkout à la carte de servicios (wizard por pasos).
//
// Lee el carrito (localStorage flbc_svc_cart) que se arma en /servicios y guía al
// cliente por pasos (como los paquetes del home):
//   1. Tu empresa  — NUEVA (formación: nombre + designador) o EXISTENTE (busca # → Sunbiz)
//   2. Dueños y gestión — solo en formación (se piden UNA vez; no se duplican)
//   3. Datos requeridos — EIN/SSN compartidos (EIN NO se pide si es formación)
//   4. Tus servicios — campos únicos por servicio, máx. 2 servicios por paso
//   5. Tus datos — contacto + firma
//   6. Revisar y pagar — Stripe Embedded Checkout (sin salir de la página)
//
// Al volver con ?paid=1 muestra la confirmación. El webhook (kind='services')
// marca la orden pagada y envía los emails.
//
// CSS-in-JS + script inline, mismo patrón que el resto de páginas marketing.

export const dynamic = 'force-dynamic'

import { SERVICE_FIELDS, SHARED_FIELDS } from '@/lib/service-fields'
import { SERVICES_CATALOG } from '@/lib/services-pricing'

export default function ServiciosCheckoutPage() {
  const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray500:#64748B;--gray600:#475569;--gray800:#1E293B;}
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
.co-prog{margin-bottom:24px}
.co-prog-bar{height:6px;background:var(--gray200);border-radius:99px;overflow:hidden}
.co-prog-fill{height:100%;width:0;background:var(--blue);border-radius:99px;transition:width .3s}
.co-prog-label{font-size:.8rem;font-weight:700;color:var(--gray500);margin-top:9px}
.co-panel{min-height:380px}
.co-h1{font-family:var(--font-serif),serif;font-size:1.7rem;font-weight:700;color:var(--navy);margin-bottom:6px}
.co-sub{font-size:.92rem;color:var(--gray600);margin-bottom:22px}
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
.rep-block{position:relative;border:1px solid var(--gray200);border-radius:12px;padding:16px 16px 6px;background:var(--gray50)}
.rep-block .rep-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.rep-block .co-field{margin-bottom:10px}
.rep-block .co-field.full{grid-column:1/-1}
.rep-block-del{position:absolute;top:10px;right:10px;width:26px;height:26px}
.co-own-total{display:flex;justify-content:space-between;align-items:center;background:var(--gray50);border:1px solid var(--gray200);border-radius:9px;padding:10px 14px;margin-top:12px;font-size:.85rem;font-weight:600;color:var(--gray600)}
.co-tip{position:relative;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:var(--gray200);color:var(--gray600);font-size:.7rem;font-weight:700;cursor:help;margin-left:6px}
.co-tip .co-tip-box{visibility:hidden;opacity:0;position:absolute;bottom:135%;left:50%;transform:translateX(-50%);width:250px;background:var(--navy);color:#fff;font-size:.74rem;font-weight:400;line-height:1.5;padding:10px 12px;border-radius:8px;z-index:100;transition:opacity .15s;box-shadow:0 8px 24px rgba(0,0,0,.18)}
.co-tip:hover .co-tip-box{visibility:visible;opacity:1}
.co-up-card{display:flex;align-items:center;justify-content:space-between;gap:14px;border:1.5px solid var(--gray200);border-radius:12px;padding:16px 18px;margin-bottom:12px;background:#fff}
.co-up-left{display:flex;align-items:flex-start;gap:12px}
.co-up-icon{font-size:1.5rem;flex-shrink:0}
.co-up-name{font-size:.92rem;font-weight:700;color:var(--navy)}
.co-up-desc{font-size:.78rem;color:var(--gray600);margin-top:2px;line-height:1.5}
.co-up-why{font-size:.74rem;color:var(--green-dark);background:var(--green-light);border-radius:7px;padding:5px 9px;margin-top:7px;display:inline-block}
.co-up-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}
.co-up-price{font-size:.95rem;font-weight:800;color:var(--navy);font-family:var(--font-serif),serif}
.co-up-add{background:var(--green);color:#fff;border:none;padding:9px 16px;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
.co-up-add:hover{background:var(--green-dark)}
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
.co-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px}
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
/* Recomendado: cajas de elección (estilo paquetes) */
.co-choices{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0 0}
.co-choice{border:1.5px solid var(--gray200);border-radius:12px;padding:15px 16px;cursor:pointer;transition:all .2s;background:#fff;display:flex;flex-direction:column;gap:6px}
.co-choice:hover{border-color:#93c5fd}
.co-choice.sel{border-color:var(--blue);background:var(--blue-light)}
.co-choice-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.co-choice-title{font-size:.88rem;font-weight:700;color:var(--navy)}
.co-choice-price{font-size:.85rem;font-weight:800;color:var(--navy);font-family:var(--font-serif),serif;flex-shrink:0}
.co-choice-desc{font-size:.77rem;color:var(--gray600);line-height:1.5}
.co-up-incl{margin-top:10px;display:flex;flex-direction:column;gap:6px}
.co-up-incl-item{display:flex;align-items:flex-start;gap:7px;font-size:.78rem;color:var(--gray600);line-height:1.45}
.co-up-incl-check{color:var(--green);font-weight:700;flex-shrink:0}
.co-ra-form{margin-top:14px;border-top:1px dashed var(--gray200);padding-top:14px}
/* Layout con resumen de orden a la derecha (visible en cada paso) */
.co-layout{display:grid;grid-template-columns:1fr 300px;gap:24px;align-items:start}
.co-layout.solo{grid-template-columns:1fr}
.co-main{min-width:0}
.co-side{position:sticky;top:90px}
.co-side .co-review{position:static;top:auto}
.co-side-note{font-size:.7rem;color:var(--gray400);margin-top:12px;line-height:1.5}
@media(max-width:900px){.co-layout{grid-template-columns:1fr 260px}}
@media(max-width:760px){.co-grid{grid-template-columns:1fr}.co-pay-grid{grid-template-columns:1fr}.co-review{position:static}.co-choices{grid-template-columns:1fr}.co-layout{grid-template-columns:1fr}.co-side{position:static;order:-1;margin-bottom:18px}}
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
  <!-- PROGRESS -->
  <div class="co-prog" id="co-prog" style="display:none">
    <div class="co-prog-bar"><div class="co-prog-fill" id="co-prog-fill"></div></div>
    <div class="co-prog-label" id="co-prog-label"></div>
  </div>

  <!-- EMPTY -->
  <div class="co-empty" id="co-empty" style="display:none">
    <div style="font-size:2.4rem;margin-bottom:8px">&#128722;</div>
    <h2 class="co-h1" data-en="Your order is empty" data-es="Tu pedido está vacío">Tu pedido está vacío</h2>
    <p class="co-sub" data-en="Add the services you need and come back here to complete your order." data-es="Agrega los servicios que necesitas y vuelve aquí para completar tu pedido.">Agrega los servicios que necesitas y vuelve aquí para completar tu pedido.</p>
    <a href="/servicios" class="co-btn" style="display:inline-block;text-decoration:none" data-en="Browse services" data-es="Ver servicios">Ver servicios</a>
  </div>

  <!-- WIZARD -->
  <div id="co-wizard" style="display:none">
   <div class="co-layout" id="co-layout">
    <div class="co-main">

    <!-- STEP: COMPANY -->
    <div class="co-panel" id="panel-company" style="display:none">
      <h1 class="co-h1" data-en="Your company" data-es="Tu empresa">Tu empresa</h1>
      <p class="co-sub" id="co-company-sub" data-en="Find your company or enter it manually." data-es="Busca tu empresa o ingrésala manualmente.">Busca tu empresa o ingrésala manualmente.</p>

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

      <div class="co-card" id="co-company-card" style="display:none">
        <div class="co-card-title" id="co-company-title" data-en="Company details" data-es="Datos de la empresa">Datos de la empresa</div>
        <div class="co-grid">
          <div class="co-field" id="co-entity-field"><label class="co-label" data-en="Entity type" data-es="Tipo de entidad">Tipo de entidad</label><select class="co-select" id="f-entityType"><option value="llc">LLC</option><option value="corp" data-en="Corporation" data-es="Corporación">Corporación</option></select></div>
          <div class="co-field"><label class="co-label" id="co-name-label" data-en="Legal business name" data-es="Nombre legal del negocio">Nombre legal del negocio</label><input class="co-input" id="f-legalName"/></div>
          <div class="co-field" id="co-designator-field" style="display:none"><label class="co-label" data-en="Name ending" data-es="Terminación del nombre">Terminación del nombre</label><select class="co-select" id="f-designator"></select></div>
          <div class="co-field full"><label class="co-label" data-en="Country" data-es="País">País</label>
            <select class="co-select" id="f-country">
              <option value="United States" data-en="United States" data-es="Estados Unidos" selected>Estados Unidos</option>
              <option value="Mexico" data-en="Mexico" data-es="México">México</option>
              <option value="Argentina" data-en="Argentina" data-es="Argentina">Argentina</option>
              <option value="Brazil" data-en="Brazil" data-es="Brasil">Brasil</option>
              <option value="Chile" data-en="Chile" data-es="Chile">Chile</option>
              <option value="Colombia" data-en="Colombia" data-es="Colombia">Colombia</option>
              <option value="Costa Rica" data-en="Costa Rica" data-es="Costa Rica">Costa Rica</option>
              <option value="Cuba" data-en="Cuba" data-es="Cuba">Cuba</option>
              <option value="Dominican Republic" data-en="Dominican Republic" data-es="República Dominicana">República Dominicana</option>
              <option value="Ecuador" data-en="Ecuador" data-es="Ecuador">Ecuador</option>
              <option value="El Salvador" data-en="El Salvador" data-es="El Salvador">El Salvador</option>
              <option value="Spain" data-en="Spain" data-es="España">España</option>
              <option value="Guatemala" data-en="Guatemala" data-es="Guatemala">Guatemala</option>
              <option value="Honduras" data-en="Honduras" data-es="Honduras">Honduras</option>
              <option value="Nicaragua" data-en="Nicaragua" data-es="Nicaragua">Nicaragua</option>
              <option value="Panama" data-en="Panama" data-es="Panamá">Panamá</option>
              <option value="Paraguay" data-en="Paraguay" data-es="Paraguay">Paraguay</option>
              <option value="Peru" data-en="Peru" data-es="Perú">Perú</option>
              <option value="Puerto Rico" data-en="Puerto Rico" data-es="Puerto Rico">Puerto Rico</option>
              <option value="Uruguay" data-en="Uruguay" data-es="Uruguay">Uruguay</option>
              <option value="Venezuela" data-en="Venezuela" data-es="Venezuela">Venezuela</option>
              <option value="Canada" data-en="Canada" data-es="Canadá">Canadá</option>
              <option value="United Kingdom" data-en="United Kingdom" data-es="Reino Unido">Reino Unido</option>
              <option value="Other" data-en="Other" data-es="Otro">Otro</option>
            </select>
          </div>
          <div class="co-field full"><label class="co-label" data-en="Street address" data-es="Dirección (calle)">Dirección (calle)</label><input class="co-input" id="f-street"/></div>
          <div class="co-field"><label class="co-label" data-en="Apt / Suite (optional)" data-es="Apt / Suite (opcional)">Apt / Suite (opcional)</label><input class="co-input" id="f-apt"/></div>
          <div class="co-field"><label class="co-label" data-en="City" data-es="Ciudad">Ciudad</label><input class="co-input" id="f-city"/></div>
          <div class="co-field"><label class="co-label" data-en="State" data-es="Estado">Estado</label><input class="co-input" id="f-state"/></div>
          <div class="co-field"><label class="co-label" data-en="ZIP" data-es="Código postal">Código postal</label><input class="co-input" id="f-zip"/></div>
        </div>
        <div id="co-company-extra" style="margin-top:14px"></div>
      </div>
    </div>

    <!-- STEP: OWNERS (solo formación) -->
    <div class="co-panel" id="panel-owners" style="display:none">
      <h1 class="co-h1" data-en="Owners &amp; management" data-es="Dueños y gestión">Dueños y gestión</h1>
      <p class="co-sub" data-en="Who owns and runs the company. We only ask this once." data-es="Quién es dueño y maneja la empresa. Esto se pide una sola vez.">Quién es dueño y maneja la empresa. Esto se pide una sola vez.</p>
      <div class="co-card"><div id="co-owners-host"></div></div>
    </div>

    <!-- STEP: UPSELL (Registered Agent / Virtual Address) -->
    <div class="co-panel" id="panel-upsell" style="display:none"></div>

    <!-- STEPS: SERVICES (dinámico) -->
    <div id="co-svc-host"></div>

    <!-- STEP: CONTACT -->
    <div class="co-panel" id="panel-contact" style="display:none">
      <h1 class="co-h1" data-en="Your details" data-es="Tus datos">Tus datos</h1>
      <p class="co-sub" data-en="So we can contact you and authorize your filings." data-es="Para poder contactarte y autorizar tus trámites.">Para poder contactarte y autorizar tus trámites.</p>
      <div class="co-card">
        <div class="co-grid">
          <div class="co-field"><label class="co-label" data-en="First name" data-es="Nombre">Nombre</label><input class="co-input" id="f-firstName"/></div>
          <div class="co-field"><label class="co-label" data-en="Last name" data-es="Apellido">Apellido</label><input class="co-input" id="f-lastName"/></div>
          <div class="co-field"><label class="co-label" data-en="Email" data-es="Correo">Correo</label><input class="co-input" type="email" id="f-email"/></div>
          <div class="co-field"><label class="co-label" data-en="Phone / WhatsApp" data-es="Teléfono / WhatsApp">Teléfono / WhatsApp</label><input class="co-input" type="tel" id="f-phone"/></div>
          <div class="co-field full"><label class="co-label" data-en="Electronic signature (type your full legal name)" data-es="Firma electrónica (escribe tu nombre legal completo)">Firma electrónica (escribe tu nombre legal completo)</label><input class="co-input" id="f-signature"/></div>
        </div>
        <div id="co-contact-shared"></div>
      </div>
    </div>

    <!-- STEP: REVIEW + PAY -->
    <div class="co-panel" id="panel-pay" style="display:none">
      <h1 class="co-h1" data-en="Review &amp; pay" data-es="Revisar y pagar">Revisar y pagar</h1>
      <p class="co-sub" data-en="Confirm your order and pay securely. You won't leave this page." data-es="Confirma tu pedido y paga de forma segura. No saldrás de esta página.">Confirma tu pedido y paga de forma segura. No saldrás de esta página.</p>
      <div class="co-pay-grid">
        <div class="co-review">
          <div class="co-card-title" style="margin-bottom:12px" data-en="Order summary" data-es="Resumen del pedido">Resumen del pedido</div>
          <div id="co-review-lines"></div>
          <div class="co-review-total"><span data-en="Total" data-es="Total">Total</span><strong id="co-review-total">$0</strong></div>
        </div>
        <div class="co-embed" id="embedded-checkout"><div style="text-align:center;padding:60px 0"><div class="co-spinner"></div></div></div>
      </div>
    </div>

    <!-- NAV -->
    <div class="co-err" id="co-err"></div>
    <div class="co-actions" id="co-nav">
      <button class="co-btn-ghost" id="co-back" onclick="coBack()" style="display:none">&#8592; <span data-en="Back" data-es="Atrás">Atrás</span></button>
      <button class="co-btn" id="co-next" onclick="coNext()"><span data-en="Continue" data-es="Continuar">Continuar</span> &#8594;</button>
    </div>
    </div><!-- /co-main -->

    <!-- RESUMEN DE ORDEN (sidebar derecho, visible en cada paso) -->
    <aside class="co-side" id="co-side">
      <div class="co-review">
        <div class="co-card-title" style="margin-bottom:12px" data-en="Order summary" data-es="Resumen del pedido">Resumen del pedido</div>
        <div id="co-osum-body"></div>
        <div class="co-review-total"><span data-en="Total" data-es="Total">Total</span><strong id="co-osum-total">$0</strong></div>
        <div class="co-side-note" data-en="Estimate. Final taxes and state fees are confirmed at payment." data-es="Estimado. Los impuestos y tarifas estatales se confirman al pagar.">Estimado. Los impuestos y tarifas estatales se confirman al pagar.</div>
      </div>
    </aside>
   </div><!-- /co-layout -->
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

var SVC_EXTRAS = ${JSON.stringify(SERVICE_FIELDS)};
var SHARED_CFG = ${JSON.stringify(SHARED_FIELDS)};
var SVC_CATALOG = ${JSON.stringify(SERVICES_CATALOG)};

var cart = [];
try { cart = JSON.parse(localStorage.getItem('flbc_svc_cart')||'[]'); if(!Array.isArray(cart)) cart=[]; } catch(e){ cart=[]; }
var stripeCheckout = null;

// ── Formación de empresa NUEVA ──────────────────────────────────────────────
// Si el carrito trae un servicio de formación, el checkout se adapta: no hay
// lookup de empresa existente; se pide el nombre NUEVO + designador.
var FORMATION_MAP = { 'llc-formation':'llc', 'corp-formation':'corp' };
var DESIGNATORS = { llc:['LLC','L.L.C.','Limited Liability Company'], corp:['Inc.','Corp.','Corporation','Incorporated'] };
// Servicios que YA van con la formación: no se vuelven a pedir (se procesan junto).
var COVERED_IN_FORMATION = { 'ein':1, 'operating-agreement':1, 'registered-agent':1 };
// Campos que la formación ya captura (en los pasos Empresa/Dueños): se ocultan en
// los demás servicios para no duplicar.
var HIDE_KEYS_IN_FORMATION = { 'activity':1, 'mgmt':1, 'members':1, 'officers':1, 'raPref':1, 'shares':1, 'directors':1 };

var coFormId = null; // 'llc-formation' | 'corp-formation' | null
var coRaChoice = null; // 'ours' | 'own' | null — elección de Agente Registrado (paso Recomendado)
function coFormationType(){ for(var i=0;i<cart.length;i++){ if(FORMATION_MAP[cart[i]]) return FORMATION_MAP[cart[i]]; } return null; }

function coIsEs(){ return coLang==='es'; }
function $(id){ return document.getElementById(id); }
function coFieldDef(svcId, key){ var def=SVC_EXTRAS[svcId]; var out=null; if(def&&def.fields) def.fields.forEach(function(f){ if(f.k===key) out=f; }); return out; }

function coShowScreen(which){
  ['co-empty','co-wizard','co-success'].forEach(function(s){ var el=$(s); if(el) el.style.display=(s===which?'':'none'); });
  $('co-prog').style.display = (which==='co-wizard') ? '' : 'none';
}

function coTranslateStatic(){
  var isEs=coIsEs();
  $('co-en').classList.toggle('active', !isEs);
  $('co-es').classList.toggle('active', isEs);
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){ el.textContent = isEs?el.getAttribute('data-es'):el.getAttribute('data-en'); });
}

function coSetLang(l){
  coLang=l; try{ localStorage.setItem('flbc_lang',l); }catch(e){}
  coTranslateStatic();
  if($('co-wizard').style.display!=='none'){
    var ex=coCollectExtras(), sh=coCollectShared(), simple=coSnapSimple();
    coBuildWizard();
    coRestoreSimple(simple); restoreShared(sh); restoreExtras(ex); coOwnTotal();
    coGoStep(Math.min(coIdx, coSteps.length-1));
  }
}

// ── Repeaters (filas estructuradas con selector de cantidad) ────────────────
function repRowHtml(svcId, f){
  var isEs=coIsEs();
  // Bloque vertical con etiquetas (miembros/directores): nombre+apellido,
  // rol, %, dirección por partes. Cada input conserva .rep-cell[data-col] para
  // que el colector genérico lo lea igual.
  if(f.block){
    var fields=(f.cols||[]).map(function(col){
      var lbl=isEs?col.es:col.en;
      var pctHook=(col.k==='pct');
      var isFull=(col.full||col.k==='street');
      var ph=col.defaultFirst?'':('<option value="">'+lbl+'</option>');
      var inp = (col.type==='select')
        ? '<select class="co-select rep-cell" data-col="'+col.k+'"'+(pctHook?' onchange="coOwnTotal()"':'')+'>'+ph+(col.opts||[]).map(function(o){return '<option>'+o+'</option>';}).join('')+'</select>'
        : '<input class="co-input rep-cell" data-col="'+col.k+'"'+(pctHook?' oninput="coOwnTotal()"':'')+' placeholder="'+lbl+'"/>';
      return '<div class="co-field'+(isFull?' full':'')+'"><label class="co-label">'+lbl+'</label>'+inp+'</div>';
    }).join('');
    return '<div class="rep-row rep-block"><button type="button" class="rep-del rep-block-del" title="Quitar" onclick="coDelRepRow(this)">&#215;</button><div class="rep-grid">'+fields+'</div></div>';
  }
  var cells=(f.cols||[]).map(function(col){
    var lbl=isEs?col.es:col.en;
    if(col.type==='select'){ return '<select class="co-select rep-cell" data-col="'+col.k+'"><option value="">'+lbl+'</option>'+(col.opts||[]).map(function(o){return '<option>'+o+'</option>';}).join('')+'</select>'; }
    return '<input class="co-input rep-cell" data-col="'+col.k+'" placeholder="'+lbl+'"/>';
  }).join('');
  return '<div class="rep-row">'+cells+'<button type="button" class="rep-del" title="Quitar" onclick="coDelRepRow(this)">&#215;</button></div>';
}
// Suma de % de propiedad de los miembros (LLC). Verde si = 100%.
function coOwnTotal(){
  var t=$('co-own-total'); if(!t) return;
  var host=document.getElementById('rep-llc-formation-members'); var sum=0;
  if(host){ host.querySelectorAll('.rep-cell[data-col="pct"]').forEach(function(c){ var v=parseFloat(c.value); if(!isNaN(v)) sum+=v; }); }
  t.textContent=sum+'%';
  t.style.color=(sum===100)?'#16a34a':(sum>100?'#dc2626':'#64748b');
}
function coRepField(svcId, fk){ return coFieldDef(svcId, fk); }
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

// ── Campos visibles por servicio (aplica dedup en modo formación) ───────────
function coVisibleFields(svcId, ft){
  var def=SVC_EXTRAS[svcId]; if(!def||!def.fields) return [];
  if(!ft) return def.fields.slice();
  return def.fields.filter(function(f){ return !HIDE_KEYS_IN_FORMATION[f.k]; });
}
// Servicios que tendrán su propio paso (excluye la formación y los cubiertos).
function coServiceIds(ft){
  return cart.filter(function(id){
    if(FORMATION_MAP[id]) return false;            // formación va en Empresa/Dueños
    if(ft && COVERED_IN_FORMATION[id]) return false; // cubierto por la formación
    return coVisibleFields(id, ft).length>0;
  });
}
function coServiceCardHtml(svcId, ft){
  var def=SVC_EXTRAS[svcId]; var isEs=coIsEs();
  var name = def ? (isEs?def.name_es:def.name_en) : svcId;
  var fields = coVisibleFields(svcId, ft);
  var html='<div class="co-card"><div class="co-card-title">'+name+'</div>';
  if(fields.length){
    var noteEn=(def.note_en!=null)?def.note_en:'Specific details for this service';
    var noteEs=(def.note_es!=null)?def.note_es:'Detalles específicos de este servicio';
    html += '<div class="co-card-svc" data-en="'+noteEn+'" data-es="'+noteEs+'">'+(isEs?noteEs:noteEn)+'</div>';
    html += '<div class="co-grid">'+fields.map(function(f){return fieldHtml(svcId,f);}).join('')+'</div>';
  } else {
    html += '<div class="co-card-svc">'+(isEs?'No requiere datos adicionales':'No extra details required')+'</div>';
  }
  return html+'</div>';
}

// ── Campos compartidos (EIN/SSN) — EIN no se pide si es formación ───────────
function sharedKeys(){
  var keys=[];
  cart.forEach(function(svcId){ var def=SVC_EXTRAS[svcId]; if(def&&def.shared) def.shared.forEach(function(k){ if(keys.indexOf(k)<0) keys.push(k); }); });
  return keys;
}
function coSharedKeysActive(){
  var k=sharedKeys();
  if(coFormationType()) k=k.filter(function(x){ return x!=='ein'; });
  return k;
}
function coCollectShared(){ var out={}; coSharedKeysActive().forEach(function(k){ var el=$('s-'+k); if(el) out[k]=el.value; }); return out; }
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
    var f=coFieldDef(svcId, fk);
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
function coSnapSimple(){
  var ids=['f-flDoc','f-entityType','f-legalName','f-designator','f-street','f-apt','f-city','f-state','f-zip','f-country','f-firstName','f-lastName','f-email','f-phone','f-signature'];
  var o={}; ids.forEach(function(id){ var el=$(id); if(el) o[id]=el.value; }); return o;
}
function coRestoreSimple(o){ Object.keys(o).forEach(function(id){ var el=$(id); if(el) el.value=o[id]; }); }

// ── Lookup de empresa existente ─────────────────────────────────────────────
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
    $('f-legalName').value=c.entity_name||'';
    $('f-entityType').value=(c.entity_type_normalized==='CORP'?'corp':'llc');
    $('f-street').value=c.principal_address||'';
    $('f-city').value=c.principal_city||'';
    if($('f-state')) $('f-state').value=c.principal_state||'';
    $('f-zip').value=c.principal_zip||'';
    if($('f-country')) $('f-country').value='United States';
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
    apt:($('f-apt')?$('f-apt').value.trim():''), city:$('f-city').value.trim(),
    state:($('f-state')?$('f-state').value.trim():''), zip:$('f-zip').value.trim(),
    country:($('f-country')?$('f-country').value.trim():''),
    signature:$('f-signature').value.trim(), extras:coCollectExtras(), shared:coCollectShared()
  };
}

// ── Construcción del wizard (pasos según carrito + escenario) ───────────────
var coSteps=[];        // [{id, title:{en,es}}]
var coServicePages=[]; // [{id}]
var coIdx=0;

function coSetupCompanyPanel(ft){
  var isEs=coIsEs();
  var lk=$('co-lookup-card'), cc=$('co-company-card'), extra=$('co-company-extra');
  if(extra) extra.innerHTML='';
  if(ft){
    coFormId = (ft==='llc') ? 'llc-formation' : 'corp-formation';
    if(lk) lk.style.display='none';
    if(cc) cc.style.display='';
    var et=$('f-entityType'); if(et) et.value=ft;
    var ef=$('co-entity-field'); if(ef) ef.style.display='none';
    var title=$('co-company-title'); if(title){ title.setAttribute('data-en','Your new company'); title.setAttribute('data-es','Tu nueva empresa'); title.textContent=isEs?'Tu nueva empresa':'Your new company'; }
    var nl=$('co-name-label'); if(nl){ nl.setAttribute('data-en','Desired company name'); nl.setAttribute('data-es','Nombre deseado de la empresa'); nl.textContent=isEs?'Nombre deseado de la empresa':'Desired company name'; }
    var df=$('co-designator-field'), ds=$('f-designator');
    if(df&&ds){ df.style.display=''; ds.innerHTML=(DESIGNATORS[ft]||[]).map(function(o){return '<option>'+o+'</option>';}).join(''); }
    if(extra){ var ah=''; ['activity','activityDesc'].forEach(function(k){ var fd=coFieldDef(coFormId,k); if(fd) ah+=fieldHtml(coFormId,fd); }); if(ah) extra.innerHTML='<div class="co-grid">'+ah+'</div>'; }
    var sub=$('co-company-sub'); if(sub){ sub.setAttribute('data-en','Enter your new company name and details.'); sub.setAttribute('data-es','Ingresa el nombre y los datos de tu nueva empresa.'); sub.textContent=isEs?'Ingresa el nombre y los datos de tu nueva empresa.':'Enter your new company name and details.'; }
  } else {
    coFormId=null;
    if(lk) lk.style.display='';
    if(cc) cc.style.display='none';
    var ef2=$('co-entity-field'); if(ef2) ef2.style.display='';
    var df2=$('co-designator-field'); if(df2) df2.style.display='none';
    var sub2=$('co-company-sub'); if(sub2){ sub2.setAttribute('data-en','Find your company or enter it manually.'); sub2.setAttribute('data-es','Busca tu empresa o ingrésala manualmente.'); sub2.textContent=isEs?'Busca tu empresa o ingrésala manualmente.':'Find your company or enter it manually.'; }
  }
}
function coSetupOwnersPanel(ft){
  var host=$('co-owners-host'); if(!host) return; var isEs=coIsEs();
  if(ft==='llc'){
    var fm=coFieldDef('llc-formation','members');
    var h = fm ? fieldHtml('llc-formation',fm) : '';
    h += '<div class="co-own-total"><span data-en="Total ownership" data-es="Propiedad total">'+(isEs?'Propiedad total':'Total ownership')+'</span><strong id="co-own-total">0%</strong></div>';
    host.innerHTML=h;
    coOwnTotal();
  } else {
    var fs=coFieldDef('corp-formation','shares'); var fdd=coFieldDef('corp-formation','directors');
    var h2='';
    if(fs) h2+='<div class="co-grid">'+fieldHtml('corp-formation',fs)+'</div>';
    if(fdd) h2+=fieldHtml('corp-formation',fdd);
    host.innerHTML=h2;
  }
}
// Campos compartidos (SSN/ITIN, EIN) ahora viven en el paso "Tus datos" con un
// tooltip que explica para qué se necesitan (decisión 2026-06-25).
function coRenderContactShared(keys){
  var host=$('co-contact-shared'); if(!host) return; var isEs=coIsEs();
  if(!keys.length){ host.innerHTML=''; return; }
  var fields=keys.map(function(k){ var f=SHARED_CFG[k]; if(!f) return ''; var lbl=isEs?f.es:f.en;
    var tip=isEs?(f.tipEs||''):(f.tipEn||'');
    var tipHtml = tip ? ' <span class="co-tip">?<span class="co-tip-box">'+tip+'</span></span>' : '';
    var inner = (k==='ssnItin')
      ? '<input class="co-input" type="password" autocomplete="off" id="s-'+k+'"/>'
      : '<input class="co-input" type="text" id="s-'+k+'"/>';
    return '<div class="co-field full"><label class="co-label">'+lbl+tipHtml+'</label>'+inner+'</div>';
  }).join('');
  host.innerHTML='<div class="co-grid" style="margin-top:14px;border-top:1px solid var(--gray200);padding-top:16px">'+fields+'</div>';
}

// Tarjetas de upsell (Registered Agent / Virtual Address). Explican qué son, por
// qué conviene y QUÉ INCLUYEN (bullets, como en los paquetes) para que el cliente
// vea el valor real. En formación, el Agente Registrado se presenta como dos
// cajas (nuestro servicio +$99 / sé tu propio agente).
var UPSELL = {
  'registered-agent': { icon:'&#127963;', price:'$99',
    en:{name:'Registered Agent', desc:'Every Florida LLC & Corporation must have a Registered Agent with a physical FL address to receive legal & state documents.', why:'Keeps your home address private and off the public record.',
      incl:['Official FL street address for your business','Accepts service of process & legal documents','Change of Registered Agent filed with the state','Document forwarding & email notifications']},
    es:{name:'Agente Registrado', desc:'Toda LLC y Corporation de Florida debe tener un Agente Registrado con dirección física en FL para recibir documentos legales y del estado.', why:'Mantiene tu dirección personal privada y fuera del registro público.',
      incl:['Dirección oficial en FL para tu negocio','Acepta notificaciones y documentos legales','Cambio de Agente Registrado tramitado ante el estado','Reenvío de documentos y notificación por correo']} },
  'virtual-address': { icon:'&#128236;', price:'$99',
    en:{name:'Virtual Mailing Address', desc:'A professional Florida business address that receives and forwards your mail digitally.', why:'Use a real FL address without exposing your home address.',
      incl:['Professional FL mailing address','Mail receiving & digital forwarding','Home address stays private on public records','Available immediately after sign-up']},
    es:{name:'Dirección Virtual', desc:'Una dirección comercial profesional en Florida que recibe y reenvía tu correo digitalmente.', why:'Usa una dirección real en FL sin exponer la de tu casa.',
      incl:['Dirección postal profesional en Florida','Recepción de correo y reenvío digital','Tu dirección personal no aparece en registros públicos','Activo inmediatamente al inscribirte']} }
};
function coUpsellIds(){ return ['registered-agent','virtual-address'].filter(function(id){ return cart.indexOf(id)<0; }); }
// Tarjeta enriquecida (con bullets) + botón Agregar — para upsells opcionales.
function coUpsellCardHtml(id){
  var u=UPSELL[id]; if(!u) return ''; var isEs=coIsEs(); var t=isEs?u.es:u.en;
  var bullets=(t.incl||[]).map(function(b){ return '<div class="co-up-incl-item"><span class="co-up-incl-check">&#10003;</span><span>'+b+'</span></div>'; }).join('');
  return '<div class="co-up-card"><div class="co-up-left"><div class="co-up-icon">'+u.icon+'</div>'
    +'<div><div class="co-up-name">'+t.name+'</div><div class="co-up-desc">'+t.desc+'</div><div class="co-up-why">&#10003; '+t.why+'</div>'
    +'<div class="co-up-incl">'+bullets+'</div></div></div>'
    +'<div class="co-up-right"><div class="co-up-price">'+u.price+'</div><button class="co-up-add" onclick="coAddUpsell(\'' + id + '\')">'+(isEs?'Agregar':'Add')+'</button></div></div>';
}
// Agente Registrado en formación: dos cajas (nuestro servicio / propio agente).
function coRaChoiceCardHtml(){
  var isEs=coIsEs(); var u=UPSELL['registered-agent']; var t=isEs?u.es:u.en;
  var oursSel=(coRaChoice==='ours')||(coRaChoice==null && cart.indexOf('registered-agent')>=0);
  var ownSel=(coRaChoice==='own');
  var bullets=(t.incl||[]).map(function(b){ return '<div class="co-up-incl-item"><span class="co-up-incl-check">&#10003;</span><span>'+b+'</span></div>'; }).join('');
  var fid=coFormId;
  var oursDesc=isEs?'Actuamos como tu Agente Registrado oficial. Tu dirección personal se mantiene 100% privada.':'We act as your official Registered Agent. Your personal address stays completely private.';
  var ownDesc=isEs?'Tu dirección se registra públicamente en Florida y la ley exige que estés disponible de lunes a viernes de 9am a 5pm para recibir documentos legales.':'Your address is publicly registered with Florida and the law requires you to be available Mon-Fri 9am-5pm to receive legal documents.';
  return '<div class="co-card">'
    +'<div class="co-card-title">'+t.name+'</div>'
    +'<div class="co-card-svc">'+(isEs?'Requerido por ley en Florida':'Required by Florida law')+'</div>'
    +'<p class="co-up-desc" style="font-size:.82rem">'+t.desc+'</p>'
    +'<div class="co-up-incl">'+bullets+'</div>'
    +'<div class="co-choices">'
      +'<div class="co-choice'+(oursSel?' sel':'')+'" id="co-ra-ours" onclick="coSetRaChoice(\'ours\')">'
        +'<div class="co-choice-top"><span class="co-choice-title">&#127963; '+(isEs?'Usa nuestro servicio de Agente Registrado':'Use our Registered Agent service')+'</span><span class="co-choice-price">$99</span></div>'
        +'<div class="co-choice-desc">'+oursDesc+'</div></div>'
      +'<div class="co-choice'+(ownSel?' sel':'')+'" id="co-ra-own" onclick="coSetRaChoice(\'own\')">'
        +'<div class="co-choice-top"><span class="co-choice-title">&#128100; '+(isEs?'Seré mi propio Agente Registrado':'I will be my own Registered Agent')+'</span><span class="co-choice-price">$0</span></div>'
        +'<div class="co-choice-desc">'+ownDesc+'</div></div>'
    +'</div>'
    +'<input type="hidden" id="x-'+fid+'-raPref" value="'+(coRaChoice||'')+'"/>'
    +'<div class="co-ra-form" id="co-ra-own-form" style="display:'+(ownSel?'':'none')+'">'
      +'<div class="co-grid">'
        +'<div class="co-field"><label class="co-label">'+(isEs?'Nombre':'First name')+'</label><input class="co-input" id="x-'+fid+'-raFirstName"/></div>'
        +'<div class="co-field"><label class="co-label">'+(isEs?'Apellido':'Last name')+'</label><input class="co-input" id="x-'+fid+'-raLastName"/></div>'
        +'<div class="co-field full"><label class="co-label">'+(isEs?'Dirección en Florida (sin PO Box)':'Florida street address (no PO Box)')+'</label><input class="co-input" id="x-'+fid+'-raStreet"/></div>'
        +'<div class="co-field"><label class="co-label">'+(isEs?'Apt / Suite (opcional)':'Apt / Suite (optional)')+'</label><input class="co-input" id="x-'+fid+'-raApt"/></div>'
        +'<div class="co-field"><label class="co-label">'+(isEs?'Ciudad':'City')+'</label><input class="co-input" id="x-'+fid+'-raCity"/></div>'
        +'<div class="co-field"><label class="co-label">'+(isEs?'Código postal':'ZIP')+'</label><input class="co-input" id="x-'+fid+'-raZip"/></div>'
      +'</div></div>'
    +'</div>';
}
function coSetRaChoice(choice){
  coRaChoice=choice;
  var inCart=cart.indexOf('registered-agent')>=0;
  if(choice==='ours'&&!inCart){ cart.push('registered-agent'); }
  if(choice==='own'&&inCart){ cart.splice(cart.indexOf('registered-agent'),1); }
  try{ localStorage.setItem('flbc_svc_cart',JSON.stringify(cart)); }catch(e){}
  var bo=$('co-ra-ours'), bw=$('co-ra-own');
  if(bo) bo.classList.toggle('sel',choice==='ours');
  if(bw) bw.classList.toggle('sel',choice==='own');
  var form=$('co-ra-own-form'); if(form) form.style.display=(choice==='own')?'':'none';
  var prefEl=$('x-'+coFormId+'-raPref'); if(prefEl) prefEl.value=choice;
  coUpdateOrderSummary();
}
function coRenderUpsellPanel(ft){
  var panel=$('panel-upsell'); if(!panel) return; var isEs=coIsEs();
  var html='<h1 class="co-h1">'+(isEs?'Recomendado para ti':'Recommended for you')+'</h1>'
    +'<p class="co-sub">'+(isEs?'Servicios opcionales que la mayoría de negocios nuevos necesitan.':'Optional services that most new businesses need.')+'</p>';
  if(ft){
    if(coRaChoice==null && cart.indexOf('registered-agent')>=0) coRaChoice='ours';
    html += coRaChoiceCardHtml();
    if(cart.indexOf('virtual-address')<0) html += coUpsellCardHtml('virtual-address');
  } else {
    coUpsellIds().forEach(function(id){ html += coUpsellCardHtml(id); });
  }
  panel.innerHTML=html;
}
function coAddUpsell(id){
  if(cart.indexOf(id)<0){ cart.push(id); try{ localStorage.setItem('flbc_svc_cart',JSON.stringify(cart)); }catch(e){} }
  var ex=coCollectExtras(), sh=coCollectShared(), simple=coSnapSimple();
  coBuildWizard();
  coRestoreSimple(simple); restoreShared(sh); restoreExtras(ex); coOwnTotal();
  var idx=-1; coSteps.forEach(function(s,i){ if(s.id==='panel-upsell') idx=i; });
  if(idx<0) coSteps.forEach(function(s,i){ if(s.id==='panel-contact') idx=i; });
  coGoStep(idx<0?Math.min(coIdx,coSteps.length-1):idx);
}
// ── Resumen de orden persistente (sidebar derecho, visible en cada paso) ─────
// Espeja computeServicesTotal (services-pricing.ts) para mostrar el total en vivo.
// El cobro real siempre se recalcula server-side desde los IDs del carrito.
function coComputeTotal(){
  var lines=[], seen={}, total=0, isEs=coIsEs();
  cart.forEach(function(id){
    if(seen[id]) return; seen[id]=1; var s=SVC_CATALOG[id]; if(!s) return;
    var nm=isEs?s.name_es:s.name_en;
    lines.push({label:nm, amount:s.serviceFee}); total+=s.serviceFee;
    if(s.stateFee>0){ lines.push({label:nm+(isEs?' (Tarifa estatal FL)':' (Florida State Fee)'), amount:s.stateFee}); total+=s.stateFee; }
  });
  return {lines:lines, total:total};
}
function coUpdateOrderSummary(){
  var side=$('co-side'); if(!side) return; var isEs=coIsEs();
  // En el paso de pago el resumen completo va dentro del panel; ocultamos el
  // sidebar y la columna pasa a una sola.
  var onPay=(coSteps[coIdx]&&coSteps[coIdx].id==='panel-pay');
  side.style.display=onPay?'none':'';
  var layout=$('co-layout'); if(layout) layout.classList.toggle('solo',onPay);
  if(onPay) return;
  var r=coComputeTotal();
  var tot=$('co-osum-total'); if(tot) tot.textContent='$'+r.total;
  var body=$('co-osum-body'); if(body) body.innerHTML=r.lines.length
    ? r.lines.map(function(l){ return '<div class="co-review-row"><span>'+l.label+'</span><span>$'+l.amount+'</span></div>'; }).join('')
    : '<div class="co-review-row" style="border:none;color:#94a3b8">'+(isEs?'Aún sin servicios':'No services yet')+'</div>';
}
// "Peso" aproximado de un servicio = cuánto espacio ocupa (para empacar tantos
// como quepan por paso sin scroll, en vez de un número fijo). Un repeater pesa
// más; cada campo simple pesa 1; +1 base por el título/nota de la tarjeta.
function coServiceWeight(svcId, ft){
  var w=1.5;
  coVisibleFields(svcId, ft).forEach(function(f){ w += (f.type==='repeater' ? 3 : f.type==='textarea' ? 1.5 : 1); });
  return w;
}
function coRenderServicePages(ft){
  var ids=coServiceIds(ft); var host=$('co-svc-host'); host.innerHTML=''; coServicePages=[];
  var isEs=coIsEs();
  var BUDGET=12; // unidades de campo que caben cómodas por paso (≈ sin scroll)
  // Empaca servicios por tamaño: mete todos los que quepan en el presupuesto.
  var pages=[], cur=[], curW=0;
  ids.forEach(function(id){
    var w=coServiceWeight(id, ft);
    if(cur.length && curW + w > BUDGET){ pages.push(cur); cur=[]; curW=0; }
    cur.push(id); curW += w;
  });
  if(cur.length) pages.push(cur);
  pages.forEach(function(pageIds, idx){
    var pid='panel-svc-'+idx;
    var inner=pageIds.map(function(id){ return coServiceCardHtml(id, ft); }).join('');
    host.insertAdjacentHTML('beforeend','<div class="co-panel" id="'+pid+'" style="display:none"><h1 class="co-h1" data-en="Service details" data-es="Datos del servicio">'+(isEs?'Datos del servicio':'Service details')+'</h1>'+inner+'</div>');
    coServicePages.push({id:pid});
  });
}

function coBuildWizard(){
  var ft=coFormationType();
  // Formaciones mutuamente excluyentes: deja solo la primera en el carrito.
  if(ft){
    var keep=(ft==='llc')?'llc-formation':'corp-formation';
    var other=(ft==='llc')?'corp-formation':'llc-formation';
    var oi=cart.indexOf(other); if(oi>=0){ cart.splice(oi,1); try{ localStorage.setItem('flbc_svc_cart',JSON.stringify(cart)); }catch(e){} }
  }

  coSteps=[];
  coSteps.push({id:'panel-company', title:{en:'Your company',es:'Tu empresa'}});
  coSetupCompanyPanel(ft);

  if(ft){ coSteps.push({id:'panel-owners', title:{en:'Owners & management',es:'Dueños y gestión'}}); coSetupOwnersPanel(ft); }

  coRenderServicePages(ft);
  coServicePages.forEach(function(p){ coSteps.push({id:p.id, title:{en:'Service details',es:'Datos del servicio'}}); });

  // Recomendado: en formación, el Agente Registrado se decide aquí (dos cajas) +
  // Dirección Virtual opcional. Sin formación, upsells opcionales si no están en
  // el carrito. El paso se incluye si hay formación o algún upsell que ofrecer.
  coRenderUpsellPanel(ft);
  if(ft || coUpsellIds().length){ coSteps.push({id:'panel-upsell', title:{en:'Recommended',es:'Recomendado'}}); }

  // SSN/ITIN + EIN compartidos viven en el paso de contacto (con tooltip).
  coRenderContactShared(coSharedKeysActive());
  coSteps.push({id:'panel-contact', title:{en:'Your details',es:'Tus datos'}});
  coSteps.push({id:'panel-pay', title:{en:'Review & pay',es:'Revisar y pagar'}});
}

// ── Navegación ──────────────────────────────────────────────────────────────
function coRenderProgress(){
  var n=coSteps.length, isEs=coIsEs();
  $('co-prog-fill').style.width=Math.round(((coIdx+1)/n)*100)+'%';
  var t=coSteps[coIdx].title; var title=isEs?t.es:t.en;
  $('co-prog-label').textContent=(isEs?'Paso ':'Step ')+(coIdx+1)+(isEs?' de ':' of ')+n+' — '+title;
}
function coGoStep(i){
  if(i<0||i>=coSteps.length) return;
  coIdx=i;
  coSteps.forEach(function(s){ var el=$(s.id); if(el) el.style.display='none'; });
  var cur=$(coSteps[i].id); if(cur) cur.style.display='';
  coRenderProgress();
  $('co-back').style.display = (i===0) ? 'none' : '';
  var isPay = coSteps[i].id==='panel-pay';
  $('co-next').style.display = isPay ? 'none' : '';
  var nextIsPay = (i+1<coSteps.length) && coSteps[i+1].id==='panel-pay';
  var isEs=coIsEs();
  $('co-next').innerHTML='<span>'+(nextIsPay ? (isEs?'Ir al pago':'Go to payment') : (isEs?'Continuar':'Continue'))+'</span> &#8594;';
  $('co-err').textContent='';
  coUpdateOrderSummary();
  window.scrollTo(0,0);
}
function coDestroyStripe(){
  if(stripeCheckout){ try{ stripeCheckout.destroy(); }catch(e){} stripeCheckout=null; }
  var ec=$('embedded-checkout'); if(ec) ec.innerHTML='<div style="text-align:center;padding:60px 0"><div class="co-spinner"></div></div>';
}
function coBack(){ if(coSteps[coIdx].id==='panel-pay'){ coDestroyStripe(); } coGoStep(coIdx-1); }
function coNext(){
  if(!coValidateStep(coIdx)) return;
  var nextIsPay=(coIdx+1<coSteps.length)&&coSteps[coIdx+1].id==='panel-pay';
  if(nextIsPay){ coGoStep(coIdx+1); coStartPayment(); return; }
  coGoStep(coIdx+1);
}
function coValidateStep(i){
  var id=coSteps[i].id, isEs=coIsEs(), err=$('co-err'); err.textContent='';
  if(id==='panel-company'){
    var nm=($('f-legalName').value||'').trim();
    if(nm.length<2){
      if(coFormationType()){ err.textContent=isEs?'Escribe el nombre deseado de tu nueva empresa.':'Enter the desired name for your new company.'; }
      else { err.textContent=isEs?'Busca tu empresa por número, o ingrésala manualmente.':'Search your company, or enter it manually.'; coRevealManual(); }
      return false;
    }
    return true;
  }
  if(id==='panel-owners'){
    if(coFormationType()==='llc'){
      var host=document.getElementById('rep-llc-formation-members'); var sum=0;
      if(host){ host.querySelectorAll('.rep-cell[data-col="pct"]').forEach(function(c){ var v=parseFloat(c.value); if(!isNaN(v)) sum+=v; }); }
      if(Math.round(sum*100)/100!==100){
        err.textContent=isEs?('La propiedad total debe sumar 100%. Ahora suma '+sum+'%.'):('Total ownership must add up to 100%. It currently adds up to '+sum+'%.');
        return false;
      }
    }
    return true;
  }
  if(id==='panel-upsell'){
    if(coFormationType()){
      if(coRaChoice!=='ours'&&coRaChoice!=='own'){ err.textContent=isEs?'Elige una opción de Agente Registrado para continuar.':'Choose a Registered Agent option to continue.'; return false; }
      if(coRaChoice==='own'){
        var raF=(($('x-'+coFormId+'-raFirstName')||{}).value||'').trim();
        var raL=(($('x-'+coFormId+'-raLastName')||{}).value||'').trim();
        var raS=(($('x-'+coFormId+'-raStreet')||{}).value||'').trim();
        if(raF.length<1||raL.length<1||raS.length<3){ err.textContent=isEs?'Ingresa el nombre, apellido y dirección de tu agente registrado.':'Enter your registered agent first name, last name and address.'; return false; }
      }
    }
    return true;
  }
  if(id==='panel-contact'){
    if(($('f-firstName').value||'').trim().length<1||($('f-lastName').value||'').trim().length<1){ err.textContent=isEs?'Ingresa tu nombre y apellido.':'Enter your first and last name.'; return false; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(($('f-email').value||'').trim())){ err.textContent=isEs?'Ingresa un correo válido.':'Enter a valid email.'; return false; }
    if(($('f-phone').value||'').replace(/[^0-9]/g,'').length<7){ err.textContent=isEs?'Ingresa un teléfono válido.':'Enter a valid phone.'; return false; }
    if(($('f-signature').value||'').trim().length<2){ err.textContent=isEs?'Escribe tu firma electrónica.':'Type your electronic signature.'; return false; }
    return true;
  }
  return true;
}
// Ya estamos en el paso "Revisar y pagar": muestra el resumen al instante
// (nombres de servicios) y crea la sesión + monta Stripe en el box de la derecha.
function coStartPayment(){
  var isEs=coIsEs();
  coRenderReviewNames();
  var ec=$('embedded-checkout'); if(ec) ec.innerHTML='<div style="text-align:center;padding:60px 0"><div class="co-spinner"></div></div>';
  var intake=coGetIntake();
  fetch('/api/checkout/embedded-services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({services:cart,intake:intake,lang:coLang})})
    .then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d};});})
    .then(function(res){
      if(!res.ok||!res.d.clientSecret){
        if(ec) ec.innerHTML='<p style="color:#dc2626;padding:24px;font-size:.86rem;line-height:1.6">'+((res.d&&res.d.error)||(isEs?'No se pudo crear el pago. Revisa tus datos e intenta de nuevo.':'Could not create payment. Check your details and try again.'))+'</p>';
        return;
      }
      try{ localStorage.setItem('flbc_svc_order', res.d.fbfc||''); }catch(e){}
      coRenderReview(res.d.lines, res.d.total);
      coMountStripe(res.d.clientSecret);
    })
    .catch(function(){ if(ec) ec.innerHTML='<p style="color:#dc2626;padding:24px">'+(isEs?'Error de conexión. Intenta de nuevo.':'Connection error. Please try again.')+'</p>'; });
}
// Resumen inmediato con los nombres de los servicios (sin esperar al servidor).
function coRenderReviewNames(){
  var host=$('co-review-lines'); if(!host) return; var isEs=coIsEs();
  host.innerHTML=cart.map(function(id){ var d=SVC_EXTRAS[id]; var nm=d?(isEs?d.name_es:d.name_en):id; return '<div class="co-review-row"><span>'+nm+'</span><span></span></div>'; }).join('');
  var t=$('co-review-total'); if(t) t.textContent=isEs?'Calculando…':'Calculating…';
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

// ── Init ─────────────────────────────────────────────────────────────────────
(function init(){
  coTranslateStatic();
  var paid=false; try{ paid=new URLSearchParams(location.search).get('paid')==='1'; }catch(e){}
  if(paid){
    var num=''; try{ num=localStorage.getItem('flbc_svc_order')||''; }catch(e){}
    $('co-success-num').textContent=num||'—';
    try{ localStorage.removeItem('flbc_svc_cart'); localStorage.removeItem('flbc_svc_order'); }catch(e){}
    coShowScreen('co-success'); return;
  }
  if(!cart.length){ coShowScreen('co-empty'); return; }
  coBuildWizard();
  coShowScreen('co-wizard');
  coGoStep(0);
})();
`
}
