# 24 — Módulo de Contabilidad

Documento maestro del módulo interno de contabilidad para gestión financiera de OpaBiz: clientes, ingresos (facturas), gastos (incluido recurrentes con auto-renovación), reportes, taxes federales estimados, sync con órdenes del wizard de formación, análisis de facturas vía Claude Haiku, y export Excel.

> Construido por Fabián en commits `903e096` (módulo base, 2026-05-27) → `c6ba689` (docs en CLAUDE.md), evolucionando con auto-renovación, análisis IA y responsive. **NO es un sistema contable certificado** — es una herramienta interna de tracking + cálculo aproximado de taxes federales estimados. Para presentación oficial al IRS usar la data exportada con un CPA.

---

## 1. Alcance y filosofía

| ✅ Lo que cubre | ❌ Lo que NO cubre |
|----------------|--------------------|
| Tracking de ingresos por cliente con facturación interna | Facturación oficial al cliente (no genera invoices PDF para enviar) |
| Tracking de gastos por categoría y tipo (fijo/variable) | Reconciliación bancaria automática |
| Gastos recurrentes con auto-renovación | Integración con QuickBooks / Xero |
| Cálculo aproximado de taxes federales estimados (rate configurable) | Cálculo oficial de taxes (eso es trabajo del CPA) |
| Reportes consolidados por período | State income tax (Florida no tiene, por eso solo federal) |
| Alertas de vencimiento de gastos recurrentes | 1099-NEC / 1099-MISC generation |
| Sync de órdenes del wizard como ingresos | W-2 / payroll calculation |
| Análisis de facturas/recibos con IA (Claude Haiku) | OCR genérico (solo facturas/recibos) |
| Export a Excel (`.xlsx` vía SheetJS) | API pública para integraciones externas |
| Export PDF (via `window.print` + `@media print`) | Multi-tenant (solo OpaBiz) |

**Filosofía**: herramienta de visibilidad financiera + insumo para el CPA en cierre fiscal trimestral, no software contable certificado.

---

## 2. Schema de DB

Tres tablas principales en Supabase. La de gastos tiene una migración separada para recurrencia (`supabase_migration_recurring_expenses.sql`).

### `accounting_clients`

Clientes contables. Puede estar enlazada a una `Order` del wizard de formación (cuando se sync).

Campos clave:
- `id` uuid PK
- `name` text NOT NULL
- `email`, `phone` text (nullable)
- `status` text — `'active'` | `'inactive'`
- `order_id` text — FK opcional a `Order.id` cuando viene del sync (idempotencia)
- `created_at`, `updated_at`

### `accounting_income`

Facturas/ingresos. Puede estar enlazada a un cliente y a una orden.

Campos clave:
- `id` uuid PK
- `client_id` uuid → `accounting_clients.id`
- `order_id` text → opcional, link a `Order.id` (idempotencia del sync)
- `invoice_number` text — formato `INV-YYYY-NNN` (auto-generado secuencial)
- `invoice_date` date
- `service_type` text — `'llc'` | `'corp'` | `'addon'` | `'new_business_letter'` | `'other'`
- `description` text
- `amount` numeric — total a cobrar
- `payment_method` text — `'stripe'` | `'cash'` | `'transfer'` | `'other'`
- `payment_status` text — `'pending'` | `'partial'` | `'paid'`
- `amount_paid` numeric — para pagos parciales
- `notes` text

### `accounting_expenses`

Gastos. La columna `is_recurring` + recurrence + renewal_date + auto_renew gestionan el sistema de auto-renovación.

Campos base:
- `id` uuid PK
- `expense_date` date — fecha del gasto
- `category` text — una de: `marketing`, `software`, `office`, `state_fees`, `payroll`, `taxes`, `other`
- `expense_type` text — `'fixed'` | `'variable'`
- `description` text NOT NULL
- `amount` numeric
- `receipt_note` text — nota o número de recibo
- `receipt_url` text — URL al PDF/imagen del recibo en Supabase Storage

