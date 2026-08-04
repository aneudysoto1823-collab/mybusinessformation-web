'use client'

import type { ReactNode } from 'react'

// Modal genérico "Cómo funciona" — mismo click-para-explicar que el link a
// doc 31 en /admin/marketing, pero el resumen vive adentro del panel en vez
// de mandar a un archivo .md en GitHub (decisión founder 2026-08-04, solo
// para /admin/citas y /admin/opabiz por ahora).
export default function HowItWorksModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 640, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1C2E44', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.5rem', lineHeight: 1, padding: 0 }}
          >
            &times;
          </button>
        </div>
        <div className="how-it-works-body">{children}</div>
      </div>
      <style>{`
        .how-it-works-body { font-size: .85rem; color: #374151; line-height: 1.7; }
        .how-it-works-body h3 { font-size: .85rem; font-weight: 700; color: #1C2E44; margin: 18px 0 6px; }
        .how-it-works-body h3:first-child { margin-top: 0; }
        .how-it-works-body ul { margin: 0 0 4px 18px; }
        .how-it-works-body li { margin-bottom: 4px; }
        .how-it-works-body p { margin-bottom: 8px; }
        .how-it-works-body code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: .8em; }
      `}</style>
    </div>
  )
}
