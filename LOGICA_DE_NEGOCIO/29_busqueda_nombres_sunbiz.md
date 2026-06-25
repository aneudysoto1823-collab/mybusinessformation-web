# Proceso 29 — Búsqueda de nombres en Sunbiz (chequeo silencioso al crear orden)

## ¿Por qué este documento existe?

Florida rechaza filings cuando el nombre que el cliente eligió ya está en uso por otra entidad activa (LLC, Corp, etc.). Hasta hoy verificábamos manualmente uno por uno en sunbiz.org después de cobrar — eso significaba que cuando había conflicto, ya habíamos cobrado, había que recontactar al cliente, esperar un nombre nuevo, re-presentar y a veces tragar la state fee perdida.

Este sistema **chequea el nombre automáticamente al crear cada orden** contra los **3.93 millones de LLC/Corp activas de Florida** y le avisa al admin en el email si hay conflicto, **sin que el cliente se entere de nada**. Decisión de negocio: cero fricción en el checkout, máxima conversión. El admin decide qué hacer.

> **Nota sobre el doc 26**: el doc anterior `26_arquitectura_sunbiz_backups_opabiz.md` cubría la arquitectura inicial planteada de Sunbiz + backups. La parte de Sunbiz vivo en producción ahora vive acá (29) — el 26 queda como referencia histórica del planteo inicial + sección de backups distribuidos de OpaBiz.

---

## REGLA DE CLASIFICACIÓN DE NOMBRES TOMADOS O DISPONIBLES

**Estos son los mismos parámetros que usa Florida (Sunbiz) cuando decide si dos nombres son "el mismo" o no.** Nuestro sistema los aplica antes de cobrar para avisarte si el nombre del cliente probablemente colisione.

### Cosas que NO importan (se ignoran al comparar)

Cuando comparamos el nombre que el cliente eligió con la base de las 3.9M LLC/Corp activas, **ignoramos** lo siguiente — porque Florida también lo ignora:

1. **Mayúsculas o minúsculas**
   `Joe's Pizza` = `JOE'S PIZZA` = `joe's pizza`

2. **Comillas y apóstrofes** (dobles, simples, backticks, tipográficas)
   `Joe's Pizza` = `Joes Pizza` = `"Joe's Pizza"`

3. **Puntos, comas, guiones, símbolos** (cualquier carácter que no sea letra o número o espacio)
   `Joe's Pizza, L.L.C.` = `Joes Pizza LLC`
   `411-413-415 Petronia St` = `411 413 415 Petronia St`

4. **El sufijo de tipo de entidad al final** (LLC, L.L.C., Limited Liability Company, Inc, Inc., Incorporated, Corp, Corp., Corporation, Co, Co., Ltd, Limited, PLLC, PA, LP, LLP, LLLP, LC)
   `Joe's Pizza LLC` = `Joe's Pizza Inc` = `Joe's Pizza Corporation`
   *(Florida no permite dos LLCs con el mismo nombre y tampoco permite que una LLC y una Inc compartan el mismo nombre — por eso ignoramos el sufijo y comparamos el "nombre real".)*

5. **Las palabras "The", "A", "An" al inicio**
   `The Pizza LLC` = `Pizza Inc`

### Cosas que se consideran IGUALES (sinónimos)

6. **El símbolo `&` y la palabra `AND`** son lo mismo
   `Joe's & Co` = `Joe's and Co`
   `A & T Construction` = `A and T Construction`

7. **Números escritos y dígitos** son lo mismo, incluyendo ordinales
   `Twenty Four Hour Plumbing` = `24 Hour Plumbing`
   `Three Blind Mice` = `3 Blind Mice`
   `Second Chance Antiques` = `2nd Chance Antiques`
   `First National Bank` = `1st National Bank`
   `One Star LLC` = `1 Star LLC`

### Cosas que SÍ importan (los nombres siguen siendo distintos)

