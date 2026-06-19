# Proceso 2 — Emails Automáticos (Resend)

## Lista rápida — qué email, desde dónde, qué ve el destinatario

1. **Confirmación de orden** llega al cliente desde `noreply@opabiz.com` → cliente ve **OpaBiz**
2. **🆕 NUEVA ORDEN CREADA** (alerta interna) llega al equipo (`alert@opabiz.com`) desde `noreply@opabiz.com` → admin ve **OpaBiz Alerts** *(notifica cada nueva orden con datos del cliente y link al panel admin)*
3. **Nombres tomados** llega al cliente desde `support@opabiz.com` → cliente ve **OpaBiz Support** *(requiere que el cliente conteste con nuevos nombres)*
4. **Sugerencias de nombres** llega al cliente desde `support@opabiz.com` → cliente ve **OpaBiz Support** *(requiere que el cliente confirme cuál prefiere)*
5. **Orden procesada (filed)** llega al cliente desde `noreply@opabiz.com` → cliente ve **OpaBiz**
6. **Orden aprobada por Florida** llega al cliente desde `noreply@opabiz.com` → cliente ve **OpaBiz**
7. **Certificate of Formation** llega al cliente desde `noreply@opabiz.com` → cliente ve **OpaBiz**
8. **Alerta de nombres tomados** llega al equipo (`alert@opabiz.com`) desde `noreply@opabiz.com` → admin ve **OpaBiz Alerts**
9. **Alerta de nueva orden NBL (Stripe)** llega al equipo (`alert@opabiz.com`) desde `noreply@opabiz.com` → admin ve **OpaBiz Alerts**
10. **Confirmación NBL (pago Stripe)** llega al cliente desde `noreply@opabiz.com` → cliente ve **OpaBiz**
11. **Mensaje del form de contacto** llega al admin (`info@opabiz.com`) desde `noreply@opabiz.com` → admin ve **OpaBiz Contact** *(Reply-To = email del visitor, si admin le da Responder va directo al cliente)*
12. **Confirmación al visitor del form** llega al visitor desde `noreply@opabiz.com` → visitor ve **OpaBiz**

---

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
| `alert@opabiz.com` | **TO** de TODAS las alertas internas: nueva orden creada (A0), nombres tomados (A3), nueva orden NBL Stripe (C2). Buzón único de alertas del equipo. |
| `support@opabiz.com` | Mencionado en footers de emails como canal de soporte alternativo. |

### Convención de la industria aplicada

- **FROM con Display Name "OpaBiz"**: sin esto, el cliente ve `noreply` o `marketing` en su inbox y no sabe de quién es. Con el formato `OpaBiz <noreply@opabiz.com>` el cliente ve **"OpaBiz"** como remitente y el email queda visualmente atado a la marca.
- **FROM noreply@** señaliza "automático del sistema"; el cliente no se confunde respondiendo al buzón equivocado.
- **FROM support@ para emails que requieren respuesta del cliente** (A2 nombres tomados, A4 sugerencias): el display "OpaBiz Support" y el email `support@` dejan clarísimo que pueden contestarnos directo.
- **Marketing FROM separado**: si una campaña recibe spam complaints, Resend penaliza la reputación de ese FROM. Al separarlo, NUNCA cae la reputación de los emails transaccionales (que son los críticos — confirmación de pago, certificado, etc.). Es el patrón de Stripe, GitHub, Linear, etc.
- **Reply-To info@**: cuando el cliente responde al email automático, llega a un buzón leído. Sin Reply-To, la respuesta cae en `noreply@` que nadie chequea.
- **Alertas internas dentro del dominio Zoho**: si mañana cambia el founder o se suma equipo, no hay emails colgando en Gmail personales.
- **Subject prefijado con "OpaBiz:"**: en clientes de correo como Gmail mobile, el inbox muestra primero el remitente y después el subject. Con "OpaBiz:" en el subject el cliente reconoce instantáneamente de qué empresa es, incluso si el From por alguna razón se ve raro.

---

