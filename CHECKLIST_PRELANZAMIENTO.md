# CHECKLIST PRE-LANZAMIENTO — OpaBiz (opabiz.com)

**Última actualización:** 22 junio 2026 _(por Javier — actualizó Etapa 4 Stripe, Etapa 5 Sunbiz, Dominio/DNS, Base de datos, Hosting, Monitoreo y Troubleshooting con el estado real al 2026-06-22)_
**Fecha objetivo de lanzamiento:** 15 septiembre 2026
**Tiempo restante:** ~3 meses

> **Cambio de marca (2026-06-08):** El dominio activo es `opabiz.com`. La entidad legal Florida Business Formation Center se mantiene en docs legales. Ver `CLAUDE.md` para detalles.

> **Cómo usar este archivo:** Recorre cada sección antes de lanzar. Marca con `[x]` cada ítem completado. NO lances hasta que el 100% de los ítems críticos (🔴) estén marcados. Los importantes (🟡) deberían estar al 90%+. Los opcionales (🟢) son nice-to-have.

---

## 🔴 ETAPA 4 — Pagos con Stripe (mayormente listo en TEST — falta LIVE)

**Estado 2026-06-22:** Flujo de Embedded Checkout implementado y desplegado (commit `05d3e20`). Falta probar end-to-end en TEST y luego replicar todo en LIVE.

### Cuenta y verificación
- [x] Crear cuenta Stripe en stripe.com con email del negocio (cuenta OpaBiz creada en sandbox)
- [ ] Completar verificación de identidad de Stripe (puede tardar 2-7 días)
- [ ] Conectar cuenta bancaria del negocio para recibir pagos
- [x] Obtener API keys de prueba (`sk_test_...`, `pk_test_...`) — en Vercel env vars
- [ ] Obtener API keys de producción (`sk_live_...`, `pk_live_...`)

### Implementación (HECHO — Embedded Checkout)
- [x] `lib/pricing.ts` — cálculo autoritativo server-side anti-tampering
- [x] `POST /api/checkout/embedded` — crea sesión Stripe `ui_mode='embedded'`
- [x] `GET /api/checkout/status` — consulta estado para la página de retorno
- [x] `/order/complete` — pantalla post-pago bilingüe
- [x] `POST /api/webhooks/stripe` — handler para formación (`metadata.kind='formation'`) + addons/marketing (NBL). Idempotente.
- [x] Webhook `opabiz-checkout` configurado en Stripe TEST → `opabiz.com/api/webhooks/stripe`
- [x] Env vars TEST en Vercel: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- [x] Wiring frontend completo en `page.tsx` — fmSubmit reescrito, form de Stripe se monta, T&C validados
- [x] Eventos webhook: `checkout.session.completed` (formation + addons)

### Pendientes pre-launch
- [ ] **Smoke test TEST end-to-end** con `4242 4242 4242 4242` → verificar orden pending creada, webhook marca paid, emails llegan, `/order/complete` muestra éxito (requiere Redeploy si no se hizo)
- [ ] Probar pago rechazado con `4000 0000 0000 0002`
- [ ] Probar 3D Secure con `4000 0027 6000 3184`
- [ ] **Configurar Statement Descriptor** en Stripe → Settings → Business → Public details (ej. `OPABIZ`, 5-22 chars, mín 5 letras). ⚠️ TEST y Live son configs SEPARADAS
- [ ] Crear cuenta Stripe LIVE + keys live + webhook live + descriptor live (REPETIR todo en modo live)
- [ ] Hacer pago real con tarjeta personal de $1 en producción para validar end-to-end
- [ ] Reembolsar ese pago de prueba después de validar
- [ ] Activar emails automáticos de Stripe a clientes (recibos)
- [ ] Activar protección contra fraude de Stripe (Radar default rules)

> _Actualizado por Javier el 2026-06-22_ — reescrita la sección con el estado de Embedded Checkout (commit 05d3e20). Pendiente smoke test TEST + replicar todo en LIVE.

---

