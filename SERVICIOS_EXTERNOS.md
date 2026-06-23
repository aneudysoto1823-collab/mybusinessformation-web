# SERVICIOS EXTERNOS — OpaBiz (opabiz.com)

**Última actualización:** 22 junio 2026 _(por Javier — actualizó tabla de costos, removió Railway de costos al lanzamiento, agregó Turso + Cloudflare R2 + GitHub Actions a la sección de infraestructura)_
**Propósito:** Inventario completo de TODOS los servicios externos que usa o usará el proyecto. Para cada uno: qué hace, plan actual, si necesita upgrade al lanzamiento, costo mensual estimado.

> **Cómo leer esta tabla:** Cada servicio tiene un estado: 🟢 ACTIVO (ya en uso) · 🟡 PENDIENTE (planeado pre-launch) · 🔵 FUTURO (post-launch o nice-to-have).

---

## 1. RESUMEN DE COSTOS

### HOY (junio 2026, pre-launch)

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| Vercel | Pro (ya pagado) | $20 |
| Supabase | Free tier | $0 |
| Turso | Hobby (Free) | $0 |
| Cloudflare R2 | Pay-as-you-go (bajo 10 GB) | ~$0 |
| GitHub Actions | Free (bajo 2000 min/mes) | $0 |
| Resend | Free tier | $0 |
| Zoho Mail | 6 buzones plan free | $0 |
| GitHub | Free | $0 |
| Stripe | Pay-per-transaction | $0 fijo |
| Sentry | Free tier (5K eventos/mes) | $0 |
| BetterStack | Free tier (10 monitores) | $0 |
| ~~Railway~~ | **A CANCELAR (decisión 2026-06-22)** | ~~$5~~ |
| Dominio (opabiz.com) | Anual | ~$1.20/mes ($12-15/año amortizado) |
| **TOTAL HOY** | | **~$21/mes** |

### LANZAMIENTO (septiembre 2026)

| Servicio | Plan recomendado | Costo/mes |
|----------|------------------|-----------|
| Vercel | Pro (ya pagado) | $20 |
| Supabase | **Free (no upgrade)** — backups en GitHub Actions+R2 | $0 |
| Turso | Hobby (Free) — 9 GB suficiente para 3.5M Sunbiz | $0 |
| Cloudflare R2 | Pay-as-you-go (bajo 10 GB) | ~$0 |
| GitHub Actions | Free (2000 min/mes) | $0 |
| Resend | Pro (50K emails/mes) | $20 |
| Zoho Mail | 6 buzones plan free | $0 |
| Stripe | Pay-per-transaction | ~3% revenue (~$50-100 si ventas $2-3K) |
| Cloudflare (DNS+WAF) | Free | $0 |
| Sentry | Free → Team post-launch si se cruza el límite | $0 → $26 |
| BetterStack | Free → Pro post-launch | $0 → $29 |
| Google Workspace | Business Starter (opcional, hoy Zoho cubre) | $0 → $7 |
| Dominio | Anual | ~$1.20/mes |
| Google Ads | Variable | $1,500-2,000 en launch |
| Meta Ads | Variable | $1,200-1,500 en launch |
| **TOTAL FIJO LANZAMIENTO** | | **~$45/mes (sin ads)** |
| **TOTAL CON ADS** | | **~$3,000-3,500/mes** |

> _Actualizado por Javier el 2026-06-22_ — la nueva arquitectura distribuida (Turso + R2 + GitHub Actions) ahorra **$30/mes** vs el plan original (Supabase Pro $25 + Railway $5). Total fijo bajó de ~$200 a ~$45 al lanzamiento.

### ESCALADO (mid-2027, post-tracción)

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| Vercel | Pro o Enterprise | $20-150 |
| Supabase | Free → Pro si se cruza el límite | $0-25 |
| Turso | Hobby → Scale si crece mucho | $0-29 |
| Cloudflare R2 | Pay-as-you-go | $0-5 |
| Resend | Scale | $90-200 |
| Sentry | Team o Business | $26-80 |
| BetterStack | Pro o Business | $29-199 |
| Google Workspace o Zoho Pro | Plan adecuado | $14-30 |
| Cloudflare (DNS+WAF) | Pro | $20 |
| Twilio (SMS/WhatsApp) | Pay-per-msg | $50-200 |
| Ads (Google + Meta + TikTok) | Variable | $5K-20K |
| **TOTAL ESCALADO (sin ads)** | | **$250-950/mes** |