## Variables de entorno

Setear en Vercel **(Production + Preview + Development)** y replicar en `backend/.env.local` para dev. Si una var falta, el código degrada a un fallback seguro pero el deploy productivo siempre debe tener las 6.

| Variable | Valor | Usada en |
|---|---|---|
| `RESEND_API_KEY` | API key de Resend (cuenta OpaBiz) | Todos los emails |
| `RESEND_FROM_TRANSACTIONAL` | `noreply@opabiz.com` | 6 emails de órdenes + Stripe webhook + contact form (fallback) |
| `RESEND_FROM_MARKETING` | `marketing@opabiz.com` | Campañas |
| `RESEND_FROM_SUPPORT` | `support@opabiz.com` | Emails que **requieren respuesta del cliente** (A2 names taken, A4 sugerencias) |
| `RESEND_REPLY_TO` | `info@opabiz.com` | TODOS los emails |
| `INTERNAL_ALERT_EMAIL` | `alert@opabiz.com` | TODAS las alertas internas: A0 nueva orden creada, A3 nombres tomados, C2 nueva orden NBL Stripe |
| `CONTACT_FROM_EMAIL` | `noreply@opabiz.com` | Form de contacto (override de RESEND_FROM_TRANSACTIONAL si querés un FROM distinto solo para contact) |
| `CONTACT_TO_EMAIL` | `info@opabiz.com` | Form de contacto |

**Nota sobre Preview:** Vercel CLI tiene un bug con preview branches que requiere setear manualmente desde el dashboard. Production + Development se setean perfecto via CLI.

---

## Los emails que envía el sistema

### A — Transaccionales de órdenes (6 funciones en `backend/lib/notifications.ts`)

Todos van DESDE `RESEND_FROM_TRANSACTIONAL` con Reply-To `RESEND_REPLY_TO`.

#### A0. Alerta "🆕 NUEVA ORDEN CREADA" → EQUIPO
- **Cuándo:** Inmediatamente después de A1, cuando POST `/api/orders` inserta la orden en Supabase.
- **Destinatario:** `INTERNAL_ALERT_EMAIL` = `alert@opabiz.com` (buzón Zoho del equipo).
- **FROM:** `OpaBiz Alerts <noreply@opabiz.com>`.
- **Subject:** `OpaBiz Alerts: 🆕 NUEVA ORDEN CREADA — {companyName}`.
- **Implementación:** Inline en `backend/app/api/orders/route.ts`, fire-and-forget en paralelo al A1.
- **Contenido:** Banner verde, tabla con FBFC- número, datos del cliente (nombre, email, empresa), entity type, paquete, filing speed, **botón directo al panel admin de la orden** (`/admin/orders/{id}`).
- **Por qué existe:** El equipo quería saber al instante cuando entra una orden nueva, sin tener que estar refrescando el panel admin.

#### A1. Confirmación de Orden → CLIENTE
- **Cuándo:** Al recibir POST a `/api/orders` (form de orden completado por el cliente). No espera al pago Stripe — se envía apenas la orden se inserta en Supabase.
- **Destinatario:** `order.email` (cliente).
- **Implementación:** **Inline en `backend/app/api/orders/route.ts`** — el send está dentro del propio endpoint con su propio template HTML. La versión inline es la que se ejecuta automáticamente. **También** existe `sendOrderConfirmation()` en `lib/notifications.ts` que se usa para el **reenvío manual desde el panel admin** (botón "🔁 Reenviar Confirmación de Orden") — ya NO está dormida.
- **Contenido:** Resumen de la orden, número de orden (`FBFC-XXXXXXXX`), próximos pasos, link a soporte WhatsApp.
- **Subject:** `OpaBiz: ✅ Your Florida LLC order is in — {companyName}`
- **⚠️ Templates ligeramente distintos:** la versión inline (`/api/orders`) y la de `sendOrderConfirmation()` tienen pequeñas diferencias visuales. Consolidar en una sola fuente es trabajo pendiente.

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
- **FROM:** `OpaBiz Contact <noreply@opabiz.com>` (display name + email).
- **TO:** `CONTACT_TO_EMAIL` = `info@opabiz.com`.
- **Reply-To:** El email del visitor (sobreescribe el reply-to default) — para responder con un click sin copiar/pegar.
- **Subject:** `OpaBiz Contact: {subject elegido del select}`.
- **Rate limit:** 5/h por IP (anti-spam, función `checkContactRateLimit` en `backend/lib/rate-limit.ts`).
- **Validación:** name, email válido, subject, message mínimo 5 chars. Límites máximos defensivos por campo contra payload abuse.