8. **Letras distintas**, aunque la diferencia sea de una sola letra
   `Adidas` ≠ `Adida`
   `Pizza` ≠ `Pizzas`

9. **Números con valor distinto**
   `1 Star LLC` ≠ `2 Star LLC`
   `5576 Captiva Lane` ≠ `5577 Captiva Lane`

10. **Números embebidos dentro de una palabra** (códigos, modelos) NO se tocan
    `4CS Cleaning` se queda `4CS Cleaning` (el `4` y `CS` están pegados — no es "cuatro CS")
    `CAMARGO204` se queda `CAMARGO204`

### Ejemplos de lo que pasa al comparar

| Nombre que el cliente quiere | Si en Florida existe... | Resultado |
|---|---|---|
| `Joe's Pizza LLC` | `JOES PIZZA, L.L.C.` activa | ⚠️ **TOMADO** |
| `Joe's Pizza LLC` | `JOES PIZZA CORPORATION` activa | ⚠️ **TOMADO** (el sufijo no diferencia) |
| `The Pizza LLC` | `PIZZA INC` activa | ⚠️ **TOMADO** ("The" no diferencia) |
| `Twenty Four Hour Plumbing LLC` | `24 HOUR PLUMBING LLC` activa | ⚠️ **TOMADO** (números escritos = dígitos) |
| `Gekko & Co` | `GEKKO AND CO` activa | ⚠️ **TOMADO** (& = and) |
| `2nd Chance Antiques Inc` | `SECOND CHANCE ANTIQUES CO` activa | ⚠️ **TOMADO** (ordinales) |
| `1 Star LLC` | `2 STAR LLC` activa | ✅ **DISPONIBLE** (1 ≠ 2) |
| `Adidas LLC` | `ADIDA LLC` activa | ✅ **DISPONIBLE** (letra distinta) |
| `Adidas LLC` | nadie con ese nombre | ✅ **DISPONIBLE** |

### Lo que NO chequeamos (Florida igual puede rechazar)

Importante: nuestro chequeo NO sustituye al examinador de Florida. Florida también rechaza nombres por razones que **no** dependen de coincidencia con otra entidad:

- **Palabras restringidas o prohibidas**: "Bank", "Insurance", "Trust", "Attorney", "Engineer" (requieren licencia)
- **Marcas registradas federales** (USPTO, no Sunbiz)
- **Similitud "engañosamente parecida"** según criterio del examinador (subjetivo)
- **Nombres vulgares o que sugieran afiliación gubernamental**
- **Cambios de status muy recientes** que aún no llegaron a nuestra base (cron nocturno corre 1 vez al día)

Por eso el badge verde "✓ Sin conflictos exactos" en el panel **no garantiza** que Florida lo apruebe — solo dice que no hay choque con otra entidad activa en la base. El admin sigue siendo quien decide cuándo presentar.

---

## Arquitectura — la foto completa

```
[Florida SFTP] sftp.floridados.gov (Public/PubAccess1845!)
  ↓ daily files YYYYMMDDc.txt (~1500 LLC/Corp nuevas/día)
  ↓ cron nocturno (PENDIENTE — ver al final)
  ↓
[Turso opabiz-sunbiz-search] (us-east-1)
  - tabla sunbiz_corps: 3,933,744 ACTIVE únicos
  - columna name_normalized (text) + idx B-tree
  - tabla virtual sunbiz_fts (FTS5: entity_name + document_number UNINDEXED)
  - 3 triggers (ai/ad/au) sunbiz_corps → sunbiz_fts (sync automático)
  ↑
  ↑ TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
  ↑
[Vercel Functions]
  - GET /api/sunbiz/name-check?q=<nombre>   (público, rate-limit 60/min/IP)
  - POST /api/orders                         (corre check al crear orden)
  - POST /api/webhooks/stripe handleFormationPaid (lee nameCheck en email admin)
  ↓
[Supabase Order.nameCheck JSONB]
  ↓
[Email admin "🆕 NUEVA ORDEN CREADA/PAGADA" → alert@opabiz.com]
  - línea verde:  "✓ Nombre sin conflictos exactos detectados en Sunbiz"
  - línea ROJA:   "⚠️ NOMBRE POSIBLEMENTE TOMADO — coincide con: AMAZON AUTO SALES LLC"
  - línea ámbar:  "ℹ️ No se pudo verificar — verificar manualmente"
```

