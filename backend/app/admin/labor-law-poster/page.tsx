export const dynamic = 'force-dynamic'

import Link from 'next/link'
import SendPosterForm from './SendPosterForm'
import { listPosterVariants, getPosterUrl, POSTER_TITLES, type PosterBrand, type PosterLang } from '@/lib/labor-law-poster'

const BRAND_LABEL: Record<PosterBrand, string> = { opabiz: 'OpaBiz', fbfc: 'Florida Business Formation Center (MyBiz)' }
const LANG_LABEL: Record<PosterLang, string> = { en: 'Inglés', es: 'Español' }

export default function LaborLawPosterAdminPage() {
  const variants = listPosterVariants()
  const groups: { brand: PosterBrand; lang: PosterLang }[] = [
    { brand: 'opabiz', lang: 'en' },
    { brand: 'opabiz', lang: 'es' },
    { brand: 'fbfc', lang: 'en' },
    { brand: 'fbfc', lang: 'es' },
  ]

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f4f6f9;font-family:var(--font-sans)}
        .wrap{max-width:1100px;margin:0 auto;padding:28px 24px}
        .card{background:#fff;border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 1px 4px rgba(28,46,68,.05);overflow:hidden;margin-bottom:20px}
        .card-head{padding:16px 22px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
        .card-title{font-size:.95rem;font-weight:700;color:#1C2E44}
        .card-sub{font-size:.75rem;color:#94A3B8;margin-top:2px}
        .badge{font-size:.68rem;font-weight:700;padding:3px 9px;border-radius:99px;text-transform:uppercase;letter-spacing:.4px}
        .badge-ready{background:#DCFCE7;color:#166534}
        .badge-pending{background:#FEF3C7;color:#92400E}
        .btn{padding:8px 16px;border-radius:8px;font-size:.8rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .btn-primary{background:#2563EB;color:#fff}
        .btn-primary:hover:not(:disabled){background:#1d4ed8}
        .btn-ghost{background:#F1F5F9;color:#475569;border:1px solid #E2E8F0}
        .btn-ghost:hover:not(:disabled){background:#E2E8F0}
        .btn-sm{padding:5px 11px;font-size:.72rem}
        .poster-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:10px 0;border-bottom:1px solid #F1F5F9}
        .poster-row:last-child{border-bottom:none}
        .poster-name{font-size:.8rem;color:#334155;min-width:220px;font-weight:600}
        .pending-note{font-size:.75rem;color:#94A3B8;font-style:italic}
        .send-box{padding:16px 22px;background:#F8FAFC;border-top:1px solid #F1F5F9}
        .send-label{font-size:.75rem;color:#64748b;font-weight:600;margin-bottom:2px}
        @media(max-width:768px){.wrap{padding:18px 14px}.card-head{padding:14px 16px}.send-box{padding:14px 16px}}
        @media(max-width:480px){.btn{min-height:44px;padding:10px 16px}.btn-sm{min-height:36px;padding:6px 12px}h1{font-size:1.15rem !important}}
      `}</style>

      <div className="wrap">
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Link href="/admin" style={{ color: '#94A3B8', fontSize: '.8rem', textDecoration: 'none' }}>← Admin</Link>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ color: '#1C2E44', fontSize: '.8rem', fontWeight: 600 }}>Labor Law Poster</span>
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1C2E44' }}>Labor Law Poster</h1>
          <p style={{ fontSize: '.8rem', color: '#94A3B8', marginTop: 2 }}>
            Póster Federal + Florida de cumplimiento laboral (servicio $120). Ver, descargar, o enviar por email.
          </p>
        </div>

        {groups.map(({ brand, lang }) => {
          const items = variants.filter(v => v.brand === brand && v.lang === lang)
          const allAvailable = items.every(v => v.available)
          const anyAvailable = items.some(v => v.available)

          return (
            <div className="card" key={`${brand}-${lang}`}>
              <div className="card-head">
                <div>
                  <span className="card-title">{BRAND_LABEL[brand]} &middot; {LANG_LABEL[lang]}</span>
                  <div className="card-sub">{items.length} pósters en este set</div>
                </div>
                <span className={`badge ${allAvailable ? 'badge-ready' : 'badge-pending'}`}>
                  {allAvailable ? 'Listo' : anyAvailable ? 'Parcial' : 'Próximamente'}
                </span>
              </div>

              <div style={{ padding: '4px 22px' }}>
                {items.map(v => (
                  <div className="poster-row" key={v.key}>
                    <span className="poster-name">{lang === 'es' ? POSTER_TITLES[v.key].es : POSTER_TITLES[v.key].en}</span>
                    {v.available ? (
                      <>
                        <a href={getPosterUrl(v.key, brand, lang)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Ver</a>
                        <a href={getPosterUrl(v.key, brand, lang)} download className="btn btn-ghost btn-sm">Descargar</a>
                      </>
                    ) : (
                      <span className="pending-note">Todavía no generado</span>
                    )}
                  </div>
                ))}
              </div>

              {allAvailable && (
                <div className="send-box">
                  <div className="send-label">Enviar este set por email</div>
                  <SendPosterForm brand={brand} lang={lang} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
