// ─────────────────────────────────────────────────────────────────────────────
// Remitentes, Reply-To y destinatarios internos compartidos por todos los
// endpoints que envían email (Resend). Antes cada route.ts redeclaraba estas
// mismas constantes por su cuenta y los fallbacks fueron divergiendo con el
// tiempo — dos archivos (webhooks/stripe, lib/notifications) tenían un
// fallback de alerta interna a un gmail legacy con un typo
// ('aneurysoto@gmail.com') mientras otros ya usaban 'alert@opabiz.com'
// (auditoría 2026-07-12, hallazgo #3). Este es el único lugar a actualizar
// si cambia un remitente o un fallback.
// ─────────────────────────────────────────────────────────────────────────────

export const FROM_TRANSACTIONAL = process.env.CONTACT_FROM_EMAIL || process.env.RESEND_FROM_TRANSACTIONAL || 'onboarding@resend.dev'
export const FROM_MARKETING = process.env.RESEND_FROM_MARKETING || 'marketing@opabiz.com'
export const FROM_SUPPORT = process.env.RESEND_FROM_SUPPORT || 'support@opabiz.com'
export const REPLY_TO = process.env.RESEND_REPLY_TO || 'info@opabiz.com'
export const INTERNAL_ALERT_EMAIL = process.env.INTERNAL_ALERT_EMAIL || 'alert@opabiz.com'
export const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'info@opabiz.com'

// Buzon propio del dominio FBFC (mybusinessformation.com — verificado en Resend
// el 2026-08-21). Antes FROM_FBFC reusaba FROM_TRANSACTIONAL (@opabiz.com) y el
// cliente veia display name FBFC pero la direccion tecnica era @opabiz.com, lo
// que rompia la separacion de marca en 'ver detalles del remitente'. Ahora el
// dominio de envio real coincide con la marca visible.
export const FROM_TRANSACTIONAL_FBFC = process.env.RESEND_FROM_TRANSACTIONAL_FBFC || 'noreply@mybusinessformation.com'
export const REPLY_TO_FBFC = process.env.RESEND_REPLY_TO_FBFC || 'info@mybusinessformation.com'

export const FROM_OPABIZ = `OpaBiz <${FROM_TRANSACTIONAL}>`
export const FROM_OPABIZ_MARKETING = `OpaBiz <${FROM_MARKETING}>`
export const FROM_OPABIZ_SUPPORT = `OpaBiz Support <${FROM_SUPPORT}>`
export const FROM_OPABIZ_ALERTS = `OpaBiz Alerts <${FROM_TRANSACTIONAL}>`
export const FROM_OPABIZ_CONTACT = `OpaBiz Contact <${FROM_TRANSACTIONAL}>`

// Sistema interno "OpaBiz Connect" (servicio, ventas asistidas y despacho de
// órdenes a empleados) — display name distinto de "OpaBiz" arriba (la marca
// que ve el cliente del sitio público) para que un empleado no confunda este
// email con algo dirigido a un cliente.
export const FROM_OPABIZ_INTERNAL = `OpaBiz Connect <${FROM_TRANSACTIONAL}>`

// Marca FBFC (mybusinessformation.com — separación de dominios 2026-08-13).
// Usa buzon propio noreply@mybusinessformation.com (dominio verificado en
// Resend el 2026-08-21) para que la direccion tecnica del remitente coincida
// con la marca visible — antes reusaba FROM_TRANSACTIONAL de opabiz.com.
export const FROM_FBFC = `Florida Business Formation Center <${FROM_TRANSACTIONAL_FBFC}>`

// ─────────────────────────────────────────────────────────────────────────────
// Branding por marca para el HTML de los emails — un solo lugar para el
// header (logo+nombre), el pie de página, el link "Track My Order" y el
// prefijo del subject. Antes cada función de lib/notifications.ts tenía el
// bloque OpaBiz hardcodeado sin rama FBFC — una orden de servicios/marketing
// comprada en mybusinessformation.com recibía la confirmación de pago bien
// marcada (webhooks/stripe.ts, rama inline propia) pero cualquier email
// posterior (reenvío manual, "Filed", "Aprobado") volvía a mostrar OpaBiz
// (auditoría 2026-08-17). `brand` viene de `Order.sourceBrand` — 'fbfc' o
// null/undefined/'opabiz' (default).
// ─────────────────────────────────────────────────────────────────────────────
export type EmailBrand = 'opabiz' | 'fbfc' | null | undefined

export const PORTAL_HOME_OPABIZ = 'https://opabiz.com/?login=1'
export const PORTAL_HOME_FBFC = 'https://mybusinessformation.com/client-portal'

export function isFbfcBrand(brand: EmailBrand): boolean {
  return brand === 'fbfc'
}

export function brandFrom(brand: EmailBrand): string {
  return isFbfcBrand(brand) ? FROM_FBFC : FROM_OPABIZ
}

