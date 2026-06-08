# Proceso 15 — Monitoreo y Observabilidad (Sentry + BetterStack)

Documento maestro de **Etapa 15**: el bloque de detección pasiva que avisa cuando algo se rompe en producción, **antes** que el cliente. Cubre dos sistemas complementarios — Sentry (errores de runtime) y BetterStack (uptime de URLs) — más el proceso humano que los conecta.

**Estado:** completada para la superficie Vercel el 2026-05-13. Items de Railway diferidos a Etapa 5.

---

## Por qué dos sistemas

**Sentry y BetterStack se complementan. Sin los dos, hay puntos ciegos.**

| | Sentry | BetterStack |
|---|---|---|
| **Qué cuida** | Que el código no tire errores en runtime | Que las URLs públicas respondan |
| **Cuándo dispara** | Una excepción / bug / throw en código | Una URL deja de responder 2-3 chequeos seguidos |
| **Latencia detección** | Inmediata (en milisegundos del evento) | 30 a 90 segundos (depende del intervalo) |
| **Detalle del alert** | Stack trace + archivo + línea + breadcrumbs | Status code + tiempo de respuesta + qué monitor cayó |
| **Cubre código del cliente (browser)** | Sí | No |
| **Cubre código del servidor** | Sí (API routes + Server Components + middleware) | Solo si el servidor cae completo |
| **Detecta cert SSL expirado** | No | Sí (SSL/TLS verification activado) |
| **Detecta DNS roto** | No | Sí |
| **Detecta Vercel completamente caído** | No (no hay código corriendo) | Sí |
| **Detecta deploy regression con bug** | Sí, con stack trace | No, salvo que el bug también tire 500 en el monitor |
| **Free tier alcanza pre-launch** | Sí (5K eventos/mes) | Sí (10 monitores, 30s checks, status page) |

### Caso concreto: imaginá que el panel admin tiene un bug que crashea

- **Sentry** lo captura con stack trace completo. Sabés exactamente qué archivo, qué línea, qué usuario. Te llega un email en ~10 segundos.
- **BetterStack** puede no notarlo si el endpoint sigue respondiendo 200 OK (Next.js renderiza una error page genérica).

### Caso concreto: imaginá que Vercel se cae completo

- **BetterStack** lo detecta porque las URLs dejan de responder. Email DOWN en 60-90s.
- **Sentry** NO se entera porque no hay código corriendo que pueda tirar excepción.

**Por eso los dos. Cada uno cubre lo que el otro no ve.**

---

## Lo que cubrimos juntos

Esta combinación detecta — en producción, sin que un cliente nos avise — los siguientes problemas:

1. ✅ Errores de JavaScript en el browser del cliente (Sentry browser).
2. ✅ Errores en API routes de Next.js (Sentry server).
3. ✅ Errores en Server Components y páginas (Sentry server).
4. ✅ Errores en el middleware de auth admin (Sentry edge).
5. ✅ Errores de hydration entre server y browser (Sentry server + browser).
6. ✅ Sitio entero caído (BetterStack).
7. ✅ Panel admin caído específicamente (BetterStack — monitor dedicado).
8. ✅ API endpoint específico caído (BetterStack — monitor `/api/health` o similar).
9. ✅ Certificado SSL expirado o inválido (BetterStack con SSL verification).
10. ✅ DNS del dominio roto (BetterStack).
11. ✅ Deploys que rompen producción (BetterStack alerta + Sentry agrupa los errores nuevos).

---

## Lo que NO cubrimos (gaps deliberados)

**Importante saber qué NO está cubierto para no tener falsa sensación de seguridad.**

1. ❌ **Errores del backend Express en Railway.** Sentry/Node está DIFERIDO hasta Etapa 5 (Railway dormido). Hoy si Express crashea, nadie se entera porque no hay tráfico productivo hacia él de todas formas.
2. ❌ **Latencia / performance degradación.** Tenemos `tracesSampleRate: 0.1` (solo 10% de traces). Si el sitio se vuelve lento sin tirar errores, no nos enteramos automático. Hay que mirarlo manualmente en Vercel Analytics o Sentry Performance.
3. ❌ **Errores que solo afectan al status `pending` o estados intermedios** que el cliente nunca ve. Eso es trabajo de testing, no de monitoring.
4. ❌ **Métricas de negocio** (cuántas órdenes nuevas hoy, conversión, etc.). Eso es trabajo de GA4 (Etapa 13, pendiente) o queries directas a Supabase.
5. ❌ **Caídas de Supabase / Resend / Stripe directamente.** Si Supabase cae, nuestras requests fallan, Sentry capta los errores → ahí nos enteramos. Pero el ETA de resolución viene de la status page del proveedor, no de nuestros sistemas.
6. ❌ **Caídas de Railway.** Diferido hasta Etapa 5 (sin tráfico, monitorearlo es ruido).

