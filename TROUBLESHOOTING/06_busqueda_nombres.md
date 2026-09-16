# 06 — Búsqueda de nombres (Sunbiz Florida)

Problemas con la verificación de disponibilidad de nombres contra la base local de Sunbiz. **Arquitectura real (corregido 2026-09-16 — este archivo describía Prisma + una tabla en Supabase que nunca se usó en producción):** los 3.5M+ registros de Florida viven en **Turso** (`lib/turso.ts`, `getTurso()`), no en Supabase. La tabla `sunbiz_corps` de Supabase existe pero está vacía — es un nombre homónimo heredado de un intento anterior, no la fuente real. Un cron diario en Vercel (`/api/cron/sunbiz-daily`) mantiene Turso al día descargando el archivo `YYYYMMDDc.txt` del SFTP público de Florida (`sftp.floridados.gov`, user `Public`) cada noche.

El chequeo de disponibilidad (`GET /api/sunbiz/name-check`) se llama **server-side al crear la orden** (`/api/orders`), nunca desde el `oninput` del campo del cliente (decisión de negocio 2026-06-25, para no agregar fricción al checkout) — el resultado se ve en el email de alerta interna con semáforo verde/rojo/ámbar. El buscador de nombres del admin (`/admin/orders/[id]`) también consulta Turso real desde 2026-07-12.

---

### 1. Búsqueda de nombre devuelve "no disponible" cuando SÍ está disponible
**Status:** 🟡 Medio
**Síntoma visible:** Un nombre que verificas manualmente en sunbiz.org y NO existe, pero el chequeo interno (admin o email de alerta) lo marca como tomado.
**Solución posible:** Causa #1: Turso desactualizado. Revisar cuándo corrió por última vez el cron — ver logs de `/api/cron/sunbiz-daily` en Vercel Dashboard → Cron Jobs, o consultar directo con el CLI de Turso: `turso db shell <nombre-db> "SELECT MAX(fecha_actualizado) FROM sunbiz_load_log"` (o el nombre real de la tabla de log). Si pasaron varios días sin correr, revisar el runbook 18. Como mitigación inmediata: confiar siempre en sunbiz.org oficial cuando hay duda — nuestra base es ayuda, NO autoridad. Causa #2: normalización distinta a la de Florida (criterio §605.0112 — designadores, mayúsculas, puntuación). Revisar `lib/sunbiz-normalize.ts` si el nombre tiene caracteres especiales o un designador poco común.

---

### 2. Búsqueda de nombre devuelve "disponible" pero al filing en Sunbiz lo rechaza
**Status:** 🔴 Crítico
**Síntoma visible:** El chequeo interno marcó el nombre como disponible, se envió el filing a Sunbiz, y Florida lo rechaza por "name not available — too similar to existing entity".
**Solución posible:** Causa: nuestra búsqueda usa FTS5 (full-text search) con normalización propia, pero Sunbiz aplica sus propias reglas de similaridad al momento de radicar, que pueden ser más estrictas en casos límite. Acción: comunicarse con el cliente inmediatamente, explicar el rechazo, pedir nombre alternativo. Verificar el alternativo MANUALMENTE en sunbiz.org antes de re-enviar, incluyendo variantes cercanas (ej. "Tech Solutions LLC" vs "Tech Solutions Co."). Documentar el caso — si se repite seguido, revisar si la normalización de `lib/sunbiz-normalize.ts` necesita un ajuste.

---

### 3. El cron diario no logra descargar o procesar el archivo de Sunbiz
**Status:** 🟡 Medio
**Síntoma visible:** El cron `/api/cron/sunbiz-daily` corre pero falla o no encuentra el archivo del día. El endpoint tiene alertas por email integradas (vía `RESEND_API_KEY`) — si algo falla, debería llegar un aviso.
**Solución posible:** Las credenciales del SFTP son **públicas y fijas** (`sftp.floridados.gov` / user `Public` / password `PubAccess1845!`, documentadas en `CLAUDE.md`) — no hay nada que rotar ni ningún env var secreto que revisar por ese lado. Causas reales más probables: (1) Florida no publicó el archivo ese día (fin de semana o feriado — el código ya detecta esto y lo loguea como skip, no como error); (2) Florida cambió el path (`doc/cor`) o el formato del nombre del archivo — revisar el código de la ruta contra lo que hay hoy en el SFTP; (3) timeout — el `maxDuration` de esta función está en 300s en `backend/vercel.json`, verificar que el plan de Vercel lo sigue permitiendo. Ver logs completos en Vercel Dashboard → Deployments → Functions → `/api/cron/sunbiz-daily`.

---

### 4. Import inicial de 3.5M registros (evento histórico, ya completado)
**Status:** 🟢 Bajo (informativo)
**Síntoma visible:** N/A — la carga masiva inicial (Fase 1 de Etapa 5) ya se completó y no debería volver a correr. Se incluye acá solo por si en el futuro hace falta re-cargar todo desde cero (ej. corrupción de datos, migración a otra cuenta de Turso).
**Solución posible:** El loader (`backend/scripts/sunbiz-load.mjs`) procesa en batches de 2000 registros × 6 workers paralelos — a esa velocidad, la carga completa toma minutos, no horas (el founder reportó 57,000 registros en 10 minutos en el proyecto hermano `datallc` con el mismo approach). Si hiciera falta re-correr: descargar el dump trimestral (`cordata.zip`, ~1.66 GB) del path `doc/Quarterly/Cor` del mismo SFTP, descomprimir, y correr el script apuntando a la DB de Turso correcta. Verificar al final con `SELECT COUNT(*) FROM sunbiz_corps` ≈ 3.5M.

