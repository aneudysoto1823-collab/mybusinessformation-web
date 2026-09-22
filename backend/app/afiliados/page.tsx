import type { Metadata } from 'next'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'Affiliate & Agent Program | OpaBiz',
  description:
    'Partner with OpaBiz: refer clients with your own coupon code, or join our team as a field agent and earn commission on every order you assist.',
  alternates: {
    canonical: 'https://opabiz.com/afiliados',
    languages: {
      'en-US': 'https://opabiz.com/afiliados',
      'es-US': 'https://opabiz.com/afiliados?lang=es',
    },
  },
  robots: { index: false, follow: false },
}

export default function AfiliadosPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-dark:#1D4ED8;--blue-light:#EFF6FF;--gold:#F59E0B;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray300:#CBD5E1;--gray400:#94A3B8;--gray500:#64748B;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-sans);color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3,h4{font-family:var(--font-serif);line-height:1.2}
a{text-decoration:none;color:inherit}
.topbar{background:var(--navy);color:#fff;font-size:.77rem;padding:9px 24px;text-align:center}
.topbar strong{color:var(--gold)}
header{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray200);padding:0 32px}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:66px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;background:linear-gradient(135deg,var(--navy),var(--blue));border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-serif);font-size:1rem;font-weight:700;flex-shrink:0}
.logo-text{font-family:var(--font-serif);font-size:1.5rem;color:var(--navy);font-weight:700;line-height:1.2}
.logo-text span.logo-opa{color:var(--navy);font-family:var(--font-serif);font-weight:700}
.logo-text span.logo-biz{color:#2563EB;font-family:var(--font-serif);font-weight:700}
.lang-toggle{display:flex;background:var(--gray100);border-radius:20px;padding:3px;gap:2px}
.lang-btn{padding:5px 12px;border-radius:16px;border:none;cursor:pointer;font-size:.77rem;font-weight:600;font-family:inherit;transition:all .2s;color:var(--gray400);background:transparent}
.lang-btn.active{background:var(--navy);color:#fff}
.af-page{max-width:640px;margin:0 auto;padding:56px 24px 80px;flex:1;width:100%}
.af-badge{display:inline-block;background:var(--blue-light);color:var(--blue);font-size:.7rem;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px}
.af-card{text-align:center}
.af-card h1{font-size:clamp(1.8rem,4vw,2.4rem);color:var(--navy);font-weight:800;letter-spacing:-.5px;margin-bottom:14px}
.af-card p.lead{font-size:1.02rem;color:var(--gray600);line-height:1.65;max-width:520px;margin:0 auto 26px}
.af-mode-toggle{display:flex;gap:8px;max-width:440px;margin:0 auto 28px;background:var(--gray100);border-radius:12px;padding:4px}
.af-mode-btn{flex:1;padding:11px 12px;border-radius:9px;border:none;cursor:pointer;font-family:inherit;font-size:.85rem;font-weight:700;color:var(--gray500);background:transparent;transition:all .15s}
.af-mode-btn.active{background:#fff;color:var(--navy);box-shadow:0 1px 4px rgba(28,46,68,.12)}
.af-bullets{list-style:none;text-align:left;max-width:440px;margin:0 auto 30px;display:flex;flex-direction:column;gap:10px}
.af-bullets li{display:flex;align-items:flex-start;gap:10px;font-size:.92rem;color:var(--gray600)}
.af-bullets li::before{content:'✓';color:var(--blue);font-weight:700;flex-shrink:0}
.af-form{display:flex;flex-direction:column;gap:10px;max-width:380px;margin:0 auto}
.af-input{width:100%;font-family:inherit;font-size:.95rem;color:var(--gray800);border:1.5px solid var(--gray200);border-radius:9px;padding:13px 16px;background:var(--gray50);transition:all .15s}
.af-input:focus{outline:none;border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
.af-submit{width:100%;background:#fff;color:var(--blue);border:1.5px solid var(--blue);padding:13px 24px;border-radius:9px;font-size:.92rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap}
.af-submit:hover:not(:disabled){background:var(--blue-light)}
.af-submit:disabled{opacity:.6;cursor:not-allowed}
.af-error{margin-top:14px;background:#FEE2E2;border:1px solid #FCA5A5;color:#991B1B;border-radius:9px;padding:10px 14px;font-size:.85rem;display:none;max-width:380px;margin-left:auto;margin-right:auto}
.af-error.show{display:block}
.af-payout-note{margin-top:20px;background:var(--gray50);border:1px solid var(--gray200);border-radius:9px;padding:12px 16px;font-size:.8rem;color:var(--gray600);max-width:420px;margin-left:auto;margin-right:auto;text-align:left}
.af-success{display:none;flex-direction:column;align-items:center;text-align:center;padding:30px 20px}
.af-success.show{display:flex}
.af-success .icon{font-size:3rem;margin-bottom:10px}
.af-success h2{font-size:1.5rem;color:var(--navy);font-weight:800;margin-bottom:10px}
.af-success p{font-size:.95rem;color:var(--gray600);line-height:1.65;max-width:420px}
.en{display:block}.es{display:none}
.en-inline{display:inline}.es-inline{display:none}
footer{background:var(--navy);color:rgba(255,255,255,.55);padding:40px 32px 22px;margin-top:auto}
@media(max-width:768px){footer{padding-bottom:calc(170px + env(safe-area-inset-bottom,0px))}}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-divider{border:none;border-top:1px solid rgba(255,255,255,.1);margin-bottom:18px}
.footer-bottom{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px}
.footer-copy{font-size:.73rem;color:rgba(255,255,255,.35)}
.footer-links{display:flex;gap:14px;flex-wrap:wrap;margin-top:5px}
.footer-links a{font-size:.75rem;color:rgba(255,255,255,.4);transition:color .2s}
.footer-links a:hover{color:#fff}
.footer-disclaimer{font-size:.7rem;color:rgba(255,255,255,.28);max-width:540px;line-height:1.6}
@media(max-width:600px){.af-page{padding:40px 18px 60px}.af-input,.af-submit{font-size:16px}.af-mode-btn{font-size:.78rem;padding:10px 8px}}
`
  const body = `
<div class="topbar"><span class="en-inline">Florida's trusted business formation experts &mdash; <strong>LLC &amp; Corporation</strong> filing made simple.</span><span class="es-inline" style="display:none">Expertos de confianza en formaci&oacute;n de empresas en Florida &mdash; <strong>LLC y Corporaci&oacute;n</strong> de manera sencilla.</span></div>
<header>
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-mark">OB</div>
      <div class="logo-text"><span class="logo-opa">Opa</span><span class="logo-biz">Biz</span></div>
    </a>
    <div class="lang-toggle">
      <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
      <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
    </div>
  </div>
</header>

<div class="af-page">
  <div class="af-card" id="af-card">
    <div class="af-badge en-inline" id="af-badge-en">Affiliate Program</div><div class="af-badge es-inline" id="af-badge-es" style="display:none">Programa de Afiliados</div>
    <h1 class="en">Partner with OpaBiz.</h1>
    <h1 class="es" style="display:none">Sea socio de OpaBiz.</h1>
    <p class="lead en">Choose how you'd like to work with us: refer clients as an affiliate, or join our team as a field agent.</p>
    <p class="lead es" style="display:none">Elija c&oacute;mo quiere trabajar con nosotros: refiera clientes como afiliado, o &uacute;nase a nuestro equipo como agente de campo.</p>

    <div class="af-mode-toggle">
      <button class="af-mode-btn active en-inline" id="af-mode-btn-affiliate" onclick="afSetMode('affiliate')">Apply as Affiliate</button>
      <button class="af-mode-btn active es-inline" id="af-mode-btn-affiliate-es" style="display:none" onclick="afSetMode('affiliate')">Aplicar como Afiliado</button>
      <button class="af-mode-btn en-inline" id="af-mode-btn-agent" onclick="afSetMode('agent')">Apply as Field Agent</button>
      <button class="af-mode-btn es-inline" id="af-mode-btn-agent-es" style="display:none" onclick="afSetMode('agent')">Aplicar como Agente</button>
    </div>

    <div id="af-bullets-affiliate">
      <ul class="af-bullets en">
        <li>Your own coupon code: 10% off for your referrals</li>
        <li>15% commission on the service fees of every order that uses it</li>
      </ul>
      <ul class="af-bullets es" style="display:none">
        <li>Su propio c&oacute;digo de cup&oacute;n: 10% de descuento para sus referidos</li>
        <li>15% de comisi&oacute;n sobre las tarifas de servicio de cada orden que lo use</li>
      </ul>
    </div>
    <div id="af-bullets-agent" style="display:none">
      <ul class="af-bullets en">
        <li>In person or remotely, you fill out the application with the client and guide them through the process</li>
        <li>You then send them their order, ready to review and pay securely by email</li>
        <li>25% commission on the service fees of every order you assist. These orders don't include a coupon discount for the client</li>
        <li>Full training and ongoing support from our team, always</li>
      </ul>
      <ul class="af-bullets es" style="display:none">
        <li>En persona o de forma remota, completa la solicitud junto al cliente y lo gu&iacute;a durante el proceso</li>
        <li>Luego le env&iacute;a la orden lista para revisar y pagar de forma segura por correo</li>
        <li>25% de comisi&oacute;n sobre las tarifas de servicio de cada orden que asiste. Estas &oacute;rdenes no incluyen descuento de cup&oacute;n para el cliente</li>
        <li>Training completo y soporte continuo de nuestro equipo, siempre</li>
      </ul>
    </div>

    <form id="af-form" onsubmit="return afSubmit(event)" novalidate>
      <div class="af-form">
        <input class="af-input" id="af-name" type="text" required maxlength="100" autocomplete="name" placeholder="Full Name"/>
        <input class="af-input" id="af-email" type="email" required maxlength="200" autocomplete="email" name="username" placeholder="you@email.com"/>
        <input class="af-input" id="af-phone" type="tel" required maxlength="50" autocomplete="tel" placeholder="Phone Number"/>
        <input class="af-input" id="af-ptin" type="text" required maxlength="9" placeholder="PTIN (ej. P12345678)"/>
        <button class="af-submit" id="af-submit" type="submit">
          <span class="en-inline">Apply now</span><span class="es-inline" style="display:none">Aplicar ahora</span>
        </button>
      </div>
      <div class="af-error" id="af-error"></div>
    </form>
    <div class="af-payout-note en">Payouts are issued once you reach $200 in accumulated commission, or 2 months after your first order, whichever comes first.</div>
    <div class="af-payout-note es" style="display:none">Los pagos se realizan al alcanzar $200 en comisiones acumuladas, o a los 2 meses de colocada la primera orden, lo que ocurra primero.</div>
  </div>

  <div class="af-success" id="af-success">
    <div class="icon">&#127881;</div>
    <h2 class="en">Application received!</h2>
    <h2 class="es" style="display:none">&iexcl;Aplicaci&oacute;n recibida!</h2>
    <p class="en">Your application is being reviewed by our team of specialists. We'll be in touch by email with the next steps.</p>
    <p class="es" style="display:none">Su aplicaci&oacute;n est&aacute; siendo revisada por nuestro equipo de especialistas. Nos vamos a comunicar por correo con los pr&oacute;ximos pasos.</p>
  </div>
</div>

<footer>
  <div class="footer-inner">
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div>
        <div class="footer-copy">&#169; 2026 Florida Business Formation Center &middot; opabiz.com &middot; All Rights Reserved.</div>
        <div class="footer-links" style="margin-top:6px">
          <a href="/terms" data-en="Terms &amp; Conditions" data-es="T&eacute;rminos y Condiciones">Terms &amp; Conditions</a>
          <a href="/privacy" data-en="Privacy Policy" data-es="Pol&iacute;tica de Privacidad">Privacy Policy</a>
          <a href="/legal" data-en="Legal Disclaimer" data-es="Aviso Legal">Legal Disclaimer</a>
        </div>
      </div>
      <div class="footer-disclaimer">
        <strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>
        OpaBiz is a trade name of Florida Business Formation Center &mdash; a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice.
      </div>
    </div>
  </div>
</footer>

<script>
var afMode = 'affiliate';

function setLang(lang){
  localStorage.setItem('flbc_lang', lang);
  var isEs = lang === 'es';
  document.getElementById('btn-en').classList.toggle('active', lang==='en');
  document.getElementById('btn-es').classList.toggle('active', lang==='es');
  document.querySelectorAll('.en').forEach(function(el){ el.style.display = isEs ? 'none' : 'block'; });
  document.querySelectorAll('.es').forEach(function(el){ el.style.display = isEs ? 'block' : 'none'; });
  document.querySelectorAll('.en-inline').forEach(function(el){ el.style.display = isEs ? 'none' : 'inline'; });
  document.querySelectorAll('.es-inline').forEach(function(el){ el.style.display = isEs ? 'inline' : 'none'; });
  var placeholders = {
    'af-name': isEs ? 'Nombre Completo' : 'Full Name',
    'af-phone': isEs ? 'N\\u00famero de Tel\\u00e9fono' : 'Phone Number',
  };
  Object.keys(placeholders).forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.placeholder = placeholders[id];
  });
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){
    el.innerHTML = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });
  afSyncModeButtons();
}

function afSyncModeButtons(){
  document.querySelectorAll('#af-mode-btn-affiliate, #af-mode-btn-affiliate-es').forEach(function(el){ el.classList.toggle('active', afMode==='affiliate'); });
  document.querySelectorAll('#af-mode-btn-agent, #af-mode-btn-agent-es').forEach(function(el){ el.classList.toggle('active', afMode==='agent'); });
}

function afSetMode(mode){
  afMode = mode;
  afSyncModeButtons();
  document.getElementById('af-bullets-affiliate').style.display = mode==='affiliate' ? 'block' : 'none';
  document.getElementById('af-bullets-agent').style.display = mode==='agent' ? 'block' : 'none';
}

async function afSubmit(ev){
  ev.preventDefault();
  var isEs = document.getElementById('btn-es').classList.contains('active');
  var btn = document.getElementById('af-submit');
  var errBox = document.getElementById('af-error');
  var name = document.getElementById('af-name').value.trim();
  var email = document.getElementById('af-email').value.trim();
  var phone = document.getElementById('af-phone').value.trim();
  var ptin = document.getElementById('af-ptin').value.trim().toUpperCase();
  errBox.classList.remove('show'); errBox.textContent = '';
  if(!name || !email || !phone || !ptin){
    errBox.textContent = isEs ? 'Por favor complete todos los campos.' : 'Please fill in all fields.';
    errBox.classList.add('show');
    return false;
  }
  if(!/^P\\d{8}$/.test(ptin)){
    errBox.textContent = isEs ? 'El PTIN no es v\\u00e1lido. Debe ser la letra P seguida de 8 d\\u00edgitos (ej. P12345678).' : 'That PTIN is not valid. It should be the letter P followed by 8 digits (e.g. P12345678).';
    errBox.classList.add('show');
    return false;
  }
  btn.disabled = true;
  var origLabel = btn.innerHTML;
  btn.innerHTML = isEs ? 'Enviando...' : 'Sending...';
  try {
    var res = await fetch('/api/affiliates/apply', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: name, email: email, phone: phone, ptin: ptin, type: afMode, brand: 'opabiz', lang: isEs ? 'es' : 'en' })
    });
    var json = await res.json().catch(function(){ return {}; });
    if(!res.ok || !json.success){
      var msg = json.error || (isEs ? 'No pudimos enviar tu aplicaci\\u00f3n. Intent\\u00e1 de nuevo.' : 'We could not submit your application. Please try again.');
      if(res.status === 429) msg = isEs ? 'Demasiados intentos. Prob\\u00e1 de nuevo en un rato.' : 'Too many attempts. Please try again later.';
      throw new Error(msg);
    }
    document.getElementById('af-card').style.display = 'none';
    document.getElementById('af-success').classList.add('show');
    window.scrollTo({top:0,behavior:'smooth'});
  } catch(err){
    errBox.textContent = err.message || (isEs ? 'Error de red. Verifica tu conexi\\u00f3n.' : 'Network error. Check your connection.');
    errBox.classList.add('show');
    btn.disabled = false;
    btn.innerHTML = origLabel;
  }
  return false;
}

( function(){var p=new URLSearchParams(window.location.search);var l=p.get('lang')||localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();
</script>
`
  return (
    <>
      <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
      <ChatWidget />
    </>
  )
}