---

## Componente 1 — Base de datos Turso

### DB activa: `opabiz-sunbiz-search`

- **URL**: `libsql://opabiz-sunbiz-search-opabiz.aws-us-east-1.turso.io`
- **Región**: AWS us-east-1 (cerca de Vercel functions)
- **Plan Turso**: Developer $4.99/mes (9 GB storage, 25M writes/mes, 2.5B reads/mes)
- **Tamaño real**: ~1.45 GB (3.93M rows + FTS5 + índices)
- **Env vars en Vercel Production + .env.local**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`

### Schema

```sql
CREATE TABLE sunbiz_corps (
  document_number TEXT PRIMARY KEY,
  entity_name TEXT NOT NULL,
  entity_type TEXT,           -- 'LLC' | 'Corp' | 'LP' | 'LLP' | 'DBA' | 'Other'
  status TEXT,                -- 'A' = ACTIVE (filtrado en la carga; queda como columna)
  filing_type TEXT,
  filing_date TEXT,
  principal_address TEXT,
  principal_city TEXT, principal_state TEXT, principal_zip TEXT, principal_country TEXT,
  mail_address TEXT, mail_city TEXT, mail_state TEXT, mail_zip TEXT, mail_country TEXT,
  registered_agent_name TEXT, registered_agent_type TEXT,
  registered_agent_address TEXT, registered_agent_city TEXT,
  registered_agent_state TEXT, registered_agent_zip TEXT,
  data_source TEXT DEFAULT 'sftp_dump',
  last_updated TEXT DEFAULT (datetime('now')),
  name_normalized TEXT        -- ← clave del matching, ver Componente 2
);

CREATE INDEX idx_sunbiz_corps_name ON sunbiz_corps(entity_name);
CREATE INDEX idx_name_normalized ON sunbiz_corps(name_normalized);

CREATE VIRTUAL TABLE sunbiz_fts USING fts5(
  entity_name, document_number UNINDEXED
);

-- 3 triggers de sincronización sunbiz_corps ↔ sunbiz_fts:
CREATE TRIGGER sunbiz_corps_ai AFTER INSERT ON sunbiz_corps BEGIN
  INSERT INTO sunbiz_fts (entity_name, document_number) VALUES (new.entity_name, new.document_number);
END;
CREATE TRIGGER sunbiz_corps_ad AFTER DELETE ON sunbiz_corps BEGIN
  DELETE FROM sunbiz_fts WHERE document_number = old.document_number;
END;
CREATE TRIGGER sunbiz_corps_au AFTER UPDATE ON sunbiz_corps BEGIN
  DELETE FROM sunbiz_fts WHERE document_number = old.document_number;
  INSERT INTO sunbiz_fts (entity_name, document_number) VALUES (new.entity_name, new.document_number);
