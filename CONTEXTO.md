# CONTEXTO DEL PROYECTO — MyBusinessFormation.com

## Qué es el proyecto
Plataforma de formación de empresas (LLC y Corporaciones) en Florida, estilo LegalZoom/Bizee.
Web: mybusinessformation.com
Socios: Ethan (dev backend/frontend Next.js) + socio (diseño y terminación HTML)

## Repositorio GitHub
https://github.com/aneudysoto1823-collab/mybusinessformation-web

## Estructura del repositorio
mybusinessformation-web/
  backend/                  ← proyecto Next.js (TypeScript) — único lugar de trabajo real
    app/
      globals.css           ← vacío, cada página carga su propio CSS
      layout.tsx            ← carga fuentes Google (Fraunces + Plus Jakarta Sans)
      page.tsx              ← home
      about/page.tsx
      legal/page.tsx
      servicios/page.tsx
      privacy/page.tsx
      terms/page.tsx
      admin/                ← Panel de Administración (Etapa 8)
        campaigns/          ← Panel de Campañas Marketing (Etapa 16)
      client-portal/        ← Portal del Cliente (Etapa 9)
      new-business/         ← Landing page campañas QR (Etapa 16)
        success/            ← Página post-pago con link al portal
      login/
      unsubscribe/
      api/
        campaigns/          ← send, track-scan, stats, companies (Etapa 16)
        sunbiz/             ← lookup Sunbiz + checkout Stripe (Etapa 16)
        webhooks/stripe/    ← webhook pago → crea Order + envía FBFC (Etapa 16)
        orders/             ← órdenes formación (Etapas 3, 8)
        auth/               ← autenticación admin
        client-auth/        ← autenticación portal cliente
  LOGICA_DE_NEGOCIO/        ← documentación de reglas de negocio
  security/                 ← auditorías (ignorada en git)
  contexto                  ← este archivo
  README.md
  railway.json              ← config de deploy (Railway)

NOTA: Los archivos HTML (about.html, legal.html, etc.) fueron ELIMINADOS del repo
el 2026-04-20. Ya no existen ni en la raíz ni dentro de backend/. El sitio corre
100% desde los componentes .tsx de Next.js.

NOTA (2026-04-29): La página `/paquetes` fue ELIMINADA del repo. Todo el flujo
fue migrado al home:
  - Navegación pública apunta a `/#pricing` (commit b561987 del 2026-04-28).
  - Deep-link de Claudia con token de sesión apunta a `${origin}/?session=${token}`
    (commit 3725f61 del 2026-04-29 por Fabián).
  - El home (`backend/app/page.tsx`) contiene el listener de `?session=` y la
    función `claudiaPrefill()` que pre-llena el formulario con los datos del cliente.
  - El endpoint `backend/app/api/form-session/[token]/route.ts` resuelve el token
    y devuelve `form_data` desde Supabase.
  - El archivo `backend/app/paquetes/page.tsx` fue borrado (commit del 2026-04-29).
Tarea cerrada. Ver LOGICA_DE_NEGOCIO/03_paquetes_y_precios.md para el historial
completo de la decisión.

## Cómo funciona el sistema
Cada page.tsx es un componente React de Next.js con su propio JSX y estilos.
El flujo anterior (leer HTML con `fs.readFileSync`) quedó OBSOLETO cuando se
eliminaron los archivos HTML el 2026-04-20.

Si necesitas cambiar el diseño de una página:
1. Editas el archivo .tsx correspondiente en backend/app/<pagina>/page.tsx
2. Pruebas localmente con `npm run dev` dentro de backend/
3. Commit + push → Vercel redeploy automático

## Cómo trabajamos con Claude
- Compartir pantalla con capturas cuando hay problemas visuales
- Claude pega el código directo en el chat — no genera archivos para descargar
- Trabajar paso a paso, un problema a la vez
- Al inicio de cada sesión nueva pegar este archivo CONTEXTO.md completo
- Actualizar este archivo al terminar cada etapa

## Reglas del repositorio
- Ethan y Fabián son administradores totales del proyecto — ambos pueden
  trabajar en cualquier parte del repositorio (backend, configuración, docs, etc.)
- YA NO existen archivos HTML en el proyecto — todo cambio de diseño se hace en .tsx
- Antes de empezar siempre: git pull
- Al terminar siempre: git add . → git commit -m "descripcion en español" → git push
- Commits SIEMPRE en español

## Stack tecnológico
- Next.js 16 (TypeScript) — frontend + API routes + lógica de negocio (corre 99% del proyecto)
- Node.js v24.14.0 / npm 11.9.0
- Supabase — Postgres + Storage (acceso vía REST API desde Vercel; sin Prisma en producción)
- Vercel — hosting principal (Next.js)
- Railway.app — RESERVADO para Etapa 5 (Sunbiz). Hoy DORMIDO. Decisión arquitectural Opción B (2026-05-13): toda la lógica vive en Vercel; Railway se despierta cuando se implemente la búsqueda Sunbiz. Ver `LOGICA_DE_NEGOCIO/00_arquitectura_tecnica_de_una_orden.md`.
- Prisma ORM — instalado y configurado, pero su uso queda restringido al backend Express en Railway (Etapa 5). El resto del proyecto consulta Supabase vía REST.
- Stripe — pagos (Etapa 4 y Etapa 16)
- Resend — emails (Etapa 7 y Etapa 16)
- Upstash Redis — rate limiting login admin (Etapa 14)
- qrcode ^1.5.4 — generación de QR para campañas (Etapa 16)

## ROADMAP COMPLETO — 18 Etapas

### Etapa 1 — Frontend HTML a Next.js (COMPLETADA)
- [x] Instalar Node.js y crear proyecto Next.js
- [x] layout.tsx con Google Fonts
- [x] HTML convertidos a componentes React .tsx puros
- [x] globals.css vaciado — cada página carga su propio CSS
- [x] Tailwind desinstalado
- [x] Archivos HTML eliminados del repo (2026-04-20) — ya no son necesarios
- [x] Sitio en vivo en Vercel — https://mybusinessformation-web.vercel.app/
- [x] Deploy automático con cada git push


