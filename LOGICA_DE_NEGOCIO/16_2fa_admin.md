# Proceso 16 — 2FA del Admin (autenticación de 2 factores)

## Qué es el 2FA en palabras simples

**2FA significa que para entrar al panel de admin no alcanza con la password — hay que dar también un segundo dato que solo el admin tiene en ese momento.**

Antes (sin 2FA):
- Admin escribe usuario + password → entra al panel.
- Si alguien roba la password → entra como si fuera el admin.

Ahora (con 2FA activo):
- Admin escribe usuario + password.
- Pantalla nueva: "Ingresá el código de 6 dígitos."
- El código sale de **una app en el teléfono del admin** (Google Authenticator / Authy / 1Password) o **un email enviado a `admin@mybusinessformation.com`**.
- Solo si el código es correcto, entra al panel.
- Si alguien roba la password pero NO tiene el teléfono del admin ni acceso al inbox → no entra.

Es la misma lógica que usan los bancos cuando te piden el código del SMS o de la app del banco.

---

## Cómo funciona el flujo paso a paso

### Si el admin NO tiene 2FA activo

Igual que antes:
1. `POST /api/auth/login` con user + password.
2. Rate limit (5/15min/IP) y bcrypt validan.
3. Si pasa → cookie `admin_session` de 8 h directa.
4. Entra al panel.

### Si el admin SÍ tiene 2FA activo

1. `POST /api/auth/login` con user + password.
2. Rate limit y bcrypt validan.
3. **No genera la sesión completa todavía.** En su lugar:
   - Crea una **cookie temporal `admin_pending`** de 5 min con un JWT que dice `{ role: 'admin_pending', methods: ['totp', 'email'] }`.
   - Devuelve al frontend `{ ok: true, requiresTwoFactor: true, methods: ['totp', 'email'] }`.
4. El frontend redirige al admin a `/login/verify`.
5. En `/login/verify`:
   - Pantalla nueva donde el admin elige el método (TOTP o email).
   - Si elige email → `POST /api/auth/2fa-send-email` dispara un email con código de 6 dígitos al inbox.
   - Admin ingresa el código y submitea.
6. `POST /api/auth/2fa-verify` valida el código. Si es correcto:
   - Crea la cookie `admin_session` de 8 h (la sesión real).
   - Borra la cookie `admin_pending`.
   - Permite entrar al panel.
7. Si el código es incorrecto → 401, queda en `/login/verify`.

### Protección del paso 2

El middleware (`backend/middleware.ts`) verifica:
- `/admin/*` → exige cookie `admin_session` válida.
- **`/login/verify`** → exige cookie `admin_pending` válida (sin password no podés llegar a la página de código).
- Si la cookie pending expira (5 min) → redirige a `/login` y arranca de cero.

---

## Los 2 métodos de 2FA

### Método 1 — TOTP (Time-based One-Time Password)

Es lo estándar de la industria. Funciona con apps en el celular: **Google Authenticator, Authy, 1Password, Microsoft Authenticator**.

**Cómo se configura:**
1. Admin entra a `/admin/security` (ya logueado).
2. Click en "Activar TOTP".
3. La app del backend genera un secreto único (32 bytes random base32).
4. Se muestra un **código QR** en pantalla + el secreto en texto.
5. Admin abre Google Authenticator → escanea el QR (o pega el secreto a mano).
6. La app empieza a generar códigos de 6 dígitos cada 30 segundos.
7. Admin ingresa un código de prueba para confirmar.
8. Se activa el flag `totp_enabled = true` en la DB.

**Por qué funciona offline:**
TOTP es un algoritmo determinístico: con el mismo secreto compartido y el mismo timestamp, ambos lados (la app del admin y nuestro backend) generan el mismo código. **No requiere internet en el celular** — solo que la hora del celular esté sincronizada.

**Ventana de tolerancia:**
El backend acepta el código actual + el código anterior + el siguiente (window: 1 con periodos de 30s). Eso da margen si los relojes están desincronizados unos segundos.

### Método 2 — Email code

Como fallback (o si el admin no quiere instalar app):

1. Admin entra a `/login/verify` después de validar password.
2. Click en "Enviar código por email".
3. `POST /api/auth/2fa-send-email`:
   - Genera código random de 6 dígitos (`Math.floor(100000 + Math.random() * 900000)`).
   - Guarda **el hash SHA-256** del código en la DB (no el código en plaintext).
   - Setea expiración a **10 minutos**.
   - Envía email vía Resend con template profesional al inbox del admin.
