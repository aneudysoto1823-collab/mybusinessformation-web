# Auditoría de Seguridad — Histórico

> Histórico acumulado de auditorías OWASP Top 10 y correcciones aplicadas al proyecto MyBusinessFormation Web.
> Cada sesión se anexa al inicio. No se borra el histórico anterior.
> Ver `README.md` y `plantilla_auditoria.md` en esta misma carpeta para el proceso completo.

---

## Sesión: 2026-04-01

### Contexto

Auditoría completa OWASP Top 10 ejecutada sobre el stack:
**Next.js + Express (Railway) + Supabase + Prisma + Stripe + Resend**
**Deploy**: Vercel (frontend) + Railway (backend Express)

Se encontraron **20 vulnerabilidades** (4 CRÍTICAS, 5 ALTAS, 7 MEDIAS, 4 BAJAS).
Reporte completo original: `SECURITY_AUDIT.md` en la raíz del proyecto (en el momento de la auditoría).

---

### Vulnerabilidades corregidas

#### CRIT-3 — Sesión admin reemplazada por JWT firmado
**OWASP**: A07 — Authentication Failures
**Severidad**: 🔴 CRÍTICA
**Estado**: CORREGIDO (commit `c2ed7d8`)

El middleware solo verificaba que la cookie `admin_session` existiera, no su valor. Cualquier cookie con ese nombre daba acceso al panel.

**Archivos modificados**:
- `backend/lib/session.ts` — nuevo helper con `createAdminToken` / `verifyAdminToken` (librería `jose`, algoritmo HS256)
- `backend/app/api/auth/login/route.ts` — genera JWT firmado con expiración de 8h
- `backend/middleware.ts` — verifica criptográficamente el token antes de dar acceso

**Variable de entorno añadida**: `SESSION_SECRET` en Vercel y Railway.

---

#### CRIT-2 — API Express protegida con API key
**OWASP**: A01 — Broken Access Control
**Severidad**: 🔴 CRÍTICA
**Estado**: CORREGIDO (commit `0381d62`)

El servidor Express exponía todos los endpoints sin autenticación. Cualquiera podía leer todas las órdenes, cambiar estados, o enviar emails a clientes.

**Archivos modificados**:
- `backend/server.ts` — middleware `requireApiKey` en `app.use('/api', ...)`
- `backend/lib/backend.ts` — helper `backendFetch()` que inyecta `INTERNAL_API_KEY` server-side

**Variable de entorno añadida**: `INTERNAL_API_KEY` en Railway (Express) y Vercel (Next.js).

---

#### ALTO-5 — CORS restringido al dominio de Vercel
**OWASP**: A05 — Security Misconfiguration
**Severidad**: 🟠 ALTA
**Estado**: CORREGIDO (commit `0381d62` — mismo commit que CRIT-2)

`cors()` sin opciones aceptaba peticiones de cualquier origen (`Access-Control-Allow-Origin: *`).

**Archivo modificado**:
- `backend/server.ts` — CORS restringido a `https://opabiz.com`
- `/health` simplificado — ya no revela qué servicios están configurados

---

#### CRIT-4 — Whitelist de campos en `saveOrder`
**OWASP**: A03 — Injection / Mass Assignment
**Severidad**: 🔴 CRÍTICA
**Estado**: CORREGIDO (commit `11b1e98`)

`req.body` completo se pasaba a `prisma.order.create()`. Un atacante podía enviar `{ "paymentStatus": "paid" }` para marcar una orden como pagada sin pagar.

**Archivos modificados**:
- `backend/modules/orders/orders.service.ts` — DTO explícito `CreateOrderInput`, campos uno por uno
- `backend/modules/orders/orders.controller.ts` — destructuring de `req.body` antes del service

`paymentStatus` y `status` nunca vienen del cliente — usan los defaults del schema de Prisma.

---

#### ALTO-3 — `GET /api/orders` en Next.js protegido
**OWASP**: A01 — Broken Access Control
**Severidad**: 🟠 ALTA
**Estado**: CORREGIDO (commit `a78979b`)

El endpoint devolvía todos los registros de la tabla Order a cualquier petición GET sin verificar ninguna autenticación.

**Archivo modificado**:
- `backend/app/api/orders/route.ts` — verifica `admin_session` JWT antes de responder

**Corrección adicional — client-auth rediseñado** (commit `1d7e318`):
El login del portal de cliente dependía de `GET /api/orders` (descargaba todos los registros para buscar en memoria). Se reemplazó por una query Supabase filtrada directamente por email:
- Solo toca las filas del email ingresado
- Nunca expone datos de otros clientes
- Mensaje genérico `"Invalid credentials"` — no revela si el email existe

---

### Proxies server-side creados (parte de CRIT-2)

El panel de admin (`admin/orders/[id]/page.tsx`) es un Client Component que hacía fetch directo al Express con `NEXT_PUBLIC_BACKEND_URL`. Poner la API key en el bundle JS la habría expuesto a cualquier visitante.

**Solución**: 4 rutas proxy en `app/api/proxy/` que actúan de intermediarias.
El cliente llama al proxy de Next.js → el proxy añade la API key → llama al Express.
La key nunca sale del servidor.

| Proxy | Método | Destino Express |
|-------|--------|-----------------|
| `/api/proxy/orders/[id]` | GET, PATCH | `/api/orders/:id` |
| `/api/proxy/notifications/[type]` | POST | `/api/notifications/:type` |
| `/api/proxy/names/check` | GET | `/api/names/check` |
| `/api/proxy/documents/[orderId]/[endpoint]` | GET (stream PDF) | `/api/documents/:id/:endpoint` |

Cada proxy verifica la sesión admin antes de reenviar la petición.

---

### Pendientes que quedaron de esta sesión

| ID | Severidad | Descripción |
|----|-----------|-------------|
| MED-7 | 🟡 MEDIA | Implementar webhook de Stripe con validación de firma |
| MED-6 | 🟡 MEDIA | Añadir cabeceras de seguridad HTTP en `next.config.ts` (CSP, HSTS, X-Frame-Options) |
| MED-5 | 🟡 MEDIA | Token HMAC en endpoint `/api/unsubscribe` |
| ALTO-4 | 🟠 ALTA | Rate limiting en `/api/client-auth` contra fuerza bruta |
| MED-2 | 🟡 MEDIA | Restringir uso de `service_role` key solo a endpoints admin verificados |

> Nota: la mayoría de estos pendientes fueron abordados en Etapa 14 (sprints de mayo 2026) — ver `CONTEXTO.md` para el estado actual.
