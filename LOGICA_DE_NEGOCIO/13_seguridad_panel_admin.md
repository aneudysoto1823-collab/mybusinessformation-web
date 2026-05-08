# Proceso 13 — Seguridad del Panel de Admin

## Descripción

El panel de administración (`/admin`) es la zona crítica del sistema: desde ahí se gestionan órdenes, se cambia el estado de filings, se envían emails a clientes y se acceden a datos sensibles. Este documento describe las **3 capas de defensa** que protegen el endpoint de login `/api/auth/login` y la sesión admin.

**Tecnologías:**
- **bcryptjs** — hash de la password admin
- **jose** — JWT firmado HS256 para la sesión
- **@upstash/ratelimit + @upstash/redis** — rate limiting contra brute force

**Archivos clave:**
- `backend/app/api/auth/login/route.ts` — endpoint de login
- `backend/app/api/auth/logout/route.ts` — endpoint de logout
- `backend/lib/session.ts` — JWT createAdminToken / verifyAdminToken
- `backend/lib/rate-limit.ts` — helper de rate limiting con Upstash
- `backend/middleware.ts` — protege `/admin/*` validando el JWT
- `backend/app/login/page.tsx` — UI del login con countdown 401/429

**Estado:** En producción operativo desde 2026-05-08.

---

## Resumen ejecutivo — qué cambió

Para entender de un vistazo qué hicimos para proteger el panel de admin:

- **La password del panel ya NO está en variables de entorno en Vercel.** Antes estaba en plaintext (`ADMIN_PASSWORD=...`); ahora solo guardamos un **hash bcrypt** (`ADMIN_PASSWORD_HASH=...`) que es derivado y no reversible. Aunque alguien filtre el `.env`, no puede sacar la password real.
- **5 intentos fallidos en 15 minutos = el sistema bloquea esa IP automáticamente.** El bloqueo se gestiona con **Upstash** (servicio de Redis serverless, cuenta creada con `admin@mybusinessformation.com`). Después de los 5 intentos, el server responde `429 Too Many Requests` y el frontend muestra un countdown visible al usuario hasta que se libera.
- **La cookie de sesión admin se reforzó:** `secure: true` (solo viaja por HTTPS), `sameSite: 'strict'` (anti-CSRF), `httpOnly: true` (el JavaScript del browser no la lee).
- **La password admin se rotó** el día del cambio porque el hash viejo se transmitió accidentalmente por un `<ide_selection>` automático del IDE.

**Estado actual de variables en Vercel relacionadas con el panel admin:**

| Variable | Estado | Qué hace |
|---|---|---|
| `ADMIN_USER` | ✅ Activa | Username del admin |
| `ADMIN_PASSWORD_HASH` | ✅ Activa (formato base64) | Hash bcrypt de la password |
| `ADMIN_PASSWORD` (plaintext) | ❌ **ELIMINADA** | Ya no se usa, eliminada de los 3 entornos |
| `SESSION_SECRET` | ✅ Activa | Firma del JWT de sesión admin |
| `UPSTASH_REDIS_REST_URL` | ✅ Activa | URL de la database de Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Activa | Token de auth para Upstash |

---

## Arquitectura de las 3 capas

```
┌─────────────────────────────────────────────────────────────┐
│ Cliente intenta login (POST /api/auth/login)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ CAPA 1 — Rate limit (Upstash Redis)                         │
│ ¿IP excedió 5 intentos en 15 min?                           │
│ ─ SÍ → 429 Too Many Requests + Retry-After                  │
│ ─ NO → continúa                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ CAPA 2 — Validación de credenciales (bcrypt)                │
│ ¿user === ADMIN_USER && bcrypt.compareSync(pass, HASH)?     │
│ ─ NO → 401 Unauthorized                                     │
│ ─ SÍ → continúa                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ CAPA 3 — Emisión de sesión (JWT firmado)                    │
│ Genera JWT con jose (HS256, exp 8h)                         │
│ Lo guarda en cookie admin_session (HttpOnly, Secure, Strict)│
│ Devuelve 200 OK                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
       Acceso permitido al panel /admin (middleware valida JWT)
```

