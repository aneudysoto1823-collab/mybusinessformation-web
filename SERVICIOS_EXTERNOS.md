# SERVICIOS EXTERNOS — MyBusinessFormation.com

**Última actualización:** 20 abril 2026
**Propósito:** Inventario completo de TODOS los servicios externos que usa o usará el proyecto. Para cada uno: qué hace, plan actual, si necesita upgrade al lanzamiento, costo mensual estimado.

> **Cómo leer esta tabla:** Cada servicio tiene un estado: 🟢 ACTIVO (ya en uso) · 🟡 PENDIENTE (planeado pre-launch) · 🔵 FUTURO (post-launch o nice-to-have).

---

## 1. RESUMEN DE COSTOS

### HOY (abril 2026, pre-launch)

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| Vercel | Hobby (free) | $0 |
| Railway | Hobby ($5 crédito) | $5 |
| Supabase | Free tier | $0 |
| Resend | Free tier | $0 |
| GitHub | Free | $0 |
| Stripe | Pay-per-transaction | $0 fijo |
| Dominio (mybusinessformation.com) | Anual | ~$1.20/mes ($12-15/año amortizado) |
| **TOTAL HOY** | | **~$6.20/mes** |

### LANZAMIENTO (septiembre 2026)

| Servicio | Plan recomendado | Costo/mes |
|----------|------------------|-----------|
| Vercel | Pro (probable) | $20 |
| Railway | Pro o Hobby+ | $20 |
| Supabase | Pro | $25 |
| Resend | Pro | $20 |
| Stripe | Pay-per-transaction | ~3% revenue (~$50-100 si ventas $2-3K) |
| Cloudflare | Free | $0 |
| Sentry | Free pre-launch, Team post-launch | $0 → $26 |
| BetterStack | Free pre-launch, Pro post-launch | $0 → $29 |
| Google Workspace | Business Starter | $7/usuario (1-2 users) = $7-14 |
| Dominio | Anual | ~$1.20/mes |
| Google Ads | Variable | $1,500-2,000 en launch |
| Meta Ads | Variable | $1,200-1,500 en launch |
| **TOTAL FIJO LANZAMIENTO** | | **~$200/mes (sin ads)** |
| **TOTAL CON ADS** | | **~$3,000-3,500/mes** |

### ESCALADO (mid-2027, post-tracción)

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| Vercel | Pro o Enterprise | $20-150 |
| Railway | Pro escalado | $50-200 |
| Supabase | Pro o Team | $25-599 |
| Resend | Scale | $90-200 |
| Sentry | Team o Business | $26-80 |
| BetterStack | Pro o Business | $29-199 |
| Google Workspace | Business | $14-30 |
| Cloudflare | Pro | $20 |
| Twilio (SMS/WhatsApp) | Pay-per-msg | $50-200 |
| Ads (Google + Meta + TikTok) | Variable | $5K-20K |
| **TOTAL ESCALADO (sin ads)** | | **$300-1,500/mes** |

---

## 2. INFRAESTRUCTURA — Hosting y plataforma

### 🟢 Vercel — Frontend Hosting

- **Qué hace:** Hosting del proyecto Next.js. Hace deploy automático cada `git push`. CDN global, SSL automático, edge functions, preview URLs por PR.
- **URL actual:** https://mybusinessformation-web.vercel.app/
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

### 🟢 Railway — Backend Express Hosting

- **Qué hace:** Hosting del servidor Express (`backend/server.ts`) que expone APIs REST consumidas por el frontend Next.js para operaciones críticas (orders, notifications, documents).
- **URL actual:** https://mybusinessformation-web-production.up.railway.app/
- **Plan actual:** Hobby ($5/mes con $5 de crédito de uso)
- **Free tier incluye:** $5 de crédito mensual de uso (suele cubrir un servicio Express ligero)
- **Plan recomendado al lanzamiento:** **Pro $20/mes** porque:
  - Hobby tiene límite estricto de usage que se puede cruzar con tráfico real
  - Pro incluye múltiples ambientes (staging + prod separados)
  - Mejor garantía de uptime
  - Soporte priority
- **Verificar precio en:** https://railway.com/pricing
- **Alternativa futura:** Render ($7-19/mes), Fly.io (free tier generoso), o consolidar todo en Vercel Functions si Edge Runtime soporta lo que hace Express.

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

