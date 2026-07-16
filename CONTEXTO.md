# CONTEXTO DEL PROYECTO — OpaBiz (opabiz.com)

> **Última actualización del header:** 22 junio 2026 _(por Javier — sincronizó con la nueva arquitectura Sunbiz/Turso/R2 y marca OpaBiz)_

## Qué es el proyecto
Plataforma de formación de empresas (LLC y Corporaciones) en Florida, estilo LegalZoom/Bizee.
Web: opabiz.com (marca visible "OpaBiz"; entidad legal Florida Business Formation Center se mantiene en docs legales)
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
- Supabase — Postgres + Storage (acceso vía REST API desde Vercel; sin Prisma)
- Vercel — hosting principal (Next.js)
- Railway.app — **A CANCELAR** (decisión 2026-06-22). El plan original era despertar Railway para Etapa 5 (Sunbiz), pero se descubrió que: (a) las credenciales SFTP de Florida son públicas (no hay que solicitar acceso), (b) el daily file pesa <3MB y se procesa en <1min — dentro del límite de Vercel Cron Pro. Railway ya no es necesario. Ver arquitectura definitiva en `LOGICA_DE_NEGOCIO/26_arquitectura_sunbiz_backups.md`.
- **Turso** (NUEVO 2026-06-22) — SQLite distribuido para los 3.5M de Sunbiz. Free tier 5 GB. Cuenta pendiente de crear.
- **Cloudflare R2** (NUEVO 2026-06-22) — Object storage para backups diarios de Supabase + PDFs. Free tier 10 GB. Cuenta pendiente de crear.
- **GitHub Actions** (NUEVO 2026-06-22) — Cron diario que ejecuta `pg_dump` + sync PDFs → R2. Free tier 2000 min/mes.
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
- [x] Sitio en vivo en Vercel — https://opabiz.com/
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

Pendientes de higiene técnica:
- [ ] Refrescar `.env.local` local con `vercel env pull` — apunta al Supabase descontinuado, leería data vieja si se corre `npm run dev`. Acción solo del lado del usuario (terminal local).
- [x] Mover `backend/modules/documents/documents.service.ts` → `backend/lib/pdf-generator.ts` para consistencia (2026-05-18). Mismo patrón que `lib/notifications.ts`.

### Etapa 3 — Base de Datos PostgreSQL (1-2 semanas)
- [x] Instalar PostgreSQL — usando Supabase como hosting
- [x] Crear tablas: modelo Order completo en Supabase
- [x] Conectar con Prisma ORM — db push exitoso
- [x] orders.service.ts — saveOrder y getOrders funcionando
- [ ] Backups automáticos diarios — requiere Supabase Pro (pendiente)
- [x] Supabase conectado a Vercel con cliente HTTP
- [x] Órdenes guardándose en Supabase al hacer submit

### Etapa 4 — Pagos con Stripe (1 semana) — ✅ HECHO
- [x] Crear cuenta Stripe y obtener claves API — cuenta live `acct_1TkDfg` + sandbox `acct_1TkDfr` (2026-06-23)
- [x] Integrar Stripe Elements — **se optó por Stripe Embedded Checkout** (más simple, PCI seguro). Ver CLAUDE.md sección "Cobro del home"
- [x] Guardar transacciones en base de datos — `Order.stripePaymentId` + `Order.paymentStatus`
- [x] Probar con tarjetas de prueba — ✅ PROBADO OK EN TEST 2026-06-23 (flujo completo `4242…` → webhook 200 → paid+in_review → emails → `/order/complete`)

### Etapa 5 — Búsqueda de Nombres Sunbiz Florida (1-2 días — antes 2 semanas) ⚠️ CRÍTICA

**Arquitectura redefinida 2026-06-22** — ver `LOGICA_DE_NEGOCIO/26_arquitectura_sunbiz_backups.md`. Resumen: los 3.5M van a **Turso (Free 5 GB)** en vez de Supabase Pro $25/mes, el cron nocturno corre en **Vercel Cron** (incluido en Pro), y Railway **se cancela**. Costo extra: $0/mes vs $30/mes del plan anterior.

