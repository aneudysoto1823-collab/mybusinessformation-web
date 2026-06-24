# Proceso 28 — Verificación de direcciones US con Lob.com

## ¿Por qué este documento existe?

Hasta hoy el formulario de checkout de OpaBiz aceptaba cualquier dirección que el cliente escribiera. Eso era un problema porque:

1. **Florida rechaza filings con direcciones mal escritas.** Si el cliente pone `9848 chirltin dr` en lugar de `9848 CHORLTON CIR`, Sunbiz rechaza la formación y nos toca recontactarlo, perder tiempo y a veces tragar la state fee perdida.
2. **El Certificate físico no llega.** Lo imprimimos y enviamos por USPS — si la dirección no existe, vuelve devuelto.
3. **Soporte se carga de errores que el cliente cometió en 2 segundos al escribir.**

**Lob.com** es el estándar de la industria para validación de direcciones US contra USPS. Lo usan Stripe Checkout, LegalZoom, Bizee, ShipStation, Discord, Square. Funciona así:

1. Recibe una dirección (street + city + state + zip).
2. Conecta a USPS y verifica si existe.
3. Devuelve:
   - `deliverable` — USPS la entrega, todo OK
   - `deliverable_missing_unit` — la dirección existe pero falta apt/suite
   - `deliverable_incorrect_unit` — la unidad apt/suite que pusiste no existe
   - `deliverable_unnecessary_unit` — pusiste apt/suite pero no hace falta
   - `undeliverable` — USPS no entrega ahí (no existe o está mal escrita)
4. Devuelve la versión **normalizada** (MAYÚSCULAS, abreviaciones USPS, ZIP+4).

Y todo esto **antes** de que el cliente pague.

---

## La idea en una imagen

Imaginate que el cliente te dicta su dirección por teléfono y vos la repetís en voz alta para confirmar que la escribiste bien. Lob es ese paso de confirmación: lee la dirección, la normaliza, y si encuentra una diferencia, le muestra al cliente "¿quisiste decir esto?".

---

## Arquitectura

```
Usuario en el form de checkout
   ↓ termina de llenar un paso con direcciones US (paso 2, 3, 5)
   ↓ click en "Next"
Frontend page.tsx → fmNext() recoge las direcciones US del paso
   ↓ por cada dirección US: fmLobValidateAddr({primary_line, city, state, zip})
   ↓ fetch POST /api/address/verify (body JSON)
Endpoint Next.js: app/api/address/verify/route.ts
   ↓ verifyAddress() de lib/lob.ts
   ↓
   ¿Está activo? (process.env.LOB_ENABLED !== 'false' Y hay LOB_SECRET_KEY)
   ├── NO → ok=true, source='no-key' (degradación silenciosa, form avanza)
   └── SÍ → SDK oficial @lob/lob-typescript-sdk
           ↓ UsVerificationsApi.verifySingle(...)
           ↓ HTTPS a api.lob.com/v1/us_verifications
           ↓ {deliverability, primary_line normalizado, components, ...}
           ↓ Si timeout 5s → AbortController corta → ok=true source='timeout'
           ↓ Si error → ok=true source='error'
   ↓
Respuesta JSON: { ok, deliverability?, suggested?, source, raw? }
   ↓
Frontend decide:
  - source='no-key'|'error'|'timeout' → action='pass' (avanza silencioso)
  - source='lob' + ok=true + suggested === entered (normalizado) → action='pass' (avanza silencioso)
  - source='lob' + ok=true + suggested ≠ entered → popup "Suggested" con 2 botones
  - source='lob' + ok=false (undeliverable) → popup "not found" con 2 botones
```

---

## El popup (UX bloqueante estilo Stripe/LegalZoom)

Cuando Lob devuelve corrección o "not found", se abre un **modal HTML bloqueante** (backdrop oscuro al 60%, NO se cierra con click afuera). El user tiene que elegir una opción antes de seguir.

### Caso 1: Lob sugiere corrección (`deliverable` pero distinto al entered)

