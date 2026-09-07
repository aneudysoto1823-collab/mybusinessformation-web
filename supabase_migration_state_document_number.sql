-- Número de documento que asigna el Estado de Florida (Sunbiz) al aprobar la
-- formación de una LLC/Corp (ej. "L26000123456") — no existía ningún campo
-- para guardarlo hasta ahora. Se captura desde el panel admin, sección
-- "Enviar documento(s) al cliente", y se incluye en el email de aprobación
-- (sendOrderApprovalUpdate) cuando está presente.
--
-- Pegar y correr tal cual en Supabase → SQL Editor.

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stateDocumentNumber" TEXT;