**Hallazgos clave del 2026-06-22:**
- Las credenciales SFTP de Florida son **PÚBLICAS** (`sftp.floridados.gov` / user `Public`). No hay que solicitar acceso — el proyecto hermano `c:\Users\ethan\datallc\` ya las usa.
- El scraper completo (`florida_sftp.py`, 346 líneas, parser de fixed-width 1440 chars/record según layout oficial) **ya existe en `datallc`** y se va a adaptar.
- El daily file pesa ~3 MB y se procesa en <1 min — dentro del límite de 5 min de Vercel Cron Pro. **Railway ya no es necesario.**

**Plan de implementación (5 fases — ver detalle en doc 26):**
- [x] **Fase 0** — Founder crea cuentas Turso + Cloudflare R2 — ✅ HECHO 2026-06-25
- [x] **Fase 1** — Carga inicial 3.5M desde la PC del founder a Turso — ✅ HECHO (3,956,123 filas indexadas en `opabiz-sunbiz-search`)
- [x] **Fase 2** — Vercel Cron nocturno descarga daily file + UPSERT a Turso — ✅ HECHO 2026-06-26 (`/api/cron/sunbiz-daily`, cron `0 6 * * *` UTC)
- [x] **Fase 3** — Migrar Path B (`/api/proxy/names/check`) y Path C (Claudia chat) a consultar Turso real — ✅ HECHO (Path B: `checkNameAvailability` en `lib/sunbiz-namecheck.ts` conectada a `/api/orders` y `modules/names/names.route.ts` la sesión 2026-07-12; Path C: tool `check_name_availability` de Claudia usa el mismo endpoint)
- [x] **Fase 4** — GitHub Actions backup diario de Supabase + PDFs → Cloudflare R2 (30 días retención) — ✅ HECHO 2026-06-25 (`.github/workflows/backup-daily.yml`, cron `30 4 * * *`, buckets `opabiz-backups` + `opabiz-pdfs`)
- [x] **Fase 5** — Cancelar Railway — ✅ decisión ratificada por el founder (2026-07-13: "no me hablaes de railway, eso ya no existe"). Los módulos Express de `backend/modules/` quedan como código legacy sin runtime activo.

**Lo que se descarta del plan original (porque Railway se cancela):**
- ~~Instalar `@sentry/node` en `backend/server.ts`~~
- ~~Crear proyecto `node-express` en sentry.io~~
- ~~Configurar env vars en Railway~~
- ~~Monitor BetterStack para Railway~~
- ~~Runbook "Railway DOWN"~~
- ~~Decisión sobre `DATABASE_URL` direct vs Session Pooler~~

Todo eso queda obsoleto. La lógica Sunbiz vive en Vercel + Turso.

### Etapa 7 — Comunicación Automática (1 semana)
- [x] Email confirmación al pagar
- [x] Email nombres tomados — cliente + alerta admin
- [x] Email de actualización de estado
- [x] Email final con Certificate of Formation
- [x] Motor de emails probado y funcionando con Resend
- [x] WhatsApp `+13528377755` configurado en todos los templates de email
- [x] Handlers de emails manuales del admin migrados de Railway/Express a Vercel/Supabase REST (commit `a5e1d45`, 2026-05-13). Endpoint `/api/proxy/notifications/[type]` ya NO pasa por Railway. Las funciones de Resend viven en `backend/lib/notifications.ts` (canónica para Vercel). La copia en `backend/modules/notifications/notifications.service.ts` y el resto del código muerto de Express fueron eliminados en commit `c7bdc07` (2026-05-18).
- [x] Templates `sendOrderProcessed` (status: filed) y `sendOrderApproved` (status: approved) — completado 2026-05-18: HTML en `backend/lib/notifications.ts` con estilo coherente al resto. Respeta `unsubscribed`. Subject "📋 Your filing is in" y "🎉 Approved!". Incluye ETA por speed (standard 3-5 días / expedited 1-2 días).
- [ ] Email con contrato PDF adjunto — pendiente hasta Etapa 6 (generación de documentos)
- [x] **Dominio opabiz.com verificado en Resend** (2026-06-19) — cuenta migrada de aneudysoto@gmail.com a la cuenta de OpaBiz. Sale del modo sandbox.
- [x] Email de confirmación enviado automáticamente al cliente
- [x] Motor de emails Resend funcionando en producción
- [x] **Sistema de emails refactorizado (2026-06-19)** — Display Names "OpaBiz" + Subjects prefijados "OpaBiz:" + Reply-To `info@opabiz.com` + FROM separado para marketing (`marketing@`) vs transaccional (`noreply@`) vs support con respuesta (`support@`). Centralizado en env vars con fallback seguro. Ver `LOGICA_DE_NEGOCIO/02_emails_automaticos.md` para la lista completa de los 12 emails del sistema y la matriz de FROM/TO/Reply-To/Subject.
- [x] **Alerta interna A0 "🆕 NUEVA ORDEN CREADA"** (2026-06-19) — cada vez que entra una orden en `/api/orders`, se dispara email automático al equipo en `alert@opabiz.com` con datos del cliente, FBFC- número y link al panel admin. Junto con A3 (nombres tomados) y C2 (nueva orden NBL Stripe), todas las alertas internas van a un buzón único `alert@opabiz.com` en Zoho.
- [x] **Página `/contact` + form (D1 + D2)** (2026-06-19) — nueva página bilingüe EN/ES con layout split-screen. El form manda email al admin a `info@opabiz.com` (D1) y confirmación al visitor (D2). Rate limit 5/h/IP. Reemplaza la barra "Not sure where to start" del home y el mailto del footer.
- [x] **Botón "🔁 Reenviar Confirmación de Orden"** en panel admin (2026-06-19, commit `1ba8b12`) — rescate manual para casos donde el send fire-and-forget de A1 se perdió por race condition en Vercel serverless.

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
- [x] Panel en producción: https://opabiz.com/admin
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
- [x] Portal en producción: https://opabiz.com/client-portal
- [x] Login acepta FBNB-XXXXXXXX (New Business Letter) además de FBFC-XXXXXXXX (2026-05-12)
- [x] Toggle EN/ES con persistencia en localStorage (portal_lang) (2026-05-12)
- [x] "My Orders" — cliente con múltiples órdenes las ve todas y puede cambiar entre ellas (2026-05-12)
- [x] Botón "Contact us" abre opciones inline: Email (support@opabiz.com) + WhatsApp (+13528377755) (2026-05-12)
- [x] Rediseño visual login (/client-portal) — card centrada sobre fondo #0f1c2e, foto a tamaño natural, header con marca arriba del card, "Don't have confirmation number?" justo debajo del botón (2026-05-12)

### Etapa 10 — Seguridad y Lanzamiento Oficial (post-lanzamiento)
- [ ] Cloudflare activo
- [ ] Revisión de seguridad
- [ ] Pruebas completas con 10 clientes simulados
- [ ] Apuntar dominio opabiz.com

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

Pre-requisito: dominio opabiz.com apuntando a Vercel (Etapa 10).

SEO Técnico:
- [x] Metadata global completa en backend/app/layout.tsx — Open Graph defaults, Twitter Cards (summary_large_image), canonical, metadataBase apuntando a https://opabiz.com, alternates.languages con hreflang ES/EN explícito (sitio bilingüe)
- [x] backend/app/sitemap.ts dinámico con todas las páginas públicas indexables (home, servicios, about, legal, privacy, terms, login, client-portal, guía, wiki y artículos) — NO incluir /admin ni rutas internas
- [x] backend/app/robots.ts con Disallow: /admin/, /api/, /client-portal/dashboard + referencia al sitemap
- [x] backend/app/opengraph-image.tsx — autogenera 1200×630 PNG con logo "FL" + wordmark + tagline (Next.js ImageResponse)
- [x] Schema.org JSON-LD en home y páginas clave — completado en 2 fases: (1) home + /new-business con `@graph` rico (Organization, WebSite, Service, LocalBusiness/ProfessionalService, FAQPage, BreadcrumbList) — pre-existente. (2) **Completado 2026-06-04 commit `5b0c3d4`**: agregado JSON-LD a `/about` (AboutPage + BreadcrumbList), `/servicios` (CollectionPage + ItemList de 18 Services con Offer USD numérico cuando hay precio fijo + BreadcrumbList), `/wiki` + `/wiki/es` + `/guias` + `/guias/es` (helper `buildHubSchema()` con CollectionPage + BreadcrumbList + Article ItemList). Todos los `@id` apex sin www; reuso de `#organization`/`#website` del home para coherencia del grafo.
- [ ] Favicon set completo: 16×16, 32×32, 192×192, 512×512, apple-touch-icon — 🔓 **desbloqueado 2026-07-13**: los assets del logo ya están en `backend/public/brand/opabiz-emblem-{256,400,512}.png` + SVG editable. Falta solo generar el set con las medidas exactas (16/32/192/512 + apple-touch-icon 180×180) y wire en `layout.tsx`.
- [x] Meta titles únicos + meta descriptions únicas por página (cada page.tsx exporta su propio metadata)
- [x] Audit de alt text en todas las imágenes — PASS: el sitio no usa etiquetas <img>, solo SVG inline y CSS
- [x] Core Web Vitals: font preconnect a fonts.gstatic.com, lazy loading de imágenes below-fold, width/height explícitos para evitar CLS — preconnect implementado; lazy loading y CLS N/A (sin imágenes externas)
- [x] Validación final 2026-06-04: **SSL Labs A+**, **Rich Results Test PASS** (Organization + LocalBusiness + Service + FAQPage + WebSite detectados), **Schema.org validator PASS** (sin errors/warnings — clave para Bing per doc 21 §6.1), **Mobile-Friendly Test PASS**. **PageSpeed Insights mobile: 64/100 below target ≥85** — SEO 100/100 ✅ pero Performance 64 falla por LCP 6.7s + FCP 4.3s + 793 KB unused JS en bundle inicial del home. **Diferido como sprint propio a Fabián** (responsable mobile/perf) — código split del wizard, next/font, defer scripts, next/image. Detalle completo en `LOGICA_DE_NEGOCIO/11_seo_tecnico_y_contenido.md` sección "Validación final".

