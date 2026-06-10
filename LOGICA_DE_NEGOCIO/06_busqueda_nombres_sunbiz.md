# Proceso 6 — Búsqueda Sunbiz (Tabla local + lookups)

Documento maestro de la integración con datos de Florida Division of Corporations (Sunbiz). Cubre la tabla local `sunbiz_corps` con dump de empresas FL, los tres paths de búsqueda activos hoy (cada uno con propósito distinto), y el plan de actualización incremental.

> Este doc reemplaza la versión anterior que describía búsqueda **manual** en sunbiz.org. La Etapa 5 del roadmap (CONTEXTO) se desbloqueó cuando Fabián cargó la tabla `sunbiz_corps` en Supabase producción (commits `1b652c9`, `e156ce6`, `29825ee` del 2026-06-04).

---

## 1. Por qué importa Sunbiz

Florida Division of Corporations (sunbiz.org) es el registro **oficial y único** de entidades comerciales en el estado. Es donde se filean LLCs y Corps. Tres preguntas críticas que respondemos consultando Sunbiz:

1. **¿El nombre que quiere el cliente está disponible?** — antes de filear, hay que verificar que ninguna entidad activa con un nombre idéntico o engañosamente similar ya esté registrada. Florida rechaza filings con nombres duplicados.
2. **¿Esta empresa existe y está activa?** — usado en flujo de marketing (`/new-business?id=L23...`) para auto-rellenar datos cuando el cliente llega via QR code después de recibir nuestra carta.
3. **¿Quién es el Registered Agent actual?** — para servicios de "Change of Registered Agent" necesitamos saber el agente actual.

---

## 2. Tres paths de búsqueda activos

El sistema tiene **tres caminos distintos** que tocan Sunbiz, cada uno con su propósito. Documentarlos por separado evita confusión.

### Path A — Lookup por document number → `sunbiz_corps` + `prospective_companies`

**Endpoint**: `GET /api/sunbiz?document_id=L23000123456`
**Usado en**: `/new-business` landing (auto-fill cuando cliente llega via QR)
**Fuente**: tabla local Supabase `sunbiz_corps` + tabla local `prospective_companies` (marketing data)

Cómo funciona:
1. Recibe `document_id` (normalizado a UPPERCASE + trim)
2. Consulta **en paralelo** ambas tablas:
   - `prospective_companies` (data de campañas marketing — owner, email)
   - `sunbiz_corps` (data oficial FL — dirección, agente, estado)
3. Merge: `prospective` gana en owner_name y email (es data más fresca de marketing). `sunbiz` aporta dirección oficial + Registered Agent + filing_date + status.
4. Normaliza `entity_type` con regex: LLC | CORP | PA | LTD.
5. Retorna `{source, company}` donde `source` es `'database'` (solo prospective), `'sunbiz_corps'` (solo Sunbiz), o `'both'`.

Latencia: **<100ms típica** (índice único en `document_number`).

### Path B — Verificación de nombres en admin → mock data (Railway)

**Endpoint**: `GET /api/proxy/names/check?names=NAME1,NAME2,NAME3`
**Usado en**: `/admin/orders/[id]` cuando admin verifica los 3 nombres propuestos por el cliente
**Fuente**: Railway/Express con **datos mock** (`backend/modules/names/names.route.ts`)

⚠️ **Este path NO está usando `sunbiz_corps` todavía**. Sigue retornando mock data hardcoded para que el flujo funcione. **Pendiente migrar** a consultar `sunbiz_corps` con búsqueda fuzzy (ver sección "Búsqueda fuzzy" abajo).

Auth: `/api/proxy/names/check` (Vercel) sí requiere `verifyAdminToken`. El proxy llama a Railway que retorna mock.

### Path C — Claudia (chat) → scraping live de sunbiz.org

**Tool name**: `check_name_availability` (definido en `backend/app/api/chat/route.ts:476`)
**Usado en**: ChatWidget cuando un cliente le pregunta a Claudia si su nombre está disponible
**Fuente**: **HTML scraping en vivo** de `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults`