END;
```

### Cómo se cargó (relato corto del viaje)

1. Florida publica bulk trimestral `cordata.zip` (1.66 GB) en `sftp.floridados.gov:/doc/Quarterly/Cor/`. Acceso público con user `Public` / pass `PubAccess1845!`.
2. **Approach que NO funcionó** (3 días perdidos): loop Node + libsql HTTP batches a Turso → 115 rows/seg → 20h proyectado. Cuello: round-trip HTTP + rate-limit Turso.
3. **Approach que SÍ funcionó** (5 minutos):
   - Descargar zip en VPS Hetzner (16 MB/s vs 0.1 MB/s desde DR)
   - Cargar localmente a SQLite con `better-sqlite3` + PRAGMAs (`journal_mode=OFF`, `synchronous=OFF`, batch transactions) → 83,775 rows/seg → 47 segundos para los 3.93M
   - Crear FTS5 con `INSERT INTO ... SELECT` (mucho más rápido que triggers durante la carga) → 17 segundos
   - Subir el `.sqlite` completo a Turso con `turso db import opabiz-sunbiz-search.db` → 3m 57s
4. **Filtros aplicados durante la carga**:
   - Solo `status = 'A'` (ACTIVE). Florida solo bloquea nombres por entidades ACTIVE; las INACTIVE/DISSOLVED liberan su nombre (con período de protección — ver "cron nocturno" abajo).
   - Strip de duplicados via PK `document_number` con `INSERT OR IGNORE`. De 3,933,815 ACTIVE en fuente → 3,933,744 únicos en DB (71 duplicados internos del dump, perdidos por colisión de PK, no son registros perdidos sino apariciones múltiples del mismo doc).

### Bugs históricos importantes con Turso CLI

- `turso db create --from-file` falla silenciosamente con archivos GB+ (issue GitHub #652, supuestamente fixed en PR #659 pero re-rota en CLI v1.0.29). Reporta "Created" pero la DB queda 0 B.
- `turso db destroy <name>` deja el namespace **bloqueado horas** (no se puede reusar el mismo nombre por ~4h+). Si necesitás rehacer, usar **nombre nuevo** que NUNCA se haya creado.
- **Workaround oficial para archivos grandes**: `turso db import` (no `--from-file`). El `import` funciona porque va por endpoint `/v1/upload` directo a la región, soporta hasta 20 GB.
- **Requisitos del `.sqlite` antes de subir**: WAL mode (`PRAGMA journal_mode=WAL`), page_size 4096, auto_vacuum disabled, UTF-8 encoding.

### DBs viejas (respaldo, pendiente cleanup)

- `opabiz-sunbiz` (vieja parcial, 443K rows del loader artesanal antes de pivotar)
- `opabiz-sunbiz-prod` (3.9M rows sin `name_normalized`)

Vivas como backup hasta que el founder confirme borrar. NO usadas por la app.

---

## Componente 2 — Librería de normalización

**Archivo**: `backend/lib/sunbiz-normalize.ts`

Para que `"Joe's Pizza LLC"`, `"JOES PIZZA, L.L.C."` y `"Joes Pizza, Limited Liability Company"` matcheen como **el mismo nombre** (lo que Florida considera "tomado"), hay que normalizar antes de comparar.

### Reglas de normalización (en orden)

```
1. uppercase
2. quitar TODAS las comillas: " ' ` ‘ ’ “ ” ´ ʼ
3. & → ' AND '
4. puntos: eliminar SIN espacio (L.L.C. → LLC); resto de no-alnum → espacio
5. colapsar espacios + trim
6. compromise (npm) convierte palabras-número a dígitos:
   - "twenty four" → "24", "three" → "3", "second" → "2nd", "first" → "1st"
   - NO toca dígitos existentes ni números embebidos (4CS → 4CS)
   - NO convierte "a" sola
