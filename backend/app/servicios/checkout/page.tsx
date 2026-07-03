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
import { SERVICES_CATALOG, SERVICE_BUNDLES, EXPEDITED_FEE } from '@/lib/services-pricing'

export default function ServiciosCheckoutPage() {
  const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray500:#64748B;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font-sans),'Plus Jakarta Sans',system-ui,sans-serif;color:var(--gray800);background:var(--gray50);line-height:1.6;min-height:100vh;overflow-x:clip}
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
.co-svc-intro{font-size:.84rem;color:var(--gray600);line-height:1.6;margin:-6px 0 16px}
.co-ra-info{background:var(--blue-light);border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;font-size:.82rem;color:#1e40af;line-height:1.6;margin-bottom:16px}
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
.co-pay-grid .co-review{position:static;top:auto}
.co-ir-sub{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--gray400);margin:16px 0 8px;padding-top:14px;border-top:1px solid var(--gray200)}
.co-ir-block{padding:10px 0;border-top:1px solid var(--gray100)}
.co-ir-block:first-of-type{border-top:none}
.co-ir-row{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.co-ir-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--gray400)}
.co-ir-edit{background:none;border:none;color:var(--blue);font-size:.76rem;font-weight:600;cursor:pointer;font-family:inherit;padding:0;white-space:nowrap}
.co-ir-val{font-size:.85rem;color:var(--gray700);line-height:1.5;margin-top:3px}
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
.co-choice{position:relative;border:1.5px solid var(--gray200);border-radius:12px;padding:15px 16px;cursor:pointer;transition:all .2s;background:#fff;display:flex;flex-direction:column;gap:6px}
.co-choice:hover{border-color:#93c5fd}
.co-choice.sel{border-color:var(--blue);background:var(--blue-light)}
.co-choice-rec{border-color:#bfdbfe}
.co-rec-badge{position:absolute;top:-9px;left:14px;background:var(--blue);color:#fff;font-size:.64rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:3px 9px;border-radius:20px}
.co-choice-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.co-choice-title{font-size:.88rem;font-weight:700;color:var(--navy)}
.co-choice-price{font-size:.85rem;font-weight:800;color:var(--navy);font-family:var(--font-serif),serif;flex-shrink:0}
.co-choice-desc{font-size:.77rem;color:var(--gray600);line-height:1.5}
.co-up-incl{margin-top:10px;display:flex;flex-direction:column;gap:6px}
.co-up-incl-item{display:flex;align-items:flex-start;gap:7px;font-size:.78rem;color:var(--gray600);line-height:1.45}
.co-up-incl-check{color:var(--green);font-weight:700;flex-shrink:0}
.co-ra-form{margin-top:14px;border-top:1px dashed var(--gray200);padding-top:14px}
.co-ra-same{display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;background:#fff;border:1.5px solid var(--gray200);border-radius:9px;margin-bottom:14px;font-size:.83rem;font-weight:600;color:var(--gray600)}
.co-ra-same input{width:17px;height:17px;cursor:pointer;accent-color:var(--blue)}
/* Hubs de upsell (3 tiers estilo LegalZoom) */
.co-tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:6px}
.co-tier{position:relative;border:1.5px solid var(--gray200);border-radius:14px;padding:18px 16px;background:#fff;display:flex;flex-direction:column}
.co-tier.best{border-color:var(--blue)}
.co-tier.sel{border-color:var(--blue);background:var(--blue-light);box-shadow:0 0 0 3px rgba(37,99,235,.12)}
.co-tier-badge{position:absolute;top:-10px;right:14px;background:var(--blue);color:#fff;font-size:.62rem;font-weight:800;letter-spacing:.5px;text-transform:uppercase;padding:3px 10px;border-radius:20px}
.co-tier-name{font-family:var(--font-serif),serif;font-size:1rem;font-weight:700;color:var(--navy);line-height:1.3;margin-bottom:6px;min-height:2.6em}
.co-tier-price{font-size:1.5rem;font-weight:800;color:var(--navy);font-family:var(--font-serif),serif}
.co-tier-save{font-size:.7rem;font-weight:700;color:var(--green-dark);background:var(--green-light);border-radius:6px;padding:2px 8px;display:inline-block;margin:6px 0 12px}
.co-tier-incl{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;flex:1}
.co-tier-svc{font-size:.76rem;font-weight:800;color:var(--navy);text-transform:uppercase;letter-spacing:.4px;margin-top:8px;padding-top:8px;border-top:1px solid var(--gray100)}
.co-tier-svc:first-child{margin-top:0;padding-top:0;border-top:none}
.co-tier-incl-item{display:flex;align-items:flex-start;gap:7px;font-size:.8rem;color:var(--gray600);line-height:1.45}
.co-tier-incl-check{color:var(--green);font-weight:700;flex-shrink:0}
.co-tier-btn{width:100%;background:#fff;color:var(--blue);border:1.5px solid var(--blue);border-radius:9px;padding:10px;font-size:.84rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;margin-top:auto}
.co-tier-btn:hover{background:var(--blue-light)}
.co-tier.sel .co-tier-btn{background:var(--blue);color:#fff}
.co-hub-nothanks{display:block;margin:18px auto 0;background:none;border:none;color:var(--gray500);font-size:.85rem;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:underline}
.co-hub-nothanks:hover{color:var(--navy)}
/* Layout con resumen de orden a la derecha (visible en cada paso) */
.co-layout{display:grid;grid-template-columns:1fr 300px;gap:24px;align-items:start}
.co-layout.solo{grid-template-columns:1fr}
.co-main,.co-side{min-width:0}
.co-side{position:sticky;top:90px}
.co-side .co-review{position:static;top:auto}
.co-side-note{font-size:.7rem;color:var(--gray400);margin-top:12px;line-height:1.5}
.co-sum-toggle{display:none;font-size:.9rem;color:var(--gray500);transition:transform .2s;line-height:1}
.co-ssn-wrap{position:relative}
.co-ssn-wrap .co-input{padding-right:64px}
.co-ssn-eye{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--blue);font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;padding:4px 6px}
.co-amd-opt{display:flex;align-items:center;gap:10px;cursor:pointer;padding:11px 14px;background:#fff;border:1.5px solid var(--gray200);border-radius:9px;margin-bottom:10px;font-size:.88rem;font-weight:600;color:var(--gray800)}
.co-amd-opt input{width:17px;height:17px;cursor:pointer;accent-color:var(--blue)}
.co-amd-sec{padding:0 2px 8px;margin:-2px 0 12px}
.co-pay-disclosure{font-size:.72rem;color:var(--gray500);margin-top:16px;padding-top:14px;border-top:1px solid var(--gray100);line-height:1.55}
.co-pay-disclosure a{color:var(--blue);text-decoration:underline}
.co-review-row.co-row-state{color:var(--gray400)}
.co-review-row.co-row-state span:last-child{color:var(--gray400);font-weight:500}
.co-review-row.co-row-state em{font-style:normal;font-size:.72rem;text-transform:uppercase;letter-spacing:.4px;color:var(--gray400)}
.co-state-note{font-size:.68rem;color:var(--gray400);margin-top:8px;line-height:1.5}
/* Modo ancho: en los hubs de tiers damos más espacio a las tarjetas */
html.co-wide .co-wrap,html.co-wide .co-header-inner{max-width:1340px}
html.co-wide .co-tier{padding:20px 18px}
@media(max-width:900px){.co-layout{grid-template-columns:1fr 260px}}
@media(max-width:760px){.co-grid{grid-template-columns:1fr}.co-pay-grid{grid-template-columns:1fr}.co-review{position:static}.co-choices{grid-template-columns:1fr}.co-tiers{grid-template-columns:1fr}.co-layout{grid-template-columns:1fr}.co-side{position:static;order:-1;margin-bottom:18px}.co-input,.co-select,.co-textarea{font-size:16px}
  .co-sum-head{display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer}
  .co-sum-toggle{display:block}
  .co-side:not(.co-sum-open) #co-osum-body,.co-side:not(.co-sum-open) .co-side-note{display:none}
  .co-side.co-sum-open .co-sum-toggle{transform:rotate(180deg)}}
@media(max-width:480px){.co-wrap{padding-left:16px;padding-right:16px}.co-header-inner{padding-left:16px;padding-right:16px}.co-review{padding-left:18px;padding-right:18px}.co-card{padding-left:16px;padding-right:16px}.co-h1{font-size:1.45rem}}
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
      <p class="co-sub" data-en="Who owns and runs the company." data-es="Quién es dueño y maneja la empresa.">Quién es dueño y maneja la empresa.</p>
      <div class="co-card"><div id="co-owners-host"></div></div>
    </div>

    <!-- STEP: REGISTERED AGENT (solo formación, tras Empresa) -->
    <div class="co-panel" id="panel-ra" style="display:none"></div>

    <!-- HUBS de upsell (3 tiers, estilo LegalZoom) -->
    <div class="co-panel" id="panel-hub-docs" style="display:none"></div>
    <div class="co-panel" id="panel-hub-compliance" style="display:none"></div>
    <div class="co-panel" id="panel-hub-protect" style="display:none"></div>

    <!-- STEP: DATOS FISCALES (SSN/ITIN) — condicional, según servicios elegidos -->
    <div class="co-panel" id="panel-tax" style="display:none"></div>

    <!-- STEP: PROCESAMIENTO ACELERADO (opcional, una vez por orden) -->
    <div class="co-panel" id="panel-expedited" style="display:none"></div>

    <!-- STEPS: SERVICES (dinámico) -->
    <div id="co-svc-host"></div>

    <!-- STEP: CONTACT (temprano, paso 2 — como el home) -->
    <div class="co-panel" id="panel-contact" style="display:none">
      <h1 class="co-h1" data-en="Personal information" data-es="Información personal">Información personal</h1>
      <div class="co-card">
        <div class="co-grid">
          <div class="co-field"><label class="co-label" data-en="First name" data-es="Nombre">Nombre</label><input class="co-input" id="f-firstName" oninput="coTitleCase(this)"/></div>
          <div class="co-field"><label class="co-label" data-en="Last name" data-es="Apellido">Apellido</label><input class="co-input" id="f-lastName" oninput="coTitleCase(this)"/></div>
          <div class="co-field"><label class="co-label" data-en="Email" data-es="Correo">Correo</label><input class="co-input" type="email" id="f-email"/></div>
          <div class="co-field"><label class="co-label" data-en="Phone / WhatsApp" data-es="Teléfono / WhatsApp">Teléfono / WhatsApp</label><input class="co-input" type="tel" id="f-phone"/></div>
        </div>
        <div class="co-card-title" style="margin-top:16px" data-en="Your address" data-es="Tu dirección">Tu dirección</div>
        <div class="co-grid">
          <div class="co-field full"><label class="co-label" data-en="Street address" data-es="Dirección (calle)">Dirección (calle)</label><input class="co-input" id="p-street"/></div>
          <div class="co-field"><label class="co-label" data-en="Apt / Suite (optional)" data-es="Apt / Suite (opcional)">Apt / Suite (opcional)</label><input class="co-input" id="p-apt"/></div>
          <div class="co-field"><label class="co-label" data-en="City" data-es="Ciudad">Ciudad</label><input class="co-input" id="p-city"/></div>
          <div class="co-field"><label class="co-label" data-en="State" data-es="Estado">Estado</label><select class="co-select" id="p-state"><option value="" data-en="Select..." data-es="Selecciona...">Selecciona...</option><option>AL</option><option>AK</option><option>AZ</option><option>AR</option><option>CA</option><option>CO</option><option>CT</option><option>DE</option><option>DC</option><option>FL</option><option>GA</option><option>HI</option><option>ID</option><option>IL</option><option>IN</option><option>IA</option><option>KS</option><option>KY</option><option>LA</option><option>ME</option><option>MD</option><option>MA</option><option>MI</option><option>MN</option><option>MS</option><option>MO</option><option>MT</option><option>NE</option><option>NV</option><option>NH</option><option>NJ</option><option>NM</option><option>NY</option><option>NC</option><option>ND</option><option>OH</option><option>OK</option><option>OR</option><option>PA</option><option>RI</option><option>SC</option><option>SD</option><option>TN</option><option>TX</option><option>UT</option><option>VT</option><option>VA</option><option>WA</option><option>WV</option><option>WI</option><option>WY</option></select></div>
          <div class="co-field"><label class="co-label" data-en="ZIP" data-es="Código postal">Código postal</label><input class="co-input" id="p-zip"/></div>
        </div>
      </div>
    </div>

    <!-- STEP: REVIEW + PAY -->
    <div class="co-panel" id="panel-pay" style="display:none">
      <h1 class="co-h1" data-en="Review your order" data-es="Revisa tu orden">Revisa tu orden</h1>
      <p class="co-sub" data-en="Confirm your order." data-es="Confirma tu pedido.">Confirma tu pedido.</p>
      <div class="co-pay-grid">
        <div class="co-review">
          <div class="co-card-title" style="margin-bottom:12px" data-en="Review order" data-es="Revisar orden">Revisar orden</div>
          <div id="co-review-intake"></div>
          <div class="co-ir-sub" data-en="Order summary" data-es="Resumen del pedido">Resumen del pedido</div>
          <div id="co-review-lines"></div>
          <div class="co-review-total"><span data-en="Total" data-es="Total">Total</span><strong id="co-review-total">$0</strong></div>
          <div class="co-pay-disclosure" id="co-pay-disclosure"></div>
        </div>
        <div class="co-embed" id="embedded-checkout"><div style="text-align:center;padding:60px 0"><div class="co-spinner"></div></div></div>
      </div>
    </div>

    <!-- NAV -->
    <div class="co-err" id="co-err"></div>
    <div class="co-actions" id="co-nav">
      <button class="co-btn-ghost" id="co-back" onclick="coBack()" style="display:none">&#8592; <span data-en="Back" data-es="Atrás">Atrás</span></button>
      <div style="display:flex;gap:12px;align-items:center">
        <button class="co-btn-ghost" id="co-review-return" onclick="coReturnToReview()" style="display:none;color:var(--blue)">&#8630; <span data-en="Back to review" data-es="Volver a revisar orden">Volver a revisar orden</span></button>
        <button class="co-btn" id="co-next" onclick="coNext()"><span data-en="Continue" data-es="Continuar">Continuar</span> &#8594;</button>
      </div>
    </div>
    </div><!-- /co-main -->

    <!-- RESUMEN DE ORDEN (sidebar derecho, visible en cada paso) -->
    <aside class="co-side" id="co-side">
      <div class="co-review">
        <div class="co-card-title co-sum-head" style="margin-bottom:12px" onclick="coToggleSummary()"><span data-en="Order summary" data-es="Resumen del pedido">Resumen del pedido</span><span class="co-sum-toggle" aria-hidden="true">&#9662;</span></div>
        <div id="co-osum-body"></div>
        <div class="co-review-total"><span data-en="Total" data-es="Total">Total</span><strong id="co-osum-total">$0</strong></div>
        <div class="co-side-note" id="co-side-note"></div>
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
var BUNDLES_CLIENT = ${JSON.stringify(SERVICE_BUNDLES)};
var EXPED_FEE = ${EXPEDITED_FEE};

var cart = [];
try { cart = JSON.parse(localStorage.getItem('flbc_svc_cart')||'[]'); if(!Array.isArray(cart)) cart=[]; } catch(e){ cart=[]; }
// Bundles (combos) elegidos en los hubs de 3 tiers. Persisten junto al carrito.
var coBundles = [];
try { coBundles = JSON.parse(localStorage.getItem('flbc_svc_bundles')||'[]'); if(!Array.isArray(coBundles)) coBundles=[]; } catch(e){ coBundles=[]; }
// Procesamiento acelerado (una vez por orden, aplica a toda la orden).
var coExpedited = true; // oferta pre-seleccionada (recomendado); el cliente puede declinar
try { var _rawExp=localStorage.getItem('flbc_svc_expedited'); coExpedited = (_rawExp===null ? true : _rawExp==='1'); } catch(e){ coExpedited=true; }
function coSaveCart(){ try{ localStorage.setItem('flbc_svc_cart',JSON.stringify(cart)); localStorage.setItem('flbc_svc_bundles',JSON.stringify(coBundles)); localStorage.setItem('flbc_svc_expedited',coExpedited?'1':'0'); }catch(e){} }
var stripeCheckout = null;
var coEditReturn = false; // true si el cliente entró a un paso vía "Editar" desde la revisión
var coPrefetch = null; // {key, promise} — sesión de Stripe pre-creada en el paso previo al pago

// ── Formación de empresa NUEVA ──────────────────────────────────────────────
// Si el carrito trae un servicio de formación, el checkout se adapta: no hay
// lookup de empresa existente; se pide el nombre NUEVO + designador.
var FORMATION_MAP = { 'llc-formation':'llc', 'corp-formation':'corp' };
var DESIGNATORS = { llc:['LLC','L.L.C.','Limited Liability Company'], corp:['Inc.','Corp.','Corporation','Incorporated'] };
// Servicios que YA van con la formación: no se vuelven a pedir (se procesan junto).
// El Agente Registrado se decide en su propio paso (panel-ra). EIN y Operating
// Agreement ya NO están "cubiertos por la formación" gratis: se venden como
// add-ons en el hub de Documentos esenciales, así que sí generan su paso de datos.
var COVERED_IN_FORMATION = { 'registered-agent':1 };
// Configuración de los hubs de upsell (tiers estilo LegalZoom). "protect" y
// "compliance" tienen configuración EFECTIVA distinta en formación vs à la
// carte — ver coProtectConfig() / coHubApplicable. Los tiers/services de acá
// abajo son el caso FORMACIÓN (y el default de "docs", igual en ambos casos).
var HUBS = {
  docs:    { panel:'panel-hub-docs',    services:['operating-agreement','ein','banking-resolution'], tiers:['bundle-docs-oa','bundle-docs-oa-ein','bundle-docs-full'],
             titleEs:'Documentos esenciales', titleEn:'Essential documents',
             subEs:'Ahorra tiempo y dinero en los documentos que tu negocio necesita.', subEn:'Save time and money on the documents your business needs.' },
  // Solo à la carte (sin formación) — en formación el agente ya se resuelve en
  // su propio paso obligatorio (panel-ra), así que este hub no aplica ahí.
  compliance: { panel:'panel-hub-compliance', services:['registered-agent','annual-report'], tiers:['bundle-compliance-ra','bundle-compliance-ra-ar'],
             titleEs:'Cumplimiento anual', titleEn:'Annual compliance',
             subEs:'Los dos requisitos recurrentes que toda LLC y Corporation de Florida debe mantener al día.', subEn:'The two recurring requirements every Florida LLC and Corporation must keep current.' },
  protect: { panel:'panel-hub-protect', services:['virtual-address','annual-report','business-tax-receipt'], tiers:['bundle-protect-va','bundle-protect-va-ar','bundle-protect-full'],
             titleEs:'Presencia y operación', titleEn:'Business presence & operations',
             subEs:'Mantén tu negocio protegido y al día con el estado.', subEn:'Keep your business protected and compliant with the state.' }
};
// À la carte (sin formación), Annual Report se ofrece en "compliance" junto al
// Agente Registrado — acá solo quedan Virtual Address + Business Tax Receipt
// para no repetir el mismo servicio en dos pasos. En formación no cambia nada.
function coProtectConfig(){
  if(coFormationType()) return { services:HUBS.protect.services, tiers:HUBS.protect.tiers };
  return { services:['virtual-address','business-tax-receipt'], tiers:['bundle-protect-va','bundle-protect-va-btr'] };
}
// A qué hub pertenece cada bundle (para limpiar/cambiar selección). Se registran
// a mano (no solo desde HUBS[h].tiers) porque bundle-protect-va-btr no está en
// la config de formación y los de compliance no están en HUBS.protect.
var BUNDLE_HUB = {}; Object.keys(HUBS).forEach(function(h){ HUBS[h].tiers.forEach(function(b){ BUNDLE_HUB[b]=h; }); });
BUNDLE_HUB['bundle-protect-va-btr']='protect';
// Detalle por servicio (varios bullets, estilo LegalZoom) para las tarjetas de
// tier. Cada servicio tiene nombre + lista de beneficios concretos.
var SVC_BLURBS = {
  'registered-agent': { nameEs:'Agente Registrado', nameEn:'Registered Agent',
    es:['Recibe documentos legales y avisos oficiales del estado en tu nombre','Tu dirección personal se mantiene 100% privada en registros públicos','Obligatorio por ley para toda LLC y Corporation de Florida'],
    en:['Receives legal documents and official state notices on your behalf','Your personal address stays 100% private on public records','Required by law for every Florida LLC and Corporation'] },
  'operating-agreement': { nameEs:'Acuerdo Operativo', nameEn:'Operating Agreement',
    es:['Define las reglas internas de tu LLC: cómo se maneja y cómo se toman las decisiones','Se vuelve un contrato vinculante entre socios para evitar disputas','Ayuda a proteger tus bienes manteniendo tu responsabilidad limitada'],
    en:['Defines your LLC internal rules: how it is run and how decisions are made','Becomes a binding contract among partners to avoid disputes','Helps protect your assets by maintaining limited liability'] },
  'ein':                 { nameEs:'EIN (Tax ID)', nameEn:'EIN (Tax ID)',
    es:['Número de identificación fiscal federal (el "SSN" de tu empresa)','Por ley lo necesita toda empresa con al menos un empleado o más de dos miembros','Requerido por los bancos para abrir cuenta de negocio'],
    en:['Federal tax ID number (like an SSN for your business)','Required by law for any business with at least one employee or more than two members','Required by banks to open a business account'] },
  'banking-resolution':  { nameEs:'Resolución Bancaria', nameEn:'Banking Resolution',
    es:['Autoriza formalmente quién puede manejar la cuenta bancaria del negocio','Documento que muchos bancos piden para abrir la cuenta','Da claridad legal sobre el control de los fondos'],
    en:['Formally authorizes who can manage the business bank account','Document many banks require to open the account','Gives legal clarity over who controls the funds'] },
  'virtual-address':     { nameEs:'Dirección Virtual', nameEn:'Virtual Mailing Address',
    es:['Dirección comercial profesional en Florida','Tu dirección personal se mantiene privada en registros públicos','Recibimos y reenviamos tu correo digitalmente'],
    en:['Professional Florida business address','Your home address stays private on public records','We receive and forward your mail digitally'] },
  'annual-report':       { nameEs:'Declaración Anual', nameEn:'Annual Report',
    es:['Obligatoria cada año para toda LLC y Corporation de FL','La preparamos y presentamos ante el estado por ti','Evita la multa de $400 por presentación tardía'],
    en:['Required every year for every FL LLC & Corporation','We prepare and file it with the state for you','Avoids the $400 late penalty'] },
  'business-tax-receipt':{ nameEs:'Licencia Comercial Local', nameEn:'Local Business Tax Receipt',
    es:['Licencia local para operar tu negocio legalmente','La tramitamos ante tu condado de Florida','Requisito en muchas ciudades para abrir al público'],
    en:['Local license to operate your business legally','We process it with your Florida county','Required in many cities to open to the public'] }
};
// Campos que la formación ya captura (en los pasos Empresa/Dueños): se ocultan en
// los demás servicios para no duplicar.
// En formación ya capturamos: condado (de la dirección de la empresa), tipo de
// negocio (actividad) y nº de empleados (card de la empresa). Por eso el Local
// Business Tax Receipt no pide nada extra y no genera paso aparte.
var HIDE_KEYS_IN_FORMATION = { 'activity':1, 'mgmt':1, 'members':1, 'officers':1, 'raPref':1, 'shares':1, 'directors':1, 'county':1, 'industry':1, 'employees':1 };

var coFormId = null; // 'llc-formation' | 'corp-formation' | null
var coRaChoice = null; // 'ours' | 'own' | null — elección de Agente Registrado (paso Recomendado)
function coFormationType(){ for(var i=0;i<cart.length;i++){ if(FORMATION_MAP[cart[i]]) return FORMATION_MAP[cart[i]]; } return null; }
// Espeja isExpeditedApplicable (lib/services-pricing.ts, autoritativa server-side).
// El acelerado solo aplica si algo en el carrito realmente se presenta ante el
// estado — una formación, o un servicio con stateFee>0 (ej. Annual Report, DBA).
// Comprar solo un Operating Agreement (documento privado) no tiene nada que
// acelerar, así que el paso ni se ofrece ni se cobra en ese caso.
function coExpeditedApplicable(){
  if(coFormationType()) return true;
  var bundledServices=[]; coBundles.forEach(function(bid){ var b=BUNDLES_CLIENT[bid]; if(b) bundledServices=bundledServices.concat(b.services); });
  return cart.concat(bundledServices).some(function(id){ var s=SVC_CATALOG[id]; return s && s.stateFee>0; });
}

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
  // Disclosure del pago: lleva enlaces, así que se setea como HTML (no textContent).
  var dz=$('co-pay-disclosure'); if(dz){
    var hasRec=false; try{ hasRec=coComputeTotal().recurring; }catch(e){}
    var recTxt=hasRec?(isEs
      ? ' Los servicios recurrentes (marcados /mes o /año) se renuevan automáticamente al precio vigente hasta que los canceles desde tu cuenta de cliente. El Agente Registrado es gratis el primer año al combinarlo con otro servicio; luego se renueva a $99/año.'
      : ' Recurring services (marked /mo or /yr) renew automatically at the then-current rate until you cancel from your client account. Registered Agent is free the first year when combined with another service; then renews at $99/yr.'):'';
    dz.innerHTML = (isEs
    ? 'Al completar tu pago autorizas a OpaBiz (Florida Business Formation Center) a preparar y presentar tus trámites en tu nombre, según nuestros <a href="/terms" target="_blank">Términos</a> y <a href="/privacy" target="_blank">Política de privacidad</a>. Las tarifas de servicio no son reembolsables una vez iniciado el trabajo.'
    : 'By completing your payment you authorize OpaBiz (Florida Business Formation Center) to prepare and file your filings on your behalf, per our <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a>. Service fees are non-refundable once work begins.') + recTxt; }
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
      var nameHook=(col.k==='firstName'||col.k==='lastName'||col.k==='name');
      var oninput=pctHook?' oninput="coOwnTotal()"':(nameHook?' oninput="coTitleCase(this);coMaybeFillOwnerAddr(this)"':'');
      var isFull=(col.full||col.k==='street');
      var ph=col.defaultFirst?'':('<option value="">'+lbl+'</option>');
      var inp = (col.type==='select')
        ? '<select class="co-select rep-cell" data-col="'+col.k+'"'+(pctHook?' onchange="coOwnTotal()"':'')+'>'+ph+(col.opts||[]).map(function(o){return '<option>'+o+'</option>';}).join('')+'</select>'
        : '<input class="co-input rep-cell" data-col="'+col.k+'"'+oninput+' placeholder="'+lbl+'"/>';
      return '<div class="co-field'+(isFull?' full':'')+'"><label class="co-label">'+lbl+'</label>'+inp+'</div>';
    }).join('');
    return '<div class="rep-row rep-block"><button type="button" class="rep-del rep-block-del" title="Quitar" onclick="coDelRepRow(this)">&#215;</button><div class="rep-grid">'+fields+'</div></div>';
  }
  var cells=(f.cols||[]).map(function(col){
    var lbl=isEs?col.es:col.en;
    var nameHook=(col.k==='firstName'||col.k==='lastName'||col.k==='name');
    if(col.type==='select'){ return '<select class="co-select rep-cell" data-col="'+col.k+'"><option value="">'+lbl+'</option>'+(col.opts||[]).map(function(o){return '<option>'+o+'</option>';}).join('')+'</select>'; }
    return '<input class="co-input rep-cell" data-col="'+col.k+'"'+(nameHook?' oninput="coTitleCase(this)"':'')+' placeholder="'+lbl+'"/>';
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
// Capitaliza la primera letra de cada palabra (campos de nombres). Conserva el caret.
function coTitleCase(el){
  if(!el) return; var s=el.selectionStart;
  el.value=el.value.replace(/(^|[\s\-'])([a-záéíóúñ])/g, function(m,p,c){ return p+c.toUpperCase(); });
  try{ el.setSelectionRange(s,s); }catch(e){}
}
// Paso Dueños: si el nombre del dueño coincide con el de "Información personal",
// autollena su dirección con la dirección personal capturada antes (sin pisar lo ya escrito).
function coMaybeFillOwnerAddr(el){
  var row=el.closest('.rep-row'); if(!row) return;
  var g=function(col){ return row.querySelector('.rep-cell[data-col="'+col+'"]'); };
  var fn=((g('firstName')||{}).value||'').trim().toLowerCase();
  var ln=((g('lastName')||{}).value||'').trim().toLowerCase();
  var cfn=(($('f-firstName')||{}).value||'').trim().toLowerCase();
  var cln=(($('f-lastName')||{}).value||'').trim().toLowerCase();
  if(!fn||!ln||fn!==cfn||ln!==cln) return;
  var set=function(col,src){ var c=g(col), s=$(src); if(c&&s&&!c.value) c.value=s.value||''; };
  set('street','p-street'); set('apt','p-apt'); set('city','p-city'); set('state','p-state'); set('zip','p-zip');
  var cc=g('country'); if(cc&&!cc.value) cc.value='United States';
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
// Campos que NO se preguntan en el checkout (se asumen por defecto). El año fiscal
// del Acuerdo Operativo se asume 31 de diciembre (lo estándar) y no se pregunta.
var CHECKOUT_HIDE_KEYS = { 'fiscalYear':1 };
function coVisibleFields(svcId, ft){
  var def=SVC_EXTRAS[svcId]; if(!def||!def.fields) return [];
  return def.fields.filter(function(f){
    if(CHECKOUT_HIDE_KEYS[f.k]) return false;
    if(ft && HIDE_KEYS_IN_FORMATION[f.k]) return false;
    // La Declaración Anual no vuelve a pedir dueños/oficiales si el Acuerdo Operativo
    // (o una formación) ya los captura — se reutilizan esos (que ya traen el cargo).
    if(svcId==='annual-report' && f.k==='officers' && (ft || cart.indexOf('operating-agreement')>=0)) return false;
    return true;
  });
}
// Servicios que tendrán su propio paso (excluye la formación y los cubiertos).
function coServiceIds(ft){
  return cart.filter(function(id){
    if(FORMATION_MAP[id]) return false;            // formación va en Empresa/Dueños
    if(ft && COVERED_IN_FORMATION[id]) return false; // cubierto por la formación
    return coVisibleFields(id, ft).length>0;
  });
}
// Opciones de estados de EE.UU. (reusable en direcciones à la medida).
function coStateOpts(){ return '<option value="">--</option>'+['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(function(s){return '<option>'+s+'</option>';}).join(''); }
function coServiceCardHtml(svcId, ft, hideTitle){
  if(svcId==='amendment') return coAmendmentHtml(hideTitle);
  var def=SVC_EXTRAS[svcId]; var isEs=coIsEs();
  var name = def ? (isEs?def.name_es:def.name_en) : svcId;
  var fields = coVisibleFields(svcId, ft);
  var html='<div class="co-card">'+(hideTitle?'':'<div class="co-card-title">'+name+'</div>');
  if(fields.length){
    var noteEn=(def.note_en!=null)?def.note_en:'Specific details for this service';
    var noteEs=(def.note_es!=null)?def.note_es:'Detalles específicos de este servicio';
    html += '<div class="co-card-svc" data-en="'+noteEn+'" data-es="'+noteEs+'">'+(isEs?noteEs:noteEn)+'</div>';
    if(def.intro_en||def.intro_es){ html += '<p class="co-svc-intro">'+(isEs?(def.intro_es||def.intro_en):(def.intro_en||def.intro_es))+'</p>'; }
    html += '<div class="co-grid">'+fields.map(function(f){return fieldHtml(svcId,f);}).join('')+'</div>';
  } else {
    html += '<div class="co-card-svc">'+(isEs?'No requiere datos adicionales':'No extra details required')+'</div>';
  }
  return html+'</div>';
}
// ── Artículos de Enmienda: formulario a la medida (checkboxes + campos condicionales) ──
var AMD_SECTIONS = ['name','prin','mail','agent','members','purpose'];
function coAmdAddr(prefix, isEs, withState){
  var f=function(k,lbl,full){ return '<div class="co-field'+(full?' full':'')+'"><label class="co-label">'+lbl+'</label><input class="co-input" id="x-amendment-'+prefix+k+'"'+((k==='Street'||k==='City')?' oninput="coTitleCase(this)"':'')+'/></div>'; };
  var stateHtml = withState ? '<div class="co-field"><label class="co-label">'+(isEs?'Estado':'State')+'</label><select class="co-select" id="x-amendment-'+prefix+'State">'+coStateOpts()+'</select></div>' : '';
  return '<div class="co-grid">'
    +f('Street',(isEs?'Calle':'Street'),true)
    +f('Apt',(isEs?'Apt / Suite (opcional)':'Apt / Suite (optional)'))
    +f('City',(isEs?'Ciudad':'City'))
    +stateHtml
    +f('Zip',(isEs?'Código postal':'ZIP'))
    +'</div>';
}
function coAmendmentHtml(hideTitle){
  var isEs=coIsEs();
  var chk=function(k,lbl){ return '<label class="co-amd-opt"><input type="checkbox" id="amd-cb-'+k+'" onchange="coAmdToggle(\''+k+'\')"/> <span>'+lbl+'</span></label>'; };
  var sec=function(k,inner){ return '<div class="co-amd-sec" id="amd-sec-'+k+'" style="display:none">'+inner+'</div>'; };
  var h='<div class="co-card">'+(hideTitle?'':'<div class="co-card-title">'+(isEs?'Artículos de Enmienda':'Articles of Amendment')+'</div>');
  h+='<p class="co-svc-intro">'+(isEs?'Marca qué vas a cambiar y llena solo eso. Preparamos y presentamos la enmienda ante el Estado de Florida.':'Check what you are changing and fill in only that. We prepare and file the amendment with the State of Florida.')+'</p>';
  // Nombre
  h+=chk('name',(isEs?'Nombre de la empresa':'Company name'))
    +sec('name','<div class="co-grid"><div class="co-field full"><label class="co-label">'+(isEs?'Nuevo nombre':'New name')+'</label><input class="co-input" id="x-amendment-newName"/></div></div>');
  // Dirección principal
  h+=chk('prin',(isEs?'Dirección principal':'Principal address'))+sec('prin',coAmdAddr('prin',isEs,true));
  // Dirección postal
  h+=chk('mail',(isEs?'Dirección postal (mailing)':'Mailing address'))+sec('mail',coAmdAddr('mail',isEs,true));
  // Agente registrado
  h+=chk('agent',(isEs?'Agente registrado':'Registered agent'))
    +sec('agent','<div class="co-grid"><div class="co-field full"><label class="co-label">'+(isEs?'Nuevo agente (nombre)':'New agent (name)')+'</label><input class="co-input" id="x-amendment-agName" oninput="coTitleCase(this)"/></div></div>'+coAmdAddr('ag',isEs,false));
  // Miembros / gerentes / oficiales
  h+=chk('members',(isEs?'Miembros / gerentes / oficiales':'Members / managers / officers'))
    +sec('members','<div class="co-grid"><div class="co-field full"><label class="co-label">'+(isEs?'¿Agregar o quitar?':'Add or remove?')+'</label><select class="co-select" id="x-amendment-membersAction"><option value="add">'+(isEs?'Agregar':'Add')+'</option><option value="remove">'+(isEs?'Quitar':'Remove')+'</option><option value="replace">'+(isEs?'Reemplazar':'Replace')+'</option></select></div>'
      +'<div class="co-field full"><label class="co-label">'+(isEs?'¿Quién? (nombre completo y detalles)':'Who? (full name and details)')+'</label><textarea class="co-textarea" id="x-amendment-membersWho"></textarea></div></div>');
  // Propósito
  h+=chk('purpose',(isEs?'Propósito del negocio':'Business purpose'))
    +sec('purpose','<div class="co-grid"><div class="co-field full"><label class="co-label">'+(isEs?'Nuevo propósito':'New purpose')+'</label><textarea class="co-textarea" id="x-amendment-purpose"></textarea></div></div>');
  // Lista oculta de cambios seleccionados + persona autorizada (siempre)
  h+='<input type="hidden" id="x-amendment-changes"/>';
  h+='<div class="co-grid" style="margin-top:12px"><div class="co-field full"><label class="co-label">'+(isEs?'Nombre de la persona autorizada':'Authorized person name')+'</label><input class="co-input" id="x-amendment-authName" oninput="coTitleCase(this)"/></div></div>';
  return h+'</div>';
}
function coAmdToggle(k){
  var cb=document.getElementById('amd-cb-'+k), sec=document.getElementById('amd-sec-'+k);
  if(sec) sec.style.display=(cb&&cb.checked)?'':'none';
  var selArr=[]; AMD_SECTIONS.forEach(function(x){ var c=document.getElementById('amd-cb-'+x); if(c&&c.checked) selArr.push(x); });
  var h=$('x-amendment-changes'); if(h) h.value=selArr.join(',');
}
// Restaura los checkboxes/secciones de la enmienda desde el valor guardado (tras rebuild).
function coAmdRestore(){
  var h=$('x-amendment-changes'); if(!h) return;
  var sel=(h.value||'').split(',').filter(Boolean);
  AMD_SECTIONS.forEach(function(k){ var on=sel.indexOf(k)>=0; var cb=document.getElementById('amd-cb-'+k); if(cb) cb.checked=on; var sec=document.getElementById('amd-sec-'+k); if(sec) sec.style.display=on?'':'none'; });
}

// ── Campos compartidos (EIN/SSN) — EIN no se pide si es formación ───────────
function sharedKeys(){
  var keys=[];
  cart.forEach(function(svcId){ var def=SVC_EXTRAS[svcId]; if(def&&def.shared) def.shared.forEach(function(k){ if(keys.indexOf(k)<0) keys.push(k); }); });
  return keys;
}
function coSharedKeysActive(){
  var k=sharedKeys();
  // No pedir el EIN existente si es formación NUEVA o si el cliente está comprando
  // el servicio de EIN (se lo generamos nosotros; los demás servicios usan ese).
  if(coFormationType() || cart.indexOf('ein')>=0) k=k.filter(function(x){ return x!=='ein'; });
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
  var ids=['f-flDoc','f-entityType','f-legalName','f-designator','f-street','f-apt','f-city','f-state','f-zip','f-country','f-firstName','f-lastName','f-email','f-phone','p-street','p-apt','p-city','p-state','p-zip'];
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
  var fn=$('f-firstName').value.trim(), ln=$('f-lastName').value.trim();
  // Ya no hay campo de firma: la autorización se da al completar el pago. Se
  // guarda el nombre completo como firma electrónica para el registro.
  var sig=(fn+' '+ln).trim();
  return {
    firstName:fn, lastName:ln,
    email:$('f-email').value.trim(), phone:$('f-phone').value.trim(),
    entityType:$('f-entityType').value,
    legalName:(ft && desig && name) ? (name+' '+desig) : name,
    formationType:ft||'', designator:desig,
    flDoc:$('f-flDoc').value.trim(), street:$('f-street').value.trim(),
    apt:($('f-apt')?$('f-apt').value.trim():''), city:$('f-city').value.trim(),
    state:($('f-state')?$('f-state').value.trim():''), zip:$('f-zip').value.trim(),
    country:($('f-country')?$('f-country').value.trim():''),
    personalAddress:{
      street:($('p-street')?$('p-street').value.trim():''), apt:($('p-apt')?$('p-apt').value.trim():''),
      city:($('p-city')?$('p-city').value.trim():''), state:($('p-state')?$('p-state').value.trim():''),
      zip:($('p-zip')?$('p-zip').value.trim():'')
    },
    signature:sig, authorizedByPayment:true, expedited:coExpedited, extras:coCollectExtras(), shared:coCollectShared(), bundles:coBundles.slice()
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
    if(extra){ var ah=''; ['activity','activityDesc','employees'].forEach(function(k){ var fd=coFieldDef(coFormId,k); if(fd) ah+=fieldHtml(coFormId,fd); }); if(ah) extra.innerHTML='<div class="co-grid">'+ah+'</div>'; }
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
// Campos compartidos (SSN/ITIN) — se muestran como una tarjeta dentro del paso
// "Datos del servicio" (solo si algún servicio elegido los requiere). Cada uno
// trae un tooltip que explica para qué se necesita.
function coSharedFieldsInner(keys){
  var isEs=coIsEs();
  return keys.map(function(k){ var f=SHARED_CFG[k]; if(!f) return ''; var lbl=isEs?f.es:f.en;
    var tip=isEs?(f.tipEs||''):(f.tipEn||'');
    var tipHtml = tip ? ' <span class="co-tip">?<span class="co-tip-box">'+tip+'</span></span>' : '';
    if(k==='ssnItin'){
      // Oculto por defecto (type=password), botón Ver/Ocultar y un segundo campo
      // para confirmar que no haya errores de tipeo.
      return '<div class="co-field full"><label class="co-label">'+lbl+tipHtml+'</label>'
        +'<div class="co-ssn-wrap"><input class="co-input" type="password" autocomplete="off" inputmode="numeric" maxlength="9" oninput="this.value=this.value.replace(/[^0-9]/g,\'\')" id="s-ssnItin"/>'
        +'<button type="button" class="co-ssn-eye" onclick="coToggleSsn(this)">'+(isEs?'Ver':'Show')+'</button></div></div>'
        +'<div class="co-field full"><label class="co-label">'+(isEs?'Confirma tu SSN o ITIN':'Confirm your SSN or ITIN')+'</label>'
        +'<input class="co-input" type="password" autocomplete="off" inputmode="numeric" maxlength="9" oninput="this.value=this.value.replace(/[^0-9]/g,\'\')" id="s-ssnItin-confirm"/></div>';
    }
    return '<div class="co-field full"><label class="co-label">'+lbl+tipHtml+'</label><input class="co-input" type="text" id="s-'+k+'"/></div>';
  }).join('');
}
// Mostrar/ocultar el SSN (afecta ambos campos: el principal y su confirmación).
function coToggleSsn(btn){
  var isEs=coIsEs(); var a=$('s-ssnItin'), b=$('s-ssnItin-confirm');
  var show = a && a.type==='password';
  if(a) a.type=show?'text':'password';
  if(b) b.type=show?'text':'password';
  btn.textContent = show ? (isEs?'Ocultar':'Hide') : (isEs?'Ver':'Show');
}
// Paso propio "Datos fiscales": aparece justo después de elegir un servicio que
// requiere SSN/ITIN (ej. EIN), con el contexto fresco. Muestra el responsible
// party ya cargado y deja solo el SSN/ITIN por llenar.
function coRenderTaxPanel(){
  var panel=$('panel-tax'); if(!panel) return; var isEs=coIsEs();
  var keys=coSharedKeysActive(); if(!keys.length){ panel.innerHTML=''; return; }
  // Servicios que disparan estos datos (para explicar el porqué).
  var trig=[]; cart.forEach(function(svcId){ var def=SVC_EXTRAS[svcId]; if(def&&def.shared&&def.shared.some(function(k){return keys.indexOf(k)>=0;})){ trig.push(isEs?def.name_es:def.name_en); } });
  var why = trig.length
    ? (isEs?('Para tu '+trig.join(', ')+' necesitamos un dato más.'):('For your '+trig.join(', ')+' we need one more detail.'))
    : (isEs?'Un dato más para tu trámite.':'One more detail for your filing.');
  var rp=((($('f-firstName')||{}).value||'')+' '+(($('f-lastName')||{}).value||'')).trim();
  panel.innerHTML='<h1 class="co-h1">'+(isEs?'Datos fiscales':'Tax details')+'</h1>'
    +'<p class="co-sub">'+coEsc(why)+'</p>'
    +'<div class="co-card">'
    +(rp?'<div class="co-ir-block" style="border:none;padding:0 0 12px"><div class="co-ir-label">'+(isEs?'Responsible party':'Responsible party')+'</div><div class="co-ir-val">'+coEsc(rp)+'</div></div>':'')
    +'<div class="co-grid">'+coSharedFieldsInner(keys)+'</div></div>';
}
// ── Procesamiento acelerado (paso propio, una vez, aplica a toda la orden) ────
function coRenderExpedited(){
  var panel=$('panel-expedited'); if(!panel) return; var isEs=coIsEs();
  var exp=coExpedited, std=!coExpedited;
  panel.innerHTML='<h1 class="co-h1">'+(isEs?'Procesamiento acelerado':'Faster processing')+'</h1>'
    +'<p class="co-sub">'+(isEs?'¿Lo quieres más rápido? Acelera la presentación estatal cuando aplica.':'Want it faster? Upgrade to expedited state filing where applicable.')+'</p>'
    +'<div class="co-card">'
      +'<div class="co-choices">'
        +'<div class="co-choice co-choice-rec'+(exp?' sel':'')+'" onclick="coSetExpedited(true)">'
          +'<span class="co-rec-badge">'+(isEs?'Más rápido':'Fastest')+'</span>'
          +'<div class="co-choice-top"><span class="co-choice-title">&#9889; '+(isEs?'Procesamiento acelerado':'Expedited processing')+'</span><span class="co-choice-price">+$'+EXPED_FEE+'</span></div>'
          +'<div class="co-choice-desc">'+(isEs?'1-3 días hábiles':'1-3 business days')+'</div></div>'
        +'<div class="co-choice'+(std?' sel':'')+'" onclick="coSetExpedited(false)">'
          +'<div class="co-choice-top"><span class="co-choice-title">'+(isEs?'Tiempo estándar':'Standard time')+'</span><span class="co-choice-price">$0</span></div>'
          +'<div class="co-choice-desc">'+(isEs?'7-14 días hábiles':'7-14 business days')+'</div></div>'
      +'</div>'
    +'</div>';
}
function coSetExpedited(v){ coExpedited=!!v; coSaveCart(); coRenderExpedited(); coUpdateOrderSummary(); try{ coPrefetchPayment(); }catch(e){} }

// Tarjetas de upsell (Registered Agent / Virtual Address). Explican qué son, por
// qué conviene y QUÉ INCLUYEN (bullets, como en los paquetes) para que el cliente
// vea el valor real. En formación, el Agente Registrado se presenta como dos
// cajas (nuestro servicio +$99 / sé tu propio agente).
var UPSELL = {
  'registered-agent': { icon:'&#127963;', price:'$99',
    en:{name:'Registered Agent', desc:'Every Florida LLC & Corporation must have a Registered Agent with a physical FL address to receive legal & state documents.', why:'Keeps your home address private and off the public record.',
      incl:['Official FL street address for your business','Accepts service of process & legal documents','Document forwarding & email notifications']},
    es:{name:'Agente Registrado', desc:'Toda LLC y Corporation de Florida debe tener un Agente Registrado con dirección física en FL para recibir documentos legales y del estado.', why:'Mantiene tu dirección personal privada y fuera del registro público.',
      incl:['Dirección oficial en FL para tu negocio','Acepta notificaciones y documentos legales','Reenvío de documentos y notificación por correo']} },
  'virtual-address': { icon:'&#128236;', price:'$99',
    en:{name:'Virtual Mailing Address', desc:'A professional Florida business address that receives and forwards your mail digitally.', why:'Use a real FL address without exposing your home address.',
      incl:['Professional FL mailing address','Mail receiving & digital forwarding','Home address stays private on public records','Available immediately after sign-up']},
    es:{name:'Dirección Virtual', desc:'Una dirección comercial profesional en Florida que recibe y reenvía tu correo digitalmente.', why:'Usa una dirección real en FL sin exponer la de tu casa.',
      incl:['Dirección postal profesional en Florida','Recepción de correo y reenvío digital','Tu dirección personal no aparece en registros públicos','Activo inmediatamente al inscribirte']} }
};
// ── Paso Agente Registrado (formación): dos cajas + reuso de dirección ───────
function coRenderRaPanel(){
  var panel=$('panel-ra'); if(!panel) return; var isEs=coIsEs();
  // La preselección de "nuestro servicio" se hace al ENTRAR al paso (coGoStep),
  // no aquí, para no agregar el agente al carrito desde el paso 1.
  var u=UPSELL['registered-agent']; var t=isEs?u.es:u.en;
  var oursSel=(coRaChoice==='ours'); var ownSel=(coRaChoice==='own');
  var bullets=(t.incl||[]).map(function(b){ return '<div class="co-up-incl-item"><span class="co-up-incl-check">&#10003;</span><span>'+b+'</span></div>'; }).join('');
  var fid=coFormId;
  var oursDesc=isEs?'Actuamos como tu Agente Registrado oficial. Tu dirección personal se mantiene 100% privada.':'We act as your official Registered Agent. Your personal address stays completely private.';
  var ownDesc=isEs?'Tu dirección se registra públicamente en Florida y la ley exige que estés disponible de lunes a viernes de 9am a 5pm para recibir documentos legales.':'Your address is publicly registered with Florida and the law requires you to be available Mon-Fri 9am-5pm to receive legal documents.';
  var infoTxt=isEs
    ? 'Un Agente Registrado es la persona o empresa designada para recibir documentos legales y avisos oficiales del estado en nombre de tu negocio. Por ley, toda LLC y Corporation de Florida debe tener uno en todo momento, con una dirección física en Florida.'
    : 'A Registered Agent is the person or company designated to receive legal documents and official state notices on behalf of your business. By law, every Florida LLC and Corporation must have one at all times, with a physical Florida address.';
  panel.innerHTML='<h1 class="co-h1">'+(isEs?'Agente Registrado':'Registered Agent')+'</h1>'
    +'<p class="co-sub">'+(isEs?'Elige cómo quieres manejar tu Agente Registrado.':'Choose how you want to handle your Registered Agent.')+'</p>'
    +'<div class="co-card">'
      +'<div class="co-ra-info">&#128221; '+infoTxt+'</div>'
      +'<div class="co-choices">'
        +'<div class="co-choice co-choice-rec'+(oursSel?' sel':'')+'" id="co-ra-ours" onclick="coSetRaChoice(\'ours\')">'
          +'<span class="co-rec-badge">'+(isEs?'Recomendado':'Recommended')+'</span>'
          +'<div class="co-choice-top"><span class="co-choice-title">&#127963; '+(isEs?'Usa nuestro servicio de Agente Registrado':'Use our Registered Agent service')+'</span><span class="co-choice-price"><s style="color:#94a3b8;font-weight:600">$99</s></span></div>'
          +'<div style="color:#059669;font-weight:700;font-size:.8rem;margin-top:2px">&#10003; '+(isEs?'Gratis el primer año':'Free the first year')+'</div>'
          +'<div class="co-choice-desc">'+oursDesc+' '+(isEs?'Primer año gratis; luego se renueva automáticamente a $99/año hasta que lo canceles.':'First year free; then renews automatically at $99/yr until you cancel.')+'</div>'
          +'<div class="co-up-incl" style="margin-top:10px">'+bullets+'</div></div>'
        +'<div class="co-choice'+(ownSel?' sel':'')+'" id="co-ra-own" onclick="coSetRaChoice(\'own\')">'
          +'<div class="co-choice-top"><span class="co-choice-title">&#128100; '+(isEs?'Seré mi propio Agente Registrado':'I will be my own Registered Agent')+'</span><span class="co-choice-price">$0</span></div>'
          +'<div class="co-choice-desc">'+ownDesc+'</div></div>'
      +'</div>'
      +'<input type="hidden" id="x-'+fid+'-raPref" value="'+(coRaChoice||'')+'"/>'
      +'<div class="co-ra-form" id="co-ra-own-form" style="display:'+(ownSel?'':'none')+'">'
        +'<div class="co-grid">'
          +'<div class="co-field"><label class="co-label">'+(isEs?'Nombre':'First name')+'</label><input class="co-input" id="x-'+fid+'-raFirstName" oninput="coTitleCase(this)"/></div>'
          +'<div class="co-field"><label class="co-label">'+(isEs?'Apellido':'Last name')+'</label><input class="co-input" id="x-'+fid+'-raLastName" oninput="coTitleCase(this)"/></div>'
        +'</div>'
        +'<div id="co-ra-addr-choice"></div>'
        +'<div id="co-ra-manual" style="display:none"><div class="co-grid">'
          +'<div class="co-field full"><label class="co-label">'+(isEs?'Dirección en Florida (sin PO Box)':'Florida street address (no PO Box)')+'</label><input class="co-input" id="x-'+fid+'-raStreet"/></div>'
          +'<div class="co-field"><label class="co-label">'+(isEs?'Apt / Suite (opcional)':'Apt / Suite (optional)')+'</label><input class="co-input" id="x-'+fid+'-raApt"/></div>'
          +'<div class="co-field"><label class="co-label">'+(isEs?'Ciudad':'City')+'</label><input class="co-input" id="x-'+fid+'-raCity"/></div>'
          +'<div class="co-field"><label class="co-label">'+(isEs?'Código postal':'ZIP')+'</label><input class="co-input" id="x-'+fid+'-raZip"/></div>'
        +'</div></div>'
      +'</div>'
    +'</div>';
  if(ownSel){ coRenderRaAddrOptions(); }
}
// ¿La dirección es de Florida? (el agente registrado debe tener dirección física en FL)
function coIsFL(s){ return /^(fl|florida)$/i.test((s||'').trim()); }
function coSameAddr(a,b){
  var n=function(x){ return (x||'').toLowerCase().replace(/\s+/g,' ').trim(); };
  return n(a.street)===n(b.street) && n(a.zip)===n(b.zip);
}
// Direcciones candidatas (solo de Florida) para reusar como dirección del agente.
function coRaAddrCandidates(){
  var v=function(id){ var e=$(id); return e?e.value.trim():''; };
  var isEs=coIsEs(); var out=[];
  var biz={street:v('f-street'),apt:v('f-apt'),city:v('f-city'),state:v('f-state'),zip:v('f-zip')};
  var per={street:v('p-street'),apt:v('p-apt'),city:v('p-city'),state:v('p-state'),zip:v('p-zip')};
  if(biz.street && coIsFL(biz.state)) out.push({key:'biz', label:(isEs?'Mi dirección de empresa':'My company address'), a:biz});
  if(per.street && coIsFL(per.state) && !coSameAddr(biz,per)) out.push({key:'per', label:(isEs?'Mi dirección personal':'My personal address'), a:per});
  return out;
}
// Construye la elección de dirección del agente según las direcciones en FL.
function coRenderRaAddrOptions(){
  var host=$('co-ra-addr-choice'); if(!host) return; var isEs=coIsEs();
  var cands=coRaAddrCandidates(); var html='';
  // Por default, como es SU PROPIO agente, se usa su dirección personal si es de FL.
  var defKey = cands.some(function(c){return c.key==='per';}) ? 'per' : (cands.length?cands[0].key:'other');
  if(cands.length){
    html+='<div class="co-label" style="margin-top:8px">'+(isEs?'¿Qué dirección de Florida usamos para el agente?':'Which Florida address should we use for the agent?')+'</div>';
    cands.forEach(function(c){
      var line=[c.a.street,c.a.city,c.a.zip].filter(Boolean).join(', ');
      html+='<label class="co-ra-same"><input type="radio" name="ra-addr" value="'+c.key+'"'+(c.key===defKey?' checked':'')+' onchange="coRaPickAddr(\''+c.key+'\')"/> <span><strong>'+c.label+'</strong>: '+line+'</span></label>';
    });
    html+='<label class="co-ra-same"><input type="radio" name="ra-addr" value="other"'+(defKey==='other'?' checked':'')+' onchange="coRaPickAddr(\'other\')"/> <span>'+(isEs?'Otra dirección en Florida (la escribo)':'Another Florida address (I will type it)')+'</span></label>';
  } else {
    html+='<div class="co-state-note">'+(isEs?'El agente debe tener una dirección física en Florida. Escríbela abajo.':'The agent must have a physical Florida address. Type it below.')+'</div>';
  }
  host.innerHTML=html;
  coRaPickAddr(defKey);
}
function coRaPickAddr(key){
  var fid=coFormId; var manual=$('co-ra-manual');
  if(key==='other'){
    if(manual) manual.style.display='';
    ['raStreet','raApt','raCity','raZip'].forEach(function(k){ var e=$('x-'+fid+'-'+k); if(e) e.value=''; });
    return;
  }
  if(manual) manual.style.display='none';
  var src = key==='biz' ? {street:'f-street',apt:'f-apt',city:'f-city',zip:'f-zip'} : {street:'p-street',apt:'p-apt',city:'p-city',zip:'p-zip'};
  var set=function(k,s){ var e=$('x-'+fid+'-'+k), o=$(s); if(e&&o) e.value=o.value||''; };
  set('raStreet',src.street); set('raApt',src.apt); set('raCity',src.city); set('raZip',src.zip);
}
function coSetRaChoice(choice){
  coRaChoice=choice;
  var inCart=cart.indexOf('registered-agent')>=0;
  if(choice==='ours'&&!inCart){ cart.push('registered-agent'); }
  if(choice==='own'&&inCart){ cart.splice(cart.indexOf('registered-agent'),1); }
  coSaveCart();
  var bo=$('co-ra-ours'), bw=$('co-ra-own');
  if(bo) bo.classList.toggle('sel',choice==='ours');
  if(bw) bw.classList.toggle('sel',choice==='own');
  var form=$('co-ra-own-form'); if(form) form.style.display=(choice==='own')?'':'none';
  var prefEl=$('x-'+coFormId+'-raPref'); if(prefEl) prefEl.value=choice;
  if(choice==='own'){
    // Prellena el nombre del agente con el del contacto (paso 2) si está vacío.
    var ff=$('x-'+coFormId+'-raFirstName'), fl=$('x-'+coFormId+'-raLastName');
    if(ff&&!ff.value) ff.value=(($('f-firstName')||{}).value||'');
    if(fl&&!fl.value) fl.value=(($('f-lastName')||{}).value||'');
    coRenderRaAddrOptions();
  }
  coUpdateOrderSummary();
}
// ── Hubs de upsell (3 tiers estilo LegalZoom) — combos DINÁMICOS ─────────────
// El hub se ofrece mientras falte al menos un servicio suyo por agregar (o si ya
// se eligió un tier, para poder cambiarlo). Si ya tiene todos, no se muestra.
function coHubApplicable(hub){
  // "compliance" es solo à la carte — en formación el agente ya se resuelve en
  // su propio paso obligatorio (panel-ra) y Annual Report vive en "protect".
  if(hub==='compliance' && coFormationType()) return false;
  var cfg=(hub==='protect') ? coProtectConfig() : HUBS[hub];
  for(var b=0;b<coBundles.length;b++){ if(BUNDLE_HUB[coBundles[b]]===hub) return true; }
  for(var i=0;i<cfg.services.length;i++){ if(cart.indexOf(cfg.services[i])<0) return true; }
  return false;
}
// owned: mapa {svcId:1} de servicios que el cliente ya tiene (se marcan con ✓).
function coTierBullets(svcIds, owned){
  owned=owned||{}; var isEs=coIsEs(); var out='';
  svcIds.forEach(function(s){ var bl=SVC_BLURBS[s]; if(!bl) return;
    var svc=SVC_CATALOG[s]; var suf=svc?coBillingSuffix(svc.billing):'';
    var ownTag = owned[s] ? ' <em style="font-style:normal;color:#059669;font-weight:700">'+(isEs?'· ya lo tienes':'· already added')+'</em>' : '';
    out+='<div class="co-tier-svc">'+(isEs?bl.nameEs:bl.nameEn)+(suf?' <em style="font-style:normal;color:#64748b;font-weight:600">'+suf+'</em>':'')+ownTag+'</div>';
    (isEs?bl.es:bl.en).forEach(function(txt){
      out+='<div class="co-tier-incl-item"><span class="co-tier-incl-check">&#10003;</span><span>'+txt+'</span></div>';
    });
  });
  return out;
}
function coRenderHub(hub){
  var panel=$(HUBS[hub].panel); if(!panel) return; var isEs=coIsEs();
  var cfg=(hub==='protect') ? coProtectConfig() : HUBS[hub];
  // Servicios "pre-poseídos": están en el carrito pero NO por un combo seleccionado
  // de ESTE hub (ej. agregados à la carte antes). Solo a ESOS se les acredita el
  // precio. Así, elegir un tier del hub NO borra los otros ni descuenta de más.
  var coveredSel={}; coBundles.forEach(function(x){ if(BUNDLE_HUB[x]===hub){ var bb=BUNDLES_CLIENT[x]; if(bb) bb.services.forEach(function(s){ coveredSel[s]=1; }); } });
  var preOwned={}; cfg.services.forEach(function(s){ if(cart.indexOf(s)>=0 && !coveredSel[s]) preOwned[s]=1; });
  // Se ocultan las columnas que no sumarían nada nuevo (todo lo suyo ya está en
  // el carrito) — evita una columna redundante mostrando "$0" junto al total
  // que ya se ve en el resumen. Puede dejar 1 o 2 columnas en vez de 3 si el
  // cliente ya tiene varios de los servicios del combo (esperado y está bien).
  var renderTiers=cfg.tiers.filter(function(bid){
    var b=BUNDLES_CLIENT[bid]; if(!b) return false;
    if(coBundles.indexOf(bid)>=0) return true;
    return b.services.some(function(s){ return !preOwned[s]; });
  });
  var tiers=renderTiers.map(function(bid, i){
    var b=BUNDLES_CLIENT[bid];
    var sel=(coBundles.indexOf(bid)>=0);
    var owned={}, ownedFee=0;
    b.services.forEach(function(s){ if(preOwned[s]){ owned[s]=1; var sv=SVC_CATALOG[s]; if(sv) ownedFee+=sv.serviceFee; } });
    var price=Math.max(0, b.price-ownedFee);          // marginal: crédito de lo pre-poseído
    var newIndiv=0; b.services.forEach(function(s){ if(!owned[s]){ var sv=SVC_CATALOG[s]; if(sv) newIndiv+=sv.serviceFee; } });
    var save=newIndiv-price;
    var cad={}, ncad=0; b.services.forEach(function(s){ var sv=SVC_CATALOG[s]; if(sv&&sv.billing){ if(!cad[sv.billing]){cad[sv.billing]=1;ncad++;} } });
    var priceSuf=ncad===1?coBillingSuffix(Object.keys(cad)[0]):'';
    var best=(i===renderTiers.length-1);
    var pfx=ownedFee>0?'+':'';
    return '<div class="co-tier'+(best?' best':'')+(sel?' sel':'')+'" style="cursor:pointer" onclick="coSelectTier(\''+hub+'\',\''+bid+'\')">'
      +(best?'<div class="co-tier-badge">'+(isEs?'Mejor valor':'Best value')+'</div>':'')
      +'<div class="co-tier-name">'+(isEs?b.name_es:b.name_en)+'</div>'
      +'<div class="co-tier-price">'+pfx+'$'+price+'</div>'+(priceSuf?'<div style="font-size:.72rem;color:#64748b;font-weight:600;margin-top:-4px">'+priceSuf+'</div>':'')
      +(save>0?'<div class="co-tier-save">'+(isEs?'Ahorras $':'Save $')+save+'</div>':'<div style="height:10px"></div>')
      +'<div class="co-tier-incl">'+coTierBullets(b.services, owned)+'</div>'
      +'<button class="co-tier-btn" onclick="event.stopPropagation();coSelectTier(\''+hub+'\',\''+bid+'\')">'+(sel?(isEs?'&#10003; Seleccionado':'&#10003; Selected'):(isEs?'Seleccionar':'Select'))+'</button>'
      +'</div>';
  }).join('');
  panel.innerHTML='<h1 class="co-h1">'+(isEs?HUBS[hub].titleEs:HUBS[hub].titleEn)+'</h1>'
    +'<p class="co-sub">'+(isEs?HUBS[hub].subEs:HUBS[hub].subEn)+'</p>'
    +'<div class="co-tiers">'+tiers+'</div>'
    +'<button type="button" class="co-hub-nothanks" onclick="coHubNoThanks(\''+hub+'\')">'+(isEs?'No, gracias':'No thanks')+'</button>';
}
function coClearHub(hub){
  var cfg=(hub==='protect') ? coProtectConfig() : HUBS[hub];
  cart=cart.filter(function(id){ return cfg.services.indexOf(id)<0; });
  coBundles=coBundles.filter(function(b){ return BUNDLE_HUB[b]!==hub; });
}
function coSelectTier(hub, bundleId){
  var toggleOff=(coBundles.indexOf(bundleId)>=0);
  coClearHub(hub);
  if(!toggleOff){
    var b=BUNDLES_CLIENT[bundleId]; if(b){ b.services.forEach(function(s){ if(cart.indexOf(s)<0) cart.push(s); }); coBundles.push(bundleId); }
  }
  coSaveCart();
  coRebuildTo(HUBS[hub].panel);
}
function coHubNoThanks(hub){
  coClearHub(hub); coSaveCart();
  // reconstruye (quita pasos de servicios removidos) y avanza al paso siguiente
  var ex=coCollectExtras(), sh=coCollectShared(), simple=coSnapSimple();
  coBuildWizard();
  coRestoreSimple(simple); restoreShared(sh); restoreExtras(ex); coOwnTotal();
  var idx=-1; coSteps.forEach(function(s,i){ if(s.id===HUBS[hub].panel) idx=i; });
  coGoStep(idx>=0?Math.min(idx+1,coSteps.length-1):Math.min(coIdx,coSteps.length-1));
}
// Reconstruye preservando datos y vuelve a un paso por id.
function coRebuildTo(stepId){
  var ex=coCollectExtras(), sh=coCollectShared(), simple=coSnapSimple();
  coBuildWizard();
  coRestoreSimple(simple); restoreShared(sh); restoreExtras(ex); coOwnTotal();
  var idx=-1; coSteps.forEach(function(s,i){ if(s.id===stepId) idx=i; });
  coGoStep(idx<0?Math.min(coIdx,coSteps.length-1):idx);
}
// ── Resumen de orden persistente (sidebar derecho, visible en cada paso) ─────
// Espeja computeServicesTotal (services-pricing.ts) para mostrar el total en vivo.
// El cobro real siempre se recalcula server-side desde los IDs del carrito.
function coBillingSuffix(billing){
  var isEs=coIsEs();
  if(billing==='monthly') return isEs?'cargo mensual':'monthly charge';
  if(billing==='annual') return isEs?'cargo anual':'annual charge';
  return '';
}
function coComputeTotal(){
  // Tarifas de servicio primero; las tarifas estatales se agrupan al final
  // (antes del total) en vez de intercaladas tras cada servicio.
  var lines=[], stateLines=[], total=0, isEs=coIsEs(), bundled={}, seenB={}, recurring=false;
  // 1) Bundles primero (precio combo + tarifas estatales de sus servicios)
  coBundles.forEach(function(bid){
    if(seenB[bid]) return; seenB[bid]=1; var b=BUNDLES_CLIENT[bid]; if(!b) return;
    // Cadencia del combo: una sola etiqueta si todos sus servicios recurrentes la
    // comparten; si hay mezcla va sin sufijo y el aviso lo explica.
    var cad={}, ncad=0; b.services.forEach(function(sid){ var sv=SVC_CATALOG[sid]; if(sv&&sv.billing&&!cad[sv.billing]){ cad[sv.billing]=1; ncad++; } });
    if(ncad>0) recurring=true;
    var bb=ncad===1?Object.keys(cad)[0]:'';
    lines.push({label:isEs?b.name_es:b.name_en, amount:b.price, billing:bb}); total+=b.price;
    b.services.forEach(function(sid){ bundled[sid]=1; var svc=SVC_CATALOG[sid]; if(svc&&svc.stateFee>0){ stateLines.push({label:(isEs?svc.name_es:svc.name_en), amount:svc.stateFee, state:true}); total+=svc.stateFee; } });
  });
  // 2) Servicios individuales no cubiertos por un bundle
  var seen={};
  cart.forEach(function(id){
    if(seen[id]||bundled[id]) return; seen[id]=1; var s=SVC_CATALOG[id]; if(!s) return;
    var nm=isEs?s.name_es:s.name_en;
    if(s.billing) recurring=true;
    // freeWithOther (Agente Registrado): gratis el 1er período si hay otro servicio/combo.
    var hasOther=cart.some(function(o){ return o!==id && SVC_CATALOG[o]; })||coBundles.length>0;
    var free=!!s.freeWithOther && hasOther;
    lines.push({label:nm, amount:free?0:s.serviceFee, billing:s.billing, firstYearFree:free, renewalFee:s.renewalFee}); total+=(free?0:s.serviceFee);
    if(s.stateFee>0){ stateLines.push({label:nm, amount:s.stateFee, state:true}); total+=s.stateFee; }
  });
  if(coExpedited && coExpeditedApplicable()){ lines.push({label:(isEs?'Procesamiento acelerado':'Expedited Processing'), amount:EXPED_FEE}); total+=EXPED_FEE; }
  return {lines:lines.concat(stateLines), total:total, recurring:recurring};
}
// Una fila del resumen. Las tarifas estatales van atenuadas con su etiqueta.
// Los servicios recurrentes muestran su cargo (mensual/anual) junto al precio.
function coLineRow(l){
  var isEs=coIsEs();
  if(l.state){ return '<div class="co-review-row co-row-state"><span>'+l.label+' <em>'+(isEs?'tarifa estatal':'state fee')+'</em></span><span>$'+l.amount+'</span></div>'; }
  // Primer año gratis (ej. Agente Registrado): hoy $0. Se muestra solo el precio
  // normal tachado para que el cliente vea el valor (sin texto, para no desbordar).
  if(l.firstYearFree){
    var rf=l.renewalFee||0;
    return '<div class="co-review-row"><span>'+l.label+'</span><span><s style="color:#94a3b8">$'+rf+'</s></span></div>';
  }
  var suf=coBillingSuffix(l.billing);
  // El "cargo mensual/anual" va junto al nombre (izquierda) para que los precios
  // queden alineados verticalmente a la derecha.
  return '<div class="co-review-row"><span>'+l.label+(suf?' <em style="font-style:normal;color:#64748b;font-weight:500;font-size:.82em">'+suf+'</em>':'')+'</span><span>$'+l.amount+'</span></div>';
}
// Upsell: si el Agente Registrado va SOLO (sin otro servicio que lo haga gratis),
// motiva a agregar algo para que el primer año salga gratis.
function coRaUpsellNote(){
  if(cart.indexOf('registered-agent')<0) return '';
  var hasOther=cart.some(function(o){ return o!=='registered-agent' && SVC_CATALOG[o]; })||coBundles.length>0;
  if(hasOther) return ''; var isEs=coIsEs();
  return '<div class="co-state-note" style="color:#059669;font-weight:600">&#127881; '+(isEs?'Agrega cualquier otro servicio y tu Agente Registrado sale gratis el primer año.':'Add any other service and your Registered Agent is free the first year.')+'</div>';
}
// En mobile el resumen va arriba y colapsado; este toggle lo abre/cierra.
function coToggleSummary(){ var s=document.getElementById('co-side'); if(s) s.classList.toggle('co-sum-open'); }
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
    ? r.lines.map(coLineRow).join('')
    : '<div class="co-review-row" style="border:none;color:#94a3b8">'+(isEs?'Aún sin servicios':'No services yet')+'</div>';
  var note=$('co-side-note'); if(note) note.innerHTML=r.lines.length?coRaUpsellNote():'';
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
  // Los datos fiscales (SSN/ITIN) ya NO van aquí: tienen su propio paso (panel-tax).
  pages.forEach(function(pageIds, idx){
    var pid='panel-svc-'+idx;
    // Si el paso tiene UN solo servicio, el título del paso es el nombre del
    // servicio (contexto claro) y se omite el título repetido dentro del card.
    var single = pageIds.length===1 ? SVC_EXTRAS[pageIds[0]] : null;
    var tEn = single ? single.name_en : 'Service details';
    var tEs = single ? single.name_es : 'Datos del servicio';
    var inner=pageIds.map(function(id){ return coServiceCardHtml(id, ft, !!single); }).join('');
    host.insertAdjacentHTML('beforeend','<div class="co-panel" id="'+pid+'" style="display:none"><h1 class="co-h1" data-en="'+tEn+'" data-es="'+tEs+'">'+(isEs?tEs:tEn)+'</h1>'+inner+'</div>');
    coServicePages.push({id:pid, title:{en:tEn, es:tEs}});
  });
}

function coBuildWizard(){
  var ft=coFormationType();
  // Formaciones mutuamente excluyentes: deja solo la primera en el carrito.
  if(ft){
    var keep=(ft==='llc')?'llc-formation':'corp-formation';
    var other=(ft==='llc')?'corp-formation':'llc-formation';
    var oi=cart.indexOf(other); if(oi>=0){ cart.splice(oi,1); coSaveCart(); }
  }

  // Orden espejo del formulario de paquetes del home: el contacto va temprano
  // (paso 2). Los datos fiscales sensibles (SSN/ITIN) + firma van al final, en
  // "Confirmar y firmar", porque dependen de los servicios elegidos en los combos.
  coSteps=[];
  coSteps.push({id:'panel-company', title:{en:'Your company',es:'Tu empresa'}});
  coSetupCompanyPanel(ft);

  // Información personal (nombre/email/teléfono) temprano, como el home.
  coSteps.push({id:'panel-contact', title:{en:'Personal information',es:'Información personal'}});

  // En formación: Agente Registrado justo después de Empresa (reusa la dirección).
  if(ft){ coRenderRaPanel(); coSteps.push({id:'panel-ra', title:{en:'Registered Agent',es:'Agente Registrado'}}); }

  if(ft){ coSteps.push({id:'panel-owners', title:{en:'Owners & management',es:'Dueños y gestión'}}); coSetupOwnersPanel(ft); }

  // Hubs de upsell (3 tiers). Van antes de los datos de servicios para que lo que
  // el cliente agregue genere su paso de datos a continuación.
  if(coHubApplicable('docs')){ coRenderHub('docs'); coSteps.push({id:'panel-hub-docs', title:{en:'Essential documents',es:'Documentos esenciales'}}); }
  // Datos fiscales (SSN/ITIN): paso propio. En formación va ENTRE los hubs
  // (contexto fresco tras elegir el EIN); à la carte va después de todos.
  var coTaxNeeded=coSharedKeysActive().length>0;
  if(ft && coTaxNeeded){ coRenderTaxPanel(); coSteps.push({id:'panel-tax', title:{en:'Tax details',es:'Datos fiscales'}}); }
  // "Cumplimiento anual" (Agente + Annual Report): solo à la carte, sin
  // formación — ahí el agente ya se resuelve en su propio paso obligatorio.
  if(coHubApplicable('compliance')){ coRenderHub('compliance'); coSteps.push({id:'panel-hub-compliance', title:{en:'Annual compliance',es:'Cumplimiento anual'}}); }
  if(coHubApplicable('protect')){ coRenderHub('protect'); coSteps.push({id:'panel-hub-protect', title:{en:'Business presence & operations',es:'Presencia y operación'}}); }
  if(!ft && coTaxNeeded){ coRenderTaxPanel(); coSteps.push({id:'panel-tax', title:{en:'Tax details',es:'Datos fiscales'}}); }

  coRenderServicePages(ft);
  coServicePages.forEach(function(p){ coSteps.push({id:p.id, title:p.title||{en:'Service details',es:'Datos del servicio'}}); });

  // Procesamiento acelerado: paso propio JUSTO antes de revisar (último upsell).
  // Solo si hay algo que presentar ante el estado (ver coExpeditedApplicable) —
  // si no aplica, nunca se ofrece ni se cobra, aunque quedara elegido antes.
  if(coExpeditedApplicable()){
    coRenderExpedited(); coSteps.push({id:'panel-expedited', title:{en:'Faster processing',es:'Procesamiento acelerado'}});
  } else if(coExpedited){
    coExpedited=false; coSaveCart();
  }

  // Último paso: revisar la orden + pagar (Stripe). La autorización se da al
  // completar el pago (disclosure en el paso de pago); ya no hay paso de firma.
  coSteps.push({id:'panel-pay', title:{en:'Review your order',es:'Revisa tu orden'}});
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
  var isPay = coSteps[i].id==='panel-pay';
  // El "Atrás" inferior se muestra siempre (en el paso 1 vuelve a /servicios;
  // en el paso de pago permite volver a editar). Queda abajo, como los demás pasos.
  $('co-back').style.display = '';
  // Al entrar al paso de pago: refresca el disclosure (cláusula recurrente) y crea
  // la sesión de Stripe + monta el formulario. Centralizado aquí para que funcione
  // sin importar cómo se llegue al paso (Continuar, "No gracias" de un hub, etc.).
  if(isPay){ coTranslateStatic(); coStartPayment(); coEditReturn=false; }
  // Si el cliente entró a editar desde la revisión, ofrece volver directo a ella.
  var rr=$('co-review-return'); if(rr) rr.style.display=(coEditReturn && !isPay) ? '' : 'none';
  // Restaura el estado de la enmienda (checkboxes/secciones) tras cualquier rebuild.
  try{ coAmdRestore(); }catch(e){}
  // Agente Registrado: NO se preselecciona; "nuestro servicio" solo se muestra
  // como recomendado (badge). El cliente debe hacer clic para seleccionarlo (recién
  // ahí entra al resumen). Si ya eligió "propio agente", recalcula direcciones FL.
  if(coSteps[i].id==='panel-ra' && coRaChoice==='own') coRenderRaAddrOptions();
  // Datos fiscales: refresca el responsible party / contexto al entrar, sin borrar
  // lo que ya escribió el cliente.
  if(coSteps[i].id==='panel-tax'){ var _ssn=(($('s-ssnItin')||{}).value)||'', _ssnc=(($('s-ssnItin-confirm')||{}).value)||'', _ein=(($('s-ein')||{}).value)||''; coRenderTaxPanel(); if($('s-ssnItin')) $('s-ssnItin').value=_ssn; if($('s-ssnItin-confirm')) $('s-ssnItin-confirm').value=_ssnc; if($('s-ein')) $('s-ein').value=_ein; }
  // Modo ancho en los hubs de tiers (cards más anchas, estilo LegalZoom).
  var isHub = coSteps[i].id.indexOf('panel-hub-')===0;
  try{ document.documentElement.classList.toggle('co-wide', isHub); }catch(e){}
  $('co-next').style.display = isPay ? 'none' : '';
  var nextIsPay = (i+1<coSteps.length) && coSteps[i+1].id==='panel-pay';
  // Al entrar al paso previo al pago, pre-crea la sesión de Stripe en segundo
  // plano para que "Revisa tu orden" cargue el formulario sin demora.
  if(nextIsPay){ try{ coPrefetchPayment(); }catch(e){} }
  var isEs=coIsEs();
  $('co-next').innerHTML='<span>'+(nextIsPay ? (isEs?'Revisar orden':'Review order') : (isEs?'Continuar':'Continue'))+'</span> &#8594;';
  $('co-err').textContent='';
  coUpdateOrderSummary();
  // Alinea el resumen (sidebar) con el TOP del primer card del formulario, no con
  // el título del paso (pedido del founder). Solo desktop.
  try{
    var sideEl=$('co-side');
    if(sideEl){
      if(!isPay && window.innerWidth>760){
        var content=null;
        if(cur){ var cards=cur.querySelectorAll('.co-card,.co-tiers'); for(var k=0;k<cards.length;k++){ if(cards[k].offsetParent!==null){ content=cards[k]; break; } } }
        var off=content ? (content.getBoundingClientRect().top - cur.getBoundingClientRect().top) : 0;
        sideEl.style.marginTop=(off>0?off:0)+'px';
      } else { sideEl.style.marginTop=''; }
    }
  }catch(e){}
  window.scrollTo(0,0);
}
function coDestroyStripe(){
  if(stripeCheckout){ try{ stripeCheckout.destroy(); }catch(e){} stripeCheckout=null; }
  var ec=$('embedded-checkout'); if(ec) ec.innerHTML='<div style="text-align:center;padding:60px 0"><div class="co-spinner"></div></div>';
}
function coBack(){
  if(coSteps[coIdx].id==='panel-pay'){ coDestroyStripe(); }
  if(coIdx<=0){ try{ window.location.href='/servicios?lang='+coLang; }catch(e){} return; }
  coGoStep(coIdx-1);
}
// Modo dev: salta la validación de campos para revisar el flujo rápido.
// Se activa con Ctrl+Shift+D (igual que el form del home). La barra de progreso
// se pone ámbar cuando está activo.
var _coDevMode=false;
function coToggleDevMode(){
  _coDevMode=!_coDevMode;
  var f=$('co-prog-fill'); if(f) f.style.background=_coDevMode?'#f59e0b':'';
  var l=$('co-prog-label'); if(l) l.style.color=_coDevMode?'#b45309':'';
}
document.addEventListener('keydown', function(e){ if(e.ctrlKey&&e.shiftKey&&(e.key==='D'||e.key==='d')) coToggleDevMode(); });
function coNext(){
  if(!_coDevMode && !coValidateStep(coIdx)) return;
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
  if(id==='panel-ra'){
    if(coRaChoice!=='ours'&&coRaChoice!=='own'){ err.textContent=isEs?'Elige una opción de Agente Registrado para continuar.':'Choose a Registered Agent option to continue.'; return false; }
    if(coRaChoice==='own'){
      var raF=(($('x-'+coFormId+'-raFirstName')||{}).value||'').trim();
      var raL=(($('x-'+coFormId+'-raLastName')||{}).value||'').trim();
      var raS=(($('x-'+coFormId+'-raStreet')||{}).value||'').trim();
      if(raF.length<1||raL.length<1||raS.length<3){ err.textContent=isEs?'Ingresa el nombre, apellido y dirección de tu agente registrado.':'Enter your registered agent first name, last name and address.'; return false; }
    }
    return true;
  }
  if(id==='panel-tax'){
    var ak=coSharedKeysActive();
    if(ak.indexOf('ssnItin')>=0){
      var vSsn=(($('s-ssnItin')||{}).value||'').replace(/[^0-9]/g,'');
      if(vSsn.length!==9){ err.textContent=isEs?'El SSN o ITIN debe tener exactamente 9 dígitos.':'The SSN or ITIN must be exactly 9 digits.'; return false; }
      if(vSsn!==(($('s-ssnItin-confirm')||{}).value||'').replace(/[^0-9]/g,'')){ err.textContent=isEs?'El SSN o ITIN no coincide. Verifícalo.':'The SSN or ITIN does not match. Please check.'; return false; }
    }
    if(ak.indexOf('ein')>=0 && (($('s-ein')||{}).value||'').trim().length<3){ err.textContent=isEs?'Ingresa tu EIN.':'Enter your EIN.'; return false; }
    return true;
  }
  if(id==='panel-contact'){
    if(($('f-firstName').value||'').trim().length<1||($('f-lastName').value||'').trim().length<1){ err.textContent=isEs?'Ingresa tu nombre y apellido.':'Enter your first and last name.'; return false; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(($('f-email').value||'').trim())){ err.textContent=isEs?'Ingresa un correo válido.':'Enter a valid email.'; return false; }
    if(($('f-phone').value||'').replace(/[^0-9]/g,'').length<7){ err.textContent=isEs?'Ingresa un teléfono válido.':'Enter a valid phone.'; return false; }
    if(($('p-street').value||'').trim().length<3||($('p-city').value||'').trim().length<2||($('p-state').value||'').trim().length<2||($('p-zip').value||'').trim().length<3){ err.textContent=isEs?'Ingresa tu dirección (calle, ciudad, estado y código postal).':'Enter your address (street, city, state and ZIP).'; return false; }
    return true;
  }
  return true;
}
// Ya estamos en el paso "Revisar y pagar": muestra el resumen al instante
// (nombres de servicios) y crea la sesión + monta Stripe en el box de la derecha.
// Clave de estado del pago: si cambia (servicios/datos/idioma/expedited), la
// sesión pre-creada deja de servir y hay que recrearla.
function coPayKey(intake){ try{ return JSON.stringify({s:cart,b:coBundles,x:coExpedited,l:coLang,i:intake}); }catch(e){ return 'k'+Math.random(); } }
// Crea la sesión de Stripe en el servidor (Order pending + clientSecret).
function coCreateSessionReq(intake){
  return fetch('/api/checkout/embedded-services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({services:cart,intake:intake,lang:coLang})})
    .then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d};});});
}
// Pre-crea la sesión en segundo plano mientras el cliente aún está en el paso
// previo al pago, para que al llegar a "Revisa tu orden" el formulario de Stripe
// aparezca de inmediato (sin esperar el round-trip). No crea órdenes extra en el
// caso feliz: coStartPayment reutiliza esta misma promesa si la clave coincide.
function coPrefetchPayment(){
  var intake; try{ intake=coGetIntake(); }catch(e){ return; }
  var r; try{ r=coComputeTotal(); }catch(e){ return; }
  if(!r||!r.total) return;
  var key=coPayKey(intake);
  if(coPrefetch && coPrefetch.key===key) return; // ya en curso / lista
  var p=coCreateSessionReq(intake);
  p.catch(function(){}); // evita "unhandled rejection"; el error real se maneja al consumir
  coPrefetch={ key:key, promise:p };
}
function coStartPayment(){
  var isEs=coIsEs();
  var ec=$('embedded-checkout'); if(ec) ec.innerHTML='<div style="text-align:center;padding:60px 0"><div class="co-spinner"></div></div>';
  try{ coRenderReviewNames(); }catch(e){}
  try{ coRenderIntakeReview(); }catch(e){}
  // Guarda: si por algún estado raro del carrito el total es 0, no cuelgues el
  // spinner — avisa y deja volver.
  var r; try{ r=coComputeTotal(); }catch(e){ r={total:0,lines:[]}; }
  if(!r.total){ if(ec) ec.innerHTML='<p style="color:#dc2626;padding:24px;font-size:.86rem;line-height:1.6">'+(isEs?'Tu pedido está vacío o hubo un problema. Vuelve atrás y revisa tus servicios.':'Your order is empty or something went wrong. Go back and review your services.')+'</p>'; return; }
  var intake; try{ intake=coGetIntake(); }catch(e){ if(ec) ec.innerHTML='<p style="color:#dc2626;padding:24px">'+(isEs?'No se pudieron leer tus datos. Intenta de nuevo.':'Could not read your details. Please try again.')+'</p>'; return; }
  // Reutiliza la sesión pre-creada si el estado no cambió; si no, créala ahora.
  var key=coPayKey(intake), p;
  if(coPrefetch && coPrefetch.key===key){ p=coPrefetch.promise; }
  else { p=coCreateSessionReq(intake); coPrefetch={ key:key, promise:p }; }
  p.then(function(res){
      if(!res.ok||!res.d.clientSecret){
        coPrefetch=null; // sesión inválida: no la reutilices
        if(ec) ec.innerHTML='<p style="color:#dc2626;padding:24px;font-size:.86rem;line-height:1.6">'+((res.d&&res.d.error)||(isEs?'No se pudo crear el pago. Revisa tus datos e intenta de nuevo.':'Could not create payment. Check your details and try again.'))+'</p>';
        return;
      }
      try{ localStorage.setItem('flbc_svc_order', res.d.fbfc||''); }catch(e){}
      coRenderReview(res.d.lines, res.d.total);
      coMountStripe(res.d.clientSecret);
    })
    .catch(function(){ coPrefetch=null; if(ec) ec.innerHTML='<p style="color:#dc2626;padding:24px">'+(isEs?'Error de conexión. Intenta de nuevo.':'Connection error. Please try again.')+'</p>'; });
}
// Resumen inmediato con los nombres de los servicios (sin esperar al servidor).
function coRenderReviewNames(){
  var host=$('co-review-lines'); if(!host) return;
  // Reusa el cálculo del resumen (ya contempla bundles) para el desglose instantáneo.
  var r=coComputeTotal();
  host.innerHTML=r.lines.map(coLineRow).join('')+coRaUpsellNote();
  var t=$('co-review-total'); if(t) t.textContent='$'+r.total;
}
// Muestra el desglose con el estilo unificado (mirror) y el TOTAL autoritativo del server.
function coRenderReview(lines, total){
  var host=$('co-review-lines'); if(!host) return;
  var r=coComputeTotal();
  host.innerHTML=r.lines.map(coLineRow).join('')+coRaUpsellNote();
  $('co-review-total').textContent='$'+((total!=null)?total:r.total);
}
// ── Revisión de lo que el cliente llenó (paso 8) con opción de editar ────────
function coEsc(s){ return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function coEditStep(id){ var idx=-1; coSteps.forEach(function(s,i){ if(s.id===id) idx=i; }); if(idx<0) return; coEditReturn=true; coDestroyStripe(); coGoStep(idx); }
// Vuelve directo a la revisión desde un paso al que se llegó por "Editar" (valida antes).
function coReturnToReview(){
  if(!_coDevMode && !coValidateStep(coIdx)) return;
  var idx=-1; coSteps.forEach(function(s,i){ if(s.id==='panel-pay') idx=i; });
  if(idx>=0){ coEditReturn=false; coGoStep(idx); }
}
function coHasStep(id){ return coSteps.some(function(s){ return s.id===id; }); }
function coIrBlock(label, val, stepId){
  if(!val) return ''; var isEs=coIsEs();
  return '<div class="co-ir-block"><div class="co-ir-row"><span class="co-ir-label">'+label+'</span>'
    +(stepId?'<button type="button" class="co-ir-edit" onclick="coEditStep(\''+stepId+'\')">'+(isEs?'Editar':'Edit')+'</button>':'')
    +'</div><div class="co-ir-val">'+val+'</div></div>';
}
function coRenderIntakeReview(){
  var host=$('co-review-intake'); if(!host) return; var isEs=coIsEs();
  var v=function(id){ var e=$(id); return e?(e.value||'').trim():''; };
  var ft=coFormationType(); var out='';
  // Empresa
  var comp=v('f-legalName'); if(ft){ var d=$('f-designator'); comp=(comp+' '+(d?d.value:'')).trim(); }
  out+=coIrBlock(isEs?'Empresa':'Company', coEsc(comp), 'panel-company');
  var baddr=[v('f-street'),v('f-apt'),v('f-city'),v('f-state'),v('f-zip')].filter(Boolean).join(', ');
  out+=coIrBlock(isEs?'Dirección de la empresa':'Business address', coEsc(baddr), 'panel-company');
  // Contacto
  var contact=[(v('f-firstName')+' '+v('f-lastName')).trim(), v('f-email'), v('f-phone')].filter(Boolean).join(' · ');
  out+=coIrBlock(isEs?'Contacto':'Contact', coEsc(contact), 'panel-contact');
  var paddr=[v('p-street'),v('p-apt'),v('p-city'),v('p-state'),v('p-zip')].filter(Boolean).join(', ');
  out+=coIrBlock(isEs?'Tu dirección':'Your address', coEsc(paddr), 'panel-contact');
  // Agente registrado
  if(coHasStep('panel-ra')){
    var ra = coRaChoice==='own' ? (isEs?'Seré mi propio agente':'I am my own agent') : (isEs?'Nuestro servicio (gratis el 1er año)':'Our service (free 1st year)');
    if(coRaChoice==='own'){ var rn=(v('x-'+coFormId+'-raFirstName')+' '+v('x-'+coFormId+'-raLastName')).trim(); var rad=[v('x-'+coFormId+'-raStreet'),v('x-'+coFormId+'-raCity'),v('x-'+coFormId+'-raZip')].filter(Boolean).join(', '); ra+=(rn?' — '+rn:'')+(rad?' ('+rad+')':''); }
    out+=coIrBlock(isEs?'Agente registrado':'Registered agent', coEsc(ra), 'panel-ra');
  }
  // Dueños / Directores
  if(coHasStep('panel-owners')){
    var list=[]; document.querySelectorAll('#panel-owners .rep-row').forEach(function(r){
      var g=function(c){ var el=r.querySelector('.rep-cell[data-col="'+c+'"]'); return el?(el.value||'').trim():''; };
      var nm=(g('firstName')+' '+g('lastName')).trim()||g('name'); var role=g('role'), pct=g('pct');
      if(nm){ var extra=[role,pct?pct+'%':''].filter(Boolean).join(', '); list.push(coEsc(nm)+(extra?' ('+coEsc(extra)+')':'')); }
    });
    if(list.length) out+=coIrBlock(isEs?'Dueños':'Owners', list.join('<br>'), 'panel-owners');
  }
  host.innerHTML = out || '';
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
    try{ localStorage.removeItem('flbc_svc_cart'); localStorage.removeItem('flbc_svc_bundles'); localStorage.removeItem('flbc_svc_order'); localStorage.removeItem('flbc_svc_expedited'); }catch(e){}
    coShowScreen('co-success'); return;
  }
  if(!cart.length){ coShowScreen('co-empty'); return; }
  coBuildWizard();
  coShowScreen('co-wizard');
  coGoStep(0);
})();
`
}