---

## 2. INFRAESTRUCTURA — Hosting y plataforma

### 🟢 Vercel — Frontend Hosting

- **Qué hace:** Hosting del proyecto Next.js. Hace deploy automático cada `git push`. CDN global, SSL automático, edge functions, preview URLs por PR.
- **URL actual:** https://opabiz.com/
- **Plan actual:** Hobby (free)
- **Free tier incluye:** 100GB bandwidth/mes, 6,000 build minutes/mes, 100 horas serverless function execution, sin commercial use license oficial (zona gris para uso negocio).
- **Plan recomendado al lanzamiento:** **Pro $20/mes** porque:
  - Hobby NO permite uso comercial según TOS
  - Pro incluye Vercel Web Analytics avanzado (RUM, Web Vitals reales)
  - 1TB bandwidth incluido
  - Removal del banner "Powered by Vercel"
  - Más build minutes
  - Acceso a Edge Config y otras features avanzadas
- **Verificar precio en:** https://vercel.com/pricing
- **Estado de migración futura:** Bajo riesgo. Vercel es estable, podríamos migrar a Cloudflare Pages o Netlify si pricing se vuelve abusivo, pero sin urgencia.

---

### 🔴 Railway — A CANCELAR (decisión 2026-06-22)

- **Estado:** Sin uso real desde 2026-05-13 (Opción B: Express dormido). La idea era despertarlo para Etapa 5 (Sunbiz) pero la nueva arquitectura usa Vercel Cron + Turso, eliminando la necesidad de Railway.
- **Acción:** Cancelar plan después de Fase 5 (cuando todo esté migrado y verificado). Ahorro: $5/mes.
- **Limpieza:** eliminar `railway.json`, `BACKEND_URL` env var, y código residual de `backend/modules/`.
- **URL legacy (no usar):** ~~https://mybusinessformation-web-production.up.railway.app/~~

> _Actualizado por Javier el 2026-06-22_ — sección bajada de 🟢 activo a 🔴 cancelar. Vercel Cron Pro (incluido en lo que ya pagamos) cubre el cron nocturno de Sunbiz que era la única razón para mantener Railway vivo.

---

### 🟢 Supabase — Base de Datos PostgreSQL + Storage

- **Qué hace:** Hosting de PostgreSQL (modelo `Order` y futura tabla `sunbiz_corps`), Storage para PDFs (Certificate of Formation, Operating Agreement), Auth (no usado actualmente — usamos JWT propio).
- **Pooler:** aws-1-us-east-1 puerto 6543 (pgBouncer transactional)
- **Plan actual:** Free tier
- **Free tier incluye:** 500MB DB, 1GB Storage, 5GB egress, 50K MAU auth, 2 free projects, **NO backups automáticos diarios** (solo manuales)
- **Plan recomendado al lanzamiento:** **Pro $25/mes** porque:
  - **Backups diarios automáticos con retención 7 días** (CRÍTICO para datos de pago)
  - **Point-in-time recovery** (restaurar a cualquier minuto de los últimos 7 días)
  - 8GB DB, 100GB Storage, 250GB egress
  - Custom domain support
  - SLA mejorado
  - Branch databases (entornos staging/preview)
- **Verificar precio en:** https://supabase.com/pricing
- **Estado crítico:** **Upgrade a Pro es OBLIGATORIO antes del lanzamiento.** Sin backups diarios automáticos, un fallo de DB = pérdida de órdenes y datos de cliente.

---

### 🟢 GitHub — Control de versiones

- **Qué hace:** Repositorio de código `aneudysoto1823-collab/mybusinessformation-web`. CI/CD trigger para Vercel (cada push deploya).
- **Plan actual:** Free (repo público)
- **Free tier incluye:** Repos ilimitados públicos y privados, GitHub Actions 2,000 min/mes (suficiente para CI básico)
- **Plan recomendado al lanzamiento:** **Free sigue alcanzando.** Considerar Team ($4/usuario/mes) si:
  - Necesitas branch protection rules avanzadas
  - Quieres environments con required reviewers
  - Quieres SAML SSO
- **Decision actual:** **MANTENER FREE** hasta que el equipo crezca a 3+ devs.

