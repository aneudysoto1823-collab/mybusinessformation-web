# Proceso 26 — Arquitectura de Sunbiz + Backups Distribuidos

## ¿Por qué este documento existe?

Hasta hoy (2026-06-22) todos los datos del proyecto estaban en un solo lugar: **Supabase**. Eso es cómodo pero peligroso, porque si Supabase tiene un problema todo el negocio se cae al mismo tiempo. Como dice el refrán: **"no guardes todos los huevos en la misma canasta"**.

Este documento explica la arquitectura que decidimos implementar para resolver **dos cosas a la vez**:

1. **Almacenar los 3.5 millones de empresas de Florida (Sunbiz)** para poder verificar si un nombre que el cliente quiere usar para su LLC ya está tomado o no.
2. **Tener backups automáticos diarios** de todo el negocio (órdenes, contabilidad, documentos PDF de los clientes) por si Supabase se cae o pasa cualquier desastre.

Y todo eso **gastando casi $0 al mes** (en lugar de los $25/mes que costaría hacer todo dentro de Supabase Pro).

---

## La idea en una imagen

Imaginate que tu negocio es una **panadería**. Hoy tenés toda la harina, el horno, la caja registradora, las llaves del local y los registros de venta en una sola habitación. Si esa habitación se inunda, perdiste todo.

Lo que vamos a hacer es:

- **Habitación A (Supabase)**: la cocina activa donde trabaja el día a día — las órdenes de los clientes, la contabilidad, las citas, los documentos PDF.
- **Habitación B (Turso)**: el archivo grande con la lista de "todas las panaderías de Florida ya registradas" (los 3.5M de Sunbiz). Lo consultás cuando un cliente quiere abrir una panadería con un nombre nuevo, para asegurarte que no haya otra igual.
- **Caja fuerte (Cloudflare R2)**: cada noche se sacan fotocopias de TODO lo importante y se guardan en una caja fuerte fuera del local. Si pasa algo en la cocina, podés reconstruir todo desde las fotocopias.

Si se inunda la cocina (Supabase) → seguís verificando nombres y mandando emails. Si se cierra el archivo (Turso) → el negocio sigue cobrando y procesando órdenes. Si se pierden las fotocopias (R2) → no afecta el día a día, las recuperás al día siguiente.

**Tres proveedores independientes. Si uno cae, los otros siguen.**

---

## Arquitectura visual

```
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE FREE (500 MB)                                     │
│  ─ Cocina activa ─                                          │
│                                                             │
│  • Órdenes de clientes (Order)                              │
│  • Contabilidad (accounting_clients, accounting_income…)    │
│  • Citas agendadas (appointments)                           │
│  • Audit log del admin                                      │
│  • Empresas para marketing (prospective_companies)          │
│  • Escaneos QR + conversiones                               │
│  • PDFs del Certificate of Formation (Storage bucket)       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │  cada noche a las 12am
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS (gratis 2000 min/mes)                       │
│  ─ Corre el backup diario ─                                 │
│                                                             │
│  1. pg_dump de Supabase → archivo .sql                      │
│  2. Sync de PDFs de Supabase Storage → R2                   │
│  3. Sube todo a R2 con timestamp YYYY-MM-DD                 │
│  4. Mantiene últimos 30 días, borra anteriores              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CLOUDFLARE R2 (~$0/mes hasta 10 GB)                        │
│  ─ Caja fuerte fuera del local ─                            │
│                                                             │
│  • Bucket "opabiz-backups"                                  │
│  • Dump diario de Supabase (.sql)                           │
│  • Copia de todos los PDFs                                  │
│  • Retención 30 días automática                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│  TURSO FREE (5 GB SQLite distribuido)                       │
│  ─ Archivo grande de Sunbiz ─                               │
│                                                             │
│  • Tabla sunbiz_corps (3.5M empresas de Florida)            │
│  • Búsqueda fuzzy con FTS5 (más rápido que Postgres)       │
│  • Cron nocturno agrega ~1,500 empresas nuevas por día      │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │  cada noche a las 12am
                            │
┌─────────────────────────────────────────────────────────────┐
│  VERCEL CRON (incluido en Vercel Pro que ya pagás)          │
│  ─ Cron nocturno Sunbiz ─                                   │
│                                                             │
│  1. Descarga el daily file de Florida (SFTP público)        │
│  2. Parsea el archivo (1440 chars/registro, layout oficial) │
│  3. UPSERT a tabla sunbiz_corps en Turso                    │
│  4. Loguea cuántas empresas agregó                          │
│  5. Si falla 2 noches seguidas → alerta a alert@opabiz.com  │
└─────────────────────────────────────────────────────────────┘
```