4. Admin lee el email, copia el código, lo pega en `/login/verify`.
5. Backend hace SHA-256 del código que el admin ingresó y compara con el hash guardado.
6. Si coincide y no expiró → válido, entra al panel.
7. Después de validar, **el código se borra de la DB** (no se reusa).

**Limitaciones del email:**
- Depende de que Resend esté operativo.
- Hay 10 minutos de ventana — si el email tarda mucho en llegar, puede expirar.
- Menos seguro que TOTP porque si el inbox del admin se compromete, el atacante también recibe el código.

**Recomendación:** activar **ambos** métodos. TOTP como principal (más seguro) y email como fallback si el admin pierde el celular o cambia de dispositivo.

---

## Tabla nueva en Supabase

`admin_security_config` — una sola fila (id = 1) que guarda toda la config del 2FA:

| Campo | Tipo | Para qué sirve |
|---|---|---|
| `id` | int (PK) | Siempre 1, es una fila única |
| `totp_enabled` | bool | Si TOTP está activo |
| `email_enabled` | bool | Si email code está activo |
| `totp_secret` | text | Secreto TOTP **encriptado** con AES-256-CBC |
| `email_pending_code` | text | Hash SHA-256 del último código enviado por email |
| `email_code_expires_at` | timestamp | Cuándo expira ese código (10 min) |
| `updated_at` | timestamp | Última modificación de la config |

**Por qué una sola fila:** hay UN solo admin (al menos por ahora). Si en el futuro hay varios admins con login distinto, esta tabla se rediseña con `id` ligado al user.

---

## Encriptación del TOTP secret

El secreto TOTP es la "llave maestra" del 2FA — si alguien lo roba, puede generar todos los códigos del admin. Por eso **NO se guarda en plaintext en la DB**:

- **Algoritmo:** AES-256-CBC.
- **Llave:** `ENCRYPTION_KEY` env var — 64 caracteres hex (= 32 bytes).
- **IV:** aleatorio de 16 bytes por cada encrypt (no se reusa).
- **Formato guardado:** `<IV-hex>:<ciphertext-hex>` (string único separado por `:`).
- **Helpers en `backend/lib/encryption.ts`:** `encrypt(text)`, `decrypt(text)`, `generateEncryptionKey()`.

**Si la `ENCRYPTION_KEY` se rota:** los TOTP secrets actuales se vuelven ilegibles (no se pueden desencriptar). Hay que regenerar el TOTP del admin escaneando un QR nuevo.

**Por qué no se hashea:** el TOTP secret se necesita en su forma original para validar códigos (algoritmo determinístico). Por eso se encripta (reversible) en lugar de hashear (irreversible) como el email code.

---

## Cómo se configura todo (paso a paso para el admin)

### Primera vez activando 2FA

1. **Admin entra al panel logueado** (sin 2FA todavía).
2. Va a `/admin/security`.
3. **Activa TOTP:**
   - Click "Setup TOTP" → backend genera secret + QR.
   - Admin escanea el QR con Google Authenticator / Authy.
   - Activa el toggle `totp_enabled = true`.
4. **(Opcional) Activa email:**
   - Toggle `email_enabled = true`.
   - El email destinatario es `ADMIN_EMAIL` (env var) o `ADMIN_USER` como fallback.
5. Logout.
6. **Próximo login:** después de password, redirige a `/login/verify` y pide código.

### Para cambiar el QR (cambio de celular)

1. Admin entra al panel logueado.
2. `/admin/security` → click "Setup TOTP" otra vez.
3. Genera secret nuevo + QR nuevo.
4. Escanea con la nueva app.
5. El secret viejo queda obsoleto (sobrescrito en DB).

### Para deshabilitar 2FA temporalmente

1. Admin entra logueado (con 2FA actual).
2. `/admin/security` → toggle off `totp_enabled` y `email_enabled`.
3. Próximo login: solo password, directo al panel.

⚠️ **Si el admin pierde el celular Y no tiene email activo:**
- No puede entrar al panel.
- **Solución:** Fabián u Ethan acceden a Supabase directo y cambian `totp_enabled = false` en la tabla. Después el admin entra solo con password y reconfigura.

---

## Variables de entorno

