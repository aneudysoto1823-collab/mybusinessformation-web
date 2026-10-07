'use client'

import { useState } from 'react'
import { OPENING_SCRIPT } from '@/lib/opabiz-training'
import type { Lang } from './ConnectShell'

const T = {
  es: { titulo: 'Guion de apertura', sub: 'Dilo al empezar cada conversación con un cliente.', copiar: 'Copiar', copiado: 'Copiado', ver: 'Ver guion', ocultar: 'Ocultar', otroIdioma: 'Si el cliente habla inglés:' },
  en: { titulo: 'Opening script', sub: 'Say this at the start of every conversation with a client.', copiar: 'Copy', copiado: 'Copied', ver: 'Show script', ocultar: 'Hide', otroIdioma: 'If the client speaks Spanish:' },
}

// Guion que el agente dice al empezar cada conversación (aclara que no somos
// abogados ni gobierno). `collapsible` lo muestra cerrado en el panel, para no
// ocupar espacio; en el entrenamiento va siempre abierto.
export default function OpeningScript({ lang, collapsible = false }: { lang: Lang; collapsible?: boolean }) {
  const t = T[lang]
  const [open, setOpen] = useState(!collapsible)
  const [copied, setCopied] = useState<Lang | null>(null)
  const otro: Lang = lang === 'es' ? 'en' : 'es'

  async function copy(l: Lang) {
    try {
      await navigator.clipboard.writeText(OPENING_SCRIPT[l])
      setCopied(l)
      setTimeout(() => setCopied(null), 1800)
    } catch { /* el portapapeles puede estar bloqueado; el texto igual se ve */ }
  }

  return (
    <div className="os-card">
      <style>{`
        .os-card{background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px 16px}
        .os-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
        .os-title{font-size:.88rem;font-weight:700;color:#1E3A8A}
        .os-sub{font-size:.76rem;color:#3B5BA9;margin-top:2px}
        .os-toggle{background:#fff;border:1.5px solid #2563EB;color:#2563EB;border-radius:8px;padding:5px 12px;font-size:.76rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
        .os-text{margin-top:10px;background:#fff;border-radius:10px;padding:12px 14px;font-size:.88rem;line-height:1.6;color:#1E293B}
        .os-row{display:flex;justify-content:flex-end;margin-top:6px}
        .os-copy{background:none;border:none;color:#2563EB;font-size:.76rem;font-weight:700;cursor:pointer;font-family:inherit;padding:4px 2px}
        .os-alt{margin-top:10px;font-size:.74rem;font-weight:700;color:#3B5BA9}
      `}</style>
      <div className="os-head">
        <div>
          <div className="os-title">{t.titulo}</div>
          <div className="os-sub">{t.sub}</div>
        </div>
        {collapsible && (
          <button type="button" className="os-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
            {open ? t.ocultar : t.ver}
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="os-text">{OPENING_SCRIPT[lang]}</div>
          <div className="os-row"><button type="button" className="os-copy" onClick={() => copy(lang)}>{copied === lang ? t.copiado : t.copiar}</button></div>
          <div className="os-alt">{t.otroIdioma}</div>
          <div className="os-text">{OPENING_SCRIPT[otro]}</div>
          <div className="os-row"><button type="button" className="os-copy" onClick={() => copy(otro)}>{copied === otro ? t.copiado : t.copiar}</button></div>
        </>
      )}
    </div>
  )
}
