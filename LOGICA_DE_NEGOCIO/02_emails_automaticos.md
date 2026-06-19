# Proceso 2 — Emails Automáticos (Resend)

## Descripción

El sistema envía emails transaccionales (órdenes, certificate, alertas), de marketing (campañas QR) y un email del formulario público de contacto. Toda la lógica vive en Vercel (no hay nada en Railway). Resend es el único proveedor.

Los emails al cliente son **en inglés** porque la audiencia es internacional y los documentos del Estado de Florida son en inglés. Las alertas internas y subjects van en español por preferencia del equipo.

---

## Configuración (actualizada 2026-06-19)

### Proveedor

- **Plataforma:** Resend (resend.com), cuenta dueña de OpaBiz
- **Plan actual:** Free tier (3,000 emails/mes, 100/día)
- **Plan recomendado al lanzar:** Pro $20/mes (50k emails/mes, sin límite diario, Audiences, retención de logs 30 días). Migración no requiere tocar código.

### Dominio

- **Dominio verificado en Resend:** `opabiz.com` ✅
  - SPF + DKIM + DMARC configurados en DNS.
  - Sin esto, Resend solo permite enviar al dueño de la cuenta (modo sandbox).

### Buzones (en Zoho Mail)

Todos los emails del dominio están como buzones reales en Zoho — el equipo los ve en la app móvil y web.

| Buzón | Uso |
|---|---|
| `noreply@opabiz.com` | **FROM** de todos los emails transaccionales y del form de contacto. Cliente no debería responder acá (Reply-To redirige). |
| `marketing@opabiz.com` | **FROM** de campañas (QR / newsletter). Separado del transaccional para que un spam complaint no contamine la reputación de las órdenes. |
| `info@opabiz.com` | **Reply-To** de TODOS los emails + **TO** del form de contacto. Buzón principal monitoreado por el equipo. |
| `admin@opabiz.com` | **TO** de alertas internas (nombres tomados, nueva orden Stripe). |
| `support@opabiz.com` | Mencionado en footers de emails como canal de soporte alternativo. |

### Convención de la industria aplicada

- **FROM noreply@** señaliza "automático del sistema"; el cliente no se confunde respondiendo al buzón equivocado.
- **Marketing FROM separado**: si una campaña recibe spam complaints, Resend penaliza la reputación de ese FROM. Al separarlo, NUNCA cae la reputación de los emails transaccionales (que son los críticos — confirmación de pago, certificado, etc.). Es el patrón de Stripe, GitHub, Linear, etc.
- **Reply-To info@**: cuando el cliente responde al email automático, llega a un buzón leído. Sin Reply-To, la respuesta cae en `noreply@` que nadie chequea.
- **Alertas internas dentro del dominio Zoho**: si mañana cambia el founder o se suma equipo, no hay emails colgando en Gmail personales.

---

## Variables de entorno

Setear en Vercel **(Production + Preview + Development)** y replicar en `backend/.env.local` para dev. Si una var falta, el código degrada a un fallback seguro pero el deploy productivo siempre debe tener las 6.

| Variable | Valor | Usada en |
|---|---|---|
| `RESEND_API_KEY` | API key de Resend (cuenta OpaBiz) | Todos los emails |
| `RESEND_FROM_TRANSACTIONAL` | `noreply@opabiz.com` | 6 emails de órdenes + Stripe webhook + contact form (fallback) |
| `RESEND_FROM_MARKETING` | `marketing@opabiz.com` | Campañas |
| `RESEND_REPLY_TO` | `info@opabiz.com` | TODOS los emails |
| `INTERNAL_ALERT_EMAIL` | `admin@opabiz.com` | Alerta de nombres tomados + alerta Stripe |
| `CONTACT_FROM_EMAIL` | `noreply@opabiz.com` | Form de contacto (override de RESEND_FROM_TRANSACTIONAL si querés un FROM distinto solo para contact) |
| `CONTACT_TO_EMAIL` | `info@opabiz.com` | Form de contacto |

**Nota sobre Preview:** Vercel CLI tiene un bug con preview branches que requiere setear manualmente desde el dashboard. Production + Development se setean perfecto via CLI.

---

## Los emails que envía el sistema

### A — Transaccionales de órdenes (6 funciones en `backend/lib/notifications.ts`)

Todos van DESDE `RESEND_FROM_TRANSACTIONAL` con Reply-To `RESEND_REPLY_TO`.

