# 32 — Checkout de servicios à la carte (`/servicios/checkout`)

Wizard por pasos para comprar servicios sueltos (o una formación LLC/Corp) desde
`/servicios`. Cobra con **Stripe Embedded Checkout** (igual que el home, sin salir
del sitio). Última revisión: 2026-06-27.

## Archivos

| Archivo | Rol |
|---|---|
| `backend/app/servicios/page.tsx` | Catálogo de servicios → arma el carrito en `localStorage` (`flbc_svc_cart`). |
| `backend/app/servicios/checkout/page.tsx` | El wizard completo. CSS-in-JS + script inline (clases `co-*`, funciones `co*`). |
| `backend/lib/service-fields.ts` | `SERVICE_FIELDS` (campos por servicio) + `SHARED_FIELDS` (SSN/ITIN, EIN). Fuente de verdad de los "extras". |
| `backend/lib/services-pricing.ts` | `SERVICES_CATALOG` (precios individuales) + `SERVICE_BUNDLES` (combos) + `computeServicesTotal(serviceIds, bundleIds)`. **Precio autoritativo server-side.** |
| `backend/app/api/checkout/embedded-services/route.ts` | Crea Order `package:'services'` (pending) + sesión Stripe. Lee `intake.bundles`. |

El precio SIEMPRE se recalcula en el server desde los IDs del carrito + bundles
(anti-tampering). El cliente solo muestra un espejo (`coComputeTotal`) para el total
en vivo. Si cambias un precio, hazlo en `services-pricing.ts`.

## Orden de los pasos (espeja el formulario de paquetes del home)

Para una **formación** (cart trae `llc-formation` o `corp-formation`):

1. **Tu empresa** — nombre + designador (o lookup Sunbiz si es empresa existente) + país (select, EE.UU. por defecto) + dirección + actividad + descripción del negocio.
2. **Tus datos** — nombre, email, teléfono (contacto temprano, como el home).
3. **Agente Registrado** — dos cajas: "Usa nuestro servicio (+$99)" / "Seré mi propio agente ($0)". La caja de "propio agente" pide nombre/apellido + dirección, con checkbox **"usar la dirección de mi empresa"**. Caja informativa explica qué es un RA y que es obligatorio por ley.
4. **Dueños y gestión** — repeater de miembros (LLC) o directores (Corp). Valida que la propiedad sume 100%.
5. **Documentos esenciales** (hub combo, 3 tiers) — OA / OA+EIN / OA+EIN+Banking.
6. **Protección y cumplimiento** (hub combo, 3 tiers) — Virtual / Virtual+Annual / Virtual+Annual+BTR.
7. **Datos del servicio** — campos específicos de lo que se eligió + tarjeta de **datos fiscales (SSN/ITIN)** si algún servicio lo requiere.
8. **Revisa tu orden** — resumen + **Stripe a la derecha**. La autorización se da al pagar (disclosure con links a /terms y /privacy). **No hay paso de firma.**

Sin formación, se saltan RA y Dueños. El orden lo arma `coBuildWizard()`; los pasos
se muestran/ocultan por id (el orden del DOM no importa). El resumen del pedido vive
en un **sidebar derecho sticky** visible en todos los pasos (se oculta solo en el de
pago, que ya trae su review). En los hubs el contenedor se ensancha (`html.co-wide`,
1340px) para las 3 columnas.

## Hubs de combos (3 tiers estilo LegalZoom)

Config en `HUBS` (checkout) + `SERVICE_BUNDLES` (pricing). Un hub se ofrece solo si
el cliente NO tiene ninguno de sus servicios en el carrito (o ya eligió un tier de
ese hub, para poder cambiarlo). Cada tier = un bundle:

- `bundle-docs-oa` $79 · `bundle-docs-oa-ein` $149 · `bundle-docs-full` $189
- `bundle-protect-va` $99 · `bundle-protect-va-ar` $179 · `bundle-protect-full` $259

Al elegir un tier: se limpian los servicios+bundles previos del hub, se agregan los
del tier al carrito y el bundle a `coBundles` (persistido en `flbc_svc_bundles`).
"No, gracias" limpia y avanza. **El bundle reemplaza el cobro individual de sus
servicios, pero suma sus tarifas estatales** (ver `computeServicesTotal`). Los
servicios del bundle SÍ generan su paso de datos (por eso EIN y Operating Agreement
salieron de `COVERED_IN_FORMATION`; ahora solo queda `registered-agent` ahí).

