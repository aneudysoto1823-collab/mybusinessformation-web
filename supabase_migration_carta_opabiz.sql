-- Carta de cumplimiento de OpaBiz (2026-10-05): seguimiento propio de esa
-- campaña, separado del carta_sent_at de la carta de mybusinessformation.com.
-- Idempotente.
ALTER TABLE prospective_companies ADD COLUMN IF NOT EXISTS carta_opabiz_sent_at TIMESTAMPTZ;