### Etapa 2 — Backend Node.js + Express (DORMIDO desde 2026-05-13)
- [x] Crear servidor Express
- [x] Organizar módulos: órdenes, clientes, documentos, pagos, notificaciones
- [x] Conectar formulario al backend
- [x] Variables de entorno (.env)
- [x] Subir a Railway.app — https://mybusinessformation-web-production.up.railway.app
- [x] Servidor Express en Railway
- [x] Formulario conectado al backend

**NOTA (2026-05-13):** Decisión arquitectural Opción B — Express en Railway queda DORMIDO. Toda la lógica del negocio vive en Vercel (Next.js + Supabase REST + Resend). Railway solo se va a despertar cuando se implemente Etapa 5 (Sunbiz).

**NOTA (2026-05-18):** Limpieza completada (commit `c7bdc07`). Se eliminaron de `backend/modules/`: `orders/`, `clients/`, `payments/`, `notifications/` y `documents.route.ts`. También se migró el último endpoint que aún llamaba a Railway (`backend/app/api/admin/upload-certificate/route.ts`) a Supabase REST + `lib/notifications`. Quedan vivos en `modules/`: `names/names.route.ts` (Etapa 5) y `documents/documents.service.ts` (lo usa Vercel para generar PDFs). Ver `LOGICA_DE_NEGOCIO/00_arquitectura_tecnica_de_una_orden.md` para el detalle de qué se migró a Vercel y por qué.

### Etapa 3 — Base de Datos PostgreSQL (1-2 semanas)
- [x] Instalar PostgreSQL — usando Supabase como hosting
- [x] Crear tablas: modelo Order completo en Supabase
- [x] Conectar con Prisma ORM — db push exitoso
- [x] orders.service.ts — saveOrder y getOrders funcionando
- [ ] Backups automáticos diarios — requiere Supabase Pro (pendiente)
- [x] Supabase conectado a Vercel con cliente HTTP
- [x] Órdenes guardándose en Supabase al hacer submit

### Etapa 4 — Pagos con Stripe (1 semana)
- [ ] Crear cuenta Stripe y obtener claves API
- [ ] Integrar Stripe Elements
- [ ] Guardar transacciones en base de datos
- [ ] Probar con tarjetas de prueba

### Etapa 5 — Búsqueda de Nombres Sunbiz Florida (2 semanas) ⚠️ CRÍTICA
- [ ] Descargar base de datos trimestral de Florida vía FTP
- [ ] Importar a PostgreSQL (~3.5 millones de registros)
- [ ] Buscador en tiempo real con detección de nombres similares
- [ ] Actualización automática nocturna

**Al despertar Railway para esta etapa, hacer también lo siguiente (diferido de Etapa 15, 2026-05-13):**
- [ ] Instalar `@sentry/node` en `backend/server.ts` (paquete Sentry para Express)
- [ ] Crear proyecto `node-express` en sentry.io y obtener su DSN
- [ ] Configurar env vars en Railway (Production): `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `INTERNAL_API_KEY`. Tipear desde Vercel, no copy-paste, para evitar trailing whitespace
- [ ] Reusar el filtro PII de `backend/lib/sentry-pii-filter.ts` en el init de Sentry/Node (mismo helper que usa Next.js)
- [ ] Crear monitor en BetterStack para `https://mybusinessformation-web-production.up.railway.app/health` con SSL verification + keyword match
- [ ] Crear runbook "Railway DOWN" en `TROUBLESHOOTING/` con pasos para verificar desde otra red, identificar causa (deploy, env vars, IPv4/IPv6) y rollback si aplica
- [ ] Smoke test Sentry server-side en Express (endpoint temporal con throw, borrar post-validación)
- [ ] Decidir en este punto si `DATABASE_URL` mantiene direct connection (requiere IPv6) o pasa a Session Pooler (compatible IPv4). Documentar la elección en `LOGICA_DE_NEGOCIO/00_arquitectura_tecnica_de_una_orden.md`

### Etapa 7 — Comunicación Automática (1 semana)
- [x] Email confirmación al pagar
- [x] Email nombres tomados — cliente + alerta admin
- [x] Email de actualización de estado
- [x] Email final con Certificate of Formation
- [x] Motor de emails probado y funcionando con Resend
- [x] WhatsApp `+13528377755` configurado en todos los templates de email
- [x] Handlers de emails manuales del admin migrados de Railway/Express a Vercel/Supabase REST (commit `a5e1d45`, 2026-05-13). Endpoint `/api/proxy/notifications/[type]` ya NO pasa por Railway. Las funciones de Resend viven en `backend/lib/notifications.ts` (canónica para Vercel); la copia en `backend/modules/notifications/notifications.service.ts` queda pendiente de eliminar junto con el resto del código muerto de Express.
- [ ] Templates `sendOrderProcessed` (status: filed) y `sendOrderApproved` (status: approved) — funciones existen pero son stubs vacíos, pendiente diseñar HTML
- [ ] Email con contrato PDF adjunto — pendiente hasta Etapa 6 (generación de documentos)
- [ ] Verificar dominio mybusinessformation.com en Resend — lo trabaja el socio (Aneudys). Hoy Resend está en modo sandbox y solo entrega emails al destinatario verificado.
- [x] Email de confirmación enviado automáticamente al cliente
- [x] Motor de emails Resend funcionando en producción

### PUNTO DE LANZAMIENTO = Etapas 1+2+3+4+5+7 completas (~3 meses)

### Etapa 6 — Contratos y Documentos Automáticos (post-lanzamiento)
- [ ] Plantillas con marcadores de posición
- [ ] Generación automática de PDF
- [ ] Almacenamiento en AWS S3
- [ ] Articles of Organization automáticos

### Etapa 8 — Panel de Administración (COMPLETADA 2026-03-27)
- [x] Login con usuario y contraseña (variables de entorno ADMIN_USER y ADMIN_PASSWORD)
- [x] Middleware de protección en todas las rutas /admin
- [x] Dashboard principal con 4 tarjetas de estadísticas
- [x] Tabla de órdenes con tabs por estado y conteos en tiempo real
- [x] Vista detallada de cada orden con todos los campos
- [x] Gestión de estado — botones contextuales por status (pending → in_review → ready_to_file → filed → approved); dispara notificación al cliente automáticamente al avanzar
- [x] Cambio de estado forzado con dropdown
- [x] Botones de email — Nombres Tomados y Certificate
- [x] Buscador de nombres alternativos (mock hasta que Etapa 5 esté lista)
- [x] Notas internas por orden
- [x] Subida de Certificate PDF — aparece cuando status=approved; sube a Supabase Storage, envía email al cliente y marca orden como completed automáticamente
- [x] Railway conectado a Supabase — pooler aws-1-us-east-1 puerto 6543
- [x] Panel en producción: https://mybusinessformation-web.vercel.app/admin
- [x] Rediseño visual login admin (/login) — card centrada sobre fondo oscuro #0f1c2e, foto /admin-bg.jpg a tamaño natural, header "Staff Portal" arriba del card (2026-05-12)

