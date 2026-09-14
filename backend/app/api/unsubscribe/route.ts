import { NextRequest, NextResponse } from 'next/server'
import { markUnsubscribed } from '@/lib/email-suppression'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // @brand-unified — unsubscribe global por email: si el cliente pidió salir
    // de las comunicaciones, la baja aplica a todas sus órdenes (opabiz y FBFC).
    // Lógica compartida con POST /api/unsubscribe/one-click (RFC 8058) en
    // lib/email-suppression.ts — un solo lugar que actualiza Order y
    // prospective_companies.
    const { ok } = await markUnsubscribed(email)
    if (!ok) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unsubscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
