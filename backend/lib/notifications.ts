import { Resend } from 'resend'
import { getOrderItemLabel, FORMATION_ADDON_NAMES } from './order-items'
import { computeFormationTotal } from './pricing'

// Lazy init: se crea al primer uso, cuando dotenv ya cargó el .env
const getResend = () => new Resend(process.env.RESEND_API_KEY)

// FROM / Reply-To / alertas internas centralizados en env vars (Vercel).
// Fallback al sandbox de Resend / Gmail viejo para que en dev local sin .env el
// código no rompa — el deploy productivo siempre debe tener las 4 seteadas.
const FROM_EMAIL    = process.env.RESEND_FROM_TRANSACTIONAL || 'onboarding@resend.dev'
const FROM_SUPPORT  = process.env.RESEND_FROM_SUPPORT       || 'support@opabiz.com'
const REPLY_TO      = process.env.RESEND_REPLY_TO            || 'info@opabiz.com'
const INTERNAL_EMAIL = process.env.INTERNAL_ALERT_EMAIL       || 'aneurysoto@gmail.com'

// Display Name en el campo "From" — lo que el cliente ve en su inbox.
// Sin esto el cliente solo ve "noreply" como remitente y no sabe que es de OpaBiz.
//   FROM_OPABIZ        → emails informativos (confirmación, certificate, etc.)
//   FROM_OPABIZ_SUPPORT → emails que REQUIEREN respuesta del cliente (nombres tomados, sugerencias)
//   FROM_OPABIZ_ALERTS  → alertas internas que solo lee el admin
const FROM_OPABIZ         = `OpaBiz <${FROM_EMAIL}>`
const FROM_OPABIZ_SUPPORT = `OpaBiz Support <${FROM_SUPPORT}>`
const FROM_OPABIZ_ALERTS  = `OpaBiz Alerts <${FROM_EMAIL}>`
// El login real vive en el home (popover), no en /client-portal (ver
// CLAUDE.md "Login del cliente en el home") — los botones "Track My Order"
// deben mandar aquí, igual que en webhooks/stripe/route.ts.
// ?login=1 abre el popover de login directo al cargar el home (ver
// fmCheckResumeParam en page.tsx) — antes "Track My Order" dejaba al cliente
// en el landing teniendo que encontrar el botón "Login" de nuevo.
const PORTAL_HOME = 'https://opabiz.com/?login=1'

function unsubscribeFooter(email: string): string {
  return `
    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
    <p style="font-size: 12px; color: #888; text-align: center; margin: 0;">
      This is a transactional email related to your order with opabiz.com.<br>
      If you have questions contact us at support@opabiz.com<br>
      <a href="https://opabiz.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #888;">Unsubscribe</a>
    </p>
  `
}