SEO de Contenido:
- [x] Crear 2 páginas nuevas accesibles desde el footer — completado 2026-05-19: `/wiki` (referencia rápida/glosario) y `/guias` (tutoriales paso a paso). Bilingüe: `/wiki`, `/wiki/es`, `/guias`, `/guias/es`. Hubs con grid de cards agrupadas por categoría. Vacíos hoy (mensaje "Articles coming soon"). **Nota: el roadmap original decía `/guia` (singular) — se eligió `/guias` (plural) por mejor uso del español.** Links agregados en footer del home (columna "My Business Formation") con switch por idioma — EN apunta a `/wiki` y `/guias`, ES apunta a `/wiki/es` y `/guias/es`.
- [ ] Formatear e integrar 30 artículos .md que pasa el usuario (división wiki/guias por definir al recibirlos)
- [x] Frontmatter parser + Article schema automático — completado 2026-05-19: `backend/lib/content.ts` con `gray-matter` + `remark` + `remark-gfm` + `remark-html`. Cada artículo expone Schema.org `Article` (dateModified, datePublished, author, inLanguage) + `BreadcrumbList` (Home → Section → Article) automáticamente desde frontmatter. Plantillas en `backend/content/{wiki,guias}/{en,es}/_sample.md` (archivos con prefijo `_` se ignoran en build).
- [x] Cross-links module — completado 2026-05-19: `backend/lib/cross-links.ts` con `resolveRelatedArticles()` (slugs → links navegables), `suggestProductPages()` (artículo → páginas del producto según categoría: formacion/ein/sunbiz/compliance/general), `articleUrl()` + `sectionHubUrl()` helpers.
- [x] Sitemap.ts incluye artículos automáticamente — completado 2026-05-19: `backend/app/sitemap.ts` ahora suma los 4 hubs (wiki/guias × en/es) + todos los artículos publicados via `listArticles()`. Se actualiza solo cuando se agregan `.md` a `backend/content/`.

