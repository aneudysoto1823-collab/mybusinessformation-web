import { z } from 'zod'

// ── Helpers comunes ──────────────────────────────────────────────────────────
const Email = z.string().trim().toLowerCase().email().max(200)
const ShortText = z.string().trim().max(100)
const MedText = z.string().trim().max(200)
const LongText = z.string().trim().max(500)

// ── 1. POST /api/orders — wizard tradicional ─────────────────────────────────
// Crea orden con paymentStatus='pending', status='pending'. Validacion permisiva
// (replica lo que el handler ya acepta) + longitudes maximas + whitelist en enums.
export const OrderInputSchema = z.object({
  firstName: ShortText.min(1),
  lastName: ShortText.min(1),
  email: Email,
  phone: z.string().trim().max(50).optional().nullable(),
  country: ShortText.optional().nullable(),

  companyName: MedText.min(1),
  companyName2: MedText.optional().nullable(),
  companyName3: MedText.optional().nullable(),
  entityType: z.enum(['llc', 'corp']).optional(),
  businessAddress: LongText.optional().nullable(),

  speed: z.enum(['standard', 'expedited']).optional(),
  package: z.string().trim().max(50),
  amount: z.number().nonnegative().max(10000).optional(),
  currency: z.string().trim().max(10).optional(),

  // Los siguientes son JSON flexibles — los validamos en su forma minima.
  members: z.unknown().optional().nullable(),
  registeredAgent: z.enum(['us', 'own']).optional(),
  addons: z.unknown().optional().nullable(),
  orgSignature: LongText.optional().nullable(),

  // Promoción de un borrador (ver OrderDraftInputSchema) a orden real —
  // si viene, /api/orders actualiza esa fila en vez de insertar una nueva.
  draftOrderId: z.string().uuid().optional().nullable(),
})

// ── 1b. POST /api/orders/draft — guardado incremental del form en progreso ───
// Se llama en cada paso del wizard (desde el paso "Tu Información" en adelante)
// para que la orden sea recuperable desde cualquier dispositivo, no solo desde
// el navegador donde se empezó. Validación permisiva: a mitad del formulario
// muchos campos todavía no existen.
export const OrderDraftInputSchema = z.object({
  orderId: z.string().uuid().optional().nullable(),

  firstName: ShortText.min(1),
  lastName: ShortText.min(1),
  email: Email,
  phone: z.string().trim().max(50).optional().nullable(),
  country: ShortText.optional().nullable(),

  companyName: MedText.min(1),
  companyName2: MedText.optional().nullable(),
  companyName3: MedText.optional().nullable(),
  entityType: z.enum(['llc', 'corp']).optional(),
  businessAddress: LongText.optional().nullable(),

  speed: z.enum(['standard', 'expedited']).optional(),
  package: z.string().trim().max(50).optional(),
  amount: z.number().nonnegative().max(10000).optional(),

  members: z.unknown().optional().nullable(),
  registeredAgent: z.enum(['us', 'own']).optional(),
  addons: z.unknown().optional().nullable(),
  orgSignature: LongText.optional().nullable(),

  // Snapshot crudo del formulario (fmData + values de inputs) para restaurar
  // exactamente donde el cliente quedó. Tamaño acotado — es un form, no un blob.
  snapshot: z.unknown().optional().nullable(),
})

// ── 2. POST /api/chat — Claudia ──────────────────────────────────────────────
// Mensajes con max length agresivo para evitar abuso de token cost.
export const ChatInputSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().max(10000),
      })
    )
    .min(1)
    .max(100),
  session_id: z.string().max(100).optional().nullable(),
  form_context: z.string().max(10000).optional().nullable(),
})

// ── 3. POST /api/client-auth — login portal cliente ──────────────────────────
// confirmationNumber: FBFC-XXXXXXXX (formacion) o FBNB-XXXXXXXX (new business).
export const ClientAuthInputSchema = z.object({
  // Email ya no es obligatorio para este modo — el número de orden alcanza
  // (decisión negocio 2026-07-02: agiliza "Continue My Application"). Sigue
  // siendo aceptado si viene (compatibilidad con los forms que lo piden), pero
  // el backend ya no lo usa para filtrar.
  email: Email.optional(),
  confirmationNumber: z
    .string()
    .trim()
    .regex(/^(?:FBFC|FBNB)-[A-Z0-9]{8}$/i, 'Formato invalido — esperado FBFC-XXXXXXXX o FBNB-XXXXXXXX'),
})

// ── 4. POST /api/sunbiz/checkout — Stripe Checkout para New Business Letter ──
const KNOWN_SERVICES = ['labor_law_poster', 'ein', 'certificate_of_status', 'bundle'] as const
export const SunbizCheckoutInputSchema = z.object({
  company_id: z.string().max(100).optional().nullable(),
  document_id: z.string().trim().max(50).optional().nullable(),
  company_name: MedText.optional().nullable(),
  selected_services: z.array(z.enum(KNOWN_SERVICES)).min(1).max(KNOWN_SERVICES.length),
  lang: z.enum(['en', 'es']).optional(),
})

// ── 5. POST /api/campaigns/companies — admin agrega empresa manual ───────────
// Nota: este endpoint hoy NO tiene verifyAdmin — vale agregar en otro sprint.
// La validacion zod no resuelve ese gap de auth pero al menos sanitiza inputs.
export const CampaignsCompaniesInputSchema = z.object({
  document_id: z.string().trim().min(1).max(50),
  company_name: MedText.min(1),
  owner_name: MedText.optional().nullable(),
  address: LongText.optional().nullable(),
  city: ShortText.optional().nullable(),
  zip: z.string().trim().max(20).optional().nullable(),
  email: Email.optional().nullable(),
  company_type: z.string().trim().max(50).optional().nullable(),
  registration_date: z.string().trim().max(50).optional().nullable(),
})

// ── Helper: parsea y devuelve un error 400 estructurado si falla ────────────
export function parseOr400<T>(
  schema: z.ZodType<T>,
  data: unknown
): { ok: true; data: T } | { ok: false; error: string; details: unknown } {
  const result = schema.safeParse(data)
  if (result.success) return { ok: true, data: result.data }
  // Mensaje compacto al cliente, detalle estructurado en logs.
  const issues = result.error.issues
  const first = issues[0]
  const summary = first ? `${first.path.join('.') || '(root)'}: ${first.message}` : 'Validation error'
  return { ok: false, error: summary, details: issues }
}
