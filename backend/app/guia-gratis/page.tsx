import type { Metadata } from 'next'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'Free Guide — Form Your LLC or Corporation in Florida | OpaBiz',
  description:
    'Get our free step-by-step guide to forming an LLC or Corporation in Florida: naming, registered agent, EIN, Operating Agreement, licenses and more.',
  alternates: {
    canonical: 'https://opabiz.com/guia-gratis',
    languages: {
      'en-US': 'https://opabiz.com/guia-gratis',
      'es-US': 'https://opabiz.com/guia-gratis?lang=es',
    },
  },
  openGraph: {
    url: 'https://opabiz.com/guia-gratis',
    title: 'Free Guide — Form Your LLC or Corporation in Florida | OpaBiz',
    description:
      'Get our free step-by-step guide to forming an LLC or Corporation in Florida.',
  },
}

export default function GuiaGratisPage() {
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
/* PAGE */
.gg-page{max-width:640px;margin:0 auto;padding:56px 24px 80px;flex:1;width:100%}
.gg-badge{display:inline-block;background:var(--blue-light);color:var(--blue);font-size:.7rem;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px}
.gg-card{text-align:center}
.gg-card h1{font-size:clamp(1.8rem,4vw,2.4rem);color:var(--navy);font-weight:800;letter-spacing:-.5px;margin-bottom:14px}
.gg-card p.lead{font-size:1.02rem;color:var(--gray600);line-height:1.65;max-width:520px;margin:0 auto 26px}
.gg-bullets{list-style:none;text-align:left;max-width:420px;margin:0 auto 30px;display:flex;flex-direction:column;gap:10px}
.gg-bullets li{display:flex;align-items:flex-start;gap:10px;font-size:.92rem;color:var(--gray600)}
.gg-bullets li::before{content:'✓';color:var(--blue);font-weight:700;flex-shrink:0}
.gg-form{display:flex;flex-direction:column;gap:10px;max-width:380px;margin:0 auto}
.gg-input{width:100%;font-family:inherit;font-size:.95rem;color:var(--gray800);border:1.5px solid var(--gray200);border-radius:9px;padding:13px 16px;background:var(--gray50);transition:all .15s}
.gg-input:focus{outline:none;border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
.gg-submit{width:100%;background:#fff;color:var(--blue);border:1.5px solid var(--blue);padding:13px 24px;border-radius:9px;font-size:.92rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap}
.gg-submit:hover:not(:disabled){background:var(--blue-light)}
.gg-submit:disabled{opacity:.6;cursor:not-allowed}
.gg-error{margin-top:14px;background:#FEE2E2;border:1px solid #FCA5A5;color:#991B1B;border-radius:9px;padding:10px 14px;font-size:.85rem;display:none;max-width:380px;margin-left:auto;margin-right:auto}
.gg-error.show{display:block}
.gg-meta{margin-top:16px;font-size:.76rem;color:var(--gray400)}
.gg-success{display:none;flex-direction:column;align-items:center;text-align:center;padding:30px 20px}
.gg-success.show{display:flex}
.gg-success .icon{font-size:3rem;margin-bottom:10px}
.gg-success h2{font-size:1.5rem;color:var(--navy);font-weight:800;margin-bottom:10px}
.gg-success p{font-size:.95rem;color:var(--gray600);line-height:1.65;max-width:420px}
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
@media(max-width:600px){.gg-page{padding:40px 18px 60px}.gg-input,.gg-submit{font-size:16px}}
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

<div class="gg-page">
  <div class="gg-card" id="gg-card">
    <div class="gg-badge en-inline">Free Guide</div><div class="gg-badge es-inline" style="display:none">Gu&iacute;a Gratis</div>
    <h1 class="en">Form your LLC or Corporation in Florida &mdash; the right way.</h1>
    <h1 class="es" style="display:none">Forme su LLC o Corporaci&oacute;n en Florida &mdash; de la forma correcta.</h1>
    <p class="lead en">Get our free step-by-step guide, straight to your inbox. No jargon, real examples, and links to every service you might need along the way.</p>
    <p class="lead es" style="display:none">Reciba nuestra gu&iacute;a gratuita paso a paso, directo a su correo. Sin tecnicismos, con ejemplos reales, y enlaces a cada servicio que pueda necesitar en el camino.</p>

    <ul class="gg-bullets en">
      <li>Choosing a name &amp; the right entity type</li>
      <li>Registered Agent, EIN &amp; Operating Agreement, explained simply</li>
      <li>Licenses, sales tax &amp; common mistakes to avoid</li>
    </ul>
    <ul class="gg-bullets es" style="display:none">
      <li>C&oacute;mo elegir el nombre y el tipo de entidad correcto</li>
      <li>Agente Registrado, EIN y Operating Agreement, explicados simple</li>
      <li>Licencias, impuesto sobre ventas y errores comunes a evitar</li>
    </ul>

    <form id="gg-form" onsubmit="return ggSubmit(event)" novalidate>
      <div class="gg-form">
        <input class="gg-input" id="gg-name" type="text" required maxlength="100" autocomplete="name" placeholder="Full Name"/>
        <input class="gg-input" id="gg-email" type="email" required maxlength="200" autocomplete="email" name="username" placeholder="you@email.com"/>
        <button class="gg-submit" id="gg-submit" type="submit">
          <span class="en-inline">Send me the guide</span><span class="es-inline" style="display:none">Enviarme la gu&iacute;a</span>
        </button>
      </div>
      <div class="gg-error" id="gg-error"></div>
    </form>
    <p class="gg-meta en">We respect your privacy. Your email is only used to send you the guide.</p>
    <p class="gg-meta es" style="display:none">Respetamos su privacidad. Su correo solo se usa para enviarle la gu&iacute;a.</p>
  </div>

  <div class="gg-success" id="gg-success">
    <div class="icon">&#127881;</div>
    <h2 class="en">Check your inbox!</h2>
    <h2 class="es" style="display:none">&iexcl;Revise su correo!</h2>
    <p class="en" id="gg-success-msg">We just sent the guide to your email. If you don't see it in a minute, check your spam folder.</p>
    <p class="es" id="gg-success-msg-es" style="display:none">Le acabamos de enviar la gu&iacute;a a su correo. Si no la ve en un minuto, revise la carpeta de spam.</p>
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
function setLang(lang){
  localStorage.setItem('flbc_lang', lang);
  var isEs = lang === 'es';
  document.getElementById('btn-en').classList.toggle('active', lang==='en');
  document.getElementById('btn-es').classList.toggle('active', lang==='es');
  document.querySelectorAll('.en').forEach(function(el){ el.style.display = isEs ? 'none' : 'block'; });
  document.querySelectorAll('.es').forEach(function(el){ el.style.display = isEs ? 'block' : 'none'; });
  document.querySelectorAll('.en-inline').forEach(function(el){ el.style.display = isEs ? 'none' : 'inline'; });
  document.querySelectorAll('.es-inline').forEach(function(el){ el.style.display = isEs ? 'inline' : 'none'; });
  var nameInput = document.getElementById('gg-name');
  if(nameInput) nameInput.placeholder = isEs ? 'Nombre Completo' : 'Full Name';
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){
    el.innerHTML = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });
}

async function ggSubmit(ev){
  ev.preventDefault();
  var isEs = document.getElementById('btn-es').classList.contains('active');
  var btn = document.getElementById('gg-submit');
  var errBox = document.getElementById('gg-error');
  var name = document.getElementById('gg-name').value.trim();
  var email = document.getElementById('gg-email').value.trim();
  errBox.classList.remove('show'); errBox.textContent = '';
  if(!name){
    errBox.textContent = isEs ? 'Por favor ingrese su nombre.' : 'Please enter your name.';
    errBox.classList.add('show');
    return false;
  }
  if(!email){
    errBox.textContent = isEs ? 'Por favor ingrese su correo.' : 'Please enter your email.';
    errBox.classList.add('show');
    return false;
  }
  btn.disabled = true;
  var origLabel = btn.innerHTML;
  btn.innerHTML = isEs ? 'Enviando...' : 'Sending...';
  try {
    var res = await fetch('/api/guides/request', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: name, email: email, lang: isEs ? 'es' : 'en' })
    });
    var json = await res.json().catch(function(){ return {}; });
    if(!res.ok || !json.success){
      var msg = json.error || (isEs ? 'No pudimos enviar la gu\\u00eda. Intenta de nuevo.' : 'We could not send the guide. Please try again.');
      if(res.status === 429) msg = isEs ? 'Demasiados intentos. Prob\\u00e1 de nuevo en un rato.' : 'Too many attempts. Please try again later.';
      throw new Error(msg);
    }
    if(json.message){
      document.getElementById('gg-success-msg').textContent = json.message;
      document.getElementById('gg-success-msg-es').textContent = json.message;
    }
    document.getElementById('gg-card').style.display = 'none';
    document.getElementById('gg-success').classList.add('show');
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