---

## 3. PAGOS

### 🟡 Stripe — Procesamiento de pagos (PENDIENTE Etapa 4)

- **Qué hace:** Cobro con tarjeta de crédito/débito de los clientes. Webhooks notifican al backend cuando un pago se confirma. Stripe Elements provee UI segura PCI-compliant en el checkout.
- **Plan actual:** **No activado todavía.** Package `stripe@20.4.1` ya instalado en `package.json` pero sin keys configuradas.
- **Modelo de pricing:** Pay-per-transaction
  - **2.9% + $0.30 USD por transacción** (tarjetas USA)
  - **3.9% + $0.30 USD** (tarjetas internacionales)
  - **0.5%** (Stripe Tax si lo activas)
  - **0.4%** (Radar fraud protection — generalmente activo de serie)
- **Sin costo mensual fijo** — solo paga por uso
- **Plan recomendado al lanzamiento:** **Standard pricing.** No hay "Pro" obligatorio. Volume discounts arriba de $80K/mes en revenue.
- **Verificar pricing en:** https://stripe.com/pricing
- **Costo estimado primer mes lanzamiento:** ~$50-100 (asumiendo $2-3K en ventas)
- **Setup time:** 1-2 días si la verificación de identidad demora.

---

## 4. EMAILS Y COMUNICACIÓN

### 🟢 Resend — Emails transaccionales

- **Qué hace:** Envía los **12 emails automáticos del sistema** (A0–A7 órdenes/alertas, B1 marketing, C1+C2 NBL Stripe, D1+D2 contact form). Para detalle ver `LOGICA_DE_NEGOCIO/02_emails_automaticos.md`.
- **Plan actual:** **Free tier** — 3,000 emails/mes, 100 emails/día.
- **Cuenta:** ✅ **migrada a la cuenta de OpaBiz** (2026-06-19, antes estaba en aneudysoto@gmail.com personal).
- **Dominio:** ✅ **`opabiz.com` verificado en Resend** (SPF + DKIM + DMARC OK). Salimos del modo sandbox — los emails llegan a cualquier destinatario.
- **Senders activos:**
  - `noreply@opabiz.com` — transaccional (confirmación, certificate, etc.)
  - `marketing@opabiz.com` — campañas (separado para que un spam complaint en marketing no afecte la reputación de transaccional)
  - `support@opabiz.com` — emails que requieren respuesta del cliente (A2 nombres tomados, A4 sugerencias)
- **Buzones de recepción (Zoho):**
  - `info@opabiz.com` — Reply-To de todos + TO del form de contacto
  - `alert@opabiz.com` — alertas internas unificadas (A0 nueva orden, A3 nombres tomados, C2 NBL Stripe)
- **Plan recomendado al escalar:** **Pro $20/mes**:
  - 50,000 emails/mes (suficiente para waitlist nurture + transaccionales)
  - Sin límite diario
  - Dedicated IP opcional
  - Retención de logs 30 días (Free es 1 día)
  - Audiences (drip campaigns nativas)
  - Webhooks para tracking de bounces/complaints
- **Cuándo migrar a Pro:** cuando se acerque a 100 emails/día o se necesiten Audiences.
- **Verificar precio en:** https://resend.com/pricing

---

### 🔵 Google Workspace — Email de negocio

- **Qué hace:** Email profesional `support@opabiz.com`, `info@`, `legal@`, etc. Calendar, Drive, Meet bundled.
- **Estado:** No activado, recomendado pre-launch.
- **Plan recomendado:** **Business Starter $7/usuario/mes** (Ethan + Fabián = $14/mes)
- **Verificar precio en:** https://workspace.google.com/pricing.html
- **Alternativa más barata:** Zoho Mail Free (5 usuarios, 5GB cada uno, gratis). Calidad inferior a Google pero funcional.
- **Recomendación:** Empezar con Zoho Free, migrar a Google Workspace cuando tengas el ingreso para justificarlo.

---

### 🔵 Twilio — SMS y WhatsApp Business API

- **Qué hace:** Envío de SMS para alertas críticas + WhatsApp Business API para soporte y notificaciones.
- **Estado:** No activado. Recomendado post-launch (mes +1 a +3).
- **Plan:** Pay-per-message
  - SMS USA: $0.0079 por mensaje
  - WhatsApp: $0.005-0.05 por conversación (depende de país y tipo)
  - Phone number (rentado): $1.15/mes