7. strip designator final (longest match first): LIMITED LIABILITY COMPANY, INCORPORATED, CORPORATION, COMPANY, LIMITED, PLLC, LLLP, LLC, INC, CORP, LTD, LLP, CO, LC, LP, PA
8. strip artículo inicial: THE, A, AN
9. colapsar + trim final
```

### Librería de números: `compromise` (la única que iguala a Python text2num)

Probadas y descartadas:
- `words-to-numbers`: convierte "second" → "2" (no "2nd"), rompe Florida que considera distintos
- `numerizer`: 3 fallos en los 9 pares de prueba oficiales

`compromise` (`nlp().numbers().toNumber()`) coincide al 100% con la versión Python `text2num` que se usó para poblar la columna `name_normalized` de la DB. Esto es crítico: si la JS no normalizara igual que la Python, el `WHERE name_normalized = ?` no matchearía.

### Validación (9 pares oficiales del mandato)

```
DEBEN COINCIDIR:
  The Pizza LLC                           ↔ Pizza Inc                        → PIZZA
  Three Blind Mice LLC                    ↔ 3 Blind Mice Company             → 3 BLIND MICE
  2nd Chance Antiques Inc                 ↔ Second Chance Antiques Co        → 2ND CHANCE ANTIQUES
  Joe's Pizza LLC                         ↔ Joes Pizza, L.L.C.               → JOES PIZZA
  Gekko & Co                              ↔ Gekko and Co                     → GEKKO AND
  Twenty Four Hour Plumbing LLC           ↔ 24 Hour Plumbing LLC             → 24 HOUR PLUMBING
  A & T CONSTRUCTION AND REMODELING LLC   ↔ A and T Construction & Remodeling, L.L.C. → AND T CONSTRUCTION AND REMODELING

DEBEN DIFERIR:
  1 Star LLC ≠ 2 Star LLC                                                    → 1 STAR vs 2 STAR
  Adidas LLC ≠ Adida LLC                                                     → ADIDAS vs ADIDA
```

**Resultado**: 18/18 strings idénticos a Python. La columna `name_normalized` en la DB se pobló usando Python (`scripts/normalize-names.py` en el VPS) y la lib TS sirve los queries — ambas convergen a la misma string.

### Helper adicional: `ftsSanitize(raw)`

Para usar el input del user en `MATCH` de FTS5 sin que tokens reservados (`AND`, `OR`, `NEAR`, `*`, `"`, etc.) rompan el query. Hace: uppercase + replace todo no-`[A-Z0-9 ]` por espacio + trim.

---

## Componente 3 — Endpoint público `/api/sunbiz/name-check`

**Archivo**: `backend/app/api/sunbiz/name-check/route.ts`

`GET /api/sunbiz/name-check?q=<nombre>` — server-side, Vercel function.

### Comportamiento

| Caso | Respuesta |
|---|---|
| `q.length < 3` (post-trim) | `{ ok:true, tooShort:true }` (sin tocar DB) |
| Query OK | `{ ok:true, available, exactCount, similarCount, example? }` |
| Rate-limit excedido | `429 { ok:false, reason:'rate_limited' }` con `Retry-After` |
| DB falla | `{ ok:false, reason:'db_error' }` |

### Rate limit

**60 req/min/IP** (sliding window Upstash, `lib/rate-limit.ts` `checkNameSearchRateLimit`). Generoso para typing con debounce 300ms (~10-20 req/min realista) y mata scrapers/bots que quieran extraer la base.

### Privacidad de la DB

La respuesta es **mínima** intencionalmente — NO devuelve `document_number` ni listas completas de matches. Solo:
- Booleano `available`
- Cantidad `exactCount` + un solo `example` (entity_name de ejemplo si está tomado)
- Cantidad aproximada `similarCount` (matches FTS5 parciales, info no bloqueante)

Esto protege la base contra scraping competitivo (Datatrent + futuras integraciones internas).

### Decisión de negocio 2026-06-25: este endpoint NO se llama desde el form

Originalmente el form del checkout llamaba este endpoint en cada keystroke (debounce 300ms) y mostraba aviso rojo al cliente si el nombre estaba tomado. Esto se removió por **decisión de conversión**: cero fricción en el form, máxima conversión, el admin decide qué hacer después.

El endpoint queda vivo para:
- Posibles features futuras (admin panel "verificar nombre" manual)
- Debugging
- Reusabilidad

Las funciones JS `fmBiznameDebounced` y `fmCheckBizname` siguen en el bundle de `page.tsx` pero dormidas (nadie las llama). Container `#bizname-check-result` existe en el HTML pero nunca se rellena.

