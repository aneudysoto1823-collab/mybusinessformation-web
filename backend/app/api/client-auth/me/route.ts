import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Estado de sesión del cliente para personalizar el home (saludo + botón "Mis
// órdenes"). Lee la cookie client_session (= Order.id) y devuelve solo el nombre
// de pila — NADA sensible. Si no hay sesión válida, { loggedIn: false }.
export async function GET(request: NextRequest) {
  const orderId = request.cookies.get('client_session')?.value
  if (!orderId) return NextResponse.json({ loggedIn: false })

  try {
    const { data: order, error } = await getSupabaseAdmin()
      .from('Order')
      .select('id, firstName')
      .eq('id', orderId)
      .single()

    if (error || !order) return NextResponse.json({ loggedIn: false })
    return NextResponse.json({ loggedIn: true, firstName: order.firstName ?? null })
  } catch {
    return NextResponse.json({ loggedIn: false })
  }
}
