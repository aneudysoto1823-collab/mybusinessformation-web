# MyBusinessFormation — Arquitectura y Flujo de Procesos

> Documento maestro que explica cómo se conectan todos los servicios del stack
> y cuál es el rol específico de cada uno en el ciclo de vida de una orden.

**Última actualización:** 2026-05-13
**Decisión arquitectural:** Vercel-first con Railway dedicado exclusivamente a Etapa 5 (Sunbiz).

---

## 1. Visión general del stack

### Servicios y su rol

| Servicio | Rol único | Cuándo se usa |
|----------|-----------|---------------|
| **Vercel** (Next.js 16) | Aplicación principal — frontend + API routes + lógica de negocio | 99% del tráfico del proyecto |
| **Supabase** | Base de datos PostgreSQL + Storage de PDFs | Persistencia de órdenes, clientes y documentos |
| **Stripe** | Procesamiento de pagos + webhook | Solo en el flujo de landing `/new-business` (Etapa 16). Wizard tradicional aún no integra Stripe (Etapa 4 pendiente) |
| **Resend** | Envío de emails transaccionales | Todas las comunicaciones email |
| **Railway** (Express) | RESERVADO para Etapa 5 (Sunbiz) — base de 3.5M registros + cron nocturno | Solo cuando se implemente búsqueda Sunbiz |
| **Upstash Redis** | Rate limiting del login admin | Cuando alguien intenta loguearse al panel admin |

**Nota sobre Auth:** el proyecto NO usa Supabase Auth. Tanto el login admin como el portal cliente tienen autenticación custom (JWT con `jose` + bcrypt para admin; matching de email + número FBFC para portal). Supabase se usa solo como base de datos y storage.

### Diagrama de comunicación actual

```
                          CLIENTE (navegador)
                                 │
                                 ▼
                          ┌─────────────┐
                          │   VERCEL    │ ← Next.js sirve todo
                          │  (Next.js)  │
                          └──────┬──────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
        │  SUPABASE   │  │   STRIPE    │  │   RESEND    │
        │  (DB + S3)  │  │  (pagos)    │  │  (emails)   │
        └─────────────┘  └─────────────┘  └─────────────┘

        ┌─────────────────────────────────────────────┐
        │  RAILWAY (Express)                          │
        │  ────────────────────────────────────────   │
        │  DORMIDO hoy.                               │
        │  Reservado para Etapa 5 (Sunbiz):           │
        │    - Importar 3.5M registros via FTP        │
        │    - Cron nocturno de actualización         │
        │    - Búsqueda con detección de similares    │
        └─────────────────────────────────────────────┘
```

**Nota importante:** Railway NO es usado en ninguno de los flujos descritos abajo. Su única razón de existir hoy es estar listo para Etapa 5.

---

## 2. FLUJO 1 — Cliente crea una orden

Existen **dos paths distintos** para crear una orden, según por dónde entra el cliente.

### Flujo 1A — Wizard tradicional (formación LLC/Corp, core del negocio)

Este es el path principal: cliente entra al home y arranca el wizard de formación.

#### 1A.1 — Cliente entra a MBF

- Cliente abre `https://mybusinessformation.com`.
- **Vercel** sirve el sitio (Next.js 16).
- Cliente ve los paquetes en la sección `/#pricing`.

#### 1A.2 — Cliente llena el formulario

- Cliente hace click en un paquete (Basic $49 / Standard $149 / Premium $249).
- Se abre el wizard de formación.
- Cliente llena los datos:
  - 3 nombres de empresa deseados (`companyName`, `companyName2`, `companyName3`).
  - Tipo de entidad: LLC o Corporación.
  - Datos personales (nombre, dirección, teléfono, email).
  - Add-ons opcionales (EIN, Operating Agreement, ITIN, Annual Report).
  - Tipo de Agente Registrado.
- **Mientras llena:** los datos viven solo en el estado del navegador. Nada se guarda todavía.

#### 1A.3 — Cliente envía el formulario

- Cliente hace click en "Submit".
- **Vercel** recibe el POST en `backend/app/api/orders/route.ts`.
- Vercel inserta la orden en Supabase vía REST API con:
  - `status: 'pending'`
  - `paymentStatus: 'pending'`