Cómo funciona:
1. Claudia (Claude API tool calling) decide invocar el tool al ver una pregunta sobre disponibilidad de nombre
2. El handler en `backend/app/api/chat/route.ts:548-...` hace `fetch(url)` con User-Agent de Chrome y timeout de 10s
3. Parsea el HTML resultado: si encuentra "No results found" → nombre disponible. Si hay resultados → nombre tomado o similar
4. Retorna JSON con `{status, message, matches?}`

Por qué scraping en vez de `sunbiz_corps`:
- Garantiza data **en tiempo real** (el dump de `sunbiz_corps` puede tener N días de delay)
- Para el chat la latencia <2s es aceptable; el cliente está esperando una respuesta conversacional
- No depende de que el cron de actualización esté funcionando

Riesgo:
- Sunbiz cambia el HTML → el scraper se rompe → Claudia retorna "Could not reach state database"
- Sunbiz bloquea por rate-limit → mismo error
- Mitigación: timeout de 10s + fallback graceful (Claudia disculpa al usuario)

---

## 3. Schema `sunbiz_corps`

Definido en [`supabase_migration_sunbiz_corps.sql`](../supabase_migration_sunbiz_corps.sql).

### Tabla principal

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | bigserial PK | Auto-incremental |
| `document_number` | text **UNIQUE NOT NULL** | Número oficial FL (ej. `L23000123456`). El identificador estable |
| `entity_name` | text NOT NULL | Nombre exacto registrado |
| `entity_type` | text | `LLC` | `CORP` | `PA` | `LTD` | otro |
| `status` | text | `ACTIVE` | `INACTIVE` | `DISSOLVED` | otro |
| `filing_date` | date | Fecha de formación original |
| `principal_address` | text | Dirección principal |
| `principal_city`, `principal_state`, `principal_zip` | text | `principal_state` default `'FL'` |
| `mailing_address`, `mailing_city`, `mailing_state`, `mailing_zip` | text | Dirección postal (puede diferir de la principal) |
| `registered_agent_name` | text | Nombre del agente registrado |
| `registered_agent_address` | text | Dirección del agente registrado |
| `data_source` | text DEFAULT `'dump'` | `'dump'` (carga inicial) | `'scraping'` (refresh incremental) |
| `last_updated` | timestamptz DEFAULT `now()` | Última vez que actualizamos la fila |
| `created_at` | timestamptz DEFAULT `now()` | Cuándo entró por primera vez |

### Índices

| Índice | Sobre | Propósito |
|--------|-------|-----------|
| `sunbiz_corps_document_number_idx` | UNIQUE `document_number` | Lookup principal por documento (Path A) |
| `sunbiz_corps_entity_name_trgm_idx` | GIN trigram `entity_name` | **Búsqueda fuzzy por nombre** (futuro Path B real) |
| `sunbiz_corps_entity_name_upper_idx` | `UPPER(entity_name)` | Match exacto case-insensitive |
| `sunbiz_corps_status_idx` | `status` | Filtrar solo ACTIVE |
| `sunbiz_corps_last_updated_idx` | `last_updated` | Cron de refresh incremental (saber qué actualizar) |

### Extensión `pg_trgm`

Para búsqueda fuzzy se usa la extensión **PostgreSQL trigram**:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Permite queries como:
```sql
SELECT entity_name, similarity(entity_name, 'MY BUSINESS LLC') AS score
FROM sunbiz_corps
WHERE entity_name % 'MY BUSINESS LLC' AND status = 'ACTIVE'
ORDER BY score DESC LIMIT 10;
```

El operador `%` usa el índice GIN. `similarity()` retorna 0-1. Umbral típico: 0.4 para "engañosamente similar".

### Función `upsert_sunbiz_corp()`

Función plpgsql que hace insert-or-update sin duplicados (usa `ON CONFLICT (document_number) DO UPDATE`). Usada por el script de carga (dump inicial) y por el cron incremental.

Firma:
```sql
upsert_sunbiz_corp(
  p_document_number TEXT,
  p_entity_name TEXT,
  p_entity_type TEXT,
  p_status TEXT,
  p_filing_date DATE,
  p_principal_address TEXT, p_principal_city TEXT, p_principal_state TEXT, p_principal_zip TEXT,
  p_registered_agent_name TEXT, p_registered_agent_address TEXT,
  p_data_source TEXT
) RETURNS VOID
```