---

## Las tres canastas (y qué guarda cada una)

### 🟢 Supabase Free — La cocina activa

**Qué guarda**: lo que se usa todos los días para operar el negocio.

| Tabla | Para qué |
|---|---|
| `Order` | Las órdenes de los clientes que están formando LLCs |
| `accounting_clients` / `accounting_income` / `accounting_expenses` | El módulo de contabilidad interno |
| `appointments` / `blocked_slots` | El sistema de citas (booking) |
| `admin_audit_log` | Quién hizo qué en el panel admin (auditoría) |
| `prospective_companies` | Empresas extraídas de Sunbiz para campañas de marketing QR |
| `qr_scans` / `conversions` | Tracking de las campañas QR (quién escaneó, quién compró) |
| `email_campaigns` | Registro de emails enviados desde campañas |
| Storage bucket `certificates` | PDFs del Certificate of Formation que el equipo sube |

**Por qué Free**: 500 MB son más que suficientes para esta data (las órdenes son texto plano, no pesan nada).

**Plan**: Free tier permanente. Solo pasaríamos a Pro $25/mes si necesitamos features avanzadas como Realtime o más de 50K usuarios activos.

---

### 🟡 Turso Free — El archivo grande de Sunbiz

**Qué guarda**: los 3.5 millones de empresas registradas en Florida + las que se crean cada día.

**Tabla única**: `sunbiz_corps`

| Campo | Para qué |
|---|---|
| `document_number` | ID oficial de Florida (`L23000123456`) |
| `entity_name` | Nombre completo de la empresa |
| `entity_type` | LLC, CORP, etc. |
| `status` | ACTIVE, INACTIVE, DISSOLVED, etc. |
| `filing_date` | Cuándo se registró en Florida |
| `principal_address` + `city` + `state` + `zip` | Dirección del negocio |
| `registered_agent_name` + `registered_agent_address` | Agente registrado |
| `data_source` | De dónde viene el dato (`sftp_dump`, `daily_file`, `manual`) |
| `last_updated` | Cuándo se actualizó por última vez |

**Por qué Turso y no Supabase**: los 3.5M ocupan **~1.24 GB** con índices y FTS5 (medido empíricamente con los primeros 60K cargados — 382 bytes/row). No entran en Supabase Free (500 MB) y nos forzarían a pagar Supabase Pro $25/mes. Turso da **5 GB gratis** (Hobby) — usamos ~25%, sobra ~75% para crecimiento de varios años. Además, SQLite con FTS5 es más rápido que Postgres pg_trgm para búsqueda fuzzy de nombres.

**Por qué SQLite distribuido**: Turso replica la base en múltiples regiones del mundo, así desde Vercel las consultas son ultra rápidas (10-50ms).

**Plan**: Free tier permanente. Si crecemos mucho (improbable — Florida registra ~500K empresas nuevas por año, son ~7 años de margen), pasaríamos a Scale $29/mes.

---

### 🔵 Cloudflare R2 — La caja fuerte de backups

**Qué guarda**: copias diarias de Supabase + todos los PDFs.

**Estructura del bucket** `opabiz-backups`:

