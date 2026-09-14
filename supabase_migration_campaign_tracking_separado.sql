-- Auditoría de email marketing 2026-09-13/14 — hallazgo: Carta Nuevas
-- Empresas (antes "B1") y Oferta VIP compartían el mismo campo genérico
-- `status` para saber si ya se le mandó algo a una empresa, así que no había
-- forma de saber con certeza a quién le faltaba cuál de las dos.
--
-- `status` NO se toca (sigue siendo el "contact status" general que ya usa
-- el filtro New/Email sent/Letter sent del panel) — estas 2 columnas nuevas
-- son el tracking específico por campaña, mismo patrón que ya existe
-- `letter_sent_at` (ver supabase_migration_prospective_companies_letter_sent.sql).
--
-- Correr en Supabase → SQL Editor.

ALTER TABLE prospective_companies ADD COLUMN IF NOT EXISTS carta_sent_at TIMESTAMPTZ;
ALTER TABLE prospective_companies ADD COLUMN IF NOT EXISTS vip_reminder_sent_at TIMESTAMPTZ;