### Etapa 9 — Portal del Cliente (COMPLETADA 2026-03-27)
- [x] Botón "Log In" discreto en el navbar del sitio principal
- [x] Página de login del cliente (/client-portal) con email + número de confirmación
- [x] Endpoint de autenticación — busca orden por email y número FBFC
- [x] Cookie client_session para mantener sesión del cliente
- [x] Dashboard del cliente (/client-portal/dashboard) con:
  - [x] Saludo personalizado con nombre del cliente
  - [x] Número de confirmación FBFC visible
  - [x] Timeline visual de 7 pasos con estado actual resaltado
  - [x] Sección "What's Next" explicando el estado actual
  - [x] Sección "Your Company Details" con datos de la empresa
  - [x] Botón Log Out
- [x] Middleware protege /client-portal/dashboard sin sesión
- [x] Número de confirmación FBFC basado en UUID real de la orden
- [x] Panel de admin muestra número FBFC en tabla y vista detallada
- [x] Portal en producción: https://mybusinessformation-web.vercel.app/client-portal
- [x] Login acepta FBNB-XXXXXXXX (New Business Letter) además de FBFC-XXXXXXXX (2026-05-12)
- [x] Toggle EN/ES con persistencia en localStorage (portal_lang) (2026-05-12)
- [x] "My Orders" — cliente con múltiples órdenes las ve todas y puede cambiar entre ellas (2026-05-12)
- [x] Botón "Contact us" abre opciones inline: Email (support@mybusinessformation.com) + WhatsApp (+13528377755) (2026-05-12)
- [x] Rediseño visual login (/client-portal) — card centrada sobre fondo #0f1c2e, foto a tamaño natural, header con marca arriba del card, "Don't have confirmation number?" justo debajo del botón (2026-05-12)

### Etapa 10 — Seguridad y Lanzamiento Oficial (post-lanzamiento)
- [ ] Cloudflare activo
- [ ] Revisión de seguridad
- [ ] Pruebas completas con 10 clientes simulados
- [ ] Apuntar dominio mybusinessformation.com

### Etapa 11 — SEO Técnico y de Contenido (1-2 semanas)

```diff
+ Qué es: configurar todas las señales que Google y otros motores de búsqueda
+ usan para entender, indexar y rankear el sitio. Cubre dos frentes: (a) SEO
+ técnico — metadata global, sitemap.xml dinámico, robots.txt, Open Graph,
+ Schema.org, hreflang ES/EN, Core Web Vitals; y (b) SEO de contenido — dos
+ páginas nuevas accesibles desde el footer (/guia, /wiki) que alojan los 30
+ artículos en .md que el founder pasa, con cross-links entre ellos y las
+ páginas principales del producto.
+ Qué resuelve: hoy el sitio es prácticamente invisible para buscadores. Esta
+ etapa lo deja indexable, compartible en redes con preview rico, y con
+ contenido editorial que captura tráfico orgánico antes y después del launch.
```

Pre-requisito: dominio mybusinessformation.com apuntando a Vercel (Etapa 10).

SEO Técnico:
- [x] Metadata global completa en backend/app/layout.tsx — Open Graph defaults, Twitter Cards (summary_large_image), canonical, metadataBase apuntando a https://mybusinessformation.com, alternates.languages con hreflang ES/EN explícito (sitio bilingüe)
- [x] backend/app/sitemap.ts dinámico con todas las páginas públicas indexables (home, servicios, about, legal, privacy, terms, login, client-portal, guía, wiki y artículos) — NO incluir /admin ni rutas internas
- [x] backend/app/robots.ts con Disallow: /admin/, /api/, /client-portal/dashboard + referencia al sitemap
- [x] backend/app/opengraph-image.tsx — autogenera 1200×630 PNG con logo "FL" + wordmark + tagline (Next.js ImageResponse)
- [x] Schema.org JSON-LD en home y páginas clave: Organization, WebSite, Service (LLC formation, Corporation formation), FAQPage (preguntas existentes), BreadcrumbList
- [ ] Favicon set completo: 16×16, 32×32, 192×192, 512×512, apple-touch-icon
- [x] Meta titles únicos + meta descriptions únicas por página (cada page.tsx exporta su propio metadata)
- [x] Audit de alt text en todas las imágenes — PASS: el sitio no usa etiquetas <img>, solo SVG inline y CSS
- [x] Core Web Vitals: font preconnect a fonts.gstatic.com, lazy loading de imágenes below-fold, width/height explícitos para evitar CLS — preconnect implementado; lazy loading y CLS N/A (sin imágenes externas)
- [ ] Validación final: Rich Results Test (search.google.com/test/rich-results), Mobile-Friendly Test, PageSpeed Insights ≥ 85 mobile

SEO de Contenido:
- [ ] Crear 2 páginas nuevas accesibles desde el footer: /guia y /wiki (hub que lista los artículos por categoría)
- [ ] Formatear e integrar 30 artículos .md que pasa el usuario (división guía/wiki por definir al recibirlos)
- [ ] Frontmatter en cada .md con date y lastUpdated (string ISO YYYY-MM-DD entre comillas) — Article + BreadcrumbList por artículo se generan automáticamente desde el frontmatter
- [ ] Cross-links module (backend/lib/cross-links.ts) — relaciones entre artículos y páginas principales (servicios, paquetes, FAQ)
- [ ] Sitemap.ts incluye automáticamente todos los artículos publicados

Documentación:
- [x] LOGICA_DE_NEGOCIO/11_seo_tecnico_y_contenido.md con inventario completo, archivos modificados y decisiones embutidas

### Etapa 12 — Google Search Console (GSC) (2 días)

