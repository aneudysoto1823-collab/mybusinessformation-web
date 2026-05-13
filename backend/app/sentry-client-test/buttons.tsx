'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'

type Status = { kind: 'idle' } | { kind: 'sent'; label: string } | { kind: 'error'; label: string }

export function SentryTestButtons() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  // 1. Error no atrapado — Next.js / Sentry global handler lo captura solo.
  //    Se dispara en setTimeout para que el error salga del handler de React
  //    y vaya al global error handler (lo que Sentry escucha en browser).
  const triggerUncaughtThrow = () => {
    setStatus({ kind: 'sent', label: '1. Uncaught throw disparado — el error va a saltar en 100ms' })
    setTimeout(() => {
      throw new Error('[sentry-client-test-uncaught] Test uncaught error from client button')
    }, 100)
  }

  // 2. captureException: error que el código atrapa con try/catch y reporta explícitamente.
  const triggerCaptureException = () => {
    try {
      throw new Error('[sentry-client-test-captureException] Test captureException from client button')
    } catch (err) {
      Sentry.captureException(err)
      setStatus({ kind: 'sent', label: '2. captureException enviado a Sentry' })
    }
  }

  // 3. captureMessage: mensaje informativo sin que haya un error real.
  const triggerCaptureMessage = () => {
    Sentry.captureMessage(
      '[sentry-client-test-captureMessage] Test captureMessage from client button',
      'info'
    )
    setStatus({ kind: 'sent', label: '3. captureMessage enviado a Sentry' })
  }

  const buttonStyle: React.CSSProperties = {
    padding: '12px 16px',
    background: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'inherit',
    width: '100%',
    minHeight: 48,
    textAlign: 'left',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button onClick={triggerUncaughtThrow} style={buttonStyle}>
        1. Disparar uncaught throw
      </button>
      <button onClick={triggerCaptureException} style={{ ...buttonStyle, background: '#7c3aed' }}>
        2. Sentry.captureException()
      </button>
      <button onClick={triggerCaptureMessage} style={{ ...buttonStyle, background: '#059669' }}>
        3. Sentry.captureMessage()
      </button>

      {status.kind === 'sent' && (
        <div
          style={{
            padding: '12px 14px',
            background: '#0f3a2e',
            border: '1px solid #166534',
            borderRadius: 8,
            color: '#bbf7d0',
            fontSize: 13,
            marginTop: 4,
          }}
        >
          ✓ {status.label}
        </div>
      )}
    </div>
  )
}
