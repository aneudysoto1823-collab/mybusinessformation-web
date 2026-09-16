# 19 — Backups diarios a Cloudflare R2 no corren

Decisión de arquitectura 2026-06-22: en vez de pagar Supabase Pro ($25/mes) para tener backups automáticos, se armó un pipeline propio con costo $0/mes — **GitHub Actions** corre todos los días, hace `pg_dump` de Supabase y sube el resultado a **Cloudflare R2** (bucket `opabiz-backups`). El workflow vive en `.github/workflows/backup-daily.yml`.

---

### 1. El workflow no corrió hoy
**Status:** 🟡 Medio
**Síntoma visible:** No aparece un archivo con la fecha de hoy en el bucket de R2.
**Solución posible:** Ir a GitHub → el repo → pestaña **Actions** → buscar el workflow "Backup Diario OpaBiz". Si no aparece ninguna ejecución reciente, confirmar que el cron de GitHub Actions (`schedule: cron: '30 4 * * *'`) sigue activo — GitHub a veces **pausa automáticamente** los workflows programados en repos con poca actividad reciente; si pasó eso, hay un botón para reactivarlo en la misma pantalla del workflow. Se puede disparar manualmente con el botón "Run workflow" (`workflow_dispatch` ya está habilitado) para no esperar al día siguiente.

---

### 2. El workflow corrió pero falló
**Status:** 🟡 Medio
**Síntoma visible:** La ejecución en GitHub Actions aparece con una ❌ roja.
**Solución posible:** Abrir la ejecución fallida y leer el log paso por paso — el workflow tiene pasos separados (checkout, setup Node, instalar PostgreSQL client, dump, subida a R2), así que el log dice exactamente en cuál falló. Causas más probables: (1) credenciales de Supabase o R2 vencidas/rotadas — revisar los **GitHub Actions Secrets** del repo (Settings → Secrets and variables → Actions), NO están en Vercel, viven solo ahí; (2) Supabase cambió de versión de Postgres y el cliente `psql` instalado en el runner ya no es compatible — el workflow fija la versión del cliente PostgreSQL a instalar, puede necesitar actualizarse si Supabase migra de versión; (3) el runner se quedó sin espacio en disco si la DB creció mucho — poco probable en el corto plazo dado el tamaño actual.

---

### 3. Dos backups corrieron el mismo día (o se pisaron)
**Status:** 🟢 Bajo
**Síntoma visible:** Hay corridas duplicadas del workflow el mismo día.
**Solución posible:** El workflow ya tiene `concurrency: group: backup-daily, cancel-in-progress: false` configurado específicamente para esto — si el de ayer todavía estaba corriendo, el de hoy espera en cola en vez de correr en paralelo y pisar el mismo dump. Si de todas formas se ven backups duplicados o corrompidos, revisar si alguien disparó `workflow_dispatch` manualmente al mismo tiempo que el cron programado.

---

### 4. Hace falta restaurar un backup real (nunca se probó un restore de punta a punta)
**Status:** 🔴 Crítico si se necesita de verdad, 🟡 si es solo una prueba
**Síntoma visible:** Se perdieron datos reales en Supabase y hay que traerlos de vuelta desde R2.
**Solución posible:** Bajar el dump correspondiente del bucket de R2 (buscar por el timestamp más cercano a antes del incidente). Restaurar con `psql` apuntando a la connection string de Supabase (Dashboard → Settings → Database → Connection string, usar la de conexión directa, no el pooler, para un restore). **Pendiente real (anotado en el checklist de prelanzamiento):** nunca se hizo una prueba de restore completa de punta a punta — antes de confiar en este plan para un incidente real, vale la pena simular uno en un proyecto de Supabase de prueba primero.

---

### 5. Cómo verificar que el bucket de R2 tiene lo que debería
**Status:** 🟢 Bajo (procedimiento, no incidente)
**Procedimiento:** Entrar al dashboard de Cloudflare → R2 → bucket `opabiz-backups` → confirmar que hay un archivo por cada día reciente, con tamaño razonable (no 0 bytes, señal de un dump vacío/corrupto). Revisar también que la lifecycle policy de retención (30 días) está aplicada, para no acumular backups indefinidamente y quedarse sin espacio del free tier de R2 (10GB).