```diff
+ Qué es: registrar el dominio mybusinessformation.com como propiedad en
+ Google Search Console (y en Bing Webmaster Tools en paralelo), verificar
+ ownership con un archivo HTML permanente en /public, submitear el sitemap
+ generado en la Etapa 11, y dejar activo el monitoreo de Coverage,
+ Performance y Manual Actions con notificaciones por email.
+ Qué resuelve: visibilidad real sobre cómo Google rastrea e indexa el sitio,
+ alertas tempranas si algo se rompe (URLs no indexadas, penalizaciones
+ manuales, errores de cobertura), y la herramienta Change of Address lista
+ por si en el futuro hay migración de dominio o de host.
```

Depende de Etapa 11 — sin sitemap.xml no hay nada que submitear.

- [ ] Crear propiedad en https://search.google.com/search-console para mybusinessformation.com (propiedad de dominio cubre todos los subdominios)
- [ ] Verificar ownership con archivo HTML en backend/public/google<hash>.html — NO BORRAR jamás del repo, Google lo requiere permanente
- [ ] Submit del sitemap: https://mybusinessformation.com/sitemap.xml
- [ ] Crear propiedad y submit del mismo sitemap en Bing Webmaster Tools (paralelo)
- [ ] Validar Coverage (Indexing → Pages): meta de 90%+ URLs como "Indexed" en 4 semanas post-submit
- [ ] Validar Performance (Search results): empieza a recibir clicks/impressions
- [ ] Validar Manual Actions (Security & Manual Actions): cero issues
- [ ] Setup de notificaciones por email cuando GSC detecta problemas
- [ ] Si en el futuro hay migración de dominio (ej. cambio de host): usar Change of Address tool (Settings → Change of Address) ANTES de mover el DNS, sino los rankings no se transfieren limpio
- [ ] Documentar en LOGICA_DE_NEGOCIO/12_google_search_console.md + plantilla de troubleshooting en TROUBLESHOOTING/

### Etapa 13 — Google Analytics 4 (GA4) (3-4 días)

```diff
+ Qué es: instalar Google Analytics 4 con un helper único trackEvent()
+ SSR-safe, los 3 Script tags en orden (consent default + gtag.js + config),
+ y disparar eventos custom en cada paso clave del funnel del producto:
+ formation_start, step_completed, package_selected, payment_started,
+ payment_completed, claudia_message_sent, login_success, lang_toggle, etc.
+ Todo gobernado por Cookie Consent + Google Consent Mode v2 (CCPA/GDPR).
+ Qué resuelve: entender el comportamiento real de los usuarios — dónde
+ entran, dónde se traban, qué paquete eligen, dónde abandonan el wizard,
+ qué conversión tiene Claudia. Sin esto, el negocio vuela a ciegas.
```

Depende de Etapa 11 — necesita metadata + cookie banner UI.

- [ ] Crear property GA4 en https://analytics.google.com (Account: MyBusinessFormation; Property: mybusinessformation.com)
- [ ] Configurar NEXT_PUBLIC_GA_ID=G-XXXXXXXX como env var en Vercel (Production + Preview + Development)
- [ ] Crear helper único backend/lib/tracking.ts con trackEvent(name, params) SSR-safe — chequeo de typeof window === 'undefined', optional chaining window.gtag?.()
- [ ] En backend/app/layout.tsx agregar 3 Script tags en orden: gtag-consent-default (beforeInteractive, todos denied), googletagmanager.com/gtag/js (afterInteractive), gtag-init (afterInteractive, gtag('config', '<ID>', { send_page_view: true }))
- [ ] Cookie Banner + Consent Mode v2 — categorías necessary / analytics / marketing mapeando a analytics_storage, ad_storage, ad_user_data, ad_personalization
- [ ] Implementar eventos custom del funnel MBF (lista a ajustar al implementar): formation_start, step_completed, package_selected, payment_started, payment_completed, claudia_message_sent, claudia_session_link_used, client_login_success, lang_toggle, external_link_click
- [ ] Registrar custom dimensions en GA4 Admin (Settings → Custom Definitions): package, step_number, idioma — las que apliquen
- [ ] PII audit: verificar uno por uno que ningún trackEvent envía email, nombre, dirección, teléfono, ITIN, número de tarjeta — la PII vive solo en Supabase
- [ ] Smoke test protocol en TROUBLESHOOTING/<n>_ga4_smoke_test.md — tabla de check con los eventos custom + Real-Time validation en GA4
- [ ] Documentar en LOGICA_DE_NEGOCIO/13_analytics_ga4.md — inventario completo de eventos con archivo:línea, params y insight de negocio

### Etapa 14 — Hardening de Seguridad de la App (1-2 semanas)

```diff
+ Qué es: cerrar los gaps de seguridad que faltan a nivel código y config,
+ siguiendo OWASP Top 10. Incluye: 5 security headers globales en
+ next.config.ts (CSP con whitelist explícita, HSTS, X-Frame, Referrer,
+ Permissions, nosniff), Cookie Consent + Consent Mode v2 (CCPA/GDPR),
+ rate limiting con Upstash Redis en endpoints públicos, validación zod,
+ verificación HMAC de webhooks (Stripe), audit trail admin, RLS audit en
+ Supabase, bcrypt para ADMIN_PASSWORD si todavía es plaintext.
+ Qué resuelve: bloquear los vectores reales de ataque — XSS, clickjacking,
+ brute force al admin, mass assignment, webhooks falsos, leaks de PII —
+ ANTES de cobrar dinero real con tarjetas de crédito de clientes.
```

Pre-requisito: Etapa 4 (Stripe) lista al menos para staging — varias tareas dependen del flujo de pago real para validar.

Auditoría OWASP y proceso:
- [ ] Reorganizar carpeta `security/` siguiendo el patrón de preenvios: README.md (metodología + cadencia obligatoria pre-launch + cada 90 días + post-incidentes), 01_auditoria_<fecha>.md (numeradas), monitoring.md
- [ ] Auditoría OWASP Top 10 completa con clasificación 🔴🟡🟢 + commits de fix por hallazgo + bitácora de remediación
- [ ] Cadencia formal: no se aprueba deploy a producción si la última auditoría tiene 🔴 críticos abiertos

