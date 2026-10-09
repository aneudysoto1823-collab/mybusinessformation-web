'use client'

import { useState } from 'react'
import SendPosterForm from './SendPosterForm'

export type TemplateType = 'email' | 'carta' | 'guia' | 'poster'

export interface TemplateItem {
  id: string
  type: TemplateType
  brand: 'opabiz' | 'fbfc'
  lang: 'en' | 'es'
  title: string
  usedIn: string
  url: string
  // Existe en un solo idioma: se muestra sin importar el filtro de idioma.
  singleLang?: boolean
}

const TYPE_LABEL: Record<TemplateType, string> = { email: 'Email', carta: 'Carta PDF', guia: 'Guía PDF', poster: 'Póster PDF' }
const BRAND_LABEL = { opabiz: 'OpaBiz', fbfc: 'MyBiz' } as const
const LANG_LABEL = { en: 'Inglés', es: 'Español' } as const

const TYPE_FILTERS: { value: TemplateType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'email', label: 'Emails' },
  { value: 'carta', label: 'Cartas' },
  { value: 'guia', label: 'Guías' },
  { value: 'poster', label: 'Póster' },
]

export default function TemplatesGallery({ items, initialType }: { items: TemplateItem[]; initialType?: string }) {
  const [type, setType] = useState<TemplateType | 'all'>(
    TYPE_FILTERS.some(f => f.value === initialType) ? initialType as TemplateType : 'all',
  )
  const [brand, setBrand] = useState<'all' | 'opabiz' | 'fbfc'>('all')
  const [lang, setLang] = useState<'en' | 'es'>('es')
  const [openEmail, setOpenEmail] = useState<TemplateItem | null>(null)

  const visible = items.filter(i =>
    (type === 'all' || i.type === type) &&
    (brand === 'all' || i.brand === brand) &&
    (i.lang === lang || i.singleLang),
  )

  return (
    <>
      <style>{`
        .tg-filters{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-bottom:18px}
        .tg-group{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
        .tg-group-label{font-size:.72rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.4px;margin-right:2px}
        .tg-pill{padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:600;border:1.5px solid #E2E8F0;background:#fff;color:#475569;cursor:pointer;font-family:inherit}
        .tg-pill.on{border-color:#2563EB;color:#2563EB;background:#F7FAFF}
        .tg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
        .tg-card{background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:8px;min-width:0}
        .tg-tags{display:flex;gap:6px;flex-wrap:wrap}
        .tg-tag{font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:6px;background:#F1F5F9;color:#475569}
        .tg-tag.brand-fbfc{background:#EEF2FF;color:#3730A3}
        .tg-tag.brand-opabiz{background:#EFF6FF;color:#1D4ED8}
        .tg-title{font-size:.92rem;font-weight:700;color:#1C2E44}
        .tg-used{font-size:.76rem;color:#64748b;line-height:1.5;flex:1}
        .tg-actions{display:flex;gap:8px;flex-wrap:wrap}
        .tg-btn{padding:7px 14px;border-radius:8px;font-size:.78rem;font-weight:700;border:1.5px solid #2563EB;background:#fff;color:#2563EB;cursor:pointer;text-decoration:none;font-family:inherit;display:inline-flex;align-items:center}
        .tg-btn.ghost{border-color:#E2E8F0;color:#475569}
        .tg-send{border-top:1px solid #F1F5F9;padding-top:8px;font-size:.72rem;color:#64748b;font-weight:600}
        .tg-empty{padding:30px;text-align:center;color:#94A3B8;font-size:.85rem;background:#fff;border:1px dashed #E2E8F0;border-radius:12px}
        .tg-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}
        .tg-modal{background:#fff;border-radius:12px;width:100%;max-width:760px;height:92vh;display:flex;flex-direction:column;overflow:hidden}
        .tg-modal-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #E2E8F0}
        .tg-modal iframe{flex:1;border:0;width:100%;background:#f4f6f9}
        @media(max-width:480px){.tg-btn{min-height:44px}.tg-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="tg-filters">
        <div className="tg-group">
          <span className="tg-group-label">Tipo</span>
          {TYPE_FILTERS.map(f => (
            <button key={f.value} className={`tg-pill${type === f.value ? ' on' : ''}`} onClick={() => setType(f.value)}>{f.label}</button>
          ))}
        </div>
        <div className="tg-group">
          <span className="tg-group-label">Marca</span>
          {(['all', 'fbfc', 'opabiz'] as const).map(b => (
            <button key={b} className={`tg-pill${brand === b ? ' on' : ''}`} onClick={() => setBrand(b)}>{b === 'all' ? 'Todas' : BRAND_LABEL[b]}</button>
          ))}
        </div>
        <div className="tg-group">
          <span className="tg-group-label">Idioma</span>
          {(['es', 'en'] as const).map(l => (
            <button key={l} className={`tg-pill${lang === l ? ' on' : ''}`} onClick={() => setLang(l)}>{LANG_LABEL[l]}</button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="tg-empty">No hay plantillas con estos filtros.</div>
      ) : (
        <div className="tg-grid">
          {visible.map(item => (
            <div className="tg-card" key={item.id}>
              <div className="tg-tags">
                <span className="tg-tag">{TYPE_LABEL[item.type]}</span>
                <span className={`tg-tag brand-${item.brand}`}>{BRAND_LABEL[item.brand]}</span>
                <span className="tg-tag">{LANG_LABEL[item.lang]}</span>
              </div>
              <div className="tg-title">{item.title}</div>
              <div className="tg-used">{item.usedIn}</div>
              <div className="tg-actions">
                {item.type === 'email' ? (
                  <button className="tg-btn" onClick={() => setOpenEmail(item)}>Ver email</button>
                ) : (
                  <a className="tg-btn" href={item.url} target="_blank" rel="noreferrer">Ver PDF</a>
                )}
                {item.type !== 'email' && item.type !== 'carta' && (
                  <a className="tg-btn ghost" href={item.url} download>Descargar</a>
                )}
              </div>
              {item.type === 'poster' && (
                <div className="tg-send">
                  Enviar por email
                  <SendPosterForm brand={item.brand} lang={item.lang} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {openEmail && (
        <div className="tg-modal-bg" onClick={() => setOpenEmail(null)}>
          <div className="tg-modal" onClick={e => e.stopPropagation()}>
            <div className="tg-modal-head">
              <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#1C2E44' }}>
                {openEmail.title} · {BRAND_LABEL[openEmail.brand]} · {LANG_LABEL[openEmail.lang]}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a className="tg-btn ghost" href={openEmail.url} target="_blank" rel="noreferrer">Abrir en pestaña</a>
                <button className="tg-btn" onClick={() => setOpenEmail(null)}>Cerrar</button>
              </div>
            </div>
            <iframe src={openEmail.url} title={openEmail.title} />
          </div>
        </div>
      )}
    </>
  )
}
