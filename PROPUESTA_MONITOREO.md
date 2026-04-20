# PROPUESTA DE MONITOREO — MyBusinessFormation.com

**Fecha:** 20 abril 2026
**Autor:** Claude Opus 4.7 (arquitecto de observabilidad asistido)
**Stack analizado:** Vercel + Railway + Supabase + Stripe + Resend + Next.js 16
**Estado:** PROPUESTA · NO ejecutar hasta aprobación de Ethan

---

## 1. Resumen ejecutivo

### Recomendación HOY (MVP pre-lanzamiento, abril–septiembre 2026)

> **Sentry (free) + BetterStack (free) + Widget propio en `/admin`**
> **Costo: $0/mes**

Tres piezas que se complementan:
- **Sentry** captura crashes, exceptions y errores de la aplicación Next.js (lado servidor + cliente). 5,000 errores/mes gratis — más que suficiente pre-launch.
- **BetterStack Uptime** monitorea las URLs públicas críticas (home, /paquetes, /servicios, /api/health) cada 3 minutos. 10 monitores gratis.
- **Widget propio en `/admin`** consume las APIs de Sentry y BetterStack para mostrar un panel unificado tipo "estado del sistema" sin que tengas que abrir 3 herramientas.

Todo gratis hasta que pases ~5K errores/mes o ~10 monitores. Cubre el 80% del valor sin gastar.

### Recomendación FUTURO (post-lanzamiento, octubre 2026 en adelante)

> **Sentry Team ($26/mes) + BetterStack Pro ($29/mes) + Vercel Analytics Pro ($20/mes ya incluido si pasas a Vercel Pro)**
> **Costo: $55–75/mes** (depende de si necesitas Vercel Pro por otras razones)

Cuando empiecen las ventas reales, los free tiers se quedan cortos:
- **Sentry Team** → 50K errores/mes, retención 90 días, source maps, alertas avanzadas
- **BetterStack Pro** → 50 monitores, logs (50GB/mes), incidentes con on-call rotation, status page público
- **Vercel Analytics** (si ya tienes Pro) → Web Vitals reales, RUM (Real User Monitoring), conversion tracking

Datadog queda fuera hasta cruzar 5,000 órdenes/mes — antes de eso es overkill caro.

### Costo total por fase

| Fase | Período | Costo mensual |
|------|---------|---------------|
| **HOY (MVP pre-launch)** | abr–sep 2026 | **$0** |
| **FUTURO base (post-launch)** | oct 2026+ | **~$55–75/mes** |
| **Escalado (12+ meses post-launch)** | mid-2027+ | $150–300/mes (si volumen lo justifica) |

---

## 2. Análisis de cada herramienta evaluada

### 2.1 — Sentry

**Qué es:** Plataforma líder en *application performance monitoring (APM)* y captura de errores. Wraps tu app y captura cada exception, crash, slow query, performance issue. Tiene SDKs nativos para Next.js (server + client + edge runtime).

**Qué cubre del stack MBF:**
- ✅ Errores en Next.js (frontend + server components + API routes)
- ✅ Errores en Express backend (Railway)
- ✅ Performance traces (qué tan lentas son las queries, las API routes)
- ✅ Source maps (te muestra el stack trace en TU código original, no el minificado)
- ⚠️ Logs de Stripe webhooks → solo si los wrappeas en try/catch que reporten a Sentry
- ⚠️ Resend → solo si capturas los `error` de los `send()`
- ❌ Uptime de URLs (no es su negocio)
- ❌ Estado de servicios externos (Stripe API down, Supabase down)

**Precio (verificar en sentry.io/pricing):**
- **Developer (Free):** 5,000 errores + 10K performance units + 50 replays + 1 user · sin SLA · retention 30 días
- **Team:** $26/mes — 50K errores + 100K spans + 500 replays + ilimitados users · retention 90 días
- **Business:** $80/mes — incluye dashboards custom, métricas avanzadas, on-call routing
- **Enterprise:** custom

