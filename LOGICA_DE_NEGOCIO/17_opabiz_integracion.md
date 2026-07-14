# Proceso 17 — OpaBiz Connect: Sistema de Gestión Interna de Órdenes

## ¿Qué es OpaBiz Connect?

OpaBiz Connect es la aplicación interna de Florida Business Formation Center para gestionar y asignar órdenes a empleados de campo. Es un sistema **separado** del sitio público (`opabiz.com`, lo que ven los clientes) — comparte el mismo proyecto de Supabase, pero es un panel/app propia para el equipo interno.

**Historia:** arrancó en una sesión previa (con otra IA, no documentada en su momento) que dejó creadas las tablas de la base. Se retomó el 2026-07-13 y se construyó el motor de asignación + arranque del panel admin. Ver memoria `project_opabiz_sistema_interno` para el detalle completo de esa sesión.

**Sobre el nombre (2026-07-14):** el nombre visible para el equipo es **"OpaBiz Connect"** (login, PWA, emails de invitación, panel admin). Por dentro, rutas (`/opabiz/*`, `/api/opabiz/*`), archivos (`lib/opabiz-*.ts`) y tablas de Supabase (`ordenes_opabiz`, `EMPLEADOS`, etc.) siguen usando `opabiz` sin cambios — fue una decisión deliberada de bajo riesgo (renombrar solo lo visible, no tocar rutas/tablas). Este documento sigue usando "OPABIZ"/`opabiz` para lo técnico y "OpaBiz Connect" para lo que ve el usuario.

---

## ⚠️ Los dos ids de "empleado" — no confundir

Esto no es opcional, es la causa de un bug real que hubo que corregir el 2026-07-13:

- **`usuarios.id`** → identidad de login (email, `password_hash`, `rol`: admin/empleado/cliente). Es lo que usa `historial_actividad.usuario_id`.
- **`EMPLEADOS.id`** (tabla en **mayúsculas**, así se llama literal) → registro operativo del empleado. Es lo que usan `empleado_perfil.empleado_id`, `ordenes_opabiz.empleado_id`, `puntajes.empleado_id`, `inactividades.empleado_id`.

`EMPLEADOS.usuario_id` conecta ambas (FK agregada el 2026-07-13, no existía antes — sin ella el join automático de Supabase no funcionaba).

Antes de tocar cualquier tabla de OpaBiz Connect, verificar con una query a `information_schema.table_constraints` cuál id corresponde — no asumir.

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

**Todavía no existe** la integración real "cliente paga en opabiz.com → se crea la orden en OpaBiz Connect automáticamente" — eso queda pendiente para cuando se decida enganchar el webhook de Stripe (`handleFormationPaid` en `backend/app/api/webhooks/stripe/route.ts`) con la creación de `ordenes_opabiz`. Mientras tanto, las órdenes de OpaBiz Connect se crean manualmente (por SQL/admin) para pruebas.

---

## Login del empleado + PWA — Etapa 4, CONSTRUIDA 2026-07-14

Decisión: JWT propio (mismo patrón que `admin_session`/`client_session`), **no Supabase Auth** — el resto del sitio nunca usa `auth.uid()`, toda la autorización vive en código de ruta con la key `service_role`. RLS está activado en las 8 tablas de OpaBiz Connect (heredado, sin políticas) — es consistente con el resto de tablas del proyecto (`Order`, `accounting_income`, etc. también tienen RLS on + 0 políticas), así que no hace falta agregar políticas mientras la auth siga siendo JWT propio + `service_role`.

**Schema real confirmado ese día** (antes solo existía el plan viejo de `CONTEXTO.md`, marcado explícitamente como no confiable): `ordenes_opabiz` tiene `cliente_id` (→ `usuarios.id`, no al `Order` del sitio público — OpaBiz Connect tiene su propio concepto de cliente) `NOT NULL` y `empleado_id` (→ `EMPLEADOS.id`) también `NOT NULL`. Tablas `documentos` (`order_id, tipo_documento, url_archivo`) y `niveles` (tiers de desempeño) sí existen, sin la tabla `clientes` que sugería el plan viejo.

