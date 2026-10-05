// Orden entre las campañas de MyBiz y OpaBiz (pedido founder 2026-10-05).
//
// Las dos marcas le escriben a las mismas empresas con precios distintos
// (MyBiz más alto). Para no competir entre nosotros:
//   - MyBiz va primero. Si MyBiz ya contactó a una empresa, OpaBiz espera
//     OPABIZ_WAIT_DAYS desde ese contacto antes de ofrecerle sus precios.
//   - Si OpaBiz ya la contactó, MyBiz no le vuelve a escribir: mandarle
//     después precios más altos solo confunde.
// Una empresa que compró por cualquiera de las dos sale de ambas colas
// (status 'purchased', ver handleServicesPaid en el webhook de Stripe).

export const OPABIZ_WAIT_DAYS = 30

/** Campos que registran un contacto de MyBiz (email o carta física). */
export const MYBIZ_CONTACT_FIELDS = ['carta_sent_at', 'vip_reminder_sent_at', 'letter_sent_at'] as const
/** Campos que registran un contacto de OpaBiz (email o carta física). */
export const OPABIZ_CONTACT_FIELDS = ['carta_opabiz_sent_at', 'letter_opabiz_sent_at'] as const

type ContactRow = Partial<Record<(typeof MYBIZ_CONTACT_FIELDS)[number] | (typeof OPABIZ_CONTACT_FIELDS)[number], string | null>>

/** Fecha antes de la cual un contacto de MyBiz ya no bloquea a OpaBiz. */
export function opabizCutoffIso(now = new Date()): string {
  return new Date(now.getTime() - OPABIZ_WAIT_DAYS * 86_400_000).toISOString()
}

/** Último contacto de MyBiz, o null si nunca la contactó. */
export function lastMybizContact(row: ContactRow): string | null {
  const dates = MYBIZ_CONTACT_FIELDS.map(f => row[f]).filter((d): d is string => !!d)
  return dates.length ? dates.sort().at(-1)! : null
}

/** Fecha desde la que OpaBiz puede escribirle, o null si ya puede. */
export function opabizAvailableFrom(row: ContactRow, now = new Date()): string | null {
  const last = lastMybizContact(row)
  if (!last) return null
  const from = new Date(new Date(last).getTime() + OPABIZ_WAIT_DAYS * 86_400_000)
  return from > now ? from.toISOString() : null
}

/** Primer contacto de OpaBiz, o null si nunca la contactó. */
export function opabizContactedAt(row: ContactRow): string | null {
  const dates = OPABIZ_CONTACT_FIELDS.map(f => row[f]).filter((d): d is string => !!d)
  return dates.length ? dates.sort()[0] : null
}
