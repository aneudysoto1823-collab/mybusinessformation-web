# Proceso 37 — Registered Agent Service (integración RegisteredAgentsInc)

Documento maestro de la integración con **RegisteredAgentsInc (Corporate Tools)**, el proveedor mayorista que le da a OpaBiz la dirección física del Registered Agent en Florida que cada LLC/Corporation exige por ley.

Cuando un cliente compra el paquete Standard o Premium (ambos incluyen RA gratis el primer año) o marca el addon "Registered Agent" en Basic, el sistema automáticamente crea la company del cliente en la cuenta de RAI, le asigna el servicio de RA para Florida, recibe la dirección oficial (7901 4th St N, STE 300, St. Petersburg, FL 33702 — que puede variar), la guarda en la orden y se la manda al cliente por email. Todo esto pasa en segundos, dentro de la misma cadena que confirma el pago.

Lo único que sigue siendo manual es el pago de la factura mayorista ($45 por company que RAI le cobra a OpaBiz) — el staff la paga desde el portal de RAI cuando quiere. Esta separación es intencional: no queremos automatizar el débito automático hasta hablar con el account manager de RAI.

---

## Cuándo se dispara — la señal es el addon `ra`

El trigger vive dentro del webhook Stripe (`app/api/webhooks/stripe/route.ts`, función `handleFormationPaid`). Cuando el pago de la orden se confirma:

1. Se marca la orden como `paid + in_review`
2. Sale el email A1 al cliente (confirmación de orden — el email de "Payment confirmed" con el detalle del paquete y los servicios)
3. Sale la alerta A0 al equipo (nueva orden pagada, a `alert@opabiz.com`)
4. **En paralelo, fire-and-forget:** si `order.addons.ra === true`, se dispara `provisionRaForOrder(order.id)`

El chequeo `addons.ra === true` es lo único que decide si la cadena RA corre o no. Órdenes sin ese flag (Basic sin addon RA) no ejecutan ni una línea del nuevo código — cero superficie de impacto para el flujo existente.

**"Fire-and-forget" con `.catch()`:** si el provisioning falla por cualquier razón, no bloquea la confirmación del pago del cliente ni el email A1. La orden queda marcada `paid`, el cliente recibe su confirmación, y la falla del RA se resuelve aparte (alerta interna + botón Retry en el panel admin).

---

## La cadena `provisionRaForOrder` — 4 pasos secuenciales

Vive en `backend/lib/ra-provisioning.ts`. La cadena es **idempotente por default** — si algún paso ya se ejecutó (los IDs correspondientes están guardados en la orden), lo saltea. Con `force: true` (que usa el botón Retry del admin) ignora la guardia general "already provisioned" pero sigue chequeando cada paso individual.

### Paso 1 — `POST /companies` en RAI

Crea la company en la cuenta de RAI del environment activo (`CORPTOOLS_ENV`). Body:

```json
{
  "companies": [{
    "name": "<order.companyName>",
    "entity_type": "Limited Liability Company",
    "home_state": "Florida"
  }],
  "duplicate_name_allowed": false
}
```

**Skip si ya existe `raCompanyId`** en la orden. Guarda el `id` que devuelve RAI en `raCompanyId`. Si falla → alerta a `alert@opabiz.com` + return sin ejecutar los pasos siguientes.

### Paso 2 — `POST /services` en RAI (⭐ acá viene la dirección)

Asigna el servicio de RA para Florida a la company recién creada. Body:

```json
{
  "company_id": "<raCompanyId>",
  "jurisdictions": ["Florida"]
}
```

**Hallazgo crítico de Fase 0:** el response incluye la dirección del RA **inmediatamente**, sin necesidad de esperar a que la factura se pague. La estructura es:

```json
{
  "result": [{
    "id": "<service_id>",
    "status": "active",
    "registered_agent": {
      "name": "Registered Agents Inc",
      "address": {
        "line1": "7901 4th St N",
        "line2": "STE 300",
        "state_province_region": "FL",
        "city": "St. Petersburg",
        "zip_postal_code": "33702"
      }
    }
  }]
}
```

**Esto contradice lo que sugería la doc oficial de RAI** para Wyoming (donde dice que hay que hacer un `POST /services/:id/info` extra antes de que el service quede "active"). Florida NO requiere ese paso — el service queda `active` desde el momento cero. Verificado empíricamente en Fase 0 (ver `scripts/corptools-test-fase0.mjs`).

Guarda `raServiceId`, `raAddress` (objeto completo) y `raProvisionedAt` (timestamp). Si el response no trae dirección (edge case), guarda igual el `raServiceId` para que el retry pueda intentar recuperarla después, y manda alerta con "POST /services (address missing)".

