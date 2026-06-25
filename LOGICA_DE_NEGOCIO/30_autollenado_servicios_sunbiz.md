# 30 — Autollenado de servicios por número de registro (Sunbiz / Turso)

**Estado:** Lado ADMIN implementado (2026-06-24). Lado CLIENTE (autollenar en el checkout) pendiente.

## ✅ Implementado (lado admin)
- **`lib/turso.ts` → `lookupCompanyByDocument()`** — consulta `sunbiz_corps` (3.5M, Turso) por número de documento. Lectura defensiva por columna.
- **`/api/admin/sunbiz-lookup`** — endpoint protegido (`verifyAdminToken`) que devuelve la empresa normalizada.
- **`/admin` (OrdersTable)** — tab/filtro **"Servicios"** (`package='services'`) + badge morado.
- **`/admin/orders/[id]` → `ServicesFilingForm.tsx`** — cuando `package='services'`: bloque empresa autollenado de Turso + contacto + secciones SOLO de los servicios pedidos (prellenados con lo que aportó el cliente). Editable + imprimible. **Ediciones aún NO se persisten** (hoja de trabajo).
- **`lib/service-fields.ts`** — definición compartida de campos por servicio (mismas keys que `SVC_EXTRAS` del checkout del cliente).

## ✅ Implementado (lado cliente) — 2026-06-25
- `/servicios/checkout` ahora **arranca por el número de registro** (card prominente arriba). Al buscar → `/api/sunbiz/company` (público, Turso) autollena nombre/tipo/dirección y los **oculta** (confirmación read-only "Encontramos tu empresa" + link Editar). Si no se encuentra → se revelan campos manuales. **Regla: NO se le pide al cliente nada que esté en Turso.** Solo teclea nombre/email/teléfono/firma + lo específico/sensible por servicio.

### Campos quitados por estar en Turso (no se le piden al cliente)
- Operating Agreement: **Fecha de formación** (= `filing_date`).
- Annual Report: **Agente registrado nombre + dirección** (= `registered_agent_*`).
- EIN: **Fecha de inicio del negocio** (= `filing_date`) y **nombre del responsible party** (la persona que ordena, ya capturada arriba en "Tu información").
- Registered Agent: **agente actual** (= `registered_agent_name`) → ese servicio ya no pide extras.

### Campos COMPARTIDOS (se piden UNA vez aunque varios servicios los usen)
- `lib/service-fields.ts` exporta **`SHARED_FIELDS`** (`ein`, `ssnItin`) + helper **`sharedKeysForServices()`**. Cada servicio declara `shared: [...]` en vez de repetir el campo.
- **EIN / Tax ID**: lo comparten annual-report, banking-resolution, business-tax-receipt, sales-tax, scorp-election, foreign-llc, business-license, dissolution, cierre-fiscal.
- **SSN/ITIN del responsible party**: lo comparten ein, sales-tax, cierre-fiscal.
- Cliente: sección **"Datos requeridos"** (`#co-shared-section`, `var SHARED_CFG`), valores en `intake.shared`. Admin: bloque **"Datos requeridos (compartidos)"** pre-llenado de `intake.shared` (keys `s_<k>`). No requiere cambio de endpoint (va dentro de `intake`).

### Filas estructuradas (repeater)
- Miembros (Operating Agreement), Oficiales (Annual Report) y Accionistas (S-Corp) son tipo **`repeater`** (filas con columnas: nombre/%/título/dirección/SSN según el caso) con Agregar/Quitar. Valor guardado como JSON string en `extras[svcId.fieldKey]`. Soportado en cliente y admin + impresión.

### Fuente única de campos
- El checkout del cliente **inyecta `SERVICE_FIELDS` y `SHARED_FIELDS` desde `lib/service-fields.ts`** (antes tenía copia inline duplicada que se desincronizó). Ahora cliente y admin SIEMPRE coinciden. **Para tocar campos: editar solo `lib/service-fields.ts`.**

## Pendiente
- [ ] Persistir las ediciones del `ServicesFilingForm` (admin) de vuelta a la orden.
- [ ] Verificar en deploy que el lookup a Turso trae los campos (probar con un número real). Turso tiene env vars en Vercel; localmente no se puede probar.
- [ ] Confirmar nombre exacto de columnas en la tabla Turso (asumido `document_number`, `entity_name`, etc. según doc 26).

---

**Contexto original del plan (referencia):** Decidido 2026-06-24.

## Objetivo

En `/servicios/checkout`, el cliente ingresa **solo su número de registro de Florida** (LLC o Corp). El sistema busca la empresa, **autollena todo lo que es registro público**, y al cliente **solo se le piden los huecos** que Sunbiz no tiene. Para empresas establecidas, el form se vuelve muy corto.

## Flujo