#### D2. Confirmación al Visitor → VISITOR
- **Cuándo:** Inmediatamente después de D1 (non-blocking — si D2 falla, D1 ya llegó al admin y la response al browser sigue siendo `success: true`).
- **FROM:** `OpaBiz <noreply@opabiz.com>`.
- **TO:** Email del visitor.
- **Reply-To:** `info@opabiz.com` (si el visitor responde, va al buzón Zoho monitoreado).
- **Subject:** `OpaBiz: ✅ We got your message — we'll respond within 24 hours`.
- **Contenido:** Saludo personalizado con el nombre del visitor, copia del subject y mensaje original (constancia en su inbox), promesa de respuesta en 24h hábiles, link a WhatsApp para casos urgentes.
- **Por qué es importante:** Sin esto, el visitor solo ve el panel verde "Got it" en pantalla y nunca recibe nada en su inbox — eso genera dudas ("¿llegó? ¿lo van a leer?"). Con D2 tiene constancia tangible y conoce el SLA de 24h.

---

## Resumen completo de destinatarios

| Email | Tipo | Display Name | FROM | TO | Reply-To | Subject |
|---|---|---|---|---|---|---|
| A0 NUEVA ORDEN CREADA | Interno | **OpaBiz Alerts** | noreply@ | alert@ | info@ | `OpaBiz Alerts: 🆕 NUEVA ORDEN CREADA — {company}` |
| A1 Confirmación orden | Transaccional | **OpaBiz** | noreply@ | cliente | info@ | `OpaBiz: ✅ Your Florida LLC order is in — {company}` |
| A2 Nombres tomados | Transaccional (requiere respuesta) | **OpaBiz Support** | support@ | cliente | info@ | `OpaBiz: ⚠️ Action needed — your name options are taken` |
| A3 Alerta nombres | Interno | **OpaBiz Alerts** | noreply@ | alert@ | info@ | `OpaBiz Alerts: 🚨 Nombres tomados — contactar cliente` |
| A4 Sugerencias | Transaccional (requiere respuesta) | **OpaBiz Support** | support@ | cliente | info@ | `OpaBiz: ✅ We found available names for your LLC` |
| A5 Procesada | Transaccional | **OpaBiz** | noreply@ | cliente | info@ | `OpaBiz: 📋 Your Florida filing is in — {company}` |
| A6 Aprobada | Transaccional | **OpaBiz** | noreply@ | cliente | info@ | `OpaBiz: 🎉 Florida approved your business — {company}` |
| A7 Certificate | Transaccional | **OpaBiz** | noreply@ | cliente | info@ | `OpaBiz: 🏆 Your Articles of Organization are ready — {company}` |
| B1 Carta QR | Marketing | **OpaBiz** | marketing@ | lead | info@ | `OpaBiz: Business Compliance Notice — {company}` |
| C1 Confirmación NBL | Transaccional | **OpaBiz** | noreply@ | cliente | info@ | `OpaBiz: ✅ Payment confirmed — {company}` |
| C2 Alerta nueva orden NBL | Interno | **OpaBiz Alerts** | noreply@ | alert@ | info@ | `OpaBiz Alerts: 🆕 Nueva orden New Business Letter` |
| D1 Contact form al admin | Visitor → admin | **OpaBiz Contact** | noreply@ | info@ | email del visitor | `OpaBiz Contact: {subject del visitor}` |
| D2 Confirmación al visitor | Transaccional | **OpaBiz** | noreply@ | visitor | info@ | `OpaBiz: ✅ We got your message — we'll respond within 24 hours` |

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
| POST | `/api/proxy/notifications/[type]` | Disparador interno del admin — type: `order-confirmation` (**reenvío manual de A1**), `names-taken` (A2+A3), `suggest-names` (A4), `order-processed` (A5), `order-approved` (A6), `certificate` (A7). |
| POST | `/api/campaigns/send` | Marketing — dispara B1. |
| POST | `/api/contact` | Form público — dispara D1. Rate limited 5/h/IP. |
| POST | `/api/admin/upload-certificate` | Sube PDF a Supabase Storage + dispara A7. |