- **Costo estimado mes:** $50-200 (asumiendo 1,000-3,000 SMS/conversaciones/mes)
- **Verificar precio en:** https://www.twilio.com/pricing
- **Alternativa:** MessageBird, Plivo (suelen ser ligeramente más baratos pero menos features).
- **Decisión:** No activar pre-launch. Email es suficiente.

---

## 5. SEGURIDAD

### 🟡 Cloudflare — CDN, WAF, Bot protection

- **Qué hace:** Sirve como capa de protección antes de Vercel. Bloquea ataques DDoS, bots maliciosos, requests sospechosas. Tambien acelera con CDN y proporciona SSL adicional.
- **Estado:** Pendiente activar (Etapa 10)
- **Plan recomendado pre-launch:** **Free** (es muy generoso — incluye DDoS protection, basic WAF, SSL, Bot Fight Mode)
- **Plan post-tracción:** **Pro $20/mes** si necesitas:
  - Image Optimization
  - Mobile Optimization
  - WAF avanzado con custom rules
  - Polish (compresión imágenes)
  - Cloudflare Analytics
- **Verificar precio en:** https://www.cloudflare.com/plans/
- **Acción al lanzamiento:** Activar Free tier, mover DNS a Cloudflare, activar Bot Fight Mode + Always Use HTTPS.

---

### 🔵 Cloudflare Turnstile — CAPTCHA

- **Qué hace:** CAPTCHA invisible para proteger formularios contra bots. Alternativa moderna y gratis a reCAPTCHA.
- **Estado:** Pendiente activar
- **Plan:** **Free siempre** — sin límites
- **Verificar en:** https://www.cloudflare.com/products/turnstile/
- **Donde implementar:** Formulario de orden (`/`), formulario de waitlist (`/espera`), login admin (`/login`), login cliente (`/client-portal`).

---

### 🟡 Sentry — Error tracking y APM

- **Qué hace:** Captura todos los errores y excepciones del frontend Next.js + backend Express. Muestra stack traces con source maps. Permite agrupamiento inteligente y alertas.
- **Estado:** Pendiente activar (ver `PROPUESTA_MONITOREO.md`)
- **Plan recomendado pre-launch:** **Developer Free** (5K errores/mes, retención 30 días)
- **Plan post-launch:** **Team $26/mes** (50K errores/mes, retención 90 días)
- **Verificar precio en:** https://sentry.io/pricing/
- **Setup time:** 30 min con CLI wizard.

---

### 🟡 BetterStack — Uptime monitoring + Logs

- **Qué hace:** Monitorea URLs públicas cada X minutos. Detecta caídas de sitio, lentitud, SSL expiration, DNS issues. Maneja logs de Vercel/Railway/Supabase. Provee status page público.
- **Estado:** Pendiente activar (ver `PROPUESTA_MONITOREO.md`)
- **Plan recomendado pre-launch:** **Free** (10 monitores, check cada 3 min, status page básico)
- **Plan post-launch:** **Team $29/mes** (50 monitores, check cada 30 seg, on-call rotation, status page custom)
- **Verificar precio en:** https://betterstack.com/pricing

---

## 6. DATOS EXTERNOS

### 🟢 Sunbiz / Florida Division of Corporations — Base de nombres

- **Qué hace:** Florida Division of Corporations publica un dump trimestral completo (~3.5M records) + un daily file (~1,500 empresas/día) de todas las empresas registradas. Lo usamos para verificar disponibilidad de nombres.
- **Estado:** Plan de integración definido — Etapa 5 (ver `LOGICA_DE_NEGOCIO/26_arquitectura_sunbiz_backups.md`).
- **Acceso:** **PÚBLICO sin necesidad de solicitar credenciales** (descubrimiento 2026-06-22). Credenciales hardcoded en `sftp.floridados.gov` con usuario `Public`. Ya está siendo usado en el proyecto hermano `datallc` desde mayo 2026.
- **Costo:** **$0** — el SFTP es público y gratis.
- **Storage de los 3.5M:** ya NO se usa Supabase (decisión 2026-06-22). Va a **Turso (Free 9 GB)** — ver entrada de Turso abajo.
- **Acción al lanzamiento:** ejecutar el plan de Fase 1-3 del doc 26 (carga inicial + cron nocturno + migrar Path B/C).

