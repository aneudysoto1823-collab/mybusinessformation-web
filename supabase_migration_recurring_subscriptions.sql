-- Registered Agent, Virtual Address y Annual Report pasan de pago único a
-- suscripciones reales de Stripe (cada servicio = su propia Subscription
-- independiente — ver backend/lib/stripe-subscriptions.ts y
-- backend/lib/order-subscriptions.ts). Los Términos (§4.4) ya prometían
-- renovación automática y cancelación self-service; esto construye lo que
-- ya se prometía.
--
-- Pegar y correr tal cual en Supabase → SQL Editor. No hay backfill: no
-- existen clientes reales todavía (confirmado con el founder, todo lo
-- vendido hasta hoy son órdenes de prueba) — ambas columnas quedan NULL en
-- las filas existentes y se llenan solo para órdenes nuevas.

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subscriptions" JSONB;
