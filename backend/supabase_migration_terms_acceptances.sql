-- Registro de aceptación de Términos (2026-10-09). Ver lib/terms-acceptance.ts.
-- Lista de aceptaciones por orden: [{ at, context, text, ip, userAgent, service? }]
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "termsAcceptances" JSONB;