**Pros:**
- Estándar de facto del ecosistema React/Next.js — integración casi sin fricción.
- Stack traces con source maps muy útiles para debugging real.
- Free tier generoso (5K errores/mes es mucho pre-launch).
- Performance monitoring incluido en free tier (slow API routes, slow DB queries).
- UI muy buena, incluye agrupamiento inteligente de errores (no te spammea con duplicados).

**Contras:**
- NO hace uptime monitoring (necesitas otra cosa).
- NO monitorea servicios de terceros (Stripe, Resend están fuera de su radar).
- Los breadcrumbs de PII pueden capturar datos sensibles si no configuras el `beforeSend` filter.
- Free tier sin SLA — si Sentry mismo cae, perdés visibilidad temporal.

**Integración con MBF:**
- Next.js: paquete `@sentry/nextjs`, instala en 5 minutos con CLI wizard.
- Express (Railway): `@sentry/node`, middleware en 2 líneas.
- Supabase: errores de queries via Prisma se capturan automáticamente.
- Stripe webhooks: hay que envolver el handler en try/catch que llame `Sentry.captureException()`.

---

### 2.2 — BetterStack (Uptime + Logtail)

**Qué es:** Producto consolidado (antes Better Uptime + Logtail por separado) que cubre uptime monitoring, logs management, status pages, y on-call alerting. Modern UI, fundado 2020, ya maduro.

**Qué cubre del stack MBF:**
- ✅ Uptime de URLs públicas (home, /paquetes, /servicios, etc.) cada 30 seg–3 min según plan
- ✅ Uptime de API endpoints (Railway, /api/health, /api/orders)
- ✅ Detecta SSL expiration (alerta 30/14/7/1 días antes)
- ✅ Detecta DNS issues (resolución desde múltiples regiones)
- ✅ Detecta lentitud anómala (response time threshold)
- ✅ Logs management (recibe logs de Vercel/Railway/Supabase via syslog/HTTP drain)
- ✅ Status page público (status.mybusinessformation.com)
- ⚠️ Errores de aplicación → solo si los logueas a BetterStack (Sentry es mejor para esto)
- ❌ Performance interno de la app (Sentry sí)

**Precio (verificar en betterstack.com/pricing):**
- **Free:** 10 monitores · check cada 3 min · 50K log lines/mes · status page básico · alerts por email/SMS limitadas
- **Team ($29/mes):** 50 monitores · check cada 30 seg · 50GB logs/mes · on-call schedules · status page custom dominio
- **Business ($199/mes):** 100+ monitores · 250GB logs · SLA reports · escalation policies avanzadas
- **Enterprise:** custom

**Pros:**
- Free tier real-y-útil (10 monitores cubre todas tus URLs críticas).
- UI hermosa, muy clara para no-técnicos.
- Status page público gratis — sirve para mostrar transparencia a clientes.
- On-call rotation y escalation incluidos en Team plan (futuro).
- API REST limpia para consumir desde tu propio panel admin.
- Alertas por email/SMS/Slack/Teams/Discord/Telegram/PagerDuty/Webhook.
- Log management incluido (Logtail) — ya no necesitas otra herramienta para logs.

**Contras:**
- 10 monitores en free tier puede quedarse corto si quieres monitorear muchos endpoints individuales.
- Logs en free tier (50K lines/mes) se acaba rápido si tienes mucho tráfico.
- No hace APM/error tracking profundo (Sentry es mejor para eso).
- SMS alerts en free tier muy limitadas (~5/mes).

**Integración con MBF:**
- URLs públicas: agregar URL → done. 30 segundos.
- Vercel logs: configurar log drain (URL HTTP de BetterStack en Vercel settings).
- Railway logs: misma cosa, log drain.
- Supabase: Pro plan tiene log drains nativos hacia syslog (BetterStack acepta).

---

### 2.3 — UptimeRobot

**Qué es:** El veterano del uptime monitoring. Existe desde 2010. Plan gratis muy popular en startups bootstrapped.

**Qué cubre del stack MBF:**
- ✅ Uptime básico de URLs (HTTP/HTTPS/Ping/Port)
- ✅ SSL expiration monitoring
- ⚠️ Status page (básico)
- ❌ Logs management
- ❌ Error tracking
- ❌ Performance / APM