/** Reply-To por marca — FBFC responde a info@mybusinessformation.com, resto a info@opabiz.com. */
export function brandReplyTo(brand: EmailBrand): string {
  return isFbfcBrand(brand) ? REPLY_TO_FBFC : REPLY_TO
}

// `opts.email`/`opts.order` pre-llenan el login del cliente — FBFC los lee
// como ?email=&order= en /client-portal (ClientPortalLoginForm ya soportaba
// esto, solo nadie se los pasaba desde acá). OpaBiz los ignora hoy (su
// popover del home solo reacciona a ?login=1), así que agregarlos es
// inofensivo — no se resuelve acá para no ensanchar el alcance del fix.
export function brandPortalHome(brand: EmailBrand, opts?: { email?: string; order?: string }): string {
  if (!isFbfcBrand(brand)) return PORTAL_HOME_OPABIZ
  if (!opts?.email && !opts?.order) return PORTAL_HOME_FBFC
  const url = new URL(PORTAL_HOME_FBFC)
  if (opts.email) url.searchParams.set('email', opts.email)
  if (opts.order) url.searchParams.set('order', opts.order)
  return url.toString()
}

export function brandSubjectPrefix(brand: EmailBrand): string {
  return isFbfcBrand(brand) ? '' : 'OpaBiz: '
}

/** Header HTML (logo + nombre) — reemplaza el bloque "OB / Opa+Biz" fijo. */
export function brandHeaderHtml(brand: EmailBrand): string {
  if (isFbfcBrand(brand)) {
    return `
              <td style="width:42px;padding-right:12px">
                <img src="https://mybusinessformation.com/fbfc-seal.png" width="42" height="42" alt="Florida Business Formation Center" style="display:block"/>
              </td>
              <td style="vertical-align:middle">
                <div style="font-family:Georgia,serif;font-size:16px;font-weight:700;line-height:1.25;color:#1C2E44">Florida Business<br/>Formation Center</div>
              </td>`
  }
  // Sólido, no degradado (2026-09-07): linear-gradient renderiza distinto
  // entre la app de Gmail (mobile, sí lo soporta) y Gmail en navegador de
  // escritorio (más estricto con el CSS que acepta) — confirmado por el
  // founder viendo el mismo email bien en el celular y mal en Safari/Gmail
  // web. Un color sólido se ve casi igual (mismo navy de marca) y funciona
  // garantizado en cualquier cliente de correo, sin depender de soporte CSS.
  return `
              <td style="width:42px;padding-right:12px">
                <div style="width:42px;height:42px;background:#22364E;border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
              </td>
              <td style="vertical-align:middle">
                <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;line-height:1.2"><span style="color:#1C2E44">Opa</span><span style="color:#2563EB">Biz</span></div>
                <div style="font-size:11px;color:#94A3B8;letter-spacing:.3px;margin-top:2px">Florida Business Formation Center</div>
              </td>`
}

/** Línea de pie de página ("OpaBiz · opabiz.com" / "Florida Business Formation Center · mybusinessformation.com"). */
export function brandFooterLine(brand: EmailBrand): string {
  return isFbfcBrand(brand) ? 'Florida Business Formation Center · mybusinessformation.com' : 'OpaBiz · opabiz.com'
}

/**
 * Disclosure legal completo para el pie de todos los emails al cliente
 * (2026-09-09). Reemplaza la línea corta "Este es un correo transaccional.
 * Somos un servicio de preparación de documentos, no un despacho de abogados."
 * por el disclosure completo (mismo texto largo que ya vive en el sitio web
 * como "Important Notice").
 *
 * El sujeto inicial cambia por marca — "OpaBiz is a trade name of..." vs
 * "mybusinessformation is a trade name of..." — porque son dos marcas
 * distintas al cliente pese a compartir la misma LLC legal.
 */
export function brandDisclosureHtml(brand: EmailBrand, lang: 'en' | 'es' = 'en'): string {
  const isFbfc = isFbfcBrand(brand)
  const tradeName = isFbfc ? 'mybusinessformation' : 'OpaBiz'
  if (lang === 'es') {
    return `${tradeName} es un nombre comercial de Florida Business Formation Center — un servicio profesional de preparación y presentación de documentos. No somos un despacho de abogados y no ofrecemos asesoría legal, fiscal o financiera. Nuestros servicios no constituyen el ejercicio del derecho ni crean una relación abogado-cliente. Toda presentación está sujeta a la aprobación de la División de Corporaciones de Florida y del IRS. Para orientación legal o fiscal específica a su situación, le recomendamos consultar a un abogado licenciado en Florida o un contador público certificado.`
  }
  return `${tradeName} is a trade name of Florida Business Formation Center — a professional document preparation and filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do not constitute the practice of law and do not create an attorney-client relationship. All filings are subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant.`
}
