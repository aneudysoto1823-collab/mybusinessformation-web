-- Migration: tabla dedicada `client_documents` (Item 5 de la auditoría FTC/UPL,
-- 2026-09-15) — registro permanente y consultable de cada archivo real que el
-- staff sube y entrega a un cliente vía "Enviar documento(s) al cliente"
-- (POST /api/admin/send-approval-update).
--
-- Alcance a propósito (decisión founder): SOLO documentos que se facturan/
-- entregan de verdad al cliente (Articles of Organization aprobados, EIN
-- letter real del IRS, etc.) — NUNCA los documentos auto-generados "por si
-- acaso" (SS-4 pre-llenado, Operating Agreement draft, BOI) que el sistema
-- prepara automáticamente para cualquier orden en /admin/orders/[id] →
-- "Pre-filled Documents". Esos son borradores de trabajo interno, no algo que
-- se le facturó al cliente como entregado.
--
-- Relación con Order.deliveredItems/deliveredFiles (ver
-- supabase_migration_order_delivery_tracking.sql): esos campos JSONB en la
-- misma fila de Order siguen existiendo sin cambios (el checklist admin de
-- "ya entregado" los sigue usando tal cual) — esta tabla nueva es un registro
-- PARALELO, nunca se sobreescribe entre rondas, y permite consultas que un
-- campo JSONB por-orden no puede (ej. "todos los documentos entregados este
-- mes", cruzando cualquier cantidad de órdenes).
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS client_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     TEXT NOT NULL REFERENCES "Order"(id),
  filename     TEXT NOT NULL,
  url          TEXT NOT NULL,
  -- Claves de lib/order-items.ts (getOrderItemKeys) que esta ronda de entrega
  -- cubrió — mismo vocabulario que Order.deliveredItems, así que ambos se
  -- pueden cruzar sin traducir nada. Un archivo puede cubrir varios ítems a
  -- la vez (ej. un solo PDF de Articles que confirma la formación completa).
  item_keys    JSONB NOT NULL DEFAULT '[]'::jsonb,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_documents_order_id_idx ON client_documents (order_id);