**Precio (verificar en uptimerobot.com/pricing):**
- **Free:** 50 monitores · check cada 5 min · alertas por email · status page público básico
- **SOLO Pro ($7/mes):** 50 monitores · check cada 60 seg · SMS · multi-canal
- **Team ($14/mes):** 100 monitores
- **Enterprise ($31+/mes):** más

**Pros:**
- Plan gratis MÁS generoso del mercado en cantidad de monitores (50 vs 10 de BetterStack).
- Muy estable, cero drama, "lo prendes y olvidas".
- Precio muy barato si necesitas SMS o checks de 1 minuto.

**Contras:**
- UI vieja (visualmente "early 2010s"), no tan agradable para mostrar a no-técnicos.
- No hay log management ni error tracking — solo uptime.
- API menos flexible que BetterStack.
- Free tier check de 5 min = 5 minutos de downtime sin que lo sepas (BetterStack también, pero su Pro baja a 30s).
- Sin features modernos como on-call rotation o status page con incidentes.

**Integración con MBF:**
- Triviall: agregar URL → ya está. Idéntico a BetterStack.
- Para alertas a tu panel propio: webhook → tu API.

---

### 2.4 — Datadog

**Qué es:** El gigante enterprise de observabilidad full-stack. APM, logs, infra metrics, RUM, security, todo en una plataforma.

**Qué cubre del stack MBF:**
- ✅ Absolutamente todo (APM, logs, uptime, RUM, security, etc.)
- ✅ Integraciones con Vercel/Railway/Supabase/Stripe (las 3 primeras tienen integraciones nativas, Stripe via webhook)
- ✅ Dashboards custom infinitos
- ✅ Machine learning para detección de anomalías

**Precio (verificar en datadoghq.com/pricing):**
- Sin "free tier" útil — trial de 14 días
- **APM:** $31/host/mes
- **Infrastructure:** $15/host/mes
- **Logs:** $0.10/GB ingest + $1.27/M events retain
- **RUM:** $1.50/1K sessions
- **Synthetics (uptime):** $5/10K test runs
- **Realista para MBF en escala mediana:** $200–500/mes

**Pros:**
- Mejor producto del mercado, sin discusión.
- Una sola pantalla para TODO el stack.
- Detección de anomalías por ML — alertas inteligentes, no solo umbrales fijos.
- Infinitos dashboards y reportes ejecutivos.

**Contras:**
- **Precio**. Hasta cruzar mil órdenes/mes, es overkill caro.
- Curva de aprendizaje empinada — no es para no-técnicos.
- Lock-in alto — moverse fuera es doloroso.
- "Surprise billing" notorio en la industria — fácil pasarte de presupuesto sin notarlo.

**Integración con MBF:**
- Excelente — agente Vercel, agente Railway, integración Supabase nativa.
- Pero **no recomendado pre-launch** ni en primer año post-launch.

---

### 2.5 — Soluciones nativas del stack actual (gratis, ya incluidas)

#### Vercel Analytics + Speed Insights

**Free tier (incluido):** Web Analytics básico (page views, top referrers, top pages) + Speed Insights básico (Core Web Vitals reales de usuarios).

**Pro ($20/mes):** Analytics avanzado, RUM completo, conversion funnels, custom events.

✅ **Ya lo tienes** — solo hay que activarlo desde el dashboard de Vercel. CERO costo en free tier.

#### Vercel Logs

**Lifecycle: 1 hora en free, 1 día en Pro, 3 días en Enterprise.** Suficiente para debugging inmediato pero NO sirve para análisis histórico.

#### Railway Metrics + Logs

CPU/RAM/Network metrics nativos, logs en vivo. **No tiene alertas configurables** — solo verlo cuando entras al dashboard.

#### Supabase Logs + Reports

Logs SQL queries + auth events + storage events. **Reports** muestra slow queries, requests por endpoint. Sin alertas configurables.

#### Stripe Dashboard

Notificaciones por email cuando un webhook falla 3 veces consecutivas. Notificaciones de disputes, refunds, fraud alerts. **Ya está activo, no requiere setup.**

