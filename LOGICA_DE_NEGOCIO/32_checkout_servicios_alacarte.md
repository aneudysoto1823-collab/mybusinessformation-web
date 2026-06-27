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

## Precios placeholder pendientes antes de LIVE

`registered-agent`, `virtual-address`, `annual-report` están en $99 placeholder y
las `stateFee` son aproximadas (ver nota en `services-pricing.ts`). Confirmar todos
los precios (individuales + bundles) antes de lanzar.
