// Provisioning del servicio de Registered Agent para una Order.
//
// Cadena automatica disparada desde el webhook Stripe (handleFormationPaid)
// cuando la orden tiene registeredAgent === 'us' (el cliente eligio que le
// provemos el RA — aplica a Standard/Premium por default y a Basic cuando el
// cliente lo pide explicitamente). Corre en fire-and-forget — no
// bloquea la confirmacion del pago ni el email A1 al cliente.
//
// Secuencia:
//   1. POST /companies       — crea la company en RAI con datos del cliente
//   2. POST /services        — asigna RA para Florida (address llega inmediata)
//   3. GET  /invoices        — obtiene invoice_id (para pago manual del staff)
//   4. sendRaAddressReady()  — email al cliente con la direccion
//
// Persistencia en Order (columnas de la migracion supabase_migration_ra_provisioning):
//   raCompanyId, raServiceId, raInvoiceId, raInvoicePaid=false, raAddress,
//   raProvisionedAt, raAddressEmailSentAt.
//
// Idempotencia (default): si raProvisionedAt ya existe, no hace nada. El
// endpoint de retry pasa { force: true } para reintentar despues de un fallo
// parcial (solo re-ejecuta los pasos cuyos IDs faltan en la DB).

import { getSupabaseAdmin } from './supabase'
import {
  createCompany,
  assignRaService,
  getInvoicesByCompany,
  type EntityType,
} from './corporate-tools'
import { sendRaAddressReady } from './notifications'
import { Resend } from 'resend'
import { REPLY_TO, INTERNAL_ALERT_EMAIL, FROM_OPABIZ_ALERTS } from './email-constants'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

type OrderRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  companyName: string
  entityType: string | null
  registeredAgent: string | null
  raCompanyId: string | null
  raServiceId: string | null
  raInvoiceId: string | null
  raAddress: unknown
  raProvisionedAt: string | null
  raAddressEmailSentAt: string | null
}

type RaAddress = {
  line1: string
  line2: string | null
  city: string
  state: string
  zip: string
}

export type ProvisionResult = {
  ok: boolean
  orderId: string
  companyId?: string
  serviceId?: string
  invoiceId?: string
  address?: RaAddress
  skipped?: 'client-uses-own-agent' | 'already-provisioned'
  error?: string
}

// Extrae la direccion del response de POST /services. Estructura confirmada en
// Fase 1 (registered_agent.address con line1/line2/state_province_region/city/
// zip_postal_code). Devuelve null si falta algo esencial.
function extractAddressFromServiceResponse(raw: unknown): RaAddress | null {
  const result = (raw as { result?: unknown })?.result
  const list = Array.isArray(result) ? result : (result && typeof result === 'object' ? [result] : [])
  const first = list[0] as { registered_agent?: { address?: Record<string, string | null> } } | undefined
  const addr = first?.registered_agent?.address
  if (!addr) return null
  const line1 = addr.line1 ?? ''
  const city = addr.city ?? ''
  const state = addr.state_province_region ?? ''
  const zip = addr.zip_postal_code ?? ''
  if (!line1 || !city || !state || !zip) return null
  return {
    line1,
    line2: addr.line2 || null,
    city,
    state,
    zip,
  }
}