## Decisiones y gotchas

- **RA en formación = +$99** si elige nuestro servicio (decisión 2026-06-26). Se logra agregando `registered-agent` al carrito; el server ya lo tasa.
- **Año fiscal del Operating Agreement:** se quitó del checkout y se asume **31 de diciembre** (está en `CHECKOUT_HIDE_KEYS`). No es campo editable porque el paso de pago crea la orden al entrar. Si se quiere que el cliente lo elija, agregar como mini-paso antes del pago o en "Datos del servicio".
- **Firma eliminada:** la autorización es al pagar. `coGetIntake` guarda `signature = nombre completo` + `authorizedByPayment:true`.
- **Modo dev:** `Ctrl+Shift+D` salta `coValidateStep` para revisar el flujo rápido (barra de progreso ámbar). Mismo patrón que el home.
- **String.raw gotcha:** todo el script del cliente vive en `return String.raw\`...\``. Los `\'` se preservan para el navegador. NO meter caracteres raros (un `\b` literal en un comentario rompió el script una vez). Validar con: extraer el body y `new Function(body)`.
- El catálogo de campos (`SERVICE_FIELDS`) es la fuente compartida con el form autollenado del admin (`ServicesFilingForm`). Si cambian keys, mantener sincronizado.

## Refinamientos UX (2026-06-27)

- **Resumen alineado:** el sidebar se alinea con el TOP del primer card del paso (no con el título). Se calcula en `coGoStep` (mide el primer `.co-card`/`.co-tiers` visible; solo desktop).
- **Paso 2 = "Información personal"** (sin subtítulo).
- **Tarifas estatales** en el resumen: renglón atenuado + etiqueta "tarifa estatal" + `*` con nota al pie ("la cobra el Estado, obligatoria"). Se quitó la palabra "impuestos" del aviso (filing services no cobran taxes). Marcadas con `state:true` en `coComputeTotal`; render unificado vía `coLineRow`/`coStateFootnote`.
- **Anti-cuelgue del pago:** `coStartPayment` muestra spinner primero, envuelve `coRenderReviewNames`/`coComputeTotal`/`coGetIntake` en try-catch y, si el total es 0, muestra mensaje en vez de spinner infinito. (El cuelgue reportado salía con total $0 estático + spinner por una excepción antes del fetch.)
- **Conflicto EIN duplicado:** un hub se oculta si ya tienes uno de sus servicios, así que el duplicado no debería armarse. `computeServicesTotal` igual dedup (servicio en bundle no se cobra individual). Pendiente fino opcional: que el hub siga visible pero deshabilite los tiers que incluyen lo que ya tienes.
- Blurbs ajustados: OA sin frase de "leyes del estado"; EIN con requisito legal (empleados / >2 miembros); Banking menciona "cuenta bancaria"; RA sin el bullet "Cambio de Agente Registrado tramitado ante el estado".

## Precios placeholder pendientes antes de LIVE

`registered-agent`, `virtual-address`, `annual-report` están en $99 placeholder y
las `stateFee` son aproximadas (ver nota en `services-pricing.ts`). Confirmar todos
los precios (individuales + bundles) antes de lanzar.

---

## Cambios 2026-06-28 (sesión grande de pulido)

> Estas decisiones SUPERAN varias de arriba (marcadas abajo). Estado actual del checkout.

### Marca / nombres
- **Rename "Business Tax Receipt" → "Local Business Tax Receipt" / "Licencia Comercial Local"** en TODAS partes (home `page.tsx`, `/servicios`, checkout, `order/complete`, `lib/pricing.ts`, `lib/services-pricing.ts`, `lib/service-fields.ts`). Se conservan tooltips que explican "formerly Occupational License". Decisión: "Recibo de Impuesto" confundía a los latinos; es realmente la licencia local del condado.
- **Registered Agent** en el catálogo ya NO dice "(Florida)" — solo "Registered Agent" / "Agente Registrado" (para que la línea del resumen no se desborde).