- **Qué hace:** Envía los 4 emails automáticos del sistema (confirmación, nombres tomados, alerta admin, certificate). API moderna y limpia, mucho mejor que SendGrid o Mailgun para developers.
- **Plan actual:** Free tier
- **Sender actual:** `onboarding@resend.dev` (subdominio temporal de Resend)
- **Free tier incluye:** 3,000 emails/mes, 100 emails/día, dominio NO verificado (deliverability mediocre)
- **Plan recomendado al lanzamiento:** **Pro $20/mes** porque:
  - 50,000 emails/mes (suficiente para waitlist nurture + transaccionales)
  - **Dominio custom verificado** (`noreply@mybusinessformation.com`) — mejora deliverability del ~60% al ~95%+
  - Dedicated IP opcional (no necesario al inicio)
  - Retención de logs 30 días
  - Audiences (drip campaigns nativas)
  - Webhooks para tracking de bounces/complaints
- **Verificar precio en:** https://resend.com/pricing
- **Acción crítica antes de lanzamiento:** Verificar dominio `mybusinessformation.com` en Resend (DNS SPF + DKIM + DMARC). Sin esto, los emails siguen yendo a spam.

---

### 🔵 Google Workspace — Email de negocio

- **Qué hace:** Email profesional `support@mybusinessformation.com`, `info@`, `legal@`, etc. Calendar, Drive, Meet bundled.
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

### 🟡 Sunbiz / Florida Division of Corporations — Base de nombres

- **Qué hace:** Florida Division of Corporations publica trimestralmente un dump completo (~3.5M records) de todas las empresas registradas. Lo usamos para verificar disponibilidad de nombres en tiempo real.
- **Estado:** Pendiente Etapa 5
- **Plan:** **Gratis** — descarga FTP pública (no API oficial)
- **Costo:** $0 (solo costo en storage Supabase para los 3.5M registros — caben en Pro $25)
- **Acción al lanzamiento:** Solicitar credenciales FTP a Sunbiz, montar pipeline de descarga + import + actualización.

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

### 🟢 mybusinessformation.com — Dominio principal

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
| **HOY (pre-launch)** | Railway $5 + dominio $1.20 | **~$6.20/mes** | $0 |
| **Mes -1 (preparación lanzamiento)** | + Supabase Pro $25 + Resend Pro $20 + Vercel Pro $20 | **~$71/mes** | $0 |
| **Lanzamiento (sept 2026)** | + Sentry Team $26 + BetterStack Pro $29 + Google Workspace $14 | **~$140/mes** | + Stripe ~$50 + Ads ~$3,000 |
| **Mes +3 (estabilizado)** | + Cloudflare Pro $20 (opcional) | **~$160/mes** | + Stripe ~$200 + Ads escalados |
| **Mid-2027 (escala)** | Upgrades a Sentry Business, BetterStack Business, Supabase Team | **$300-1,500/mes** | + Stripe % de revenue + Ads $5K-20K |

---

## 15. CHECKLIST DE ACCIONES PARA UPGRADE PRE-LANZAMIENTO

> Marcar conforme se ejecuta cada upgrade.

- [ ] **Supabase Pro** activado (1 click en dashboard, $25/mes prorrateado)
- [ ] **Resend Pro** activado + dominio `mybusinessformation.com` verificado (DNS propagación ~24h)
- [ ] **Vercel Pro** activado y dominio `mybusinessformation.com` apuntado
- [ ] **Railway Pro** activado (decisión: si Hobby aguanta primer mes, posponer)
- [ ] **Stripe** cuenta activada + verificación de identidad completa + cuenta bancaria conectada
- [ ] **Cloudflare Free** activado, DNS movido a Cloudflare, Bot Fight Mode ON
- [ ] **Google Analytics 4** instalado y conversion tracking configurado
- [ ] **Google Search Console** y Bing Webmaster Tools activados
- [ ] **Sentry Free** activado (Next.js + Express)
- [ ] **BetterStack Free** activado con 10 monitores
- [ ] **Google Business Profile** creado y verificado
- [ ] **Dominio renovado** por 3-5 años con privacy ON

---

**Fin del documento.**

> Cualquier servicio nuevo que se agregue al stack en el futuro debe documentarse en este archivo para mantener visibilidad de costos y compliance.