```
opabiz-backups/
├─ supabase-dumps/
│  ├─ 2026-06-22.sql
│  ├─ 2026-06-23.sql
│  └─ ...  (últimos 30 días)
└─ pdfs/
   └─ certificates/
      └─ orders/
         └─ {orderId}/
            └─ certificate.pdf
```

**Por qué Cloudflare R2 y no AWS S3**:
- Cloudflare R2 **no cobra egress** (transferencia de salida). AWS S3 sí cobra y puede ser caro si necesitamos restaurar.
- 10 GB free (vs S3 que tiene 5 GB free solo el primer año).
- API compatible con S3 (los SDKs de S3 funcionan igual).

**Por qué necesitamos backups**: Supabase Pro $25/mes los incluye automáticos (7 días de retención). Como vamos en Free, los hacemos nosotros con GitHub Actions + R2. **Resultado equivalente, $0/mes.**

**Plan**: gratis hasta 10 GB. Después es $0.015/GB/mes (muy barato).

---

### ⚙️ GitHub Actions — Quien dispara el backup

**Qué hace**: cada noche a las 12:30am corre un script que:

1. Conecta a Supabase y hace `pg_dump` (saca todo el schema y la data de la base).
2. Conecta a Supabase Storage y descarga TODOS los PDFs.
3. Sube ambas cosas a Cloudflare R2 con el timestamp del día.
4. Borra backups de hace más de 30 días (lifecycle policy de R2 lo hace automático).
5. Si algo falla, manda alerta a `alert@opabiz.com`.

**Por qué GitHub Actions**: el repo ya está en GitHub. Tiene 2,000 minutos gratis al mes. Un backup diario tarda ~5 minutos = 150 min/mes. Sobra muchísimo.

**Plan**: gratis para siempre dentro del tier de GitHub.

---

### ☁️ Vercel Cron — Quien actualiza Sunbiz

**Qué hace**: cada noche a las 12am corre `/api/cron/sunbiz-daily`:

1. Conecta al SFTP público de Florida (`sftp.floridados.gov` con usuario `Public`).
2. Descarga el daily file del día anterior (~1,500 empresas nuevas).
3. Parsea cada record (formato fixed-width 1440 chars/línea).
4. UPSERT a `sunbiz_corps` en Turso.
5. Loguea cuántas empresas agregó.

**Por qué Vercel Cron y no Railway**: Vercel Pro (que ya pagás) incluye hasta 100 crons. El daily file pesa ~3 MB y se procesa en menos de 1 minuto, muy dentro del límite de 5 min de las funciones serverless de Vercel Pro. **Nos ahorramos los $5/mes de Railway.**

---

## ¿Cómo nos protege esta arquitectura?

### Escenario 1: Supabase se cae por unas horas
- ❌ El sitio no puede crear órdenes nuevas
- ❌ El admin no puede ver órdenes existentes
- ✅ La verificación de nombres en Turso sigue funcionando
- ✅ Cuando vuelve, todo se restablece
- ✅ Los backups en R2 están a salvo

### Escenario 2: Turso se cae
- ✅ El negocio sigue 100% — órdenes, pagos, emails, panel admin
- ⚠️ La búsqueda automática de nombres no funciona, pero Claudia tiene fallback con scraping directo a Sunbiz
- ✅ Cuando vuelve Turso, los nombres siguen actualizados

### Escenario 3: Cloudflare R2 se cae
- ✅ Todo el negocio funciona normal
- ⚠️ No se hace el backup de esa noche
- ✅ Al día siguiente vuelve y se hace el backup acumulado

### Escenario 4: 🔥 Lo peor — Alguien borra accidentalmente la base de Supabase
- ✅ El backup de la noche anterior está en R2
- ✅ Restauramos con `pg_restore` desde el dump → ~10 minutos
- ✅ Perdemos como máximo las órdenes del día (las del día se rescatan de Stripe + emails enviados)