## 🔴 ETAPA 5 — Búsqueda de Nombres Sunbiz Florida (CRÍTICA — en progreso)

**Arquitectura redefinida 2026-06-22.** Ver `LOGICA_DE_NEGOCIO/26_arquitectura_sunbiz_backups_opabiz.md`. Los 3.5M van a **Turso (Free 9 GB)**, el cron nocturno corre en **Vercel Cron**. Railway se cancela. Costo extra: $0/mes.

**Descubrimiento clave 2026-06-22:** las credenciales SFTP de Florida son **PÚBLICAS** (`sftp.floridados.gov` user `Public`). No hay que solicitar acceso. El proyecto hermano `c:\Users\ethan\datallc\` ya las usa con un scraper Python listo que se va a adaptar.

### Fase 0 — Cuentas (DONE)
- [x] Crear cuenta en Turso (https://turso.tech) — database `opabiz-sunbiz-opabiz` creada (2026-06-22)
- [x] Crear cuenta en Cloudflare R2 — bucket `opabiz-backups` creado (2026-06-22)
- [x] Env vars `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` en Vercel Production + Development

### Fase 1 — Carga inicial 3.5M (en progreso)
- [x] Schema `sunbiz_corps` + FTS5 + triggers + `sunbiz_load_log` creado en Turso
- [x] `@libsql/client@0.17.4` instalado en `backend/`
- [x] `backend/lib/turso.ts` — helper `getTurso()` lazy init
- [x] `backend/scripts/sunbiz-load.mjs` — loader Node con batch 2000 × 6 workers paralelos
- [x] Smoke test end-to-end con 26 daily files de datallc → **59,898 registros cargados** (FTS5 fuzzy search funcionando)
- [ ] Descargar dump trimestral `cordata.zip` desde SFTP (1.66 GB) — en progreso, ~47%
- [ ] Descomprimir + procesar e insertar los 3.5M
- [ ] Verificar `SELECT COUNT(*) FROM sunbiz_corps ≈ 3.5M`

### Fase 2 — Cron nocturno (Vercel Cron)
- [ ] Crear `backend/app/api/cron/sunbiz-daily/route.ts`
- [ ] `ALTER TABLE` agregar columnas `officers JSON`, `fei TEXT`, `last_tx_date TEXT` (schema completo para daily — decisión founder 2026-06-22)
- [ ] Portar `parseOfficers()` del scraper Python de datallc al loader Node
- [ ] Configurar cron en `vercel.json` para 4am UTC (12am EST)
- [ ] Smoke test: correr manualmente y verificar logs

### Fase 3 — Migrar Path B y Path C (consumir Turso real)
- [ ] Path B: `/api/proxy/names/check` — quitar el mock, consultar `sunbiz_corps_fts` con FTS5
- [ ] Path C: tool `check_name_availability` de Claudia chat — quitar scraping HTML, consultar Turso
- [ ] Conectar el panel admin (`/admin/orders/[id]`) para usar endpoint real (hoy es mock)
- [ ] Auto-relleno de 14 formularios en `/servicios` — migrar de `sunbiz_corps` Supabase (vacío) a Turso

### Fase 4 — Backups GitHub Actions → R2
- [ ] Crear `.github/workflows/backup-daily.yml` (cron diario 12:30am)
- [ ] Script: `pg_dump` Supabase + sync PDFs → R2 con timestamp YYYY-MM-DD
- [ ] Lifecycle policy R2: retención 30 días
- [ ] Agregar 5 vars de R2 en GitHub Actions Secrets (NO en Vercel)
- [ ] Smoke test: correr workflow manualmente, verificar archivos en R2
- [ ] Documentar restore en `TROUBLESHOOTING/`

### Fase 5 — Cancelar Railway
- [ ] Confirmar que todo funciona sin Railway (verificar `/api/sunbiz` y demás endpoints)
- [ ] Cancelar plan de Railway en su dashboard (ahorro $5/mes)
- [ ] Limpiar `BACKEND_URL` y código relacionado en Vercel
- [ ] Limpiar `railway.json` del repo

- [ ] **Plan B si Fase 1 no termina antes del lanzamiento:** lanzar con los ~60K daily files cargados + scraping fallback de Claudia para nombres no encontrados

> _Actualizado por Javier el 2026-06-22_ — arquitectura completa redefinida (Turso + Cloudflare R2 + Vercel Cron + GitHub Actions, Railway cancelado). Plan original "solicitar acceso FTP" descartado: el SFTP de Florida es público. Fase 0 + parte de Fase 1 ya hechas (60K records cargados como proof of concept).

---

## 🟡 ETAPA 7 — Comunicación Automática (mayoría completa, faltan ítems críticos)

- [x] **Dominio `opabiz.com` verificado en Resend** (2026-06-19) — cambió de `onboarding@resend.dev` a `OpaBiz <noreply@opabiz.com>` con Display Name. Cuenta migrada de aneudysoto@gmail.com a la cuenta de OpaBiz.
- [x] Registros DNS SPF, DKIM, DMARC para Resend configurados y verificados ✅
- [x] Buzones Zoho creados: `noreply@`, `marketing@`, `support@`, `info@`, `admin@`, `alert@`
- [ ] Probar deliverability post-verificación con email a Gmail, Yahoo, Outlook (no debe ir a spam) — pendiente test exhaustivo, pero en pruebas iniciales (Gmail) llegan a Primary OK.
- [x] **Sistema centralizado de FROM/Reply-To/alerts en env vars** (commits `d7f9c68`, `36db324`, `f3fc1cf`) — `RESEND_FROM_TRANSACTIONAL`, `RESEND_FROM_MARKETING`, `RESEND_FROM_SUPPORT`, `RESEND_REPLY_TO`, `INTERNAL_ALERT_EMAIL`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` en Vercel. Ver `LOGICA_DE_NEGOCIO/02_emails_automaticos.md`.
- [x] **Display Names "OpaBiz" + Subjects prefijados** (commit `70a9a73`) — el cliente ve "OpaBiz" en su inbox, no "noreply".
- [x] **Nuevo email D2** confirmación al visitor del form de contacto.
- [x] **Nueva alerta A0** "🆕 NUEVA ORDEN CREADA" → `alert@opabiz.com` por cada orden.
- [x] **Botón "🔁 Reenviar Confirmación de Orden"** en panel admin (rescate para casos de race condition en Vercel serverless).
- [ ] Email "contrato PDF adjunto" (depende de Etapa 6 — opcional pre-launch)
- [ ] Plantilla email "recordatorio cliente para enviar nuevos nombres" (cuando los 3 nombres están tomados y han pasado 48h sin respuesta)
- [ ] Plantilla email "Annual Report deadline aproximándose" (recordatorio para clientes año 2+)
- [x] Test del flujo completo de los 12 emails con órdenes simuladas en producción — A0, A1, A2, A4, B1, D1, D2 probados OK. Pendientes: A5, A6, A7, C1, C2 (probarán cuando se avance órdenes reales).