### Servicios recurrentes = SOLO ETIQUETA (no Stripe subscriptions todavía)
- Campo `billing?: 'monthly'|'annual'` en `ServiceDef`. **virtual-address = mensual; annual-report = anual; registered-agent = anual.** Hoy el cobro es ÚNICO (mode:payment); la renovación se gestiona aparte / se cableará a Stripe subscriptions después.
- Sufijo de cadencia con la palabra **"cargo"**: `coBillingSuffix` → "cargo mensual"/"cargo anual" (EN "monthly/annual charge"). En el resumen el "cargo …" va **junto al nombre** (izquierda) para alinear los precios a la derecha.
- El **aviso de autorrenovación se quitó del resumen** (decluttering). La cobertura legal queda en el disclosure del paso de pago + **Terms §4.4 "Recurring & Auto-Renewing Services"** (EN/ES, en `app/terms/page.tsx`).
- **Nota al pie "* la cobra el Estado"** del resumen: ELIMINADA (se sobreentiende). Las líneas de tarifa estatal van atenuadas con su etiqueta, sin asterisco. ⚠️ Supera la nota de la sección "Refinamientos UX (2026-06-27)".

### Registered Agent — modelo final (SUPERA "RA = +$99")
- **Gratis el primer año al combinar con CUALQUIER otro servicio**; **$99/año si va solo** (nunca llega a Stripe en $0). Catálogo: `serviceFee: 99` + **`freeWithOther: true`** + `renewalFee: 99` + `billing:'annual'`. `computeServicesTotal`/`coComputeTotal`: si `freeWithOther && hayOtroServicio/combo` → línea en `amount:0, firstYearFree:true`. Líneas en $0 se filtran del `line_items` de Stripe (rechaza $0) pero quedan en `addons.lines`.
- **NO se preselecciona.** La caja "nuestro servicio" muestra badge **"Recomendado"** (clase `co-choice-rec` + `.co-rec-badge`) pero solo entra al carrito cuando el cliente hace clic. La preselección se quitó del build del wizard (antes aparecía en el resumen desde el paso 1). Caja: **$99 tachado** arriba + nota verde "✓ Gratis el primer año" debajo. Resumen: una línea, solo `~~$99~~` tachado.
- Upsell `coRaUpsellNote()`: si RA va solo, el resumen invita a agregar otro servicio para que salga gratis.

### Cancelación
- Modelo **FTC "click-to-cancel"**: la copia (Terms §4.4 + disclosure) dice "cancela desde tu cuenta de cliente" (email soporte como respaldo). **PENDIENTE: botón self-service de cancelación en el client portal** cuando se cableen suscripciones reales.

### Datos del cliente
- **Dirección personal** en el paso 2 (calle/apt/ciudad/**estado=selector**/ZIP). Se guarda en `intake.personalAddress`. Persistida en `coSnapSimple`.
- **Agente Registrado "propio agente": elige dirección de Florida** entre la de la empresa y la personal (solo se ofrecen las que están en FL y si difieren; si ninguna es FL, escribe una). `coIsFL`, `coRaAddrCandidates`, `coRenderRaAddrOptions`, `coRaPickAddr`.
- **Mayúscula inicial automática** en campos de nombres (`coTitleCase`): contacto, agente, dueños.
- **Autollenado de dirección de dueños**: si el nombre del dueño coincide con el de Información Personal, se autollena su dirección (`coMaybeFillOwnerAddr`).

### Local Business Tax Receipt — sin paso extra en formación
- Se agregó **"Número de empleados"** al card de la empresa (campo `employees` en `llc-formation`/`corp-formation`, renderizado en `co-company-extra`).
- En formación se ocultan los campos de BTR: `HIDE_KEYS_IN_FORMATION += county, industry, employees` (condado de la dirección, tipo de la actividad, empleados del nuevo campo). Así el BTR no genera paso aparte. **Comprado solo, el BTR sí pide condado + tipo + empleados.**

### EIN
- Se quitó el campo **"Tu título / rol"** del EIN (ya viene de los roles de Dueños). Queda solo `activity` (oculta en formación).

