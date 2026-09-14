-- Pedido founder 2026-09-14: los emails que Enformion encuentra con baja
-- confianza (% Precisión) ya NO se descartan al buscarlos en Marketing
-- Saliente — se guardan igual, junto con su score, para que el founder
-- pueda decidir DESPUÉS en Campaigns & Letters (con un filtro propio e
-- independiente del que se usó al buscar) a quién de verdad mandarle email
-- y a quién imprimirle la carta en su lugar, aunque tenga un email guardado.
--
-- Correr en Supabase → SQL Editor.

ALTER TABLE prospective_companies ADD COLUMN IF NOT EXISTS identity_score INTEGER;
