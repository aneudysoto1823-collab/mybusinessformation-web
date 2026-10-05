// Reparto de empresas entre las campañas de MyBiz y OpaBiz (pedido founder
// 2026-10-05).
//
// Las dos marcas le escriben a las mismas empresas con precios distintos.
// Para no competir entre nosotros, cada empresa la contacta UNA sola marca:
// desde el panel único de Campaigns & Letters se elige por cuál mandar, y en
// cuanto una marca la contacta (email o carta física marcada como enviada),
// la empresa sale de "New" y la otra marca ya no le manda su carta. La
// Oferta VIP de MyBiz solo va a empresas que contactó MyBiz. Una empresa que
// compró por cualquiera de las dos no recibe más cartas (status 'purchased',
// ver handleServicesPaid en el webhook de Stripe).

export type CampaignBrand = 'fbfc' | 'opabiz'

/** Campos que registran un contacto de MyBiz (email o carta física). */
export const MYBIZ_CONTACT_FIELDS = ['carta_sent_at', 'vip_reminder_sent_at', 'letter_sent_at'] as const
/** Campos que registran un contacto de OpaBiz (email o carta física). */
export const OPABIZ_CONTACT_FIELDS = ['carta_opabiz_sent_at', 'letter_opabiz_sent_at'] as const

export const CONTACT_FIELDS: Record<CampaignBrand, readonly string[]> = {
  fbfc: MYBIZ_CONTACT_FIELDS,
  opabiz: OPABIZ_CONTACT_FIELDS,
}

type ContactRow = Partial<Record<string, unknown>>

/** Primer contacto de esa marca, o null si nunca la contactó. */
export function brandContactedAt(row: ContactRow, brand: CampaignBrand): string | null {
  const dates = CONTACT_FIELDS[brand].map(f => row[f]).filter((d): d is string => typeof d === 'string' && !!d)
  return dates.length ? dates.sort()[0] : null
}

/** Filtro PostgREST `.or(...)`: la marca contactó a la empresa por algún canal. */
export function contactedByOrFilter(brand: CampaignBrand): string {
  return CONTACT_FIELDS[brand].map(f => `${f}.not.is.null`).join(',')
}
