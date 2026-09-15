import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getOrderItemKeys, getOrderItemLabel, hasFormationOrder } from '@/lib/order-items'
import { getClientDocumentsForOrder } from '@/lib/client-documents'
import DashboardContent from './DashboardContent'

interface Order {
  id: string
  createdAt: string
  firstName: string
  lastName: string
  email: string
  companyName: string
  entityType: string
  package: string
  speed: string
  amount: number
  paymentStatus: string
  status: string
  addons: unknown
  subscriptions?: unknown
  isDraft?: boolean
  deliveredItems?: Record<string, boolean> | null
}

const ADDON_STEPS = [
  { key: 'payment',    label: 'Payment Confirmed',        labelEs: 'Pago Confirmado' },
  { key: 'processing', label: 'Processing Your Services', labelEs: 'Procesando tus Servicios' },
  { key: 'completed',  label: 'Services Delivered',       labelEs: 'Servicios Entregados' },
]

function getAddonStepIndex(status: string): number {
  // 'completed' devuelve length (3), no el índice del último paso (2) — el
  // timeline marca "done" con `i < currentStep`, así que con currentStep=2 el
  // propio paso final ("Services Delivered") nunca calificaba como done y se
  // quedaba mostrado como "actual" (con el badge "En Progreso") para siempre.
  if (status === 'completed') return ADDON_STEPS.length
  if (status === 'in_review' || status === 'processing') return 1
  return 0
}

function parseAddons(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return {} } }
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

interface DocumentFile {
  filename: string
  url: string
}

interface DocumentItem {
  key: string
  label: string
  labelEs: string
  files: DocumentFile[]
  delivered: boolean
  pending: string
  pendingEs: string
}

// Reescrito 2026-09-15 (Item 5 de la auditoría FTC/UPL) — la versión anterior
// ADIVINABA rutas fijas de archivo (orders/{id}/certificate.pdf, etc.) que
// ningún flujo real de subida genera (send-approval-update usa nombres
// dinámicos con timestamp) — confirmado con grep, cero callers escriben a
// esas rutas. En la práctica esta sección SIEMPRE mostraba "Pending", incluso
// después de que el staff ya hubiera entregado el documento real. Ahora lee
// de la tabla `client_documents` (registro real de cada archivo entregado,
// ver lib/client-documents.ts) cruzada con Order.deliveredItems (mismo
// vocabulario de claves que lib/order-items.ts, ya usado por el checklist
// admin) — sin adivinar nada, y unificado para formación/servicios/marketing
// (getOrderItemKeys ya es shape-agnóstico para los 3).
async function getDocuments(order: Order): Promise<DocumentItem[]> {
  const itemKeys = getOrderItemKeys(order.package, order.addons)
  const delivered = order.deliveredItems ?? {}
  const deliveredDocs = await getClientDocumentsForOrder(order.id)
  const entityType = order.entityType

  return itemKeys.map(key => {
    const isDelivered = delivered[key] === true
    const files = deliveredDocs
      .filter(d => d.itemKeys.includes(key))
      .map(d => ({ filename: d.filename, url: d.url }))
    return {
      key,
      label: getOrderItemLabel(key, { entityType, lang: 'en' }),
      labelEs: getOrderItemLabel(key, { entityType, lang: 'es' }),
      files,
      delivered: isDelivered,
      pending: 'Pending — being prepared by our team',
      pendingEs: 'Pendiente — siendo preparado por nuestro equipo',
    }
  })
}

async function getOrder(id: string): Promise<Order | null> {
  const { data } = await getSupabaseAdmin()
    .from('Order')
    .select('id, createdAt, firstName, lastName, email, companyName, entityType, package, speed, amount, paymentStatus, status, addons, subscriptions, client_password_hash, isDraft, deliveredItems')
    .eq('id', id)
    .single()
  return (data as (Order & { client_password_hash?: string | null }) | null)
}

async function getOrdersByEmail(email: string): Promise<Order[]> {
  // @brand-unified — portal cliente unificado (misma cookie, "Mis órdenes"
  // muestra todas las órdenes del cliente cruzando OpaBiz y FBFC).
  const { data } = await getSupabaseAdmin()
    .from('Order')
    .select('id, createdAt, firstName, lastName, email, companyName, entityType, package, speed, amount, paymentStatus, status, addons, subscriptions, isDraft, deliveredItems')
    .eq('email', email.toLowerCase().trim())
    .order('createdAt', { ascending: false })
  return (data ?? []) as Order[]
}

