# 23 — Sistema Propio de Citas (Booking)

Documento maestro del sistema de citas/consultas gratuitas que reemplazó al integración inicial con Cal.com. Cubre el calendario público, la API, el panel admin, los emails transaccionales, y las reglas de negocio (horarios, capacidad, anticipación mínima).

> Sustituye la integración previa con Cal.com (commit `a4955c7`, brevemente activa el 2026-06-05). Reemplazada por sistema propio en commit `66d5a56` para tener control total sobre slots, capacidad, y branding de emails.

---

## 1. Por qué propio en vez de Cal.com / Calendly

| Razón | Detalle |
|-------|---------|
| **Branding consistente** | Emails de confirmación/reagendamiento/cancelación con header y estilo OpaBiz, no de un tercero |
| **Sin dependencia externa** | No depende de uptime de Cal.com / planes pagos / cambios de pricing |
| **Sin redirección** | El usuario nunca sale de opabiz.com — mejor UX y mejor SEO (no se pierde tráfico) |
| **Bilingüe nativo** | El calendario, slots y emails respetan el toggle EN/ES del sitio. Cal.com requiere config separada por idioma |
| **Lógica custom** | Reglas específicas (Lun-Sáb, slots de 40 min, 15 citas/día max, no permitir hoy a menos de 1h) van directo en código sin workarounds |
| **Data en Supabase** | Las citas viven en la misma DB que las órdenes — facilita reportes cruzados (cuántas citas convierten en orden, etc.) |
| **Cero costo recurrente** | Cal.com cobra por features avanzados (reschedule, custom branding) |

---

## 2. Reglas de negocio

### Horario disponible

- **Días**: Lunes a Sábado. Domingo cerrado (validación en `/api/booking/slots`).
- **Rango**: 9:00 AM – 7:00 PM (último slot inicia 6:20 PM).
- **Duración por cita**: 30 minutos efectivos + 10 minutos buffer = **bloques de 40 min**.

### Slots fijos (15 por día)

```
09:00  09:40  10:20  11:00  11:40
12:20  13:00  13:40  14:20  15:00
15:40  16:20  17:00  17:40  18:20
```

Definidos como constante `ALL_SLOTS` en [`/api/booking/slots/route.ts`](backend/app/api/booking/slots/route.ts) y replicada en [`/admin/citas/page.tsx`](backend/app/admin/citas/page.tsx). Si en el futuro cambia el horario, actualizar **los dos** lugares (no hay fuente única — pendiente refactor a `lib/booking-config.ts`).

### Capacidad máxima

- 15 citas por día (alineado con la cantidad de slots).
- No hay overbooking — el endpoint POST `/api/booking` verifica que el slot esté libre y retorna `409 slot_taken` si ya existe una cita activa (`status != 'cancelled'`) en ese día+hora.

### Anticipación mínima

- Para slots del día actual: **mínimo 1 hora de anticipación**. Implementado en `/api/booking/slots`:
  ```ts
  if (isToday) {
    const [h, m] = slot.split(':').map(Number)
    if (h * 60 + m <= currentMinutes + 60) return false
  }
  ```
- Para días futuros: cualquier slot disponible es elegible.

### Estados de cita

| `status` | Significado | Quién lo setea |
|----------|-------------|----------------|
| `pending` | Creada, esperando contacto del equipo | Auto al crear |
| `confirmed` | Equipo confirmó contacto con cliente | Admin via panel |
| `cancelled` | Cancelada por cliente o admin | Cliente via link en email O admin |

`reschedule` no es un estado: cuando el cliente reprograma, se updatea la fila existente (date + time) y se mantiene `pending`.

### Métodos de reunión

| `meeting_method` | Cómo se contacta | Default |
|------------------|------------------|---------|
| `phone` | Llamada al teléfono provisto | ✅ (default desde commit `b70847e`) |
| `whatsapp` | Mensaje a WhatsApp del teléfono | Opcional |