Campos de recurrencia (migración `supabase_migration_recurring_expenses.sql`):
- `is_recurring` boolean DEFAULT false
- `recurrence` text — `'none'` | `'monthly'` | `'annual'`
- `renewal_date` date — próxima fecha de vencimiento (para alertas y auto-renovación)
- `auto_renew` boolean DEFAULT true — si está activo, el endpoint `process-renewals` crea el nuevo período automáticamente; si `false`, queda como gasto vencido sin renovar

Índice optimizado para alertas:
```sql
CREATE INDEX idx_accounting_expenses_renewal
  ON accounting_expenses (renewal_date)
  WHERE is_recurring = TRUE;
```

---

## 3. Endpoints API

Todos en `backend/app/api/contabilidad/`. **Todos validan `verifyAdminToken`** vía cookie `admin_session`. Si la cookie falta o el token no valida → 401. Patrón consistente con el resto de admin endpoints post-auditoría OWASP del 2026-05-19.

### Dashboard

| Endpoint | Método | Qué hace |
|----------|--------|----------|
| `/api/contabilidad/dashboard` | GET | Métricas agregadas: totalBalance, totalRevenue, totalExpenses, mes corriente, clientes activos, pending amount, recent income/expenses (5 cada uno), upcoming renewals (próximos 30 días + retroactivos 7) |

### Clientes

| Endpoint | Método | Qué hace |
|----------|--------|----------|
| `/api/contabilidad/clientes` | GET | Lista con filtros opcionales |
| `/api/contabilidad/clientes` | POST | Crea cliente |
| `/api/contabilidad/clientes/[id]` | PATCH | Actualiza |
| `/api/contabilidad/clientes/[id]` | DELETE | Borra |

### Ingresos

| Endpoint | Método | Qué hace |
|----------|--------|----------|
| `/api/contabilidad/ingresos` | GET | Lista (filtros: cliente, status, periodo) |
| `/api/contabilidad/ingresos` | POST | Crea factura. Auto-genera `invoice_number` formato `INV-YYYY-NNN` |
| `/api/contabilidad/ingresos/[id]` | PATCH | Actualiza |
| `/api/contabilidad/ingresos/[id]` | DELETE | Borra |

### Gastos

| Endpoint | Método | Qué hace |
|----------|--------|----------|
| `/api/contabilidad/gastos` | GET | Lista (filtros: category, from/to date) |
| `/api/contabilidad/gastos` | POST | Crea. Si `is_recurring=true`, valida `recurrence` y `renewal_date` |
| `/api/contabilidad/gastos/[id]` | PATCH | Actualiza |
| `/api/contabilidad/gastos/[id]` | DELETE | Borra |
| `/api/contabilidad/gastos/[id]/upload` | POST | Sube PDF/imagen del recibo a Supabase Storage |
| `/api/contabilidad/gastos/process-renewals` | POST | **Procesa todos los gastos recurrentes vencidos hasta hoy**. Ver sección "Auto-renovación" abajo |

### Sync de órdenes

| Endpoint | Método | Qué hace |
|----------|--------|----------|
| `/api/contabilidad/sync-orders` | POST | Importa órdenes del wizard que aún no estén en `accounting_income`. Idempotente — usa `order_id` para deduplicar. Crea cliente nuevo si no existe |

### Análisis de facturas con IA

| Endpoint | Método | Qué hace |
|----------|--------|----------|
| `/api/contabilidad/analyze-invoice` | POST | Sube PDF/JPG/PNG/WEBP → Claude Haiku 4.5 extrae `vendor`, `date`, `amount`, `description`, `category` (de las 7 disponibles), `is_recurring`, `recurrence`. Devuelve JSON sanitizado para pre-rellenar el form de gasto |

### Reportes