---

## 🟢 DOMINIO Y DNS — (DONE, dominio activo)

**Estado 2026-06-22:** `opabiz.com` activo en producción + `mybusinessformation.com` autenticado para buzones Zoho y 301 → opabiz.com.

- [x] `opabiz.com` registrado y a nombre del negocio
- [x] Apuntado a Vercel con SSL automático
- [x] Dominio configurado en Vercel (Settings → Domains)
- [x] MX records → Zoho Mail (6 buzones activos: noreply, marketing, support, info, admin, alert)
- [x] TXT records SPF, DKIM, DMARC verificados en Resend (2026-06-19)
- [x] `mybusinessformation.com` autenticado con MX/SPF/DKIM/DMARC para Zoho (2026-06-22) — fix de "isn't authenticated" en Gmail
- [x] 301 de `mybusinessformation.com` → `https://opabiz.com/new-business` (en `next.config.ts`, conserva `?id=`)
- [x] OG image y meta tags actualizados con `opabiz.com`
- [x] `NEXT_PUBLIC_URL=https://opabiz.com` configurado en Vercel

### Pendientes menores
- [ ] Renovar dominio por mínimo 3 años (evita olvido y pérdida)
- [ ] Activar privacy protection del dominio (WHOIS privacy)
- [ ] Configurar redirect www → no-www (verificar si ya está)
- [ ] BIMI logo para inbox preview (opcional, requiere certificado VMC pagado)

