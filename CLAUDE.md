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
  companyName, companyName2, companyName3
  entityType      // 'llc' | 'corp'
  speed           // 'standard' | 'expedited'
  package         String   // nombre del paquete o 'addon' (marketing)
  amount          Float
  members         Json?    // array de miembros/agentes
  addons          Json?    // {ein, oa, itin, ar}
  stripePaymentId String?
  paymentStatus   // 'pending' | 'paid'
  status          // pending → in_review → names_taken → ready_to_file → filed → approved → completed
}
```

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
- Login en `/client-portal` con **email + número de confirmación**
- Acepta `FBFC-XXXXXXXX` (formaciones LLC/Corp) y `FBNB-XXXXXXXX` (New Business Letter)
- `FBFC-` / `FBNB-` = primeros 8 chars del `Order.id` en mayúsculas
- Cookie `client_session` = el `order.id` completo
- Middleware protege `/client-portal/dashboard/*`
- Respuesta genérica en `/api/client-auth` — no revela si el email existe
- Toggle EN/ES con persistencia en `localStorage` (`portal_lang`)
- Idioma detectado en este orden: `?lang=` URL → `portal_lang` localStorage → `flbc_lang` localStorage (sitio principal)
- El botón Login del home pasa `?lang=es` cuando el sitio está en español
- Dashboard rendering delegado a `DashboardContent.tsx` (client component) — `page.tsx` es server-only para fetch de datos
- Contacto: botones inline Email + WhatsApp (`wa.me/13528377755`) al hacer clic en "Contact us"

---

## API Routes (Next.js — Vercel)

```
/api/auth/login           POST  — login admin → setea admin_session cookie
/api/auth/logout          POST  — borra admin_session
/api/client-auth          POST  — login cliente → setea client_session cookie
/api/client-auth/logout   POST  — borra client_session

/api/orders               POST  — crea Order en Supabase + envía email de confirmación
/api/webhooks/stripe      POST  — recibe checkout.session.completed → crea Order → envía FBFC

/api/sunbiz               GET   — lookup empresa: DB primero, Sunbiz scraping como fallback
/api/sunbiz/checkout      POST  — crea sesión Stripe para servicios de marketing

/api/campaigns/send       POST  — genera QR, construye email HTML, envía vía Resend
/api/campaigns/track-scan GET   — registra scan, actualiza status, redirige a /new-business
/api/campaigns/stats      GET   — métricas del dashboard admin
/api/campaigns/companies  GET+POST — lista con filtros / alta manual de empresa

/api/proxy/*              — proxy autenticado a Railway Express
/api/admin/upload-certificate  POST — sube certificado de aprobación
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
/                        — Home (marketing)
/servicios               — Página de servicios (ES)
/new-business            — Landing de marketing QR (EN — indexada en Google)
/new-business/es         — Versión en español (URL dedicada — indexada en Google)
/new-business/success    — Post-pago con instrucciones portal
/admin                   — Panel admin: tabla de órdenes activas con filtros
/admin/orders/[id]       — Detalle de orden: cambio de estado, subida de documentos,
                           notas internas, buscador de nombres, envío manual de emails
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

### Carta física de cumplimiento (PDF) — 2026-06-08

Generador: `backend/lib/new-business-letter.ts` (usa `pdf-lib` + `qrcode`)
API: `POST /api/campaigns/generate-letter` → devuelve PDF con datos de la empresa
Panel admin: botón 👁 (preview en nueva pestaña) y 📄 (descarga) por empresa en `/admin/campaigns`

Diseño: logo circular FBFC navy, título "YYYY NOTICE OF BUSINESS COMPLIANCE SERVICES", tabla de info (Document ID / Notice Date / Respond By / Total Fee en dorado), dirección del cliente, 3 columnas de servicios, sección PAY ONLINE con QR dinámico, footer legal.

Variables de la carta: `documentId, ownerName, companyName, address, city, zip, noticeDate, respondBy, totalFee, payUrl, year`

**Validación del endpoint (2026-06-10):** solo `documentId, ownerName, companyName, payUrl` son obligatorios. `address/city/zip` son opcionales (la carta se genera igual sin dirección — útil para preview; pero para enviar por USPS sí hace falta). La generación del PDF está en `try/catch`: si falla, devuelve `500 { error: "PDF generation failed: <msg>" }` y el admin UI muestra el mensaje en la barra de campañas.

**⚠️ Gotcha de pdf-lib (WinAnsi):** las `StandardFonts` de pdf-lib solo codifican WinAnsi (CP1252). NO usar caracteres especiales como `↑ ↓ → • ★ ✓` en el texto de la carta — rompen la generación con `WinAnsi cannot encode "X"`. Las rayas `— –` y comillas curvas sí están soportadas. Si se necesitan íconos, embeber una fuente con `pdfDoc.embedFont(bytes, { subset: true })`.

Pendiente: sustituir logo provisional "FBFC" por logo real cuando esté disponible.

---

## Página `/new-business` — estructura interna

`PageView = 'id-entry' | 'landing' | 'ein-form'`

- Sin `?id=` → muestra solo el campo Document ID
- Con `?id=L26...` → auto-lookup → muestra landing completa
- EIN en carrito → checkout va a `ein-form` en vez de Stripe directo

Diseño: CSS-in-JS via `<style>` tag con clases BEM-style. Paleta: dark navy `#1C2E44`, accent `#2563EB`, background `#f0f4f8`. Tipografías: Fraunces (headers) + Plus Jakarta Sans (body).

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
| **Buscador de nombres** | Aparece solo cuando status=`names_taken`. Verifica disponibilidad en Sunbiz y envía sugerencias al cliente |
| **Acciones manuales** | Forzar cualquier status vía selector + enviar emails sueltos (nombres tomados, certificate) |
| **Notas internas** | Texto libre visible solo para el equipo, guardado en la orden |
| **Pre-filled Documents** | PDFs generados con datos del cliente: Articles of Organization, BOI, EIN SS-4, Operating Agreement |

Flujo de estados: `pending → in_review → ready_to_file → filed → approved → completed`
Rama alternativa: `in_review → names_taken → in_review` (loop hasta encontrar nombre disponible)

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

## Sistema de Notificaciones por Email

Emails implementados en `backend/modules/notifications/notifications.service.ts`:

| Función | Trigger | Estado |
|---|---|---|
| `sendOrderConfirmation` | Al crear orden (webhook Stripe o `/api/orders`) | ✅ Activo |
| `sendAllNamesTaken` | Manual desde admin o automático | ✅ Activo |
| `sendSuggestNames` | Admin encuentra nombres alternativos | ✅ Activo |
| `sendCertificateDelivery` | Al subir Certificate PDF desde admin | ✅ Activo |
| `sendOrderProcessed` | Al avanzar a `filed` | ✅ Implementado |
| `sendOrderApproved` | Al avanzar a `approved` | ✅ Implementado |

Todos los emails usan WhatsApp `+13528377755`. Actualmente salen desde `onboarding@resend.dev` — pendiente migrar a dominio propio (lo trabaja el socio).

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
- [ ] Soporte bilingüe EN/ES en páginas `/booking/reschedule` y `/booking/cancel`

---

## Deploy

- `git push origin main` — Vercel detecta cambios en `backend/` y hace deploy automático
- Railway monitorea el mismo repo y despliega `server.ts` en Railway
- La rama principal es `main`; no hay staging branch actualmente