| Endpoint | Método | Qué hace |
|----------|--------|----------|
| `/api/contabilidad/reportes` | GET | Reporte consolidado por período (from/to date) — ingresos por servicio + gastos por categoría |

### Reset (NUCLEAR)

| Endpoint | Método | Qué hace |
|----------|--------|----------|
| `/api/contabilidad/reset` | DELETE | **Borra TODOS los datos contables**. Requiere body `{"confirm": "RESET_CONTABILIDAD"}` como guardia. Útil para limpiar data de pruebas antes de producción |

---

## 4. Páginas (UI)

### `/admin/contabilidad` — Dashboard

[`backend/app/admin/contabilidad/page.tsx`](backend/app/admin/contabilidad/page.tsx)

Bloques:
- **Stats**: total revenue, total expenses, balance, mes corriente, pending amount, clientes activos
- **Taxes federales estimados** — calculado client-side con `taxRate` configurable (persistido en `localStorage` key `contabilidad_tax_rate`, default 25%)
- **Pagos IRS trimestrales** — fechas hardcoded del calendario IRS 2025:
  - Q1 (Ene–Mar) → Apr 15
  - Q2 (Abr–May) → Jun 16
  - Q3 (Jun–Ago) → Sep 15
  - Q4 (Sep–Dic) → Ene 15 (siguiente año)
- **Alertas de vencimiento de gastos recurrentes** — próximos 30 días + retroactivos 7 días
- **Recent activity** — últimos 5 ingresos + últimos 5 gastos
- **Botones de acción**:
  - "Sync órdenes" → POST `/api/contabilidad/sync-orders`
  - "Procesar renovaciones" → POST `/api/contabilidad/gastos/process-renewals`
  - "Poner en cero" → DELETE `/api/contabilidad/reset` con confirm

### `/admin/contabilidad/clientes` + `/[id]`

CRUD básico de clientes. Detalle por cliente muestra histórico de ingresos.

### `/admin/contabilidad/ingresos`

Lista + form de alta. Filtros por status, cliente, periodo. Export Excel/PDF.

### `/admin/contabilidad/gastos`

[`backend/app/admin/contabilidad/gastos/page.tsx`](backend/app/admin/contabilidad/gastos/page.tsx)

Lista + 2 botones de alta:
- **Registro Manual** — form vacío
- **Registro con Factura** — sube archivo → `/analyze-invoice` extrae datos via Claude Haiku → pre-rellena el form para que el user revise y confirme

Acciones por fila:
- Editar
- Borrar (X roja con confirmación, no botón "Eliminar" — commit `38652b0`)

Filtros: por categoría, por rango de fechas.

Export: Excel (SheetJS) y PDF (window.print + @media print).

### `/admin/contabilidad/reportes`

Reporte consolidado con totales por servicio (ingresos) y por categoría (gastos), filtrado por período.

---

## 5. Cálculo de taxes federales estimados

100% en cliente (`localStorage` + estado React). No hay backend para esto — es solo aproximación.

### Lógica

```ts
estimatedTax = max(0, totalBalance) * taxRate / 100
netProfit = totalBalance - estimatedTax
pagoTrimestralIRS = estimatedTax / 4
```

donde:
- `totalBalance` = `totalRevenue - totalExpenses` viene del endpoint `/dashboard`
- `taxRate` configurable por el user, default **25%**, guardado en `localStorage[contabilidad_tax_rate]`

### Por qué 25% default

Approximación razonable para una LLC single-member tratada como pass-through:
- Federal income tax bracket (depende de ingreso total del founder, típico 22-32%)
- Self-employment tax (15.3%) sobre net earnings, pero solo aplica si la LLC opta por que sí

25% es **conservador** — sobreestima ligeramente, lo cual es OK para que el founder reserve cash. Si la situación real es 22% con S-Corp election, el founder ajusta el rate.

### Florida — solo federal