**Sesión (JWT):** `backend/lib/opabiz-session.ts` — `createEmployeeToken`/`verifyEmployeeToken`/`getEmployeeSession` (payload `{usuarioId, empleadosId}`, cookie `opabiz_session`, 8h, mismo `SESSION_SECRET`). `backend/proxy.ts` protege `/opabiz/dashboard/:path*`.

**Invitación:** `POST /api/opabiz/employees` (alta del admin) ahora dispara automáticamente un email de invitación — token en Redis (`lib/opabiz-invite.ts`, `opabiz-invite:{token}`, TTL 72h) con link a `/opabiz/invite/[token]`, donde el empleado crea su contraseña (`GET/POST /api/opabiz/auth/accept-invite`) y queda logueado directo. El panel `/admin/opabiz` muestra columna "Acceso" con botón **"📧 Reenviar invitación"** para empleados sin `password_hash` (`POST /api/opabiz/employees/[usuarioId]/resend-invite`). Branding deliberadamente **"OpaBiz Connect"**, no "OpaBiz" (marca que ve el cliente) — ver `lib/email-constants.ts` → `FROM_OPABIZ_INTERNAL` (nombre de la constante en código sigue siendo `OPABIZ`, solo cambió su valor de display).

**Login:** `POST /api/opabiz/auth/login` (email+password, rate limit 5/15min como el admin), `POST /api/opabiz/auth/logout`, `GET /api/opabiz/auth/me` (bootstrap de la PWA).

**PWA MVP:** `/opabiz/login`, `/opabiz/dashboard` (lista de órdenes del empleado + toggle "Disponible/No disponible" — **sin este toggle nadie podía llegar nunca a `estado_disponibilidad='disponible'`, así que el motor de asignación era imposible de probar de punta a punta**), `/opabiz/dashboard/[id]` (detalle + Aceptar/Completar/subir documentos). Manifest estático en `public/opabiz-manifest.webmanifest` (Next 16 solo soporta la convención `app/manifest.ts` en la raíz de `app/`, no anidada — se intentó y no generó ruta) + iconos placeholder navy "OC" (`public/opabiz-icon-192.png`/`512.png`, generados con sharp). Sin service worker de caché offline — solo "Add to Home Screen".

**Rutas empleado-scoped** (`backend/app/api/opabiz/me/*`, todas verifican que `ordenes_opabiz.empleado_id` sea el de la sesión): `GET orders`, `GET orders/[id]`, `POST orders/[id]/accept` (asignada→en_progreso), `POST orders/[id]/complete` (en_progreso→completada + `registrarPuntaje(+10)`), `POST orders/[id]/documents` (multipart, bucket público `opabiz-documentos` — migración `supabase_migration_opabiz_documentos_bucket.sql`), `POST disponibilidad`.

**Bug corregido de paso:** el cron `reassign-timeouts` hacía `update({empleado_id: null, ...})` cuando no había candidato, pero `ordenes_opabiz.empleado_id` es `NOT NULL` — el update fallaba en silencio, la orden nunca salía de `estado='asignada'`, y el cron volvía a penalizar al mismo empleado cada 5 min indefinidamente. Fix: ya no intenta vaciar `empleado_id`, solo cambia `estado` (lo saca del filtro del cron) y loguea el error si el update falla.

**Pendiente de correr en Supabase:** `supabase_migration_opabiz_documentos_bucket.sql` (crea el bucket `opabiz-documentos`).

**Explícitamente fuera de esta sesión:** push/WhatsApp al empleado, service worker offline, integración webhook Stripe → crear `ordenes_opabiz` automáticamente (necesita resolver el mapeo cliente→`usuarios.id` primero), `NIVEL_MINIMO_POR_SERVICIO`, página de perfil/métricas del empleado.

---

## Citas manuales + Intake asistida — 2026-07-14

Dos primeros usos reales de OpaBiz Connect, ambos **100% manuales** (el
founder quiere evaluar el desempeño de los agentes antes de automatizar
asignación — el motor `pickBestEmployee` sigue existiendo, no se dispara desde
ninguna de las dos).

