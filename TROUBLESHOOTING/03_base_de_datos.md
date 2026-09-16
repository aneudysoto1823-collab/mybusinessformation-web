# 03 — Base de datos (Supabase PostgreSQL)

Problemas con Supabase: conexiones, queries lentas, datos perdidos, espacio insuficiente o errores de schema.

---

### 1. Supabase está completamente caído (status page rojo)
**Status:** 🔴 Crítico
**Síntoma visible:** Todas las funciones del sitio que tocan datos fallan: panel admin no carga órdenes, formulario de orden no se guarda, login admin no funciona. Errores tipo "Connection refused" o "ECONNREFUSED" en logs de Vercel y Railway.
**Solución posible:** Ir a https://status.supabase.com → verificar si hay incidente activo en US-East-1 (nuestra región). Si Supabase confirma incidente, no hay solución de nuestro lado — esperar resolución upstream. Mientras tanto: publicar aviso en sitio "Estamos teniendo problemas técnicos, vuelve en X minutos". Suscribirse a updates del incidente para enterarse cuando se resuelve. Después de resolución, verificar que órdenes pendientes durante el outage no se hayan duplicado.

---

### 2. Connection pool saturado ("too many connections")
**Status:** 🔴 Crítico
**Síntoma visible:** Endpoints empiezan a fallar intermitentemente con error "too many connections" o timeouts intermitentes del REST API. Panel admin a veces carga, a veces no.
**Corregido 2026-09-16:** este ítem asumía conexiones directas a Postgres vía Prisma con pooler pgbouncer — Prisma se removió el 2026-05-19, hoy TODO el acceso a datos pasa por el cliente REST de Supabase (`lib/supabase.ts`, `getSupabaseAdmin()`, service role key) vía PostgREST, no por `DATABASE_URL`/`DIRECT_URL` (esas variables quedaron legacy en Vercel, se pueden borrar). Aun así Supabase tiene un límite total de conexiones internas que PostgREST comparte.
**Solución posible:** Ir a Supabase Dashboard → Database → "Connection Pooling" para ver el uso actual. Si está saturado, revisar en "Reports" si algún endpoint está abriendo muchas requests concurrentes sin necesidad (ej. un loop haciendo queries una por una en vez de batch). Si persiste sin causa clara del lado nuestro, en Supabase Dashboard → Settings → Database → "Restart Project" como último recurso (causa downtime breve).

---

### 3. Queries muy lentas (>5 segundos)
**Status:** 🟡 Medio
**Síntoma visible:** Panel admin tarda mucho en cargar tabla de órdenes. Búsqueda de FBFC en `/admin` no responde. Filtros tardan en aplicar.
**Solución posible:** Ir a Supabase Dashboard → "Reports" → tab "Query Performance". Identificar las queries más lentas (top 5). Si veo queries sobre `Order` sin índice en columnas filtradas (status, email, createdAt), agregar el índice directo desde el SQL Editor: `CREATE INDEX IF NOT EXISTS idx_order_status ON "Order" (status);` (sin Prisma — no hay `schema.prisma` desde el 2026-05-19, cualquier índice o cambio de schema se aplica a mano vía SQL Editor y se documenta como un archivo `supabase_migration_*.sql` en la raíz del repo). Verificar mejora en Reports.

---

### 4. Free tier llegó al límite de 500MB de DB
**Status:** 🔴 Crítico
**Síntoma visible:** Email de Supabase "Your project has exceeded the database size limit". Inserts comienzan a fallar con error "out of disk space" o "no space left on device". Nuevas órdenes no se guardan.
**Nota 2026-09-16:** los 3.5M+ registros de Sunbiz NO cuentan acá — viven en Turso aparte, específicamente para no acercar a Supabase a este límite (decisión de arquitectura 2026-06-22). Si este límite se alcanza igual, es por datos reales del negocio (`Order`, contabilidad, citas), no por Sunbiz.
**Solución posible:** Ir a Supabase Dashboard → Settings → "Plans" → upgrade a Pro $25/mes (8GB de DB). Esto se activa en minutos y restaura inserts. Mientras se procesa el upgrade, como mitigación temporal: en SQL Editor, identificar y eliminar datos viejos no críticos (logs, registros de prueba, órdenes `isDraft:true` abandonadas hace meses). Para prevenir a futuro: configurar alerta de uso al 80% en Settings → Notifications.

---

### 5. Free tier llegó al límite de 1GB Storage (PDFs)
**Status:** 🟡 Medio
**Síntoma visible:** Admin sube un PDF de Certificate al panel y aparece error "Storage quota exceeded". Cliente no puede descargar documentos nuevos. Documentos ya subidos siguen accesibles.
**Solución posible:** Ir a Supabase Dashboard → Storage → ver buckets `certificates`, `documents`. Verificar consumo total. Si excede 1GB: upgrade a Pro $25/mes (incluye 100GB Storage). Como limpieza puntual: eliminar PDFs de pruebas/desarrollo del bucket si los hay. Después del upgrade, los uploads vuelven a funcionar inmediatamente.