> _Actualizado por Javier el 2026-06-22_ — sección bajada de 🔴 crítica a 🟢 done. opabiz.com vive en producción + mybusinessformation.com autenticado para los buzones Zoho.

---

## 🔴 ETAPA 10 — Seguridad y Hardening (CRÍTICA antes de cobrar dinero real)

- [ ] Habilitar Cloudflare delante del dominio (proxy DNS)
- [ ] Configurar reglas WAF básicas en Cloudflare (bloqueo de bots conocidos, rate limiting básico)
- [ ] Activar "Bot Fight Mode" en Cloudflare
- [ ] Activar Cloudflare Turnstile (CAPTCHA) en formulario de registro de orden y formulario de waitlist
- [ ] Activar Cloudflare Turnstile en login del cliente (`/client-portal`) y admin (`/login`)
- [ ] Auditoría de seguridad — revisar `security/auditoria_mensual.md` y resolver pendientes
- [ ] Verificar que `INTERNAL_API_KEY` está rotada y solo en Vercel/Railway (no en cliente)
- [ ] Verificar que `SESSION_SECRET` (JWT) tiene 32+ caracteres aleatorios
- [ ] Verificar que `ADMIN_PASSWORD` es fuerte (16+ chars, mixed case + número + símbolo)
- [ ] Activar 2FA en cuentas de servicio críticas: Vercel, Railway, Supabase, Stripe, GitHub, Resend, dominio registrar
- [ ] Configurar password manager para guardar todas las credenciales (1Password / Bitwarden)
- [ ] Backup manual completo de todas las env vars (export desde Vercel + Railway, guardar offline cifrado)
- [ ] Verificar CORS del Express en Railway — solo acepta orígenes permitidos
- [ ] Verificar headers de seguridad de Vercel (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)
- [ ] Probar penetración básica: intentar bypass de middleware admin sin sesión, ver que redirecciona
- [ ] Probar bypass de middleware client-portal sin cookie, ver que redirecciona
- [ ] Probar SQL injection en formularios principales (Prisma debería protegernos, pero verificar)
- [ ] Probar XSS en campos de texto del formulario (escape correcto en panel admin)
- [ ] Eliminar consoles.log con datos sensibles del código de producción
- [ ] Activar Vercel Web Application Firewall si plan lo permite
- [ ] Documentar en `security/` el resultado de cada test

---

## 🔴 BASE DE DATOS Y BACKUPS (CRÍTICA)

**Arquitectura redefinida 2026-06-22.** El upgrade a Supabase Pro $25/mes **se descartó**. Plan distribuido: Supabase Free + Turso Free + Cloudflare R2 + GitHub Actions = $0/mes con la misma protección. Ver `LOGICA_DE_NEGOCIO/26_arquitectura_sunbiz_backups_opabiz.md`.

### Decisión arquitectural
- [x] **NO upgrade a Supabase Pro** — decisión 2026-06-22 (no concentrar todo en un proveedor)
- [x] Datos críticos del negocio (Order, accounting, appointments, PDFs) → **Supabase Free**
- [x] 3.5M Sunbiz → **Turso Free 9 GB**
- [x] Backups diarios pg_dump + sync PDFs → **Cloudflare R2** (10 GB free)
- [x] Cron diario de backups → **GitHub Actions** (2000 min/mes free)

### Pendientes (Fase 4 — backups)
- [ ] Crear `.github/workflows/backup-daily.yml`
- [ ] Script `pg_dump` Supabase + sync PDFs → R2 con timestamp
- [ ] Configurar lifecycle policy R2 retención 30 días
- [ ] Probar restore desde R2 en environment de prueba (validar que funciona)
- [ ] Documentar el proceso de restore en `TROUBLESHOOTING/`

