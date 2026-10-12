-- País y ciudad desde donde se llenó la orden (según la IP, headers de Vercel).
-- Se escriben solo al crear la orden. Órdenes anteriores quedan en null.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ipCountry" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ipCity" TEXT;
