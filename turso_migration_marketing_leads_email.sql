-- Bloque 3.5 (doc 31) — columnas nuevas en marketing_leads (Turso, Base B)
-- para el enriquecimiento de email/telefono via Enformion (EnformionGO).
--
-- NOTA (2026-09-12): la tabla YA tenia email, email_validated, phone y
-- email_validation_source desde su diseño original (planeadas para
-- Enformion/ZeroBounce, nunca conectadas). Esta migracion solo agrega lo
-- que genuinamente faltaba.
--
-- Correr contra la base opabiz-marketing (Turso), no opabiz-sunbiz-search.

ALTER TABLE marketing_leads ADD COLUMN email_is_business INTEGER;
ALTER TABLE marketing_leads ADD COLUMN identity_score INTEGER;
ALTER TABLE marketing_leads ADD COLUMN email_enriched_at TEXT;
ALTER TABLE marketing_leads ADD COLUMN enrichment_email_cost_usd REAL;