Florida **NO tiene state income tax**. Por eso el módulo solo calcula federal. Si en el futuro OpaBiz expande a otro estado (ej. Texas tampoco, NY/CA sí), agregar columna `state_tax_rate` y lógica adicional.

---

## 6. Sistema de gastos recurrentes

El feature más complejo del módulo. Combina alerta + auto-renovación.

### Flujo de vida

1. **Crear gasto recurrente**: form con checkbox "Gasto recurrente" → muestra recurrence (monthly/annual) + renewal_date.
2. **Vivir** hasta `renewal_date`.
3. **Alerta** cuando faltan ≤30 días (badge en dashboard + UI ámbar/naranja/rojo según urgencia).
4. **Auto-renovación** (si `auto_renew = true`):
   - Cuando el user clickea "Procesar renovaciones" o (futuro) un cron lo dispara
   - Endpoint `/api/contabilidad/gastos/process-renewals` busca todos los gastos `is_recurring=true` con `renewal_date <= today` y `auto_renew != false`
   - Para cada uno: itera período por período hasta que la siguiente fecha sea futura
   - En cada iteración crea un nuevo `accounting_expenses` con el dato anterior + `renewal_date = nextDate`
   - El registro original (vencido) queda como histórico — se le hace `UPDATE renewal_date = NULL` para que no aparezca más en alertas

Importante: el **dato anterior se preserva** (no se modifica). Cada período es un registro nuevo con su propia `expense_date` y `amount`. Esto permite ver el histórico completo: "pagué Adobe CC en Ene, Feb, Mar..." con cada renovación como una entrada separada.

### Auto-renew vs manual

- `auto_renew = true` (default): el cron/manual procesa y crea el siguiente período automáticamente
- `auto_renew = false`: el gasto vencido queda con `renewal_date` en el pasado → aparece como alerta roja en el dashboard → el user decide si renovar manualmente o discontinuar la suscripción

### Lógica de fecha siguiente (`addPeriod`)

```ts
function addPeriod(dateStr: string, recurrence: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  if (recurrence === 'annual') {
    return `${year + 1}-${...}-${day}`  // mismo día, mes, +1 año
  }
  // monthly — preserva el día del mes
  const newMonth = month + 1
  const newYear = newMonth > 12 ? year + 1 : year
  const actualMonth = newMonth > 12 ? 1 : newMonth
  return `${newYear}-${actualMonth}-${day}`
}
```

⚠️ **Edge case conocido**: si el día es 31 y el siguiente mes solo tiene 30 (o 28 en febrero), JavaScript hace **rollover** al primer día del mes siguiente. Ejemplo: `2026-01-31` + monthly → `2026-02-31` que como fecha es `2026-03-03`. Esto **NO** se valida en `addPeriod()` — el string se construye y se guarda tal cual. Si la string se interpreta como Date después, JS la corrige al date real. **Pendiente refinar** para casos de fin de mes (poco frecuente).

### Severidad de alertas (UI)

| Rango | Color | Mensaje |
|-------|-------|---------|
| Vencido (hasta 7 días atrás) | 🔴 Rojo | "Vencido el X" |
| Vence en ≤7 días | 🟠 Naranja | "Vence en N días" |
| Vence en 8–30 días | 🟡 Ámbar | "Vence en N días" |

Las alertas aparecen tanto en `/admin/contabilidad/gastos` como en el dashboard principal.

---

## 7. Sync de órdenes (`/api/contabilidad/sync-orders`)

Importa órdenes de la tabla `Order` (wizard de formación) como ingresos contables. Idempotente.

### Flujo