---

### 5. Búsqueda local muy lenta (>3 segundos)
**Status:** 🟡 Medio
**Síntoma visible:** En `/admin/orders/[id]` o en el chequeo de nombre al crear una orden, la respuesta tarda demasiado.
**Solución posible:** Turso es SQLite (libSQL), no Postgres — no aplica GIN trigram. Verificar que la tabla tiene su índice **FTS5** (virtual table) creado y sus triggers de sincronización intactos: `turso db shell <db> ".schema sunbiz_corps"` debe mostrar la tabla FTS5 asociada. Si el índice FTS5 existe pero la query sigue lenta, revisar que la query en `lib/sunbiz-namecheck.ts`/`lib/turso.ts` esté usando `MATCH` contra la tabla virtual y no un `LIKE` sobre la tabla base (un `LIKE` sin índice escanea las 3.5M filas). Como mitigación puntual: revisar el plan de Turso (Free tier = 5GB + límite de filas leídas/mes) — si se acercó al límite mensual, las queries pueden degradarse.

---

### 6. Sunbiz oficial (sunbiz.org) está caído
**Status:** 🔴 Crítico (durante este tiempo no se pueden radicar filings nuevos)
**Síntoma visible:** sunbiz.org no carga o está en mantenimiento. El admin no puede enviar Articles of Organization ni verificar nombres manualmente contra la fuente oficial (nuestro chequeo interno con Turso sigue funcionando igual, es independiente de que sunbiz.org esté arriba o no).
**Solución posible:** Verificar status en https://dos.fl.gov o redes de Florida Department of State. Sin solución de nuestro lado: (1) acumular órdenes en `ready_to_file` mientras se resuelve; (2) comunicar a clientes activos con expectativa realista de delay; (3) al restaurarse, procesar en orden de antigüedad.

---

### 7. Cliente necesita cambiar el nombre de su empresa después de que Florida lo rechazó
**Status:** 🟡 Medio (operativo, no técnico)
**Síntoma visible:** Una orden queda en `names_taken` pidiendo un nombre nuevo.
**Solución posible:** **Aplica solo a órdenes legacy pre-2026-06-22** — el form actual pide un solo nombre y ya lo valida contra Turso al crear la orden, así que las órdenes nuevas casi nunca deberían llegar a este estado. Si es una orden vieja (3 nombres, `companyName2`/`companyName3`): en `/admin/orders/[id]` usar el botón "Send 'Names Taken' Email" (dispara A2/A3 automático). Cuando el cliente responda con un nombre nuevo por email/WhatsApp, actualizarlo manualmente en la orden y volver a verificar contra Turso o sunbiz.org antes de radicar.

---

### 8. El cron diario no corrió en absoluto (sin datos nuevos hace días)
**Status:** 🟢 Bajo → 🟡 si pasan varios días
Ver **runbook 18 ([18_sunbiz_turso_cron_falla.md](18_sunbiz_turso_cron_falla.md))** — se separó a un archivo propio por la cantidad de causas distintas que puede tener (Vercel Cron pausado, env vars de Turso faltantes, error silencioso).

---

### 9. Búsqueda devuelve resultados con encoding raro (caracteres extraños)
**Status:** 🟢 Bajo
**Síntoma visible:** Nombres como "Café SoluciÃ³n LLC" en vez de "Café Solución LLC".
**Solución posible:** Turso/SQLite espera UTF-8. Si el archivo diario de Florida vino en otro encoding (Latin-1 es lo más común en archivos de agencias gubernamentales de EE.UU.), el parser del cron (`/api/cron/sunbiz-daily`) necesita convertir explícitamente antes de insertar. Revisar el parseo de bytes del archivo `.txt` descargado del SFTP — si hay bytes fuera de rango ASCII sin decodificar bien, ahí está el bug. Como mitigación puntual: identificar y corregir las filas afectadas a mano vía `turso db shell`.

---

### 10. El buscador de nombres del admin dice "disponible" para todo, o parece no consultar Turso de verdad
**Status:** 🟡 Medio
**Síntoma visible:** El admin sabe que un nombre está tomado (lo vio en sunbiz.org) pero el buscador interno siempre devuelve "disponible" — sin importar qué se busque.
**Solución posible:** `checkNameAvailability()` (`lib/sunbiz-namecheck.ts`) está escrita para **degradar en silencio a `available:true`** si no puede conectarse a Turso (evita romper el flujo de creación de orden por un problema de infraestructura) — esto significa que un `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` faltante o mal cargado no tira error visible, solo hace que TODO parezca disponible. Verificar que ambas variables estén cargadas en **Vercel Y en Railway** (el módulo de Express en Railway también las necesita para el buscador de nombres del admin — confirmado como pendiente de verificar en la auditoría de código de 2026-07-12, revisar si ya se hizo). Sin esas variables, el sistema no rompe, pero deja de proteger contra nombres duplicados — es el modo de fallo más peligroso de este archivo porque es silencioso.