### Escenario 5: Un hacker corrompe la data
- ✅ Tenemos 30 días de backups en R2 (snapshot por día)
- ✅ Podemos restaurar el backup del día antes del hack
- ✅ Audit log queda en R2 también, podemos saber qué se cambió

---

## Costos totales por mes

| Servicio | Plan | Costo |
|---|---|---|
| Vercel | Pro (ya pagás) | $20 (ya pagás) |
| Supabase | Free | **$0** |
| Turso | Free (Hobby) | **$0** |
| Cloudflare R2 | Pay-as-you-go (bajo 10 GB) | **~$0** |
| GitHub Actions | Free (bajo 2000 min) | **$0** |
| Resend | Free (bajo 3000 emails/mes) | $0 |
| ~~Railway~~ | **CANCELAR** | **-$5 (ahorro)** |
| **Extra mensual sobre lo que ya pagás** | | **$0** |

**Comparado con la alternativa "todo en Supabase Pro":**
- Supabase Pro: $25/mes
- Railway: $5/mes
- Total alternativa: **$30/mes adicionales**

**Ahorro real: $30/mes = $360/año** con la misma protección y la ventaja de no concentrar todo en un solo proveedor.

---

## Plan de implementación (en orden)

### Fase 0 — Cuentas (lo hace el founder)
- [ ] Crear cuenta en https://turso.tech con email del negocio
- [ ] Crear database `opabiz-sunbiz` en región `iad` (US East)
- [ ] Guardar `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`
- [ ] Crear cuenta en https://cloudflare.com (o usar la existente si ya hay para DNS)
- [ ] Activar R2 Object Storage (pide tarjeta pero no cobra bajo free tier)
- [ ] Crear bucket `opabiz-backups` en región `ENAM`
- [ ] Crear API Token de R2 con permisos Read & Write sobre el bucket
- [ ] Guardar `Access Key ID`, `Secret Access Key`, `Account ID`, `Endpoint URL`

### Fase 1 — Carga inicial de Sunbiz (1 sola vez)
- [ ] Adaptar el script `florida_sftp.py` del proyecto `datallc` para escribir a Turso en vez de SQLite local
- [ ] Descargar el dump trimestral completo de Florida (`cor/cordata/cor*.txt`) — pesa ~500 MB comprimido
- [ ] Correr el script de carga inicial desde tu PC (tarda 1-2 horas)
- [ ] Validar: `SELECT COUNT(*) FROM sunbiz_corps` debería dar ~3.5M

### Fase 2 — Cron nocturno Sunbiz (Vercel Cron)
- [ ] Crear endpoint `backend/app/api/cron/sunbiz-daily/route.ts`
- [ ] Conectar al SFTP, descargar el daily, parsear, UPSERT a Turso
- [ ] Configurar el cron en `vercel.json` para 4am UTC (12am EST)
- [ ] Smoke test: correr manualmente y verificar logs

### Fase 3 — Migrar Path B y Path C a Turso
- [ ] Path B: `/api/proxy/names/check` — quitar el mock, consultar Turso con FTS5 fuzzy search
- [ ] Path C: tool `check_name_availability` de Claudia chat — quitar scraping HTML, consultar Turso

### Fase 4 — Backups automáticos
- [ ] Crear `.github/workflows/backup-daily.yml`
- [ ] Script que hace `pg_dump` + sync PDFs + sube a R2 con timestamp
- [ ] Configurar lifecycle policy en R2 para borrar después de 30 días
- [ ] Smoke test: correr workflow manualmente y verificar archivos en R2
- [ ] Documentar el procedimiento de restore en `TROUBLESHOOTING/`

### Fase 5 — Cancelar Railway
- [ ] Confirmar que todo funciona sin Railway
- [ ] Cancelar el plan de Railway en su dashboard
- [ ] Limpiar `BACKEND_URL` y código relacionado en Vercel

---

## Variables de entorno requeridas (Vercel Production + Development)