---

## Capa 1 — Rate limiting con Upstash Redis

### Por qué existe

Sin rate limit, un atacante con un diccionario puede probar miles de passwords sin consecuencias. Combinado con el costo de bcrypt factor 12 (intencionalmente lento), ese flujo también permitiría un DoS por costo de CPU.

### Política

- **Ventana:** 15 minutos
- **Límite:** 5 intentos por IP
- **Algoritmo:** sliding window (más justo que fixed window — no hay "burst" al cambio de ventana)
- **Prefix de claves Redis:** `rl:admin-login`
- **Comportamiento al excederse:** HTTP 429 con header `Retry-After: <segundos>`
- **Fail-OPEN:** si Upstash cae o no está configurado, permite el request (mejor login funcional que sistema caído)

### Helper — `backend/lib/rate-limit.ts`

```ts
let cachedAdminLoginLimiter: Ratelimit | null = null

function getAdminLoginLimiter(): Ratelimit | null {
  if (cachedAdminLoginLimiter) return cachedAdminLoginLimiter

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN faltantes — fail-open')
    return null
  }

  cachedAdminLoginLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'rl:admin-login',
    analytics: true,
  })
  return cachedAdminLoginLimiter
}
```

**Características técnicas:**

- **Lazy init** — el cliente Redis se crea al primer request en runtime, no en build time. Evita que el build crashee si las env vars faltan en el ambiente de CI.
- **Cached instance** — una vez creado el limiter, se reutiliza para todos los requests de esa instancia serverless de Vercel.
- **`getClientIp()`** — extrae la IP del cliente de `x-forwarded-for` (header que Vercel agrega automáticamente). Si la cabecera tiene múltiples IPs (`client, proxy1, proxy2`), toma la primera. Fallback a `x-real-ip`. Si nada está disponible, usa `'unknown'` (todos los requests sin IP comparten bucket).

### Integración en `/api/auth/login`

```ts
const ip = getClientIp(request)
const rl = await checkAdminLoginRateLimit(ip)
if (!rl.success) {
  return NextResponse.json(
    { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
    {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSeconds) },
    }
  )
}
```

**Importante:** el chequeo está **antes** de leer el body o ejecutar bcrypt. Eso protege contra:
1. **Brute force** — el atacante gasta su cuota sin siquiera llegar a la comparación.
2. **DoS por costo de bcrypt** — bcrypt factor 12 toma ~250ms por hash. 100 requests/seg sin rate limit consumen mucha CPU.

---

## Cómo funciona Upstash Redis

### Qué es Upstash

