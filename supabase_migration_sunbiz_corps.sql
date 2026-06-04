-- ============================================================
-- Migración: tabla sunbiz_corps (Etapa 5)
-- Correr en Supabase SQL Editor antes de cargar datos
-- ============================================================

-- Habilitar extensión trigram para búsqueda fuzzy de nombres
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tabla principal de empresas de Florida
CREATE TABLE IF NOT EXISTS sunbiz_corps (
  id               BIGSERIAL PRIMARY KEY,
  document_number  TEXT        NOT NULL UNIQUE,  -- Número de documento FL (ej. L23000123456)
  entity_name      TEXT        NOT NULL,          -- Nombre exacto registrado
  entity_type      TEXT,                          -- 'LLC' | 'CORP' | 'PA' | 'LTD' | otro
  status           TEXT,                          -- 'ACTIVE' | 'INACTIVE' | 'DISSOLVED' | otro
  filing_date      DATE,                          -- Fecha de formación
  principal_address TEXT,                         -- Dirección principal (calle)
  principal_city   TEXT,
  principal_state  TEXT DEFAULT 'FL',
  principal_zip    TEXT,
  mailing_address  TEXT,                          -- Dirección postal (puede diferir)
  mailing_city     TEXT,
  mailing_state    TEXT,
  mailing_zip      TEXT,
  registered_agent_name    TEXT,                  -- Nombre del agente registrado
  registered_agent_address TEXT,                  -- Dirección del agente registrado
  data_source      TEXT DEFAULT 'dump',           -- 'dump' | 'scraping'
  last_updated     TIMESTAMPTZ DEFAULT NOW(),     -- Última actualización en nuestra DB
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices ──────────────────────────────────────────────────

-- Lookup principal por número de documento (único, el más usado)
CREATE UNIQUE INDEX IF NOT EXISTS sunbiz_corps_document_number_idx
  ON sunbiz_corps (document_number);

-- Búsqueda fuzzy por nombre (para verificación de disponibilidad de nombres)
CREATE INDEX IF NOT EXISTS sunbiz_corps_entity_name_trgm_idx
  ON sunbiz_corps USING GIN (entity_name gin_trgm_ops);

-- Búsqueda exacta por nombre en mayúsculas
CREATE INDEX IF NOT EXISTS sunbiz_corps_entity_name_upper_idx
  ON sunbiz_corps (UPPER(entity_name));

-- Filtrar solo empresas activas
CREATE INDEX IF NOT EXISTS sunbiz_corps_status_idx
  ON sunbiz_corps (status);

-- Índice para el cron de actualización incremental
CREATE INDEX IF NOT EXISTS sunbiz_corps_last_updated_idx
  ON sunbiz_corps (last_updated);

-- ── Función upsert para el scraping/dump diario ───────────────
-- Permite insertar o actualizar sin duplicar registros
CREATE OR REPLACE FUNCTION upsert_sunbiz_corp(
  p_document_number TEXT,
  p_entity_name     TEXT,
  p_entity_type     TEXT,
  p_status          TEXT,
  p_filing_date     DATE,
  p_principal_address TEXT,
  p_principal_city  TEXT,
  p_principal_state TEXT,
  p_principal_zip   TEXT,
  p_registered_agent_name    TEXT,
  p_registered_agent_address TEXT,
  p_data_source     TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO sunbiz_corps (
    document_number, entity_name, entity_type, status, filing_date,
    principal_address, principal_city, principal_state, principal_zip,
    registered_agent_name, registered_agent_address,
    data_source, last_updated
  ) VALUES (
    p_document_number, p_entity_name, p_entity_type, p_status, p_filing_date,
    p_principal_address, p_principal_city, p_principal_state, p_principal_zip,
    p_registered_agent_name, p_registered_agent_address,
    p_data_source, NOW()
  )
  ON CONFLICT (document_number) DO UPDATE SET
    entity_name      = EXCLUDED.entity_name,
    entity_type      = EXCLUDED.entity_type,
    status           = EXCLUDED.status,
    filing_date      = EXCLUDED.filing_date,
    principal_address = EXCLUDED.principal_address,
    principal_city   = EXCLUDED.principal_city,
    principal_state  = EXCLUDED.principal_state,
    principal_zip    = EXCLUDED.principal_zip,
    registered_agent_name    = EXCLUDED.registered_agent_name,
    registered_agent_address = EXCLUDED.registered_agent_address,
    data_source      = EXCLUDED.data_source,
    last_updated     = NOW();
END;
$$ LANGUAGE plpgsql;

-- ── Comentarios de uso ────────────────────────────────────────
-- Para búsqueda por documento:
--   SELECT * FROM sunbiz_corps WHERE document_number = 'L23000123456';
--
-- Para verificar disponibilidad de nombre (búsqueda fuzzy):
--   SELECT entity_name, similarity(entity_name, 'MY BUSINESS LLC') AS score
--   FROM sunbiz_corps
--   WHERE entity_name % 'MY BUSINESS LLC' AND status = 'ACTIVE'
--   ORDER BY score DESC LIMIT 10;
--
-- Para upsert desde el scraping/dump:
--   SELECT upsert_sunbiz_corp('L23000123456', 'MY BUSINESS LLC', 'LLC', 'ACTIVE', ...);