**Migración:** `supabase_migration_opabiz_citas_intake.sql` — agrega
`ordenes_opabiz.notas` (TEXT, contexto libre de la tarea) y
`ordenes_opabiz.appointment_id` (FK a `appointments.id`), más
`"Order"."assistedByEmpleadosId"` (FK a `EMPLEADOS.id`).

### Citas → orden (manual)

`POST /api/opabiz/orders` (nuevo, admin-only) crea una orden de OpaBiz Connect.
`empleadoUsuarioId` es **obligatorio** — `ordenes_opabiz.empleado_id` es
`NOT NULL` en la base real, así que no existe la posibilidad de crear una
orden "sin asignar" (calza con la decisión de asignar todo a mano). Resuelve
o crea un `usuarios` cliente por email (`lib/opabiz-clientes.ts`,
`findOrCreateClienteUsuario()` — reusado también por intake asistida).

`/admin/citas` tiene un botón **"🧭 Crear orden OpaBiz Connect"** por fila que
abre un mini-formulario (tipo de servicio, notas prefilled con la nota de la
cita, urgente, empleado a asignar). Se deshabilita si la cita ya tiene una
orden vinculada (`GET /api/opabiz/orders?appointmentId=`).

### Intake asistida (agente arma la solicitud, cliente solo paga)

**El agente NUNCA toca el pago del cliente (riesgo PCI).** Decisión de diseño
clave: NO reusa el flujo `?continue=FBFC-XXXX` del home — ese link restaura el
form gigante de `page.tsx` (~6800 líneas) leyendo un `snapshot` con shape
interna del form (`FM_FIELD_IDS`, `fmData`); sin ese snapshot exacto (inviable
de armar desde afuera) el cliente cae en un form en blanco y el próximo
autosave puede pisar con blancos los datos que cargó el agente (confirmado
leyendo `fmFetchAndRestoreDraft()` en `page.tsx`).

En cambio:
1. `backend/app/opabiz/dashboard/intake/page.tsx` — form de una sola pantalla dentro de la PWA del empleado (contacto, empresa, dirección, agente registrado, miembros dinámicos, paquete, addons, velocidad). Link "📞 Nueva intake asistida" en `/opabiz/dashboard`.
2. `POST /api/opabiz/me/intake` — valida con `OrderDraftInputSchema` (mismo contrato que usa el resto del sistema), inserta el `Order` **directamente** (sin llamar a `/api/orders/draft`, para no depender de su email de "continuar aplicación"), crea/resuelve el `usuarios` cliente, crea la orden en `ordenes_opabiz` (`tipo_servicio:'Intake asistida'`, `estado:'completada'` de una — el trabajo del agente termina al enviar, no depende de que el cliente pague), setea `Order.assistedByEmpleadosId`, suma +10 puntos (`registrarPuntaje`, mismo award que completar una orden de campo — una bonificación proporcional a lo vendido queda pendiente), y manda un email propio (no el de `/api/orders/draft`) con link a `/confirm/[fbfc]`.
3. `GET /api/orders/summary-by-fbfc?fbfc=...` — resuelve el FBFC al `Order` real, setea `client_session` y devuelve el resumen (`computeFormationTotal`, `lib/pricing.ts`). Endpoint propio (no reusa `/api/client-auth` + un GET separado) porque es un link de un solo uso, no una sesión de portal.
4. `backend/app/confirm/[fbfc]/page.tsx` — página pública liviana: muestra el resumen (empresa, paquete, addons, total) y un botón "Confirmar y pagar" que monta Stripe Embedded Checkout (`POST /api/checkout/embedded`, mismo patrón que `fmMountPayment()` del home) — sin el resto del wizard alrededor. Sin edición inline a propósito; correcciones van por contacto humano (mailto).

**Pendiente:** bonificación de puntos proporcional a lo vendido (hoy flat +10); auto-crear orden al agendar cita (hoy 100% manual).

---

## Referencias

- Memoria de la sesión 2026-07-13: `project_opabiz_sistema_interno`
- Sistema de emails MBF: `LOGICA_DE_NEGOCIO/02_emails_automaticos.md`
- Panel admin de OpaBiz Connect: `backend/app/admin/opabiz/page.tsx`
