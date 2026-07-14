# CLAUDE.md — OpaBiz Web

Guía de referencia rápida para Claude. Describe el estado actual del sistema, arquitectura, convenciones y decisiones establecidas.

---

## Identidad de marca (actualizado 2026-06-08)

- **Dominio:** `opabiz.com` (antes `mybusinessformation.com`)
- **Marca visible:** OpaBiz — logo "OB" circular navy, "Opa" en navy + "Biz" en azul (#2563EB)
- **Entidad legal:** Florida Business Formation Center (se mantiene en documentos legales, términos, privacidad y cartas físicas)
- **DBA disclosure en términos/privacidad:** "OpaBiz is a trade name of Florida Business Formation Center."
- **Footer Important Notice:** "OpaBiz is a trade name of Florida Business Formation Center — a professional document preparation..."
- **`NEXT_PUBLIC_URL`:** `https://opabiz.com` — configurado en Vercel env vars

---

## Arquitectura general

El sistema tiene **dos servidores separados**:

| Capa | Stack | Deploy |
|---|---|---|
| **Frontend + API pública** | Next.js 16 (App Router) | Vercel |
| **Backend interno** | Express + TypeScript | Railway |

El código de ambos vive en `backend/`. El servidor Express está en `backend/server.ts` y sus módulos en `backend/modules/`. El Next.js app está en `backend/app/`.

La comunicación de Next.js → Express se hace vía `backendFetch()` (`lib/backend.ts`), que añade automáticamente el header `x-api-key` con `INTERNAL_API_KEY`.

---

## Base de datos

**Supabase PostgreSQL accedido vía REST (sin Prisma):**

- **Supabase client** (`lib/supabase.ts`): HTTP client único para todo el proyecto. Siempre lazy-init via `getSupabaseAdmin()` (service role key, bypasa RLS). Prisma fue removido el 2026-05-19 — la única tabla con uso intensivo (`Order`) se accede ahora via REST como el resto.

Variables de entorno para DB:
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` / `DIRECT_URL` quedaron como legacy en Vercel — pueden borrarse manualmente del dashboard cuando convenga.

### Modelo Order

```
Order {
  id              String   // cuid() — los primeros 8 chars son el FBFC del cliente
  firstName, lastName, email, phone, country
  companyName              // único nombre desde 2026-06-22 (ver /terms §14 + flujo nuevo abajo)
  companyName2, companyName3  // LEGACY — siempre null en órdenes nuevas. Schema los conserva
                              //          para órdenes pre-2026-06-22 (backwards compat).
  entityType      // 'llc' | 'corp'
  speed           // 'standard' | 'expedited'
  package         String   // nombre del paquete o 'addon' (marketing)
  amount          Float
  members         Json?    // array de miembros/agentes
  addons          Json?    // {ein, oa, itin, ar}
  stripePaymentId String?
  paymentStatus   // 'pending' | 'paid'
  status          // pending → in_review → ready_to_file → filed → approved → completed
                  // (names_taken queda como enum legacy pero no se usa en flujos nuevos —
                  //  el form valida en vivo contra Turso antes de cobrar)
  nameCheck       Json?    // Resultado del chequeo Sunbiz al crear la orden.
                  // Estructura: {query, normalized, available, exactCount, example?,
                  // similarCount, checkedAt, error?}. Se ve en el email admin con
                  // semáforo verde/rojo/ámbar. Ver doc LOGICA_DE_NEGOCIO/29.
}
```

#### Flujo nuevo de captura del nombre (commit `cbf477b`, 2026-06-22)

El formulario en `backend/app/page.tsx` paso 1 pide **un solo nombre + designator** (LLC/L.L.C./Limited Liability Company para LLCs, Inc/Corp/Corporation/Incorporated para Corps). Debajo del card hay 3 acordeones colapsables ("Additional Explanation") que el usuario puede abrir:

1. **What if my company name is unavailable?** — explica que si Florida rechaza, recontactamos sin cargo de servicio pero la nueva state fee es responsabilidad del cliente
2. **Does the company name end with "LLC" or "Inc."?** — explica que el designator va aparte y se agrega automático
3. **Is the name availability check guaranteed?** — disclaimer del preliminary check con link a `/terms#name-availability` (§14)

La verificación EN VIVO contra Turso FTS5 está **pendiente de activar** cuando los 3.5M de Sunbiz terminen de cargarse (Fase 1 en progreso). Mientras tanto, el form acepta cualquier nombre y la validación final ocurre al presentar a Florida (mismo comportamiento que pre-cambio, solo que ahora con un solo nombre).

### Otras tablas Supabase

- `prospective_companies` — empresas para marketing automation
- `email_campaigns` — registro de emails enviados
- `qr_scans` — escaneos de QR
- `conversions` — compras completadas via campaña
- `admin_audit_log` — trazabilidad de acciones admin (Etapa 14)
- `appointments` — citas del sistema de agendamiento propio
- `blocked_slots` — horarios/días bloqueados por el admin

---

## Variables de entorno requeridas

```
# DB
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

# Auth
SESSION_SECRET        # JWT admin (HS256, 8h expiry)

# Pagos
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Email
RESEND_API_KEY

# Next.js ↔ Express
INTERNAL_API_KEY      # Compartido entre ambos servidores
BACKEND_URL           # URL Railway del Express server

# Citas (sistema propio)
NEXT_PUBLIC_URL       # URL base del sitio (ej: https://opabiz.com) — usado en emails de citas para links de reprogramar/cancelar

# ZeroBounce — validación de email en el form de checkout
ZEROBOUNCE_API_KEY    # Key de la cuenta ZeroBounce
ZEROBOUNCE_ENABLED    # 'true' para activar (consume créditos). Cualquier otro valor = dormido (solo regex local)

# Lob.com — verificación de direcciones US en el form de checkout
LOB_SECRET_KEY        # 'live_...' en Vercel Production (consume crédito). 'test_...' en local dev (gratis)
LOB_ENABLED           # 'true' para activar. 'false' para apagar sin redeploy si rompe algo
```

---

## Autenticación

### Admin (`/admin/*`)
- Login en `/login` con usuario/contraseña en env (`ADMIN_USER` + `ADMIN_PASSWORD_HASH`)
- Genera JWT firmado con `jose` (SESSION_SECRET)
- Cookie `admin_session` (httpOnly, 8h)
- Proxy en `proxy.ts` (raíz del proyecto Next.js) protege `/admin` — antes se llamaba `middleware.ts`; Next.js 16.2 renombró la convención
- **Show/hide password** con ícono SVG en el campo de contraseña
- **Recuperación de contraseña:** `POST /api/auth/recover` valida contra `ADMIN_EMAIL`, genera token Redis (15 min, un solo uso), envía link al correo. Página `/login/recover/[token]` valida y crea sesión directa.

### Cliente (`/client-portal/dashboard/*`)
- **Login principal: en el HOME** (popover anclado al botón Login, clases `.plogin-*` en `page.tsx`) — ver detalle abajo. `/client-portal` se conserva como **fallback** (deep-links + redirect de sesión expirada del middleware).
- Acepta `FBFC-XXXXXXXX` (formaciones LLC/Corp) y `FBNB-XXXXXXXX` (New Business Letter)
- `FBFC-` / `FBNB-` = primeros 8 chars del `Order.id` en mayúsculas
- Cookie `client_session` = el `order.id` completo
- Middleware protege `/client-portal/dashboard/*`
- Respuesta genérica en `/api/client-auth` — no revela si el email existe
- Toggle EN/ES con persistencia en `localStorage` (`portal_lang`)
- **Idioma del portal sigue al del home:** prioridad `?lang=` URL → `portal_lang` → `flbc_lang`. El home pasa `?lang` al dashboard ("Mis órdenes" + redirect al entrar), y el dashboard persiste también `'en'` (antes solo `'es'`, dejando valores stale que lo dejaban pegado en español). NO depende de la orden ni el país (server `page.tsx` también lee `?lang` para `initialLang`, evita parpadeo).
- Dashboard rendering delegado a `DashboardContent.tsx` (client component) — `page.tsx` es server-only para fetch de datos. (`DashboardView.tsx` se borró el 2026-07-01 en la limpieza de código muerto.)
- Contacto: botones inline Email + WhatsApp (`wa.me/13528377755`) al hacer clic en "Contact us"

#### Login del cliente en el home (popover) — 2026-06-23
- El botón **"Login"** del header abre un **popover anclado** (top-right, sin oscurecer la página). NO modal centrado.
- Logueado: header muestra **"Hola, {nombre}" + "Mis órdenes" + "Salir"** (clase `portal-authed` en `<html>` controla visibilidad por CSS, sin estilos inline para no romper el responsive). Estado detectado client-side vía `GET /api/client-auth/me` → `{loggedIn, firstName}` (nada sensible; el home sigue estático).
- **Un solo campo** acepta número de orden O contraseña: si matchea `^(fbfc|fbnb)/i` → `confirmationNumber`, si no → `password`.
- Logout del home = `POST /api/client-auth/logout` (JSON, no recarga). El **GET** de logout (usado por el dashboard) redirige al **HOME** preservando idioma vía `?lang` (antes iba al viejo `/client-portal`).
- Safari "Hide My Email": el campo email usa `autocomplete="username"` + `name="username"`, sin `inputmode="email"` ni placeholder con `@`. Es heurístico de Apple, no 100% garantizado.
- El guion en el número de confirmación es **opcional** al loguearse (`FBFC-XXXXXXXX` o `FBFCXXXXXXXX` funcionan igual, 2026-07-08) — regex en `ClientAuthInputSchema` + `/api/client-auth/route.ts` acepta ambos.

#### Crear cuenta sin haber empezado ninguna orden (2026-07-08)
Antes la única forma de tener contraseña era loguearse primero con un número FBFC (`/api/client-auth/set-password` exige sesión existente) — no había forma de "registrarse" desde cero. Ahora el popover de Login tiene un link **"¿Nuevo aquí? Crea una cuenta"** que cambia el mismo popover a un form de 3 campos (Nombre, Email, Contraseña) y llama a `POST /api/client-auth/signup`.

- **Qué hace el endpoint:** valida que no exista ya una cuenta (orden con `client_password_hash`) para ese email → si existe, error 409 pidiendo login. Si no, crea una `Order` casi vacía (`isDraft:true`, `companyName:'Pending'`, resto con defaults tipo LLC/standard/basic) con `client_password_hash`, loguea al cliente (cookie `client_session`) y manda un email "Your account is ready" con el FBFC.
- **Reusa 100% la infraestructura de borradores** que ya existía para "Save" — es la misma fila `isDraft:true` que se restaura después con `fmFetchAndRestoreDraft()`. Tras crear la cuenta, redirige a `/?resume=1` igual que un login normal a un borrador.
- **Fix necesario en `fmFetchAndRestoreDraft()`:** antes solo guardaba `_fmDraftOrderId` si además había un `snapshot` guardado (`d.isDraft && d.snapshot`). Una cuenta creada por signup no tiene snapshot (nada llenado todavía) — se cambió a `d.isDraft && d.orderId` para que igual se recuerde el id y, cuando el cliente arranque el form más tarde, actualice esta misma orden en vez de crear una nueva.
- Archivos: `backend/app/api/client-auth/signup/route.ts` (nuevo), `ClientSignupInputSchema` en `lib/schemas.ts`, UI en `page.tsx` (`plogin-signup-form` + `ploginShowSignup/ploginShowLogin/portalSignupSubmit`).

---

## API Routes (Next.js — Vercel)

```
/api/auth/login           POST  — login admin → setea admin_session cookie
/api/auth/logout          POST  — borra admin_session
/api/client-auth          POST  — login cliente → setea client_session cookie
/api/client-auth/me       GET   — estado de sesión para personalizar el home (devuelve {loggedIn, firstName})
/api/client-auth/logout   POST(JSON, logout del home) + GET(redirect al home con ?lang, usado por el dashboard)

/api/orders               POST  — crea Order en Supabase + envía A1 al cliente + A0 alerta al equipo (acepta deferEmails:true para omitir emails → flujo Embedded Checkout)
/api/webhooks/stripe      POST  — checkout.session.completed. Dos flujos: (a) metadata.kind='formation' → marca orden existente paid+in_review; (b) addons/marketing → crea Order nueva
/api/checkout/embedded    POST  — crea sesión Stripe ui_mode='embedded' desde una orden pending (recalcula precio server-side con lib/pricing.ts)
/api/checkout/status      GET   — consulta estado de una sesión (para la página de retorno /order/complete)

/api/sunbiz               GET   — lookup empresa: DB primero, Sunbiz scraping como fallback
/api/sunbiz/checkout      POST  — crea sesión Stripe para servicios de marketing

/api/campaigns/send       POST  — genera QR, construye email HTML, envía vía Resend
/api/campaigns/track-scan GET   — registra scan, actualiza status, redirige a /new-business
/api/campaigns/stats      GET   — métricas del dashboard admin
/api/campaigns/companies  GET+POST — lista con filtros / alta manual de empresa

/api/contact              POST  — form público de /contact → email a info@opabiz.com (D1) + confirmación al visitor (D2). Rate limited 5/h/IP.
/api/email/validate       GET   — valida email contra ZeroBounce (MX + SMTP probe + typos). Llamado desde el onblur del campo email en el form de checkout. DORMIDO por defecto (ZEROBOUNCE_ENABLED!=='true') — devuelve solo regex local sin consumir crédito. Doc: LOGICA_DE_NEGOCIO/27.
/api/address/verify       POST  — valida dirección US contra Lob.com (USPS deliverability + sugerencia normalizada). Llamado desde fmNext() al click de Next en pasos con direcciones US (Negocio, RA, Mailing, Members). LIVE por default. Body JSON {primary_line, secondary_line?, city?, state?, zip_code?}. Doc: LOGICA_DE_NEGOCIO/28.
/api/sunbiz/name-check    GET   — chequea disponibilidad de nombre contra Turso opabiz-sunbiz-search (3.9M LLC/Corp ACTIVE de Florida). Respuesta mínima {ok, available, exactCount, similarCount, example?}. NO se llama desde el form (decisión negocio 2026-06-25: cero fricción cliente). Sí se llama internamente desde /api/orders al crear orden. Rate-limit 60/min/IP. Doc: LOGICA_DE_NEGOCIO/29.

/api/proxy/notifications/[type]  POST  — disparador interno del admin para reenviar emails: `order-confirmation` (A1, reenvío manual), `names-taken` (A2+A3), `suggest-names` (A4), `order-processed` (A5), `order-approved` (A6), `certificate` (A7)
/api/admin/upload-certificate  POST — sube certificado de aprobación + dispara A7
/api/documents/[orderId]  GET   — documentos de una orden

/api/contabilidad/dashboard      GET    — métricas + alertas de vencimiento
/api/contabilidad/clientes       GET+POST — CRUD clientes contables
/api/contabilidad/clientes/[id]  PATCH+DELETE
/api/contabilidad/ingresos       GET+POST — CRUD facturas/ingresos
/api/contabilidad/ingresos/[id]  PATCH+DELETE
/api/contabilidad/gastos         GET+POST — CRUD gastos (soporta recurrentes)
/api/contabilidad/gastos/[id]    PATCH+DELETE
/api/contabilidad/reportes       GET    — reporte consolidado por período
/api/contabilidad/sync-orders    POST   — importa órdenes del admin como ingresos+clientes (idempotente)
/api/contabilidad/reset          DELETE — borra todos los datos contables (requiere confirm: 'RESET_CONTABILIDAD')
/api/contabilidad/analyze-invoice POST  — sube PDF/imagen → Claude Haiku extrae datos de la factura

/api/booking/slots            GET    — slots disponibles para una fecha (lun-sáb, 9am-7pm, 40min)
/api/booking                  POST   — crea cita + emails confirmación al cliente y admin
/api/booking/reschedule       GET+POST — info de cita / reprogramar (público, por ID)
/api/booking/cancel           GET+POST — info de cita / cancelar (público, por ID)
/api/booking/appointments     GET    — lista de citas (admin)
/api/booking/appointments/[id] PATCH+DELETE — cambiar estado / eliminar cita (admin)
/api/booking/blocked          GET+POST — listar / crear bloqueos de horario (admin)
/api/booking/blocked/[id]     DELETE — eliminar bloqueo (admin)
```

---

## Páginas principales

```
/                        — Home (marketing) — link "Contact" del header lleva a /contact
/servicios               — Página de servicios (ES)
/contact                 — Página de contacto bilingüe EN/ES (split-screen: WhatsApp + Schedule a la izquierda, formulario a la derecha)
/new-business            — Landing de marketing QR (EN — indexada en Google)
/new-business/es         — Versión en español (URL dedicada — indexada en Google)
/new-business/success    — Post-pago con instrucciones portal
/admin                   — Panel admin: tabla de órdenes activas con filtros
/admin/orders/[id]       — Detalle de orden: cambio de estado, subida de documentos,
                           notas internas, buscador de nombres, envío manual de emails
                           (incluye botón "🔁 Reenviar Confirmación de Orden" para rescate manual)
/admin/campaigns         — Panel admin: marketing automation (envío QR, métricas)
/admin/security          — Configuración de seguridad admin
/admin/citas             — Panel admin: citas agendadas, confirmar/cancelar, bloquear horarios
/booking                 — Página pública de agendamiento: calendario + horarios + formulario (EN/ES)
/booking/reschedule      — Reprogramar cita (acceso vía link del email de confirmación)
/booking/cancel          — Cancelar cita (acceso vía link del email de confirmación)
/client-portal           — Login del portal de clientes (EN/ES, contacto Email+WhatsApp)
/client-portal/dashboard — Dashboard del cliente: status, documentos, My Orders, botón Add Services
/login                   — Login admin (staff portal)
/legal /privacy /terms /about
```

### Pendiente: servicio "Stripe Setup Guide" (placeholder)

En `/servicios` se agregó una tarjeta **placeholder** llamada "Stripe Setup Guide" / "Guía Setup Stripe" con precio "Coming soon" y **sin modal** (clic no hace nada — `openServiceForm` la ignora con su guard `if(!svc)return`). Se agregó solo para mantener la grilla de servicios en **pares** (junto al nuevo Certified Copy).

**Pendiente:** definir con el socio el servicio real (precio, qué incluye, formulario de orden) y completarlo. Cuando se defina, agregar: entrada en `serviceForms` + claves en los mapas `prEn/prEs/bgEn/bgEs/tmEn/tmEs/icEn/icEs` de `openServiceForm` (id: `stripe-setup-guide`), igual que los demás servicios.

---

## Sistema de Marketing Automation

Flujo completo:
```
Admin envía email desde /admin/campaigns
  → Sistema genera QR con URL de tracking única
  → Email HTML bilingüe vía Resend
  → Cliente escanea → /api/campaigns/track-scan registra scan
  → Redirect a /new-business?id=<document_id>
  → Landing auto-busca empresa (DB → Sunbiz scraping)
  → Cliente selecciona servicios → Stripe Checkout
  → Webhook → crea Order (package: 'addon') → envía email FBFC
  → Cliente entra al portal con email + FBFC
```

Precios en checkout (`/api/sunbiz/checkout`):
- Labor Law Poster: $120.00
- EIN / Tax ID: $161.00
- Certificate of Status: $79.00

Estados de `prospective_companies.status`: `new → email_sent → qr_scanned → purchased`

**Notas por empresa (2026-06-18):** `prospective_companies` tiene una columna `note TEXT` para notas de seguimiento del admin. Editable desde `/admin/campaigns` (botón 📝 por fila + modal; preview truncado bajo el nombre). API: `PATCH /api/campaigns/companies` con `{ id, note }`. Migración requerida:
```sql
ALTER TABLE prospective_companies ADD COLUMN IF NOT EXISTS note TEXT;
```

### Carta física de cumplimiento (PDF) — rediseñada 2026-06-11

Generador: `backend/lib/new-business-letter.ts` (usa `pdf-lib` + `qrcode`)
API: `POST /api/campaigns/generate-letter` → devuelve PDF con datos de la empresa
Panel admin: botón 👁 (preview en nueva pestaña) y 📄 (descarga) por empresa en `/admin/campaigns`

**Diseño (template tipo carta de negocio, una página, sin líneas divisorias):**
1. Título centrado "BUSINESS COMPLIANCE INFORMATION NOTICE" (sin recuadro ni subtítulo)
2. Membrete: logo circular FBFC navy + "FLORIDA BUSINESS FORMATION CENTER" + dirección física (`3700 SW 27TH ST Suite D104 / GAINESVILLE FL 32608`) + `mybusinessformation.com` a la derecha
3. Destinatario (izq): empresa + dirección del cliente — el nombre personal del owner NO se imprime (va dirigida al negocio)
4. Recuadro de registro (der, franja navy arriba): Document Number, Registration Date, Notice Date, Entity Type
5. Cuerpo neutro (2 párrafos) + "Congratulations on the recent registration of {companyName}"
6. Grilla de 3 servicios con precio en negro y resumen: Labor Law Posters $120 · EIN (Tax ID) $161 · Certificate of Status $79
7. CTA discreto + QR (`mybusinessformation.com/?id=...`) + dominio
8. Important Disclosure = texto de la home + 2 cláusulas: no-afiliación gubernamental y "not a bill, invoice, or demand for payment"

**Decisiones de contenido conscientes:** se mantienen precios visibles (no hay Total Fee ni deadline "Respond By"); el remitente es "Florida Business Formation Center" (sin LLC); sin teléfono. Fechas en formato largo (`February 17, 2026`); `noticeDate` se autogenera con la fecha de hoy; `entityType` se deriva del `company_type` (LLC→Florida LLC, CORP→Florida Corporation).

Variables del template (`NewBusinessLetterData`): `documentId, companyName, registrationDate, noticeDate, entityType, payUrl` + opcionales `ownerName, address, city, zip`. Texto fijo: título, membrete, párrafos, servicios+precios, CTA, disclosure.

**Validación del endpoint:** obligatorios `documentId, companyName, payUrl`; el resto opcional (si una variable viene vacía, esa línea no se imprime). La generación del PDF está en `try/catch`: si falla, devuelve `500 { error: "PDF generation failed: <msg>" }` y el admin UI muestra el mensaje en la barra de campañas.

**Bilingüe EN/ES (2026-06-11):** el texto fijo vive en un objeto `T = { en, es }` dentro de `new-business-letter.ts` (tipo `Lang = 'en' | 'es'`); el layout es idéntico y solo cambia el contenido según `data.lang` (default `en`). El endpoint recibe `lang`, localiza fechas (`es-ES` → `17 de febrero de 2026`) y `entityType` (`LLC de Florida`). El panel `/admin/campaigns` tiene un selector **"Letter format: EN/ES"** (estado `letterLang`) en la barra de acciones que controla preview 👁 y descarga 📄; el idioma va en el nombre del archivo (`notice-<id>-<lang>.pdf`). El disclosure ya NO menciona "OpaBiz" (en la carta la marca visible es FBFC) — arranca con "Florida Business Formation Center is a professional…". Acentos/ñ/¿/¡ son WinAnsi-safe (CP1252 cubre Latin-1 + español).

**Dominio + redirect SEO:** la carta y el QR usan `mybusinessformation.com` (congruente con el remitente legal). `next.config.ts` hace **301 de `mybusinessformation.com` (apex + www, cualquier path) → `https://opabiz.com/new-business`**, conservando el `?id=` automáticamente. Esto evita contenido duplicado (opabiz.com/new-business es el único canonical indexado) y consolida la autoridad SEO del dominio legacy. **Requiere que `mybusinessformation.com` siga agregado como dominio del proyecto en Vercel.** El flujo sin escaneo ya funciona: en `/new-business` el cliente teclea su Document Number (12 chars) y la página auto-busca y autollena los datos ([page.tsx:936](backend/app/new-business/page.tsx#L936)).

**⚠️ Gotcha de pdf-lib (WinAnsi):** las `StandardFonts` de pdf-lib solo codifican WinAnsi (CP1252). NO usar caracteres especiales como `↑ ↓ → • ★ ✓` en el texto de la carta — rompen la generación con `WinAnsi cannot encode "X"`. Las rayas `— –`, el middot `·` y comillas curvas sí están soportados. Si se necesitan íconos, embeber una fuente con `pdfDoc.embedFont(bytes, { subset: true })`.

**Logo real (HECHO 2026-07-01):** se reemplazó el círculo provisional "FBFC" por el **sello real FBFC** recoloreado al navy #1C2E44 del sitio. Vive embebido en base64 en `backend/lib/fbfc-seal.ts` (`FBFC_SEAL_PNG_BASE64`, PNG transparente 420px) y se dibuja con `doc.embedPng` en `new-business-letter.ts` (con fallback al círculo si el embed falla). El vector editable original está en `~/Desktop/DOCUMENTOS FBFC/alfredglover-attachments/Vector Editable Source Files.ai`. Decisión: el sello va solo en la carta, NO en el header web (que sigue con el logo "OB" de OpaBiz).

**Pendientes de la carta:**
- [ ] **(para 2026-07-02)** Bug de dato: si el `document_id` de una empresa es muy largo (ej. una de prueba tenía "CONFIRMATION NUMBER FBFC-A34B4036" tecleado a mano), el valor se **encima con la etiqueta "Document Number"** en el recuadro de registro. Solo afecta esa empresa de prueba (las reales tienen doc number corto de Sunbiz). El panel `/admin/campaigns` NO tiene botón de borrar/editar document_id (solo nota) → el usuario lo corrige en Supabase Table Editor, o se puede: (a) agregar botón de borrar/editar al panel, y/o (b) blindar el recuadro para que un valor largo se achique/oculte y nunca se encime.
- [ ] Verificar en el deploy que el 301 de `mybusinessformation.com` funcione y que el QR autollene (el dominio ya apunta al proyecto en Vercel — confirmado por el usuario 2026-06-11).

---

## Página `/new-business` — estructura interna

`PageView = 'id-entry' | 'landing' | 'ein-form'`

- Sin `?id=` → muestra solo el campo Document ID
- Con `?id=L26...` → auto-lookup → muestra landing completa
- EIN en carrito → checkout va a `ein-form` en vez de Stripe directo

Diseño: CSS-in-JS via `<style>` tag con clases BEM-style. Paleta: dark navy `#1C2E44`, accent `#2563EB`, background `#f0f4f8`. Tipografías: Fraunces (headers) + Plus Jakarta Sans (body).

---

## Cobro del home — Stripe Embedded Checkout (✅ WIRING HECHO — pendiente probar en test)

**Objetivo:** el formulario de formación del home (`page.tsx`) ahora cobra con **Stripe Embedded Checkout** (form de Stripe incrustado en la página, el cliente NO sale del sitio). Antes recogía datos de tarjeta en inputs propios (inseguros / viola PCI) y solo guardaba la orden como `pending`. El flujo de marketing `/new-business` ya cobraba bien con Checkout redirect (`/api/sunbiz/checkout`) — ese NO se tocó.

**Decisión:** se eligió **Embedded Checkout** (modo `embedded` de "Prebuilt checkout form"), NO Elements. Razón: cliente no sale + PCI seguro + mucho menos trabajo que Elements.

### Flujo diseñado
```
1. Cliente llena el form multi-paso (igual que ahora)
2. En el paso de pago → POST /api/orders con deferEmails:true → crea orden pending, devuelve orderId
3. POST /api/checkout/embedded { orderId } → recalcula precio server-side, devuelve clientSecret
4. Se monta el form de Stripe en la página con ese clientSecret (cliente paga sin salir)
5. Stripe → return_url /order/complete + webhook (metadata.kind='formation', orderId)
6. Webhook marca la orden paid+in_review y envía emails (confirmación + alerta interna)
```

### ✅ HECHO y desplegado (commit 05d3e20)
- **`lib/pricing.ts`** — cálculo de precio autoritativo server-side (anti-tampering). Espeja `fmUpdateSummary()`/`fmBuildPayload()` del form: paquetes (basic $0/standard $199/premium $299), state fee (LLC $125/Corp $70), **expedited +$79** (`EXPEDITED_FEE`, gratis con premium), addons (ein $79, oa $59, itin $69, btr $79, str $79, cc $49). **Si cambian precios en page.tsx, actualizar aquí también.** (El precio del expedited también está hardcodeado en el prompt del chat `api/chat/route.ts` — mantener sincronizado; se corrigió de $99→$79 el 2026-07-01.)
- **`/api/checkout/embedded`** — crea sesión `ui_mode:'embedded'` leyendo la orden de la DB (no confía en el navegador). line_items itemizados.
- **`/api/checkout/status`** — GET estado de sesión para la página de retorno.
- **`/order/complete`** — pantalla de confirmación post-pago (bilingüe, lee flbc_lang).
- **`/api/webhooks/stripe`** — nueva rama `handleFormationPaid()` (idempotente) para órdenes de formación. Flujo addons intacto.
- **`/api/orders`** — flag `deferEmails` para omitir emails al crear (los manda el webhook al pagar).
- **Stripe dashboard (test/sandbox):** cuenta creada, keys test, webhook `opabiz-checkout` → `opabiz.com/api/webhooks/stripe` escuchando `checkout.session.completed`.
- **Vercel env vars (Production+Preview):** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (test). ⚠️ Falta hacer **Redeploy** si no se hizo, y crear las versiones **LIVE** al lanzar (otra cuenta/keys/webhook live).
- **⏳ Statement descriptor (lo que el cliente ve en su extracto bancario):** configurar en Stripe → Settings → Business → Public details (ej. `OPABIZ`, 5–22 chars, mín. 5 letras, sin `< > \ ' " *`). ⚠️ Test y Live son configs **separadas** — lo que se ponga en test NO se copia a Live; hay que configurarlo **también en el modo Live al lanzar**. Opcional: sufijo por transacción vía `payment_intent_data.statement_descriptor_suffix` en `/api/checkout/embedded` si se quiere distinguir tipos de cobro (formación vs. marketing). Por ahora basta con el descriptor general del dashboard.

### ✅ HECHO — wiring del frontend en `page.tsx`
El paso de pago es el step `#fms9`. Implementado:
1. Se quitaron los campos de tarjeta falsos (`#card-fields-wrap`), las opciones Zelle/Apple y la sección Billing Address. Stripe recoge tarjeta + billing. Se conservó el checkbox `chk-agree` (T&C, ahora dentro de `#agree-row`) y el aviso non-refundable.
2. Contenedor `<div id="embedded-checkout">` añadido en ese step (oculto hasta el submit).
3. Stripe.js (`https://js.stripe.com/v3/`) cargado antes del `<script>` inline; la publishable key se inyecta en `window.__OPABIZ_STRIPE_PK__` vía `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}` (server component, template literal).
4. **`fmSubmit()`** reescrito: valida T&C → POST `/api/orders` con `deferEmails:true` → POST `/api/checkout/embedded` → `stripe.initEmbeddedCheckout({clientSecret})` → `.mount('#embedded-checkout')`; oculta `#agree-row` + `#pay-footer`. El form de Stripe trae su propio botón Pay; al pagar redirige a `/order/complete`. El step `#fms-success` quedó sin uso para el flujo pagado.
5. Las funciones `fmFormatCard`, `fmFormatExpiry`, `fmSelectPayMethod`, `fmToggleBillingAddr` quedaron huérfanas (nunca se invocan; se dejaron — no rompen). Los setters de idioma de los inputs eliminados son no-ops guardados con `if(el)`.
6. **Prefetch (2026-07-03):** `fmPrefetchPayment()` adelanta el POST a `/api/orders` + `/api/checkout/embedded` (crea/actualiza la orden y pide el `clientSecret`) al entrar al step `#fms7` ("Boost Your Formation", el anterior al Review) y en cada cambio de velocidad (`fmSetSpeed`) o addon (`fmToggleAddon`). `fmMountPayment()` reutiliza esa promesa si el payload no cambió (clave `_fmPayKey`). El mount de Stripe (`stripe.initEmbeddedCheckout` + `.mount()`) ocurre recién al llegar al Review, con el panel ya visible — a propósito, ver sección "Prefetch de la sesión Stripe" más abajo (se probó montarlo oculto antes y causaba cuelgues intermitentes).

**✅ PROBADO OK EN TEST (2026-06-23):** flujo completo verificado (`4242…` → orden pending → webhook `200` → paid+in_review → emails → `/order/complete`). El bloqueo era el webhook sin `www` (ver gotcha abajo). El sitio en test usa el **sandbox `TkDfr`** (`acct_1TkDfrCJpzHlLzWq`), no el modo test de la cuenta live `TkDfg`. **Al lanzar: repetir todo en LIVE** (keys, webhook **con www**, statement descriptor, cupón Basic — configs separadas de test).

**Stripe Link** queda activo (ayuda a la conversión; el "Pay without Link" cubre a quien no lo quiera). **`billing_address_collection: 'required'`** en `/api/checkout/embedded` (mejor AVS antifraude — estándar para filing services).

#### Página de confirmación `/order/complete` (rediseñada 2026-06-23)

Pantalla post-pago dedicada (bilingüe, fondo blanco, header estilo home). Muestra: **número FBFC copiable**, Empresa/Entidad, **"Tu Paquete {X} incluye"** (✓ inclusiones, mismo mapa `PACKAGE_SERVICES` que el portal) + **"Servicios adicionales que agregaste"**, y **"Resumen de pago"** (desglose itemizado vía `computeFormationTotal` + total). Título **"Orden recibida"** (no "Pago confirmado"). El texto de próximos pasos **NO promete tiempo preciso** ("te contactaremos con los próximos pasos", nunca "1 día hábil"). `/api/checkout/status` devuelve el resumen leyendo `metadata.orderId` de la sesión (disponible aunque el webhook no haya corrido). Las etiquetas de líneas vienen en EN desde `lib/pricing` y se localizan en el front.

#### 🚨 GOTCHA CRÍTICO: la URL del webhook DEBE llevar `www` (resuelto 2026-06-23)

El dominio redirige **`opabiz.com` (apex) → `www.opabiz.com`** con un **308**. **Stripe NO sigue redirects**: cuando el webhook apunta a `https://opabiz.com/api/webhooks/stripe`, recibe el 308 y marca la entrega como fallida (error rate 100%), sin llegar nunca a ejecutar el código. Resultado: pago exitoso en Stripe pero la orden queda `pending` y **no se envían emails** (el webhook es quien marca paid + dispara A1/A0).

- **URL correcta del endpoint en Stripe:** `https://www.opabiz.com/api/webhooks/stripe` (CON `www`).
- Aplica **tanto en test/sandbox como en LIVE** — al crear el webhook live, usar también `www` o se repite el bug con clientes reales.
- El `whsec_` (signing secret) NO era el problema; ya coincidía con `STRIPE_WEBHOOK_SECRET` de Vercel.
- **Recuperar órdenes afectadas:** Stripe → (cuenta/sandbox correcto) → Developers → Webhooks → `opabiz-checkout` → Event deliveries → abrir el evento fallido → botón **Resend**. Al responder `200` la orden pasa a paid+in_review y salen los emails (idempotente vía `handleFormationPaid`).

> **Estructura de cuentas Stripe:** 1 sola cuenta "Florida Business Formation Center" = `acct_1TkDfgCSqYWERc9A` (live, `pk_live_51TkDfg…`) + 1 **sandbox** con id propio `acct_1TkDfrCJpzHlLzWq` (`pk_test_51TkDfr…`). El sitio en test usa las keys del **sandbox** (`TkDfr`) — ahí van los pagos de prueba y el webhook de test. No son cuentas duplicadas; el sandbox del modelo nuevo de Stripe tiene su propio `acct_` id.

#### Stripe LIVE — preparado, NO activado (2026-07-07)

Se completó toda la preparación del lado de Stripe para pasar a Live, **sin cargar todavía las llaves en Vercel** (decisión explícita — se activa en un paso aparte cuando se decida lanzar de verdad, ver checklist que se armó como artifact durante la sesión):
- ✅ Cuenta cambiada a modo Live, webhook creado (`https://www.opabiz.com/api/webhooks/stripe`, con `www`), llaves `pk_live_.../sk_live_...` obtenidas.
- ✅ Statement descriptor ya venía cargado (`OPABIZ.COM`, heredado del perfil de verificación de la cuenta — no hubo que configurarlo).
- ✅ Cupón `basic-package-free` creado en Live ($99 fixed amount off, duration Once) → futuro `STRIPE_BASIC_COUPON_ID`.
- ✅ Payment methods revisados: Card/Apple Pay/Cash App Pay/Link activos; Google Pay activado; Affirm sale "Ineligible" (Stripe no aprobó la cuenta todavía, no bloqueante). **Link se deja activo a propósito** (ver decisión previa) aunque a veces aparece antes que la tarjeta para clientes que ya tienen cuenta Link en otro comercio — es un comportamiento de la red de Link, no configurable por orden de lista.
- ✅ Teléfono de la cuenta verificado (requisito de Stripe para procesar pagos).
- **Pendiente antes de activar de verdad:** confirmar los precios placeholder de `/servicios/checkout` (ver sección de esa página más abajo) — si se cargan las llaves Live sin resolver eso, se le cobra a un cliente real un precio sin confirmar.
- **Para activar:** cargar las 4 variables (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_BASIC_COUPON_ID`) en Vercel → Production, y redeploy. Es reversible (volver a las keys de test), pero mientras está cargado se cobran tarjetas reales en todo el sitio — no hay ambiente de prueba separado, es un interruptor único.

#### Reembolsos y chargebacks — se reflejan solos (2026-07-07)

Antes no existía ningún manejo: un reembolso hecho a mano en Stripe (o un chargeback del banco del cliente) nunca se reflejaba en el sitio — la orden quedaba `paid` para siempre y la plata se seguía contando en contabilidad. Ahora el webhook escucha también `charge.refunded`, `charge.dispute.created` y `charge.dispute.closed`, actualiza `Order.paymentStatus` (`refunded` / `disputed`) y la fila correspondiente de `accounting_income`, y manda alerta interna por email solo cuando se **abre** un chargeback (no en reembolsos, que el founder ya sabe que hizo). No hay botón de reembolso en el sitio — sigue haciéndose en Stripe como siempre. Doc completa: `LOGICA_DE_NEGOCIO/35_reembolsos_y_chargebacks.md`. Limitación conocida: órdenes pagadas antes del 2026-07-07 no tienen `stripePaymentId` guardado, así que un reembolso sobre esas no se puede emparejar automáticamente.

---

## Recuperación de orden en progreso — "Continue My Application" (2026-07-02)

Antes, el progreso del formulario de formación (home, `page.tsx`) se guardaba **solo en `localStorage`** del navegador donde el cliente empezó — si cerraba la pestaña o cambiaba de dispositivo, no había forma de continuar. Ahora la orden se guarda como **borrador real en Supabase** desde que completa "Tu Información" (paso 2), recuperable desde cualquier lugar con su número FBFC.

- **Modelo `Order` — 2 columnas nuevas:** `isDraft BOOLEAN DEFAULT false` (true mientras el formulario está incompleto) y `draftSnapshot JSONB` (snapshot `{step, fmData, values}` para restaurar el form exacto donde quedó). Migración corrida en Supabase 2026-07-02.
- **`isDraft` en vez de un nuevo `status`:** se descartó agregar un valor `'draft'` al `status` existente por el riesgo de que sea un enum nativo de Postgres (heredado de Prisma) — un booleano aparte es más seguro y no toca el pipeline de estados documentado arriba (`status` sigue siendo `'pending'` tanto para el borrador como para la orden real).
- **`POST /api/orders/draft`** (nuevo) — crea/actualiza el borrador (fire-and-forget desde `fmSaveProgress()` en cada cambio de paso, vía `fmSyncDraftToServer()`). Nunca envía la confirmación de orden (A1) ni la alerta interna (A0) — eso sigue disparando solo cuando el cliente paga (`POST /api/orders` con `deferEmails:true`, sin cambios). El único email de este endpoint es uno nuevo, ver abajo. `GET` del mismo endpoint devuelve el snapshot, autenticado por la cookie `client_session` (nunca por un id en la URL).
- **Email "Save your application number"** — se manda **una sola vez**, al crear el borrador (no en cada sync). Incluye el número FBFC y un botón **"Continue My Application →"** que apunta a `opabiz.com/?continue=FBFC-XXXXXXXX`: ese link auto-loguea con el código (ver `fmCheckResumeParam()` en `page.tsx`) y reabre el form restaurado, sin que el cliente tipee nada.
- **Promoción a orden real:** al llegar al paso de pago, `fmMountPayment()` manda `draftOrderId` a `POST /api/orders`, que hace `UPDATE` (no `INSERT`) sobre esa misma fila — mismo id, sin duplicar. Ahí recién se dispara la alerta interna y (al confirmar el pago) la confirmación al cliente, exactamente como ya funcionaba.
- **Recuperación por número de orden — decisión negocio 2026-07-02:** el modal "Continue My Application" (antes un placeholder que no buscaba nada real — solo simulaba una espera y abría un form en blanco) ahora pide **solo el número FBFC**, sin email. `POST /api/client-auth` en modo `confirmationNumber` ya no exige email — el código de 8 caracteres alcanza por sí solo (suficiente entropía + rate limit nuevo `checkClientAuthRateLimit`, 20/hora/IP, no existía antes). El modo `email+password` no se tocó, sigue igual.
- **Panel admin:** los borradores (`isDraft:true`) se filtran de `getOrders()` (`app/admin/page.tsx`) — nunca se mezclan con las órdenes reales ni afectan los contadores.
- **Login del portal (`/client-portal` y popover del home) redirige solo si es borrador:** si la orden de la sesión tiene `isDraft:true`, manda a `/?resume=1` (retoma el form) en vez de al dashboard — cubre también una cookie de sesión vieja apuntando a un borrador.
- **Fix órdenes huérfanas duplicadas (2026-07-08):** antes, si el cliente togglaba un addon/velocidad DESPUÉS del primer `fmPrefetchPayment()` sin haber usado nunca "Save" (`_fmDraftOrderId` seguía en `null`), cada llamada siguiente a `/api/orders` insertaba una fila nueva en vez de actualizar la ya creada — dejaba decenas de huérfanas en `pending`. Fix: `_fmCreateSessionReq()` ahora guarda `_fmDraftOrderId` apenas recibe un `orderId` del server (no solo cuando viene de "Save"). El guard de `/api/orders` para reusar `draftOrderId` se amplió de `.eq('isDraft', true)` a `.eq('paymentStatus', 'pending')` — cubre tanto los drafts reales como las órdenes creadas por el prefetch, nunca pisa una ya pagada. Mismo problema y mismo fix aplicado en `/servicios/checkout` (`coOrderId` + `/api/checkout/embedded-services` acepta `orderId` para hacer `UPDATE`).
- **Crear cuenta desde el signup también deja `_fmDraftOrderId` sin snapshot** — ver sección de Login más arriba ("Crear cuenta sin haber empezado ninguna orden"). `fmFetchAndRestoreDraft()` guarda el id igual aunque no haya nada que restaurar todavía.

---

## Checkout de servicios à la carte (`/servicios/checkout`) — 2026-06-27

Wizard por pasos para comprar servicios sueltos o una formación LLC/Corp desde
`/servicios`. Cobra con Stripe Embedded Checkout. **Doc canónica:
`LOGICA_DE_NEGOCIO/32_checkout_servicios_alacarte.md`.**

- **Archivos:** `backend/app/servicios/checkout/page.tsx` (wizard, CSS-in-JS + script inline `co*`), `lib/service-fields.ts` (campos por servicio + compartidos), `lib/services-pricing.ts` (`SERVICES_CATALOG` + `SERVICE_BUNDLES` + `computeServicesTotal`), `app/api/checkout/embedded-services/route.ts` (crea Order `package:'services'` + sesión Stripe; lee `intake.bundles`).
- **Precio autoritativo server-side** desde IDs de carrito (`flbc_svc_cart`) + bundles (`flbc_svc_bundles`). El cliente solo espeja el total. Cambios de precio → `services-pricing.ts`.
- **Orden de pasos (espeja el home):** Empresa → Tus datos (contacto) → Agente Registrado *(solo en formación — dos cajas, +$99 / propio agente con reuso de dirección)* → Dueños *(solo en formación, valida 100%)* → **Documentos esenciales** (combo) → **Cumplimiento anual** *(combo, solo à la carte)* → **Presencia y operación** (combo) → Datos del servicio (+ SSN/ITIN si aplica) → **Revisa tu orden + Stripe** (sin paso de firma; autorización al pagar, disclosure con links a /terms y /privacy).
- **Combos (bundles):** un bundle reemplaza el cobro individual de sus servicios pero suma tarifas estatales. EIN y Operating Agreement salieron de `COVERED_IN_FORMATION` (ahora solo `registered-agent`) para que generen su paso de datos al comprarlos.
- **Los 3 hubs de combos (2026-07-02, ver abajo `Reorganización de combos`)** — `HUBS` en `checkout/page.tsx`:
  - **Documentos esenciales** (`docs`): Operating Agreement → +EIN → +Banking Resolution. Igual en formación y à la carte.
  - **Cumplimiento anual** (`compliance`): Agente Registrado ($99/año) → +Annual Report ($179). **Solo à la carte** — en formación el agente ya se resuelve en su paso obligatorio propio (`panel-ra`), así que este hub no aplica ahí (`coHubApplicable`).
  - **Presencia y operación** (`protect`, antes "Protección y cumplimiento"): en **formación** sigue igual que siempre (Virtual Address → +Annual Report → +Business Tax Receipt, sin cambios). **À la carte** usa una config reducida vía `coProtectConfig()`: Virtual Address → +Business Tax Receipt (sin Annual Report, que vive en `compliance` para no repetir el mismo servicio en dos pasos).
  - **Columnas redundantes se ocultan, no se fuerzan a 3:** si el cliente ya tiene todos los servicios de una columna, esa columna no se muestra (evita un "$0" confuso al lado del total que ya se ve en el resumen). Un hub puede terminar con 1, 2 o 3 columnas según cuánto tenga ya el cliente — es esperado.
- **Año fiscal del OA:** quitado del checkout, se asume 31 dic (`CHECKOUT_HIDE_KEYS`).
- **SSN/ITIN:** campo `maxlength=9` + solo dígitos; valida **exactamente 9 dígitos** (error si no). Input angosto (`max-width:220px`, 2026-07-03) — antes ocupaba toda la tarjeta para solo 9 dígitos.
- **Modo dev:** `Ctrl+Shift+D` salta validación (barra ámbar), igual que el home.
- **Gotcha:** el script del cliente vive en `String.raw\`...\``; validar con `new Function(body)` tras extraer el template. No meter chars de control en comentarios.
- **Pendiente LIVE:** confirmar precios placeholder ($99) y `stateFee` aproximadas.

### Reorganización de combos + fix de Expedited fantasma (2026-07-02)

- **Bug corregido:** "Procesamiento acelerado" se ofrecía y cobraba ($79) aunque el carrito no tuviera nada que realmente se presente ante el estado (ej. comprar solo un Operating Agreement, un documento privado sin filing). Fix en `lib/services-pricing.ts` (`isExpeditedApplicable()`, autoritativa server-side) + espejo en cliente (`coExpeditedApplicable()`). El paso ni se ofrece ni se cobra si nada en el carrito es una formación o tiene `stateFee > 0`.
- **Botones de Expedited/No gracias:** ahora dos tarjetas `.co-choice` del mismo tamaño y fondo blanco (antes una tarjeta grande + un botón pequeño tipo pill debajo). La pre-seleccionada sale resaltada (`.sel`) al entrar al paso.
- **Reorganización de los hubs** (ver arriba): se sacó Annual Report + Agente Registrado del hub "Protección" hacia un hub nuevo "Cumplimiento anual" (solo à la carte) — decisión de negocio: son los 2 servicios recurrentes de mayor valor (afiliación anual) y estaban diluidos junto a servicios de un solo pago. La formación NO se tocó — sigue con su hub de 3 tiers de siempre.
- **Precios nuevos:** `bundle-compliance-ra` ($99, = precio individual del agente), `bundle-compliance-ra-ar` ($179), `bundle-protect-va-btr` ($179, para la versión à la carte reducida del hub "Presencia"). Mismo ~10% de descuento que ya usaban los combos de 2 servicios existentes.
- Bundle viejo `bundle-protect-ra` (hack intermedio de esta misma sesión) fue **removido** — superado por el hub `compliance` dedicado.

---

## Paso de Procesamiento acelerado — patrón "oferta + declinar" (2026-07-01)

Aplica **idéntico en home (`page.tsx`, paso `fms6`) y en `/servicios/checkout`** (`coRenderExpedited`).

- **Home:** una sola oferta destacada (card "⚡ Expedited processing +$79 · 1-3 business days", badge "Fastest") + un botón secundario "No thanks..." debajo (clase `.fm-speed-decline`), sin cambios.
- **Servicios checkout (rediseñado 2026-07-02):** ya NO es tarjeta grande + pill pequeño debajo — ahora son **dos tarjetas `.co-choice` del mismo tamaño y fondo blanco**, lado a lado, igual que el paso de Agente Registrado (`co-decline` quedó sin uso y se borró del CSS). La elegida sale resaltada (`.sel`) al entrar al paso.
- **La oferta viene PRE-SELECCIONADA** (más conversión): home `fmData.speed` default `'expedited'`; servicios `coExpedited` default `true` (si no hay elección previa en `localStorage flbc_svc_expedited`). Decisión de negocio: es honesto porque el +$79 sale como línea visible en el resumen y declinar es un clic. NO esconder el botón de declinar. Confirmado con research (2026-07-03): LegalZoom y similares también pre-seleccionan el rush/expedited como upsell recomendado — es el patrón estándar de la industria, no algo a evitar.
- **Fix (2026-07-03): el cargo no debe verse en el resumen ANTES de ofrecerlo.** Por venir pre-seleccionado desde que carga la página, el +$79 aparecía en el Order Summary desde el paso 1 — antes de que el cliente supiera que existía esa opción (mismo criterio que YA aplicaba el Agente Registrado, que nunca entra al resumen sin que el cliente lo elija activamente). Fix: `coExpeditedSeen` (servicios, `coGoStep` lo pone en `true` al entrar a `panel-expedited`) y `_fmSpeedSeen` (home, `fmGoToStep` lo pone en `true` al entrar a step 6) gatean tanto la línea visible como la suma al total en `coComputeTotal()`/`fmUpdateSummary()`. Antes de llegar a ese paso, el resumen no lo menciona ni lo cobra en el preview; al llegar, aparece pre-seleccionado como siempre.
- **Copy sin lenguaje de "prioridad"** (no "we prioritize your whole order" / "priority handling" — insinuaba abandonar otras órdenes). Estilo LegalZoom: "Upgrade to expedited state filing where applicable."
- **Solo se ofrece/cobra si aplica (servicios checkout, 2026-07-02):** `coExpeditedApplicable()` / `isExpeditedApplicable()` (`lib/services-pricing.ts`) — el carrito debe tener una formación o algo con `stateFee > 0`. Comprar solo un Operating Agreement (sin filing estatal) ya no ofrece ni cobra el acelerado. El home no tenía este bug (ahí siempre hay una formación con state fee de por medio).
- **Tiempo estándar = 7-14 días hábiles** en TODO el sitio (form, FAQ, schema SEO, review, tabla comparativa de paquetes, prompt del chat). Antes era 7-10.
- **Expedited = $79** (`EXPEDITED_FEE` en `lib/pricing.ts` y `lib/services-pricing.ts`), gratis con Premium.
- Bug corregido: el título del paso mostraba "Registered Agent" por un override stale en `fmTranslations.s6_title`; ahora "Faster processing" / "Procesamiento acelerado".

## Patrón mobile de checkout (2026-07-01)

Aplica al form del home y a `/servicios/checkout`:

- **Resumen de orden COLAPSABLE arriba en mobile** (como Shopify/Stripe/LegalZoom): en desktop el resumen va a la derecha siempre expandido; en mobile va **arriba** (`order:-1`) y **colapsado por defecto** (solo header + Total visibles; el detalle se expande con un tap). Toggle: home `fmToggleSummary()` (clase `.fm-sum-open` en `.fm-summary`), servicios `coToggleSummary()` (clase `.co-sum-open` en `#co-side`). Solo visible/activo dentro del media query mobile (home ≤820px, servicios ≤760px).
- **Inputs a `font-size:16px` en mobile** (`.fm-input/.form-input`, `.co-input/.co-select/.co-textarea`) para evitar el **auto-zoom de iOS** al enfocar un campo (dispara con <16px y deja la página ampliada/cortada). NO usar `maximum-scale` en el viewport (rompe el pinch-zoom del usuario).
- **`overflow-x:clip` en el `body`** de `/servicios/checkout` como red de seguridad anti-overflow horizontal (clip, NO hidden — hidden rompería el header sticky). Grid items del layout con `min-width:0`.
- **Espacio inferior extra en mobile** en el home (`.fm-wrap` padding-bottom 120px) para que el botón Continuar del footer no quede tapado por el widget flotante de Claudia (`ChatWidget`, `position:fixed` abajo-derecha, z-index 9999).

### Prefetch de la sesión Stripe (`/servicios/checkout` y home) — revertido el mount oculto (2026-07-08)

Para que el form de Stripe aparezca rápido al llegar a "Revisa tu orden": al entrar al paso **previo** al pago se dispara `coPrefetchPayment()` / `fmPrefetchPayment()` (crea/actualiza la Order pending + pide el `clientSecret` en background). El paso de pago reutiliza esa promesa si la clave de estado coincide (`coPayKey` / `_fmPayKey`), así que no repite el round-trip del servidor. Se re-dispara al togglear el acelerado/addons.

**Gotcha real (2026-07-03 → revertido 2026-07-08):** se probó también montar el iframe de Stripe OCULTO (`stripe.initEmbeddedCheckout()` + `.mount()`) mientras el panel de pago todavía tenía `display:none`, para eliminar hasta el handshake visible. **Causaba cuelgues intermitentes en producción** — con el contenedor en `display:none` el navegador no puede calcular las dimensiones reales del iframe, y el mount a veces nunca resolvía (confirmado con la documentación de Stripe: el mount debe ocurrir con el contenedor visible). Se revirtió: ahora el prefetch solo adelanta el **fetch** (Order + `clientSecret`), y el `mount()` de Stripe ocurre recién cuando el panel de pago ya es visible (`coStartPayment()` / `fmMountPayment()`) — mismo patrón en ambos flujos. Queda un spinner corto (1-2s) al llegar a Revisar, pero sin el riesgo de cuelgue — es el patrón estándar de la industria (Shopify, Stripe docs oficiales también muestran un loader ahí).

---

## Convenciones establecidas

### SDKs externos — NUNCA a nivel de módulo
```ts
// ✅ Correcto — lazy init dentro de función
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '...' })
const getResend = () => new Resend(process.env.RESEND_API_KEY)

// ❌ Incorrecto — se ejecuta en build time, las env vars no existen
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```
Aplica a: Stripe, Resend, Supabase. Razón: durante el build de Vercel las env vars no están disponibles.

### Webhooks de Stripe
Siempre incluir `export const dynamic = 'force-dynamic'` en la route. Stripe envía el body como stream raw — leer con `req.text()`, no `req.json()`.

### `useSearchParams` — siempre en Suspense
```tsx
export default function Page() {
  return <Suspense><Content /></Suspense>
}
function Content() {
  const searchParams = useSearchParams() // aquí está seguro
}
```

### Bilingüe EN/ES
No se usa ninguna librería i18n. El patrón es un objeto `T = { en: {...}, es: {...} }` local en cada página/componente con `const t = T[lang]`. El lang se detecta desde `?lang=es` en la URL o toggle del usuario.

### URLs bilingües dedicadas (patrón /new-business)
Cuando una página necesita URL propia en español (para SEO), el componente principal se exporta con un prop `defaultLang`:
```tsx
// page.tsx — exporta el componente para ser reutilizado
export function PageContent({ defaultLang = 'en' }: { defaultLang?: 'en' | 'es' }) { ... }
export default function Page() { return <Suspense><PageContent /></Suspense> }

// es/page.tsx — wrapper de 7 líneas
'use client'
import { Suspense } from 'react'
import { PageContent } from '../page'
export default function PageEs() { return <Suspense><PageContent defaultLang="es" /></Suspense> }
```
El toggle de idioma navega entre URLs (`/new-business` ↔ `/new-business/es`) preservando `?id=`. Cada ruta tiene su propio `layout.tsx` con metadata y hreflang en el idioma correspondiente.

### CSS en páginas marketing-facing
CSS-in-JS con `<style>` tag dentro del componente. No Tailwind en estas páginas. Clases con nombres descriptivos tipo BEM. Las clases del sistema de diseño de `/new-business` están documentadas en el `<style>` del archivo.

### TypeScript build errors
`next.config.ts` tiene `typescript.ignoreBuildErrors: true`. No bloquea deploys por errores TS, pero los errores deben resolverse de todas formas durante desarrollo.

---

## Panel Admin — Gestión de Órdenes (`/admin/orders/[id]`)

Página de detalle de orden con todas las herramientas operativas:

| Sección | Función |
|---|---|
| **Gestión de Estado** | Botones contextuales por status. `filed` dispara `sendOrderProcessed` automático (salvo que el cron de Priority ya lo haya mandado, ver sección "Rediseño de plantillas" arriba). `approved` **ya NO manda email** (2026-07-09) — es puramente interno. |
| **Enviar documento(s) al cliente** | Aparece cuando status=`filed` o `approved`. Checklist de ítems (formación + addons) con estado persistido entre rondas (`Order.deliveredItems`), sube uno o varios archivos a Supabase Storage, manda el email unificado (`sendOrderApprovalUpdate`) y marca `completed` solo cuando no queda nada pendiente. Reemplaza el viejo "Certificate PDF" (2026-07-09). |
| **Buscador de nombres** _(LEGACY — a ocultar)_ | Aparece solo cuando status=`names_taken`. Sirve para órdenes viejas que entraron antes del rediseño del form 2026-06-22. Las órdenes nuevas no llegan a este estado porque el form valida en vivo contra Turso antes de cobrar. |
| **Acciones manuales** | Forzar cualquier status vía selector + enviar emails sueltos (nombres tomados, certificate). Los emails A2/A4 (nombres tomados, sugerencias) quedan disponibles para órdenes legacy pero se desactivan cuando entre en producción la verificación en vivo. |
| **Notas internas** | Texto libre visible solo para el equipo, guardado en la orden |
| **Pre-filled Documents** | PDFs generados con datos del cliente: Articles of Organization, BOI, EIN SS-4, Operating Agreement |

Flujo de estados (órdenes nuevas, post-2026-06-22): `pending → in_review → ready_to_file → filed → approved → completed`
Rama legacy (órdenes pre-rediseño form): `in_review → names_taken → in_review` (loop hasta encontrar nombre disponible — solo aplicaba cuando el form aceptaba 3 nombres y todos estaban tomados)

**Auto-refresh sin recargar (2026-07-08):** tanto `/admin` (`OrdersTable.tsx`, vía `router.refresh()`) como `/admin/orders/[id]` (polling propio) vuelven a pedir la data cada 20s en segundo plano — así un cambio disparado por webhook (nueva orden, reembolso, chargeback) aparece solo. En el detalle de orden solo se actualiza el objeto `order`, nunca `notes`/`selectedStatus`, para no pisar una edición en curso del admin. Sin loader visible; si nada cambió, no hay ningún repintado perceptible (React solo actualiza lo que realmente difiere).

## Módulo de Contabilidad (`/admin/contabilidad`)

Módulo interno para gestión financiera del negocio. 100% Next.js/Vercel — no usa Railway.

### Tablas Supabase

- `accounting_clients` — clientes contables (puede enlazarse a `Order` via `order_id`)
- `accounting_income` — facturas/ingresos (enlazado a cliente via `client_id` y a orden via `order_id`)
- `accounting_expenses` — gastos con soporte de recurrencia

```
accounting_expenses {
  id, expense_date, category, expense_type ('fixed'|'variable')
  description, amount, receipt_note
  is_recurring     Boolean  -- bill recurrente (mensual/anual)
  recurrence       Text     -- 'none' | 'monthly' | 'annual'
  renewal_date     Date     -- próxima fecha de vencimiento (para alertas y auto-renovación)
  auto_renew       Boolean  -- default true; si false, no se replica al vencer
  receipt_file_url Text     -- URL pública del archivo adjunto (Supabase Storage, bucket expense-receipts)
}
```

### Páginas

```
/admin/contabilidad              — Dashboard: stats, taxes estimados, pagos IRS trimestrales, alertas vencimiento
/admin/contabilidad/clientes     — Lista + CRUD de clientes contables
/admin/contabilidad/clientes/[id]— Detalle de cliente
/admin/contabilidad/ingresos     — Facturas/ingresos con filtros
/admin/contabilidad/gastos       — Gastos: manual, IA, recurrentes, exportar
/admin/contabilidad/reportes     — Reporte consolidado
```

### Lógica de taxes federales estimados

La tasa se configura en el dashboard (default 25%) y se guarda en `localStorage` con key `contabilidad_tax_rate`. El cálculo es 100% frontend:
- `estimatedTax = max(0, totalBalance) * taxRate / 100`
- `netProfit = totalBalance - estimatedTax`
- Pagos trimestrales IRS = `estimatedTax / 4`

Fechas de vencimiento IRS 2025: Q1 Apr 15 · Q2 Jun 16 · Q3 Sep 15 · Q4 Ene 15 2026.
Florida no tiene state income tax — solo aplica federal.

### Sync de órdenes

`POST /api/contabilidad/sync-orders` importa órdenes de `Order` que no tengan ya un `accounting_income.order_id`. Por cada orden crea un `accounting_client` + `accounting_income`. Es idempotente — se puede correr múltiples veces sin duplicar.

Para limpiar datos de prueba antes de producción: botón "Poner en cero" en el dashboard llama a `DELETE /api/contabilidad/reset` con `{ confirm: 'RESET_CONTABILIDAD' }`.

### Análisis de facturas con IA

`POST /api/contabilidad/analyze-invoice` acepta PDF, JPG, PNG o WEBP. Usa `claude-haiku-4-5-20251001` para extraer: vendor, fecha, monto, categoría, si es recurrente. Requiere `ANTHROPIC_API_KEY` en env vars.

### Bills recurrentes y alertas

Gastos con `is_recurring = true` muestran alertas cuando `renewal_date` está dentro de 30 días:
- Rojo: ya venció (hasta 7 días atrás)
- Naranja: vence en ≤7 días
- Ámbar: vence en 8–30 días

Las alertas aparecen tanto en `/admin/contabilidad/gastos` como en el dashboard principal.

### Auto-renovación de gastos recurrentes

`POST /api/contabilidad/gastos/process-renewals` — se llama automáticamente al cargar `/admin/contabilidad/gastos`. Lógica:
- Busca gastos con `is_recurring=true`, `auto_renew=true` (o null), y `renewal_date <= hoy`
- Por cada uno: crea un nuevo registro para el siguiente período (`expense_date = renewal_date`, `renewal_date = +1 mes o +1 año`)
- El registro original queda como histórico (`renewal_date = null`)
- Si se procesaron renovaciones, aparece un banner verde con el conteo

Control desde la UI:
- Toggle **"Auto-renovar al vencer"** en el formulario (dentro de los campos de recurrencia)
- Botón rápido **● Auto / ○ Pausado** en la columna Recurrencia de la tabla — hace PATCH de `auto_renew` sin abrir el formulario

### Facturas adjuntas en gastos

Bucket Supabase Storage: `expense-receipts` (público). Path: `expenses/{id}/receipt.{ext}`.

- `POST /api/contabilidad/gastos/[id]/upload` — sube archivo y actualiza `receipt_file_url` en la fila
- El upload ocurre justo después de guardar el gasto (paso 2 en `handleSave`)
- La tabla muestra un ícono 📄 clickeable en la columna "Factura" cuando hay archivo adjunto
- Al editar un gasto con archivo existente, se muestra link "Ver archivo adjunto" + opción de reemplazar

### Exportación

- **Excel**: SheetJS (`xlsx`) — corre en browser, genera `.xlsx` con filtro activo
- **PDF**: `window.print()` con `@media print` CSS que oculta navegación y botones

### Migraciones SQL aplicadas

Correr en Supabase SQL Editor:
```sql
-- Bills recurrentes (original)
-- Ver archivo: supabase_migration_recurring_expenses.sql

-- Facturas adjuntas y auto-renovación (2026-06-04)
ALTER TABLE accounting_expenses ADD COLUMN IF NOT EXISTS receipt_file_url TEXT;
ALTER TABLE accounting_expenses ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
```

Storage bucket requerido: `expense-receipts` (público) — crear en Supabase → Storage → New bucket.

---

## Sistema de Notificaciones por Email (refactorizado 2026-06-19)

**Doc canónica:** `LOGICA_DE_NEGOCIO/02_emails_automaticos.md` — tiene la lista de 12 emails, matriz completa de FROM/TO/Reply-To/Subject por email, y el flujo de cada uno.

### Estado actual

- **Resend con dominio `opabiz.com` verificado** (SPF + DKIM + DMARC). Cuenta migrada de aneudysoto@gmail.com a la cuenta de OpaBiz.
- **6 buzones Zoho activos:** `noreply@`, `marketing@`, `support@`, `info@`, `admin@`, `alert@`.
- **12 emails del sistema** (A0–A7, B1, C1, C2, D1, D2). Códigos identificadores en el doc 02.
- **Display Name "OpaBiz"** en todos los FROM — el cliente ve "OpaBiz" en su inbox en lugar de "noreply".
- **Subjects prefijados** con `OpaBiz:` / `OpaBiz Support:` / `OpaBiz Alerts:` / `OpaBiz Contact:` según rol.
- **Reply-To `info@opabiz.com`** en TODOS los emails — el cliente puede responder con un click y va a un buzón Zoho monitoreado.
- **Alertas internas** (A0 nueva orden creada, A3 nombres tomados, C2 nueva orden NBL) van todas a **`alert@opabiz.com`** (buzón unificado).

### Implementaciones por archivo

| Archivo | Emails | Notas |
|---|---|---|
| `backend/lib/notifications.ts` | A2–A7 + `sendOrderConfirmation()` (usado para reenvío manual desde admin) | Único lugar canónico. Las copias de Railway/Express se eliminaron 2026-05-18 (commit `c7bdc07`). |
| `backend/app/api/orders/route.ts` | A1 + A0 (inline) | A1 dispara la confirmación al cliente, A0 dispara la alerta interna. Ambos son fire-and-forget. |
| `backend/app/api/campaigns/send/route.ts` | B1 | Marketing — FROM `marketing@opabiz.com` separado del transaccional. |
| `backend/app/api/webhooks/stripe/route.ts` | C1 + C2 | Flow `/new-business` (NBL). |
| `backend/app/api/contact/route.ts` | D1 + D2 | D1 al admin, D2 al visitor. Rate limit 5/h/IP. |
| `backend/app/api/proxy/notifications/[type]/route.ts` | Disparador admin de A2/A4/A5 + reenvío manual de A1 | Endpoints internos del panel admin para botones manuales. A6/A7 se movieron a `/api/admin/send-approval-update` (ver sección 2026-07-09 más abajo) — ya no existen los tipos `order-approved` ni `certificate` acá. |
| `backend/app/api/client-auth/signup/route.ts` | "Your account is ready" | Nuevo 2026-07-08 — email al crear cuenta sin orden (ver sección de Login más arriba). |
| `backend/app/api/admin/send-approval-update/route.ts` | A6+A7 fusionados (`sendOrderApprovalUpdate`) | Nuevo 2026-07-09 — ver sección dedicada más abajo. |
| `backend/app/api/cron/priority-filing-notice/route.ts` | A5 automático para Priority | Nuevo 2026-07-09 — ver sección dedicada más abajo. |

**⚠️ Este doc y el 02 quedaron desactualizados** — el conteo de "12 emails" no incluye los agregados después: confirmación de pago del home/servicios vía Stripe webhook, "Save your application number" de `/api/orders/draft`, los 3 de `/booking`, la confirmación de `/api/services/request`, y el de signup de arriba. Son ~18 templates reales al cliente hoy. Pendiente: refrescar el doc 02 con el inventario completo.

### Env vars críticas (Vercel Production + Development)

```
RESEND_API_KEY              ✓ cuenta OpaBiz
RESEND_FROM_TRANSACTIONAL  = noreply@opabiz.com
RESEND_FROM_MARKETING      = marketing@opabiz.com
RESEND_FROM_SUPPORT        = support@opabiz.com
RESEND_REPLY_TO            = info@opabiz.com
INTERNAL_ALERT_EMAIL       = alert@opabiz.com
CONTACT_FROM_EMAIL         = noreply@opabiz.com
CONTACT_TO_EMAIL           = info@opabiz.com
```

Si una env var falta, el código degrada a un fallback seguro (sandbox de Resend o gmail viejo) para que dev local no rompa — pero el deploy productivo siempre debe tener las 8.

### Race condition fire-and-forget (caso real FBFC-EC1DCF38)

El send A1 en `/api/orders/route.ts` es fire-and-forget (`.catch(err => console.error(...))`). En Vercel serverless, el container puede matarse después de responder 201 y el Promise queda colgando sin completar. Resultado: la orden se guarda pero el email nunca llega a Resend (ni Delivered ni Failed).

**Rescate manual:** botón **"🔁 Reenviar Confirmación de Orden"** en `/admin/orders/[id]` — usa `sendOrderConfirmation()` de notifications.ts a través de `POST /api/proxy/notifications/order-confirmation`. Audit log registra `email.order-confirmation-resent`.

**Sistema de alertas automáticas POSPUESTO** (decisión del founder 2026-06-19) — el plan completo (Resend webhook + Sentry) está documentado en doc 02 sección "Pendientes" por si pasa más de una vez y se decide retomar.

### Rediseño de plantillas + fusión Aprobado/Certificado (2026-07-09)

Sesión larga rediseñando templates uno por uno. **Requiere haber corrido** `supabase_migration_order_delivery_tracking.sql` (4 columnas nuevas en `Order`: `paidAt`, `orderProcessedEmailSentAt`, `deliveredItems`, `deliveredFiles` — ✅ ya corrida en producción 2026-07-09).

**Convenciones nuevas aplicadas a los 3 templates rediseñados** (Payment confirmed servicios, Nombres Tomados, Orden Procesada) — usar estas mismas reglas al rediseñar los que faltan:
- Header blanco con logo OpaBiz (OB + "Opa"/"Biz"), igual que el resto del sitio — no la franja navy vieja con "Florida Business Formation Center".
- **"Order Number"**, nunca "Confirmation Number" — se unificó en TODO el sitio (popup de Login del home, `/order/complete`, `/client-portal`, A1, emails de pago). Va justo debajo del saludo, antes del resto del contenido (mismo lugar en los 3 templates, decisión founder: "mantener la armonía").
- Saludo con **nombre completo** (`firstName + lastName`), no solo el primer nombre — como Amazon. Única excepción: el email de bienvenida del signup (`client-auth/signup`), porque ese form no pide apellido.
- **Español en "usted"**, no "tú" — decisión founder: es un servicio legal/de trámites de gobierno, no una app casual; "usted" no ofende a nadie, "tú" sí puede sentirse poco profesional para parte de la audiencia. Aplica a pronombres Y conjugaciones (tu→su, te→le, haz→haga, ordenaste→ordenó, etc.), no solo el pronombre.
- **Nunca prometer plazos que no controlamos** (aprobación de Florida). Ya se había hecho en `/order/complete`; ahora aplica también a "Orden Procesada".
- **Detalle real de la orden, no solo el nombre del paquete** — si el paquete es "Standard", listar qué incluye ese tier (mismo `PACKAGE_SERVICES` que `/order/complete`) + los add-ons reales que compró, no un genérico "Package: Standard" que "no dice nada como cliente" (feedback founder textual).
- Nada de tono de alerta/urgencia falsa (⚠️, rojo/ámbar, "we need your help") — se parece al patrón que usan los emails de phishing. Tono factual y calmado en su lugar (aplicado en Nombres Tomados).
- Sin guion largo (—) en párrafos de texto corrido (ver `[[feedback_writing_style]]`) — sí está bien en labels/precios tipo "X — Florida State Fee".

**Auto-envío de "Orden Procesada" (A5) para Priority/Expedited** — `backend/app/api/cron/priority-filing-notice/route.ts`, cada 30 min (`vercel.json`, requiere plan Vercel con crons frecuentes). Para **Standard** el email sigue 100% manual (botón "Filed" del admin). Para **Priority**, si el staff no lo mandó manual, el sistema lo manda solo a las ~24h del pago (`Order.paidAt`, seteado en el webhook `handleFormationPaid` — NO usar `updatedAt`, se pisa con cualquier otra edición). El cron **solo manda el email, nunca cambia el status** — el staff sigue avanzando el estado a mano cuando corresponda. Regla de horario (para no mandar de madrugada): si las 24h caen en horario diurno (9am–6pm hora de Florida) se adelanta 1h; si caen de noche, se manda a las 6pm del mismo día calendario. Anti-duplicado: `Order.orderProcessedEmailSentAt` — el botón "Filed" chequea ese campo antes de reenviar, y el panel admin muestra un aviso si el cron ya lo mandó solo.

**Fusión de "Orden Aprobada" (A6) + "Certificado" (A7) en un solo email dinámico** — decisión founder: eran dos emails separados que asumían que siempre había un Certificate de formación de por medio (no servía para servicios sueltos tipo EIN/ITIN). Ahora:
- `sendOrderApprovalUpdate()` en `lib/notifications.ts` reemplaza a los viejos `sendOrderApproved`/`sendCertificateDelivery` (eliminados). Contenido dinámico según `approvedItems`/`pendingItems`/`attachments` — menciona "aprobado por el Estado de Florida" cuando corresponde, lista qué quedó aprobado y qué sigue en proceso, con o sin archivos adjuntos (soporta varios archivos en un mismo email).
- El botón **"Approved" del admin pasa a ser puramente interno** — solo cambia `status`, ya NO manda ningún email (antes sí). El aviso al cliente ahora es una acción separada.
- Panel admin (`/admin/orders/[id]`), sección nueva **"Enviar documento(s) al cliente"** (visible en status `filed` o `approved`): checklist de ítems (formación + cada add-on marcado `true`, ver `Order.addons`), pre-tildados y deshabilitados los que ya se entregaron en una ronda anterior (`Order.deliveredItems`, se acumula entre rondas — nunca se resetea). Subida de **múltiples archivos** a la vez. Checkbox **"Enviar sin adjuntar archivo"** — sin marcarlo, el botón de enviar queda deshabilitado si no hay archivo; marcándolo, al hacer clic en enviar sale un `confirm()` del navegador ("¿Estás seguro que quieres enviar sin adjuntar archivo?") antes de mandarlo de verdad.
- Endpoint: `POST /api/admin/send-approval-update` (reemplaza al viejo `/api/admin/upload-certificate`, eliminado). Sube archivo(s) a Supabase Storage (bucket `certificates`, path `orders/{id}/{timestamp}-{filename}`), calcula `pendingItems` = universo de ítems menos lo ya entregado, envía el email, y marca `status: 'completed'` automáticamente solo cuando no queda nada pendiente (si no, mantiene `approved`).

**Pendiente para la próxima sesión** (quedó anotado, no se llegó a hacer):
- Aplicar las mismas convenciones de arriba (header, Order Number, nombre completo, usted, sin plazos prometidos) a los templates que faltan: A1 (confirmación de orden, la más importante — es el primer email que recibe todo cliente), A4 (sugerencia de nombres), y los de `/booking`. ~~El "Payment confirmed" de formación del home~~ se hizo el 2026-07-10 (ver abajo).
- Idea pendiente de aprobar con el socio: página `/check-name` para que el cliente valide disponibilidad de nombre — ver `[[project_pendiente_busqueda_nombre]]` en memoria.

### Fix de etiquetas crudas de addons/servicios + email "Payment confirmed" de formación (2026-07-10)

**Bug encontrado:** el checklist admin "Enviar documento(s) al cliente" mostraba literalmente `services`, `bundles`, `intake`, `lines` como si fueran ítems comprados en vez de nombres reales, para órdenes de `/servicios/checkout` (`package:'services'`). Causa: `Order.addons` tiene un shape distinto según el tipo de orden — booleanos `{ein:true,...}` en formación, `{services:[], bundles:[], intake:{}, lines:[]}` en à la carte, array plano `['ein','labor_law_poster']` en marketing (`package:'addon'`) — y el código en varios lugares asumía siempre el shape de formación, haciendo `Object.keys(addons)` sin más.

**Fix:** `backend/lib/order-items.ts` (nuevo) — única fuente de verdad para resolver claves de `Order.addons` a etiquetas legibles sin importar el shape. `getOrderItemKeys(pkg, addons)` normaliza los 3 shapes a claves con prefijo (`svc:id`, `bundle:id`, `mkt:id`, o clave plana de formación); `getOrderItemLabel(key, {entityType, lang})` las traduce. Aplicado en:
- Checklist admin (`/admin/orders/[id]`) — `pendingDeliveryItems()`.
- `POST /api/admin/send-approval-update` — cálculo de `pendingItems`/`approvedItems`.
- `sendOrderApprovalUpdate()` en `lib/notifications.ts` — el email real que recibe el cliente (mismo bug, no solo cosmético en admin).
- Portal del cliente (`DashboardContent.tsx`) — antes las órdenes `package:'services'` mostraban el paquete como el string crudo `"services"` sin listar nada comprado (el filtro solo conocía las 4 claves de formación). Ahora muestra "Servicios a la Carta" + detalle real.

**Pulido del flujo de pago del home** (iterado sobre pruebas reales en producción, mismo día):
- **Order Summary (sidebar, todos los pasos) + "Formation Info" del Review**: ahora listan qué incluye el paquete elegido (checkmarks), no solo el nombre del tier. Nuevo objeto `FM_PACKAGE_ITEMS` en `page.tsx` (mismo contenido que `PACKAGE_SERVICES` de `lib/notifications.ts`/`order/complete`).
- **Línea "Package" del sidebar**: antes mezclaba nombre+precio en un solo texto con guion largo ("Standard — $199"), inconsistente con el resto de líneas (label + precio solo). Ahora el label es dinámico ("Standard Package"/"Paquete Standard") y el valor es solo el precio. Fix relacionado: el sidebar no se refrescaba al togglear EN/ES sin cambiar de paso (`setLang()` ahora llama `fmUpdateSummary()` después de `fmTranslate()`).
- **"Additional Services" del Review**: pasó de grid 2 columnas a lista tipo factura (precio alineado a la derecha) y se movió justo debajo de "Formation Info" (antes al final, después de Members). De paso se agregaron los 6 addons que faltaban en esa lista (`dba, br, gd, gs, sc, bl` — se cobraban pero no se mostraban).
- **`/order/complete`**: unificados los dos boxes que mostraban información duplicada (un box de "incluye" con addons sin precio + un box de "Payment summary" con los mismos addons con precio). Ahora un solo box: inclusiones del paquete → addons con precio → cargos base (paquete/tarifa estatal/acelerado) → total. Se deriva de `order.lines` (no de la lista `addons` de `/api/checkout/status`, que solo cubría 6 de los 12 addons posibles — mismo bug de fondo, resuelto de paso).
- **Paso "Faster Processing" del home**: rediseñado para igualar el layout de `/servicios/checkout` — tarjeta de Expedited con badge + intro + 2 bullets, tarjeta de decline pareja debajo (antes tarjeta grande + botón chico tipo pill, estilo distinto al de servicios).
- **Email "Payment confirmed" de formación** (`handleFormationPaid` en `app/api/webhooks/stripe/route.ts`) — cierra el pendiente de la sesión de ayer (arriba). Rediseñado para espejar `handleServicesPaid` punto por punto: mismo saludo sin eyebrow ni emoji, tabla de precios real por ítem vía `computeFormationTotal` (antes texto plano sin precios), sección "What's included", 3 pasos numerados "What happens next", mismo cierre sin la línea de WhatsApp. Sigue sin rama de idioma (`isEs`) — `Order` de formación no guarda el idioma del cliente en ningún campo hoy; queda como pendiente si se quiere resolver.

## Diseño de Login Pages

Ambas páginas de login (`/login` y `/client-portal`) usan el mismo patrón visual:
- Fondo oscuro `#0f1c2e` con header de marca centrado arriba del card
- Card con foto a tamaño natural (`<img>` tag, sin `object-fit:cover`) + panel de formulario
- El panel de formulario iguala la altura de la foto via `align-items: stretch`
- Fotos: `/admin-bg.jpg` (escritorio flat-lay) y `/client-portal-bg.jpg` (hombre en escaleras)
- CSS-in-JS con `<style>` tag (misma convención que páginas marketing)

## Responsive Design (Etapa 17 — en progreso)

### Breakpoints estándar del proyecto
```
≤ 768px  — tablet / mobile landscape
≤ 480px  — mobile portrait (iPhone SE y similares)
```
No inventar breakpoints intermedios. Agregar siempre en este orden (mobile-first):
default (desktop) → `@media(max-width:768px)` → `@media(max-width:480px)`

### Patrón de implementación
Todos los estilos responsive van al **final del string CSS** de cada página, antes del backtick de cierre. Nunca en un archivo separado ni en `globals.css`.

```css
/* al final del const styles = `...` */
@media(max-width:768px) { ... }
@media(max-width:480px) { ... }
```

### Navbar hamburguesa (homepage)
El menú hamburguesa del home vive en tres lugares de `backend/app/page.tsx`:

1. **CSS** — clases `.hamburger`, `.hamburger.open`, `nav.open` y su `@media(max-width:768px)`
2. **HTML** (dentro de `const body`) — botón `id="hamburger-btn"` dentro del header
3. **JS** (dentro del `<script>` del body) — función `toggleNav()` + event listeners

Si algo del hamburger falla, revisar los tres puntos. **No tocar uno sin verificar los otros dos.**

### Estado responsive por página (2026-05-13)

| Página | Breakpoints activos | Notas |
|---|---|---|
| `/` (home) | 900px, 768px, 580px, 480px | Hamburger + layout general; footer links corregidos (`href="#"` → anchors reales) |
| `/client-portal` | 720px, 480px | Oculta foto en mobile |
| `/login` | 760px, 480px | Oculta foto en mobile |
| `/admin` | 640px | Stats grid 2 columnas |
| `/client-portal/dashboard` | 500px, 480px | Botón download full-width |
| `/new-business` | 960px, 700px, 600px, 540px | Pre-existente antes Etapa 17 |
| `/servicios` | 1100px, 768px, 480px | Hamburger + hero azul + accordion expand en mobile (popup en desktop) |
| `/privacy` `/terms` `/legal` | 768px | Hamburger; hero `position:sticky;top:66px`; `p`/`.hero-meta`/`.breadcrumb` ocultos; sidebar `position:static`; header sticky conservado (NO usar `position:relative` en header dentro del media query — rompe el sticky) |
| `/admin/contabilidad/gastos` | 1024px, 768px, 480px | Tabla scroll horizontal; botones touch 44px; modal 95vh |

**Pendiente responsive:** `/admin/orders/[id]`, `/admin/campaigns` (tabla de campañas tiene scroll horizontal correcto desde 2026-06-08)

### Regla de botones táctiles
Todo botón CTA en páginas públicas debe tener mínimo 44px de alto en mobile. Usar `min-height: 44px` o `padding` que lo garantice. Referencia: WCAG 2.5.5 y Apple HIG.

---

## Módulos Express (Railway)

```
modules/orders/       — CRUD de órdenes + lógica de negocio
modules/clients/      — gestión de clientes
modules/payments/     — lógica de pagos
modules/documents/    — gestión de documentos
modules/notifications/ — emails/notificaciones
modules/names/        — verificación de nombres de empresas
```

Todos se montan en `server.ts`. El server escucha en `PORT` (default 4000). CORS configurado para Vercel + localhost en dev.

---

## Performance

### Optimizaciones aplicadas (2026-06-05)

**Imágenes** — comprimidas con sharp (quality 72) + versiones WebP generadas:
- `photonewbusiness.jpg`: 1.3 MB → 62 KB (95% ahorro)
- `miami-bg.jpg`: 313 KB → 85 KB (73%)
- `admin-bg.jpg`: 258 KB → 68 KB (74%)
- `Claudia.jpg`: 179 KB → 41 KB (77%)
- `client-portal-bg.jpg`: 68 KB → 18 KB (73%)

Si se necesita recomprimir: `node -e "require('sharp')..."` — sharp está en devDependencies.

**Fuentes** — Google Fonts migrada de `<link rel="stylesheet">` (render-blocking) a `<Script strategy="afterInteractive">` en `layout.tsx`. El browser renderiza con system fonts primero (FCP inmediato) y swapea cuando cargan las web fonts.

### Scores Lighthouse (post-optimización, 2026-06-05)

| Métrica | Mobile | Desktop |
|---|---|---|
| Performance | 63 | 66 |
| FCP | 5.5s | **1.8s** |
| LCP | 6.7s | 6.5s |
| TBT | 0ms | 40ms |
| SEO | 100 | 100 |

**Limpieza de código muerto (2026-07-01, commit `654e94e`):** borradas **42 funciones huérfanas de `page.tsx` (~681 líneas)** del flujo viejo del form (nunca llamadas, `ref==0`: `submitForm`, `buildOrderReview`, `fmBuildUpgradeCards`, `fmRenderMemberCard`, `updateTotal/updateProgress`, `selectEntity/selectPkg/nextStep`, etc.) + `DashboardView.tsx` (462 líneas). Total 1143 líneas, cero cambios de comportamiento (verificado con `tsc` + `node --check` del script inline). Método y detalle en memoria `project_home_dead_code_cleanup.md`.

**Pendiente para siguiente iteración de performance:** Lazy-load / componentizar el formulario en `page.tsx` (~6,800 líneas, HTML inline gigante). El LCP de 6-7s en ambos dispositivos se debe principalmente al tamaño del HTML generado — requiere refactor de componentes. **Es el premio real de performance y NO se ha tocado.**

---

## Sistema de Citas (`/booking`) — 2026-06-05

Sistema propio de agendamiento, sin dependencias externas (no Calendly, no Cal.com).

### Configuración
- **Horario:** Lunes a Sábado, 9:00am – 7:00pm
- **Duración:** 30 min por cita + 10 min buffer = bloques de 40 min
- **Capacidad:** 15 slots/día
- **Slots:** 09:00, 09:40, 10:20, 11:00, 11:40, 12:20, 13:00, 13:40, 14:20, 15:00, 15:40, 16:20, 17:00, 17:40, 18:20

### Tablas Supabase (correr migrations)
```sql
-- Ver: supabase_migration_appointments.sql
CREATE TABLE appointments (id, created_at, name, email, phone, date, time, meeting_method, note, status)
CREATE TABLE blocked_slots (id, created_at, date, time, reason)

-- Columna meeting_method (si la tabla ya existía antes):
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_method text DEFAULT 'phone';
```

### Modelo appointments
```
appointments {
  id              uuid     PRIMARY KEY
  name, email, phone       -- phone es obligatorio desde el formulario
  date            date     -- YYYY-MM-DD
  time            text     -- '09:00', '09:40', etc.
  meeting_method  text     -- 'phone' | 'whatsapp'  (zoom fue eliminado 2026-06-08)
  note            text?
  status          text     -- 'pending' | 'confirmed' | 'cancelled'
}
```

### Emails automáticos
- **Al cliente:** confirmación con fecha, hora, método de reunión, botones Reschedule + Cancel
- **Al admin:** notificación con datos completos + link WhatsApp al cliente + link email
- **Al reprogramar:** notificación a cliente y admin con nueva fecha/hora
- **Al cancelar:** notificación a cliente + botón para agendar nueva cita

Los links de Reschedule/Cancel usan el `id` UUID de la cita (difícil de adivinar). Requieren `NEXT_PUBLIC_URL` en env vars para construir la URL correcta.

### Restricción Resend plan gratuito
En plan gratuito, Resend solo entrega emails al correo registrado en la cuenta. Al migrar al dominio propio (`@opabiz.com`), los emails llegarán a cualquier dirección sin restricción.

### Pendientes del sistema de citas
- [x] Configurar `NEXT_PUBLIC_URL=https://opabiz.com` en Vercel env vars — ✅ hecho 2026-06-08
- [ ] Migrar Resend a dominio propio para que emails lleguen a todos los clientes
- [ ] Considerar recordatorios automáticos 24h antes de la cita (requiere cron job)
- [ ] Soporte bilingüe EN/ES en páginas `/booking/reschedule` y `/booking/cancel` — reusar como referencia el patrón `T = { en, es }` + localización de fechas (`es-ES`) ya implementado en la carta (`backend/lib/new-business-letter.ts` + `generate-letter/route.ts`)

---

## Sunbiz SFTP — daily files cron (reusar approach datallc)

Para el **cron nocturno** que mantiene la DB Turso de Sunbiz al día con las empresas nuevas registradas en Florida cada día, **NO construir nada nuevo**. Existe ya el script Python `florida_sftp.py` del proyecto hermano `datallc` (path: `c:\Users\ethan\datallc\fase0-validation\src\ingest\florida_sftp.py`) que funciona y está probado en producción (el founder retiró 57K registros en 10 min usándolo).

### Lo que YA funciona en datallc

- **Librería**: `paramiko` (estándar Python SFTP, no construye cliente custom).
- **Credenciales hardcoded públicas**: `sftp.floridados.gov` user `Public` password `PubAccess1845!` (acceso público oficial, no requiere registro).
- **Path SFTP**: `doc/cor` (no `doc/Quarterly/Cor` — ese es el bulk inicial).
- **Patrón archivo daily**: `YYYYMMDDc.txt` (regex `^\d{8}c\.txt$`). Florida publica 1 por día con las novedades.
- **Schema parseado**: FULL 1440 chars (no los 668 que usé en la carga inicial). Incluye:
  - Doc number, name, entity_type, status, filing_type, filing_date
  - Principal address (addr1, addr2, city, state, zip, country)
  - Mailing address
  - **FEI number** (494 offset, 14 chars) — útil para depuración/marketing
  - **last_tx_date** (495, 8 chars) — fecha última transacción
  - Registered Agent (name + type P/C + addr completo)
  - **Hasta 6 officers** (offset 668, 128 bytes cada uno) con:
    - title (4 chars)
    - type (P=persona, C=company)
    - name (42 chars sub-dividido en last(20) + first(14) + middle(8))
    - addr completo (addr + city + state + zip)
  - Officers tipo `P` también se surfacean al array `members` para marketing personalizado.

### Por qué el schema FULL en el cron nocturno (y NO en el bulk inicial)

Decisión documentada 2026-06-22 (`project_sunbiz_schema_alcance.md` en memoria):

- **Carga inicial (3.5M+ ACTIVE)**: solo schema mínimo (verificación de nombres). 668 chars.
- **Cron nocturno (~1.5K/día)**: schema COMPLETO. 1440 chars con officers + FEI + last_tx_date. Para depuración manual de órdenes y marketing personalizado a empresas recién registradas.

### Reusar para el cron en OpaBiz

Para el cron nocturno de Turso/Sunbiz en OpaBiz **NO escribir scraper nuevo**. Opciones por orden de simplicidad:

1. **Portar `florida_sftp.py` a Node.js** usando `ssh2-sftp-client` (la lib que ya tenemos del scraper de bulk) + el mismo parsing 1440 chars. Estructura del script ya está clara en datallc.
2. **Llamar al Python directo** desde un Vercel Cron / GitHub Actions cron que SSH-eje al VPS Hetzner USA, corra el script Python, y publique al Turso vía libsql.
3. **Pasar tareas al proyecto datallc** si está siendo mantenido — datallc ya hace esto.

### Velocidad medida en datallc

Founder reportó **57,000 registros en 10 minutos** (~95 records/seg). Para el daily file (~1.5K registros) son **<1 minuto**. Trivial.

### Documentación oficial del layout

Florida Division of Corporations publica el layout completo: https://dos.sunbiz.org/data-definitions/cor.html

---

## Auditoría de código (2026-07-12)

Auditoría general del proyecto (no ligada a un diff puntual) pedida por el founder: "incongruencias, errores de código, código muerto, todo cuanto sea necesario corregir". Se corrió con 3 agentes en paralelo, cada uno cubriendo un área: **backend API** (`app/api/**` + `modules/**`), **frontend** (`page.tsx`, admin, client-portal, servicios/checkout), y **`lib/*.ts`** (utilidades compartidas). Encontraron 18 problemas concretos. Se resolvieron los 5 críticos el 2026-07-12 y los 6 importantes el 2026-07-13; quedan 7 menores + "usted" en `/servicios/checkout` para otra sesión.

### ✅ Resueltos hoy

1. **Buscador de nombres del admin usaba datos mock** (`modules/names/names.route.ts` — lista hardcodeada de 10 nombres, nunca conectada a Sunbiz real pese al comentario "se reemplaza en Etapa 5"). Ahora usa `checkNameAvailability()` de `lib/sunbiz-namecheck.ts` (Turso, mismo chequeo que `/api/orders`). Requirió cambiar los imports de `sunbiz-namecheck.ts` de `@/lib/...` a rutas relativas (`./turso`, `./sunbiz-normalize`) porque `tsconfig.server.json` (build de Railway) no tiene el alias `@/` configurado — con imports relativos el archivo compila igual en ambos runtimes (Next.js y Express). **⚠️ Pendiente de verificar:** `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` deben estar cargadas en las env vars de **Railway** además de Vercel — si faltan, `checkNameAvailability()` no rompe pero degrada a `available:true` en silencio (mismo comportamiento defensivo que en Next.js).

2. **`sendOrderProcessed` (A5) y `sendOrderConfirmation` (A1) mostraban claves crudas** para órdenes de servicios/marketing — mismo bug de shape-unsafe `Object.entries(order.addons)` que `lib/order-items.ts` (creado el 2026-07-11) ya había resuelto en otros lugares, pero no se aplicó acá. Ahora ambas usan `getOrderItemKeys`/`getOrderItemLabel`. De paso: el parámetro `addons` de ambas funciones pasó de `Record<string, boolean> | null` (mentira de tipo para órdenes no-formación) a `unknown`, y se sacaron los casts falsos en los 3 call sites (`api/orders/route.ts`, `api/proxy/notifications/[type]/route.ts`, `api/cron/priority-filing-notice/route.ts`). También se ocultó el botón "⚠️ Email: Nombres Tomados" en `/admin/orders/[id]` para órdenes `package==='services'` (no aplica, no hay concepto de nombre de empresa ahí).

3. **Bug de precio al retomar una orden guardada** — `fmRestoreProgress()` (`page.tsx`) saltaba directo al paso guardado (7 u 8) sin pasar por el paso 6 (Faster Processing), así que `_fmSpeedSeen` quedaba en `false` y el Order Summary ocultaba el cargo de Expedited aunque `computeFormationTotal`/Stripe sí lo cobran sin ese gate. Fix: si `progress.step > 6`, `_fmSpeedSeen = true` antes de restaurar.

4. **Precios de paquetes desactualizados** ($49/$149/$249 en vez de $0/$199/$299) en 4 lugares: `PACKAGE_INFO` de `client-portal/dashboard/DashboardContent.tsx` y de `admin/orders/[id]/page.tsx`, la sección 4.1 de `/terms`, y el banner `topbar` del home (la versión en inglés decía "$49" mientras la española ya decía "GRATIS" — quedaron desincronizadas, señal de que el fix en español no se replicó en inglés).

5. **Paquete Basic ($0) se quedaba sin lista de "qué incluye"** en los emails — regresión del 2026-07-12 mismo día: al anidar las inclusiones bajo la línea de precio del paquete, Basic nunca genera esa línea (`computeFormationTotal` omite paquetes con precio $0). Fix: `withBasicDisplayLine()` (nuevo, `lib/pricing.ts`) inyecta dos líneas de **display únicamente** — "Basic Formation Package $99" + "Basic Package Discount -$99" (netea $0, no cambia el total real) — mismo truco visual que ya usa `/api/checkout/embedded` cuando el cupón de Stripe está configurado. A propósito se implementó **separado** de `computeFormationTotal`, no dentro: esa función también arma los line items reales que Stripe cobra, que ya tienen su propia lógica de cupón (gated por `STRIPE_BASIC_COUPON_ID`) — meterlo ahí hubiera duplicado la línea en el checkout real.

### ✅ Resueltos 2026-07-13 (los 6 importantes)

1. **Etiquetas de addons duplicadas** → unificadas: `lib/pricing.ts` `ADDON_LABELS` ahora deriva de `lib/order-items.ts` `FORMATION_ADDON_NAMES`; 4 archivos que reimplementaban `MARKETING_ADDON_NAMES` (`admin/orders/[id]/page.tsx`, `DashboardContent.tsx`, `client-portal/dashboard/page.tsx`, `webhooks/stripe/route.ts`) ahora usan `getOrderItemLabel()`.
2. **`computeFormationTotal`** ahora **lanza** si `package` no es basic/standard/premium en vez de caer a 'standard' en silencio — `handleFormationPaid` en el webhook lo envuelve en try/catch (el pago ya se marcó antes, solo se salta el email si falla).
3. **Constantes de email centralizadas** en `lib/email-constants.ts` (nuevo) — reemplaza redeclaraciones en 9 route.ts + `lib/notifications.ts`. Corrigió de paso un fallback de alerta interna con typo (`aneurysoto@gmail.com`) que solo activaba en dev sin env vars.
4. **Rutas de citas admin** (`booking/appointments`, `booking/blocked` + `[id]`) usan `verifyAdminToken` de `lib/session.ts` en vez de `jwtVerify` directo — antes no chequeaban `role:'admin'`, aceptando también un token `admin_pending` de 2FA a medio completar.
5. **Numeración de facturas**: `lib/invoice-number.ts` (nuevo) centraliza `insertIncomeWithInvoiceNumber()` — cuenta solo facturas del año actual y reintenta con el siguiente número si hay conflicto de unicidad. Requirió `supabase_migration_invoice_number_unique.sql` (constraint UNIQUE en `invoice_number`, ya corrida).
6. **Convención "usted"** aplicada en `page.tsx` (home) — ~170 líneas, pronombres y conjugaciones (imperativos tú→usted). De paso se corrigieron 2 usos de "Vuestro" (registro vosotros de España). **`/servicios/checkout` queda pendiente** — decisión explícita de hacerlo en otra sesión.

### ⏳ Pendientes (quedaron para otra sesión)

**Acción de infraestructura (no es código):**
- ⚠️ Confirmar que `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` estén cargadas en las env vars de **Railway** (no solo Vercel) — el buscador de nombres del admin (fix #1 de arriba) las necesita para consultar Sunbiz real. Si faltan, no rompe pero degrada a "disponible" en silencio, lo que puede llevar al staff a confiar en un resultado incorrecto.

**Importante (no resuelto):**
- Convención "usted" en `/servicios/checkout` (~63 instancias de tuteo, pendiente a propósito — ver punto 6 arriba).

**Menores:**
- CSS muerto (~10 clases: `.fp-bar`, `.fp-label`, `.fp-track`, `.fp-fill`, `.order-card-title`, etc.) en `page.tsx`, sobrantes de una versión anterior del Order Summary/progress bar.
- Dos escrituras fire-and-forget a Supabase que tragan errores sin loguear (`conversions` en `webhooks/stripe/route.ts`, `qr_scans.converted` en `sunbiz/checkout/route.ts`).
- Rutas de contabilidad (`gastos`, `ingresos`, `clientes`) aceptan JSON sin Zod — `amount` solo chequea truthy y puede terminar en `NaN` en la base.
- Exports sin consumidores externos: `PACKAGE_PRICES`, `STATE_FEE`, `AddonKey` en `lib/pricing.ts`; `MARKETING_ADDON_NAMES`, `formationItemLabel` en `lib/order-items.ts`.
- Código inalcanzable vestigial en `page.tsx` (`if(_next===6)_next=7` dentro de bloques donde `_next` nunca puede ser 6 — leftover del refactor del paso Faster Processing).
- Campo `addons: string[]` de `/api/checkout/status` ya no se lee en `/order/complete` desde el refactor a `order.lines`/`isBaseLine()` — candidato a podar.
- El chatbot (`api/chat/route.ts`, tool `get_order_info`) devuelve PII completo (nombre, email, teléfono, dirección, miembros, addons) con solo el prefijo de 8 caracteres del número de orden — confirmar que el rate-limit (`checkChatRateLimit`) sea suficientemente estricto para esa superficie.

---

## OPABIZ — sistema interno de despacho a empleados (retomado 2026-07-13)

App interna de Florida Business Formation Center para asignar órdenes a empleados de campo — **distinta** del sitio público que ven los clientes. Había arrancado en una sesión previa con otra IA (no documentada en su momento); se retomó y se construyó el motor de asignación + arranque del panel admin. Detalle completo en `LOGICA_DE_NEGOCIO/17_opabiz_integracion.md` y memoria `project_opabiz_sistema_interno`.

**⚠️ Lo más importante para no romper nada:** hay dos ids de "empleado" distintos, confirmado vía foreign keys reales (no vía docs, que no lo mencionaban):
- `usuarios.id` → identidad de login (email/password_hash/rol). Usado por `historial_actividad.usuario_id`.
- `EMPLEADOS.id` (tabla en mayúsculas) → registro operativo. Usado por `empleado_perfil.empleado_id`, `ordenes_opabiz.empleado_id`, `puntajes.empleado_id`, `inactividades.empleado_id`.

**Construido:**
- `backend/lib/opabiz-assignment.ts` — `pickBestEmployee()`: elige por disponibilidad + nivel jerárquico, ordena por puntaje → inactividades → tiempo de respuesta → fairness. Soporta `es_urgente` y exclusión de empleados.
- `backend/lib/opabiz-empleados.ts` — `registrarPuntaje()`/`registrarInactividad()`, único lugar autorizado para escribir en las bitácoras `puntajes`/`inactividades` (mantienen `EMPLEADOS` sincronizada). **Sin triggers de Postgres** — se verificó que no existe ninguno en toda la base; todo vive en código TypeScript, mismo patrón que el resto del proyecto.
- `POST/GET /api/opabiz/employees` — alta y listado de empleados (admin crea, sin autoservicio).
- `POST /api/opabiz/orders/[id]/assign` (manual) y `/auto-assign` (motor) — coexisten, el admin siempre puede pisar al motor.
- Cron cada 5 min (`/api/opabiz/cron/reassign-timeouts`) — reasigna si un empleado no acepta en 10 min.
- Panel visual en `/admin/opabiz` (listado + alta), linkeado desde la barra de `/admin`.

**Pendiente:**
- Login del empleado + PWA (Etapa 4) — JWT propio (no Supabase Auth, para seguir el patrón del resto del sitio), falta el flujo de invitación completo y la app en sí.
- Integración real con el pago — hoy nada crea `ordenes_opabiz` automáticamente cuando un cliente paga; se decidió no usar un DB trigger, se construirá como código de aplicación enganchado al webhook de Stripe cuando se retome.
- Definir `NIVEL_MINIMO_POR_SERVICIO` en el motor — hoy no restringe nada por tipo de servicio.

---

## Deploy

- `git push origin main` — Vercel detecta cambios en `backend/` y hace deploy automático
- Railway monitorea el mismo repo y despliega `server.ts` en Railway
- La rama principal es `main`; no hay staging branch actualmente