- Vercel dispara email de confirmación al cliente vía Resend (non-blocking).

#### 1A.4 — Estado actual del cobro (Etapa 4 pendiente)

- **Stripe NO está integrado al wizard tradicional todavía.** Etapa 4 sigue marcada como pendiente en CONTEXTO.md.
- Cuando se complete Etapa 4, este flujo se va a extender para que el wizard genere una sesión de Stripe Checkout antes de crear la orden definitiva, o que el webhook de Stripe sea quien actualice `paymentStatus` a `paid`.

#### 1A.5 — Cliente recibe confirmación

- El email llega al cliente con:
  - Su número FBFC (Florida Business Formation Confirmation).
  - Resumen de su orden.
  - Link al portal cliente para hacer seguimiento.

### Flujo 1B — Landing `/new-business` (Etapa 16, marketing automation)

Este es el path de "New Business Letter": el cliente entra desde un QR code o email de campaña y compra servicios adicionales (Labor Law Poster, EIN, Certificate of Status, Bundle).

#### 1B.1 — Cliente entra desde QR o email de campaña

- Cliente escanea QR o hace click en email recibido.
- **Vercel** registra el scan en la tabla `qr_scans` de Supabase.
- Vercel redirige a `https://mybusinessformation.com/new-business?id=<document_id>`.

#### 1B.2 — Cliente selecciona servicios

- La landing auto-busca la empresa por `document_id` (DB local primero, fallback a scraping Sunbiz).
- Cliente selecciona uno o varios de estos productos:
  - **Labor Law Poster 2026** — $69.99 (se renueva anualmente)
  - **EIN / Tax ID Number** — $99.99
  - **Certificate of Status (FL)** — $49.99
  - **Business Essentials Bundle** (los 3) — $189.99 (ahorra $30 vs comprarlos por separado)
- Click "Pay" → **Vercel** crea sesión de **Stripe** Checkout.

#### 1B.3 — Stripe procesa el pago

- Stripe muestra su propia pantalla de pago.
- Cliente confirma.
- Stripe envía webhook a `https://mybusinessformation.com/api/webhooks/stripe`.

#### 1B.4 — Webhook crea la orden

- El endpoint corre en **Vercel** (`backend/app/api/webhooks/stripe/route.ts`).
- El webhook:
  1. **Verifica la firma** con `STRIPE_WEBHOOK_SECRET` (HMAC).
  2. **Crea la orden** en Supabase con:
     - `package: 'addon'`
     - `status: 'in_review'`
     - `paymentStatus: 'paid'`
  3. **Genera el número FBNB-XXXXXXXX** (Florida Business — New Business letter).
  4. **Actualiza** `prospective_companies.status` → `purchased`.
  5. **Envía email de confirmación** bilingüe al cliente vía Resend.
  6. **Envía alerta** a `aneurysoto@gmail.com` (admin interno).

#### 1B.5 — Cliente recibe confirmación

- Email con su número FBNB + link al portal cliente.

### Diagrama del flujo 1B

```
   QR code o email de campaña
            │
            ▼
   /api/campaigns/track-scan         ← Vercel registra scan en Supabase
            │
            ▼
   /new-business?id=<doc_id>         ← Vercel sirve landing
            │
            ▼ (cliente selecciona servicios)
   /api/sunbiz/checkout              ← Vercel crea sesión Stripe
            │
            ▼
       STRIPE Checkout                ← Cliente paga
            │
            ▼ (webhook)
   /api/webhooks/stripe              ← Vercel verifica firma HMAC
            │
            ├─→ Supabase              ← Crea Order, actualiza prospective_companies
            │                           y registra conversion
            │
            └─→ Resend                ← Email confirmación al cliente (FBNB)
                                        + Alerta interna al admin
```

### Servicios usados en FLUJO 1

| Paso | Servicio | Aplica a |
|------|----------|----------|
| Servir el sitio | Vercel | 1A + 1B |
| Datos temporales del form | Vercel (memoria del navegador) | 1A |
| Submit del wizard | Vercel | 1A |
| Procesar pago Stripe | Stripe | 1B (Etapa 4 pendiente para 1A) |
| Recibir webhook | Vercel | 1B |
| Guardar orden | Supabase | 1A + 1B |
| Enviar email confirmación | Resend | 1A + 1B |

