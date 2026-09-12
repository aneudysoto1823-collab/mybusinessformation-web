-- Campaigns & Letters — separar empresas ya enviadas de las nuevas (2026-09-12).
-- Antes no había forma de distinguir "ya le mandé la carta a esta empresa" de
-- una recién importada — se mezclaban todas en la misma lista para siempre.
--
-- Correr en Supabase → SQL Editor.

ALTER TABLE prospective_companies ADD COLUMN IF NOT EXISTS letter_sent_at TIMESTAMPTZ;
