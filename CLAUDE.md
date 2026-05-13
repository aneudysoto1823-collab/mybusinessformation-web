# CLAUDE.md — MyBusinessFormation Web

Guía de referencia rápida para Claude. Describe el estado actual del sistema, arquitectura, convenciones y decisiones establecidas.

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

**Doble cliente — misma DB (Supabase PostgreSQL):**

- **Prisma** (`lib/prisma.ts`): ORM principal. Usado para el modelo `Order` (tabla de órdenes de formación). Solo para migraciones y queries que necesitan tipado fuerte.
- **Supabase client** (`lib/supabase.ts`): HTTP client. Usado en todo lo demás — marketing automation, lookup de empresas, etc. Siempre lazy-init via `getSupabaseAdmin()`.

Variables de entorno para DB:
- `DATABASE_URL` — pooler URL (runtime en Vercel)
- `DIRECT_URL` — conexión directa (solo migraciones)
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`

### Modelo Order (Prisma)

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

### Tablas Supabase (sin Prisma)

- `prospective_companies` — empresas para marketing automation
- `email_campaigns` — registro de emails enviados
- `qr_scans` — escaneos de QR
- `conversions` — compras completadas via campaña

---

## Variables de entorno requeridas

```
# DB
DATABASE_URL          # Supabase pooler (Prisma runtime)
DIRECT_URL            # Supabase directa (migraciones)
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
```

---

## Autenticación

### Admin (`/admin/*`)
- Login en `/login` con usuario/contraseña en env
- Genera JWT firmado con `jose` (SESSION_SECRET)
- Cookie `admin_session` (httpOnly, 8h)
- Middleware en `middleware.ts` protege toda la ruta `/admin`

### Cliente (`/client-portal/dashboard/*`)
- Login en `/client-portal` con **email + número de confirmación**
- Acepta `FBFC-XXXXXXXX` (formaciones LLC/Corp) y `FBNB-XXXXXXXX` (New Business Letter)
- `FBFC-` / `FBNB-` = primeros 8 chars del `Order.id` en mayúsculas
- Cookie `client_session` = el `order.id` completo
- Middleware protege `/client-portal/dashboard/*`
- Respuesta genérica en `/api/client-auth` — no revela si el email existe
- Toggle EN/ES con persistencia en `localStorage` (`portal_lang`)
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
/client-portal           — Login del portal de clientes (EN/ES, contacto Email+WhatsApp)
/client-portal/dashboard — Dashboard del cliente: status, documentos, My Orders
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
- Labor Law Poster: $69.99
- EIN / Tax ID: $99.99
- Certificate of Status: $49.99
- Bundle (3 servicios): $189.99

Estados de `prospective_companies.status`: `new → email_sent → qr_scanned → purchased`

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

### Prisma singleton (serverless)
```ts
// lib/prisma.ts — evita múltiples conexiones en Vercel
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

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

## Sistema de Notificaciones por Email

Emails implementados en `backend/modules/notifications/notifications.service.ts`:

| Función | Trigger | Estado |
|---|---|---|
| `sendOrderConfirmation` | Al crear orden (webhook Stripe o `/api/orders`) | ✅ Activo |
| `sendAllNamesTaken` | Manual desde admin o automático | ✅ Activo |
| `sendSuggestNames` | Admin encuentra nombres alternativos | ✅ Activo |
| `sendCertificateDelivery` | Al subir Certificate PDF desde admin | ✅ Activo |
| `sendOrderProcessed` | Al avanzar a `filed` | ⚠️ Stub vacío — pendiente template |
| `sendOrderApproved` | Al avanzar a `approved` | ⚠️ Stub vacío — pendiente template |

Todos los emails usan WhatsApp `+13528377755`. Actualmente salen desde `onboarding@resend.dev` — pendiente migrar a dominio propio (lo trabaja el socio).

## Diseño de Login Pages

Ambas páginas de login (`/login` y `/client-portal`) usan el mismo patrón visual:
- Fondo oscuro `#0f1c2e` con header de marca centrado arriba del card
- Card con foto a tamaño natural (`<img>` tag, sin `object-fit:cover`) + panel de formulario
- El panel de formulario iguala la altura de la foto via `align-items: stretch`
- Fotos: `/admin-bg.jpg` (escritorio flat-lay) y `/client-portal-bg.jpg` (hombre en escaleras)
- CSS-in-JS con `<style>` tag (misma convención que páginas marketing)

## Responsive Design (Etapa 17 — 2026-05-12)

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

**Pendiente responsive:** `/admin/orders/[id]`, `/admin/campaigns`

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

## Deploy

- `git push origin main` — Vercel detecta cambios en `backend/` y hace deploy automático
- Railway monitorea el mismo repo y despliega `server.ts` en Railway
- La rama principal es `main`; no hay staging branch actualmente
