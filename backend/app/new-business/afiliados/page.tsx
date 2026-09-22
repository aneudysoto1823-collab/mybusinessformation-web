import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate Program | Florida Business Formation Center',
  description:
    'Refer clients to Florida Business Formation Center with your own coupon code, give them a discount, and earn commission on every order.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://mybusinessformation.com/afiliados' },
}

// Clon de /afiliados re-marcado para mybusinessformation.com (mismo patrón
// que new-business/contact/page.tsx) — sello + "Florida Business Formation
// Center" en vez del logo "OB" de OpaBiz, sin ChatWidget (Claudia está
// hardcodeada para formación, no aplica acá).
export default function NewBusinessAfiliadosPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-dark:#1D4ED8;--blue-light:#EFF6FF;--gold:#F59E0B;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray300:#CBD5E1;--gray400:#94A3B8;--gray500:#64748B;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-sans);color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3,h4{font-family:var(--font-serif);line-height:1.2}
a{text-decoration:none;color:inherit}
header{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray200);padding:0 32px}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:66px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;flex-shrink:0}
.logo-mark img{width:100%;height:100%;object-fit:contain}
.logo-text{font-family:var(--font-serif);font-size:1.05rem;color:var(--navy);font-weight:700;line-height:1.2}
.lang-toggle{display:flex;background:var(--gray100);border-radius:20px;padding:3px;gap:2px}
.lang-btn{padding:5px 12px;border-radius:16px;border:none;cursor:pointer;font-size:.77rem;font-weight:600;font-family:inherit;transition:all .2s;color:var(--gray400);background:transparent}
.lang-btn.active{background:var(--navy);color:#fff}
.af-page{max-width:640px;margin:0 auto;padding:56px 24px 80px;flex:1;width:100%}
.af-badge{display:inline-block;background:var(--blue-light);color:var(--blue);font-size:.7rem;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px}
.af-card{text-align:center}
.af-card h1{font-size:clamp(1.8rem,4vw,2.4rem);color:var(--navy);font-weight:800;letter-spacing:-.5px;margin-bottom:14px}
.af-card p.lead{font-size:1.02rem;color:var(--gray600);line-height:1.65;max-width:520px;margin:0 auto 26px}
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
.af-agent-section{margin-top:56px;padding-top:40px;border-top:1px solid var(--gray200);text-align:center}
.af-agent-toggle{background:var(--gray50);border:1.5px solid var(--gray200);color:var(--navy);padding:12px 24px;border-radius:9px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit}
.af-agent-toggle:hover{background:var(--gray100)}
.af-agent-form{display:none;max-width:380px;margin:22px auto 0;flex-direction:column;gap:10px}
.af-agent-form.show{display:flex}
.af-agent-success{display:none;padding:16px;color:var(--gray600);font-size:.9rem}
.af-agent-success.show{display:block}
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
@media(max-width:600px){.af-page{padding:40px 18px 60px}.af-input,.af-submit{font-size:16px}}
`
  const body = `
<header>
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-mark"><img src="/fbfc-seal.png" alt="Florida Business Formation Center"/></div>
      <div class="logo-text">Florida Business Formation Center</div>
    </a>
    <div class="lang-toggle">
      <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
      <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
    </div>
  </div>
</header>

<div class="af-page">
  <div class="af-card" id="af-card">
    <div class="af-badge en-inline">Affiliate Program</div><div class="af-badge es-inline" style="display:none">Programa de Afiliados</div>
    <h1 class="en">Refer clients. Give them a discount. Earn commission.</h1>
    <h1 class="es" style="display:none">Refier&aacute; clientes. D&eacute;les un descuento. Gane comisi&oacute;n.</h1>
    <p class="lead en">If you have a PTIN, apply to get your own coupon code. Your referrals get 10% off, and you earn commission on every order that uses it.</p>
    <p class="lead es" style="display:none">Si tiene un PTIN, aplique para obtener su propio c&oacute;digo de cup&oacute;n. Sus referidos reciben 10% de descuento, y usted gana comisi&oacute;n en cada orden que lo use.</p>

    <ul class="af-bullets en">
      <li>Your own coupon code — 10% off for your referrals</li>
      <li>15% commission on the service fees of every order that uses it</li>
      <li>Applications are reviewed manually, usually within a few days</li>
    </ul>
    <ul class="af-bullets es" style="display:none">
      <li>Su propio c&oacute;digo de cup&oacute;n &mdash; 10% de descuento para sus referidos</li>
      <li>15% de comisi&oacute;n sobre las tarifas de servicio de cada orden que lo use</li>
      <li>Las aplicaciones se revisan manualmente, usualmente en pocos d&iacute;as</li>
    </ul>

    <form id="af-form" onsubmit="return afSubmit(event)" novalidate>
      <div class="af-form">
        <input class="af-input" id="af-name" type="text" required maxlength="100" autocomplete="name" placeholder="Full Name"/>
        <input class="af-input" id="af-email" type="email" required maxlength="200" autocomplete="email" name="username" placeholder="you@email.com"/>
        <input class="af-input" id="af-phone" type="tel" required maxlength="50" autocomplete="tel" placeholder="Phone Number"/>
        <input class="af-input" id="af-ptin" type="text" required maxlength="50" placeholder="PTIN"/>
        <button class="af-submit" id="af-submit" type="submit">
          <span class="en-inline">Apply now</span><span class="es-inline" style="display:none">Aplicar ahora</span>
        </button>
      </div>
      <div class="af-error" id="af-error"></div>
    </form>
    <div class="af-payout-note en">Payouts are issued once you reach $200 in accumulated commission, or 3 months after your first referred order, whichever comes first.</div>
    <div class="af-payout-note es" style="display:none">Los pagos se realizan al alcanzar $200 en comisiones acumuladas, o a los 3 meses de colocada la primera orden referida, lo que ocurra primero.</div>
  </div>

  <div class="af-success" id="af-success">
    <div class="icon">&#127881;</div>
    <h2 class="en">Application received!</h2>
    <h2 class="es" style="display:none">&iexcl;Aplicaci&oacute;n recibida!</h2>
    <p class="en">We'll review your application and get back to you by email in the next few days.</p>
    <p class="es" style="display:none">Vamos a revisar su aplicaci&oacute;n y le responderemos por correo en los pr&oacute;ximos d&iacute;as.</p>
  </div>

  <div class="af-agent-section" id="af-agent-section">
    <button class="af-agent-toggle en-inline" onclick="afShowAgentForm()">Want to become a field agent instead?</button>
    <button class="af-agent-toggle es-inline" style="display:none" onclick="afShowAgentForm()">&iquest;Quiere convertirse en agente en su lugar?</button>
    <form id="af-agent-form" class="af-agent-form" onsubmit="return afAgentSubmit(event)" novalidate>
      <input class="af-input" id="ai-name" type="text" required maxlength="100" autocomplete="name" placeholder="Full Name"/>
      <input class="af-input" id="ai-email" type="email" required maxlength="200" autocomplete="email" placeholder="you@email.com"/>
      <input class="af-input" id="ai-phone" type="tel" required maxlength="50" autocomplete="tel" placeholder="Phone Number"/>
      <button class="af-submit" id="ai-submit" type="submit">
        <span class="en-inline">Send my info</span><span class="es-inline" style="display:none">Enviar mis datos</span>
      </button>
      <div class="af-error" id="ai-error"></div>
    </form>
    <div class="af-agent-success" id="af-agent-success">
      <span class="en">Thanks! Our team will reach out to you soon.</span>
      <span class="es" style="display:none">&iexcl;Gracias! Nuestro equipo se pondr&aacute; en contacto pronto.</span>
    </div>
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
        <div style="margin-top:8px;font-size:0.77rem;color:rgba(255,255,255,0.45)"><a href="mailto:info@mybusinessformation.com" style="color:inherit">info@mybusinessformation.com</a></div>
      </div>
      <div class="footer-disclaimer">
        <strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>
        Florida Business Formation Center is a privately owned third-party document preparation service and is not affiliated with or endorsed by any government agency, including the IRS, Department of Labor, or Florida Department of State. This is a solicitation for services, not an official government notice. Fees include administrative and processing costs. All sales are final and non-refundable. Business registration data is sourced from public records.
      </div>
    </div>
  </div>
</footer>

<script>
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
    'ai-name': isEs ? 'Nombre Completo' : 'Full Name',
    'ai-phone': isEs ? 'N\\u00famero de Tel\\u00e9fono' : 'Phone Number',
  };
  Object.keys(placeholders).forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.placeholder = placeholders[id];
  });
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){
    el.innerHTML = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });
}