| Variable | Para qué sirve | Estado |
|---|---|---|
| `ENCRYPTION_KEY` | 64 chars hex (32 bytes) — encripta el TOTP secret | Pendiente confirmar en Vercel |
| `ADMIN_EMAIL` | Destinatario del email code (si no, fallback a `ADMIN_USER`) | Pendiente confirmar |
| `RESEND_API_KEY` | Para mandar el email del 2FA | ✅ Activa (ya se usaba) |
| `SESSION_SECRET` | Firma el JWT pending (mismo que el JWT admin) | ✅ Activa |
| `ADMIN_USER` | Username del admin | ✅ Activa |
| `ADMIN_PASSWORD_HASH` | Bcrypt del password | ✅ Activa |

**Generar `ENCRYPTION_KEY`** (correr una vez):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Te imprime 64 chars hex. Pegalo en Vercel + `.env.local`.

---

## Archivos del proyecto

| Archivo | Rol |
|---|---|
| `backend/lib/twofa.ts` | Helper principal: get/update config, save/get TOTP secret encriptado, save/verify email code hasheado |
| `backend/lib/totp.ts` | Wrapper sobre `otpauth`: `generateTotpSecret()`, `generateTotpUri()`, `verifyTotpCode()` con window: 1 |
| `backend/lib/encryption.ts` | AES-256-CBC: `encrypt()`, `decrypt()`, `generateEncryptionKey()` |
| `backend/lib/session.ts` | JWT helpers — agregado `createPendingToken(methods)` (5 min) y `verifyPendingToken()` |
| `backend/app/api/auth/login/route.ts` | Login modificado: si pasa bcrypt y hay 2FA activo → genera `admin_pending` en lugar de `admin_session` |
| `backend/app/api/auth/2fa-config/route.ts` | GET (devuelve config) y PATCH (activa/desactiva flags). Requiere admin logueado |
| `backend/app/api/auth/2fa-setup/route.ts` | POST: genera nuevo TOTP secret + QR data URL para escanear |
| `backend/app/api/auth/2fa-send-email/route.ts` | POST: genera código random + guarda hash + manda email con Resend |
| `backend/app/api/auth/2fa-verify/route.ts` | POST: valida TOTP o email code, si OK crea sesión completa |
| `backend/app/login/verify/page.tsx` | UI del segundo paso (elegir método + ingresar código) |
| `backend/app/admin/security/page.tsx` | Panel admin para gestionar 2FA (toggles + setup TOTP) |
| `backend/middleware.ts` | Protege `/login/verify` con `admin_pending` cookie |

---

## Cómo está conectado al Bloque 1A/1B (bcrypt + rate limit)

El 2FA **NO reemplaza** el rate limit ni el bcrypt — los **complementa**:

```
1. Rate limit (Bloque 1B) → si la IP excedió 5/15min, bloqueo total
2. bcrypt (Bloque 1A) → valida password contra hash en base64
3. 2FA (Proceso 16) → si las credenciales pasan Y el admin tiene 2FA activo, exige segundo factor
```

Cada capa cubre algo distinto:
- **Rate limit** → bloquea brute force masivo desde una IP.
- **bcrypt** → si filtran el `.env.local`, no exponen la password real.
- **2FA** → si filtran la password (via phishing, screenshot, etc.), igual no entran al panel.

---

## Cómo te enterás si alguien intenta entrar

**Hoy:** el sistema NO manda alerta proactiva. Solo registra:
- 401s y 429s en logs de Vercel (visibles en dashboard).
- Errores capturados por Sentry (Proceso 14) si el código del 2FA tira excepción.

**Pendiente:** integrar con Sentry o BetterStack un evento custom tipo "intentos fallidos de 2FA en X minutos" que dispare alerta. Por ahora, el rate limit del Bloque 1B ya bloquea automáticamente cualquier ataque sostenido.

---

## Decisiones embutidas