**Railway:** NO interviene en ninguno de los dos paths.

---

## 3. FLUJO 2 — Equipo procesa la orden (panel admin)

### Paso a paso

#### 2.1 — Admin entra al panel

- Admin va a `https://mybusinessformation.com/admin`.
- **Vercel** sirve el login.
- Admin ingresa usuario + contraseña.
- **Vercel** valida contra `ADMIN_USER` y `ADMIN_PASSWORD_HASH` (bcrypt).
- Si es válido, se pide código 2FA (TOTP o email).
- **Upstash Redis** controla rate limiting (5 intentos / 15 min / IP).
- Si todo OK, se crea cookie `admin_session` con JWT.

#### 2.2 — Admin ve la lista de órdenes

- Admin entra al dashboard.
- **Vercel** consulta a **Supabase** vía REST (sin pasar por Railway).
- Muestra la tabla de órdenes con filtros por estado.

#### 2.3 — Admin abre una orden

- Click en una orden → detalle.
- **Vercel** consulta a Supabase la orden específica.
- Se muestran datos del cliente, paquete, nombres propuestos, status.

#### 2.4 — Admin verifica nombres en Sunbiz (proceso manual hoy)

> **Estado actual:** Esta búsqueda se hace MANUAL — el admin entra a `sunbiz.org` y busca uno por uno.
>
> **Estado futuro (Etapa 5):** Click en "Buscar nombres" → **Vercel** llama a **Railway** que consulta su base local de 3.5M registros.

Hoy el flujo es:
1. Admin entra a sunbiz.org manualmente.
2. Busca nombre 1. Si está libre → continúa con ese.
3. Si está tomado → busca nombre 2. Y así sucesivamente.
4. Si los 3 están tomados → admin va al paso 2.5.

#### 2.5 — Si los nombres están tomados: admin envía email "Nombres Tomados"

- Admin hace click en el botón **"Email: Nombres Tomados"**.
- **Vercel** ejecuta el endpoint `backend/app/api/proxy/notifications/[type]/route.ts` con `type=names-taken`.
  - **Nota:** el path es dinámico — un solo handler maneja los 5 tipos (`names-taken`, `certificate`, `suggest-names`, `order-processed`, `order-approved`).
- **Vercel** consulta a Supabase para obtener los datos del cliente y los 3 nombres.
- **Vercel** llama a Resend con el template de email importado de `backend/lib/notifications.ts`.
- Resend envía:
  - Email al cliente pidiendo 3 nuevos nombres.
  - Alerta interna a `aneurysoto@gmail.com`.
- El status de la orden permanece en `in_review`.

#### 2.6 — Admin avanza el status

A medida que avanza el trabajo:
- `in_review` → `filed` (documentos enviados a Florida).
- `filed` → `approved` (Florida aprobó la formación).
- `approved` → `completed` (entrega final).

Cada cambio de status:
- **Vercel** actualiza Supabase.
- Si corresponde, **Vercel** llama a Resend para mandar email de notificación.

#### 2.7 — Admin sube el Certificate of Formation

- Cuando llega el certificado del Estado, admin lo sube al panel.
- **Vercel** sube el PDF a **Supabase Storage**.
- **Vercel** actualiza la orden en Supabase con la URL del certificado.
- **Vercel** llama a Resend para enviar email final al cliente con:
  - El Certificate adjunto / linkeado.
  - Link para acceder al portal cliente.

### Servicios usados en FLUJO 2

| Paso | Servicio |
|------|----------|
| Servir panel admin | Vercel |
| Validar login | Vercel + Supabase |
| Rate limiting | Upstash Redis |
| Listar/leer órdenes | Vercel + Supabase REST |
| Actualizar status | Vercel + Supabase REST |
| Subir certificate | Vercel + Supabase Storage |
| Enviar emails manuales | Vercel + Resend |
| Buscar Sunbiz (futuro Etapa 5) | Vercel → Railway → Supabase (DB local) |

**Railway:** SOLO en el paso 2.4 cuando se implemente Etapa 5. Hoy NO interviene.