### Otros
- [x] Prisma removido 2026-05-19 — todo Supabase REST ahora (no más migrations Prisma)
- [ ] Revisar índices de Supabase — agregar índices en columnas con queries frecuentes (`Order.email`, `Order.status`, `Order.createdAt`)

> _Actualizado por Javier el 2026-06-22_ — descartado el upgrade a Supabase Pro $25/mes. Plan distribuido (Supabase Free + Turso Free + Cloudflare R2 + GitHub Actions) = $0/mes con la misma protección y no concentra todo en un proveedor.

---

## 🟢 INFRAESTRUCTURA — Hosting (Vercel Pro + Turso, Railway CANCELAR)

**Decisión 2026-06-22:** Railway se cancela (ya no se necesita para Etapa 5). Vercel Pro ya cubre todo: cron de Sunbiz, API routes, edge functions.

- [x] Vercel Pro activado ($20/mes — ya se paga)
- [x] Cron de Vercel Pro disponible para `/api/cron/sunbiz-daily` (hasta 100 crons en Pro)
- [x] Preview deployments configurados (cada PR/branch genera URL)
- [x] Env vars por ambiente: production, preview, development
- [x] Turso conectado desde Vercel (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN en Prod + Dev)
- [ ] **CANCELAR Railway** después de Fase 5 (ahorro $5/mes — ver Etapa 5)
- [ ] Eliminar `railway.json` del repo cuando Railway esté cancelado
- [ ] Documentar TODAS las env vars necesarias en `backend/.env.example` (sin valores reales)

> _Actualizado por Javier el 2026-06-22_ — Railway marcado para cancelar. La lógica que iba a vivir ahí (Sunbiz) se hace en Vercel Cron Pro + Turso.

---

## 🟡 ETAPA 6 — Documentos Automáticos (parcialmente completo)

- [ ] Implementar generación de ITIN W-7 pre-llenado (formulario IRS)
- [ ] Implementar generación de Annual Report pre-llenado (formulario Sunbiz FL)
- [ ] Endpoint para upload de documentos finales por admin (panel)
- [ ] Endpoint para descarga de documentos finales por cliente (portal)
- [ ] Sección "My Documents" en `/client-portal/dashboard` con signed URLs
- [ ] Validar que los PDFs pre-llenados se generan correctamente con datos reales de orden
- [ ] Plantilla de Operating Agreement con cláusulas en español (revisión legal recomendada)
- [ ] Plantilla de Banking Resolution con datos correctos
- [ ] Test end-to-end: orden → admin descarga PDF pre-llenado → admin sube PDF final → cliente descarga

---

## 🟢 MONITOREO Y OBSERVABILIDAD — (DONE en Etapa 15)

**Estado 2026-05-13:** Bloque Sentry + BetterStack cerrado en commits `b1c52d7` y `bd7021a`. Ver `LOGICA_DE_NEGOCIO/15_sentry_betterstack_monitoring.md`.

- [x] Sentry Next.js — proyecto `javascript-nextjs` creado, `@sentry/nextjs ^9` instalado, env vars en Vercel (Prod + Preview + Dev)
- [x] Filtro PII en `lib/sentry-pii-filter.ts` aplicado al init de Sentry
- [x] `tunnelRoute /monitoring` contra ad-blockers
- [x] BetterStack — 3 monitores con SSL + push iPhone + filtros email (Home, Admin Login, API Client Portal)
- [x] Alert Rule en Sentry configurado
- [x] Runbooks en `TROUBLESHOOTING/15_sentry_alerts.md` y `TROUBLESHOOTING/16_betterstack_down.md`

