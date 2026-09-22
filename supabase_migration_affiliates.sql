-- Migration: Programa de Afiliados.
--
-- Personas con PTIN se afilian desde /afiliados (ambas marcas), quedan en
-- 'pending' hasta que el admin las aprueba a mano desde /admin/afiliados. Al
-- aprobar se genera un Stripe Promotion Code propio (sobre un único Coupon
-- compartido de 10% off, ver STRIPE_AFFILIATE_COUPON_ID) y el afiliado recibe
-- su código por email. Cuando un cliente usa ese código al pagar, el webhook
-- de Stripe registra una fila en affiliate_commissions con la comisión
-- correspondiente (15% por defecto, editable por afiliado, calculada SOLO
-- sobre tarifas de servicio — nunca sobre state fees) — ver lib/affiliates.ts.
--
-- affiliate_agent_leads es un programa completamente separado (interés en
-- convertirse en "agente" de campo de OpaBiz Connect) — comparte solo la
-- página pública, nada de lógica de cupón/comisión.
--
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

CREATE TABLE IF NOT EXISTS affiliates (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  name                   text NOT NULL,
  email                  text NOT NULL UNIQUE,
  phone                  text,
  ptin                   text,

  status                 text NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),

  -- % que gana el afiliado sobre las tarifas de servicio de cada orden que use
  -- su cupón (sin contar state fees). Default 15, editable por afiliado desde
  -- el admin si rinde bien.
  commission_percent     numeric NOT NULL DEFAULT 15,

  -- Se llenan recién al aprobar (POST /api/admin/affiliates/[id]).
  coupon_code            text UNIQUE,
  stripe_promotion_code_id text,

  -- Marca por la que aplicó (informativo — el cupón funciona en ambos sitios,
  -- comparten el mismo Stripe account/checkout).
  brand                  text NOT NULL DEFAULT 'opabiz' CHECK (brand IN ('opabiz', 'fbfc')),

  notes                  text,
  approved_at            timestamptz,

  -- Arranca el reloj de pago (3 meses desde la primera orden con su cupón).
  first_order_at         timestamptz,

  -- Acumulado sin pagar. Se marca "vencido" en el admin cuando llega a $200 o
  -- pasan 3 meses desde first_order_at, lo que ocurra primero. El pago real
  -- (Zelle/lo que sea) es manual — "Marcar como pagado" solo mueve el saldo.
  total_commission_owed  numeric NOT NULL DEFAULT 0,
  total_commission_paid  numeric NOT NULL DEFAULT 0,
  last_paid_at           timestamptz
);

CREATE INDEX IF NOT EXISTS affiliates_status_idx ON affiliates(status);

-- Un renglón por orden que usó un cupón de afiliado — la "casilla de cupones".
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id           uuid NOT NULL REFERENCES affiliates(id),

  -- "Order".id es un cuid (texto), no un uuid — mismo tipo acá. UNIQUE evita
  -- doble conteo si el webhook de Stripe se reintenta.
  order_id               text NOT NULL UNIQUE,
  order_number           text,

  service_fee_subtotal   numeric NOT NULL,
  discount_percent       numeric NOT NULL,
  -- Snapshot del % del afiliado al momento del cálculo — si el admin cambia
  -- commission_percent después, las filas viejas no deben recalcularse solas.
  commission_percent     numeric NOT NULL,
  commission_amount      numeric NOT NULL,

  created_at             timestamptz NOT NULL DEFAULT now(),
  paid                   boolean NOT NULL DEFAULT false,
  paid_at                timestamptz
);

CREATE INDEX IF NOT EXISTS affiliate_commissions_affiliate_id_idx ON affiliate_commissions(affiliate_id);

-- Interés en "convertirte en agente" (OpaBiz Connect) — sin alta pública hoy,
-- solo queda registrado acá + alerta interna para que el staff lo contacte.
CREATE TABLE IF NOT EXISTS affiliate_agent_leads (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text NOT NULL,
  email                  text NOT NULL,
  phone                  text,
  brand                  text NOT NULL DEFAULT 'opabiz' CHECK (brand IN ('opabiz', 'fbfc')),
  created_at             timestamptz NOT NULL DEFAULT now(),
  contacted              boolean NOT NULL DEFAULT false,
  notes                  text
);

-- Seguimiento 2026-09-22: guarda el idioma en que el afiliado llenó la
-- solicitud, para que los emails de aprobación/rechazo (mandados días
-- después, a veces) respeten ese idioma en vez de ir siempre bilingüe.
-- Si ya corriste el bloque de arriba, correr SOLO esta línea.
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS lang text NOT NULL DEFAULT 'en';

-- Seguimiento 2026-09-22 (2): unifica la aplicación de afiliado y de agente
-- de campo en un solo formulario/endpoint (dos botones en /afiliados) — el
-- tipo decide si al aprobar se genera un cupón de Stripe (solo 'affiliate')
-- o no (los 'agent' ganan comisión por orden asistida vía OpaBiz Connect,
-- sin cupón de descuento). Reemplaza la tabla affiliate_agent_leads, que
-- queda sin uso (no se borra automáticamente — se puede hacer
-- "DROP TABLE affiliate_agent_leads;" a mano si se quiere limpiar).
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS application_type text NOT NULL DEFAULT 'affiliate' CHECK (application_type IN ('affiliate', 'agent'));

-- Seguimiento 2026-09-22 (3): campos extra para depurar solicitudes de
-- agente (dirección + situación laboral + experiencia) — solo se piden/
-- validan en el modo 'agent' del formulario, quedan NULL para afiliados.
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS address_street text;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS address_city text;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS address_state text;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS address_zip text;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS employment_status text CHECK (employment_status IN ('independent', 'employed'));
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS employer_name text;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS experience_notes text;
