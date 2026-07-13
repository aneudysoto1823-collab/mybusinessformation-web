-- Revierte la migración anterior (supabase_migration_opabiz_nivel_empleado.sql):
-- el nivel jerárquico del empleado vive en EMPLEADOS.nivel (tabla ya existente,
-- creada en una sesión previa), no en empleado_perfil. Mantener las dos
-- hubiera generado dos fuentes de verdad para el mismo dato.

ALTER TABLE empleado_perfil DROP COLUMN IF EXISTS nivel;

-- El ENUM nivel_empleado_opabiz se deja como está (ya arreglado, con sus 4
-- valores correctos) por si se necesita más adelante para tipar EMPLEADOS.nivel
-- (hoy es text plano) — no se toca en esta migración.