function afShowAgentForm(){
  document.getElementById('af-agent-form').classList.add('show');
  document.querySelectorAll('.af-agent-toggle').forEach(function(el){ el.style.display = 'none'; });
}

async function afSubmit(ev){
  ev.preventDefault();
  var isEs = document.getElementById('btn-es').classList.contains('active');
  var btn = document.getElementById('af-submit');
  var errBox = document.getElementById('af-error');
  var name = document.getElementById('af-name').value.trim();
  var email = document.getElementById('af-email').value.trim();
  var phone = document.getElementById('af-phone').value.trim();
  var ptin = document.getElementById('af-ptin').value.trim();
  errBox.classList.remove('show'); errBox.textContent = '';
  if(!name || !email || !phone || !ptin){
    errBox.textContent = isEs ? 'Por favor complete todos los campos.' : 'Please fill in all fields.';
    errBox.classList.add('show');
    return false;
  }
  btn.disabled = true;
  var origLabel = btn.innerHTML;
  btn.innerHTML = isEs ? 'Enviando...' : 'Sending...';
  try {
    var res = await fetch('/api/affiliates/apply' + (isEs ? '?lang=es' : ''), {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: name, email: email, phone: phone, ptin: ptin, brand: 'fbfc' })
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

async function afAgentSubmit(ev){
  ev.preventDefault();
  var isEs = document.getElementById('btn-es').classList.contains('active');
  var btn = document.getElementById('ai-submit');
  var errBox = document.getElementById('ai-error');
  var name = document.getElementById('ai-name').value.trim();
  var email = document.getElementById('ai-email').value.trim();
  var phone = document.getElementById('ai-phone').value.trim();
  errBox.classList.remove('show'); errBox.textContent = '';
  if(!name || !email || !phone){
    errBox.textContent = isEs ? 'Por favor complete todos los campos.' : 'Please fill in all fields.';
    errBox.classList.add('show');
    return false;
  }
  btn.disabled = true;
  var origLabel = btn.innerHTML;
  btn.innerHTML = isEs ? 'Enviando...' : 'Sending...';
  try {
    var res = await fetch('/api/affiliates/agent-interest' + (isEs ? '?lang=es' : ''), {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: name, email: email, phone: phone, brand: 'fbfc' })
    });
    var json = await res.json().catch(function(){ return {}; });
    if(!res.ok || !json.success){
      var msg = json.error || (isEs ? 'No pudimos enviar tus datos. Intent\\u00e1 de nuevo.' : 'We could not submit your info. Please try again.');
      if(res.status === 429) msg = isEs ? 'Demasiados intentos. Prob\\u00e1 de nuevo en un rato.' : 'Too many attempts. Please try again later.';
      throw new Error(msg);
    }
    document.getElementById('af-agent-form').classList.remove('show');
    document.getElementById('af-agent-success').classList.add('show');
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
  return <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
}
