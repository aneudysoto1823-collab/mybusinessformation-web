# 22 — Sistema de Citas (Booking)

## Qué es

Sistema propio de agendamiento de consultas, sin dependencias externas (no Calendly, no Cal.com). Permite a clientes potenciales agendar una consulta con el equipo directamente desde el sitio.

---

## Configuración

| Parámetro | Valor |
|---|---|
| Días hábiles | Lunes a Sábado |
| Horario | 9:00am – 7:00pm |
| Duración | 30 min consulta + 10 min buffer |
| Bloque | 40 minutos |
| Capacidad | 15 slots/día |

**Slots disponibles:** 09:00, 09:40, 10:20, 11:00, 11:40, 12:20, 13:00, 13:40, 14:20, 15:00, 15:40, 16:20, 17:00, 17:40, 18:20

---

## Métodos de contacto

- **Phone Call** — llamada telefónica (logo auricular navy)
- **WhatsApp** — chat o llamada (logo oficial verde #25D366)

> Zoom fue eliminado el 2026-06-08 — reemplazado por Phone Call.

---

## Tablas Supabase

```sql
CREATE TABLE appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  name            text NOT NULL,
  email           text NOT NULL,
  phone           text,           -- obligatorio desde el formulario
  date            date NOT NULL,  -- YYYY-MM-DD
  time            text NOT NULL,  -- '09:00', '09:40', etc.
  meeting_method  text DEFAULT 'phone',  -- 'phone' | 'whatsapp'
  note            text,
  status          text DEFAULT 'pending'  -- 'pending' | 'confirmed' | 'cancelled'
)

CREATE TABLE blocked_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  date        date,    -- null = bloquea todo el día
  time        text,    -- null = bloquea día completo
  reason      text
)
```

---

## API Routes

| Endpoint | Método | Función |
|---|---|---|
| `/api/booking/slots` | GET | Slots disponibles para una fecha |
| `/api/booking` | POST | Crea cita + emails de confirmación |
| `/api/booking/reschedule` | GET + POST | Info / reprogramar (acceso público por ID) |
| `/api/booking/cancel` | GET + POST | Info / cancelar (acceso público por ID) |
| `/api/booking/appointments` | GET | Lista de citas (admin) |
| `/api/booking/appointments/[id]` | PATCH + DELETE | Cambiar estado / eliminar (admin) |
| `/api/booking/blocked` | GET + POST | Listar / crear bloqueos (admin) |
| `/api/booking/blocked/[id]` | DELETE | Eliminar bloqueo (admin) |

---

## Páginas

| Ruta | Descripción |
|---|---|
| `/booking` | Formulario público EN/ES — calendario + horarios + datos |
| `/booking/reschedule` | Reprogramar cita (link del email de confirmación) |
| `/booking/cancel` | Cancelar cita (link del email de confirmación) |
| `/admin/citas` | Panel admin: lista, confirmar/cancelar, bloquear horarios |

---

## Emails automáticos

| Trigger | Destinatario | Contenido |
|---|---|---|
| Nueva cita | Cliente | Fecha, hora, método, links Reschedule + Cancel |
| Nueva cita | Admin | Datos completos, link WhatsApp al cliente |
| Reprogramar | Cliente + Admin | Nueva fecha/hora |
| Cancelar | Cliente | Confirmación + botón para nueva cita |

Los links de Reschedule/Cancel usan el UUID de la cita (difícil de adivinar). Requieren `NEXT_PUBLIC_URL` para construir la URL correcta.

---

## Panel Admin `/admin/citas`

- Tabla de citas con estado: `pending` / `confirmed` / `cancelled`
- Botones de confirmar/cancelar por cita
- Sección de bloqueos: bloquear hora específica o día completo
- Link directo a WhatsApp del cliente por cita
- Mensaje de WhatsApp preformateado al abrir desde el panel

---

## Pendientes

- [ ] Migrar Resend a dominio propio (`@opabiz.com`) para que emails lleguen a todos los clientes sin restricción del plan gratuito
- [ ] Recordatorios automáticos 24h antes de la cita (requiere cron job)
- [ ] Soporte bilingüe EN/ES en páginas `/booking/reschedule` y `/booking/cancel`
