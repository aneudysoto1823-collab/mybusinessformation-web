-- Persiste la marca (OpaBiz vs Florida Business Formation Center) con la que
-- se creo cada orden — antes solo vivia transitoriamente en
-- session.metadata.sourceDomain de Stripe (usado una sola vez, al armar el
-- email de confirmacion de pago en el webhook) y se perdia para siempre.
-- Cualquier email posterior (reenvio manual, "Filed", "Aprobado") no tenia
-- forma de saber la marca de la orden y volvia a mostrar OpaBiz aunque el
-- cliente hubiera comprado en mybusinessformation.com (auditoria 2026-08-17).
--
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "sourceBrand" TEXT;

-- NULL = 'opabiz' (default, ordenes de formacion y las creadas antes de esta
-- migracion) — no hace falta backfill, el codigo ya trata null/undefined como
-- opabiz (ver lib/email-constants.ts isFbfcBrand()).