```
┌─────────────────────────────────┐
│  📍  Confirm your address    [✕]│
├─────────────────────────────────┤
│  Suggested                      │
│  9848 CHORLTON CIR              │
│  ORLANDO FL 32832               │
│                                 │
│  Company Address                │
│  ┌─────────────────────────┐    │
│  │ 9848 chirltin dr        │    │
│  │ Orlando Florida 32832   │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│ [Use Entered]   [Use Suggested] │
└─────────────────────────────────┘
```

- `Use Entered` → mantiene lo que escribió el user, avanza al siguiente paso
- `Use Suggested` → reemplaza los inputs con la versión Lob normalizada, avanza
- `[✕]` (cerrar) → queda en el paso, no avanza

### Caso 2: Lob marca `undeliverable` (dirección no encontrada)

```
┌─────────────────────────────────┐
│  📍  Confirm your address    [✕]│
├─────────────────────────────────┤
│  Suggested address not found    │
│  Please verify and confirm.     │
│                                 │
│  Company Address                │
│  ┌─────────────────────────┐    │
│  │ xxxxxxx fake street     │    │
│  │ Orlando Florida 32832   │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│ [Use Entered] [Re-enter Address]│
└─────────────────────────────────┘
```

- `Use Entered` → user fuerza la dirección que escribió (avanza igual)
- `Re-enter Address` → cierra popup, queda en el paso para que la corrija
- `[✕]` → igual que Re-enter

### Caso 3: Lob OK sin cambios

**Cero popup.** El user no nota nada, avanza silencioso al siguiente paso.

---

## Grupos de direcciones validados

| # | Grupo | Paso | Cuándo se valida con Lob |
|---|---|---|---|
| 1 | Dirección física del Negocio | 2 | Si `inp-biz-country === 'US'` y `bizAddrType !== 'virtual'` |
| 2 | Registered Agent | 3 | Si `fmData.agentType === 'own'` y `chk-ra-same-biz` NO marcado |
| 3 | Mailing Address | 3 | Si `chk-same-mail` NO marcado y `inp-mail-country === 'US'` |
| 4 | Member individual address | 5 | Si `s5-mN-country === 'US'` |
| 5 | Member company address | 5 | Si `s5-mN-cocountry === 'US'` |

Si en un paso hay MÚLTIPLES direcciones a validar (ej: paso 3 con RA + Mailing), se validan en cadena dentro de un solo IIFE async — popup 1, user elige, popup 2, user elige, avanza. Si en cualquier punto elige "Re-enter" o cierra, **NO avanza**.

---

## Decisiones técnicas

### 1. Usamos el SDK oficial, no cliente HTTP propio

Librería: **`@lob/lob-typescript-sdk@^1.4.0`** — SDK oficial TypeScript de Lob, mantenido por Lob via OpenAPI Generator. Auto-actualizado cuando Lob cambia la API.

Por qué:
- Tiene types TypeScript completos para `UsVerification`, `UsVerificationsWritable`, enum `UsVerificationDeliverabilityEnum`.
- No tiene sentido reimplementar Basic Auth + parsing de respuestas a mano.
- Repo en GitHub `lob/lob-typescript-sdk`, MIT license.

### 2. LIVE por default (no dormido)

A diferencia de ZeroBounce (que quedó dormido para no quemar el 100/mes free), Lob queda **LIVE por default** desde el primer commit. Razones:

- Lob ofrece **300 verificaciones/mes free recurrentes** (vs 100 de ZeroBounce).
- El founder quería probar en vivo desde el inicio.
- En local dev se usa `LOB_SECRET_KEY=test_xxx` (key TEST de Lob, **gratis**, devuelve dummies sin consumir crédito). Solo Vercel Production usa `LOB_SECRET_KEY=live_xxx`.

El flag `LOB_ENABLED` existe para apagar rápido en producción sin redeploy si rompe algo.

### 3. Aceptamos `deliverable` con todas las variantes