#### Resend Dashboard

Bounces, complaints, deliverability stats. **Hay que mirarlo manualmente.**

---

## 3. Comparativa en tabla

| Criterio | Sentry | BetterStack | UptimeRobot | Datadog | Native (Vercel/Railway/Supabase) |
|----------|--------|-------------|-------------|---------|----------------------------------|
| Precio HOY (mínimo) | $0 (Free) | $0 (Free) | $0 (Free) | ❌ no free real | $0 |
| Precio escalado | $26–80/mes | $29–199/mes | $7–31/mes | $200–500+/mes | $20/mes (Vercel Pro) |
| Errores app (APM) | 🟢 mejor | 🟡 básico via logs | ❌ | 🟢 | ❌ |
| Uptime URL públicas | ❌ | 🟢 mejor | 🟢 | 🟢 | ❌ |
| SSL/DNS expiration | ❌ | 🟢 | 🟢 | 🟢 | ❌ |
| Logs management | ❌ | 🟢 (Logtail) | ❌ | 🟢 | 🟡 (efímero) |
| Performance traces | 🟢 | ❌ | ❌ | 🟢 | 🟡 (Speed Insights) |
| Status page público | ❌ | 🟢 (gratis) | 🟡 (básico) | 🟢 | ❌ |
| Alertas a email | 🟢 | 🟢 | 🟢 | 🟢 | 🟡 (Stripe sí, otros no) |
| Alertas a SMS/WhatsApp | 🟡 (paid) | 🟢 (paid) | 🟢 (paid) | 🟢 | ❌ |
| API para panel propio | 🟢 | 🟢 (excelente) | 🟡 | 🟢 | 🟡 |
| UI para no-técnicos | 🟡 (técnica) | 🟢 (limpia) | 🔴 (vieja) | 🔴 (compleja) | 🟢 (nativo) |
| Madurez producto | 🟢 (12+ años) | 🟢 (5 años, sólido) | 🟢 (15 años) | 🟢 (15 años) | 🟢 |
| Setup tiempo | 30 min | 30 min | 5 min | 4–8 horas | 5 min |
| Lock-in | bajo | bajo | bajo | alto | bajo |

---

## 4. Recomendación final justificada

### 🟢 Opción HOY — pre-launch (abril–septiembre 2026)

> **Sentry Free + BetterStack Free + Vercel Analytics (free) + Widget propio en `/admin`**
> **Costo total: $0/mes**

**Justificación (5 puntos):**

1. **Cobertura real del 80% del valor sin gastar.** Sentry captura crashes/excepciones. BetterStack vigila las 7-10 URLs críticas + SSL + DNS. Vercel Analytics te da Web Vitals reales. Las APIs de Stripe y Resend ya emiten alertas nativas a tu email cuando hay problemas.

2. **El stack nativo ya emite alertas críticas gratis.** Stripe avisa cuando un webhook falla 3 veces. Resend te muestra bounces. Aprovecha eso primero antes de pagar otra herramienta encima.

3. **Pre-launch tienes ZERO tráfico real → no necesitas escalado.** 5K errores/mes en Sentry es 100x más de lo que vas a generar en testing y QA. 10 monitores en BetterStack cubre TODO el sitio.

4. **Widget propio en `/admin` agrega valor diferencial.** Consumes las APIs de Sentry + BetterStack y muestras un dashboard unificado en /admin. No tienes que abrir 3 pestañas — está donde ya entras a ver órdenes.

5. **Cero lock-in.** Si en 6 meses decides cambiar a Datadog o algo más, no perdés nada — los datos pre-launch no son críticos.

### 🟢 Opción FUTURO — post-launch (octubre 2026 en adelante)

> **Sentry Team ($26/mes) + BetterStack Pro ($29/mes)**
> **Costo total: ~$55/mes** (sin contar Vercel Pro, que probablemente lo necesitarás por otras razones)

**Justificación (5 puntos):**

1. **5K errores/mes es poco con tráfico real.** Cuando arranques con ads pre-launch (sept) y conversiones post-launch, fácil pasas de 5K. Sentry Team te da 50K + retention 90 días para análisis post-mortem de incidentes.