Auth y sesiones:
- [x] Verificar `ADMIN_PASSWORD` hasheado con bcrypt factor 12 (`ADMIN_PASSWORD_HASH` env var, sin plaintext) — completado 2026-05-08 (commit `d06992d`): bcryptjs ^3 instalado, hash en base64 para evitar parser dotenv de Next.js, `ADMIN_PASSWORD` viejo eliminado de Vercel
- [x] Cookies HttpOnly + Secure + SameSite=Strict — completado 2026-05-08 (commit `d06992d`): `secure: true` hardcoded (ya no condicional NODE_ENV), `sameSite: 'strict'` (era `'lax'`)
- [x] 2FA (autenticación de 2 factores) — completado 2026-05-09 por Fabián (commits `0552930`, `eb0be02`, `937c2b3`, `82766bf`): TOTP app (Google Authenticator / Authy) + email code como fallback. Helpers `backend/lib/encryption.ts` (AES-256-CBC), `lib/totp.ts` (otpauth, no otplib por compat Turbopack/ESM), `lib/twofa.ts`. 4 endpoints: `/api/auth/2fa-config`, `/2fa-setup`, `/2fa-verify`, `/2fa-send-email`. Página `/login/verify` para segundo paso, panel `/admin/security` para gestión. Cookie `admin_pending` (5 min, JWT con role admin_pending) entre password y 2FA. Tabla nueva en Supabase `admin_security_config` (single row) con TOTP secret encriptado y email code hasheado SHA-256. Documentado en LOGICA_DE_NEGOCIO/16_2fa_admin.md. **Pendiente: agregar `ENCRYPTION_KEY` (64 chars hex) y `ADMIN_EMAIL` en Vercel + .env.local para que funcione en producción.**
- [ ] Audit trail admin: tabla `admin_audit_log` con admin_email, action, entity, before, after, created_at — insertar en cada PATCH/POST de panel admin

Defensa server:
- [x] Rate limiting con Upstash Redis en `/api/auth/login` (5 intentos / 15 min / IP, sliding window) — completado 2026-05-08 (commit `f7c6887`): helper `backend/lib/rate-limit.ts` con `@upstash/ratelimit ^2` + `@upstash/redis ^1`, lazy init, fail-OPEN si Upstash cae, prefix `rl:admin-login`. Frontend `backend/app/login/page.tsx` distingue 401 vs 429 leyendo `Retry-After`, muestra countdown MM:SS y deshabilita inputs/botón durante el bloqueo
- [ ] Extender rate limiting a otros endpoints públicos: /api/orders (10/h/IP), /api/chat (30/h/IP), /api/contact si existe — usar el mismo helper con prefix distinto por endpoint
- [ ] Validación zod en TODOS los endpoints POST públicos (length, regex, whitelist de enums, sanitización)
- [x] Webhook HMAC verification para Stripe — verificado 2026-05-07: ya implementado por Fabián en `backend/app/api/webhooks/stripe/route.ts:19` con `getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`. Si firma falla retorna 400
- [ ] Supabase RLS audit: confirmar `ENABLE ROW LEVEL SECURITY` en todas las tablas con datos de usuario (Order, ClientSession, FormSession, etc.) + políticas apropiadas (read-public, write-service-role)
- [ ] Service role key audit: verificar que `SUPABASE_SERVICE_ROLE_KEY` NUNCA aparece en bundle cliente — solo server-side
- [x] Cero `NEXT_PUBLIC_*SECRET*` en código — auditado con grep 2026-05-07: cero secretos expuestos en bundle cliente

Defensa browser:
- [ ] 5 security headers globales en backend/next.config.ts: Content-Security-Policy con whitelist explícita (Stripe, Supabase, Resend, GA4, Sentry), Strict-Transport-Security max-age=63072000 includeSubDomains preload, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy denegando camera/microphone/geolocation/interest-cohort
- [ ] Cookie Consent banner + Google Consent Mode v2: categorías necessary / analytics / marketing → mapeo a analytics_storage, ad_storage, ad_user_data, ad_personalization. Bilingüe ES/EN. Tono directo, no legalés
- [ ] Validar headers en producción con `curl -I https://mybusinessformation.com/`

Dependencias y misc:
- [ ] `npm audit --audit-level=moderate` con 0 vulnerabilidades HIGH/CRITICAL
- [ ] Activar Dependabot en GitHub (`.github/dependabot.yml`)
- [x] Verificar `.gitignore` excluye `.env`, `.env.local`, `.env*.local` — verificado 2026-05-07: `backend/.gitignore` tiene `.env*` y `.env*.local`
- [ ] Documentar en LOGICA_DE_NEGOCIO/<próximo número disponible>_security_headers_y_hardening.md + actualizar TROUBLESHOOTING/ con guías de respuesta a incidentes de seguridad (nota: el archivo 14 ya está usado para Sentry, el 16 para 2FA — el próximo libre será 17 cuando se haga este item)

### Etapa 15 — Monitoreo y Observabilidad (PARTE VERCEL COMPLETADA 2026-05-13)

```diff
+ Qué es: instalar dos sistemas pasivos de detección que avisan cuando algo
+ se rompe en producción. Sentry captura errores de runtime con stack trace
+ completo (server + edge + client) y agrupa por fingerprint para no spamear.
+ BetterStack chequea las URLs públicas críticas cada 30s desde fuera y
+ avisa por email si caen, y publica un status page público.
+ Qué resuelve: que el founder se entere ANTES que el cliente cuando algo
+ rompe — sea un bug nuevo, un deploy roto, Vercel caído, Supabase con
+ problemas, SSL expirado o el sitio entero no responde. Reduce el tiempo
+ de detección de horas a segundos y da una señal pública de uptime para
+ partners y afiliados.
```

Pre-requisito: dominio mybusinessformation.com apuntando a Vercel (Etapa 10) — los monitores apuntan a URLs finales de producción.

