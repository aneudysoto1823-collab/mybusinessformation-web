'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { ManualChapter } from '@/lib/manual'

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Recorta el texto alrededor de la primera coincidencia y resalta los términos.
// Normalizar quita acentos sin cambiar el largo del string, así que los
// índices encontrados en la versión normalizada sirven para el original.
function snippet(text: string, terms: string[]): string {
  const n = norm(text)
  let pos = -1
  for (const t of terms) { const i = n.indexOf(t); if (i !== -1 && (pos === -1 || i < pos)) pos = i }
  const start = Math.max(0, pos - 70)
  const end = Math.min(text.length, start + 220)
  const cut = text.slice(start, end)
  const cutN = n.slice(start, end)
  const marks: [number, number][] = []
  for (const t of terms) {
    let i = cutN.indexOf(t)
    while (i !== -1) { marks.push([i, i + t.length]); i = cutN.indexOf(t, i + t.length) }
  }
  marks.sort((a, b) => a[0] - b[0])
  let out = ''
  let last = 0
  for (const [a, b] of marks) {
    if (a < last) continue
    out += escapeHtml(cut.slice(last, a)) + '<mark>' + escapeHtml(cut.slice(a, b)) + '</mark>'
    last = b
  }
  out += escapeHtml(cut.slice(last))
  return (start > 0 ? '... ' : '') + out + (end < text.length ? ' ...' : '')
}

type Result = { id: string; chapter: string; number: number; heading: string; html: string; score: number }

