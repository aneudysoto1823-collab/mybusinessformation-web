export default function HomePage() {
  const styles = `
:root {
  --navy:#1C2E44; --navy2:#22364E; --blue:#2563EB; --blue-light:#EFF6FF; --blue-mid:#DBEAFE;
  --green:#059669; --green-light:#ECFDF5; --green-dark:#047857;
  --gold:#F59E0B; --white:#FFFFFF; --gray50:#F8FAFC; --gray100:#F1F5F9;
  --gray200:#E2E8F0; --gray400:#94A3B8; --gray600:#475569; --gray800:#1E293B;
  --shadow:0 4px 24px rgba(28,46,68,0.08); --shadow-lg:0 12px 48px rgba(28,46,68,0.14);
  --radius:12px; --radius-lg:18px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',sans-serif;color:var(--gray800);background:var(--white);line-height:1.6;overflow-x:hidden}
h1,h2,h3,h4{font-family:'Fraunces',serif;line-height:1.15}
a{text-decoration:none;color:inherit}
img{max-width:100%}

/* ── TOPBAR ── */
.topbar{background:var(--navy);color:#fff;font-size:0.78rem;padding:9px 24px;text-align:center;letter-spacing:0.2px}
.topbar strong{color:var(--gold)}

/* ── HEADER ── */
header{position:sticky;top:0;z-index:200;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray200);padding:0 32px}
.header-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:70px;gap:20px}
.logo{display:flex;align-items:center;gap:12px}
.logo-mark{width:42px;height:42px;background:linear-gradient(135deg,var(--navy),var(--blue));border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;letter-spacing:-0.5px}
.logo-text{font-family:'Fraunces',serif;font-size:1.05rem;color:var(--navy);font-weight:700;line-height:1.2}
.logo-text span{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:0.68rem;color:var(--gray400);font-weight:400;letter-spacing:0.8px;text-transform:uppercase}
nav{display:flex;align-items:center;gap:6px}
nav a{font-size:0.85rem;font-weight:500;color:var(--gray600);padding:6px 12px;border-radius:6px;transition:all 0.2s}
nav a:hover{color:var(--navy);background:var(--gray100)}
.lang-toggle{display:flex;align-items:center;background:var(--gray100);border-radius:20px;padding:3px;gap:2px}
.lang-btn{padding:5px 14px;border-radius:16px;border:none;cursor:pointer;font-size:0.78rem;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;color:var(--gray400);background:transparent}
.lang-btn.active{background:var(--navy);color:#fff}
.btn-start{background:var(--green);color:#fff;padding:10px 22px;border-radius:8px;font-size:0.88rem;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;white-space:nowrap;font-family:'Plus Jakarta Sans',sans-serif}
.btn-start:hover{background:var(--green-dark);transform:translateY(-1px)}

/* ── HERO ── */
.hero{background:var(--white);padding:36px 32px 28px;text-align:center}
.hero-inner{max-width:760px;margin:0 auto}
.hero h1{font-size:clamp(1.5rem,3vw,2rem);color:var(--navy);font-weight:700;margin-bottom:4px;letter-spacing:0}
.hero h1 em{color:var(--blue);font-style:normal}
.hero p{font-size:.8rem;color:var(--gray600);max-width:700px;margin:0 auto;font-weight:400;line-height:1.5}
.btn-hero{background:var(--green);color:#fff;padding:15px 36px;border-radius:10px;font-size:1rem;font-weight:600;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;animation:pulse 2.5s infinite;transition:all 0.25s;box-shadow:0 4px 20px rgba(5,150,105,0.35)}
.btn-hero:hover{background:var(--green-dark);transform:translateY(-2px);box-shadow:0 8px 28px rgba(5,150,105,0.45);animation:none}
.hero-btns{display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap}
.btn-hero-new{padding:10px 22px;border-radius:9px;font-size:.85rem;font-weight:600;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .25s;display:flex;align-items:center;gap:7px;background:#fff;color:var(--navy);border:2px solid var(--gray200);box-shadow:0 2px 12px rgba(28,46,68,0.08)}
.btn-hero-new:hover{border-color:var(--blue);color:var(--blue);transform:translateY(-1px);box-shadow:0 4px 14px rgba(37,99,235,0.15)}
.et-toggle-btn{padding:10px 0;width:140px;text-align:center;border-radius:9px;font-size:.88rem;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:all .25s;background:#fff;color:var(--navy);border:2px solid var(--gray200);box-shadow:0 2px 8px rgba(28,46,68,0.06)}
.et-toggle-btn:hover{border-color:var(--blue);color:var(--blue);transform:translateY(-1px);box-shadow:0 4px 14px rgba(37,99,235,0.15)}
@keyframes pulse{0%,100%{box-shadow:0 4px 20px rgba(5,150,105,0.35)}50%{box-shadow:0 4px 28px rgba(5,150,105,0.6)}}
.trust-bar{background:var(--gray50);border-bottom:1px solid var(--gray200);padding:13px 32px}
.trust-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:28px;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:6px;font-size:0.75rem;font-weight:500;color:var(--gray600)}
.trust-check{color:var(--green);font-weight:700;font-size:0.71rem;background:var(--green-light);padding:2px 6px;border-radius:4px}
.trust-sep{width:1px;height:14px;background:var(--gray200)}

/* ── SECTION HEADERS ── */
.section{padding:80px 32px}
.section-inner{max-width:1200px;margin:0 auto}
.section-label{display:inline-block;font-size:0.72rem;font-weight:600;color:var(--blue);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:14px}
.section-title{font-size:clamp(1.8rem,3.5vw,2.6rem);color:var(--navy);font-weight:700;margin-bottom:16px}
.section-sub{font-size:1rem;color:var(--gray600);max-width:560px;font-weight:300}
.text-center{text-align:center}
.text-center .section-sub{margin:0 auto}

/* ── HOW IT WORKS ── */
.how-bg{background:var(--gray50)}
.steps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:28px;margin-top:52px}
.step-card{background:var(--white);border:1px solid var(--gray200);border-radius:var(--radius-lg);padding:30px 26px;position:relative;transition:all 0.25s}
.step-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.step-num{width:48px;height:48px;background:linear-gradient(135deg,var(--navy),var(--blue));border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:18px}
.step-card h4{font-size:1.05rem;color:var(--navy);font-weight:700;margin-bottom:8px}
.step-card p{font-size:0.87rem;color:var(--gray600);line-height:1.65}

/* ── PRICING ── */
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:40px}
@media(max-width:900px){.pricing-grid{grid-template-columns:1fr}}
.pkg-card{border:1.5px solid var(--gray200);border-radius:var(--radius);overflow:hidden;transition:all 0.25s;background:var(--white);cursor:pointer;display:flex;flex-direction:column}
.pkg-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:var(--blue)}
.pkg-card.pkg-active{border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,0.08);transform:translateY(-2px)}
.pkg-card.featured{border-color:var(--blue);box-shadow:0 0 0 3px rgba(26,86,219,0.07)}
.pkg-head{padding:16px 18px 14px;background:var(--white)}
.pkg-card.featured .pkg-head{background:linear-gradient(135deg,var(--navy),var(--blue))}
.popular-tag{display:inline-block;font-size:0.65rem;font-weight:700;background:var(--gold);color:#fff;padding:2px 10px;border-radius:20px;margin-bottom:6px;letter-spacing:0.3px;text-transform:uppercase}
.pkg-name{font-family:'Fraunces',serif;font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:2px}
.pkg-card.featured .pkg-name{color:#fff}
.pkg-price-row{display:flex;align-items:baseline;gap:3px;margin-bottom:1px}
.pkg-price{font-family:'Fraunces',serif;font-size:2rem;font-weight:900;color:var(--navy);line-height:1}
.pkg-card.featured .pkg-price{color:#fff}
.pkg-state-fee{font-size:0.72rem;color:var(--gray400);margin-bottom:10px}
.pkg-card.featured .pkg-state-fee{color:rgba(255,255,255,0.55)}
.pkg-cta{width:100%;padding:8px;border-radius:6px;font-size:0.82rem;font-weight:600;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s}
.pkg-cta-basic,.pkg-cta-featured,.pkg-cta-premium{background:#fff;color:var(--navy);border:1.5px solid #cbd5e1}
.pkg-cta-basic:hover,.pkg-cta-featured:hover,.pkg-cta-premium:hover{border-color:var(--blue);color:var(--blue);background:#f8faff}
.pkg-divider{border:none;border-top:1px solid var(--gray200);margin:0}
.pkg-services{padding:4px 0;flex:1}
.svc-row{display:flex;align-items:center;gap:8px;padding:6px 16px;font-size:0.78rem;border-bottom:1px solid var(--gray100)}
.svc-row:last-child{border-bottom:none}
.svc-name{flex:1;color:var(--gray800)}
.svc-status{min-width:52px;text-align:right;font-weight:600;font-size:0.75rem}
.s-check{color:var(--green);font-size:0.95rem}
.s-add{color:var(--gold)}
.s-free{color:var(--green);font-size:0.7rem;background:var(--green-light);padding:2px 6px;border-radius:8px}

/* ── TESTIMONIALS ── */
.testi-bg{background:var(--gray50)}
.testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:48px}
.testi-card{background:var(--white);border:1px solid var(--gray200);border-radius:var(--radius-lg);padding:24px;transition:all 0.25s;box-shadow:0 2px 12px rgba(28,46,68,0.06)}
.testi-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(28,46,68,0.1)}
.stars{color:var(--gold);font-size:0.9rem;margin-bottom:14px;letter-spacing:1px}
.testi-text{font-size:0.86rem;color:var(--gray600);line-height:1.72;margin-bottom:18px;font-style:italic}
.testi-author{display:flex;align-items:center;gap:10px}
.testi-avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;color:#fff}
.testi-info strong{display:block;font-size:0.84rem;color:var(--navy);font-weight:600}
.testi-info span{font-size:0.73rem;color:var(--gray400)}

/* ── FAQ ── */
.faq-list{max-width:760px;margin:48px auto 0}
.faq-item{border-bottom:1px solid var(--gray200)}
.faq-q{width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:20px 0;display:flex;justify-content:space-between;align-items:center;font-family:'Plus Jakarta Sans',sans-serif;font-size:0.97rem;font-weight:600;color:var(--navy);gap:12px}
.faq-icon{font-size:1.2rem;color:var(--blue);transition:transform 0.25s;flex-shrink:0}
.faq-a{font-size:0.88rem;color:var(--gray600);line-height:1.75;padding-bottom:18px;display:none}
.faq-item.open .faq-icon{transform:rotate(45deg)}
.faq-item.open .faq-a{display:block}

/* ── HELP BAR ── */
.help-bar{background:linear-gradient(135deg,var(--green-light),#d1fae5);border:1px solid #a7f3d0;border-radius:var(--radius-lg);padding:22px 30px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-top:32px}
.help-text strong{display:block;font-size:1rem;color:var(--navy);margin-bottom:4px}
.help-text p{font-size:0.83rem;color:var(--gray600)}
.help-btns{display:flex;gap:10px;flex-wrap:wrap}
.btn-wa{background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;font-size:0.85rem;font-weight:600;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;gap:7px;transition:all 0.2s}
.btn-wa:hover{background:#1ebe5d;transform:translateY(-1px)}
.btn-cal{background:var(--white);color:var(--navy);padding:10px 20px;border-radius:8px;font-size:0.85rem;font-weight:600;border:1.5px solid var(--gray200);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;gap:7px;transition:all 0.2s}
.btn-cal:hover{border-color:var(--blue);color:var(--blue)}

/* ── FOOTER ── */
footer{background:var(--navy);color:rgba(255,255,255,0.7);padding:52px 32px 28px}
.footer-inner{max-width:1200px;margin:0 auto}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:44px}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr}}
.footer-brand .logo-mark{margin-bottom:14px}
.footer-brand p{font-size:0.82rem;line-height:1.7;color:rgba(255,255,255,0.55);max-width:280px;margin-top:10px}
.footer-col h5{font-family:'Fraunces',serif;font-size:0.95rem;color:#fff;margin-bottom:14px;font-weight:600}
.footer-col a{display:block;font-size:0.82rem;color:rgba(255,255,255,0.55);margin-bottom:8px;transition:color 0.2s}
.footer-col a:hover{color:#fff}
.footer-divider{border:none;border-top:1px solid rgba(255,255,255,0.1);margin-bottom:22px}
.footer-bottom{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px}
.footer-copy{font-size:0.77rem;color:rgba(255,255,255,0.4)}
.footer-disclaimer{font-size:0.73rem;color:rgba(255,255,255,0.35);max-width:680px;line-height:1.6}
.footer-links{display:flex;gap:0;flex-wrap:wrap;align-items:center}
.footer-links a{font-size:0.77rem;color:rgba(255,255,255,0.45);transition:color 0.2s}
.footer-links a:hover{color:#fff}

/* ── WA FLOAT ── */
.wa-float{position:fixed;bottom:28px;right:28px;z-index:500;background:#25D366;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,0.5);cursor:pointer;transition:all 0.25s}
.wa-float:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(37,211,102,0.65)}
.wa-float svg{width:28px;height:28px;fill:#fff}

/* ── FORM OVERLAY ── */

.progress-fill{background:var(--gold);height:100%;border-radius:10px;transition:width 0.4s ease}
.choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px}
.choice-card{border:2px solid var(--gray200);border-radius:var(--radius);padding:18px 16px;cursor:pointer;transition:all 0.2s;text-align:center}
.choice-card:hover{border-color:var(--blue);background:var(--blue-light)}
.choice-card.selected{border-color:var(--blue);background:var(--blue-light)}
.choice-card .choice-icon{font-size:2rem;margin-bottom:8px}
.choice-card strong{display:block;font-size:0.9rem;color:var(--navy);font-weight:600;margin-bottom:4px}
.choice-card p{font-size:0.75rem;color:var(--gray600);line-height:1.4}
.pkg-choice-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media(max-width:580px){.pkg-choice-grid{grid-template-columns:1fr}}
.pkg-choice{border:2px solid var(--gray200);border-radius:var(--radius);padding:16px 14px;cursor:pointer;transition:all 0.2s;text-align:center}
.pkg-choice:hover{border-color:var(--blue)}
.pkg-choice.selected{border-color:var(--blue);background:var(--blue-light)}
.pkg-choice.pop{border-color:var(--green)}
.pkg-choice.pop.selected{background:var(--green-light)}
.pkg-choice .pc-name{font-family:'Fraunces',serif;font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:4px}
.pkg-choice .pc-price{font-size:1.4rem;font-weight:700;color:var(--blue);font-family:'Fraunces',serif}
.pkg-choice .pc-items{font-size:0.7rem;color:var(--gray600);margin-top:6px;line-height:1.5;text-align:left}
.addon-card{border:1.5px solid var(--gray200);border-radius:var(--radius-lg);padding:22px;margin-bottom:14px}
.addon-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
.addon-title{font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;color:var(--navy)}
.addon-price{font-size:1.1rem;font-weight:700;color:var(--blue);font-family:'Fraunces',serif}
.addon-desc{font-size:0.84rem;color:var(--gray600);line-height:1.65;margin-bottom:16px}
.addon-benefit{font-size:0.78rem;color:var(--green-dark);background:var(--green-light);padding:7px 12px;border-radius:8px;margin-bottom:16px;font-weight:500}
.addon-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn-addon-yes{background:var(--green);color:#fff;padding:11px;border-radius:8px;font-size:0.88rem;font-weight:600;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s}
.btn-addon-yes:hover{background:var(--green-dark)}
.btn-addon-no{background:var(--gray100);color:var(--gray600);padding:11px;border-radius:8px;font-size:0.88rem;font-weight:500;border:1.5px solid var(--gray200);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s}
.btn-addon-no:hover{background:var(--gray200)}
.btn-addon-yes.selected{background:var(--green-dark);box-shadow:0 0 0 3px rgba(5,150,105,0.25)}
.btn-addon-no.selected{background:var(--gray200);border-color:var(--gray400)}
.member-block{border:1.5px solid var(--gray200);border-radius:var(--radius);padding:18px;margin-bottom:12px;position:relative}
.member-block h5{font-size:0.88rem;font-weight:600;color:var(--navy);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--gray100)}
.btn-add-member{background:var(--blue-light);color:var(--blue);border:1.5px dashed var(--blue);padding:10px;border-radius:8px;width:100%;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;margin-top:4px}
.btn-add-member:hover{background:rgba(26,86,219,0.12)}
.btn-remove-member{position:absolute;top:14px;right:14px;background:none;border:none;color:var(--gray400);cursor:pointer;font-size:1rem;transition:color 0.2s}
.btn-remove-member:hover{color:#ef4444}
.ownership-total{background:var(--gray50);border:1px solid var(--gray200);border-radius:8px;padding:10px 14px;font-size:0.83rem;color:var(--gray600);margin-top:10px;display:flex;justify-content:space-between;align-items:center}
.ownership-total strong{color:var(--navy)}
.ownership-total.ok strong{color:var(--green)}
.ownership-total.over strong{color:#ef4444}
.name-helper{background:var(--blue-light);border-left:3px solid var(--blue);padding:11px 14px;border-radius:0 8px 8px 0;font-size:0.8rem;color:var(--blue);line-height:1.6;margin-top:-10px;margin-bottom:18px}
.order-save-box{background:var(--green-light);border:1.5px solid #a7f3d0;border-radius:var(--radius);padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:14px}
.order-num{font-family:'Fraunces',serif;font-size:1.3rem;font-weight:700;color:var(--green-dark)}
.order-save-box p{font-size:0.8rem;color:var(--green-dark)}
.summary-table{width:100%;border-collapse:collapse;margin-bottom:20px}
.summary-table td{padding:9px 0;font-size:0.87rem;border-bottom:1px solid var(--gray100)}
.summary-table td:last-child{text-align:right;font-weight:600;color:var(--navy)}
.summary-total{display:flex;justify-content:space-between;background:var(--navy);color:#fff;padding:14px 16px;border-radius:8px;font-weight:700;margin-bottom:20px}
.form-footer{display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding-top:20px;border-top:1px solid var(--gray100);gap:10px}
.btn-submit{background:var(--green);color:#fff;padding:14px 32px;border-radius:8px;font-size:0.95rem;font-weight:600;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;width:100%}
.btn-submit:hover{background:var(--green-dark)}
.form-help{background:var(--gray50);border:1px solid var(--gray200);border-radius:8px;padding:14px 16px;margin-top:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.form-help p{font-size:0.78rem;color:var(--gray600)}
.form-help strong{color:var(--navy)}
.form-help-btns{display:flex;gap:8px}
.fh-wa{background:#25D366;color:#fff;padding:7px 14px;border-radius:6px;font-size:0.78rem;font-weight:600;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif}
.fh-cal{background:var(--white);color:var(--navy);padding:7px 14px;border-radius:6px;font-size:0.78rem;font-weight:600;border:1px solid var(--gray200);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif}
.success-screen{text-align:center;padding:20px 0}
.success-icon{width:72px;height:72px;background:var(--green-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:2rem}
.success-screen h3{font-family:'Fraunces',serif;font-size:1.6rem;color:var(--navy);margin-bottom:10px}
.success-screen p{font-size:0.88rem;color:var(--gray600);max-width:440px;margin:0 auto 24px;line-height:1.7}
.order-display{background:var(--navy);color:#fff;padding:16px 24px;border-radius:var(--radius);display:inline-block;margin:0 auto 24px}
.order-display span{font-size:0.75rem;color:rgba(255,255,255,0.6);display:block;margin-bottom:4px}
.order-display strong{font-family:'Fraunces',serif;font-size:1.8rem;font-weight:700;color:var(--gold);letter-spacing:1px}

.email-error-msg.visible,.email-ok-msg.visible{display:flex}
.review-step-btn-proceed{background:var(--green)!important}

/* ── Step 9: two-column review & pay ───────────────────────────── */
@media(max-width:760px){
  }
/* Order summary panel */
.order-panel{background:#fff;border:1.5px solid var(--gray200);border-radius:12px;overflow:hidden}
.order-panel-head{background:linear-gradient(135deg,var(--navy),#1e4db7);padding:14px 18px}
.order-panel-title{font-family:'Fraunces',serif;font-size:.9rem;font-weight:700;color:#fff}
.order-panel-body{padding:10px 18px}
.order-line{display:flex;justify-content:space-between;align-items:center;font-size:.76rem;color:var(--gray700);padding:5px 0;border-bottom:1px solid var(--gray100)}
.order-line:last-child{border-bottom:none}
.order-line-label{color:var(--gray600)}
.order-line-price{font-weight:600;color:var(--gray800)}
.order-total-line{display:flex;justify-content:space-between;align-items:center;padding:10px 18px;background:var(--blue-light);border-top:2px solid var(--blue)}
.order-total-label{font-size:.84rem;font-weight:700;color:var(--navy)}
.order-total-price{font-size:1.1rem;font-weight:900;color:var(--blue);font-family:'Fraunces',serif}
/* Pay methods */
/* Form body layout */

.form-input,.form-input:focus,/* Steps */
/* 2-col grid */
/* Nav bar — fixed at bottom of left col */
/* Mobile */

/* ════════════════════════════════════════════════════
   FORM — Bizee-style card layout
   ════════════════════════════════════════════════════ */

/* Overlay = full-page white/gray background */
.form-overlay{display:none;position:fixed;inset:0;z-index:1000;background:#f3f4f6;overflow-y:auto}
.form-overlay.active{display:block}

/* Progress bar — sticky at very top */
.form-progress-bar{background:#fff;border-bottom:1px solid #e5e7eb;padding:12px 32px;position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;gap:20px}
.form-progress-close{background:transparent;border:none;color:#9ca3af;font-size:1.1rem;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all .2s;font-family:inherit}
.form-progress-close:hover{background:#f3f4f6;color:#374151}
.form-progress-label{font-size:.78rem;font-weight:600;color:#374151;white-space:nowrap}
.form-progress-track{flex:1;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;max-width:500px}
.form-progress-fill{height:100%;background:var(--blue);border-radius:3px;transition:width .4s}
.form-progress-pct{font-size:.78rem;color:#6b7280;white-space:nowrap}
.form-progress-title{font-size:.82rem;font-weight:600;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}

/* Page layout */

.form-step{display:none}
.form-step.active{display:block}

/* Left card — form */
.form-card{background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.06);flex:1;min-width:0;overflow:hidden}
.form-card-body{padding:32px 36px}
.form-card-footer{padding:18px 36px;border-top:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;gap:12px}

/* Right card — order summary */
.order-card{background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.06);width:300px;flex-shrink:0;position:sticky;top:80px;overflow:hidden}
.order-card-head{padding:16px 20px;border-bottom:1px solid #f3f4f6}
.order-card-title{font-size:.9rem;font-weight:700;color:var(--navy)}
.order-card-body{padding:4px 0}
.ord-line{display:flex;justify-content:space-between;align-items:center;padding:8px 20px;font-size:.79rem}
.ord-line-lbl{color:#6b7280}
.ord-line-val{font-weight:600;color:var(--navy)}
.order-card-total{padding:12px 20px;border-top:2px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center}
.order-total-lbl{font-size:.87rem;font-weight:700;color:var(--navy)}
.order-total-val{font-size:1.1rem;font-weight:900;color:var(--blue);font-family:'Fraunces',serif}

/* Step title */
.step-title{font-family:'Fraunces',serif;font-size:1.15rem;font-weight:700;color:var(--navy);margin-bottom:6px}
.step-sub{font-size:.8rem;color:#6b7280;line-height:1.65;margin-bottom:22px}

/* Form fields */
.form-label{display:block;font-size:.8rem;font-weight:600;color:#374151;margin-bottom:5px}
.form-input,.select-input{width:100%;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:9px;font-size:.88rem;font-family:inherit;color:#1e293b;transition:border-color .2s,box-shadow .2s;background:#fff;box-sizing:border-box}
.form-input:focus,.select-input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.1)}
.form-input::placeholder{color:#9ca3af}
.form-group{margin-bottom:16px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
@media(max-width:600px){.form-row,.form-row-3{grid-template-columns:1fr}}

/* Section divider */
.section-divider{display:flex;align-items:center;gap:10px;font-size:.7rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.7px;margin:20px 0 14px}
.section-divider::after{content:'';flex:1;height:1px;background:#e5e7eb}

/* Nav buttons */
.btn-back{background:#fff;border:1.5px solid #e5e7eb;color:#6b7280;padding:9px 20px;border-radius:9px;font-size:.84rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:6px}
.btn-back:hover{border-color:#9ca3af;color:#374151}
.btn-next{background:var(--blue);color:#fff;padding:10px 28px;border-radius:9px;font-size:.88rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:7px}
.btn-next:hover{background:#1d4ed8;box-shadow:0 4px 14px rgba(37,99,235,.3)}
.btn-submit-final{background:var(--green);color:#fff;padding:10px 24px;border-radius:9px;font-size:.88rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:7px}
.btn-submit-final:hover{background:#047857;box-shadow:0 4px 14px rgba(5,150,105,.3)}
.save-btn{background:transparent;border:none;color:#9ca3af;font-size:.74rem;cursor:pointer;font-family:inherit;text-decoration:underline;padding:4px}
.save-btn:hover{color:#6b7280}

/* Delivery / filing speed */
.delivery-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.delivery-card{border:1.5px solid #e5e7eb;border-radius:10px;padding:12px 14px;cursor:pointer;transition:all .2s}
.delivery-card:hover{border-color:var(--blue)}
.delivery-card.selected{border-color:var(--blue);background:#eff6ff}
.delivery-card strong{display:block;font-size:.82rem;color:var(--navy);font-weight:700}
.delivery-card span{display:block;font-size:.73rem;color:#6b7280;margin-top:2px}
.d-price{font-size:.72rem;color:var(--blue);font-weight:600;margin-top:3px}

/* Email validation */
.email-error-msg{display:none;font-size:.74rem;color:#ef4444;margin-top:4px}
.email-ok-msg{display:none;font-size:.74rem;color:var(--green);margin-top:4px}

/* Payment methods */
.pay-method-btn{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;padding:10px;border:1.5px solid #e5e7eb;border-radius:9px;background:#fff;font-size:.82rem;font-weight:600;color:var(--navy);cursor:pointer;font-family:inherit;transition:all .2s;margin-bottom:8px}
.pay-method-btn:hover,.pay-method-btn.active{border-color:var(--blue);background:#eff6ff;color:var(--blue)}
.pay-method-btn.active{box-shadow:0 0 0 3px rgba(37,99,235,.1)}
.card-fields-panel{background:#f8fafc;border:1.5px solid var(--blue);border-radius:10px;padding:16px;margin-bottom:12px;display:none}
.card-fields-panel.open{display:block}

/* Security badges */
.sec-badge{display:inline-flex;align-items:center;gap:5px;background:#f9fafb;border:1px solid #e5e7eb;padding:4px 10px;border-radius:20px;font-size:.69rem;color:#6b7280;font-weight:500}

/* Step info tip */
.step-info-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:9px;padding:11px 14px;font-size:.75rem;color:#0369a1;line-height:1.65;margin-bottom:4px}

.form-modal{max-width:1080px;margin:28px auto;padding:0 20px 60px;display:flex;gap:24px;align-items:flex-start;box-sizing:border-box}
@media(max-width:800px){.form-modal{flex-direction:column;padding:0 14px 40px}}
.form-card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06);flex:1;min-width:0}
.form-card-body{padding:28px 32px}
.form-card-footer{padding:16px 32px;border-top:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;gap:12px}
.order-card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06);width:288px;flex-shrink:0;position:sticky;top:72px}
@media(max-width:800px){.order-card{width:100%;position:static}}

/* ═══════════════════════════════════════════════════════
   FORM OVERLAY — Bizee-style
   ═══════════════════════════════════════════════════════ */
.form-overlay{display:none;position:fixed;inset:0;z-index:2000;background:#f3f4f6;overflow-y:auto}
.form-overlay.active{display:block}

/* Progress bar — sticky top */
.fp-bar{background:#fff;border-bottom:1px solid #e5e7eb;padding:10px 32px;position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:20px}
.fp-close{background:transparent;border:1.5px solid #e5e7eb;color:#6b7280;padding:5px 14px;border-radius:7px;cursor:pointer;font-size:.8rem;font-weight:600;font-family:inherit;transition:all .2s;white-space:nowrap}
.fp-close:hover{background:#f9fafb;border-color:#9ca3af}
.fp-label{font-size:.78rem;font-weight:600;color:#374151;white-space:nowrap}
.fp-track{flex:1;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden}
.fp-fill{height:100%;background:#2563eb;border-radius:3px;transition:width .4s ease}
.fp-pct{font-size:.78rem;color:#6b7280;white-space:nowrap}
.fp-phone{display:flex;align-items:center;gap:6px;font-size:.8rem;color:#374151;font-weight:600;text-decoration:none;white-space:nowrap}
.fp-phone svg{color:#6b7280}

/* Page wrapper */
.fm-wrap{max-width:1060px;margin:28px auto;padding:0 20px 60px;display:flex;gap:24px;align-items:flex-start;box-sizing:border-box}
@media(max-width:820px){.fm-wrap{flex-direction:column;padding:0 14px 40px}}

/* Form step visibility */
.fm-step{display:none}
.fm-step.active{display:block}

/* Left: form card */
.fm-card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 20px rgba(0,0,0,.07);flex:1;min-width:0}
.fm-card-body{padding:28px 32px}
.fm-card-footer{padding:14px 32px;border-top:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;gap:12px}
@media(max-width:600px){.fm-card-body{padding:20px 18px}.fm-card-footer{padding:12px 18px}}

/* FAQ card below form */
.fm-faq{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 20px rgba(0,0,0,.07);margin-top:16px}
.fm-faq-item{border-bottom:1px solid #f3f4f6}
.fm-faq-item:last-child{border-bottom:none}
.fm-faq-q{width:100%;background:none;border:none;padding:16px 24px;text-align:left;font-size:.84rem;font-weight:600;color:#374151;cursor:pointer;font-family:inherit;display:flex;justify-content:space-between;align-items:center;gap:12px}
.fm-faq-q:hover{background:#f9fafb}
.fm-faq-icon{color:#9ca3af;font-size:.9rem;flex-shrink:0;transition:transform .2s}
.fm-faq-icon.open{transform:rotate(180deg)}
.fm-faq-a{display:none;padding:0 24px 16px;font-size:.82rem;color:#6b7280;line-height:1.7}
.fm-faq-a.open{display:block}

/* Right: order summary */
.fm-summary{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 20px rgba(0,0,0,.07);width:284px;flex-shrink:0;position:sticky;top:70px}
@media(max-width:820px){.fm-summary{width:100%;position:static}}
.fm-sum-head{padding:16px 20px;border-bottom:1px solid #f3f4f6}
.fm-sum-title{font-size:.88rem;font-weight:700;color:#1e293b}
.fm-sum-biz{background:#eff6ff;border-radius:7px;padding:7px 14px;text-align:center;font-size:.82rem;font-weight:600;color:#1e40af;margin-top:10px;display:none}
.fm-sum-body{padding:4px 0 8px}
.fm-sum-line{display:flex;justify-content:space-between;align-items:center;padding:7px 20px;font-size:.78rem}
.fm-sum-lbl{color:#6b7280}
.fm-sum-val{font-weight:600;color:#1e293b}
.fm-sum-val.free{color:#059669}
.fm-sum-check{color:#f97316}
.fm-sum-foot{padding:12px 20px;border-top:2px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center}
.fm-sum-total-lbl{font-size:.86rem;font-weight:700;color:#1e293b}
.fm-sum-total-val{font-size:1.1rem;font-weight:900;color:#2563eb;font-family:'Fraunces',serif}

/* Step heading */
.fm-title{font-family:'Fraunces',serif;font-size:1.2rem;font-weight:700;color:#1e293b;margin-bottom:6px}
.fm-sub{font-size:.82rem;color:#6b7280;line-height:1.65;margin-bottom:22px}

/* Form fields */
.fm-label{display:block;font-size:.8rem;font-weight:600;color:#374151;margin-bottom:5px}
.fm-label span{font-size:.72rem;color:#9ca3af;font-weight:400;margin-left:4px}
.fm-input,.fm-select{width:100%;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:9px;font-size:.88rem;font-family:inherit;color:#1e293b;background:#fff;box-sizing:border-box;transition:border-color .2s,box-shadow .2s}
.fm-input:focus,.fm-select:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
.fm-input::placeholder{color:#9ca3af}
.fm-group{margin-bottom:16px}
.fm-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fm-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
@media(max-width:540px){.fm-row,.fm-row-3{grid-template-columns:1fr}}
.fm-divider{font-size:.72rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.7px;margin:20px 0 14px;display:flex;align-items:center;gap:10px}
.fm-divider::after{content:'';flex:1;height:1px;background:#e5e7eb}

/* Radio/choice cards */
.fm-choices{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.fm-choice{border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;cursor:pointer;transition:all .2s;display:flex;align-items:flex-start;gap:10px;background:#fff}
.fm-choice:hover{border-color:#93c5fd}
.fm-choice.selected{border-color:#2563eb;background:#eff6ff}
.fm-choice-radio{width:16px;height:16px;border-radius:50%;border:2px solid #d1d5db;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;transition:all .2s}
.fm-choice.selected .fm-choice-radio{border-color:#2563eb;background:#2563eb}
.fm-choice.selected .fm-choice-radio::after{content:'';width:6px;height:6px;border-radius:50%;background:#fff}
.fm-choice-content strong{display:block;font-size:.85rem;color:#1e293b;font-weight:700;margin-bottom:2px}
.fm-choice-content p{font-size:.76rem;color:#6b7280;margin:0;line-height:1.5}
.fm-choice-price{font-size:.82rem;font-weight:700;color:#1e293b;margin-left:auto;flex-shrink:0}

/* Filing speed cards */
.fm-speed-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.fm-speed-card{border:1.5px solid #e5e7eb;border-radius:10px;padding:16px;cursor:pointer;transition:all .2s;position:relative}
.fm-speed-card:hover{border-color:#93c5fd}
.fm-speed-card.selected{border-color:#2563eb;background:#eff6ff}
.fm-speed-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#f97316;color:#fff;font-size:.65rem;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:.5px}
.fm-speed-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.fm-speed-top label{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.88rem;font-weight:600;color:#1e293b}
.fm-speed-price{font-size:.88rem;font-weight:700;color:#1e293b}
.fm-speed-date{font-size:.76rem;color:#6b7280}
.fm-speed-date strong{color:#f97316}

/* Package upgrade cards */
.fm-pkg-cards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px}
@media(max-width:580px){.fm-pkg-cards{grid-template-columns:1fr}}
.fm-pkg-card{border:1.5px solid #e5e7eb;border-radius:10px;padding:16px;cursor:pointer;transition:all .2s;text-align:center;position:relative}
.fm-pkg-card:hover{border-color:#93c5fd}
.fm-pkg-card.selected{border-color:#2563eb;background:#eff6ff}
.fm-pkg-card .pop-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#059669;color:#fff;font-size:.62rem;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap}
.fm-pkg-name{font-size:.95rem;font-weight:700;color:#1e293b;margin-bottom:4px}
.fm-pkg-price{font-size:1.1rem;font-weight:900;color:#2563eb;font-family:'Fraunces',serif;margin-bottom:8px}
.fm-pkg-items{font-size:.74rem;color:#6b7280;line-height:1.8;text-align:left}

/* Upsell bundle card */
.fm-upsell-card{border:1.5px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:16px}
.fm-upsell-items{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
.fm-upsell-item{border:1px solid #e5e7eb;border-radius:8px;padding:12px;display:flex;align-items:flex-start;gap:10px}
.fm-upsell-item-icon{font-size:1.4rem;flex-shrink:0}
.fm-upsell-item-name{font-size:.82rem;font-weight:700;color:#1e293b}
.fm-upsell-item-price{font-size:.75rem;color:#9ca3af;text-decoration:line-through}
.fm-upsell-item-desc{font-size:.74rem;color:#6b7280;margin-top:2px}
.fm-upsell-totals{border-top:1px solid #e5e7eb;padding-top:12px;margin-top:4px}
.fm-upsell-row{display:flex;justify-content:space-between;font-size:.82rem;color:#6b7280;margin-bottom:4px}
.fm-upsell-total{display:flex;justify-content:space-between;font-size:.92rem;font-weight:700;color:#1e293b;margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb}

/* Add-on toggles */
.fm-addon{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border:1.5px solid #e5e7eb;border-radius:10px;margin-bottom:10px;cursor:pointer;transition:all .2s}
.fm-addon:hover{border-color:#93c5fd}
.fm-addon.selected{border-color:#2563eb;background:#eff6ff}
.fm-addon-left{display:flex;align-items:center;gap:12px}
.fm-addon-icon{font-size:1.3rem}
.fm-addon-name{font-size:.86rem;font-weight:700;color:#1e293b}
.fm-addon-desc{font-size:.74rem;color:#6b7280;margin-top:1px}
.fm-addon-price{font-size:.86rem;font-weight:700;color:#1e293b;flex-shrink:0}
.fm-addon-check{width:20px;height:20px;border-radius:50%;border:2px solid #d1d5db;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
.fm-addon.selected .fm-addon-check{border-color:#2563eb;background:#2563eb;color:#fff}

/* Registered agent options */
.fm-agent-benefits{margin:14px 0 16px}
.fm-agent-benefit{display:flex;align-items:flex-start;gap:8px;font-size:.82rem;color:#374151;margin-bottom:8px}
.fm-agent-benefit-check{color:#2563eb;flex-shrink:0;margin-top:1px}
.fm-accordion{border:1px solid #e5e7eb;border-radius:9px;margin-bottom:8px;overflow:hidden}
.fm-acc-btn{width:100%;background:#fff;border:none;padding:13px 16px;text-align:left;font-size:.83rem;font-weight:600;color:#374151;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:10px;transition:background .2s}
.fm-acc-btn:hover{background:#f9fafb}
.fm-acc-icon{color:#6b7280;font-size:.85rem;flex-shrink:0}
.fm-acc-body{display:none;padding:0 16px 13px;font-size:.8rem;color:#6b7280;line-height:1.65}
.fm-acc-body.open{display:block}

/* Member block */
.fm-member{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:14px}
.fm-member-title{font-size:.85rem;font-weight:700;color:#1e293b;margin-bottom:12px}
.fm-checkbox-row{display:flex;align-items:center;gap:8px;font-size:.8rem;color:#374151;margin-bottom:12px}
.fm-checkbox{width:16px;height:16px;border-radius:4px;border:1.5px solid #d1d5db;cursor:pointer}

/* Info box */
.fm-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:12px 14px;font-size:.78rem;color:#1e40af;line-height:1.65;margin:14px 0;display:flex;gap:10px;align-items:flex-start}
.fm-info-icon{flex-shrink:0;margin-top:1px}
.fm-warn{background:#fff8e1;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:10px 14px;font-size:.78rem;color:#92400e;line-height:1.65;margin:14px 0}

/* Virtual address card */
.fm-vma-card{border:1.5px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:14px;position:relative}
.fm-vma-badge{position:absolute;top:-10px;right:16px;background:#059669;color:#fff;font-size:.66rem;font-weight:700;padding:3px 10px;border-radius:20px}
.fm-vma-features{margin:12px 0 16px}
.fm-vma-feature{display:flex;align-items:center;gap:8px;font-size:.81rem;color:#374151;margin-bottom:7px}
.fm-vma-feature-check{color:#059669;font-size:.85rem;flex-shrink:0}

/* Order review */
.fm-review-name{background:#eff6ff;border-radius:8px;padding:10px 20px;text-align:center;font-size:.92rem;font-weight:700;color:#1e40af;margin-bottom:16px}
.fm-review-section{border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px;overflow:hidden}
.fm-review-section-head{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;background:#f9fafb;border-bottom:1px solid #f0f0f0}
.fm-review-section-title{font-size:.85rem;font-weight:700;color:#1e293b}
.fm-review-edit{background:none;border:none;color:#2563eb;font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:underline}
.fm-review-body{padding:14px 18px}
.fm-review-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fm-review-field label{font-size:.72rem;color:#9ca3af;display:block;margin-bottom:2px}
.fm-review-field span{font-size:.82rem;color:#1e293b;font-weight:500}

/* Payment */
.fm-pay-option{border:1.5px solid #e5e7eb;border-radius:9px;padding:13px 16px;margin-bottom:10px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:space-between}
.fm-pay-option:hover{border-color:#93c5fd}
.fm-pay-option.selected{border-color:#f97316;background:#fff7ed}
.fm-pay-option-left{display:flex;align-items:center;gap:10px;font-size:.85rem;font-weight:600;color:#1e293b}
.fm-pay-logos{display:flex;gap:6px;align-items:center}
.fm-pay-logo{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:3px 7px;font-size:.7rem;font-weight:700;color:#374151}

/* Nav buttons */
.btn-back-fm{background:#fff;border:1.5px solid #e5e7eb;color:#6b7280;padding:9px 20px;border-radius:9px;font-size:.84rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:6px}
.btn-back-fm:hover{border-color:#9ca3af;color:#374151}
.btn-next-fm{background:#2563eb;color:#fff;padding:10px 28px;border-radius:9px;font-size:.88rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:7px}
.btn-next-fm:hover{background:#1d4ed8;box-shadow:0 4px 14px rgba(37,99,235,.3)}
.btn-submit-fm{background:#059669;color:#fff;padding:10px 24px;border-radius:9px;font-size:.88rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:7px;width:100%;justify-content:center}
.btn-submit-fm:hover{background:#047857;box-shadow:0 4px 14px rgba(5,150,105,.3)}
.btn-nothanks{background:#fff;border:1.5px solid #e5e7eb;color:#6b7280;padding:9px 20px;border-radius:9px;font-size:.84rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-nothanks:hover{border-color:#9ca3af}
.btn-upsell{background:#f97316;color:#fff;padding:10px 24px;border-radius:9px;font-size:.88rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:7px}
.btn-upsell:hover{background:#ea580c;box-shadow:0 4px 14px rgba(249,115,22,.3)}

/* Security badges */
.fm-secure{display:flex;gap:8px;flex-wrap:wrap;padding:12px 20px;border-top:1px solid #f3f4f6}
.fm-sec-badge{display:flex;align-items:center;gap:4px;font-size:.69rem;color:#6b7280;font-weight:500}

/* Email validation */
.fm-email-err{display:none;font-size:.73rem;color:#ef4444;margin-top:4px}
.fm-email-ok{display:none;font-size:.73rem;color:#059669;margin-top:4px}

.form-overlay{display:none;position:fixed;inset:0;z-index:2000;background:#f3f4f6;overflow-y:auto}
.form-overlay.active{display:block}
/* ── TOOLTIPS ── */
.tt-wrap{position:relative;display:inline-flex;align-items:center;gap:6px}
.tt-icon{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:var(--blue-mid);color:var(--blue);font-size:.72rem;font-weight:700;cursor:default;flex-shrink:0;line-height:1;user-select:none;transition:all .2s;border:1px solid var(--blue)}
.tt-icon:hover{background:var(--blue);color:#fff}
.tt-box{visibility:hidden;opacity:0;position:absolute;left:50%;transform:translateX(-50%);bottom:calc(100% + 8px);background:#ffffff;color:#1e293b;font-size:.82rem;font-weight:400;line-height:1.7;padding:14px 18px;border-radius:10px;width:310px;box-shadow:0 4px 24px rgba(28,46,68,0.13);border:1px solid #e2e8f0;pointer-events:none;transition:opacity .18s,visibility .18s;z-index:999;font-family:'Plus Jakarta Sans',sans-serif}
.tt-box::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:6px solid transparent;border-top-color:#e2e8f0}
.tt-box::before{content:'';position:absolute;top:calc(100% - 1px);left:50%;transform:translateX(-50%);border:6px solid transparent;border-top-color:#ffffff;z-index:1}
.tt-wrap:hover .tt-box{visibility:visible;opacity:1}
`
  const body = `

<!-- TOPBAR -->
<div class="topbar">
  <span id="topbar-text">🌟 Florida's trusted business formation experts — <strong>LLC &amp; Corporation</strong> filing made simple. Start today from <strong>$49 + state fee.</strong></span>
</div>

<!-- HEADER -->
<header>
  <div class="header-inner">
    <a href="#" class="logo">
      <div class="logo-mark">FL</div>
      <div class="logo-text">Florida Business Formation Center</div>
    </a>
    <nav id="main-nav">
      <a href="#how" data-en="How It Works" data-es="Cómo Funciona">How It Works</a>
      <a href="#pricing" data-en="Pricing" data-es="Precios">Pricing</a>
      <a href="#faq" data-en="FAQ" data-es="Preguntas">FAQ</a>
      <a href="#contact" data-en="Contact" data-es="Contacto">Contact</a>
      <a href="servicios.html" data-en="Services" data-es="Servicios">Services</a>
      <a href="#" style="padding:6px 14px;border-radius:6px;border:1.5px solid #e2e8f0;background:#fff;font-size:0.85rem;font-weight:500;color:#475569;cursor:pointer;transition:all 0.2s;" data-en="Login" data-es="Login">Login</a>
    </nav>
    <div style="display:flex;align-items:center;gap:12px">
      <div class="lang-toggle">
        <button class="lang-btn active" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" id="btn-es" onclick="setLang('es')">ES</button>
      </div>
      <a href="/client-portal" style="color: #1a1a2e; text-decoration: none; margin-right: 16px; font-weight: 500; font-size: 15px;">Log In</a>
    </div>
  </div>
</header>

<!-- HERO -->
<section class="hero">
  <div class="hero-inner">
    <h1 id="hero-title">Create Your <em>Florida Business</em>, fast and easy</h1>
    <p id="hero-sub"></p>
    <div class="hero-btns">
      <button class="btn-hero-new btn-hero-start" onclick="openForm()" id="btn-new-app">
        &#x1F680; <span id="lbl-new-app">Start New Application</span>
      </button>
      <button class="btn-hero-new btn-hero-continue" onclick="openContinueModal()" id="btn-continue-app">
        &#x1F50D; <span id="lbl-continue-app">Continue My Application</span>
      </button>
    </div>
  </div>
</section>


<!-- PRICING -->
<section class="section" id="pricing" style="padding:52px 32px">
  <div class="section-inner">
    <div class="text-center">
      <span class="section-label" id="price-label">Our Packages</span>
      <h2 class="section-title" id="price-title">Choose Your Formation Package</h2>
    </div>
    <p style="font-size:0.83rem;color:var(--gray600);text-align:center;margin-bottom:24px;padding:10px 16px;background:var(--blue-light);border-radius:8px;max-width:560px;margin-left:auto;margin-right:auto"><strong style="color:var(--navy)">Not sure which to choose?</strong> Most clients go with Standard — it covers EIN and Bank Account Guide, which banks typically require to open your business account.</p>
    <div class="pricing-grid">

      <!-- BASIC -->
      <div class="pkg-card" onclick="openFormFromPkg('basic')" onmouseenter="pkgHighlight(this)" onmouseleave="pkgUnhighlight(this)">
        <div class="pkg-head">
          <div class="pkg-name">Basic</div>
          <div class="pkg-price-row"><span class="pkg-price">$49</span></div>
          <div class="pkg-state-fee">+ Florida state fee*</div>
          <button class="pkg-cta pkg-cta-basic" onclick="openFormFromPkg('basic')">Get Started</button>
        </div>
        <hr class="pkg-divider"/>
        <div class="pkg-services">
          <div class="svc-row"><span class="svc-name">LLC or Corporation Formation</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">FL Certificate of Formation</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">Name Availability Search</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">EIN / Tax ID Number</span><span class="svc-status s-add">+ $49</span></div>
          <div class="svc-row"><span class="svc-name">Operating Agreement</span><span class="svc-status s-add">+ $79</span></div>
          <div class="svc-row"><span class="svc-name">Expedited Filing</span><span class="svc-status s-add">+ $99</span></div>
          <div class="svc-row"><span class="svc-name">Bank Account Guide</span><span class="svc-status s-add">+ $29</span></div>
          <div class="svc-row"><span class="svc-name">ITIN Application</span><span class="svc-status s-add">+ $69</span></div>
          <div class="svc-row"><span class="svc-name">DBA / Fictitious Name</span><span class="svc-status s-add">+ $49</span></div>
          <div class="svc-row"><span class="svc-name">Articles of Amendment</span><span class="svc-status s-add">+ $59</span></div>
        </div>
      </div>

      <!-- STANDARD -->
      <div class="pkg-card featured pkg-active" id="pkg-card-standard" onclick="openFormFromPkg('standard')" onmouseenter="pkgHighlight(this)" onmouseleave="pkgUnhighlight(this)">
        <div class="pkg-head">
          <div class="popular-tag">⭐ Most Popular</div>
          <div class="pkg-name">Standard</div>
          <div class="pkg-price-row"><span class="pkg-price">$149</span></div>
          <div class="pkg-state-fee">+ Florida state fee*</div>
          <button class="pkg-cta pkg-cta-featured" onclick="openFormFromPkg('standard')">Get Started</button>
        </div>
        <hr class="pkg-divider"/>
        <div class="pkg-services">
          <div class="svc-row"><span class="svc-name">LLC or Corporation Formation</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">FL Certificate of Formation</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">Name Availability Search</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">EIN / Tax ID Number</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">Operating Agreement</span><span class="svc-status s-add">+ $79</span></div>
          <div class="svc-row"><span class="svc-name">Expedited Filing</span><span class="svc-status s-add">+ $99</span></div>
          <div class="svc-row"><span class="svc-name">Bank Account Guide</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">ITIN Application</span><span class="svc-status s-add">+ $69</span></div>
          <div class="svc-row"><span class="svc-name">DBA / Fictitious Name</span><span class="svc-status s-add">+ $49</span></div>
          <div class="svc-row"><span class="svc-name">Articles of Amendment</span><span class="svc-status s-add">+ $59</span></div>
        </div>
      </div>

      <!-- PREMIUM -->
      <div class="pkg-card" onclick="openFormFromPkg('premium')" onmouseenter="pkgHighlight(this)" onmouseleave="pkgUnhighlight(this)">
        <div class="pkg-head">
          <div class="pkg-name">Premium</div>
          <div class="pkg-price-row"><span class="pkg-price">$249</span></div>
          <div class="pkg-state-fee">+ Florida state fee*</div>
          <button class="pkg-cta pkg-cta-premium" onclick="openFormFromPkg('premium')">Get Started</button>
        </div>
        <hr class="pkg-divider"/>
        <div class="pkg-services">
          <div class="svc-row"><span class="svc-name">LLC or Corporation Formation</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">FL Certificate of Formation</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">Name Availability Search</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">EIN / Tax ID Number</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">Operating Agreement</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">Expedited Filing</span><span class="svc-status s-check">&#10003;</span></div>
          <div class="svc-row"><span class="svc-name">Bank Account Guide</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">ITIN Application</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">DBA / Fictitious Name</span><span class="svc-status s-check">✓</span></div>
          <div class="svc-row"><span class="svc-name">Articles of Amendment</span><span class="svc-status s-check">✓</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="section how-bg" id="how">
  <div class="section-inner">
    <div class="text-center">
      <span class="section-label" id="how-label">How It Works</span>
      <h2 class="section-title" id="how-title">From Idea to Official Business<br/>in 4 Simple Steps</h2>
      <p class="section-sub" id="how-sub">We handle all the paperwork, filings, and communications with the State of Florida. You just provide the information — we do the rest.</p>
    </div>
    <div class="steps-grid">
      <div class="step-card">
        <div class="step-num">1</div>
        <h4 id="s1h">Choose Your Package</h4>
        <p id="s1p">Select the formation package that fits your needs and budget. Basic, Standard, or Premium — each designed to give you exactly what you need at every stage.</p>
      </div>
      <div class="step-card">
        <div class="step-num">2</div>
        <h4 id="s2h">Complete Your Order</h4>
        <p id="s2p">Fill out our guided form in minutes. We ask only what's necessary. Your information is encrypted and handled with the highest level of confidentiality.</p>
      </div>
      <div class="step-card">
        <div class="step-num">3</div>
        <h4 id="s3h">We File With the State</h4>
        <p id="s3p">Our experts review your documents, verify your business name availability with the Florida Division of Corporations, and submit everything on your behalf.</p>
      </div>
      <div class="step-card">
        <div class="step-num">4</div>
        <h4 id="s4h">Your Business Is Official</h4>
        <p id="s4p">Receive your Certificate of Formation, your documents, and everything you need to open your bank account and start operating — fully protected and legally compliant.</p>
      </div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="section testi-bg">
  <div class="section-inner">
    <div class="text-center">
      <span class="section-label" id="testi-label">Client Stories</span>
      <h2 class="section-title" id="testi-title">Real Entrepreneurs.<br/>Real Results.</h2>
      <p class="section-sub" id="testi-sub">From first-time founders to seasoned investors — we help every business get started on the right foot.</p>
    </div>
    <div class="testi-grid">
      <div class="testi-card">
        <div class="stars">★★★★★</div>
        <p class="testi-text">"I had no idea where to start with my LLC. The team walked me through every step and within days I had my Certificate of Formation in hand. Absolutely seamless experience."</p>
        <div class="testi-author">
          <div class="testi-avatar" style="background:#3B82F6">MR</div>
          <div class="testi-info"><strong>Maria Rodriguez</strong><span>Restaurant Owner · Miami, FL</span></div>
        </div>
      </div>
      <div class="testi-card">
        <div class="stars">★★★★★</div>
        <p class="testi-text">"As a foreign investor forming a Corporation in Florida, I was worried about the complexity. They handled everything professionally and kept me informed at every stage. Worth every penny."</p>
        <div class="testi-author">
          <div class="testi-avatar" style="background:#8B5CF6">JC</div>
          <div class="testi-info"><strong>James Chen</strong><span>Real Estate Investor · Orlando, FL</span></div>
        </div>
      </div>
      <div class="testi-card">
        <div class="stars">★★★★★</div>
        <p class="testi-text">"I chose the Premium package and it covered absolutely everything — EIN, Operating Agreement, Registered Agent. My business was up and running faster than I expected. Highly recommend!"</p>
        <div class="testi-author">
          <div class="testi-avatar" style="background:#059669">AL</div>
          <div class="testi-info"><strong>Ana Lucía Torres</strong><span>Boutique Owner · Tampa, FL</span></div>
        </div>
      </div>
      <div class="testi-card">
        <div class="stars">★★★★★</div>
        <p class="testi-text">"The bilingual support was a game-changer for me. I could communicate in Spanish while having everything filed properly in English. A truly professional service."</p>
        <div class="testi-author">
          <div class="testi-avatar" style="background:#F59E0B">DP</div>
          <div class="testi-info"><strong>David Pereira</strong><span>Tech Startup Founder · Fort Lauderdale, FL</span></div>
        </div>
      </div>
      <div class="testi-card">
        <div class="stars">★★★★★</div>
        <p class="testi-text">"I saved my application halfway through, came back two days later with my order number and everything was right where I left it. Smart, modern, and stress-free."</p>
        <div class="testi-author">
          <div class="testi-avatar" style="background:#EF4444">KW</div>
          <div class="testi-info"><strong>Karen Williams</strong><span>Consultant · Jacksonville, FL</span></div>
        </div>
      </div>
      <div class="testi-card">
        <div class="stars">★★★★★</div>
        <p class="testi-text">"As a new entrepreneur, I had questions at every step. Their WhatsApp support was incredibly responsive. I felt like I had a personal advisor guiding me the entire time."</p>
        <div class="testi-author">
          <div class="testi-avatar" style="background:#0EA5E9">RG</div>
          <div class="testi-info"><strong>Roberto García</strong><span>Import/Export Business · Hialeah, FL</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="section" id="faq">
  <div class="section-inner">
    <div class="text-center">
      <span class="section-label" id="faq-label">FAQ</span>
      <h2 class="section-title" id="faq-title">Answers to Your Most<br/>Important Questions</h2>
    </div>
    <div class="faq-list">
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)"><span data-en="What is the difference between an LLC and a Corporation?" data-es="¿Cuál es la diferencia entre una LLC y una Corporación?">What is the difference between an LLC and a Corporation?</span><span class="faq-icon">+</span></button>
        <div class="faq-a" data-en="An LLC offers flexible management and pass-through taxation, ideal for small businesses. A Corporation is suited for businesses seeking investors or planning to issue stock. Both protect your personal assets." data-es="Una LLC ofrece gestión flexible e impuestos pass-through, ideal para pequeños negocios. Una Corporación es más formal y adecuada para negocios que buscan inversores o emitir acciones. Ambas protegen tus activos personales.">An LLC offers flexible management and pass-through taxation, ideal for small businesses. A Corporation is suited for businesses seeking investors or planning to issue stock. Both protect your personal assets.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)"><span data-en="How long does it take to form my business in Florida?" data-es="¿Cuánto tiempo tarda en formarse mi negocio en Florida?">How long does it take to form my business in Florida?</span><span class="faq-icon">+</span></button>
        <div class="faq-a" data-en="Standard processing typically takes 7-10 business days. With Expedited Filing, it can be reduced to 1-3 business days." data-es="El procesamiento estándar normalmente tarda 7-10 días hábiles. Con tramitación acelerada puede reducirse a 1-3 días hábiles.">Standard processing typically takes 7-10 business days. With Expedited Filing, it can be reduced to 1-3 business days.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)"><span data-en="What is a Registered Agent and do I really need one?" data-es="¿Qué es un Agente Registrado y realmente lo necesito?">What is a Registered Agent and do I really need one?</span><span class="faq-icon">+</span></button>
        <div class="faq-a" data-en="Yes. Every LLC and Corporation in Florida is legally required to have a Registered Agent with a physical Florida street address in the state." data-es="Sí. Toda LLC y Corporación en Florida está legalmente obligada a tener un Agente Registrado con dirección física en el estado.">Yes. Every LLC and Corporation in Florida is legally required to have a Registered Agent with a physical Florida street address in the state.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)"><span data-en="Do I need an EIN if I'm a single-member LLC?" data-es="¿Necesito un EIN si tengo una LLC de un solo miembro?">Do I need an EIN if I'm a single-member LLC?</span><span class="faq-icon">+</span></button>
        <div class="faq-a" data-en="Yes, in most cases. An EIN is required to open a business bank account, hire employees, and file business taxes." data-es="Sí, en la mayoría de los casos. Se requiere un EIN para abrir una cuenta bancaria empresarial, contratar empleados y presentar impuestos.">Yes, in most cases. An EIN is required to open a business bank account, hire employees, and file business taxes.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)"><span data-en="Can I start a Florida LLC if I live in another country?" data-es="¿Puedo formar una LLC en Florida si vivo en otro país?">Can I start a Florida LLC if I live in another country?</span><span class="faq-icon">+</span></button>
        <div class="faq-a" data-en="Absolutely. There are no residency requirements to form an LLC or Corporation in Florida. Non-U.S. residents can form a Florida business entity." data-es="Absolutamente. No hay requisitos de residencia para formar una LLC o Corporación en Florida. Los no residentes pueden formar una entidad comercial en Florida.">Absolutely. There are no residency requirements to form an LLC or Corporation in Florida. Non-U.S. residents can form a Florida business entity.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)"><span data-en="What is an Operating Agreement and why does the bank require" data-es="¿Qué es un Acuerdo Operativo y por qué lo requiere el banco?">What is an Operating Agreement and why does the bank require it?</span><span class="faq-icon">+</span></button>
        <div class="faq-a" data-en="An Operating Agreement outlines the ownership structure and operating procedures of your LLC. Most banks require it to open a business checking account." data-es="Un Acuerdo Operativo describe la estructura de propiedad y los procedimientos operativos de tu LLC. La mayoría de los bancos lo requieren para abrir una cuenta empresarial.">An Operating Agreement outlines the ownership structure and operating procedures of your LLC. Most banks require it to open a business checking account.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)"><span data-en="Can I save my application and complete it later?" data-es="¿Puedo guardar mi solicitud y completarla más tarde?">Can I save my application and complete it later?</span><span class="faq-icon">+</span></button>
        <div class="faq-a" data-en="Yes! You can save your progress at any step and return using your order number. Your information is securely stored." data-es="¡Sí! Puedes guardar tu progreso en cualquier paso y regresar usando tu número de orden. Tu información se almacena de forma segura.">Yes! You can save your progress at any step and return using your order number. Your information is securely stored.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)"><span data-en="Are you a law firm? Do you provide legal advice?" data-es="¿Son una firma de abogados? ¿Brindan asesoría legal?">Are you a law firm? Do you provide legal advice?</span><span class="faq-icon">+</span></button>
        <div class="faq-a" data-en="We are a professional document filing service, not a law firm. We do not provide legal, tax, or financial advice." data-es="Somos un servicio profesional de preparación de documentos, no una firma de abogados. No brindamos asesoría legal, fiscal ni financiera.">We are a professional document filing service, not a law firm. We do not provide legal, tax, or financial advice.</div>
      </div>
    </div>
  </div>
</section>

<!-- CONTACT / HELP -->
<section class="section" id="contact" style="padding-top:20px">
  <div class="section-inner">
    <div class="help-bar">
      <div class="help-text">
        <strong id="help-title">Not sure where to start? We're here for you.</strong>
        <p id="help-sub">Our formation experts are ready to answer your questions and guide you to the right package — at no extra cost.</p>
      </div>
      <div class="help-btns">
        <button class="btn-wa" onclick="window.open('https://wa.me/1XXXXXXXXXX','_blank')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Chat on WhatsApp
        </button>
        <button class="btn-cal" onclick="window.open('https://calendly.com/PLACEHOLDER','_blank')">
          📅 Schedule Free Consultation
        </button>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo-mark" style="display:inline-flex;margin-bottom:14px">FL</div>
        <div style="font-family:'Fraunces',serif;color:#fff;font-size:1rem;font-weight:600;margin-bottom:8px">Florida Business Formation Center</div>
        <p>Professional business formation services for entrepreneurs and investors. We file your LLC or Corporation with the State of Florida — accurately, efficiently, and with personal attention.</p>
        <p style="margin-top:10px;color:rgba(255,255,255,0.4);font-size:0.75rem">📧 <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="86efe8e0e9c6ebffe4f3f5efe8e3f5f5e0e9f4ebe7f2efe9e8a8e5e9eb">[email&#160;protected]</a></p>
      </div>
      <div class="footer-col">
        <h5 data-en="Services" data-es="Servicios">Services</h5>
        <a href="servicios.html" data-en="LLC Formation" data-es="Formación de LLC">LLC Formation</a>
        <a href="servicios.html" data-en="Corporation Formation" data-es="Formación de Corporación">Corporation Formation</a>
        <a href="servicios.html#registered-agent" data-en="Registered Agent" data-es="Agente Registrado">Registered Agent</a>
        <a href="servicios.html#ein" data-en="EIN / Tax ID" data-es="EIN / ID Fiscal">EIN / Tax ID</a>
        <a href="servicios.html#operating-agreement" data-en="Operating Agreement" data-es="Acuerdo Operativo">Operating Agreement</a>
        <a href="servicios.html#annual-report" data-en="Annual Report Filing" data-es="Declaración Anual">Annual Report Filing</a>
      </div>
      <div class="footer-col">
        <h5 data-en="Add-On Services" data-es="Servicios Adicionales">Add-On Services</h5>
        <a href="servicios.html#itin" data-en="ITIN Application" data-es="Solicitud de ITIN">ITIN Application</a>
        <a href="servicios.html#dba" data-en="DBA / Fictitious Name" data-es="DBA / Nombre Ficticio">DBA / Fictitious Name</a>
        <a href="servicios.html#amendment" data-en="Articles of Amendment" data-es="Artículos de Enmienda">Articles of Amendment</a>
        <a href="servicios.html#virtual-address" data-en="Virtual Mailing Address" data-es="Dirección Postal Virtual">Virtual Mailing Address</a>
        <a href="servicios.html" data-en="Business Phone Number" data-es="Teléfono Empresarial">Business Phone Number</a>
        <a href="servicios.html" data-en="Professional Website" data-es="Sitio Web Profesional">Professional Website</a>
      </div>
      <div class="footer-col">
        <h5 data-en="Company" data-es="Empresa">Company</h5>
        <a href="#" data-en="About Us" data-es="Nosotros">About Us</a>
        <a href="#" data-en="How It Works" data-es="Cómo Funciona">How It Works</a>
        <a href="#" data-en="FAQ" data-es="Preguntas">FAQ</a>
        <a href="#" data-en="Contact Us" data-es="Contáctanos">Contact Us</a>
        <a href="terms.html" style="margin-top:12px;opacity:0.5" data-en="Terms &amp; Conditions" data-es="Términos y Condiciones">Terms &amp; Conditions</a>
        <a href="privacy.html" style="opacity:0.5" data-en="Privacy Policy" data-es="Política de Privacidad">Privacy Policy</a>
        <a href="legal.html" style="opacity:0.5" data-en="Legal Disclaimer" data-es="Aviso Legal">Legal Disclaimer</a>
      </div>
    </div>
    <hr class="footer-divider"/>
    <div class="footer-bottom">
      <div>
        <div class="footer-copy">© 2025 Florida Business Formation Center · mybusinessformation.com · All Rights Reserved.</div>
        <div class="footer-links" style="margin-top:8px">
          <a href="terms.html" data-en="Terms &amp; Conditions" data-es="Términos y Condiciones">Terms &amp; Conditions</a>
          <span style="color:rgba(255,255,255,0.25);margin:0 10px;font-size:.7rem">&bull;</span>
          <a href="privacy.html" data-en="Privacy Policy" data-es="Política de Privacidad">Privacy Policy</a>
          <span style="color:rgba(255,255,255,0.25);margin:0 10px;font-size:.7rem">&bull;</span>
          <a href="legal.html" data-en="Legal Disclaimer" data-es="Aviso Legal">Legal Disclaimer</a>
        </div>
      </div>
      <div class="footer-disclaimer">
        <strong style="color:rgba(255,255,255,0.5);display:block;margin-bottom:4px">Important Notice</strong>
        Florida Business Formation Center is a document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. The information on this website is for general informational purposes only. Use of our services does not create an attorney-client relationship. For legal advice specific to your situation, please consult a licensed Florida attorney.
      </div>
    </div>
  </div>
</footer>

<!-- WHATSAPP FLOAT -->
<a class="wa-float" href="https://wa.me/1XXXXXXXXXX" target="_blank" title="Chat with us on WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>

<!-- FORM MODAL -->

<!-- FORM OVERLAY -->
<!-- CONTINUE APPLICATION MODAL -->
<div id="continueModal" style="display:none;position:fixed;inset:0;z-index:3000;background:rgba(7,19,54,0.75);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:20px">
  <div style="background:#fff;border-radius:16px;width:100%;max-width:440px;box-shadow:0 24px 80px rgba(0,0,0,0.35);overflow:hidden">
    <div style="background:linear-gradient(135deg,var(--navy),#1e4db7);padding:22px 26px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-family:'Fraunces',serif;color:#fff;font-size:1.1rem;font-weight:700;margin-bottom:3px" id="cont-modal-title">Continue My Application</div>
        <div style="font-size:.75rem;color:rgba(255,255,255,.6)" id="cont-modal-sub">Enter your order number to pick up where you left off</div>
      </div>
      <button onclick="closeContinueModal()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;line-height:1">&#x2715;</button>
    </div>
    <div style="padding:28px">
      <label style="display:block;font-size:.82rem;font-weight:600;color:#374151;margin-bottom:8px" id="cont-order-lbl">Order Number</label>
      <input type="text" id="inp-continue-order" placeholder="e.g. FBFC-12345" style="width:100%;padding:12px 14px;border:1.5px solid #e5e7eb;border-radius:9px;font-size:1rem;font-family:inherit;color:#1e293b;box-sizing:border-box;text-transform:uppercase;letter-spacing:1px" oninput="this.value=this.value.toUpperCase()" onkeydown="if(event.key==='Enter')findOrder()"/>
      <div id="cont-error" style="display:none;color:#ef4444;font-size:.78rem;margin-top:6px;padding:8px 12px;background:#fef2f2;border-radius:7px"></div>
      <div style="font-size:.75rem;color:#9ca3af;margin-top:10px;line-height:1.6" id="cont-hint">Your order number starts with <strong>FBFC-</strong></div>
      <button onclick="findOrder()" style="width:100%;margin-top:18px;background:#2563eb;color:#fff;padding:13px;border-radius:9px;font-size:.92rem;font-weight:700;border:none;cursor:pointer;font-family:inherit" id="cont-submit-btn">&#x1F50D; Find My Application</button>
      <div style="text-align:center;margin-top:14px;font-size:.78rem;color:#9ca3af">
        <button onclick="closeContinueModal();openForm();" style="background:none;border:none;color:#2563eb;font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:underline" id="cont-start-new-lbl">Start a new application</button>
      </div>
    </div>
  </div>
</div>

<div class="form-overlay" id="formOverlay">
  <div style="background:var(--navy);padding:10px 24px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(28,46,68,.25)">
    <a href="mybusinessformation.html" onclick="closeForm();return false;" style="display:flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0">
      <div style="width:28px;height:28px;background:var(--blue);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:.85rem">FL</div>
    </a>
    <a href="mybusinessformation.html" onclick="closeForm();return false;" id="fp-home-btn" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.9);padding:5px 12px;border-radius:7px;font-size:.76rem;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0">
      &#8592; <span id="fp-home-lbl">Back to Home</span>
    </a>
    <span id="fp-step-title" style="font-size:.8rem;font-weight:600;color:rgba(255,255,255,.65);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Business Setup</span>
    <div style="width:180px;height:5px;background:rgba(255,255,255,.2);border-radius:3px;overflow:hidden;flex-shrink:0">
      <div id="fp-fill" style="height:100%;width:11%;background:var(--blue);border-radius:3px;transition:width .4s ease"></div>
    </div>
    <span id="fp-pct" style="font-size:.74rem;color:rgba(255,255,255,.55);white-space:nowrap;flex-shrink:0">Step 1 of 9</span>
  </div>
  <div style="display:flex;flex-direction:row;gap:24px;align-items:flex-start;max-width:1080px;margin:28px auto;padding:0 20px 60px;box-sizing:border-box">
    <div style="flex:1;min-width:0">
      <div class="fm-step active" id="fms1">
        <div class="fm-card">
          <div class="fm-card-body">
            <h2 class="fm-title" id="s1-title">Business Setup</h2>
            <p class="fm-sub" id="s1-sub">Tell us about the business you want to form in Florida.</p>
            <!-- Entity type -->
          <div class="fm-divider" id="s1-entity-divider">What type of entity are you forming?</div>
          <div class="fm-choices">
            <div class="fm-choice selected" id="fms-et-llc" onclick="fmSetEntity('llc',this)">
              <div class="fm-choice-radio"></div>
              <div class="fm-choice-content">
                <strong id="s1-llc-lbl">&#127963; LLC &mdash; Limited Liability Company</strong>
                <p id="s1-llc-desc">Flexible management &middot; Pass-through taxes &middot; Most popular choice</p>
              </div>
            </div>
            <div class="fm-choice" id="fms-et-corp" onclick="fmSetEntity('corp',this)">
              <div class="fm-choice-radio"></div>
              <div class="fm-choice-content">
                <strong id="s1-corp-lbl">&#128202; Corporation</strong>
                <p id="s1-corp-desc">Ideal for raising capital &middot; Can issue stock &middot; More formal structure</p>
              </div>
            </div>
          </div>

          <div class="fm-divider" id="s1-name-divider">Business Name</div>
          <div style="display:flex;gap:12px">
            <div class="fm-group" style="flex:2;margin-bottom:0">
              <label class="fm-label" id="lbl-bizname">Preferred Business Name *</label>
              <input type="text" class="fm-input" id="inp-bizname" placeholder="e.g. Sunshine Ventures" oninput="fmUpdateBizName(this.value)"/>
            </div>
            <div class="fm-group" style="flex:1;margin-bottom:0">
              <label class="fm-label" id="lbl-designator">Must end with *</label>
              <select class="fm-select" id="inp-designator" onchange="fmUpdateBizName()" required>
                <option value="">&mdash; Select &mdash;</option>
                <option value="LLC">LLC</option>
                <option value="L.L.C.">L.L.C.</option>
                <option value="Limited Liability Company">Limited Liability Company</option>
              </select>
            </div>
          </div>
          <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:9px 13px;font-size:.76rem;color:#1e40af;line-height:1.6;margin:10px 0 14px" id="s1-fl-note">&#127987;&#65039; <strong id="s1-fl-note-title">Required by Florida:</strong> <span id="s1-fl-note-text">LLCs must end with <em>LLC</em>, <em>L.L.C.</em>, or <em>Limited Liability Company</em>. Corporations must end with <em>Corp</em>, <em>Inc</em>, <em>Corporation</em>, or <em>Incorporated</em>.</span></div>
          <div class="fm-group" id="bizname-preview-wrap" style="display:none">
            <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:9px;padding:9px 13px;font-size:.88rem;font-weight:600;color:#15803d;display:flex;align-items:center;justify-content:space-between">
              <span id="bizname-preview"></span><span>&#10003;</span>
            </div>
          </div>

          <div class="fm-divider" id="alt-names-divider">Alternative Names <span id="alt-names-sub" style="font-size:.68rem;font-weight:400;color:#9ca3af;text-transform:none;letter-spacing:0">(Optional)</span></div>
          <div class="fm-group">
            <label class="fm-label" id="lbl-bizname2">Alternative Name #1 <span id="alt1-opt-lbl">Optional</span></label>
            <div style="display:flex;gap:10px">
              <input type="text" class="fm-input" id="inp-bizname2" placeholder="e.g. Sunshine Group" style="flex:2"/>
              <select class="fm-select" id="inp-designator2" style="flex:1">
                <option value="LLC">LLC</option><option value="L.L.C.">L.L.C.</option><option value="Limited Liability Company">Limited Liability Company</option>
              </select>
            </div>
          </div>
          <div class="fm-group">
            <label class="fm-label" id="lbl-bizname3">Alternative Name #2 <span id="alt2-opt-lbl">Optional</span></label>
            <div style="display:flex;gap:10px">
              <input type="text" class="fm-input" id="inp-bizname3" placeholder="e.g. Sunshine Solutions" style="flex:2"/>
              <select class="fm-select" id="inp-designator3" style="flex:1">
                <option value="LLC">LLC</option><option value="L.L.C.">L.L.C.</option><option value="Limited Liability Company">Limited Liability Company</option>
              </select>
            </div>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:11px 14px;font-size:.76rem;color:#475569;line-height:1.65;margin-top:6px" id="s1-avail-note">&#128269; <span id="s1-avail-text">We verify your name against Florida's public records before filing. If your preferred name is taken, we contact you right away and help find a strong alternative &mdash; at no extra charge.</span></div>

          <!-- Authorized Shares — Corporation only -->
          <div id="s1-shares-wrap" style="display:none;margin-top:14px">
            <div class="fm-divider" id="s1-shares-divider">Authorized Shares</div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:10px 14px;font-size:.76rem;color:#1e40af;line-height:1.65;margin-bottom:12px" id="s1-shares-info">
              &#128202; <span id="s1-shares-info-text">Florida requires every Corporation to declare the total number of shares it is authorized to issue. This number is recorded in the public Articles of Incorporation. Most small corporations use 1,000 or more shares. You can always authorize more shares than you initially issue.</span>
            </div>
            <div class="fm-group">
              <label class="fm-label"><span class="tt-wrap"><span id="lbl-shares">Number of Authorized Shares *</span><span class="tt-icon">?<span class="tt-box" id="tt-shares">This is the total number of shares your Corporation is legally allowed to issue. Think of it like the maximum number of "ownership pieces" your company can ever have. Most small businesses use 1,000 shares — it gives you flexibility without overcomplicating things.</span></span></span></label>
              <input type="number" class="fm-input" id="inp-shares" placeholder="e.g. 1000" min="1" style="max-width:220px"/>
            </div>
          </div>

          <!-- Effective Date — Optional for both -->
          <div style="margin-top:14px">
            <div class="fm-divider" id="s1-effdate-divider">Effective Date <span style="font-size:.68rem;font-weight:400;color:#9ca3af;text-transform:none;letter-spacing:0" id="s1-effdate-opt">(Optional)</span></div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px 14px;font-size:.76rem;color:#475569;line-height:1.65;margin-bottom:12px" id="s1-effdate-info">
              &#128197; <span id="s1-effdate-info-text">Leave blank to use the date Florida approves your filing. You may request a date up to 5 business days before submission or up to 90 days after.</span>
            </div>
            <div class="fm-group">
              <label class="fm-label"><span class="tt-wrap"><span id="lbl-effdate">Requested Effective Date</span><span class="tt-icon">?<span class="tt-box" id="tt-effdate">This is the official date your business comes to life in Florida's records. If you leave it blank, we use the day Florida approves your filing — which works perfectly for most people. You'd only change this if you need your business to start on a specific date, like January 1st for tax reasons.</span></span></span></label>
              <input type="date" class="fm-input" id="inp-effdate" style="max-width:220px"/>
            </div>
          </div>

          </div>
          <div class="fm-card-footer">
            <div></div>
            <div style="display:flex;align-items:center;gap:10px">
              <button class="save-btn" onclick="saveOrder()">&#x1F4BE; <span id="s1-save">Save</span></button>
              <button class="btn-next-fm" onclick="fmNext()"><span id="s1-next">Continue</span> &#8594;</button>
            </div>
          </div>
        </div>
      </div>
      <div class="fm-step" id="fms2">
        <div class="fm-card">
          <div class="fm-card-body">
            <h2 class="fm-title" id="s2-title">Your Information</h2>
            <p class="fm-sub" id="s2-sub">Tell us how to reach you and where your business will be located.</p>
            <div class="fm-divider" id="s2-contact-divider">Contact Information</div>
            <div class="fm-row">
              <div class="fm-group"><label class="fm-label" id="lbl-fname">First Name *</label><input type="text" class="fm-input" id="inp-fname" placeholder="First name" oninput="fmTitleCase(this)"/></div>
              <div class="fm-group"><label class="fm-label" id="lbl-lname">Last Name *</label><input type="text" class="fm-input" id="inp-lname" placeholder="Last name" oninput="fmTitleCase(this)"/></div>
            </div>
            <div class="fm-group"><label class="fm-label" id="lbl-email">Email *</label><input type="email" class="fm-input" id="inp-email" placeholder="your@email.com" oninput="fmCheckEmailMatch()"/></div>
            <div class="fm-group">
              <label class="fm-label" id="lbl-email-confirm">Confirm Email *</label>
              <input type="email" class="fm-input" id="inp-email-confirm" placeholder="Re-enter your email"
                onpaste="return false" oncopy="return false" oncut="return false"
                oninput="fmCheckEmailMatch()" autocomplete="off"/>
              <div id="email-match-msg" style="font-size:.74rem;margin-top:4px;display:none"></div>
            </div>
            <div class="fm-group">
              <label class="fm-label" id="lbl-phone">Phone Number *</label>
              <div style="display:flex;gap:8px">
                <select class="fm-select" id="inp-phone-country" style="width:155px;flex-shrink:0">
                  <option value="+1">+1 USA</option><option value="+52">+52 Mexico</option><option value="+57">+57 Colombia</option><option value="+58">+58 Venezuela</option><option value="+54">+54 Argentina</option><option value="+55">+55 Brasil</option><option value="+53">+53 Cuba</option><option value="+1809">+1809 R.Dom.</option><option value="+34">+34 Espana</option><option value="+593">+593 Ecuador</option><option value="+502">+502 Guatemala</option><option value="+504">+504 Honduras</option><option value="+505">+505 Nicaragua</option><option value="+506">+506 Costa Rica</option><option value="+51">+51 Peru</option><option value="+56">+56 Chile</option><option value="+44">+44 UK</option><option value="+33">+33 France</option><option value="+49">+49 Germany</option><option value="+other">Other</option>
                </select>
                <input type="tel" class="fm-input" id="inp-phone" placeholder="Phone number" oninput="fmFormatPhone(this)" style="flex:1"/>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;font-size:.79rem;color:#374151;margin-top:4px;margin-bottom:4px">
              <input type="checkbox" id="chk-sms" checked style="width:16px;height:16px;cursor:pointer"/>
              <label for="chk-sms" style="cursor:pointer" id="lbl-sms">I agree to receive order updates by text and phone. <span style="font-size:.7rem;color:#9ca3af;font-weight:400" id="lbl-sms-opt">(Optional)</span></label>
            </div>
            <div class="fm-divider" id="s2-biz-addr-divider" style="margin-top:12px">Business Address</div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:11px 14px;font-size:.77rem;color:#475569;line-height:1.65;margin-bottom:14px">
              &#128204; <strong id="s2-biz-addr-info-title">What is the Business Address?</strong><br/>
              <span id="s2-biz-addr-info-text">This is the official address of your LLC or Corporation filed with the State of Florida.</span>
            </div>
            <div class="fm-choices">
              <div class="fm-choice selected" id="biz-addr-virtual" onclick="fmSetBizAddr('virtual',this)">
                <div class="fm-choice-radio"></div>
                <div class="fm-choice-content">
                  <strong id="biz-virtual-lbl">&#128205; Use Virtual Address <span style="font-size:.68rem;background:#059669;color:#fff;padding:2px 7px;border-radius:10px;margin-left:4px" id="biz-virtual-badge">1st Month FREE</span></strong>
                  <p id="biz-virtual-desc">We assign you a professional Florida address. Your personal address stays completely private.</p>
                </div>
              </div>
              <div class="fm-choice" id="biz-addr-own" onclick="fmSetBizAddr('own',this)">
                <div class="fm-choice-radio"></div>
                <div class="fm-choice-content">
                  <strong id="biz-own-lbl">&#127968; I will use my own address</strong>
                  <p id="biz-own-desc">Your address will be part of the public Florida Division of Corporations record.</p>
                </div>
              </div>
            </div>
            <div id="biz-virtual-note" style="margin-top:10px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac;border-radius:10px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start">
              <span style="font-size:1.2rem;flex-shrink:0">&#127881;</span>
              <div>
                <div style="font-size:.84rem;font-weight:700;color:#15803d;margin-bottom:3px" id="biz-virtual-confirm-title">You are all set &mdash; no address needed from you.</div>
                <p style="font-size:.78rem;color:#166534;line-height:1.65" id="biz-virtual-confirm-text">Once your order is confirmed, we will assign your dedicated Florida virtual address and deliver it to your email. Your business will have a professional address from day one.</p>
              </div>
            </div>
            <div id="biz-own-form" style="display:none;margin-top:10px">
              <div class="fm-group"><label class="fm-label" id="lbl-biz-country">Country *</label>
                <select class="fm-select" id="inp-biz-country" onchange="fmBizCountryChange(this)"><option value="US">United States</option><option value="AR">Argentina</option><option value="BR">Brazil</option><option value="CL">Chile</option><option value="CO">Colombia</option><option value="CR">Costa Rica</option><option value="CU">Cuba</option><option value="DO">Dominican Republic</option><option value="EC">Ecuador</option><option value="ES">Spain</option><option value="GB">United Kingdom</option><option value="GT">Guatemala</option><option value="HN">Honduras</option><option value="MX">Mexico</option><option value="NI">Nicaragua</option><option value="PE">Peru</option><option value="VE">Venezuela</option><option value="other">Other</option></select>
              </div>
              <div id="biz-addr-fields-dynamic">
                <!-- Rendered dynamically by fmBizCountryChange -->
                <div class="fm-group"><label class="fm-label">Street Address *</label><input type="text" class="fm-input" id="inp-addr" placeholder="Street address"/></div>
                <div class="fm-group"><label class="fm-label">Apt / Suite <span style="font-size:.72rem;color:#9ca3af">Optional</span></label><input type="text" class="fm-input" id="inp-street2" placeholder="Apt, Suite, Unit"/></div>
                <div class="fm-row-3">
                  <div class="fm-group"><label class="fm-label">City *</label><input type="text" class="fm-input" id="inp-city" placeholder="City"/></div>
                  <div class="fm-group"><label class="fm-label">State *</label><select class="fm-select" id="inp-state"><option value="">Select State</option><option value="FL">Florida</option><option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option></select></div>
                  <div class="fm-group"><label class="fm-label">ZIP Code *</label><input type="text" class="fm-input" id="inp-zip" placeholder="00000" maxlength="10"/></div>
                </div>
              </div>
            </div>

            <!-- Organizer / Incorporator Electronic Signature -->
            <div style="margin-top:18px">
              <div class="fm-divider" id="s2-sig-divider">Electronic Signature</div>
              <div style="background:#fff8e1;border:1px solid #fcd34d;border-radius:9px;padding:10px 14px;font-size:.76rem;color:#92400e;line-height:1.65;margin-bottom:12px" id="s2-sig-info">
                &#9998; <span id="s2-sig-info-text">Florida law requires the Organizer (LLC) or Incorporator (Corporation) to sign the formation document. By typing your full legal name below you are electronically signing the Articles of Organization / Incorporation under penalty of perjury.</span>
              </div>
              <div class="fm-group">
                <label class="fm-label"><span class="tt-wrap"><span id="lbl-org-sig">Electronic Signature — Organizer / Incorporator *</span><span class="tt-icon">?<span class="tt-box" id="tt-org-sig">Florida law requires the person forming the business to sign the official document. By typing your full legal name here, you are electronically signing the Articles of Organization (LLC) or Articles of Incorporation (Corporation) — this has the same legal value as a handwritten signature.</span></span></span></label>
                <input type="text" class="fm-input" id="inp-org-sig" placeholder="Type your full legal name to sign" oninput="fmTitleCase(this)"/>
              </div>
            </div>

          </div>
          <div class="fm-card-footer">
            <button class="btn-back-fm" onclick="fmBack()">&#8592; <span id="s2-back">Back</span></button>
            <div style="display:flex;align-items:center;gap:10px">
              <button class="save-btn" onclick="saveOrder()">&#x1F4BE; <span id="s2-save">Save</span></button>
              <button class="btn-next-fm" onclick="fmNext()"><span id="s2-next">Continue</span> &#8594;</button>
            </div>
          </div>
        </div>
      </div>
      <div class="fm-step" id="fms3">
        <div class="fm-card">
          <div class="fm-card-body">
            <h2 class="fm-title" id="s3-title">Registered Agent &amp; Mailing Address</h2>
            <p class="fm-sub" id="s3-sub">Choose who will receive official documents for your business.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:11px 14px;font-size:.77rem;color:#475569;line-height:1.65;margin-bottom:14px">
              &#128204; <strong id="s3-agent-info-title">What is a Registered Agent? <span class="tt-wrap" style="vertical-align:middle"><span class="tt-icon">?<span class="tt-box" id="tt-ra" style="left:0;transform:none">A Registered Agent is the official point of contact between your business and the State of Florida. They receive legal notices, lawsuits, and government mail on your behalf. Every Florida LLC and Corporation is required by law to have one at all times.</span></span></span></strong><br/>
              <span id="s3-agent-info-text">Florida law requires every LLC and Corporation to have a Registered Agent &mdash; a person or company with a physical Florida address available during business hours to receive official legal documents and government notices on behalf of your business.</span>
            </div>
            <div class="fm-choices">
              <div class="fm-choice selected" id="agent-use-ours" onclick="fmSetAgentChoice('ours',this)">
                <div class="fm-choice-radio"></div>
                <div class="fm-choice-content">
                  <strong id="agent-ours-lbl">&#127963; Use Our Registered Agent Service</strong>
                  <p id="agent-ours-desc">We act as your official Registered Agent. Your personal address stays completely private &mdash; we handle all official correspondence.</p>
                </div>
              </div>
              <div class="fm-choice" id="agent-use-own" onclick="fmSetAgentChoice('own',this)">
                <div class="fm-choice-radio"></div>
                <div class="fm-choice-content">
                  <strong id="agent-own-lbl">&#128100; I will be my own Registered Agent</strong>
                  <p id="agent-own-desc">You need a physical Florida address and must be available during normal business hours.</p>
                </div>
              </div>
            </div>
            <div id="agent-ours-note" style="margin-top:10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:12px 14px;font-size:.78rem;color:#1e40af;line-height:1.65">
              &#8505; <span id="agent-ours-note-text">We will act as your Registered Agent and receive all official documents on your behalf. Your personal address will not appear on any public record.</span>
            </div>
            <div id="agent-own-form" style="display:none;margin-top:14px">
              <div style="background:#fff8e1;border:1px solid #fcd34d;border-radius:9px;padding:10px 14px;font-size:.76rem;color:#92400e;margin-bottom:12px">
                &#9888; <span id="agent-own-warn-text">Your Registered Agent address will appear on the public Florida Division of Corporations record. It must be a physical Florida address &mdash; no PO Boxes accepted.</span>
              </div>
              <div class="fm-group"><label class="fm-label" id="lbl-ra-name">Full Name *</label><input type="text" class="fm-input" id="inp-ra-name" placeholder="Full legal name" oninput="fmTitleCase(this)"/></div>
              <div class="fm-row">
                <div class="fm-group"><label class="fm-label" id="lbl-ra-street">Street Address * <span style="font-size:.72rem;color:#9ca3af">(No PO Box)</span></label><input type="text" class="fm-input" id="inp-ra-street" placeholder="e.g. 123 Main Street"/></div>
                <div class="fm-group"><label class="fm-label">Suite / Apt <span style="font-size:.72rem;color:#9ca3af">Optional</span></label><input type="text" class="fm-input" id="inp-ra-street2" placeholder="Suite, Apt, Unit"/></div>
              </div>
              <div class="fm-row-3">
                <div class="fm-group"><label class="fm-label" id="lbl-ra-city">City *</label><input type="text" class="fm-input" id="inp-ra-city" placeholder="City"/></div>
                <div class="fm-group"><label class="fm-label">State</label><input type="text" class="fm-input" value="FL" readonly style="background:#f9fafb;color:#6b7280"/></div>
                <div class="fm-group"><label class="fm-label" id="lbl-ra-zip">ZIP Code *</label><input type="text" class="fm-input" id="inp-ra-zip" placeholder="e.g. 33101" maxlength="5"/></div>
              </div>
              <div class="fm-group"><label class="fm-label" id="lbl-ra-sig">Electronic Signature *</label><input type="text" class="fm-input" id="inp-ra-sig" placeholder="Type your full legal name to confirm" oninput="fmTitleCase(this)" as Registered Agent"/></div>
              <div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding-bottom:12px">
                <div>
                  <div style="font-size:.7rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:1px" id="s3-mail-divider"><span id="s3-mail-divider-entity">LLC</span> Mailing Address</div>
                  <div style="font-size:.68rem;color:#9ca3af;margin-top:2px" id="s3-mail-opt">Optional — separate from your Registered Agent address</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="checkbox" id="chk-same-mail" checked onchange="fmToggleMailAddr(this)" style="width:16px;height:16px;cursor:pointer"/>
                  <label for="chk-same-mail" style="cursor:pointer;font-size:.82rem;font-weight:500;color:#374151" id="lbl-same-mail">Same as business address</label>
                </div>
              </div>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px 14px;font-size:.76rem;color:#475569;line-height:1.6;margin-bottom:12px">
                <div style="display:flex;flex-direction:column;gap:8px">
                  <div style="font-size:.77rem;font-weight:600;color:#374151" id="s3-mail-info-text">&#9993; Where should the State send your LLC's general mail?</div>
                  <div style="font-size:.75rem;color:#475569;line-height:1.7" id="s3-mail-info-sub">
                    This address is <strong>different</strong> from your Registered Agent address above. Here's the key difference:<br/>
                    <span style="display:block;margin-top:6px">&#x2716; <strong style="color:#dc2626">Registered Agent address</strong> receives <em>legal &amp; critical documents</em> — lawsuits, court orders, government summons. Must be a physical Florida address.</span>
                    <span style="display:block;margin-top:4px">&#x2714; <strong style="color:#059669">This mailing address</strong> receives <em>general correspondence</em> — Annual Report reminders, filing confirmations, state notices. <strong>A PO Box is accepted. Any address worldwide is valid.</strong></span>
                  </div>
                </div>
              </div>
              <div id="mail-addr-fields" style="display:none">
                <div class="fm-group"><label class="fm-label" id="lbl-mail-country">Country *</label>
                  <select class="fm-select" id="inp-mail-country"><option value="US">United States</option><option value="AR">Argentina</option><option value="BR">Brazil</option><option value="CL">Chile</option><option value="CO">Colombia</option><option value="CR">Costa Rica</option><option value="CU">Cuba</option><option value="DO">Dominican Republic</option><option value="EC">Ecuador</option><option value="ES">Spain</option><option value="GB">United Kingdom</option><option value="GT">Guatemala</option><option value="HN">Honduras</option><option value="MX">Mexico</option><option value="NI">Nicaragua</option><option value="PE">Peru</option><option value="VE">Venezuela</option><option value="other">Other</option></select>
                </div>
                <div class="fm-group"><label class="fm-label" id="lbl-mail-street">Street Address / PO Box *</label><input type="text" class="fm-input" id="inp-mail-street" placeholder="Street address or PO Box"/></div>
                <div class="fm-row">
                  <div class="fm-group"><label class="fm-label" id="lbl-mail-city">City *</label><input type="text" class="fm-input" id="inp-mail-city" placeholder="City"/></div>
                  <div class="fm-group"><label class="fm-label" id="lbl-mail-zip">ZIP / Postal Code *</label><input type="text" class="fm-input" id="inp-mail-zip" placeholder="00000"/></div>
                </div>
              </div>
            </div>
          </div>
          <div class="fm-card-footer">
            <button class="btn-back-fm" onclick="fmBack()">&#8592; <span id="s3-back">Back</span></button>
            <div style="display:flex;align-items:center;gap:10px">
              <button class="save-btn" onclick="saveOrder()">&#x1F4BE; <span id="s3-save">Save</span></button>
              <button class="btn-next-fm" onclick="fmNext()"><span id="s3-next">Continue</span> &#8594;</button>
            </div>
          </div>
        </div>
      </div>
      <div class="fm-step" id="fms4">
        <div class="fm-card">
          <div class="fm-card-body">
            <h2 class="fm-title" id="s4-title">&#x1F680; You&#39;re Almost There &mdash; Unlock More Power</h2>
            <p class="fm-sub" id="s4-sub">Most clients upgrade before filing &mdash; it saves time, money, and the hassle of ordering services separately later.</p>
            <div id="upgrade-cards-container" style="display:grid;gap:14px;margin-bottom:20px"></div>
            <div style="text-align:center;margin-top:6px">
              <button onclick="fmSkipUpgrade()" style="background:none;border:none;color:#9ca3af;font-size:.78rem;cursor:pointer;font-family:inherit;text-decoration:underline;padding:4px" id="s4-skip-lbl">No thanks, I&#39;m good with my current package</button>
            </div>
          </div>
          <div class="fm-card-footer">
            <button class="btn-back-fm" onclick="fmBack()">&#8592; <span id="s4-back">Back</span></button>
            <div style="display:flex;align-items:center;gap:10px">
              <button class="save-btn" onclick="saveOrder()">&#x1F4BE; <span id="s4-save">Save</span></button>
              <button class="btn-next-fm" onclick="fmNext()" style="min-width:160px"><span id="s4-next">Continue</span> &#8594;</button>
            </div>
          </div>
        </div>
      </div>
      <div class="fm-step" id="fms5">
        <div class="fm-card">
          <div class="fm-card-body">
            <h2 class="fm-title" id="s5-title">Business Owners &amp; Members</h2>
            <p class="fm-sub" id="s5-sub">Tell us who owns this business. Each person or company with an ownership stake must be listed exactly as they will appear on the State of Florida records.</p>

            <!-- Member 1 -->
            <div class="fm-member-block" id="fms5-member-1">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <div style="font-size:.88rem;font-weight:700;color:var(--navy)" id="s5-m1-title">Member / Owner #1</div>
              </div>

              <!-- Individual or Company -->
              <div class="fm-group">
                <label class="fm-label" id="s5-m1-type-lbl">Type *</label>
                <div class="fm-choices" style="margin-bottom:0">
                  <div class="fm-choice selected" id="s5-m1-ind" onclick="fmSetMemberType(1,'individual',this)">
                    <div class="fm-choice-radio"></div>
                    <div class="fm-choice-content"><strong id="s5-ind-lbl">&#128100; Individual</strong><p id="s5-ind-desc">A person who owns part of this business</p></div>
                  </div>
                  <div class="fm-choice" id="s5-m1-co" onclick="fmSetMemberType(1,'company',this)">
                    <div class="fm-choice-radio"></div>
                    <div class="fm-choice-content"><strong id="s5-co-lbl">&#127963; Company</strong><p id="s5-co-desc">Another business entity that owns part of this business</p></div>
                  </div>
                </div>
              </div>

              <!-- Individual fields -->
              <div id="s5-m1-ind-fields">
                <div class="fm-row">
                  <div class="fm-group"><label class="fm-label" id="s5-m1-fname-lbl">First Name *</label><input type="text" class="fm-input" id="s5-m1-fname" placeholder="First name" oninput="fmTitleCase(this)"/></div>
                  <div class="fm-group"><label class="fm-label" id="s5-m1-lname-lbl">Last Name *</label><input type="text" class="fm-input" id="s5-m1-lname" placeholder="Last name" oninput="fmTitleCase(this)"/></div>
                </div>
                <div class="fm-row">
                  <div class="fm-group">
                    <label class="fm-label" id="s5-m1-title-lbl">Title / Role *</label>
                    <select class="fm-select" id="s5-m1-role">
                      <option value="">-- Select --</option>
                      <option value="MGR">MGR (Manager)</option>
                      <option value="MGRM">MGRM (Manager &amp; Member)</option>
                      <option value="P">P (President)</option>
                      <option value="VP">VP (Vice President)</option>
                      <option value="ST">ST (Secretary / Treasurer)</option>
                      <option value="D">D (Director)</option>
                      <option value="RA">RA (Registered Agent)</option>
                    </select>
                  </div>
                  <div class="fm-group"><label class="fm-label" id="s5-m1-own-lbl">Ownership % <span style="font-size:.68rem;font-weight:500;color:#f59e0b;background:#fef3c7;padding:1px 6px;border-radius:4px" id="s5-own-rec-lbl">Recommended</span></label><input type="number" class="fm-input" id="s5-m1-own" placeholder="e.g. 100" min="0" max="100" oninput="fmUpdateOwnership()"/></div>
                </div>
                <div class="fm-group"><label class="fm-label" id="s5-m1-country-lbl">Country *</label>
                <select class="fm-select" id="s5-m1-country" onchange="fmMemberAddrChange('s5-m1',this)"><option value="US">United States</option><option value="AR">Argentina</option><option value="BR">Brazil</option><option value="CL">Chile</option><option value="CO">Colombia</option><option value="CR">Costa Rica</option><option value="CU">Cuba</option><option value="DO">Dominican Republic</option><option value="EC">Ecuador</option><option value="ES">Spain</option><option value="GB">United Kingdom</option><option value="GT">Guatemala</option><option value="HN">Honduras</option><option value="MX">Mexico</option><option value="NI">Nicaragua</option><option value="PE">Peru</option><option value="VE">Venezuela</option><option value="other">Other</option></select>
              </div>
              <div id="s5-m1-addr-dynamic">
                <div class="fm-group"><label class="fm-label">Street Address *</label><input type="text" class="fm-input" id="s5-m1-addr" placeholder="e.g. 123 Main Street"/></div>
                <div class="fm-row-3">
                  <div class="fm-group"><label class="fm-label">City *</label><input type="text" class="fm-input" id="s5-m1-city" placeholder="City"/></div>
                  <div class="fm-group"><label class="fm-label">State *</label><input type="text" class="fm-input" id="s5-m1-state" placeholder="e.g. FL"/></div>
                  <div class="fm-group"><label class="fm-label">ZIP *</label><input type="text" class="fm-input" id="s5-m1-zip" placeholder="00000" maxlength="10"/></div>
                </div>
              </div>
              </div>

              <!-- Company fields -->
              <div id="s5-m1-co-fields" style="display:none">
                <div class="fm-group"><label class="fm-label" id="s5-m1-coname-lbl">Company Name *</label><input type="text" class="fm-input" id="s5-m1-coname" placeholder="Legal company name"/></div>
                <div class="fm-row">
                  <div class="fm-group"><label class="fm-label" id="s5-m1-coein-lbl">EIN / Tax ID</label><input type="text" class="fm-input" id="s5-m1-coein" placeholder="XX-XXXXXXX"/></div>
                  <div class="fm-group"><label class="fm-label" id="s5-m1-coorg-lbl">Country of Incorporation *</label><input type="text" class="fm-input" id="s5-m1-coorg" placeholder="e.g. United States"/></div>
                </div>
                <div class="fm-row">
                  <div class="fm-group">
                    <label class="fm-label" id="s5-m1-corole-lbl">Title / Role *</label>
                    <select class="fm-select" id="s5-m1-corole">
                      <option value="">-- Select --</option>
                      <option value="MGR">MGR (Manager)</option>
                      <option value="MGRM">MGRM (Manager &amp; Member)</option>
                      <option value="P">P (President)</option>
                      <option value="VP">VP (Vice President)</option>
                      <option value="ST">ST (Secretary / Treasurer)</option>
                      <option value="D" id="s5-m1-corole-dir">D (Director)</option>
                      <option value="RA">RA (Registered Agent)</option>
                    </select>
                  </div>
                  <div class="fm-group"><label class="fm-label" id="s5-m1-coown-lbl">Ownership % <span style="font-size:.68rem;font-weight:500;color:#f59e0b;background:#fef3c7;padding:1px 6px;border-radius:4px">Recommended</span></label><input type="number" class="fm-input" id="s5-m1-coown" placeholder="e.g. 100" min="0" max="100" oninput="fmUpdateOwnership()"/></div>
                </div>
                <div class="fm-group"><label class="fm-label" id="s5-m1-cocountry-lbl">Country *</label>
                  <select class="fm-select" id="s5-m1-cocountry" onchange="fmMemberAddrChange('s5-m1-co',this)">
                    <option value="US">United States</option><option value="AR">Argentina</option><option value="BR">Brazil</option><option value="CL">Chile</option><option value="CO">Colombia</option><option value="CR">Costa Rica</option><option value="CU">Cuba</option><option value="DO">Dominican Republic</option><option value="EC">Ecuador</option><option value="ES">Spain</option><option value="GB">United Kingdom</option><option value="GT">Guatemala</option><option value="HN">Honduras</option><option value="MX">Mexico</option><option value="NI">Nicaragua</option><option value="PE">Peru</option><option value="VE">Venezuela</option><option value="other">Other</option>
                  </select>
                </div>
                <div id="s5-m1-co-addr-dynamic">
                  <div class="fm-group"><label class="fm-label" id="s5-m1-coaddr-lbl">Company Address *</label><input type="text" class="fm-input" id="s5-m1-coaddr" placeholder="Street address"/></div>
                  <div class="fm-row-3">
                    <div class="fm-group"><label class="fm-label">City *</label><input type="text" class="fm-input" id="s5-m1-cocity" placeholder="City"/></div>
                    <div class="fm-group"><label class="fm-label">State *</label><input type="text" class="fm-input" id="s5-m1-costate" placeholder="e.g. FL"/></div>
                    <div class="fm-group"><label class="fm-label">ZIP *</label><input type="text" class="fm-input" id="s5-m1-cozip" placeholder="00000" maxlength="10"/></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional members container -->
            <div id="s5-extra-members"></div>

            <!-- Ownership total indicator -->
            <div id="s5-own-total-wrap" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:10px 14px;margin-top:4px;display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:.8rem;color:#6b7280" id="s5-own-total-lbl">Total Ownership</span>
              <span style="font-size:.9rem;font-weight:700;color:#1e293b" id="s5-own-total">0%</span>
            </div>

            <!-- Add member button -->
            <button onclick="fmAddMember()" style="width:100%;margin-top:16px;background:#fff;border:1.5px dashed #94a3b8;color:#475569;padding:12px;border-radius:9px;font-size:.86rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px" id="s5-add-btn" onmouseover="this.style.borderColor='#2563eb';this.style.color='#2563eb'" onmouseout="this.style.borderColor='#94a3b8';this.style.color='#475569'">
              <span style="font-size:1.1rem">+</span> <span id="s5-add-lbl">Add Another Member / Owner</span>
            </button>

          </div>
          <div class="fm-card-footer">
            <button class="btn-back-fm" onclick="fmBack()">&#8592; <span id="s5-back">Back</span></button>
            <div style="display:flex;align-items:center;gap:10px">
              <button class="save-btn" onclick="saveOrder()">&#x1F4BE; <span id="s5-save">Save</span></button>
              <button class="btn-next-fm" onclick="fmNext()"><span id="s5-next">Continue</span> &#8594;</button>
            </div>
          </div>
        </div>
      </div>
      <div class="fm-step" id="fms6">
        <div class="fm-card">
          <div class="fm-card-body">
            <h2 class="fm-title" id="s6-title">Registered Agent</h2>
            <p class="fm-sub" id="s6-sub">Florida law requires every LLC and Corporation to designate a Registered Agent to receive official legal and government documents on behalf of your business.</p>

            <!-- What is a Registered Agent -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:16px">
              <div style="font-size:.82rem;color:#374151;line-height:1.8">
                <div style="margin-bottom:4px"><span style="color:#2563eb;font-weight:700">&#10003;</span> <span id="s6-b1">Receives lawsuits, court orders, and official state documents</span></div>
                <div style="margin-bottom:4px"><span style="color:#2563eb;font-weight:700">&#10003;</span> <span id="s6-b2">Must have a physical Florida address — no PO Boxes</span></div>
                <div><span style="color:#2563eb;font-weight:700">&#10003;</span> <span id="s6-b3">Must be available during normal business hours</span></div>
              </div>
            </div>

            <!-- Options -->
            <div class="fm-choices">
              <div class="fm-choice selected" id="ra-us" onclick="fmSetRA('us',this)">
                <div class="fm-choice-radio"></div>
                <div class="fm-choice-content">
                  <strong id="ra-us-lbl">&#127968; Use Our Registered Agent Service</strong>
                  <p id="ra-us-desc">We act as your Registered Agent and handle all official documents on your behalf.</p>
                </div>
              </div>
              <div class="fm-choice" id="ra-own" onclick="fmSetRA('own',this)">
                <div class="fm-choice-radio"></div>
                <div class="fm-choice-content">
                  <strong id="ra-own-lbl">I Will Be My Own Agent</strong>
                  <p id="ra-own-desc">You need a physical FL address and must be reachable during business hours.</p>
                </div>
              </div>
            </div>

            <!-- Own RA fields -->
            <div id="ra-own-fields" style="display:none;margin-top:14px">
              <div class="fm-group">
                <label class="fm-label" id="lbl-ra-name">Registered Agent Full Name *</label>
                <input type="text" class="fm-input" id="inp-ra-name" placeholder="Full legal name" oninput="fmTitleCase(this)"/>
              </div>
              <div class="fm-group">
                <label class="fm-label" id="lbl-ra-street">Florida Street Address *</label>
                <input type="text" class="fm-input" id="inp-ra-street" placeholder="Physical FL address — no PO Box"/>
              </div>
              <div class="fm-row-3">
                <div class="fm-group"><label class="fm-label">City *</label><input type="text" class="fm-input" id="inp-ra-city" placeholder="City"/></div>
                <div class="fm-group"><label class="fm-label">State</label><input type="text" class="fm-input" value="FL" readonly style="background:#f9fafb;color:#6b7280"/></div>
                <div class="fm-group"><label class="fm-label">ZIP *</label><input type="text" class="fm-input" id="inp-ra-zip" placeholder="ZIP"/></div>
              </div>
            </div>

            <!-- Info note -->
            <div class="fm-info" style="margin-top:14px">
              <span class="fm-info-icon">&#8505;</span>
              <span id="s6-info-note">Your Registered Agent&rsquo;s address will appear on the public Florida Division of Corporations record &mdash; not your personal address. This helps protect your privacy.</span>
            </div>
          </div>
          <div class="fm-card-footer">
            <button class="btn-back-fm" onclick="fmBack()">&#8592; <span id="s6-back">Back</span></button>
            <div style="display:flex;align-items:center;gap:10px">
              <button class="save-btn" onclick="saveOrder()">&#x1F4BE; <span id="s6-save">Save</span></button>
              <button class="btn-next-fm" onclick="fmNext()"><span id="s6-next">Continue</span> &#8594;</button>
            </div>
          </div>
        </div>
      </div>
      <div class="fm-step" id="fms7">
        <div class="fm-card">
          <div class="fm-card-body">
            <h2 class="fm-title" id="s7-title">Boost Your Formation</h2>
            <p class="fm-sub" id="s7-sub">All optional. Add what makes sense now or order anytime.</p>
            <!-- EIN -->
          <div class="fm-addon" id="addon-ein" onclick="fmToggleAddon('ein',this)">
            <div class="fm-addon-left">
              <div class="fm-addon-check" id="ein-check"></div>
              <div class="fm-addon-icon">&#127981;</div>
              <div>
                <div class="fm-addon-name"><span id="addon-ein-name">EIN / Federal Tax ID Number</span> <span class="tt-wrap" style="vertical-align:middle"><span class="tt-icon">?<span class="tt-box" id="tt-ein">An EIN is like a Social Security Number for your business. The IRS requires it to open a business bank account, hire employees, and file taxes. Even if you don't plan to hire anyone, most banks won't let you open a business account without one.</span></span></span></div>
                <div class="fm-addon-desc" id="addon-ein-desc">Required for bank accounts, hiring employees &amp; filing taxes</div>
              </div>
            </div>
            <div class="fm-addon-price" id="addon-ein-price">$49</div>
          </div>

          <!-- EIN extra fields — shown only when EIN is selected -->
          <div id="ein-extra-fields" style="display:none;margin-top:0;border:1.5px solid #bfdbfe;border-top:none;border-radius:0 0 10px 10px;background:#f8fafc;padding:18px 20px 16px">
            <div style="font-size:.78rem;font-weight:600;color:#1e40af;margin-bottom:14px"><span id="ein-extra-header">&#128203; Additional info needed for your EIN application</span></div>

            <!-- Responsible party ID -->
            <div class="fm-group">
              <label class="fm-label">
                <span class="tt-wrap">
                  <span id="lbl-ein-rp-id">SSN / ITIN of Responsible Party *</span>
                  <span class="tt-icon">?<span class="tt-box">The IRS requires the tax ID (SSN or ITIN) of the person who controls and manages this business. This is the primary owner listed in Step 5. Without this, the IRS cannot process your EIN application online.</span></span>
                </span>
              </label>
              <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
                <div style="display:flex;gap:8px;flex:1;min-width:200px">
                  <label style="display:flex;align-items:center;gap:6px;font-size:.83rem;cursor:pointer;padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:8px;flex:1;transition:all .2s" id="ein-has-ssn-lbl">
                    <input type="radio" name="ein-id-type" id="ein-has-ssn" value="ssn" onchange="fmEinIdTypeChange(this)" style="cursor:pointer"/> SSN
                  </label>
                  <label style="display:flex;align-items:center;gap:6px;font-size:.83rem;cursor:pointer;padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:8px;flex:1;transition:all .2s" id="ein-has-itin-lbl">
                    <input type="radio" name="ein-id-type" id="ein-has-itin" value="itin" onchange="fmEinIdTypeChange(this)" style="cursor:pointer"/> ITIN
                  </label>
                  <label style="display:flex;align-items:center;gap:6px;font-size:.83rem;cursor:pointer;padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:8px;flex:1;transition:all .2s;background:#fff" id="ein-no-id-lbl">
                    <input type="radio" name="ein-id-type" id="ein-no-id" value="none" onchange="fmEinIdTypeChange(this)" style="cursor:pointer"/> <span id="ein-no-id-txt">I'm a foreigner — Request ITIN <span style="font-size:.72rem;font-weight:600;color:#f59e0b;background:#fef3c7;padding:1px 6px;border-radius:4px;margin-left:2px">+$69</span></span>
                  </label>
                </div>
              </div>
              <!-- SSN input -->
              <div id="ein-ssn-field" style="display:none;margin-top:10px">
                <label class="fm-label" style="margin-bottom:5px" id="lbl-ssn-1">SSN *</label>
                <div style="position:relative;margin-bottom:10px">
                  <input type="password" class="fm-input" id="inp-ein-ssn" placeholder="XXX-XX-XXXX" maxlength="11" oninput="fmFormatSSN(this);fmCheckIdMatch('ssn')" autocomplete="off" style="padding-right:42px;letter-spacing:2px"/>
                  <button type="button" onclick="fmToggleMask('inp-ein-ssn','eye-ssn')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px;display:flex;align-items:center" title="Show/Hide">
                    <svg id="eye-ssn" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <label class="fm-label" style="margin-bottom:5px" id="lbl-ssn-2">Confirm SSN *</label>
                <div style="position:relative">
                  <input type="password" class="fm-input" id="inp-ein-ssn-confirm" placeholder="Re-enter your SSN" maxlength="11" autocomplete="off" style="padding-right:42px;letter-spacing:2px"
                    onpaste="return false" oncopy="return false" oncut="return false"
                    oninput="fmFormatSSN(this);fmCheckIdMatch('ssn')"/>
                  <button type="button" onclick="fmToggleMask('inp-ein-ssn-confirm','eye-ssn-c')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px;display:flex;align-items:center" title="Show/Hide">
                    <svg id="eye-ssn-c" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <div id="ssn-match-msg" style="font-size:.73rem;margin-top:4px;display:none"></div>
                <div style="font-size:.72rem;color:#9ca3af;margin-top:4px" id="ssn-privacy-note">&#128274; Your SSN is encrypted and never stored in plain text.</div>
              </div>
              <div id="ein-itin-field" style="display:none;margin-top:10px">
                <label class="fm-label" style="margin-bottom:5px" id="lbl-itin-1">ITIN *</label>
                <div style="position:relative;margin-bottom:10px">
                  <input type="password" class="fm-input" id="inp-ein-itin" placeholder="9XX-XX-XXXX" maxlength="11" oninput="fmFormatSSN(this);fmCheckIdMatch('itin')" autocomplete="off" style="padding-right:42px;letter-spacing:2px"/>
                  <button type="button" onclick="fmToggleMask('inp-ein-itin','eye-itin')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px;display:flex;align-items:center" title="Show/Hide">
                    <svg id="eye-itin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <label class="fm-label" style="margin-bottom:5px" id="lbl-itin-2">Confirm ITIN *</label>
                <div style="position:relative">
                  <input type="password" class="fm-input" id="inp-ein-itin-confirm" placeholder="Re-enter your ITIN" maxlength="11" autocomplete="off" style="padding-right:42px;letter-spacing:2px"
                    onpaste="return false" oncopy="return false" oncut="return false"
                    oninput="fmFormatSSN(this);fmCheckIdMatch('itin')"/>
                  <button type="button" onclick="fmToggleMask('inp-ein-itin-confirm','eye-itin-c')" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px;display:flex;align-items:center" title="Show/Hide">
                    <svg id="eye-itin-c" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <div id="itin-match-msg" style="font-size:.73rem;margin-top:4px;display:none"></div>
                <div style="font-size:.72rem;color:#9ca3af;margin-top:4px" id="itin-privacy-note">&#128274; Your ITIN is encrypted and never stored in plain text.</div>
              </div>
              <!-- No ID — ITIN auto-added confirmation -->
              <div id="ein-no-id-warning" style="display:none;margin-top:10px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:9px;padding:14px 16px">
                <div style="font-size:.82rem;font-weight:700;color:#065f46;margin-bottom:6px">&#10003; <span id="ein-warn-title">ITIN Application added to your order</span></div>
                <div style="font-size:.79rem;color:#047857;line-height:1.65" id="ein-warn-body">We've automatically added the <strong>ITIN Application ($69)</strong> to your order. We'll process both together — once your ITIN is issued by the IRS, we'll immediately apply for your EIN.
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid #bbf7d0;font-size:.76rem;color:#059669" id="ein-warn-itin-body">
                    &#128274; <span id="ein-warn-itin-cta">Your personal information is protected.</span> You can remove the ITIN service at any time before submitting your order.
                  </div>
                </div>
              </div>
            </div>

            <!-- Business activity -->
            <div class="fm-group" style="margin-top:14px">
              <label class="fm-label" id="lbl-ein-activity">
                <span class="tt-wrap">
                  <span>Principal Business Activity *</span>
                  <span class="tt-icon">?<span class="tt-box">The IRS uses this to classify your business for tax purposes. Select the category that best describes what your business does. You'll then add a brief description to be more specific.</span></span>
                </span>
              </label>
              <!-- Searchable dropdown -->
              <div style="position:relative">
                <input type="text" class="fm-input" id="ein-activity-search" placeholder="Type to search or select..." autocomplete="off"
                  oninput="fmEinActivityFilter(this.value)"
                  onfocus="fmEinActivityFilter(this.value)"
                  onblur="setTimeout(function(){var d=document.getElementById('ein-activity-list');if(d)d.style.display='none';},200)"
                  style="padding-right:36px"/>
                <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#9ca3af;pointer-events:none;font-size:.8rem">&#9660;</span>
                <div id="ein-activity-list" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1.5px solid #e2e8f0;border-top:none;border-radius:0 0 9px 9px;max-height:220px;overflow-y:auto;z-index:500;box-shadow:0 8px 24px rgba(28,46,68,0.1)"></div>
                <input type="hidden" id="ein-activity-val"/>
              </div>
            </div>

            <!-- Specific description -->
            <div class="fm-group" id="ein-activity-desc-wrap" style="margin-top:10px;display:none">
              <label class="fm-label" id="lbl-ein-activity-desc">Describe your specific product or service *</label>
              <input type="text" class="fm-input" id="inp-ein-activity-desc" placeholder='e.g. "Online retail clothing store" or "Graphic design services"'/>
              <div style="font-size:.72rem;color:#9ca3af;margin-top:4px" id="ein-desc-hint">Be specific — a few words describing exactly what you sell or do.</div>
            </div>

            <!-- Fiscal year -->
            <div class="fm-group" style="margin-top:14px">
              <label class="fm-label">
                <span class="tt-wrap">
                  <span id="lbl-ein-fiscal">Closing Month of Fiscal Year *</span>
                  <span class="tt-icon">?<span class="tt-box">This is the last month of your business tax year. Most small businesses use December (calendar year). Only change this if your accountant has advised a different fiscal year.</span></span>
                </span>
              </label>
              <select class="fm-select" id="inp-ein-fiscal">
                <option value="December" selected>December (most common)</option>
                <option value="January">January</option><option value="February">February</option>
                <option value="March">March</option><option value="April">April</option>
                <option value="May">May</option><option value="June">June</option>
                <option value="July">July</option><option value="August">August</option>
                <option value="September">September</option><option value="October">October</option>
                <option value="November">November</option>
              </select>
            </div>
          </div>

          <!-- Operating Agreement -->
          <div class="fm-addon" id="addon-oa" onclick="fmToggleAddon('oa',this)">
            <div class="fm-addon-left">
              <div class="fm-addon-check" id="oa-check"></div>
              <div class="fm-addon-icon">&#128196;</div>
              <div>
                <div class="fm-addon-name"><span id="addon-oa-name">Operating Agreement</span> <span class="tt-wrap" style="vertical-align:middle"><span class="tt-icon">?<span class="tt-box" id="tt-oa">This is your business's internal rulebook — it defines who owns what, how decisions are made, and how profits are divided. Banks typically ask for it when you open a business checking account, and it protects you legally if there's ever a dispute between partners.</span></span></span></div>
                <div class="fm-addon-desc" id="addon-oa-desc">Required by banks to open a business checking account</div>
              </div>
            </div>
            <div class="fm-addon-price" id="addon-oa-price">$79</div>
          </div>

          <!-- OA extra fields — shown only when OA is selected AND ownership % is missing -->
          <div id="oa-extra-fields" style="display:none;margin-top:0;border:1.5px solid #bfdbfe;border-top:none;border-radius:0 0 12px 12px;background:#f8fafc;padding:20px 20px 18px">
            <div style="font-size:.75rem;color:#2563eb;font-weight:600;margin-bottom:14px;display:flex;align-items:center;gap:6px" id="oa-extra-header">
              &#128196; <span id="oa-extra-header-txt">Members &amp; Ownership — Operating Agreement</span>
            </div>
            <div id="oa-ownership-fields">
              <!-- Filled dynamically based on members entered -->
            </div>
          </div>

          <!-- ITIN -->
          <div class="fm-addon" id="addon-itin" onclick="fmToggleAddon('itin',this)">
            <div class="fm-addon-left">
              <div class="fm-addon-check" id="itin-check"></div>
              <div class="fm-addon-icon">&#127760;</div>
              <div>
                <div class="fm-addon-name"><span id="addon-itin-name">ITIN Application</span> <span class="tt-wrap" style="vertical-align:middle"><span class="tt-icon">?<span class="tt-box" id="tt-itin">An ITIN (Individual Taxpayer Identification Number) is your tax ID if you don't have a U.S. Social Security Number. <strong>The majority of U.S. banks require it to open a business bank account</strong> — without one, most banks will turn you away. It's also required to file your federal taxes as a foreign national business owner. If you plan to open a bank account or operate in the U.S., getting your ITIN now avoids delays later.</span></span></span></div>
                <div class="fm-addon-desc" id="addon-itin-desc">For foreign nationals without a Social Security Number</div>
              </div>
            </div>
            <div class="fm-addon-price" id="addon-itin-price">$69</div>
          </div>
          <!-- Annual Report -->
          <div class="fm-addon" id="addon-ar" onclick="fmToggleAddon('ar',this)">
            <div class="fm-addon-left">
              <div class="fm-addon-check" id="ar-check"></div>
              <div class="fm-addon-icon">&#128197;</div>
              <div>
                <div class="fm-addon-name"><span id="addon-ar-name">Annual Report Filing Service</span> <span class="tt-wrap" style="vertical-align:middle"><span class="tt-icon">?<span class="tt-box" id="tt-ar">Every Florida business must file an Annual Report each year to stay active — even if your business has not started operating yet. The law makes no exceptions. The deadline is May 1st. Miss it and Florida automatically charges a $400 late fee. Keep ignoring it and the State can administratively dissolve your company.</span></span></span></div>
                <div class="fm-addon-desc" id="addon-ar-desc">We file your FL Annual Report each year — deadline May 1st</div>
              </div>
            </div>
            <div class="fm-addon-price" id="addon-ar-price">Annual</div>
          </div>
          <div class="fm-warn">
            <strong id="s8-warn-title">&#9888; Florida Deadline:</strong> <span id="s8-warn-text">Annual Reports must be filed between January 1 and May 1. After May 1, Florida imposes a $400 late penalty.</span>
          </div>
          </div>
          <div class="fm-card-footer">
            <button class="btn-back-fm" onclick="fmBack()">&#8592; <span id="s7-back">Back</span></button>
            <div style="display:flex;align-items:center;gap:10px">
              <button class="save-btn" onclick="saveOrder()">&#x1F4BE; <span id="s7-save">Save</span></button>
              <button class="btn-next-fm" onclick="fmNext()"><span id="s7-next">Continue</span> &#8594;</button>
            </div>
          </div>
        </div>
      </div>
      <div class="fm-step" id="fms8">
        <div class="fm-card">
          <div class="fm-card-body">
            <h2 class="fm-title" id="s8-title">Review Your Order</h2>
            <p class="fm-sub" id="s8-sub">Confirm your details before payment.</p>
            <div class="fm-review-name" id="review-biz-name">—</div>
          <!-- Formation Info -->
          <div class="fm-review-section">
            <div class="fm-review-section-head">
              <span class="fm-review-section-title" id="rev-formation-title">Formation Info</span>
              <button class="fm-review-edit" onclick="fmGoToStep(1)" id="rev-edit-1">Edit</button>
            </div>
            <div class="fm-review-body">
              <div class="fm-review-grid">
                <div class="fm-review-field"><label id="rev-state-lbl">State of Formation</label><span>Florida</span></div>
                <div class="fm-review-field"><label id="rev-entity-lbl">Entity Type</label><span id="rev-entity-val">LLC</span></div>
                <div class="fm-review-field"><label id="rev-pkg-lbl">Package</label><span id="rev-pkg-val">Standard</span></div>
                <div class="fm-review-field"><label id="rev-speed-lbl">Filing Speed</label><span id="rev-speed-val">Standard (7-10 days)</span></div>
              </div>
            </div>
          </div>
          <!-- Contact Info -->
          <div class="fm-review-section">
            <div class="fm-review-section-head">
              <span class="fm-review-section-title" id="rev-contact-title">Contact Info</span>
              <button class="fm-review-edit" onclick="fmGoToStep(3)" id="rev-edit-3">Edit</button>
            </div>
            <div class="fm-review-body">
              <div class="fm-review-grid">
                <div class="fm-review-field"><label id="rev-name-lbl">Full Name</label><span id="rev-name-val">—</span></div>
                <div class="fm-review-field"><label id="rev-phone-lbl">Phone</label><span id="rev-phone-val">—</span></div>
                <div class="fm-review-field"><label id="rev-email-lbl">Email</label><span id="rev-email-val">—</span></div>
                <div class="fm-review-field"><label id="rev-addr-lbl">Address</label><span id="rev-addr-val">—</span></div>
              </div>
            </div>
          </div>
          <!-- Agent Info -->
          <div class="fm-review-section">
            <div class="fm-review-section-head">
              <span class="fm-review-section-title" id="rev-agent-title">Registered Agent</span>
              <button class="fm-review-edit" onclick="fmGoToStep(7)" id="rev-edit-7">Edit</button>
            </div>
            <div class="fm-review-body">
              <div class="fm-review-field"><label id="rev-ra-lbl">Registered Agent</label><span id="rev-ra-val">Florida Business Formation Center — First Year Free</span></div>
            </div>
          </div>
          <!-- Members -->
          <div class="fm-review-section">
            <div class="fm-review-section-head">
              <span class="fm-review-section-title" id="rev-members-title">Members / Owners</span>
              <button class="fm-review-edit" onclick="fmGoToStep(6)" id="rev-edit-6">Edit</button>
            </div>
            <div class="fm-review-body" id="rev-members-body">
              <div class="fm-review-field"><label id="rev-m1-lbl">Member 1</label><span id="rev-m1-val">—</span></div>
            </div>
          </div>
          <!-- Add-ons -->
          <div class="fm-review-section" id="rev-addons-section" style="display:none">
            <div class="fm-review-section-head">
              <span class="fm-review-section-title" id="rev-addons-title">Additional Services</span>
              <button class="fm-review-edit" onclick="fmGoToStep(8)" id="rev-edit-8">Edit</button>
            </div>
            <div class="fm-review-body" id="rev-addons-body"></div>
          </div>
          </div>
          <div class="fm-card-footer">
            <button class="btn-back-fm" onclick="fmBack()">&#8592; <span id="s8-back">Back</span></button>
            <div style="display:flex;align-items:center;gap:10px">
              <button class="save-btn" onclick="saveOrder()">&#x1F4BE; <span id="s8-save">Save</span></button>
              <button class="btn-next-fm" onclick="fmNext()"><span id="s8-next">Continue</span> &#8594;</button>
            </div>
          </div>
        </div>
      </div>
      <div class="fm-step" id="fms9">
        <div class="fm-card">
          <div class="fm-card-body">
            <h2 class="fm-title" id="s9-title">Secure Payment</h2>
            <p class="fm-sub" id="s9-sub"></p>
            <h2 class="fm-title" id="s10-title">Billing Information</h2>
          <!-- Payment method -->
          <div class="fm-pay-option selected" id="pay-card" onclick="fmSelectPayMethod('card',this)">
            <div class="fm-pay-option-left">
              <div class="fm-choice-radio" style="flex-shrink:0"></div>
              <span id="s10-card-lbl">&#128179; Add a Credit Card</span>
            </div>
            <div class="fm-pay-logos">
              <span class="fm-pay-logo">VISA</span>
              <span class="fm-pay-logo">MC</span>
              <span class="fm-pay-logo">AMEX</span>
            </div>
          </div>
          <div class="fm-pay-option" id="pay-zelle" onclick="fmSelectPayMethod('zelle',this)">
            <div class="fm-pay-option-left">
              <div class="fm-choice-radio" style="flex-shrink:0"></div>
              <span>&#128247; Zelle</span>
            </div>
          </div>
          <div class="fm-pay-option" id="pay-apple" onclick="fmSelectPayMethod('apple',this)">
            <div class="fm-pay-option-left">
              <div class="fm-choice-radio" style="flex-shrink:0"></div>
              <span>&#63743; Apple Pay</span>
            </div>
          </div>
          <!-- Card fields -->
          <div id="card-fields-wrap" style="margin-top:16px">
            <div class="fm-divider" id="s10-div-card">Credit Card Information</div>
            <div class="fm-group">
              <label class="fm-label" id="lbl-card-name">Cardholder Full Name *</label>
              <input type="text" class="fm-input" id="inp-card-name" placeholder="Full name as it appears on card" autocomplete="cc-name"/>
            </div>
            <div class="fm-group">
              <label class="fm-label" id="lbl-card-num">Card Number *</label>
              <input type="text" class="fm-input" id="inp-card-num" placeholder="1234 5678 9012 3456" maxlength="19" autocomplete="cc-number" oninput="fmFormatCard(this)"/>
            </div>
            <div class="fm-row">
              <div class="fm-group">
                <label class="fm-label" id="lbl-card-exp">Expiry Date *</label>
                <input type="text" class="fm-input" id="inp-card-exp" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp" oninput="fmFormatExpiry(this)"/>
              </div>
              <div class="fm-group">
                <label class="fm-label" id="lbl-card-cvv">CVV / CVC *</label>
                <input type="text" class="fm-input" id="inp-card-cvv" placeholder="3 digits" maxlength="4" autocomplete="cc-csc"/>
              </div>
            </div>
          </div>
          <!-- Billing address -->
          <div class="fm-divider" id="s10-div-billing">Billing Address</div>
          <div class="fm-checkbox-row" style="margin-bottom:12px">
            <input type="checkbox" class="fm-checkbox" id="chk-same-addr" checked onchange="fmToggleBillingAddr(this)"/>
            <label for="chk-same-addr" style="cursor:pointer" id="lbl-same-addr">Same as company address</label>
          </div>
          <div id="billing-addr-fields" style="display:none">
            <div class="fm-group">
              <label class="fm-label" id="lbl-bill-country">Country</label>
              <select class="fm-select" id="inp-bill-country">
                <option value="US">United States of America (United States)</option>
                <option value="other">Other Country</option>
              </select>
            </div>
            <div class="fm-row">
              <div class="fm-group"><label class="fm-label" id="lbl-bill-street">Street Address *</label><input type="text" class="fm-input" id="inp-bill-street" placeholder="Street address"/></div>
              <div class="fm-group"><label class="fm-label" id="lbl-bill-street2">Address (Cont) <span>Optional</span></label><input type="text" class="fm-input" id="inp-bill-street2" placeholder="Apt, Suite"/></div>
            </div>
            <div class="fm-row-3">
              <div class="fm-group"><label class="fm-label" id="lbl-bill-city">City *</label><input type="text" class="fm-input" id="inp-bill-city" placeholder="City"/></div>
              <div class="fm-group"><label class="fm-label" id="lbl-bill-state">State *</label><input type="text" class="fm-input" id="inp-bill-state" placeholder="State"/></div>
              <div class="fm-group"><label class="fm-label" id="lbl-bill-zip">ZIP *</label><input type="text" class="fm-input" id="inp-bill-zip" placeholder="ZIP"/></div>
            </div>
          </div>
          <!-- Agree -->
          <div class="fm-checkbox-row" style="margin-top:14px">
            <input type="checkbox" class="fm-checkbox" id="chk-agree"/>
            <label for="chk-agree" style="cursor:pointer;font-size:.79rem;color:#374151" id="lbl-agree">I agree to the <a href="legal.html" target="_blank" style="color:#2563eb">Legal Statement</a> and <a href="terms.html" target="_blank" style="color:#2563eb">Terms of Service</a>.</label>
          </div>
          <!-- Notice -->
          <div class="fm-warn" style="margin-top:14px">
            <strong id="s10-warn-title">&#9888; Non-Refundable:</strong> <span id="s10-warn-text">State fees cannot be refunded once processing begins. Our service fee is refundable within 24 hours if filing has not started. Questions? Contact us via WhatsApp before submitting.</span>
          </div>
          </div>
          <div class="fm-card-footer">
            <button class="btn-back-fm" onclick="fmBack()">&#8592; <span id="s9-back">Back</span></button>
            <div style="display:flex;align-items:center;gap:10px">
              <button class="save-btn" onclick="saveOrder()">&#x1F4BE; <span id="s9-save">Save</span></button>
              <button class="btn-submit-fm" onclick="fmSubmit()">&#x1F680; <span id="s9-submit">Process My Order</span></button>
            </div>
          </div>
        </div>
      </div>
      <div class="fm-step" id="fms-success">
        <div class="fm-card">
          <div style="text-align:center;padding:48px 32px">
            <div style="font-size:3rem;margin-bottom:16px">&#127881;</div>
            <h2 style="font-family:'Fraunces',serif;font-size:1.5rem;color:#1e293b;margin-bottom:12px" id="suc-title">Your Application Is Confirmed!</h2>
            <p style="font-size:.88rem;color:#6b7280;line-height:1.7;margin-bottom:20px" id="suc-desc">We&rsquo;ve received everything we need. Our team will start the filing with the Florida Division of Corporations promptly.</p>
            <div style="background:#eff6ff;border-radius:10px;padding:14px 20px;margin-bottom:20px;display:inline-block">
              <div style="font-size:.75rem;color:#6b7280;margin-bottom:4px" id="suc-order-lbl">Confirmation Number</div>
              <div style="font-size:1.15rem;font-weight:800;color:#1e40af;font-family:'Fraunces',serif" id="finalOrderNum">FBFC-00000</div>
            </div>
            <p style="font-size:.8rem;color:#6b7280;margin-bottom:24px" id="suc-note">Expect a follow-up within <strong>1 business day</strong> regarding your name availability and next steps.</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
              <button class="btn-next-fm" onclick="window.open('https://wa.me/1XXXXXXXXXX','_blank')">&#x1F4AC; <span id="suc-wa-lbl">Chat with Us on WhatsApp</span></button>
              <button class="btn-back-fm" onclick="closeForm()"><span id="suc-home-lbl">Return to Homepage</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="fm-summary">
      <div class="fm-sum-head">
        <div class="fm-sum-title" id="sum-title-main">Your Order</div>
        <div class="fm-sum-biz" id="sum-biz-name" style="display:none"></div>
      </div>
      <div class="fm-sum-body">
        <div class="fm-sum-line"><span class="fm-sum-lbl" id="sum-lbl-entity">Entity</span><span class="fm-sum-val sum-entity-val">LLC</span></div>
        <div class="fm-sum-line"><span class="fm-sum-lbl" id="sum-lbl-pkg">Package</span><span class="fm-sum-val sum-pkg-val">Standard &#8212; $149</span></div>
        <div class="fm-sum-line"><span class="fm-sum-lbl sum-state-lbl" id="sum-lbl-state">FL State Fee</span><span class="fm-sum-val sum-state-val">$125</span></div>
        <div class="fm-sum-line sum-exp-line" style="display:none"><span class="fm-sum-lbl" id="sum-lbl-exp">Expedited Filing</span><span class="fm-sum-val">$99</span></div>
        <div class="fm-sum-line sum-vma-line" style="display:none"><span class="fm-sum-lbl" id="sum-lbl-vma">Virtual Address</span><span class="fm-sum-val free">1st Month Free</span></div>
        <div class="fm-sum-line sum-ein-line" style="display:none"><span class="fm-sum-lbl" id="sum-lbl-ein">EIN / Tax ID</span><span class="fm-sum-val">$49</span></div>
        <div class="fm-sum-line sum-oa-line" style="display:none"><span class="fm-sum-lbl" id="sum-lbl-oa">Operating Agreement</span><span class="fm-sum-val">$79</span></div>
        <div class="fm-sum-line sum-itin-line" style="display:none"><span class="fm-sum-lbl" id="sum-lbl-itin">ITIN Application</span><span class="fm-sum-val">$69</span></div>
        <div class="fm-sum-line sum-ar-line" style="display:none"><span class="fm-sum-lbl" id="sum-lbl-ar">Annual Report</span><span class="fm-sum-val">Annual</span></div>
      </div>
      <div class="fm-sum-foot">
        <span class="fm-sum-total-lbl sum-total-lbl" id="sum-lbl-total">Total</span>
        <span class="fm-sum-total-val sum-total-val">$274</span>
      </div>
      <div class="fm-secure">
        <div class="fm-sec-badge" id="sum-sec-ssl">&#128274; SSL Encrypted</div>
        <div class="fm-sec-badge" id="sum-sec-nofees">&#10003; No Hidden Fees</div>
        <div class="fm-sec-badge" id="sum-sec-email">&#128196; Receipt by Email</div>
      </div>
    </div>
  </div>
</div><!-- /formOverlay -->

<script>

// ── STATE ──
var currentStep = 1;
var selectedEntity = 'llc';
var totalSteps = 8;
var formData = { filer:'', entity:'llc', package:'standard', addons:{} };
var skipPkgStep = true;
var memberCount = 1;
var currentLang = 'en';
var orderNumber = '';

var translations = {
  en: {
    topbar: "🌟 Florida's trusted business formation experts — <strong>LLC & Corporation</strong> filing made simple. Start today from <strong>$49 + state fee.</strong>",
    heroTitle: 'Create Your <em>Florida Business</em>, fast and easy',
    heroSub: "",
    heroBadge: "Trusted by Entrepreneurs Across Florida",
    heroBtn1: "Start My Business Today →", heroBtn2: "See How It Works",
    stat1:"Businesses Formed", stat2:"Processing Time", stat4:"Starting Price",
    howLabel:"How It Works", howTitle:"From Idea to Official Business<br/>in 4 Simple Steps",
    howSub:"We handle all the paperwork, filings, and communications with the State of Florida.",
    s1h:"Choose Your Package", s1p:"Select the formation package that fits your needs and budget.",
    s2h:"Complete Your Order", s2p:"Fill out our guided form in minutes. Your information is encrypted and secure.",
    s3h:"We File With the State", s3p:"Our experts review your documents and submit everything to the Florida Division of Corporations.",
    s4h:"Your Business Is Official", s4p:"Receive your Certificate of Formation and everything you need to open your bank account.",
    priceLabel:"Our Packages", priceTitle:"Choose Your Formation Package",
    priceSub:"Every package includes expert handling of your State of Florida filing.",
    testiLabel:"Client Stories", testiTitle:"Real Entrepreneurs.<br/>Real Results.",
    testiSub:"From first-time founders to seasoned investors — we help every business get started right.",
    faqLabel:"FAQ", faqTitle:"Answers to Your Most<br/>Important Questions",
    helpTitle:"Not sure where to start? We're here for you.",
    helpSub:"Our formation experts are ready to answer your questions at no extra cost.",
    startBtn:"Start My Business →"
  },
    etLabel:"Choose Your Entity Type",
    s1p:"Select the formation package that fits your needs and budget.",
    s2p:"Fill out our guided form in minutes. Your information is encrypted and secure.",
    s3p:"Our experts review your documents and file with the Florida Division of Corporations.",
    s4p:"Receive your Certificate of Formation and everything you need to open your bank account.",
    priceTitle:"Choose Your Formation Package",
    testiTitle:"Real Entrepreneurs. Real Results.",
    faqTitle:"Answers to Your Most Important Questions",
  es: {
    topbar: "🌟 Expertos de confianza en formación de negocios en Florida — <strong>LLC y Corporación</strong> de manera simple. Desde <strong>$49 + cargo estatal.</strong>",
    heroTitle: 'Crea Tu <em>Negocio en Florida</em>, rápido y fácil',
    heroSub: '',
    heroBadge: "La confianza de cientos de emprendedores en Florida",
    heroBtn1: "Iniciar Mi Negocio Hoy →", heroBtn2: "Cómo Funciona",
    stat1:"Negocios Formados", stat2:"Tiempo de Procesamiento", stat4:"Precio desde",
    howLabel:"Cómo Funciona", howTitle:"De Idea a Negocio Oficial<br/>en 4 Sencillos Pasos",
    howSub:"Manejamos todos los documentos y trámites con el Estado de Florida.",
    s1h:"Elige Tu Paquete", s1p:"Selecciona el paquete de formación que se adapte a tus necesidades y presupuesto.",
    s2h:"Completa Tu Orden", s2p:"Llena nuestro formulario guiado en minutos. Tu información está cifrada y segura.",
    s3h:"Nosotros Tramitamos", s3p:"Nuestros expertos revisan tus documentos y los envían a la División de Corporaciones de Florida.",
    s4h:"Tu Negocio es Oficial", s4p:"Recibe tu Certificado de Formación y todo lo necesario para abrir tu cuenta bancaria.",
    priceLabel:"Nuestros Paquetes", priceTitle:"Elige Tu Paquete de Formación",
    priceSub:"Cada paquete incluye el manejo experto de tu trámite ante el Estado de Florida.",
    testiLabel:"Historias de Clientes", testiTitle:"Emprendedores Reales.<br/>Resultados Reales.",
    testiSub:"Desde fundadores primerizos hasta inversionistas experimentados — ayudamos a cada negocio a comenzar bien.",
    faqLabel:"Preguntas Frecuentes", faqTitle:"Respuestas a Tus Preguntas<br/>Más Importantes",
    helpTitle:"¿No sabes por dónde empezar? Estamos aquí para ayudarte.",
    helpSub:"Nuestros expertos están listos para responder tus preguntas sin costo adicional.",
    startBtn:"Iniciar Mi Negocio →",
    etLabel:"Elige Tu Tipo de Entidad",
    stat2:"Tiempo de Tramitación", stat4:"Precio Desde",
    s1p:"Selecciona el paquete de formación que se adapte a tus necesidades y presupuesto.",
    s2p:"Llena nuestro formulario guiado en minutos. Tu información está cifrada y segura.",
    s3p:"Nuestros expertos revisan tus documentos y los envían a la División de Corporaciones de Florida.",
    s4p:"Recibe tu Certificado de Formación y todo lo necesario para abrir tu cuenta bancaria.",
    priceTitle:"Elige Tu Paquete de Formación",
    testiTitle:"Emprendedores Reales. Resultados Reales.",
    faqTitle:"Respuestas a Tus Preguntas Más Importantes"
  }
};



























function pkgHighlight(el) {
  // Remove active from all cards
  document.querySelectorAll('.pkg-card').forEach(function(c) {
    c.classList.remove('pkg-active');
  });
  // Add active to hovered card
  el.classList.add('pkg-active');
}

function pkgUnhighlight(el) {
  // Remove active from this card
  el.classList.remove('pkg-active');
  // Restore active to Standard (default)
  var std = document.getElementById('pkg-card-standard');
  if(std) std.classList.add('pkg-active');
}

function fmSetMemberType(n, type, el) {
  // Toggle choice buttons
  var indBtn = document.getElementById('s5-m' + n + '-ind');
  var coBtn  = document.getElementById('s5-m' + n + '-co');
  if(indBtn) indBtn.classList.toggle('selected', type === 'individual');
  if(coBtn)  coBtn.classList.toggle('selected',  type === 'company');
  // Show/hide field sections
  var indF = document.getElementById('s5-m' + n + '-ind-fields');
  var coF  = document.getElementById('s5-m' + n + '-co-fields');
  if(indF) indF.style.display = type === 'individual' ? 'block' : 'none';
  if(coF)  coF.style.display  = type === 'company'    ? 'block' : 'none';
  // Init company address fields when switching to company type
  if(type === 'company') {
    var coCtr = document.getElementById('s5-m' + n + '-co-addr-dynamic');
    var coCountry = document.getElementById('s5-m' + n + '-cocountry');
    if(coCtr && coCountry) fmMemberAddrChange('s5-m' + n + '-co', coCountry);
    // Also for member 1 static
    var co1Ctr = document.getElementById('s5-m1-co-addr-dynamic');
    var co1Country = document.getElementById('s5-m1-cocountry');
    if(co1Ctr && co1Country && n === 1) fmMemberAddrChange('s5-m1-co', co1Country);
  }
  // If Corporation, remove Director option from company role select
  if(type === 'company' && (window.selectedEntity === 'corp' || (window.fmData && window.fmData.entity === 'corp'))) {
    var roleSelId = 's5-m' + n + '-corole';
    var roleSel = document.getElementById(roleSelId);
    if(roleSel) {
      Array.from(roleSel.options).forEach(function(opt) {
        if(opt.value === 'D') opt.disabled = true;
        if(opt.value === 'D') opt.title = 'Directors must be individuals for Corporations';
      });
      if(roleSel.value === 'D') roleSel.value = '';
    }
  }
}

function fmSetMemberTypeEl(el) {
  var n    = parseInt(el.getAttribute('data-n'));
  var type = el.getAttribute('data-type');
  fmSetMemberType(n, type, el);
}

function fmUpdateOwnership() {
  var total = 0;
  document.querySelectorAll('[id^="s5-m"][id$="-own"],[id^="s5-m"][id$="-coown"]').forEach(function(inp) {
    var v = parseFloat(inp.value);
    if(!isNaN(v)) total += v;
  });
  var el = document.getElementById('s5-own-total');
  var wrap = document.getElementById('s5-own-total-wrap');
  var tip = document.getElementById('s5-own-tip');
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  if(el) {
    el.textContent = total + '%';
    el.style.color = total === 100 ? '#059669' : total > 100 ? '#ef4444' : '#1e293b';
  }
  // Soft tip — not blocking
  if(!tip && wrap) {
    tip = document.createElement('div');
    tip.id = 's5-own-tip';
    tip.style.cssText = 'font-size:.73rem;margin-top:6px;padding:6px 10px;border-radius:7px;display:none';
    wrap.parentNode.insertBefore(tip, wrap.nextSibling);
  }
  if(tip) {
    if(total > 0 && total < 100) {
      tip.style.display = 'block';
      tip.style.background = '#fef9c3';
      tip.style.color = '#92400e';
      tip.textContent = isEs ? '⚠ El total de propiedad es ' + total + '%. Para el Operating Agreement debe sumar 100%.' : '⚠ Total ownership is ' + total + '%. For the Operating Agreement it should add up to 100%.';
    } else if(total > 100) {
      tip.style.display = 'block';
      tip.style.background = '#fee2e2';
      tip.style.color = '#991b1b';
      tip.textContent = isEs ? '⚠ El total excede 100%. Por favor verifica los porcentajes.' : '⚠ Total exceeds 100%. Please review the percentages.';
    } else {
      tip.style.display = 'none';
    }
  }
}

var fmMemberCount = 1;

function fmAddMember() {
  fmMemberCount++;
  var n = fmMemberCount;
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  var isCorpEntity = (window.selectedEntity === 'corp' || (window.fmData && window.fmData.entity === 'corp'));
  var container = document.getElementById('s5-extra-members');
  if(!container) return;

  var titleOpts = '<option value="">-- Select --</option><option value="MGR">MGR (Manager)</option><option value="MGRM">MGRM (Manager &amp; Member)</option><option value="P">P (President)</option><option value="VP">VP (Vice President)</option><option value="ST">ST (Secretary / Treasurer)</option><option value="D">D (Director)</option><option value="RA">RA (Registered Agent)</option>';
  var titleOptsCoNoDir = '<option value="">-- Select --</option><option value="MGR">MGR (Manager)</option><option value="MGRM">MGRM (Manager &amp; Member)</option><option value="P">P (President)</option><option value="VP">VP (Vice President)</option><option value="ST">ST (Secretary / Treasurer)</option><option value="D" disabled title="Directors must be individuals for Corporations">D (Director — individuals only)</option><option value="RA">RA (Registered Agent)</option>';

  var div = document.createElement('div');
  div.className = 'fm-member-block';
  div.id = 's5-member-' + n;
  div.style.cssText = 'margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb';
  div.innerHTML = (
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
      '<div style="font-size:.88rem;font-weight:700;color:var(--navy)">' + (isEs ? 'Miembro / Propietario #' : 'Member / Owner #') + n + '</div>' +
      '<button onclick="fmRemoveMember(' + n + ')" style="background:none;border:none;color:#ef4444;font-size:.78rem;cursor:pointer;font-family:inherit;font-weight:600;display:flex;align-items:center;gap:4px">&#x2715; ' + (isEs ? 'Eliminar' : 'Remove') + '</button>' +
    '</div>' +
    '<div class="fm-group">' +
      '<div class="fm-choices" style="margin-bottom:0">' +
        '<div class="fm-choice selected" id="s5-m' + n + '-ind" onclick="fmSetMemberType(' + n + ',\\'individual\\',this)">' +
          '<div class="fm-choice-radio"></div>' +
          '<div class="fm-choice-content"><strong>&#128100; ' + (isEs ? 'Individuo' : 'Individual') + '</strong></div>' +
        '</div>' +
        '<div class="fm-choice" id="s5-m' + n + '-co" onclick="fmSetMemberType(' + n + ',\\'company\\',this)" style="' + (isCorpEntity ? 'display:none' : '') + '">' +
          '<div class="fm-choice-radio"></div>' +
          '<div class="fm-choice-content"><strong>&#127963; ' + (isEs ? 'Empresa' : 'Company') + '</strong></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div id="s5-m' + n + '-ind-fields">' +
      '<div class="fm-row">' +
        '<div class="fm-group"><label class="fm-label">' + (isEs ? 'Nombre *' : 'First Name *') + '</label><input type="text" class="fm-input" id="s5-m' + n + '-fname" placeholder="' + (isEs ? 'Nombre' : 'First name') + '" oninput="fmTitleCase(this)"/></div>' +
        '<div class="fm-group"><label class="fm-label">' + (isEs ? 'Apellido *' : 'Last Name *') + '</label><input type="text" class="fm-input" id="s5-m' + n + '-lname" placeholder="' + (isEs ? 'Apellido' : 'Last name') + '" oninput="fmTitleCase(this)"/></div>' +
      '</div>' +
      '<div class="fm-row">' +
        '<div class="fm-group"><label class="fm-label">' + (isEs ? 'Título / Rol *' : 'Title / Role *') + '</label><select class="fm-select" id="s5-m' + n + '-role">' + titleOpts + '</select></div>' +
        '<div class="fm-group"><label class="fm-label">' + (isEs ? '% de Propiedad *' : 'Ownership % *') + '</label><input type="number" class="fm-input" id="s5-m' + n + '-own" placeholder="e.g. 50" min="0" max="100" oninput="fmUpdateOwnership()"/></div>' +
      '</div>' +
      '<div class="fm-group"><label class="fm-label">' + (isEs ? 'País *' : 'Country *') + '</label><select class="fm-select" id="s5-m' + n + '-country" onchange="fmMemberAddrChange(\\'s5-m' + n + '\\',this)"><option value="US">United States</option><option value="AR">Argentina</option><option value="BR">Brazil</option><option value="CL">Chile</option><option value="CO">Colombia</option><option value="CR">Costa Rica</option><option value="CU">Cuba</option><option value="DO">Dominican Republic</option><option value="EC">Ecuador</option><option value="ES">Spain</option><option value="GB">United Kingdom</option><option value="GT">Guatemala</option><option value="HN">Honduras</option><option value="MX">Mexico</option><option value="NI">Nicaragua</option><option value="PE">Peru</option><option value="VE">Venezuela</option><option value="other">Other</option></select></div>' +
      '<div id="s5-m' + n + '-addr-dynamic"><div class="fm-group"><label class="fm-label">' + (isEs ? 'Dirección *' : 'Street Address *') + '</label><input type="text" class="fm-input" id="s5-m' + n + '-addr" placeholder="e.g. 123 Main Street"/></div><div class="fm-row-3"><div class="fm-group"><label class="fm-label">' + (isEs ? 'Ciudad *' : 'City *') + '</label><input type="text" class="fm-input" id="s5-m' + n + '-city" placeholder="City"/></div><div class="fm-group"><label class="fm-label">' + (isEs ? 'Estado *' : 'State *') + '</label><input type="text" class="fm-input" id="s5-m' + n + '-state" placeholder="e.g. FL"/></div><div class="fm-group"><label class="fm-label">ZIP *</label><input type="text" class="fm-input" id="s5-m' + n + '-zip" placeholder="00000" maxlength="10"/></div></div></div>' +
    '</div>' +
    '<div id="s5-m' + n + '-co-fields" style="display:none">' +
      '<div class="fm-group"><label class="fm-label">' + (isEs ? 'Nombre de la Empresa *' : 'Company Name *') + '</label><input type="text" class="fm-input" id="s5-m' + n + '-coname" placeholder="' + (isEs ? 'Nombre legal de la empresa' : 'Legal company name') + '"/></div>' +
      '<div class="fm-row">' +
        '<div class="fm-group"><label class="fm-label">EIN / Tax ID</label><input type="text" class="fm-input" id="s5-m' + n + '-coein" placeholder="XX-XXXXXXX"/></div>' +
        '<div class="fm-group"><label class="fm-label">' + (isEs ? 'País de Incorporación *' : 'Country of Incorporation *') + '</label><input type="text" class="fm-input" id="s5-m' + n + '-coorg" placeholder="e.g. United States"/></div>' +
      '</div>' +
      '<div class="fm-row">' +
        '<div class="fm-group"><label class="fm-label">' + (isEs ? 'Título / Rol *' : 'Title / Role *') + '</label><select class="fm-select" id="s5-m' + n + '-corole">' + (isCorpEntity ? titleOptsCoNoDir : titleOpts) + '</select></div>' +
        '<div class="fm-group"><label class="fm-label">' + (isEs ? '% de Propiedad *' : 'Ownership % *') + '</label><input type="number" class="fm-input" id="s5-m' + n + '-coown" placeholder="e.g. 50" min="0" max="100" oninput="fmUpdateOwnership()"/></div>' +
      '</div>' +
      '<div class="fm-group"><label class="fm-label">' + (isEs ? 'Dirección del Negocio *' : 'Business Address *') + '</label><input type="text" class="fm-input" id="s5-m' + n + '-coaddr" placeholder="' + (isEs ? 'Dirección principal de la empresa' : 'Principal address of the company') + '"/></div>' +
    '</div>'
  );
  container.appendChild(div);
}

function fmRemoveMember(n) {
  var el = document.getElementById('s5-member-' + n);
  if(el) el.remove();
  fmUpdateOwnership();
}

function fmBuildUpgradeCards() {
  var container = document.getElementById('upgrade-cards-container');
  if(!container) return;
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  var pkg = fmData.package;
  var titleEl = document.getElementById('s4-title');
  var subEl   = document.getElementById('s4-sub');
  var skipEl  = document.getElementById('s4-skip-lbl');

  if(pkg === 'basic') {
    if(titleEl) titleEl.innerHTML = isEs ? '?? Estás Casi Listo — Desbloquea Más' : '?? You’re Almost There — Unlock More';
    if(subEl)   subEl.textContent = isEs
      ? 'La mayoría de clientes mejoran antes de tramitar — ahorra tiempo y la molestia de ordenar servicios por separado después.'
      : 'Most clients upgrade before filing — it saves time and the hassle of ordering services separately later.';
  } else if(pkg === 'standard') {
    if(titleEl) titleEl.innerHTML = isEs ? '⭐ Un Paso Más y Tendrás Todo' : '⭐ One Step Away from Everything';
    if(subEl)   subEl.textContent = isEs
      ? 'El paquete Premium te da todo lo que necesitas para arrancar desde el primer día, sin nada pendiente.'
      : 'The Premium package gives you everything you need to launch from day one, with nothing left pending.';
  }
  if(skipEl) skipEl.textContent = isEs ? 'No gracias, me quedo con mi paquete actual →' : 'No thanks, keep my current package →';

  // Full feature lists per package
  var allFeatures = {
    standard: isEs ? [
      'Formación de LLC o Corporación en Florida',
      'Certificado de Formación de Florida',
      'Búsqueda de Disponibilidad de Nombre',
      'Agente Registrado (Primer Año Gratis)',
      'EIN / Número de Identificación Fiscal',
      'Guía de Cuenta Bancaria'
    ] : [
      'LLC or Corporation Formation in Florida',
      'FL Certificate of Formation',
      'Name Availability Search',
      'Registered Agent (First Year Free)',
      'EIN / Federal Tax ID Number',
      'Bank Account Guide'
    ],
    premium: isEs ? [
      'Formación de LLC o Corporación en Florida',
      'Certificado de Formación de Florida',
      'Búsqueda de Disponibilidad de Nombre',
      'Agente Registrado (Primer Año Gratis)',
      'EIN / Número de Identificación Fiscal',
      'Guía de Cuenta Bancaria',
      'Acuerdo Operativo',
      'Tramitación Acelerada GRATIS (1-3 días)',
      'Solicitud de ITIN',
      'DBA / Nombre Ficticio',
      'Artículos de Enmienda'
    ] : [
      'LLC or Corporation Formation in Florida',
      'FL Certificate of Formation',
      'Name Availability Search',
      'Registered Agent (First Year Free)',
      'EIN / Federal Tax ID Number',
      'Bank Account Guide',
      'Operating Agreement',
      'Expedited Filing FREE (1-3 days)',
      'ITIN Application',
      'DBA / Fictitious Name',
      'Articles of Amendment'
    ]
  };

  function makeCard(name, price, features, btnText, pkg_key, isBest) {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'border:1.5px solid ' + (isBest ? 'var(--blue,#2563eb)' : '#e2e8f0') + ';border-radius:14px;overflow:hidden;background:#fff;position:relative;display:flex;flex-direction:column;' + (isBest ? 'box-shadow:0 4px 24px rgba(37,99,235,0.10)' : 'box-shadow:0 2px 12px rgba(28,46,68,0.06)');

    // Badge
    if(isBest) {
      var badge = document.createElement('div');
      badge.style.cssText = 'position:absolute;top:0;right:0;background:#2563eb;color:#fff;font-size:.65rem;font-weight:700;padding:5px 14px;border-radius:0 14px 0 10px;letter-spacing:.5px;text-transform:uppercase';
      badge.textContent = isEs ? 'MEJOR VALOR' : 'BEST VALUE';
      wrap.appendChild(badge);
    }

    // Header
    var head = document.createElement('div');
    head.style.cssText = 'padding:20px 22px 14px';

    var nameEl = document.createElement('div');
    nameEl.style.cssText = 'font-family:Fraunces,serif;font-size:1rem;font-weight:700;color:#1e293b;margin-bottom:6px';
    nameEl.textContent = name;

    var priceEl = document.createElement('div');
    priceEl.style.cssText = 'display:flex;align-items:baseline;gap:3px;margin-bottom:4px';
    priceEl.innerHTML = '<span style="font-family:Fraunces,serif;font-size:2rem;font-weight:900;color:#2563eb;line-height:1">' + price + '</span><span style="font-size:.75rem;color:#94a3b8;margin-left:4px">+ FL state fee</span>';

    var stateNote = document.createElement('div');
    stateNote.style.cssText = 'font-size:.72rem;color:#94a3b8;margin-bottom:0';
    stateNote.textContent = isEs ? 'Pago único — sin renovaciones sorpresa' : 'One-time fee — no surprise renewals';

    head.appendChild(nameEl);
    head.appendChild(priceEl);
    head.appendChild(stateNote);

    // Divider
    var divider = document.createElement('hr');
    divider.style.cssText = 'border:none;border-top:1px solid #f1f5f9;margin:0';

    // Feature list
    var body = document.createElement('div');
    body.style.cssText = 'padding:16px 22px 18px;flex:1;display:flex;flex-direction:column';

    var list = document.createElement('div');
    list.style.cssText = 'margin-bottom:18px;flex:1';
    features.forEach(function(f) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:flex-start;gap:9px;margin-bottom:8px;font-size:.81rem;color:#374151;line-height:1.4';
      row.innerHTML = '<span style="color:#059669;font-size:.85rem;flex-shrink:0;margin-top:1px">✓</span><span>' + f + '</span>';
      list.appendChild(row);
    });

    // Button
    var btn = document.createElement('button');
    btn.style.cssText = 'width:100%;padding:11px;border-radius:9px;font-size:.88rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s;background:#fff;color:#1e293b;border:1.5px solid #cbd5e1';
    btn.textContent = btnText;
    btn.onmouseover = function() {
      this.style.borderColor = '#2563eb';
      this.style.color = '#2563eb';
      this.style.background = '#f8faff';
    };
    btn.onmouseout = function() {
      this.style.borderColor = '#cbd5e1';
      this.style.color = '#1e293b';
      this.style.background = '#fff';
    };
    btn.onclick = function() { fmUpgradePkg(pkg_key, this); fmNext(); };

    body.appendChild(list);
    body.appendChild(btn);
    wrap.appendChild(head);
    wrap.appendChild(divider);
    wrap.appendChild(body);
    return wrap;
  }

  container.innerHTML = '';

  if(pkg === 'basic') {
    container.style.gridTemplateColumns = 'repeat(2,1fr)';
    container.style.gap = '20px';
    container.style.alignItems = 'stretch';
    container.style.maxWidth = '';
    container.style.margin = '0 0 20px';
    container.appendChild(makeCard('Standard', '$149', allFeatures.standard,
      isEs ? 'Mejorar a Standard →' : 'Upgrade to Standard →', 'standard', false));
    container.appendChild(makeCard('Premium',  '$249', allFeatures.premium,
      isEs ? 'Mejorar a Premium →' : 'Upgrade to Premium →', 'premium', true));
  } else if(pkg === 'standard') {
    container.style.gridTemplateColumns = '1fr';
    container.style.maxWidth = '420px';
    container.style.margin = '0 auto 20px';
    container.appendChild(makeCard('Premium', '$249', allFeatures.premium,
      isEs ? 'Mejorar a Premium →' : 'Upgrade to Premium →', 'premium', true));
  }
}

function fmFilterAddons() {
  var pkg = fmData.package;
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  var included = { basic:[], standard:['ein'], premium:['ein','oa','itin'] };
  var pkgIncludes = included[pkg] || [];
  ['ein','oa','itin','ar'].forEach(function(key) {
    var el = document.getElementById('addon-' + key);
    if(!el) return;
    if(pkgIncludes.indexOf(key) !== -1) {
      el.style.display = 'none';
      fmData.addons[key] = false;
    } else {
      el.style.display = 'flex';
    }
  });
  var titleEl = document.getElementById('s7-title');
  var subEl = document.getElementById('s7-sub');
  if(pkg === 'premium') {
    if(titleEl) titleEl.textContent = isEs ? 'Protege Tu Negocio' : 'Protect Your Business';
    if(subEl) subEl.textContent = isEs ? 'Tu paquete Premium ya incluye EIN, Acuerdo Operativo e ITIN. Solo queda la Declaración Anual.' : 'Your Premium package already includes EIN, Operating Agreement and ITIN. Only the Annual Report remains.';
  } else if(pkg === 'standard') {
    if(titleEl) titleEl.textContent = isEs ? 'Mejora Tu Formación' : 'Boost Your Formation';
    if(subEl) subEl.textContent = isEs ? 'Tu paquete Standard ya incluye EIN. Agrega lo que necesites.' : 'Your Standard package already includes EIN. Add what makes sense now or order anytime.';
  } else {
    if(titleEl) titleEl.textContent = isEs ? 'Mejora Tu Formación' : 'Boost Your Formation';
    if(subEl) subEl.textContent = isEs ? 'Todo opcional. Agrega lo que necesites ahora o en cualquier momento.' : 'All optional. Add what makes sense now or order anytime.';
  }
}

function fmUpgradePkg(pkg, el) {
  fmData.package = pkg;
  ['basic','standard','premium'].forEach(function(p){
    var c = document.getElementById('up-pkg-' + p);
    if(c) c.classList.toggle('selected', p === pkg);
  });
  fmUpdateSummary();
}

// Email match live feedback
function fmCheckEmailMatch() {
  var e1 = document.getElementById('inp-email');
  var e2 = document.getElementById('inp-email-confirm');
  var msg = document.getElementById('email-match-msg');
  if(!e1||!e2||!msg) return;
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  var v1 = e1.value;
  var v2 = e2.value;
  // Nothing typed yet — hide everything
  if(!v2) {
    msg.style.display='none';
    e2.style.borderColor='';
    return;
  }
  // Check character by character up to what the user has typed so far
  var mismatch = false;
  for(var i=0; i<v2.length; i++) {
    if(v2[i] !== v1[i]) { mismatch = true; break; }
  }
  if(mismatch) {
    // A character doesn't match its position in e1 — show error immediately
    msg.style.display='block';
    msg.style.color='#ef4444';
    msg.textContent = isEs ? 'Los correos no coinciden.' : 'Emails do not match.';
    e2.style.borderColor='#ef4444';
  } else if(v2.length === v1.length && v1.length > 0) {
    // Fully typed and matches — show success
    msg.style.display='block';
    msg.style.color='#059669';
    msg.textContent = isEs ? '✓ Los correos coinciden.' : '✓ Emails match.';
    e2.style.borderColor='#059669';
  } else {
    // Still typing but no mismatch yet — stay neutral
    msg.style.display='none';
    e2.style.borderColor='';
  }
}

// Auto-capitalize: Title Case preserving particles like de, la, van, etc.
var _tcParticles = {'de':1,'la':1,'las':1,'los':1,'del':1,'el':1,'van':1,'von':1,'der':1,'y':1,'e':1,'of':1,'the':1,'and':1};
function fmTitleCase(input){
  var pos=input.selectionStart;
  var val=input.value;
  var result=val.replace(/\\b\\w+/g,function(word,offset){
    if(offset===0) return word.charAt(0).toUpperCase()+word.slice(1);
    var low=word.toLowerCase();
    return _tcParticles[low]?low:word.charAt(0).toUpperCase()+word.slice(1).toLowerCase();
  });
  if(result!==val){input.value=result;try{input.setSelectionRange(pos,pos);}catch(e){}}
}
function fmFormatPhone(input) {
  // Remove non-digits
  var digits = input.value.replace(/[^0-9]/g, '');
  // US: max 10 digits
  var countryEl = document.getElementById('inp-phone-country');
  var country = countryEl ? countryEl.value : '+1';
  if(country === '+1') {
    digits = digits.substring(0, 10);
    if(digits.length > 6) input.value = '(' + digits.substring(0,3) + ') ' + digits.substring(3,6) + '-' + digits.substring(6);
    else if(digits.length > 3) input.value = '(' + digits.substring(0,3) + ') ' + digits.substring(3);
    else input.value = digits;
  } else {
    input.value = digits.substring(0, 15);
  }
}
function fmUpdatePhonePrefix(sel) {}
/* ── DYNAMIC ADDRESS SYSTEM BY COUNTRY ── */
var _addrFmt = {
  US:    {state:'select', stateLabel:{en:'State *',es:'Estado *'},           zip:true,  zipLabel:{en:'ZIP Code *',es:'Código Postal *'},      street2:true},
  MX:    {state:'text',   stateLabel:{en:'State *',es:'Estado *'},           zip:true,  zipLabel:{en:'C.P. *',es:'C.P. *'},                   street2:false},
  CO:    {state:'text',   stateLabel:{en:'Department *',es:'Departamento *'},zip:false, zipLabel:null,                                        street2:false},
  VE:    {state:'text',   stateLabel:{en:'State *',es:'Estado *'},           zip:false, zipLabel:null,                                        street2:false},
  AR:    {state:'text',   stateLabel:{en:'Province *',es:'Provincia *'},     zip:true,  zipLabel:{en:'C.P. *',es:'C.P. *'},                   street2:false},
  BR:    {state:'text',   stateLabel:{en:'State *',es:'Estado *'},           zip:true,  zipLabel:{en:'CEP *',es:'CEP *'},                     street2:true},
  CU:    {state:'text',   stateLabel:{en:'Province *',es:'Provincia *'},     zip:false, zipLabel:null,                                        street2:false},
  DO:    {state:'text',   stateLabel:{en:'Province *',es:'Provincia *'},     zip:false, zipLabel:null,                                        street2:false},
  ES:    {state:'text',   stateLabel:{en:'Province *',es:'Provincia *'},     zip:true,  zipLabel:{en:'C.P. *',es:'C.P. *'},                   street2:false},
  EC:    {state:'text',   stateLabel:{en:'Province *',es:'Provincia *'},     zip:false, zipLabel:null,                                        street2:false},
  GT:    {state:'text',   stateLabel:{en:'Department *',es:'Departamento *'},zip:false, zipLabel:null,                                        street2:false},
  HN:    {state:'text',   stateLabel:{en:'Department *',es:'Departamento *'},zip:false, zipLabel:null,                                        street2:false},
  NI:    {state:'text',   stateLabel:{en:'Department *',es:'Departamento *'},zip:false, zipLabel:null,                                        street2:false},
  CR:    {state:'text',   stateLabel:{en:'Province *',es:'Provincia *'},     zip:true,  zipLabel:{en:'Postal Code *',es:'Código Postal *'},   street2:false},
  PE:    {state:'text',   stateLabel:{en:'Department *',es:'Departamento *'},zip:false, zipLabel:null,                                        street2:false},
  CL:    {state:'text',   stateLabel:{en:'Region *',es:'Región *'},          zip:true,  zipLabel:{en:'C.P. *',es:'C.P. *'},                   street2:false},
  GB:    {state:'text',   stateLabel:{en:'County',es:'Condado'},             zip:true,  zipLabel:{en:'Postcode *',es:'Postcode *'},            street2:true},
  other: {state:'text',   stateLabel:{en:'State / Region',es:'Estado / Región'}, zip:false, zipLabel:null,                                   street2:false}
};
var _usStates='<option value="">Select State</option><option value="FL">Florida</option><option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option>';

function fmRenderAddrFields(prefix, countryCode, container, isEs) {
  var fmt = _addrFmt[countryCode] || _addrFmt['other'];
  var sl  = fmt.stateLabel[isEs ? 'es' : 'en'];
  var zl  = fmt.zip ? (fmt.zipLabel ? fmt.zipLabel[isEs ? 'es' : 'en'] : (isEs ? 'Código Postal *' : 'ZIP / Postal Code *')) : '';
  var html = '';
  html += '<div class="fm-group"><label class="fm-label">' + (isEs?'Dirección *':'Street Address *') + '</label><input type="text" class="fm-input" id="' + prefix + '-addr" placeholder="' + (isEs?'Calle y número':'Street address') + '"/></div>';
  if(fmt.street2) {
    html += '<div class="fm-group"><label class="fm-label">' + (isEs?'Apto / Suite':'Apt / Suite') + ' <span style="font-size:.72rem;color:#9ca3af">' + (isEs?'Opcional':'Optional') + '</span></label><input type="text" class="fm-input" id="' + prefix + '-addr2" placeholder="Apt, Suite, Unit"/></div>';
  }
  var cols = [];
  cols.push('<div class="fm-group"><label class="fm-label">' + (isEs?'Ciudad *':'City *') + '</label><input type="text" class="fm-input" id="' + prefix + '-city" placeholder="' + (isEs?'Ciudad':'City') + '"/></div>');
  if(fmt.state !== false) {
    if(fmt.state === 'select') {
      cols.push('<div class="fm-group"><label class="fm-label">' + sl + '</label><select class="fm-select" id="' + prefix + '-state">' + _usStates + '</select></div>');
    } else {
      cols.push('<div class="fm-group"><label class="fm-label">' + sl + '</label><input type="text" class="fm-input" id="' + prefix + '-state" placeholder="' + sl.replace(' *','') + '"/></div>');
    }
  }
  if(fmt.zip) {
    cols.push('<div class="fm-group"><label class="fm-label">' + zl + '</label><input type="text" class="fm-input" id="' + prefix + '-zip" placeholder="00000" maxlength="10"/></div>');
  }
  var gridClass = cols.length === 3 ? 'fm-row-3' : 'fm-row';
  html += '<div class="' + gridClass + '">' + cols.join('') + '</div>';
  if(container) container.innerHTML = html;
}

function fmBizCountryChange(sel) {
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  var container = document.getElementById('biz-addr-fields-dynamic');
  if(container) fmRenderAddrFields('inp', sel.value, container, isEs);
}

function fmMemberAddrChange(prefix, sel) {
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  var container = document.getElementById(prefix + '-addr-dynamic');
  if(container) fmRenderAddrFields(prefix, sel.value, container, isEs);
}
function fmToggleMailAddr(chk) {
  var f = document.getElementById('mail-addr-fields');
  if(f) f.style.display = chk.checked ? 'none' : 'block';
}
function fmSetBizAddr(type, el) {
  fmData.bizAddrType = type;
  document.querySelectorAll('#biz-addr-virtual,#biz-addr-own').forEach(function(c){ c.classList.remove('selected'); });
  if(el) el.classList.add('selected');
  var note = document.getElementById('biz-virtual-note');
  var form = document.getElementById('biz-own-form');
  if(note) note.style.display = type === 'virtual' ? 'flex' : 'none';
  if(form) form.style.display = type === 'own' ? 'block' : 'none';
  fmUpdateSummary();
}
function fmSetAgentChoice(type, el) {
  fmData.agentType = type;
  document.querySelectorAll('#agent-use-ours,#agent-use-own').forEach(function(c){ c.classList.remove('selected'); });
  if(el) el.classList.add('selected');
  var on = document.getElementById('agent-ours-note');
  var of2 = document.getElementById('agent-own-form');
  if(on) on.style.display = type === 'ours' ? 'block' : 'none';
  if(of2) of2.style.display = type === 'own' ? 'block' : 'none';
}
function openContinueModal() {
  var modal = document.getElementById('continueModal');
  if(modal) { modal.style.display='flex'; document.body.style.overflow='hidden'; }
  var inp = document.getElementById('inp-continue-order');
  if(inp) { inp.value=''; inp.focus(); }
  var err = document.getElementById('cont-error');
  if(err) err.style.display='none';
}
function closeContinueModal() {
  var modal = document.getElementById('continueModal');
  if(modal) { modal.style.display='none'; document.body.style.overflow=''; }
}
function findOrder() {
  var inp = document.getElementById('inp-continue-order');
  var err = document.getElementById('cont-error');
  if(!inp) return;
  var val = inp.value.trim().toUpperCase();
  if(!val || !val.startsWith('FBFC-') || val.length < 9) {
    if(err) { err.textContent = 'Please enter a valid order number (e.g. FBFC-12345).'; err.style.display='block'; }
    return;
  }
  err.style.display='none';
  var btn = document.getElementById('cont-submit-btn');
  if(btn) btn.innerHTML='&#x23F3; Searching...';
  setTimeout(function(){
    closeContinueModal(); openForm();
    if(btn) btn.innerHTML='&#x1F50D; Find My Application';
  }, 1200);
}

function fmGetTitlesForEntity() {
  var entity = fmData.entity || 'llc';
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  if(entity === 'corp') {
    return [
      {val:'P',    en:'P    (President)',           es:'P    (Presidente)'},
      {val:'VP',   en:'VP   (Vice President)',       es:'VP   (Vicepresidente)'},
      {val:'ST',   en:'ST   (Secretary/Treasurer)',  es:'ST   (Secretario/Tesorero)'},
      {val:'D',    en:'D    (Director)',              es:'D    (Director)'},
      {val:'RA',   en:'RA   (Registered Agent)',     es:'RA   (Agente Registrado)'},
    ];
  }
  return [
    {val:'MGR',  en:'MGR  (Manager)',               es:'MGR  (Gerente)'},
    {val:'MGRM', en:'MGRM (Manager & Member)',      es:'MGRM (Gerente y Miembro)'},
    {val:'RA',   en:'RA   (Registered Agent)',      es:'RA   (Agente Registrado)'},
  ];
}

function fmRenderMemberCard(n, isEs) {
  var titles = fmGetTitlesForEntity();
  var titleOpts = '<option value="">' + (isEs ? '-- Seleccionar --' : '-- Select --') + '</option>' +
    titles.map(function(t){ return '<option value="' + t.val + '">' + (isEs ? t.es : t.en) + '</option>'; }).join('');

  var removeBtn = n > 1
    ? '<button onclick="fmRemoveMember(' + n + ')" style="background:none;border:none;color:#ef4444;font-size:.75rem;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:underline;padding:0">' + (isEs ? 'Eliminar' : 'Remove') + '</button>'
    : '';

  var memberLabel = (isEs ? 'Miembro / Propietario' : 'Member / Owner') + ' ' + n;
  var indLabel    = isEs ? 'Individuo' : 'Individual';
  var coLabel     = isEs ? 'Empresa'   : 'Company';
  var fnLabel     = isEs ? 'Nombre *'  : 'First Name *';
  var lnLabel     = isEs ? 'Apellido *': 'Last Name *';
  var coNameLabel = isEs ? 'Nombre de la Empresa *' : 'Company Name *';
  var coEinLabel  = isEs ? 'EIN / Tax ID de la Empresa' : 'Company EIN / Tax ID';
  var coStLabel   = isEs ? 'Pa\\u00eds de Incorporaci\\u00f3n' : 'Country of Incorporation';
  var titleLabel  = isEs ? 'T\\u00edtulo / Cargo *' : 'Title / Role *';
  var ownLabel    = isEs ? '% de Propiedad *' : 'Ownership % *';
  var addrLabel   = isEs ? 'Direcci\\u00f3n *' : 'Address *';
  var fnPH        = isEs ? 'Nombre' : 'First name';
  var lnPH        = isEs ? 'Apellido' : 'Last name';
  var addrPH      = isEs ? 'Direcci\\u00f3n completa' : 'Full address';

  return '<div class="fm-member-block" id="fm-member-' + n + '" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:14px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
      '<div style="font-size:.88rem;font-weight:700;color:#1e293b">' + memberLabel + '</div>' +
      removeBtn +
    '</div>' +
    '<div class="fm-group" style="margin-bottom:12px">' +
      '<label class="fm-label">' + (isEs ? 'Tipo *' : 'Type *') + '</label>' +
      '<div style="display:flex;gap:10px">' +
        '<div class="fm-choice selected" id="m' + n + '-type-ind" style="flex:1;padding:10px 14px;cursor:pointer" onclick="fmSetMemberType(' + n + ',this,false)">' +
          '<div class="fm-choice-radio"></div>' +
          '<div class="fm-choice-content"><strong>' + indLabel + '</strong></div>' +
        '</div>' +
        '<div class="fm-choice" id="m' + n + '-type-co" style="flex:1;padding:10px 14px;cursor:pointer" onclick="fmSetMemberType(' + n + ',this,true)">' +
          '<div class="fm-choice-radio"></div>' +
          '<div class="fm-choice-content"><strong>' + coLabel + '</strong></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div id="m' + n + '-ind-fields">' +
      '<div class="fm-row">' +
        '<div class="fm-group"><label class="fm-label">' + fnLabel + '</label><input type="text" class="fm-input" id="m' + n + '-fname" placeholder="' + fnPH + '"/></div>' +
        '<div class="fm-group"><label class="fm-label">' + lnLabel + '</label><input type="text" class="fm-input" id="m' + n + '-lname" placeholder="' + lnPH + '"/></div>' +
      '</div>' +
    '</div>' +
    '<div id="m' + n + '-co-fields" style="display:none">' +
      '<div class="fm-group"><label class="fm-label">' + coNameLabel + '</label><input type="text" class="fm-input" id="m' + n + '-coname" placeholder="Legal company name"/></div>' +
      '<div class="fm-row">' +
        '<div class="fm-group"><label class="fm-label">' + coEinLabel + '</label><input type="text" class="fm-input" id="m' + n + '-coein" placeholder="XX-XXXXXXX"/></div>' +
        '<div class="fm-group"><label class="fm-label">' + coStLabel + '</label><input type="text" class="fm-input" id="m' + n + '-costate" placeholder="e.g. Florida, USA"/></div>' +
      '</div>' +
    '</div>' +
    '<div class="fm-row" style="margin-top:4px">' +
      '<div class="fm-group"><label class="fm-label">' + titleLabel + '</label>' +
        '<select class="fm-select" id="m' + n + '-title">' + titleOpts + '</select>' +
      '</div>' +
      '<div class="fm-group"><label class="fm-label">' + ownLabel + '</label>' +
        '<input type="number" class="fm-input" id="m' + n + '-own" placeholder="e.g. 100" min="1" max="100" oninput="fmUpdateOwnershipBar()"/>' +
      '</div>' +
    '</div>' +
    '<div class="fm-group" style="margin-top:4px">' +
      '<label class="fm-label">' + addrLabel + '</label>' +
      '<input type="text" class="fm-input" id="m' + n + '-addr" placeholder="' + addrPH + '"/>' +
    '</div>' +
    '<div id="own-bar-wrap-' + n + '" style="margin-top:8px;display:none">' +
      '<div style="font-size:.72rem;color:#6b7280;margin-bottom:4px" id="own-bar-lbl-' + n + '">0%</div>' +
      '<div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden"><div id="own-bar-' + n + '" style="height:100%;background:#2563eb;border-radius:3px;transition:width .3s;width:0%"></div></div>' +
    '</div>' +
  '</div>';
}



function fmUpdateOwnershipBar() {
  var total = 0;
  for(var i = 1; i <= fmMemberCount; i++) {
    var inp = document.getElementById('m' + i + '-own');
    if(inp && inp.value) total += parseFloat(inp.value) || 0;
  }
  for(var j = 1; j <= fmMemberCount; j++) {
    var inp2 = document.getElementById('m' + j + '-own');
    var bar = document.getElementById('own-bar-' + j);
    var lbl = document.getElementById('own-bar-lbl-' + j);
    var wrap = document.getElementById('own-bar-wrap-' + j);
    if(inp2 && inp2.value) {
      var pct = parseFloat(inp2.value) || 0;
      if(wrap) wrap.style.display = 'block';
      if(bar) bar.style.width = Math.min(pct, 100) + '%';
      if(bar) bar.style.background = total > 100 ? '#ef4444' : (total === 100 ? '#059669' : '#2563eb');
      if(lbl) lbl.textContent = pct + '% | Total: ' + total + '%' + (total === 100 ? ' ✓' : '');
    }
  }
}

function fmInitMembers() {
  fmMemberCount = 0;
  var container = document.getElementById('members-container');
  if(container) container.innerHTML = '';
  fmAddMember();
}



function fmRemoveMember(n) {
  var el = document.getElementById('s5-member-' + n) || document.getElementById('fm-member-' + n);
  if(el) el.remove();
  fmUpdateOwnershipBar();
}

function fmSkipUpgrade() {
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  var skipBtn = document.getElementById('s4-skip-lbl');
  if(skipBtn) {
    skipBtn.style.color = '#059669';
    skipBtn.textContent = isEs ? '✓ De acuerdo, continuando con tu paquete actual' : '✓ Got it, continuing with your current package';
    skipBtn.onclick = null;
  }
}
function fmUpdateExpUpsell() {
  var pkg = fmData.package;
  var el = document.getElementById('expedited-upsell');
  if(el) el.style.display = pkg === 'premium' ? 'none' : 'block';
  fmUpdateSummary();
}
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('flbc_lang', lang);
  var isEs = lang === 'es';
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
  document.getElementById('btn-es').classList.toggle('active', lang === 'es');

  // Translate all data-en/data-es elements (footer, nav, pricing cards, etc.)
  document.querySelectorAll('[data-en][data-es]').forEach(function(el){
    el.innerHTML = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });

  // Translate open form if active
  if(document.getElementById('formOverlay') && document.getElementById('formOverlay').classList.contains('active')){
    if(typeof fmTranslate !== 'undefined') fmTranslate(lang);
    if(typeof translateFormContent !== 'undefined') translateFormContent(lang);
  }

  // Page sections using translations object
  var t = translations[lang];
  if(!t) return;
  var el;
  el=document.getElementById('topbar-text');        if(el) el.innerHTML   = t.topbar;
  el=document.getElementById('hero-badge');         if(el) el.textContent = t.heroBadge;
  el=document.getElementById('hero-title');         if(el) el.innerHTML   = t.heroTitle;
  el=document.getElementById('hero-sub');           if(el) el.textContent = t.heroSub;
  el=document.getElementById('hero-btn');           if(el) el.textContent = t.heroBtn1;
  el=document.getElementById('et-label');           if(el) el.textContent = t.etLabel;
  el=document.getElementById('stat1');              if(el) el.textContent = t.stat1;
  el=document.getElementById('stat2');              if(el) el.textContent = t.stat2;
  el=document.getElementById('stat4');              if(el) el.textContent = t.stat4;
  el=document.getElementById('how-label');          if(el) el.textContent = t.howLabel;
  el=document.getElementById('how-title');          if(el) el.innerHTML   = t.howTitle;
  el=document.getElementById('how-sub');            if(el) el.textContent = t.howSub;
  el=document.getElementById('s1h');                if(el) el.textContent = t.s1h;
  el=document.getElementById('s1p');                if(el) el.textContent = t.s1p;
  el=document.getElementById('s2h');                if(el) el.textContent = t.s2h;
  el=document.getElementById('s2p');                if(el) el.textContent = t.s2p;
  el=document.getElementById('s3h');                if(el) el.textContent = t.s3h;
  el=document.getElementById('s3p');                if(el) el.textContent = t.s3p;
  el=document.getElementById('s4h');                if(el) el.textContent = t.s4h;
  el=document.getElementById('s4p');                if(el) el.textContent = t.s4p;
  el=document.getElementById('lbl-new-app');       if(el) el.textContent = isEs ? 'Nueva Aplicación' : 'Start New Application';
  el=document.getElementById('lbl-continue-app');  if(el) el.textContent = isEs ? 'Continuar Mi Aplicación' : 'Continue My Application';
  var bsBtn=document.querySelector('.btn-start');   if(bsBtn) bsBtn.innerHTML=isEs?'Iniciar Mi Negocio &rarr;':'Start My Business &rarr;';
  // How it works steps
  var hSteps=[{id:'s1h',en:'Choose Your Package',es:'Elige Tu Paquete'},{id:'s1p',en:'Select the formation package that fits your needs.',es:'Selecciona el paquete de formación que se adapte a tus necesidades.'},{id:'s2h',en:'Complete Your Order',es:'Completa Tu Orden'},{id:'s2p',en:'Fill out our guided form in minutes.',es:'Completa nuestro formulario guiado en minutos.'},{id:'s3h',en:'We File With the State',es:'Tramitamos Ante el Estado'},{id:'s3p',en:'Our experts submit everything to the Florida Division of Corporations.',es:'Nuestros expertos presentan todo ante la División de Corporaciones de Florida.'},{id:'s4h',en:'Your Business Is Official',es:'Tu Negocio Es Oficial'},{id:'s4p',en:'Receive your Certificate of Formation and everything to open your bank account.',es:'Recibe tu Certificado de Formación y todo lo necesario para abrir tu cuenta bancaria.'}];
  hSteps.forEach(function(s){var e2=document.getElementById(s.id);if(e2)e2.textContent=isEs?s.es:s.en;});
  // FAQ
  document.querySelectorAll('.faq-item').forEach(function(item){var q=item.querySelector('.faq-q span');var a=item.querySelector('.faq-a');if(q&&q.getAttribute('data-es'))q.textContent=isEs?q.getAttribute('data-es'):q.getAttribute('data-en');if(a&&a.getAttribute('data-es'))a.innerHTML=isEs?a.getAttribute('data-es'):a.getAttribute('data-en');});
  // Footer headers
  document.querySelectorAll('.footer-col h5[data-en]').forEach(function(h){h.textContent=isEs?h.getAttribute('data-es'):h.getAttribute('data-en');});
  el=document.getElementById('price-label');
        if(el) el.textContent = t.priceLabel;
  el=document.getElementById('price-title');        if(el) el.textContent = t.priceTitle;
  el=document.getElementById('testi-label');        if(el) el.textContent = t.testiLabel;
  el=document.getElementById('testi-title');        if(el) el.innerHTML   = t.testiTitle;
  el=document.getElementById('testi-sub');          if(el) el.textContent = t.testiSub;
  el=document.getElementById('faq-label');          if(el) el.textContent = t.faqLabel;
  el=document.getElementById('faq-title');          if(el) el.innerHTML   = t.faqTitle;
  el=document.getElementById('help-title');         if(el) el.textContent = t.helpTitle;
  el=document.getElementById('help-sub');           if(el) el.textContent = t.helpSub;
  var bs = document.querySelector('.btn-start');    if(bs) bs.textContent = t.startBtn;

  // Entity type + state fee
  el=document.getElementById('et-label');           if(el) el.textContent = isEs ? 'Estoy formando una:' : 'I am forming a:';
  el=document.getElementById('et-llc');             if(el) el.innerHTML = isEs ? '&#127963; LLC' : '&#127963; LLC';
  el=document.getElementById('et-corp');            if(el) el.innerHTML = isEs ? '&#128202; Corporación' : '&#128202; Corporation';
  el=document.getElementById('state-fee-note');     if(el) el.textContent = isEs
    ? '* Cargo estatal de Florida: $125 (LLC) o $70 (Corporación) — pagado directamente al Estado, no incluido en el precio del paquete.'
    : '* Florida state filing fee: $125 (LLC) or $70 (Corporation) — paid directly to the State, not included in package price.';

  // Pricing hint
  var ph = document.querySelector('[style*="background:var(--blue-light)"] strong');
  if(ph) ph.textContent = isEs ? '¿No sabes cuál elegir?' : 'Not sure which to choose?';
  var phP = document.querySelector('[style*="background:var(--blue-light)"]');
  if(phP && phP.id !== 'formOverlay') {
    var phStrong = phP.querySelector('strong');
    if(phStrong) {
      phStrong.nextSibling && (phStrong.nextSibling.textContent = isEs
        ? ' La mayoría de nuestros clientes elige Standard — incluye EIN y Guía Bancaria, que los bancos normalmente requieren.'
        : ' Most clients go with Standard — it covers EIN and Bank Account Guide, which banks typically require to open your business account.');
    }
  }

  // FAQ questions and answers
  var faqData = [
    ['¿Cuál es la diferencia entre una LLC y una Corporación?',
     'Una LLC ofrece gestión flexible e impuestos pass-through — ideal para pequeños negocios. Una Corporación es una estructura más formal, adecuada para negocios que buscan inversionistas o emitir acciones. Ambas protegen tus bienes personales de las deudas del negocio.',
     'What is the difference between an LLC and a Corporation?',
     'An LLC offers flexible management and pass-through taxation — ideal for small businesses. A Corporation is a more formal structure suited for businesses seeking investors or planning to issue stock. Both protect your personal assets from business liabilities.'],
    ['¿Cuánto tiempo tarda la formación de mi negocio en Florida?',
     'El procesamiento estándar con la División de Corporaciones de Florida toma 7–10 días hábiles. Con nuestro servicio Acelerado (incluido gratis en Premium, o disponible como add-on), el proceso puede reducirse a 1–3 días hábiles.',
     'How long does it take to form my business in Florida?',
     'Standard processing typically takes 7–10 business days. With our Expedited Filing service (included free in Premium, or available as an add-on), processing can be reduced to 1–3 business days.'],
    ['¿Qué es un Agente Registrado y realmente lo necesito?',
     'Sí — toda LLC y Corporación en Florida está legalmente obligada a tener un Agente Registrado con dirección física en el estado. El Agente Registrado recibe documentos legales oficiales y avisos fiscales en nombre de tu negocio.',
     'What is a Registered Agent and do I really need one?',
     'Yes — every LLC and Corporation in Florida is legally required to have a Registered Agent with a physical street address in the state. The Registered Agent receives official legal documents and tax notices on behalf of your business.'],
    ['¿Necesito un EIN si soy una LLC de un solo miembro?',
     'Aunque una LLC de un solo miembro puede usar el SSN del propietario, recomendamos obtener un EIN. Los bancos generalmente lo requieren para abrir una cuenta empresarial, y separa tus finanzas personales de las del negocio.',
     'Do I need an EIN if I\\'m a single-member LLC?',
     'While a single-member LLC can technically use the owner\\'s SSN, we recommend getting an EIN. Banks typically require it to open a business account, and it separates personal and business finances.'],
    ['¿Puedo formar una LLC en Florida si vivo en otro país?',
     'Sí. No hay requisitos de residencia para formar una LLC o Corporación en Florida. Manejamos formaciones para clientes internacionales con regularidad.',
     'Can I start a Florida LLC if I live in another country?',
     'Absolutely. There are no residency requirements to form an LLC or Corporation in Florida. We regularly handle formations for international clients.'],
    ['¿Qué es un Acuerdo Operativo y por qué lo requiere el banco?',
     'Un Acuerdo Operativo es un documento interno que define las reglas de tu LLC: propiedad, gestión, distribución de ganancias y cómo se toman decisiones. Los bancos suelen requerirlo para abrir una cuenta empresarial.',
     'What is an Operating Agreement and why does the bank require it?',
     'An Operating Agreement is an internal document that defines the rules of your LLC: ownership, management, profit distribution, and how decisions are made. Banks typically require it to open a business account.'],
    ['¿Puedo guardar mi solicitud y completarla más tarde?',
     '¡Sí! En cualquier momento puedes hacer clic en "Guardar y Continuar Después" para guardar tu progreso. También puedes usar WhatsApp o Calendly para hablar con un experto antes de continuar.',
     'Can I save my application and complete it later?',
     'Yes! At any point during your application you can click "Save & Continue Later" to save your progress. You can also use WhatsApp or Calendly to speak with an expert before continuing.'],
    ['¿Son una firma legal? ¿Brindan asesoría legal?',
     'Somos un servicio profesional de preparación de documentos, no una firma legal. Preparamos y tramitamos documentos de formación empresarial ante el Estado de Florida. Para asesoría legal específica, consulta un abogado licenciado en Florida.',
     'Are you a law firm? Do you provide legal advice?',
     'We are a professional document filing service, not a law firm. We prepare and file business formation documents with the State of Florida. For legal advice specific to your situation, please consult a licensed Florida attorney.'],
  ];
  document.querySelectorAll('.faq-item').forEach(function(item, i){
    if(!faqData[i]) return;
    var q = item.querySelector('.faq-q span:first-child');
    var a = item.querySelector('.faq-a');
    if(q) q.textContent = isEs ? faqData[i][0] : faqData[i][2];
    if(a) a.textContent = isEs ? faqData[i][1] : faqData[i][3];
  });

  // Testimonials (bilingual)
  var testiData = [
    ['"No sabía por dónde empezar con mi LLC. El equipo me guió en cada paso y en días tenía mi Certificado de Formación. Una experiencia absolutamente impecable."',
     '"I had no idea where to start with my LLC. The team walked me through every step and within days I had my Certificate of Formation in hand. Absolutely seamless experience."',
     'Propietaria de Restaurante · Miami, FL', 'Restaurant Owner · Miami, FL'],
    ['"Como inversionista extranjero formando una Corporación en Florida, me preocupaba la complejidad. Lo manejaron todo profesionalmente. Totalmente vale la pena."',
     '"As a foreign investor forming a Corporation in Florida, I was worried about the complexity. They handled everything professionally. Worth every penny."',
     'Inversionista Inmobiliario · Orlando, FL', 'Real Estate Investor · Orlando, FL'],
    ['"Elegí el paquete Premium y cubrió absolutamente todo — EIN, Acuerdo Operativo, Agente Registrado. Mi negocio estuvo en marcha más rápido de lo esperado."',
     '"I chose the Premium package and it covered absolutely everything — EIN, Operating Agreement, Registered Agent. My business was up and running faster than I expected."',
     'Dueña de Boutique · Tampa, FL', 'Boutique Owner · Tampa, FL'],
    ['"El soporte bilingüe fue clave para mí. Pude comunicarme en español mientras todo se tramitaba correctamente en inglés. Un servicio verdaderamente profesional."',
     '"The bilingual support was a game-changer for me. I could communicate in Spanish while having everything filed properly in English. A truly professional service."',
     'Fundador de Startup Tech · Fort Lauderdale, FL', 'Tech Startup Founder · Fort Lauderdale, FL'],
  ];
  document.querySelectorAll('.testi-card').forEach(function(card, i){
    if(!testiData[i]) return;
    var txt  = card.querySelector('.testi-text');
    var role = card.querySelector('.testi-info span');
    if(txt)  txt.textContent  = isEs ? testiData[i][0] : testiData[i][1];
    if(role) role.textContent = isEs ? testiData[i][2] : testiData[i][3];
  });

  // Footer disclaimer
  var fd = document.querySelector('.footer-disclaimer');
  if(fd){
    var fdStrong = fd.querySelector('strong');
    if(fdStrong) fdStrong.textContent = isEs ? 'Aviso Importante' : 'Important Notice';
    var fdText = fd.childNodes[fd.childNodes.length-1];
    if(fdText && fdText.nodeType===3) fdText.textContent = isEs
      ? ' Florida Business Formation Center es un servicio de preparación de documentos. No somos una firma legal y no brindamos asesoría legal, fiscal ni financiera. La información en este sitio es solo informativa. El uso de nuestros servicios no crea una relación abogado-cliente.'
      : ' Florida Business Formation Center is a document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. The information on this website is for general informational purposes only. Use of our services does not create an attorney-client relationship.';
  }

  // Copyright
  var copy = document.querySelector('.footer-copy');
  if(copy) copy.textContent = isEs
    ? '© 2025 Florida Business Formation Center · mybusinessformation.com · Todos los Derechos Reservados.'
    : '© 2025 Florida Business Formation Center · mybusinessformation.com · All Rights Reserved.';

  // Pricing toggle labels
  el=document.getElementById('lbl-monthly');        if(el) el.textContent = isEs ? 'Mensual'  : 'Monthly';
  el=document.getElementById('lbl-annual');         if(el) el.textContent = isEs ? 'Anual'    : 'Annual';

  // Pricing cards content
  var pkgData = [
    { id:'pkg-basic',    name:isEs?'Básico':'Basic',     badge:'',                               items:isEs?['Registro de formación','Verificación de nombre','Certificado de Formación']:['Formation filing','Name search','Certificate of Formation'] },
    { id:'pkg-standard', name:isEs?'Estándar':'Standard', badge:isEs?'⭐ MÁS POPULAR':'⭐ MOST POPULAR', items:isEs?['Todo en Básico','EIN / ID Fiscal','Guía de Cuenta Bancaria']:['Everything in Basic','EIN / Tax ID','Bank Account Guide'] },
    { id:'pkg-premium',  name:isEs?'Premium':'Premium',  badge:'',                               items:isEs?['Todo incluido','Acuerdo Operativo','Tramitación Acelerada Gratis']:['Everything included','Operating Agreement','Free Expedited Filing'] },
  ];
  pkgData.forEach(function(pkg){
    var card = document.getElementById(pkg.id);
    if(!card) return;
    var nm = card.querySelector('.pkg-name, .plan-name'); if(nm) nm.textContent = pkg.name;
    var bdg = card.querySelector('.pkg-badge, .most-popular'); if(bdg&&pkg.badge) bdg.textContent = pkg.badge;
    var its = card.querySelectorAll('.pc-item, .pkg-feature');
    its.forEach(function(it, i){ if(pkg.items[i]) it.textContent = '✓ ' + pkg.items[i]; });
  });

  // FAQ items
  document.querySelectorAll('.faq-item').forEach(function(item){
    var q = item.querySelector('.faq-q, .faq-question');
    var a = item.querySelector('.faq-a, .faq-answer');
    if(q && q.getAttribute('data-es')) q.textContent = isEs ? q.getAttribute('data-es') : q.getAttribute('data-en');
    if(a && a.getAttribute('data-es')) a.textContent = isEs ? a.getAttribute('data-es') : a.getAttribute('data-en');
  });

  // Nav links
  document.querySelectorAll('.nav-link[data-en], .nav-link[data-es]').forEach(function(el){
    if(el.hasAttribute('data-en')&&el.hasAttribute('data-es'))
      el.textContent = isEs ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });
}

// ── FORM ──
function setEntity(type) {
  selectedEntity = type;
  formData.entity = type;
  var isEs = document.getElementById('btn-es').classList.contains('active');
  var llcBtn = document.getElementById('et-llc');
  var corpBtn = document.getElementById('et-corp');
  if(llcBtn) {
    llcBtn.style.background = type === 'llc' ? 'var(--navy)' : 'transparent';
    llcBtn.style.color = type === 'llc' ? '#fff' : 'var(--gray600)';
    llcBtn.style.boxShadow = type === 'llc' ? '0 2px 8px rgba(28,46,68,0.2)' : 'none';
  }
  if(corpBtn) {
    corpBtn.style.background = type === 'corp' ? 'var(--navy)' : 'transparent';
    corpBtn.style.color = type === 'corp' ? '#fff' : 'var(--gray600)';
    corpBtn.style.boxShadow = type === 'corp' ? '0 2px 8px rgba(28,46,68,0.2)' : 'none';
  }
  var fee = type === 'llc' ? '$125 LLC' : (isEs ? '$70 Corporación' : '$70 Corporation');
  var feeNote = document.getElementById('state-fee-note');
  if(feeNote) feeNote.textContent = isEs
    ? '* Cargo estatal de Florida: ' + fee + ' — pagado directamente al Estado, no incluido en el precio del paquete.'
    : '* Florida state filing fee: ' + fee + ' — paid directly to the State, not included in package price.';
}



function openFormAddon(addon) {
  formData.package = formData.package || 'standard';
  document.getElementById('formOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  generateOrderNumber();
  goToStep(1);
  updateTotal();
}


function openMgmtForm(type) {
  var overlay = document.getElementById('mgmtOverlay');
  if(!overlay) return;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.getElementById('mgmt-amendment').style.display = type === 'amendment' ? 'block' : 'none';
  document.getElementById('mgmt-annual').style.display = type === 'annual' ? 'block' : 'none';
  document.getElementById('mgmt-success').style.display = 'none';
  document.getElementById('mgmt-title').textContent = type === 'amendment' ? 'Articles of Amendment' : 'Annual Report Filing';
}
function closeMgmtForm() {
  var overlay = document.getElementById('mgmtOverlay');
  if(overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}
function submitMgmtForm() {
  document.getElementById('mgmt-amendment').style.display = 'none';
  document.getElementById('mgmt-annual').style.display = 'none';
  document.getElementById('mgmt-success').style.display = 'block';
}
function generateOrderNumber(id) {
  if(id) {
    orderNumber = 'FBFC-' + id.replace(/-/g, '').substring(0, 8).toUpperCase();
  } else if(!orderNumber) {
    orderNumber = 'FBFC-' + Math.floor(10000 + Math.random() * 90000);
  }
}
function goToStep(n) {
  // pkg merged into step 1 — no skip needed
  document.querySelectorAll('.form-step').forEach(function(s){ s.classList.remove('active'); });
  var el=document.getElementById('step'+n);
  if(el){
    el.classList.add('active');
    currentStep=n;
    // Scroll left column to top
    var lc = el.querySelector('.form-left-col');
    if(lc) lc.scrollTop = 0;
  }
  updateProgress();
  updateTotal();
  if(document.getElementById('btn-es')&&document.getElementById('btn-es').classList.contains('active'))
    setTimeout(function(){ translateFormContent('es'); },20);
}
function nextStep() {
  var next = currentStep + 1;
  if(next === 2 && skipPkgStep) next = 3;
  if(next <= totalSteps) goToStep(next);
}
function prevStep() { if(currentStep > 1) goToStep(currentStep - 1); }
function updateProgress() {
  var pct = Math.round((currentStep / totalSteps) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressText').textContent = 'Step ' + currentStep + ' of ' + totalSteps;
  var titles = ['Entity & Package','Business Name & Purpose','Address & Privacy','Members & Ownership','Registered Agent & EIN','Additional Services','Annual Report','Review & Pay'];
  document.getElementById('form-step-title').textContent = titles[currentStep-1] || 'Complete Your Order';
}
function selectChoice(el, key, val) {
  var parent = el.parentElement;
  parent.querySelectorAll('.choice-card').forEach(function(c){ c.classList.remove('selected'); });
  el.classList.add('selected');
  formData[key] = val;
  if(key === 'filer') { var af = document.getElementById('agent-fields-s1') || document.getElementById('agent-fields'); if(af) af.style.display = val === 'company' ? 'block' : 'none'; }
  if(key === 'ra' && val === false) { document.getElementById('own-agent-fields').style.display = 'block'; }
  if(key === 'ra' && val === true) { document.getElementById('own-agent-fields').style.display = 'none'; }
}
function selectPkg(el, pkg) {
  document.querySelectorAll('.pkg-choice').forEach(function(c){ c.classList.remove('selected'); });
  el.classList.add('selected');
  formData.package = pkg;
}
function selectAddon(btn, key, val) {
  var btns = btn.parentElement.querySelectorAll('button');
  btns.forEach(function(b){ b.classList.remove('selected'); });
  btn.classList.add('selected');
  formData.addons[key] = val;
  var rowMap = {ein:'sum-ein-row', oa:'sum-oa-row', itin:'sum-itin-row', vma:'sum-vma-row', ar:'sum-ar-row', ra:'sum-ra-row'};
  if(rowMap[key]) { var row = document.getElementById(rowMap[key]); if(row) row.style.display = val ? '' : 'none'; }
  updateTotal();
}
function selectDelivery(el, type) {
  document.querySelectorAll('.delivery-card').forEach(function(c){ c.classList.remove('selected'); });
  el.classList.add('selected');
  formData.delivery = type;
  var expRow = document.getElementById('sum-exp-row');
  if(type === 'expedited' && formData.package !== 'premium') {
    if(expRow) expRow.style.display = '';
  } else { if(expRow) expRow.style.display = 'none'; }
  updateTotal();
}
function updateTotal() {
  var prices = {basic:49, standard:149, premium:249};
  var base  = prices[formData.package] || 149;
  var state = formData.entity === 'corp' ? 70 : 125;
  var extras = 0;
  if(formData.addons.ein)  extras += 49;
  if(formData.addons.oa)   extras += 79;
  if(formData.addons.itin) extras += 69;
  var expFree = formData.package === 'premium';
  if(formData.delivery === 'expedited' && !expFree) extras += 99;
  var total = base + state + extras;

  var pkgNames = {basic:'Basic — $49',standard:'Standard — $149',premium:'Premium — $249'};
  var pkgStr   = pkgNames[formData.package] || 'Standard — $149';
  var entityStr= formData.entity === 'corp' ? 'Corporation' : 'LLC';

  // Update ALL summary panels (class-based, works for all steps)
  document.querySelectorAll('.sum-entity-val').forEach(function(el){ el.textContent = entityStr; });
  document.querySelectorAll('.sum-pkg-val').forEach(function(el){ el.textContent = pkgStr; });
  document.querySelectorAll('.sum-state-val').forEach(function(el){ el.textContent = '$' + state; });
  document.querySelectorAll('.sum-total-val').forEach(function(el){ el.textContent = '$' + total; });

  // Add-on rows
  document.querySelectorAll('.sum-ein-line').forEach(function(el){ el.style.display = formData.addons.ein ? '' : 'none'; });
  document.querySelectorAll('.sum-oa-line').forEach(function(el){  el.style.display = formData.addons.oa  ? '' : 'none'; });
  document.querySelectorAll('.sum-itin-line').forEach(function(el){el.style.display = formData.addons.itin? '' : 'none'; });
  document.querySelectorAll('.sum-vma-line').forEach(function(el){ el.style.display = formData.addons.vma ? '' : 'none'; });
  document.querySelectorAll('.sum-ar-line').forEach(function(el){  el.style.display = formData.addons.ar  ? '' : 'none'; });
  document.querySelectorAll('.sum-exp-line').forEach(function(el){ el.style.display = formData.delivery==='expedited'&&!expFree ? '' : 'none'; });

  // Legacy IDs (step9 panel)
  var el;
  el=document.getElementById('sum-pkg');           if(el) el.textContent = pkgStr;
  el=document.getElementById('sum-pkg-price');     if(el) el.textContent = '$' + base;
  el=document.getElementById('sum-state');         if(el) el.textContent = '$' + state;
  el=document.getElementById('summary-total-price');if(el) el.textContent = '$' + total;
  el=document.getElementById('expedited-price');   if(el) el.textContent = expFree ? 'Free with Premium ✓' : '+$99 (Free w/Premium)';
}
var addons_selected = {};

function addMember() {
  memberCount++;
  var container = document.getElementById('members-container');
  var div = document.createElement('div');
  div.className = 'member-block';
  div.id = 'member-' + memberCount;
  div.innerHTML = '<button class="btn-remove-member" onclick="removeMember(' + memberCount + ')">✕</button><h5>Member #' + memberCount + '</h5><div class="form-row"><div class="form-group"><label class="form-label">First Name</label><input type="text" class="form-input" placeholder="First name"/></div><div class="form-group"><label class="form-label">Last Name</label><input type="text" class="form-input" placeholder="Last name"/></div></div><div class="form-group"><label class="form-label">Address</label><input type="text" class="form-input" placeholder="Full address"/></div><div class="form-row"><div class="form-group"><label class="form-label">Role</label><select class="select-input"><option>Manager (MGR)</option><option>Authorized Representative (AR)</option><option>Officer</option><option>Director</option><option>Silent Investor</option></select></div><div class="form-group"><label class="form-label">Ownership %</label><input type="number" class="form-input ownership-input" placeholder="e.g. 25" min="0" max="100" oninput="updateOwnership()"/></div></div>';
  container.appendChild(div);
}
function removeMember(n) {
  var el = document.getElementById('member-' + n);
  if(el) el.remove();
  updateOwnership();
}
function updateOwnership() {
  var inputs = document.querySelectorAll('.ownership-input');
  var total = 0;
  inputs.forEach(function(i){ total += parseFloat(i.value) || 0; });
  var el = document.getElementById('ownershipSum');
  var container = document.getElementById('ownershipTotal');
  el.textContent = Math.round(total) + '%';
  container.className = 'ownership-total' + (total === 100 ? ' ok' : total > 100 ? ' over' : '');
}
function toggleFaq(btn) {
  var item = btn.parentElement;
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(i){ i.classList.remove('open'); });
  if(!wasOpen) item.classList.add('open');
}
function saveOrder() {
  generateOrderNumber();
  var box = document.createElement('div');
  box.className = 'order-save-box';
  box.innerHTML = '<div><div class="order-num">' + orderNumber + '</div><p>Your order has been saved! Use this number to continue from any device.</p></div>';
  var existing = document.querySelector('.order-save-box');
  if(existing) existing.remove();
  var activeStep = document.querySelector('.form-step.active');
  if(activeStep) activeStep.insertBefore(box, activeStep.querySelector('.form-footer'));
}
function submitForm() {
  generateOrderNumber();
  document.getElementById('finalOrderNum').textContent = orderNumber;
  document.querySelectorAll('.form-step').forEach(function(s){ s.classList.remove('active'); });
  document.getElementById('stepSuccess').classList.add('active');
  document.getElementById('progressBar').style.width = '100%';
  document.getElementById('progressText').textContent = 'Order Submitted ✓';
  document.getElementById('form-step-title').textContent = 'Order Confirmed!';
  document.querySelector('.form-modal').scrollTop = 0;
}
var _dm = document.getElementById('diffMailing');
if(_dm) _dm.addEventListener('change', function(){
  var _mf = document.getElementById('mailing-fields');
  if(_mf) _mf.style.display = this.checked ? 'block' : 'none';
});

// Sticky header
window.addEventListener('scroll', function(){
  var h = document.getElementById('mainHeader');
  if(h) h.style.boxShadow = window.scrollY > 30 ? '0 2px 20px rgba(28,46,68,0.1)' : 'none';
});

// Lang toggle



var formTranslations = {
  en: {
    steps: ['Entity & Package','Business Name & Purpose','Address & Privacy','Members & Ownership','Registered Agent & EIN','Additional Services','Annual Report','Review & Pay'],
    stepSubs: ['This tells us how to prepare your ownership documents.','Your business name must end with "LLC" or "Corp/Inc". We verify availability before filing.','This will be the principal office address on your formation documents. Must be a physical street address.','','','','Florida requires every LLC and Corporation to file an Annual Report to stay active.',''],
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
    calBtn: '\\uD83D\\uDCC5 Programar una Llamada',
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
    steps: ['Entidad y Paquete','Nombre y Propósito','Dirección y Privacidad','Miembros y Propiedad','Agente Registrado y EIN','Servicios Adicionales','Declaración Anual','Revisión y Pago'],
    stepSubs: ['Esto nos ayuda a preparar correctamente tus documentos de propiedad.','El nombre debe terminar con "LLC" o "Corp/Inc". Verificamos la disponibilidad antes de tramitar.','Esta será la dirección de la oficina principal en tus documentos de formación. Debe ser una dirección física.','','','','Florida requiere que toda LLC y Corporación presente una Declaración Anual para mantenerse activa.',''],
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
      'Street Address *':'Dirección *',
      'Address *':'Dirección *',
      'Address':'Dirección',
      'City *':'Ciudad *',
      'ZIP Code *':'Código Postal *',
      'Mailing Address (PO Box accepted)':'Dirección Postal (se acepta Apartado Postal)',
      'City':'Ciudad',
      'ZIP':'Código Postal',
      'Industry / Business Category *':'Industria / Categoría del Negocio *',
      'Business Purpose / Description':'Propósito / Descripción del Negocio',
      'Authorized Shares * (Corporations only — min. 1)':'Acciones Autorizadas * (Solo Corporaciones — mín. 1)',
      'Management Structure':'Estructura de Gestión',
      'Members / Owners':'Miembros / Propietarios',
      'First Name':'Nombre',
      'First Name *':'Nombre *',
      'Last Name':'Apellido',
      'Last Name *':'Apellido *',
      'Role':'Cargo',
      'Ownership %':'% de Propiedad',
      'Ownership % *':'% de Propiedad *',
      'Email':'Correo Electrónico',
      'Phone':'Teléfono',
      'Registered Agent Name *':'Nombre del Agente Registrado *',
      'Florida Street Address * (No PO Box)':'Dirección FL * (Sin Apartado Postal)',
      'Agent Electronic Signature *':'Firma Electrónica del Agente *',
      'Filing Speed':'Velocidad de Tramitación',
      'Email Address for Confirmation *':'Correo de Confirmación *',
      'Confirm Email *':'Confirmar Correo *',
      'Electronic Signature *':'Firma Electrónica *',
    },
    placeholders: {
      'e.g. ABC Holdings LLC':'ej. ABC Holdings LLC',
      'Full legal name':'Nombre legal completo',
      'Full legal name of the person completing this form':'Nombre legal completo del representante',
      'e.g. Sunshine Ventures LLC':'ej. Sunshine Ventures LLC',
      'Backup option if your preferred name is taken':'Alternativa si el nombre preferido no está disponible',
      'Backup if preferred name is taken':'Alternativa si el nombre preferido no está disponible',
      'Second backup option':'Segunda opción alternativa',
      '123 Main Street, Suite 100':'123 Calle Principal, Suite 100',
      'Miami':'Miami',
      '33101':'33101',
      'ZIP Code':'Código Postal',
      'Mailing address':'Dirección de correspondencia',
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
      'Type full name as electronic signature':'Escribe tu nombre legal completo — sirve como firma electrónica',
      'Type full legal name':'Escribe tu nombre legal completo',
      'Type your full legal name':'Escribe tu nombre legal completo',
      'your@email.com':'tucorreo@email.com',
      'email@example.com':'tucorreo@ejemplo.com',
      'Re-enter your email':'Vuelve a ingresar tu correo',
      '(305) 000-0000':'(305) 000-0000',
      'e.g. The purpose of this company is to engage in any lawful business activity permitted under Florida law, including retail sales and e-commerce operations.':'ej. El propósito de esta empresa es dedicarse a cualquier actividad empresarial lícita permitida por la ley de Florida.',
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
  var isEs = lang === 'es';
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
  modal.querySelectorAll('label').forEach(function(l){
    var txt = l.textContent.trim();
    if(txt.includes('mailing address')||txt.includes('Mailing address')||txt.includes('correspondencia')||txt.includes('Direcci')){
      var last = l.childNodes[l.childNodes.length-1];
      if(last && last.nodeType===3) last.textContent = ' ' + t.diffMailing;
    }
  });

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
  // form-help handled per-step below
  modal.querySelectorAll('.fh-wa').forEach(function(b){ b.textContent = t.waBtn; });
  modal.querySelectorAll('.fh-cal').forEach(function(b){ b.textContent = t.calBtn; });

  // ── All form-help p texts (per-step context) ─────────────────────────
  modal.querySelectorAll('.form-help p').forEach(function(p){
    var strong = p.querySelector('strong');
    if(!strong) return;
    var txt = p.textContent.trim();
    // Find the text node (after the strong tag)
    var textNode = null;
    p.childNodes.forEach(function(n){ if(n.nodeType===3 && n.textContent.trim()) textNode=n; });

    var map = [
      {en:"Not sure how to answer",         es:"¿No estás seguro cómo responder?",   sub_en:" We're happy to guide you.",                                    sub_es:" Con gusto te orientamos."},
      {en:"Questions about packages",        es:"¿Preguntas sobre los paquetes?",               sub_en:" Let us help you pick the right one.",                          sub_es:" Te ayudamos a elegir el más adecuado."},
      {en:"Need help with naming",           es:"¿Necesitas ayuda con el nombre?",              sub_en:" We can guide you in minutes.",                                  sub_es:" Te orientamos en minutos."},
      {en:"No physical address",             es:"¿Aún no tienes dirección física?",sub_en:" Ask us about our Virtual Mailing Address service.",            sub_es:" Pregúntanos sobre nuestra Dirección Postal Virtual."},
      {en:"Operating Agreement required",    es:"¿El Acuerdo Operativo es obligatorio?",        sub_en:" Most banks require it. Ask us!",                                sub_es:" La mayoría de los bancos lo requieren. ¡Pregúntanos!"},
      {en:"Not sure about these",            es:"¿No estás seguro sobre estos?",           sub_en:" Both are essential for your business — ask us!",            sub_es:" Ambos son esenciales para tu negocio — ¡pregúntanos!"},
      {en:"Not sure which apply",            es:"¿No sabes cuáles aplican?",               sub_en:" We can help you decide in minutes.",                             sub_es:" Te ayudamos a decidir en minutos."},
      {en:"filing deadline",                 es:"fecha límite de presentación",            sub_en:" Between January 1 and May 1 every year — $400 late fee after May 1.",sub_es:" Entre el 1 de enero y el 1 de mayo cada año — $400 de multa después del 1 de mayo."},
      {en:"Something look wrong",            es:"¿Algo luce mal?",                               sub_en:" Go back and correct it before submitting.",                      sub_es:" Regresa y corrígelo antes de enviar."},
      {en:"Almost there",                    es:"¡Ya casi!",                                     sub_en:" Questions before submitting?",                                   sub_es:" ¿Preguntas antes de enviar?"},
    ];
    map.forEach(function(entry){
      if(txt.includes(entry.en)||txt.includes(entry.es)){
        strong.textContent = isEs ? entry.es : entry.en;
        if(textNode) textNode.textContent = isEs ? entry.sub_es : entry.sub_en;
      }
    });
  });

  // Addon cards — RA
  var addonCards = modal.querySelectorAll('.addon-card');
  var addonData = [
    {title:t.vmaTitle, desc:t.vmaDesc, benefit:t.vmaBenefit, yes:t.vmaAdd, no:t.vmaNo},
    {title:t.phoneTitle, desc:t.phoneDesc, benefit:t.phoneBenefit, yes:t.phoneAdd, no:t.phoneNo},
    {title:lang==='es'?'Agregar Acuerdo Operativo':'Add Operating Agreement', desc:t.oaDesc, benefit:t.oaBenefit, yes:t.oaAdd, no:t.oaNo},
    {title:null, desc:t.raDesc, benefit:t.raBenefit, yes:t.raUse, no:t.raOwn},
    {title:lang==='es'?'Agregar EIN':'Add EIN Service', desc:t.einDesc, benefit:t.einBenefit, yes:t.einAdd, no:t.einNo},
    {title:lang==='es'?'Agregar ITIN':'Add ITIN Service', desc:t.itinDesc, benefit:t.itinBenefit, yes:t.itinAdd, no:t.itinNo},
    {title:t.webTitle, desc:t.webDesc, benefit:t.webBenefit, yes:t.webAdd, no:t.webNo},
    {title:t.arTitle, desc:t.arDesc, benefit:t.arBenefit, yes:t.arAdd, no:t.arNo},
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


  // Targeted ID translations for contextual offer sections
  var e;
  e=document.getElementById('vma-offer-title'); if(e) e.innerHTML=isEs?'¿No tienes dirección permanente? — ¿O quieres mantener tu dirección personal privada?':"Don&#39;t have a permanent address? &#8212; Or want to keep your home address private?";
  e=document.getElementById('vma-addon-title'); if(e) e.textContent=isEs?'Dirección Postal Virtual':'Virtual Mailing Address';
  e=document.getElementById('vma-addon-desc'); if(e) e.textContent=isEs?'Obtén una dirección postal profesional en Florida sin necesidad de una oficina física. Recibimos tu correo, lo escaneamos y te notificamos digitalmente — manteniendo tu dirección personal privada en todos los registros públicos.':'Get a professional Florida mailing address without a physical office. We receive your mail, scan it, and notify you digitally — keeping your home address private on all public records.';
  e=document.getElementById('vma-addon-ben'); if(e) e.textContent=isEs?'Tu dirección personal no aparecerá en los registros públicos de la División de Corporaciones de Florida.':'Your home address stays off all public Florida Division of Corporations records.';
  e=document.getElementById('vma-btn-yes'); if(e) e.textContent=isEs?'Agregar Dirección Virtual — $29/mes':'Add Virtual Address — $29/mo';
  e=document.getElementById('vma-btn-no'); if(e) e.textContent=isEs?'No gracias, tengo una dirección':'No thanks, I have an address';
  // Phone offer label in step5
  modal.querySelectorAll('div[style*="color:var(--gray600)"][style*="font-weight:600"]').forEach(function(el){
    var txt = el.textContent.trim();
    if(txt.includes('dedicated business phone')||txt.includes('teléfono empresarial dedicado'))
      el.innerHTML = isEs
        ? '&#128222; ¿Quieres un número de teléfono empresarial dedicado?'
        : '&#128222; Want a dedicated business phone number?';
  });

  e=document.getElementById('oa-offer-title'); if(e) e.textContent=isEs?'Protege tu estructura de propiedad — agrega un Acuerdo Operativo':'Protect your ownership structure — add an Operating Agreement';
  e=document.getElementById('ra-addon-title'); if(e) e.textContent=isEs?'¿Deseas que seamos tu Agente Registrado?':'Would you like us to be your Registered Agent?';
  e=document.getElementById('ra-addon-desc'); if(e) e.textContent=isEs?'Tu Agente Registrado recibe todos los documentos legales oficiales, avisos fiscales y notificaciones en nombre de tu negocio durante el horario comercial normal.':'Your Registered Agent receives all official legal documents, tax notices, and service of process on behalf of your business during normal business hours.';
  e=document.getElementById('ra-addon-ben'); if(e) e.textContent=isEs?'Requerido para mantener tu negocio en regla con el Estado de Florida. Sin un Agente Registrado válido, tu empresa puede ser disuelta.':'Required to maintain your business in good standing with the State of Florida. Without a valid Registered Agent, your company can be dissolved.';
  e=document.getElementById('ra-btn-yes'); if(e) e.textContent=isEs?'Sí — Usar Vuestro Servicio':'Yes — Use Your Service';
  e=document.getElementById('ra-btn-no'); if(e) e.textContent=isEs?'Tengo mi propio agente':'I have my own agent';
  e=document.getElementById('ein-offer-title'); if(e) e.textContent=isEs?'¿Necesitas un ID Fiscal Federal (EIN) para tu negocio?':'Need a Federal Tax ID (EIN) for your business?';
  e=document.getElementById('ein-addon-title'); if(e) e.textContent=isEs?'Agregar Servicio de Solicitud EIN':'Add EIN Application Service';
  e=document.getElementById('ein-addon-desc'); if(e) e.textContent=isEs?'Tu EIN es el número de 9 dígitos que el IRS asigna para identificar tu negocio para efectos fiscales. Funciona como el Número de Seguro Social de tu empresa.':'Your EIN is the nine-digit number the IRS assigns to identify your business for tax purposes. It works like a Social Security Number for your company.';
  e=document.getElementById('ein-addon-ben'); if(e) e.textContent=isEs?'Los bancos requieren tu EIN para abrir una cuenta corriente empresarial. También es necesario para contratar empleados, presentar impuestos y solicitar licencias.':'Banks require your EIN to open a business checking account. Also needed to hire employees, file business taxes, and apply for business licenses.';
  e=document.getElementById('ein-btn-yes'); if(e) e.textContent=isEs?'Agregar Servicio EIN — $49':'Add EIN Service — $49';
  e=document.getElementById('ein-btn-no'); if(e) e.textContent=isEs?'No gracias, lo haré yo mismo':"No thanks, I'll handle it";
  modal.querySelectorAll('[style*="text-transform:uppercase"]').forEach(function(el){
    var t2=el.textContent.trim();
    if(t2==='For Foreign Nationals / No SSN'||t2==='Para Extranjeros / Sin SSN') el.textContent=isEs?'Para Extranjeros / Sin SSN':'For Foreign Nationals / No SSN';
    if(t2==='Online Presence'||t2==='Presencia en Línea') el.textContent=isEs?'Presencia en Línea':'Online Presence';
  });
  // Step 9 - Review & Pay combined step
  var e;
  e=document.getElementById('lbl-filing-speed');  if(e) e.textContent=isEs?'Velocidad de Tramitación':'Filing Speed';
  e=document.getElementById('std-filing-lbl');    if(e) e.textContent=isEs?'Tramitación Estándar':'Standard Filing';
  e=document.getElementById('std-days-lbl');      if(e) e.textContent=isEs?'7–10 días hábiles':'7–10 business days';
  e=document.getElementById('std-price-lbl');     if(e) e.textContent=isEs?'Incluido en todos los paquetes':'Included in all packages';
  e=document.getElementById('exp-filing-lbl');    if(e) e.innerHTML=isEs?'&#9889; Tramitación Acelerada':'&#9889; Expedited Filing';
  e=document.getElementById('exp-days-lbl');      if(e) e.textContent=isEs?'1–3 días hábiles':'1–3 business days';
  e=document.getElementById('sum-label-hd');      if(e) e.textContent=isEs?'Resumen de tu Orden':'Order Summary';
  e=document.getElementById('sum-state-lbl');     if(e) e.textContent=isEs?'Cargo Estatal de Florida':'Florida State Filing Fee';
  e=document.getElementById('sum-ra-lbl');        if(e) e.textContent=isEs?'Servicio de Agente Registrado':'Registered Agent Service';
  e=document.getElementById('sum-ein-lbl');       if(e) e.textContent=isEs?'EIN / ID Fiscal':'EIN / Tax ID Number';
  e=document.getElementById('sum-oa-lbl');        if(e) e.textContent=isEs?'Acuerdo Operativo':'Operating Agreement';
  e=document.getElementById('sum-itin-lbl');      if(e) e.textContent=isEs?'Solicitud de ITIN':'ITIN Application';
  e=document.getElementById('sum-vma-lbl');       if(e) e.textContent=isEs?'Dirección Postal Virtual':'Virtual Mailing Address';
  e=document.getElementById('sum-ar-lbl');        if(e) e.textContent=isEs?'Declaración Anual':'Annual Report Filing';
  e=document.getElementById('sum-exp-lbl');       if(e) e.textContent=isEs?'Tramitación Acelerada':'Expedited Filing';
  e=document.getElementById('sum-total-lbl');     if(e) e.textContent=isEs?'Total a Pagar Hoy':'Total Due Today';
  e=document.getElementById('sig-note');          if(e) e.textContent=isEs?'Al firmar, confirmas que la información es precisa y nos autorizas a tramitar en tu nombre.':'By signing, you confirm all information is accurate and authorize us to file on your behalf.';
  e=document.getElementById('refund-title');      if(e) e.textContent=isEs?'No Reembolsable:':'Non-Refundable:';
  e=document.getElementById('refund-text');       if(e) e.innerHTML=isEs?'<strong id="refund-title">No Reembolsable:</strong> Las tarifas se cobran al enviar y no pueden ser devueltas una vez iniciado el proceso. ¿Preguntas? Contáctanos por WhatsApp antes de enviar.':'<strong id="refund-title">Non-Refundable:</strong> Fees are collected upon submission and cannot be refunded once processing begins. Questions? Contact us via WhatsApp before submitting.';
  e=document.getElementById('pay-methods-lbl');   if(e) e.textContent=isEs?'Métodos de Pago Aceptados':'Accepted Payment Methods';
  e=document.getElementById('pay-contact-note');  if(e) e.textContent=isEs?'Al enviar tu orden, nuestro equipo te contactará dentro de 1 hora hábil con instrucciones de pago seguras.':'After submitting, our team will contact you within 1 business hour with secure payment instructions.';
  ['sec1','sec2','sec3','sec4'].forEach(function(id){
    var secMap={'sec1':isEs?'Cifrado SSL':'SSL Encrypted','sec2':isEs?'Pago Seguro':'Secure Checkout','sec3':isEs?'Sin Cargos Ocultos':'No Hidden Fees','sec4':isEs?'Recibo por Correo':'Receipt by Email'};
    var el=document.getElementById(id); if(el) el.textContent=secMap[id];
  });
  e=document.getElementById('submit-btn-lbl');    if(e) e.textContent=isEs?'Enviar Orden y Pagar de Forma Segura':'Submit My Order & Pay Securely';
  e=document.getElementById('save-pay-lbl');      if(e) e.textContent=isEs?'Guardar Orden y Pagar Después':'Save Order & Pay Later';
  e=document.getElementById('emailErrMsg');       if(e) e.textContent=isEs?'⚠️ Los correos no coinciden — verifica e inténtalo de nuevo.':'⚠️ The email addresses do not match — please check and try again.';
  e=document.getElementById('emailOkMsg');        if(e) e.textContent=isEs?'✓ Los correos coinciden.':'✓ Email addresses match.';

  // Business Description section label (step 3)
  var bdl = document.getElementById('biz-desc-lbl');
  if(bdl) bdl.textContent = isEs ? 'Descripción del Negocio' : 'Business Description';

  // Mailing address fields (step 4)
  var ml_ids = {
    'lbl-mail-street': [isEs?'Calle / Apartado Postal *':'Street / PO Box *'],
    'lbl-mail-apt':    [isEs?'Apt / Suite / Unidad':'Apt / Suite / Unit'],
    'lbl-mail-city':   [isEs?'Ciudad *':'City *'],
    'lbl-mail-state':  [isEs?'Estado *':'State *'],
    'lbl-mail-zip':    [isEs?'Código Postal *':'ZIP *'],
  };
  Object.keys(ml_ids).forEach(function(id){
    var el=document.getElementById(id); if(el) el.textContent=ml_ids[id][0];
  });
  // Mailing field placeholders
  var mplh = {
    'Apt 2B, Suite 100 (optional)': isEs?'Apt 2B, Suite 100 (opcional)':'Apt 2B, Suite 100 (optional)',
    'FL': 'FL',
    '33101': '33101',
  };
  modal.querySelectorAll('#mailing-fields [placeholder]').forEach(function(inp){
    var ph = inp.getAttribute('placeholder');
    if(ph && mplh[ph]) inp.setAttribute('placeholder', mplh[ph]);
  });

  // Credit card form (step 9)
  var ccids = {
    'card-form-lbl':  isEs?'Información de la Tarjeta':'Card Information',
    'lbl-card-name':  isEs?'Nombre en la Tarjeta':'Name on Card',
    'lbl-card-num':   isEs?'Número de Tarjeta':'Card Number',
    'lbl-card-exp':   isEs?'Fecha de Vencimiento':'Expiry Date',
    'lbl-card-cvv':   'CVV',
    'card-note':      isEs?'ኂ74 Tus datos de tarjeta se recopilan de forma segura y son procesados por nuestro procesador de pagos. No almacenamos números de tarjeta.':'ኂ74 Your card details are collected securely and processed by our payment processor. We do not store card numbers.',
    'pm-lbl-card':    isEs?'Crédito / Débito':'Credit / Debit',
  };
  Object.keys(ccids).forEach(function(id){
    var el=document.getElementById(id); if(el) el.textContent=ccids[id];
  });

  // Step 9 help text and back button
  var hsf=document.getElementById('help-strong-final');
  if(hsf) hsf.textContent=isEs?'¡Ya casi!':'Almost there!';
  var htf=document.getElementById('help-text-final');
  if(htf) htf.textContent=isEs?' ¿Preguntas antes de enviar?':' Questions before submitting?';
  var lbr=document.getElementById('lbl-back-review');
  if(lbr) lbr.textContent=isEs?'Atrás':'Back';

  var fst=document.getElementById('form-step-title');
  if(fst&&t.steps[currentStep-1]) fst.textContent=t.steps[currentStep-1];
  var pt=document.getElementById('progressText');
  if(pt) pt.textContent=(isEs?'Paso':'Step')+' '+currentStep+' '+(isEs?'de':'of')+' '+totalSteps;
}


// ── Order Review Builder ──────────────────────────────────────────────────
function buildOrderReview() {
  var isEs = document.getElementById('btn-es').classList.contains('active');
  var body = document.getElementById('order-review-body');
  if(!body) return;

  var pkgNames = {basic: 'Basic', standard: 'Standard', premium: 'Premium'};
  var pkgPrices = {basic: '$49', standard: '$149', premium: '$249'};
  var entityLabel = formData.entity === 'corp'
    ? (isEs ? 'Corporaci\\u00f3n' : 'Corporation')
    : 'LLC';
  var pkgLabel = pkgNames[formData.package] || formData.package;
  var pkgPrice = pkgPrices[formData.package] || '';

  // Addon items
  var addonLabels = {
    ra:   {en:'Registered Agent Service', es:'Servicio de Agente Registrado', price:isEs?'Tarifa Anual':'Annual Fee'},
    ein:  {en:'EIN / Tax ID',             es:'EIN / ID Fiscal',               price:'$49'},
    oa:   {en:'Operating Agreement',      es:'Acuerdo Operativo',             price:'$79'},
    vma:  {en:'Virtual Mailing Address',  es:'Dirección Postal Virtual', price:isEs?'$29/mes':'$29/mo'},
    itin: {en:'ITIN Application',         es:'Solicitud de ITIN',             price:'$69'},
    web:  {en:'Professional Website',     es:'Sitio Web Profesional',         price:isEs?'Personalizado':'Custom'},
    phone:{en:'Business Phone Number',    es:'Número Empresarial',        price:isEs?'Mensual':'Monthly'},
    ar:   {en:'Annual Report Filing',     es:'Declaración Anual',         price:isEs?'Anual':'Annual'},
  };

  // Business name
  var bizName = '';
  var nameInputs = document.querySelectorAll('#step3 .form-input[type="text"]');
  if(nameInputs[0]) bizName = nameInputs[0].value.trim();

  var stateFee = formData.entity === 'corp' ? '$70' : '$125';
  var stateLabel = isEs ? 'Cargo Estatal de Florida' : 'Florida State Filing Fee';

  // Build rows
  var rows = '';
  var totalNum = parseInt(pkgPrice.replace('$','')) || 0;

  // Package row
  rows += buildReviewRow(
    (isEs ? 'Paquete ' : 'Package ') + pkgLabel,
    pkgPrice,
    'var(--blue)',
    isEs ? 'Incluye: registro, verificaci\\u00f3n de nombre, certificado' : 'Includes: filing, name check, certificate'
  );

  // State fee row
  rows += buildReviewRow(stateLabel, stateFee, '#6b7280', isEs ? 'Pagado directamente al Estado de Florida' : 'Paid directly to the State of Florida');

  // Addons
  Object.keys(addonLabels).forEach(function(key) {
    if(formData.addons[key]) {
      var a = addonLabels[key];
      rows += buildReviewRow(isEs ? a.es : a.en, a.price, 'var(--green)', '');
      if(key === 'ein' || key === 'oa' || key === 'itin') {
        totalNum += parseInt(a.price.replace('$','')) || 0;
      }
    }
  });

  // Business name display
  var nameSection = bizName ? '<div style="background:var(--blue-light);border-radius:10px;padding:12px 16px;margin-bottom:16px"><div style="font-size:.72rem;font-weight:600;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">'+(isEs?'Nombre del Negocio':'Business Name')+'</div><div style="font-size:1rem;font-weight:700;color:var(--navy)">'+bizName+'</div><div style="font-size:.72rem;color:var(--gray600);margin-top:2px">'+entityLabel+'</div></div>' : '';

  // Total row
  var totalLabel = isEs ? 'Total Estimado Hoy' : 'Estimated Total Today';
  var totalDisplay = '$' + (parseInt(pkgPrice.replace('$','')) + (formData.entity==='corp'?70:125)) + '+';

  body.innerHTML = nameSection +
    '<div style="border:1.5px solid var(--gray200);border-radius:12px;overflow:hidden;margin-bottom:16px">' +
    '<div style="background:var(--navy);color:#fff;padding:10px 16px;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.5px">'+(isEs?'Resumen de tu Orden':'Your Order Summary')+'</div>' +
    rows +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--gray50);border-top:2px solid var(--navy)">' +
    '<strong style="font-size:.9rem;color:var(--navy)">' + totalLabel + '</strong>' +
    '<strong style="font-size:1rem;color:var(--navy)">' + totalDisplay + '</strong>' +
    '</div></div>';

  // Translate notice if ES
  var nt = document.getElementById('review-notice-title');
  var np = document.getElementById('review-notice-text');
  if(nt) nt.textContent = isEs ? 'Revisa Cuidadosamente Antes de Continuar' : 'Please Review Carefully Before Proceeding';
  if(np) np.innerHTML = isEs
    ? 'Por favor revisa toda la informaci\\u00f3n cuidadosamente antes de proceder al pago. Las tarifas estatales de Florida y nuestras tarifas de servicio se cobran al enviar la orden y son <strong>no reembolsables una vez procesada</strong>. Si tienes alguna duda o necesitas hacer cambios, cont\\u00e1ctanos por WhatsApp antes de enviar \\u2014 con gusto te ayudamos sin costo adicional.'
    : 'Please review all information carefully before proceeding to payment. Florida state filing fees and our service fees are collected upon submission and are <strong>non-refundable once your order has been processed</strong>. If you have any questions or need to make changes, contact us via WhatsApp before submitting \\u2014 we are happy to help at no additional cost.';

  // Translate proceed button
  var proceedBtn = document.querySelector('#step9 .btn-next');
  if(proceedBtn) proceedBtn.innerHTML = isEs ? 'Proceder al Pago &#8594;' : 'Proceed to Payment &#8594;';
}

function buildReviewRow(label, price, color, note) {
  return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--gray100)">' +
    '<div><div style="font-size:.85rem;font-weight:600;color:var(--navy)">' + label + '</div>' +
    (note ? '<div style="font-size:.72rem;color:var(--gray500);margin-top:1px">' + note + '</div>' : '') +
    '</div><span style="font-size:.85rem;font-weight:700;color:' + color + ';white-space:nowrap;margin-left:12px">' + price + '</span></div>';
}


// ── Payment method toggle ──────────────────────────────────────────────────
var payMethodOpen = null;
function togglePayMethod(method) {
  // Toggle card fields panel
  var cf = document.getElementById('card-fields');
  if(cf){
    if(method === 'card'){
      var isOpen = cf.classList.contains('open');
      cf.classList.toggle('open', !isOpen);
      var btn = document.getElementById('pm-btn-card');
      if(btn) btn.classList.toggle('active', !isOpen);
    } else {
      cf.classList.remove('open');
      var cardBtn = document.getElementById('pm-btn-card');
      if(cardBtn) cardBtn.classList.remove('active');
    }
  }
  // Highlight selected method
  ['card','apple','zelle'].forEach(function(m){
    var b = document.getElementById('pm-btn-'+m);
    if(b) b.classList.toggle('active', m === method && method !== 'card');
  });
  payMethodOpen = method;
}
function formatCardNumber(input) {
  var v = input.value.replace(/\\D/g,'').substring(0,16);
  var parts = [];
  for(var i=0; i<v.length; i+=4) parts.push(v.substring(i,i+4));
  input.value = parts.join(' ');
}
function formatExpiry(input) {
  var v = input.value.replace(/\\D/g,'');
  if(v.length >= 2) v = v.substring(0,2) + ' / ' + v.substring(2,4);
  input.value = v;
}


function setEntityForm(type, el) {
  selectedEntity = type;
  formData.entity = type;
  // Update UI
  ['form-et-llc','form-et-corp'].forEach(function(id){
    var c = document.getElementById(id);
    if(c) c.classList.remove('active');
  });
  if(el) el.classList.add('active');
  // Update main page entity buttons too
  setEntity(type);
  updateTotal();
}

function setFilerForm(type, el) {
  formData.filer = type;
  ['form-filer-ind','form-filer-co'].forEach(function(id){
    var c = document.getElementById(id);
    if(c) c.classList.remove('active');
  });
  if(el) el.classList.add('active');
  var af = document.getElementById('agent-fields');
  if(af) af.style.display = type === 'company' ? 'block' : 'none';
}
(function(){var l=localStorage.getItem('flbc_lang');if(l&&l!=='en')setLang(l);})();

var fmCurrentStep = 1;
var fmTotalSteps  = 9;
var fmData = {
  entity: 'llc', bizAddrType: 'virtual', agentType: 'ours',
  bizName: '',
  designator: 'LLC',
  speed: 'standard',
  contact: { fname:'', lname:'', email:'', phone:'' },
  address: { street:'', street2:'', city:'', state:'', zip:'', country:'US' },
  vma: true,
  package: 'standard',
  members: [{ type:'individual', fname:'', lname:'', own:100, title:'', useCompanyAddr:true }],
  ra: 'us',
  addons: { ein:false, oa:false, itin:false, ar:false },
  payment: 'card'
};

var fmStepTitles = [
  'Business Setup',
  'Processing Speed & Contact Info',
  'Business Address',
  'Your Formation Package',
  'Ownership & Management',
  'Registered Agent',
  'Boost Your Formation',
  'Review Your Order',
  'Secure Payment'
];

// ═══════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════
function fmGoToStep(n) {
  document.querySelectorAll('.fm-step').forEach(function(s){ s.classList.remove('active'); });
  var el = document.getElementById('fms' + n);
  if(el) { el.classList.add('active'); fmCurrentStep = n; }
  fmUpdateProgress();
  fmUpdateSummary();
  if(n === 4) fmBuildUpgradeCards();

  if(n === 7) fmFilterAddons();
  if(n === 8) fmBuildReview();
  if(!_fmRestoring) {
    history.pushState({ fmStep: n }, '', window.location.pathname);
    fmSaveProgress();
  }
  window.scrollTo(0, 0);
  var overlay = document.getElementById('formOverlay');
  if(overlay) overlay.scrollTo(0, 0);
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  setTimeout(function(){ fmTranslate(isEs ? 'es' : 'en'); }, 30);
}

function fmNext() {
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  if(fmCurrentStep===1){
    var nameEl=document.getElementById('inp-bizname');
    var desEl=document.getElementById('inp-designator');
    if(!nameEl||!nameEl.value.trim()){nameEl.style.borderColor='#ef4444';nameEl.focus();alert(isEs?'Por favor ingresa el nombre de tu negocio.':'Please enter your business name.');return;}
    if(!desEl||!desEl.value){desEl.style.borderColor='#ef4444';desEl.focus();alert(isEs?'Por favor selecciona cómo debe terminar el nombre.':'Please select how your business name must end.');return;}
    nameEl.style.borderColor='';desEl.style.borderColor='';
    // Validate authorized shares for Corporation
    if(fmData.entity==='corp'||(window.selectedEntity==='corp')){
      var sharesEl=document.getElementById('inp-shares');
      if(!sharesEl||!sharesEl.value||parseInt(sharesEl.value)<1){
        if(sharesEl){sharesEl.style.borderColor='#ef4444';sharesEl.focus();}
        alert(isEs?'Por favor ingresa el número de acciones autorizadas (mínimo 1).':'Please enter the number of authorized shares (minimum 1).');return;
      }
      if(sharesEl)sharesEl.style.borderColor='';
      fmData.authorizedShares=sharesEl.value;
    }
    // Save effective date if provided
    var effdateEl=document.getElementById('inp-effdate');
    if(effdateEl&&effdateEl.value) fmData.effectiveDate=effdateEl.value;
  }
  if(fmCurrentStep===2){
    var req2=[
      {id:'inp-fname',msg:isEs?'Por favor ingresa tu nombre.':'Please enter your first name.'},
      {id:'inp-lname',msg:isEs?'Por favor ingresa tu apellido.':'Please enter your last name.'},
      {id:'inp-email',msg:isEs?'Por favor ingresa tu correo.':'Please enter your email.'},
      {id:'inp-phone',msg:isEs?'Por favor ingresa tu teléfono.':'Please enter your phone number.'},
    ];
    for(var fi=0;fi<req2.length;fi++){
      var fe=document.getElementById(req2[fi].id);
      if(!fe||!fe.value.trim()){if(fe){fe.style.borderColor='#ef4444';fe.focus();}alert(req2[fi].msg);return;}
      if(fe)fe.style.borderColor='';
    }
    var emailEl=document.getElementById('inp-email');
    if(emailEl&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(emailEl.value.trim())){
      emailEl.style.borderColor='#ef4444';emailEl.focus();
      alert(isEs?'Por favor ingresa un correo válido.':'Please enter a valid email address.');return;
    }
    if(emailEl)emailEl.style.borderColor='';
    // Confirm email validation
    var emailConfEl=document.getElementById('inp-email-confirm');
    if(!emailConfEl||!emailConfEl.value.trim()){
      if(emailConfEl){emailConfEl.style.borderColor='#ef4444';emailConfEl.focus();}
      alert(isEs?'Por favor confirma tu correo electrónico.':'Please confirm your email address.');return;
    }
    if(emailEl&&emailConfEl&&emailEl.value.trim()!==emailConfEl.value.trim()){
      emailConfEl.style.borderColor='#ef4444';emailConfEl.focus();
      alert(isEs?'Los correos no coinciden. Por favor verifica.':'Emails do not match. Please check and try again.');return;
    }
    if(emailConfEl)emailConfEl.style.borderColor='';
    var phoneEl=document.getElementById('inp-phone');
    if(phoneEl&&/[a-zA-Z]/.test(phoneEl.value)){phoneEl.style.borderColor='#ef4444';phoneEl.focus();alert(isEs?'El teléfono solo debe contener números.':'Phone must contain only digits.');return;}
    if(phoneEl)phoneEl.style.borderColor='';
    if(!fmData.bizAddrType||fmData.bizAddrType==='own'){
      var addrReq=[
        {id:'inp-addr',msg:isEs?'Por favor ingresa la dirección.':'Please enter your street address.'},
        {id:'inp-city',msg:isEs?'Por favor ingresa la ciudad.':'Please enter your city.'},
        {id:'inp-zip',msg:isEs?'Por favor ingresa el código postal.':'Please enter your ZIP code.'},
      ];
      for(var ai=0;ai<addrReq.length;ai++){
        var ae=document.getElementById(addrReq[ai].id);
        if(!ae||!ae.value.trim()){if(ae){ae.style.borderColor='#ef4444';ae.focus();}alert(addrReq[ai].msg);return;}
        if(ae)ae.style.borderColor='';
      }
      var bc=document.getElementById('inp-biz-country');
      if(bc&&bc.value==='US'){var st=document.getElementById('inp-state');if(!st||!st.value){if(st){st.style.borderColor='#ef4444';st.focus();}alert(isEs?'Por favor selecciona el estado.':'Please select your state.');return;}if(st)st.style.borderColor='';}
    }
    // Validate organizer / incorporator signature
    var orgSigEl=document.getElementById('inp-org-sig');
    if(!orgSigEl||!orgSigEl.value.trim()){
      if(orgSigEl){orgSigEl.style.borderColor='#ef4444';orgSigEl.focus();}
      alert(isEs?'Por favor ingresa tu firma electrónica como Organizador/Incorporador.':'Please enter your electronic signature as Organizer / Incorporator.');return;
    }
    if(orgSigEl){orgSigEl.style.borderColor='';fmData.orgSignature=orgSigEl.value.trim();}
  }
  if(fmCurrentStep===3){
    if(fmData.agentType==='own'){
      var agReq=[
        {id:'inp-ra-name',msg:isEs?'Por favor ingresa el nombre del agente.':'Please enter the Registered Agent name.'},
        {id:'inp-ra-street',msg:isEs?'Por favor ingresa la dirección del agente.':'Please enter the Registered Agent address.'},
        {id:'inp-ra-city',msg:isEs?'Por favor ingresa la ciudad.':'Please enter the city.'},
        {id:'inp-ra-zip',msg:isEs?'Por favor ingresa el ZIP.':'Please enter the ZIP.'},
        {id:'inp-ra-sig',msg:isEs?'Por favor ingresa tu firma electrónica.':'Please enter your electronic signature.'},
      ];
      for(var ri=0;ri<agReq.length;ri++){
        var re3=document.getElementById(agReq[ri].id);
        if(!re3||!re3.value.trim()){if(re3){re3.style.borderColor='#ef4444';re3.focus();}alert(agReq[ri].msg);return;}
        if(re3)re3.style.borderColor='';
      }
    }
  }
  if(fmCurrentStep===5){
    var m1isInd = document.getElementById('s5-m1-ind') && document.getElementById('s5-m1-ind').classList.contains('selected');
    if(m1isInd) {
      // Validate name and role
      var m1base=[
        {id:'s5-m1-fname', msg:isEs?'Por favor ingresa el nombre del miembro 1.':'Please enter Member 1 first name.'},
        {id:'s5-m1-lname', msg:isEs?'Por favor ingresa el apellido del miembro 1.':'Please enter Member 1 last name.'},
        {id:'s5-m1-role',  msg:isEs?'Por favor selecciona el título del miembro 1.':'Please select Member 1 title/role.'},
      ];
      for(var mi5=0;mi5<m1base.length;mi5++){
        var mb5=document.getElementById(m1base[mi5].id);
        if(!mb5||!mb5.value.trim()){if(mb5){mb5.style.borderColor='#ef4444';mb5.focus();}alert(m1base[mi5].msg);return;}
        if(mb5)mb5.style.borderColor='';
      }
      // Address validation — check rendered fields (addr and city always present)
      var addrEl=document.getElementById('s5-m1-addr');
      var cityEl=document.getElementById('s5-m1-city');
      if(!addrEl||!addrEl.value.trim()){
        if(addrEl){addrEl.style.borderColor='#ef4444';addrEl.focus();}
        alert(isEs?'Por favor ingresa la dirección del miembro 1.':'Please enter Member 1 street address.');return;
      }
      if(addrEl)addrEl.style.borderColor='';
      if(!cityEl||!cityEl.value.trim()){
        if(cityEl){cityEl.style.borderColor='#ef4444';cityEl.focus();}
        alert(isEs?'Por favor ingresa la ciudad del miembro 1.':'Please enter Member 1 city.');return;
      }
      if(cityEl)cityEl.style.borderColor='';
      // State and ZIP — only validate if the field exists AND is visible (rendered for the selected country)
      var m1country = document.getElementById('s5-m1-country');
      var countryVal = m1country ? m1country.value : 'US';
      var stEl=document.getElementById('s5-m1-state');
      var zpEl=document.getElementById('s5-m1-zip');
      var fmt5 = _addrFmt[countryVal] || _addrFmt['other'];
      if(stEl && stEl.offsetParent !== null && fmt5.state) {
        if(!stEl.value.trim()){stEl.style.borderColor='#ef4444';stEl.focus();alert(isEs?'Por favor ingresa el estado/región.':'Please enter the state/region.');return;}
        stEl.style.borderColor='';
      }
      if(zpEl && zpEl.offsetParent !== null && fmt5.zip) {
        if(!zpEl.value.trim()){zpEl.style.borderColor='#ef4444';zpEl.focus();alert(isEs?'Por favor ingresa el código postal.':'Please enter the postal code.');return;}
        zpEl.style.borderColor='';
      }
    } else {
      var m1coReq=[
        {id:'s5-m1-coname', msg:isEs?'Por favor ingresa el nombre de la empresa.':'Please enter the company name.'},
        {id:'s5-m1-corole', msg:isEs?'Por favor selecciona el título.':'Please select the title/role.'},
        {id:'s5-m1-coaddr', msg:isEs?'Por favor ingresa la dirección de la empresa.':'Please enter the company address.'},
        {id:'s5-m1-cocity', msg:isEs?'Por favor ingresa la ciudad.':'Please enter the city.'},
      ];
      for(var ci5=0;ci5<m1coReq.length;ci5++){
        var ce5=document.getElementById(m1coReq[ci5].id);
        if(!ce5||!ce5.value.trim()){if(ce5){ce5.style.borderColor='#ef4444';ce5.focus();}alert(m1coReq[ci5].msg);return;}
        if(ce5)ce5.style.borderColor='';
      }
    }
  }
  // Validate addon extra fields
  if(fmCurrentStep===7){
    var isEs7 = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
    if(fmData.addons.ein) {
      // Check ID type selected
      var idType = document.querySelector('input[name="ein-id-type"]:checked');
      if(!idType) { alert(isEs7?'Por favor indica si tienes SSN, ITIN, o ninguno.':'Please indicate if you have an SSN, ITIN, or neither.'); return; }
      if(idType.value === 'ssn') {
        var ssnEl = document.getElementById('inp-ein-ssn');
        var ssnConfEl = document.getElementById('inp-ein-ssn-confirm');
        if(!ssnEl||ssnEl.value.replace(/[^0-9]/g,'').length < 9) { if(ssnEl){ssnEl.style.borderColor='#ef4444';ssnEl.focus();} alert(isEs7?'Por favor ingresa tu SSN completo (9 dígitos).':'Please enter your complete SSN (9 digits).'); return; }
        if(ssnEl) ssnEl.style.borderColor='';
        if(!ssnConfEl||ssnConfEl.value.replace(/[^0-9]/g,'').length < 9) { if(ssnConfEl){ssnConfEl.style.borderColor='#ef4444';ssnConfEl.focus();} alert(isEs7?'Por favor confirma tu SSN.':'Please confirm your SSN.'); return; }
        if(ssnEl.value.replace(/[^0-9]/g,'') !== ssnConfEl.value.replace(/[^0-9]/g,'')) { ssnConfEl.style.borderColor='#ef4444'; ssnConfEl.focus(); alert(isEs7?'Los SSN no coinciden. Por favor verifica.':'SSNs do not match. Please check and try again.'); return; }
        if(ssnConfEl) ssnConfEl.style.borderColor='';
      }
      if(idType.value === 'itin') {
        var itinEl = document.getElementById('inp-ein-itin');
        var itinConfEl = document.getElementById('inp-ein-itin-confirm');
        if(!itinEl||itinEl.value.replace(/[^0-9]/g,'').length < 9) { if(itinEl){itinEl.style.borderColor='#ef4444';itinEl.focus();} alert(isEs7?'Por favor ingresa tu ITIN completo (9 dígitos).':'Please enter your complete ITIN (9 digits).'); return; }
        if(itinEl) itinEl.style.borderColor='';
        if(!itinConfEl||itinConfEl.value.replace(/[^0-9]/g,'').length < 9) { if(itinConfEl){itinConfEl.style.borderColor='#ef4444';itinConfEl.focus();} alert(isEs7?'Por favor confirma tu ITIN.':'Please confirm your ITIN.'); return; }
        if(itinEl.value.replace(/[^0-9]/g,'') !== itinConfEl.value.replace(/[^0-9]/g,'')) { itinConfEl.style.borderColor='#ef4444'; itinConfEl.focus(); alert(isEs7?'Los ITIN no coinciden. Por favor verifica.':'ITINs do not match. Please check and try again.'); return; }
        if(itinConfEl) itinConfEl.style.borderColor='';
      }
      // Check activity
      var actVal = document.getElementById('ein-activity-val');
      if(!actVal||!actVal.value) {
        var srch = document.getElementById('ein-activity-search');
        if(srch){srch.style.borderColor='#ef4444';srch.focus();}
        alert(isEs7?'Por favor selecciona la actividad principal de tu negocio.':'Please select your business principal activity.'); return;
      }
      if(actVal) { var srch2=document.getElementById('ein-activity-search'); if(srch2) srch2.style.borderColor=''; }
      // Check description
      var descEl = document.getElementById('inp-ein-activity-desc');
      if(!descEl||!descEl.value.trim()) { if(descEl){descEl.style.borderColor='#ef4444';descEl.focus();} alert(isEs7?'Por favor describe tu producto o servicio específico.':'Please describe your specific product or service.'); return; }
      if(descEl) descEl.style.borderColor='';
    }
    if(fmData.addons.oa) {
      var oaPanel = document.getElementById('oa-extra-fields');
      if(oaPanel && oaPanel.style.display !== 'none') {
        var oaTotal = 0;
        document.querySelectorAll('[id^="oa-m"][id$="-own"]').forEach(function(inp){ var v=parseFloat(inp.value); if(!isNaN(v)) oaTotal+=v; });
        if(oaTotal !== 100) { alert(isEs7?'El total de propiedad debe ser 100% para el Acuerdo Operativo.':'Total ownership must equal 100% for the Operating Agreement.'); return; }
      }
    }
  }
  var next=fmCurrentStep+1;
  // Skip step 4 if Premium
  if(next===4&&fmData.package==='premium'){next=5;}
  // Skip step 6 (registered agent now in step 3)
  if(next===6){next=7;}
  if(next<=fmTotalSteps){fmGoToStep(next);}else{fmSubmit();}
}

function fmBack() {
  var prev = fmCurrentStep - 1;
  if(prev === 6) prev = 5;
  if(prev === 4 && fmData.package === 'premium') prev = 3;
  if(prev >= 1) fmGoToStep(prev);
}

function fmUpdateProgress() {
  var pct = Math.round((fmCurrentStep / fmTotalSteps) * 100);
  var fill = document.getElementById('fp-fill');
  if(fill) fill.style.width = pct + '%';
  var pctEl = document.getElementById('fp-pct');
  if(pctEl) pctEl.textContent = 'Step ' + fmCurrentStep + ' of ' + fmTotalSteps;
  var titleEl = document.getElementById('fp-step-title');
  if(titleEl) titleEl.textContent = fmStepTitles[fmCurrentStep - 1] || 'Complete Your Order';
}

// ═══════════════════════════════════════════════════════
// STEP LOGIC
// ═══════════════════════════════════════════════════════
function fmSetEntity(type, el) {
  fmData.entity = type;
  selectedEntity = type;
  ['fms-et-llc','fms-et-corp'].forEach(function(id){
    var c = document.getElementById(id);
    if(c) c.classList.remove('selected');
  });
  if(el) el.classList.add('selected');
  // Update designator options
  var des = document.getElementById('inp-designator');
  if(des) {
    if(type === 'corp') {
      des.innerHTML='<option value="">-- Select --</option><option value="Corp">Corp</option><option value="Inc">Inc</option><option value="Corporation">Corporation</option><option value="Incorporated">Incorporated</option>';
    } else {
      des.innerHTML='<option value="">-- Select --</option><option value="LLC">LLC</option><option value="L.L.C.">L.L.C.</option><option value="Limited Liability Company">Limited Liability Company</option>';
    }
  }
  // Show authorized shares only for Corporation
  var sharesWrap = document.getElementById('s1-shares-wrap');
  if(sharesWrap) sharesWrap.style.display = (type === 'corp') ? 'block' : 'none';
  // Update mailing address divider label based on entity
  var mailEntity = document.getElementById('s3-mail-divider-entity');
  if(mailEntity) mailEntity.textContent = (type === 'corp') ? 'Corporation' : 'LLC';
  // Hide "Company" member type option entirely for Corporation
  var coBtn1 = document.getElementById('s5-m1-co');
  if(coBtn1) {
    coBtn1.style.display = (type === 'corp') ? 'none' : '';
    // If company was selected and we switch to corp, reset to individual
    if(type === 'corp' && coBtn1.classList.contains('selected')) {
      fmSetMemberType(1, 'individual', document.getElementById('s5-m1-ind'));
    }
  }
  // Disable Director option for company member type when Corp
  var dirOpt = document.getElementById('s5-m1-corole-dir');
  if(dirOpt) {
    dirOpt.disabled = (type === 'corp');
    dirOpt.title = (type === 'corp') ? 'Directors must be individuals for Corporations' : '';
    var corole = document.getElementById('s5-m1-corole');
    if(corole && corole.value === 'D' && type === 'corp') corole.value = '';
  }
  fmUpdateBizName();
  fmUpdateSummary();
}

function fmUpdateBizName(val) {
  if(val !== undefined) fmData.bizName = val;
  var nameEl = document.getElementById('inp-bizname');
  var desEl  = document.getElementById('inp-designator');
  if(!nameEl || !desEl) return;
  var name = nameEl.value.trim();
  var des  = desEl.value;
  if(!name) { document.getElementById('bizname-preview-wrap').style.display='none'; return; }
  fmData.bizName = name;
  fmData.designator = des;
  var full = name + ' ' + des;
  document.getElementById('bizname-preview').textContent = full;
  document.getElementById('bizname-preview-wrap').style.display = 'block';
  // Update summary biz name
  var bn = document.getElementById('sum-biz-name');
  if(bn) { bn.textContent = full; bn.style.display = 'block'; }
  fmUpdateSummary();
}

function fmSetSpeed(type, el) {
  fmData.speed = type;
  ['speed-exp','speed-std'].forEach(function(id){
    var c = document.getElementById(id);
    if(c) c.classList.remove('selected');
  });
  if(el) el.classList.add('selected');
  fmUpdateSummary();
}

function fmSetVma(enabled, el) {
  fmData.vma = enabled;
  ['vma-yes','vma-no'].forEach(function(id){
    var c = document.getElementById(id);
    if(c) c.classList.remove('selected');
  });
  if(el) el.classList.add('selected');
  var info = document.getElementById('vma-info');
  if(info) info.style.display = enabled ? 'flex' : 'none';
  fmUpdateSummary();
}

function fmUpgradePkg(pkg, el) {
  fmData.package = pkg;
  formData.package = pkg;
  ['up-pkg-basic','up-pkg-standard','up-pkg-premium'].forEach(function(id){
    var c = document.getElementById(id);
    if(c) c.classList.remove('selected');
  });
  if(el) el.classList.add('selected');
  fmUpdateSummary();
}

function fmSetRA(type, el) {
  fmData.ra = type;
  ['ra-us','ra-own'].forEach(function(id){
    var c = document.getElementById(id);
    if(c) c.classList.remove('selected');
  });
  if(el) el.classList.add('selected');
  var own = document.getElementById('ra-own-fields');
  if(own) own.style.display = type === 'own' ? 'block' : 'none';
}

function fmToggleAddon(key, el) {
  fmData.addons[key] = !fmData.addons[key];
  if(el) el.classList.toggle('selected', fmData.addons[key]);
  var chk = document.getElementById(key + '-check');
  if(chk) {
    if(fmData.addons[key]) {
      chk.style.background = '#2563eb';
      chk.style.borderColor = '#2563eb';
      chk.innerHTML = '<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else {
      chk.style.background = '';
      chk.style.borderColor = '#d1d5db';
      chk.innerHTML = '';
    }
  }
  // Handle package inclusions
  if(key === 'ein' && (fmData.package === 'standard' || fmData.package === 'premium')) {
    fmData.addons.ein = false;
    if(el) el.classList.remove('selected');
    alert('EIN is already included in your ' + fmData.package + ' package!');
    return;
  }
  if(key === 'oa' && fmData.package === 'premium') {
    fmData.addons.oa = false;
    if(el) el.classList.remove('selected');
    alert('Operating Agreement is already included in your Premium package!');
    return;
  }
  // Show/hide conditional extra fields
  if(key === 'ein') fmShowEinFields(fmData.addons.ein);
  if(key === 'oa')  fmShowOaFields(fmData.addons.oa);
  fmUpdateSummary();
}



function fmToggleMemberAddr(n, chk) {
  var own = document.getElementById('m' + n + '-own-addr');
  if(own) own.style.display = chk.checked ? 'none' : 'block';
}

function fmUpdateMembers(count) {
  var wrap = document.getElementById('add-member-wrap');
  if(wrap) wrap.style.display = parseInt(count) > 1 ? 'block' : 'none';
}



function fmSelectPayMethod(method, el) {
  fmData.payment = method;
  ['pay-card','pay-zelle','pay-apple'].forEach(function(id){
    var c = document.getElementById(id);
    if(c) { c.classList.remove('selected'); c.querySelector('.fm-choice-radio').style.background=''; c.querySelector('.fm-choice-radio').style.borderColor='#d1d5db'; }
  });
  if(el) {
    el.classList.add('selected');
    var radio = el.querySelector('.fm-choice-radio');
    if(radio) { radio.style.background='#f97316'; radio.style.borderColor='#f97316'; }
  }
  var cardFields = document.getElementById('card-fields-wrap');
  if(cardFields) cardFields.style.display = method === 'card' ? 'block' : 'none';
}

function fmToggleBillingAddr(chk) {
  var fields = document.getElementById('billing-addr-fields');
  if(fields) fields.style.display = chk.checked ? 'none' : 'block';
}

function fmFormatCard(input) {
  var v = input.value.replace(/\\D/g,'').substring(0,16);
  input.value = v.replace(/(\\d{4})/g,'$1 ').trim();
}

function fmFormatExpiry(input) {
  var v = input.value.replace(/\\D/g,'').substring(0,4);
  if(v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
  input.value = v;
}

// ═══════════════════════════════════════════════════════
// ORDER SUMMARY UPDATE
// ═══════════════════════════════════════════════════════
function fmUpdateSummary() {
  var pkg = fmData.package || 'standard';
  var prices = { basic:49, standard:149, premium:249 };
  var base   = prices[pkg] || 149;
  var state  = fmData.entity === 'corp' ? 70 : 125;
  var extras = 0;
  if(fmData.addons.ein)  extras += 49;
  if(fmData.addons.oa)   extras += 79;
  if(fmData.addons.itin) extras += 69;
  var expFree = pkg === 'premium';
  if(fmData.speed === 'expedited' && !expFree) extras += 99;
  var total = base + state + extras;
  var pkgNames = { basic:'Basic — $49', standard:'Standard — $149', premium:'Premium — $249' };
  // Update all summary panels
  document.querySelectorAll('.sum-entity-val').forEach(function(el){ el.textContent = fmData.entity === 'corp' ? 'Corporation' : 'LLC'; });
  document.querySelectorAll('.sum-pkg-val').forEach(function(el){ el.textContent = pkgNames[pkg]; });
  document.querySelectorAll('.sum-state-val').forEach(function(el){ el.textContent = '$' + state; });
  document.querySelectorAll('.sum-total-val').forEach(function(el){ el.textContent = '$' + total; });
  document.querySelectorAll('.sum-exp-line').forEach(function(el){ el.style.display = fmData.speed==='expedited'&&!expFree?'':'none'; });
  document.querySelectorAll('.sum-vma-line').forEach(function(el){ el.style.display = fmData.vma?'':'none'; });
  document.querySelectorAll('.sum-ein-line').forEach(function(el){ el.style.display = fmData.addons.ein&&pkg==='basic'?'':'none'; });
  document.querySelectorAll('.sum-oa-line').forEach(function(el){ el.style.display = fmData.addons.oa&&pkg!=='premium'?'':'none'; });
  document.querySelectorAll('.sum-itin-line').forEach(function(el){ el.style.display = fmData.addons.itin?'':'none'; });
  document.querySelectorAll('.sum-ar-line').forEach(function(el){ el.style.display = fmData.addons.ar?'':'none'; });
  // Legacy compatibility
  formData.package = pkg;
  formData.entity  = fmData.entity;
  selectedEntity   = fmData.entity;
}

// ═══════════════════════════════════════════════════════
// ORDER REVIEW BUILD
// ═══════════════════════════════════════════════════════
function fmBuildReview() {
  var fn = document.getElementById('inp-fname');
  var ln = document.getElementById('inp-lname');
  var em = document.getElementById('inp-email');
  var ph = document.getElementById('inp-phone');
  var st = document.getElementById('inp-street');
  var ci = document.getElementById('inp-city');
  var sp = document.getElementById('inp-state');
  var zp = document.getElementById('inp-zip');
  var m1fn = document.getElementById('inp-m1-fname');
  var m1ln = document.getElementById('inp-m1-lname');
  var m1own = document.getElementById('inp-m1-own');
  var bizEl = document.getElementById('inp-bizname');
  var desEl = document.getElementById('inp-designator');
  var fullBiz = bizEl ? (bizEl.value.trim() + ' ' + (desEl?desEl.value:'LLC')) : '—';
  
  var rv = document.getElementById('review-biz-name');
  if(rv) rv.textContent = fullBiz;
  var bn = document.getElementById('sum-biz-name');
  if(bn) { bn.textContent = fullBiz; bn.style.display='block'; }
  
  var el;
  el = document.getElementById('rev-entity-val'); if(el) el.textContent = fmData.entity==='corp'?'Corporation':'LLC';
  el = document.getElementById('rev-pkg-val');    if(el) el.textContent = fmData.package.charAt(0).toUpperCase()+fmData.package.slice(1);
  el = document.getElementById('rev-speed-val');  if(el) el.textContent = fmData.speed==='expedited'?'Expedited (1-3 days)':'Standard (7-10 days)';
  el = document.getElementById('rev-name-val');   if(el) el.textContent = (fn?fn.value:'') + ' ' + (ln?ln.value:'');
  el = document.getElementById('rev-email-val');  if(el) el.textContent = em?em.value:'—';
  el = document.getElementById('rev-phone-val');  if(el) el.textContent = ph?ph.value:'—';
  el = document.getElementById('rev-addr-val');   if(el) el.textContent = (st?st.value:'') + ', ' + (ci?ci.value:'') + ', ' + (sp?sp.value:'') + ' ' + (zp?zp.value:'');
  el = document.getElementById('rev-m1-val');     if(el) el.textContent = (m1fn?m1fn.value:'') + ' ' + (m1ln?m1ln.value:'') + (m1own?' ('+m1own.value+'%)':'');
  
  // Show addons section if any selected
  var anyAddon = fmData.addons.ein || fmData.addons.oa || fmData.addons.itin || fmData.addons.ar;
  var addSec = document.getElementById('rev-addons-section');
  if(addSec) addSec.style.display = anyAddon ? 'block' : 'none';
  var addBody = document.getElementById('rev-addons-body');
  if(addBody && anyAddon) {
    var items = [];
    if(fmData.addons.ein)  items.push('<div class="fm-review-field"><label>EIN / Tax ID</label><span>$49</span></div>');
    if(fmData.addons.oa)   items.push('<div class="fm-review-field"><label>Operating Agreement</label><span>$79</span></div>');
    if(fmData.addons.itin) items.push('<div class="fm-review-field"><label>ITIN Application</label><span>$69</span></div>');
    if(fmData.addons.ar)   items.push('<div class="fm-review-field"><label>Annual Report Service</label><span>Annual</span></div>');
    addBody.innerHTML = '<div class="fm-review-grid">' + items.join('') + '</div>';
  }
}

// ═══════════════════════════════════════════════════════
// FAQ / ACCORDION
// ═══════════════════════════════════════════════════════
function fmToggleFaq(btn) {
  var icon = btn.querySelector('.fm-faq-icon');
  var body = btn.nextElementSibling;
  if(!body) return;
  var isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  if(icon) icon.classList.toggle('open', !isOpen);
}

function fmToggleAcc(btn) {
  var body = btn.nextElementSibling;
  if(!body) return;
  body.classList.toggle('open');
  var arrow = btn.querySelector('span:last-child');
  if(arrow) arrow.textContent = body.classList.contains('open') ? '&#9650;' : '&#9660;';
}

// ═══════════════════════════════════════════════════════
// SUBMIT
// ═══════════════════════════════════════════════════════
async function fmSubmit() {
  var isEsS = !!(document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active'));

  if(!document.getElementById('chk-agree') || !document.getElementById('chk-agree').checked) {
    alert(isEsS
      ? 'Por favor acepta los T\u00e9rminos de Servicio antes de continuar.'
      : 'Please agree to the Terms of Service before submitting.');
    return;
  }

  var btn = document.querySelector('.btn-submit-fm');
  if(btn) { btn.disabled = true; btn.textContent = isEsS ? 'Procesando...' : 'Processing...'; }

  // ── Helper: leer campo por ID ─────────────────────────────────────────────
  function val(id) {
    var el = document.getElementById(id);
    return (el && el.value) ? el.value.trim() : '';
  }

  // ── Datos de contacto ─────────────────────────────────────────────────────
  var fname   = val('inp-fname');
  var lname   = val('inp-lname');
  var email   = val('inp-email');
  var phone   = val('inp-phone');
  var country = val('inp-phone-country') || 'US';

  // ── Nombres propuestos de empresa ─────────────────────────────────────────
  var biz1 = val('inp-bizname');
  var des1 = val('inp-designator');
  var biz2 = val('inp-bizname2');
  var des2 = val('inp-designator2');
  var biz3 = val('inp-bizname3');
  var des3 = val('inp-designator3');

  function buildName(b, d) { return b ? (d ? b + ' ' + d : b).trim() : null; }
  var companyName  = buildName(biz1, des1);
  var companyName2 = buildName(biz2, des2);
  var companyName3 = buildName(biz3, des3);

  // ── Direcci\u00f3n del negocio ─────────────────────────────────────────────────
  var addrParts = [val('inp-addr'), val('inp-street2'), val('inp-city'), val('inp-state'), val('inp-zip')]
    .filter(function(x){ return !!x; });
  var businessAddress = addrParts.length ? addrParts.join(', ') : null;

  // ── Firma del organizador ─────────────────────────────────────────────────
  var orgSignature = val('inp-org-sig') || null;

  // ── Estado global fmData ──────────────────────────────────────────────────
  var fd      = (typeof fmData !== 'undefined') ? fmData : {};
  var entity  = fd.entity  || 'llc';
  var pkg     = fd.package || 'basic';
  var speed   = fd.speed   || 'standard';
  var members = (fd.members && fd.members.length) ? fd.members : null;
  var ra      = fd.ra      || 'us';
  var addons  = fd.addons  || {};

  // ── Calcular monto total (igual que el formulario) ────────────────────────
  var pkgPrices = { basic: 49, standard: 149, premium: 249 };
  var stateFee  = entity === 'corp' ? 70 : 125;
  var extras    = 0;
  if(addons.ein)  extras += 49;
  if(addons.oa)   extras += 79;
  if(addons.itin) extras += 69;
  if(speed === 'expedited' && pkg !== 'premium') extras += 99;
  var amount = (pkgPrices[pkg] || 49) + stateFee + extras;

  // ── Agente registrado (si es propio, capturar sus datos) ──────────────────
  var raInfo = null;
  if(ra === 'own') {
    raInfo = {
      name:    val('inp-ra-name'),
      street:  val('inp-ra-street'),
      street2: val('inp-ra-street2'),
      city:    val('inp-ra-city'),
      state:   val('inp-ra-state'),
      zip:     val('inp-ra-zip')
    };
  }

  // ── Payload completo ──────────────────────────────────────────────────────
  var payload = {
    firstName:       fname,
    lastName:        lname,
    email:           email,
    phone:           phone || null,
    country:         country,
    companyName:     companyName,
    companyName2:    companyName2,
    companyName3:    companyName3,
    entityType:      entity,
    businessAddress: businessAddress,
    speed:           speed,
    package:         pkg,
    amount:          amount,
    members:         members,
    registeredAgent: ra,
    addons:          { ein: !!addons.ein, oa: !!addons.oa, itin: !!addons.itin, ar: !!addons.ar, raInfo: raInfo },
    orgSignature:    orgSignature
  };

  try {
    var res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await res.json();
    if(res.ok && data.success) {
      fmClearProgress();
      var orderId = data.orderId || null;
      generateOrderNumber(orderId);
      var numEl = document.getElementById('finalOrderNum');
      if(numEl) numEl.textContent = orderNumber;
      document.querySelectorAll('.fm-step').forEach(function(s){ s.classList.remove('active'); });
      var suc = document.getElementById('fms-success');
      if(suc) suc.classList.add('active');
      var fill = document.getElementById('fp-fill');
      if(fill) fill.style.width = '100%';
      var pct = document.getElementById('fp-pct');
      if(pct) pct.textContent = 'Complete!';
      window.scrollTo(0, 0);
    } else {
      throw new Error((data && data.error) ? data.error : 'Error desconocido');
    }
  } catch(err) {
    console.error('fmSubmit error:', err);
    alert(isEsS
      ? 'Hubo un error procesando tu orden. Por favor int\u00e9ntalo de nuevo.'
      : 'There was an error processing your order. Please try again.');
    if(btn) { btn.disabled = false; btn.textContent = isEsS ? 'Procesar Orden' : 'Submit Order'; }
  }
}

// ═══════════════════════════════════════════════════════
// OPEN / CLOSE FORM
// ═══════════════════════════════════════════════════════
function openFormFromPkg(pkg) {
  if(pkg) { fmData.package = pkg; formData.package = pkg; }
  fmData.entity = selectedEntity || 'llc';
  // Sync package card selection
  ['basic','standard','premium'].forEach(function(p){
    var c = document.getElementById('up-pkg-' + p);
    if(c) c.classList.toggle('selected', p === pkg);
  });
  var overlay = document.getElementById('formOverlay');
  if(overlay) overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  fmGoToStep(1);
  fmUpdateSummary();
}

/* ── IP-BASED COUNTRY DETECTION ── */
var _detectedCountry = 'US'; // default
(function() {
  try {
    fetch('https://ipapi.co/json/')
      .then(function(r){ return r.json(); })
      .then(function(d) {
        var code = (d && d.country_code) ? d.country_code : 'US';
        _detectedCountry = code;
        fmApplyDetectedCountry(code);
      })
      .catch(function(){ /* silent fail, keep US default */ });
  } catch(e) {}
})();

function fmApplyDetectedCountry(code) {
  // Known countries in our dropdowns
  var known = ['US','AR','BR','CL','CO','CR','CU','DO','EC','ES','GB','GT','HN','MX','NI','PE','VE'];
  var use = known.indexOf(code) > -1 ? code : 'other';
  // Move detected country to position 2 (right after US) in each select
  var selIds = ['inp-biz-country','inp-mail-country','s5-m1-country'];
  selIds.forEach(function(id) {
    var sel = document.getElementById(id);
    if(!sel || use === 'US') return;
    var opt = sel.querySelector('option[value="' + use + '"]');
    var us  = sel.querySelector('option[value="US"]');
    if(opt && us && us.nextSibling !== opt) {
      sel.insertBefore(opt, us.nextSibling);
    }
  });
}

function fmBuildCountryOptions(selectEl) {
  if(!selectEl) return;
  fmApplyDetectedCountry(_detectedCountry);
}

/* ── IP-BASED COUNTRY DETECTION ── */
var _ipCountry = 'US';
var _ipDetected = false;
(function(){
  try {
    fetch('https://ipapi.co/json/')
      .then(function(r){ return r.json(); })
      .then(function(d){
        var code = (d && d.country_code) ? d.country_code : 'US';
        _ipCountry = code;
        _ipDetected = true;
        _fmMoveCountryToTop(code);
      }).catch(function(){});
  } catch(e){}
})();

function _fmMoveCountryToTop(code){
  var known = ['US','AR','BR','CL','CO','CR','CU','DO','EC','ES','GB','GT','HN','MX','NI','PE','VE'];
  var use = known.indexOf(code) > -1 ? code : null;
  if(!use || use === 'US') return; // US already first
  ['inp-biz-country','inp-mail-country','s5-m1-country'].forEach(function(id){
    var sel = document.getElementById(id);
    if(!sel) return;
    var opt = sel.querySelector('option[value="' + use + '"]');
    var first = sel.querySelector('option[value="US"]');
    if(opt && first && first.nextSibling !== opt){
      sel.insertBefore(opt.cloneNode(true), first.nextSibling);
      opt.remove();
    }
  });
}

function openForm() {
  fmMemberCount = 1;
  // Clear extra members
  var em = document.getElementById("s5-extra-members"); if(em) em.innerHTML = "";
  var overlay = document.getElementById('formOverlay');
  if(overlay) overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  history.pushState({ fmStep: 1 }, '', window.location.pathname);
  fmGoToStep(1);
  fmUpdateSummary();
  // Initialize dynamic address fields with default country (US)
  setTimeout(function() {
    // Apply IP-detected country if already resolved
    if(_ipDetected) _fmMoveCountryToTop(_ipCountry);
    var bizCountry = document.getElementById('inp-biz-country');
    if(bizCountry) fmBizCountryChange(bizCountry);
    var m1Country = document.getElementById('s5-m1-country');
    if(m1Country) fmMemberAddrChange('s5-m1', m1Country);
  }, 50);
}

function openFormEntity(entity) {
  selectedEntity = entity;
  fmData.entity  = entity;
  openForm();
}

function closeForm() {
  var overlay = document.getElementById('formOverlay');
  if(overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ═══════════════════════════════════════════════════════
// LOCAL STORAGE — guardar y restaurar progreso del formulario
// ═══════════════════════════════════════════════════════
var FM_STORAGE_KEY = 'mbf_form_progress';

var FM_FIELD_IDS = [
  'inp-bizname','inp-designator','inp-bizname2','inp-designator2','inp-bizname3','inp-designator3',
  'inp-fname','inp-lname','inp-email','inp-email-confirm','inp-phone','inp-phone-country',
  'inp-addr','inp-street2','inp-city','inp-state','inp-zip','inp-biz-country',
  'inp-org-sig','inp-ra-name','inp-ra-street','inp-ra-street2','inp-ra-city','inp-ra-state','inp-ra-zip','inp-ra-sig'
];

function fmSaveProgress() {
  if(fmCurrentStep < 2) return; // nothing meaningful to save at step 1
  var values = {};
  FM_FIELD_IDS.forEach(function(id) {
    var el = document.getElementById(id);
    if(el) values[id] = el.value;
  });
  try {
    localStorage.setItem(FM_STORAGE_KEY, JSON.stringify({
      step: fmCurrentStep,
      fmData: JSON.parse(JSON.stringify(fmData)),
      values: values
    }));
  } catch(e) {}
}

function fmClearProgress() {
  try { localStorage.removeItem(FM_STORAGE_KEY); } catch(e) {}
}

function fmRestoreProgress(progress) {
  if(progress.fmData) Object.assign(fmData, progress.fmData);
  var overlay = document.getElementById('formOverlay');
  if(overlay) overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  _fmRestoring = true;
  fmGoToStep(progress.step || 1);
  _fmRestoring = false;
  setTimeout(function() {
    if(progress.values) {
      Object.keys(progress.values).forEach(function(id) {
        var el = document.getElementById(id);
        if(el) el.value = progress.values[id];
      });
    }
    fmUpdateSummary();
  }, 50);
}

function fmShowResumeBanner(progress) {
  if(document.getElementById('fm-resume-banner')) return;
  var banner = document.createElement('div');
  banner.id = 'fm-resume-banner';
  banner.style.cssText = [
    'position:fixed','top:0','left:0','right:0','z-index:9999',
    'background:#1C2E44','color:#fff','padding:14px 24px',
    'display:flex','align-items:center','justify-content:center',
    'gap:16px','flex-wrap:wrap','font-family:Plus Jakarta Sans,sans-serif',
    'font-size:14px','box-shadow:0 2px 12px rgba(0,0,0,0.25)'
  ].join(';');
  var stepName = (fmStepTitles && fmStepTitles[progress.step - 1]) ? fmStepTitles[progress.step - 1] : ('Step ' + progress.step);
  banner.innerHTML =
    '<span style="font-weight:500">📋 You have an unfinished application <strong style="color:#F59E0B">(' + stepName + ')</strong>. Continue where you left off?</span>' +
    '<div style="display:flex;gap:8px">' +
      '<button onclick="fmResumeContinue()" style="background:#059669;color:#fff;border:none;border-radius:7px;padding:8px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Continue</button>' +
      '<button onclick="fmResumeStartOver()" style="background:transparent;color:#94a3b8;border:1px solid #475569;border-radius:7px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">Start Over</button>' +
    '</div>';
  document.body.appendChild(banner);
}

var _fmPendingResume = null;

function fmResumeContinue() {
  var banner = document.getElementById('fm-resume-banner');
  if(banner) banner.remove();
  if(_fmPendingResume) fmRestoreProgress(_fmPendingResume);
  _fmPendingResume = null;
}

function fmResumeStartOver() {
  var banner = document.getElementById('fm-resume-banner');
  if(banner) banner.remove();
  fmClearProgress();
  _fmPendingResume = null;
}

function fmCheckProgress() {
  try {
    var raw = localStorage.getItem(FM_STORAGE_KEY);
    if(!raw) return;
    var progress = JSON.parse(raw);
    if(progress && progress.step >= 2) {
      _fmPendingResume = progress;
      fmShowResumeBanner(progress);
    }
  } catch(e) {}
}
fmCheckProgress();

var _fmRestoring = false;
window.addEventListener('popstate', function(e) {
  var overlay = document.getElementById('formOverlay');
  var isOpen = overlay && overlay.classList.contains('active');
  if(e.state && typeof e.state.fmStep === 'number') {
    if(!isOpen) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    _fmRestoring = true;
    fmGoToStep(e.state.fmStep);
    _fmRestoring = false;
  } else if(isOpen) {
    closeForm();
  }
});

// ═══════════════════════════════════════════════════════
// TRANSLATIONS (basic form content)
// ═══════════════════════════════════════════════════════
var fmTranslations = {
  en: {
    fp_close: '✕ Close',
    s1_title: 'Company Information',
    s1_sub: 'Enter your business name below. Your name must end with LLC, Corp, or Inc.',
    s2_title: 'Your Information',
    s2_sub: 'The typical state filing time for Florida is <strong>7–10 business days</strong>. In a hurry? Select expedited filing for faster processing.',
    s3_title: 'Business Address',
    s3_sub: 'Please provide the name of the person responsible for this order whom we may contact if additional information is needed.',
    s4_title: 'Your Formation Package',
    s5_title: 'Ownership & Management',
    s6_title: 'Registered Agent',
    s7_title: 'Boost Your Formation',
    s8_title: 'Review Your Order',
    s9_title: 'Secure Payment',
    s10_title: '',
    continue: 'Continue',
    back: 'Back',
    sum_title: 'Order Summary'
  },
  es: {
    fp_close: '✕ Cerrar',
    s1_title: 'Información de la Empresa',
    s1_sub: 'Ingresa el nombre de tu negocio. El nombre debe terminar con LLC, Corp o Inc.',
    s2_title: 'Tu Información',
    s2_sub: 'El tiempo típico de tramitación en Florida es <strong>7–10 días hábiles</strong>. ¿Con prisa? Selecciona tramitación expedita.',
    s3_title: 'Dirección del Negocio',
    s3_sub: 'Por favor provee el nombre de la persona responsable de esta orden a quien podemos contactar si necesitamos información adicional.',
    s4_title: 'Tu Paquete de Formación',
    s5_title: 'Propiedad y Gestión',
    s6_title: 'Agente Registrado',
    s7_title: 'Mejora Tu Formación',
    s8_title: 'Revisa Tu Orden',
    s9_title: 'Pago Seguro',
    s10_title: 'Información de Pago',
    continue: 'Continuar',
    back: 'Volver',
    sum_title: 'Resumen de la Orden'
  }
};

function fmTranslate(lang) {
  var isEs=lang==='es';
  var tm={'s1-entity-divider':isEs?'\\u00bfQu\\u00e9 tipo de entidad est\\u00e1s formando?':'What type of entity are you forming?','s1-llc-desc':isEs?'Gesti\\u00f3n flexible \\u00b7 Pass-through \\u00b7 La m\\u00e1s popular':'Flexible management \\u00b7 Pass-through taxes \\u00b7 Most popular','s1-corp-lbl':isEs?'&#128202; Corporaci\\u00f3n':'&#128202; Corporation','s1-corp-desc':isEs?'Ideal para inversores \\u00b7 Emite acciones \\u00b7 Estructura formal':'Ideal for investors \\u00b7 Issue stock \\u00b7 Formal structure','s1-name-divider':isEs?'Nombre del Negocio':'Business Name','lbl-bizname':isEs?'Nombre Preferido *':'Preferred Business Name *','lbl-designator':isEs?'Debe terminar con *':'Must end with *','s1-fl-note-title':isEs?'Exigido por Florida:':'Required by Florida:','s1-fl-note-text':isEs?'Las LLC deben terminar con LLC, L.L.C. o Limited Liability Company. Las Corp con Corp, Inc, Corporation o Incorporated.':'LLCs must end with LLC, L.L.C., or Limited Liability Company. Corps must end with Corp, Inc, Corporation, or Incorporated.','lbl-preview':isEs?'Tu nombre oficial aparecer\\u00e1 como':'Your official name will appear as','alt-names-divider':isEs?'Nombres Alternativos':'Alternative Names','alt-names-sub':isEs?'(Opcional)':'(Optional)','alt1-opt-lbl':isEs?'Opcional':'Optional','alt2-opt-lbl':isEs?'Opcional':'Optional','lbl-bizname2':isEs?'Nombre Alternativo #1':'Alternative Name #1','lbl-bizname3':isEs?'Nombre Alternativo #2':'Alternative Name #2','s1-avail-text':isEs?'Verificamos tu nombre en los registros de Florida antes de tramitar.':'We verify your name in Florida records before filing.',
's1-shares-divider':isEs?'Acciones Autorizadas':'Authorized Shares',
'lbl-shares':isEs?'N\\u00famero de Acciones Autorizadas *':'Number of Authorized Shares *',
's1-shares-info-text':isEs?'Florida exige que cada Corporaci\\u00f3n declare el n\\u00famero total de acciones que est\\u00e1 autorizada a emitir. Este n\\u00famero queda registrado p\\u00fablicamente en los Art\\u00edculos de Incorporaci\\u00f3n. La mayor\\u00eda de corporaciones peque\\u00f1as usan 1,000 acciones o m\\u00e1s.':'Florida requires every Corporation to declare the total number of shares it is authorized to issue. Most small corporations use 1,000 or more shares.',
's1-effdate-divider':isEs?'Fecha Efectiva':'Effective Date',
's1-effdate-opt':isEs?'(Opcional)':'(Optional)',
's1-effdate-info-text':isEs?'D\\u00e9jalo en blanco para usar la fecha en que Florida apruebe tu tr\\u00e1mite. Puedes solicitar una fecha hasta 5 d\\u00edas h\\u00e1biles antes de enviar o hasta 90 d\\u00edas despu\\u00e9s.':'Leave blank to use the date Florida approves your filing. You may request a date up to 5 business days before submission or up to 90 days after.',
'lbl-effdate':isEs?'Fecha Efectiva Solicitada':'Requested Effective Date',
's2-sig-divider':isEs?'Firma Electr\\u00f3nica':'Electronic Signature',
's2-sig-info-text':isEs?'La ley de Florida requiere que el Organizador (LLC) o Incorporador (Corporaci\\u00f3n) firme el documento de formaci\\u00f3n. Al escribir tu nombre legal completo est\\u00e1s firmando electr\\u00f3nicamente los Art\\u00edculos bajo pena de perjurio.':'Florida law requires the Organizer (LLC) or Incorporator (Corporation) to sign the formation document. By typing your full legal name below you are electronically signing the Articles of Organization / Incorporation under penalty of perjury.',
'lbl-org-sig':isEs?'Firma Electr\\u00f3nica \\u2014 Organizador / Incorporador *':'Electronic Signature \\u2014 Organizer / Incorporator *',
'tt-shares':isEs?'Este es el n\\u00famero total de acciones que tu Corporaci\\u00f3n est\\u00e1 legalmente autorizada a emitir. Pi\\u00e9nsalo como el m\\u00e1ximo de "partes" en que puede dividirse tu empresa. La mayor\\u00eda de negocios peque\\u00f1os usan 1,000 acciones — da flexibilidad sin complicar las cosas.':'This is the total number of shares your Corporation is legally allowed to issue. Think of it like the maximum number of "ownership pieces" your company can ever have. Most small businesses use 1,000 shares — it gives you flexibility without overcomplicating things.',
'tt-effdate':isEs?'Esta es la fecha oficial en que tu negocio nace ante el Estado de Florida. Si la dejas en blanco, usamos el d\\u00eda en que Florida apruebe tu tr\\u00e1mite, lo cual funciona perfectamente para la mayor\\u00eda. Solo c\\u00e1mbiala si necesitas que tu empresa comience en una fecha espec\\u00edfica, como el 1 de enero por razones fiscales.':'This is the official date your business comes to life in Florida\\'s records. If you leave it blank, we use the day Florida approves your filing — which works perfectly for most people. You\\'d only change this if you need your business to start on a specific date, like January 1st for tax reasons.',
'tt-org-sig':isEs?'La ley de Florida requiere que la persona que forma el negocio firme el documento oficial. Al escribir tu nombre legal completo aqu\\u00ed, est\\u00e1s firmando electr\\u00f3nicamente los Art\\u00edculos de Organizaci\\u00f3n (LLC) o de Incorporaci\\u00f3n (Corporaci\\u00f3n) \\u2014 esto tiene el mismo valor legal que una firma de pu\\u00f1o y letra.':'Florida law requires the person forming the business to sign the official document. By typing your full legal name here, you are electronically signing the Articles of Organization (LLC) or Articles of Incorporation (Corporation) — this has the same legal value as a handwritten signature.',
'tt-ra':isEs?'El Agente Registrado es el punto de contacto oficial entre tu negocio y el Estado de Florida. Recibe notificaciones legales, demandas y correspondencia gubernamental en tu nombre. Toda LLC y Corporaci\\u00f3n en Florida est\\u00e1 obligada por ley a tener uno en todo momento.':'A Registered Agent is the official point of contact between your business and the State of Florida. They receive legal notices, lawsuits, and government mail on your behalf. Every Florida LLC and Corporation is required by law to have one at all times.',
'tt-ein':isEs?'El EIN es como el n\\u00famero de seguro social de tu negocio. El IRS lo exige para abrir una cuenta bancaria empresarial, contratar empleados y declarar impuestos. La mayor\\u00eda de los bancos no te dejar\\u00e1n abrir una cuenta de negocios sin uno.':'An EIN is like a Social Security Number for your business. The IRS requires it to open a business bank account, hire employees, and file taxes. Most banks won\\'t let you open a business account without one.',
'tt-oa':isEs?'Es el reglamento interno de tu negocio: define qui\\u00e9n posee qu\\u00e9, c\\u00f3mo se toman las decisiones y c\\u00f3mo se reparten las ganancias. Los bancos suelen pedirlo para abrir una cuenta corriente empresarial, y te protege legalmente si alg\\u00fan d\\u00eda hay una disputa entre socios.':'This is your business\\'s internal rulebook — it defines who owns what, how decisions are made, and how profits are divided. Banks typically ask for it when you open a business checking account, and it protects you legally if there\\'s ever a dispute between partners.',
'tt-itin':isEs?'El ITIN es tu número de identificación fiscal si no tienes Número de Seguro Social de EE.UU. <strong>La mayoría de los bancos de EE.UU. lo exigen para abrir una cuenta bancaria empresarial</strong> — sin él, la mayoría de los bancos te rechazarán. También es obligatorio para declarar tus impuestos federales como dueño de negocio extranjero. Si planeas abrir una cuenta bancaria u operar en EE.UU., obtener tu ITIN ahora evita retrasos más adelante.':'An ITIN (Individual Taxpayer Identification Number) is your tax ID if you don\\'t have a U.S. Social Security Number. <strong>The majority of U.S. banks require it to open a business bank account</strong> — without one, most banks will turn you away. It\\'s also required to file your federal taxes as a foreign national business owner. If you plan to open a bank account or operate in the U.S., getting your ITIN now avoids delays later.',
'ein-extra-header':isEs?'&#128203; Información adicional requerida para tu solicitud de EIN':'&#128203; Additional info needed for your EIN application',
'lbl-ein-rp-id':isEs?'SSN / ITIN del Responsable Principal *':'SSN / ITIN of Responsible Party *',
'ein-no-id-txt':isEs?'Soy extranjero — Solicitar ITIN <span style="font-size:.72rem;font-weight:600;color:#f59e0b;background:#fef3c7;padding:1px 6px;border-radius:4px;margin-left:2px">+$69</span>':'I\\'m a foreigner — Request ITIN <span style="font-size:.72rem;font-weight:600;color:#f59e0b;background:#fef3c7;padding:1px 6px;border-radius:4px;margin-left:2px">+$69</span>',
'lbl-ssn-1':isEs?'SSN *':'SSN *','lbl-ssn-2':isEs?'Confirmar SSN *':'Confirm SSN *','lbl-itin-1':isEs?'ITIN *':'ITIN *','lbl-itin-2':isEs?'Confirmar ITIN *':'Confirm ITIN *','ssn-privacy-note':isEs?'&#128274; Tu SSN está encriptado y nunca se almacena en texto simple.':'&#128274; Your SSN is encrypted and never stored in plain text.',
'itin-privacy-note':isEs?'&#128274; Tu ITIN está encriptado y nunca se almacena en texto simple.':'&#128274; Your ITIN is encrypted and never stored in plain text.',
'ein-warn-title':isEs?'Solicitud de ITIN agregada a tu orden':'ITIN Application added to your order',
'ein-warn-body':isEs?'Agregamos automáticamente la <strong>Solicitud de ITIN ($69)</strong> a tu orden. Los procesaremos juntos — una vez que el IRS te asigne tu ITIN, solicitaremos tu EIN de inmediato.':'We\\'ve automatically added the <strong>ITIN Application ($69)</strong> to your order. We\\'ll process both together — once your ITIN is issued by the IRS, we\\'ll immediately apply for your EIN.',
'ein-warn-itin-cta':isEs?'Tu información personal está protegida.':'Your personal information is protected.',
'ein-warn-itin-body':isEs?'Puedes eliminar el servicio de ITIN en cualquier momento antes de enviar tu orden.':'You can remove the ITIN service at any time before submitting your order.',
'lbl-ein-activity':isEs?'Actividad Principal del Negocio *':'Principal Business Activity *',
'lbl-ein-activity-desc':isEs?'Describe tu producto o servicio específico *':'Describe your specific product or service *',
'ein-desc-hint':isEs?'Sé específico — unas pocas palabras que describan exactamente qué vendes o haces.':'Be specific — a few words describing exactly what you sell or do.',
'lbl-ein-fiscal':isEs?'Mes de Cierre del Año Fiscal *':'Closing Month of Fiscal Year *',
'oa-extra-header':isEs?'Necesitamos un dato para completar tu Acuerdo Operativo':'We need one detail to complete your Operating Agreement','oa-extra-sub':isEs?'Solo tomará un momento':'This will only take a moment',
'oa-own-why':isEs?'Para preparar tu Acuerdo Operativo necesitamos saber <strong>qué porcentaje de la empresa posee cada miembro</strong>. Es un requisito legal — el Acuerdo Operativo debe especificar el porcentaje de propiedad de cada miembro para ser válido ante bancos e instituciones.<br/><span style=\\'display:block;margin-top:8px;font-size:.76rem;color:#065f46\\'>&#10003; Ya tenemos la información de tus miembros. Solo llena el % de cada uno abajo.</span>':'To prepare your Operating Agreement we need to know <strong>how much of the company each member owns</strong>. This is a legal requirement — your Operating Agreement must specify the ownership percentage of every member so it is valid for banking and legal purposes.<br/><span style=\\'display:block;margin-top:8px;font-size:.76rem;color:#065f46\\'>&#10003; We already have your members\\' information. Just fill in the % for each one below.</span>',
'tt-ar':isEs?'Cada negocio en Florida debe presentar un Reporte Anual para mantenerse activo ante el Estado. Esto aplica aunque tu negocio no haya iniciado operaciones — la ley no hace excepciones. La fecha l\\u00edmite es el 1 de mayo. Si no se presenta a tiempo, Florida cobra una multa de $400 autom\\u00e1tica. Si se ignora por completo, el Estado puede disolver tu empresa administrativamente.':'Every Florida business must file an Annual Report each year to stay active — even if your business has not started operating yet. The law makes no exceptions. The deadline is May 1st. Miss it and Florida automatically charges a $400 late fee. Keep ignoring it and the State can administratively dissolve your company.',
'fp-home-lbl':isEs?'Inicio':'Back to Home','s2-speed-divider':isEs?'Velocidad de Procesamiento':'Processing Speed','s2-fast-badge':isEs?'R\\u00c1PIDO':'FAST','s2-exp-lbl':isEs?'&#9889; Procesamiento Prioritario':'&#9889; Priority Processing','s2-exp-days':isEs?'Entrega en 1-3 d\\u00edas h\\u00e1biles':'Delivered in 1-3 business days','s2-exp-note':isEs?'Incluido gratis con Premium':'Included free with Premium','s2-std-lbl':isEs?'Procesamiento Est\\u00e1ndar':'Standard Processing','s2-std-days':isEs?'Normalmente 7-10 d\\u00edas h\\u00e1biles':'Typically 7-10 business days','s2-std-note':isEs?'Sin cargo adicional':'No additional charge','s2-disclaimer':isEs?'* Las fechas son estimadas.':'* Estimated dates may vary.','s2-contact-divider':isEs?'Informaci\\u00f3n de Contacto':'Contact Information','lbl-fname':isEs?'Nombre *':'First Name *','lbl-lname':isEs?'Apellido *':'Last Name *','lbl-email':isEs?'Correo Electr\\u00f3nico *':'Email *','lbl-email-confirm':isEs?'Confirmar Correo *':'Confirm Email *','lbl-phone':isEs?'Tel\\u00e9fono *':'Phone Number *','lbl-sms':isEs?'Acepto recibir actualizaciones por mensaje y teléfono.':'I agree to receive order updates by text and phone.',
'lbl-sms-opt':isEs?'(Opcional)':'(Optional)','sum-title-main':isEs?'Tu Orden':'Your Order',
    's3-sub':isEs?'Tu direcci\\u00f3n de negocio es parte del registro p\\u00fablico de Florida.':'Your business address becomes part of the public record in Florida.',
    's4-div-addr':isEs?'Direcci\\u00f3n de Correspondencia':'Contact Address',
    's4-addr-desc':isEs?'Esta direcci\\u00f3n se usa para correspondencia oficial del Estado, IRS y otras agencias.':'This address is used for official correspondence from the State, IRS, and other agencies.',
    'vma-info-text':isEs?'El USPS requiere verificar tu identidad antes de abrir tu correo. Lo completas desde tu panel de control.':'USPS requires identity verification before we can open and scan your mail. Complete this from your dashboard.',
    'lbl-street2':isEs?'Apto / Suite':'Address (Cont)',
    's4-sub':isEs?'Cada nivel incluye todo lo del nivel anterior.':'Each tier includes everything from the one below it.',
    's5-sub':isEs?'Cu\\u00e9ntanos qui\\u00e9n es due\\u00f1o y dirige este negocio.':'Tell us who owns and runs this business.',
    's6-sub':isEs?'La ley de Florida requiere que cada negocio tenga un Agente Registrado.':'Florida law requires every business to have a Registered Agent on file.',
    's7-sub':isEs?'Todo opcional. Agrega lo que necesites ahora o en cualquier momento.':'All optional. Add what you need now or anytime.',
    's8-sub':isEs?'Confirma tus datos antes del pago.':'Confirm your details before payment.',
    's9-submit':isEs?'Procesar Mi Orden':'Process My Order',
    // Step 9 - Payment translations
    's10-card-lbl':isEs?'&#128179; Pagar con Tarjeta de Cr\\u00e9dito o D\\u00e9bito':'&#128179; Add a Credit Card',
    's10-div-card':isEs?'Informaci\\u00f3n de la Tarjeta':'Credit Card Information',
    'lbl-card-name':isEs?'Nombre en la Tarjeta *':'Name on Card *',
    'lbl-card-num':isEs?'N\\u00famero de Tarjeta *':'Card Number *',
    'lbl-card-exp':isEs?'Fecha de Vencimiento *':'Expiry Date *',
    'lbl-card-cvv':isEs?'CVV / CVC *':'CVV / CVC *',
    's10-div-billing':isEs?'Direcci\\u00f3n de Facturaci\\u00f3n':'Billing Address',
    'lbl-same-addr':isEs?'Misma que la direcci\\u00f3n del negocio':'Same as company address',
    's10-warn-title':isEs?'\\u26a0\\ufe0f No Reembolsable:':'\\u26a0\\ufe0f Non-Refundable:',
    's10-warn-text':isEs?'Los cargos estatales no son reembolsables una vez iniciado el proceso. Nuestra tarifa de servicio es reembolsable dentro de las 24 horas si el tr\\u00e1mite no ha comenzado. \\u00bfPreguntas? Cont\\u00e1ctanos por WhatsApp antes de enviar.':'State fees cannot be refunded once processing begins. Our service fee is refundable within 24 hours if filing has not started. Questions? Contact us via WhatsApp before submitting.',
    // Step 6 - Registered Agent
    's6-sub':isEs?'La ley de Florida exige que toda LLC y Corporaci\\u00f3n designe un Agente Registrado para recibir documentos oficiales en nombre del negocio.':'Florida law requires every LLC and Corporation to designate a Registered Agent to receive official legal and government documents on behalf of your business.',
    's6-b1':isEs?'Recibe demandas, órdenes judiciales y documentos oficiales del estado':'Receives lawsuits, court orders, and official state documents',
    's6-b2':isEs?'Debe tener una dirección física en Florida — no apartados postales':'Must have a physical Florida address — no PO Boxes',
    's6-b3':isEs?'Debe estar disponible en horario laboral normal':'Must be available during normal business hours',
    'ra-us-lbl':isEs?'&#127968; Usar Nuestro Servicio de Agente Registrado':'&#127968; Use Our Registered Agent Service',
    'ra-us-desc':isEs?'Actuamos como tu Agente Registrado y manejamos todos los documentos oficiales en tu nombre.':'We act as your Registered Agent and handle all official documents on your behalf.',
    'ra-own-lbl':isEs?'Yo Seré Mi Propio Agente':'I Will Be My Own Agent',
    'ra-own-desc':isEs?'Necesitas una dirección física en Florida y debes estar disponible en horario laboral.':'You need a physical FL address and must be reachable during business hours.',
    's6-info-note':isEs?'La dirección de tu Agente Registrado aparece en los registros de Florida, no la tuya personal. Esto protege tu privacidad.':'Your Registered Agent address appears on Florida public records, not your personal address. This protects your privacy.',
    'lbl-ra-name':isEs?'Nombre Completo *':'Full Name *',
    'lbl-ra-street':isEs?'Dirección en Florida *':'Florida Street Address *',
    // Summary labels
    'sum-lbl-entity':isEs?'Entidad':'Entity',
    'sum-lbl-pkg':isEs?'Paquete':'Package',
    'sum-lbl-state':isEs?'Cargo Estatal FL':'FL State Fee',
    'sum-lbl-exp':isEs?'Tramitaci\\u00f3n Prioritaria':'Expedited Filing',
    'sum-lbl-vma':isEs?'Direcci\\u00f3n Virtual':'Virtual Address',
    'sum-lbl-ein':isEs?'EIN / ID Fiscal':'EIN / Tax ID',
    'sum-lbl-oa':isEs?'Acuerdo Operativo':'Operating Agreement',
    'sum-lbl-itin':isEs?'Solicitud ITIN':'ITIN Application',
    'sum-lbl-ar':isEs?'Declaraci\\u00f3n Anual':'Annual Report',
    'sum-lbl-total':isEs?'Total':'Total',
    'sum-sec-ssl':isEs?'&#128274; Cifrado SSL':'&#128274; SSL Encrypted',
    'sum-sec-nofees':isEs?'&#10003; Sin Cargos Ocultos':'&#10003; No Hidden Fees',
    'sum-sec-email':isEs?'&#128196; Recibo por Correo':'&#128196; Receipt by Email',
    's2-sub':isEs?'Cuéntanos cómo contactarte y dónde estará ubicado tu negocio.':'Tell us how to reach you and where your business will be located.',
    's2-biz-addr-divider':isEs?'Dirección del Negocio':'Business Address',
    's2-biz-addr-info-title':isEs?'¿Qué es la Dirección del Negocio?':'What is the Business Address?',
    's2-biz-addr-info-text':isEs?'Esta es la dirección oficial de tu LLC o Corporación presentada ante el Estado de Florida. Puede estar en cualquier parte del mundo.':'This is the official address of your LLC or Corporation filed with the State of Florida. It can be located anywhere in the world.',
    'biz-virtual-lbl':isEs?'Usar Dirección Virtual':'Use Virtual Address',
    'biz-virtual-desc':isEs?'Te asignamos una dirección profesional en Florida. Tu dirección personal se mantiene completamente privada.':'We assign you a professional Florida address. Your personal address stays completely private.',
    'biz-own-lbl':isEs?'Usaré mi propia dirección':'I will use my own address',
    'biz-own-desc':isEs?'Tu dirección formará parte del registro público de la División de Corporaciones de Florida.':'Your address will be part of the public Florida Division of Corporations record.',
    'biz-virtual-confirm-title':isEs?'Todo listo, no necesitamos tu dirección.':'You are all set, no address needed from you.',
    'biz-virtual-confirm-text':isEs?'Una vez confirmada tu orden, te asignaremos tu dirección virtual y la enviaremos a tu correo. Tu negocio tendrá una dirección profesional desde el primer día.':'Once your order is confirmed, we will assign your Florida virtual address and deliver it to your email. Your business will have a professional address from day one.',
    'biz-virtual-badge':isEs?'1er Mes GRATIS':'1st Month FREE',
    's3-agent-info-title':isEs?'¿Qué es un Agente Registrado?':'What is a Registered Agent?',
    's3-agent-info-text':isEs?'La ley de Florida exige que toda LLC y Corporación tenga un Agente Registrado con dirección física en Florida disponible en horario laboral para recibir documentos legales oficiales.':'Florida law requires every LLC and Corporation to have a Registered Agent with a physical Florida address to receive official legal documents.',
    'agent-ours-lbl':isEs?'Usar Nuestro Servicio de Agente Registrado':'Use Our Registered Agent Service',
    'agent-ours-desc':isEs?'Actuamos como tu Agente Registrado oficial. Tu dirección personal se mantiene completamente privada.':'We act as your official Registered Agent. Your personal address stays completely private.',
    'agent-own-lbl':isEs?'Seré mi propio Agente Registrado':'I will be my own Registered Agent',
    'agent-own-desc':isEs?'Necesitas una dirección física en Florida y debes estar disponible en horario laboral.':'You need a physical Florida address and must be available during normal business hours.',
    'agent-ours-note-text':isEs?'Actuaremos como tu Agente Registrado y recibiremos todos los documentos en tu nombre. Tu dirección personal no aparecerá en ningún registro público.':'We will act as your Registered Agent and receive all official documents. Your personal address will not appear on any public record.',
    'agent-own-warn-text':isEs?'La dirección de tu Agente Registrado aparecerá en el registro público. Debe ser una dirección física en Florida.':'Your Registered Agent address will appear on the public record. It must be a physical Florida address, no PO Boxes.',
    's3-mail-divider':isEs?'Dirección Postal de la LLC':'LLC Mailing Address',
    's3-mail-opt':isEs?'(Opcional — separada de tu dirección de Agente Registrado)':'(Optional — separate from your Registered Agent address)',
    's3-mail-info-text':isEs?'¿A dónde enviamos el correo general de tu LLC?':'Where should the State send your LLC\\'s general mail?',
    's3-mail-info-sub':isEs?'Esta dirección es <strong>diferente</strong> a la de tu Agente Registrado. Esta es la diferencia clave:<br/><span style=\\"display:block;margin-top:6px\\">&#x2716; <strong style=\\"color:#dc2626\\">Dirección del Agente Registrado</strong> recibe <em>documentos legales y críticos</em> — demandas, órdenes judiciales, citaciones. Debe ser física en Florida.</span><span style=\\"display:block;margin-top:4px\\">&#x2714; <strong style=\\"color:#059669\\">Esta dirección postal</strong> recibe <em>correspondencia general</em> — recordatorios del Reporte Anual, confirmaciones de trámites, avisos del Estado. <strong>Se acepta PO Box. Puede ser cualquier dirección del mundo.</strong></span>':'This address is <strong>different</strong> from your Registered Agent address above. Here\\'s the key difference:<br/><span style=\\"display:block;margin-top:6px\\">&#x2716; <strong style=\\"color:#dc2626\\">Registered Agent address</strong> receives <em>legal &amp; critical documents</em> — lawsuits, court orders, government summons. Must be a physical Florida address.</span><span style=\\"display:block;margin-top:4px\\">&#x2714; <strong style=\\"color:#059669\\">This mailing address</strong> receives <em>general correspondence</em> — Annual Report reminders, filing confirmations, state notices. <strong>A PO Box is accepted. Any address worldwide is valid.</strong></span>',
    'lbl-same-mail':isEs?'Igual que la dirección del negocio':'Same as business address',
    's4-skip-lbl':isEs?'No gracias, me quedo con mi paquete actual':'No thanks, keep my current package',
    'exp-upsell-title':isEs?'Un Último Detalle Antes de Pagar':'One Last Thing Before You Pay',
    'exp-upsell-sub':isEs?'Tu formación está en buenas manos.':'Your formation is in good hands. Want to make it official faster?',
    'rev-std-lbl':isEs?'Procesamiento Estándar':'Standard Processing',
    'rev-std-days':isEs?'7-10 días hábiles':'7-10 business days',
    'rev-exp-lbl':isEs?'Procesamiento Prioritario':'Expedited Processing',
    'rev-exp-days':isEs?'1-3 días hábiles':'1-3 business days',
    'rev-exp-note':isEs?'Incluido GRATIS con Premium':'Included FREE with Premium',
    'rev-exp-badge':isEs?'RECOMENDADO':'RECOMMENDED',
    'lbl-biz-country':isEs?'País *':'Country *',
    'lbl-mail-country':isEs?'País *':'Country *',
    'lbl-mail-street':isEs?'Dirección / Apartado Postal *':'Street Address / PO Box *',
    'lbl-mail-city':isEs?'Ciudad *':'City *',
    'lbl-mail-zip':isEs?'ZIP / Código Postal *':'ZIP / Postal Code *',
    'lbl-ra-city':isEs?'Ciudad *':'City *',
    'lbl-ra-zip':isEs?'ZIP *':'ZIP *',
    'lbl-ra-sig':isEs?'Firma Electrónica *':'Electronic Signature *',
    'lbl-region':isEs?'Estado / Región *':'State / Region *',
    'suc-title':isEs?'Tu Aplicación Está Confirmada':'Your Application Is Confirmed!',
    'suc-wa-lbl':isEs?'Chatear por WhatsApp':'Chat with Us on WhatsApp',
    'suc-home-lbl':isEs?'Volver al Inicio':'Return to Homepage',
    's5-title':isEs?'Propietarios y Miembros del Negocio':'Business Owners & Members',
    's5-sub':isEs?'Indique quiénes son los propietarios de este negocio. Cada persona o empresa con participación debe ser listada.':'Tell us who owns this business. Each person or company with an ownership stake must be listed.',
    'lbl-add-member':isEs?'+ Agregar Otro Miembro / Propietario':'+ Add Another Member / Owner',
    's5-title':isEs?'¿Quiénes son los Dueños de este Negocio?':'Business Owners & Members',
    's5-sub':isEs?'Indique quiénes son los propietarios de este negocio. Cada persona o empresa con participación debe ser listada.':'Tell us who owns this business. Each person or company with an ownership stake must be listed.',
    'lbl-add-member':isEs?'Agregar Otro Miembro / Propietario':'Add Another Member / Owner',
    's5-title':isEs?'¿Quiénes son los Dueños de este Negocio?':'Business Owners & Members',
    's5-sub':isEs?'Indica quién es dueño de este negocio. Cada persona o empresa con participación accionaria debe figurar tal como aparecerá en los registros del Estado de Florida.':'Tell us who owns this business. Each person or company with an ownership stake must be listed exactly as they will appear on the State of Florida records.',
    's5-m1-title':isEs?'Miembro / Propietario #1':'Member / Owner #1',
    's5-m1-type-lbl':isEs?'Tipo *':'Type *',
    's5-ind-lbl':isEs?'&#128100; Individuo':'&#128100; Individual',
    's5-ind-desc':isEs?'Una persona que es dueña de parte de este negocio':'A person who owns part of this business',
    's5-co-lbl':isEs?'&#127963; Empresa':'&#127963; Company',
    's5-co-desc':isEs?'Otra entidad comercial que posee parte de este negocio':'Another business entity that owns part of this business',
    's5-m1-fname-lbl':isEs?'Nombre *':'First Name *',
    's5-m1-lname-lbl':isEs?'Apellido *':'Last Name *',
    's5-m1-title-lbl':isEs?'Título / Rol *':'Title / Role *',
    's5-m1-own-lbl':isEs?'% de Propiedad *':'Ownership % *',
    's5-m1-addr-lbl':isEs?'Dirección *':'Address *',
    's5-m1-coname-lbl':isEs?'Nombre de la Empresa *':'Company Name *',
    's5-m1-coein-lbl':isEs?'EIN / Tax ID':'EIN / Tax ID',
    's5-m1-coorg-lbl':isEs?'País de Incorporación *':'Country of Incorporation *',
    's5-m1-corole-lbl':isEs?'Título / Rol *':'Title / Role *',
    's5-m1-coown-lbl':isEs?'% de Propiedad *':'Ownership % *',
    's5-m1-coaddr-lbl':isEs?'Dirección del Negocio *':'Business Address *',
    's5-own-total-lbl':isEs?'Propiedad Total':'Total Ownership',
    's5-add-lbl':isEs?'Agregar Otro Miembro / Propietario':'Add Another Member / Owner',
    's2-title':isEs?'Tu Información':'Your Information',
  };
  Object.keys(tm).forEach(function(id){var e=document.getElementById(id);if(e)e.innerHTML=tm[id];});
  var llcLbl=document.getElementById('s1-llc-lbl');if(llcLbl)llcLbl.innerHTML=isEs?'&#127963; LLC - Sociedad de Responsabilidad Limitada':'&#127963; LLC - Limited Liability Company';
  var bp=document.getElementById('inp-bizname');if(bp)bp.placeholder=isEs?'ej. Sunshine Ventures':'e.g. Sunshine Ventures';
  var b2=document.getElementById('inp-bizname2');if(b2)b2.placeholder=isEs?'ej. Sunshine Group':'e.g. Sunshine Group';
  var b3=document.getElementById('inp-bizname3');if(b3)b3.placeholder=isEs?'ej. Sunshine Solutions':'e.g. Sunshine Solutions';
  var ie=document.getElementById('inp-email');if(ie)ie.placeholder=isEs?'tucorreo@email.com':'your@email.com';
  var icn=document.getElementById('inp-card-name');if(icn)icn.placeholder=isEs?'Nombre completo como aparece en la tarjeta':'Full name as it appears on card';
  var icnum=document.getElementById('inp-card-num');if(icnum)icnum.placeholder=isEs?'1234 5678 9012 3456':'1234 5678 9012 3456';
  var icexp=document.getElementById('inp-card-exp');if(icexp)icexp.placeholder=isEs?'MM/AA':'MM/YY';
  var iccvv=document.getElementById('inp-card-cvv');if(iccvv)iccvv.placeholder=isEs?'3 d\\u00edgitos':'3 digits';
  var ist=document.getElementById('inp-street');if(ist)ist.placeholder=isEs?'Direcci\\u00f3n':'Street address';
  var ist2=document.getElementById('inp-street2');if(ist2)ist2.placeholder=isEs?'Apt, Suite, Unidad':'Apt, Suite, Unit';
  var ict=document.getElementById('inp-city');if(ict)ict.placeholder=isEs?'Ciudad':'City';
  var izp=document.getElementById('inp-zip');if(izp)izp.placeholder=isEs?'00000':'00000';
  document.querySelectorAll('[id$="-save"]').forEach(function(e){if(e.tagName==='SPAN')e.textContent=isEs?'Guardar':'Save';});
  document.querySelectorAll('[id$="-back"]').forEach(function(e){e.textContent=isEs?'Volver':'Back';});
  document.querySelectorAll('[id$="-next"]').forEach(function(e){e.textContent=isEs?'Continuar':'Continue';});
  document.querySelectorAll('.fm-sum-title').forEach(function(e){e.textContent=isEs?'Tu Orden':'Your Order';});
  var t = fmTranslations[lang] || fmTranslations.en;
  var isEs = lang === 'es';
  var el;
  el=document.getElementById('fp-close-lbl');   if(el) el.textContent = isEs?'Cerrar':'Close';
  el=document.getElementById('s1-title');        if(el) el.textContent = t.s1_title;
  el=document.getElementById('s1-sub');          if(el) el.innerHTML = t.s1_sub;
  el=document.getElementById('s2-title');        if(el) el.textContent = t.s2_title;
  el=document.getElementById('s3-title');        if(el) el.textContent = t.s3_title;
  el=document.getElementById('s4-title');        if(el) el.textContent = t.s4_title;
  el=document.getElementById('s5-title');        if(el) el.textContent = t.s5_title;
  el=document.getElementById('s6-title');        if(el) el.textContent = t.s6_title;
  el=document.getElementById('s7-title');        if(el) el.textContent = t.s7_title;
  el=document.getElementById('s8-title');        if(el) el.textContent = t.s8_title;
  el=document.getElementById('s9-title');        if(el) el.textContent = t.s9_title;
  el=document.getElementById('s10-title');       if(el) el.textContent = t.s10_title;
  document.querySelectorAll('.fm-sum-title').forEach(function(e){ e.textContent = t.sum_title; });
  document.querySelectorAll('.next-lbl, span.next-lbl').forEach(function(e){ e.textContent = t.continue; });
  // Labels
  var labels = {
    'lbl-bizname': isEs?'Nombre del Negocio *':'Business Name *',
    'lbl-designator': isEs?'Debe terminar con *':'Must end with *',
    'lbl-fname': isEs?'Nombre *':'First Name *',
    'lbl-lname': isEs?'Apellido *':'Last Name *',
    'lbl-email': isEs?'Correo Electrónico *':'Email *',
    'lbl-phone': isEs?'Teléfono Móvil *':'Mobile Phone *',
    'lbl-street': isEs?'Dirección *':'Street Address *',
    'lbl-city': isEs?'Ciudad *':'City *',
    'lbl-state': isEs?'Estado *':'State *',
    'lbl-zip': isEs?'Código Postal *':'Zip Code *',
    'lbl-country': isEs?'País':'Country',
    'lbl-num-members': isEs?'Número de Miembros/Propietarios *':'Number of Members/Owners *',
    'lbl-mgmt-type': isEs?'Tipo de Gestión *':'Management Type *',
    'lbl-card-name': isEs?'Nombre en la Tarjeta *':'Cardholder Full Name *',
    'lbl-card-num': isEs?'Número de Tarjeta *':'Card Number *',
    'lbl-card-exp': isEs?'Fecha de Vencimiento *':'Expiry Date *',
    'lbl-card-cvv': isEs?'CVV / CVC *':'CVV / CVC *',
    'sum-entity-lbl': isEs?'Tipo de Entidad':'Entity Type',
    'sum-entity-lbl': isEs?'Tipo de Entidad':'Entity Type',
    'sum-total-lbl': isEs?'Total':'Total',
  };
  Object.keys(labels).forEach(function(id){
    var e = document.getElementById(id);
    if(e) e.textContent = labels[id];
  });
  // Placeholders
  var inputs = document.querySelectorAll('#formOverlay .fm-input, #formOverlay .fm-select');
  inputs.forEach(function(inp){
    if(inp.placeholder === 'e.g. Sunshine Ventures') inp.placeholder = isEs?'ej. Sunshine Ventures':'e.g. Sunshine Ventures';
    if(inp.placeholder === 'First name') inp.placeholder = isEs?'Nombre':'First name';
    if(inp.placeholder === 'Last name') inp.placeholder = isEs?'Apellido':'Last name';
    if(inp.placeholder === 'your@email.com') inp.placeholder = isEs?'tucorreo@email.com':'your@email.com';
    if(inp.placeholder === 'City') inp.placeholder = isEs?'Ciudad':'City';
    if(inp.placeholder === 'ZIP') inp.placeholder = isEs?'Código Postal':'ZIP';
    if(inp.placeholder === 'Street address') inp.placeholder = isEs?'Dirección':'Street address';
  });
  // S8 addon names
  var addonMap = {
    'addon-ein-name':  isEs?'EIN / Número de Identificación Fiscal':'EIN / Federal Tax ID Number',
    'addon-ein-desc':  isEs?'Requerido para cuentas bancarias, empleados e impuestos':'Required for bank accounts, hiring employees & filing taxes',
    'addon-oa-name':   isEs?'Acuerdo Operativo':'Operating Agreement',
    'addon-oa-desc':   isEs?'Requerido por los bancos para abrir una cuenta corriente empresarial':'Required by banks to open a business checking account',
    'addon-itin-name': isEs?'Solicitud de ITIN':'ITIN Application',
    'addon-itin-desc': isEs?'Para extranjeros sin Número de Seguro Social':'For foreign nationals without a Social Security Number',
    'addon-ar-name':   isEs?'Servicio de Declaración Anual':'Annual Report Filing Service',
    'addon-ar-desc':   isEs?'Presentamos tu Declaración Anual de FL cada año — fecha límite 1 de mayo':'We file your FL Annual Report each year — deadline May 1st',
  };
  Object.keys(addonMap).forEach(function(id){
    var e = document.getElementById(id);
    if(e) e.textContent = addonMap[id];
  });
  var vmaEN=['Keep your address off public records','Real FL address for your business','Meets state mail requirements','Mail scans with instant alerts','FIRST MONTH FREE','Virtual Address','Use Virtual Address','1st month free then $29/month','Use my own address','Your address will be on public record'];
  var vmaES=['Tu direcci\\u00f3n no aparece en registros','Direcci\\u00f3n real en Florida','Cumple requisitos del estado','Esc\\u00e1neos con alertas','PRIMER MES GRATIS','Direcci\\u00f3n Virtual','Usar Direcci\\u00f3n Virtual','1er mes gratis luego $29/mes','Usar mi propia direcci\\u00f3n','Tu direcci\\u00f3n en registros p\\u00fablicos'];
  ['vma-f1','vma-f2','vma-f3','vma-f4','s4-vma-badge','s4-vma-title','vma-yes-lbl','vma-yes-desc','vma-no-lbl','vma-no-desc'].forEach(function(id,i){var e=document.getElementById(id);if(e)e.innerHTML=isEs?vmaES[i]:vmaEN[i];});}


/* ── EIN & OA ADDON LOGIC ── */

// IRS SS-4 Line 16 principal activity categories + popular subcategories
var _einActivities = [
  // Construction
  {cat:'Construction', en:'Construction — General contractor', es:'Construcción — Contratista general'},
  {cat:'Construction', en:'Construction — Electrical', es:'Construcción — Eléctrica'},
  {cat:'Construction', en:'Construction — Plumbing', es:'Construcción — Plomería'},
  {cat:'Construction', en:'Construction — HVAC / Air conditioning', es:'Construcción — Aire acondicionado'},
  {cat:'Construction', en:'Construction — Remodeling / Renovation', es:'Construcción — Remodelación'},
  {cat:'Construction', en:'Construction — Landscaping', es:'Construcción — Jardinería y paisajismo'},
  // Real Estate
  {cat:'Real Estate', en:'Real Estate — Rental properties', es:'Bienes raíces — Propiedades en alquiler'},
  {cat:'Real Estate', en:'Real Estate — Property management', es:'Bienes raíces — Administración de propiedades'},
  {cat:'Real Estate', en:'Real Estate — Real estate agent / Broker', es:'Bienes raíces — Agente inmobiliario'},
  {cat:'Real Estate', en:'Real Estate — Short-term rentals (Airbnb)', es:'Bienes raíces — Alquileres cortos (Airbnb)'},
  // Retail
  {cat:'Retail', en:'Retail — Online store / E-commerce', es:'Venta al por menor — Tienda en línea / E-commerce'},
  {cat:'Retail', en:'Retail — Clothing & apparel', es:'Venta al por menor — Ropa y moda'},
  {cat:'Retail', en:'Retail — Beauty products', es:'Venta al por menor — Productos de belleza'},
  {cat:'Retail', en:'Retail — Food & beverage', es:'Venta al por menor — Alimentos y bebidas'},
  {cat:'Retail', en:'Retail — Electronics', es:'Venta al por menor — Electrónica'},
  {cat:'Retail', en:'Retail — General merchandise', es:'Venta al por menor — Mercancía general'},
  // Wholesale
  {cat:'Wholesale', en:'Wholesale — Agent / Broker', es:'Mayorista — Agente / Corredor'},
  {cat:'Wholesale', en:'Wholesale — Import / Export', es:'Mayorista — Importación / Exportación'},
  {cat:'Wholesale', en:'Wholesale — Distributor', es:'Mayorista — Distribuidor'},
  // Manufacturing
  {cat:'Manufacturing', en:'Manufacturing — Food production', es:'Manufactura — Producción de alimentos'},
  {cat:'Manufacturing', en:'Manufacturing — Clothing / Textiles', es:'Manufactura — Ropa / Textiles'},
  {cat:'Manufacturing', en:'Manufacturing — Consumer products', es:'Manufactura — Productos de consumo'},
  // Transportation & Warehousing
  {cat:'Transportation', en:'Transportation — Trucking / Freight', es:'Transporte — Camiones / Carga'},
  {cat:'Transportation', en:'Transportation — Courier / Delivery', es:'Transporte — Mensajería / Envíos'},
  {cat:'Transportation', en:'Transportation — Rideshare / Chauffeur', es:'Transporte — Viajes compartidos / Chofer'},
  {cat:'Transportation', en:'Transportation — Warehousing / Storage', es:'Transporte — Almacenamiento'},
  // Finance & Insurance
  {cat:'Finance & Insurance', en:'Finance — Accounting / Bookkeeping', es:'Finanzas — Contabilidad'},
  {cat:'Finance & Insurance', en:'Finance — Tax preparation', es:'Finanzas — Preparación de impuestos'},
  {cat:'Finance & Insurance', en:'Finance — Financial consulting', es:'Finanzas — Consultoría financiera'},
  {cat:'Finance & Insurance', en:'Finance — Insurance agent', es:'Finanzas — Agente de seguros'},
  // Health Care
  {cat:'Health Care', en:'Health Care — Medical practice', es:'Salud — Consultorio médico'},
  {cat:'Health Care', en:'Health Care — Dental practice', es:'Salud — Consultorio dental'},
  {cat:'Health Care', en:'Health Care — Home health aide', es:'Salud — Cuidado en el hogar'},
  {cat:'Health Care', en:'Health Care — Wellness / Fitness', es:'Salud — Bienestar / Fitness'},
  {cat:'Health Care', en:'Health Care — Beauty salon / Spa', es:'Salud — Salón de belleza / Spa'},
  // Accommodation & Food Services
  {cat:'Food Services', en:'Food Services — Restaurant', es:'Restaurantes — Restaurante'},
  {cat:'Food Services', en:'Food Services — Food truck', es:'Restaurantes — Food truck'},
  {cat:'Food Services', en:'Food Services — Catering', es:'Restaurantes — Catering'},
  {cat:'Food Services', en:'Food Services — Bakery', es:'Restaurantes — Panadería / Repostería'},
  {cat:'Food Services', en:'Food Services — Coffee shop', es:'Restaurantes — Cafetería'},
  // Professional Services
  {cat:'Other — Professional Services', en:'Professional Services — Consulting', es:'Servicios profesionales — Consultoría'},
  {cat:'Other — Professional Services', en:'Professional Services — Legal services', es:'Servicios profesionales — Servicios legales'},
  {cat:'Other — Professional Services', en:'Professional Services — Marketing / Advertising', es:'Servicios profesionales — Marketing / Publicidad'},
  {cat:'Other — Professional Services', en:'Professional Services — Photography / Videography', es:'Servicios profesionales — Fotografía / Videografía'},
  {cat:'Other — Professional Services', en:'Professional Services — Architecture / Engineering', es:'Servicios profesionales — Arquitectura / Ingeniería'},
  // Digital & Technology
  {cat:'Other — Digital & Technology', en:'Technology — Software development', es:'Tecnología — Desarrollo de software'},
  {cat:'Other — Digital & Technology', en:'Technology — IT consulting / Support', es:'Tecnología — Consultoría / Soporte IT'},
  {cat:'Other — Digital & Technology', en:'Technology — Digital marketing / SEO', es:'Tecnología — Marketing digital / SEO'},
  {cat:'Other — Digital & Technology', en:'Technology — Social media management', es:'Tecnología — Manejo de redes sociales'},
  {cat:'Other — Digital & Technology', en:'Technology — Content creation / Influencer', es:'Tecnología — Creación de contenido / Influencer'},
  {cat:'Other — Digital & Technology', en:'Technology — E-commerce / Dropshipping', es:'Tecnología — E-commerce / Dropshipping'},
  // Education
  {cat:'Other — Education', en:'Education — Online courses / Coaching', es:'Educación — Cursos en línea / Coaching'},
  {cat:'Other — Education', en:'Education — Tutoring', es:'Educación — Tutoría'},
  {cat:'Other — Education', en:'Education — Music / Art instruction', es:'Educación — Instrucción musical / Artística'},
  // Other
  {cat:'Other', en:'Other — Cleaning services', es:'Otro — Servicios de limpieza'},
  {cat:'Other', en:'Other — Event planning', es:'Otro — Organización de eventos'},
  {cat:'Other', en:'Other — Security services', es:'Otro — Servicios de seguridad'},
  {cat:'Other', en:'Other — Childcare services', es:'Otro — Cuidado de niños'},
  {cat:'Other', en:'Other — Pet services', es:'Otro — Servicios para mascotas'},
  {cat:'Other', en:'Other — Moving services', es:'Otro — Mudanzas'},
  {cat:'Other', en:'Other (describe below)', es:'Otro (describir abajo)'},
];

function fmEinActivityFilter(q) {
  var list = document.getElementById('ein-activity-list');
  var valEl = document.getElementById('ein-activity-val');
  var descWrap = document.getElementById('ein-activity-desc-wrap');
  if(!list) return;
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  list.style.display = 'block';
  var lower = q.toLowerCase();
  var filtered = q.trim() === '' ? _einActivities : _einActivities.filter(function(a){
    return a.en.toLowerCase().indexOf(lower) > -1 || a.es.toLowerCase().indexOf(lower) > -1 || a.cat.toLowerCase().indexOf(lower) > -1;
  });
  list.innerHTML = '';
  if(filtered.length === 0) {
    list.innerHTML = '<div style="padding:10px 14px;font-size:.8rem;color:#9ca3af">' + (isEs ? 'Sin resultados. Elige "Otro" y descríbelo.' : 'No results. Choose "Other" and describe it.') + '</div>';
    return;
  }
  filtered.forEach(function(a) {
    var label = isEs ? a.es : a.en;
    var div = document.createElement('div');
    div.style.cssText = 'padding:10px 14px;font-size:.82rem;cursor:pointer;color:#1e293b;border-bottom:1px solid #f1f5f9;transition:background .15s';
    div.textContent = label;
    div.onmouseenter = function(){ this.style.background='#eff6ff'; };
    div.onmouseleave = function(){ this.style.background=''; };
    div.onclick = function() {
      var searchEl = document.getElementById('ein-activity-search');
      searchEl.value = label;
      if(valEl) valEl.value = a.cat;
      list.style.display = 'none';
      // Always show description field
      if(descWrap) descWrap.style.display = 'block';
      // Show a "change" link below the search field
      var changeWrap = document.getElementById('ein-activity-change');
      if(!changeWrap) {
        changeWrap = document.createElement('div');
        changeWrap.id = 'ein-activity-change';
        changeWrap.style.cssText = 'font-size:.72rem;margin-top:4px';
        searchEl.parentNode.appendChild(changeWrap);
      }
      var isEs2 = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
      changeWrap.innerHTML = '<span style="color:#2563eb;cursor:pointer;text-decoration:underline" onclick="fmEinClearActivity()">&#8592; ' + (isEs2 ? 'Cambiar selección' : 'Change selection') + '</span>';
    };
    list.appendChild(div);
  });
}

function fmCheckIdMatch(type) {
  var v1El = document.getElementById(type === 'ssn' ? 'inp-ein-ssn' : 'inp-ein-itin');
  var v2El = document.getElementById(type === 'ssn' ? 'inp-ein-ssn-confirm' : 'inp-ein-itin-confirm');
  var msg  = document.getElementById(type === 'ssn' ? 'ssn-match-msg' : 'itin-match-msg');
  if(!v1El || !v2El || !msg) return;
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  var v1 = v1El.value.replace(/[^0-9]/g,'');
  var v2 = v2El.value.replace(/[^0-9]/g,'');
  if(!v2) { msg.style.display='none'; v2El.style.borderColor=''; return; }
  // Character-by-character comparison
  var mismatch = false;
  for(var i=0; i<v2.length; i++) {
    if(v2[i] !== v1[i]) { mismatch = true; break; }
  }
  if(mismatch) {
    msg.style.display='block'; msg.style.color='#ef4444';
    msg.textContent = isEs ? 'Los números no coinciden.' : 'Numbers do not match.';
    v2El.style.borderColor='#ef4444';
  } else if(v2.length === 9 && v1.length === 9) {
    msg.style.display='block'; msg.style.color='#059669';
    msg.textContent = isEs ? '✓ Confirmado correctamente.' : '✓ Confirmed successfully.';
    v2El.style.borderColor='#059669';
  } else {
    msg.style.display='none'; v2El.style.borderColor='';
  }
}

function fmEinClearActivity() {
  var searchEl = document.getElementById('ein-activity-search');
  var valEl    = document.getElementById('ein-activity-val');
  var descWrap = document.getElementById('ein-activity-desc-wrap');
  var changeWrap = document.getElementById('ein-activity-change');
  if(searchEl) { searchEl.value = ''; searchEl.style.borderColor = ''; searchEl.focus(); }
  if(valEl)    valEl.value = '';
  if(descWrap) descWrap.style.display = 'none';
  if(changeWrap) changeWrap.innerHTML = '';
  fmEinActivityFilter('');
}

function fmEinIdTypeChange(radio) {
  var val = radio.value;
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  document.getElementById('ein-ssn-field').style.display    = val === 'ssn'  ? 'block' : 'none';
  document.getElementById('ein-itin-field').style.display   = val === 'itin' ? 'block' : 'none';
  document.getElementById('ein-no-id-warning').style.display = val === 'none' ? 'block' : 'none';
  // Style the selected radio label
  ['ein-has-ssn-lbl','ein-has-itin-lbl','ein-no-id-lbl'].forEach(function(id){
    var lbl = document.getElementById(id);
    if(lbl) { lbl.style.borderColor='#e2e8f0'; lbl.style.background='#fff'; lbl.style.color=''; }
  });
  var selLbl = val==='ssn'?'ein-has-ssn-lbl':val==='itin'?'ein-has-itin-lbl':'ein-no-id-lbl';
  var activeLabel = document.getElementById(selLbl);
  if(activeLabel) {
    if(val === 'none') {
      activeLabel.style.borderColor = '#059669';
      activeLabel.style.background  = '#f0fdf4';
    } else {
      activeLabel.style.borderColor = '#2563eb';
      activeLabel.style.background  = '#eff6ff';
    }
  }
  // Auto-add ITIN addon when "foreigner" selected, remove when deselected
  var itinAddon = document.getElementById('addon-itin');
  if(val === 'none') {
    if(!fmData.addons.itin) {
      fmToggleAddon('itin', itinAddon);
    }
  } else {
    // If ITIN was auto-added by us (not manually), remove it
    if(fmData.addons.itin && fmData._itinAutoAdded) {
      fmToggleAddon('itin', itinAddon);
    }
  }
  fmData._itinAutoAdded = (val === 'none');
}

function fmFormatSSN(inp) {
  var v = inp.value.replace(/[^0-9]/g,'').substring(0,9);
  if(v.length > 5) inp.value = v.substring(0,3)+'-'+v.substring(3,5)+'-'+v.substring(5);
  else if(v.length > 3) inp.value = v.substring(0,3)+'-'+v.substring(3);
  else inp.value = v;
  // Live validation feedback
  var isComplete = v.length === 9;
  var feedbackId = inp.id === 'inp-ein-ssn' ? 'ssn-valid-msg' : 'itin-valid-msg';
  var existing = document.getElementById(feedbackId);
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');
  if(!existing) {
    existing = document.createElement('div');
    existing.id = feedbackId;
    existing.style.cssText = 'font-size:.73rem;margin-top:4px';
    inp.parentNode.parentNode.appendChild(existing);
  }
  if(v.length === 0) {
    existing.textContent = ''; inp.style.borderColor = '';
  } else if(isComplete) {
    existing.style.color = '#059669';
    existing.textContent = isEs ? '✓ Formato válido.' : '✓ Valid format.';
    inp.style.borderColor = '#059669';
  } else {
    existing.style.color = '#ef4444';
    existing.textContent = isEs ? (9 - v.length) + ' dígitos restantes.' : (9 - v.length) + ' digits remaining.';
    inp.style.borderColor = '#ef4444';
  }
}

function fmToggleMask(inputId, eyeId) {
  var inp = document.getElementById(inputId);
  var eye = document.getElementById(eyeId);
  if(!inp) return;
  var isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  inp.style.letterSpacing = isHidden ? '0' : '2px';
  if(eye) {
    // Switch between eye-open and eye-closed SVG
    if(isHidden) {
      eye.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
      eye.style.color = '#2563eb';
    } else {
      eye.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      eye.style.color = '#9ca3af';
    }
  }
}

function fmShowEinFields(show) {
  var panel = document.getElementById('ein-extra-fields');
  if(!panel) return;
  panel.style.display = show ? 'block' : 'none';
  // Also style the EIN addon card to visually connect
  var card = document.getElementById('addon-ein');
  if(card) {
    card.style.borderRadius = show ? '10px 10px 0 0' : '';
    card.style.borderBottom = show ? 'none' : '';
  }
}

function fmShowOaFields(show) {
  var panel = document.getElementById('oa-extra-fields');
  if(!panel) return;
  var card = document.getElementById('addon-oa');

  if(!show) {
    panel.style.display = 'none';
    if(card){ card.style.borderRadius=''; card.style.borderBottom=''; }
    return;
  }

  // Always show panel when OA selected
  panel.style.display = 'block';
  if(card){ card.style.borderRadius='12px 12px 0 0'; card.style.borderBottom='none'; }

  var container = document.getElementById('oa-ownership-fields');
  if(!container) return;
  var isEs = document.getElementById('btn-es') && document.getElementById('btn-es').classList.contains('active');

  // Get all member data from Step 5
  function getMemberData(n) {
    var prefix = 's5-m' + n;
    var isCo = document.getElementById(prefix + '-co') && document.getElementById(prefix + '-co').classList.contains('selected');
    return {
      fname:   (document.getElementById(prefix + '-fname')  || {}).value || '',
      lname:   (document.getElementById(prefix + '-lname')  || {}).value || '',
      role:    (document.getElementById(prefix + '-role')   || {}).value || '',
      own:     (document.getElementById(prefix + '-own')    || {}).value || '',
      coname:  (document.getElementById(prefix + '-coname') || {}).value || '',
      coown:   (document.getElementById(prefix + '-coown')  || {}).value || '',
      corole:  (document.getElementById(prefix + '-corole') || {}).value || '',
      coorg:   (document.getElementById(prefix + '-coorg')  || {}).value || '',
      addr:    (document.getElementById(prefix + '-addr')   || {}).value || '',
      city:    (document.getElementById(prefix + '-city')   || {}).value || '',
      state:   (document.getElementById(prefix + '-state')  || {}).value || '',
      country: (document.getElementById(prefix + '-country')|| {}).value || 'US',
      isComp:  isCo
    };
  }

  // Read-only field helper
  function roField(label, value) {
    if(!value) return '';
    return '<div style="margin-bottom:8px">' +
      '<div style="font-size:.69rem;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">' + label + '</div>' +
      '<div style="font-size:.83rem;color:var(--navy);font-weight:500;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:7px 11px">' + value + '</div>' +
      '</div>';
  }

  function buildRow(n, d) {
    var name = d.isComp
      ? (d.coname || (isEs ? 'Empresa' : 'Company'))
      : (d.fname + ' ' + d.lname).trim() || (isEs ? 'Miembro ' + n : 'Member ' + n);
    var role    = d.isComp ? d.corole : d.role;
    var ownVal  = d.isComp ? d.coown  : d.own;
    var ownMissing = !ownVal || parseFloat(ownVal) === 0;
    var cardBorder = ownMissing ? '1.5px solid #fde68a' : '1.5px solid #e2e8f0';
    var cardBg     = ownMissing ? '#fffbeb' : '#fff';

    var r = '<div style="background:'+cardBg+';border:'+cardBorder+';border-radius:10px;padding:16px;margin-bottom:12px">';

    // ── Header: avatar + name + role ──
    r += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #f1f5f9">';
    r += '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--blue));display:flex;align-items:center;justify-content:center;font-size:.82rem;font-weight:700;color:#fff;flex-shrink:0">' + name.charAt(0).toUpperCase() + '</div>';
    r += '<div style="flex:1"><div style="font-size:.88rem;font-weight:700;color:var(--navy)">' + name;
    if(role) r += ' <span style="font-size:.72rem;color:#9ca3af;font-weight:400;margin-left:4px">(' + role + ')</span>';
    r += '</div>';
    r += '<div style="font-size:.7rem;color:#9ca3af;margin-top:2px">' + (isEs ? 'Miembro / Propietario ' + n : 'Member / Owner ' + n) + '</div>';
    r += '</div>';
    if(ownMissing) {
      r += '<span style="font-size:.68rem;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;padding:2px 8px;border-radius:10px;font-weight:600;white-space:nowrap">' + (isEs ? '% pendiente' : '% pending') + '</span>';
    } else {
      r += '<span style="font-size:.68rem;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;padding:2px 8px;border-radius:10px;font-weight:600">' + (isEs ? '✓ Completo' : '✓ Complete') + '</span>';
    }
    r += '</div>';

    // ── Read-only fields grid ──
    r += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">';
    if(!d.isComp) {
      r += roField(isEs ? 'Nombre' : 'First Name', d.fname);
      r += roField(isEs ? 'Apellido' : 'Last Name',  d.lname);
    } else {
      r += roField(isEs ? 'Empresa' : 'Company Name', d.coname);
      r += roField(isEs ? 'País de Incorporación' : 'Country of Incorporation', d.coorg || '');
    }
    r += roField(isEs ? 'Título / Rol' : 'Title / Role', role);
    if(d.addr)    r += roField(isEs ? 'Dirección' : 'Street Address', d.addr);
    if(d.city)    r += roField(isEs ? 'Ciudad' : 'City', d.city);
    if(d.state)   r += roField(isEs ? 'Estado' : 'State', d.state);
    if(d.country) r += roField(isEs ? 'País' : 'Country', d.country);
    r += '</div>';

    // ── Ownership % — editable, highlighted amber if missing ──
    r += '<div style="background:' + (ownMissing ? '#fef9c3' : '#f0fdf4') + ';border:1.5px solid ' + (ownMissing ? '#fde68a' : '#bbf7d0') + ';border-radius:8px;padding:10px 12px">';
    r += '<div style="font-size:.73rem;font-weight:700;color:' + (ownMissing ? '#92400e' : '#166534') + ';margin-bottom:6px">';
    r += ownMissing
      ? (isEs ? '⚠ % de Propiedad — requerido para tu Acuerdo Operativo' : '⚠ Ownership % — required for your Operating Agreement')
      : (isEs ? '✓ % de Propiedad' : '✓ Ownership %');
    r += '</div>';
    r += '<div style="display:flex;align-items:center;gap:10px">';
    r += '<input type="number" class="fm-input" id="oa-m'+n+'-own" value="'+(ownVal||'')+'" placeholder="'+(isEs?'ej. 100':'e.g. 100')+'" min="0" max="100" oninput="fmOaOwnershipTotal()" style="max-width:120px;border-color:'+(ownMissing?'#f59e0b':'#059669')+'">';
    r += '<span style="font-size:.85rem;font-weight:600;color:var(--navy)">%</span>';
    r += '</div></div>';

    r += '</div>';
    return r;
  }

  var html = '';

  // Member 1
  html += buildRow(1, getMemberData(1));

  // Additional members
  document.querySelectorAll('[id^="s5-member-"]').forEach(function(block) {
    var n = block.id.replace('s5-member-', '');
    html += buildRow(n, getMemberData(n));
  });

  // Total
  html += '<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:9px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin-top:4px">';
  html += '<span style="font-size:.82rem;font-weight:600;color:var(--navy)">' + (isEs ? 'Total de Propiedad' : 'Total Ownership') + '</span>';
  html += '<span id="oa-own-total" style="font-size:.95rem;font-weight:700;color:var(--navy)">0%</span>';
  html += '</div>';

  container.innerHTML = html;

  // Init total with existing values
  fmOaOwnershipTotal();
}

function fmOaOwnershipTotal() {
  var total = 0;
  document.querySelectorAll('[id^="oa-m"][id$="-own"]').forEach(function(inp){
    var v = parseFloat(inp.value); if(!isNaN(v)) total += v;
    // Update field border color
    if(!isNaN(v) && v > 0) inp.style.borderColor = '#059669';
  });
  var el = document.getElementById('oa-own-total');
  if(el) {
    el.textContent = total+'%';
    el.style.color = total===100 ? '#059669' : total>100 ? '#ef4444' : 'var(--navy)';
  }
}

var _fmSE=fmSetEntity;
fmSetEntity=function(type,el){
  _fmSE(type,el);
  var llc='<option value="LLC">LLC</option><option value="L.L.C.">L.L.C.</option><option value="Limited Liability Company">Limited Liability Company</option>';
  var corp='<option value="Corp">Corp</option><option value="Inc">Inc</option><option value="Corporation">Corporation</option><option value="Incorporated">Incorporated</option>';
  ['inp-designator2','inp-designator3'].forEach(function(id){var d=document.getElementById(id);if(d)d.innerHTML=type==='corp'?corp:llc;});
};



</script>
`
  return (
    <main dangerouslySetInnerHTML={{ __html: `<style>${styles}</style>${body}` }} />
  )
}