`last_updated` se setea automáticamente a `NOW()` en cada upsert.

---

## 4. Datos cargados — estado actual

**Confirmado en producción 2026-06-04** (commit `29825ee`): tabla `sunbiz_corps` creada en Supabase producción.

Volumen esperado del dump completo de Florida: **~3.5 millones de registros**. Confirmar el conteo real con:
```sql
SELECT COUNT(*) FROM sunbiz_corps;
SELECT data_source, COUNT(*) FROM sunbiz_corps GROUP BY data_source;
SELECT MIN(last_updated), MAX(last_updated) FROM sunbiz_corps;
```

(Aneury: correr en Supabase SQL Editor cuando lo necesite. No tengo acceso para correrlo desde acá.)

---

## 5. Reglas de nombres en Florida

Reglas oficiales de la Division of Corporations FL que el verificador debe respetar.

### Para LLCs

- Debe terminar en: `LLC` | `L.L.C.` | `Limited Liability Company` | `Limited Liability Co.` | `LC` | `L.C.`
- No puede ser **idéntico** a otra entidad activa
- No puede ser **engañosamente similar** ("deceptively similar") — Florida usa criterio subjetivo. La métrica trigram con threshold ~0.4 es nuestra aproximación operativa
- No puede contener palabras restringidas sin autorización: `Bank` | `Banking` | `Trust` (requieren OFR), `Insurance` | `Insurer` (OIR), `Olympic` (USOPC), nombres de profesiones reguladas (`Engineer`, `Architect`, `Realty`) sin licencia del titular

### Para Corporaciones

- Debe terminar en: `Inc.` | `Incorporated` | `Corp.` | `Corporation` | `Company` | `Co.` (con limitaciones)
- Mismas restricciones de unicidad + similar
- Mismas palabras reservadas

### Para Professional Association (PA)

- Debe terminar en `, P.A.` o `Professional Association`
- Solo para profesionales con licencia state (médicos, abogados, dentistas, etc.)

### Estrategia para el cliente

El formulario de OpaBiz pide **3 nombres en orden de preferencia** (`companyName`, `companyName2`, `companyName3`). Si el primero está tomado o es engañosamente similar, el equipo intenta con el segundo, etc. Esto evita ida-vuelta con el cliente cuando hay un duplicado.

---

## 6. Endpoints API que tocan Sunbiz

### Públicos

| Endpoint | Método | Path | Propósito |
|----------|--------|------|-----------|
| `/api/sunbiz?document_id=...` | GET | Path A | Lookup por documento — usado en `/new-business` landing |

⚠️ **Sin auth**. Es público por diseño: cualquier visitor a `/new-business?id=L23...` puede autorrellenar el form. La data expuesta es solo nombre + tipo + dirección pública (todo es información pública en Sunbiz ya).

### Admin (con `verifyAdminToken`)

| Endpoint | Método | Path | Propósito |
|----------|--------|------|-----------|
| `/api/proxy/names/check?names=A,B,C` | GET | Path B | Verificación nombres en admin orders detail |

### Tool de Claudia (sin endpoint propio)

| Tool | Path | Propósito |
|------|------|-----------|
| `check_name_availability` | Path C | Tool calling de Claude API — scraping live |

---

## 7. Flujo operativo del verificador de nombres

Cuando una orden llega con status `in_review`, el equipo verifica los 3 nombres:

1. Admin abre `/admin/orders/[id]`
2. Click "Verificar nombres" → llama `GET /api/proxy/names/check?names=NAME1,NAME2,NAME3`
3. (Hoy retorna mock; **pendiente** migrar a query real contra `sunbiz_corps`)
4. UI muestra lista de los 3 con disponibilidad
5. Si los 3 están tomados → status `names_taken` + email al cliente
6. Si al menos 1 está disponible → status `ready_to_file` con ese nombre
7. Equipo procede a filear con FL Division of Corporations

