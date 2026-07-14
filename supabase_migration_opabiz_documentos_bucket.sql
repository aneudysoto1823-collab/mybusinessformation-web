-- Bucket público para los documentos que sube el empleado de OPABIZ desde la
-- PWA (POST /api/opabiz/me/orders/[id]/documents). Mismo criterio que
-- `certificates`/`expense-receipts` en el resto del proyecto: público, path
-- con timestamp (no adivinable), sin URLs firmadas.

INSERT INTO storage.buckets (id, name, public)
VALUES ('opabiz-documentos', 'opabiz-documentos', true)
ON CONFLICT (id) DO NOTHING;