---

## Configuración actual (2026-05-13)

### Sentry

- **Plan:** free tier (5K eventos/mes, retención 30 días).
- **Proyecto:** `javascript-nextjs` en sentry.io.
- **Cuenta dueña:** `admin@opabiz.com`.
- **DSNs:** configurados en Vercel (Production + Preview + Development) como `SENTRY_DSN` y `NEXT_PUBLIC_SENTRY_DSN`.
- **Filtro PII obligatorio:** `backend/lib/sentry-pii-filter.ts` — scrubea email/teléfono/SSN/tarjetas/passwords antes de enviar. Aplica a server, edge, browser, breadcrumbs y request body/headers/cookies.
- **Tunnel route:** `/monitoring/*` en `next.config.ts` — evita ad-blockers que bloquean `*.sentry.io`.
- **Sampling:**
  - `tracesSampleRate: 0.1` (10% de traces de performance — los errores se mandan al 100%).
  - `replaysSessionSampleRate: 0` (cero grabaciones completas — privacidad + ahorro de cuota).
  - `replaysOnErrorSampleRate: 0.1` (10% de sesiones con error se graban para análisis).
- **Alert Rule:** email a `admin@opabiz.com` en la primera ocurrencia de cada error nuevo (configurada 2026-05-13). NO spamea con repeticiones.
- **Ruta de validación periódica:** `/sentry-client-test` gated (404 en producción, accesible en preview/development).

### BetterStack

- **Plan:** free tier (10 monitores, 30s checks, status page con custom domain, SSL cert monitor).
- **Cuenta dueña:** `admin@opabiz.com`.
- **3 monitores activos:**
  - Home — `https://opabiz.com/` (status 2xx/3xx).
  - Admin Login — `https://opabiz.com/admin` (status 200).
  - API Client Portal — endpoint health del portal.
- **SSL/TLS verification:** activada en los 3.
- **Umbral:** 2-3 fallos consecutivos antes de alertar (evita falsos positivos por hiccups de red).
- **Destinatario email:** `admin@opabiz.com` por ahora. Segundo destinatario pendiente (Gmail compañía futuro).
- **Push notifications:** activas en iPhone vía app BetterStack.
- **Smoke test inicial:** validado end-to-end el 2026-05-13 (un monitor cayó cuando se accedió a una ruta `/xxxxxxx` inválida; emails DOWN y UP llegaron correctamente a Zoho).

### Proceso

- **Filtros email:** configurados en Gmail/Zoho — `[Sentry]` y `[BetterStack] DOWN` van a label rojo + push notification, `[BetterStack] UP` va a label verde.
- **Runbooks:** `TROUBLESHOOTING/15_sentry_alerts.md` y `TROUBLESHOOTING/16_betterstack_down.md`.

---

## Validación periódica mensual

**Cuándo:** el día 1 de cada mes (o el día 1 hábil siguiente). 15 minutos máximo.

**Por qué:** los sistemas pasivos pueden fallar silenciosamente. Sentry puede empezar a rechazar eventos por cuota o por config corrupta. BetterStack puede tener un monitor pausado que nadie notó. Si no se valida activamente, una alerta crítica puede no llegar nunca y nadie se entera hasta que un cliente reclama.

**Protocolo paso a paso:**

### 1. Sentry server-side (3 min)

- Crear endpoint temporal `backend/app/api/sentry-test/route.ts` con un `throw new Error('[sentry-test-YYYY-MM-DD]')`.
- Hacer commit + push.
- Una vez deployado, visitar `https://opabiz.com/api/sentry-test`.
- En sentry.io → Issues → filtrar `[sentry-test-`. El evento debe aparecer en menos de 60 segundos con `environment: production`.
- Borrar el endpoint (commit + push). Resolver el issue en Sentry.

### 2. Sentry client-side (3 min)

- Abrir la URL de preview `https://<rama-de-prueba>.vercel.app/sentry-client-test` (o local con `npm run dev`).
- Apretar los 3 botones (uncaught throw, captureException, captureMessage).
- En sentry.io → Issues → filtrar `[sentry-client-test-`. Los 3 eventos deben aparecer en menos de 60 segundos.
- Confirmar `environment: preview` (o `development` si fue local).
- Resolver los 3 issues post-validación.

### 3. Sentry alert email (1 min)

- Confirmar que el email del paso 1 llegó a `admin@opabiz.com` con subject `[Sentry] ...`.
- Si no llegó: la Alert Rule está rota. Ir a sentry.io → Alerts → revisar.

