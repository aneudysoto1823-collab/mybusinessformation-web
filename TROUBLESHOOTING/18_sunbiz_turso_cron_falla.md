# 18 — Cron diario de Sunbiz (Turso) falla

El cron `/api/cron/sunbiz-daily` corre todos los días en Vercel para mantener la base de Turso (3.5M+ empresas de Florida) al día con las novedades diarias que publica el Estado. Si deja de correr, el buscador de nombres (admin y el chequeo interno al crear una orden) empieza a trabajar con datos cada vez más viejos, sin que nadie lo note de inmediato — es un fallo silencioso por naturaleza.

---

### 1. El cron no corrió ningún día reciente
**Status:** 🟡 Medio → 🔴 si pasa más de una semana
**Síntoma visible:** Consultando Turso, no hay registros nuevos con fecha reciente.
**Solución posible:** Ir a Vercel Dashboard → el proyecto → **Cron Jobs** (no "Deployments") → buscar `/api/cron/sunbiz-daily`. Ver si aparece "Failed" en las últimas ejecuciones o si simplemente no está corriendo. Confirmar que el proyecto sigue en un plan que soporta crons diarios (Pro) y que `backend/vercel.json` sigue teniendo la entrada `"crons": [{ "path": "/api/cron/sunbiz-daily", "schedule": "0 6 * * *" }]`. Si el cron aparece activo pero sin ejecuciones, puede que el deploy más reciente haya roto la ruta — revisar el build log de ese deploy.

---

### 2. El cron corre pero termina en error
**Status:** 🟡 Medio
**Síntoma visible:** La ejecución aparece en Vercel con status de error, o llega el email de alerta que la propia route manda cuando algo falla (vía `RESEND_API_KEY` — si esa variable falta, el error queda solo en logs, sin avisar a nadie).
**Solución posible:** Ver el log completo de la ejecución en Vercel → Functions → `/api/cron/sunbiz-daily`. Causas más comunes: (1) Florida no publicó archivo ese día — el código ya distingue esto como un skip normal (fin de semana/feriado), no debería generar alerta; si SÍ genera alerta en un día hábil, revisar si cambió el patrón de nombre del archivo (`YYYYMMDDc.txt`) o el path (`doc/cor`) en el SFTP; (2) timeout — `maxDuration:300` está configurado en `backend/vercel.json` para esta función, confirmar que el plan de Vercel lo respeta; (3) error de conexión a Turso — revisar que `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` siguen válidas (un token de Turso puede expirar o rotarse manualmente sin querer).

---

### 3. Las credenciales del SFTP de Florida dejaron de funcionar
**Status:** 🟢 Bajo (poco probable, pero posible)
**Síntoma visible:** El error específico menciona "authentication failed" o "connection refused" al conectar a `sftp.floridados.gov`.
**Solución posible:** Las credenciales (`Public` / `PubAccess1845!`) son de acceso público general, documentadas en `CLAUDE.md` — no son nuestras, no las rotamos nosotros. Si Florida las cambió (raro, pero ya pasó alguna vez con sistemas de gobierno), no hay aviso previo. Buscar en foros/comunidades de desarrolladores que también consumen este SFTP (ej. el proyecto hermano `datallc` puede tener información más reciente), o intentar conectarse manualmente con un cliente SFTP (FileZilla, `sftp` CLI) para confirmar si el problema es de credenciales o de otra cosa (firewall, IP bloqueada, etc.).

---

### 4. Turso se quedó sin espacio o alcanzó el límite de filas leídas del plan Free
**Status:** 🟡 Medio
**Síntoma visible:** Los inserts/updates del cron empiezan a fallar, o las búsquedas del sitio se vuelven lentas o devuelven error, pese a que el cron corrió bien.
**Solución posible:** Ir al dashboard de Turso → el proyecto → ver uso de almacenamiento (límite 5GB en Free) y de filas leídas/mes. El dataset de Sunbiz por sí solo no debería acercarse al límite de 5GB, pero si además se está usando la misma DB para otra cosa, revisar qué está consumiendo espacio. Si el límite es de lectura mensual (queries), evaluar si conviene cachear resultados de búsquedas repetidas o si hace falta subir de plan.

---

### 5. Cómo correr el cron manualmente para verificar que funciona
**Status:** 🟢 Bajo (procedimiento, no incidente)
**Procedimiento:** Se puede invocar la ruta manualmente (ej. con `curl` autenticado si la ruta lo requiere, o desde el dashboard de Vercel si permite "Run now" sobre un Cron Job) para confirmar que el problema quedó resuelto sin esperar a la próxima ejecución programada (6am UTC). Revisar el log de esa ejecución puntual antes de dar el incidente por cerrado.
