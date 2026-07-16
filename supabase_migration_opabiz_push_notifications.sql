-- Notificaciones push + recordatorio de cita para OpaBiz Connect.

-- Suscripción push de cada dispositivo del empleado (Web Push API estándar,
-- vía la lib `web-push`). Un empleado puede tener varios dispositivos
-- (celular + PWA instalada + navegador de escritorio), por eso es 1-a-muchos
-- contra EMPLEADOS y no una columna suelta. `endpoint` es único porque
-- browser/dispositivo genera un endpoint distinto por instalación — un mismo
-- endpoint jamás pertenece a dos empleados a la vez.
CREATE TABLE IF NOT EXISTS opabiz_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id UUID NOT NULL REFERENCES "EMPLEADOS"(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opabiz_push_subscriptions_empleado_id
  ON opabiz_push_subscriptions(empleado_id);

-- Flag anti-duplicado para el cron de recordatorio 1h antes de la cita — sin
-- esto, correr el cron cada 15 min mandaría el mismo recordatorio 3-4 veces
-- mientras la orden siga dentro de la ventana de +1h.
ALTER TABLE ordenes_opabiz ADD COLUMN IF NOT EXISTS recordatorio_enviado BOOLEAN DEFAULT false;
