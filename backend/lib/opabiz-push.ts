import webpush from 'web-push'
import { getSupabaseAdmin } from './supabase'

type Supabase = ReturnType<typeof getSupabaseAdmin>

export interface PushPayload {
  title: string
  body: string
  url?: string
}

// Lazy-init (mismo patrón que Stripe/Resend/Supabase en el resto del
// proyecto — nunca configurar SDKs a nivel de módulo, las env vars no
// existen todavía durante el build de Vercel). Si las VAPID keys no están
// cargadas, la función simplemente no manda push — no rompe el flujo de
// asignación, que siempre debe completarse aunque no haya push configurado.
let vapidConfigured = false
function ensureVapid(): boolean {
  if (vapidConfigured) return true
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails('mailto:alert@opabiz.com', publicKey, privateKey)
  vapidConfigured = true
  return true
}

// Envía una notificación push a TODAS las suscripciones activas de un
// empleado (puede tener varios dispositivos — celular, PWA instalada,
// escritorio). Limpia (borra) las suscripciones que el navegador ya
// invalidó (410 Gone / 404) — son basura que nunca más va a entregar nada.
export async function sendPushToEmpleado(supabase: Supabase, empleadosId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return

  const { data: subs } = await supabase
    .from('opabiz_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('empleado_id', empleadosId)

  if (!subs || subs.length === 0) return

  const body = JSON.stringify(payload)

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        )
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 410 || statusCode === 404) {
          await supabase.from('opabiz_push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('[opabiz-push] sendNotification error:', err instanceof Error ? err.message : err)
        }
      }
    }),
  )
}
