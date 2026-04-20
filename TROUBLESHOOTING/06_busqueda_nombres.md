# 06 — Búsqueda de nombres (Sunbiz Florida)

Problemas con la verificación automatizada de disponibilidad de nombres contra la base de datos local de Sunbiz (Etapa 5). Mientras Etapa 5 no esté lista, la verificación es manual desde sunbiz.org.

---

### 1. Búsqueda de nombre devuelve "no disponible" cuando SÍ está disponible
**Status:** 🟡 Medio
**Síntoma visible:** Cliente envía un nombre que verificas manualmente en sunbiz.org y NO existe, pero nuestro buscador local del panel admin lo marca como "Taken". Inconsistencia entre nuestra DB y la oficial de Florida.
**Solución posible:** Causa #1: nuestra base local está desactualizada. Ir a Supabase → tabla `sunbiz_corps` → ver `last_updated` o cuándo fue el último import. Si pasó más de 90 días desde el último update, descargar el dump trimestral nuevo de Florida vía FTP y re-importar. Como mitigación: confiar siempre en sunbiz.org oficial cuando hay duda — nuestra DB es ayuda, NO autoridad. Para esa orden específica, marcar manualmente como nombre disponible y proceder.

---

### 2. Búsqueda de nombre devuelve "disponible" pero al filing en Sunbiz lo rechaza
**Status:** 🔴 Crítico
**Síntoma visible:** Sistema marcó nombre como disponible, admin envió Articles of Organization a Sunbiz, Florida rechaza el filing diciendo "name not available — too similar to existing entity".
**Solución posible:** Causa: nuestra búsqueda hace match exacto, pero Sunbiz aplica reglas de "similaridad fonética" más estrictas. Acción: comunicarse con cliente inmediatamente, explicar el rechazo, pedir nombre alternativo. Verificar el alternativo MANUALMENTE en sunbiz.org incluyendo similitudes (ej: "Tech Solutions LLC" vs "Tech Solutions Co.") antes de re-enviar. Documentar el caso para mejorar la búsqueda futura — agregar regla de fuzzy matching usando trigram similarity.

---

### 3. La descarga FTP del dump trimestral de Florida falla
**Status:** 🟡 Medio
**Síntoma visible:** Cron job nocturno o trimestral que descarga el dump de Sunbiz falla. Logs muestran "FTP connection refused" o "Authentication failed" al intentar conectar al servidor de Florida.
**Solución posible:** Verificar credenciales FTP en variables de entorno Railway: `SUNBIZ_FTP_HOST`, `SUNBIZ_FTP_USER`, `SUNBIZ_FTP_PASS`. Florida puede haber rotado credenciales — buscar email reciente de Sunbiz con nuevas credenciales. Probar conexión manual desde local con FileZilla o `ftp` command. Si Florida cambió el path del archivo, actualizar el script con el path nuevo. Mientras se arregla: descargar manualmente y subir a Supabase como import puntual.

---

### 4. Import del dump (3.5M registros) tarda demasiado o falla
**Status:** 🟡 Medio
**Síntoma visible:** Script de import de Sunbiz a Supabase corre por horas y eventualmente falla por timeout o memoria. La base local queda parcialmente actualizada o vacía.
**Solución posible:** Verificar que el import usa batches (1000-5000 registros por batch, no todos a la vez). Si se hace fila por fila, será lento. En Supabase Dashboard → Reports verificar uso de DB durante import — si CPU al 100% es esperado pero memoria saturada significa batches muy grandes. Reducir batch size. Si Supabase free tier es el cuello de botella (250MB RAM límite), upgrade a Pro temporalmente. Como mitigación: hacer import en horario nocturno (3am EST) cuando hay menos tráfico operativo.

---

### 5. Búsqueda local muy lenta (>5 segundos)
**Status:** 🟡 Medio
**Síntoma visible:** En `/admin/orders/[id]` al usar el buscador de nombres alternativos, cada búsqueda tarda más de 5 segundos. Admin no puede trabajar con eficiencia.
**Solución posible:** Ir a Supabase Dashboard → Database → Indexes → tabla `sunbiz_corps`. Verificar que existe índice GIN trigram sobre la columna del nombre: `CREATE INDEX corps_name_trgm_idx ON sunbiz_corps USING gin (corp_name gin_trgm_ops);`. Si no existe, crearlo. Si existe pero sigue lento, en Supabase → Query Performance ver el `EXPLAIN ANALYZE` de la query lenta — verificar que usa el índice (debe decir "Bitmap Heap Scan"). Si no usa el índice, ajustar la query.

