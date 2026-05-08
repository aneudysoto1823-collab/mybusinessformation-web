import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal Disclaimer — Florida Business Formation Center',
  robots: { index: false, follow: false },
}

export default function NewBusinessLegalPage() {
  const styles = `
:root{--navy:#1C2E44;--blue:#2563EB;--blue-light:#EFF6FF;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--gold:#F59E0B;--white:#fff;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',sans-serif;color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3{font-family:'Fraunces',serif;line-height:1.2}
a{text-decoration:none;color:inherit}
header{background:rgba(255,255,255,.97);border-bottom:1px solid var(--gray200);padding:0 32px;}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:66px;gap:20px}
.logo{display:flex;align-items:center;gap:11px}
.logo-mark{width:40px;height:40px;background:linear-gradient(135deg,var(--navy),var(--blue));border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Fraunces',serif;font-size:1rem;font-weight:700;flex-shrink:0}
.logo-text{font-family:'Fraunces',serif;font-size:.95rem;color:var(--navy);font-weight:700;line-height:1.2}
.logo-text span{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:.63rem;color:var(--gray400);font-weight:400;letter-spacing:.8px;text-transform:uppercase}
.back-btn{display:flex;align-items:center;gap:7px;font-size:.82rem;font-weight:600;color:var(--blue);padding:8px 16px;border-radius:8px;border:1.5px solid var(--blue);transition:all .2s}
.back-btn:hover{background:var(--blue-light)}
.lang-toggle{display:flex;background:var(--gray100);border-radius:20px;padding:3px;gap:2px}
.lang-btn{padding:5px 12px;border-radius:16px;border:none;cursor:pointer;font-size:.77rem;font-weight:600;font-family:inherit;transition:all .2s;color:var(--gray400);background:transparent}
.lang-btn.active{background:var(--navy);color:#fff}
.page-hero{background:linear-gradient(135deg,var(--navy) 0%,#1a3a6b 100%);padding:56px 32px 48px;color:#fff;position:relative;overflow:hidden}
.page-hero::after{content:'';position:absolute;right:-80px;top:-80px;width:360px;height:360px;background:radial-gradient(circle,rgba(37,99,235,.2) 0%,transparent 70%);pointer-events:none}
.page-hero-inner{max-width:1280px;margin:0 auto;position:relative;z-index:1}
.hero-badge{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.9);font-size:.7rem;font-weight:600;padding:4px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px}
.page-hero h1{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;margin-bottom:10px;letter-spacing:-.5px}
.page-hero p{font-size:.88rem;color:rgba(255,255,255,.65);max-width:520px;line-height:1.75}
.page-layout{max-width:1280px;margin:0 auto;padding:52px 32px 80px;display:grid;grid-template-columns:220px 1fr;gap:48px;flex:1}
@media(max-width:900px){.page-layout{grid-template-columns:1fr;padding:32px 20px 60px}}
.sidebar{position:sticky;top:24px;align-self:start}
.sidebar-title{font-size:.71rem;font-weight:600;color:var(--gray400);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px}
.sidebar-nav a{display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--gray600);padding:8px 12px;border-radius:7px;margin-bottom:3px;transition:all .2s;border-left:2px solid transparent}
.sidebar-nav a:hover,.sidebar-nav a.active{color:var(--navy);background:var(--blue-light);border-left-color:var(--blue)}
.doc-content{min-width:0}
.doc-section{margin-bottom:36px;scroll-margin-top:24px}
.doc-section h2{font-size:1.15rem;color:var(--navy);font-weight:700;margin-bottom:12px;padding-bottom:9px;border-bottom:2px solid var(--blue-light);display:flex;align-items:center;gap:9px}
.doc-section p{font-size:.875rem;color:var(--gray600);line-height:1.82;margin-bottom:10px}
.doc-section ul{padding-left:20px;margin-bottom:12px}
.doc-section li{font-size:.875rem;color:var(--gray600);line-height:1.8;margin-bottom:4px}
.warn-box{background:#FEF3C7;border-left:3px solid var(--gold);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:#92400E;line-height:1.7}
.green-box{background:var(--green-light);border-left:3px solid var(--green);border-radius:0 8px 8px 0;padding:13px 16px;margin:14px 0;font-size:.83rem;color:var(--green-dark);line-height:1.7}
.en{display:block}.es{display:none}
footer{background:var(--navy);color:rgba(255,255,255,.55);padding:32px 32px 20px;margin-top:auto}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-divider{border:none;border-top:1px solid rgba(255,255,255,.1);margin-bottom:16px}
.footer-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.footer-copy{font-size:.73rem;color:rgba(255,255,255,.35)}
.footer-links{display:flex;gap:14px;flex-wrap:wrap}
.footer-links a{font-size:.75rem;color:rgba(255,255,255,.4);transition:color .2s}
.footer-links a:hover{color:#fff}
`
  const body = `
<header>
  <div class="header-inner">
    <div class="logo">
      <div class="logo-mark">FL</div>
      <div class="logo-text">Florida Business Formation Center<span>mybusinessformation.com</span></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <div class="lang-toggle">
        <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
      </div>
      <a href="/new-business" class="back-btn">&#8592; <span class="en-inline">Back to New Business</span><span class="es-inline" style="display:none">Regresar</span></a>
    </div>
  </div>
</header>

<section class="page-hero">
  <div class="page-hero-inner">
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
      <a href="#processing">4. <span class="en-inline">Processing &amp; Delays</span><span class="es-inline" style="display:none">Procesamiento</span></a>
      <a href="#no-guarantee">5. <span class="en-inline">No Guarantee</span><span class="es-inline" style="display:none">Sin Garant&iacute;a</span></a>
      <a href="#consult">6. <span class="en-inline">Consult a Professional</span><span class="es-inline" style="display:none">Consulte un Profesional</span></a>
    </nav>
  </aside>

  <div class="doc-content">
    <div class="warn-box en">&#9888; <strong>Please Read Carefully.</strong> This disclaimer governs your use of mybusinessformation.com and all services offered by Florida Business Formation Center.</div>
    <div class="warn-box es" style="display:none">&#9888; <strong>Lea Cuidadosamente.</strong> Este aviso legal rige el uso de mybusinessformation.com y todos los servicios ofrecidos por Florida Business Formation Center.</div>

    <div class="doc-section" id="not-law-firm">
      <h2>1. <span class="en-inline">We Are Not a Law Firm</span><span class="es-inline" style="display:none">No Somos un Bufete de Abogados</span></h2>
      <p class="en">Florida Business Formation Center is a document preparation service. We are <strong>not a law firm</strong> and are not authorized to practice law. Our staff are not attorneys, and no attorney-client relationship is created by your use of our services or this website.</p>
      <p class="es" style="display:none">Florida Business Formation Center es un servicio de preparaci&oacute;n de documentos. <strong>No somos un bufete de abogados</strong> y no estamos autorizados a ejercer la abogac&iacute;a. Nuestro personal no son abogados y el uso de nuestros servicios o este sitio web no crea ninguna relaci&oacute;n abogado-cliente.</p>
    </div>

    <div class="doc-section" id="no-advice">
      <h2>2. <span class="en-inline">No Legal, Tax, or Financial Advice</span><span class="es-inline" style="display:none">Sin Asesor&iacute;a Legal, Fiscal ni Financiera</span></h2>
      <p class="en">Nothing on this website or provided through our services constitutes legal, tax, or financial advice. All information is provided for general informational purposes only. We strongly encourage you to consult with qualified legal and tax professionals before making any business decisions.</p>
      <p class="es" style="display:none">Nada en este sitio web ni en nuestros servicios constituye asesor&iacute;a legal, fiscal o financiera. Toda la informaci&oacute;n se proporciona &uacute;nicamente con fines informativos generales. Le recomendamos encarecidamente que consulte con profesionales legales y fiscales calificados antes de tomar cualquier decisi&oacute;n empresarial.</p>
      <div class="warn-box en">&#128204; EIN / Tax ID assignments and tax classification decisions are IRS matters that may require guidance from a qualified tax professional or CPA.</div>
      <div class="warn-box es" style="display:none">&#128204; Las asignaciones de EIN / Tax ID y las decisiones de clasificaci&oacute;n fiscal son asuntos del IRS que pueden requerir orientaci&oacute;n de un profesional fiscal o CPA calificado.</div>
    </div>

    <div class="doc-section" id="accuracy">
      <h2>3. <span class="en-inline">Accuracy of Information</span><span class="es-inline" style="display:none">Exactitud de la Informaci&oacute;n</span></h2>
      <p class="en">While we strive to provide accurate and current information, we make no warranties regarding the completeness, accuracy, or timeliness of any information. Laws and regulations change frequently. Always verify current requirements with the relevant government agency or a licensed professional.</p>
      <p class="es" style="display:none">Si bien nos esforzamos por proporcionar informaci&oacute;n precisa y actualizada, no ofrecemos garant&iacute;as sobre la integridad, exactitud o actualidad de ninguna informaci&oacute;n. Las leyes y regulaciones cambian con frecuencia. Siempre verifique los requisitos actuales con la agencia gubernamental correspondiente o un profesional licenciado.</p>
    </div>

    <div class="doc-section" id="processing">
      <h2>4. <span class="en-inline">Processing &amp; Delivery</span><span class="es-inline" style="display:none">Procesamiento y Entrega</span></h2>
      <p class="en">Processing and delivery times for our services are estimates and are not guaranteed. EIN processing times are subject to IRS workload and are outside our control. Labor Law Posters and Certificates of Status are subject to standard fulfillment timelines. We are not responsible for delays caused by government agencies or circumstances beyond our control.</p>
      <p class="es" style="display:none">Los tiempos de procesamiento y entrega de nuestros servicios son estimados y no est&aacute;n garantizados. Los tiempos de procesamiento del EIN est&aacute;n sujetos a la carga de trabajo del IRS y est&aacute;n fuera de nuestro control. Los P&oacute;steres de Leyes Laborales y los Certificados de Estatus est&aacute;n sujetos a los plazos est&aacute;ndar de entrega. No somos responsables de demoras causadas por agencias gubernamentales o circunstancias fuera de nuestro control.</p>
    </div>

    <div class="doc-section" id="no-guarantee">
      <h2>5. <span class="en-inline">No Guarantee of Approval</span><span class="es-inline" style="display:none">Sin Garant&iacute;a de Aprobaci&oacute;n</span></h2>
      <p class="en">We cannot guarantee that the IRS will approve your EIN application or issue your EIN on any specific timeline. All approvals are at the sole discretion of the IRS. We will work diligently to submit accurate and complete documentation on your behalf.</p>
      <p class="es" style="display:none">No podemos garantizar que el IRS aprobar&aacute; su solicitud de EIN o emitir&aacute; su EIN en ning&uacute;n plazo espec&iacute;fico. Todas las aprobaciones son a la &uacute;nica discreci&oacute;n del IRS. Trabajaremos diligentemente para presentar documentaci&oacute;n precisa y completa en su nombre.</p>
    </div>

    <div class="doc-section" id="consult">
      <h2>6. <span class="en-inline">Consult a Licensed Professional</span><span class="es-inline" style="display:none">Consulte un Profesional Licenciado</span></h2>
      <p class="en">For matters involving legal strategy, tax planning, compliance, employment law, or any other legal issue related to your business, we strongly recommend consulting:</p>
      <p class="es" style="display:none">Para asuntos que involucren estrategia legal, planificaci&oacute;n fiscal, cumplimiento normativo, derecho laboral o cualquier otro asunto legal relacionado con su negocio, recomendamos encarecidamente consultar con:</p>
      <ul>
        <li class="en">A licensed Florida attorney for legal advice</li><li class="es" style="display:none">Un abogado licenciado en Florida para asesor&iacute;a legal</li>
        <li class="en">A Certified Public Accountant (CPA) for tax planning</li><li class="es" style="display:none">Un Contador P&uacute;blico Certificado (CPA) para planificaci&oacute;n fiscal</li>
        <li class="en">A licensed immigration attorney for visa and ITIN matters</li><li class="es" style="display:none">Un abogado de inmigraci&oacute;n licenciado para asuntos de visa e ITIN</li>
      </ul>
      <div class="green-box en">&#128231; Questions? Contact us at <strong>info@mybusinessformation.com</strong> &mdash; we&rsquo;re here to help with document preparation, not legal advice.</div>
      <div class="green-box es" style="display:none">&#128231; &iquest;Preguntas? Cont&aacute;ctenos en <strong>info@mybusinessformation.com</strong> &mdash; estamos aqu&iacute; para ayudar con la preparaci&oacute;n de documentos, no con asesor&iacute;a legal.</div>
    </div>
  </div>
</div>

<footer>
  <div class="footer-inner">
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div class="footer-copy">&#169; 2025 Florida Business Formation Center &middot; All Rights Reserved.</div>
      <div class="footer-links">
        <a href="/new-business/terms">Terms &amp; Conditions</a>
        <a href="/new-business/privacy">Privacy Policy</a>
        <a href="/new-business/legal">Legal Disclaimer</a>
        <a href="/new-business">&#8592; New Business</a>
      </div>
    </div>
  </div>
</footer>

<script>
function setLang(lang){
  localStorage.setItem('flbc_lang',lang);
  var isEs=lang==='es';
  document.getElementById('btn-en').classList.toggle('active',lang==='en');
  document.getElementById('btn-es').classList.toggle('active',lang==='es');
  document.querySelectorAll('.en').forEach(function(el){el.style.display=isEs?'none':'block';});
  document.querySelectorAll('.es').forEach(function(el){el.style.display=isEs?'block':'none';});
  document.querySelectorAll('.en-inline').forEach(function(el){el.style.display=isEs?'none':'inline';});
  document.querySelectorAll('.es-inline').forEach(function(el){el.style.display=isEs?'inline':'none';});
}
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
    <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
  )
}
