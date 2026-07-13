-- Agrega la foreign key que faltaba: EMPLEADOS.usuario_id -> usuarios.id.
-- Sin esto, el join automático de Supabase (usuarios.select('...EMPLEADOS(...)'))
-- no puede detectar la relación y falla en tiempo real. Todas las demás FKs de
-- OPABIZ (puntajes.empleado_id, inactividades.empleado_id,
-- ordenes_opabiz.empleado_id, empleado_perfil.empleado_id -> EMPLEADOS.id) ya
-- existían — esta era la única que faltaba, del lado de EMPLEADOS hacia usuarios.

ALTER TABLE "EMPLEADOS"
  ADD CONSTRAINT empleados_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