export default function ManualView({ chapters }: { chapters: ManualChapter[] }) {
  const [query, setQuery] = useState('')
  const [sendOpen, setSendOpen] = useState(false)
  const [sendEmail, setSendEmail] = useState('')
  const [sendNota, setSendNota] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function enviar() {
    setSending(true)
    setSendMsg(null)
    try {
      const res = await fetch('/api/admin/manual/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sendEmail, nota: sendNota }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setSendMsg({ ok: false, text: data.error || 'No se pudo enviar.' }); return }
      setSendMsg({ ok: true, text: `Enviado a ${sendEmail}.` })
      setSendEmail('')
      setSendNota('')
    } catch {
      setSendMsg({ ok: false, text: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setSending(false)
    }
  }
  const inputRef = useRef<HTMLInputElement>(null)

  // "/" enfoca el buscador desde cualquier parte de la página.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') setQuery('')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo<Result[]>(() => {
    const terms = norm(query).split(/\s+/).filter(t => t.length >= 2)
    if (terms.length === 0) return []
    const out: Result[] = []
    for (const ch of chapters) {
      for (const s of ch.sections) {
        const head = norm(`${ch.title} ${s.heading}`)
        const body = norm(s.text)
        if (!terms.every(t => head.includes(t) || body.includes(t))) continue
        let score = 0
        for (const t of terms) {
          if (head.includes(t)) score += 5
          score += Math.min(body.split(t).length - 1, 5)
        }
        out.push({
          id: s.id, chapter: ch.title, number: ch.number, heading: s.heading,
          html: snippet(s.text || s.heading, terms), score,
        })
      }
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 30)
  }, [query, chapters])

  const goTo = (id: string) => {
    setQuery('')
    requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        history.replaceState(null, '', `#${id}`)
      }
    })
  }

  const written = chapters.filter(c => !c.pending)

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        body{background:#f4f6f9;margin:0;font-family:var(--font-sans)}
        .m-wrap{max-width:1180px;margin:0 auto;padding:24px 24px 80px}
        .m-top{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:#f4f6f9;padding:12px 0 14px}
        .m-search{position:relative}
        .m-search input{width:100%;padding:13px 16px 13px 44px;font-size:16px;border:1.5px solid #E2E8F0;border-radius:12px;background:#fff;color:#1C2E44;font-family:inherit;outline:none}
        .m-search input:focus{border-color:#2563EB}
        .m-search svg{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:#94A3B8}
        .m-kbd{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:.7rem;color:#94A3B8;border:1px solid #E2E8F0;border-radius:6px;padding:2px 7px;background:#F8FAFC}
        .m-results{margin-top:8px;background:#fff;border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 8px 24px rgba(28,46,68,.08);max-height:65vh;overflow:auto}
        .m-res{display:block;width:100%;text-align:left;padding:13px 18px;border:none;border-bottom:1px solid #F1F5F9;background:none;cursor:pointer;font-family:inherit}
        .m-res:hover{background:#F8FAFC}
        .m-res:last-child{border-bottom:none}
        .m-res-path{font-size:.72rem;color:#2563EB;font-weight:700;margin-bottom:3px}
        .m-res-text{font-size:.84rem;color:#475569;line-height:1.5}
        .m-res-text mark{background:#DBEAFE;color:#1C2E44;border-radius:3px;padding:0 2px}
        .m-empty{padding:18px;font-size:.85rem;color:#94A3B8}
        .m-grid{display:grid;grid-template-columns:260px minmax(0,1fr);gap:28px;align-items:start}
        .m-side{position:sticky;top:96px;max-height:calc(100vh - 110px);overflow:auto;background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:14px 10px}
        .m-side-title{font-size:.7rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;padding:2px 10px 8px}
        .m-side .it{display:flex;gap:8px;padding:7px 10px;border-radius:8px;font-size:.82rem;color:#1C2E44;text-decoration:none;line-height:1.35}
        .m-side a.it:hover{background:#F1F5F9}
        .m-side .it.p{color:#CBD5E1}
        .m-side .n{color:#94A3B8;min-width:20px;flex-shrink:0;font-variant-numeric:tabular-nums}
        .m-grid>main{min-width:0}
        .m-card{min-width:0;background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:26px 30px;margin-bottom:22px}
        .m-toc{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px 24px}
        .m-toc li a,.m-toc li div{display:block;padding:9px 10px;border-radius:8px;text-decoration:none}
        .m-toc li a:hover{background:#F1F5F9}
        .m-toc .t{font-size:.9rem;font-weight:700;color:#1C2E44}
        .m-toc .s{font-size:.78rem;color:#64748B;margin-top:2px;line-height:1.4}
        .m-toc .p .t{color:#94A3B8}
        .m-badge{display:inline-block;font-size:.65rem;font-weight:700;color:#94A3B8;border:1px solid #E2E8F0;border-radius:20px;padding:1px 8px;margin-left:6px;vertical-align:middle}
        .m-ch-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;border-bottom:1px solid #F1F5F9;padding-bottom:14px;margin-bottom:6px}
        .m-ch-head h1{font-size:1.45rem;color:#1C2E44;margin:0;font-weight:800}
        .m-ch-head .num{color:#2563EB;margin-right:8px}
        .m-ch-head .upd{font-size:.72rem;color:#94A3B8}
        .m-body{font-size:.93rem;line-height:1.7;color:#334155}
        .m-body h2{font-size:1.1rem;color:#1C2E44;margin:28px 0 8px;scroll-margin-top:100px}
        .m-body h3{font-size:.97rem;color:#1C2E44;margin:20px 0 6px}
        .m-body p{margin:0 0 12px}
        .m-body ul,.m-body ol{margin:0 0 12px;padding-left:22px}
        .m-body li{margin-bottom:4px}
        .m-body strong{color:#1C2E44}
        .m-body a{color:#2563EB}
        .m-body code{background:#F1F5F9;border-radius:4px;padding:1px 5px;font-size:.85em}
        .m-body blockquote{margin:0 0 14px;padding:10px 16px;border-left:3px solid #2563EB;background:#F8FAFC;border-radius:0 8px 8px 0;color:#475569}
        .m-body blockquote p{margin:0}
        .m-table{overflow-x:auto;margin:0 0 16px}
        .m-body table{width:100%;border-collapse:collapse;font-size:.84rem}
        .m-body th{background:#F8FAFC;text-align:left;padding:9px 12px;border-bottom:1px solid #E2E8F0;color:#1C2E44;font-weight:700;white-space:nowrap}
        .m-body td{padding:9px 12px;border-bottom:1px solid #F1F5F9;vertical-align:top}
        .m-up{display:inline-block;margin-top:14px;font-size:.78rem;color:#2563EB;text-decoration:none;border:1.5px solid #2563EB;border-radius:8px;padding:5px 12px}
        .m-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
        .m-btn{background:#fff;color:#2563EB;border:1.5px solid #2563EB;border-radius:9px;padding:9px 16px;font-size:.84rem;font-weight:700;cursor:pointer;font-family:inherit;min-height:40px}
        .m-btn:hover:not(:disabled){background:#F7FAFF}
        .m-btn:disabled{opacity:.5;cursor:not-allowed}
        .m-btn-ghost{color:#475569;border-color:#E2E8F0}
        .m-modal-bg{position:fixed;inset:0;background:rgba(15,28,46,.45);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px}
        .m-modal{background:#fff;border-radius:14px;padding:24px;width:100%;max-width:460px;box-shadow:0 20px 50px rgba(15,28,46,.25)}
        .m-modal-title{font-size:1.05rem;font-weight:700;color:#1C2E44}
        .m-modal-sub{font-size:.82rem;color:#64748B;line-height:1.5;margin:6px 0 14px}
        .m-label{display:block;font-size:.78rem;font-weight:700;color:#1C2E44;margin:10px 0 5px}
        .m-input{width:100%;padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:9px;font-size:16px;font-family:inherit;color:#1C2E44;outline:none;resize:vertical}
        .m-input:focus{border-color:#2563EB}
        .m-ok,.m-err{font-size:.82rem;font-weight:600;border-radius:9px;padding:9px 12px;margin-top:12px}
        .m-ok{background:#ECFDF5;color:#065F46}
        .m-err{background:#FEF2F2;color:#991B1B}
        .m-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
        @media print{
          body{background:#fff}
          .m-wrap{padding:0;max-width:none}
          .m-top,.m-side,.m-actions,.m-up,.m-modal-bg,.m-crumb{display:none !important}
          .m-grid{display:block}
          .m-card{border:none;padding:0;margin:0 0 12px;break-before:page}
          #indice{break-before:auto;margin-top:18px}
          @page{margin:16mm 14mm}
          .m-body a{color:#2563EB}
          .m-table{overflow:visible}
        }
        @media(max-width:900px){.m-grid{grid-template-columns:minmax(0,1fr)}.m-side{display:none}}
        @media(max-width:768px){.m-wrap{padding:16px 16px 60px}.m-card{padding:20px 18px}.m-toc{grid-template-columns:minmax(0,1fr)}.m-kbd{display:none}}
      `}</style>

      <div className="m-wrap">
        <div className="m-crumb" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/admin" style={{ color: '#94A3B8', fontSize: '.8rem', textDecoration: 'none' }}>← Admin</Link>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <span style={{ color: '#1C2E44', fontSize: '.8rem', fontWeight: 600 }}>Manual</span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1C2E44', margin: '0 0 2px' }}>Manual de OpaBiz</h1>
        <p style={{ fontSize: '.85rem', color: '#64748B', margin: 0 }}>
          Cómo funciona el negocio, explicado de forma sencilla. Los precios se leen directo del sistema, siempre están al día.
        </p>
        <div className="m-actions">
          <button type="button" className="m-btn" onClick={() => window.print()}>Descargar PDF</button>
          <button type="button" className="m-btn" onClick={() => { setSendOpen(true); setSendMsg(null) }}>Enviar por email</button>
        </div>
        {sendOpen && (
          <div className="m-modal-bg" role="dialog" aria-modal="true" aria-labelledby="m-send-title" onClick={e => { if (e.target === e.currentTarget) setSendOpen(false) }}>
            <div className="m-modal">
              <div id="m-send-title" className="m-modal-title">Enviar el manual por email</div>
              <p className="m-modal-sub">Le llega el manual completo como archivo (se abre en cualquier navegador) y un link a esta versión en línea. Es de uso interno: no lo mandes a clientes.</p>
              <label className="m-label" htmlFor="m-send-email">Email</label>
              <input id="m-send-email" className="m-input" type="email" value={sendEmail} onChange={e => setSendEmail(e.target.value)} placeholder="nombre@ejemplo.com" autoFocus />
              <label className="m-label" htmlFor="m-send-nota">Mensaje (opcional)</label>
              <textarea id="m-send-nota" className="m-input" rows={3} value={sendNota} onChange={e => setSendNota(e.target.value)} placeholder="Ej.: Aquí tienes el manual para que lo leas antes de empezar." />
              {sendMsg && <div className={sendMsg.ok ? 'm-ok' : 'm-err'}>{sendMsg.text}</div>}
              <div className="m-modal-actions">
                <button type="button" className="m-btn m-btn-ghost" onClick={() => setSendOpen(false)}>Cerrar</button>
                <button type="button" className="m-btn" onClick={enviar} disabled={sending || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sendEmail.trim())}>{sending ? 'Enviando…' : 'Enviar'}</button>
              </div>
            </div>
          </div>
        )}

        <div className="m-top">
          <div className="m-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar en el manual (ej: reembolso, agente registrado, precio EIN)"
              aria-label="Buscar en el manual"
            />
            {!query && <span className="m-kbd">/</span>}
          </div>
          {query.trim().length >= 2 && (
            <div className="m-results">
              {results.length === 0 ? (
                <div className="m-empty">No encontré nada con &quot;{query}&quot;. Prueba con otra palabra.</div>
              ) : results.map(r => (
                <button key={r.id} className="m-res" onClick={() => goTo(r.id)}>
                  <div className="m-res-path">{r.number}. {r.chapter}{r.heading ? ` › ${r.heading}` : ''}</div>
                  <div className="m-res-text" dangerouslySetInnerHTML={{ __html: r.html }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="m-grid">
          <nav className="m-side" aria-label="Capítulos">
            <div className="m-side-title">Capítulos</div>
            {chapters.map(c => c.pending ? (
              <div key={c.slug} className="it p"><span className="n">{c.number}</span>{c.title}</div>
            ) : (
              <a key={c.slug} className="it" href={`#cap-${c.slug}`} onClick={e => { e.preventDefault(); goTo(`cap-${c.slug}`) }}>
                <span className="n">{c.number}</span>{c.title}
              </a>
            ))}
          </nav>

          <main>
            <section className="m-card" id="indice">
              <div className="m-ch-head"><h1>Índice</h1><span className="upd">{written.length} de {chapters.length} capítulos escritos</span></div>
              <ul className="m-toc">
                {chapters.map(c => (
                  <li key={c.slug} className={c.pending ? 'p' : ''}>
                    {c.pending ? (
                      <div>
                        <div className="t">{c.number}. {c.title}<span className="m-badge">Próximamente</span></div>
                        {c.summary && <div className="s">{c.summary}</div>}
                      </div>
                    ) : (
                      <a href={`#cap-${c.slug}`} onClick={e => { e.preventDefault(); goTo(`cap-${c.slug}`) }}>
                        <div className="t">{c.number}. {c.title}</div>
                        {c.summary && <div className="s">{c.summary}</div>}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {written.map(c => (
              <article key={c.slug} className="m-card" id={`cap-${c.slug}`} style={{ scrollMarginTop: 100 }}>
                <div className="m-ch-head">
                  <h1><span className="num">{c.number}.</span>{c.title}</h1>
                  {c.updated && <span className="upd">Actualizado: {c.updated}</span>}
                </div>
                <div className="m-body" dangerouslySetInnerHTML={{ __html: c.html }} />
                <a className="m-up" href="#indice" onClick={e => { e.preventDefault(); goTo('indice') }}>Volver al índice</a>
              </article>
            ))}
          </main>
        </div>
      </div>
    </>
  )
}