| Status Lob | Aceptamos? | Razón |
|---|---|---|
| `deliverable` | ✅ Sí | Caso ideal |
| `deliverable_unnecessary_unit` | ✅ Sí | El user puso apt/suite que no hace falta, pero la dirección llega igual |
| `deliverable_incorrect_unit` | ✅ Sí | La unidad apt/suite no existe pero la entrega base sí — USPS dejará el mail en la dirección principal |
| `deliverable_missing_unit` | ✅ Sí | Falta apt/suite pero USPS entrega — popup le ofrece la versión sugerida |
| `undeliverable` | ❌ Rechazamos (popup not-found) | USPS no entrega ahí |

**Por qué aceptamos los 4 deliverable_*:** rechazar a un cliente que vive en una casa sin apt # cuando Lob lo marca `unnecessary_unit` sería absurdo. El cliente sabe su dirección mejor que Lob en casos edge.

### 4. Fallbacks de seguridad (anti-bug "form frizado")

Tres niveles:

| Escenario | Comportamiento |
|---|---|
| Sin `LOB_SECRET_KEY` o `LOB_ENABLED=false` | Endpoint devuelve `{ok:true, source:'no-key'}`. Frontend interpreta como `action='pass'`, **avanza silencioso** |
| SDK timeout (>5s) | `AbortController.abort()` → endpoint devuelve `{ok:true, source:'timeout'}`. Frontend → `action='pass'`, **avanza** |
| SDK error (red, 5xx, 403 billing, etc.) | Endpoint devuelve `{ok:true, source:'error'}`. Frontend → `action='pass'`, **avanza** |
| Frontend fetch falla (offline, CORS, etc.) | `try/catch` en `fmLobValidateAddr` → `action='pass'`, **avanza** |

**Filosofía**: un fallo en Lob NUNCA puede impedirle al cliente avanzar en el form. Es validación opcional, no crítica. Lo crítico es Stripe (el pago).

### 5. Comparación normalizada para evitar popups falsos

Si Lob devuelve la misma dirección que el user escribió pero solo en MAYÚSCULAS, no abrimos popup. La comparación normaliza:

```js
function n(s){ return String(s||'').trim().toUpperCase().replace(/\s+/g,' '); }
var same = n(entered.primary_line) === n(suggested.primary_line)
        && n(entered.city) === n(suggested.city)
        && n(entered.state) === n(suggested.state)
        && n(entered.zip_code).slice(0,5) === n(suggested.zip_code).slice(0,5);
```

- Comparamos los primeros 5 chars del ZIP (ignoramos ZIP+4 — Lob a veces lo agrega).
- `toUpperCase()` para case-insensitive.
- `trim()` + collapse whitespace para tolerancia.

### 6. Solo US

Lob solo valida direcciones US (USPS). Para direcciones no-US:

```js
if (addrInput.country && addrInput.country !== 'US') return {action:'pass'};
```

No hay alternativa equivalente para internacional en el plan free.

---

## Costo

