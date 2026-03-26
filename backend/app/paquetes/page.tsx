export default function PaquetesPage() {
  const styles = `
:root{--navy:#1C2E44;--navy2:#22364E;--blue:#2563EB;--blue-light:#EFF6FF;--blue-mid:#DBEAFE;--green:#059669;--green-dark:#047857;--green-light:#ECFDF5;--gold:#F59E0B;--white:#fff;--gray50:#F8FAFC;--gray100:#F1F5F9;--gray200:#E2E8F0;--gray400:#94A3B8;--gray600:#475569;--gray800:#1E293B;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',sans-serif;color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column}
h1,h2,h3{font-family:'Fraunces',serif;line-height:1.15}
a{text-decoration:none;color:inherit}
/* TOPBAR */
.topbar{background:var(--navy);color:#fff;font-size:.77rem;padding:9px 24px;text-align:center}
.topbar strong{color:var(--gold)}
/* HEADER */
header{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray200);padding:0 32px}
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
.btn-start:hover{background:var(--green-dark);transform:translateY(-1px)}
/* HERO */
.page-hero{background:var(--white);padding:18px 32px 16px;text-align:center;border-bottom:1px solid var(--gray100)}
.page-hero h1{font-size:1.1rem;color:var(--navy);font-weight:700;margin-bottom:4px;letter-spacing:0}
.page-hero h1 em{color:var(--blue);font-style:normal}
.page-hero p{font-size:.8rem;color:var(--gray600);max-width:700px;margin:0 auto;font-weight:400;line-height:1.5}
/* TRUST BAR */
.trust-bar{background:var(--gray50);border-bottom:1px solid var(--gray200);padding:13px 32px}
.trust-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:28px;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:6px;font-size:.75rem;font-weight:500;color:var(--gray600)}
.trust-check{color:var(--green);font-weight:700;font-size:.71rem;background:var(--green-light);padding:2px 6px;border-radius:4px}
.trust-sep{width:1px;height:14px;background:var(--gray200)}
/* ENTITY TOGGLE */
.entity-section{padding:44px 32px 0;text-align:center}
.entity-section-inner{max-width:1280px;margin:0 auto}
.et-label{font-size:.9rem;color:var(--gray600);font-weight:500;margin-bottom:14px;display:block}
.et-btns{display:inline-flex;background:var(--gray100);border-radius:12px;padding:5px;gap:4px}
.et-btn{padding:12px 36px;border-radius:8px;border:none;cursor:pointer;font-size:.97rem;font-weight:600;font-family:inherit;transition:all .25s;background:transparent;color:var(--gray500)}
.et-btn.active{background:var(--navy);color:#fff;box-shadow:0 2px 10px rgba(28,46,68,.25)}
.et-desc{font-size:.83rem;color:var(--gray500);margin-top:12px;min-height:20px}
/* PRICING */
.pricing-section{padding:36px 32px 64px}
.pricing-inner{max-width:1280px;margin:0 auto}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:20px}
@media(max-width:960px){.pricing-grid{grid-template-columns:1fr}}
.pkg-card{border:1.5px solid var(--gray200);border-radius:16px;overflow:hidden;transition:all .25s;background:var(--white)}
.pkg-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(28,46,68,.13)}
.pkg-card.featured{border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.08)}
.pkg-head{padding:22px 22px 18px;background:var(--white)}
.pkg-card.featured .pkg-head{background:linear-gradient(135deg,var(--navy),#1e4db7)}
.popular-tag{display:inline-block;font-size:.62rem;font-weight:700;background:var(--gold);color:#fff;padding:3px 11px;border-radius:20px;margin-bottom:8px;letter-spacing:.3px;text-transform:uppercase}
.pkg-name{font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:4px}
.pkg-card.featured .pkg-name{color:#fff}
.pkg-price{font-family:'Fraunces',serif;font-size:2.4rem;font-weight:900;color:var(--navy);line-height:1}
.pkg-card.featured .pkg-price{color:#fff}
.pkg-price sup{font-size:1.1rem;vertical-align:super}
.pkg-state-fee{font-size:.71rem;color:var(--gray400);margin-bottom:14px;margin-top:3px}
.pkg-card.featured .pkg-state-fee{color:rgba(255,255,255,.5)}
.pkg-cta{width:100%;padding:11px;border-radius:8px;font-size:.88rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all .2s}
.pkg-cta-basic{background:var(--gray100);color:var(--navy)}.pkg-cta-basic:hover{background:var(--gray200)}
.pkg-cta-featured{background:var(--green);color:#fff}.pkg-cta-featured:hover{background:var(--green-dark)}
.pkg-cta-premium{background:var(--navy);color:#fff}.pkg-cta-premium:hover{background:var(--navy2)}
.pkg-divider{border:none;border-top:1px solid var(--gray200);margin:0}
.pkg-services{padding:4px 0}
.svc-row{display:flex;align-items:center;gap:8px;padding:7px 18px;font-size:.8rem;border-bottom:1px solid var(--gray100)}
.svc-row:last-child{border-bottom:none}
.svc-name{flex:1;color:var(--gray800)}
.svc-status{min-width:54px;text-align:right;font-weight:600;font-size:.77rem}
.s-check{color:var(--green);font-size:1rem}
.s-add{color:var(--gold)}
.state-fee-note{font-size:.72rem;color:var(--gray400);text-align:center;margin-bottom:10px}
.pricing-hint{font-size:.85rem;color:var(--gray600);text-align:center;padding:13px 20px;background:var(--blue-light);border-radius:10px;max-width:620px;margin:0 auto 36px}
.pricing-hint strong{color:var(--navy)}
/* COMPARE TABLE */
.compare-section{background:var(--gray50);padding:64px 32px}
.compare-inner{max-width:1000px;margin:0 auto}
.section-label{display:inline-block;font-size:.7rem;font-weight:600;color:var(--blue);text-transform:uppercase;letter-spacing:1.3px;margin-bottom:12px}
.section-title{font-size:clamp(1.7rem,3vw,2.4rem);color:var(--navy);font-weight:700;margin-bottom:8px}
.compare-table{width:100%;border-collapse:collapse;margin-top:32px;font-size:.86rem}
.compare-table th{padding:14px 16px;text-align:left;border-bottom:2px solid var(--gray200);font-weight:600;color:var(--gray600);font-family:'Plus Jakarta Sans',sans-serif;font-size:.75rem;text-transform:uppercase;letter-spacing:.5px}
.compare-table th:not(:first-child){text-align:center}
.compare-table td{padding:12px 16px;border-bottom:1px solid var(--gray100);color:var(--gray800)}
.compare-table td:not(:first-child){text-align:center;font-weight:600}
.compare-table tr:hover td{background:var(--gray50)}
.th-basic{color:var(--gray600)}
.th-standard{color:var(--blue)}
.th-premium{color:var(--navy)}
.td-check{color:var(--green);font-size:1.1rem}
.td-no{color:var(--gray300);font-size:.85rem}
.td-add{color:var(--gold);font-size:.8rem}
.td-inc{color:var(--green);font-size:.78rem;font-weight:600}
.cat-row td{background:var(--gray50);font-family:'Fraunces',serif;font-weight:700;color:var(--navy);font-size:.88rem;padding:10px 16px}
/* FAQ */
.faq-section{padding:64px 32px}
.faq-inner{max-width:780px;margin:0 auto}
.faq-item{border-bottom:1px solid var(--gray200)}
.faq-q{width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:18px 0;display:flex;justify-content:space-between;align-items:center;font-family:inherit;font-size:.93rem;font-weight:600;color:var(--navy);gap:12px}
.faq-icon{font-size:1.1rem;color:var(--blue);transition:transform .25s;flex-shrink:0;font-style:normal}
.faq-a{font-size:.86rem;color:var(--gray600);line-height:1.75;padding-bottom:16px;display:none}
.faq-item.open .faq-icon{transform:rotate(45deg)}
.faq-item.open .faq-a{display:block}
/* HELP BAR */
.help-section{padding:0 32px 64px}
.help-bar{max-width:1280px;margin:0 auto;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #a7f3d0;border-radius:16px;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px}
.help-text strong{display:block;font-size:1rem;color:var(--navy);margin-bottom:4px}
.help-text p{font-size:.84rem;color:var(--gray600)}
.help-btns{display:flex;gap:10px;flex-wrap:wrap}
.btn-wa{background:#25D366;color:#fff;padding:11px 20px;border-radius:8px;font-size:.86rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;transition:all .2s}
.btn-wa:hover{background:#1ebe5d;transform:translateY(-1px)}
.btn-cal{background:#fff;color:var(--navy);padding:11px 20px;border-radius:8px;font-size:.86rem;font-weight:600;border:1.5px solid var(--gray200);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;transition:all .2s}
.btn-cal:hover{border-color:var(--blue);color:var(--blue)}
/* FOOTER */
footer{background:var(--navy);color:rgba(255,255,255,.6);padding:48px 32px 24px;margin-top:auto}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr}}
.footer-brand p{font-size:.79rem;line-height:1.7;color:rgba(255,255,255,.5);max-width:260px;margin-top:10px}
.footer-col h5{font-family:'Fraunces',serif;font-size:.92rem;color:#fff;margin-bottom:14px;font-weight:600}
.footer-col a{display:block;font-size:.8rem;color:rgba(255,255,255,.5);margin-bottom:8px;transition:color .2s;cursor:pointer}
.footer-col a:hover{color:#fff}
.footer-divider{border:none;border-top:1px solid rgba(255,255,255,.1);margin-bottom:20px}
.footer-copy{font-size:.74rem;color:rgba(255,255,255,.35)}
.footer-disclaimer{font-size:.71rem;color:rgba(255,255,255,.28);max-width:620px;line-height:1.6;margin-top:6px}
.wa-float{position:fixed;bottom:26px;right:26px;z-index:500;background:#25D366;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.5);cursor:pointer;transition:all .25s}
.wa-float:hover{transform:scale(1.1)}
.wa-float svg{width:24px;height:24px;fill:#fff}
/* FORM OVERLAY */
.form-overlay{display:none;position:fixed;inset:0;z-index:1000;background:rgba(7,19,54,.82);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:20px}
.form-overlay.active{display:flex}
.form-modal{background:#fff;border-radius:16px;width:100%;max-width:820px;max-height:94vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.4)}
.form-header{background:linear-gradient(135deg,var(--navy),#1e4db7);padding:22px 26px;border-radius:16px 16px 0 0;position:sticky;top:0;z-index:10}
.form-header-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.form-header h3{font-family:'Fraunces',serif;color:#fff;font-size:1.12rem;font-weight:700}
.form-close{background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s}
.form-close:hover{background:rgba(255,255,255,.25)}
.progress-bar{background:rgba(255,255,255,.15);border-radius:10px;height:5px;overflow:hidden}
.progress-fill{background:var(--gold);height:100%;border-radius:10px;transition:width .4s}
.progress-text{font-size:.7rem;color:rgba(255,255,255,.55);margin-top:5px;text-align:right}
.form-body{padding:26px}
.form-step{display:none}.form-step.active{display:block}
.step-title{font-family:'Fraunces',serif;font-size:1.3rem;color:var(--navy);font-weight:700;margin-bottom:6px}
.step-sub{font-size:.86rem;color:var(--gray600);margin-bottom:22px;line-height:1.62}
.form-label{display:block;font-size:.82rem;font-weight:600;color:var(--gray800);margin-bottom:6px}
.form-input{width:100%;padding:11px 13px;border:1.5px solid var(--gray200);border-radius:8px;font-size:.89rem;font-family:inherit;color:var(--gray800);transition:border-color .2s;background:#fff}
.form-input:focus{outline:none;border-color:var(--blue)}
.form-input::placeholder{color:var(--gray400)}
.form-group{margin-bottom:16px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:13px}
.choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:8px}
.choice-card{border:2px solid var(--gray200);border-radius:10px;padding:16px 14px;cursor:pointer;transition:all .2s;text-align:center}
.choice-card:hover,.choice-card.selected{border-color:var(--blue);background:var(--blue-light)}
.choice-icon{font-size:1.8rem;margin-bottom:8px}
.choice-card strong{display:block;font-size:.88rem;color:var(--navy);font-weight:600;margin-bottom:4px}
.choice-card p{font-size:.74rem;color:var(--gray600);line-height:1.4}
.pkg-choice-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px}
.pkg-choice{border:2px solid var(--gray200);border-radius:10px;padding:16px 13px;cursor:pointer;transition:all .2s;text-align:center}
.pkg-choice:hover,.pkg-choice.selected{border-color:var(--blue);background:var(--blue-light)}
.pkg-choice.pop{border-color:var(--green)}
.pkg-choice.pop.selected{background:var(--green-light)}
.pc-name{font-family:'Fraunces',serif;font-size:.97rem;font-weight:700;color:var(--navy);margin-bottom:3px}
.pc-price{font-size:1.3rem;font-weight:700;color:var(--blue);font-family:'Fraunces',serif}
.pc-items{font-size:.69rem;color:var(--gray600);margin-top:6px;line-height:1.5;text-align:left}
.addon-card{border:1.5px solid var(--gray200);border-radius:14px;padding:20px;margin-bottom:13px}
.addon-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px}
.addon-title{font-family:'Fraunces',serif;font-size:1.05rem;font-weight:700;color:var(--navy)}
.addon-price{font-size:1.05rem;font-weight:700;color:var(--blue);font-family:'Fraunces',serif}
.addon-desc{font-size:.83rem;color:var(--gray600);line-height:1.65;margin-bottom:14px}
.addon-benefit{font-size:.77rem;color:var(--green-dark);background:var(--green-light);padding:7px 11px;border-radius:7px;margin-bottom:14px;font-weight:500}
.addon-btns{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.btn-addon-yes{background:var(--green);color:#fff;padding:10px;border-radius:7px;font-size:.86rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-addon-yes:hover{background:var(--green-dark)}
.btn-addon-no{background:var(--gray100);color:var(--gray600);padding:10px;border-radius:7px;font-size:.86rem;font-weight:500;border:1.5px solid var(--gray200);cursor:pointer;font-family:inherit}
.btn-addon-no:hover{background:var(--gray200)}
.btn-addon-yes.selected{background:var(--green-dark);box-shadow:0 0 0 3px rgba(5,150,105,.2)}
.btn-addon-no.selected{background:var(--gray200)}
.member-block{border:1.5px solid var(--gray200);border-radius:10px;padding:16px;margin-bottom:11px;position:relative}
.member-block h5{font-size:.86rem;font-weight:600;color:var(--navy);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--gray100)}
.btn-add-member{background:var(--blue-light);color:var(--blue);border:1.5px dashed var(--blue);padding:10px;border-radius:8px;width:100%;font-size:.86rem;font-weight:600;cursor:pointer;font-family:inherit;margin-top:4px}
.btn-remove-member{position:absolute;top:12px;right:12px;background:none;border:none;color:var(--gray400);cursor:pointer;font-size:.9rem}
.ownership-total{background:var(--gray50);border:1px solid var(--gray200);border-radius:7px;padding:9px 13px;font-size:.82rem;color:var(--gray600);margin-top:9px;display:flex;justify-content:space-between}
.ownership-total.ok strong{color:var(--green)}
.ownership-total.over strong{color:#ef4444}
.name-helper{background:var(--blue-light);border-left:3px solid var(--blue);padding:10px 13px;border-radius:0 7px 7px 0;font-size:.79rem;color:var(--blue);line-height:1.6;margin-bottom:16px}
.delivery-opts{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.delivery-card{border:2px solid var(--gray200);border-radius:10px;padding:15px;cursor:pointer;transition:all .2s}
.delivery-card:hover,.delivery-card.selected{border-color:var(--blue);background:var(--blue-light)}
.delivery-card strong{display:block;font-size:.88rem;color:var(--navy);font-weight:600;margin-bottom:3px}
.delivery-card span{font-size:.74rem;color:var(--gray600)}
.delivery-card .d-price{font-size:.82rem;font-weight:600;color:var(--blue);margin-top:5px}
.order-save-box{background:var(--green-light);border:1.5px solid #a7f3d0;border-radius:10px;padding:14px;margin-bottom:18px;display:flex;align-items:center;gap:12px}
.order-num{font-family:'Fraunces',serif;font-size:1.2rem;font-weight:700;color:var(--green-dark)}
.order-save-box p{font-size:.79rem;color:var(--green-dark)}
.summary-table{width:100%;border-collapse:collapse;margin-bottom:18px}
.summary-table td{padding:8px 0;font-size:.86rem;border-bottom:1px solid var(--gray100)}
.summary-table td:last-child{text-align:right;font-weight:600;color:var(--navy)}
.summary-total{display:flex;justify-content:space-between;background:var(--navy);color:#fff;padding:13px 16px;border-radius:8px;font-weight:700;margin-bottom:18px}
.form-footer{display:flex;justify-content:space-between;align-items:center;margin-top:22px;padding-top:18px;border-top:1px solid var(--gray100);gap:10px}
.btn-back{background:none;border:1.5px solid var(--gray200);color:var(--gray600);padding:10px 20px;border-radius:8px;font-size:.87rem;font-weight:500;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-back:hover{border-color:var(--gray400);color:var(--navy)}
.btn-next{background:var(--blue);color:#fff;padding:11px 26px;border-radius:8px;font-size:.88rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all .2s;flex:1;max-width:200px}
.btn-next:hover{background:var(--navy)}
.btn-submit{background:var(--green);color:#fff;padding:13px 30px;border-radius:8px;font-size:.93rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all .2s;width:100%}
.btn-submit:hover{background:var(--green-dark)}
.save-btn{background:none;border:none;color:var(--blue);font-size:.79rem;font-weight:500;cursor:pointer;font-family:inherit}
.form-help{background:var(--gray50);border:1px solid var(--gray200);border-radius:8px;padding:12px 14px;margin-top:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:9px}
.form-help p{font-size:.77rem;color:var(--gray600)}
.form-help strong{color:var(--navy)}
.form-help-btns{display:flex;gap:7px}
.fh-wa{background:#25D366;color:#fff;padding:6px 12px;border-radius:6px;font-size:.77rem;font-weight:600;border:none;cursor:pointer;font-family:inherit}
.fh-cal{background:#fff;color:var(--navy);padding:6px 12px;border-radius:6px;font-size:.77rem;font-weight:600;border:1px solid var(--gray200);cursor:pointer;font-family:inherit}
.select-input{width:100%;padding:11px 13px;border:1.5px solid var(--gray200);border-radius:8px;font-size:.89rem;font-family:inherit;color:var(--gray800);background:#fff}
.select-input:focus{outline:none;border-color:var(--blue)}
.success-screen{text-align:center;padding:20px 0}
.success-icon{width:68px;height:68px;background:var(--green-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:1.9rem}
.success-screen h3{font-family:'Fraunces',serif;font-size:1.5rem;color:var(--navy);margin-bottom:9px}
.success-screen p{font-size:.87rem;color:var(--gray600);max-width:420px;margin:0 auto 22px;line-height:1.7}
.order-display{background:var(--navy);color:#fff;padding:14px 22px;border-radius:10px;display:inline-block;margin:0 auto 22px}
.order-display span{font-size:.73rem;color:rgba(255,255,255,.55);display:block;margin-bottom:3px}
.order-display strong{font-family:'Fraunces',serif;font-size:1.7rem;font-weight:700;color:var(--gold);letter-spacing:1px}
`
  const body = `

<div class="topbar">&#127775; Florida's trusted business formation experts — <strong>LLC &amp; Corporation</strong> filing made simple. From <strong>$49 + state fee.</strong></div>

<header id="mainHeader">
  <div class="header-inner">
    <a href="mybusinessformation.html" class="logo">
      <div class="logo-mark">FL</div>
      <div class="logo-text">Florida Business Formation Center<span>mybusinessformation.com</span></div>
    </a>
    <nav>
      <a href="mybusinessformation.html">Home</a>
      <a href="mybusinessformation.html#how">How It Works</a>
      <a href="servicios.html">Add-On Services</a>
      <a href="mybusinessformation.html#faq">FAQ</a>
      <a href="mybusinessformation.html#contact">Contact</a>
    </nav>
    <div style="display:flex;align-items:center;gap:11px">
      <div class="lang-toggle">
        <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
      </div>
      <button class="btn-start" onclick="openForm()">Start My Business &#8594;</button>
    </div>
  </div>
</header>

<!-- PAGE HERO -->
<section class="page-hero">
  <div style="max-width:1280px;margin:0 auto">
    <p style="font-size:.78rem;font-weight:600;color:var(--blue);text-transform:uppercase;letter-spacing:1.3px;margin-bottom:14px" id="lbl-packages">Formation Packages</p>
    <h1 id="hero-title">Start Your <em>Florida Business</em> Today</h1>
    <p id="hero-sub">Professional LLC &amp; Corporation formation. All packages include expert review, name availability search, and filing with the Florida Division of Corporations.</p>
  </div>
</section>

<!-- TRUST BAR -->
<div class="trust-bar">
  <div class="trust-inner">
    <div class="trust-item"><span class="trust-check">&#10003;</span> Florida Division of Corporations</div>
    <div class="trust-sep"></div>
    <div class="trust-item"><span class="trust-check">&#10003;</span> IRS Authorized</div>
    <div class="trust-sep"></div>
    <div class="trust-item"><span class="trust-check">&#10003;</span> SSL Secured</div>
    <div class="trust-sep"></div>
    <div class="trust-item"><span class="trust-check">&#10003;</span> 100% Online Process</div>
    <div class="trust-sep"></div>
    <div class="trust-item"><span class="trust-check">&#10003;</span> Bilingual Support EN/ES</div>
  </div>
</div>

<!-- ENTITY TOGGLE -->
<div class="entity-section">
  <div class="entity-section-inner">
    <span class="et-label" id="et-label">I am forming a:</span>
    <div class="et-btns">
      <button class="et-btn active" id="et-llc" onclick="setEntity('llc')">&#127963;&nbsp; LLC</button>
      <button class="et-btn" id="et-corp" onclick="setEntity('corp')">&#128202;&nbsp; Corporation</button>
    </div>
    <p class="et-desc" id="et-desc">Flexible management &amp; pass-through taxation. Most popular for entrepreneurs &amp; small businesses. State fee: <strong>$125</strong></p>
  </div>
</div>

<!-- PRICING GRID -->
<div class="pricing-section">
  <div class="pricing-inner">
    <p class="state-fee-note" id="state-fee-note">* Florida state filing fee: $125 (LLC) or $70 (Corporation) — paid directly to the State of Florida, not included in package price.</p>
    <div class="pricing-hint" id="pricing-hint"><strong>Not sure which to choose?</strong> Most clients go with Standard — it covers EIN and Bank Account Guide, which banks typically require to open your business account.</div>
    <div class="pricing-grid">

      <!-- BASIC -->
      <div class="pkg-card">
        <div class="pkg-head">
          <div class="pkg-name">Basic</div>
          <div class="pkg-price"><sup>$</sup>49</div>
          <div class="pkg-state-fee" id="fee-basic">+ state fee ($125 LLC)</div>
          <button class="pkg-cta pkg-cta-basic" onclick="openFormFromPkg('basic')">Get Started with Basic</button>
        </div>
        <hr class="pkg-divider"/>
        <div class="pkg-services">
          <div class="svc-row"><span class="svc-name" data-en="LLC or Corporation Formation" data-es="Formación de LLC o Corporación">LLC or Corporation Formation</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="FL Certificate of Formation" data-es="Certificado de Formación FL"><span data-en="FL Certificate of Formation" data-es="Certificado de Formación FL">FL Certificate of Formation</span></span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Name Availability Search" data-es="Búsqueda de Nombre Disponible"><span data-en="Name Availability Search" data-es="Búsqueda de Nombre Disponible">Name Availability Search</span></span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="EIN / Tax ID Number" data-es="EIN / Número de Identificación Fiscal"><span data-en="EIN / Tax ID Number" data-es="EIN / Número de Identificación Fiscal">EIN / Tax ID Number</span></span><span class="svc-status s-add">+$49</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Operating Agreement" data-es="Acuerdo Operativo">Operating Agreement</span><span class="svc-status s-add">+$79</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Expedited Filing" data-es="Tramitación Acelerada">Expedited Filing</span><span class="svc-status s-add">+$99</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Bank Account Guide" data-es="Guía para Cuenta Bancaria">Bank Account Guide</span><span class="svc-status s-add">+$29</span></div>
          <div class="svc-row"><span class="svc-name" data-en="ITIN Application" data-es="Solicitud de ITIN">ITIN Application</span><span class="svc-status s-add">+$69</span></div>
          <div class="svc-row"><span class="svc-name" data-en="DBA / Fictitious Name" data-es="DBA / Nombre Ficticio">DBA / Fictitious Name</span><span class="svc-status s-add">+$49</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Articles of Amendment" data-es="Artículos de Enmienda"><span data-en="Articles of Amendment" data-es="Artículos de Enmienda">Articles of Amendment</span></span><span class="svc-status s-add">+$59</span></div>
        </div>
      </div>

      <!-- STANDARD -->
      <div class="pkg-card featured">
        <div class="pkg-head">
          <div class="popular-tag">&#11088; Most Popular</div>
          <div class="pkg-name">Standard</div>
          <div class="pkg-price"><sup>$</sup>149</div>
          <div class="pkg-state-fee" id="fee-standard">+ state fee ($125 LLC)</div>
          <button class="pkg-cta pkg-cta-featured" onclick="openFormFromPkg('standard')">Get Started with Standard</button>
        </div>
        <hr class="pkg-divider"/>
        <div class="pkg-services">
          <div class="svc-row"><span class="svc-name" data-en="LLC or Corporation Formation" data-es="Formación de LLC o Corporación">LLC or Corporation Formation</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="FL Certificate of Formation" data-es="Certificado de Formación FL">FL Certificate of Formation</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Name Availability Search" data-es="Búsqueda de Nombre Disponible">Name Availability Search</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="EIN / Tax ID Number" data-es="EIN / Número de Identificación Fiscal">EIN / Tax ID Number</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Operating Agreement" data-es="Acuerdo Operativo">Operating Agreement</span><span class="svc-status s-add">+$79</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Expedited Filing" data-es="Tramitación Acelerada">Expedited Filing</span><span class="svc-status s-add">+$99</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Bank Account Guide" data-es="Guía para Cuenta Bancaria">Bank Account Guide</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="ITIN Application" data-es="Solicitud de ITIN">ITIN Application</span><span class="svc-status s-add">+$69</span></div>
          <div class="svc-row"><span class="svc-name" data-en="DBA / Fictitious Name" data-es="DBA / Nombre Ficticio">DBA / Fictitious Name</span><span class="svc-status s-add">+$49</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Articles of Amendment" data-es="Artículos de Enmienda">Articles of Amendment</span><span class="svc-status s-add">+$59</span></div>
        </div>
      </div>

      <!-- PREMIUM -->
      <div class="pkg-card">
        <div class="pkg-head">
          <div class="pkg-name">Premium</div>
          <div class="pkg-price"><sup>$</sup>249</div>
          <div class="pkg-state-fee" id="fee-premium">+ state fee ($125 LLC)</div>
          <button class="pkg-cta pkg-cta-premium" onclick="openFormFromPkg('premium')">Get Started with Premium</button>
        </div>
        <hr class="pkg-divider"/>
        <div class="pkg-services">
          <div class="svc-row"><span class="svc-name" data-en="LLC or Corporation Formation" data-es="Formación de LLC o Corporación">LLC or Corporation Formation</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="FL Certificate of Formation" data-es="Certificado de Formación FL">FL Certificate of Formation</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Name Availability Search" data-es="Búsqueda de Nombre Disponible">Name Availability Search</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="EIN / Tax ID Number" data-es="EIN / Número de Identificación Fiscal">EIN / Tax ID Number</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Operating Agreement" data-es="Acuerdo Operativo">Operating Agreement</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Expedited Filing" data-es="Tramitación Acelerada">Expedited Filing</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Bank Account Guide" data-es="Guía para Cuenta Bancaria">Bank Account Guide</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="ITIN Application" data-es="Solicitud de ITIN">ITIN Application</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="DBA / Fictitious Name" data-es="DBA / Nombre Ficticio">DBA / Fictitious Name</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name" data-en="Articles of Amendment" data-es="Artículos de Enmienda">Articles of Amendment</span><span class="svc-status s-check">&#10003;</span></div>
        </div>
      </div>

    </div><!-- /pricing-grid -->
  </div>
</div>

<!-- DETAILED COMPARE TABLE -->
<section class="compare-section">
  <div class="compare-inner">
    <div style="text-align:center;margin-bottom:12px">
      <span class="section-label"><span data-en="Full Comparison" data-es="Comparación Completa">Full Comparison</span></span>
      <h2 class="section-title"><span data-en="Everything Included — Side by Side" data-es="Todo Incluido — Comparación Completa">Everything Included — Side by Side</span></h2>
    </div>
    <table class="compare-table">
      <thead>
        <tr>
          <th style="width:44%">Service</th>
          <th class="th-basic">Basic<br/><span style="font-size:1rem;color:var(--gray800);font-family:'Fraunces',serif">$49</span></th>
          <th class="th-standard">Standard<br/><span style="font-size:1rem;color:var(--blue);font-family:'Fraunces',serif">$149</span></th>
          <th class="th-premium">Premium<br/><span style="font-size:1rem;color:var(--navy);font-family:'Fraunces',serif">$249</span></th>
        </tr>
      </thead>
      <tbody>
        <tr class="cat-row"><td colspan="4"><span data-en="Core Formation" data-es="Formación Base">Core Formation</span></td></tr>
        <tr><td><span data-en="LLC or Corporation Formation Filing" data-es="Formación de LLC o Corporación">LLC or Corporation Formation Filing</span></td><td class="td-check">&#10003;</td><td class="td-check">&#10003;</td><td class="td-check">&#10003;</td></tr>
        <tr><td>FL Certificate of Formation</td><td class="td-check">&#10003;</td><td class="td-check">&#10003;</td><td class="td-check">&#10003;</td></tr>
        <tr><td>Name Availability Search</td><td class="td-check">&#10003;</td><td class="td-check">&#10003;</td><td class="td-check">&#10003;</td></tr>
        <tr><td><span data-en="Expert Document Review" data-es="Revisión Experta de Documentos">Expert Document Review</span></td><td class="td-check">&#10003;</td><td class="td-check">&#10003;</td><td class="td-check">&#10003;</td></tr>
        <tr class="cat-row"><td colspan="4"><span data-en="Business Setup Essentials" data-es="Configuración Esencial del Negocio">Business Setup Essentials</span></td></tr>
        <tr><td>EIN / Tax ID Number</td><td class="td-add">+$49</td><td class="td-inc">Included &#10003;</td><td class="td-inc">Included &#10003;</td></tr>
        <tr><td><span data-en="Operating Agreement (LLC) / Bylaws (Corp)" data-es="Acuerdo Operativo (LLC) / Estatutos (Corp)">Operating Agreement (LLC) / Bylaws (Corp)</span></td><td class="td-add">+$79</td><td class="td-add">+$79</td><td class="td-inc">Included &#10003;</td></tr>
        <tr><td><span data-en="Bank Account Setup Guide" data-es="Guía para Apertura de Cuenta Bancaria">Bank Account Setup Guide</span></td><td class="td-add">+$29</td><td class="td-inc">Included &#10003;</td><td class="td-inc">Included &#10003;</td></tr>
        <tr class="cat-row"><td colspan="4"><span data-en="Additional Services" data-es="Servicios Adicionales">Additional Services</span></td></tr>
        <tr><td><span data-en="Expedited Filing (1–3 business days)" data-es="Tramitación Acelerada (1–3 días hábiles)">Expedited Filing (1–3 business days)</span></td><td class="td-add">+$99</td><td class="td-add">+$99</td><td class="td-inc">Included &#10003;</td></tr>
        <tr><td><span data-en="ITIN Application (Foreign Nationals)" data-es="Solicitud de ITIN (Extranjeros)">ITIN Application (Foreign Nationals)</span></td><td class="td-add">+$69</td><td class="td-add">+$69</td><td class="td-inc">Included &#10003;</td></tr>
        <tr><td><span data-en="DBA / Fictitious Name Filing" data-es="DBA / Registro de Nombre Ficticio">DBA / Fictitious Name Filing</span></td><td class="td-add">+$49</td><td class="td-add">+$49</td><td class="td-inc">Included &#10003;</td></tr>
        <tr><td>Articles of Amendment</td><td class="td-add">+$59</td><td class="td-add">+$59</td><td class="td-inc">Included &#10003;</td></tr>
      </tbody>
    </table>
  </div>
</section>

<!-- FAQ -->
<section class="faq-section">
  <div class="faq-inner">
    <div style="text-align:center;margin-bottom:36px">
      <span class="section-label">FAQ</span>
      <h2 class="section-title">Which Package Is Right for Me?</h2>
    </div>
    <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)"><span id="faq-q1" data-en="What is the difference between an LLC and a Corporation?" data-es="¿Cuál es la diferencia entre una LLC y una Corporación?">What is the difference between an LLC and a Corporation?</span><i class="faq-icon">+</i></button><div class="faq-a" id="faq-a1" data-en="An LLC offers flexible management and pass-through taxation — ideal for most small businesses. A Corporation is better for businesses seeking investors, issuing stock, or planning rapid growth. Both protect your personal assets from business liabilities. Not sure? Contact us — it's a free 5-minute conversation." data-es="Una LLC ofrece gestión flexible e impuestos simplificados — ideal para la mayoría de las pequeñas empresas. Una Corporación es mejor para negocios que buscan inversionistas, emitir acciones o planean crecer rápidamente. Ambas protegen tus activos personales. ¿No sabes cuál? Contáctanos — es una conversación gratuita de 5 minutos.">An LLC offers flexible management and pass-through taxation — ideal for most small businesses. A Corporation is better for businesses seeking investors, issuing stock, or planning rapid growth. Both protect your personal assets from business liabilities. Not sure? Contact us — it's a free 5-minute conversation.</div></div>
    <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)"><span id="faq-q2" data-en="Is the Basic package enough to open a bank account?" data-es="¿El paquete Basic es suficiente para abrir una cuenta bancaria?">Is the Basic package enough to open a bank account?</span><i class="faq-icon">+</i></button><div class="faq-a" id="faq-a2" data-en="The Basic package gives you the Certificate of Formation, but most banks also require your EIN and Operating Agreement. That's why most clients choose Standard — it includes the EIN and Bank Account Guide. If you already have an EIN, Basic may work for you." data-es="El paquete Basic te da el Certificado de Formación, pero la mayoría de los bancos también requieren tu EIN y Acuerdo Operativo. Por eso la mayoría de nuestros clientes elige Standard — incluye el EIN y la Guía Bancaria. Si ya tienes un EIN, Basic podría funcionar para ti.">The Basic package gives you the Certificate of Formation, but most banks also require your EIN and Operating Agreement. That's why most clients choose Standard — it includes the EIN and Bank Account Guide. If you already have an EIN, Basic may work for you.</div></div>
    <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)"><span id="faq-q3" data-en="Why do I need an Operating Agreement?" data-es="¿Por qué necesito un Acuerdo Operativo?">Why do I need an Operating Agreement?</span><i class="faq-icon">+</i></button><div class="faq-a" id="faq-a3" data-en="An Operating Agreement documents the rules of your LLC — ownership percentages, management structure, and what happens if a member leaves. Most Florida banks require it alongside your EIN to open a business checking account. Even if you're a single-member LLC, it adds credibility and legal protection." data-es="Un Acuerdo Operativo documenta las reglas de tu LLC — porcentajes de propiedad, estructura de gestión, y qué ocurre si un miembro se retira. La mayoría de los bancos de Florida lo requieren junto con el EIN para abrir una cuenta empresarial. Incluso si eres una LLC de un solo miembro, agrega credibilidad y protección legal.">An Operating Agreement documents the rules of your LLC — ownership percentages, management structure, and what happens if a member leaves. Most Florida banks require it alongside your EIN to open a business checking account. Even if you're a single-member LLC, it adds credibility and legal protection.</div></div>
    <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)"><span id="faq-q4" data-en="How long does the formation process take?" data-es="¿Cuánto dura el proceso de formación?">How long does the formation process take?</span><i class="faq-icon">+</i></button><div class="faq-a">Standard filing with the Florida Division of Corporations typically takes 7–10 business days. With Expedited Filing (+$99, or included free in Premium), processing is reduced to 1–3 business days. We begin your filing the same business day we receive your completed order.</div></div>
    <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)"><span id="faq-q5" data-en="Are the Florida state fees included in the package price?" data-es="¿Están incluidas las tarifas estatales de Florida en el precio del paquete?">Are the Florida state fees included in the package price?</span><i class="faq-icon">+</i></button><div class="faq-a" id="faq-a5" data-en="No. Florida state filing fees ($125 for LLC, $70 for Corporation) are paid directly to the State of Florida and are separate from our service fees. These are government fees set by the Florida Division of Corporations and are not within our control." data-es="No. Las tarifas estatales de Florida ($125 para LLC, $70 para Corporación) se pagan directamente al Estado de Florida y son independientes de nuestras tarifas de servicio. Son cargos gubernamentales establecidos por la División de Corporaciones de Florida.">No. Florida state filing fees ($125 for LLC, $70 for Corporation) are paid directly to the State of Florida and are separate from our service fees. These are government fees set by the Florida Division of Corporations and are not within our control.</div></div>
    <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)"><span id="faq-q6" data-en="Can I start a Florida business if I live in another country?" data-es="¿Puedo iniciar un negocio en Florida si vivo en otro país?">Can I start a Florida business if I live in another country?</span><i class="faq-icon">+</i></button><div class="faq-a" id="faq-a6" data-en="Yes. There are no residency requirements to form an LLC or Corporation in Florida. You will need a Florida Registered Agent (which we provide) and possibly an ITIN if you don't have a Social Security Number. The Premium package includes ITIN assistance." data-es="Sí. No hay requisitos de residencia para formar una LLC o Corporación en Florida. Necesitarás un Agente Registrado en Florida (que nosotros proveemos) y posiblemente un ITIN si no tienes número de Seguro Social. El paquete Premium incluye asistencia para el ITIN.">Yes. There are no residency requirements to form an LLC or Corporation in Florida. You will need a Florida Registered Agent (which we provide) and possibly an ITIN if you don't have a Social Security Number. The Premium package includes ITIN assistance.</div></div>
  </div>
</section>

<!-- HELP BAR -->
<div class="help-section">
  <div class="help-bar">
    <div class="help-text">
      <strong>Not sure which package is right for you? We're here.</strong>
      <p>Our formation experts answer your questions at no extra cost — via WhatsApp or a free 15-min call.</p>
    </div>
    <div class="help-btns">
      <button class="btn-wa" onclick="window.open('https://wa.me/1XXXXXXXXXX','_blank')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Chat on WhatsApp
      </button>
      <button class="btn-cal" onclick="window.open('https://calendly.com/PLACEHOLDER','_blank')">&#128197; Free 15-Min Consultation</button>
    </div>
  </div>
</div>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo-mark" style="display:inline-flex;margin-bottom:12px">FL</div>
        <div style="font-family:'Fraunces',serif;color:#fff;font-size:.95rem;font-weight:600;margin-bottom:6px">Florida Business Formation Center</div>
        <p>Professional business formation services for entrepreneurs and investors throughout Florida.</p>
        <p style="margin-top:9px;color:rgba(255,255,255,.35);font-size:.72rem">&#128231; <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="5c35323a331c31253e292f3532392f2f3a332e313d28353332723f3331">[email&#160;protected]</a></p>
      </div>
      <div class="footer-col">
        <h5>Formation</h5>
        <a href="paquetes.html?entity=llc">LLC Formation</a>
        <a href="paquetes.html?entity=corp">Corporation Formation</a>
        <a href="servicios.html#registered-agent">Registered Agent</a>
        <a href="servicios.html#ein">EIN / Tax ID</a>
        <a href="servicios.html#operating-agreement">Operating Agreement</a>
      </div>
      <div class="footer-col">
        <h5>Add-On Services</h5>
        <a href="servicios.html#itin">ITIN Application</a>
        <a href="servicios.html#dba">DBA / Fictitious Name</a>
        <a href="servicios.html#amendment">Articles of Amendment</a>
        <a href="servicios.html#virtual-address">Virtual Mailing Address</a>
        <a href="servicios.html#annual-report">Annual Report Filing</a>
      </div>
      <div class="footer-col">
        <h5>Company</h5>
        <a href="mybusinessformation.html">Home</a>
        <a href="mybusinessformation.html#how">How It Works</a>
        <a href="mybusinessformation.html#faq">FAQ</a>
        <a href="mybusinessformation.html#contact">Contact</a>
      </div>
    </div>
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div>
        <div class="footer-copy">&#169; 2025 Florida Business Formation Center &middot; mybusinessformation.com &middot; All Rights Reserved.</div>
        <div class="footer-links" style="margin-top:6px">
          <a href="terms.html">Terms &amp; Conditions</a>
          <a href="privacy.html">Privacy Policy</a>
          <a href="legal.html">Legal Disclaimer</a>
          <a href="about.html">About Us</a>
        </div>
      </div>
      <div class="footer-disclaimer">
        <strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>
        Florida Business Formation Center is a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant.
      </div>
    </div>
  </div>
</footer>

<!-- WA FLOAT -->
<a class="wa-float" href="https://wa.me/1XXXXXXXXXX" target="_blank">
  <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>

<!-- FORM MODAL (full formation form embedded) -->
<div class="form-overlay" id="formOverlay">
  <div class="form-modal">
    <div class="form-header">
      <div class="form-header-top">
        <h3 id="form-step-title">Start Your Business</h3>
        <button class="form-close" onclick="closeForm()">&#x2715;</button>
      </div>
      <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:8%"></div></div>
      <div class="progress-text" id="progressText">Step 1 of 13</div>
    </div>
    <div class="form-body">
      <!-- STEP 1 -->
      <div class="form-step active" id="step1">
        <div class="step-title">Are you applying as an individual or a company?</div>
        <div class="step-sub">This tells us how to prepare your ownership documents.</div>
        <div class="choice-grid">
          <div class="choice-card" onclick="selectChoice(this,'filer','individual')"><div class="choice-icon">&#128100;</div><strong>Individual / Natural Person</strong><p>One or more people will own this business. Most common.</p></div>
          <div class="choice-card" onclick="selectChoice(this,'filer','company')"><div class="choice-icon">&#127970;</div><strong>Owned by an Existing Company</strong><p>Another business entity will own this new company.</p></div>
        </div>
        <div id="agent-fields" style="display:none;margin-top:14px">
          <div class="form-group"><label class="form-label">Name of the Owning Company</label><input type="text" class="form-input" placeholder="e.g. ABC Holdings LLC"/></div>
          <div class="form-group"><label class="form-label">Authorized Representative Name</label><input type="text" class="form-input" placeholder="Full legal name"/></div>
        </div>
        <div class="form-footer"><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save &amp; Continue Later</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
        <div class="form-help"><p><strong>Not sure?</strong> We're happy to guide you.</p><div class="form-help-btns"><button class="fh-wa">&#x1F4AC; WhatsApp</button><button class="fh-cal">&#x1F4C5; Programar una Llamada</button></div></div>
      </div>
      <!-- STEP 2: Package confirm -->
      <div class="form-step" id="step2">
        <div class="step-title">Confirm your package</div>
        <div class="step-sub">Your selected package. You can change it here.</div>
        <div class="pkg-choice-grid">
          <div class="pkg-choice" onclick="selectPkg(this,'basic')"><div class="pc-name">Basic</div><div class="pc-price">$49</div><div class="pc-items">&#10003; Formation<br/>&#10003; Name search<br/>&#10003; Certificate</div></div>
          <div class="pkg-choice pop" onclick="selectPkg(this,'standard')"><div style="font-size:.62rem;font-weight:600;color:var(--green);margin-bottom:3px">&#11088; MOST POPULAR</div><div class="pc-name">Standard</div><div class="pc-price">$149</div><div class="pc-items">&#10003; + EIN<br/>&#10003; + Bank Guide<br/>&#10003; Everything Basic</div></div>
          <div class="pkg-choice" onclick="selectPkg(this,'premium')"><div class="pc-name">Premium</div><div class="pc-price">$249</div><div class="pc-items">&#10003; Everything included<br/>&#10003; Operating Agreement<br/>&#10003; Expedited Filing</div></div>
        </div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 3: Business Name -->
      <div class="form-step" id="step3">
        <div class="step-title">What will you name your business?</div>
        <div class="step-sub">Must end with "LLC" or "Corp/Inc". We verify availability before filing.</div>
        <div class="name-helper">&#x2705; <strong>We verify your name.</strong> We confirm availability with the Florida Division of Corporations before filing — no action needed on your part.</div>
        <div class="form-group"><label class="form-label">Preferred Business Name *</label><input type="text" class="form-input" placeholder="e.g. Sunshine Ventures LLC"/></div>
        <div class="form-group"><label class="form-label">Alternative Name #1</label><input type="text" class="form-input" placeholder="Backup if preferred name is taken"/></div>
        <div class="form-group"><label class="form-label">Alternative Name #2</label><input type="text" class="form-input" placeholder="Second backup option"/></div>
        <div class="form-group"><label class="form-label">Requested Effective Date (optional)</label><input type="date" class="form-input"/></div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 4: Address -->
      <div class="form-step" id="step4">
        <div class="step-title">Business address</div>
        <div class="step-sub">Principal office — must be a physical street address (no PO Box).</div>
        <div class="form-group"><label class="form-label">Street Address *</label><input type="text" class="form-input" placeholder="123 Main Street, Suite 100"/></div>
        <div class="form-row"><div class="form-group"><label class="form-label">City *</label><input type="text" class="form-input" placeholder="Miami"/></div><div class="form-group"><label class="form-label">ZIP Code *</label><input type="text" class="form-input" placeholder="33101"/></div></div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.82rem;color:var(--gray600);margin-bottom:6px"><input type="checkbox" id="diffMailing"/> Different mailing address (PO Box accepted)</label>
        <div id="mailing-fields" style="display:none;margin-top:11px">
          <div class="form-group"><label class="form-label">Mailing Address</label><input type="text" class="form-input" placeholder="PO Box or mailing address"/></div>
          <div class="form-row"><div class="form-group"><label class="form-label">City</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div>
        </div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 5: Purpose -->
      <div class="form-step" id="step5">
        <div class="step-title">Business description</div>
        <div class="step-sub">Your industry and business purpose. Required for Corporations.</div>
        <div class="form-group"><label class="form-label">Industry *</label><select class="select-input"><option value="">Select your industry...</option><option>Retail &amp; E-Commerce</option><option>Restaurant &amp; Food Service</option><option>Real Estate &amp; Property</option><option>Construction &amp; Contracting</option><option>Technology &amp; Software</option><option>Consulting &amp; Professional Services</option><option>Health &amp; Wellness</option><option>Transportation &amp; Logistics</option><option>Import / Export</option><option>Beauty &amp; Personal Care</option><option>Finance &amp; Accounting</option><option>Other</option></select></div>
        <div class="form-group"><label class="form-label">Business Purpose</label><textarea class="form-input" rows="3" placeholder="e.g. To engage in any lawful business activity permitted under Florida law..."></textarea></div>
        <div class="form-group" id="shares-group" style="display:none"><label class="form-label">Authorized Shares * <span style="font-size:.7rem;color:var(--gray400)">(Corporations — min. 1)</span></label><input type="number" class="form-input" placeholder="e.g. 1000" min="1"/></div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 6: Members -->
      <div class="form-step" id="step6">
        <div class="step-title">Members / Owners</div>
        <div class="step-sub">Tell us about the ownership structure of your business.</div>
        <div class="form-group"><label class="form-label">Management Structure</label><div class="choice-grid" style="margin-bottom:0"><div class="choice-card" onclick="selectChoice(this,'mgmt','member')" style="padding:13px"><strong style="font-size:.85rem">Member-Managed</strong><p style="font-size:.72rem">Owners manage directly. Most common.</p></div><div class="choice-card" onclick="selectChoice(this,'mgmt','manager')" style="padding:13px"><strong style="font-size:.85rem">Manager-Managed</strong><p style="font-size:.72rem">Designated manager runs operations.</p></div></div></div>
        <div style="margin-top:18px"><label class="form-label">Members / Owners</label>
        <div id="members-container"><div class="member-block" id="member-1"><h5>Member #1 (Primary Owner)</h5><div class="form-row"><div class="form-group"><label class="form-label">First Name *</label><input type="text" class="form-input" placeholder="First name"/></div><div class="form-group"><label class="form-label">Last Name *</label><input type="text" class="form-input" placeholder="Last name"/></div></div><div class="form-group"><label class="form-label">Street Address *</label><input type="text" class="form-input" placeholder="Full address"/></div><div class="form-row"><div class="form-group"><label class="form-label">Role</label><select class="select-input"><option>Manager (MGR)</option><option>Authorized Rep (AR)</option><option>Officer</option><option>Director</option></select></div><div class="form-group"><label class="form-label">Ownership %</label><input type="number" class="form-input ownership-input" placeholder="e.g. 100" min="0" max="100" oninput="updateOwnership()"/></div></div></div></div>
        <button class="btn-add-member" onclick="addMember()">+ Add Another Member</button>
        <div class="ownership-total" id="ownershipTotal"><span>Total Ownership</span><strong id="ownershipSum">0%</strong></div></div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 7: Registered Agent -->
      <div class="form-step" id="step7">
        <div class="step-title">Registered Agent</div>
        <div class="step-sub">Every Florida LLC and Corporation must designate a Registered Agent with a physical FL address.</div>
        <div class="addon-card" style="border-color:var(--blue)"><div class="addon-head"><div class="addon-title">Use our Registered Agent service?</div><div class="addon-price">Annual Fee</div></div><div class="addon-desc">Receives all official legal documents, tax notices, and service of process on your behalf.</div><div class="addon-benefit">&#x1F3E6; Required by Florida law. Without one, your company can be dissolved.</div><div class="addon-btns"><button class="btn-addon-yes" onclick="selectAddon(this,'ra',true)">&#10003; Yes — Use Your Service</button><button class="btn-addon-no" onclick="selectAddon(this,'ra',false)">I have my own agent</button></div></div>
        <div id="own-agent-fields" style="display:none;margin-top:4px"><div class="form-group"><label class="form-label">Agent Name *</label><input type="text" class="form-input" placeholder="Full legal name or company name"/></div><div class="form-group"><label class="form-label">FL Street Address * (No PO Box)</label><input type="text" class="form-input" placeholder="Street address in Florida"/></div><div class="form-row"><div class="form-group"><label class="form-label">City</label><input type="text" class="form-input" placeholder="City"/></div><div class="form-group"><label class="form-label">ZIP</label><input type="text" class="form-input" placeholder="ZIP"/></div></div><div class="form-group"><label class="form-label">Agent Electronic Signature *</label><input type="text" class="form-input" placeholder="Type full legal name"/></div></div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 8: EIN -->
      <div class="form-step" id="step8">
        <div class="step-title">EIN / Tax ID Number</div>
        <div class="step-sub">Your federal Employer Identification Number from the IRS.</div>
        <div class="addon-card"><div class="addon-head"><div class="addon-title">Add EIN Service</div><div class="addon-price" id="ein-price-lbl">$49</div></div><div class="addon-desc">Nine-digit IRS number that identifies your business for federal tax purposes.</div><div class="addon-benefit">&#x1F3E6; Banks require your EIN to open a business checking account.</div><div class="addon-btns"><button class="btn-addon-yes" onclick="selectAddon(this,'ein',true)" id="ein-yes-btn">&#10003; Add EIN — $49</button><button class="btn-addon-no" onclick="selectAddon(this,'ein',false)">No thanks</button></div></div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 9: OA -->
      <div class="form-step" id="step9">
        <div class="step-title">Operating Agreement</div>
        <div class="step-sub">Internal governing document for your LLC — defines ownership and management rules.</div>
        <div class="addon-card"><div class="addon-head"><div class="addon-title">Add Operating Agreement</div><div class="addon-price" id="oa-price-lbl">$79</div></div><div class="addon-desc">Documents ownership percentages, decision-making, profit distribution, and member rights.</div><div class="addon-benefit">&#x1F3E6; Most banks require an Operating Agreement to open a business account.</div><div class="addon-btns"><button class="btn-addon-yes" onclick="selectAddon(this,'oa',true)" id="oa-yes-btn">&#10003; Add Operating Agreement — $79</button><button class="btn-addon-no" onclick="selectAddon(this,'oa',false)">No thanks</button></div></div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 10: ITIN -->
      <div class="form-step" id="step10">
        <div class="step-title">ITIN Application</div>
        <div class="step-sub">For foreign nationals who need a US taxpayer identification number.</div>
        <div class="addon-card"><div class="addon-head"><div class="addon-title">Add ITIN Service</div><div class="addon-price" id="itin-price-lbl">$69</div></div><div class="addon-desc">IRS-issued number for individuals who need to file US taxes but aren't eligible for an SSN.</div><div class="addon-benefit">&#x1F4CB; Required to file US federal taxes without an SSN.</div><div class="addon-btns"><button class="btn-addon-yes" onclick="selectAddon(this,'itin',true)" id="itin-yes-btn">&#10003; Add ITIN — $69</button><button class="btn-addon-no" onclick="selectAddon(this,'itin',false)">I have an SSN</button></div></div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 11: VMA + AR -->
      <div class="form-step" id="step11">
        <div class="step-title">Address &amp; Compliance</div>
        <div class="step-sub">Protect your privacy and keep your business in good standing.</div>
        <div class="addon-card" style="margin-bottom:13px"><div class="addon-head"><div class="addon-title">Virtual Mailing Address</div><div class="addon-price">$29/mo</div></div><div class="addon-desc">Professional FL business address. We receive and digitally forward your mail.</div><div class="addon-benefit">&#x1F512; Your home address stays private on all public Florida records.</div><div class="addon-btns"><button class="btn-addon-yes" onclick="selectAddon(this,'vma',true)">&#10003; Add — $29/mo</button><button class="btn-addon-no" onclick="selectAddon(this,'vma',false)">No thanks</button></div></div>
        <div class="addon-card"><div class="addon-head"><div class="addon-title">Annual Report Filing</div><div class="addon-price">Annual</div></div><div class="addon-desc">Every FL business must file an Annual Report Jan 1–May 1. Missing it = $400 late fee + possible dissolution.</div><div class="addon-benefit">&#x1F4C5; We file automatically every year — on time, every time.</div><div class="addon-btns"><button class="btn-addon-yes" onclick="selectAddon(this,'ar',true)">&#10003; Add Annual Report</button><button class="btn-addon-no" onclick="selectAddon(this,'ar',false)">I'll handle it</button></div></div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 12: Web + Phone -->
      <div class="form-step" id="step12">
        <div class="step-title">Online Presence</div>
        <div class="step-sub">Build your professional business presence from day one.</div>
        <div class="addon-card" style="margin-bottom:13px"><div class="addon-head"><div class="addon-title">Professional Website</div><div class="addon-price">Custom</div></div><div class="addon-desc">Modern, mobile-friendly website tailored to your industry and brand.</div><div class="addon-benefit">&#x1F310; A professional website builds instant credibility.</div><div class="addon-btns"><button class="btn-addon-yes" onclick="selectAddon(this,'web',true)">&#10003; I'm Interested</button><button class="btn-addon-no" onclick="selectAddon(this,'web',false)">Not now</button></div></div>
        <div class="addon-card"><div class="addon-head"><div class="addon-title">Business Phone Number</div><div class="addon-price">Monthly</div></div><div class="addon-desc">Dedicated local or toll-free number. Keep personal &amp; business calls separate.</div><div class="addon-benefit">&#x1F4DE; Looks more professional on business cards and websites.</div><div class="addon-btns"><button class="btn-addon-yes" onclick="selectAddon(this,'phone',true)">&#10003; I'm Interested</button><button class="btn-addon-no" onclick="selectAddon(this,'phone',false)">Not now</button></div></div>
        <div class="form-footer"><button class="btn-back" onclick="prevStep()">&#8592; Back</button><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save</button><button class="btn-next" onclick="nextStep()">Continue &#8594;</button></div>
      </div>
      <!-- STEP 13: Summary -->
      <div class="form-step" id="step13">
        <div class="step-title">Filing speed &amp; order summary</div>
        <div class="step-sub">Choose your filing speed and review your order.</div>
        <div class="form-group"><label class="form-label">Filing Speed</label><div class="delivery-opts"><div class="delivery-card" onclick="selectDelivery(this,'standard')"><strong>Standard Filing</strong><span>7–10 business days</span><div class="d-price">Included in all packages</div></div><div class="delivery-card" onclick="selectDelivery(this,'expedited')"><strong>&#9889; Expedited Filing</strong><span>1–3 business days</span><div class="d-price" id="exp-price-lbl">+ $99</div></div></div></div>
        <div style="margin-top:20px"><div style="font-size:.77rem;font-weight:600;color:var(--gray400);text-transform:uppercase;letter-spacing:.5px;margin-bottom:9px">Order Summary</div>
        <table class="summary-table"><tr><td id="sum-pkg">Formation Package</td><td id="sum-pkg-price">$149</td></tr><tr><td>Florida State Filing Fee</td><td id="sum-state">$125</td></tr><tr id="sum-ra-row" style="display:none"><td>Registered Agent</td><td>Annual</td></tr><tr id="sum-ein-row" style="display:none"><td>EIN / Tax ID</td><td>$49</td></tr><tr id="sum-oa-row" style="display:none"><td>Operating Agreement</td><td>$79</td></tr><tr id="sum-itin-row" style="display:none"><td>ITIN Application</td><td>$69</td></tr><tr id="sum-vma-row" style="display:none"><td>Virtual Address</td><td>$29/mo</td></tr><tr id="sum-ar-row" style="display:none"><td>Annual Report</td><td>Annual</td></tr><tr id="sum-exp-row" style="display:none"><td>Expedited Filing</td><td id="sum-exp-price">$99</td></tr></table>
        <div class="summary-total"><span>Total Due Today</span><span id="summary-total-price">$274</span></div></div>
        <div class="form-group"><label class="form-label">Email for Confirmation *</label><input type="email" class="form-input" placeholder="your@email.com"/></div>
        <div class="form-group"><label class="form-label">Electronic Signature *</label><input type="text" class="form-input" placeholder="Type your full legal name"/><div style="font-size:.72rem;color:var(--gray400);margin-top:4px">By signing, you confirm accuracy and authorize us to file on your behalf.</div></div>
        <div style="font-size:.73rem;color:var(--gray400);padding:11px;background:var(--gray50);border-radius:8px;margin-bottom:16px;line-height:1.6">&#9888; Florida Business Formation Center is not a law firm. We do not provide legal, tax, or financial advice.</div>
        <button class="btn-submit" onclick="submitForm()">&#x1F680; Submit Order &amp; Pay Securely</button>
        <div style="text-align:center;margin-top:11px"><button class="save-btn" onclick="saveOrder()">&#x1F4BE; Save &amp; Pay Later</button></div>
      </div>
      <!-- SUCCESS -->
      <div class="form-step" id="stepSuccess">
        <div class="success-screen">
          <div class="success-icon">&#x1F389;</div>
          <h3>Order Submitted!</h3>
          <p>Your application is in expert hands. We'll begin the filing process with the Florida Division of Corporations right away.</p>
          <div class="order-display"><span>Your Order Number</span><strong id="finalOrderNum">FBFC-00000</strong></div>
          <p style="font-size:.81rem;color:var(--gray600);margin-bottom:18px">Save this number to check status or resume anytime.</p>
          <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap"><button class="btn-wa">&#x1F4AC; WhatsApp Us</button><button style="background:var(--navy);color:#fff;padding:10px 20px;border-radius:8px;font-size:.84rem;font-weight:600;border:none;cursor:pointer;font-family:inherit" onclick="closeForm()">Back to Packages</button></div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
var currentStep=1,totalSteps=13,selectedEntity='llc',skipPkgStep=false;
var formData={filer:'',entity:'llc',package:'standard',addons:{}};
var memberCount=1,orderNumber='';

// Read URL params on load
(function(){
  var p=new URLSearchParams(window.location.search);
  var e=p.get('entity')||p.get('pkg');
  if(e==='corp'){setEntity('corp');}
  var pkg=p.get('package');
  if(pkg){formData.package=pkg;}
})();

function setEntity(type){
  selectedEntity=type;formData.entity=type;
  document.getElementById('et-llc').classList.toggle('active',type==='llc');
  document.getElementById('et-corp').classList.toggle('active',type==='corp');
  var isEs=document.getElementById('btn-es').classList.contains('active');
  var fee=type==='llc'?(isEs?'$125 LLC':'$125 LLC'):(isEs?'$70 Corporación':'$70 Corporation');
  var feeLbl=isEs?'+ cargo estatal (':'+ state fee (';
  ['basic','standard','premium'].forEach(function(p){var el=document.getElementById('fee-'+p);if(el)el.textContent=feeLbl+fee+')';});
  if(type==='llc'){
    document.getElementById('et-desc').innerHTML=isEs?'Gestión flexible e impuestos simplificados. La más popular para emprendedores y pequeñas empresas. Cargo estatal: <strong>$125</strong>':'Flexible management &amp; pass-through taxation. Most popular for entrepreneurs &amp; small businesses. State fee: <strong>$125</strong>';
  } else {
    document.getElementById('et-desc').innerHTML=isEs?'Estructura formal para captar capital e inversionistas. Cargo estatal: <strong>$70</strong>':'Formal structure for raising investment capital and issuing stock. State fee: <strong>$70</strong>';
  }
  document.getElementById('state-fee-note').textContent=isEs?'* Cargo estatal de Florida: '+fee+' — pagado directamente al Estado de Florida, no incluido en el precio del paquete.':'* Florida state filing fee: '+fee+' — paid directly to the State of Florida, not included in package price.';
}
function openFormFromPkg(pkg){
  formData.package=pkg;formData.entity=selectedEntity;skipPkgStep=false;
  document.getElementById('formOverlay').classList.add('active');document.body.style.overflow='hidden';
  generateOrderNumber();goToStep(1);updateTotal();
  var isEs=document.getElementById('btn-es').classList.contains('active');
  if(isEs) translateFormContent('es');
}
function openForm(){
  document.getElementById('formOverlay').classList.add('active');document.body.style.overflow='hidden';
  generateOrderNumber();goToStep(1);updateTotal();
  var isEs=document.getElementById('btn-es').classList.contains('active');
  if(isEs) translateFormContent('es');
}
function closeForm(){document.getElementById('formOverlay').classList.remove('active');document.body.style.overflow='';}
function generateOrderNumber(){if(!orderNumber)orderNumber='FBFC-'+Math.floor(10000+Math.random()*90000);}
function goToStep(n){
  document.querySelectorAll('.form-step').forEach(function(s){s.classList.remove('active');});
  var el=document.getElementById('step'+n);if(el){el.classList.add('active');currentStep=n;}
  updateProgress();
  var sg=document.getElementById('shares-group');if(sg)sg.style.display=formData.entity==='corp'?'block':'none';
  document.querySelector('.form-modal').scrollTop=0;
  var isEs=document.getElementById('btn-es').classList.contains('active');
  if(isEs) setTimeout(function(){translateFormContent('es');},10);
}
function nextStep(){var n=currentStep+1;if(n<=totalSteps)goToStep(n);}
function prevStep(){var n=currentStep-1;if(n>=1)goToStep(n);}
function updateProgress(){
  var pct=Math.round((currentStep/totalSteps)*100);
  document.getElementById('progressFill').style.width=pct+'%';
  document.getElementById('progressText').textContent='Step '+currentStep+' of '+totalSteps;
  var titles=['Individual or Company?','Package','Business Name','Address','Purpose','Members','Registered Agent','EIN','Operating Agreement','ITIN','Address & Compliance','Online Presence','Summary'];
  document.getElementById('form-step-title').textContent=titles[currentStep-1]||'Complete Order';
}
function selectChoice(el,key,val){
  el.parentElement.querySelectorAll('.choice-card').forEach(function(c){c.classList.remove('selected');});
  el.classList.add('selected');formData[key]=val;
  if(key==='filer'){var af=document.getElementById('agent-fields');if(af)af.style.display=val==='company'?'block':'none';}
}
function selectPkg(el,pkg){
  document.querySelectorAll('.pkg-choice').forEach(function(c){c.classList.remove('selected');});
  el.classList.add('selected');formData.package=pkg;updateTotal();
}
function selectAddon(btn,key,val){
  btn.parentElement.querySelectorAll('button').forEach(function(b){b.classList.remove('selected');});
  btn.classList.add('selected');formData.addons[key]=val;
  var rowMap={ein:'sum-ein-row',oa:'sum-oa-row',itin:'sum-itin-row',vma:'sum-vma-row',ar:'sum-ar-row',ra:'sum-ra-row'};
  if(rowMap[key]){var r=document.getElementById(rowMap[key]);if(r)r.style.display=val?'':'none';}
  updateTotal();
}
function selectDelivery(el,type){
  document.querySelectorAll('.delivery-card').forEach(function(c){c.classList.remove('selected');});
  el.classList.add('selected');formData.delivery=type;
  var er=document.getElementById('sum-exp-row');if(er)er.style.display=(type==='expedited'&&formData.package!=='premium')?'':'none';
  updateTotal();
}
function updateTotal(){
  var prices={basic:49,standard:149,premium:249};
  var base=prices[formData.package]||149;
  var state=formData.entity==='corp'?70:125;
  var extras=0;
  if(formData.addons.ein&&formData.package==='basic')extras+=49;
  if(formData.addons.oa&&formData.package!=='premium')extras+=79;
  if(formData.addons.itin&&formData.package!=='premium')extras+=69;
  if(formData.delivery==='expedited'&&formData.package!=='premium')extras+=99;
  document.getElementById('summary-total-price').textContent='$'+(base+state+extras);
  var pkgNames={basic:'Basic Package',standard:'Standard Package',premium:'Premium Package'};
  document.getElementById('sum-pkg').textContent=pkgNames[formData.package]||'Package';
  document.getElementById('sum-pkg-price').textContent='$'+base;
  document.getElementById('sum-state').textContent='$'+state;
  var ep=document.getElementById('exp-price-lbl');if(ep)ep.textContent=formData.package==='premium'?'Included in Premium \\u2713':'+$99';
  // Update step 8 & 9 labels based on package
  var einBtn=document.getElementById('ein-yes-btn');
  if(einBtn){if(formData.package!=='basic'){einBtn.textContent='\\u2713 EIN \\u2014 Included in Your Package';}else{einBtn.textContent='\\u2713 Add EIN \\u2014 $49';}}
  var oaBtn=document.getElementById('oa-yes-btn');
  if(oaBtn){if(formData.package==='premium'){oaBtn.textContent='\\u2713 Operating Agreement \\u2014 Included';}else{oaBtn.textContent='\\u2713 Add Operating Agreement \\u2014 $79';}}
}
function addMember(){
  memberCount++;
  var c=document.getElementById('members-container');
  var d=document.createElement('div');d.className='member-block';d.id='member-'+memberCount;
  d.innerHTML='<button class="btn-remove-member" onclick="removeMember('+memberCount+')">\\u2715</button><h5>Member #'+memberCount+'</h5><div class="form-row"><div class="form-group"><label class="form-label">First Name</label><input type="text" class="form-input" placeholder="First name"/></div><div class="form-group"><label class="form-label">Last Name</label><input type="text" class="form-input" placeholder="Last name"/></div></div><div class="form-group"><label class="form-label">Address</label><input type="text" class="form-input" placeholder="Full address"/></div><div class="form-row"><div class="form-group"><label class="form-label">Role</label><select class="select-input"><option>Manager</option><option>Officer</option><option>Director</option></select></div><div class="form-group"><label class="form-label">Ownership %</label><input type="number" class="form-input ownership-input" placeholder="e.g. 25" oninput="updateOwnership()"/></div></div>';
  c.appendChild(d);
}
function removeMember(n){var el=document.getElementById('member-'+n);if(el)el.remove();updateOwnership();}
function updateOwnership(){
  var total=0;document.querySelectorAll('.ownership-input').forEach(function(i){total+=parseFloat(i.value)||0;});
  document.getElementById('ownershipSum').textContent=Math.round(total)+'%';
  var ct=document.getElementById('ownershipTotal');ct.className='ownership-total'+(total===100?' ok':total>100?' over':'');
}
function toggleFaq(btn){
  var item=btn.parentElement,was=item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(i){i.classList.remove('open');});
  if(!was)item.classList.add('open');
}
function saveOrder(){
  generateOrderNumber();
  var existing=document.querySelector('.order-save-box');if(existing)existing.remove();
  var box=document.createElement('div');box.className='order-save-box';
  box.innerHTML='<div><div class="order-num">'+orderNumber+'</div><p>Saved! Use this number to continue from any device.</p></div>';
  var active=document.querySelector('.form-step.active');
  if(active){var ft=active.querySelector('.form-footer');if(ft)active.insertBefore(box,ft);}
}
function submitForm(){
  generateOrderNumber();
  document.getElementById('finalOrderNum').textContent=orderNumber;
  document.querySelectorAll('.form-step').forEach(function(s){s.classList.remove('active');});
  document.getElementById('stepSuccess').classList.add('active');
  document.getElementById('progressFill').style.width='100%';
  document.getElementById('progressText').textContent='Order Submitted \\u2713';
  document.getElementById('form-step-title').textContent='Order Confirmed!';
  document.querySelector('.form-modal').scrollTop=0;
}
document.getElementById('diffMailing').addEventListener('change',function(){document.getElementById('mailing-fields').style.display=this.checked?'block':'none';});
window.addEventListener('scroll',function(){document.getElementById('mainHeader').style.boxShadow=window.scrollY>30?'0 2px 20px rgba(28,46,68,.1)':'none';});
function setLang(lang){
  localStorage.setItem('flbc_lang', lang);
  var isEs = lang === 'es';
  document.getElementById('btn-en').classList.toggle('active', lang==='en');
  document.getElementById('btn-es').classList.toggle('active', lang==='es');

  // ── All data-en/data-es elements ──────────────────────────────────────
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){
    el.innerHTML = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });

  // ── Hero ──────────────────────────────────────────────────────────────
  var e;
  e=document.getElementById('hero-title');
  if(e) e.innerHTML = isEs ? 'Inicia Tu <em>Negocio en Florida</em> Hoy' : 'Start Your <em>Florida Business</em> Today';
  e=document.getElementById('hero-sub');
  if(e) e.textContent = isEs
    ? 'Formación profesional de LLC y Corporación — tramitación estatal, verificación de nombre y revisión experta incluidos en cada paquete.'
    : 'Professional LLC & Corporation formation — state filing, name search, and expert review included in every package.';
  e=document.getElementById('topbar-text');
  if(e) e.innerHTML = isEs
    ? ' Expertos de confianza en formación de negocios en Florida — <strong>LLC y Corporación</strong> de manera simple. Desde <strong>$49 + cargo estatal.</strong>'
    : ' Florida’s trusted business formation experts — <strong>LLC & Corporation</strong> filing made simple. Start today from <strong>$49 + state fee.</strong>';

  // ── Entity type + packages ────────────────────────────────────────────
  e=document.getElementById('et-label');
  if(e) e.textContent = isEs ? 'Estoy formando una:' : 'I am forming a:';
  e=document.getElementById('lbl-packages');
  if(e) e.textContent = isEs ? 'Paquetes de Formación' : 'Formation Packages';
  e=document.getElementById('pricing-hint');
  if(e) e.innerHTML = isEs
    ? '<strong>¿No sabes cuál elegir?</strong> La mayoría de nuestros clientes elige Standard — incluye EIN y Guía Bancaria, que los bancos normalmente requieren.'
    : '<strong>Not sure which to choose?</strong> Most clients go with Standard — it covers EIN and Bank Account Guide, which banks typically require to open your business account.';

  // ── Package CTA buttons ───────────────────────────────────────────────
  var ctaL = isEs
    ? ['Comenzar con Basic','Comenzar con Standard','Comenzar con Premium']
    : ['Get Started with Basic','Get Started with Standard','Get Started with Premium'];
  var ctas = document.querySelectorAll('.pkg-cta');
  if(ctas.length>=3){ctas[0].textContent=ctaL[0];ctas[1].textContent=ctaL[1];ctas[2].textContent=ctaL[2];}

  // ── Compare / FAQ section labels ──────────────────────────────────────
  var cl=document.querySelector('.compare-section .section-label');
  var ct=document.querySelector('.compare-section .section-title');
  var fl=document.querySelector('.faq-section .section-label');
  var ft=document.querySelector('.faq-section .section-title');
  if(cl) cl.textContent=isEs?'Comparación Completa':'Full Comparison';
  if(ct) ct.textContent=isEs?'Todo Incluido — Lado a Lado':'Everything Included — Side by Side';
  if(fl) fl.textContent=isEs?'Preguntas Frecuentes':'FAQ';
  if(ft) ft.textContent=isEs?'¿Qué Paquete Es el Indicado para Mí?':'Which Package Is Right for Me?';

  // ── FAQ items ─────────────────────────────────────────────────────────
  for(var i=1;i<=6;i++){
    var q=document.getElementById('faq-q'+i), a=document.getElementById('faq-a'+i);
    if(q&&q.getAttribute('data-es')) q.textContent=isEs?q.getAttribute('data-es'):q.getAttribute('data-en');
    if(a&&a.getAttribute('data-es')) a.textContent=isEs?a.getAttribute('data-es'):a.getAttribute('data-en');
  }

  // ── Contact / help section ────────────────────────────────────────────
  e=document.getElementById('help-title');
  if(e) e.textContent=isEs?'¿No sabes por dónde empezar? Estamos aquí para ayudarte.':'Not sure where to start? We’re here for you.';
  e=document.getElementById('help-sub');
  if(e) e.textContent=isEs?'Nuestros expertos están listos para responder tus preguntas sin costo adicional.':'Our formation experts are ready to answer your questions at no additional cost.';
  e=document.getElementById('calBtn');
  if(e) e.textContent=isEs?' Programar una Llamada':' Book a Call';
  e=document.querySelector('.btn-start');
  if(e) e.textContent=isEs?'Iniciar Mi Negocio →':'Start My Business →';

  // ── Nav links ─────────────────────────────────────────────────────────
  document.querySelectorAll('nav a[data-en], nav a[data-es]').forEach(function(el){
    if(el.hasAttribute('data-en')&&el.hasAttribute('data-es'))
      el.textContent=isEs?el.getAttribute('data-es'):el.getAttribute('data-en');
  });

  // ── Footer ────────────────────────────────────────────────────────────
  var footerMap={'Formation':isEs?'Formación':'Formation','LLC Formation':isEs?'Formación de LLC':'LLC Formation','Corporation Formation':isEs?'Formación de Corporación':'Corporation Formation','Registered Agent':isEs?'Agente Registrado':'Registered Agent','EIN / Tax ID':isEs?'EIN / ID Fiscal':'EIN / Tax ID','Operating Agreement':isEs?'Acuerdo Operativo':'Operating Agreement','Add-On Services':isEs?'Servicios Adicionales':'Add-On Services','ITIN Application':isEs?'Solicitud de ITIN':'ITIN Application','DBA / Fictitious Name':isEs?'DBA / Nombre Ficticio':'DBA / Fictitious Name','Articles of Amendment':isEs?'Artículos de Enmienda':'Articles of Amendment','Virtual Mailing Address':isEs?'Dirección Postal Virtual':'Virtual Mailing Address','Annual Report Filing':isEs?'Declaración Anual':'Annual Report Filing','Company':isEs?'Empresa':'Company','Home':isEs?'Inicio':'Home','Formation Packages':isEs?'Paquetes de Formación':'Formation Packages','FAQ':isEs?'Preguntas':'FAQ','Contact':isEs?'Contacto':'Contact','Terms & Conditions':isEs?'Términos y Condiciones':'Terms & Conditions','Privacy Policy':isEs?'Política de Privacidad':'Privacy Policy','Legal Disclaimer':isEs?'Aviso Legal':'Legal Disclaimer'};
  document.querySelectorAll('footer a, footer h5').forEach(function(el){
    var t=el.textContent.trim(); if(footerMap[t]) el.textContent=footerMap[t];
  });

  // ── Open form labels ──────────────────────────────────────────────────
  if(document.getElementById('formOverlay')&&document.getElementById('formOverlay').classList.contains('active')){
    if(typeof translateFormContent==='function') translateFormContent(lang);
  }

  // ── Entity buttons ────────────────────────────────────────────────────
  var etLlc = document.getElementById('et-llc');
  if(etLlc) etLlc.innerHTML = isEs ? '&#127963;&nbsp; LLC' : '&#127963;&nbsp; LLC';
  var etCorp = document.getElementById('et-corp');
  if(etCorp) etCorp.innerHTML = isEs ? '&#128202;&nbsp; Corporación' : '&#128202;&nbsp; Corporation';
  var etDesc = document.getElementById('et-desc');
  if(etDesc) etDesc.innerHTML = isEs
    ? 'Gestión flexible e impuestos simplificados. La más popular para emprendedores y pequeñas empresas. <span id="et-desc-corp" style="display:none">Estructura formal con junta directiva y accionistas. Ideal para inversionistas y negocios en crecimiento.</span>'
    : 'Flexible management &amp; pass-through taxation. Most popular for entrepreneurs &amp; small businesses. <span id="et-desc-corp" style="display:none">Formal structure with board of directors and shareholders. Ideal for investors and growing businesses.</span>';

  // ── State fee notes ───────────────────────────────────────────────────
  document.querySelectorAll('.pkg-state-fee').forEach(function(el){
    if(!el.getAttribute('data-en')) el.setAttribute('data-en', el.textContent.trim());
    el.textContent = isEs ? '+ cargo estatal ($125 LLC)' : '+ state fee ($125 LLC)';
  });
  var sfNote = document.querySelector('.state-fee-note, [class*="state-fee"]');
  if(sfNote && sfNote.tagName !== 'BUTTON') sfNote.textContent = isEs
    ? '* Cargo estatal de Florida: $125 (LLC) o $70 (Corporación) — pagado directamente al Estado.'
    : '* Florida state filing fee: $125 (LLC) or $70 (Corporation) — paid directly to the State.';

  // ── Compare table section headers ─────────────────────────────────────
  var cmpSections = {
    'Core Formation': 'Formación Bsica',
    'Business Identity': 'Identidad Empresarial',
    'Legal & Compliance': 'Legal y Cumplimiento',
    'Financial Setup': 'Configuración Financiera',
    'Support & Speed': 'Soporte y Velocidad',
  };
  document.querySelectorAll('.compare-table .section-header td, .compare-table td[colspan]').forEach(function(el){
    var t = el.textContent.trim();
    if(cmpSections[t]) el.textContent = isEs ? cmpSections[t] : t;
    else {
      Object.keys(cmpSections).forEach(function(en){
        if(el.textContent.trim() === cmpSections[en]) el.textContent = isEs ? cmpSections[en] : en;
      });
    }
  });

  // ── Footer disclaimer ─────────────────────────────────────────────────
  var fd = document.querySelector('.footer-disclaimer');
  if(fd){
    var fdStr = fd.querySelector('strong');
    if(fdStr) fdStr.textContent = isEs ? 'Aviso Importante' : 'Important Notice';
    var fdTxt = Array.from(fd.childNodes).find(function(n){ return n.nodeType===3 && n.textContent.trim().length > 10; });
    if(fdTxt) fdTxt.textContent = isEs
      ? ' Florida Business Formation Center es un servicio profesional de preparación de documentos. No somos una firma legal y no brindamos asesoría legal, fiscal ni financiera. Para asesoría legal, consulta un abogado licenciado en Florida.'
      : ' Florida Business Formation Center is a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. For legal advice, please consult a licensed Florida attorney.';
  }

  // ── Copyright ─────────────────────────────────────────────────────────
  var copy = document.querySelector('.footer-copy');
  if(copy) copy.textContent = isEs
    ? '© 2025 Florida Business Formation Center · Todos los Derechos Reservados.'
    : '© 2025 Florida Business Formation Center · All Rights Reserved.';
}
(function(){var l=localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();

// ── Full form content translation ──────────────────────────────────────────
var formTranslations = {
  en: {
    steps: ['Are you applying as an individual or a company?','Confirm your package','What will you name your business?','Business address','Business description','Members / Owners','Registered Agent','EIN / Tax ID Number','Operating Agreement','ITIN Application','Address & Compliance','Online Presence','Filing speed & order summary'],
    stepSubs: ['This tells us how to prepare your ownership documents.','Your selected package. You can change it here.','Must end with "LLC" or "Corp/Inc". We verify availability before filing.','Principal office — must be a physical street address (no PO Box).','Your industry and business purpose. Required for Corporations.','Tell us about the ownership structure of your business.','Every Florida LLC and Corporation must designate a Registered Agent with a physical FL address.','Your federal Employer Identification Number from the IRS.','Internal governing document for your LLC — defines ownership and management rules.','For foreign nationals who need a US taxpayer identification number.','Protect your privacy and keep your business in good standing.','Build your professional business presence from day one.','Choose your filing speed and review your order.'],
    choice1: ['Individual / Natural Person','One or more people will own this business. Most common.'],
    choice2: ['Owned by an Existing Company','Another business entity will own this new company.'],
    memberManaged: ['Member-Managed','Owners manage directly. Most common.'],
    managerManaged: ['Manager-Managed','Designated manager runs operations.'],
    nameHelper: 'We verify your name. We confirm availability with the Florida Division of Corporations before filing — no action needed on your part.',
    labels: {
      'Name of the Owning Company':'Name of the Owning Company',
      'Authorized Representative Name':'Authorized Representative Name',
      'Preferred Business Name *':'Preferred Business Name *',
      'Alternative Name #1':'Alternative Name #1',
      'Alternative Name #2':'Alternative Name #2',
      'Requested Effective Date (optional)':'Requested Effective Date (optional)',
      'Street Address *':'Street Address *',
      'City *':'City *','ZIP Code *':'ZIP Code *',
      'Mailing Address':'Mailing Address','City':'City','ZIP':'ZIP',
      'Industry *':'Industry *','Business Purpose':'Business Purpose',
      'Management Structure':'Management Structure','Members / Owners':'Members / Owners',
      'First Name *':'First Name *','Last Name *':'Last Name *',
      'Street Address *':'Street Address *','Role':'Role','Ownership %':'Ownership %',
      'Agent Name *':'Agent Name *','FL Street Address * (No PO Box)':'FL Street Address * (No PO Box)',
      'Agent Electronic Signature *':'Agent Electronic Signature *',
      'Filing Speed':'Filing Speed',
      'Email for Confirmation *':'Email for Confirmation *',
      'Electronic Signature *':'Electronic Signature *',
    },
    placeholders: {
      'e.g. ABC Holdings LLC':'e.g. ABC Holdings LLC',
      'Full legal name':'Full legal name',
      'e.g. Sunshine Ventures LLC':'e.g. Sunshine Ventures LLC',
      'Backup if preferred name is taken':'Backup if preferred name is taken',
      'Second backup option':'Second backup option',
      '123 Main Street, Suite 100':'123 Main Street, Suite 100',
      'Miami':'Miami','33101':'33101',
      'PO Box or mailing address':'PO Box or mailing address',
      'Full address':'Full address',
      'e.g. 100':'e.g. 100',
      'Full legal name or company name':'Full legal name or company name',
      'Street address in Florida':'Street address in Florida',
      'Type full legal name':'Type full legal name',
      'your@email.com':'your@email.com',
      'Type your full legal name':'Type your full legal name',
    },
    diffMailing: 'Different mailing address (PO Box accepted)',
    addMember: '+ Add Another Member',
    totalOwnership: 'Total Ownership',
    saveBtn: '\\uD83D\\uDCBE Save & Continue Later',
    saveBtnShort: '\\uD83D\\uDCBE Save',
    continueBtn: 'Continue \\u2192',
    backBtn: '\\u2190 Back',
    notSure: 'Not sure?',
    happyGuide: "We're happy to guide you.",
    waBtn: '\\uD83D\\uDCAC WhatsApp',
    calBtn: '\\uD83D\\uDCC5 Book a Call',
    raUse: '\\u2713 Yes \\u2014 Use Your Service',
    raOwn: 'I have my own agent',
    raDesc: 'Receives all official legal documents, tax notices, and service of process on your behalf.',
    raBenefit: '\\uD83C\\uDFE6 Required by Florida law. Without one, your company can be dissolved.',
    einAdd: '\\u2713 Add EIN \\u2014 $49',
    einNo: 'No thanks',
    einDesc: 'Nine-digit IRS number that identifies your business for federal tax purposes.',
    einBenefit: '\\uD83C\\uDFE6 Banks require your EIN to open a business checking account.',
    oaAdd: '\\u2713 Add Operating Agreement \\u2014 $79',
    oaNo: 'No thanks',
    oaDesc: 'Documents ownership percentages, decision-making, profit distribution, and member rights.',
    oaBenefit: '\\uD83C\\uDFE6 Most banks require an Operating Agreement to open a business account.',
    itinAdd: '\\u2713 Add ITIN \\u2014 $69',
    itinNo: 'I have an SSN',
    itinDesc: "IRS-issued number for individuals who need to file US taxes but aren't eligible for an SSN.",
    itinBenefit: '\\uD83D\\uDCCB Required to file US federal taxes without an SSN.',
    vmaTitle: 'Virtual Mailing Address', vmaPrice: '$29/mo',
    vmaAdd: '\\u2713 Add \\u2014 $29/mo', vmaNo: 'No thanks',
    vmaDesc: 'Professional FL business address. We receive and digitally forward your mail.',
    vmaBenefit: '\\uD83D\\uDD12 Your home address stays private on all public Florida records.',
    arTitle: 'Annual Report Filing', arPrice: 'Annual',
    arAdd: '\\u2713 Add Annual Report', arNo: "I'll handle it",
    arDesc: 'Every FL business must file an Annual Report Jan 1\\u2013May 1. Missing it = $400 late fee + possible dissolution.',
    arBenefit: '\\uD83D\\uDCC5 We file automatically every year \\u2014 on time, every time.',
    webTitle: 'Professional Website', webPrice: 'Custom',
    webAdd: "\\u2713 I'm Interested", webNo: 'Not now',
    webDesc: 'Modern, mobile-friendly website tailored to your industry and brand.',
    webBenefit: '\\uD83C\\uDF10 A professional website builds instant credibility.',
    phoneTitle: 'Business Phone Number', phonePrice: 'Monthly',
    phoneAdd: "\\u2713 I'm Interested", phoneNo: 'Not now',
    phoneDesc: 'Dedicated local or toll-free number. Keep personal & business calls separate.',
    phoneBenefit: '\\uD83D\\uDCDE Looks more professional on business cards and websites.',
    stdFiling: 'Standard Filing', stdDays: '7\\u201310 business days', stdIncl: 'Included in all packages',
    expFiling: '\\u26A1 Expedited Filing', expDays: '1\\u20133 business days',
    orderSummaryLabel: 'Order Summary',
    stateFeeLbl: 'Florida State Filing Fee',
    totalDue: 'Total Due Today',
    bySigningNote: 'By signing, you confirm accuracy and authorize us to file on your behalf.',
    submitBtn: '\\uD83D\\uDE80 Submit Order & Pay Securely',
    savePayLater: '\\uD83D\\uDCBE Save & Pay Later',
    successTitle: 'Order Submitted!',
    successMsg: "Your application is in expert hands. We'll begin the filing process with the Florida Division of Corporations right away.",
    orderNumLbl: 'Your Order Number',
    saveNumNote: 'Save this number to check status or resume anytime.',
    waUs: '\\uD83D\\uDCAC WhatsApp Us',
    backToPkg: 'Back to Packages',
    indOptions: ['Select your industry...','Retail & E-Commerce','Restaurant & Food Service','Real Estate & Property','Construction & Contracting','Technology & Software','Consulting & Professional Services','Health & Wellness','Transportation & Logistics','Import / Export','Beauty & Personal Care','Finance & Accounting','Other'],
    roleOptions: ['Manager (MGR)','Authorized Rep (AR)','Officer','Director'],
    purposePlaceholder: 'e.g. To engage in any lawful business activity permitted under Florida law...',
  },
  es: {
    steps: ['\\u00bfEres una persona natural o una empresa?','Confirma tu paquete','\\u00bfC\\u00f3mo llamar\\u00e1s a tu negocio?','Direcci\\u00f3n del negocio','Descripci\\u00f3n del negocio','Miembros / Propietarios','Agente Registrado','EIN / N\\u00famero de ID Fiscal','Acuerdo Operativo','Solicitud de ITIN','Direcci\\u00f3n y Cumplimiento','Presencia en L\\u00ednea','Velocidad de tramitaci\\u00f3n y resumen'],
    stepSubs: ['Esto nos ayuda a preparar correctamente tus documentos de propiedad.','Tu paquete seleccionado. Puedes cambiarlo aqu\\u00ed.','Debe terminar con "LLC" o "Corp/Inc". Verificamos la disponibilidad antes de tramitar.','Oficina principal \\u2014 debe ser una direcci\\u00f3n f\\u00edsica (no apartado postal).','Tu industria y el prop\\u00f3sito del negocio. Requerido para Corporaciones.','Cu\\u00e9ntanos sobre la estructura de propiedad de tu negocio.','Toda LLC y Corporaci\\u00f3n en Florida debe designar un Agente Registrado con direcci\\u00f3n f\\u00edsica en FL.','Tu N\\u00famero de Identificaci\\u00f3n del Empleador (EIN) federal del IRS.','Documento interno de gobierno de tu LLC \\u2014 define propiedad y reglas de gesti\\u00f3n.','Para extranjeros que necesitan un n\\u00famero de contribuyente en EE.UU.','Protege tu privacidad y mant\\u00e9n tu negocio en regla.','Construye tu presencia empresarial profesional desde el primer d\\u00eda.','Elige la velocidad de tramitaci\\u00f3n y revisa tu orden.'],
    choice1: ['Persona Natural / Individual','Una o m\\u00e1s personas ser\\u00e1n due\\u00f1as del negocio. Lo m\\u00e1s com\\u00fan.'],
    choice2: ['Propiedad de una Empresa Existente','Otra entidad empresarial ser\\u00e1 due\\u00f1a de este nuevo negocio.'],
    memberManaged: ['Gestionado por Miembros','Los propietarios gestionan directamente. Lo m\\u00e1s com\\u00fan.'],
    managerManaged: ['Gestionado por Gerente','Un gerente designado maneja las operaciones.'],
    nameHelper: 'Verificamos tu nombre. Confirmamos la disponibilidad con la Divisi\\u00f3n de Corporaciones de Florida antes de tramitar \\u2014 no necesitas hacer nada de tu parte.',
    labels: {
      'Name of the Owning Company':'Nombre de la Empresa Propietaria',
      'Authorized Representative Name':'Nombre del Representante Autorizado',
      'Preferred Business Name *':'Nombre Preferido del Negocio *',
      'Alternative Name #1':'Nombre Alternativo #1',
      'Alternative Name #2':'Nombre Alternativo #2',
      'Requested Effective Date (optional)':'Fecha de Vigencia Solicitada (opcional)',
      'Street Address *':'Direcci\\u00f3n *',
      'City *':'Ciudad *','ZIP Code *':'C\\u00f3digo Postal *',
      'Mailing Address':'Direcci\\u00f3n Postal',
      'City':'Ciudad','ZIP':'C\\u00f3digo Postal',
      'Industry *':'Industria *','Business Purpose':'Prop\\u00f3sito del Negocio',
      'Management Structure':'Estructura de Gesti\\u00f3n',
      'Members / Owners':'Miembros / Propietarios',
      'First Name *':'Nombre *','Last Name *':'Apellido *',
      'Street Address *':'Direcci\\u00f3n *','Role':'Cargo','Ownership %':'% de Propiedad',
      'Agent Name *':'Nombre del Agente *',
      'FL Street Address * (No PO Box)':'Direcci\\u00f3n FL * (Sin Apartado Postal)',
      'Agent Electronic Signature *':'Firma Electr\\u00f3nica del Agente *',
      'Filing Speed':'Velocidad de Tramitaci\\u00f3n',
      'Email for Confirmation *':'Correo de Confirmaci\\u00f3n *',
      'Electronic Signature *':'Firma Electr\\u00f3nica *',
    },
    placeholders: {
      'e.g. ABC Holdings LLC':'ej. ABC Holdings LLC',
      'Full legal name':'Nombre legal completo',
      'e.g. Sunshine Ventures LLC':'ej. Sunshine Ventures LLC',
      'Backup if preferred name is taken':'Alternativa si el nombre preferido no está disponible',
      'Second backup option':'Segunda opción alternativa',
      '123 Main Street, Suite 100':'123 Calle Principal, Suite 100',
      'Miami':'Miami',
      '33101':'33101',
      'PO Box or mailing address':'Apartado postal o dirección de correspondencia',
      'City':'Ciudad',
      'ZIP':'Código Postal',
      'Full address':'Dirección completa',
      'First name':'Nombre',
      'Last name':'Apellido',
      'e.g. 100':'ej. 100',
      'e.g. 1000':'ej. 1000',
      'e.g. 25':'ej. 25',
      'Full legal name or company name':'Nombre legal completo o nombre de empresa',
      'Street address in Florida':'Dirección física en Florida',
      'Type full legal name':'Escribe tu nombre legal completo',
      'Type your full legal name':'Escribe tu nombre legal completo',
      'your@email.com':'tucorreo@email.com',
      'e.g. To engage in any lawful business activity permitted under Florida law...':'ej. Dedicarse a cualquier actividad empresarial lícita permitida por la ley de Florida...',
    },
    diffMailing: 'Direcci\\u00f3n de correspondencia diferente (se acepta apartado postal)',
    addMember: '+ Agregar Otro Miembro',
    totalOwnership: 'Propiedad Total',
    saveBtn: '\\uD83D\\uDCBE Guardar y Continuar Despu\\u00e9s',
    saveBtnShort: '\\uD83D\\uDCBE Guardar',
    continueBtn: 'Continuar \\u2192',
    backBtn: '\\u2190 Atr\\u00e1s',
    notSure: '\\u00bfNo est\\u00e1s seguro?',
    happyGuide: 'Con gusto te orientamos.',
    waBtn: '\\uD83D\\uDCAC WhatsApp',
    calBtn: '\\uD83D\\uDCC5 Programar una Llamada',
    raUse: '\\u2713 S\\u00ed \\u2014 Usar Vuestro Servicio',
    raOwn: 'Tengo mi propio agente',
    raDesc: 'Recibe todos los documentos legales oficiales, avisos fiscales y notificaciones en tu nombre.',
    raBenefit: '\\uD83C\\uDFE6 Requerido por ley en Florida. Sin uno, tu empresa puede ser disuelta.',
    einAdd: '\\u2713 Agregar EIN \\u2014 $49',
    einNo: 'No gracias',
    einDesc: 'N\\u00famero de 9 d\\u00edgitos del IRS que identifica tu negocio para efectos fiscales federales.',
    einBenefit: '\\uD83C\\uDFE6 Los bancos requieren tu EIN para abrir una cuenta empresarial.',
    oaAdd: '\\u2713 Agregar Acuerdo Operativo \\u2014 $79',
    oaNo: 'No gracias',
    oaDesc: 'Documenta porcentajes de propiedad, toma de decisiones, distribuci\\u00f3n de ganancias y derechos de los miembros.',
    oaBenefit: '\\uD83C\\uDFE6 La mayor\\u00eda de los bancos requieren un Acuerdo Operativo para abrir una cuenta.',
    itinAdd: '\\u2713 Agregar ITIN \\u2014 $69',
    itinNo: 'Tengo SSN',
    itinDesc: 'N\\u00famero emitido por el IRS para personas que necesitan presentar impuestos en EE.UU. sin SSN.',
    itinBenefit: '\\uD83D\\uDCCB Requerido para presentar impuestos federales en EE.UU. sin SSN.',
    vmaTitle: 'Direcci\\u00f3n Postal Virtual', vmaPrice: '$29/mes',
    vmaAdd: '\\u2713 Agregar \\u2014 $29/mes', vmaNo: 'No gracias',
    vmaDesc: 'Direcci\\u00f3n empresarial profesional en FL. Recibimos y reenviamos tu correo digitalmente.',
    vmaBenefit: '\\uD83D\\uDD12 Tu direcci\\u00f3n personal permanece privada en todos los registros p\\u00fablicos de Florida.',
    arTitle: 'Declaraci\\u00f3n Anual', arPrice: 'Anual',
    arAdd: '\\u2713 Agregar Declaraci\\u00f3n Anual', arNo: 'Lo manejar\\u00e9 yo',
    arDesc: 'Todo negocio en FL debe presentar una Declaraci\\u00f3n Anual entre el 1 ene \\u2013 1 may. Si se omite = $400 de mora + posible disoluci\\u00f3n.',
    arBenefit: '\\uD83D\\uDCC5 Tramitamos autom\\u00e1ticamente cada a\\u00f1o \\u2014 a tiempo, siempre.',
    webTitle: 'Sitio Web Profesional', webPrice: 'Personalizado',
    webAdd: '\\u2713 Me Interesa', webNo: 'Ahora no',
    webDesc: 'Sitio web moderno y adaptable a m\\u00f3viles, personalizado seg\\u00fan tu industria y marca.',
    webBenefit: '\\uD83C\\uDF10 Un sitio web profesional genera credibilidad instant\\u00e1nea.',
    phoneTitle: 'N\\u00famero de Tel\\u00e9fono Empresarial', phonePrice: 'Mensual',
    phoneAdd: '\\u2713 Me Interesa', phoneNo: 'Ahora no',
    phoneDesc: 'N\\u00famero local o gratuito dedicado. Separa tus llamadas personales de las empresariales.',
    phoneBenefit: '\\uD83D\\uDCDE Luce m\\u00e1s profesional en tarjetas de presentaci\\u00f3n y sitios web.',
    stdFiling: 'Tramitaci\\u00f3n Est\\u00e1ndar', stdDays: '7\\u201310 d\\u00edas h\\u00e1biles', stdIncl: 'Incluido en todos los paquetes',
    expFiling: '\\u26A1 Tramitaci\\u00f3n Acelerada', expDays: '1\\u20133 d\\u00edas h\\u00e1biles',
    orderSummaryLabel: 'Resumen de Orden',
    stateFeeLbl: 'Cargo Estatal de Florida',
    totalDue: 'Total a Pagar Hoy',
    bySigningNote: 'Al firmar, confirmas que la informaci\\u00f3n es correcta y nos autorizas a tramitar en tu nombre.',
    submitBtn: '\\uD83D\\uDE80 Enviar Orden y Pagar',
    savePayLater: '\\uD83D\\uDCBE Guardar y Pagar Despu\\u00e9s',
    successTitle: '\\u00a1Orden Enviada!',
    successMsg: 'Tu solicitud est\\u00e1 en manos expertas. Comenzaremos el tr\\u00e1mite con la Divisi\\u00f3n de Corporaciones de Florida de inmediato.',
    orderNumLbl: 'Tu N\\u00famero de Orden',
    saveNumNote: 'Guarda este n\\u00famero para consultar el estado o continuar cuando quieras.',
    waUs: '\\uD83D\\uDCAC Escribirnos por WhatsApp',
    backToPkg: 'Volver a Paquetes',
    indOptions: ['Selecciona tu industria...','Retail y Comercio Electr\\u00f3nico','Restaurante y Servicio de Comida','Bienes Ra\\u00edces','Construcci\\u00f3n y Contrataci\\u00f3n','Tecnolog\\u00eda y Software','Consultor\\u00eda y Servicios Profesionales','Salud y Bienestar','Transporte y Log\\u00edstica','Importaci\\u00f3n / Exportaci\\u00f3n','Belleza y Cuidado Personal','Finanzas y Contabilidad','Otro'],
    roleOptions: ['Gerente (MGR)','Representante Autorizado (AR)','Oficial','Director'],
    purposePlaceholder: 'ej. Dedicarse a cualquier actividad empresarial l\\u00edcita permitida por la ley de Florida...',
  }
};

function translateFormContent(lang){
  var t = formTranslations[lang] || formTranslations.en;
  var modal = document.getElementById('formOverlay');
  if(!modal) return;

  // Step titles and subs (active step)
  var activeStep = modal.querySelector('.form-step.active');
  if(activeStep){
    var idx = parseInt(activeStep.id.replace('step','')) - 1;
    var titleEl = activeStep.querySelector('.step-title');
    var subEl = activeStep.querySelector('.step-sub');
    if(titleEl && t.steps[idx]) titleEl.textContent = t.steps[idx];
    if(subEl && t.stepSubs[idx]) subEl.textContent = t.stepSubs[idx];
  }

  // All form labels — normalize to handle asterisk variants
  modal.querySelectorAll('.form-label').forEach(function(el){
    var raw = el.textContent.trim();
    // Try exact match first
    if(t.labels[raw]){
      el.textContent = t.labels[raw];
    } else {
      // Try without asterisk, then re-add it
      var noStar = raw.replace(/\\s*\\*\\s*$/, '').trim();
      var hasStar = raw.includes('*');
      if(t.labels[noStar]){
        el.textContent = hasStar ? t.labels[noStar] + ' *' : t.labels[noStar];
      } else if(t.labels[noStar + ' *']){
        el.textContent = t.labels[noStar + ' *'];
      }
    }
  });

  // All placeholders (inputs, textareas, selects)
  modal.querySelectorAll('[placeholder]').forEach(function(el){
    var ph = el.getAttribute('placeholder');
    if(ph && t.placeholders[ph]) el.setAttribute('placeholder', t.placeholders[ph]);
  });

  // Industry select options (step 5)
  modal.querySelectorAll('select.select-input').forEach(function(sel){
    Array.from(sel.options).forEach(function(opt, i){
      // Industry select has > 3 options
      if(sel.options.length > 4 && t.indOptions[i]){
        opt.text = t.indOptions[i];
      }
      // Role select
      if(sel.options.length <= 4 && t.roleOptions[i]){
        opt.text = t.roleOptions[i];
      }
    });
  });

  // Choice cards — use data attributes to identify them reliably
  modal.querySelectorAll('.choice-card').forEach(function(card){
    var s=card.querySelector('strong'), p=card.querySelector('p');
    if(!s) return;
    var txt = s.textContent.trim();
    if(txt==='Individual / Natural Person'||txt==='Persona Natural / Individual'){
      if(s)s.textContent=t.choice1[0]; if(p)p.textContent=t.choice1[1];
    } else if(txt==='Owned by an Existing Company'||txt==='Propiedad de una Empresa Existente'){
      if(s)s.textContent=t.choice2[0]; if(p)p.textContent=t.choice2[1];
    } else if(txt==='Member-Managed'||txt==='Gestionado por Miembros'){
      if(s)s.textContent=t.memberManaged[0]; if(p)p.textContent=t.memberManaged[1];
    } else if(txt==='Manager-Managed'||txt==='Gestionado por Gerente'){
      if(s)s.textContent=t.managerManaged[0]; if(p)p.textContent=t.managerManaged[1];
    }
  });

  // Name helper
  var nh = modal.querySelector('.name-helper');
  if(nh){ var strong=nh.querySelector('strong'); if(strong)strong.textContent=lang==='es'?'\\u2705 Verificamos tu nombre.':'\\u2705 We verify your name.'; nh.lastChild.textContent=' '+t.nameHelper; }

  // Different mailing checkbox label
  var ml = modal.querySelector('label[for="diffMailing"], label:has(#diffMailing)');
  modal.querySelectorAll('label').forEach(function(l){ if(l.textContent.includes('mailing address')||l.textContent.includes('correspondencia')) l.childNodes[l.childNodes.length-1].textContent=' '+t.diffMailing; });

  // Add member button
  var amb = modal.querySelector('.btn-add-member');
  if(amb) amb.textContent = t.addMember;

  // Ownership total label
  var ot = modal.querySelector('#ownershipTotal span');
  if(ot) ot.textContent = t.totalOwnership;

  // Footer buttons
  modal.querySelectorAll('.save-btn').forEach(function(b){ b.textContent = b.parentElement.classList.contains('form-footer') ? t.saveBtnShort : t.saveBtn; });
  modal.querySelectorAll('.btn-next').forEach(function(b){ b.textContent = t.continueBtn; });
  modal.querySelectorAll('.btn-back').forEach(function(b){ b.textContent = t.backBtn; });

  // Form help
  var fhp = modal.querySelector('.form-help p');
  if(fhp){ var strong=fhp.querySelector('strong'); if(strong)strong.textContent=t.notSure; fhp.lastChild.textContent=' '+t.happyGuide; }
  var fhBtns = modal.querySelectorAll('.fh-wa,.fh-cal');
  if(fhBtns[0]) fhBtns[0].textContent = t.waBtn;
  if(fhBtns[1]) fhBtns[1].textContent = t.calBtn;

  // Addon cards — RA
  var addonCards = modal.querySelectorAll('.addon-card');
  var addonData = [
    {title:null, desc:t.raDesc, benefit:t.raBenefit, yes:t.raUse, no:t.raOwn},
    {title:lang==='es'?'Agregar EIN':'Add EIN Service', desc:t.einDesc, benefit:t.einBenefit, yes:t.einAdd, no:t.einNo},
    {title:lang==='es'?'Agregar Acuerdo Operativo':'Add Operating Agreement', desc:t.oaDesc, benefit:t.oaBenefit, yes:t.oaAdd, no:t.oaNo},
    {title:lang==='es'?'Agregar ITIN':'Add ITIN Service', desc:t.itinDesc, benefit:t.itinBenefit, yes:t.itinAdd, no:t.itinNo},
    {title:t.vmaTitle, desc:t.vmaDesc, benefit:t.vmaBenefit, yes:t.vmaAdd, no:t.vmaNo},
    {title:t.arTitle, desc:t.arDesc, benefit:t.arBenefit, yes:t.arAdd, no:t.arNo},
    {title:t.webTitle, desc:t.webDesc, benefit:t.webBenefit, yes:t.webAdd, no:t.webNo},
    {title:t.phoneTitle, desc:t.phoneDesc, benefit:t.phoneBenefit, yes:t.phoneAdd, no:t.phoneNo},
  ];
  addonCards.forEach(function(card, i){
    var d = addonData[i]; if(!d) return;
    if(d.title){ var titleEl=card.querySelector('.addon-title'); if(titleEl) titleEl.textContent=d.title; }
    var descEl=card.querySelector('.addon-desc'); if(descEl) descEl.textContent=d.desc;
    var benEl=card.querySelector('.addon-benefit'); if(benEl) benEl.textContent=d.benefit;
    var btns=card.querySelectorAll('.btn-addon-yes,.btn-addon-no');
    if(btns[0]) btns[0].textContent=d.yes;
    if(btns[1]) btns[1].textContent=d.no;
  });

  // Delivery cards
  var delCards = modal.querySelectorAll('.delivery-card');
  if(delCards[0]){ var s=delCards[0].querySelector('strong'),sp=delCards[0].querySelector('span'),dp=delCards[0].querySelector('.d-price'); if(s)s.textContent=t.stdFiling; if(sp)sp.textContent=t.stdDays; if(dp)dp.textContent=t.stdIncl; }
  if(delCards[1]){ var s=delCards[1].querySelector('strong'),sp=delCards[1].querySelector('span'); if(s)s.textContent=t.expFiling; if(sp)sp.textContent=t.expDays; }

  // Summary table labels
  var sumPkg=modal.querySelector('#sum-pkg'); if(sumPkg && lang==='es') sumPkg.textContent=sumPkg.textContent.replace('Package','Paquete').replace('Formation','Formación');
  var stRow=modal.querySelector('#sum-state'); if(stRow){ var td=stRow.parentElement && stRow.parentElement.cells ? stRow.parentElement.cells[0] : null; }
  // Find Florida State Filing Fee td
  modal.querySelectorAll('.summary-table td').forEach(function(td){
    if(td.textContent.trim()==='Florida State Filing Fee') td.textContent=lang==='es'?'Cargo Estatal de Florida':'Florida State Filing Fee';
    if(td.textContent.trim()==='Registered Agent') td.textContent=lang==='es'?'Agente Registrado':'Registered Agent';
    if(td.textContent.trim()==='EIN / Tax ID Number') td.textContent=lang==='es'?'EIN / ID Fiscal':'EIN / Tax ID Number';
    if(td.textContent.trim()==='Operating Agreement') td.textContent=lang==='es'?'Acuerdo Operativo':'Operating Agreement';
    if(td.textContent.trim()==='ITIN Application') td.textContent=lang==='es'?'Solicitud de ITIN':'ITIN Application';
    if(td.textContent.trim()==='Virtual Address') td.textContent=lang==='es'?'Dirección Virtual':'Virtual Address';
    if(td.textContent.trim()==='Annual Report') td.textContent=lang==='es'?'Declaración Anual':'Annual Report';
    if(td.textContent.trim()==='Expedited Filing') td.textContent=lang==='es'?'Tramitación Acelerada':'Expedited Filing';
  });
  var sumLabel = modal.querySelector('[style*="font-size:0.77rem"][style*="uppercase"]');
  if(sumLabel && (sumLabel.textContent==='Order Summary'||sumLabel.textContent==='Resumen de Orden')) sumLabel.textContent=t.orderSummaryLabel;
  var totalEl = modal.querySelector('.summary-total span');
  if(totalEl) totalEl.textContent = t.totalDue;

  // Summary confirm email/sig note
  modal.querySelectorAll('[style*="font-size:0.72rem"]').forEach(function(el){
    if(el.textContent.includes('By signing')) el.textContent=t.bySigningNote;
  });

  // Submit button
  var submitBtn = modal.querySelector('.btn-submit');
  if(submitBtn) submitBtn.textContent = t.submitBtn;

  // Save & Pay Later
  modal.querySelectorAll('[style*="text-align:center"] .save-btn').forEach(function(b){ b.textContent=t.savePayLater; });

  // Industry select options
  var indSel = modal.querySelector('.select-input');
  if(indSel && indSel.options.length > 3){
    t.indOptions.forEach(function(opt,i){ if(indSel.options[i]) indSel.options[i].text=opt; });
  }

  // Purpose placeholder
  var ta = modal.querySelector('textarea.form-input');
  if(ta) ta.setAttribute('placeholder', t.purposePlaceholder);

  // Role select
  modal.querySelectorAll('.select-input').forEach(function(sel){
    if(sel.options[0] && (sel.options[0].text==='Manager (MGR)'||sel.options[0].text==='Gerente (MGR)')){
      t.roleOptions.forEach(function(opt,i){ if(sel.options[i]) sel.options[i].text=opt; });
    }
  });

  // Success screen
  var ssh = modal.querySelector('.success-screen h3');
  if(ssh) ssh.textContent = t.successTitle;
  var ssp = modal.querySelector('.success-screen p');
  if(ssp) ssp.textContent = t.successMsg;
  var sso = modal.querySelector('.order-display span');
  if(sso) sso.textContent = t.orderNumLbl;
  modal.querySelectorAll('.success-screen p').forEach(function(p){
    if(p.textContent.includes('Save this')||p.textContent.includes('Guarda este')) p.textContent=t.saveNumNote;
  });
  var waUsBtn = modal.querySelector('.btn-wa');
  if(waUsBtn) waUsBtn.textContent = t.waUs;
  modal.querySelectorAll('.success-screen button').forEach(function(b){
    if(b.textContent.includes('Back to')||b.textContent.includes('Volver')) b.textContent=t.backToPkg;
  });

  // Progress text
  var pt = document.getElementById('progressText');
  if(pt && lang==='es') pt.textContent = pt.textContent.replace('Step','Paso').replace('of','de');

  // Form step title in header
  var fst = document.getElementById('form-step-title');
  if(fst && t.steps[currentStep-1]) fst.textContent = t.steps[currentStep-1];
}

</script>
`
  return (
    <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
  )
}
