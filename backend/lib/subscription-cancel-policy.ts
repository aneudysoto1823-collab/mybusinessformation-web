// Política de cancelación de suscripciones (Registered Agent / Virtual Address /
// Annual Report). Código puro, sin imports de servidor: lo usan el portal del
// cliente, el panel admin y los endpoints (lib/subscription-cancel.ts).
//
// Dos tipos de cancelación (decisión founder 2026-10-09):
//   - 'renewal': cancelar la renovación. El servicio sigue normal (sigue
//     recibiendo documentos) hasta el último día pagado; después no se cobra
//     más y termina.
//   - 'service': cancelar el servicio ahora. Termina en `noticeDays` días (el
//     margen para darlo de baja con el proveedor), o en la fecha de renovación
//     si cae antes. Sin cobros nuevos y sin reembolso del período ya pagado.
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
        ? { title: 'Cancelar la renovación', body: `Su suscripción sigue activa hasta el ${date}. Después no se le cobrará más y no presentaremos su próxima Declaración Anual. Recuerde que Florida la exige cada año.` }
        : { title: 'Cancel the renewal', body: `Your subscription stays active through ${date}. After that you won't be charged again and we won't file your next Annual Report. Remember that Florida requires it every year.` }
    }
    return es
      ? { title: 'Cancelar la renovación', body: `Su servicio sigue funcionando normalmente hasta el ${date}${isRa ? ': hasta ese día seguirá recibiendo sus documentos como siempre' : ''}. Después de esa fecha no se le cobrará más y el servicio termina.` }
      : { title: 'Cancel the renewal', body: `Your service keeps working normally through ${date}${isRa ? ': until that day you will keep receiving your documents as usual' : ''}. After that date you won't be charged again and the service ends.` }
  }

  if (noticeDays > 0) {
    return es
      ? { title: 'Cancelar el servicio ahora', body: `Damos de baja el servicio con nuestro proveedor, lo que requiere un margen de ${noticeDays} días. Su servicio termina el ${date}: después de esa fecha ya no recibirá documentos en esta dirección. No se le cobra nada más y el período ya pagado no se reembolsa.` }
      : { title: 'Cancel the service now', body: `We cancel the service with our provider, which requires ${noticeDays} days' notice. Your service ends on ${date}: after that date you will no longer receive documents at this address. You won't be charged again, and the period already paid is not refunded.` }
  }
  return es
    ? { title: 'Cancelar el servicio ahora', body: 'El servicio termina hoy mismo. No se le cobra nada más y el período ya pagado no se reembolsa.' }
    : { title: 'Cancel the service now', body: "The service ends today. You won't be charged again, and the period already paid is not refunded." }
}
