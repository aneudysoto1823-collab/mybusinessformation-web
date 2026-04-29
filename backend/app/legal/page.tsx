import ChatWidget from '@/components/ChatWidget'

export default function LegalPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--gold:#F59E0B;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',sans-serif;color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3,h4{font-family:'Fraunces',serif;line-height:1.2}
a{text-decoration:none;color:inherit}
.topbar{background:var(--navy);color:#fff;font-size:.77rem;padding:9px 24px;text-align:center}
.topbar strong{color:var(--gold)}
header{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray200);padding:0 32px;transition:box-shadow .3s}
header.scrolled{box-shadow:0 2px 20px rgba(28,46,68,.1)}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:66px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;background:linear-gradient(135deg,var(--navy),var(--blue));border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Fraunces',serif;font-size:1rem;font-weight:700;flex-shrink:0}
.logo-text{font-family:'Fraunces',serif;font-size:.95rem;color:var(--navy);font-weight:700;line-height:1.2}
.logo-text span{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:.63rem;color:var(--gray400);font-weight:400;letter-spacing:.8px;text-transform:uppercase}
nav a{font-size:.82rem;font-weight:500;color:var(--gray600);padding:6px 10px;border-radius:6px;transition:all .2s;margin-left:2px}
nav a:hover{color:var(--navy);background:var(--gray100)}
.lang-toggle{display:flex;background:var(--gray100);border-radius:20px;padding:3px;gap:2px}
.lang-btn{padding:5px 12px;border-radius:16px;border:none;cursor:pointer;font-size:.77rem;font-weight:600;font-family:inherit;transition:all .2s;color:var(--gray400);background:transparent}
.lang-btn.active{background:var(--navy);color:#fff}
.btn-start{background:var(--green);color:#fff;padding:9px 18px;border-radius:8px;font-size:.85rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-start:hover{background:var(--green-dark)}
/* HERO */
.page-hero{background:linear-gradient(135deg,var(--navy) 0%,#1a3a6b 100%);padding:64px 32px 56px;color:#fff;position:relative;overflow:hidden}
.page-hero::after{content:'';position:absolute;right:-80px;top:-80px;width:360px;height:360px;background:radial-gradient(circle,rgba(37,99,235,.2) 0%,transparent 70%);pointer-events:none}
.page-hero-inner{max-width:1280px;margin:0 auto;position:relative;z-index:1}
.breadcrumb{display:flex;align-items:center;gap:7px;font-size:.74rem;color:rgba(255,255,255,.5);margin-bottom:16px}
.breadcrumb a{color:rgba(255,255,255,.5);transition:color .2s}
.breadcrumb a:hover{color:#fff}
.hero-badge{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.9);font-size:.7rem;font-weight:600;padding:4px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px}
.page-hero h1{font-size:clamp(2rem,4vw,3rem);font-weight:900;margin-bottom:12px;letter-spacing:-.5px}
.page-hero p{font-size:.9rem;color:rgba(255,255,255,.65);max-width:560px;line-height:1.75}
.hero-meta{display:flex;align-items:center;gap:16px;margin-top:18px;flex-wrap:wrap}
.hero-meta-item{font-size:.75rem;color:rgba(255,255,255,.5);display:flex;align-items:center;gap:5px}
/* LAYOUT */
.page-layout{max-width:1280px;margin:0 auto;padding:56px 32px 80px;display:grid;grid-template-columns:240px 1fr;gap:48px;flex:1}
@media(max-width:900px){.page-layout{grid-template-columns:1fr;padding:32px 20px 60px}}
/* SIDEBAR */
.sidebar{position:sticky;top:90px;align-self:start}
.sidebar-title{font-size:.71rem;font-weight:600;color:var(--gray400);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px}
.sidebar-nav a{display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--gray600);padding:8px 12px;border-radius:7px;margin-bottom:3px;transition:all .2s;border-left:2px solid transparent}
.sidebar-nav a:hover,.sidebar-nav a.active{color:var(--navy);background:var(--blue-light);border-left-color:var(--blue)}
.sidebar-box{background:var(--green-light);border:1px solid #a7f3d0;border-radius:10px;padding:16px;margin-top:20px}
.sidebar-box h4{font-size:.86rem;color:var(--green-dark);font-weight:600;margin-bottom:6px}
.sidebar-box p{font-size:.77rem;color:var(--green-dark);line-height:1.6;margin-bottom:10px}
.sidebar-box a{display:block;font-size:.8rem;font-weight:600;color:var(--green-dark)}
/* CONTENT */
.doc-content{min-width:0}
.doc-updated{font-size:.75rem;color:var(--gray400);padding-bottom:14px;border-bottom:1px solid var(--gray200);margin-bottom:32px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.doc-section{margin-bottom:36px;scroll-margin-top:90px}
.doc-section h2{font-size:1.2rem;color:var(--navy);font-weight:700;margin-bottom:14px;padding-bottom:9px;border-bottom:2px solid var(--blue-light);display:flex;align-items:center;gap:9px}
.doc-section h3{font-size:.97rem;color:var(--navy);font-weight:600;margin:18px 0 8px}
.doc-section p{font-size:.875rem;color:var(--gray600);line-height:1.82;margin-bottom:10px}
.doc-section ul,.doc-section ol{padding-left:20px;margin-bottom:12px}
.doc-section li{font-size:.875rem;color:var(--gray600);line-height:1.8;margin-bottom:4px}
.info-box{background:var(--blue-light);border-left:3px solid var(--blue);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:var(--navy);line-height:1.7}
.warn-box{background:#FEF3C7;border-left:3px solid var(--gold);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:#92400E;line-height:1.7}
.green-box{background:var(--green-light);border-left:3px solid var(--green);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:var(--green-dark);line-height:1.7}
/* LANG */
.en{display:block}.es{display:none}
/* FOOTER */
footer{background:var(--navy);color:rgba(255,255,255,.55);padding:40px 32px 22px;margin-top:auto}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-divider{border:none;border-top:1px solid rgba(255,255,255,.1);margin-bottom:18px}
.footer-bottom{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px}
.footer-copy{font-size:.73rem;color:rgba(255,255,255,.35)}
.footer-links{display:flex;gap:14px;flex-wrap:wrap;margin-top:5px}
.footer-links a{font-size:.75rem;color:rgba(255,255,255,.4);transition:color .2s}
.footer-links a:hover{color:#fff}
.footer-disclaimer{font-size:.7rem;color:rgba(255,255,255,.28);max-width:540px;line-height:1.6}
.wa-float{position:fixed;bottom:26px;right:26px;z-index:500;background:#25D366;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.5);cursor:pointer;transition:all .25s}
.wa-float:hover{transform:scale(1.1)}
.wa-float svg{width:24px;height:24px;fill:#fff}
`
  const body = `
<div class="topbar">&#127775; Florida's trusted business formation experts &mdash; <strong>LLC &amp; Corporation</strong> filing made simple.</div>
<header id="mainHeader">
  <div class="header-inner">
    <a href="/" class="logo">
      <div class="logo-mark">FL</div>
      <div class="logo-text">Florida Business Formation Center<span>mybusinessformation.com</span></div>
    </a>
    <nav>
      <a href="/" data-en="Home" data-es="Inicio">Home</a>
      <a href="/#pricing" data-en="Packages" data-es="Paquetes">Packages</a>
      <a href="/servicios" data-en="Services" data-es="Servicios">Services</a>
      <a href="/#faq" data-en="FAQ" data-es="Preguntas">FAQ</a>
      <a href="/#contact" data-en="Contact" data-es="Contacto">Contact</a>
    </nav>
    <div style="display:flex;align-items:center;gap:11px">
      <div class="lang-toggle">
        <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
      </div>
      <a href="/"><button class="btn-start">Start My Business &#8594;</button></a>
    </div>
  </div>
</header>
<section class="page-hero">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="/">Home</a> <span>/</span> <span class="en-inline">Legal Disclaimer</span><span class="es-inline" style="display:none">Aviso Legal</span></div>
    <div class="hero-badge">Legal</div>
    <h1 class="en">Legal Disclaimer</h1><h1 class="es" style="display:none">Aviso Legal</h1>
    <p class="en">Important information about the nature of our services and the limits of our role as a document preparation service.</p>
    <p class="es" style="display:none">Informaci&oacute;n importante sobre la naturaleza de nuestros servicios y los l&iacute;mites de nuestro rol como servicio de preparaci&oacute;n de documentos.</p>
  </div>
</section>

<div class="page-layout">
  <aside class="sidebar">
    <div class="sidebar-title en">Contents</div><div class="sidebar-title es" style="display:none">Contenido</div>
    <nav class="sidebar-nav">
      <a href="#not-law-firm" class="active">1. <span class="en-inline">Not a Law Firm</span><span class="es-inline" style="display:none">No Somos Bufete</span></a>
      <a href="#no-advice">2. <span class="en-inline">No Legal Advice</span><span class="es-inline" style="display:none">Sin Asesor&iacute;a Legal</span></a>
      <a href="#accuracy">3. <span class="en-inline">Accuracy of Info</span><span class="es-inline" style="display:none">Exactitud</span></a>
      <a href="#state-fees">4. <span class="en-inline">State Fees &amp; Delays</span><span class="es-inline" style="display:none">Tarifas Estatales</span></a>
      <a href="#no-guarantee">5. <span class="en-inline">No Guarantee</span><span class="es-inline" style="display:none">Sin Garant&iacute;a</span></a>
      <a href="#consult">6. <span class="en-inline">Consult a Professional</span><span class="es-inline" style="display:none">Consulte un Profesional</span></a>
    </nav>
  </aside>

  <div class="doc-content">
    <div class="warn-box en">&#9888; <strong>Please Read Carefully.</strong> This disclaimer governs your use of mybusinessformation.com and all services offered by Florida Business Formation Center.</div>
    <div class="warn-box es" style="display:none">&#9888; <strong>Lea Cuidadosamente.</strong> Este aviso legal rige el uso de mybusinessformation.com y todos los servicios ofrecidos por Florida Business Formation Center.</div>

    <div class="doc-section" id="not-law-firm">
      <h2>1. <span class="en-inline">We Are Not a Law Firm</span><span class="es-inline" style="display:none">No Somos un Bufete de Abogados</span></h2>
      <p class="en">Florida Business Formation Center is a document preparation and filing service. We are <strong>not a law firm</strong> and are not authorized to practice law. Our staff are not attorneys, and no attorney-client relationship is created by your use of our services or this website.</p>
      <p class="es" style="display:none">Florida Business Formation Center es un servicio de preparaci&oacute;n y presentaci&oacute;n de documentos. <strong>No somos un bufete de abogados</strong> y no estamos autorizados a ejercer la abogac&iacute;a. Nuestro personal no son abogados y el uso de nuestros servicios o este sitio web no crea ninguna relaci&oacute;n abogado-cliente.</p>
    </div>

    <div class="doc-section" id="no-advice">
      <h2>2. <span class="en-inline">No Legal, Tax, or Financial Advice</span><span class="es-inline" style="display:none">Sin Asesor&iacute;a Legal, Fiscal ni Financiera</span></h2>
      <p class="en">Nothing on this website or provided through our services constitutes legal, tax, or financial advice. All information is provided for general informational purposes only. We strongly encourage you to consult with qualified legal and tax professionals before making any business decisions.</p>
      <p class="es" style="display:none">Nada en este sitio web ni en nuestros servicios constituye asesor&iacute;a legal, fiscal o financiera. Toda la informaci&oacute;n se proporciona &uacute;nicamente con fines informativos generales. Le recomendamos encarecidamente que consulte con profesionales legales y fiscales calificados antes de tomar cualquier decisi&oacute;n empresarial.</p>
      <div class="warn-box en">&#128204; Choosing between an LLC and a Corporation, tax classification (S-Corp vs C-Corp), and business structure decisions are legal and tax matters that require professional advice.</div>
      <div class="warn-box es" style="display:none">&#128204; Elegir entre una LLC y una Corporaci&oacute;n, la clasificaci&oacute;n fiscal (S-Corp vs C-Corp) y las decisiones de estructura empresarial son asuntos legales y fiscales que requieren asesor&iacute;a profesional.</div>
    </div>

    <div class="doc-section" id="accuracy">
      <h2>3. <span class="en-inline">Accuracy of Information</span><span class="es-inline" style="display:none">Exactitud de la Informaci&oacute;n</span></h2>
      <p class="en">While we strive to provide accurate and current information on this website, we make no warranties or representations regarding the completeness, accuracy, or timeliness of any information. Laws and regulations change frequently, and information may become outdated. Always verify current requirements with the Florida Division of Corporations or a licensed professional.</p>
      <p class="es" style="display:none">Si bien nos esforzamos por proporcionar informaci&oacute;n precisa y actualizada en este sitio web, no ofrecemos garant&iacute;as sobre la integridad, exactitud o actualidad de ninguna informaci&oacute;n. Las leyes y regulaciones cambian con frecuencia y la informaci&oacute;n puede quedar desactualizada. Siempre verifique los requisitos actuales con la Divisi&oacute;n de Corporaciones de Florida o un profesional licenciado.</p>
    </div>

    <div class="doc-section" id="state-fees">
      <h2>4. <span class="en-inline">State Fees &amp; Processing Delays</span><span class="es-inline" style="display:none">Tarifas Estatales y Demoras</span></h2>
      <p class="en">Florida state filing fees are determined by the State of Florida and are subject to change without notice. Processing times are estimates provided by the Florida Division of Corporations and are outside our control. We are not responsible for delays caused by government agencies, rejected filings due to name conflicts, or any other circumstances beyond our control.</p>
      <p class="es" style="display:none">Las tarifas estatales de Florida son determinadas por el Estado de Florida y est&aacute;n sujetas a cambios sin previo aviso. Los tiempos de procesamiento son estimaciones proporcionadas por la Divisi&oacute;n de Corporaciones de Florida y est&aacute;n fuera de nuestro control. No somos responsables de demoras causadas por agencias gubernamentales, tr&aacute;mites rechazados por conflictos de nombre u otras circunstancias fuera de nuestro control.</p>
    </div>

    <div class="doc-section" id="no-guarantee">
      <h2>5. <span class="en-inline">No Guarantee of Approval</span><span class="es-inline" style="display:none">Sin Garant&iacute;a de Aprobaci&oacute;n</span></h2>
      <p class="en">We cannot guarantee that the Florida Division of Corporations or the IRS will approve your filing, accept your business name, or issue your EIN or ITIN. All approvals are at the sole discretion of the respective government agency. We will work diligently to submit accurate and complete documentation on your behalf.</p>
      <p class="es" style="display:none">No podemos garantizar que la Divisi&oacute;n de Corporaciones de Florida o el IRS aprobar&aacute;n su tr&aacute;mite, aceptar&aacute;n el nombre de su negocio o emitir&aacute;n su EIN o ITIN. Todas las aprobaciones son a la &uacute;nica discreci&oacute;n de la agencia gubernamental correspondiente. Trabajaremos diligentemente para presentar documentaci&oacute;n precisa y completa en su nombre.</p>
    </div>

    <div class="doc-section" id="consult">
      <h2>6. <span class="en-inline">Consult a Licensed Professional</span><span class="es-inline" style="display:none">Consulte un Profesional Licenciado</span></h2>
      <p class="en">For matters involving legal strategy, tax planning, compliance, contracts, employment law, immigration, or any other legal issue related to your business, we strongly recommend consulting:</p>
      <p class="es" style="display:none">Para asuntos que involucren estrategia legal, planificaci&oacute;n fiscal, cumplimiento normativo, contratos, derecho laboral, inmigraci&oacute;n o cualquier otro asunto legal relacionado con su negocio, recomendamos encarecidamente consultar con:</p>
      <ul>
        <li class="en">A licensed Florida attorney for legal advice</li><li class="es" style="display:none">Un abogado licenciado en Florida para asesor&iacute;a legal</li>
        <li class="en">A Certified Public Accountant (CPA) for tax planning</li><li class="es" style="display:none">Un Contador P&uacute;blico Certificado (CPA) para planificaci&oacute;n fiscal</li>
        <li class="en">A licensed immigration attorney for visa and ITIN matters</li><li class="es" style="display:none">Un abogado de inmigraci&oacute;n licenciado para asuntos de visa e ITIN</li>
      </ul>
      <div class="green-box en">&#128231; Questions? Contact us at <strong><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="1f767179705f72667d6a6c76717a6c6c79706d727e6b767071317c7072">[email&#160;protected]</a></strong> &mdash; we're here to help with document preparation, not legal advice.</div>
      <div class="green-box es" style="display:none">&#128231; &iquest;Preguntas? Cont&aacute;ctenos en <strong><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="a8c1c6cec7e8c5d1cadddbc1c6cddbdbcec7dac5c9dcc1c7c686cbc7c5">[email&#160;protected]</a></strong> &mdash; estamos aqu&iacute; para ayudar con la preparaci&oacute;n de documentos, no con asesor&iacute;a legal.</div>
    </div>
  </div>
</div>
<footer>
  <div class="footer-inner">
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div>
        <div class="footer-copy">&#169; 2025 Florida Business Formation Center &middot; mybusinessformation.com &middot; All Rights Reserved.</div>
        <div class="footer-links" style="margin-top:6px">
          <a href="/terms" data-en="Terms &amp; Conditions" data-es="Términos y Condiciones">Terms &amp; Conditions</a>
          <a href="/privacy" data-en="Privacy Policy" data-es="Política de Privacidad">Privacy Policy</a>
          <a href="/legal" data-en="Legal Disclaimer" data-es="Aviso Legal">Legal Disclaimer</a>
          <a href="/about" data-en="About Us" data-es="Nosotros">About Us</a>
        </div>
      </div>
      <div class="footer-disclaimer">
        <strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>
        Florida Business Formation Center is a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant.
      </div>
    </div>
  </div>
</footer>
<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js">(function(){var l=localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();
</script><script>
function setLang(lang){
  localStorage.setItem('flbc_lang', lang);
  var isEs = lang === 'es';
  document.getElementById('btn-en').classList.toggle('active', lang==='en');
  document.getElementById('btn-es').classList.toggle('active', lang==='es');

  // Show/hide .en and .es content blocks
  document.querySelectorAll('.en').forEach(function(el){ el.style.display = isEs ? 'none' : 'block'; });
  document.querySelectorAll('.es').forEach(function(el){ el.style.display = isEs ? 'block' : 'none'; });
  document.querySelectorAll('.en-inline').forEach(function(el){ el.style.display = isEs ? 'none' : 'inline'; });
  document.querySelectorAll('.es-inline').forEach(function(el){ el.style.display = isEs ? 'inline' : 'none'; });

  // Translate all data-en/data-es elements (nav, footer)
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){
    el.innerHTML = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });
  // Nav links
  var navM={'Home':isEs?'Inicio':'Home','Packages':isEs?'Paquetes':'Packages','Services':isEs?'Servicios':'Services','FAQ':isEs?'Preguntas':'FAQ','Contact':isEs?'Contacto':'Contact'};
  document.querySelectorAll('nav a').forEach(function(a){var t=a.textContent.trim();if(navM[t])a.textContent=navM[t];});

  // Footer brand
  var fbrand=document.querySelector('.footer-brand p');
  if(fbrand)fbrand.textContent=isEs?'Servicios profesionales de formación empresarial para emprendedores e inversionistas en toda Florida.':'Professional business formation services for entrepreneurs and investors throughout Florida.';

  // Footer disclaimer
  var fd=document.querySelector('.footer-disclaimer');
  if(fd){
    var fds=fd.querySelector('strong');if(fds)fds.textContent=isEs?'Aviso Importante':'Important Notice';
    var fdt=Array.from(fd.childNodes).find(function(n){return n.nodeType===3&&n.textContent.trim().length>10;});
    if(fdt)fdt.textContent=isEs?' Florida Business Formation Center es un servicio profesional de preparación de documentos. No somos una firma legal y no brindamos asesoría legal, fiscal ni financiera. Para asesoría legal, consulta un abogado licenciado en Florida.':' Florida Business Formation Center is a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. For legal advice, please consult a licensed Florida attorney.';
  }

  // Copyright
  var copy=document.querySelector('.footer-copy');
  if(copy)copy.innerHTML=isEs?'&#169; 2025 Florida Business Formation Center &middot; mybusinessformation.com &middot; Todos los Derechos Reservados.':'&#169; 2025 Florida Business Formation Center &middot; mybusinessformation.com &middot; All Rights Reserved.';
}
// Sidebar active state
document.querySelectorAll('.sidebar-nav a').forEach(function(link){
  link.addEventListener('click',function(){
    document.querySelectorAll('.sidebar-nav a').forEach(function(a){a.classList.remove('active');});
    link.classList.add('active');
  });
});
(function(){var l=localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();
</script>
`
  return (
    <><main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} /><ChatWidget /></>
  )
}