Documentación:
- [x] LOGICA_DE_NEGOCIO/11_seo_tecnico_y_contenido.md con inventario completo, archivos modificados y decisiones embutidas

### Etapa 12 — Google Search Console (GSC) (2 días)

```diff
+ Qué es: registrar el dominio opabiz.com como propiedad en
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

- [x] Crear propiedad en https://search.google.com/search-console — completado 2026-06-03 por Aneury. Property tipo **Domain** sobre `opabiz.com` (cubre www + apex + todos los subdominios).
- [x] Verificar ownership — completado 2026-06-03 por Aneury. **Por DNS TXT** en Namecheap (zona apex). La nota original del roadmap ("HTML en backend/public/google<hash>.html") **NO aplica** a properties tipo Domain — solo a URL-prefix. Ver `LOGICA_DE_NEGOCIO/20_google_search_console.md` sección "Property type — Domain vs URL-prefix".
- [ ] Submit del sitemap: https://opabiz.com/sitemap.xml — acción manual de Aneury (~1 min). **IMPORTANTE**: pegar la URL completa, no solo `sitemap.xml`. En properties Domain la UI no precarga el dominio (a diferencia de URL-prefix). Doc 20 sección "Submit del sitemap".
- [x] Crear propiedad y submit del mismo sitemap en Bing Webmaster Tools — completado 2026-06-03 por Aneury via import desde GSC. Cobertura adicional: Bing + Yahoo + DuckDuckGo + Ecosia + Brave + ChatGPT Search + Copilot + Perplexity (los 3 grandes motores de IA usan el índice de Bing). Estrategia + diferencias técnicas Bing-vs-Google + métricas de éxito documentadas en `LOGICA_DE_NEGOCIO/21_seo_multi_engine_bing_ai.md`.
- [ ] Validar Coverage (Indexing → Pages): meta de 90%+ URLs como "Indexed" en 4 semanas post-submit — time-dependent, revisar a las 4 sem.
- [ ] Validar Performance (Search results): empieza a recibir clicks/impressions — time-dependent.
- [ ] Validar Manual Actions (Security & Manual Actions): cero issues — chequeo periódico.
- [ ] Setup de notificaciones por email — acción de Aneury (~1 min). GSC → avatar → Search Console preferences → activar "Send me Search Console alerts by email".
- [ ] Si en el futuro hay migración de dominio (ej. cambio de host): usar Change of Address tool (Settings → Change of Address) ANTES de mover el DNS, sino los rankings no se transfieren limpio.
- [x] Documentar en LOGICA_DE_NEGOCIO + TROUBLESHOOTING — completado 2026-06-03: `LOGICA_DE_NEGOCIO/20_google_search_console.md` (slot 12 ya estaba tomado por marketing_automation; doc va con número 20). Cubre property type Domain vs URL-prefix, submit correcto, email alerts, Bing import, Change of Address, troubleshooting de errores comunes.

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

- [x] Crear property GA4 en https://analytics.google.com — completado 2026-06-03 por Aneury. Measurement ID: `G-6F9CHVYRXW`.
- [ ] Configurar NEXT_PUBLIC_GA_ID en Vercel — acción de Aneury (~2 min): agregar `NEXT_PUBLIC_GA_ID=G-6F9CHVYRXW` en Production. Recomendación: NO agregarlo en Preview/Development para no contaminar la property con visitas de testing.
- [x] Crear helper único backend/lib/tracking.ts — completado 2026-06-03: `trackEvent(name, params)` SSR-safe, tipo `GAEventName` union (los 9 eventos), filtra `undefined` antes de mandar. Si `window.gtag` no existe, no-op silencioso.
- [x] En backend/app/layout.tsx agregar 3 Script tags — completado 2026-06-03: `gtag-consent-default` (beforeInteractive, todo denied + `wait_for_update: 500`) ya existía; agregados `gtag-js` (afterInteractive, gated en `NEXT_PUBLIC_GA_ID`) y `gtag-init` con `send_page_view: true` + `anonymize_ip: true`.
- [x] Cookie Banner + Consent Mode v2 — ya estaba completado (commit `a4e0512` Etapa 14, 2026-05-19): `lib/consent.ts` mapea analytics/marketing a las 4 dimensiones de Consent Mode v2 y dispara `gtag('consent', 'update', ...)` al aceptar.
- [x] Implementar eventos custom del funnel — completado 2026-06-03: 9 eventos. `formation_start` + `package_selected` en `app/page.tsx:openFormFromPkg()`, `step_completed` en `app/page.tsx:fmNext()` (con step_number), `payment_started` en `app/new-business/page.tsx:handleCheckout()`, `payment_completed` en `app/new-business/success/PaymentCompletedTracker.tsx` (client island en Server Component), `claudia_message_sent` + `claudia_session_link_used` en `components/ChatWidget.tsx`, `client_login_success` en `app/client-portal/page.tsx`, `lang_toggle` en home + client-portal + dashboard (con source). `external_link_click` descartado del scope inicial — agregar después si hace falta.
- [ ] Registrar custom dimensions en GA4 Admin — acción de Aneury (~5 min): GA4 → Admin → Custom Definitions → crear 3 con scope Event: `package`, `step_number`, `lang` (en vez de `idioma` para alinear con el param real).
- [x] PII audit — completado 2026-06-03: verificación pasada por pasada, documentada en `LOGICA_DE_NEGOCIO/19_analytics_ga4.md` (sección PII audit). Cero eventos llevan email, nombre, FBFC, company name, ITIN o phone.
- [x] Smoke test protocol — completado 2026-06-03: `TROUBLESHOOTING/17_ga4_smoke_test.md` con 6-paso checklist + 7 errores comunes + validación post-incidente.
- [x] Documentar en LOGICA_DE_NEGOCIO — completado 2026-06-03: `LOGICA_DE_NEGOCIO/19_analytics_ga4.md` (slot 13 ya estaba tomado por `13_seguridad_panel_admin.md`; doc va con número 19). Inventario completo con archivo:línea, params, insight de negocio y decisiones embutidas.

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
- [x] Reorganizar carpeta `security/` — completado 2026-05-19 commit `ff45aa9`: README.md (metodología + severidades + flujo de auditoría + frecuencia), plantilla_auditoria.md (OWASP A01-A10 + plantilla individual de hallazgo), auditoria_mensual.md (histórico abril 2026 reescrito limpio).
- [ ] Auditoría OWASP Top 10 completa con clasificación 🔴🟡🟢 + commits de fix por hallazgo + bitácora de remediación — pendiente al final de todo (decisión 2026-05-19).
- [ ] Cadencia formal: no se aprueba deploy a producción si la última auditoría tiene 🔴 críticos abiertos
- [x] **Auditoría de código completa 2026-05-19** (commits `7cf1411` security + `c88cc60` quality): tsc 3→0 errors, ESLint 51→0 problems, build limpio en 11s, 47 páginas. **Hallazgo crítico**: 4 endpoints admin sin auth (`/api/admin/upload-certificate`, `/api/campaigns/companies` GET+POST, `/api/campaigns/send`, `/api/campaigns/stats`) — corregidos con `verifyAdminToken` cookie en commit `7cf1411`. Cero `any` reales, cero `console.log` en producción, cero secretos leaked al client bundle.

Auth y sesiones:
- [x] Verificar `ADMIN_PASSWORD` hasheado con bcrypt factor 12 (`ADMIN_PASSWORD_HASH` env var, sin plaintext) — completado 2026-05-08 (commit `d06992d`): bcryptjs ^3 instalado, hash en base64 para evitar parser dotenv de Next.js, `ADMIN_PASSWORD` viejo eliminado de Vercel
- [x] Cookies HttpOnly + Secure + SameSite=Strict — completado 2026-05-08 (commit `d06992d`): `secure: true` hardcoded (ya no condicional NODE_ENV), `sameSite: 'strict'` (era `'lax'`)
- [x] 2FA (autenticación de 2 factores) — completado 2026-05-09 por Fabián (commits `0552930`, `eb0be02`, `937c2b3`, `82766bf`): TOTP app (Google Authenticator / Authy) + email code como fallback. Helpers `backend/lib/encryption.ts` (AES-256-CBC), `lib/totp.ts` (otpauth, no otplib por compat Turbopack/ESM), `lib/twofa.ts`. 4 endpoints: `/api/auth/2fa-config`, `/2fa-setup`, `/2fa-verify`, `/2fa-send-email`. Página `/login/verify` para segundo paso, panel `/admin/security` para gestión. Cookie `admin_pending` (5 min, JWT con role admin_pending) entre password y 2FA. Tabla nueva en Supabase `admin_security_config` (single row) con TOTP secret encriptado y email code hasheado SHA-256. Documentado en LOGICA_DE_NEGOCIO/16_2fa_admin.md. **Pendiente: agregar `ENCRYPTION_KEY` (64 chars hex) y `ADMIN_EMAIL` en Vercel + .env.local para que funcione en producción.**
- [x] Audit trail admin — completado 2026-05-19: tabla `admin_audit_log` creada en Supabase (qkjac) con columnas admin_email, action, entity, entity_id, before, after, ip, created_at + 2 indexes (created_at DESC, admin_email). Helper `backend/lib/audit-log.ts` con `logAdminAction()` fail-quiet. Integrado en: `PATCH /api/proxy/orders/[id]` (snapshot before/after), `POST /api/admin/upload-certificate`, `POST /api/proxy/notifications/[type]` (5 tipos de email manual). Cada inserción capta IP del request.

Defensa server:
- [x] Rate limiting con Upstash Redis en `/api/auth/login` (5 intentos / 15 min / IP, sliding window) — completado 2026-05-08 (commit `f7c6887`): helper `backend/lib/rate-limit.ts` con `@upstash/ratelimit ^2` + `@upstash/redis ^1`, lazy init, fail-OPEN si Upstash cae, prefix `rl:admin-login`. Frontend `backend/app/login/page.tsx` distingue 401 vs 429 leyendo `Retry-After`, muestra countdown MM:SS y deshabilita inputs/botón durante el bloqueo
- [x] Extender rate limiting a otros endpoints públicos — completado 2026-05-19: `/api/orders` (10/h/IP, prefix `rl:orders`) y `/api/chat` (30/h/IP, prefix `rl:chat`). Helper `lib/rate-limit.ts` refactorizado a genérico con cache por endpoint. Fail-open si Upstash cae. Response 429 con header `Retry-After`. **Pendiente: `/api/contact` si existe** (no se encontró tal endpoint en el repo).
- [x] Validación zod en endpoints POST públicos — completado 2026-05-19: `backend/lib/schemas.ts` con 5 schemas + helper `parseOr400()`. Integrado en `/api/orders`, `/api/chat`, `/api/client-auth`, `/api/sunbiz/checkout`, `/api/campaigns/companies`. Cada uno valida length, regex, whitelist de enums y trim/lowercase email. `zod ^4.4.3` agregado a dependencias.
- [x] Webhook HMAC verification para Stripe — verificado 2026-05-07: ya implementado por Fabián en `backend/app/api/webhooks/stripe/route.ts:19` con `getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`. Si firma falla retorna 400
- [x] Supabase RLS audit — completado 2026-05-19: `ENABLE ROW LEVEL SECURITY` activado en las 9 tablas activas (Order, chat_messages, form_sessions, prospective_companies, email_campaigns, qr_scans, conversions, admin_security_config, admin_audit_log) ejecutado en SQL Editor del proyecto activo (qkjac). Sin policies adicionales: anon bloqueado por default, service_role bypassa (sigue funcionando todo). Smoke tests post-cambio: admin lee órdenes OK, wizard público crea órdenes OK, audit log registra cambios OK. Defense in depth: si alguna vez se expone la anon key, RLS bloquea acceso.
- [x] Service role key audit — completado 2026-05-19: `process.env.SUPABASE_SERVICE_ROLE_KEY` aparece SOLO en `backend/lib/supabase.ts:7`. Cero matches en client components (15 archivos `.tsx` con `'use client'` no importan `getSupabaseAdmin` ni `@supabase/supabase-js`). Los 2 `.tsx` que importan `getSupabaseAdmin` (`admin/page.tsx`, `client-portal/dashboard/page.tsx`) son Server Components. Service role nunca llega al bundle del browser.
- [x] Cero `NEXT_PUBLIC_*SECRET*` en código — auditado con grep 2026-05-07: cero secretos expuestos en bundle cliente

Defensa browser:
- [x] 5 security headers globales en backend/next.config.ts — completado 2026-05-18: CSP con whitelist (Stripe, Supabase via wildcard, Resend, GA4, Sentry tunnel `/monitoring`), HSTS 63072000 + includeSubDomains + preload, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy denegando camera/microphone/geolocation/interest-cohort. Aplicados via `headers()` async en config. Pendiente: validar con `curl -I https://opabiz.com/` post-deploy.
- [x] Cookie Consent banner + Google Consent Mode v2 — completado 2026-05-19: `backend/components/CookieConsent.tsx` (Client Component bilingüe ES/EN, detecta idioma del URL) + `backend/lib/consent.ts` (helpers getConsent / setConsent / onConsentChange con persistencia en cookie 1 año + localStorage). 3 botones: Accept all / Only necessary / Customize. Toggles individuales para analytics y marketing. Hook dispara `gtag('consent', 'update', ...)` mapeando a las 4 dimensiones de Consent Mode v2. `layout.tsx` agrega Consent Mode default (todo denied) ANTES de que cargue cualquier tracker — compliance CCPA/GDPR.
- [x] Validar headers en producción con `curl -I https://opabiz.com/` — **completado 2026-06-04**. Los 6 security headers presentes y correctos: CSP con whitelist completa (Stripe + Supabase + Sentry + GTM + GA + Resend), HSTS `max-age=63072000; includeSubDomains; preload` (preload-ready), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy denegando camera/mic/geolocation/interest-cohort. Adicional: HTTPS forzado con 308 desde HTTP, www → apex 308 (fix: agregar www como dominio en Vercel — el cert SSL no cubría www inicialmente; sin esto, el redirect 301 del `next.config.ts` nunca se ejecutaba porque el SSL handshake fallaba antes). SSL Labs: A+.

