'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type State = 'confirm' | 'loading' | 'done' | 'error'

function UnsubscribeContent() {
  const params = useSearchParams()
  const email = params.get('email') ?? ''

  const [state, setState] = useState<State>('confirm')

  async function handleUnsubscribe() {
    setState('loading')
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f6f9; font-family: 'Arial', sans-serif; }
      `}</style>

      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f4f6f9', padding: '24px',
      }}>
        <div style={{
          background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          maxWidth: '480px', width: '100%', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: '#1C2E44', padding: '24px 32px' }}>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>
              Florida Business Formation Center
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              mybusinessformation.com
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '36px 32px' }}>
            {state === 'confirm' && (
              <>
                <div style={{ fontSize: '24px', marginBottom: '12px', textAlign: 'center' }}>
                  ✉️
                </div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', textAlign: 'center', marginBottom: '12px' }}>
                  Unsubscribe from emails
                </h1>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, textAlign: 'center', marginBottom: '24px' }}>
                  Are you sure you want to unsubscribe{' '}
                  {email && (
                    <strong style={{ color: '#1e293b' }}>{email}</strong>
                  )}{' '}
                  from order update emails?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={handleUnsubscribe}
                    style={{
                      padding: '12px', borderRadius: '8px', border: 'none',
                      background: '#b91c1c', color: '#fff', fontSize: '15px',
                      fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Yes, unsubscribe me
                  </button>
                  <Link
                    href="/"
                    style={{
                      padding: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
                      background: '#fff', color: '#374151', fontSize: '15px',
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'center', textDecoration: 'none', display: 'block',
                    }}
                  >
                    Keep receiving updates
                  </Link>
                </div>
              </>
            )}

            {state === 'loading' && (
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', padding: '24px 0' }}>
                Processing...
              </p>
            )}

            {state === 'done' && (
              <>
                <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>✅</div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#166534', textAlign: 'center', marginBottom: '12px' }}>
                  You have been unsubscribed successfully
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, textAlign: 'center', marginBottom: '24px' }}>
                  You will no longer receive marketing emails from us.
                  Note that critical transactional emails (like order confirmations) may still be sent.
                </p>
                <div style={{ textAlign: 'center' }}>
                  <Link
                    href="/"
                    style={{ color: '#4f46e5', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}
                  >
                    ← Back to home
                  </Link>
                </div>
              </>
            )}

            {state === 'error' && (
              <>
                <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#b91c1c', textAlign: 'center', marginBottom: '12px' }}>
                  Something went wrong
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, textAlign: 'center', marginBottom: '24px' }}>
                  We couldn&apos;t process your request. Please try again or contact us at{' '}
                  <a href="mailto:support@mybusinessformation.com" style={{ color: '#4f46e5' }}>
                    support@mybusinessformation.com
                  </a>
                </p>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setState('confirm')}
                    style={{
                      background: 'none', border: 'none', color: '#4f46e5',
                      fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    ← Try again
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  )
}