[Upstash](https://upstash.com) es un servicio de Redis serverless. La diferencia con Redis tradicional:

| Aspecto | Redis tradicional | Upstash |
|---|---|---|
| Conexión | TCP persistente | HTTP REST |
| Compatibilidad | Cualquier cliente Redis | Solo HTTP/REST |
| Pricing | Por instancia/hora | Pay-per-request |
| Serverless friendly | No (conexiones largas) | Sí (cada request es independiente) |

Para Vercel/Next.js (que es serverless), HTTP REST es ideal: cada función Lambda hace su request HTTP a Upstash sin mantener pools de conexión TCP.

### Plan free actual

- 10,000 commands por día (más que suficiente para login admin pre-launch)
- 256 MB database
- Sub-ms latency desde regiones cercanas (us-east-1)
- Sin tarjeta de crédito

### Cómo Upstash implementa el sliding window

El algoritmo `Ratelimit.slidingWindow(5, '15 m')` de `@upstash/ratelimit`:

1. Cada request a `limiter.limit(ip)` ejecuta atómicamente en Redis:
   - Incrementa un contador para esa IP en una ventana deslizante de 15 min.
   - Setea TTL automático para que la entrada expire sola.
2. Si el conteo ≤ 5 → `success: true`, devuelve `remaining` (cuántos requests quedan).
3. Si el conteo > 5 → `success: false`, devuelve `reset` (timestamp Unix ms de cuándo se libera).

**Atomicidad:** Upstash usa operaciones Redis atómicas (`INCR` + `EXPIRE`). Sin race conditions entre check y record.

**Por qué sliding window (no fixed):**
- Fixed window tiene burst al cambio: 5 requests al final del minuto + 5 al inicio del siguiente = 10 en pocos segundos.
- Sliding window distribuye la cuota: si gastaste 5 en el minuto 0-1, el minuto 1-2 cuenta los últimos 14 min, etc.

### Estructura de claves en Redis

Cada IP genera claves con el prefix `rl:admin-login:`:
```
rl:admin-login:200.115.xxx.xxx
rl:admin-login:200.115.xxx.xxx:<window-id>
```

Pueden inspeccionarse desde el dashboard de Upstash:
- **Data Browser** (UI visual)
- **CLI** (Redis-CLI integrado): `KEYS rl:admin-login:*`, `TTL rl:admin-login:...`, `DEL rl:admin-login:...`

**Para resetear el rate limit manualmente** (útil en testing local):
```
KEYS rl:admin-login:*
DEL <pegar las claves>
```
O `FLUSHDB` (borra TODA la database — solo en dev).

### Analytics

Con `analytics: true` en el config del Ratelimit, Upstash dashboard muestra:
- Cuántos requests pasaron / fueron bloqueados
- Por hora / día / semana
- Por IP (top abusers)

Útil para detectar ataques en curso post-launch.

### Fail-OPEN — decisión embutida

Si Upstash cae (red, downtime, error de auth), el helper retorna `success: true` sin tirar excepción. **Decisión consciente:**

- **Pro:** el sistema sigue funcionando aunque Upstash tenga 1 hora de downtime.
- **Contra:** durante esa hora no hay protección rate limit.

Mitigación: bcrypt factor 12 + password fuerte siguen siendo la primera línea. Un atacante no puede forzar fail-open (Upstash es servicio externo confiable). Si Upstash cae, el log queda en Vercel para investigar.

**Alternativa descartada (fail-CLOSE):** si Upstash cae → todos los logins fallan globalmente. Más seguro contra atacantes pero rompe el sistema por una falla de un servicio externo. No vale la pena para un login admin con 1 user.

---

## Capa 2 — Hash de password con bcrypt

### Por qué bcrypt

Comparar password contra plaintext (`password === process.env.ADMIN_PASSWORD`) significa que **si el `.env` filtra**, el atacante ve la password real. Con bcrypt, el `.env` solo guarda el HASH (derivado y no reversible).

### Implementación

`backend/app/api/auth/login/route.ts`:

```ts
import bcrypt from 'bcryptjs'

const expectedUser = process.env.ADMIN_USER
const rawHash = process.env.ADMIN_PASSWORD_HASH ?? ''

if (!expectedUser || !rawHash) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Acepta hash bcrypt crudo ($2b$12$...) o codificado en base64
const passwordHash = rawHash.startsWith('$2') && rawHash.length >= 50
  ? rawHash
  : Buffer.from(rawHash, 'base64').toString('utf-8')

if (user === expectedUser && bcrypt.compareSync(password, passwordHash)) {
  // ... emitir sesión
}
```

### Factor de costo

`bcrypt.hashSync(password, 12)` con factor 12 = ~4096 iteraciones (2^12). Cada comparación toma ~250ms. Eso es **lento a propósito**:
- Para el usuario legítimo: imperceptible (1 login = 250ms).
- Para el atacante: 1000 intentos por minuto en una sola CPU. Combinado con rate limit (5/15min), inviable.

### Por qué hash en base64

Next.js 16 con Turbopack tiene un parser de `.env.local` que **expande variables `$VAR` incluso dentro de comillas simples**. El hash bcrypt empieza con `$2b$12$...` — el parser lo lee como `expand($2b)` + `expand($12)` + resto, y el hash queda truncado.

**Solución:** codificar el hash en base64 al guardarlo. Base64 no contiene `$`, así que ningún parser lo toca.

```powershell
node -e "const b=require('bcryptjs');const h=b.hashSync('PASSWORD',12);console.log(Buffer.from(h).toString('base64'))"
```

El resultado (~80 chars, sin `$`) se pega en `.env.local` y Vercel sin comillas, sin escapes. El código en runtime decodifica con `Buffer.from(rawHash, 'base64').toString('utf-8')` y obtiene el hash original.

**Defensa en profundidad:** el código acepta tanto crudo como base64 (`startsWith('$2') && length >= 50`). Si en el futuro Vercel preserva los `$` literales, el valor crudo sigue funcionando.

### Rotación de password

La password admin se rota cuando:
- Hay sospecha de filtrado (ej. el hash apareció en logs/screenshots).
- Cambio de personal con acceso al admin.
- Cada 90 días como buena práctica (recomendación, no obligatorio aún).

Para rotar:
1. Generar nuevo hash con el comando `node -e ...` arriba (con la nueva password).
2. Actualizar `ADMIN_PASSWORD_HASH` en Vercel (3 entornos) y `.env.local`.
3. Probar login con la nueva password.
4. La password vieja queda automáticamente quemada (el hash nuevo no matchea).

---

## Capa 3 — Sesión JWT con cookie segura

### Por qué JWT

Un JWT firmado con `SESSION_SECRET` (32+ bytes hex aleatorios) es **stateless**: no requiere tabla de sesiones en DB. El servidor verifica criptográficamente la firma en cada request.

**Alternativa descartada (sesión en Supabase):**
- Requiere round-trip a la DB en cada request.
- Más lento para el dashboard admin (que hace muchas queries).
- Innecesario para 1 admin user.

### Implementación — `backend/lib/session.ts`

```ts
import { SignJWT, jwtVerify } from 'jose'

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload.role === 'admin'
  } catch {
    return false
  }
}
```

- **Algoritmo:** HS256 (HMAC-SHA256 simétrico). Suficiente para 1 admin user.
- **Expiración:** 8 horas. Después de eso, el token se rechaza y el admin debe volver a loguearse.
- **Revocación:** rotando `SESSION_SECRET` se invalidan todos los JWT vivos.

### Cookie `admin_session`

El JWT se guarda en una cookie con flags reforzados:

```ts
response.cookies.set('admin_session', token, {
  httpOnly: true,        // JS del browser NO la lee (anti XSS)
  secure: true,          // Solo se envía sobre HTTPS (anti MITM)
  sameSite: 'strict',    // No se envía en cross-origin (anti CSRF)
  maxAge: 60 * 60 * 8,   // 8 horas
  path: '/',
})
```

**Cambios respecto a la versión anterior:**
- `secure: true` (era `process.env.NODE_ENV === 'production'`) — hardcoded para evitar que un preview sin la env var envíe la cookie sobre HTTP por error.
- `sameSite: 'strict'` (era `'lax'`) — más estricto: la cookie no se manda si el request viene de otro dominio.

### Validación en cada request — `backend/middleware.ts`

```ts
if (pathname.startsWith('/admin')) {
  const session = request.cookies.get('admin_session')
  if (!session?.value || !(await verifyAdminToken(session.value))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

Cada request a `/admin/*` verifica:
1. Que la cookie exista.
2. Que el JWT sea válido (firma correcta + no expirado).

Si falla, redirige a `/login`.

---

## Frontend — UX del bloqueo

`backend/app/login/page.tsx` distingue 4 status codes y reacciona de forma diferente:

| Status | Mensaje | UI |
|---|---|---|
| 200 | (ninguno, redirect a /admin) | — |
| 401 | "Usuario o contraseña incorrectos." | Inputs habilitados, botón "Entrar" |
| 429 | "Demasiados intentos. Esperá `MM:SS` antes de intentar de nuevo." | Inputs gris (deshabilitados), botón gris "Bloqueado (`MM:SS`)" |
| Otro / red | "Error inesperado." / "Error de conexión." | Inputs habilitados, botón "Entrar" |

### Countdown del bloqueo (429)

El frontend lee el header `Retry-After` (segundos) y arranca un `setInterval` que decrementa cada segundo. Mientras `blockedSeconds > 0`:
- Inputs `disabled`.
- Botón muestra `Bloqueado (12:34)` con `MM:SS` actualizándose.
- Si el usuario apreta Enter o submit, el form ignora el evento (return early).

Al llegar a 0:
- El interval se limpia automáticamente.
- Inputs y botón se rehabilitan.
- El usuario puede reintentar.

### Por qué el frontend distingue 401 de 429

Antes del fix de 2026-05-08, el frontend mostraba "Usuario o contraseña incorrectos" en cualquier error que no fuera 200. Eso enmascaraba completamente el bloqueo: el atacante no sabía si estaba bloqueado o si la password seguía siendo incorrecta. El usuario legítimo bloqueado tampoco entendía qué pasaba.

Ahora el bloqueo es **explícito** y el usuario ve el countdown — UX honesta sin filtrar info al atacante (el atacante igual ve el 429 en DevTools).

---

## Configuración

### Variables de entorno

| Variable | Dónde | Valor |
|---|---|---|
| `ADMIN_USER` | Vercel + .env.local | username del admin |
| `ADMIN_PASSWORD_HASH` | Vercel + .env.local | hash bcrypt en base64 (~80 chars) |
| `SESSION_SECRET` | Vercel + .env.local | 32+ bytes hex aleatorios |
| `UPSTASH_REDIS_REST_URL` | Vercel + .env.local | https://xxx-xxx.upstash.io |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel + .env.local | token largo (secreto) |

**Eliminadas (ya no se usan):**
- `ADMIN_PASSWORD` (plaintext) — eliminada de Vercel + .env.local el 2026-05-08

### Archivos del proyecto

| Archivo | Rol |
|---|---|
| `backend/app/api/auth/login/route.ts` | Endpoint POST /api/auth/login |
| `backend/app/api/auth/logout/route.ts` | Endpoint POST /api/auth/logout (limpia cookie) |
| `backend/lib/session.ts` | createAdminToken / verifyAdminToken con jose |
| `backend/lib/rate-limit.ts` | Helper Upstash con sliding window |
| `backend/middleware.ts` | Valida JWT en cada request a /admin/* |
| `backend/app/login/page.tsx` | UI del login con countdown 401/429 |

---

## Cómo verificar / debuggear

### Verificar deploy en producción

1. Login con password correcta → debe entrar al panel.
2. Logout.
3. 5 intentos con password mal → cada uno responde 401.
4. 6to intento → debe mostrar countdown ~14 min, inputs grises, botón "Bloqueado".

### Si el rate limit no bloquea

Posibles causas:
- `UPSTASH_REDIS_REST_URL/TOKEN` no configurados en Vercel → log dice `[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN faltantes — fail-open`.
- Upstash database caída → log dice `[rate-limit] Upstash error, fail-open: <error>`.
- Browser cacheó el JS viejo del frontend → hard refresh con `Ctrl+Shift+R`.

Verificar logs en Vercel → Deployments → click en deploy actual → pestaña "Logs" → filtrar por última request a `/api/auth/login`.

### Si la password buena no funciona

Posibles causas:
- `ADMIN_PASSWORD_HASH` mal pegado en Vercel (espacios, comillas, saltos de línea).
- Hash truncado por parser dotenv en local — agregar comillas simples NO siempre funciona, usar formato base64.
- Password rotada y `.env.local` quedó con el hash viejo — re-pegar el hash actual.

### Resetear rate limit manualmente

En Upstash CLI (dashboard → tu database → CLI tab):

```
KEYS rl:admin-login:*           # listar claves de rate limit
DEL <pegar las claves>          # borrar específicas
FLUSHDB                          # borrar TODA la database (solo dev)
```

---

## Pendientes / próximos pasos

**Extender rate limiting a otros endpoints públicos** (ítem `[ ]` en `contexto` Etapa 14):
- `/api/orders` — 10 requests / hora / IP
- `/api/chat` — 30 requests / hora / IP
- `/api/contact` (si existe)

Receta para agregar rate limit a un endpoint nuevo:

1. En `backend/lib/rate-limit.ts` agregar un nuevo limiter (mismo patrón que `getAdminLoginLimiter`):
   ```ts
   let cachedOrdersLimiter: Ratelimit | null = null
   function getOrdersLimiter() { /* ... */ }
   export async function checkOrdersRateLimit(ip: string) { /* ... */ }
   ```
   Con prefix distinto: `rl:orders` / `rl:chat` / etc.

2. En el route handler del endpoint:
   ```ts
   const ip = getClientIp(request)
   const rl = await checkOrdersRateLimit(ip)
   if (!rl.success) {
     return NextResponse.json({ error: '...' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
   }
   ```

3. Probar local (5 requests rápidas → 6to bloquea).
4. Commit + push + verificar en producción.

**Otros bloques de Etapa 14 pendientes:**
- 5 security headers globales (CSP, HSTS, X-Frame, Referrer, Permissions, nosniff) en `backend/next.config.ts`
- Cookie Consent + Consent Mode v2 (CCPA/GDPR)
- Validación zod en endpoints POST públicos
- Audit trail admin (tabla `admin_audit_log`)
- RLS audit en Supabase
- npm audit fix (6 vulnerabilities preexistentes)
- Dependabot

---

## Decisiones embutidas

| Decisión | Por qué |
|---|---|
| bcrypt factor 12 | Costo ~250ms por hash. Imperceptible para usuario legítimo, inviable para brute force. Estándar de la industria. |
| Hash en base64 (no crudo) | Next.js 16 con Turbopack expande `$VAR` en .env.local incluso con comillas simples. Base64 no tiene `$`. |
| Rate limit 5/15min sliding window | Equilibrio entre tolerar typos del admin (5 intentos) y bloquear brute force. Sliding > fixed (sin burst). |
| Fail-OPEN si Upstash cae | Mejor login funcional que sistema globalmente caído. bcrypt + password fuerte siguen como primera línea. |
| Rate limit ANTES de bcrypt | Protege contra DoS por costo de hash. El atacante gasta cuota sin ejecutar hash caro. |
| JWT stateless (no DB sessions) | 1 admin user no justifica round-trip a DB en cada request. Revocación vía rotar SESSION_SECRET. |
| Sesión 8h | Compromiso entre conveniencia y exposición si la cookie se intercepta. |
| Cookie sameSite: 'strict' | Más estricto que 'lax'. Anti-CSRF total. El admin no necesita login desde otros dominios. |
| Cookie secure: true hardcoded | No condicional a NODE_ENV. Un preview mal configurado podría enviar cookie por HTTP. |
| Frontend distingue 401 de 429 | UX honesta. El atacante igual ve el 429 en DevTools — no filtra info adicional, pero el usuario legítimo entiende por qué está bloqueado. |
| Eliminado ADMIN_PASSWORD plaintext de Vercel | Una vez probado bcrypt en prod, el plaintext se elimina. Cero superficie de ataque por filtrado de .env. |

---

## Historial de implementación

| Fecha | Commit | Cambio |
|---|---|---|
| 2026-05-08 | `d06992d` | bcrypt + cookie flags reforzados (Bloque 1A) |
| 2026-05-08 | `c3e2eff` | docs: marcar Bloque 1A en contexto |
| 2026-05-08 | `f7c6887` | Rate limiting con Upstash + UX countdown 401/429 (Bloque 1B) |
| 2026-05-08 | `388f86a` | docs: marcar Bloque 1B en contexto |
| 2026-05-08 | `b8c6498` | docs: marcar 3 items verificados (HMAC Stripe, NEXT_PUBLIC, .gitignore) |

---

## Relacionados

- `LOGICA_DE_NEGOCIO/07_panel_admin.md` — funcionalidad del panel (qué hace una vez autenticado)
- `LOGICA_DE_NEGOCIO/08_portal_cliente.md` — auth del cliente (sistema separado del admin)
- `contexto` — Etapa 14 (Hardening de Seguridad de la App) con todos los items del bloque
- `security/auditoria_mensual.md` — auditoría OWASP previa al refactor