---

## Componente 4 — Lib reusable `lib/sunbiz-namecheck.ts`

Wrapper que devuelve la estructura completa `NameCheckResult`. Reusado por:
- El endpoint `/api/sunbiz/name-check`
- El handler `POST /api/orders` (al crear orden)
- Cualquier código futuro que necesite el chequeo

### `checkNameAvailability(rawName)` → `Promise<NameCheckResult>`

```ts
type NameCheckResult = {
  query: string              // input post-trim
  normalized: string         // resultado de normalizeName()
  available: boolean         // false si hay exact match ACTIVE
  exactCount: number
  example?: string           // un solo entity_name de ejemplo si taken
  similarCount: number       // matches FTS5 parciales (info)
  checkedAt: string          // ISO timestamp
  error?: string             // si DB falló (available queda true conservador)
}
```

**Garantías clave**:
- **NUNCA throws**. Errores se devuelven en `.error`.
- Si la DB cae, devuelve `available:true` conservador (no bloquea al cliente).
- Si el input es vacío o `< 3` chars, devuelve `error:'too_short'` sin tocar DB.

### `nameCheckHtmlLine(result)` → `string`

Helper para generar el bloque HTML del email admin. 3 casos:
- `null/undefined/error` → ámbar "ℹ️ No se pudo verificar — verificar manualmente"
- `available=false` → ROJO "⚠️ NOMBRE POSIBLEMENTE TOMADO — coincide con: {example}"
- `available=true` → verde "✓ Nombre sin conflictos exactos detectados en Sunbiz"

---

## Componente 5 — Integración silenciosa al crear orden

**Archivo**: `backend/app/api/orders/route.ts`

### Flujo

```
1. POST /api/orders {firstName, lastName, email, companyName, ...}
2. Validación Zod (OrderInputSchema) + rate-limit 10 órdenes/h/IP
3. INSERT INTO Order (sin nameCheck)
   ↳ si falla, return 500
4. ─── chequeo silencioso ────────────────────────────────
   nameCheck = await checkNameAvailability(order.companyName)
   UPDATE Order SET nameCheck = ? WHERE id = ?
   ↳ try/catch total: si falla, nameCheck=null, orden continúa
5. Pre-computa nameCheckHtml (try/catch separado por protección extra)
6. ─── emails ──────────────────────────────────────────
   if (deferEmails) skip → los manda el webhook al pagar
   else:
     - Email al cliente "OpaBiz: ✅ Your Florida LLC order is in" (SIN nameCheck)
     - Email al admin "OpaBiz Alerts: 🆕 NUEVA ORDEN CREADA" (CON nameCheck)
7. return 201 {success:true, orderId}
```

### Columna `Order.nameCheck` (JSONB en Supabase)

Agregada el 2026-06-25 con:
```sql
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "nameCheck" JSONB;
```

Estructura JSON guardada (espejo de `NameCheckResult`):
```json
{
  "query": "Amazon Auto Sales LLC",
  "normalized": "AMAZON AUTO SALES",
  "available": false,
  "exactCount": 1,
  "example": "AMAZON AUTO SALES LLC",
  "similarCount": 1,
  "checkedAt": "2026-06-25T00:40:31.886Z"
}
```

### Garantías de no-romper-nada (críticas)

1. **La orden SIEMPRE se crea**. El chequeo va DESPUÉS del INSERT. Si Turso cae o el chequeo throw, la orden sigue.
2. **El pago SIEMPRE se procesa**. La línea del email está pre-computada en una variable con try/catch separado — si `nameCheckHtmlLine` throw por algún motivo, queda string vacío, el email se manda sin esa línea, el webhook responde 200 a Stripe.
3. **El cliente NUNCA ve el resultado**. El email al cliente no incluye ni depende de nameCheck. El form del checkout no muestra nada.
4. **El admin lee de la DB, no del email**. Aunque ambos emails fallaran, `Order.nameCheck` queda persistido en Supabase y es accesible vía dashboard / API / panel admin (cuando se agregue la vista).

