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

// Marca FBFC (mybusinessformation.com — separación de dominios 2026-08-13):
// mismo buzón autenticado que OpaBiz, solo cambia el display name que ve el
// cliente. No requiere verificar un dominio de envío nuevo en Resend.
export const FROM_FBFC = `Florida Business Formation Center <${FROM_TRANSACTIONAL}>`

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

export function brandPortalHome(brand: EmailBrand): string {
  return isFbfcBrand(brand) ? PORTAL_HOME_FBFC : PORTAL_HOME_OPABIZ
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
  return `
              <td style="width:42px;padding-right:12px">
                <div style="width:42px;height:42px;background:linear-gradient(135deg,#1C2E44,#2563EB);border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
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
