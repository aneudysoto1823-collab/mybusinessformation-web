-- Migration: tracking del provisioning de Registered Agent (integracion API
-- RegisteredAgentsInc / Corporate Tools). El pago de la factura sigue siendo
-- manual desde el portal RAI en esta fase — el sistema solo crea la company,
-- asigna el servicio, guarda el invoice_id, y una vez que el staff paga a mano,
-- el cron nocturno recupera la direccion y dispara el email al cliente.
--
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

ALTER TABLE "Order"
  -- ID de la company creada en RAI via POST /companies. Se llena al confirmar
  -- el pago Stripe cuando la orden tiene addons.ra = true.
  ADD COLUMN IF NOT EXISTS "raCompanyId" TEXT,

  -- ID del servicio de RA asignado en RAI via POST /services. Se llena en el
  -- mismo trigger, inmediatamente despues de crear la company.
  ADD COLUMN IF NOT EXISTS "raServiceId" TEXT,

  -- ID de la factura generada por RAI al asignar el servicio. Se llena
  -- consultando GET /invoices?company_id=... El staff usa este ID para
  -- ubicar la factura en el portal RAI y pagarla manualmente.
  ADD COLUMN IF NOT EXISTS "raInvoiceId" TEXT,

  -- Marcado a true una vez que el cron detecta que llega la direccion
  -- (implica que la factura fue pagada, porque RAI solo asigna direccion
  -- despues del pago). No lo seteamos leyendo el estado de la factura
  -- directamente para evitar poll extra de /invoices/:id.
  ADD COLUMN IF NOT EXISTS "raInvoicePaid" BOOLEAN DEFAULT false,

  -- Direccion completa asignada por RAI, tal como viene de
  -- GET /services/:service_id/info. Estructura JSON con line1/line2/city/
  -- state/zip. El cliente recibe este dato en el email post-pago.
  ADD COLUMN IF NOT EXISTS "raAddress" JSONB,

  -- Timestamp del momento en que se completo el par POST /companies +
  -- POST /services (queda con el createdAt del provisioning para audit).
  ADD COLUMN IF NOT EXISTS "raProvisionedAt" TIMESTAMPTZ,

  -- Timestamp del envio del email "Registered Agent Address Ready" al
  -- cliente. Idempotencia del cron: si esto tiene valor, no reenviamos
  -- aunque el cron encuentre la direccion en corridas siguientes.
  ADD COLUMN IF NOT EXISTS "raAddressEmailSentAt" TIMESTAMPTZ;

-- Indice para la query del cron: busca ordenes con service asignado pero sin
-- direccion todavia. Partial index es lo mas eficiente: solo indexa filas
-- pendientes (que son las unicas que el cron necesita).
CREATE INDEX IF NOT EXISTS "idx_order_ra_pending_address"
  ON "Order" ("raServiceId")
  WHERE "raServiceId" IS NOT NULL AND "raAddress" IS NULL;