#### A1. Confirmación de Orden → CLIENTE
- **Cuándo:** Al recibir POST a `/api/orders` (form de orden completado por el cliente). No espera al pago Stripe — se envía apenas la orden se inserta en Supabase.
- **Destinatario:** `order.email` (cliente).
- **Implementación:** **Inline en `backend/app/api/orders/route.ts`** — el send está dentro del propio endpoint con su propio template HTML. **NO** llama a `sendOrderConfirmation()` de `lib/notifications.ts`.
- **Contenido:** Resumen de la orden, número de orden (`FBFC-XXXXXXXX`), próximos pasos, link a soporte WhatsApp.
- **Subject:** `✅ We received your order — {companyName}`
- **⚠️ Código duplicado pendiente de limpiar:** existe `sendOrderConfirmation()` exportada en `lib/notifications.ts` con un template parecido pero **nadie la importa**. Probablemente quedó como legacy de la migración de Express a Vercel. No borrarla hasta consolidar el template — la versión inline de `/api/orders` es la que se ejecuta en producción.

#### A2. Nombres Tomados → CLIENTE
- **Cuándo:** Equipo verifica en Sunbiz que los 3 nombres propuestos están registrados.
- **Destinatario:** `order.email`.
- **Función:** `sendAllNamesTaken(order)` — envía A2 + A3 en paralelo (Promise.all).
- **Contenido:** Lista 3 nombres rechazados con ❌, pide 3 nuevas opciones, enlaza `search.sunbiz.org`.

#### A3. Alerta de Nombres Tomados → ADMIN INTERNO
- **Cuándo:** Mismo momento que A2 (parte de `sendAllNamesTaken`).
- **Destinatario:** `INTERNAL_ALERT_EMAIL` = `admin@opabiz.com`.
- **Contenido:** Alerta roja con datos del cliente, nombres rechazados, instrucción de seguimiento.

#### A4. Sugerencia de Nombres → CLIENTE
- **Cuándo:** Admin encuentra nombres alternativos disponibles y los manda al cliente.
- **Destinatario:** `order.email`.
- **Función:** `sendSuggestNames(order)`.
- **Contenido:** Lista de nombres sugeridos por el equipo + CTA para que el cliente confirme.

#### A5. Orden Procesada → CLIENTE
- **Cuándo:** Admin avanza estado a `filed` (ya se presentó al Estado de FL).
- **Destinatario:** `order.email`.
- **Función:** `sendOrderProcessed(order)`.
- **Contenido:** Notifica que el filing está hecho, próximos 7–10 días hábiles para aprobación.

#### A6. Orden Aprobada → CLIENTE
- **Cuándo:** Admin avanza estado a `approved` (Florida aprobó la LLC/Corp).
- **Destinatario:** `order.email`.
- **Función:** `sendOrderApproved(order)`.
- **Contenido:** Felicitación + próximos pasos. El certificate PDF llega en A7.

#### A7. Certificate of Formation → CLIENTE
- **Cuándo:** Admin sube el PDF del certificate desde `/admin/orders/[id]`. Marca la orden como `completed` automáticamente.
- **Destinatario:** `order.email`.
- **Función:** `sendCertificateDelivery(order)`.
- **Contenido:** PDF adjunto (o link a Supabase Storage), instrucciones de qué hacer con él, link al portal.

---

### B — Marketing (en `backend/app/api/campaigns/send/route.ts`)

#### B1. Carta de Cumplimiento QR → LEAD
- **Cuándo:** Admin selecciona empresas en `/admin/campaigns` y dispara la campaña.
- **Destinatario:** `company.email` (lead extraído de Sunbiz).
- **FROM:** `RESEND_FROM_MARKETING` = `marketing@opabiz.com` (separado del transaccional).
- **Reply-To:** `info@opabiz.com`.
- **Contenido:** Carta bilingüe EN/ES con QR personalizado que lleva a `/new-business?id=...`.

---

### C — Stripe webhook (en `backend/app/api/webhooks/stripe/route.ts`)

#### C1. Confirmación de New Business Letter → CLIENTE
- **Cuándo:** Cliente paga checkout del flow `/new-business` (servicios de marketing — Labor Law Poster, EIN, Certificate of Status).
- **Destinatario:** Email del checkout Stripe.
- **FROM:** Transaccional.

#### C2. Alerta de Nueva Orden → ADMIN INTERNO
- **Cuándo:** Mismo momento que C1.
- **Destinatario:** `INTERNAL_ALERT_EMAIL` = `admin@opabiz.com`.
- **Subject:** `🆕 Nueva orden New Business Letter — {companyName}`.

---

### D — Form de contacto público (en `backend/app/api/contact/route.ts`)

