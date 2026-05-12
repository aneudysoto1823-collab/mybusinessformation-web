# Troubleshooting 14 — OPABIZ

## Base de Datos

### ENUM ya existe al recrear
```sql
-- Error: type "nombre_enum" already exists
DROP TYPE IF EXISTS nombre_enum CASCADE;
CREATE TYPE nombre_enum AS ENUM (...);
```
⚠️ `CASCADE` elimina todas las columnas que usen ese tipo. Verificar dependencias antes.

### FK violation al insertar en ordenes_opabiz
```
insert or update on table "ordenes_opabiz" violates foreign key constraint
```
Causa: el `usuario_id` o `empleado_id` no existe en sus tablas padre.
Solución: crear primero el usuario en `usuarios`, luego el perfil en `empleado_perfil`, luego la orden.

### RLS bloquea consultas del empleado
```
new row violates row-level security policy
```
Causa: la policy no mapea correctamente `auth.uid()` al `usuario_id`.
Solución: verificar que el usuario esté autenticado con Supabase Auth y que el `id` de `usuarios` coincida con `auth.uid()`.

---

## Motor de Asignación

### No hay empleados disponibles
Si el motor no encuentra empleados elegibles, verificar:
1. Que existan empleados con `estado = 'activo'` en `usuarios`
2. Que tengan `empleado_perfil` asociado
3. Que el nivel requerido por la orden coincida con al menos un empleado

### Orden queda en `pendiente` indefinidamente
Causa probable: cron job de reasignación no está activo o falló.
Solución: revisar los logs de Edge Functions en Supabase Dashboard → Edge Functions.

---

## Notificaciones

### Push no llega al empleado
1. Verificar que el empleado tenga el token de push registrado
2. Confirmar que la Edge Function de notificaciones se ejecutó (logs en Supabase)
3. En PWA: verificar que el service worker tenga permisos de notificación

### WhatsApp no responde
Verificar que el número esté registrado correctamente y que el proveedor no tenga rate limiting activo.

---

## App del Empleado (PWA)

### No puede ver sus órdenes
1. Verificar que esté autenticado (cookie/token activo)
2. Verificar RLS: la policy debe permitir `SELECT` donde `empleado_id = auth.uid()`
3. Verificar que `empleado_perfil.usuario_id` coincida con el usuario autenticado

### No puede subir documentos
1. Verificar políticas del bucket en Supabase Storage
2. Verificar que el `orden_id` sea válido y esté asignado a ese empleado
3. Verificar que el archivo no exceda el límite de tamaño (default 50MB en Supabase)

---

## Integración con mybusinessformation-web

### Orden de MBF no llega a OPABIZ
1. Verificar que el DB trigger esté activo en Supabase Dashboard → Database → Triggers
2. Confirmar que el formato de la Order en MBF tenga los campos requeridos por `ordenes_opabiz`

### Status de OPABIZ no se refleja en el portal del cliente
1. Verificar que la Edge Function de sync esté ejecutándose al cambiar estado
2. Confirmar que el `orden_id` de OPABIZ esté mapeado correctamente al `Order.id` de MBF