### Paso 3 — `GET /invoices?company_id=…`

Obtiene el `invoice_id` que RAI generó al asignar el servicio. Este ID es lo que el staff busca en el portal RAI para pagar la factura manualmente.

Skip si ya existe `raInvoiceId`. Si el GET falla, NO detiene la cadena — el service ya está asignado y la dirección guardada. Solo loguea warn y sigue. El staff puede buscar la factura en el portal por company_name.

### Paso 4 — `sendRaAddressReady()` al cliente

Manda el segundo email al cliente con la dirección de RA. Skip si `raAddressEmailSentAt` ya tiene valor (idempotencia — el cron de auditoría del futuro no va a re-enviar). Guarda el timestamp del envío.

---

## Los emails que recibe el cliente — son DOS

El cliente que compra formación con addon RA recibe **dos emails** en cuestión de segundos, sin superposición de contenido:

### Email 1 — "Payment confirmed" (A1, ya existente)

Es el email de confirmación de orden que **cualquier** cliente de formación recibe, sin importar si compró RA o no. Contenido:
- Título "Thank you for your order, {firstName} {lastName}!"
- Order Number (FBFC-XXXXXXXX)
- Tabla de precios itemizada (paquete + state fee + expedited si aplica + addons)
- Sección "What's included" con los servicios del paquete
- 3 pasos numerados "What happens next"

**Este email NO menciona la dirección del RA todavía** — solo dice que el pedido está recibido y en review.

### Email 2 — "Your Registered Agent is active" (nuevo)

Vive en `sendRaAddressReady()` en `lib/notifications.ts`. Bilingüe EN/ES. Contenido:
- Header OpaBiz + eyebrow "Registered Agent Service"
- Saludo con nombre completo: "Your Registered Agent is active, {firstName} {lastName}"
- Order Number en su caja
- Card con Company + Entity Type
- **Card azul destacada con la dirección completa** (línea 1, línea 2, city/state/zip)
- Párrafo explicando qué es esta dirección y dónde usarla (banco, IRS, licencias, contratos)
- Párrafo sobre forwarding de documentos legales
- Botón "Track My Order" al home + link WhatsApp

**Regla operacional del copy:** este email NUNCA menciona a "RAI" ni al proveedor. Para el cliente, OpaBiz le está proveyendo el servicio de RA. La existencia del proveedor mayorista es transparente.

---

## El panel admin — sección "Registered Agent (RAI Provisioning)"

En `/admin/orders/[id]`, entre las secciones "Agente Registrado" (lo que el cliente eligió en el form) y "Miembros / Organizers". **Solo visible si `order.addons.ra === true`** — para las órdenes sin ese flag, la sección no aparece.

Contenido:

1. **Badge de estado** (color según cómo salió el provisioning):

| Badge | Significado | Botón Retry hace |
|---|---|---|
| 🟢 Activo (dirección asignada) | Todo OK, cliente ya recibió su email | Skip (no toca nada) |
| 🟡 Provisionado (sin dirección) | `POST /services` corrió pero el response no trajo dirección | Reintenta `POST /services` |
| 🔴 Company creada (falta service) | `POST /companies` OK, `POST /services` falló | Reintenta desde `POST /services` |
| ⚪ Sin provisionar | El webhook nunca disparó el trigger | Corre toda la cadena |

Al lado del badge, timestamps de "Provisionado" y "Email al cliente" cuando existan.

2. **Company ID y Service ID** — copiables (para lookup manual en el portal RAI si hace falta).

3. **Caja destacada con Invoice ID** — con la nota "Sin pagar — el staff paga en el portal RAI". Esta caja es lo que el staff necesita para hacer el pago manual. Cuando (a futuro) marquemos `raInvoicePaid = true`, el badge de la caja cambia a verde "Pagada".

4. **Card azul con la dirección asignada** — mismo formato que el email al cliente, para visualización rápida del staff.

5. **Botón "🔁 Retry RA provisioning"** — llama al endpoint `/api/admin/orders/[id]/ra-retry` que ejecuta `provisionRaForOrder(orderId, {force: true})`. Idempotente — solo re-ejecuta los pasos cuyos IDs falten. Feedback en pantalla ("Retry OK — refrescando datos…" o mensaje de error).

---

## Cómo pagamos la factura al proveedor — 100% manual

Cada company creada en RAI genera una factura de **~$45** wholesale (el precio público del RA en el website de RAI es $200, nosotros pagamos $45 como partner). El staff paga estas facturas manualmente desde el portal de RAI cuando quiere — no hay automatización de pago en este mandato.