Dependencias y misc:
- [x] `npm audit --audit-level=moderate` con 0 vulnerabilidades HIGH/CRITICAL — **completado 2026-06-03**: upgrade Next.js 16.1.7 → 16.2.7 cerró la HIGH de next (12 CVEs combinados). `npm audit fix` post-upgrade resolvió 4 moderate transitivas (qs, uuid via svix→resend, etc). Quedan 2 MODERATE acopladas: `postcss <8.5.10` (XSS via unescaped `</style>` en stringify) y `next` (depende del postcss vulnerable). Cerrarlas requiere next 16.3+ que hoy está en canary. **Net: 0 HIGH, 0 CRITICAL — meta alcanzada.**
- [x] Activar Dependabot en GitHub — completado 2026-05-19: `.github/dependabot.yml` con schedule weekly (lunes 08:00), groups (security, next, sentry, supabase), labels dependencies + security, commit prefix `chore(deps)`. También monitorea GitHub Actions cuando se agreguen.
- [x] Verificar `.gitignore` excluye `.env`, `.env.local`, `.env*.local` — verificado 2026-05-07: `backend/.gitignore` tiene `.env*` y `.env*.local`
- [ ] Documentar en `LOGICA_DE_NEGOCIO/18_security_headers_y_hardening.md` (archivo iniciado por Aneury el 2026-05-19 — contiene sección de rate limiting; pendiente expandir con CSP headers, zod validation, audit trail, Cookie Consent, RLS audit) + actualizar TROUBLESHOOTING/ con guías de respuesta a incidentes de seguridad

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

