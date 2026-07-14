# Proceso 17 — OPABIZ: Sistema de Gestión Interna de Órdenes

## ¿Qué es OPABIZ?

OPABIZ es la aplicación interna de Florida Business Formation Center para gestionar y asignar órdenes a empleados de campo. Es un sistema **separado** del sitio público (`opabiz.com`, lo que ven los clientes) — comparte el mismo proyecto de Supabase, pero es un panel/app propia para el equipo interno.

**Historia:** arrancó en una sesión previa (con otra IA, no documentada en su momento) que dejó creadas las tablas de la base. Se retomó el 2026-07-13 y se construyó el motor de asignación + arranque del panel admin. Ver memoria `project_opabiz_sistema_interno` para el detalle completo de esa sesión.

---

## ⚠️ Los dos ids de "empleado" — no confundir

Esto no es opcional, es la causa de un bug real que hubo que corregir el 2026-07-13:

- **`usuarios.id`** → identidad de login (email, `password_hash`, `rol`: admin/empleado/cliente). Es lo que usa `historial_actividad.usuario_id`.
- **`EMPLEADOS.id`** (tabla en **mayúsculas**, así se llama literal) → registro operativo del empleado. Es lo que usan `empleado_perfil.empleado_id`, `ordenes_opabiz.empleado_id`, `puntajes.empleado_id`, `inactividades.empleado_id`.

`EMPLEADOS.usuario_id` conecta ambas (FK agregada el 2026-07-13, no existía antes — sin ella el join automático de Supabase no funcionaba).

Antes de tocar cualquier tabla de OPABIZ, verificar con una query a `information_schema.table_constraints` cuál id corresponde — no asumir.

---

## Tabla `EMPLEADOS` — estado en vivo del empleado

Columnas: `id`, `usuario_id`, `nivel` (`basico`/`intermedio`/`avanzado`/`administrador` — el ENUM `nivel_empleado_opabiz` estaba roto con un solo valor concatenado sin comas hasta que se corrigió el 2026-07-13), `puntaje_actual`, `tiempo_respuesta_promedio`, `inactividades_totales`, `estado_disponibilidad` (`disponible`/`ocupado`/`no_disponible`), `fecha_ultimo_cambio`.

Se mantiene sincronizada por `registrarPuntaje()`/`registrarInactividad()` en `backend/lib/opabiz-empleados.ts` — **nadie más en el código debe insertar directo en `puntajes`/`inactividades`**, o esta tabla queda desactualizada. Esas dos tablas son bitácoras append-only (un evento por fila, no contadores acumulados).

---

## Motor de asignación (`backend/lib/opabiz-assignment.ts`)

`pickBestEmployee()` — mismo patrón que ACD de call centers / matching de Uber:

1. **Elegibilidad:** `estado_disponibilidad='disponible'` + nivel jerárquico suficiente para el `tipo_servicio` de la orden (regla de negocio real pendiente de definir — hoy `NIVEL_MINIMO_POR_SERVICIO` está vacío, no restringe nada).
2. **Orden entre elegibles:** mayor `puntaje_actual` → menos `inactividades_totales` → menor `tiempo_respuesta_promedio` → más tiempo sin cambios (`fecha_ultimo_cambio`, para no darle siempre todo al mismo).
3. **Órdenes urgentes** (`es_urgente=true`): se filtran primero al nivel jerárquico más alto disponible, y de ahí se aplica el mismo orden.

**Asignación manual y automática coexisten:** el admin siempre puede pisar la elección del motor asignando a mano desde el panel — llenan el mismo campo `ordenes_opabiz.empleado_id`.

**Timeout y reasignación:** cron cada 5 min (`backend/app/api/opabiz/cron/reassign-timeouts/route.ts`, protegido con `CRON_SECRET` igual que el resto de los crons del proyecto). Si un empleado no pasa la orden de `asignada` a `en_progreso` en 10 minutos, se registra una inactividad (penalización) y se reasigna al siguiente mejor candidato, excluyendo al anterior.

---

## Decisión de arquitectura: sin DB triggers, sin Edge Functions

El plan original de esta misma sesión previa proponía un **trigger de PostgreSQL** (Order pagada → crea fila en `ordenes_opabiz` automáticamente) y **Supabase Edge Functions** para el motor de asignación. Ambas ideas se descartaron el 2026-07-13:

- Se verificó que **ningún trigger de Postgres existe en toda la base** — el patrón real y consistente de todo el proyecto es lógica en código TypeScript (`backend/lib/`), nunca en la base de datos (numeración de facturas, emails automáticos, renovaciones — todo vive en código de aplicación).
- Por la misma razón, el motor de asignación es una ruta de Next.js (`backend/app/api/opabiz/...`), no una Edge Function — mismo stack que el resto del proyecto, sin agregar una plataforma de despliegue nueva.

**Todavía no existe** la integración real "cliente paga en opabiz.com → se crea la orden en OPABIZ automáticamente" — eso queda pendiente para cuando se decida enganchar el webhook de Stripe (`handleFormationPaid` en `backend/app/api/webhooks/stripe/route.ts`) con la creación de `ordenes_opabiz`. Mientras tanto, las órdenes de OPABIZ se crean manualmente (por SQL/admin) para pruebas.

---

## Login del empleado — Etapa 4, pendiente

Decisión: JWT propio (mismo patrón que `admin_session`/`client_session`), **no Supabase Auth** — el resto del sitio nunca usa `auth.uid()`, toda la autorización vive en código de ruta con la key `service_role`. RLS está activado en las 8 tablas de OPABIZ (heredado, sin políticas) — es consistente con el resto de tablas del proyecto (`Order`, `accounting_income`, etc. también tienen RLS on + 0 políticas), así que no hace falta agregar políticas mientras la auth siga siendo JWT propio + `service_role`.

**Flujo de alta:** el admin crea la cuenta del empleado desde `/admin/opabiz` (nombre/email/teléfono/nivel) — no hay autoservicio. El empleado define su propia contraseña después. Ya existe la columna `usuarios.password_hash` (nullable), pero **falta construir**: el email de invitación con link de token de un solo uso (mismo patrón que la recuperación de contraseña del admin), el endpoint que lo consume, el endpoint de login (`POST /api/opabiz/auth/login`), y la PWA en sí (dashboard de órdenes asignadas, aceptar/completar, subir documentos).

---

## Referencias

- Memoria de la sesión 2026-07-13: `project_opabiz_sistema_interno`
- Sistema de emails MBF: `LOGICA_DE_NEGOCIO/02_emails_automaticos.md`
- Panel admin de OPABIZ: `backend/app/admin/opabiz/page.tsx`