---

### 6. Una orden no aparece en `/admin` aunque el cliente la creó
**Status:** 🟡 Medio
**Síntoma visible:** Cliente reporta "ya pagué pero no veo confirmación". En Stripe el pago aparece como exitoso. En `/admin` la orden NO aparece en ninguna pestaña.
**Solución posible:** Ir a Supabase Dashboard → "Table Editor" → tabla `Order`. Buscar por email del cliente o `stripePaymentId` (visible en Stripe). Si la orden ESTÁ en la tabla pero no aparece en `/admin`: refresh del panel admin (caché). Si NO está en la tabla: ir a Railway logs y buscar `POST /api/orders` con timestamp del pago — leer el error. Recuperar manualmente: copiar datos de Stripe + email del cliente y crear la orden directamente desde "Table Editor" como fila nueva, status `in_review`, paymentStatus `paid`. Disparar email manualmente desde panel admin.

---

### 7. Una migración SQL manual dejó el código y la DB desincronizados
**Status:** 🔴 Crítico
**Síntoma visible:** Después de deployar un feature nuevo, endpoints que tocan cierta tabla fallan con "column XXX does not exist". **Corregido 2026-09-16** — este ítem describía `npx prisma db push`, pero Prisma se removió el 2026-05-19. Hoy cada feature que necesita una columna/tabla nueva viene con su propio archivo `supabase_migration_*.sql` en la raíz del repo, que hay que correr A MANO en Supabase SQL Editor — el código se puede deployar a Vercel ANTES de que alguien corra esa migración, y ahí es cuando rompe.
**Solución posible:** Buscar en la raíz del repo si el commit que introdujo el feature trae un `supabase_migration_*.sql` sin correr — es la causa más común. Copiarlo y ejecutarlo completo en Supabase SQL Editor. Si no hay ningún archivo de migración para el cambio, alguien hizo el cambio de schema a mano sin documentarlo — revisar el PR/commit para ver qué columna faltaba y agregarla manualmente, y a partir de ahí crear el archivo de migración correspondiente para que quede documentado.

---

### 8. El backup diario no corrió o falló
**Status:** 🟡 Medio
**Síntoma visible:** No hay un backup nuevo en Cloudflare R2 con la fecha de hoy.
**Corregido 2026-09-16:** este ítem asumía Supabase Backups (feature de plan Pro) — la decisión de arquitectura fue explícitamente NO pagar Supabase Pro. Los backups reales corren por **GitHub Actions** (`.github/workflows/backup-daily.yml`, todos los días 4:30am UTC) haciendo `pg_dump` + subida a **Cloudflare R2**.
**Solución posible:** Ver el detalle completo en el **runbook 19 ([19_backups_r2_no_corren.md](19_backups_r2_no_corren.md))**.

---

### 9. RLS (Row Level Security) bloqueando reads del admin panel
**Status:** 🟡 Medio
**Síntoma visible:** Panel admin carga la página pero aparece "0 órdenes" cuando claramente hay órdenes en la DB. En Supabase Table Editor SÍ se ven las órdenes con la service_role key.
**Solución posible:** Ir a Supabase Dashboard → Authentication → Policies → tabla `Order`. Verificar las RLS policies activas. Para el admin panel usamos `SUPABASE_SERVICE_ROLE_KEY` que bypasea RLS — verificar en Vercel/Railway que esa variable está bien configurada (NO la `anon` key). Si está bien, verificar el código de `lib/supabase.ts` — debe usar `getSupabaseAdmin()` con la service role key para queries del panel, NO el cliente anon.

---

### 10. Datos de cliente sensibles aparecen en logs públicos
**Status:** 🟡 Medio (legal)
**Síntoma visible:** Revisando logs de Vercel/Railway/Sentry se ven SSN, números de tarjeta, ITINs, emails completos en mensajes de error. Esto es violación de PII handling.
**Solución posible:** Acción inmediata: ir a la herramienta donde se ven (Sentry/Logtail/Vercel Logs) → eliminar o redactar esos eventos manualmente. Después: en código Next.js y Express, agregar filtro de PII en logger — nunca hacer `console.log(order)` que tenga datos completos. Sustituir por `console.log({ id: order.id, status: order.status })` con solo datos no sensibles. Si hay Sentry instalado, configurar `beforeSend` en `sentry.client.config.ts` para scrubbear emails y SSN antes de enviar a Sentry.
