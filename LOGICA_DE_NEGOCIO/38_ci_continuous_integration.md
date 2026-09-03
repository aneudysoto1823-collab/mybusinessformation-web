# Proceso 38 — CI / Continuous Integration

## Qué es CI y por qué existe este proceso

**CI (Continuous Integration)** es el proceso automático que corre cada vez que se sube código nuevo al repositorio, **antes** de que ese código llegue a producción. Su trabajo es correr verificaciones y frenar el despliegue si algo no cumple con las reglas del proyecto — de manera que un error obvio nunca se cuele a un cliente real.

En OpaBiz, la plataforma que ejecuta el CI es **Vercel**: cada `git push origin main` dispara un build en la nube que construye el sitio (`next build`) y, si sale OK, lo publica. Antes de esa build corre un hook llamado **`prebuild`** — cualquier script listado ahí en `package.json` se ejecuta primero, y si termina con exit code distinto de 0, el deploy se aborta y el sitio en producción se queda con la última versión buena.

El primer script guardián del proyecto se agregó el 2026-09-03 (`scripts/check-prices.mjs`) para resolver un problema real: los precios de OpaBiz están duplicados en varios lugares del código (constantes servidor + HTML del formulario + catálogo público + prompt del chat), y ya hubo desincronizaciones invisibles en producción — el cliente veía un total en el resumen del formulario y Stripe le cobraba un total distinto (auditoría 2026-07-12, hallazgo #2). El guardián evita que eso vuelva a pasar sin necesidad de refactorizar todo (que sería 7-10 horas de trabajo con riesgo medio-alto sobre el template literal gigante de `page.tsx`).

---

## Dónde se engancha al build de Vercel

El hook está en `backend/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "prebuild": "node scripts/check-prices.mjs",
    "build": "next build",
    ...
    "check:prices": "node scripts/check-prices.mjs"
  }
}
```

Cuando Vercel ejecuta `npm run build`, npm automáticamente corre `prebuild` primero por convención (no hay que configurar nada en el dashboard de Vercel — es comportamiento estándar de npm). Si `check-prices.mjs` sale con exit 0, Vercel sigue con `next build`. Si sale con exit 1, Vercel marca el deploy como **failed** con el log del guardián visible en la sección "Build Logs" del deployment.

El script `check:prices` (con dos puntos) es la versión manual: cualquiera puede correr `npm run check:prices` local antes de commitear para ver si su cambio va a pasar el guardián. Es el mismo script — solo un alias para uso interactivo.

---

## Qué hace exactamente `check-prices.mjs` (versión actual, 2026-09-03)

El script vive en `backend/scripts/check-prices.mjs` y hace 3 cosas en orden:

### 1) Lee las constantes server-side (fuente de verdad para el cobro)

Parsea con regex los precios de las dos fuentes autoritativas:

- **`lib/pricing.ts`** — usado por `computeFormationTotal()` (formación LLC/Corp desde el home):
  - `ADDON_PRICES.ein` (hoy 79)
  - `ADDON_PRICES.oa` (hoy 79)
  - `ADDON_PRICES.itin` (hoy 99)
  - `EXPEDITED_FEE` (hoy 49)
  - `RA_FIRST_YEAR_FEE` (hoy 99 — solo cobrado en Basic con `ra='us'`)

- **`lib/services-pricing.ts`** — usado por `computeServicesTotal()` (checkout à la carte de `/servicios`):
  - `SERVICES_CATALOG['ein'].serviceFee` (hoy 79)
  - `SERVICES_CATALOG['operating-agreement'].serviceFee` (hoy 79)
  - `SERVICES_CATALOG['itin'].serviceFee` (hoy 99)
  - `EXPEDITED_FEE` (hoy 49)

**Consistencia interna** — primero verifica que los precios de opabiz coincidan entre las dos fuentes (`pricing.ts` para formación y `services-pricing.ts` para à la carte deben devolver el mismo número para el mismo servicio). Si `pricing.ts` dice EIN=$79 y `services-pricing.ts` dice EIN=$99, falla ahí sin siquiera mirar la UI. La única excepción es FBFC (mybusinessformation.com), que tiene su propio override vía `FBFC_PRICE_OVERRIDES` — ese override es intencional y no se compara acá.

### 2) Verifica los precios hardcodeados en 3 archivos de UI

Con esos números "oficiales" en la mano, el script grepea 3 archivos donde los precios se muestran directamente al cliente:

- **`app/page.tsx`** (home + formulario multi-paso):
  - Rows de addons en las tarjetas de paquetes (Basic, Standard, Premium): "+ $79" para OA, etc.
  - Card del paso 6 "Expedited": "+$49"
  - Precios del paso 7 (addons con tachado): `$99 → $79` para EIN, etc.
  - Fila de Basic en la tabla mantiene `+ $99/year` para Registered Agent
  - Fila de Standard/Premium tienen `Included (1st year free)` en lugar del precio
  - Cálculos condicionales en `fmUpdateSummary` y `fmBuildOrderPayload` para el RA en Basic
  - Línea `.sum-ra-line` del summary sidebar con el precio correcto

- **`app/servicios/page.tsx`** (catálogo público bilingüe):
  - JSON-LD schema.org (`priceUsd`) para EIN, OA, ITIN — lo que Google indexa
  - Tarjetas del catálogo (`price: '$X'`) y sus botones EN/ES (`btn_en/btn_es`)
  - Modales de detalle (`title`, `price`, `summary`, botón submit)

- **`app/api/chat/route.ts`** (prompt del bot Claudia):
  - Menciones de precios en la sección "ADD-ON SERVICES" del prompt (`EIN / Tax ID — $79`)
  - Menciones en la sección de recomendaciones (`recommend ITIN Application ($99)`)
  - Menciones en el checklist (`EIN / Tax ID ($79)`)

Para cada precio esperado el script hace un `source.includes(expected)` con el string exacto que debería aparecer, construido desde las constantes centrales (`\`$${CENTRAL.ein_addon}\``, etc.). Si el string no aparece, se agrega al array `errors` con el nombre del archivo y del assert.

### 3) Reporta y decide

- Si `errors.length === 0` → imprime `✅ Precios sincronizados: EIN=$79, OA=$79, ITIN=$99, Expedited=$49, RA=$99` y sale con exit 0. Vercel sigue con la build.
- Si hay errores → imprime cada uno con el archivo y el string que falta, imprime los precios centrales detectados como referencia, y sale con exit 1. Vercel aborta el deploy.

---

## Cómo se ve un fallo real

Si alguien cambia `ADDON_PRICES.ein` de 79 a 89 en `lib/pricing.ts` y hace push sin actualizar la UI, el build de Vercel muestra:

```
[check-prices] ❌ Precios desincronizados:

  • home EIN paso 7: falta "addon-ein-price"><span class="fm-addon-was">$99</span>$89</div>" en el archivo
  • servicios JSON-LD: falta "id: 'ein', name: 'EIN / Tax ID Number', ... priceUsd: 89" en el archivo
  • servicios card EIN: falta "id: 'ein', ... price: '$89'" en el archivo
  • servicios card EIN: falta "btn_en: 'Order EIN — $89 →', btn_es: 'Ordenar EIN — $89 →'" en el archivo
  • servicios modal EIN: falta "title:'EIN / Tax ID Number — $89'" en el archivo
  ...

Precios centrales detectados: EIN=$89, OA=$79, ITIN=$99, Expedited=$49, RA=$99
Actualizar lib/pricing.ts + lib/services-pricing.ts + los archivos UI para que coincidan.
Si el patrón de UI cambió a propósito, actualizar los "assertContains" de este script.
```

El deploy queda en "Error" en Vercel, producción sigue con la última versión buena, y quien pusheó ve exactamente qué archivo/línea le falta editar.

---

## Alcance actual y cuándo hay que extenderlo

Hoy el guardián cubre **solo 5 precios** (EIN, OA, ITIN, Expedited, RA) en 3 archivos (`page.tsx`, `servicios/page.tsx`, `chat/route.ts`). No cubre:

- **Precios de paquetes** (Basic $39, Standard $199, Premium $299): están hardcodeados en 6-7 lugares (`layout.tsx` meta description, `terms/page.tsx`, `opengraph-image.tsx`, `client-portal/dashboard/DashboardContent.tsx`, `admin/orders/[id]/page.tsx`, la propia tabla de la home, y `fmUpdateSummary`/`fmBuildOrderPayload`). Cuando se cambien de valor habrá que agregar asserts equivalentes.
- **Otros addons no listados arriba** (BTR, Sales Tax, Certified Copy, DBA, Banking Resolution, Guide, Good Standing, S-Corp, Business License, Annual Report): están en `ADDON_PRICES` server-side pero el guardián no verifica que la UI los muestre bien. Si se cambia el precio de uno de estos, el server cobra bien pero la tabla/catálogo pueden quedar desincronizados sin que nadie se entere.
- **Registered Agent en el checkout à la carte** (`/servicios/checkout`): el precio del RA en el hub "Cumplimiento anual" viene de `SERVICE_BUNDLES['bundle-compliance-ra'].price` — el guardián no lo verifica cruzado con `RA_FIRST_YEAR_FEE`.
- **`fmUpdateSummary` y `fmBuildOrderPayload` para addons no-RA**: solo se verifica que la suma condicional del RA esté bien; los otros addons (`if(fmData.addons.oa) extras += 79`, etc.) no tienen assert propio.
- **Los emails de confirmación**: usan `computeFormationTotal()` internamente, así que heredan los precios centrales automático — no requieren assert. Este es el patrón deseable a mediano plazo (que la UI también los interpole).

**Regla para extender el guardián:** cuando se cambie un precio y se descubra que el guardián NO detectó una desincronización, agregar un `assertContains(...)` nuevo para el caso que se escapó. El objetivo es que el guardián crezca proporcional a los precios que se van agregando/cambiando en el proyecto, sin necesidad de refactorizar toda la UI de golpe.

---

## Alternativas descartadas (y por qué)

El plan original evaluó dos opciones:

- **Opción A — Refactor completo (7-10 horas + testing):** interpolar todos los precios desde las constantes centrales en cada lugar de la UI (template literal de `page.tsx`, catálogo declarativo de `servicios/page.tsx`, prompt del chat). Cero duplicación, imposible desincronizarse. **Descartada por ahora** por el tamaño y el riesgo — el template literal gigante de `page.tsx` (~6,800 líneas) es históricamente frágil y un cambio grande en la interpolación puede romper el form del home.
- **Opción B — Script guardián (1-2 horas):** dejar los precios duplicados, agregar un script que verifica sincronización y bloquea el deploy si detecta discrepancia. Riesgo bajo (solo un archivo en `scripts/`, cero cambio en producción). Mismo efecto práctico: los precios nunca se pueden desincronizar en producción.

Se eligió Opción B con la idea de que la Opción A quede como pendiente para un futuro rediseño del form del home (probablemente cuando se lo componentice de verdad). Mientras tanto, el guardián garantiza que la duplicación existente no se degrade con el tiempo.

---

## Cómo agregar un nuevo assert al guardián

Todos los asserts viven en `backend/scripts/check-prices.mjs`. El patrón para agregar uno nuevo es siempre el mismo:

```js
assertContains('nombre descriptivo del caso', sourceVariable, [
  // Uno o más strings exactos que TIENEN que aparecer en el archivo.
  // Construidos interpolando desde CENTRAL para que se auto-actualicen
  // cuando cambie el precio en pricing.ts / services-pricing.ts.
  `patrón esperado con $${CENTRAL.some_price}`,
])
```

**Reglas prácticas al escribir un assert:**

1. **Incluir suficiente contexto para que sea único** — no verificar solo `$79` (aparece decenas de veces), sino la fila entera con id o clase que la identifica (`addon-ein-price"><span class="fm-addon-was">$99</span>$79</div>`).
2. **Interpolar el precio desde `CENTRAL`, nunca hardcodearlo** — si mañana cambia EIN a $89, el assert se auto-actualiza; si estuviera hardcodeado tendrías que acordarte de cambiarlo en 2 lugares.
3. **Nombrar el assert con el archivo + sección** (`'home EIN paso 7'`, `'servicios modal ITIN'`) — cuando falla, ese nombre aparece en el error y el desarrollador sabe exactamente dónde mirar.
4. **No verificar que NO aparezca un precio viejo** — el script funciona por inclusión ("esta cadena tiene que estar"), no por exclusión, porque distinguir un "$99" viejo de un "$99" válido de otro servicio requiere más contexto del que el grep tiene. La red de seguridad real es que **el precio esperado nuevo tiene que aparecer** en todos los lugares — si no aparece, es que quedó el viejo.

---

## Historial

- **2026-09-03** — Primer script guardián: `check-prices.mjs` con 5 precios (EIN, OA, ITIN, Expedited, RA) en 3 archivos UI. Enganchado como `prebuild` en `package.json`. Motivación: auditoría de precios donde se detectó que `fmUpdateSummary` mostraba $59 para OA y `computeFormationTotal` cobraba $79 (o al revés según qué se cambió último). El summary lateral del formulario no coincidía con el cobro real de Stripe.
- **2026-09-03 (mismo día)** — Extensión: agregado `RA_FIRST_YEAR_FEE` + 5 asserts nuevos para el cobro condicional del Registered Agent en Basic (tabla, fmUpdateSummary, fmBuildOrderPayload, línea HTML del sidebar).

Cuando el guardián detecte un caso que se le escapa, agregar un assert nuevo en la misma sesión y documentarlo acá.