### Botón "Reenviar Confirmación de Orden" (commit `1ba8b12`)

En `/admin/orders/[id]` hay un botón azul **🔁 Reenviar: Confirmación de Orden** que dispara `POST /api/proxy/notifications/order-confirmation` y reenvía A1 al cliente.

**¿Cuándo se usa?** El send original de A1 en `/api/orders/route.ts` es **fire-and-forget** (`.catch(err => console.error(...))`) — el endpoint responde 201 sin esperar a Resend. En Vercel serverless, si el Promise tarda más de unos ms en completar, el container puede matarse y el Promise queda colgado sin completar. Resultado: la orden se guarda en Supabase pero **el email nunca llega a Resend** (ni Delivered ni Failed). Este botón rescata esos casos sin recrear la orden.

**Implementación**: usa la función `sendOrderConfirmation()` de `lib/notifications.ts` (que antes estaba dormida — ahora tiene un consumidor real). Audit log registra `email.order-confirmation-resent`.

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
- [x] **Display Names + Subjects con "OpaBiz"** en todos los 12 emails. El cliente ahora ve "OpaBiz" como remitente en su inbox (antes veía solo `noreply` o `marketing`).
- [x] **Nuevo email D2 de confirmación al visitor** del form de contacto — antes solo veían el panel verde en pantalla, ahora reciben constancia en su inbox con la promesa de respuesta en 24h.
- [x] `RESEND_FROM_SUPPORT = support@opabiz.com` seteado en Vercel para A2 y A4 (emails que requieren respuesta del cliente).
- [ ] Preview env vars (bug del CLI — setear manualmente en dashboard si se necesitan PR previews funcionales).
- [ ] Test E2E: hacer una orden de prueba real, verificar que confirmación llega a cliente desde "OpaBiz <noreply@opabiz.com>".
- [ ] Test contact form: verificar que llegan D1 al admin Y D2 al visitor.
- [x] **`sendOrderConfirmation()` ya NO está dormida** — la usa el endpoint nuevo `order-confirmation` desde el botón de reenvío del admin (commit `1ba8b12`). Pendiente: consolidar el template inline de `/api/orders` con el de notifications.ts (ahora son 2 templates levemente distintos).

---

## Pendientes / mejoras futuras

