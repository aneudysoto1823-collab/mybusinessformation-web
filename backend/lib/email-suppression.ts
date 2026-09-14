// Lista de supresión global de email marketing (auditoría 2026-09-13/14).
// Fuente de verdad persistente, alimentada por el webhook de Resend
// (app/api/webhooks/resend/route.ts) en email.bounced / email.complained.
// Consultada por cada ruta que manda marketing (campaigns/send,
// campaigns/send-vip-reminder, guides/request) ANTES de enviar — un rebote
// o una queja nunca debe volver a ofrecerse en una corrida futura.
//
// Al agregar una dirección acá, también se marca unsubscribed=true en
// prospective_companies/Order si ya existen filas con ese email — mismo
// mecanismo que POST /api/unsubscribe (auditoría 2026-09-11) — para que la
// protección sea inmediata en todo lo que ya consulta ese flag. Esta tabla
// sigue siendo necesaria aparte: protege también una fila NUEVA que se cree
// más adelante para el mismo email (ej. Enformion lo vuelve a encontrar para
// otra LLC), que de otro modo arrancaría con unsubscribed=false/null.

import { getSupabaseAdmin } from './supabase'

export type SuppressionReason = 'bounced' | 'complained'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** true si esta dirección tuvo un rebote permanente o una queja de spam
 *  registrada. Fail-open ante un error de lectura (no bloquea el envío por
 *  un problema transitorio de la base) — mismo criterio que el resto del
 *  proyecto para chequeos best-effort no críticos de seguridad. */
export async function isSuppressed(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  const normalized = normalizeEmail(email)
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('email_suppressions')
      .select('email')
      .eq('email', normalized)
      .maybeSingle()
    if (error) {
      console.error('[email-suppression] error consultando (fail-open, no bloquea el envío):', error)
      return false
    }
    return !!data
  } catch (e) {
    console.error('[email-suppression] excepción consultando (fail-open):', e)
    return false
  }
}

/** Agrega (o refresca) una dirección a la lista de supresión y propaga
 *  unsubscribed=true a las filas existentes que la usen. Llamada desde el
 *  webhook de Resend — nunca desde una ruta que el usuario dispare
 *  directamente. */
export async function suppressEmail(
  email: string,
  reason: SuppressionReason,
  detail: string | null,
  resendEmailId: string | null
): Promise<void> {
  const normalized = normalizeEmail(email)
  const supabase = getSupabaseAdmin()

  const { error: upsertErr } = await supabase
    .from('email_suppressions')
    .upsert({ email: normalized, reason, detail, resend_email_id: resendEmailId }, { onConflict: 'email' })
  if (upsertErr) console.error('[email-suppression] upsert fallo (no fatal):', upsertErr)

  const [prospectRes, orderRes] = await Promise.all([
    supabase.from('prospective_companies').update({ unsubscribed: true }).eq('email', normalized),
    supabase.from('Order').update({ unsubscribed: true }).eq('email', normalized),
  ])
  if (prospectRes.error) console.error('[email-suppression] update prospective_companies fallo (no fatal):', prospectRes.error)
  if (orderRes.error) console.error('[email-suppression] update Order fallo (no fatal):', orderRes.error)
}
