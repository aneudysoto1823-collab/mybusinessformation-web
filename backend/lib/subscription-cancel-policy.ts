// Política de cancelación de suscripciones (Registered Agent / Virtual Address /
// Annual Report). Código puro, sin imports de servidor: lo usan el portal del
// cliente, el panel admin y los endpoints (lib/subscription-cancel.ts).
//
// Dos tipos de cancelación (decisión founder 2026-10-09):
//   - 'renewal': cancelar la renovación. El servicio sigue normal (sigue
//     recibiendo documentos) hasta el último día pagado; después no se cobra
//     más y termina.
//   - 'service': dar de baja el servicio. Termina en `noticeDays` días o en la
//     fecha de renovación si cae antes. Sin cobros nuevos y sin reembolso del
//     período ya pagado. Al cliente se le explica el margen como tiempo para
//     recibir la correspondencia que ya viene en camino (decisión founder
//     2026-10-09: nunca mencionar al proveedor en textos de cliente).
//
// El margen de Registered Agent (30 días) es provisorio: todavía falta
// confirmar con Registered Agents Inc cuánto aviso exigen. Cuando se sepa, se
// cambia solo acá.

export type CancelType = 'renewal' | 'service'

export interface CancelPolicy {
  options: CancelType[]
  // Días de margen para 'service'. 0 = se corta en el momento.
  noticeDays: number
  // Si el servicio lo presta un proveedor externo al que hay que avisarle la
  // baja (a mano, por ahora).
  provider?: string
}

export const CANCEL_POLICIES: Record<string, CancelPolicy> = {
  'registered-agent': { options: ['renewal', 'service'], noticeDays: 30, provider: 'Registered Agents Inc' },
  // Ya no se vende; quedan órdenes viejas. Sin proveedor, se corta en el momento.
  'virtual-address':  { options: ['renewal', 'service'], noticeDays: 0 },
  // Trámite una vez al año, no llegan documentos: solo cancelar la renovación.
  'annual-report':    { options: ['renewal'], noticeDays: 0 },
}

const DEFAULT_POLICY: CancelPolicy = { options: ['renewal'], noticeDays: 0 }

export function getCancelPolicy(service: string): CancelPolicy {
  return CANCEL_POLICIES[service] ?? DEFAULT_POLICY
}

// Fecha en que termina el servicio con 'service': hoy + margen, o la fecha de
// renovación si cae antes (así nunca se genera un cobro nuevo).
export function computeServiceEndDate(service: string, currentPeriodEnd: string | null, now: Date = new Date()): Date {
  const { noticeDays } = getCancelPolicy(service)
  const byNotice = new Date(now.getTime() + noticeDays * 24 * 60 * 60 * 1000)
  if (!currentPeriodEnd) return byNotice
  const periodEnd = new Date(currentPeriodEnd)
  return periodEnd < byNotice ? periodEnd : byNotice
}

// true si la baja termina en la fecha de renovación (cayó antes que el margen),
// para explicarle al cliente el motivo correcto de la fecha.
export function serviceEndsAtRenewal(service: string, endDate: Date | string | null, now: Date = new Date()): boolean {
  if (!endDate) return false
  const { noticeDays } = getCancelPolicy(service)
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  return end.getTime() < now.getTime() + noticeDays * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000
}

export function formatCancelDate(d: Date | string | null, lang: 'en' | 'es'): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' })
}

// Textos de cada opción, tal como los ve quien cancela (cliente o admin).
// `endDate` = currentPeriodEnd para 'renewal', computeServiceEndDate para 'service'.
export function cancelOptionCopy(
  service: string,
  type: CancelType,
  lang: 'en' | 'es',
  endDate: Date | string | null,
): { title: string; body: string } {
  const es = lang === 'es'
  const date = formatCancelDate(endDate, lang)
  const { noticeDays } = getCancelPolicy(service)
  const isRa = service === 'registered-agent'
  const isAr = service === 'annual-report'

  if (type === 'renewal') {
    if (isAr) {
      return es
        ? { title: 'Cancelar la renovación automática', body: `Su suscripción sigue activa hasta el ${date}. Después no se le cobrará más y no presentaremos su próxima Declaración Anual. Recuerde que Florida la exige cada año.` }
        : { title: 'Cancel automatic renewal', body: `Your subscription stays active through ${date}. After that you won't be charged again and we won't file your next Annual Report. Remember that Florida requires it every year.` }
    }
    return es
      ? { title: 'Cancelar la renovación automática', body: `Su servicio sigue funcionando normalmente hasta el ${date}${isRa ? ': hasta ese día seguirá recibiendo sus documentos como siempre' : ''}. Después de esa fecha no se le cobrará más y el servicio termina.` }
      : { title: 'Cancel automatic renewal', body: `Your service keeps working normally through ${date}${isRa ? ': until that day you will keep receiving your documents as usual' : ''}. After that date you won't be charged again and the service ends.` }
  }

  const title = es ? 'Dar de baja el servicio' : 'Cancel the service'
  if (noticeDays > 0) {
    if (serviceEndsAtRenewal(service, endDate)) {
      return es
        ? { title, body: `Su servicio termina el ${date}, el último día de su período ya pagado. Hasta ese día le seguiremos enviando cualquier documento que llegue para su empresa. No se le cobrará nada más y el período ya pagado no se reembolsa.` }
        : { title, body: `Your service ends on ${date}, the last day of your paid period. Until that day we will keep forwarding any document that arrives for your company. You won't be charged again, and the period already paid is not refunded.` }
    }
    return es
      ? { title, body: `Su servicio termina el ${date}. Damos un margen de ${noticeDays} días porque puede haber correspondencia oficial en camino para su empresa; así recibe también esos documentos. Hasta ese día le seguiremos enviando todo lo que llegue. No se le cobrará nada más y el período ya pagado no se reembolsa.` }
      : { title, body: `Your service ends on ${date}. We allow ${noticeDays} days because official mail for your company may already be on its way, so you receive those documents too. Until that day we will keep forwarding everything that arrives. You won't be charged again, and the period already paid is not refunded.` }
  }
  return es
    ? { title, body: 'El servicio termina hoy mismo. No se le cobrará nada más y el período ya pagado no se reembolsa.' }
    : { title, body: "The service ends today. You won't be charged again, and the period already paid is not refunded." }
}
