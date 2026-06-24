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
- Dashboard rendering delegado a `DashboardContent.tsx` (client component) — `page.tsx` es server-only para fetch de datos. `DashboardView.tsx` quedó **sin uso** (candidato a borrar).
- Contacto: botones inline Email + WhatsApp (`wa.me/13528377755`) al hacer clic en "Contact us"

#### Login del cliente en el home (popover) — 2026-06-23
- El botón **"Login"** del header abre un **popover anclado** (top-right, sin oscurecer la página). NO modal centrado.
- Logueado: header muestra **"Hola, {nombre}" + "Mis órdenes" + "Salir"** (clase `portal-authed` en `<html>` controla visibilidad por CSS, sin estilos inline para no romper el responsive). Estado detectado client-side vía `GET /api/client-auth/me` → `{loggedIn, firstName}` (nada sensible; el home sigue estático).
- **Un solo campo** acepta número de orden O contraseña: si matchea `^(fbfc|fbnb)/i` → `confirmationNumber`, si no → `password`.
- Logout del home = `POST /api/client-auth/logout` (JSON, no recarga). El **GET** de logout (usado por el dashboard) redirige al **HOME** preservando idioma vía `?lang` (antes iba al viejo `/client-portal`).
- Safari "Hide My Email": el campo email usa `autocomplete="username"` + `name="username"`, sin `inputmode="email"` ni placeholder con `@`. Es heurístico de Apple, no 100% garantizado.

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

**Pendientes de la carta:**
- [ ] Sustituir logo provisional "FBFC" por logo real cuando esté disponible.
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
- **`lib/pricing.ts`** — cálculo de precio autoritativo server-side (anti-tampering). Espeja `updateTotal()`/`fmBuildPayload()` del form: paquetes (basic $0/standard $199/premium $299), state fee (LLC $125/Corp $70), expedited +$99 (gratis con premium), addons (ein $79, oa $59, itin $69, btr $79, str $79, cc $49). **Si cambian precios en page.tsx, actualizar aquí también.**
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
| **Gestión de Estado** | Botones contextuales por status. Cada avance dispara notificación al cliente automáticamente (`filed` → `sendOrderProcessed`, `approved` → `sendOrderApproved`) |
| **Certificate PDF** | Aparece solo cuando status=`approved`. Sube PDF a Supabase Storage (`certificates/orders/{id}/certificate.pdf`), envía email al cliente y marca orden `completed` |
| **Buscador de nombres** _(LEGACY — a ocultar)_ | Aparece solo cuando status=`names_taken`. Sirve para órdenes viejas que entraron antes del rediseño del form 2026-06-22. Las órdenes nuevas no llegan a este estado porque el form valida en vivo contra Turso antes de cobrar. |
| **Acciones manuales** | Forzar cualquier status vía selector + enviar emails sueltos (nombres tomados, certificate). Los emails A2/A4 (nombres tomados, sugerencias) quedan disponibles para órdenes legacy pero se desactivan cuando entre en producción la verificación en vivo. |
| **Notas internas** | Texto libre visible solo para el equipo, guardado en la orden |
| **Pre-filled Documents** | PDFs generados con datos del cliente: Articles of Organization, BOI, EIN SS-4, Operating Agreement |

Flujo de estados (órdenes nuevas, post-2026-06-22): `pending → in_review → ready_to_file → filed → approved → completed`
Rama legacy (órdenes pre-rediseño form): `in_review → names_taken → in_review` (loop hasta encontrar nombre disponible — solo aplicaba cuando el form aceptaba 3 nombres y todos estaban tomados)

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
| `backend/app/api/proxy/notifications/[type]/route.ts` | Disparador admin de A2/A3/A4/A5/A6/A7 + reenvío manual de A1 | Endpoints internos del panel admin para botones manuales. |

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

**Pendiente para siguiente iteración de performance:** Lazy-load del formulario en `page.tsx` (6,284 líneas inline). El LCP de 6-7s en ambos dispositivos se debe principalmente al tamaño del HTML generado — requiere refactor de componentes.

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

## Deploy

- `git push origin main` — Vercel detecta cambios en `backend/` y hace deploy automático
- Railway monitorea el mismo repo y despliega `server.ts` en Railway
- La rama principal es `main`; no hay staging branch actualmente
