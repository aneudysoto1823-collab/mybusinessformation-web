# Plantilla — Auditoría OWASP Top 10

> Copiá esta plantilla al inicio de `auditoria_mensual.md` cuando empieces una nueva sesión de auditoría. No editar la plantilla directamente — siempre se trabaja en `auditoria_mensual.md`.

---

## Sesión: YYYY-MM-DD

### Contexto

- **Auditor**: <nombre>
- **Stack auditado**: Next.js 16 + Express (Railway) + Supabase + Stripe + Resend
- **Deploys**: Vercel (frontend + API pública) + Railway (Express interno)
- **Alcance de esta sesión**: <descripción — p.ej. "OWASP Top 10 completa", "solo headers + deps", "solo auth y pagos">
- **Commits desde la última auditoría**: <range — p.ej. `abc123..def456`>

### Resumen ejecutivo

> Llenar al final de la auditoría.

- Total de hallazgos: <N> (🔴 <n> · 🟠 <n> · 🟡 <n> · 🟢 <n>)
- Corregidos en esta sesión: <N>
- Pendientes para próxima sesión: <N>
- Recomendación general: <una línea>

---

## A01 — Broken Access Control

> Verificar: middleware de auth, ownership de recursos, IDOR, server-side checks, RLS en Supabase.

<!-- HALLAZGOS A01 -->

---

## A02 — Cryptographic Failures

> Verificar: cookies (`httpOnly`, `Secure`, `SameSite`), JWT secrets, hashes de passwords (bcrypt rounds ≥ 10), TLS, secretos en el bundle, datos sensibles en logs.

<!-- HALLAZGOS A02 -->

---

## A03 — Injection

> Verificar: SQL injection (Prisma + Supabase parametrizados), mass-assignment, XSS reflejado/almacenado, HTML escaping en emails, command injection en scrapers.

<!-- HALLAZGOS A03 -->

---

## A04 — Insecure Design

> Verificar: rate-limiting en endpoints públicos, validación con Zod en POST públicos, separación de roles, principio de menor privilegio.

<!-- HALLAZGOS A04 -->

---

## A05 — Security Misconfiguration

> Verificar: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CORS estricto, banners de servidor, error pages que no revelen stack, `NODE_ENV=production` en deploys.

<!-- HALLAZGOS A05 -->

---

## A06 — Vulnerable and Outdated Components

> Verificar: `npm audit` (sin `--production` para incluir devDeps), Dependabot activo, versiones de Next.js / Stripe / Supabase SDKs / Sentry. Documentar vulnerabilidades aceptadas con justificación.

<!-- HALLAZGOS A06 -->

---

## A07 — Identification and Authentication Failures

> Verificar: rate-limit en `/api/auth/login` y `/api/client-auth`, bcrypt para passwords, expiración de sesión, rotación de tokens, mensajes genéricos en errores (no revelar si el usuario existe), prevención de session fixation.

<!-- HALLAZGOS A07 -->

---

## A08 — Software and Data Integrity Failures

> Verificar: validación de firma en webhooks (Stripe `STRIPE_WEBHOOK_SECRET`), integridad de URLs firmadas (tokens HMAC en unsubscribe / certificados), CI/CD sin dependencias no verificadas.

<!-- HALLAZGOS A08 -->

---

## A09 — Security Logging and Monitoring Failures

> Verificar: Sentry activo (sin PII), BetterStack uptime, audit log de acciones admin (`admin_audit_log`), alertas de errores críticos, retención de logs.

<!-- HALLAZGOS A09 -->

---

## A10 — Server-Side Request Forgery (SSRF)

> Verificar: endpoints que aceptan URLs (proxies, scrapers Sunbiz), whitelist de dominios destino, validación de IPs internas, timeouts.

<!-- HALLAZGOS A10 -->

---

## Plantilla de hallazgo individual

> Copiar/pegar para cada hallazgo encontrado. Sustituir placeholders.

```markdown
#### <ID> — <título corto del problema>
**OWASP**: A0X — <nombre de categoría>
**Severidad**: 🔴 CRÍTICA | 🟠 ALTA | 🟡 MEDIA | 🟢 BAJA
**Estado**: ABIERTO | EN PROGRESO | CORREGIDO (commit `xxxxxxx`) | ACEPTADO (justificar)

**Descripción**
<qué pasa, cómo se reproduce, qué impacto tiene>

**Archivos afectados**
- `path/al/archivo.ts` — <qué hay que cambiar ahí>
- `path/al/otro.ts` — <qué hay que cambiar ahí>

**Plan de fix**
<paso a paso concreto de la corrección — qué se cambia, qué env vars hay que añadir, qué tests hay que correr>

**Validación post-fix**
- [ ] <smoke test 1>
- [ ] <smoke test 2>

**Notas**
<cualquier contexto adicional — referencias OWASP, links a issues, decisiones tomadas>
```

---

## Pendientes para próxima sesión

> Hallazgos no corregidos en esta sesión, ordenados por prioridad.

| ID | Severidad | OWASP | Descripción | Razón de aplazar |
|----|-----------|-------|-------------|------------------|
| <ID> | 🟡 MEDIA | A05 | <una línea> | <p.ej. "espera credencial de Fabián"> |