| Decisión | Por qué |
|---|---|
| **TOTP con `otpauth` (no `otplib`)** | `otplib` no es compatible con Turbopack/ESM en Next.js 16. `otpauth` sí. Mismo algoritmo estándar (RFC 6238). |
| **TOTP secret encriptado AES-256-CBC, no hasheado** | TOTP requiere el secret en forma original para validar (algoritmo determinístico). Se encripta para protegerlo en reposo. |
| **Email code hasheado SHA-256** | El código de email **no se necesita reusar**, así que se hashea (irreversible). Más seguro: aunque la DB se filtre, el atacante no ve códigos válidos pasados. |
| **Window: 1 en TOTP** (acepta código actual ± 1 periodo) | Tolerancia para relojes desincronizados unos segundos. Mayor window = menos seguro. 1 es el estándar. |
| **Email code 10 min de expiración** | Suficiente para abrir email en otra pestaña sin estrés, pero corto para que un atacante con acceso al inbox no aproveche. |
| **Cookie `admin_pending` 5 min** | Si el admin no completa el segundo paso en 5 min, hay que volver a logear. Reduce ventana de exposición. |
| **`admin_pending` con flags `secure: true`, `sameSite: 'strict'`, `httpOnly: true`** | Mismas reglas que `admin_session` (Bloque 1A). Anti-CSRF, anti-MITM, anti-XSS. |
| **Activar AMBOS métodos (TOTP + email)** recomendado | Redundancia. Si el admin pierde el celular pero tiene acceso al inbox, no se queda afuera. |
| **El issuer del TOTP es "MyBusinessFormation Admin"** | Lo que aparece en la app del admin (Google Authenticator, etc.). Identifica claramente para qué sistema es. |
| **`/admin/security` no usa 2FA dentro de sí mismo** | Después de loguearse con 2FA, el admin entra al panel y puede gestionar todo desde ahí. No hay 2FA recursivo. |
| **Tabla con id=1 single row (no row por user)** | Hay UN solo admin. Cuando haya varios, se rediseña con FK a un futuro `admins` table. |

---

## Pendientes / mejoras futuras

1. **Generar y agregar `ENCRYPTION_KEY` en Vercel** (3 entornos) — sin esto, el TOTP no funciona en producción. Comando para generar la key en la sección "Variables de entorno" de arriba.

2. **Agregar `ADMIN_EMAIL` en Vercel** — el email destinatario del 2FA por email. Si no se setea, usa `ADMIN_USER` como fallback (que probablemente no es un email).

3. **Validación zod en endpoints** — los `/api/auth/2fa-*` aceptan body sin validar shape. Riesgo bajo pero conviene cubrirlo en el bloque general de validación zod (Etapa 14 pendiente).

4. **Rate limit en `/api/auth/2fa-verify` y `/api/auth/2fa-send-email`** — actualmente el rate limit solo está en `/api/auth/login`. Un atacante con la cookie `admin_pending` podría intentar miles de códigos. Mitigación parcial: la cookie expira en 5 min y los códigos son 1 millón de combinaciones. Pero conviene agregar rate limit explícito (ej. 10 intentos/15min en verify).

5. **Backup codes** (códigos de un solo uso para emergencias). Estándar en GitHub, Google, etc. Si el admin pierde celular Y no tiene acceso al inbox, los backup codes le permiten entrar. Esfuerzo medio (~2h).

6. **Tabla `admin_audit_log`** (Etapa 14 pendiente) — registrar cada login con/sin 2FA, cada intento fallido, cada cambio de config 2FA. Para forensics si algo pasa.

7. **WebAuthn / Passkeys** (futuro post-launch) — alternativa moderna a TOTP, sin password siquiera. Más seguro pero complejo.

---

## Historial de implementación

| Fecha | Commit | Cambio |
|---|---|---|
| 2026-05-09 | `0552930` | Implementación inicial 2FA (TOTP + email) |
| 2026-05-09 | `eb0be02` | Reemplazo `otplib` → `otpauth` (compat Turbopack) |
| 2026-05-09 | `937c2b3` | Rediseño login admin con split-screen |
| 2026-05-09 | `82766bf` | Login: colores más suaves + mensaje "internal staff" |

Implementado por Fabián. Documentación canónica creada el 2026-05-10 por Ethan + Claude.

---

## Relacionados

- `LOGICA_DE_NEGOCIO/13_seguridad_panel_admin.md` — Bloque 1A (bcrypt) + Bloque 1B (rate limiting). El 2FA se monta encima de estas dos capas.
- `LOGICA_DE_NEGOCIO/14_sentry_monitoreo_errores.md` — si el 2FA tira un error, Sentry lo captura (con PII filtrado).
- `contexto` — Etapa 14 (Hardening de Seguridad) — el item del 2FA está marcado `[x]` referenciando este documento.