Sentry — error tracking + APM:
- [x] Crear cuenta en sentry.io (free tier: 5K eventos/mes, retención 30 días) — proyecto `javascript-nextjs` para Next.js completado 2026-05-09 con `admin@mybusinessformation.com`, capturando errores en producción. **El proyecto `node-express` para Railway queda DIFERIDO hasta Etapa 5** (Railway dormido desde 2026-05-13).
- [x] Env vars Sentry en Vercel (Production + Preview + Development): `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` configuradas 2026-05-09. AUTH_TOKEN omitido (sourcemaps disable). **Env vars en Railway DIFERIDO hasta Etapa 5.**
- [x] Instalar `@sentry/nextjs` en Next.js — completado 2026-05-09 (commit `305bc94`): `@sentry/nextjs ^9` instalado. **`@sentry/node` en Express DIFERIDO hasta Etapa 5** (Railway dormido, no hay código corriendo que monitorear).
- [x] Crear `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` en backend — completado 2026-05-09 (commit `305bc94`): los 4 archivos creados con init Sentry según runtime (Node, edge, browser) + helper `backend/lib/sentry-pii-filter.ts` con `scrubPII()` compartido
- [x] Wrap backend/next.config.ts con `withSentryConfig` — completado 2026-05-09 (commit `305bc94`): + `tunnelRoute: '/monitoring'` para sortear ad-blockers
- [x] Filtrar PII en `beforeSend` — completado 2026-05-09 (commit `305bc94`): helper `scrubPII()` filtra email, nombre, teléfono, SSN/ITIN, tarjetas, passwords, tokens en strings, objects anidados, breadcrumbs, request body/headers/cookies/query
- [x] Smoke test server-side — validado local + producción 2026-05-09: endpoint temporal `/api/sentry-test` disparó error con prefix `[sentry-test-2026-05-09]`, evento llegó al dashboard de Sentry con `environment: production`. Endpoint borrado post-validación (commit `06e9c4d`)
- [x] Smoke test client-side: ruta `/sentry-client-test` gated a preview/dev (404 en producción) — completado 2026-05-13 (commit `b1c52d7`): Server Component verifica `VERCEL_ENV !== 'production'` y retorna `notFound()`; Client Component con 3 botones (uncaught throw, `captureException`, `captureMessage`) prefijados `[sentry-client-test-*]`. Documentado en `LOGICA_DE_NEGOCIO/15_sentry_betterstack_monitoring.md` (protocolo de validación mensual).
- [x] Alert Rule en Sentry → email a admin@mybusinessformation.com — completado 2026-05-13: configurada en sentry.io para primera ocurrencia de cada error nuevo. Validada end-to-end durante smoke test de BetterStack.

BetterStack — uptime + status page:
- [x] Crear cuenta en betterstack.com — completado 2026-05-13 (free tier: 10 monitores, 30s checks, status page con custom domain, SSL cert monitor).
- [x] Crear 3 monitores con SSL/TLS verification — completado 2026-05-13: Home, Admin Login, API Client Portal. **El monitor de Express en Railway (`up.railway.app/health`) queda DIFERIDO hasta Etapa 5** — sin tráfico, monitorear Railway dormido es ruido.
- [x] Umbral 2-3 fallos consecutivos antes de alertar (evita falsos positivos por hiccups de red) — configurado 2026-05-13.
- [x] Smoke test DOWN/UP — validado end-to-end 2026-05-13: una ruta inválida `/xxxxxxx` generó DOWN → email a Zoho → recuperación → UP automático.
- [ ] Email alerts a 2 destinatarios — **APLAZADO**: hoy solo notifica a `admin@mybusinessformation.com`. El segundo destinatario será un Gmail de la compañía (pendiente de crear).
- [ ] Status page pública en `status.mybusinessformation.com` con CNAME — **APLAZADO**: los DNS están en Netlify; pendiente migración a Namecheap BasicDNS para unificar. Una vez migrados, configurar CNAME apuntando a BetterStack + cert SSL Let's Encrypt auto-emitido.

Proceso y runbooks:
- [x] Configurar filtros en Gmail/Zoho — completado 2026-05-13: subject `[Sentry]` → label rojo + push, `[BetterStack] DOWN` → label rojo + push iPhone, `[BetterStack] UP` → label verde.
- [x] Validación periódica mensual — protocolo documentado en `LOGICA_DE_NEGOCIO/15_sentry_betterstack_monitoring.md` (sección "Validación periódica mensual"): 15 min el día 1 de cada mes, ejecutar smoke Sentry server-side + Sentry client-side + BetterStack DOWN/UP.
- [x] Runbooks por tipo de alerta — completados 2026-05-13: `TROUBLESHOOTING/15_sentry_alerts.md` (4 cajas: bug del código / endpoint downstream caído / regression / spam de bots) y `TROUBLESHOOTING/16_betterstack_down.md` (chequeo desde otra red + 4 causas posibles). **Runbook "Railway DOWN" DIFERIDO hasta Etapa 5.**
- [x] Documentar en LOGICA_DE_NEGOCIO/15_sentry_betterstack_monitoring.md — completado 2026-05-13 (commit `bd7021a`): matriz Sentry vs BetterStack, qué cubre cada uno, qué NO cubre (gaps deliberados), configuración actual, validación periódica, items diferidos, decisiones embutidas.

### Etapa 16 — Sistema de Marketing Automation con QR y Campañas de Email (COMPLETADA 2026-05-01)

```diff
+ Qué es: sistema completo de marketing outbound que toma empresas registradas en
+ Sunbiz Florida (scraping + base de datos local prospective_companies), les envía
+ emails personalizados con un QR único por empresa, rastrea cuándo escanean el QR,
+ y los lleva a una landing page (/new-business) donde pueden comprar servicios de
+ cumplimiento empresarial (Labor Law Poster, EIN, Certificate of Status, Bundle).
+ Al confirmar el pago por Stripe, el sistema crea automáticamente un Order en la
+ tabla Order de Supabase con su número FBFC, lo que permite al cliente acceder al
+ Portal de Clientes exactamente igual que si hubiera comprado un paquete de formación.
+ Qué resuelve: abre un canal de ventas completamente nuevo — clientes que ya tienen
+ empresa en Florida y necesitan servicios de cumplimiento. Esto complementa el flujo
+ de formación nueva y genera ingresos recurrentes anuales (Labor Law Poster se renueva
+ cada año). Todo el ciclo es automático: desde importar empresas hasta cobrar y crear
+ la orden en el sistema.
```