---

## Componente 6 — Webhook `handleFormationPaid`

**Archivo**: `backend/app/api/webhooks/stripe/route.ts` (función `handleFormationPaid`)

Cuando `deferEmails=true` (flujo Stripe Embedded Checkout), los emails NO se envían en `/api/orders` sino acá, después de que Stripe confirma el pago.

### Cómo lee nameCheck

NO recalcula — lee directamente `order.nameCheck` del SELECT que devuelve el UPDATE de Supabase:

```ts
const { data: order } = await supabase
  .from('Order')
  .update({ paymentStatus: 'paid', status: 'in_review', ... })
  .eq('id', orderId)
  .select()       // devuelve TODAS las columnas, incluyendo nameCheck
  .single()

// Pre-computa la línea HTML con try/catch protector
let nameCheckHtml = ''
try { nameCheckHtml = nameCheckHtmlLine((order.nameCheck as NameCheckResult | null) ?? null) }
catch (e) { console.error('[stripe-webhook] nameCheckHtmlLine error (non-fatal):', e) }

// Después en el HTML del email admin: ${nameCheckHtml}
```

El email al cliente del webhook tampoco incluye nameCheck (consistente con orders/route.ts).

---

## Test de extremo a extremo

Local con dev server:

```bash
# Orden con nombre TOMADO
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Test","lastName":"User","email":"test@x.com",
       "companyName":"Amazon Auto Sales LLC","entityType":"llc",
       "package":"basic","amount":0,"deferEmails":true}'

# → orden creada, nameCheck guardado:
#   {"available":false,"exactCount":1,"example":"AMAZON AUTO SALES LLC","similarCount":1, ...}

# Orden con nombre LIBRE
curl ... -d '{"...","companyName":"Xyzqwk Nonexistent Biz 9999 LLC", ...}'

# → orden creada, nameCheck guardado:
#   {"available":true,"exactCount":0,"similarCount":0, ...}
```

Verificable en Supabase Dashboard → `Order` table → columna `nameCheck`.

---

## Pendientes (siguiente sprint)

### 1. Vista en el panel admin

Trivial. Hace falta:
- Agregar `'nameCheck'` al SELECT de `backend/app/admin/page.tsx` línea 42 (`getOrders`)
- Renderizar la columna en `backend/app/admin/OrdersTable.tsx` (badge verde/rojo/ámbar)
- Mostrar el detalle en `backend/app/admin/orders/[id]/page.tsx` (panel de orden individual)

Sin esto, el dato está pero solo se ve en el email admin y en Supabase Dashboard.

### 2. Cron nocturno (catch-up + daily updates)

Para mantener la base al día con las LLC nuevas que Florida publica cada día.

**Decisión tomada**: corre en **Vercel Cron o GitHub Actions**, NO en Hetzner. Cuando esto esté arriba, se cancela el VPS Hetzner ($5/mes ahorrado).

Requisitos del cron:

- **Catch-up inicial**: la DB se cargó con un dump trimestral (probablemente abril 2026). Han pasado 3-4 días sin updates. La primera corrida debe bajar todos los daily files desde la fecha del dump hasta hoy.
- **Insertar ACTIVE nuevas**: filtrar `status='A'` en cada daily file.
- **Actualizar status de las que cambian**: si una entity pasa de ACTIVE a INACTIVE/DISSOLVED, no borrar — actualizar el `status` para respetar los **períodos de protección de Florida**:
  - `INACT` / `UA` (administrative inactivation) → el nombre **queda reservado 1 año** después del cambio
  - Disolución voluntaria → reservado **120 días**
  - Después del período: el nombre se considera libre y se puede borrar de la DB o cambiar a no-protegido