⚠️ **NO hay opción Zoom hoy**. Inicialmente sí (commit `b70847e` reemplaza Zoom por llamada telefónica). Si se reintroduce, agregar como opción y plumar un campo `meeting_url` en la tabla.

---

## 3. Schema de DB

Definido en [`supabase_migration_appointments.sql`](supabase_migration_appointments.sql) (raíz del repo).

### Tabla `appointments`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid | PK, auto-generado |
| `created_at` | timestamptz | Auto |
| `name` | text | NOT NULL — nombre completo |
| `email` | text | NOT NULL |
| `phone` | text | Obligatorio desde el form (commit `0b2014d`), permite null en DB para legacy |
| `date` | date | NOT NULL — formato `YYYY-MM-DD` |
| `time` | text | NOT NULL — formato `HH:MM` (24h) — uno de los 15 slots |
| `meeting_method` | text | Default `'zoom'` en DB pero default `'phone'` en el form. **El default DB es legacy** — pendiente migrate a `'phone'` |
| `note` | text | Opcional — qué quiere discutir el cliente |
| `status` | text | Default `'pending'` |

Índices:
- `idx_appointments_date` — por fecha (consulta de slots del día)
- `idx_appointments_email` — por email (lookup de cliente)

### Tabla `blocked_slots`

Para que el admin bloquee días/horas específicas (feriados, viajes, capacitaciones).

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid | PK |
| `created_at` | timestamptz | Auto |
| `date` | date | NOT NULL — día específico |
| `time` | text | NULL = día completo bloqueado. Si tiene valor, solo ese slot |
| `reason` | text | Opcional — para tracking interno |

Índice: `idx_blocked_slots_date`.

---

## 4. Endpoints API

Todos en `backend/app/api/booking/`. Todos retornan JSON. Validación básica de campos requeridos.

### Públicos (sin auth)

| Endpoint | Método | Qué hace |
|----------|--------|----------|
| `/api/booking/slots?date=YYYY-MM-DD` | GET | Devuelve `{slots: string[]}` con los slots disponibles para esa fecha (ya filtrados por bookings + blocked + anticipación) |
| `/api/booking` | POST | Crea cita + envía 2 emails (cliente + admin). Body: `{name, email, phone, meetingMethod, date, time, note, lang}` |
| `/api/booking/reschedule?id=<uuid>` | GET | Devuelve la cita existente (para pre-rellenar el form de reschedule) |
| `/api/booking/reschedule` | POST | Cambia date+time. Body: `{id, date, time}`. Envía email al cliente + admin |
| `/api/booking/cancel?id=<uuid>` | GET | Devuelve la cita (para confirmar antes de cancelar) |
| `/api/booking/cancel` | POST | Cambia status a `cancelled`. Body: `{id}`. Envía email al cliente + admin |

**Sin auth en los públicos**: la "auth" es el UUID que solo conoce el cliente (vino en su email de confirmación). UUIDs son no-guessable (128 bits). Aceptable para este caso (datos no sensibles más allá de fecha+contacto).

### Admin (requieren `admin_session` cookie)

| Endpoint | Método | Qué hace |
|----------|--------|----------|
| `/api/booking/appointments` | GET | Lista todas las citas (sin filtro server-side; el panel filtra client-side) |
| `/api/booking/appointments/[id]` | PATCH | Cambia status (`pending` → `confirmed` típicamente) |
| `/api/booking/appointments/[id]` | DELETE | Borra la cita (hard delete) |
| `/api/booking/blocked` | GET | Lista blocked_slots |
| `/api/booking/blocked` | POST | Crea blocked_slot. Body: `{date, time, reason}` |
| `/api/booking/blocked/[id]` | DELETE | Borra blocked_slot |

✅ **Todos los 5 endpoints validan la cookie `admin_session`** con `jwtVerify` directo (de `jose`) contra `SESSION_SECRET`. Es un patrón **funcionalmente equivalente** al helper `verifyAdminToken` usado en otros endpoints (`/api/contabilidad/*`, `/api/campaigns/*`), solo con la implementación inline. Si en el futuro se quiere uniformizar, refactor menor para usar el helper de `lib/session.ts`.

