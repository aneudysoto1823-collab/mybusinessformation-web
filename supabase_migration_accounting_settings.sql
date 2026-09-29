-- Tabla genérica key/value para configuración de Contabilidad que no encaja
-- en ninguna tabla existente. Primer uso: "efectivo disponible" (cash on
-- hand) para el cálculo de Runway — no hay integración bancaria, así que es
-- un número que el founder actualiza a mano cada vez que quiere revisarlo.
CREATE TABLE IF NOT EXISTS accounting_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
