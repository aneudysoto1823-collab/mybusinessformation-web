# Proceso 14 — Sentry: monitoreo de errores

## Qué es Sentry (en palabras simples)

**Sentry es un servicio que te avisa cuando algo se rompe en tu sitio web.** Captura el error, te manda email con el detalle exacto (qué archivo, qué línea, qué pasó), y vos te enterás antes que el cliente.

Sin Sentry:
- Un cliente entra al panel y le sale un error → te llama por WhatsApp para quejarse → vos investigás → puede pasar 1 hora antes que sepas qué pasó.

Con Sentry:
- El error se manda solo a tu dashboard de Sentry en el momento que pasa → te llega un email con el archivo y la línea exacta → vos lo ves antes que el cliente vuelva a entrar.

---

## Qué hace HOY

**Cubre el sitio público + el panel admin de Vercel** (toda la parte que vive en `mybusinessformation.com`):

- ✅ Errores en el panel `/admin` (Server Components, ej. cuando se rompe una query a Supabase).
- ✅ Errores en las API routes (`/api/*`, ej. cuando Stripe webhook falla, cuando Claudia tira un bug).
- ✅ Errores en el middleware (la auth admin, los redirects).
- ✅ Errores en el browser del cliente (cuando se rompe JavaScript en el form de `/new-business`, en el chat, en cualquier botón).
- ✅ Errores de hydration (cuando el HTML del servidor no matchea con el del browser).

**No cubre todavía** (queda para próxima sesión):
- ❌ El backend Express en Railway (`server.ts` y los módulos de `backend/modules/`). Cuando un endpoint del Express tire un error, Sentry NO se entera. Lo agregaremos con `@sentry/node` aparte.

---

## Cómo te enterás cuando pasa algo

**1. Email automático** llega a `admin@mybusinessformation.com` (la cuenta con la que está registrado Sentry). Ejemplo:

> 🚨 [Sentry] javascript-nextjs — TypeError: Cannot read property 'name' of null
> in /app/admin/orders/[id]/page.tsx line 47
> Production · 1 user affected

**2. Dashboard web** en https://sentry.io. Cada error tiene:
- El stack trace completo (qué función llamó a qué función)
- El navegador, el sistema operativo, el país del usuario
- Cuántas veces pasó (si se repite, lo agrupa)
- Si es nuevo o ya lo viste antes

**3. Los errores idénticos se agrupan.** Si 100 usuarios disparan el mismo bug, **te llega 1 email**, no 100. Sentry los agrupa por "fingerprint" (combinación de archivo + línea + tipo de error).

---

## Qué NO se manda a Sentry — protección de datos del cliente

Hay un filtro de privacidad que limpia cada evento ANTES de enviarlo. **Cero PII llega a Sentry.** Eso significa que Sentry NUNCA ve:

- ❌ Email del cliente
- ❌ Nombre / apellido
- ❌ Teléfono
- ❌ SSN, ITIN o cualquier número de identificación
- ❌ Número de tarjeta de crédito
- ❌ Direcciones físicas
- ❌ Passwords
- ❌ Tokens de sesión / cookies de auth
- ❌ Headers tipo `Authorization`

Esto es importante porque:
1. **Cumple con regla del proyecto** (igual que GA4: PII solo vive en Supabase, nunca en servicios externos).
2. **Si alguien hackea Sentry**, no obtiene datos de clientes.
3. **Compliance legal** — CCPA / GDPR no permite mandar datos personales a vendors externos sin consent específico.

El filtro vive en `backend/lib/sentry-pii-filter.ts` y se aplica en cada evento antes de enviarlo, sin importar de dónde venga (server, edge, client).

---

## Las 3 capas que cubre

El sitio Next.js corre en 3 "runtimes" distintos, y Sentry tiene 3 inits separados:

### Capa 1 — Servidor Node (API routes + Server Components)
- **Archivo:** `backend/sentry.server.config.ts`
- **Captura:** errores en `/api/auth/login`, `/api/orders`, `/api/chat`, páginas como `/admin/orders/[id]`, etc.
- **Cuándo dispara:** cuando un endpoint tira `throw`, cuando una query a Supabase falla, cuando Resend rechaza un email, cuando Stripe webhook llega malformado.

### Capa 2 — Edge runtime (middleware)
- **Archivo:** `backend/sentry.edge.config.ts`
- **Captura:** errores en `backend/middleware.ts` (la lógica que valida la cookie admin).
- **Cuándo dispara:** raro, pero si el JWT verify rompe o el redirect falla, queda registrado.