// ── 1. Confirmación al cliente cuando su orden es recibida ───────────────────
//    SIEMPRE se envía — es una confirmación transaccional crítica (no verifica
//    unsubscribed). Rediseñado 2026-07-11 con las mismas convenciones que el
//    resto de los templates: header OB, Order Number en su caja, detalle real
//    del paquete (PACKAGE_SERVICES + addons), sin promesa de plazo.
export const sendOrderConfirmation = async (order: {
  firstName: string
  lastName: string
  email: string
  companyName: string
  package: string
  id: string
  entityType?: string | null
  speed?: string | null
  addons?: Record<string, boolean> | null
}) => {
  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  const packageKey = (order.package ?? '').toLowerCase().trim()
  const packageItems = PACKAGE_SERVICES[packageKey] ?? []
  const speedLabel = order.speed === 'expedited' ? 'Expedited (1-3 business days)' : 'Standard (7-14 business days)'
  // Tabla de precios real por ítem — mismo cálculo (computeFormationTotal) que
  // handleFormationPaid (webhook) y el email de servicios, para que los tres
  // muestren el mismo nivel de detalle. Las inclusiones del paquete van
  // anidadas bajo su propia línea de precio (no en una sección "What's
  // included" aparte — quedaba repitiendo los addons que ya se ven arriba
  // con precio, 2026-07-12).
  const { lines: formationLines, total } = computeFormationTotal({
    package: order.package, entityType: order.entityType, speed: order.speed, addons: order.addons,
  })
  const packageInclHtml = packageItems.map(i => `<div>${i.en}</div>`).join('')
  const formationRowsHtml = formationLines
    .map(l => {
      const priceRow = `<tr><td style="padding:5px 0;font-size:14px;color:#475569">${l.label}</td><td style="padding:5px 0;font-size:14px;color:#1e293b;font-weight:600;text-align:right;white-space:nowrap">$${l.amount}</td></tr>`
      const isPackageRow = l.label.endsWith('Formation Package')
      const inclRow = isPackageRow && packageInclHtml
        ? `<tr><td colspan="2" style="padding:0 0 8px;font-size:12.5px;color:#64748b;line-height:1.6">${packageInclHtml}</td></tr>`
        : ''
      return priceRow + inclRow
    })
    .join('')

  await getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: `OpaBiz: ✅ Your Florida LLC order is in — ${order.companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:42px;padding-right:12px">
                <div style="width:42px;height:42px;background:linear-gradient(135deg,#1C2E44,#2563EB);border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
              </td>
              <td style="vertical-align:middle">
                <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;line-height:1.2"><span style="color:#1C2E44">Opa</span><span style="color:#2563EB">Biz</span></div>
                <div style="font-size:11px;color:#94A3B8;letter-spacing:.3px;margin-top:2px">Florida Business Formation Center</div>
              </td>
            </tr></table>
          </div>
          <div style="padding:32px">
            <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px">Order Received</p>
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">Thank you for your order, ${order.firstName} ${order.lastName}!</h2>
            <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;margin:4px 0 22px;text-align:center">
              <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">Order Number</div>
              <div style="font-size:21px;font-weight:800;color:#1C2E44;letter-spacing:.5px">${fbfc}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
              <p style="margin:6px 0;font-size:14px"><strong>Company Name:</strong> ${order.companyName}</p>
              ${order.entityType ? `<p style="margin:6px 0;font-size:14px"><strong>Entity Type:</strong> ${order.entityType.toUpperCase()}</p>` : ''}
              <p style="margin:6px 0 0;font-size:14px"><strong>Filing Speed:</strong> ${speedLabel}</p>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
              <table style="width:100%;border-collapse:collapse">${formationRowsHtml}
                <tr><td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#1e293b">Total</td><td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#1e293b;text-align:right;white-space:nowrap">$${total.toFixed(2)} USD</td></tr>
              </table>
            </div>
            <p style="color:#475569;line-height:1.7">
              Our team is now reviewing your information and will verify name availability with the Florida Division of Corporations. We'll notify you by email as soon as your filing is submitted.
            </p>
            <div style="text-align:center;margin:24px 0">
              <a href="${PORTAL_HOME}" style="background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
                Track My Order
              </a>
            </div>
            ${unsubscribeFooter(order.email)}
          </div>
        </div>
      </div>
    `
  })
}