### Diferidos (no críticos para launch)
- [ ] Sentry node-express + 4to monitor BetterStack + runbook "Railway DOWN" — **OBSOLETOS** (Railway se cancela, ver Etapa 5)
- [ ] Segundo email destinatario en alertas (Gmail compañía) — pendiente migración DNS Netlify→Namecheap
- [ ] Status page custom domain — pendiente migración DNS
- [ ] Cron "orden estancada > 30 min en pending" (Vercel Cron)
- [ ] Construir widget `SystemStatusWidget.tsx` en `/admin` (consume APIs Sentry + BetterStack)

> _Actualizado por Javier el 2026-06-22_ — sección bajada de 🟡 a 🟢. Sentry + BetterStack ya activos desde 2026-05-13. Los items diferidos a Railway quedan obsoletos.

---

## 🟢 CARPETA TROUBLESHOOTING — (DONE — 18 runbooks)

**Estado 2026-06-22:** Carpeta `TROUBLESHOOTING/` activa con 18 runbooks. Ver `TROUBLESHOOTING/README.md`.

- [x] `01_sitio_caido.md`
- [x] `02_backend_no_responde.md`
- [x] `03_base_de_datos.md`
- [x] `04_pagos_fallidos.md`
- [x] `05_emails_no_envian.md`
- [x] `06_busqueda_nombres.md`
- [x] `07_panel_admin.md`
- [x] `08_portal_cliente.md`
- [x] `09_dominio_dns.md`
- [x] `10_otros.md`
- [x] `11_claudia_asistente_virtual.md`
- [x] `12_marketing_automation_campanas.md`
- [x] `13_responsive_design.md`
- [x] `14_opabiz.md`
- [x] `15_sentry_alerts.md`
- [x] `16_betterstack_down.md`
- [x] `17_ga4_smoke_test.md`
- [ ] Nuevo runbook: `18_sunbiz_turso_cron_falla.md` (cuando Fase 2 esté lista)
- [ ] Nuevo runbook: `19_backups_r2_no_corren.md` (cuando Fase 4 esté lista)

> _Actualizado por Javier el 2026-06-22_ — sección bajada de 🔴 a 🟢. 18 runbooks activos en `TROUBLESHOOTING/`.

---

## 🟡 LEGAL Y COMPLIANCE (CRÍTICA antes de cobrar)

- [ ] Revisar `/terms` (Terms & Conditions) con abogado o notario público en FL
- [ ] Revisar `/privacy` (Privacy Policy) — debe cubrir CCPA si aplica, GDPR si tienes usuarios EU
- [ ] Revisar `/legal` (Legal Disclaimer) — disclaimer "no somos abogados, no damos asesoría legal"
- [ ] Agregar página o sección "Refund Policy" — cuándo procedes refund vs no
- [ ] Agregar disclaimer en footer de TODAS las páginas: "MyBusinessFormation is not a law firm and does not provide legal advice."
- [ ] Configurar Cookie Banner si te molestas con CCPA (poco crítico para FL pero buena práctica)
- [ ] Verificar que el formulario tiene checkbox de "Acepto Terms y Privacy" obligatorio antes de submit
- [ ] Verificar que el email de confirmación incluye link de unsubscribe (ya implementado, pero verificar)
- [ ] Registrar el negocio mismo (irónico) — formar la LLC propia: "MyBusinessFormation LLC" o similar
- [ ] Obtener EIN propio del negocio (para cuentas bancarias y Stripe)
- [ ] Abrir cuenta bancaria del negocio para conectar a Stripe
- [ ] Configurar la forma jurídica con la que vas a operar (sole prop, LLC, S-Corp)
- [ ] Sales tax permit en Florida (si vendes "guías PDF" o productos digitales podría aplicar)
- [ ] Business Tax Receipt del condado (Miami-Dade o donde estés)

---

## 🟡 CONTENIDO Y COPY DEL SITIO (importante para conversión)

