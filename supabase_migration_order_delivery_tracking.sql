-- Migration: campos para (1) auto-envío de "Orden Procesada" en órdenes Priority/Expedited
-- y (2) el flujo unificado de aprobación + entrega de documentos (reemplaza A6+A7 separados).
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

ALTER TABLE "Order"
  -- Momento exacto en que se confirmó el pago (no reusar updatedAt: se pisa con
  -- cualquier otra edición de la orden y corrompería el cálculo de "24h después").
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ,

  -- Cuándo se envió el email "Orden Procesada" (A5), sea automático (cron, Priority)
  -- o manual (botón Filed del admin). Evita duplicar el envío entre ambos caminos.
  ADD COLUMN IF NOT EXISTS "orderProcessedEmailSentAt" TIMESTAMPTZ,

  -- Qué ítems de la orden (paquete + addons + servicios à la carte) ya se le
  -- entregaron/aprobaron al cliente, acumulado a través de múltiples envíos del
  -- email de aprobación/entrega. Ej: {"formation": true, "ein": true, "oa": false}.
  ADD COLUMN IF NOT EXISTS "deliveredItems" JSONB DEFAULT '{}'::jsonb,

  -- Archivos entregados al cliente a través del email de aprobación/entrega
  -- (puede ser más de uno por envío, y se acumulan a través de múltiples rondas).
  -- Array de {url, filename, uploadedAt}.
  ADD COLUMN IF NOT EXISTS "deliveredFiles" JSONB DEFAULT '[]'::jsonb;