---

## 8. Plan de actualización incremental (pendiente)

El dump inicial congeló la data en el momento de carga. Sin un refresh, la tabla se vuelve obsoleta:
- Empresas nuevas no aparecen
- Empresas que cambiaron de status (`ACTIVE` → `DISSOLVED`) no se actualizan
- Cambios de Registered Agent no se reflejan

### Opción A — Cron nocturno (recomendado pre-launch)

- **Source**: Florida DOR publica dumps trimestrales por FTP. Frecuencia oficial: cada ~3 meses.
- **Implementación**: descargar el delta del último trimestre, parsear el formato (típicamente `.txt` con campos fijos), llamar `upsert_sunbiz_corp()` por cada fila.
- **Lugar**: Railway o GitHub Action programada. **NO** Vercel (timeout 10s no cubre el job).

### Opción B — Scraping incremental (riesgoso)

- Scraping diario de las últimas N empresas filed
- Requiere parser HTML estable
- Más fresh pero más frágil

### Opción C — Trigger por chat (hybrid)

Cuando Claudia hace scraping en vivo (Path C) y encuentra una empresa que no está en `sunbiz_corps`, hacer upsert en paralelo. Llena la tabla "on demand" a medida que se la consulta. Pragmático y barato.

**Decisión actual**: Opción A está aplazada hasta post-launch, Opción C podría implementarse antes (~30 min de trabajo). Aneury: decidir cuándo prioritizar.

---

## 9. Variables de entorno

| Variable | Para qué | Notas |
|----------|----------|-------|
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Acceso DB | Ya existían |
| (ninguna específica de Sunbiz) | — | El scraping de Path C no requiere API key |

---

## 10. Decisiones embutidas

- **Tabla local + scraping live mixto** — la tabla cubre el caso "rápido y previsible" (Path A), el scraping cubre el caso "data en tiempo real" (Path C). No es uno u otro.

- **`document_number` como ID único** — Florida lo garantiza único forever. No usar `entity_name` como key (cambia con amendments).

- **`pg_trgm` para fuzzy search** — más simple que Postgres FTS, más rápido que LIKE con wildcards, y suficientemente preciso para "deceptively similar" detection.

- **`prospective_companies` separada** — la data de marketing (owner, email, scan tracking) tiene ciclo de vida diferente al dump de Sunbiz. Merge solo en el endpoint, no en la tabla.

- **Endpoint público `/api/sunbiz`** — sin auth porque la data subyacente es pública. Si se preocupa por abuse, agregar rate-limit con Upstash (existe en `lib/rate-limit.ts`).

- **Path B sigue con mock por ahora** — Fabián priorizó cargar la tabla primero. Migrar `/api/proxy/names/check` a `sunbiz_corps` es **el próximo paso obvio** y no requiere cambios al cliente del admin.

- **Path C scraping de sunbiz.org** — riesgoso pero necesario para fresh data en chat. Si Sunbiz rate-limita o cambia HTML, falla graceful sin romper el chat.

- **NO usar la API oficial de Sunbiz** — Florida no expone API oficial. Lo que hay son: dumps trimestrales por FTP + portal HTML para humanos. No hay alternativa.

---

## 11. Pendientes (con plazo)

| Item | Cuándo | Quién |
|------|--------|-------|
| **Migrar `/api/proxy/names/check` a consultar `sunbiz_corps` con fuzzy match** (deprecar el mock de Railway) | Esta semana o próxima | Aneury |
| Implementar **Opción C** (upsert on-demand cuando Claudia scrappea) | Sprint paralelo | Aneury |
| Confirmar conteo y data quality del dump cargado: `SELECT COUNT(*), MAX(last_updated) FROM sunbiz_corps` | Esta semana | Aneury |
| Documentar el script de carga del dump inicial (script de import de Fabián) — actualmente no está en el repo | Después del próximo refresh | Fabián |
| Smoke test desde `/new-business?id=L23000123456` (un document real) con la tabla cargada | Esta semana | Aneury |

---

## 12. Diferidos (no priority hoy)