Flujo del staff:
1. Ve la orden pagada en `/admin` (o le llega el email A0 de nueva orden)
2. Entra al detalle de la orden y copia el `Invoice ID` de la sección RA
3. Va al portal de RAI (`https://www.registeredagentsinc.com/`)
4. Busca la factura por Invoice ID
5. Paga con tarjeta

**No automatizamos porque:**
- No queremos automatizar débitos hasta hablar con el account manager de RAI y confirmar tarifas + condiciones
- Queremos que un humano vea cada factura antes de pagarla en la fase inicial
- El pago no es urgente — RAI mantiene el servicio activo desde el momento cero, el cliente recibe su dirección inmediata sin depender del pago

Esta decisión se revisará cuando el volumen crezca.

---

## Cuando algo falla — cómo nos enteramos

La cadena `provisionRaForOrder` es fire-and-forget con manejo defensivo. Si algún paso falla, la orden queda marcada `paid` normalmente (el cliente no ve nada raro), pero al equipo le llega una alerta interna.

**Email de alerta** — se manda a `alert@opabiz.com` (mismo destino que las alertas A0 y las alertas de reembolsos/chargebacks). Contenido:

- Header rojo "⚠️ RA provisioning fallo"
- Empresa afectada
- Order ID (font monospace, copiable)
- **Fase que falló** (POST /companies / POST /services / POST /services address missing / sendRaAddressReady)
- Mensaje de error de la API
- Botón "Abrir en el panel admin →" con link directo a la orden
- Nota explicando que el pago del cliente sí se procesó normalmente, solo el RA falló, y que el botón Retry es la manera de arreglarlo

**El staff no tiene que hacer nada más que:** abrir el link del email → clickear "Retry RA provisioning" → la cadena reintenta desde donde falló → si funciona, badge pasa a verde y el cliente recibe su email de RA.

Si el retry sigue fallando (RAI caído, credenciales rotas, etc.), la alerta se re-manda en el próximo intento. La orden queda en un estado consultable/arreglable — no hay pérdida de datos.

---

## Environments y separación estricta de credenciales

`CORPTOOLS_ENV` decide qué par de keys usar en runtime. Layout actual en Vercel:

| Environment | `CORPTOOLS_ENV` | Keys cargadas |
|---|---|---|
| Development | `test` | ACCESS_KEY_TEST + SECRET_KEY_TEST + WEBSITE_URL_TEST |
| Preview | `test` | Mismas keys TEST |
| Production | `prod` | ACCESS_KEY_PROD + SECRET_KEY_PROD + WEBSITE_URL_PROD |

**Cero cross-contamination** — las keys de PROD nunca están en Development ni Preview. Las de TEST nunca están en Production. Si se necesita un smoke test en Production con la cuenta TEST (para no generar facturas reales), hay que cargar temporalmente las TEST keys en Production + flipear `CORPTOOLS_ENV=test` y revertir después.

Las keys TEST viven además en `backend/.env.local` del founder (para correr los scripts de smoke test locales). Las de PROD NO viven en local — decisión intencional del founder.

**Nota sobre la URL:** el website registrado en la cuenta de RAI es `www.registeredagentsinc.com` — string exacto sin protocolo, sin slash final. El API hace matching de texto estricto (verificado en Fase 0), así que `https://www.registeredagentsinc.com/` o `www.registeredagentsinc.com/` devuelven `website: null`. Los dos environments (TEST y PROD) comparten el mismo `website_id` internamente, por eso ambos usan la misma URL.

---

## Base de datos — las 7 columnas de la orden

Migración: `supabase_migration_ra_provisioning.sql`, ya aplicada en Supabase (2026-08-01, vía `supabase db query --db-url`).

```
raCompanyId              TEXT       -- id que devuelve POST /companies
raServiceId              TEXT       -- id que devuelve POST /services
raInvoiceId              TEXT       -- id que devuelve GET /invoices
raInvoicePaid            BOOLEAN    -- default false; se marca true cuando el
                                       cron de auditoría (a futuro) confirme el
                                       pago vía otro endpoint
raAddress                JSONB      -- {line1, line2, city, state, zip}
raProvisionedAt          TIMESTAMPTZ-- momento en que POST /services corrió OK
raAddressEmailSentAt     TIMESTAMPTZ-- momento del envío del email al cliente
                                       (para idempotencia del cron futuro)
```

Más un partial index para la query del cron pendiente:

```sql
CREATE INDEX idx_order_ra_pending_address
  ON "Order" ("raServiceId")
  WHERE "raServiceId" IS NOT NULL AND "raAddress" IS NULL;
```