---

## 5. Páginas

### `/booking` (público)

[`backend/app/booking/page.tsx`](backend/app/booking/page.tsx) — 370 líneas. Client Component.

Flujo en 3 pasos:
1. **Calendar** — calendario mensual, navegable. Domingos deshabilitados. Click en día → fetch a `/api/booking/slots`.
2. **Slot picker** — grid con los slots disponibles para la fecha seleccionada.
3. **Form** — nombre, email, teléfono (obligatorio), método de reunión (phone/WhatsApp), nota opcional.

Después del POST exitoso:
- Muestra success screen ("Appointment Confirmed")
- El email con links de Reschedule/Cancel se manda en paralelo

### `/booking/reschedule?id=<uuid>` (público)

[`backend/app/booking/reschedule/page.tsx`](backend/app/booking/reschedule/page.tsx) — 189 líneas.

- Fetch a `GET /api/booking/reschedule?id=...` → muestra cita actual
- Si la cita está `cancelled` → muestra error y oferta para crear nueva
- Si está OK → muestra calendar + slot picker
- Click "Confirm" → POST `/api/booking/reschedule` con `{id, date, time}`

### `/booking/cancel?id=<uuid>` (público)

[`backend/app/booking/cancel/page.tsx`](backend/app/booking/cancel/page.tsx) — 129 líneas.

- Fetch GET → muestra cita
- Botón "Confirm Cancel" → POST → cambia status
- Botón "Book New" → link a `/booking`

### `/admin/citas` (admin)

[`backend/app/admin/citas/page.tsx`](backend/app/admin/citas/page.tsx) — 331 líneas. Client Component.

Dos tabs:

**Tab "Appointments"**:
- Tabla con todas las citas (sortable)
- Filtros: all / pending / confirmed / cancelled
- Acciones por fila: Confirm, Cancel, Delete, WhatsApp (abre `wa.me/...` con mensaje pre-llenado)
- Muestra `meeting_method` (phone/WhatsApp icon)

**Tab "Blocked Slots"**:
- Form para bloquear día/hora con razón
- Lista de blocked actuales con acción Delete

---

## 6. Emails transaccionales

Todos via Resend, desde `onboarding@resend.dev` (pendiente migrar a `info@opabiz.com` cuando el dominio esté verificado en Resend).

### Email de confirmación al cliente (POST `/api/booking`)

- **Subject EN**: `✅ Your consultation is scheduled — OpaBiz`
- **Subject ES**: `✅ Tu consulta está agendada — OpaBiz`
- **Contenido**: header oscuro OpaBiz, fecha + hora + método + nota
- **CTAs**:
  - 📅 Reschedule / Reprogramar → link a `/booking/reschedule?id=<uuid>`
  - ❌ Cancel / Cancelar → link a `/booking/cancel?id=<uuid>`

### Notificación al admin (POST `/api/booking`)

- **Destinatario**: `info@opabiz.com` (hardcoded en [`/api/booking/route.ts:9`](backend/app/api/booking/route.ts))
- **Subject**: `Nueva cita: <name> — <fecha> <hora>`
- **Contenido**: tabla con todos los datos del cliente
- **CTAs**:
  - 💬 WhatsApp al cliente — link `wa.me/<phone>?text=<mensaje pre-llenado>`
  - ✉️ Responder por email — `mailto:<email>`
  - Link al panel admin `opabiz.com/admin/citas`

### Email de reschedule (POST `/api/booking/reschedule`)

- Al cliente: confirmación con nueva fecha/hora
- Al admin: notificación de reschedule con nueva fecha/hora

### Email de cancel (POST `/api/booking/cancel`)

- Al cliente: confirmación de cancelación + CTA para agendar nueva cita
- Al admin: notificación de cancel

### ⚠️ Resend sandbox

