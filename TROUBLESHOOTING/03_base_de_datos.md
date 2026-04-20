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
**Síntoma visible:** Endpoints empiezan a fallar intermitentemente con error "remaining connection slots are reserved" o "too many connections for role". Panel admin a veces carga, a veces no.
**Solución posible:** Ir a Supabase Dashboard → Database → "Connection Pooling". Verificar que estamos usando el pooler `aws-1-us-east-1` puerto **6543** (transactional mode), NO el puerto 5432 (direct). Verificar que `DATABASE_URL` en Vercel y Railway termina con `?pgbouncer=true&connection_limit=1`. Si todo eso está OK pero sigue saturado, restart Railway (libera conexiones). Si persiste, en Supabase Dashboard → Settings → Database → "Restart Project" como último recurso (causa downtime breve).

---

### 3. Queries muy lentas (>5 segundos)
**Status:** 🟡 Medio
**Síntoma visible:** Panel admin tarda mucho en cargar tabla de órdenes. Búsqueda de FBFC en `/admin` no responde. Filtros tardan en aplicar.
**Solución posible:** Ir a Supabase Dashboard → "Reports" → tab "Query Performance". Identificar las queries más lentas (top 5). Si veo queries sobre `Order` sin índice en columnas filtradas (status, email, createdAt), agregar índices: ir a "Database" → "Indexes" → "Create new index" sobre la columna lenta. O en local: editar `prisma/schema.prisma` agregando `@@index([campo])` y correr `npx prisma db push`. Verificar mejora en Reports.

---

### 4. Free tier llegó al límite de 500MB de DB
**Status:** 🔴 Crítico
**Síntoma visible:** Email de Supabase "Your project has exceeded the database size limit". Inserts comienzan a fallar con error "out of disk space" o "no space left on device". Nuevas órdenes no se guardan.
**Solución posible:** Ir a Supabase Dashboard → Settings → "Plans" → upgrade a Pro $25/mes (8GB de DB). Esto se activa en minutos y restaura inserts. Mientras se procesa el upgrade, como mitigación temporal: en SQL Editor, identificar y eliminar datos viejos no críticos (logs, registros de prueba). Para prevenir a futuro: configurar alerta de uso al 80% en Settings → Notifications.

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

### 7. Migration de Prisma rompió el schema
**Status:** 🔴 Crítico
**Síntoma visible:** Después de hacer cambio en `schema.prisma` y push, todos los endpoints que tocan la tabla afectada fallan. Logs muestran "column XXX does not exist" o "relation does not exist".
**Solución posible:** Si la migration ya se aplicó a Supabase pero rompió cosas: en local, hacer rollback con `git revert <commit>` del cambio de schema, push, y desde local correr `npx prisma db push` apuntando al Supabase de producción para sincronizar de vuelta. Si los datos se perdieron: ir a Supabase Dashboard → Database → "Backups" (solo en plan Pro) → restaurar al snapshot anterior. Si no hay Pro, los datos perdidos se pierden — razón por la cual upgrade a Pro es obligatorio antes de lanzamiento.

---

### 8. Backup automático no se ejecuta o falla
**Status:** 🟡 Medio
**Síntoma visible:** En Supabase Dashboard → Database → Backups no aparece el backup del día. Mensaje "No backup available" o último backup tiene varios días.
**Solución posible:** Verificar primero que el plan está en Pro o superior (Free tier NO tiene backups). Ir a https://status.supabase.com — si hay incidente con backups, esperar. Si todo OK pero sigue sin backup, contactar soporte Supabase desde Dashboard → "Help → New Ticket" con prioridad alta. Como mitigación: hacer backup manual ahora — Database → Backups → "Create backup now". Como prevención: hacer backup semanal manual a Google Drive cifrado (export desde SQL Editor).

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