// ── 2. Todos los nombres tomados — avisa al cliente Y alerta al admin ────────
//    Este función envía 2 emails en paralelo:
//      - Al cliente: pide 3 nuevas opciones
//      - Al admin:   alerta roja para contactar al cliente
export const sendAllNamesTaken = async (order: {
  firstName: string
  lastName: string
  email: string
  // names puede tener 1, 2 o 3 elementos — el cliente puede haber enviado solo
  // un nombre (companyName2/companyName3 son opcionales en el form).
  names: string[]
  id: string
  unsubscribed?: boolean
  lang?: 'en' | 'es'
}) => {
  if (order.unsubscribed) {
    return { success: false, reason: 'unsubscribed' }
  }

  const isEs = order.lang === 'es'
  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  const n = order.names.length
  // Usado solo en la alerta interna al admin (siempre en español, sin cambios de tono).
  const esQty = n === 1 ? 'el nombre propuesto está registrado' : `los ${n} nombres propuestos están registrados`

  // Texto adaptado a la cantidad real de nombres propuestos por el cliente
  // (1, 2 o 3). Tono neutro/factual a propósito — nada de "⚠️ we need your
  // help" ni colores rojo/ámbar: ese patrón (alerta + urgencia) es el mismo
  // que usan los emails de phishing, y queríamos evitarlo (feedback founder).
  const introText = {
    en: [
      "We checked with the Florida Division of Corporations and found that the company name you submitted is already registered by another business:",
      "We checked with the Florida Division of Corporations and found that both company names you submitted are already registered by another business:",
      "We checked with the Florida Division of Corporations and found that all three company names you submitted are already registered by another business:",
    ],
    es: [
      'Verificamos con la División de Corporaciones de Florida y encontramos que el nombre de empresa que envió ya está registrado por otra empresa:',
      'Verificamos con la División de Corporaciones de Florida y encontramos que los dos nombres de empresa que envió ya están registrados por otra empresa:',
      'Verificamos con la División de Corporaciones de Florida y encontramos que los tres nombres de empresa que envió ya están registrados por otra empresa:',
    ],
  }[isEs ? 'es' : 'en'][Math.min(order.names.length, 3) - 1]

  const clientList = order.names
    .map(name => `<tr><td style="padding:6px 8px 6px 0;vertical-align:top;width:14px;font-size:13.5px;color:#94a3b8;font-weight:800">·</td><td style="padding:6px 0;font-size:13.5px;color:#475569;line-height:1.6"><strong style="color:#1e293b">${name}</strong> — ${isEs ? 'ya registrado' : 'already registered'}</td></tr>`)
    .join('')
  const adminList = order.names
    .map(name => `<p style="margin:6px 0;color:#991b1b">❌ ${name}</p>`)
    .join('')

  await Promise.all([
    // Email al cliente — usa FROM_OPABIZ_SUPPORT porque REQUIERE respuesta
    // del cliente (nuevos nombres). Display "OpaBiz Support" + from support@
    // dejan claro que pueden contestarnos directo.
    getResend().emails.send({
      from: FROM_OPABIZ_SUPPORT,
      replyTo: REPLY_TO,
      to: order.email,
      subject: isEs ? 'OpaBiz: Siguiente paso para continuar su orden' : 'OpaBiz: Next step to continue your order',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
            <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:42px;padding-right:12px">
                  <div style="width:42px;height:42px;background:linear-gradient(135deg,#1C2E44,#2563EB);border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
                </td>
                <td style="vertical-align:middle">
                  <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;line-height:1.2"><span style="color:#1C2E44">Opa</span><span style="color:#2563EB">Biz</span></div>
                  <div style="font-size:11px;color:#94A3B8;letter-spacing:.3px;margin-top:2px">Florida Business Formation Center</div>
                </td>
              </tr></table>
            </div>
            <div style="padding:32px">
              <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px">${isEs ? 'Siguiente Paso' : 'Next Step'}</p>
              <h2 style="color:#1C2E44;font-size:20px;margin-top:0">${isEs ? `Sigamos con su orden, ${order.firstName} ${order.lastName}` : `Let's continue with your order, ${order.firstName} ${order.lastName}`}</h2>
              <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;margin:4px 0 22px;text-align:center">
                <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">${isEs ? 'Número de Orden' : 'Order Number'}</div>
                <div style="font-size:21px;font-weight:800;color:#1C2E44;letter-spacing:.5px">${fbfc}</div>
              </div>
              <p style="color:#475569;line-height:1.7">
                ${introText}
              </p>
              <table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:20px 0">
                <tr><td style="padding:14px 20px 4px" colspan="2">${clientList}</td></tr>
              </table>
              <p style="color:#475569;line-height:1.7">
                ${isEs
                  ? 'Para continuar con su orden, responda este correo con 3 nuevas opciones de nombre. Verificaremos su disponibilidad ante el Estado de Florida y seguiremos con su trámite.'
                  : "To continue with your order, please reply to this email with 3 new company name options. We'll check their availability with the State of Florida and move forward with your filing."}
              </p>
              <p style="color:#475569;line-height:1.7">
                ${isEs ? '¿Necesita ayuda eligiendo un nombre?' : 'Need help choosing a name?'}
                <a href="https://wa.me/13528377755" style="color:#059669">${isEs ? 'Escríbanos por WhatsApp' : 'Chat with us on WhatsApp'}</a>
              </p>
              <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
                OpaBiz · opabiz.com<br/>
                ${isEs ? 'Este es un correo transaccional. Somos un servicio de preparación de documentos, no un despacho de abogados.' : 'This is a transactional email. We are a document preparation service, not a law firm.'}
              </p>
            </div>
          </div>
        </div>
      `
    }),
    // Alerta interna al admin
    getResend().emails.send({
      from: FROM_OPABIZ_ALERTS,
      replyTo: REPLY_TO,
      to: INTERNAL_EMAIL,
      subject: `OpaBiz Alerts: 🚨 Nombres tomados — contactar cliente (Orden ${order.id})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#b91c1c;padding:20px 32px;border-radius:10px 10px 0 0">
            <h1 style="color:#fff;font-size:20px;margin:0">🚨 Nombres Tomados — Acción Requerida</h1>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <p style="color:#1e293b;font-size:15px;margin:0 0 20px">
              ${esQty} en Sunbiz.
              <strong>Contactar al cliente para solicitar nuevas opciones.</strong>
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr>
                <td style="padding:8px 0;color:#64748b;width:40%">Order ID</td>
                <td style="padding:8px 0;font-weight:600">${order.id}</td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:8px 4px;color:#64748b">Cliente</td>
                <td style="padding:8px 4px;font-weight:600">${order.firstName} ${order.lastName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b">Email</td>
                <td style="padding:8px 0">
                  <a href="mailto:${order.email}" style="color:#059669">${order.email}</a>
                </td>
              </tr>
            </table>
            <div style="margin-top:20px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;font-size:14px">
              <p style="margin:4px 0;color:#991b1b;font-weight:600">Nombre${n === 1 ? '' : 's'} rechazado${n === 1 ? '' : 's'}:</p>
              ${adminList}
            </div>
            <div style="margin-top:16px;padding:14px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1e40af">
              Ya se envió email automático al cliente pidiendo nuevas opciones.
              Hacer seguimiento si no responde en 24 horas.
            </div>
          </div>
        </div>
      `
    })
  ])
}

// ── 3. Nombres sugeridos disponibles — el equipo encontró alternativas ───────
export const sendSuggestNames = async (order: {
  firstName: string
  lastName: string
  email: string
  companyName: string
  id: string
  lang?: 'en' | 'es'
}, availableNames: string[]) => {
  const isEs = order.lang === 'es'
  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  const nameList = availableNames
    .map(n => `<tr><td style="padding:6px 8px 6px 0;vertical-align:top;width:14px;font-size:13.5px;color:#16a34a;font-weight:800">✓</td><td style="padding:6px 0;font-size:13.5px;color:#166534;font-weight:700;line-height:1.6">${n}</td></tr>`)
    .join('')

  // FROM_OPABIZ_SUPPORT — el cliente debe confirmar cuál nombre prefiere.
  await getResend().emails.send({
    from: FROM_OPABIZ_SUPPORT,
    replyTo: REPLY_TO,
    to: order.email,
    subject: isEs ? 'OpaBiz: ✅ Encontramos nombres disponibles para su LLC' : `OpaBiz: ✅ We found available names for your LLC`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:42px;padding-right:12px">
                <div style="width:42px;height:42px;background:linear-gradient(135deg,#1C2E44,#2563EB);border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
              </td>
              <td style="vertical-align:middle">
                <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;line-height:1.2"><span style="color:#1C2E44">Opa</span><span style="color:#2563EB">Biz</span></div>
                <div style="font-size:11px;color:#94A3B8;letter-spacing:.3px;margin-top:2px">Florida Business Formation Center</div>
              </td>
            </tr></table>
          </div>
          <div style="padding:32px">
            <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px">${isEs ? 'Nombres Disponibles' : 'Available Names'}</p>
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">${isEs ? `Encontramos nombres disponibles, ${order.firstName} ${order.lastName}` : `We found available names, ${order.firstName} ${order.lastName}`}</h2>
            <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;margin:4px 0 22px;text-align:center">
              <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">${isEs ? 'Número de Orden' : 'Order Number'}</div>
              <div style="font-size:21px;font-weight:800;color:#1C2E44;letter-spacing:.5px">${fbfc}</div>
            </div>
            <p style="color:#475569;line-height:1.7">
              ${isEs
                ? 'Nuestro equipo buscó en la base de datos de la División de Corporaciones de Florida y encontró los siguientes nombres, actualmente disponibles para registro:'
                : 'Our team searched the Florida Division of Corporations database and found the following names, currently available for registration:'}
            </p>
            <table style="width:100%;border-collapse:collapse;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;margin:20px 0">
              <tr><td style="padding:14px 20px 4px" colspan="2">${nameList}</td></tr>
            </table>
            <p style="color:#475569;line-height:1.7">
              ${isEs
                ? 'Responda este correo indicándonos cuál nombre prefiere para su negocio. En cuanto tengamos su respuesta, seguiremos con el registro.'
                : "Please reply to this email and let us know which name you'd like to use for your business. Once we hear back from you, we'll move forward with the registration."}
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;font-size:14px">
              <strong>${isEs ? 'Nombre original de la empresa:' : 'Original company name:'}</strong> ${order.companyName}
            </div>
            <p style="color:#475569;line-height:1.7">
              ${isEs ? '¿Tiene preguntas o necesita ayuda para elegir?' : 'Have questions or need help deciding?'}
              <a href="https://wa.me/13528377755" style="color:#059669">${isEs ? 'Escríbanos por WhatsApp' : 'Chat with us on WhatsApp'}</a>.
            </p>
            ${unsubscribeFooter(order.email)}
          </div>
        </div>
      </div>
    `
  })
}

// Nombres de add-ons de formación (order.addons = {ein, oa, itin, btr, str, cc,
// dba, br, gd, gs, sc, bl} booleanos — ver lib/pricing.ts ADDON_PRICES).
// Fuente única en lib/order-items.ts (compartida con el checklist admin y el
// portal del cliente).
const ADDON_NAMES = FORMATION_ADDON_NAMES

// Qué incluye cada tier de paquete — mismo contenido que PACKAGE_SERVICES en
// app/order/complete/page.tsx (mantener sincronizado si cambian los paquetes).
// Antes el email solo decía "Package: Standard" sin decir qué trae ese tier;
// esto lo hace explícito para que el cliente vea el detalle completo de lo
// que compró, no solo el nombre del paquete.
export const PACKAGE_SERVICES: Record<string, { en: string; es: string }[]> = {
  basic: [
    { en: 'Business Formation Filing', es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search', es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Articles of Organization / Incorporation', es: 'Artículos de Organización / Incorporación' },
  ],
  standard: [
    { en: 'Business Formation Filing', es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search', es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Articles of Organization / Incorporation', es: 'Artículos de Organización / Incorporación' },
    { en: 'EIN / Tax ID Number', es: 'EIN / Número de ID Fiscal' },
    { en: 'Bank Account Guide', es: 'Guía para Abrir Cuenta Bancaria' },
    { en: 'Registered Agent (1st year free)', es: 'Agente Registrado (1er año gratis)' },
  ],
  premium: [
    { en: 'Business Formation Filing', es: 'Registro de Formación Empresarial' },
    { en: 'Name Availability Search', es: 'Verificación de Disponibilidad de Nombre' },
    { en: 'Articles of Organization / Incorporation', es: 'Artículos de Organización / Incorporación' },
    { en: 'EIN / Tax ID Number', es: 'EIN / Número de ID Fiscal' },
    { en: 'Bank Account Guide', es: 'Guía para Abrir Cuenta Bancaria' },
    { en: 'Registered Agent (1st year free)', es: 'Agente Registrado (1er año gratis)' },
    { en: 'Operating Agreement', es: 'Acuerdo Operativo' },
    { en: 'Expedited Filing (1–3 days)', es: 'Registro Prioritario (1–3 días)' },
    { en: 'ITIN Application', es: 'Solicitud de ITIN' },
    { en: 'DBA / Fictitious Name', es: 'DBA / Nombre Ficticio' },
    { en: 'Articles of Amendment', es: 'Artículos de Enmienda' },
  ],
}

// ── 4. Orden procesada ante el Estado de Florida (status: filed) ─────────────
//    Cliente avisa: tus documentos fueron presentados, esperá la aprobación.
export const sendOrderProcessed = async (order: {
  firstName: string
  lastName: string
  email: string
  companyName: string
  entityType?: string
  package?: string
  id: string
  speed?: string
  addons?: Record<string, boolean> | null
  unsubscribed?: boolean
  lang?: 'en' | 'es'
}) => {
  if (order.unsubscribed) {
    return { success: false, reason: 'unsubscribed' }
  }

  const isEs = order.lang === 'es'
  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  const speedLabel = order.speed === 'expedited'
    ? (isEs ? 'Acelerado' : 'Expedited')
    : (isEs ? 'Estándar' : 'Standard')
  // Nombres de los add-ons realmente comprados por ESTE cliente (no una lista
  // fija) — filtra order.addons por los que están en true.
  const addonNames = Object.entries(order.addons ?? {})
    .filter(([, v]) => !!v)
    .map(([k]) => ADDON_NAMES[k]?.[isEs ? 'es' : 'en'] ?? k)
  const hasAddons = addonNames.length > 0
  // Detalle de qué trae el paquete comprado (no solo el nombre del tier) —
  // feedback: "un email que solo dice 'compraste paquete estándar' no me dice
  // nada como cliente". packageKey normaliza mayúsculas/espacios por si acaso.
  const packageKey = (order.package ?? '').toLowerCase().trim()
  const packageItems = (PACKAGE_SERVICES[packageKey] ?? []).map(i => isEs ? i.es : i.en)

  await getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: isEs ? `OpaBiz: 📋 Enviamos su trámite a Florida — ${order.companyName}` : `OpaBiz: 📋 Your filing was submitted to Florida — ${order.companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:42px;padding-right:12px">
                <div style="width:42px;height:42px;background:linear-gradient(135deg,#1C2E44,#2563EB);border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
              </td>
              <td style="vertical-align:middle">
                <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;line-height:1.2"><span style="color:#1C2E44">Opa</span><span style="color:#2563EB">Biz</span></div>
                <div style="font-size:11px;color:#94A3B8;letter-spacing:.3px;margin-top:2px">Florida Business Formation Center</div>
              </td>
            </tr></table>
          </div>
          <div style="padding:32px">
            <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px">${isEs ? 'Actualización de su Trámite' : 'Filing Update'}</p>
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">${isEs ? `Su trámite fue enviado al Estado de Florida, ${order.firstName} ${order.lastName}` : `Your filing has been submitted to the State of Florida, ${order.firstName} ${order.lastName}`}</h2>
            <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;margin:4px 0 22px;text-align:center">
              <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">${isEs ? 'Número de Orden' : 'Order Number'}</div>
              <div style="font-size:21px;font-weight:800;color:#1C2E44;letter-spacing:.5px">${fbfc}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
              <p style="margin:6px 0;font-size:14px"><strong>${isEs ? 'Empresa' : 'Company Name'}:</strong> ${order.companyName}</p>
              ${order.entityType ? `<p style="margin:6px 0;font-size:14px"><strong>${isEs ? 'Tipo de Entidad' : 'Entity Type'}:</strong> ${order.entityType.toUpperCase()}</p>` : ''}
              ${order.package ? `
              <p style="margin:6px 0 4px;font-size:14px"><strong>${isEs ? 'Paquete' : 'Package'}:</strong> ${order.package}</p>
              ${packageItems.length ? `<table style="width:100%;border-collapse:collapse;margin:0 0 10px">${packageItems.map(item => `<tr><td style="padding:2px 8px 2px 0;vertical-align:top;width:10px;font-size:12.5px;color:#94a3b8;font-weight:800">·</td><td style="padding:2px 0;font-size:12.5px;color:#64748b;line-height:1.6">${item}</td></tr>`).join('')}</table>` : ''}
              ` : ''}
              <p style="margin:6px 0;font-size:14px"><strong>${isEs ? 'Velocidad de trámite' : 'Filing Speed'}:</strong> ${speedLabel}</p>
              ${hasAddons ? `<p style="margin:6px 0 0;font-size:14px"><strong>${isEs ? 'Servicios Adicionales' : 'Additional Services'}:</strong> ${addonNames.join(', ')}</p>` : ''}
            </div>
            <p style="color:#475569;line-height:1.7">
              ${isEs
                ? 'Nuestro equipo completó sus documentos y los presentó ante la División de Corporaciones de Florida. Le avisaremos por correo en cuanto el Estado apruebe su negocio.'
                : "Our team has completed your paperwork and submitted it to the Florida Division of Corporations. We'll notify you by email as soon as the State approves your business."}
            </p>
            <p style="color:#475569;line-height:1.7">
              ${hasAddons
                ? (isEs
                    ? 'Una vez aprobado, le enviaremos su Certificado oficial (Artículos de Organización / Incorporación). Seguiremos trabajando en los servicios adicionales de arriba y se los entregaremos por separado a medida que estén listos.'
                    : "Once approved, we'll send you your official Certificate (Articles of Organization / Incorporation). We'll continue processing the additional services listed above and deliver each one separately as it's completed.")
                : (isEs
                    ? 'Una vez aprobado, le enviaremos su Certificado oficial (Artículos de Organización / Incorporación).'
                    : "Once approved, we'll send you your official Certificate (Articles of Organization / Incorporation).")}
            </p>
            <p style="color:#475569;line-height:1.7">
              ${isEs ? 'Para dar seguimiento a su orden cuando quiera, haga clic abajo e inicie sesión con su correo y el número de orden de arriba.' : 'To follow up on your order anytime, click below and log in with your email and the order number above.'}
            </p>
            <div style="text-align:center;margin:24px 0">
              <a href="${PORTAL_HOME}" style="background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
                ${isEs ? 'Rastrear Mi Orden' : 'Track My Order'}
              </a>
            </div>
            <p style="color:#475569;line-height:1.7">
              ${isEs ? '¿Preguntas? Escríbanos por' : 'Questions? Reach us on'} <a href="https://wa.me/13528377755" style="color:#059669">WhatsApp</a> ${isEs ? 'o responda este correo.' : 'or reply to this email.'}
            </p>
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
              OpaBiz · opabiz.com<br/>
              ${isEs ? 'Este es un correo transaccional. Somos un servicio de preparación de documentos, no un despacho de abogados.' : 'This is a transactional email. We are a document preparation service, not a law firm.'}
            </p>
          </div>
        </div>
      </div>
    `,
  })
}

// Resuelve cualquier clave de ítem (formación, addon de formación, servicio o
// bundle à la carte, o servicio de marketing — ver lib/order-items.ts) a su
// nombre legible en el idioma del email. Reemplaza la versión local que solo
// conocía 'formation' + los 12 addons de formación (mostraba la clave cruda
// para órdenes de /servicios/checkout o de marketing).
function itemLabel(key: string, entityType: string | undefined, lang: 'en' | 'es'): string {
  return getOrderItemLabel(key, { entityType, lang })
}

// ── 5/6 unificados — Aprobación + entrega de documento(s) ────────────────────
// Reemplaza los antiguos sendOrderApproved (A6) y sendCertificateDelivery (A7),
// que eran dos emails separados y asumían que SIEMPRE era una formación LLC/Corp
// con Certificate adjunto. Ahora es un solo email genérico que sirve para
// cualquier tipo de orden (formación y/o servicios à la carte), con o sin
// archivos adjuntos, y que le dice al cliente qué quedó aprobado/entregado en
// esta ronda y qué sigue en proceso (decisión founder 2026-07-09: el botón
// "Approved" del admin pasa a ser solo interno; este email lo dispara un botón
// aparte "Enviar documento(s) al cliente" con un checklist de ítems).
export const sendOrderApprovalUpdate = async (
  order: {
    firstName: string
    lastName: string
    email: string
    companyName: string
    entityType?: string
    id: string
    unsubscribed?: boolean
    lang?: 'en' | 'es'
  },
  delivery: {
    /** claves de items aprobados/entregados EN ESTA RONDA (ej. ['formation','ein']) */
    approvedItems: string[]
    /** claves de items que todavía faltan (se seguirán procesando aparte) */
    pendingItems: string[]
    /** archivos adjuntos de esta ronda (Resend attachment format) */
    attachments?: { filename: string; content: Buffer }[]
  }
) => {
  if (order.unsubscribed) {
    return { success: false, reason: 'unsubscribed' }
  }

  const isEs = order.lang === 'es'
  const lang: 'en' | 'es' = isEs ? 'es' : 'en'
  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  const approvedLabels = delivery.approvedItems.map(k => itemLabel(k, order.entityType, lang))
  const pendingLabels = delivery.pendingItems.map(k => itemLabel(k, order.entityType, lang))
  const hasFiles = (delivery.attachments?.length ?? 0) > 0
  const hasPending = pendingLabels.length > 0
  const hasFormation = delivery.approvedItems.includes('formation')

  const heading = hasFiles
    ? (isEs ? `¡Buenas noticias, ${order.firstName} ${order.lastName}!` : `Great news, ${order.firstName} ${order.lastName}!`)
    : (isEs ? `Actualización de su orden, ${order.firstName} ${order.lastName}` : `Update on your order, ${order.firstName} ${order.lastName}`)

  // Menciona explícitamente la aprobación del Estado cuando corresponde
  // (feedback founder: decir "fue aprobado por el Estado y adjunto su copia
  // del..." en vez de un genérico "great news"/"documents are ready").
  const introText = (() => {
    if (isEs) {
      if (hasFormation && hasFiles) return 'Su negocio fue aprobado por el Estado de Florida, y adjunto encontrará su copia del documento oficial.'
      if (hasFormation) return 'Su negocio fue aprobado por el Estado de Florida. Su documento oficial le llegará por separado.'
      if (hasFiles) return 'Adjunto encontrará su copia del/de los documento(s).'
      return 'Le escribimos para contarle el avance de su orden.'
    }
    if (hasFormation && hasFiles) return 'Your business was approved by the State of Florida, and attached you will find your copy of the official document.'
    if (hasFormation) return 'Your business was approved by the State of Florida. Your official document will follow separately.'
    if (hasFiles) return 'Attached you will find your copy of the document(s).'
    return "We're writing to update you on your order's progress."
  })()

  await getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: order.email,
    subject: hasFiles
      ? (isEs ? `OpaBiz: 🏆 Sus documentos están listos — ${order.companyName}` : `OpaBiz: 🏆 Your documents are ready — ${order.companyName}`)
      : (isEs ? `OpaBiz: 🎉 Actualización de su orden — ${order.companyName}` : `OpaBiz: 🎉 Update on your order — ${order.companyName}`),
    attachments: delivery.attachments,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="width:42px;padding-right:12px">
                <div style="width:42px;height:42px;background:linear-gradient(135deg,#1C2E44,#2563EB);border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
              </td>
              <td style="vertical-align:middle">
                <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;line-height:1.2"><span style="color:#1C2E44">Opa</span><span style="color:#2563EB">Biz</span></div>
                <div style="font-size:11px;color:#94A3B8;letter-spacing:.3px;margin-top:2px">Florida Business Formation Center</div>
              </td>
            </tr></table>
          </div>
          <div style="padding:32px">
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">${heading}</h2>
            <div style="background:#EFF6FF;border-radius:8px;padding:14px 18px;margin:4px 0 22px;text-align:center">
              <div style="font-size:11px;color:#2563EB;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:4px">${isEs ? 'Número de Orden' : 'Order Number'}</div>
              <div style="font-size:21px;font-weight:800;color:#1C2E44;letter-spacing:.5px">${fbfc}</div>
            </div>
            <p style="color:#475569;line-height:1.7">${introText}</p>
            ${approvedLabels.length ? `
            <p style="font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 10px">${isEs ? 'Aprobado' : 'Approved'}</p>
            <table style="width:100%;border-collapse:collapse;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;margin-bottom:16px">
              <tr><td style="padding:14px 18px">${approvedLabels.map(l => `<div style="font-size:13.5px;color:#166534;padding:3px 0"><strong>✓</strong> ${l}</div>`).join('')}</td></tr>
            </table>` : ''}
            ${hasPending ? `
            <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 10px">${isEs ? 'Todavía en proceso' : 'Still in process'}</p>
            <table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:16px">
              <tr><td style="padding:14px 18px">${pendingLabels.map(l => `<div style="font-size:13.5px;color:#475569;padding:3px 0">· ${l}</div>`).join('')}</td></tr>
            </table>
            <p style="color:#475569;line-height:1.7">
              ${isEs ? 'Le avisaremos por separado a medida que cada uno de estos quede listo.' : "We'll notify you separately as each of these is ready."}
            </p>` : ''}
            <p style="color:#475569;line-height:1.7">
              ${isEs ? '¿Preguntas? Escríbanos por' : 'Questions? Reach us on'} <a href="https://wa.me/13528377755" style="color:#059669">WhatsApp</a> ${isEs ? 'o responda este correo.' : 'or reply to this email.'}
            </p>
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
              OpaBiz · opabiz.com<br/>
              ${isEs ? 'Este es un correo transaccional. Somos un servicio de preparación de documentos, no un despacho de abogados.' : 'This is a transactional email. We are a document preparation service, not a law firm.'}
            </p>
          </div>
        </div>
      </div>
    `,
  })
}
