-- =============================================================
-- Sistema de citas propio — MyBusinessFormation
-- Correr en Supabase SQL Editor
-- Creado: 2026-06-05
-- =============================================================
--
-- LÓGICA DE NEGOCIO:
--   Horario:   Lunes a Sábado, 9:00am – 7:00pm
--   Duración:  30 min por cita + 10 min buffer = bloques de 40 min
--   Capacidad: 15 citas máximo por día
--   Slots:     09:00 09:40 10:20 11:00 11:40 12:20 13:00
--              13:40 14:20 15:00 15:40 16:20 17:00 17:40 18:20
--
-- FLUJO:
--   Cliente agenda en /booking
--   → API crea appointment + envía email con links Reschedule/Cancel
--   → Admin gestiona desde /admin/citas
--   → Cliente puede reprogramar o cancelar desde links en el email
--
-- EMAILS (vía Resend):
--   - Confirmación al cliente: fecha, hora, método reunión, botones acción
--   - Notificación al admin:   datos completos + link WhatsApp al cliente
--   - Al reprogramar:          nueva fecha al cliente + aviso al admin
--   - Al cancelar:             confirmación al cliente + botón nueva cita
--
-- NOTA RESEND: En plan gratuito solo entrega al email registrado en la cuenta.
--   Al migrar a dominio propio (@mybusinessformation.com), funciona para todos.
--
-- ENV VAR REQUERIDA: NEXT_PUBLIC_URL=https://mybusinessformation.com
--   (usada para construir links de reprogramar/cancelar en los emails)
-- =============================================================

-- PASO 1: Crear tablas (primera vez)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS appointments (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now(),
  name            text        NOT NULL,
  email           text        NOT NULL,
  phone           text,                        -- obligatorio desde el formulario
  date            date        NOT NULL,
  time            text        NOT NULL,        -- '09:00', '09:40', etc.
  meeting_method  text        DEFAULT 'zoom',  -- 'zoom' | 'whatsapp'
  note            text,
  status          text        DEFAULT 'pending' -- 'pending' | 'confirmed' | 'cancelled'
);

CREATE TABLE IF NOT EXISTS blocked_slots (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  date        date        NOT NULL,  -- fecha específica a bloquear
  time        text,                  -- null = día completo bloqueado
  reason      text
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_appointments_date  ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(email);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(date);


-- PASO 2: Columnas agregadas después de la creación inicial
-- (correr solo si la tabla ya existe sin estas columnas)
-- -------------------------------------------------------------

-- meeting_method — agregado 2026-06-05
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_method text DEFAULT 'zoom';


-- =============================================================
-- PENDIENTES FUTUROS (no correr todavía):
-- =============================================================
--
-- Recordatorios automáticos 24h antes:
--   Requiere cron job externo (Vercel Cron o similar) que consulte
--   appointments WHERE date = tomorrow AND status != 'cancelled'
--   y envíe email recordatorio vía /api/booking/remind
--
-- Soporte recurrencia (citas semanales fijas):
--   ALTER TABLE appointments ADD COLUMN is_recurring boolean DEFAULT false;
--   ALTER TABLE appointments ADD COLUMN recurrence_day int; -- 1=lun ... 6=sáb
-- =============================================================