1. Fetch todas las órdenes
2. Fetch `accounting_income.order_id` (set de orders ya sincronizadas)
3. Fetch `accounting_clients.order_id` (set de clientes ya sync)
4. Por cada orden:
   - Si `order.id ∈ income_set` → skip (ya sync)
   - Crear o reusar `accounting_clients` por `order_id`
   - Generar `invoice_number = INV-YYYY-NNN` (secuencial)
   - Insertar `accounting_income` con:
     - `service_type` calculado por `resolveServiceType()`:
       - `package = 'addon'` → `'addon'`
       - `package = 'new_business_letter'` → `'new_business_letter'`
       - `entityType = 'llc'` → `'llc'`
       - `entityType = 'corp'` → `'corp'`
       - resto → `'other'`
     - `payment_method`: si `stripePaymentId` existe → `'stripe'`, sino → `'other'`
     - `payment_status`: si `paymentStatus = 'paid'` → `'paid'`, sino → `'pending'`
     - `amount_paid`: si pagado → el `amount`, sino → 0

### Idempotencia

El endpoint puede correrse N veces. Solo importa órdenes nuevas (deduplicación por `order_id`). Returns `{imported, skipped}` con el conteo.

### Por qué no se hace al crear la Order

Decisión deliberada: el wizard de formación no sabe (ni debería saber) que existe el módulo de contabilidad. Mantener el accoplamiento bajo significa:
- El sync es opcional — Aneury decide cuándo correrlo
- Si el módulo de contabilidad falla, no rompe el flujo de pago
- Permite ajustar/limpiar data antes de que entre a contabilidad

---

## 8. Análisis de facturas con Claude Haiku

Endpoint `/api/contabilidad/analyze-invoice`. Usa Claude Haiku 4.5 (modelo barato y rápido) para extraer datos estructurados de una factura/recibo.

### Formatos aceptados

- `application/pdf`
- `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

Rechaza otros con 400.

### Prompt

```
Analiza esta factura/recibo y extrae la información en JSON con exactamente estos campos:
{
  "vendor": "nombre del proveedor o tienda",
  "date": "fecha en formato YYYY-MM-DD (si no hay año claro usa el año actual)",
  "amount": número con decimales (solo el total final a pagar, sin símbolo $),
  "description": "descripción breve del gasto en español (máx 60 chars)",
  "category": una de estas opciones exactas: marketing | software | office | state_fees | payroll | taxes | other,
  "is_recurring": true o false (¿es una suscripción mensual o anual?),
  "recurrence": "monthly" | "annual" | "none"
}

