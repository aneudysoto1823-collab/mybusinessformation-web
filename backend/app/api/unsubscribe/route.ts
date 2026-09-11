import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // @brand-unified — unsubscribe global por email: si el cliente pidió salir
    // de las comunicaciones, la baja aplica a todas sus órdenes (opabiz y FBFC).
    const normalizedEmail = email.toLowerCase().trim()
    const supabase = getSupabaseAdmin()

    const { error: orderError } = await supabase
      .from('Order')
      .update({ unsubscribed: true })
      .eq('email', normalizedEmail)

    // Los leads de campaña (carta de cumplimiento B1, /admin/campaigns) no
    // tienen ninguna Order asociada todavía — viven en prospective_companies.
    // Sin esto, el UPDATE de arriba no encontraba filas para esa persona y el
    // endpoint igual respondía éxito sin haber dado de baja nada real
    // (auditoría 2026-09-11).
    const { error: prospectError } = await supabase
      .from('prospective_companies')
      .update({ unsubscribed: true })
      .eq('email', normalizedEmail)

    if (orderError) console.error('Unsubscribe error (Order):', orderError)
    if (prospectError) console.error('Unsubscribe error (prospective_companies):', prospectError)

    if (orderError && prospectError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unsubscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