---

### 🟢 Turso — Base de datos para Sunbiz (3.5M empresas)

- **Qué hace:** SQLite distribuido (réplicas globales) que guarda los 3.5M de empresas de Florida + las que se crean cada día. Se consulta desde Vercel para verificar disponibilidad de nombres con búsqueda fuzzy (FTS5 nativo de SQLite).
- **Estado:** Cuenta pendiente de crear por el founder (2026-06-22).
- **Plan:** **Hobby (Free)** — 9 GB storage, 500M reads/mes, 10M writes/mes. Más que suficiente para los 3.5M + crecimiento de ~500K registros/año.
- **Costo:** **$0/mes**.
- **Plan recomendado si crecemos:** Scale $29/mes (24 GB). No será necesario en 5+ años.
- **Verificar precio en:** https://turso.tech/pricing
- **Por qué Turso y no Supabase Pro o Cloudflare D1:** 9 GB free vs Supabase Free 500 MB (no alcanza) o D1 5 GB free. Driver `@libsql/client` para Node.js es más natural desde Vercel serverless que el driver D1 (diseñado para Workers).
- **Variables de entorno requeridas:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (en Vercel).
- **Doc:** ver `LOGICA_DE_NEGOCIO/26_arquitectura_sunbiz_backups.md` para arquitectura completa.

---

### 🟢 Cloudflare R2 — Backups del negocio

- **Qué hace:** Object storage S3-compatible donde se guardan backups diarios automáticos de Supabase (pg_dump + PDFs del Certificate of Formation). Retención 30 días.
- **Estado:** Cuenta pendiente de crear por el founder (2026-06-22).
- **Plan:** **Pay-as-you-go** — 10 GB free permanente. Después $0.015/GB/mes.
- **Costo estimado:** **$0/mes** mientras estemos bajo 10 GB. Para nuestro tamaño (~3-5 GB de dumps + PDFs en 30 días de retención) estaremos siempre dentro del free tier.
- **Por qué R2 y no AWS S3:** Cloudflare R2 **NO cobra egress** (transferencia de salida). AWS S3 cobra ~$0.09/GB egress que puede ser caro si necesitamos restaurar el backup completo. R2 también tiene 10 GB free permanente vs S3 que solo da 5 GB free el primer año.
- **Verificar precio en:** https://developers.cloudflare.com/r2/pricing/
- **Variables de entorno requeridas (en GitHub Actions Secrets, no en Vercel):** `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ENDPOINT`.
- **Quién dispara los backups:** **GitHub Actions** (cron diario, gratis con los 2000 min/mes del free tier).
- **Doc:** ver `LOGICA_DE_NEGOCIO/26_arquitectura_sunbiz_backups.md`.

---

### 🟢 GitHub Actions — Cron de backups

- **Qué hace:** Workflow `.github/workflows/backup-daily.yml` que cada noche a las 12:30am:
  1. Hace `pg_dump` de Supabase
  2. Descarga todos los PDFs de Supabase Storage
  3. Sube todo a Cloudflare R2 con timestamp YYYY-MM-DD
  4. Borra dumps de hace más de 30 días
- **Estado:** Pendiente implementar (Fase 4 del doc 26).
- **Plan:** Free tier de GitHub — 2,000 minutos/mes para repos privados.
- **Costo:** **$0** — un backup tarda ~5 min/día = 150 min/mes, muy por debajo del límite.
- **Por qué GitHub Actions y no Vercel Cron:** los backups pueden tardar más de 5 min (límite de Vercel Pro). GitHub Actions no tiene ese límite.

---

### 🔵 IRS / FinCEN — Filings federales

- **Qué hace:** Para BOI Filing (FinCEN) y EIN application (IRS). Algunos formularios se presentan online directamente, otros por fax/correo.
- **Estado:** Manual (admin lo hace fuera del sistema). No requiere integración API en MVP.
- **Plan:** **Gratis** — son agencias federales. APIs de IRS son limitadas y burocráticas.
- **Acción futura post-launch:** Evaluar si vale la pena integrar la API de FinCEN para BOI Filings automatizados (no priority).

---

## 7. ALMACENAMIENTO DE ARCHIVOS

### 🟢 Supabase Storage — PDFs de documentos

