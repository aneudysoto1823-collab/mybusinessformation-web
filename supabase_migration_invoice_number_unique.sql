-- Evita facturas duplicadas por condición de carrera (ver
-- backend/lib/invoice-number.ts y auditoría de código 2026-07-12, hallazgo
-- "importantes" #5). Sin esta constraint, dos inserts simultáneos pueden
-- calcular el mismo invoice_number y ambos insertan sin error.
--
-- No crea ninguna tabla nueva — accounting_income ya existe; esto solo le
-- agrega una restricción de unicidad. Pegar y correr tal cual en Supabase →
-- SQL Editor, sin pasos manuales: si ya hubiera números duplicados de antes,
-- el bloque de abajo los renombra automáticamente (agrega un sufijo -DUPn a
-- todos menos el más antiguo) antes de aplicar la restricción.

DO $$
DECLARE
  dup RECORD;
BEGIN
  FOR dup IN
    SELECT invoice_number
    FROM accounting_income
    GROUP BY invoice_number
    HAVING COUNT(*) > 1
  LOOP
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY invoice_date, id) AS rn
      FROM accounting_income
      WHERE invoice_number = dup.invoice_number
    )
    UPDATE accounting_income a
    SET invoice_number = a.invoice_number || '-DUP' || ranked.rn
    FROM ranked
    WHERE a.id = ranked.id AND ranked.rn > 1;
  END LOOP;
END $$;

ALTER TABLE accounting_income
  ADD CONSTRAINT accounting_income_invoice_number_unique UNIQUE (invoice_number);
