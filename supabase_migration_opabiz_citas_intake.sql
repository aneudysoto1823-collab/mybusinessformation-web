-- Feature A (citas manuales) + Feature B (intake asistida) de OpaBiz Connect.

-- Contexto de la tarea: ordenes_opabiz hoy solo tiene tipo_servicio (texto
-- libre), muy poco para que un empleado sepa qué hacer. `notas` es un campo
-- libre para el detalle real (nota de la cita, nombre de la empresa, etc).
ALTER TABLE ordenes_opabiz ADD COLUMN IF NOT EXISTS notas TEXT;

-- Liga la orden a la cita de origen (Feature A) — permite "ver cita
-- relacionada" y evitar crear dos órdenes para la misma cita.
ALTER TABLE ordenes_opabiz ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id);

-- Qué agente armó la solicitud (Feature B, intake asistida) — trazabilidad y
-- base para una futura métrica de ventas por agente.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "assistedByEmpleadosId" UUID REFERENCES "EMPLEADOS"(id);