- **Qué hace:** Almacena los PDFs de Certificate of Formation, Operating Agreement, EIN Letter, etc. Provee signed URLs temporales para descarga segura por el cliente.
- **Plan actual:** Free tier (1GB)
- **Plan recomendado al lanzamiento:** **Pro $25/mes** (incluido en upgrade general de Supabase, +100GB Storage)
- **Costo separado:** $0 (parte del plan Supabase Pro)

### 🔵 AWS S3 — Almacenamiento alternativo (futuro post-launch)

- **Qué hace:** Originalmente mencionado en Etapa 6 como alternativa para PDFs. Hoy usamos Supabase Storage que es suficiente.
- **Estado:** **NO necesario.** Supabase Storage cubre la necesidad.
- **Plan si llegáramos a usarlo:** S3 Standard ~$0.023/GB/mes + transfer + requests = típicamente $5-30/mes para nuestro volumen.
- **Recomendación:** Mantener Supabase Storage. Solo migrar a S3 si tenemos >500GB de PDFs (años de operación).

---

## 8. ANALÍTICA Y MEDICIÓN

### 🟡 Google Analytics 4 (GA4) — Analítica web

- **Qué hace:** Tracking de visitas, sesiones, comportamiento de usuario, conversion funnels, source attribution.
- **Estado:** No activado, recomendado activar pre-launch
- **Plan:** **Free siempre** (hasta 10M eventos/mes — más que suficiente)
- **Setup time:** 1 hora (instalar gtag en `layout.tsx`, configurar conversiones)

### 🟡 Vercel Analytics + Speed Insights — Web Vitals

- **Qué hace:** Page views, top pages, top referrers, Core Web Vitals reales de usuarios.
- **Plan actual:** Free tier (incluido en Hobby) — limitado
- **Plan recomendado al lanzamiento:** Incluido en Vercel Pro ($20/mes ya considerado arriba)

### 🔵 Google Tag Manager — Container de tags

- **Qué hace:** Gestión centralizada de pixels de tracking (GA4, Meta Pixel, Google Ads, etc.) sin tocar código.
- **Estado:** Recomendado activar
- **Plan:** **Free**

### 🔵 Meta Pixel (Facebook Pixel) — Tracking para Meta Ads

- **Qué hace:** Captura visitas y conversiones para retargeting en Facebook/Instagram Ads.
- **Estado:** Activar cuando arranquen Meta Ads (semana -4 launch)
- **Plan:** **Free** (cobra Meta vía ads)

---

## 9. ADS Y MARKETING (post-launch o pre-launch tardío)

### 🔵 Google Ads — Search + Display

- **Qué hace:** Anuncios pagados en resultados de búsqueda de Google, YouTube, y red de display.
- **Estado:** Activación 4 semanas antes del launch (semana 18 agosto 2026)
- **Plan:** **Pay-per-click** — sin fee fijo de plataforma
- **Presupuesto inicial sugerido:** $500/semana en learning phase, escalar a $1,200/semana en launch
- **Estimado mes launch:** $1,500-2,000
- **Setup time:** 4-6 horas (cuenta, conversión tags, primeras campañas)

### 🔵 Meta Ads (Facebook + Instagram) — Social media ads

- **Qué hace:** Anuncios en Feed, Stories, Reels de Facebook + Instagram. Excelente para targeting demográfico (latinos en FL).
- **Estado:** Activación 4 semanas antes del launch
- **Plan:** **Pay-per-click/impression** — sin fee fijo
- **Presupuesto inicial sugerido:** $400/semana en learning, escalar a $900/semana
- **Estimado mes launch:** $1,200-1,500
- **Setup time:** 4-6 horas (Business Manager, Pixel, primeras creatividades)

### 🔵 TikTok Ads — Video ads (futuro)

- **Qué hace:** Anuncios en TikTok For You Page (FYP).
- **Estado:** Evaluar 3+ meses post-launch si TikTok orgánico funciona
- **Plan:** Pay-per-click/view
- **Setup:** Decisión post-launch.

### 🔵 LinkedIn Ads — Para persona contador (futuro)

- **Qué hace:** Anuncios B2B targeting CPAs/contadores en FL.
- **Estado:** Evaluar mes +3 post-launch
- **Plan:** Pay-per-click — generalmente caro ($5-15 CPC en B2B)
- **Setup:** Decisión post-tracción.