// Alerta interna cuando algo del provisioning falla. Manual retry desde el
// panel admin (`/admin/orders/[id]`, boton "Retry RA provisioning").
async function sendProvisionAlert(orderId: string, companyName: string, phase: string, error: string) {
  try {
    await getResend().emails.send({
      from: FROM_OPABIZ_ALERTS,
      replyTo: REPLY_TO,
      to: INTERNAL_ALERT_EMAIL,
      subject: `OpaBiz Alerts: ⚠️ RA provisioning fallo — ${companyName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
          <div style="background:#dc2626;padding:20px 28px;border-radius:10px 10px 0 0">
            <h1 style="color:#fff;font-size:18px;margin:0">⚠️ RA provisioning fallo</h1>
          </div>
          <div style="background:#fff;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#64748b;width:35%">Empresa</td><td style="padding:6px 0;font-weight:600">${companyName}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b">Order ID</td><td style="padding:6px 4px;font-family:monospace;font-size:12px">${orderId}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Fase</td><td style="padding:6px 0;font-weight:600;color:#dc2626">${phase}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:6px 4px;color:#64748b;vertical-align:top">Error</td><td style="padding:6px 4px;font-family:monospace;font-size:12px;color:#dc2626;word-break:break-word">${error}</td></tr>
            </table>
            <div style="text-align:center;margin:18px 0 4px">
              <a href="https://opabiz.com/admin/orders/${orderId}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700">Abrir en el panel admin →</a>
            </div>
            <p style="color:#64748b;font-size:12.5px;margin-top:14px">
              La orden se marco pagada normalmente y el cliente recibio su email de confirmacion.
              Solo el provisioning de RA fallo — usar el boton "Retry RA provisioning" en el panel admin
              para reintentar. La cadena es idempotente: solo re-ejecuta los pasos pendientes.
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[ra-provision] alert email error (non-fatal):', err)
  }
}

/**
 * Ejecuta la cadena completa de provisioning para una Order.
 *
 * @param orderId - UUID de la Order en Supabase
 * @param opts.force - Si true, ignora la guardia "already provisioned" y
 *   re-ejecuta cualquier paso cuyo ID no este en la DB. Usado por el boton
 *   "Retry" del panel admin.
 */
export async function provisionRaForOrder(
  orderId: string,
  opts: { force?: boolean } = {},
): Promise<ProvisionResult> {
  const supabase = getSupabaseAdmin()

  const { data: orderRaw, error: fetchErr } = await supabase
    .from('Order')
    .select('id, firstName, lastName, email, companyName, entityType, registeredAgent, raCompanyId, raServiceId, raInvoiceId, raAddress, raProvisionedAt, raAddressEmailSentAt')
    .eq('id', orderId)
    .single()

  if (fetchErr || !orderRaw) {
    return { ok: false, orderId, error: `Order not found: ${fetchErr?.message ?? 'unknown'}` }
  }
  const order = orderRaw as OrderRow

  // Guardia 1: el cliente eligio que le provemos el RA?
  // registeredAgent='us' -> "Nuestro servicio (incluido)" (Standard/Premium por
  // default + Basic con addon RA). registeredAgent='own' -> el cliente puso su
  // propio agente, no hay que hacer nada del lado de RAI.
  //
  // Bug historico: la version original de este trigger chequeaba addons.ra ===
  // true, pero fmBuildOrderPayload nunca setea esa propiedad — el flag real de
  // "queremos ser el RA" siempre estuvo en la columna registeredAgent, no en
  // el mapa de addons. Fix aplicado 2026-08-03 despues de que una orden real
  // (Standard) no disparara la cadena por este bug.
  if (order.registeredAgent !== 'us') {
    return { ok: true, orderId, skipped: 'client-uses-own-agent' }
  }

  // Guardia 2: idempotencia (a menos que force)
  if (!opts.force && order.raProvisionedAt) {
    return {
      ok: true,
      orderId,
      companyId: order.raCompanyId ?? undefined,
      serviceId: order.raServiceId ?? undefined,
      invoiceId: order.raInvoiceId ?? undefined,
      address: (order.raAddress as RaAddress | null) ?? undefined,
      skipped: 'already-provisioned',
    }
  }

  const entityType: EntityType = order.entityType === 'corp' ? 'corp' : 'llc'

  // ── Paso 1: POST /companies (skip si ya lo tenemos) ────────────────────────
  let companyId = order.raCompanyId
  if (!companyId) {
    try {
      const { companyId: id } = await createCompany({
        name: order.companyName,
        entityType,
        homeState: 'Florida',
      })
      companyId = id
      await supabase.from('Order').update({ raCompanyId: id }).eq('id', orderId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[ra-provision] POST /companies fallo:', orderId, msg)
      await sendProvisionAlert(orderId, order.companyName, 'POST /companies', msg)
      return { ok: false, orderId, error: msg }
    }
  }

  // ── Paso 2: POST /services (extrae address del response — llega inmediata) ─
  let serviceId = order.raServiceId
  let address = order.raAddress as RaAddress | null
  if (!serviceId || !address) {
    try {
      const { serviceId: sid, raw } = await assignRaService({
        companyId,
        jurisdictions: ['Florida'],
      })
      serviceId = sid
      const extracted = extractAddressFromServiceResponse(raw)
      if (!extracted) {
        const msg = 'POST /services no trajo direccion en el response (registered_agent.address)'
        console.error('[ra-provision]', orderId, msg, raw)
        await sendProvisionAlert(orderId, order.companyName, 'POST /services (address missing)', msg)
        // Guardamos serviceId igual — el cron de auditoria puede recuperar
        // la direccion mas tarde con otro endpoint.
        await supabase.from('Order').update({ raServiceId: sid, raProvisionedAt: new Date().toISOString() }).eq('id', orderId)
        return { ok: false, orderId, companyId, serviceId: sid, error: msg }
      }
      address = extracted
      await supabase.from('Order').update({
        raServiceId: sid,
        raAddress: extracted,
        raProvisionedAt: new Date().toISOString(),
      }).eq('id', orderId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[ra-provision] POST /services fallo:', orderId, msg)
      await sendProvisionAlert(orderId, order.companyName, 'POST /services', msg)
      return { ok: false, orderId, companyId, error: msg }
    }
  }

  // ── Paso 3: GET /invoices (skip si ya lo tenemos) ──────────────────────────
  let invoiceId = order.raInvoiceId
  if (!invoiceId) {
    try {
      const { invoices } = await getInvoicesByCompany(companyId)
      const first = invoices[0] as { id?: string; invoice_id?: string } | undefined
      invoiceId = first?.id ?? first?.invoice_id ?? null
      if (invoiceId) {
        await supabase.from('Order').update({ raInvoiceId: invoiceId }).eq('id', orderId)
      } else {
        // No es fatal — el service quedo asignado y el cliente va a recibir su
        // direccion. El staff puede buscar el invoice en el portal manualmente.
        console.warn('[ra-provision] GET /invoices no devolvio invoices para', companyId)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[ra-provision] GET /invoices fallo (non-fatal):', orderId, msg)
      // No retornamos error — el service ya esta asignado y la direccion
      // guardada. La factura la busca el staff manual en el portal.
    }
  }

  // ── Paso 4: email al cliente (idempotente por raAddressEmailSentAt) ────────
  if (!order.raAddressEmailSentAt && address) {
    try {
      await sendRaAddressReady({
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        companyName: order.companyName,
        id: order.id,
        entityType: order.entityType,
        raAddress: address,
        // TODO cuando se persista lang en Order: pasar order.lang. Por ahora
        // default en (mismo criterio que el email de confirmacion de formacion).
      })
      await supabase.from('Order').update({ raAddressEmailSentAt: new Date().toISOString() }).eq('id', orderId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[ra-provision] sendRaAddressReady fallo:', orderId, msg)
      await sendProvisionAlert(orderId, order.companyName, 'sendRaAddressReady', msg)
      // No retornamos error — el provisioning en RAI se completo, solo fallo
      // el email. Se puede reenviar manualmente desde el panel admin.
    }
  }

  return {
    ok: true,
    orderId,
    companyId,
    serviceId: serviceId ?? undefined,
    invoiceId: invoiceId ?? undefined,
    address: address ?? undefined,
  }
}