Tablas Supabase (crear en SQL Editor antes de usar):
- [x] `prospective_companies` — empresas objetivo con campos: document_id, company_name, owner_name, address, city, zip, email, company_type, registration_date, status (new → email_sent → qr_scanned → purchased)
- [x] `email_campaigns` — registro de cada email enviado: company_id, sent_at, lang, qr_url, email_address, status
- [x] `qr_scans` — cada vez que alguien escanea el QR: company_id, scanned_at, ip_address, converted
- [x] `conversions` — cada compra completada: company_id, order_id, email, services, total_amount, converted_at

Flujo del cliente (end-to-end):
- [x] Admin importa o agrega empresas manualmente en /admin/campaigns
- [x] Admin hace clic en "Send Email" (individual o "Send to All New" en bulk)
- [x] Sistema genera QR único por empresa con URL de tracking embebida
- [x] Email bilingüe EN/ES se envía vía Resend con QR embebido como base64
- [x] Cliente escanea QR → redirige a /new-business?id=<document_id> registrando el scan
- [x] Landing page auto-busca la empresa por document_id (DB primero, luego Sunbiz scraping)
- [x] Cliente selecciona servicios → checkout Stripe (email del cliente recolectado en Stripe)
- [x] Stripe webhook crea Order en tabla Order, actualiza status a 'purchased', envía email de confirmación con FBFC-XXXXXXXX
- [x] Cliente accede al Portal de Clientes con email + FBFC igual que cualquier otro cliente

Archivos creados:
- [x] `backend/app/new-business/page.tsx` — landing page bilingüe con lookup de empresa, selección de servicios y checkout
- [x] `backend/app/new-business/success/page.tsx` — página de éxito post-pago con instrucciones para acceder al portal
- [x] `backend/app/admin/campaigns/page.tsx` — panel admin con stats, tabla de empresas, filtros, envío de emails, formulario de alta manual
- [x] `backend/app/api/sunbiz/route.ts` — GET ?document_id=: busca en DB local primero, fallback a scraping de Sunbiz HTML
- [x] `backend/app/api/sunbiz/checkout/route.ts` — POST: crea sesión Stripe para servicios seleccionados, pre-llena email del cliente
- [x] `backend/app/api/campaigns/send/route.ts` — POST: genera QR, construye email HTML bilingüe completo, envía vía Resend, guarda en email_campaigns
- [x] `backend/app/api/campaigns/track-scan/route.ts` — GET ?doc=&cid=: registra scan en qr_scans, actualiza status empresa, redirige a /new-business
- [x] `backend/app/api/campaigns/stats/route.ts` — GET: devuelve totalCompanies, emailsToday, emailsMonth, totalScans, scanRate%, conversions, revenue
- [x] `backend/app/api/campaigns/companies/route.ts` — GET (filtros status/tipo/fecha) + POST (alta manual con validación de duplicados)
- [x] `backend/app/api/webhooks/stripe/route.ts` — POST: verifica firma Stripe, crea Order, actualiza prospective_companies.status → purchased, marca qr_scans.converted, envía email confirmación bilingüe con FBFC#
- [x] `backend/package.json` — qrcode ^1.5.4 (dependencies) + @types/qrcode ^1.5.5 (devDependencies)
- [x] `npm install` ejecutado — dependencias instaladas (Node.js v24.15.0)

Servicios vendidos (precios en centavos en Stripe):
- Labor Law Poster 2026: $69.99 (se renueva anualmente)
- EIN / Tax ID Number: $99.99
- Certificate of Status (FL): $49.99
- Business Essentials Bundle (los 3): $189.99 (ahorro de $30 vs separados)