const STEPS = [
  { key: 'order_received',   label: 'Order Received',            labelEs: 'Orden Recibida' },
  { key: 'payment',          label: 'Payment Confirmed',         labelEs: 'Pago Confirmado' },
  { key: 'name_check',       label: 'Name Availability Check',   labelEs: 'Verificación de Nombre' },
  { key: 'ready_to_file',    label: 'Ready to File',             labelEs: 'Listo para Registrar' },
  { key: 'filed',            label: 'Processed with Florida',    labelEs: 'Procesado ante Florida' },
  { key: 'approved',         label: 'Approved by State',         labelEs: 'Aprobado por el Estado' },
  { key: 'completed',        label: 'Completed',                 labelEs: 'Completado' },
]

// Returns index of the current active step (0-based)
function getCurrentStepIndex(status: string): number {
  switch (status) {
    case 'pending':       return 0
    case 'in_review':     return 2
    case 'names_taken':   return 2
    case 'ready_to_file': return 3
    case 'filed':         return 4
    case 'approved':      return 5
    // length (7), no el índice del último paso (6) — mismo fix que
    // getAddonStepIndex de arriba, mismo motivo.
    case 'completed':     return STEPS.length
    default:              return 0
  }
}

function getConfirmationNumber(id: string, pkg: string): string {
  const prefix = pkg === 'addon' ? 'FBNB' : 'FBFC'
  return `${prefix}-${id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
}

export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; lang?: string }>
}) {
  const cookieStore = await cookies()
  const host = (await headers()).get('host') || ''
  const initialIsFBFC = host.includes('mybusinessformation.com')
  const sessionOrderId = cookieStore.get('client_session')?.value
  if (!sessionOrderId) redirect('/client-portal')

  const sessionOrder = await getOrder(sessionOrderId)
  if (!sessionOrder) redirect('/client-portal')

  // Orden todavía sin terminar de llenar — no hay nada que mostrar acá, se
  // retoma el formulario donde quedó (ver ?resume=1 en app/page.tsx). Cubre el
  // caso de una cookie de sesión vieja apuntando a un borrador.
  const paramsForDraftCheck = await searchParams
  if (sessionOrder.isDraft) {
    const langQ = paramsForDraftCheck.lang ? `&lang=${paramsForDraftCheck.lang}` : ''
    redirect(`/?resume=1${langQ}`)
  }

  // Fetch all orders for this client's email (sin borradores — no son órdenes reales)
  const allOrders = (await getOrdersByEmail(sessionOrder.email)).filter(o => !o.isDraft)

  // Determine which order to display (URL param or default to session order)
  const params = paramsForDraftCheck
  const selectedId = params.order && allOrders.some(o => o.id === params.order)
    ? params.order
    : sessionOrderId

  const order = allOrders.find(o => o.id === selectedId) ?? sessionOrder

  const isAddon = order.package === 'addon'
  const currentStep = isAddon ? getAddonStepIndex(order.status) : getCurrentStepIndex(order.status)
  const confirmationNumber = getConfirmationNumber(order.id, order.package)
  // STEPS trae "Name Availability Check" / "Verificación de Nombre" en el
  // índice 2 — solo tiene sentido cuando la orden de verdad incluye una
  // formación de LLC/Corp. Antes CUALQUIER orden de /servicios/checkout
  // (package:'services', ej. solo un Registered Agent o un EIN suelto, sin
  // formación) caía en el mismo STEPS por no ser 'addon', mostrando ese paso
  // igual. En mybusinessformation.com esto pasaba SIEMPRE — ese dominio nunca
  // vende formación (EXCLUDED_IDS en new-business/servicios/page.tsx), así
  // que todo cliente de mybiz veía "Verificación de Nombre" en su tracker sin
  // sentido, además de mencionar Florida/Sunbiz para servicios que no son un
  // filing estatal. Fix: mismo STEPS (7 pasos, mismo getCurrentStepIndex —
  // el pipeline de status sí es compartido y válido para servicios sueltos
  // que pasan por ready_to_file/filed/approved), solo se relabela ese paso
  // (por su `key`, no por índice — un reorden de STEPS no debe desalinear
  // el relabel) cuando la orden no trae formación. hasFormationOrder()
  // (lib/order-items.ts) es la misma función que usa getDocuments() más
  // arriba para esta decisión.
  const steps = isAddon
    ? ADDON_STEPS
    : (order.package === 'services' && !hasFormationOrder(order.package, order.addons))
      ? STEPS.map(s => s.key === 'name_check' ? { key: 'processing', label: 'Processing Your Order', labelEs: 'Procesando tu Orden' } : s)
      : STEPS
  const documents = await getDocuments(order)
  // initialLang: ?lang del home (override explícito, ej. toggle manual) →
  // idioma con el que el cliente hizo ESTA orden (addons.lang, automático,
  // 2026-09-07) → cookie portal_lang (memoria del navegador, más débil que
  // el de la orden real) → 'en'. Antes el portal ignoraba por completo el
  // idioma real de la orden y dependía solo de la cookie — si el cliente
  // entraba desde otro dispositivo/navegador sin esa cookie, el portal le
  // salía en inglés aunque hubiera comprado en español. Evita también el
  // parpadeo EN→ES en el primer render cuando vienes del home con ?lang.
  const orderLang = (parseAddons(order.addons).lang as string | undefined)
  const portalLangCookie = cookieStore.get('portal_lang')?.value
  const initialLang: 'en' | 'es' =
    params.lang === 'es' ? 'es'
    : params.lang === 'en' ? 'en'
    : orderLang === 'es' ? 'es'
    : orderLang === 'en' ? 'en'
    : portalLangCookie === 'es' ? 'es'
    : 'en'

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f4f6f9;
          font-family: var(--font-sans);
        }

        .cp-wrapper {
          max-width: 760px;
          margin: 0 auto;
          padding: 40px 24px 60px;
        }

        /* Header */
        .cp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .cp-header-left { display: flex; align-items: center; gap: 14px; }

        .cp-header-brand {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a2e;
          text-decoration: none;
          display: inline-block;
        }

        .cp-header-brand span {
          display: block;
          font-size: 13px;
          font-weight: 400;
          color: #6b7280;
          margin-top: 2px;
        }

        .cp-back {
          display: inline-flex;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          text-decoration: none;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 7px 12px;
          white-space: nowrap;
          transition: border-color 0.15s, color 0.15s;
        }
        .cp-back:hover { border-color: #d1d5db; color: #111827; }

        .btn-logout {
          background: none;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          text-decoration: none;
        }

        .btn-logout:hover {
          border-color: #d1d5db;
          color: #111827;
        }

        /* My Orders */
        .my-orders-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .order-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          text-decoration: none;
          background: #fff;
          transition: border-color 0.15s, box-shadow 0.15s;
          gap: 12px;
        }
        .order-card:hover {
          border-color: #4f46e5;
          box-shadow: 0 2px 8px rgba(79,70,229,0.08);
        }
        .order-card.active {
          border-color: #4f46e5;
          background: #f5f3ff;
        }
        .order-card-left { display: flex; flex-direction: column; gap: 3px; }
        .order-card-num { font-size: 13px; font-weight: 700; color: #4f46e5; font-family: monospace; }
        .order-card.active .order-card-num { color: #3730a3; }
        .order-card-company { font-size: 14px; font-weight: 600; color: #1a1a2e; }
        .order-card-pkg { font-size: 12px; color: #6b7280; }
        .order-card-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .order-card-arrow { font-size: 14px; color: #9ca3af; }
        .order-card.active .order-card-arrow { color: #4f46e5; }
        .order-pill {
          font-size: 11px; font-weight: 700; padding: 2px 9px;
          border-radius: 20px; text-transform: uppercase; letter-spacing: 0.4px;
        }
        .order-pill.pending       { background: #fef3c7; color: #92400e; }
        .order-pill.in_review     { background: #dbeafe; color: #1e40af; }
        .order-pill.processing    { background: #dbeafe; color: #1e40af; }
        .order-pill.ready_to_file { background: #ede9fe; color: #5b21b6; }
        .order-pill.filed         { background: #dbeafe; color: #1e40af; }
        .order-pill.approved      { background: #d1fae5; color: #065f46; }
        .order-pill.completed     { background: #d1fae5; color: #065f46; }
        .order-pill.names_taken   { background: #fee2e2; color: #991b1b; }

        /* Welcome */
        .cp-welcome {
          margin-bottom: 28px;
        }

        .cp-welcome h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a2e;
        }

        .cp-welcome p {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }

        /* Card */
        .cp-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
          padding: 28px 28px 24px;
          margin-bottom: 20px;
        }

        .cp-card h2 {
          font-size: 14px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }

        /* Timeline */
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding-bottom: 20px;
          position: relative;
        }

        .timeline-item:last-child {
          padding-bottom: 0;
        }

        .timeline-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .timeline-icon.done {
          background: #d1fae5;
          color: #065f46;
        }

        .timeline-icon.current {
          background: #4f46e5;
          color: #ffffff;
        }

        .timeline-icon.pending {
          background: #f3f4f6;
          color: #9ca3af;
        }

        .timeline-line {
          position: absolute;
          left: 13px;
          top: 28px;
          bottom: 0;
          width: 2px;
          background: #e5e7eb;
          z-index: 0;
        }

        .timeline-item.done .timeline-line {
          background: #a7f3d0;
        }

        .timeline-item:last-child .timeline-line {
          display: none;
        }

        .timeline-label {
          padding-top: 4px;
        }

        .timeline-label .step-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }

        .timeline-item.pending .step-name {
          color: #9ca3af;
          font-weight: 500;
        }

        .timeline-item.current .step-name {
          color: #4f46e5;
        }

        .timeline-item.current .step-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          color: #4f46e5;
          background: #eef2ff;
          border-radius: 4px;
          padding: 2px 7px;
          margin-left: 8px;
          vertical-align: middle;
        }

        /* Details grid */
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 500px) {
          .details-grid { grid-template-columns: 1fr; }
        }

        .detail-item .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 3px;
        }

        .detail-item .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }

        /* What's next */
        .whats-next-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.65;
        }

        .status-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 12px;
        }

        .status-pill.pending       { background: #fef3c7; color: #92400e; }
        .status-pill.in_review     { background: #dbeafe; color: #1e40af; }
        .status-pill.processing    { background: #dbeafe; color: #1e40af; }
        .status-pill.names_taken   { background: #fee2e2; color: #991b1b; }
        .status-pill.ready_to_file { background: #ede9fe; color: #5b21b6; }
        .status-pill.filed         { background: #dbeafe; color: #1e40af; }
        .status-pill.approved      { background: #d1fae5; color: #065f46; }
        .status-pill.completed     { background: #d1fae5; color: #065f46; }

        /* Package & Services */
        .pkg-name {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a2e;
        }
        .pkg-price {
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
          margin-top: 2px;
          margin-bottom: 16px;
        }
        .pkg-popular {
          display: inline-block;
          background: #4f46e5;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 9px;
          border-radius: 999px;
          margin-left: 10px;
          vertical-align: middle;
        }
        .pkg-speed-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #dcfce7;
          color: #16a34a;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 18px;
        }
        .pkg-sublabel {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        .pkg-services {
          list-style: none;
          padding: 0;
          margin: 0 0 18px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .pkg-services li {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 14px;
          color: #374151;
        }
        .pkg-services li .chk { color: #16a34a; font-weight: 700; }
        .pkg-services li .addon-chk { color: #6d28d9; font-weight: 700; }
        .pkg-active-badge {
          background: #dcfce7;
          color: #16a34a;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 8px;
          border-radius: 999px;
          margin-left: 4px;
        }

        /* My Documents */
        .doc-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .doc-item:last-child { border-bottom: none; }
        .doc-icon {
          width: 36px;
          height: 36px;
          background: #eef2ff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .doc-info { flex: 1; min-width: 0; }
        .doc-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }
        .doc-status {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
        }
        .btn-download {
          display: inline-block;
          background: #16a34a;
          color: #fff;
          text-decoration: none;
          padding: 7px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-download:hover { background: #15803d; }
        .lang-toggle { display: flex; background: #f3f4f6; border-radius: 20px; padding: 3px; gap: 2px; }
        .lang-btn { background: none; border: none; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; color: #6b7280; cursor: pointer; transition: all 0.15s; }
        .lang-btn.active { background: #1C2E44; color: #fff; }
        .lang-sep { width: 1px; background: #e2e8f0; }
      `}</style>
      <DashboardContent
        order={order}
        allOrders={allOrders}
        documents={documents}
        confirmationNumber={confirmationNumber}
        steps={steps}
        currentStep={currentStep}
        isAddon={isAddon}
        initialLang={initialLang}
        hasPassword={!!(sessionOrder as { client_password_hash?: string | null }).client_password_hash}
        initialIsFBFC={initialIsFBFC}
      />
    </>
  )
}