---

## 4. FLUJO 3 — Cliente recibe orden completa y accede al portal

### Paso a paso

#### 3.1 — Cliente recibe email final

- Email enviado por Resend desde Vercel (en el paso 2.7).
- Contiene:
  - Resumen de la orden completada.
  - Link al portal cliente.
  - Su número FBFC o FBNB.

#### 3.2 — Cliente abre el link del portal

- Cliente va a `https://mybusinessformation.com/client-portal`.
- **Vercel** sirve la página de login del portal.

#### 3.3 — Cliente se autentica

- Cliente ingresa:
  - Su email.
  - Su número de confirmación (FBFC-XXXXXXXX o FBNB-XXXXXXXX).
- **Vercel** valida contra Supabase (busca la orden con ese email y ese número).
- Si coincide → se crea cookie `client_session`.

#### 3.4 — Cliente accede al dashboard

- **Vercel** sirve `/client-portal/dashboard`.
- **Vercel** consulta a Supabase la información de la orden.
- Cliente ve:
  - Timeline visual de 7 pasos con estado actual resaltado.
  - Sección "What's Next" explicando próximos pasos.
  - "Your Company Details" con datos de la empresa formada.
  - Sus documentos para descargar (Certificate, EIN, Operating Agreement, etc.).
  - Botón "Contact us" → Email + WhatsApp.

#### 3.5 — Cliente descarga documentos

- Click en cualquier PDF.
- **Vercel** genera un link firmado a **Supabase Storage**.
- Cliente descarga el archivo directamente desde Supabase Storage.

### Servicios usados en FLUJO 3

| Paso | Servicio |
|------|----------|
| Servir portal | Vercel |
| Validar credenciales | Vercel + Supabase |
| Mostrar dashboard | Vercel + Supabase REST |
| Descargar documentos | Vercel + Supabase Storage |

**Railway:** NO interviene.

---

## 5. Resumen de qué hace cada servicio

### Vercel (el 99% del proyecto)

- Sirve todo el frontend público.
- Sirve el panel admin.
- Sirve el portal cliente.
- Maneja todas las API routes.
- Procesa el webhook de Stripe.
- Llama a Resend para enviar emails.
- Consulta Supabase vía REST.
- Sube/descarga de Supabase Storage.
- Genera PDFs (Operating Agreement, Articles, etc.).

### Supabase

- Base de datos PostgreSQL (todas las tablas).
- Storage para PDFs (certificates, contracts).
- Acceso vía REST API desde Vercel (sin Prisma).

### Stripe

- Procesa pagos en el flujo de landing `/new-business` (Etapa 16).
- Envía webhook a Vercel cuando se confirma pago.
- **Pendiente integrar al wizard tradicional cuando Etapa 4 se complete.**

### Resend

- Envía todos los emails transaccionales.
- Templates manejados por Vercel desde `backend/lib/notifications.ts`.
- **Pendiente:** verificar dominio `mybusinessformation.com` para enviar a cualquier destinatario (hoy Resend está en sandbox).

### Upstash Redis

- Rate limiting del login admin (5 intentos / 15 min / IP).

### Railway

- ⏸️ DORMIDO en producción actual.
- 🔮 RESERVADO para Etapa 5 (Sunbiz):
  - Servidor Express persistente.
  - Aloja la base local de 3.5M registros de Sunbiz.
  - Corre cron nocturno de actualización via FTP.
  - Expone endpoint de búsqueda con detección de similares.
  - Solo Vercel le hace fetch cuando se busca un nombre.

---

## 6. Estados de una orden

| Estado | Significado | Cuándo se setea |
|--------|-------------|-----------------|
| `pending` | Orden guardada, esperando confirmar pago | Inicio (wizard tradicional) |
| `in_review` | Pago confirmado — verificando nombres, preparando docs | Después del webhook Stripe (1B) o avance manual admin (1A) |
| `filed` | Documentos enviados al Estado de Florida | Admin lo avanza manualmente |
| `approved` | Florida aprobó — negocio formado | Admin lo avanza manualmente |
| `completed` | Certificate entregado al cliente | Admin sube el Certificate |

---

## 7. Variables de entorno por servicio

### Vercel

