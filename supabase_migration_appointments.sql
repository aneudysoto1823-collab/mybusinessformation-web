-- Sistema de citas: appointments + blocked_slots
-- Correr en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS appointments (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  name        text        NOT NULL,
  email       text        NOT NULL,
  phone       text,
  date        date        NOT NULL,
  time        text        NOT NULL, -- '09:00', '09:40', etc.
  note        text,
  status      text        DEFAULT 'pending' -- 'pending' | 'confirmed' | 'cancelled'
);

CREATE TABLE IF NOT EXISTS blocked_slots (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  date        date        NOT NULL, -- fecha específica a bloquear
  time        text,                 -- null = día completo bloqueado
  reason      text
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_appointments_date  ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(email);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(date);