Pre-requisito: dominio opabiz.com apuntando a Vercel (Etapa 10) — los monitores apuntan a URLs finales de producción.

Sentry — error tracking + APM:
- [x] Crear cuenta en sentry.io (free tier: 5K eventos/mes, retención 30 días) — proyecto `javascript-nextjs` para Next.js completado 2026-05-09 con `admin@opabiz.com`, capturando errores en producción. **El proyecto `node-express` para Railway queda DIFERIDO hasta Etapa 5** (Railway dormido desde 2026-05-13).
- [x] Env vars Sentry en Vercel (Production + Preview + Development): `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` configuradas 2026-05-09. AUTH_TOKEN omitido (sourcemaps disable). **Env vars en Railway DIFERIDO hasta Etapa 5.**
- [x] Instalar `@sentry/nextjs` en Next.js — completado 2026-05-09 (commit `305bc94`): `@sentry/nextjs ^9` instalado. **`@sentry/node` en Express DIFERIDO hasta Etapa 5** (Railway dormido, no hay código corriendo que monitorear).
- [x] Crear `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` en backend — completado 2026-05-09 (commit `305bc94`): los 4 archivos creados con init Sentry según runtime (Node, edge, browser) + helper `backend/lib/sentry-pii-filter.ts` con `scrubPII()` compartido
- [x] Wrap backend/next.config.ts con `withSentryConfig` — completado 2026-05-09 (commit `305bc94`): + `tunnelRoute: '/monitoring'` para sortear ad-blockers
- [x] Filtrar PII en `beforeSend` — completado 2026-05-09 (commit `305bc94`): helper `scrubPII()` filtra email, nombre, teléfono, SSN/ITIN, tarjetas, passwords, tokens en strings, objects anidados, breadcrumbs, request body/headers/cookies/query
- [x] Smoke test server-side — validado local + producción 2026-05-09: endpoint temporal `/api/sentry-test` disparó error con prefix `[sentry-test-2026-05-09]`, evento llegó al dashboard de Sentry con `environment: production`. Endpoint borrado post-validación (commit `06e9c4d`)
- [x] Smoke test client-side: ruta `/sentry-client-test` gated a preview/dev (404 en producción) — completado 2026-05-13 (commit `b1c52d7`): Server Component verifica `VERCEL_ENV !== 'production'` y retorna `notFound()`; Client Component con 3 botones (uncaught throw, `captureException`, `captureMessage`) prefijados `[sentry-client-test-*]`. Documentado en `LOGICA_DE_NEGOCIO/15_sentry_betterstack_monitoring.md` (protocolo de validación mensual).
- [x] Alert Rule en Sentry → email a admin@opabiz.com — completado 2026-05-13: configurada en sentry.io para primera ocurrencia de cada error nuevo. Validada end-to-end durante smoke test de BetterStack.