| Variable | Para qué |
|----------|----------|
| `SUPABASE_URL` | Conexión Supabase REST (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auth para Supabase REST (server-side) |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend → Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Frontend público |
| `STRIPE_SECRET_KEY` | API Stripe |
| `STRIPE_WEBHOOK_SECRET` | Verificar firma webhook |
| `RESEND_API_KEY` | Envío emails |
| `ADMIN_USER` | Usuario admin |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt del password admin |
| `SESSION_SECRET` | JWT firma para `admin_session` y `client_session` |
| `ENCRYPTION_KEY` | AES-256 para encriptar TOTP secret del 2FA |
| `ADMIN_EMAIL` | Email del admin para código 2FA fallback |
| `UPSTASH_REDIS_REST_URL` | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `SENTRY_DSN` | Error tracking server-side |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking client-side |
| `SENTRY_ORG`, `SENTRY_PROJECT` | Config Sentry |
| `SENTRY_EXPRESS_DSN` | (Para Railway cuando esté activo) |
| `ANTHROPIC_API_KEY` | Chat con Claudia (asistente virtual) |
| `INTERNAL_API_KEY` | Comunicación con Railway (solo cuando Etapa 5 esté activa) |

### Railway (cuando Etapa 5 esté activa)

| Variable | Para qué |
|----------|----------|
| `DATABASE_URL` | Prisma → Supabase. Si Railway permanece en IPv4 hay que usar Session Pooler; si se migra a infra con IPv6, sirve direct connection. |
| `INTERNAL_API_KEY` | Validar que el request viene de Vercel |
| `RESEND_API_KEY` | (Opcional, si emails de Sunbiz se envían desde Railway) |

---

## 8. Lecciones aprendidas (incidente del 2026-05-12)

Durante una sesión de debugging se descubrieron varios bugs apilados que confundieron el diagnóstico:

1. **Railway crasheaba** por `ts-node not found` → resuelto con refactor TS→JS (commit `002de38`, re-aplicado como `e21bcd5`).
2. **`INTERNAL_API_KEY` con `\n` invisible** en Railway → resuelto re-editando la variable a mano sin trailing whitespace.
3. **Handlers en Express esperaban payload incompleto** (`{id, email, names}`) mientras el frontend mandaba `{orderId}` → resuelto reescribiendo handlers para que resuelvan la orden desde `orderId` (commit `7669b01`).
4. **`DATABASE_URL` con contraseña con caracteres especiales** → resuelto rotando contraseña en Supabase a una compatible.
5. **Supabase Direct Connection requiere IPv6, Railway corre en IPv4** → **resuelto migrando los handlers de notifications a Vercel + Supabase REST** (commit `a5e1d45`, 2026-05-13). Se mantuvo `DATABASE_URL` en direct connection porque Railway queda dormido hasta Etapa 5.

**Aprendizaje arquitectural:** Esta cascada de bugs sucedió porque Railway estaba en una "tierra de nadie" — ni completamente usado ni eliminado. La decisión de dejar Railway dormido SOLO para Etapa 5 elimina esta ambigüedad.

**Aprendizaje de proceso:** cuando el usuario afirma que algo funcionaba antes, esa afirmación pesa. No saltar a "es la variable" sin evidencia binaria. No apilar fixes uno encima del otro sin validar cada uno aisladamente.

---

## 9. Hitos completados y próximos pasos

### Completado hasta 2026-05-13

- ✅ Migración de los 5 handlers de notifications admin de Railway/Express a Vercel/Supabase REST (commit `a5e1d45`).
- ✅ Decisión arquitectural: Railway dormido salvo Etapa 5.
- ✅ Documento de arquitectura técnica (este archivo).

### Corto plazo (próximas sesiones)

1. **Templates HTML pendientes** para `sendOrderProcessed` (status: `filed`) y `sendOrderApproved` (status: `approved`). Hoy ambas funciones son stubs vacíos en `backend/lib/notifications.ts` y `backend/modules/notifications/notifications.service.ts` — cuando el admin avanza el status, no se envía email.

2. **Verificar dominio** `mybusinessformation.com` en Resend para salir del modo sandbox. Lo trabaja Aneudys (el socio Fabián).

3. **Limpiar `backend/modules/`** del código que ya no se usa:
   - Eliminar `notifications.route.ts` y `notifications.service.ts` de Express (código no alcanzado desde el admin).
   - Eliminar `orders/`, `clients/`, `payments/` (verificar usos antes de borrar).
   - Mantener `names/` para Etapa 5 (Sunbiz).

4. **Documentar oficialmente** en CONTEXTO.md que Railway queda en standby hasta Etapa 5.

### Medio plazo

1. Implementar **Etapa 4** (Stripe integrado al wizard tradicional).
2. Implementar **Etapa 5** (Sunbiz) en Railway con su propósito claro.
3. Implementar **Etapa 6** (Documentos automáticos generados en Vercel).

### Largo plazo

1. **Etapa 18** (OPABIZ) — integración con sistema de gestión de empleados (ver `LOGICA_DE_NEGOCIO/17_opabiz_integracion.md` y la sección 10 abajo).

---

## 10. Integración futura con OPABIZ (Etapa 18, en desarrollo)

OPABIZ es la aplicación interna de Florida Business Formation Center que va a gestionar y asignar órdenes a los empleados. Cuando un cliente paga en MBF, la orden hoy queda en `in_review` esperando que el admin la procese manualmente desde el panel. Con OPABIZ, esa orden se va a derivar automáticamente a un empleado calificado para procesarla.

### Cómo se va a conectar OPABIZ con el flujo actual

```
   Cliente paga en MBF (Flujo 1A o 1B)
            │
            ▼
   Order creada en Supabase                    ← sin cambios respecto a hoy
            │
            ▼ (trigger nuevo)
   Supabase Trigger / Edge Function            ← NUEVO en Etapa 18
            │
            ▼
   Inserta en tabla `ordenes_opabiz`           ← tabla nueva, ya creada
            │
            ▼
   Motor de asignación (Edge Function)         ← NUEVO en Etapa 18
   (disponibilidad, nivel, puntaje, etc.)
            │
            ▼
   Empleado óptimo seleccionado
            │
            ▼
   Notificación al empleado (Push / WhatsApp)  ← NUEVO en Etapa 18
            │
            ▼
   Empleado procesa la orden en app OPABIZ
            │
            ▼
   Status sync de vuelta a tabla `Order`       ← actualiza MBF
   (sincronizacion bidireccional)
```

### Qué cambia en MBF cuando OPABIZ entre en producción

- **El panel admin de MBF se vuelve secundario.** Las órdenes se procesan principalmente desde la app OPABIZ. El panel admin queda como vista de supervisión + casos de excepción.
- **Los estados de la orden** (`pending → in_review → filed → approved → completed`) siguen igual, pero los transiciona el empleado vía OPABIZ, no manualmente desde el panel admin.
- **Los emails al cliente** se siguen enviando vía Resend desde Vercel — sin cambios en ese flujo.

### Qué NO cambia

- El flujo de creación de la orden (1A y 1B descritos arriba) permanece idéntico.
- La base de datos compartida (Supabase) es la misma — solo se agregan tablas para OPABIZ (`ordenes_opabiz`, `usuarios`, `empleado_perfil`, `puntajes`, etc.).
- El portal cliente (Flujo 3) no se ve afectado.

### Stack de OPABIZ

- **Base de datos:** Supabase PostgreSQL (mismo proyecto que MBF).
- **Lógica:** Supabase Edge Functions.
- **Panel admin de OPABIZ:** Next.js (web).
- **App de empleado:** PWA o Expo (a definir).
- **Storage:** buckets nuevos en Supabase (`opabiz-documentos`, `opabiz-certificados`).

### Estado actual (Etapa 18 — en desarrollo)

- ✅ Tablas creadas en Supabase (Etapa 1 de OPABIZ).
- ❌ RLS pendiente.
- ❌ Edge Functions de asignación pendientes.
- ❌ Panel admin de OPABIZ pendiente.
- ❌ App empleado pendiente.
- ❌ Trigger de sincronización MBF → OPABIZ pendiente.

Ver detalle completo en `LOGICA_DE_NEGOCIO/17_opabiz_integracion.md`.

---

**Fin del documento.**