- **Schema FULL del cron nocturno**: a diferencia de la carga inicial (mínima, 668 chars), el cron debe parsear los 1440 chars completos del record Sunbiz (incluye officers + FEI + last_tx_date) para alimentar features futuras como marketing a empresas recién registradas. Ver doc 26 sección "Sunbiz SFTP — daily files cron (reusar approach datallc)" + `c:\Users\ethan\datallc\fase0-validation\src\ingest\florida_sftp.py`.

**Diagnóstico previo a diseñar el cron** (antes de codear):
- Hacer `SELECT DISTINCT status, COUNT(*) FROM sunbiz_corps GROUP BY status` para ver qué valores reales hay (probablemente solo `'A'` porque la carga filtró). Decidir cómo modelar los estados INACTIVE/UA si no están.
- Definir si crear tablas adicionales `sunbiz_officers` + `sunbiz_meta` para el schema FULL, o agregar columnas a `sunbiz_corps`.

### 3. Cleanup de DBs viejas

Una vez confirmado que `opabiz-sunbiz-search` funciona en producción sin issues:
- `turso db destroy opabiz-sunbiz` (la vieja parcial, 443K rows)
- `turso db destroy opabiz-sunbiz-prod` (3.9M sin name_normalized, redundante)

### 4. Cancelar Hetzner USA

Cuando el cron nocturno corra en Vercel/GitHub Actions y NO dependa del VPS Hetzner USA → cancelar la suscripción ($5/mes ahorrado). Hasta entonces, el VPS queda activo como infraestructura de respaldo + base operativa de scripts del datallc/sunbiz.

---

## Archivos de referencia

| Archivo | Rol |
|---|---|
| `backend/lib/turso.ts` | Cliente libsql lazy-init (reusa env vars) |
| `backend/lib/sunbiz-normalize.ts` | `normalizeName()` + `ftsSanitize()` — espejo de Python text2num |
| `backend/lib/sunbiz-namecheck.ts` | `checkNameAvailability()` + `nameCheckHtmlLine()` — lógica reusable |
| `backend/lib/rate-limit.ts` | `checkNameSearchRateLimit()` — 60/min/IP |
| `backend/app/api/sunbiz/name-check/route.ts` | Endpoint público (rate-limited) |
| `backend/app/api/orders/route.ts` | Crea orden + chequea + guarda nameCheck + email admin |
| `backend/app/api/webhooks/stripe/route.ts` (`handleFormationPaid`) | Lee nameCheck persistido + lo muestra en email admin pago |
| `scripts/normalize-names.py` (en VPS Hetzner, no en repo) | Script Python que pobló la columna `name_normalized` durante la carga inicial |

---

## Variables de entorno

```
# Vercel Production
TURSO_DATABASE_URL=libsql://opabiz-sunbiz-search-opabiz.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=<db token, 267 chars JWT>

# Local dev (backend/.env.local)
TURSO_DATABASE_URL=<misma>
TURSO_AUTH_TOKEN=<mismo>
SUPABASE_URL=https://qkjacgvmrlomzqdfygyx.supabase.co   # tambien NEXT_PUBLIC_ existe
SUPABASE_SERVICE_ROLE_KEY=<...>
UPSTASH_REDIS_REST_URL=<...>                              # rate-limit
UPSTASH_REDIS_REST_TOKEN=<...>
```

Si falta cualquiera de las env vars Turso, `getTurso()` throw — el chequeo falla, nameCheck queda null en la orden, el email admin muestra la línea ámbar "verificar manualmente". El pago/orden no se afectan.

---

## Costos operativos

| Servicio | Cargo mensual |
|---|---|
| Turso Developer (DB) | $4.99 |
| Upstash Redis (rate-limit) | $0 (free tier) |
| Vercel Functions (queries) | $0 (incluido en Pro plan que ya pagamos) |
| Hetzner USA (loader/cron temporal) | $5 (a cancelar cuando cron migre) |
| **Total feature** | **~$5-10/mes** |
