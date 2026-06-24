# Proceso 27 — Verificación de email con ZeroBounce

## ¿Por qué este documento existe?

Hasta hoy el formulario de checkout de OpaBiz aceptaba cualquier email que tuviera el formato `algo@algo.algo`. Eso no garantiza que el email **exista** ni que **funcione**. Si un cliente escribe mal su email (por accidente o a propósito), pasa esto:

- Cobramos su tarjeta correctamente.
- Le mandamos la confirmación de orden por email (A1).
- El email rebota o se entrega a una casilla que el cliente no controla.
- **El cliente no recibe nada** y nos llama enojado al día siguiente, o peor, hace chargeback porque "no recibió el servicio que pagó".
- Soporte tiene que perseguirlo manualmente.

**ZeroBounce** es un servicio que valida emails ANTES de aceptarlos en el form. No solo chequea el formato — también:

1. Verifica que el dominio tenga registros MX válidos (puede recibir email).
2. Hace una conexión SMTP real al servidor del dominio y pregunta "¿existe esta casilla?".
3. Detecta dominios desechables (`mailinator.com`, `tempmail`, etc.).
4. Detecta typos comunes (`gmial.com` → te sugiere `gmail.com`).
5. Marca catch-all (servidores que aceptan todo, no se puede confirmar la casilla).
6. Marca spam-traps (emails que existen solo para detectar spammers).

Y todo esto **antes** de que el cliente pague.

---

## La idea en una imagen

Imaginate que sos cajero de una panadería y el cliente te paga con un cheque. Si no chequeás que el cheque tenga el banco correcto y el número de cuenta válido **antes** de entregarle el pan, te quedás sin pan y sin plata.

ZeroBounce es como llamar al banco antes de aceptar el cheque: confirma que la cuenta existe y que el cheque va a poder cobrarse.

---

## Arquitectura

```
Usuario en el form de checkout
   ↓ escribe email + sale del campo (onblur)
Frontend page.tsx → fmEmailValidate()
   ↓ fetch GET /api/email/validate?email=<email>
Endpoint Next.js: app/api/email/validate/route.ts
   ↓ llama a lib/zerobounce.ts validateEmail()
   ↓
   ¿Está activo? (process.env.ZEROBOUNCE_ENABLED === 'true')
   ├── NO → solo regex local, source='dormant', sin gastar crédito
   └── SÍ → SDK oficial @zerobounce/zero-bounce-sdk
           ↓ HTTPS a api.zerobounce.net
           ↓ { status: 'valid'|'invalid'|'catch-all'|... }
           ↓ Si timeout/error → fallback a regex local (source='regex')
   ↓
Respuesta JSON: { valid, reason?, source }
   ↓
Frontend muestra mensaje rojo si invalid; nada si valid (cero ruido)
```

---

## Decisiones técnicas

### 1. Usamos el SDK oficial, no cliente HTTP propio

Librería: **`@zerobounce/zero-bounce-sdk@^2.1.9`** (publicada por ZeroBounce, mantenida por bot de GitHub Actions del propio ZeroBounce, última versión 2026-06-17).

Por qué:
- Es el cliente oficial. Si ZeroBounce cambia la API, ellos actualizan el SDK y nosotros solo bumpeamos versión.
- Tiene types TypeScript completos.
- No tiene sentido reimplementar HTTPS + auth + parsing de respuestas a mano.

### 2. Feature flag dormido por defecto

Env var `ZEROBOUNCE_ENABLED`. Si no está en `true`, el endpoint solo corre regex local — **no consume crédito** de ZeroBounce.

Por qué dormido por defecto:
- En desarrollo no queremos quemar el plan free (100 verificaciones/mes) probando.
- En staging tampoco.
- Solo se activa **en Production** cuando estamos listos.

Activación:
1. Setear `ZEROBOUNCE_ENABLED=true` en Vercel env vars (Production).
2. Setear `ZEROBOUNCE_API_KEY=<tu-key>` en Vercel (también Production).
3. Redeploy.

Ya empieza a validar de verdad sin tocar código.

### 3. Status que aceptamos como "válido"

ZeroBounce devuelve un `status` por email. Nuestra decisión:

| Status | Significa | Aceptamos? |
|---|---|---|
| `valid` | Email confirmado, casilla existe | ✅ Sí |
| `catch-all` | Servidor acepta todo, no se puede confirmar la casilla específica | ✅ Sí |
| `unknown` | Timeout, greylist, error temporal | ✅ Sí |
| `invalid` | Casilla no existe, dominio inválido | ❌ Rechazamos |
| `spamtrap` | Email es una trampa anti-spam | ❌ Rechazamos |
| `abuse` | Cuenta reportada por abuso | ❌ Rechazamos |
| `do_not_mail` | Cuenta en blacklist global | ❌ Rechazamos |

**Por qué aceptamos `catch-all` y `unknown`:** son casos donde el servidor del dominio no confirma 100% que la casilla exista, pero el email **puede ser real**. Si rechazamos a todos los `catch-all` bloqueamos a usuarios con email corporativo (las empresas configuran catch-all para no perder emails con typos). Y `unknown` suele ser un timeout temporal del servidor del cliente — no es culpa del cliente.

**Trade-off aceptado:** algún email roto pasa el filtro. Pero rechazar `catch-all` bloquearía un 20-30% de emails legítimos. Preferimos cobrar y después rescatar manualmente que perder ventas.

### 4. Fallbacks de seguridad

Tres niveles:

| Escenario | Comportamiento |
|---|---|
| `ZEROBOUNCE_ENABLED=false` o sin API key | Solo regex local, `source='dormant'` |
| SDK timeout / network error / 5xx | Fallback a regex local, `source='regex'`, **NO bloqueamos al cliente** |
| Endpoint completo cae | Frontend captura el catch del fetch, no muestra error, **NO bloquea el form** |

Filosofía: **un fallo en ZeroBounce no puede impedirle al cliente pagar**. Es validación opcional, no validación crítica. Lo crítico es Stripe (el pago), no ZeroBounce.

### 5. UX silenciosa en el éxito

Si el email es válido, el form **no muestra nada** debajo del campo. Cero ruido visual. Solo aparece mensaje rojo si hay problema.

Por qué: si mostráramos "✓ email válido" agregamos clutter visual que el usuario ya espera. La ausencia de error es suficiente.

---

## Costo

ZeroBounce cobra por verificación. Pricing actual (verificar en https://www.zerobounce.net/pricing):

| Plan | Costo | Verificaciones | Costo/verificación |
|---|---|---|---|
| **Free** | $0/mes | 100/mes | gratis |
| Pay-as-you-go | $15 | 2,000 | $0.0075 |
| Pay-as-you-go | $40 | 5,000 | $0.008 |
| Pay-as-you-go | $135 | 25,000 | $0.0054 |
| Pay-as-you-go | $390 | 100,000 | $0.0039 |

Para OpaBiz al lanzamiento (~50-200 órdenes/mes), el plan free (100/mes) **es suficiente o ligeramente justo**. Si pasamos 100, pagamos pay-as-you-go.

Si superamos 100 órdenes/mes, conviene subir al plan de $15 (2,000 validaciones, 6 meses de cobertura).

> **Nota sobre el form**: el endpoint se llama cada vez que el usuario sale del campo email (onblur). Si el usuario re-edita y sale otra vez, se llama de nuevo. Para evitar gastar crédito en validaciones repetidas, una mejora futura es **debounce** + cachear el último email validado en memoria del componente. Para MVP no es crítico (al rato de salir del campo el usuario suele continuar el form).

---

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `backend/lib/zerobounce.ts` | Wrapper sobre el SDK oficial con feature flag, regex local, fallbacks |
| `backend/app/api/email/validate/route.ts` | Endpoint `GET /api/email/validate?email=<email>` |
| `backend/app/page.tsx` | Input `inp-email` con `onblur="fmEmailValidate()"` + funciones JS `fmEmailReset()` y `fmEmailValidate()` |
| `backend/package.json` | Dependencia `@zerobounce/zero-bounce-sdk` |

---

## Variables de entorno

```
# Local dev (backend/.env.local)
ZEROBOUNCE_API_KEY=<tu-key>
ZEROBOUNCE_ENABLED=false           # DORMIDO por defecto, no consume créditos

# Vercel Production (cuando se quiera activar de verdad)
ZEROBOUNCE_API_KEY=<tu-key>
ZEROBOUNCE_ENABLED=true            # ACTIVO: SDK valida MX + SMTP probe + catch-all
```

> **Importante**: el código degrada limpiamente si la API key falta o si el flag es `false`. Nunca bloquea al cliente por un problema de configuración externa.

---

## Smoke tests

Tres niveles de prueba están documentados en los commits de la implementación:

1. **Lib** (`backend/lib/zerobounce.ts`): script Node directo con 4 casos (email válido, mal formado, vacío, typo). Verifica que `source === 'dormant'` cuando el flag está apagado.
2. **Endpoint** (`/api/email/validate`): `curl` contra dev server local. Verifica HTTP 200/400 + JSON body correcto.
3. **Form** (`page.tsx`): carga la página, verifica que el HTML tiene los attrs nuevos, que el script JS inline compila en `vm.Script` sin syntax error, y que NO hay chars de control (`\b`, `\n`) que romperían el script (bug histórico que vivimos al editar template literals JSX).

---

## Activación manual cuando estés listo para producción

1. Crear cuenta en https://www.zerobounce.net/ y copiar la API key.
2. En el dashboard de Vercel → Settings → Environment Variables → Production:
   - Agregar `ZEROBOUNCE_API_KEY=<tu-key>`
   - Cambiar `ZEROBOUNCE_ENABLED` a `true`
3. Redeploy desde Vercel (o un push a `main`).
4. Probar en producción: ir a `/`, llegar al paso de email, escribir un email feo (`abc@def.invalido`), sale del campo, debería aparecer mensaje rojo abajo.
5. Monitorear consumo de créditos en https://www.zerobounce.net/members/dashboard durante la primera semana.

---

## Decisiones que **no** se tomaron (scope)

Estas cosas existen en ZeroBounce pero no las implementamos en este commit. Si en algún momento las querés, son features separadas:

- **Email Finder** (`findEmail()` del SDK): buscar email a partir de nombre + dominio. Útil para marketing automation pero no para checkout.
- **Bulk validation** (`validateBatch()`): subir un CSV de 10K emails y validar todos. Útil para limpiar la lista de `prospective_companies` antes de campañas. No es checkout, podemos hacerlo aparte.
- **Activity Data**: enriquecer un email con info de actividad reciente. Es marketing, no checkout.
- **Eliminar el campo Confirm Email**: el form sigue pidiendo `Confirm Email *` además del email principal. Ahora que ZeroBounce valida que el email existe de verdad, el Confirm Email es redundante. Pero el founder pidió implementar **solo** ZeroBounce sin tocar el resto del form — el refactor del Confirm Email queda como tarea aparte si más adelante se quiere simplificar el form.