Variables de entorno pendientes en Vercel:
- [ ] `STRIPE_SECRET_KEY` — clave secreta de Stripe (obtener en dashboard.stripe.com → Developers → API Keys)
- [ ] `STRIPE_WEBHOOK_SECRET` — clave de firma del webhook (obtener al registrar el endpoint en Stripe: https://mybusinessformation.com/api/webhooks/stripe, evento: checkout.session.completed)

Pendiente:
- [ ] Agregar STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET en Vercel env vars
- [ ] Registrar webhook en Stripe dashboard apuntando a /api/webhooks/stripe (evento: checkout.session.completed)
- [x] Validar que las 4 tablas Supabase fueron creadas correctamente — CONFIRMADO 2026-05-01
- [ ] Probar flujo completo end-to-end con empresa de prueba
- [x] Documentar en LOGICA_DE_NEGOCIO/12_marketing_automation_campanas.md + TROUBLESHOOTING/12_marketing_automation_campanas.md

### Etapa 17 — Responsive Design Mobile-First (COMPLETADA 2026-05-12)

```diff
+ Qué es: implementar diseño responsive mobile-first en las páginas principales
+ del sitio usando CSS media queries nativas dentro de los <style> tags existentes
+ de cada página (sin Tailwind, respetando las convenciones del proyecto).
+ Breakpoints estandarizados: ≤768px (tablet/mobile) y ≤480px (mobile pequeño).
+ El cliente en mobile tiene la experiencia completa — ningún contenido se elimina.
+ Qué resuelve: antes del cambio el nav del home desbordaba en pantallas pequeñas,
+ las secciones tenían padding excesivo, y los formularios eran difíciles de usar
+ con el pulgar. Ahora el sitio es completamente usable desde cualquier teléfono.
```

**Páginas modificadas:**

Homepage (`backend/app/page.tsx`):
- [x] Menú hamburguesa — botón con animación X al abrir, nav se despliega como panel bajo el header; se cierra al clicar un link, el botón, o fuera del header
- [x] Header, hero, secciones y footer reducen padding en ≤768px
- [x] Footer colapsa a 1 columna en ≤768px
- [x] Hero buttons se apilan verticalmente en ≤480px
- [x] WA float más pequeño en mobile para no tapar contenido

Client Portal login (`backend/app/client-portal/page.tsx`):
- [x] En ≤480px: padding del card reducido, botón con mínimo 48px de alto (táctil)

Admin login (`backend/app/login/page.tsx`):
- [x] En ≤480px: mismas mejoras de padding y altura mínima de botón

Admin dashboard (`backend/app/admin/page.tsx`):
- [x] En ≤640px: header se apila verticalmente, stats grid pasa a 2 columnas, stat cards más compactas

Client Portal dashboard (`backend/app/client-portal/dashboard/DashboardView.tsx`):
- [x] En ≤480px: padding reducido, botón de descarga full-width con 44px mínimo táctil

**Decisiones de implementación:**
- Sin Tailwind — media queries directamente en los `<style>` tags de cada página
- Breakpoints: 768px y 480px (no se usó 1024px; el sitio ya era aceptable en tablet)
- El nav hamburguesa usa JS puro: `classList.toggle('open')`, sin dependencias externas
- La foto lateral en los cards de login ya se ocultaba por debajo de 720px/760px (comportamiento existente, conservado)

**Pendiente (páginas no cubiertas en esta etapa):**
- [ ] `/new-business` — ya tenía queries a 960/700/600px; revisar si necesita mejoras adicionales
- [ ] `/admin/orders/[id]` — página de detalle de orden, compleja; pendiente revisión mobile
- [ ] `/admin/campaigns` — panel de campañas; pendiente
- [ ] `/servicios` — página de servicios; pendiente
- [ ] `/new-business/es` — wrapper de /new-business en español; hereda los estilos

Ver troubleshooting en `TROUBLESHOOTING/13_responsive_design.md`

---

### Etapa 18 — OPABIZ: App On-Demand para Empleados (EN DESARROLLO)

```diff
+ Qué es: aplicación interna de Florida Business Formation Center para gestionar
+ y asignar órdenes a los empleados. Cuando un cliente paga en mybusinessformation.com,
+ la orden entra a OPABIZ donde un empleado calificado la procesa. Automatiza la
+ asignación, elimina la gestión manual desde el panel admin y da trazabilidad
+ completa de quién trabajó qué.
```

**Integración con mybusinessformation-web:**
```
Cliente paga → Order creada (Stripe webhook)
  → DB trigger Supabase → crea ordenes_opabiz automáticamente
  → Motor de asignación → selecciona empleado óptimo
  → Empleado recibe notificación (Push / WhatsApp)
  → Empleado completa la orden
  → Status sync → actualiza Order en mybusinessformation
```

**Dos sistemas de niveles independientes:**
- `nivel_empleado_opabiz` (ENUM) — jerarquía interna: basico / intermedio / avanzado / experto. Controla permisos y tipo de órdenes que puede recibir.
- Tabla `niveles` — desempeño por puntaje: Oro (90-100) / Plata (75-89) / Bronce (60-74) / Riesgo (0-59). Determina beneficios y prioridad de asignación.

**Stack:**
- Base de datos: Supabase PostgreSQL (mismo proyecto)
- Lógica: Supabase Edge Functions
- Panel admin: Next.js (web)
- App empleado: PWA o Expo (pendiente decidir)

**Progreso por etapa:**

🟦 ETAPA 1 — Base de Datos (Supabase) — COMPLETA
- [x] ENUM: `rol_usuario_opabiz` — admin, empleado, supervisor
- [x] ENUM: `estado_usuario_opabiz` — activo, inactivo, suspendido
- [x] ENUM: `estado_orden_opabiz` — pendiente, en_progreso, completada, cancelada, revisando, rechazada
- [x] ENUM: `nivel_empleado_opabiz` — basico, intermedio, avanzado, experto
- [x] Tabla: `usuarios`
- [x] Tabla: `empleado_perfil`
- [x] Tabla: `ordenes_opabiz`
- [x] Tabla: `documentos`
- [x] Tabla: `historial_actividad`
- [x] Tabla: `puntajes`
- [x] Tabla: `inactividades`
- [x] Tabla: `niveles`
- [x] INSERT valores base de niveles (Oro / Plata / Bronce / Riesgo)
- [ ] RLS: empleado solo ve sus propias órdenes
- [ ] RLS: admin ve todo
- [ ] RLS: documentos protegidos por orden
- [ ] RLS: historial_actividad protegido

🔲 ETAPA 2 — Lógica de Negocio (Edge Functions)
- [ ] Motor de asignación: disponibilidad, nivel, puntaje, tiempo de respuesta, inactividades
- [ ] Reasignación automática si no acepta en tiempo límite
- [ ] Módulo de emergencias: timer 5 min → liberar orden → penalización → log en inactividades
- [ ] Sistema de puntaje: +completar, -inactividad, -emergencia, recalcular tier
- [ ] Notificaciones: Push, WhatsApp, Email

🔲 ETAPA 3 — Panel Admin (Next.js Web)
- [ ] Dashboard: órdenes activas, atrasadas, empleados activos, emergencias
- [ ] Gestión de empleados: crear, suspender, métricas, historial
- [ ] Gestión de órdenes: crear manual, asignar manual, ver documentos, ver historial
- [ ] Configuración: tiempos de emergencia, reglas de asignación, puntos por acción

🔲 ETAPA 4 — App del Empleado (PWA / Expo)
- [ ] Autenticación: login, recuperación, verificación
- [ ] Dashboard: órdenes asignadas, en progreso, historial
- [ ] Flujo de orden: aceptar, iniciar, subir documentos, completar, notas internas
- [ ] Perfil: nivel jerárquico, puntaje, tier, inactividades, métricas

🔲 ETAPA 5 — Integraciones
- [ ] DB trigger: Order de MBF → crea ordenes_opabiz
- [ ] Sync de status de vuelta a mybusinessformation
- [ ] WhatsApp: notificaciones al empleado, recepción de documentos
- [ ] Storage Supabase: bucket opabiz-documentos, bucket opabiz-certificados

🔲 ETAPA 6 — Seguridad y Auditoría
- [ ] RLS completo (ver Etapa 1)
- [ ] Log de accesos
- [ ] Historial inmutable de cambios de estado

🔲 ETAPA 7 — Automatizaciones (Cron Jobs)
- [ ] Limpieza de inactividades antiguas
- [ ] Revisión de órdenes sin asignar
- [ ] Reasignación automática por timeout
- [ ] Reporte semanal de KPIs

🔲 ETAPA 8 — Escalabilidad y Métricas
- [ ] Indexes en columnas frecuentes
- [ ] Tiempo promedio por orden, ranking de empleados
- [ ] Dashboard de KPIs por período

Ver lógica de negocio en `LOGICA_DE_NEGOCIO/17_opabiz_integracion.md`
Ver troubleshooting en `TROUBLESHOOTING/14_opabiz.md`