### Capa 3 — Browser del cliente
- **Archivo:** `backend/instrumentation-client.ts`
- **Captura:** errores en cualquier componente con `'use client'` (el chat de Claudia, los inputs del form, los toggles, el countdown del login).
- **Cuándo dispara:** cuando el JS del cliente tira un error que normalmente solo se vería en la consola del browser. Sentry lo captura aunque el usuario no abra DevTools.

Las 3 capas usan el **mismo filtro de PII** y el **mismo proyecto en Sentry** (`javascript-nextjs`).

---

## Cómo está conectado al sitio

Cuando pusheamos código nuevo:
1. **Vercel hace el build** del sitio con el wrap de Sentry (`withSentryConfig` en `next.config.ts`).
2. **Vercel deploya** a producción.
3. Desde ese momento, **cada error en runtime se manda a Sentry** automáticamente.
4. **No hay que hacer nada manual.** El sistema funciona solo.

Si Sentry tiene problemas (red caída, su servicio offline), el código sigue funcionando — los errores no se pierden, simplemente no llegan al dashboard durante ese rato. **Sentry es observador pasivo**, no afecta el funcionamiento del sitio.

---

## Truco contra ad-blockers

Mucha gente usa **uBlock Origin, Brave Shields, AdBlock Plus** que bloquean dominios de tracking — incluyendo `*.ingest.sentry.io`. Si dejábamos a Sentry mandando los eventos directo a esa URL, perderíamos el ~15-20% del tráfico latino que usa ad-blockers.

**Solución:** los eventos se mandan a `https://mybusinessformation.com/monitoring/*` (un endpoint propio del sitio que reenvía a Sentry). Como `mybusinessformation.com` no está en listas de bloqueo, los ad-blockers no lo tocan.

Esto se llama **"tunnel route"** y está configurado en `next.config.ts` con `tunnelRoute: '/monitoring'`. Sin esto, perdíamos errores reales de usuarios.

---

## Qué cuesta

**Plan free de Sentry:** 5,000 eventos por mes, 30 días de retención. Pre-launch sin clientes, suficiente sobrado.

**Cuándo upgrade:** si pre-launch nos pasamos de 5K (improbable, son básicamente solo nuestros tests), o post-launch con tráfico real (~$26/mes plan Team, 50K eventos).

Para evitar quemar la cuota:
- **`tracesSampleRate: 0.1`** — solo el 10% de las trazas de performance se mandan. Los errores se mandan al 100% (no quemar la cuota gracias a errors).
- **`replaysSessionSampleRate: 0`** — cero grabaciones de sesión completas (privacidad + ahorra cuota).
- **`replaysOnErrorSampleRate: 0.1`** — solo el 10% de las sesiones que tuvieron error se graban (para análisis posterior).

---

## Configuración

### Variables de entorno (Vercel — Production + Preview + Development)

| Variable | Para qué sirve | Estado |
|---|---|---|
| `SENTRY_DSN` | URL secreta a la que se mandan los eventos del servidor | ✅ Configurada |
| `NEXT_PUBLIC_SENTRY_DSN` | Misma URL pero para el browser (cliente) | ✅ Configurada |
| `SENTRY_ORG` | `mybusinessformation` | ✅ Configurada |
| `SENTRY_PROJECT` | `javascript-nextjs` | ✅ Configurada |
| `SENTRY_AUTH_TOKEN` | Para subir sourcemaps (mejora stack traces) | ⏸ Pendiente — opcional |

### Archivos del proyecto

| Archivo | Rol |
|---|---|
| `backend/lib/sentry-pii-filter.ts` | Helper compartido `scrubPII()` que limpia datos sensibles antes de enviar |
| `backend/sentry.server.config.ts` | Init Sentry para Node runtime (API routes + Server Components) |
| `backend/sentry.edge.config.ts` | Init Sentry para edge runtime (middleware) |
| `backend/instrumentation.ts` | Hook que carga el config según runtime + `onRequestError` |
| `backend/instrumentation-client.ts` | Init Sentry para el browser + `onRouterTransitionStart` |
| `backend/next.config.ts` | Wrappeado con `withSentryConfig` + `tunnelRoute: '/monitoring'` |

---

## Cómo probar que funciona

### Test rápido en producción (1 minuto)

1. Crear endpoint temporal `/api/sentry-test` con un `throw new Error(...)`.
2. Visitar `https://mybusinessformation.com/api/sentry-test`.
3. En el dashboard de Sentry, refrescar Issues — el evento debería aparecer en menos de 60 segundos con `environment: production`.
4. Borrar el endpoint post-validación.