BetterStack — uptime + status page:
- [x] Crear cuenta en betterstack.com — completado 2026-05-13 (free tier: 10 monitores, 30s checks, status page con custom domain, SSL cert monitor).
- [x] Crear 3 monitores con SSL/TLS verification — completado 2026-05-13: Home, Admin Login, API Client Portal. **El monitor de Express en Railway (`up.railway.app/health`) queda DIFERIDO hasta Etapa 5** — sin tráfico, monitorear Railway dormido es ruido.
- [x] Umbral 2-3 fallos consecutivos antes de alertar (evita falsos positivos por hiccups de red) — configurado 2026-05-13.
- [x] Smoke test DOWN/UP — validado end-to-end 2026-05-13: una ruta inválida `/xxxxxxx` generó DOWN → email a Zoho → recuperación → UP automático.
- [ ] Email alerts a 2 destinatarios — **APLAZADO**: hoy solo notifica a `admin@opabiz.com`. El segundo destinatario será un Gmail de la compañía (pendiente de crear).
- [ ] Status page pública en `status.opabiz.com` con CNAME — **APLAZADO**: los DNS están en Netlify; pendiente migración a Namecheap BasicDNS para unificar. Una vez migrados, configurar CNAME apuntando a BetterStack + cert SSL Let's Encrypt auto-emitido.

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
- [x] `STRIPE_SECRET_KEY` — ✅ cargada en Vercel Production+Preview (test/sandbox activa)
- [x] `STRIPE_WEBHOOK_SECRET` — ✅ cargada en Vercel (webhook `opabiz-checkout` firmando con este secret)

