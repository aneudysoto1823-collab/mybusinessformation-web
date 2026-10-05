-- Carta de cumplimiento de OpaBiz (2026-10-05): seguimiento propio de esa
-- campaña, separado del carta_sent_at de la carta de mybusinessformation.com.
-- Idempotente.
ALTER TABLE prospective_companies ADD COLUMN IF NOT EXISTS carta_opabiz_sent_at TIMESTAMPTZ;

-- Carta física de OpaBiz marcada como enviada (panel Campaigns & Letters
-- OpaBiz), separada de letter_sent_at, que es la de MyBiz.
ALTER TABLE prospective_companies ADD COLUMN IF NOT EXISTS letter_opabiz_sent_at TIMESTAMPTZ;
