-- Columna para la contraseña del empleado (login de OPABIZ, Etapa 4 —
-- todavía no construida). Nullable: un empleado recién creado por el admin
-- no tiene contraseña hasta que complete el flujo de invitación.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash TEXT;
