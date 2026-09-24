-- Auditoría de marketing 2026-09-13/14, punto 2 (nunca implementado): los
-- emails que Enformion encuentra no se validaban con ZeroBounce antes de
-- mandarles campaña — solo se sabía si Enformion "cree" que el email es
-- real (su propio isValidated), no si el buzón de verdad existe/acepta mail.
--
-- Guarda el resultado real de ZeroBounce (MX + SMTP probe), sincronizado
-- desde marketing_leads.email_validated cuando la fuente es 'zerobounce'
-- (ver backend/lib/zerobounce.ts + backend/lib/enformion.ts). Mismo patrón
-- que identity_score: un dato más para que Campaigns & Letters decida a
-- quién de verdad mandarle email vs a quién imprimirle la carta.
--
-- Correr en Supabase → SQL Editor.

ALTER TABLE prospective_companies ADD COLUMN IF NOT EXISTS email_deliverable BOOLEAN;