Plan free de Resend solo entrega a la dirección registrada en la cuenta (`info@opabiz.com`). En sandbox:
- ✅ El admin recibe los emails normalmente (es el email de la cuenta)
- ❌ El cliente NO recibe el email (cualquier otro destinatario es bloqueado)

Para activarlo:
1. Verificar dominio `opabiz.com` en Resend (DNS TXT + DKIM en Namecheap)
2. Cambiar `from: 'onboarding@resend.dev'` → `from: 'info@opabiz.com'` en los 3 routes (`/api/booking`, `/reschedule`, `/cancel`)

---

## 7. Variables de entorno

| Variable | Para qué | Valor producción |
|----------|----------|------------------|
| `NEXT_PUBLIC_URL` | Base URL para construir links Reschedule/Cancel en emails | `https://opabiz.com` |
| `RESEND_API_KEY` | Resend (ya existía) | (en Vercel) |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Acceso DB (ya existían) | (en Vercel) |

`NEXT_PUBLIC_URL` es nuevo de este sistema — verificar que esté seteado en Vercel Production. Si no está, el fallback es `'https://opabiz.com'` hardcoded (línea 11 de [`/api/booking/route.ts`](backend/app/api/booking/route.ts)). Por eso el sistema funciona aunque la env no esté.

---

## 8. Decisiones embutidas

- **15 citas/día** — alineado con la cantidad natural de slots (9 horas × 1.5 citas/hora). Si el equipo se escala, ampliar slots OR reducir buffer a 5 min para sumar capacidad sin extender horario.

- **Buffer de 10 min entre citas** — para que el equipo tenga tiempo de cerrar notas + prepararse para la siguiente. No es slot tiempo del cliente, es respiro operativo.

- **Anticipación mínima de 1h en day-of** — evita que un cliente que estaba navegando agarre el slot de 5 min próximo y nadie del equipo esté preparado.

- **Domingo cerrado** — alineado con calendario operativo del equipo. Si en el futuro hay equipo de fin de semana, cambiar `dayOfWeek === 0` por `false` en `/api/booking/slots`.

- **Sin sistema de "confirmación por el cliente"** — la cita pasa de `pending` a `confirmed` solo cuando el equipo contacta al cliente. No hay "confirm by client" del lado público porque el booking ya es self-service.

- **UUID como "auth" para reschedule/cancel** — más simple que tokens firmados. Suficientemente seguro para datos no críticos (las citas no exponen dinero ni acceso). Si en el futuro se manejan citas médicas o legales sensibles, migrar a JWT con expiración.

- **Hard delete en `/api/booking/appointments/[id]` DELETE** — sin soft delete. Si Aneury borra por accidente, no hay undo. Aceptable porque el admin tiene también la opción "cancel" que preserva el registro.

- **Sin RLS en las tablas** — `appointments` y `blocked_slots` son accedidas solo via service role key desde el servidor. Si en el futuro se expone Supabase directo al cliente (no es el caso), habilitar RLS.

---

## 9. Pendientes (con plazo)

| Item | Cuándo | Quién |
|------|--------|-------|
| (Opcional, no urgente) Refactor de los 5 endpoints admin de booking para usar el helper `verifyAdminToken` de `lib/session.ts` en vez del patrón inline con `jwtVerify`. Mejora consistencia, no agrega seguridad | Cuando se toque ese código por otra razón | Aneury |
| Verificar dominio `opabiz.com` en Resend → cambiar `from:` en los 3 routes | Esta semana | Aneury |
| Recordatorio automático 24h antes de la cita (mencionado en `supabase_migration_appointments.sql` líneas 75-79). Requiere Vercel Cron + endpoint `/api/booking/remind` | Mes 2 post-launch | Aneury |
| Refactor: consolidar `ALL_SLOTS` en `backend/lib/booking-config.ts` (hoy duplicado en 2 lugares) | Cuando se toque slots por primera vez | Aneury |
| Migrar default de `meeting_method` en DB de `'zoom'` → `'phone'` (es legacy) | Próximo deploy con migración | Aneury |