- **Cron de actualización trimestral (Opción A)** — Florida publica dumps cada ~3 meses. Setup del cron en GitHub Actions o Railway requiere parser del formato FL. Post-launch.
- **Detección de nombres "engañosamente similar"** con threshold trigram afinado por feedback humano del equipo — afinar con datos reales.
- **Cache layer Redis** sobre `/api/sunbiz` — solo si vemos throughput alto. Hoy <100ms es suficiente.
- **Notificaciones al cliente cuando su nombre queda disponible** (ej. la empresa con su nombre se disolvió) — feature avanzada, post-PMF.
- **Soporte para otros estados** — si OpaBiz expande a TX, NY, CA, etc., agregar tablas por estado. Hoy solo FL.
- **Search UI pública para clientes** — un buscador en `/wiki` o `/servicios` donde el cliente puede pre-verificar su nombre antes de empezar el wizard. Mejora UX pero requiere thought sobre rate-limit y abuse.

---

## 13. Descartados (con motivo explícito)

### Reemplazar Path C (Claudia scraping) por consulta a `sunbiz_corps`

- **Por qué no**: la data en tabla puede estar desfasada hasta 3 meses. El cliente en el chat espera respuesta en tiempo real, y un "tomado" falso (empresa disuelta hace 2 meses pero sin actualizar) es peor que un timeout ocasional.
- **Decisión**: Path C se queda con scraping live. Como mitigación, implementar la **Opción C** (upsert on-demand) que aprovecha cada scrape para enriquecer la tabla.

### API oficial de Sunbiz

- **Por qué no**: Florida **no expone API oficial**. Lo único que ofrece son dumps trimestrales por FTP + portal HTML. Pelear esto es desperdicio de tiempo.
- **Decisión**: descartado por imposibilidad técnica.

### Pagar a un data provider tercero (LexisNexis, CT Corporation)

- **Por qué no**: caro (~$1k+/mes por acceso state-by-state). Los dumps oficiales de Florida son gratis. Para nuestro volumen no se justifica.
- **Decisión**: descartado por costo. Reevaluar si OpaBiz crece a 50+ estados.

### Mantener búsqueda manual

- **Por qué no**: no escala. Cada orden requiere 3 verificaciones manuales por nombre, 5+ min por orden. A 10 órdenes/día son 2.5 horas perdidas. La tabla local + fuzzy match las hace en <100ms.
- **Decisión**: descartado. La versión anterior de este doc era "manual" — quedó deprecada en commit `1b652c9`.

---

## 14. Referencias

- SQL schema: [`supabase_migration_sunbiz_corps.sql`](../supabase_migration_sunbiz_corps.sql)
- Path A — Lookup por documento: [`backend/app/api/sunbiz/route.ts`](../backend/app/api/sunbiz/route.ts)
- Path B — Admin names check (proxy): [`backend/app/api/proxy/names/check/route.ts`](../backend/app/api/proxy/names/check/route.ts) (proxy a Railway mock)
- Path C — Claudia tool: [`backend/app/api/chat/route.ts`](../backend/app/api/chat/route.ts) función `checkNameAvailability()` ~líneas 548-...
- Commits clave:
  - `1b652c9` — feat(sunbiz): tabla sunbiz_corps + API sin scraping (Etapa 5)
  - `e156ce6` — docs(checklist): actualiza Etapa 5 con progreso actual
  - `29825ee` — docs(checklist): sunbiz_corps creada en Supabase producción
- Sunbiz portal: https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults
- Florida DOR dumps FTP: https://floridarevenue.com/dor/property/forms/data.html (verificar URL actual)
- pg_trgm docs: https://www.postgresql.org/docs/current/pgtrgm.html
- Doc relacionado: [`00_arquitectura_tecnica_de_una_orden.md`](00_arquitectura_tecnica_de_una_orden.md) — donde Sunbiz encaja en el flujo de orden
- Doc relacionado: [`10_claudia_asistente_virtual.md`](10_claudia_asistente_virtual.md) — Claudia y sus tools
- Doc relacionado: [`12_marketing_automation_campanas.md`](12_marketing_automation_campanas.md) — `prospective_companies` y QR campaigns