#### D1. Mensaje del Visitor → ADMIN INFO
- **Cuándo:** Visitor envía el form de `/contact`.
- **FROM:** `CONTACT_FROM_EMAIL` (cae a transaccional si no está seteado) = `noreply@opabiz.com`.
- **TO:** `CONTACT_TO_EMAIL` = `info@opabiz.com`.
- **Reply-To:** El email del visitor (sobreescribe el reply-to default) — para responder con un click sin copiar/pegar.
- **Subject:** `[OpaBiz Contact] {subject elegido del select}`.
- **Rate limit:** 5/h por IP (anti-spam, función `checkContactRateLimit` en `backend/lib/rate-limit.ts`).
- **Validación:** name, email válido, subject, message mínimo 5 chars. Límites máximos defensivos por campo contra payload abuse.

---

## Resumen completo de destinatarios

| Email | Tipo | FROM | TO | Reply-To | Trigger |
|---|---|---|---|---|---|
| A1 Confirmación orden | Transaccional | noreply@ | cliente | info@ | Pago Stripe / POST /api/orders |
| A2 Nombres tomados | Transaccional | noreply@ | cliente | info@ | Admin marca `names_taken` |
| A3 Alerta nombres | Interno | noreply@ | admin@ | info@ | Mismo que A2 (paralelo) |
| A4 Sugerencias | Transaccional | noreply@ | cliente | info@ | Admin manda manual |
| A5 Procesada | Transaccional | noreply@ | cliente | info@ | Admin avanza a `filed` |
| A6 Aprobada | Transaccional | noreply@ | cliente | info@ | Admin avanza a `approved` |
| A7 Certificate | Transaccional | noreply@ | cliente | info@ | Admin sube PDF |
| B1 Carta QR | Marketing | marketing@ | lead | info@ | Admin lanza campaña |
| C1 Confirmación NBL | Transaccional | noreply@ | cliente | info@ | Stripe webhook NBL |
| C2 Alerta nueva orden NBL | Interno | noreply@ | admin@ | info@ | Mismo que C1 |
| D1 Contact form | Visitor → admin | noreply@ | info@ | email del visitor | Submit del form `/contact` |

---

## Flujo técnico de A1–A7 (órdenes)

> **Nota sobre Stripe (2026-06-19):** el pago Stripe **no está configurado todavía** en este flujo. La orden se crea sin pasar por checkout y A1 se dispara inmediatamente desde `/api/orders` cuando el cliente termina el form. El día que se conecte Stripe, A1 puede moverse al webhook para que solo se mande tras el pago confirmado (igual que ya hace C1 en el flow de `/new-business`).

1. **Cliente** completa el form de orden → POST `/api/orders` → la orden se inserta en Supabase con `paymentStatus = 'pending'`, `status = 'pending'`.
2. Inmediatamente (non-blocking) el mismo endpoint dispara A1 al cliente con la confirmación.
3. **Equipo** verifica los 3 nombres en Sunbiz manualmente desde `/admin/orders/[id]`.
4. Si **todos tomados** → admin dispara `sendAllNamesTaken` → A2 + A3 en paralelo.
5. **Cliente** responde con nuevos nombres → equipo retoma → si admin encuentra alternativas en Sunbiz → `sendSuggestNames` (A4).
6. Cuando el equipo presenta al Estado → admin marca `filed` → `sendOrderProcessed` (A5).
7. Cuando Florida aprueba → admin marca `approved` → `sendOrderApproved` (A6).
8. Equipo descarga el certificate del estado → admin sube PDF desde `/admin/orders/[id]` → `sendCertificateDelivery` (A7) → orden pasa a `completed`.

---

## Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/orders` | Crea orden + dispara A1. |
| POST | `/api/webhooks/stripe` | Stripe webhook — dispara A1 o C1 + C2 según flow. |
| POST | `/api/proxy/notifications/[type]` | Disparador interno del admin — type: `order-confirmation` (A1), `all-names-taken` (A2+A3), `suggest-names` (A4), `order-processed` (A5), `order-approved` (A6), `certificate` (A7). |
| POST | `/api/campaigns/send` | Marketing — dispara B1. |
| POST | `/api/contact` | Form público — dispara D1. Rate limited 5/h/IP. |
| POST | `/api/admin/upload-certificate` | Sube PDF a Supabase Storage + dispara A7. |

---

## Archivos clave

- **`backend/app/api/orders/route.ts`** — endpoint que **dispara A1 inline** al crear la orden. Tiene su propio Resend.emails.send con template propio (NO usa `lib/notifications.ts`). FROM y Reply-To leen de las env vars centralizadas.
- `backend/lib/notifications.ts` — funciones transaccionales A2–A7 + función dormida `sendOrderConfirmation` (no se llama desde ningún lado, código legacy). Las copias de Railway/Express fueron eliminadas en commit `c7bdc07` (2026-05-18).
- `backend/app/api/contact/route.ts` — form de contacto D1 + validación + rate limit.
- `backend/app/api/campaigns/send/route.ts` — campañas B1.
- `backend/app/api/webhooks/stripe/route.ts` — C1 + C2 (flow `/new-business`).
- `backend/app/api/proxy/notifications/[type]/route.ts` — endpoints internos para disparar A2–A7 desde admin.
- `backend/lib/rate-limit.ts` — `checkContactRateLimit()` para D1 (5/h por IP).

