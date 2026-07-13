-- El ENUM nivel_empleado_opabiz ya existía en la base, pero mal creado: tiene
-- UN SOLO valor literal "basico intermedio avanzado administrador" (con
-- espacios) en vez de 4 valores separados — probablemente un CREATE TYPE sin
-- comas entre los valores. Como no lo usa ninguna columna todavía (verificado
-- 2026-07-13), es seguro borrarlo y recrearlo bien.
--
-- Con el ENUM arreglado, se conecta a empleado_perfil para que el motor de
-- asignación de OPABIZ sepa qué nivel jerárquico tiene cada empleado.

DROP TYPE IF EXISTS nivel_empleado_opabiz;

CREATE TYPE nivel_empleado_opabiz AS ENUM ('basico', 'intermedio', 'avanzado', 'administrador');

ALTER TABLE empleado_perfil
  ADD COLUMN IF NOT EXISTS nivel nivel_empleado_opabiz NOT NULL DEFAULT 'basico';