---

## Scripts de utility disponibles

Todos en `backend/scripts/`, todos leen `CORPTOOLS_ACCESS_KEY_TEST` / `CORPTOOLS_SECRET_KEY_TEST` del `.env.local` (nunca las de PROD).

| Script | Qué hace | Costo |
|---|---|---|
| `corptools-test-fase0.mjs` | 3 GETs read-only para validar que las keys TEST funcionan y descubrir el Florida `product_id` | Cero |
| `corptools-manual-flow.mjs` | Dry-run o ejecución real del flujo completo (POST /companies + POST /services + GET /invoices) contra la cuenta TEST. Requiere `--name="TEST …"` obligatorio | Real: crea company + factura de $45 en TEST |
| `corptools-service-info.mjs` | Consulta puntual `GET /services/:id/info` para inspeccionar un service específico | Cero |
| `corptools-test-e2e.mjs` | Crea una Order de test directamente en Supabase con `addons.ra=true`, corre `provisionRaForOrder` dos veces (verifica idempotencia), genera HTML preview del email del cliente en el scratchpad | Crea una Order en Supabase real + factura de $45 en RAI TEST |

Todos tienen guardias de seguridad: `CORPTOOLS_ENV=test` obligatorio, nombres de company deben empezar con "TEST " (regla operacional de RAI para filtrar pruebas del volumen real).

---

## Pendientes

### Cron de auditoría (endpoint TBD)

Diseñado pero no construido. Idea: correr diariamente para chequear:
- Órdenes con `raServiceId IS NOT NULL AND raAddress IS NULL` — retry del `POST /services` para recuperar la dirección
- Órdenes con `raAddress` pero sin `raAddressEmailSentAt` — reintenta el envío del email
- Órdenes con `raInvoiceId` pero sin `raInvoicePaid` — chequea con RAI si la factura se pagó y marca la columna

**Bloqueador:** `GET /services/:id/info` pre-pago devuelve `service_info: {}` (comprobado en Fase 1). Necesitamos descubrir qué endpoint de RAI da el estado "vivo" del service — probablemente `GET /services/:id` (sin `/info`) o `GET /services?company_id=...`. Se investiga cuando haga falta.

**No bloquea nada** — el sistema funciona sin cron. La cadena principal completa el flujo entero en segundos, y el botón Retry cubre los edge cases.

### Automatización del pago de facturas al proveedor

Diferido explícitamente en este mandato. Requiere conversación con el account manager de RAI para confirmar tarifas + condiciones de débito. Cuando se decida, la implementación es simple: `POST /payment-methods` + `POST /invoices/pay` desde el mismo cliente `lib/corporate-tools.ts` — pero no se toca hasta luz verde.

### Rotación de credenciales

Las keys PROD estuvieron un tiempo visibles en el `.env.local` del founder (hoy ya eliminadas de local, solo viven en Vercel Production). Rotar keys en el portal de RAI es una buena higiene periódica — 5 minutos de trabajo, se regenera el par y se actualiza Vercel con `vercel env rm` + `vercel env add`.

---

## Historia y decisiones clave

- **2026-07-28** — Mandato inicial: integración con RAI, pago manual, no automatizar POST /invoices/pay
- **2026-07-28** — Fase 0 completada. Descubrimos que la URL correcta es `www.registeredagentsinc.com` sin protocolo (`https://…/` devuelve `website: null`). Florida `product_id`: `694eed29-f883-4aa0-bec5-3eee786e8977` en TEST. Precio público $200/año, wholesale $45.
- **2026-07-29** — Fase 1 completada. Descubrimos que la dirección viene inmediata en el response de `POST /services` sin necesidad de pagar la factura. Esto simplificó el diseño — el cron original pensado para "polling hasta que llegue address" se degradó a "cron de auditoría opcional".
- **2026-07-30** — Fase 2 completada (webhook + cliente RAI + admin panel + email). E2E test corrido con éxito contra cuenta TEST.
- **2026-08-03** — Push a producción (`581507f`) + carga de env vars por CLI con separación estricta por environment. Smoke test visual del panel admin OK.

---

## Relacionados

- Doc 02 — Emails automáticos (A1 sigue siendo el email general de confirmación; este nuevo email de RA no está numerado en la serie A-D pero sigue las mismas convenciones)
- Doc 26 — Arquitectura Sunbiz y backups (mismo patrón de `supabase db query --db-url` para migraciones)
- Doc 35 — Reembolsos y chargebacks (usa el mismo destino `alert@opabiz.com` para alertas internas)