2. **Necesitas check intervals más cortos.** Free tier de BetterStack es check cada 3 min — eso significa hasta 3 min de downtime sin que lo sepas. Pro baja a 30 segundos. Crítico cuando estás cobrando.

3. **Status page público para clientes.** Cuando tengas 100+ clientes, vas a querer un `status.mybusinessformation.com` para mostrar transparencia cuando haya un incidente. BetterStack Pro lo da con dominio custom.

4. **On-call rotation.** Cuando contrates a alguien o tengas que dormir, Pro te permite rotar quién recibe alertas a qué hora. Sin eso, todo cae sobre Ethan 24/7.

5. **Logs con retention 30 días.** Necesario para debugging post-mortem cuando un cliente reporta "algo pasó la semana pasada". Free tier no guarda nada usable más de un día.

**Datadog ENTRA solo cuando:**
- Pases de 5,000 órdenes/mes (no 500)
- Tengas más de 5 servicios distintos en arquitectura
- Tengas equipo dedicado de ops/SRE
- O tengas necesidad de compliance enterprise (SOC2, HIPAA)

Hasta ahí, el combo Sentry+BetterStack es lo correcto para tu escala.

---

## 5. Cobertura del stack con la opción recomendada

| Servicio del stack | Qué se monitorea | Herramienta primaria | Backup / fallback |
|-------------------|------------------|---------------------|-------------------|
| **Vercel (frontend Next.js)** | Uptime, deploys exitosos, Core Web Vitals | BetterStack (URLs) + Vercel Analytics | Sentry (errores client) |
| **Vercel (API routes /api/*)** | Status codes, latencia, errores | BetterStack (endpoint check) + Sentry | Vercel Logs (1h) |
| **Railway (Express backend)** | Uptime, response time, crashes | BetterStack + Sentry @sentry/node | Railway Metrics |
| **Supabase (PostgreSQL + Storage)** | Conexión, queries lentas, errores | Sentry (vía Prisma exceptions) | Supabase Reports |
| **Stripe (pagos + webhooks)** | Webhooks fallidos, payments declined alto | Stripe Dashboard nativo (email) | Sentry (envuelve handler) |
| **Resend (emails)** | Bounce rate, deliverability, sends fallidos | Resend Dashboard nativo + custom widget | Sentry (envuelve send) |
| **Dominio + SSL** | Expiración SSL, DNS resolución | BetterStack | — |
| **Picos de tráfico anómalos** | Spike >5x baseline | BetterStack (alertas custom) + Vercel Analytics | — |
| **Orden no procesada en X tiempo** | Orden en `pending` > 30 min sin Stripe webhook | Cron job propio que alerte por email | Widget /admin |

---

## 6. Diseño del widget de alertas en panel admin

### Ubicación
Componente nuevo: `app/admin/components/SystemStatusWidget.tsx`. Renderizado en la parte superior del dashboard (`/admin/page.tsx`), encima de las 4 tarjetas de estadísticas existentes.

### Layout descriptivo

```
┌──────────────────────────────────────────────────────────────────────┐
│  Estado del Sistema                              🔄 Última: hace 2m  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   🟢 Operacional · Todos los servicios funcionando                  │
│                                                                      │
│  ┌──────────────────┬──────────────────┬──────────────────┐         │
│  │ Sitio Web        │ Backend API      │ Base de Datos    │         │
│  │ 🟢 100%          │ 🟢 99.97%        │ 🟢 OK            │         │
│  │ 247ms avg        │ 412ms avg        │ 12 conn          │         │
│  └──────────────────┴──────────────────┴──────────────────┘         │
│                                                                      │
│  ┌──────────────────┬──────────────────┬──────────────────┐         │
│  │ Pagos Stripe     │ Emails Resend    │ Errores 24h      │         │
│  │ 🟢 OK            │ 🟢 98% deliv.    │ 🟢 3 errores     │         │
│  │ Último webhook:  │ 0 bounces        │ Ver en Sentry →  │         │
│  │ hace 14m         │ últimas 24h      │                  │         │
│  └──────────────────┴──────────────────┴──────────────────┘         │
│                                                                      │
│  📋 Últimas alertas (24h)                                           │
│  ─────────────────────────────────────────────────────              │
│  🟡 14:32  Webhook Stripe lento (>3s)        Ver detalle →          │
│  🟢 09:15  Deploy Vercel exitoso             —                      │
│  🟢 04:00  Backup nightly Supabase OK        —                      │
│                                                                      │
│  [ Ver dashboard completo en BetterStack → ]                         │
└──────────────────────────────────────────────────────────────────────┘
```

### Información mostrada

**Header:**
- Estado global (🟢 Operacional / 🟡 Degradado / 🔴 Incidente)
- Timestamp última actualización
- Botón refresh manual

**6 tarjetas de servicio (grid 3x2):**
1. **Sitio Web** — uptime % últimas 24h + response time avg
2. **Backend API** — uptime % + response time avg (Railway endpoint)
3. **Base de Datos** — Supabase conexión OK/error + connections activas
4. **Pagos Stripe** — último webhook recibido + tasa de éxito 24h
5. **Emails Resend** — % deliverability + bounces 24h
6. **Errores aplicación 24h** — count + link a Sentry

**Sección de alertas recientes:**
- Últimas 5-10 alertas/eventos con timestamp, severidad y link a detalle
- Filtro mostrar/ocultar resueltas

### Colores (siguiendo convención TROUBLESHOOTING)

- 🟢 **Verde** — operacional, métricas saludables (uptime >99%, errores normales)
- 🟡 **Amarillo** — degradado, atención necesaria (lentitud, bounces elevados, errores subiendo)
- 🔴 **Rojo** — incidente activo, requiere acción inmediata (servicio down, webhook fallando)

### Frecuencia de refresco

- **Auto-refresh:** cada 60 segundos (websocket o polling)
- **Manual:** botón con spinner en header
- **Push real-time:** opcional futuro vía Supabase Realtime cuando llegue alerta crítica

### Implementación técnica (cuando apruebes)

- **Server Component** que en el render hace fetch en paralelo a:
  - `betterstack.com/api/v2/monitors` (uptime + response times)
  - `sentry.io/api/0/projects/{org}/{project}/stats/` (error counts)
  - `stripe.com/v1/events` (últimos webhooks)
  - `resend.com/emails` (stats últimas 24h)
- **Cliente** con `useEffect` setInterval para auto-refresh.
- **Cache 30 seg** en Vercel Edge para no spamear las APIs externas.
- **API keys** en `process.env` server-side (nunca expuestas al cliente).

---

## 7. Plan de alertas escalonadas

### 🔴 Críticas — email INMEDIATO + panel rojo + (futuro) SMS

**Definición:** algo que impide vender o cobrar AHORA.

| Trigger | Detector | Acción |
|---------|----------|--------|
| Sitio web devuelve 5xx > 2 min | BetterStack | Email + panel + futuro SMS |
| Backend Railway no responde > 2 min | BetterStack | Email + panel |
| Stripe webhook falla 3 veces | Stripe nativo + Sentry | Email + panel |
| Supabase no acepta connections | Sentry (Prisma exceptions) | Email + panel |
| SSL certificado expira en 7 días | BetterStack | Email + panel |
| Crash de aplicación que afecta >10% usuarios | Sentry (Issue Alerts) | Email + panel |

### 🟡 Medias — email en lote 1x al día + panel amarillo

**Definición:** algo no bien pero no detiene operación inmediata.

| Trigger | Detector | Acción |
|---------|----------|--------|
| Bounce rate Resend > 5% | Resend dashboard + widget | Email diario digest + panel |
| Response time avg > 1500ms (p95) | BetterStack | Email diario + panel |
| Tasa de pagos rechazados > 15% | Stripe dashboard | Email diario + panel |
| Errores nuevos en Sentry (no vistos antes) | Sentry Issue Alerts | Email diario digest + panel |
| Order en `pending` > 30 min sin webhook | Cron propio | Email + flag en /admin |
| SSL expira en 30 días | BetterStack | Email + panel |

### 🟢 Bajas — solo panel verde con nota, sin email

**Definición:** información de salud, no requiere acción.

| Trigger | Detector | Acción |
|---------|----------|--------|
| Deploy Vercel exitoso | Vercel webhook | Log en panel |
| Backup Supabase nocturno OK | Cron check | Log en panel |
| Métrica de tráfico cumple objetivo del día | Vercel Analytics | Log en panel |
| Spike de tráfico < 3x baseline | Vercel Analytics | Log en panel (si > 5x → 🔴 crítico) |

### Destinatarios por rol

| Rol | Email | Severidad mínima |
|-----|-------|------------------|
| Ethan (founder/CTO) | aneudysoto1823@gmail.com | 🔴 Crítica + 🟡 Media |
| Fabián (cofounder) | admin@mybusinessformation.com | 🔴 Crítica |
| Futuro: VA / soporte | TBD | 🟡 Media + 🟢 Baja (digest) |

---

## 8. Próximos pasos (cuando apruebes)

**NO ejecutar nada hasta luz verde de Ethan.** Estos son los pasos en orden:

1. **Crear cuentas Sentry + BetterStack (15 min).**
   - Sentry: `signup` con email founder, crear proyecto "mybusinessformation-web" tipo Next.js.
   - BetterStack: `signup` con mismo email, conectar.

2. **Integrar Sentry en Next.js (30 min).**
   - `npx @sentry/wizard@latest -i nextjs` dentro de `backend/`
   - Wizard genera `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
   - Agregar variables de entorno en Vercel: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
   - Wrap config en `next.config.js` con `withSentryConfig`
   - Test: tirar un error a propósito en una API route, ver que aparece en Sentry

3. **Integrar Sentry en Express Railway (15 min).**
   - `npm install @sentry/node` en backend (módulo Express)
   - Agregar middleware `Sentry.Handlers.requestHandler()` y `errorHandler()`
   - Variable `SENTRY_DSN_BACKEND` en Railway
   - Test: ver evento en Sentry desde Express

4. **Configurar 8 monitores en BetterStack (20 min).**
   - URLs: `/`, `/paquetes`, `/servicios`, `/about`, `/legal`, `/admin/login`, `/api/health`, Railway healthcheck
   - Frecuencia: 3 min (free tier)
   - Alertas: email a Ethan
   - SSL monitor para `mybusinessformation.com` (cuando se apunte el dominio)

5. **Construir el widget en `/admin` (4-6 horas dev).**
   - Server Component `SystemStatusWidget.tsx`
   - Fetch en paralelo a Sentry API + BetterStack API + Stripe API + Resend API
   - Render según diseño en sección 6
   - Auto-refresh client-side cada 60s
   - Variables: `BETTERSTACK_API_TOKEN`, `SENTRY_API_TOKEN` (server-only)

**Total tiempo de implementación HOY:** ~6-8 horas de trabajo de Ethan, repartido en 2 sesiones.

---

## 9. Riesgos y supuestos

### Riesgos

**R1 — Sentry captura PII sin querer.**
- Probabilidad: Media · Impacto: Alto (legal)
- Mitigación: configurar `beforeSend` filter en `sentry.client.config.ts` y `sentry.server.config.ts` para scrubbear emails, SSN, datos de tarjeta. Habilitar Sentry's Data Scrubber por default.

**R2 — Free tier de Sentry/BetterStack se queda corto antes del lanzamiento.**
- Probabilidad: Baja pre-launch · Impacto: Medio
- Mitigación: monitorear consumo mensual desde dashboard de cada herramienta. Si se acerca al 80% de cuota, upgrade preventivo a Pro antes del bloqueo.

**R3 — Widget propio en /admin se rompe si las APIs externas fallan.**
- Probabilidad: Media · Impacto: Bajo
- Mitigación: try/catch alrededor de cada fetch en el widget. Si BetterStack API down, mostrar "(no disponible)" en lugar de crashear el dashboard completo.

**R4 — Alertas por email se pueden ir a spam de Ethan.**
- Probabilidad: Media · Impacto: Alto (no enterarse de incidente)
- Mitigación: marcar dominio sender de Sentry/BetterStack como seguro en Gmail. Crear filtro Gmail que ponga estrella + categoría "Importante" a emails de `*@sentry.io` y `*@betteruptime.com`. Probar mensualmente que llegan al inbox principal.

**R5 — Falsos positivos generan fatigue de alertas.**
- Probabilidad: Alta primer mes · Impacto: Medio (ignorás alertas reales)
- Mitigación: tunear umbrales primer mes, marcar "muted" alertas conocidas-ruidosas. Revisar reglas cada 2 semanas el primer trimestre.

**R6 — APIs de Sentry/BetterStack cambian (breaking change).**
- Probabilidad: Baja (ambas son APIs maduras y estables) · Impacto: Bajo
- Mitigación: el widget es código propio que podemos actualizar; ambos productos publican changelog y deprecation con tiempo.

### Supuestos

1. **Ethan es el primer responder de incidentes** durante pre-launch. Fabián entra como backup post-launch.
2. **Stripe y Resend mantienen sus dashboards nativos** sin cobrar extra. (Stripe ya envía emails de webhook fallidos por default; Resend muestra stats sin upgrade.)
3. **Vercel Analytics free tier** sigue siendo gratis (Vercel ha sido consistente en mantener este tier).
4. **El dominio `mybusinessformation.com` se apuntará a Vercel** antes del launch — esto activa el monitoreo SSL real (hoy el SSL es de `vercel.app`, gestionado por Vercel automáticamente, sin riesgo de expiración).
5. **No usaremos PagerDuty / Opsgenie pre-launch.** El email es suficiente. Esos son para equipos con on-call de 4+ personas.

---

## 10. Mi opinión como arquitecto (push-back honesto)

**Push-back #1 — El stack ya resuelve más de lo que crees, no compres tooling de más.**
Stripe te avisa cuando un webhook falla 3 veces — no necesitas Datadog para eso. Resend te muestra bounces — no necesitas otra herramienta para emails. Vercel tiene Web Analytics gratis. **El 60% de tus alertas críticas ya están cubiertas sin pagar nada extra.** Sentry+BetterStack agregan el 30% que falta (errores de app + uptime de URLs). El último 10% (status page público, on-call avanzado, anomaly detection ML) lo dejarías para post-launch cuando tengas plata.

**Push-back #2 — No actives SMS/WhatsApp pre-launch.**
Pre-launch con tráfico cero, una alerta SMS en la madrugada por un falso positivo te va a quemar. Empezá con email solo. Cuando tengas órdenes reales y dependa la operación, agregás SMS para crítico únicamente.

**Push-back #3 — El widget en /admin es valioso pero NO es lo primero a construir.**
Las cuentas de Sentry y BetterStack te dan visibilidad inmediata con sus propios dashboards. El widget propio te ahorra abrir tabs pero no cambia el fundamento. Si tienes 6 horas para invertir HOY, mejor priorizar Stripe (Etapa 4) que está bloqueando el lanzamiento. El widget puede esperar 2 semanas.

**Push-back #4 — No tengas más de 3 herramientas pagadas el primer año.**
Cada herramienta nueva = más uptime monitoring que mantener, más facturas que conciliar, más passwords que rotar. Con Sentry + BetterStack + (eventualmente) Vercel Pro, tienes lo necesario hasta los $50K MRR. Después podés evaluar Datadog o LogRocket.

**Push-back #5 — Crítico que NO falte: monitor de orden estancada.**
Esto NO existe en Sentry ni BetterStack out-of-the-box. Tenés que construir un cron job propio que cada 30 min revise órdenes en `pending` > 30 min sin webhook de Stripe — eso indica problema con webhooks o con el cliente abandonando carrito. Es el monitor con mayor ROI directo a revenue. **Lo agrego como paso 5b en próximos pasos** (cron en Vercel Cron Jobs, gratis hasta 2 jobs).

---

**Fin de la propuesta.** Esperando aprobación de Ethan para ejecutar pasos 1-5 (sección 8).