---

## 10. HERRAMIENTAS DE PRODUCTIVIDAD Y MARKETING

### 🔵 Canva Pro — Diseño visual

- **Qué hace:** Templates para posts sociales, infografías, banners, mockups, presentaciones.
- **Estado:** No activado, recomendado pre-launch
- **Plan:** **Pro $12.99/mes** o **Free** (alcanza para empezar)
- **Verificar en:** https://www.canva.com/pricing/

### 🔵 ConvertKit / Beehiiv — Email marketing avanzado (alternativa a Resend)

- **Qué hace:** Drip campaigns, segmentación, A/B testing de emails de marketing. Más enfocado en marketing que Resend (que es más transaccional).
- **Estado:** Evaluar si Resend Audiences cubre el use case primero
- **Plan ConvertKit:** Free hasta 10K subs, Pro $25/mes para 1K subs
- **Plan Beehiiv:** Free hasta 2.5K subs, Scale $42/mes
- **Recomendación:** Empezar con Resend Pro (ya pagamos), migrar solo si Audiences se queda corto.

### 🔵 Buffer / Hootsuite — Scheduling redes sociales

- **Qué hace:** Programar posts en IG, FB, LinkedIn, TikTok.
- **Estado:** Activar mes -3 (junio 2026)
- **Plan Buffer:** **Free** hasta 3 canales, Essentials $6/mes/canal
- **Recomendación:** Buffer Free al inicio.

### 🔵 Notion / Linear — Project management interno

- **Qué hace:** Manejo de tareas y roadmap interno (alternativa a Trello/Asana).
- **Estado:** Opcional. Hoy se maneja con `contexto` + `CHECKLIST_PRELANZAMIENTO.md`.
- **Plan Notion:** Free para uso individual, Plus $10/usuario/mes para teams
- **Plan Linear:** Free hasta 250 issues, Standard $8/usuario/mes
- **Recomendación:** Free hasta tener 3+ personas en el equipo.

---

## 11. LEGAL Y COMPLIANCE

### 🔵 Termly / iubenda — Generación de Terms y Privacy

- **Qué hace:** Genera Terms of Service y Privacy Policy con cumplimiento legal automático (CCPA, GDPR).
- **Estado:** Recomendado para validar legalidad de los actuales `/terms` y `/privacy`
- **Plan Termly:** Free básico, Pro $10-29/mes
- **Plan iubenda:** Pro €27/año (~$2.50/mes)
- **Alternativa:** Pagar abogado FL para revisión one-time ($300-500). Mejor garantía.

### 🔵 Trustpilot / Google Reviews — Reviews públicas

- **Qué hace:** Plataformas donde clientes dejan reviews públicas. Esencial para credibilidad.
- **Plan Trustpilot:** Free básico (limitado), Pro desde $250/mes (caro)
- **Plan Google Business Profile:** **FREE siempre** (lo más importante para SEO local)
- **Recomendación:** Activar Google Business Profile primero (gratis y crítico). Trustpilot opcional.

---

## 12. DOMINIO Y BRANDING

### 🟢 opabiz.com — Dominio principal

- **Qué hace:** Dominio público del proyecto.
- **Estado:** Comprado pero NO apuntado a Vercel todavía
- **Renovación:** ~$12-15/año en Namecheap, GoDaddy, Cloudflare Registrar
- **Recomendación:** Renovar por 3-5 años pre-launch para evitar olvidos. **CRÍTICO apuntar a Vercel antes del launch.**

### 🔵 Dominios secundarios y typo-protection

- **Qué hace:** Comprar dominios similares para evitar typosquatting (mybusinesformation.com, mybussinesformation.com, etc.) o variaciones (mybusinessformation.us, .net).
- **Estado:** Opcional, evaluar post-tracción
- **Costo:** ~$12/dominio/año
- **Recomendación:** Comprar solo `.us` y los 2-3 typos más probables (~$50/año total).

---

## 13. RESUMEN DE DECISIONES CRÍTICAS PRE-LANZAMIENTO

### Servicios que SÍ requieren upgrade pagado antes del launch (NO negociable)

