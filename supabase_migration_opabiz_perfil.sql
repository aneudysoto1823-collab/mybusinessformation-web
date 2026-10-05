-- Perfil editable del empleado de OpaBiz Connect (2026-10-05).
-- Idempotente: se puede correr más de una vez sin duplicar nada.

-- Datos propios del perfil. Viven en empleado_perfil (1 fila por empleado,
-- se crea junto con la cuenta en createEmployeeAccount). Nombre, email y
-- teléfono siguen en `usuarios`, que es la identidad de login.
ALTER TABLE empleado_perfil ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE empleado_perfil ADD COLUMN IF NOT EXISTS direccion_calle TEXT;
ALTER TABLE empleado_perfil ADD COLUMN IF NOT EXISTS direccion_ciudad TEXT;
ALTER TABLE empleado_perfil ADD COLUMN IF NOT EXISTS direccion_estado TEXT;
ALTER TABLE empleado_perfil ADD COLUMN IF NOT EXISTS direccion_zip TEXT;
ALTER TABLE empleado_perfil ADD COLUMN IF NOT EXISTS idiomas TEXT[];

-- Empleados creados antes de que existiera la fila de perfil.
INSERT INTO empleado_perfil (empleado_id)
SELECT e.id FROM "EMPLEADOS" e
WHERE NOT EXISTS (SELECT 1 FROM empleado_perfil p WHERE p.empleado_id = e.id);

-- Bucket público para las fotos de perfil (path con timestamp, mismo criterio
-- que opabiz-documentos).
INSERT INTO storage.buckets (id, name, public)
VALUES ('opabiz-avatars', 'opabiz-avatars', true)
ON CONFLICT (id) DO NOTHING;