```bash
# Turso (Sunbiz)
TURSO_DATABASE_URL=libsql://opabiz-sunbiz-xxxxx.turso.io
TURSO_AUTH_TOKEN=<JWT largo>

# Cloudflare R2 (backups) — solo se usa desde GitHub Actions
R2_ACCESS_KEY_ID=<access key>
R2_SECRET_ACCESS_KEY=<secret key>
R2_ACCOUNT_ID=<cloudflare account id>
R2_BUCKET_NAME=opabiz-backups
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Sunbiz SFTP (públicas, hardcodeadas pero como env var por si Florida las cambia)
SUNBIZ_SFTP_HOST=sftp.floridados.gov
SUNBIZ_SFTP_USER=Public
SUNBIZ_SFTP_PASS=PubAccess1845!
```

Las de R2 van solo en GitHub Actions Secrets, no en Vercel (Vercel no necesita acceso a backups).

---

## Decisiones tomadas (y por qué)

| Decisión | Por qué |
|---|---|
| **Turso en vez de Cloudflare D1** para Sunbiz | Ambos free 5 GB. Driver `@libsql/client` de Turso es más natural para Vercel serverless que el D1 (diseñado para Workers). |
| **Cloudflare R2 en vez de AWS S3** para backups | No cobra egress (transferencia de salida). 10 GB free permanente vs S3 5 GB free solo el primer año. |
| **Vercel Cron en vez de Railway** | Ya pagamos Vercel Pro. El daily file tarda <1 min, dentro del límite de 5 min de Vercel serverless. Ahorramos $5/mes de Railway. |
| **Carga inicial desde la PC del founder** en vez de servidor cloud | Tarda 1-2 horas y se hace 1 sola vez. Pagar un servidor solo para eso es desperdicio. |
| **GitHub Actions en vez de Vercel Cron** para backups | El backup tarda ~5 min (Vercel mata a los 5 exactos). GitHub Actions no tiene ese límite. |
| **Mantener Supabase para todo lo crítico** en vez de migrar todo a Turso | Supabase tiene Storage, Auth, RLS, etc. Es la "cocina" del negocio. Turso es un archivo grande, no una cocina. |
| **Backups de PDFs además del SQL** | Si Supabase pierde el bucket de Storage, los Certificate PDFs son irrecuperables — los clientes pagaron por ellos. |
| **Retención 30 días** en R2 | Suficiente para detectar cualquier problema. Más allá serían inútiles porque la data está obsoleta. |

---

## Qué NO está en esta arquitectura (y por qué)

- **Multi-región failover** — Es complejidad innecesaria para nuestro tamaño. Si Supabase US-East se cae, perdemos algunas horas. Aceptable.
- **Backups en tiempo real (CDC)** — Caros y overkill. Backups diarios son estándar de la industria.
- **Sentry alerts para fallos del cron Sunbiz** — Documentado como pendiente en `02_emails_automaticos.md`. Por ahora, si el cron falla 2 noches seguidas, alerta a `alert@opabiz.com` (built-in).
- **Réplica de Supabase a un proveedor distinto** — Es lo que hacen empresas con $1M+ ARR. Para nuestro tamaño, R2 backups + retención 30 días es más que suficiente.
- **Encriptación adicional de los dumps en R2** — Cloudflare ya encripta at-rest por default. Para data sensible adicional (PII), agregar capa de encriptación AES antes del upload sería un upgrade futuro.

---

## Referencias

- **Sunbiz SFTP**: https://dos.sunbiz.org/data-definitions/cor.html (layout oficial)
- **Turso docs**: https://docs.turso.tech
- **Cloudflare R2 docs**: https://developers.cloudflare.com/r2/
- **GitHub Actions docs**: https://docs.github.com/en/actions
- **Proyecto datallc** (scraper original que vamos a adaptar): `c:\Users\ethan\datallc\fase0-validation\src\ingest\florida_sftp.py`
- **Doc relacionado**: `LOGICA_DE_NEGOCIO/06_busqueda_nombres_sunbiz.md` (el flujo actual de búsqueda)