- [ ] Reescribir copy del home en español latino auténtico (no traducción mecánica)
- [ ] Verificar que TODAS las páginas tienen versión EN y ES funcional (test cada toggle)
- [ ] Hero section con propuesta clara: "Tu LLC en Florida desde $49 — en español, sin SSN obligatorio"
- [ ] Sección de testimoniales con 3+ casos reales (cuando los tengas)
- [ ] Sección FAQ ampliada con 15-20 preguntas reales
- [ ] Sección "Cómo funciona" con 4-6 pasos visuales
- [ ] Página de blog (estructura mínima) lista para publicar artículos SEO post-launch
- [ ] Imágenes optimizadas (WebP, máximo 200KB cada una)
- [ ] Alt text descriptivo en todas las imágenes (accesibilidad + SEO)
- [ ] Meta titles + meta descriptions optimizados en cada página
- [ ] OG image custom (Open Graph) para compartir en redes
- [ ] Favicon en alta calidad (32x32, 192x192, 512x512)
- [ ] Página 404 custom con búsqueda y links útiles

---

## 🟡 SEO TÉCNICO (importante)

- [ ] Generar `robots.txt` permitiendo crawl
- [ ] Generar `sitemap.xml` automático con todas las páginas (`next-sitemap` package)
- [ ] Agregar dominio en Google Search Console y verificar ownership
- [ ] Submit del sitemap a Google Search Console
- [ ] Agregar dominio en Bing Webmaster Tools
- [ ] Agregar Schema.org markup (Organization, BreadcrumbList, FAQPage)
- [ ] Configurar Google Analytics 4 (GA4) — instalar `gtag` en `layout.tsx`
- [ ] Configurar Google Tag Manager (opcional pero recomendado)
- [ ] Crear Google Business Profile (Google My Business) para FL
- [ ] Verificar que canonical URLs están bien (cada página apunta a su URL canónica)
- [ ] Verificar que no hay duplicate content entre EN y ES (usar `hreflang` tags si planeas indexar ambos)

---

## 🟡 ANALÍTICA Y TRACKING (importante para optimización)

- [ ] Activar Vercel Web Analytics (free tier suficiente al inicio)
- [ ] Configurar Vercel Speed Insights
- [ ] Configurar Google Analytics 4 con conversion tracking de:
  - [ ] Submit del formulario waitlist
  - [ ] Inicio del checkout
  - [ ] Pago exitoso
  - [ ] Click en ciertos CTAs
- [ ] Configurar Meta Pixel (para futuro retargeting de ads de Meta)
- [ ] Configurar Google Ads Conversion Tag (para tracking de campañas)
- [ ] Documentar lista completa de eventos a trackear (event taxonomy)

---

## 🟢 MARKETING PRE-LANZAMIENTO (ver `PLAN_MARKETING_MBF.md` para detalle)

- [ ] Reclutar SEO writer en español latino (postear LinkedIn + Upwork)
- [ ] Construir landing `/espera` para waitlist con formulario funcional
- [ ] Configurar drip campaign de 6 emails en Resend (o ConvertKit si Resend no escala)
- [ ] Producir guía PDF de 45 páginas como lead magnet
- [ ] Grabar Video 1 YouTube (Pillar: "Cómo abrir un LLC en Florida 2026")
- [ ] Crear canal YouTube "MyBusinessFormation"
- [ ] Crear cuenta Instagram negocio
- [ ] Crear cuenta TikTok negocio
- [ ] Crear cuenta LinkedIn empresa
- [ ] Configurar herramienta de scheduling de posts (Buffer free tier)
- [ ] Diseñar templates visuales en Canva (posts, stories, reels)

---

## 🟢 PRUEBAS FINALES (opcional pero recomendado)

- [ ] Pruebas con 10 clientes simulados (amigos/familia) — flujo completo de orden a entrega
- [ ] Pruebas de UX en mobile (iPhone, Android — varios tamaños de pantalla)
- [ ] Pruebas de UX en navegadores (Chrome, Safari, Firefox, Edge)
- [ ] Pruebas de carga del sitio en 3G simulado (Chrome DevTools)
- [ ] Pruebas de performance: Lighthouse score > 90 en Performance, Accessibility, SEO
- [ ] Test de carga de tráfico (k6 o Artillery — simular 100 usuarios concurrentes)
- [ ] Test de formulario en móvil con teclado nativo (que no oculte campos)
- [ ] Test de portal cliente desde dispositivo del cliente (no solo desktop dev)

