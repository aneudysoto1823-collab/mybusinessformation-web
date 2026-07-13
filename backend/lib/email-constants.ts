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