---

## Sistema de Unsubscribe

### Footer en emails transaccionales

Cada email a cliente incluye `unsubscribeFooter(email)` con:
- Texto: "This is a transactional email related to your order with opabiz.com."
- Link a `/unsubscribe?email={email}` para opt-out (`encodeURIComponent` aplicado al query string).
- Mención de `support@opabiz.com` como canal de soporte.

### Página `/unsubscribe`

- Archivo: `backend/app/unsubscribe/page.tsx`.
- Muestra el email del cliente y pide confirmación.
- "Yes, unsubscribe me" → POST `/api/unsubscribe` → marca email en Supabase.
- "Keep receiving updates" → regresa al home.

### Comportamiento

- Los emails de **confirmación de orden, certificate y alertas críticas** se envían **siempre** (son transaccionales legítimas, no se filtran por unsubscribed).
- Los emails de **marketing (B1)** sí respetan la lista de unsubscribed antes de enviar.

---

## Checklist post-cambio de cuenta Resend (2026-06-19)

- [x] Cuenta nueva de Resend creada (cuenta de OpaBiz).
- [x] Dominio `opabiz.com` verificado en Resend.
- [x] Buzones Zoho creados: `noreply@`, `marketing@`, `info@`, `admin@`, `support@`.
- [x] `RESEND_API_KEY` actualizada en Vercel (Production).
- [x] 6 env vars nuevas seteadas en Vercel (Production + Development).
- [x] Código centralizado: hardcoded `onboarding@resend.dev` y `aneurysoto@gmail.com` reemplazados por env vars con fallback seguro.
- [x] `replyTo` agregado en los 12 sends del proyecto (1 en /api/orders + 7 en notifications.ts + 2 en stripe + 1 en campaigns + 1 en contact).
- [x] **Fix `/api/orders` (commit `36db324`)** — se había pasado en la auditoría original porque su send es inline (no llamaba a notifications.ts). Las órdenes nuevas creaban OK pero el email de confirmación fallaba en silencio.
- [x] **Fix bug `rate.allowed` → `rate.success` en /api/contact (commit `5e63db8`)** — el endpoint del form rechazaba TODAS las requests con 429 sin importar IP. Bug introducido al crear el endpoint.
- [ ] Preview env vars (bug del CLI — setear manualmente en dashboard si se necesitan PR previews funcionales).
- [ ] Test E2E: hacer una orden de prueba real, verificar que confirmación llega a cliente desde `noreply@opabiz.com`.
- [ ] Test contact form en producción.
- [ ] Limpiar `sendOrderConfirmation()` dormida en `lib/notifications.ts` o consolidar el template de `/api/orders` para que apunte a ella.

---

## Pendientes / mejoras futuras

- [ ] **Email con contrato PDF adjunto** — pendiente hasta Etapa 6 (generación de documentos).
- [ ] **Upgrade a Resend Pro $20/mes** — solo cuando se acerque a 100 emails/día o se necesiten Audiences para drip campaigns.
- [ ] **Recordatorios automáticos 24h antes de citas agendadas** (requiere cron job — Vercel Cron o Upstash QStash).
- [ ] **Webhook de bounce/complaint de Resend** — registrar en Supabase para auditoría de deliverability.
- [ ] **Sentry alert si una función de email falla** — actualmente solo log a console.
- [ ] **WhatsApp Business API como canal adicional** — opcional, post-launch.

---

## Notas históricas

- **2026-05-13:** Handlers de emails manuales migrados de Railway/Express a Vercel/Supabase REST (commit `a5e1d45`). Endpoint `/api/proxy/notifications/[type]` ya NO pasa por Railway.
- **2026-05-18:** Eliminada copia muerta de notifications en Express (commit `c7bdc07`). `backend/lib/notifications.ts` es ahora canónica.
- **2026-06-19:** Migración a cuenta Resend de OpaBiz + centralización de FROM/Reply-To/alerts en env vars (commit `d7f9c68`). Página `/contact` + endpoint `/api/contact` creados (commit `369eb9b`). Doc actualizado.
- **2026-06-19 (continuación):** Fix bug `rate.allowed` → `rate.success` en `/api/contact` (commit `5e63db8`) — el endpoint rechazaba todas las requests con 429. Fix env vars en `/api/orders/route.ts` (commit `36db324`) — su send inline se había pasado en la migración inicial y seguía con `onboarding@resend.dev` hardcoded. Documentada la situación de `sendOrderConfirmation()` dormida en notifications.ts.
