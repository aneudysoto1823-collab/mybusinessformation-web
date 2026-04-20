# 01 — Sitio caído (Frontend Vercel)

Problemas relacionados con `mybusinessformation.com` o `mybusinessformation-web.vercel.app` cuando el sitio público no carga, da error o se comporta raro.

---

### 1. El sitio devuelve "404 Not Found" en todas las rutas
**Status:** 🔴 Crítico
**Síntoma visible:** Cualquier URL del sitio muestra "404 — This page could not be found", incluyendo el home.
**Solución posible:** Ir a https://vercel.com/dashboard → proyecto `mybusinessformation-web` → tab "Deployments". Verificar que el último deploy aparezca como **"Ready"**. Si está en "Error" o "Failed", click sobre él → leer Build Logs → identificar el error. Si el último deploy es viejo y no corresponde al último commit, hacer click en "Redeploy" sobre el último commit conocido bueno.

---

### 2. El sitio devuelve "500 Internal Server Error"
**Status:** 🔴 Crítico
**Síntoma visible:** Pantalla blanca con texto "500 — Internal Server Error" o "Application error: a server-side exception has occurred".
**Solución posible:** Ir a https://vercel.com/dashboard → proyecto → tab "Logs" (Real-time Logs). Filtrar por "Error". Identificar la línea del error. Si es por variable de entorno faltante, ir a "Settings → Environment Variables" y verificar que estén configuradas las críticas: `BACKEND_URL`, `INTERNAL_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `SESSION_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`. Agregar la faltante y hacer Redeploy.

---

### 3. Build/Deploy falla en Vercel después de un push
**Status:** 🔴 Crítico
**Síntoma visible:** En Vercel Deployments aparece un deploy con estado rojo "Failed" o "Error". El sitio sigue mostrando la versión anterior (no se actualiza con el último commit).
**Solución posible:** Click en el deploy fallido → ver "Build Logs". Buscar la línea con `Type error:` o `error TS`. Reproducir local: dentro de `backend/` correr `npm run build` y arreglar el error. Si el error es por una dependencia faltante, correr `npm install <paquete>` dentro de `backend/`. Commit + push. Verificar que el nuevo deploy pasa a "Ready". Mientras tanto, el sitio NO se actualiza pero sigue funcionando con la versión anterior.

---

### 4. Sitio carga pero CSS/imágenes no aplican (se ve sin estilos)
**Status:** 🟡 Medio
**Síntoma visible:** El sitio carga pero se ve "roto" — sin colores de marca, sin layout, fuentes default del navegador. Como ver el HTML crudo.
**Solución posible:** Abrir DevTools del navegador (F12) → tab "Network" → recargar página → buscar archivos en rojo (404). Si son archivos `_next/static/...`, esto suele indicar caché vieja. Acción: forzar refresh con `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac). Si persiste, en Vercel ir al último deploy → "..." → "Redeploy" sin caché. Verificar que el sitio recupera los estilos.

---

### 5. Sitio carga muy lento (>10 segundos)
**Status:** 🟡 Medio
**Síntoma visible:** Páginas tardan más de 10 segundos en aparecer. Usuarios abandonan antes de cargar. En Vercel Analytics se ve aumento drástico de "Time to First Byte".
**Solución posible:** Ir a https://www.vercel-status.com — verificar si Vercel tiene incidente activo en USA-East. Si Vercel está OK, ir a https://status.supabase.com — verificar Supabase. Si ambos OK, ir a Vercel Dashboard → Logs → buscar requests con duración > 5000ms — identificar qué endpoint es lento. Si es `/admin` o algo que llama a Railway, revisar Railway. Para mitigar inmediato: reportar estado del sitio en `/status` (futuro) y publicar aviso en redes sociales si afecta clientes.

---

### 6. "Application error: a client-side exception has occurred"
**Status:** 🟡 Medio
**Síntoma visible:** El sitio carga el header pero al renderizar contenido principal aparece este mensaje genérico de Next.js. Pasa especialmente al cambiar idioma EN/ES o al hacer clic en algunos botones.
**Solución posible:** Abrir DevTools del navegador (F12) → tab "Console". Buscar el error en rojo (suele decir `TypeError: cannot read property...` o `undefined is not a function`). Tomar screenshot del error. Ir a Vercel Dashboard → Logs → buscar el mismo error en logs server-side. Reproducir local con `npm run dev` dentro de `backend/`. Identificar la línea del archivo. Hacer fix, commit, push. Vercel redespliega automáticamente.

---

### 7. Sitio caído por exceder límite de bandwidth o build minutes
**Status:** 🔴 Crítico
**Síntoma visible:** Vercel muestra banner amarillo o rojo "Hobby Plan limit exceeded". Sitio puede mostrar página de "Service Unavailable" o lentitud severa.
**Solución posible:** Ir a https://vercel.com/dashboard → Settings → "Usage". Identificar qué métrica se excedió: Bandwidth (100GB/mes Hobby), Build Minutes (6000/mes), Function Invocations (100K). Acción inmediata: upgrade a Pro $20/mes desde Settings → Plans. Esto restaura el servicio en minutos. Como prevención: configurar alerta de uso al 80% en Settings → Notifications.

---

### 8. Después de un Pull Request merge el sitio funciona MAL
**Status:** 🟡 Medio
**Síntoma visible:** El último commit pasó el build (verde en Vercel), el sitio carga, pero alguna funcionalidad específica está rota (ej: formulario no envía, botón no responde, link va a 404).
**Solución posible:** Ir a Vercel Deployments → identificar el deploy del commit ANTERIOR al que rompió. Click en los 3 puntos "..." → "Promote to Production". Esto regresa el sitio a la versión que funcionaba mientras se debugea. Después, en local, hacer `git revert <commit-hash>` del commit problemático, push. O hacer fix y push nuevamente.

---

### 9. Páginas dinámicas (`/admin/orders/[id]`) no cargan
**Status:** 🟡 Medio
**Síntoma visible:** Rutas estáticas como `/`, `/paquetes`, `/servicios` cargan bien pero al entrar a una orden específica `/admin/orders/abc123` sale 404 o 500.
**Solución posible:** Verificar primero si el problema es de autenticación: probar en navegador incógnito → ir a `/login`, loguearse y luego intentar la ruta. Si funciona, era cookie expirada. Si no funciona, ir a Vercel Logs → filtrar por la URL específica → leer el error. Frecuentemente es porque el orderId no existe en la DB o hay un timeout al consultar Railway. Revisar Railway logs en paralelo.

---

### 10. Sitio carga pero el formulario de orden no se envía
**Status:** 🔴 Crítico
**Síntoma visible:** Cliente llena el formulario, hace clic en "Submit Order" y el botón se queda cargando indefinidamente o muestra error genérico. La orden NO aparece en `/admin`.
**Solución posible:** Verificar 3 cosas en orden: (1) DevTools del navegador → Console → buscar error de CORS o 500 al hacer POST. Si CORS, ir a Railway → variable `ALLOWED_ORIGINS` y verificar que incluye `https://mybusinessformation.com`. (2) Si es 500, ir a Railway → Logs en vivo → identificar el error en `/api/orders`. (3) Si es timeout, verificar https://status.supabase.com — si Supabase está down, esperar resolución upstream. Como mitigación, publicar aviso en sitio "Estamos teniendo problemas técnicos, intenta en 15 min".