### SSN/ITIN = PASO PROPIO "Datos fiscales" (`panel-tax`)
- Antes se anexaba a la última página de datos. Ahora es un **paso propio condicional** que aparece solo si un servicio elegido requiere `ssnItin` (EIN, sales-tax, cierre-fiscal). En **formación** va ENTRE los dos hubs (contexto fresco tras elegir el EIN); **à la carte** va después de ambos hubs.
- Muestra el **responsible party** precargado (nombre del contacto) + el porqué (lista los servicios que lo piden) y deja solo el SSN/ITIN. Se refresca al entrar (`coGoStep`, preservando lo escrito) y valida que se ingrese (`coValidateStep` `panel-tax`). `coRenderTaxPanel` + `coSharedFieldsInner`. Recordar: `coSharedKeysActive()` ya filtra `ein` en formación.

### Combos dinámicos (hubs)
- `coHubApplicable`: el hub se muestra **mientras falte al menos un servicio suyo** (antes desaparecía si ya tenías uno). 
- `coRenderHub`: solo se renderizan los tiers que **agregan algo nuevo**; el precio es **marginal** (`bundle.price − Σ serviceFee de lo ya poseído`, con prefijo "+"); marca con "· ya lo tienes" lo poseído (`coTierBullets(svcIds, owned)`) y avisa arriba cuando aplica. ⚠️ El resumen muestra el combo a precio completo pero el TOTAL sube solo el marginal (consistente). Edge conocido: "No, gracias" limpia todo el grupo, incluido lo previo.

### Navegación / layout
- **Paso 1:** "Atrás" siempre visible (vuelve a `/servicios`) + "Continuar" a la derecha. `coBack` con `coIdx<=0` → `/servicios`.
- Botón que lleva al review dice **"Revisar orden"** (antes "Ir al pago").
- **Paso de pago (panel-pay):** un solo box **"Revisar orden"** que fusiona el review de datos (con **"Editar"** que vuelve al paso, `coRenderIntakeReview`/`coEditStep`) + el resumen del pedido. "Atrás" propio arriba; el resumen ya NO es sticky en el grid (ambas columnas hacen scroll juntas). Stripe en la otra columna.
- **Paso 5 (hubs):** toda la tarjeta del combo es clicable (botón con `event.stopPropagation`).
- **`coStartPayment` centralizado en `coGoStep`** (se dispara al entrar al paso de pago sin importar la ruta — antes no corría si se llegaba vía "No gracias" de un hub → spinner infinito).

### /servicios — vaciar carrito
- "Vaciar carrito" ya no usa `confirm()` nativo: confirmación **inline** debajo del botón (`osClearConfirm`, "Sí, vaciar"/"Cancelar"). `doClearCart` ahora limpia también `flbc_svc_bundles` y `flbc_svc_order` (antes reaparecían los combos).

### Fix crítico
- **"No se pudo crear la orden"**: el insert de `embedded-services` omitía la columna **`country`** (NOT NULL en `Order`); se agregó (`intake.country || 'US'`). Se expone `detail` del error de Supabase para depurar. ⚠️ Era un bloqueante real del checkout.

### Stripe — qué se necesita
- El checkout de servicios usa **las MISMAS llaves que el home**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (cliente, `window.__OPABIZ_PK__`) + `STRIPE_SECRET_KEY` (ruta) + el mismo webhook (`metadata.kind='services'`). No hay integración nueva pendiente; lo que fallaba era navegación (ver `coStartPayment`).

### Pendientes abiertos
- Precio mensual real del Virtual Address (quedó $99/mo placeholder).
- Cablear **Stripe subscriptions reales** + botón de cancelación en el portal.
- SSN: se decidió dejarlo como paso propio (no dentro del box de la oferta).
- **EDITAR DESDE LA REVISIÓN — "estándar de oro" (FUTURO):** hoy "Editar" salta al
  paso (`coEditStep`) y el cliente vuelve por el flujo normal. El gold standard
  (Amazon/Shopify/Stripe Checkout) es **edición inline tipo acordeón**: toda la
  revisión en una sola pantalla, cada sección (empresa, dirección, dueños, agente)
  con "Editar" que la abre AHÍ mismo, se edita y se cierra de vuelta, sin navegar.
  Implica reescribir el paso de revisión para editar in-situ (no saltar a pasos).
  Mientras tanto, mejora rápida disponible (NO hecha): patrón "Volver a revisar
  orden" — un botón en el paso editado que valida y salta directo a la revisión
  (flag de origen en `coEditStep`).