Pendiente:
- [x] Agregar STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET en Vercel env vars — ✅ hecho 2026-06-23
- [x] Registrar webhook en Stripe dashboard apuntando a /api/webhooks/stripe (evento: checkout.session.completed) — ✅ hecho ⚠️ CON `www.opabiz.com` (el apex `opabiz.com` redirige 308 y Stripe no sigue redirects — ver CLAUDE.md GOTCHA)
- [x] Validar que las 4 tablas Supabase fueron creadas correctamente — CONFIRMADO 2026-05-01
- [x] Probar flujo completo end-to-end con empresa de prueba — ✅ PROBADO OK 2026-06-23 (test/sandbox). **Pendiente aparte: activar LIVE cargando las keys `pk_live_.../sk_live_...` en Vercel Production** (todo el resto del setup live ya está — ver CLAUDE.md "Stripe LIVE — preparado, NO activado")
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
- [x] `/admin/orders/[id]` — completado 2026-05-19: breakpoints 768px (padding reducido, inputs 16px anti-zoom iOS) + 480px (botones min-height 44px). Página usa muchos inline styles; estrategia: tweaks vía `.wrapper`, `.btn`, `textarea`, `select`, `input[type=file]` para no reescribir todo
- [x] `/admin/campaigns` — completado 2026-05-19: breakpoints 768px (wrap padding, stat-card más chica, table cells más compactos) + 480px (stats-grid 1 col, btn min-height 44px)
- [x] `/servicios` — ya tenía 11 media queries activas (1100/860/768/640/540px) cubriendo grid, form, hero, footer. Tildado 2026-05-19 — el item estaba stale en CONTEXTO
- [ ] `/new-business/es` — wrapper de /new-business en español; hereda los estilos

Ver troubleshooting en `TROUBLESHOOTING/13_responsive_design.md`

---

### Etapa 18 — OPABIZ: App On-Demand para Empleados (RETOMADA 2026-07-13)

> **NOTA (2026-05-18, superada):** OPABIZ quedó descartada del scope pre-launch. ~~Se retoma después del lanzamiento~~
>
> **ACTUALIZACIÓN (2026-07-13):** se retomó antes de lo previsto. El founder ya había arrancado esto en una sesión previa con otra IA (no documentada acá) — el esquema real de Supabase difiere bastante de lo que describe este archivo (tabla `EMPLEADOS` en mayúsculas no listada abajo, ENUMs con valores distintos, `EMPLEADOS.id` — no `usuarios.id` — es la clave real que usan `empleado_perfil`/`ordenes_opabiz`/`puntajes`/`inactividades`). Se construyó el motor de asignación (Etapa 2) + arranque del panel admin (Etapa 3, alta de empleados en `/admin/opabiz`) + cron de timeout/reasignación. Detalle completo y actualizado en `LOGICA_DE_NEGOCIO/17_opabiz_integracion.md` y memoria `project_opabiz_sistema_interno`. **Este bloque de abajo (checklist original) quedó desactualizado — no confiar en los nombres de tabla/campos sin verificar contra Supabase primero.**
>
> **ACTUALIZACIÓN (2026-07-14):** se construyó la Etapa 4 (login de empleado + invitación por email + PWA MVP: dashboard, aceptar/completar orden, subir documentos, toggle de disponibilidad). Sin este toggle nadie podía llegar nunca a `estado_disponibilidad='disponible'`, así que el motor de asignación era imposible de probar de punta a punta hasta ahora. También se confirmó el schema real de `ordenes_opabiz`/`documentos`/`niveles` (`cliente_id` apunta a `usuarios.id`, no al `Order` del sitio público) y se corrigió un bug del cron de reasignación que violaba una constraint `NOT NULL` en silencio. Pendiente correr `supabase_migration_opabiz_documentos_bucket.sql`. El nombre visible para el equipo pasó a ser **"OpaBiz Connect"** (rutas/tablas siguen siendo `opabiz` internamente, sin cambios). Detalle en `LOGICA_DE_NEGOCIO/17_opabiz_integracion.md` y memoria `project_opabiz_sistema_interno`.


```diff
+ Qué es: aplicación interna de Florida Business Formation Center para gestionar
+ y asignar órdenes a los empleados. Cuando un cliente paga en opabiz.com,
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

🟦 ETAPA 4 — App del Empleado (PWA) — MVP CONSTRUIDO 2026-07-14
- [x] Autenticación: login, invitación por email (token Redis 72h), sin recuperación de contraseña propia todavía (el admin reenvía la invitación)
- [x] Dashboard: órdenes asignadas + toggle de disponibilidad
- [x] Flujo de orden: aceptar, subir documentos, completar
- [ ] Perfil: nivel jerárquico, puntaje, tier, inactividades, métricas (fácil de agregar, `getTierForScore()` ya existe)
- [ ] Notas internas del empleado sobre una orden
- Detalle completo: `LOGICA_DE_NEGOCIO/17_opabiz_integracion.md` y memoria `project_opabiz_sistema_interno`

🟦 Primeros usos reales — CONSTRUIDOS 2026-07-14 (mismo día, 100% manuales)
- [x] Citas → orden: botón en `/admin/citas` crea y asigna una orden a mano (empleado obligatorio, `ordenes_opabiz.empleado_id` es NOT NULL)
- [x] Intake asistida: agente arma la solicitud del cliente por teléfono en `/opabiz/dashboard/intake` sin tocar el pago — cliente confirma y paga en `/confirm/[fbfc]`
- [ ] Auto-crear orden al agendar cita / al pagar — a propósito manual por ahora, se automatiza cuando evalúen el desempeño de los agentes

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