---

## 🔴 OPERACIONES (crítica antes de tener clientes reales)

- [ ] Definir quién atiende soporte primer mes (Ethan + Fabián)
- [ ] Definir SLA de respuesta a soporte: <24h en email, <4h crítico
- [ ] Configurar email `support@opabiz.com` con autoresponder
- [ ] Crear plantillas de respuesta para preguntas frecuentes (saved replies en Gmail)
- [ ] Documentar el proceso operativo paso a paso para cada estado de orden (admin manual)
- [ ] Crear documento "Cómo procesar una orden de A a Z" para training (si contratas asistente luego)
- [ ] Definir horarios de atención (vs 24/7 imposible)
- [ ] Configurar WhatsApp Business número con saludo automático fuera de horario

---

## 🟡 FINANZAS Y CONTABILIDAD

- [ ] Cuenta bancaria del negocio abierta y conectada a Stripe
- [ ] Software de contabilidad: QuickBooks, Wave (free), o similar
- [ ] Plan para emitir invoices/recibos a clientes (Stripe lo hace automático)
- [ ] Definir frecuencia de payouts de Stripe (default semanal o cambiar a diario)
- [ ] Reservar fondos para impuestos federales (~25-30% de revenue)
- [ ] Reservar fondos para state filing fees ($125 LLC FL — pasa directo al estado, no margen)
- [ ] Documentar todos los gastos del negocio (Vercel, Railway, Supabase, ads, freelancers)

---

## ⏰ T-1 SEMANA antes de lanzar (checklist final)

- [ ] Todo arriba marcado al 90%+ en críticos
- [ ] Backup completo de DB hecho hoy
- [ ] Test E2E final: orden de prueba con tarjeta real $1, refund inmediato
- [ ] Verificar que Vercel + Railway + Supabase están en planes adecuados (no en risk de hit limit)
- [ ] Verificar Resend domain verified
- [ ] Verificar dominio apuntando bien y SSL OK
- [ ] Verificar que panel admin funciona en producción
- [ ] Verificar que portal cliente funciona en producción
- [ ] Notificar a waitlist con email "1 semana para el lanzamiento"
- [ ] Preparar post de lanzamiento en redes sociales
- [ ] Preparar email de "ya estamos vivos" para waitlist (con código early-bird)
- [ ] Calendar bloqueado para 48h post-launch para responder soporte

---

## ⏰ DÍA DEL LANZAMIENTO (15 sept 2026)

- [ ] 8 AM EST — verificación final: sitio carga, webhooks responden, panel funcional
- [ ] 9 AM EST — enviar email a waitlist con acceso anticipado + código WAITLIST30
- [ ] 12 PM EST — publicar en Instagram, TikTok, Facebook, LinkedIn
- [ ] 3 PM EST — abrir oficialmente al público (publicar URL en redes)
- [ ] Resto del día — monitorear panel de admin + Sentry + BetterStack en vivo
- [ ] Tener Etan + Fabián disponibles 12+ horas para soporte e incidentes

---

## ⏰ T+1 SEMANA post-lanzamiento

- [ ] Análisis: cuántas ventas, AOV, conversion rate, CPA
- [ ] Análisis: qué creatividad de ads funcionó mejor
- [ ] Análisis: qué keywords de SEO trajeron tráfico (Search Console)
- [ ] Recolectar feedback de primeros 10-20 clientes
- [ ] Documentar en `security/` cualquier incidente y cómo se resolvió
- [ ] Calibrar alertas (silenciar las ruidosas, agregar las que faltaron)

---

**TOTAL ITEMS DEL CHECKLIST:** ~210 items
**ITEMS CRÍTICOS (🔴):** ~70 items
**ITEMS IMPORTANTES (🟡):** ~90 items
**ITEMS OPCIONALES (🟢):** ~50 items

**REGLA DE LANZAMIENTO:** No lances hasta tener 100% de los 🔴 + 90% de los 🟡 marcados.