1. **Supabase Pro $25/mes** — backups automáticos diarios (sin esto no podemos cobrar de forma responsable)
2. **Resend Pro $20/mes** — domain verification (sin esto los emails van a spam)
3. **Vercel Pro $20/mes** — uso comercial está prohibido en Hobby + necesitamos analytics avanzado
4. **Stripe** — sin costo fijo pero CRÍTICO completar verificación de identidad

### Servicios que pueden quedarse en Free al lanzar (upgrade después)

1. **Sentry Free** (5K errores cubre testing pre-launch + primer mes light)
2. **BetterStack Free** (10 monitores cubre URLs críticas)
3. **Cloudflare Free** (DDoS + WAF básico es generoso)
4. **GitHub Free** (sigue alcanzando con 2 devs)
5. **Google Analytics, Tag Manager, Meta Pixel** (siempre free)

### Servicios que NO necesitas el día del lanzamiento (post-tracción)

1. **Twilio** (SMS/WhatsApp) — no necesario hasta tener clientes que pidan ese canal
2. **AWS S3** — Supabase Storage alcanza
3. **Datadog / DataPipe** — overkill hasta 5K órdenes/mes
4. **TikTok Ads, LinkedIn Ads** — primero validar Google + Meta
5. **Google Workspace** — empezar con Zoho Free
6. **ConvertKit / Beehiiv** — Resend Pro Audiences alcanza al inicio
7. **Cloudflare Pro** — Free es suficiente
8. **Buffer Pro** — Free alcanza para 3 canales

---

## 14. COSTO TOTAL CONSOLIDADO POR FASE

| Fase | Servicios pagos | Costo mensual fijo | + Variable (ads, transactions) |
|------|-----------------|--------------------|--------------------------------| 
| **HOY (pre-launch, 2026-06-22)** | Vercel Pro $20 + dominio $1.20 | **~$21/mes** | $0 |
| **Lanzamiento (sept 2026)** | + Resend Pro $20 | **~$41/mes** | + Stripe ~$50 + Ads ~$3,000 |
| **Post-launch (si crece)** | + Sentry Team $26 + BetterStack Pro $29 | **~$96/mes** | + Stripe ~$200 + Ads escalados |
| **Mid-2027 (escala)** | + Supabase Pro $25 + Cloudflare Pro $20 + Turso Scale $29 si se necesita | **$170-400/mes** | + Stripe % revenue + Ads $5K-20K |

> _Actualizado por Javier el 2026-06-22_ — eliminadas líneas de Railway + Supabase Pro pre-launch. La nueva arquitectura mantiene costos al lanzamiento en **~$41/mes** (vs ~$140 del plan original). Los upgrades de Supabase/Cloudflare/Turso son condicionales si las métricas reales lo justifican.

---

## 15. CHECKLIST DE ACCIONES PARA UPGRADE PRE-LANZAMIENTO

> Marcar conforme se ejecuta cada upgrade.

- [x] **Vercel Pro** activado (ya pagado)
- [x] **Dominio `opabiz.com` verificado** en Resend (Free tier alcanza; upgrade a Pro $20/mes cuando se acerque a 100 emails/día o se necesiten Audiences).
- [x] **Turso Hobby (Free)** activado — database `opabiz-sunbiz-opabiz` (2026-06-22)
- [x] **Cloudflare R2** activado — bucket `opabiz-backups` (2026-06-22)
- [x] **Sentry Free** activado en Next.js (Etapa 15)
- [x] **BetterStack Free** activado con 3 monitores (Etapa 15)
- [ ] **Stripe LIVE** — verificación de identidad + cuenta bancaria + keys live
- [ ] **Resend Pro** activado ($20/mes) si proyecta superar 100 emails/día
- [ ] **Cloudflare Free** activado, DNS movido a Cloudflare, Bot Fight Mode ON (opcional pre-launch)
- [ ] **Google Analytics 4** instalado y conversion tracking configurado
- [ ] **Google Search Console** y Bing Webmaster Tools activados
- [ ] **Google Business Profile** creado y verificado
- [ ] **Dominio renovado** por 3-5 años con privacy ON
- [ ] ~~**Supabase Pro** activado~~ — **DESCARTADO** (backups en GitHub Actions + R2)
- [ ] ~~**Railway Pro** activado~~ — **CANCELAR** (decisión 2026-06-22)

---

**Fin del documento.**

> Cualquier servicio nuevo que se agregue al stack en el futuro debe documentarse en este archivo para mantener visibilidad de costos y compliance.