Responde SOLO con el JSON, sin texto adicional, sin markdown, sin bloques de código.
```

### Sanitización post-respuesta

El server no confía en la respuesta de Claude — sanitiza:
- `category` debe estar en la whitelist de 7 categorías → sino, `'other'`
- `recurrence` debe ser `'monthly' | 'annual' | 'none'` → sino, `'none'`
- `amount` → `Number()` (NaN se convierte en 0)
- `is_recurring` → `Boolean()`
- `date` → string, default = today

### Costo y rate

Claude Haiku 4.5 es el modelo más barato de Anthropic. Por factura procesada: típicamente <500 tokens de output → costo marginal por análisis.

### Env var requerida

`ANTHROPIC_API_KEY` — agregar en Vercel Production. Si falta, el endpoint retorna 500 "ANTHROPIC_API_KEY no configurada".

### Fallback si Claude falla

Si el JSON no parsea (Claude alucinó), retorna 422 "Claude no pudo extraer los datos. Intenta con una imagen más clara." → el user puede volver al form manual.

---

## 9. Export Excel + PDF

### Excel — SheetJS (`xlsx`)

Dependencia agregada al `package.json` por Fabián. Genera `.xlsx` con el filtro activo (ej. solo gastos del mes corriente). Corre 100% en browser. Sin endpoint server-side.

### PDF — `window.print()` + `@media print`

CSS específico `@media print` que oculta navegación, botones, sidebar, y deja solo la tabla con headers. El user usa "Guardar como PDF" del diálogo de impresión del browser. Cero dependencia extra.

---

## 10. Variables de entorno

| Variable | Para qué | Notas |
|----------|----------|-------|
| `ANTHROPIC_API_KEY` | Análisis de facturas con Claude Haiku | Nueva — pendiente agregar en Vercel si no está |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | DB | Ya existían |

---

## 11. Decisiones embutidas

- **Tabla separada de `Order` (no extender)**: la contabilidad tiene campos propios (invoice_number, payment_method, amount_paid para parciales) que no aplican al wizard. Mantenerlas separadas mantiene el modelo del wizard simple. El sync resuelve la conexión.

- **Tax rate en `localStorage` (no DB)**: es preferencia del user del navegador, no dato persistente del negocio. Si Aneury cambia de máquina, configura de nuevo. Aceptable.

- **Fechas IRS hardcoded para 2025**: cuando entremos a 2026, hay que actualizar las constantes. Es un sprint de 5 min cada año. Alternativa (compute las fechas) sería más elegante pero los días específicos varían por feriados — hardcoded es más confiable.

- **`process-renewals` manual (no cron)**: Aneury decide cuándo correrlo. Cuando OpaBiz tenga 50+ gastos recurrentes, valdrá la pena automatizar con Vercel Cron. Por ahora manual es suficiente y más seguro (evita bugs silenciosos en cron).

- **Auto-renew default `true`**: lo más común es que el gasto recurrente se renueve. Para casos especiales (canceló suscripción) el user setea `false` y queda anclado a la alerta roja.

- **Reset destructive con confirm string**: la guardia `confirm: 'RESET_CONTABILIDAD'` evita que un click accidental borre todo. Equivalente al `--force` de CLIs destructivos.

- **Sin invoice PDF generation**: las facturas son internas. Si en el futuro queremos enviar facturas oficiales al cliente, usar `pdf-lib` (ya en deps por el certificate generator) — patrón documentado en `09_documentos_automaticos.md`.

- **Categorías de gastos cerradas en 7**: `marketing | software | office | state_fees | payroll | taxes | other`. Mantener la lista corta facilita reportes consistentes. Si surge una categoría nueva relevante (ej. legal), agregarla — pero pensar dos veces antes de explotar la lista.

- **Service types de ingresos cerradas en 5**: `llc | corp | addon | new_business_letter | other`. Alineado con los packages del wizard. Agregar `'amendment'`, `'foreign_llc'`, etc. cuando esos servicios tengan volumen propio justificable.

---

## 12. Pendientes (con plazo)

| Item | Cuándo | Quién |
|------|--------|-------|
| Actualizar fechas IRS para 2026 (`/admin/contabilidad/page.tsx` constantes Q1-Q4) | Enero 2026 | Aneury |
| Agregar `ANTHROPIC_API_KEY` en Vercel Production (si no está) | Esta semana | Aneury |
| Refinar `addPeriod()` para casos de fin de mes (Jan 31 + monthly → Feb 28/29, no Mar 3) | Cuando aparezca el bug | Aneury |
| Cron automático para `process-renewals` (cuando haya 50+ gastos recurrentes) | Mes 4-6 post-launch | Aneury |
| Migrar export PDF de `window.print` a `pdf-lib` para mejor control de layout | Si Aneury reporta queja sobre el PDF actual | Aneury |

---

## 13. Diferidos (no priority hoy)

- **Reconciliación bancaria** — import de CSV de banco + matching contra `accounting_income`/`expenses`. Útil cuando el volumen justifique.
- **1099-NEC / 1099-MISC** — si OpaBiz contrata contractors >$600/año, requiere generar 1099s para el IRS. Aplazado hasta tener contractors.
- **Multi-currency** — hoy todo en USD. Si en el futuro hay gastos en CAD/EUR/etc., agregar columna `currency`.
- **Approval workflow** — hoy cualquier admin puede crear/editar/borrar. Si crece el equipo y se quiere que gastos >$X requieran approval, agregar columna `approval_status` + UI.
- **Invoice PDF generation** — para facturas oficiales enviables al cliente. Patrón documentado en doc 09 con `pdf-lib`.
- **Integración QuickBooks / Xero** — para export estructurado a software contable. Aplazado salvo que el CPA insista.
- **Reportes anuales: P&L, balance sheet, cashflow** — el módulo actual hace reportes por período pero no genera los estados financieros estándar. Para presentar a inversores o IRS, exportar data y armar con CPA.

---

## 14. Descartados (con motivo explícito)

### Sistema contable completo certificado

- **Por qué no**: construir un competidor a QuickBooks (~$500M ARR, equipos de 1000+ devs) no es el negocio de OpaBiz. Una herramienta interna de tracking + insumo para CPA es suficiente.
- **Decisión**: descartado definitivamente. Para certificación oficial, exportar data y trabajar con CPA.

### State income tax calculation

- **Por qué no**: OpaBiz opera en Florida (sin state income tax). Construir el motor para los 50 estados con tax brackets diferentes sería desproporcionado.
- **Decisión**: descartado mientras OpaBiz solo opere en FL. Si expande, evaluar.

### Soft delete en gastos/ingresos

- **Por qué no**: en práctica las correcciones se hacen editando, no borrando. Y para auditoría usamos Sentry + audit log de admin (commit `721d6b1`).
- **Decisión**: hard delete OK. Si llega regulación que requiera retention, agregar `deleted_at` y soft delete.

### Receipt OCR genérico

- **Por qué no**: Claude Haiku ya cubre PDFs e imágenes con prompt estructurado. Una librería OCR genérica (Tesseract) requeriría parsing manual + reglas, más código mantenido por menos calidad.
- **Decisión**: Claude Haiku como única vía de extracción. Si el costo escala (improbable a este volumen), revisar.

### Pagos parciales con multiple `accounting_income` rows

- **Por qué no**: usar `amount_paid` columna en la misma row es más simple y suficiente. Splittear en N rows complica reportes.
- **Decisión**: una row por factura, con campo `amount_paid` que se va incrementando.

---

## 15. Referencias

- SQL schema:
  - Tablas base: definidas por Fabián en commits `903e096`, `3265d6f` (no hay archivo SQL separado para income/clients — viven inline en Supabase dashboard)
  - Migración recurrencia: [`supabase_migration_recurring_expenses.sql`](../supabase_migration_recurring_expenses.sql)
- API: [`backend/app/api/contabilidad/`](../backend/app/api/contabilidad/)
- UI admin: [`backend/app/admin/contabilidad/`](../backend/app/admin/contabilidad/)
- Commits clave:
  - `903e096` — feat(contabilidad): módulo completo para la compañía (base)
  - `3265d6f` — feat(contabilidad): sync de órdenes, reset y taxes federales estimados
  - `bd9c369` — feat(contabilidad): gastos recurrentes, análisis IA de facturas y exportación
  - `c6ba689` — docs(claude): documenta módulo de contabilidad completo
  - `bdcde87` — feat(contabilidad): campo de carga de factura
  - `1c796a0` — feat(contabilidad): auto-renovación de gastos recurrentes
  - `7088ece` — fix(contabilidad): process-renewals crea todos los períodos vencidos en una sola llamada
  - `779c02e` — feat(contabilidad): responsive tablet/iPad para gastos
- Doc relacionado: [`07_panel_admin.md`](07_panel_admin.md) — panel admin general
- Doc relacionado: [`09_documentos_automaticos.md`](09_documentos_automaticos.md) — patrón `pdf-lib` para futura generación de invoices PDF
- Doc relacionado: [`13_seguridad_panel_admin.md`](13_seguridad_panel_admin.md) — patrón `verifyAdminToken` (aplicado en todos los endpoints de contabilidad)
- IRS Form 1040-ES (estimated taxes federal): https://www.irs.gov/forms-pubs/about-form-1040-es
- Claude Haiku 4.5 docs: https://docs.anthropic.com/en/docs/about-claude/models