- [ ] **Email con contrato PDF adjunto** — pendiente hasta Etapa 6 (generación de documentos).
- [ ] **Upgrade a Resend Pro $20/mes** — solo cuando se acerque a 100 emails/día o se necesiten Audiences para drip campaigns.
- [ ] **Recordatorios automáticos 24h antes de citas agendadas** (requiere cron job — Vercel Cron o Upstash QStash).
- [ ] **Sistema de alertas si Resend no envía un email** — discutido el 2026-06-19 pero **pospuesto** por decisión del founder (no over-engineerear por un caso edge que ocurrió 1 sola vez). El botón "Reenviar Confirmación de Orden" en el panel admin cubre el rescate manual. Si vuelve a pasar más seguido, retomar este plan:

  **Escenarios a cubrir:**
  - **Escenario A** — Resend recibe el send pero falla la entrega (bounce, email inválido, dominio bloqueado, complaint). Resend lo sabe pero nosotros no nos enteramos a menos que entremos al dashboard.
  - **Escenario B** — Resend nunca recibe el send (race condition Vercel serverless mató el container antes de que el fire-and-forget completara). El caso real fue la orden **FBFC-EC1DCF38** (Pepe Prueba / jrfabian2011@gmail.com).

  **3 opciones evaluadas:**
  1. **Webhook de Resend** → endpoint `POST /api/webhooks/resend` que reciba eventos (`email.bounced`, `email.complained`, `email.delivery_delayed`). Cuando es bounce/complaint, dispara alerta a `alert@opabiz.com`. **Cubre Escenario A**. Costo: bajo (1 endpoint + config en Resend dashboard).
  2. **Sentry en los `.catch`** → enriquecer `console.error` con `Sentry.captureException(err, { extra: {...} })`. Sentry ya está configurado en el proyecto (ver doc `14_sentry_monitoreo_errores.md`). **Captura excepciones explícitas** pero NO captura race conditions porque el Promise nunca rechaza — se mata silenciosamente con el container.
  3. **Cambiar fire-and-forget a `await`** en sends críticos (A0, A1) → garantía 100% de envío o error visible. **Cubre Escenario B**. Costo: +300-500ms en POST /api/orders.

  **Solución profesional industria-standard si se retoma:** opción 1 + opción 2 (95% de cobertura). Para el 5% restante (race condition exacto) queda el botón de reenvío.
- [ ] **WhatsApp Business API como canal adicional** — opcional, post-launch.

---

## Notas históricas

- **2026-05-13:** Handlers de emails manuales migrados de Railway/Express a Vercel/Supabase REST (commit `a5e1d45`). Endpoint `/api/proxy/notifications/[type]` ya NO pasa por Railway.
- **2026-05-18:** Eliminada copia muerta de notifications en Express (commit `c7bdc07`). `backend/lib/notifications.ts` es ahora canónica.
- **2026-06-19:** Migración a cuenta Resend de OpaBiz + centralización de FROM/Reply-To/alerts en env vars (commit `d7f9c68`). Página `/contact` + endpoint `/api/contact` creados (commit `369eb9b`). Doc actualizado.
- **2026-06-19 (continuación):** Fix bug `rate.allowed` → `rate.success` en `/api/contact` (commit `5e63db8`) — el endpoint rechazaba todas las requests con 429. Fix env vars en `/api/orders/route.ts` (commit `36db324`) — su send inline se había pasado en la migración inicial y seguía con `onboarding@resend.dev` hardcoded. Documentada la situación de `sendOrderConfirmation()` dormida en notifications.ts.
- **2026-06-19 (sesión tarde):** Display Names + Subjects con "OpaBiz" en los 12 emails (antes el cliente veía solo `noreply` o `marketing` en su inbox sin saber de qué empresa era). Agregado email D2 — confirmación al visitor del form de contacto que antes nunca recibía nada en su inbox. Nueva env var `RESEND_FROM_SUPPORT = support@opabiz.com` para A2 (nombres tomados) y A4 (sugerencias) que requieren respuesta del cliente — display "OpaBiz Support" deja claro que pueden contestar.
- **2026-06-19 (sesión noche):** `names-taken` acepta 1+ nombres en lugar de exigir 3 (commit `601abaa`) — antes daba 400 si el cliente había puesto solo 1 nombre en la orden. Templates de A2 y A3 adaptan singular/plural. Nuevo botón "🔁 Reenviar Confirmación de Orden" en `/admin/orders/[id]` (commit `1ba8b12`) para rescatar casos donde el send fire-and-forget de A1 se perdió por race condition en Vercel serverless (orden FBFC-EC1DCF38 fue el caso real que motivó esto).
- **2026-06-19 (final):** Nueva alerta A0 "🆕 NUEVA ORDEN CREADA" cada vez que entra una orden (commit `f3fc1cf`). `INTERNAL_ALERT_EMAIL` movido de `admin@opabiz.com` a `alert@opabiz.com` para centralizar A0 + A3 + C2 en un buzón único de alertas del equipo. Template verde con botón directo al panel admin de la orden.
