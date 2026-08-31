-- Las Guías PDF (I y II) ahora tienen dos variantes por marca — los CTAs/links
-- internos del PDF apuntan a opabiz.com o a mybusinessformation.com según quién
-- manda el email (ver GUIAS_PDF/generate-pdf.py --brand y backend/lib/guides.ts).
-- guide_sends necesita saber qué variante se mandó para no dejar sin la Guía
-- FBFC-branded a alguien que ya recibió la variante OpaBiz por otro canal
-- (o viceversa) — son PDFs distintos, no el mismo envío duplicado.
--
-- Pegar y correr tal cual en Supabase → SQL Editor. Las filas existentes
-- (todas mandadas antes de esta distinción) quedan como 'opabiz' — es exacto,
-- todo lo enviado hasta ahora (campaña B1, /guia-gratis, confirmación de pago)
-- era 100% branding OpaBiz.

ALTER TABLE guide_sends
  ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT 'opabiz'
    CHECK (brand IN ('opabiz', 'fbfc'));

ALTER TABLE guide_sends
  DROP CONSTRAINT IF EXISTS guide_sends_email_guide_key;

ALTER TABLE guide_sends
  ADD CONSTRAINT guide_sends_email_guide_brand_key UNIQUE (email, guide, brand);
