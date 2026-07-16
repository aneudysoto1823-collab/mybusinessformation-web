import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'

export const dynamic = 'force-dynamic'

// POST /api/opabiz/me/push-subscribe — el navegador del empleado manda acá su
// PushSubscription (endpoint + keys) apenas concede el permiso de
// notificaciones. `endpoint` es UNIQUE (upsert) — si el mismo dispositivo
// vuelve a suscribirse (ej. reinstaló la PWA), pisa la fila anterior en vez
// de duplicar.
export async function POST(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint, keys } = await req.json().catch(() => ({}))
  if (!endpoint || typeof endpoint !== 'string' || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin()
    .from('opabiz_push_subscriptions')
    .upsert(
      { empleado_id: session.empleadosId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'endpoint' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