Esto se hizo el 2026-05-09 (commit `305bc94` para crear el endpoint, `06e9c4d` para borrarlo). Resultado: el evento llegó correctamente al dashboard de Sentry con el mensaje `[sentry-test-2026-05-09]`, marcado como Unhandled + New, ruta `GET /api/sentry-test`, environment correcto.

### Validación periódica recomendada (1 vez por mes)

- Test server-side con endpoint temporal (igual al de arriba).
- Test client-side con la ruta gated `/sentry-client-test` (pendiente de crear).
- Verificar que las alertas por email siguen llegando.

---

## Pendientes para próximas sesiones

| Item | Esfuerzo |
|---|---|
| Sentry para Express en Railway (`@sentry/node` en `server.ts`) | ~1 hora |
| Smoke test client-side: ruta `/sentry-client-test` gated a preview/dev (3 botones para validación periódica) | ~30 min |
| Alert Rule en Sentry → email a `admin@mybusinessformation.com` en cada error nuevo | ~10 min |
| Activar `SENTRY_AUTH_TOKEN` para sourcemaps (mejora stack traces) | ~15 min |

---

## Diferencia con BetterStack (que viene en otro archivo)

**Sentry y BetterStack son distintos y se complementan:**

| | Sentry | BetterStack |
|---|---|---|
| Qué cuida | Que el código no tire errores | Que el sitio responda |
| Cuándo dispara | El código rompe (excepción, bug) | Una URL deja de responder (Vercel caído, DNS roto, SSL expirado) |
| Detalle | Stack trace + archivo + línea | Status code + tiempo de respuesta |
| Latencia de detección | Inmediata | 30-90 segundos (depende del intervalo de check) |

**Ejemplo concreto:**
- Si Vercel se cae completamente → BetterStack lo detecta (las URLs no responden), Sentry NO se entera (no hay código corriendo para tirar error).
- Si el panel admin tira un bug → Sentry lo captura con stack completo, BetterStack puede no notarlo si el sitio sigue respondiendo 200 OK (el bug es interno).

BetterStack se documentará en otro archivo cuando lo configuremos.

---

## Decisiones embutidas

| Decisión | Por qué |
|---|---|
| Plan free de Sentry (no Team $26/mes) | 5K eventos/mes alcanza pre-launch. Upgrade post-launch si hace falta. |
| `tracesSampleRate: 0.1` | El plan free se llena fácil con traces de performance al 100%. Los errores siempre se mandan al 100% (no se sample). |
| `replaysSessionSampleRate: 0` | Cero grabaciones de sesión completas. Privacidad + ahorra cuota. |
| `replaysOnErrorSampleRate: 0.1` | Solo el 10% de sesiones con error se graban para análisis posterior. |
| `tunnelRoute: '/monitoring'` | Sortea ad-blockers que bloquean `*.sentry.io`. Sin esto perderíamos ~15-20% de eventos. |
| Filtro PII obligatorio (`beforeSend: scrubPII`) | Cero email/teléfono/SSN/tarjetas en Sentry. Compliance + seguridad. |
| Cuenta única para los 2 proyectos (Next.js y Express futuro) | Un solo dashboard, una sola cuenta de billing si upgrade. |
| Email único `admin@mybusinessformation.com` para todas las alertas | Inbox compartido del proyecto, ambos socios pueden ver. |
| Sin `SENTRY_AUTH_TOKEN` (sourcemaps disable) | Sin auth token, los stack traces son menos legibles (variables minificadas). Aceptable hasta que sea molesto. |
| Endpoint `/api/sentry-test` solo temporal | Borrado post-validación. Para futuras pruebas se usa la ruta gated client-side. |

---

## Historial de implementación

| Fecha | Commit | Cambio |
|---|---|---|
| 2026-05-09 | `305bc94` | Sentry para Next.js: 6 archivos nuevos + wrap config + endpoint test temporal |
| 2026-05-09 | `06e9c4d` | Limpieza post-smoke-test: borrar endpoint + remover `disableLogger` deprecated |

---

## Relacionados

- `LOGICA_DE_NEGOCIO/13_seguridad_panel_admin.md` — bcrypt + rate limiting (Sentry detecta si el rate limiter o el JWT tira error)
- `contexto` — Etapa 15 (Monitoreo y Observabilidad) con todos los items del bloque
- `backend/lib/sentry-pii-filter.ts` — el helper compartido que filtra PII en cada evento