Lob cobra por verificación. Pricing actual (verificar en https://www.lob.com/pricing):

| Plan | Costo | Verificaciones | Costo/verificación |
|---|---|---|---|
| **Free** (incluido en cualquier cuenta) | $0/mes | **300/mes recurrentes** | gratis |
| Pay-as-you-go | $0.07 | por verificación extra | $0.07 |

Para OpaBiz al lanzamiento (~50-200 órdenes/mes), con ~3 direcciones US por orden = **150-600 verificaciones/mes**:

- 100 órdenes/mes (300 verificaciones) → dentro del free
- 200 órdenes/mes (600 verificaciones) → $0.07 × 300 extras = **$21/mes**

A 1000 órdenes/mes el costo sería ~$200/mes — todavía despreciable vs el revenue.

---

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `backend/lib/lob.ts` | Wrapper sobre el SDK oficial: `verifyAddress({primary_line, ...})` con feature flag, fallbacks, timeout 5s |
| `backend/app/api/address/verify/route.ts` | Endpoint `POST /api/address/verify` que recibe JSON body |
| `backend/app/page.tsx` | (a) CSS del modal `.lob-popup-*` (b) HTML del modal `<div id="lob-popup-backdrop">` (c) JS `fmLobPopupShow()` + `fmLobValidateAddr()` + wires en `fmNext()` |
| `backend/package.json` | Dependencia `@lob/lob-typescript-sdk` |

---

## Variables de entorno

```
# Local dev (backend/.env.local)
LOB_SECRET_KEY=test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # TEST: gratis, dummies
LOB_PUBLISHABLE_KEY=test_pub_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LOB_ENABLED=true

# Vercel Production (las keys reales viven en Vercel env vars, NO acá)
LOB_SECRET_KEY=live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    # LIVE: consume crédito
LOB_ENABLED=true
```

> **Importante**: el código degrada limpiamente si falta la key o el flag. NUNCA bloquea al cliente por un problema de configuración externa.

---

## Setup en Lob dashboard antes de usar LIVE

Sin esto, la API LIVE devuelve `403 billing_address_required`:

1. Entrar a https://dashboard.lob.com/
2. Settings → **Billing** → agregar billing address + tarjeta de crédito
3. La tarjeta queda en archivo. **No se cobra nada** mientras estés dentro de las 300 verificaciones free/mes.

---

## Smoke tests

Tres niveles documentados en los commits:

1. **Lib** (`backend/lib/lob.ts`): script Node directo con 5 casos (válida, inválida, vacía, flag off, sin key). Verifica que el SDK devuelve `source='lob'` cuando flag+key existen.
2. **Endpoint** (`/api/address/verify`): `curl` POST con body JSON. Verifica HTTP 200/400 + estructura correcta de respuesta.
3. **Form** (`page.tsx`): carga la página, verifica que el modal HTML existe pero está oculto, que el script JS inline compila en `vm.Script`, y que NO hay chars de control (`\b`, `\n`) que romperían el script.

Y el smoke real del founder: probar el form en producción con 3 tipos de dirección (correcta, con typo, inventada) por cada grupo de direcciones (Negocio, RA, Mailing, Members).

---

## Activación / desactivación rápida

**Apagar Lob sin redeploy** (si rompe algo en producción):
1. Vercel → Settings → Environment Variables → Production
2. Editar `LOB_ENABLED` → `false`
3. Redeploy (segundos)
4. El endpoint devuelve `{ok:true, source:'no-key'}` → form avanza sin validar

**Reactivar:** `LOB_ENABLED=true` + redeploy.

---

## Decisiones que **no** se tomaron (scope)

Estas features existen en Lob pero no las implementamos:

- **Lob.com Print/Mail**: Lob también imprime y envía mail físico (Certificate of Formation, etc.). Por ahora seguimos imprimiendo y enviando desde Florida manualmente. Si crece volumen, Lob Print podría reemplazar todo el flujo de envío físico.
- **Lob International Verification**: para direcciones no-US existe un endpoint separado. No hay caso de uso porque todos los Members con direcciones no-US los aceptamos sin validar (el form de Sunbiz los acepta sin USPS check).
- **Lob Address Autocomplete**: Lob también ofrece autocomplete predictivo mientras el user tipea. No lo wireamos porque agregaría llamadas constantes (= consumo de crédito). El popup post-Next es más barato y suficiente.
- **Lob Batch Verifications**: subir CSV con miles de direcciones. Útil para limpieza retroactiva de `Order.shipping_address` o `accounting_clients`. Es operación de mantenimiento, no checkout — se hace aparte si surge necesidad.

---

## Pendientes operativos

- [ ] Vigilar consumo en https://dashboard.lob.com/ durante el primer mes en producción
- [ ] Si vamos a superar 300 verificaciones/mes consistentemente, considerar upgrade a pay-as-you-go (sin compromiso) o plan con descuento por volumen
- [ ] (Futuro) Sentry alerts si `source='error'` o `source='timeout'` pasa más del 5% de las llamadas — indicaría problema con la cuenta o con la API