```
/servicios (carrito) → Continuar → /servicios/checkout
  Paso 0 (nuevo): "Ingresa tu número de registro FL"  → lookup
     ├─ Encontrada → recuadro solo-lectura "Encontramos tu empresa ✓"
     │                (nombre, tipo, dirección, agente) + se piden SOLO los huecos
     └─ No encontrada (empresa nueva / no cargada) → fallback: form manual actual
  Paso 1: huecos por servicio   Paso 2: review + Stripe (ya existe)
```

## Qué autollena Sunbiz (tabla `sunbiz_corps`, igual en Supabase y Turso)

✅ `entity_name` (nombre legal) · `entity_type` (LLC/CORP) · `status` · `filing_date`
✅ `principal_address` + city + state + zip · `mailing_address` (+city/state/zip)
✅ `registered_agent_name` + `registered_agent_address`

## Lo que el cliente SIEMPRE teclea (NO está en Sunbiz)

- **Email y teléfono** (no están en `sunbiz_corps`)
- **Firma electrónica**
- **EIN / Tax ID** — nunca público. El cliente lo teclea cuando el servicio lo requiere.
- **SSN / ITIN** del responsible party — sensible, nunca público. El cliente lo teclea.
- **Socios/oficiales con % de propiedad** — Sunbiz tiene oficiales pero **nuestra tabla NO los guarda** (ver Pendientes).

## Huecos por servicio (lo que se pide además del autollenado)

| Servicio | Huecos a pedir al cliente |
|---|---|
| Certified Copy | copias, formato entrega, email |
| Good Standing | propósito, copias, formato, email |
| Exclusive Guide | email (+ industria opcional) |
| Registered Agent | email, teléfono, firma |
| Dissolution | motivo, fecha aprobación, autorización, email, firma |
| DBA | nombre ficticio NUEVO, email, firma |
| Annual Report | EIN, confirmar oficiales, email, firma |
| EIN | **SSN/ITIN**, fecha inicio, actividad, email, firma |
| ITIN | datos personales/pasaporte completos (nada en Sunbiz) |
| Sales Tax | EIN, **SSN/ITIN**, qué/dónde vende, ventas mensuales |
| S-Corp Election | EIN, accionistas + **SSN/ITIN**, fecha efectiva |
| Tax Closure | EIN, **SSN/ITIN**, motivo, fecha última actividad |
| Banking Resolution | EIN, banco, tipo de cuenta, persona autorizada |
| Amendment | qué cambia + valores NUEVOS, email, firma |
| Operating Agreement | % de propiedad, tipo de gestión, miembros |
| Foreign LLC | estado(s) destino, motivo, EIN |
| Business Tax Receipt | condado, industria, EIN |
| Business License | condado, industria, descripción, EIN |
| Virtual Address | plan, dirección de reenvío |

## Lo que necesito del socio (contrato del lookup)

El socio está construyendo búsqueda en Sunbiz (commits "real-time business name availability" + "silent name check", doc 29). Para no duplicar:

1. **¿Qué fuente?** Recomendado: **Turso `sunbiz_corps` (3.5M, completa)**. Hoy `/api/sunbiz` pega a la tabla **Supabase** (puede estar parcial — los 3.5M se cargan en Turso). Confirmar cuál usar para el lookup por `document_number`.
2. **Endpoint estable** que reciba `document_number` y devuelva: name, type, status, filing_date, principal address completo, mailing address, registered_agent_name + address. (Hoy `/api/sunbiz` ya devuelve casi todo menos `registered_agent_address` y `mailing_*` — fácil de añadir al `select`.)
3. Confirmar manejo de **no encontrada** (status code / shape) para activar el fallback manual.

## Implementación (cuando se coordine)

- En `app/servicios/checkout/page.tsx`: agregar Paso 0 (input número + botón Buscar) que llama al endpoint. Al encontrar, guardar el objeto company y **ocultar** los campos del bloque común que ya vienen llenos (mostrar recuadro solo-lectura) y renderizar solo los huecos.
- `SVC_EXTRAS` ya define los campos por servicio — reutilizar; los "huecos" son ese set menos lo que Sunbiz autollena.
- El admin ya ve TODO (autollenado + huecos) porque el intake se guarda en `Order.addons` (JSON). No requiere pantalla nueva de admin.

## Pendientes / dependencias

- [ ] Decidir fuente de lookup con el socio (Turso vs Supabase) y endpoint.
- [ ] Ampliar `/api/sunbiz` select con `registered_agent_address`, `mailing_*`.
- [ ] Socios/oficiales NO se guardan → para Annual Report / OA se siguen pidiendo (o ampliar el scraper a una tabla `sunbiz_officers`).
- [ ] Ver [[project-servicios-checkout-alacarte]] para el estado del checkout.