---

### 6. Sunbiz oficial (sunbiz.org) está caído
**Status:** 🔴 Crítico (durante este tiempo no se pueden hacer filings)
**Síntoma visible:** sunbiz.org no carga, devuelve error o está en mantenimiento. Admin no puede enviar Articles of Organization para nuevas órdenes ni verificar nombres manualmente.
**Solución posible:** Verificar status oficial en https://dos.fl.gov o redes sociales de Florida Department of State. Si confirmado downtime: no hay solución upstream. Acciones: (1) Acumular órdenes en estado `ready_to_file` mientras se resuelve. (2) Comunicar a clientes activos con expectativa realista de delay. (3) Una vez restaurado, procesar órdenes acumuladas en orden de antigüedad. (4) Documentar el incidente para tener métricas de uptime de Sunbiz histórico.

---

### 7. Cliente envía 3 nombres y los 3 están tomados
**Status:** 🟡 Medio (operativo, no técnico)
**Síntoma visible:** Después de búsqueda en Sunbiz, los 3 nombres propuestos por el cliente ya están registrados. La orden queda bloqueada en `in_review`. Cliente debe enviar nuevos nombres.
**Solución posible:** Esto es flujo normal de negocio, no bug. Acción: en `/admin/orders/[id]` usar el botón "Send 'Names Taken' Email" — esto dispara automáticamente el email al cliente pidiendo nuevas opciones, y alerta al admin. Cuando cliente responda con nuevos nombres por email/WhatsApp, actualizar manualmente los 3 campos `companyName`, `companyName2`, `companyName3` en la orden desde el panel. Volver a verificar.

---

### 8. Cron de actualización nocturna no se ejecuta
**Status:** 🟢 Bajo
**Síntoma visible:** Pasaron varios días y la tabla `sunbiz_corps` no tiene registros nuevos. El cron debería correr cada noche pero el `last_updated` no avanza.
**Solución posible:** Si usamos Vercel Cron Jobs: ir a Vercel Dashboard → Cron Jobs → verificar que el job está activo y revisar últimas ejecuciones. Si dice "Failed", click sobre la ejecución para ver error. Si usamos Railway Cron: Railway Dashboard → Cron → mismo proceso. Causa frecuente: timeout (Vercel Cron tiene límite 10s en Hobby, 60s en Pro). Si el job es muy largo, dividir en pasos o pasar a un worker separado. Como workaround: ejecutar manualmente el script desde local.

---

### 9. Búsqueda devuelve resultados extraños (caracteres raros, encoding)
**Status:** 🟢 Bajo
**Síntoma visible:** Resultados de búsqueda muestran nombres con caracteres extraños tipo "Café SoluciÃ³n LLC" en lugar de "Café Solución LLC". Encoding UTF-8 mal interpretado.
**Solución posible:** Ir a Supabase → SQL Editor → query muestra: `SELECT corp_name FROM sunbiz_corps WHERE corp_name LIKE '%Caf%' LIMIT 5`. Si los datos en DB están mal encoded, el problema es del import (Florida envía LATIN1 o similar, hay que convertir a UTF-8 al importar). Re-importar el dump con encoding correcto. Como workaround inmediato: limpiar registros afectados con script de migración encoding.

---

### 10. Etapa 5 NO está lista al lanzamiento — verificación 100% manual
**Status:** 🟡 Medio (escalado a 🔴 si no hay capacidad operativa)
**Síntoma visible:** Sistema en producción procesando órdenes, pero como Etapa 5 (búsqueda automatizada) no está implementada, cada nombre debe verificarse manualmente en sunbiz.org. Esto consume tiempo del admin y limita escalabilidad.
**Solución posible:** Plan de operación manual: (1) En `/admin` → orden con status `in_review`, abrir nueva pestaña con sunbiz.org → buscar `companyName`, luego `companyName2`, luego `companyName3`. (2) Marcar manualmente en notas internas qué nombre está disponible. (3) Si ninguno disponible, click botón "Send Names Taken Email". (4) Si alguno disponible, cambiar status a `ready_to_file` y proceder con filing. Capacidad estimada manual: ~10 órdenes/día por admin sin saturación. Si volumen excede, contratar VA con training específico O priorizar Etapa 5 inmediatamente.