### 4. BetterStack DOWN / UP (5 min)

- Ir a betterstack.com → Monitors → elegir 1 monitor (ej. Admin Login).
- Pausar el monitor por 2-3 minutos.
- Esperar a que llegue el email `[BetterStack] DOWN`. Confirmar que llega + push notification al iPhone.
- Reactivar el monitor.
- Esperar email `[BetterStack] UP`. Confirmar que llega.

### 5. Anotar en bitácora (1 min)

- En este mismo archivo, agregar línea al final de la sección "Historial de validaciones mensuales":
  ```
  - YYYY-MM-DD: OK (Sentry server ✓, Sentry client ✓, Alert email ✓, BetterStack DOWN/UP ✓)
  ```
- Si algo falló: anotar qué falló, abrir issue para investigar.

---

## Historial de validaciones mensuales

- 2026-05-13: setup inicial completo. Smoke test end-to-end de BetterStack OK (ruta inválida `/xxxxxxx` disparó DOWN → email a Zoho → UP automático). Sentry Alert Rule validada en este mismo smoke. Sentry server-side validado durante implementación de Etapa 15 parte Next.js (commit `305bc94` el 2026-05-09).

---

## Items diferidos

### Diferidos a Etapa 5 (Sunbiz / despertar Railway)

- **Sentry para Express** (`@sentry/node` en `backend/server.ts`): cuando Railway entre en producción para Etapa 5, instalar Sentry/Node con el mismo filtro PII de Next.js.
- **Proyecto `node-express` en sentry.io:** crear cuando Railway tenga tráfico real.
- **Env vars en Railway:** `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`. Tipear desde Vercel, no copy-paste.
- **4to monitor BetterStack:** Express health en `up.railway.app/health` con SSL + keyword match.
- **Runbook "Railway DOWN"** en `TROUBLESHOOTING/` para el cuarto monitor.

### Diferidos por dependencias externas

- **Segundo destinatario de emails BetterStack:** pendiente hasta que esté configurado el Gmail de la compañía. Hoy solo notifica a `admin@opabiz.com`.
- **Status page pública en `status.opabiz.com`:** pendiente hasta migración DNS de Netlify a Namecheap BasicDNS (planeada). Una vez migrados los DNS, configurar CNAME apuntando a BetterStack + cert SSL auto-emitido por Let's Encrypt.
- **`SENTRY_AUTH_TOKEN` para sourcemaps:** opcional. Sin él, los stack traces del browser muestran código minificado (variables como `e`, `n`, etc.). Aceptable hasta que sea molesto durante un debug.

---

## Decisiones embutidas

| Decisión | Por qué |
|---|---|
| Free tier en ambos (Sentry + BetterStack) | 5K eventos/mes y 10 monitores alcanzan pre-launch sobrado. Upgrade post-launch si hace falta. |
| Cuenta única `admin@opabiz.com` | Inbox compartido del proyecto, ambos socios pueden ver. |
| Filtro PII obligatorio en Sentry | Cero email/teléfono/SSN en Sentry. Compliance CCPA/GDPR + seguridad si hackean Sentry. |
| Tunnel route `/monitoring` | Sortea ad-blockers (`*.sentry.io` está en listas de bloqueo). Sin esto perderíamos ~15-20% de eventos de browser. |
| 3 monitores BetterStack (no 4) hoy | Railway dormido — monitorearlo es ruido. 4to monitor cuando Etapa 5. |
| Umbral 2-3 fallos consecutivos en BetterStack | Evita falsos positivos por hiccups de red. Si la primera respuesta es lenta pero la siguiente es OK, no avisa. |
| Alert Rule de Sentry solo en "primera ocurrencia" | Evita spam. Si el mismo bug pasa 1000 veces, llega 1 solo email. Sentry agrupa por fingerprint. |
| Validación periódica mensual (no semanal) | Sistemas pasivos rara vez fallan silenciosamente. Mensual da equilibrio entre confianza y carga de trabajo. |

---

## Relacionados

- `LOGICA_DE_NEGOCIO/14_sentry_monitoreo_errores.md` — detalle técnico de Sentry (las 3 capas, filtro PII, archivos del proyecto, plan free).
- `TROUBLESHOOTING/15_sentry_alerts.md` — runbook para responder alertas de Sentry.
- `TROUBLESHOOTING/16_betterstack_down.md` — runbook para responder alertas DOWN de BetterStack.
- `LOGICA_DE_NEGOCIO/00_arquitectura_tecnica_de_una_orden.md` — arquitectura general del stack y por qué Railway está dormido.
- `CONTEXTO.md` — Etapa 15 con todos los items y los diferidos a Etapa 5.
