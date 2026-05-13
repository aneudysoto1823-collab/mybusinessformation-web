import { notFound } from 'next/navigation'
import { SentryTestButtons } from './buttons'

// Gated: solo accesible en development y preview. En production retorna 404.
// VERCEL_ENV es seteada automáticamente por Vercel:
//   - 'production' en deploys de main
//   - 'preview' en deploys de branches/PRs
//   - 'development' en `vercel dev`
//   - undefined en `npm run dev` local
export default function SentryClientTestPage() {
  if (process.env.VERCEL_ENV === 'production') {
    notFound()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1c2e',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          background: '#1C2E44',
          padding: '32px',
          borderRadius: 12,
          border: '1px solid #2c4060',
        }}
      >
        <h1 style={{ fontSize: 24, margin: '0 0 8px', color: '#fff' }}>
          Sentry Client-Side Test
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.6 }}>
          Ruta de validación periódica para Sentry browser-side. Solo accesible
          en <strong>development</strong> y <strong>preview</strong>. En
          producción retorna 404. Dispara los 3 tipos de eventos que Sentry
          captura desde el browser y verifica que llegan al dashboard de Sentry.
        </p>

        <SentryTestButtons />

        <hr style={{ border: 'none', borderTop: '1px solid #2c4060', margin: '24px 0' }} />

        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 4px' }}><strong>Cómo validar:</strong></p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>Apretar cada botón en orden.</li>
            <li>Abrir <a href="https://sentry.io" target="_blank" rel="noopener" style={{ color: '#60a5fa' }}>sentry.io</a> → proyecto <code>javascript-nextjs</code> → Issues.</li>
            <li>Filtrar por mensaje <code>[sentry-client-test-*]</code>. Deberían aparecer 3 issues nuevos en menos de 60s.</li>
            <li>Confirmar que el <strong>filtro PII funciona</strong>: el evento NO debe contener email/teléfono/PII en breadcrumbs ni request.</li>
            <li>Marcar los 3 issues como Resolved post-validación.</li>
          </ol>
        </div>

        <p style={{ fontSize: 11, color: '#64748b', marginTop: 16, textAlign: 'center' }}>
          VERCEL_ENV: <code>{process.env.VERCEL_ENV ?? 'undefined (local)'}</code>
        </p>
      </div>
    </div>
  )
}
