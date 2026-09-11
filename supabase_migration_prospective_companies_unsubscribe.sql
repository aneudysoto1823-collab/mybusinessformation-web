-- El boton "Unsubscribe" (/api/unsubscribe) solo actualizaba la tabla "Order"
-- — los leads de campana (carta de cumplimiento B1) viven en
-- prospective_companies, una tabla que el endpoint nunca tocaba. Resultado:
-- alguien que se daba de baja seguia recibiendo la campana igual, aunque el
-- endpoint le respondiera {success:true}. Auditoria de emails 2026-09-11.
--
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

ALTER TABLE prospective_companies
  ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT FALSE;

-- NULL/FALSE = sigue recibiendo campanas (default, sin cambio de comportamiento
-- para leads existentes) — no hace falta backfill.