---

## 10. Diferidos (no priority hoy)

- **Citas recurrentes** (semanales para sesiones de seguimiento) — mencionado en SQL líneas 80-83 como pendiente futuro. Requiere agregar columnas `is_recurring` + `recurrence_day` + lógica en `/api/booking/slots` para detectar slots ya reservados recurrentemente.

- **Múltiples ejecutivos/calendarios** — hoy hay un solo "calendario" del equipo. Si el equipo crece y se quiere asignar citas a ejecutivos específicos, agregar columna `assigned_to` + UI de asignación en admin.

- **Confirmación SMS via Twilio/Resend SMS** — hoy solo email. Algunos clientes podrían no chequear email. Bajo prioridad porque el email ya tiene los CTAs de reschedule/cancel.

- **Integración con calendario externo (Google Calendar / Outlook)** — para que el equipo vea las citas en su calendar app. Útil pero no crítico — el admin panel cubre.

- **Auto-cancel de pending después de N días sin confirmación del equipo** — protección contra acumulación de pending stale. Por ahora se gestiona manualmente.

- **Webhook al CRM cuando se crea cita** — el módulo de Contabilidad podría querer trackear citas como "leads". Pendiente para cuando Contabilidad evolucione a CRM.

---

## 11. Descartados (con motivo explícito)

### Cal.com / Calendly / SavvyCal (integraciones externas)

- **Por qué no**: branding inconsistente, dependencia externa, costo recurrente para features avanzados, redirección fuera del sitio (mala UX y mala SEO).
- **Decisión**: descartado definitivamente. El sistema propio cubre todo lo que necesitamos con cero costo recurrente.
- **Histórico**: Cal.com estuvo brevemente integrado entre commits `a4955c7` (2026-06-05) y `66d5a56` (sistema propio reemplaza).

### Zoom como meeting_method default

- **Por qué no**: requería config adicional del cliente (instalar Zoom, crear cuenta). Las llamadas telefónicas funcionan para 100% de clientes sin onboarding.
- **Decisión**: removido en commit `b70847e`. Phone + WhatsApp cubren el universo de comunicación de nuestros clientes (US/LATAM).

### Slot picker continuo (no fijos cada 40 min)

- **Por qué no**: complicaría el query de disponibilidad sin beneficio real. Slots fijos son más fáciles de UI, de tracking, y permiten al equipo planificar el día.
- **Decisión**: descartado — los 15 slots fijos son suficientes.

### Pago de la cita por adelantado

- **Por qué no**: las consultas son **gratuitas** como lead magnet. Cobrar reduciría conversion. Si en el futuro se introducen "consultorías premium pagas", ahí sí justificaría Stripe Checkout pre-cita.

---

## 12. Referencias

- SQL schema: [`supabase_migration_appointments.sql`](../supabase_migration_appointments.sql)
- API: [`backend/app/api/booking/`](../backend/app/api/booking/)
- UI público: [`backend/app/booking/`](../backend/app/booking/)
- Admin: [`backend/app/admin/citas/page.tsx`](../backend/app/admin/citas/page.tsx)
- Commits clave:
  - `66d5a56` — feat: sistema propio de citas con calendario, admin y notificaciones
  - `d31ae0c` — feat(booking): opciones de reprogramar y cancelar
  - `0b2014d` — feat(booking): método reunión, teléfono obligatorio
  - `b70847e` — feat(booking): reemplaza Zoom por llamada telefónica
  - `5eb9cc3` — feat(portal): soporte EN/ES dashboard (booking lang inherita de aquí)
  - `7c7a09f` — docs: lógica de negocio + pendientes en SQL de citas
- Doc relacionado: [`02_emails_automaticos.md`](02_emails_automaticos.md) — patterns generales de Resend
- Doc relacionado: [`13_seguridad_panel_admin.md`](13_seguridad_panel_admin.md) — patrón `verifyAdminToken` (pendiente aplicar a `/api/booking/*` admin)
