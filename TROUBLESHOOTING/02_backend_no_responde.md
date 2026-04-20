# 02 — Backend no responde (Express en Railway)

Problemas con el servidor Express alojado en Railway (`mybusinessformation-web-production.up.railway.app`) que expone las APIs internas usadas por el panel admin y los webhooks.

---

### 1. El servicio Railway está apagado
**Status:** 🔴 Crítico
**Síntoma visible:** Cualquier request a `/api/orders`, `/api/notifications`, `/api/payments/webhook` devuelve "503 Service Unavailable" o "Cannot GET /". El panel `/admin` no carga órdenes y muestra "Error fetching orders".
**Solución posible:** Ir a https://railway.com/dashboard → proyecto `mybusinessformation-web` → tab "Deployments". Verificar estado del último deploy. Si dice "Crashed" o "Failed", click sobre él → leer logs. Si dice "Sleeping", click "Wake Up" o disparar nuevo deploy. Si todo está en orden pero no responde, tab "Settings" → "Restart" sobre el servicio. Esperar 30-60 seg para que vuelva online.

---

### 2. Railway agotó el crédito del Hobby plan
**Status:** 🔴 Crítico
**Síntoma visible:** Email de Railway "You've used 100% of your monthly usage". Servicio se apaga automáticamente. Backend deja de responder. Panel admin no funciona, webhooks de Stripe quedan sin procesar.
**Solución posible:** Ir a https://railway.com/dashboard → Settings → "Usage". Verificar consumo del mes. Si excedió los $5 de crédito Hobby: upgrade a Pro $20/mes desde Settings → Plans (incluye $5 de uso, escala según consumo real). Esto restaura el servicio en 2-5 minutos. Como prevención: configurar alerta de uso al 80% en Settings → Notifications.

---

### 3. Webhook de Stripe llega pero backend no lo procesa
**Status:** 🔴 Crítico
**Síntoma visible:** Cliente paga exitosamente en Stripe (cobro confirmado en Stripe dashboard), pero la orden permanece en estado `pending` en `/admin`. No se envía email de confirmación.
**Solución posible:** Ir a https://dashboard.stripe.com → Developers → Webhooks → click sobre el endpoint configurado → tab "Recent deliveries". Buscar el evento más reciente. Si dice "Failed" con código 500, leer el error en "Response body". Ir a Railway logs y buscar el mismo timestamp para ver el stack trace. Causa frecuente: `STRIPE_WEBHOOK_SECRET` faltante o desactualizado en Railway. Para arreglar: copiar Signing Secret de Stripe webhook → pegar en Railway → Settings → Variables → restart service. Después, en Stripe webhook click "Resend" sobre el evento fallido para reprocesar la orden.

---

### 4. Endpoint `/api/orders` devuelve "Internal Server Error" 500
**Status:** 🔴 Crítico
**Síntoma visible:** En el panel admin, la lista de órdenes no carga, aparece "Error loading orders" o spinner infinito. En DevTools → Network, el endpoint devuelve 500.
**Solución posible:** Ir a Railway → Logs en vivo. Filtrar por "error" o "500". Identificar el stack trace. Causas más comunes: (1) Pool de conexiones Supabase saturado — ver síntomas en `03_base_de_datos.md`. (2) Variable `DATABASE_URL` faltante o inválida — ir a Railway Settings → Variables → verificar que existe y apunta al pooler `aws-1-us-east-1` puerto 6543. (3) Prisma migration desincronizada — correr `npx prisma db push` desde local conectado al mismo Supabase. Después restart del servicio Railway.

---

### 5. Backend muy lento (timeouts en /admin)
**Status:** 🟡 Medio
**Síntoma visible:** El panel admin tarda 10+ segundos en cargar. Acciones como "Mark as filed" se quedan girando 30 seg antes de error o éxito. Usuarios reportan lentitud generalizada.
**Solución posible:** Ir a Railway Dashboard → Metrics → revisar CPU/Memory. Si CPU >80% sostenido o Memory >90%, el servicio está bajo presión. Acción inmediata: en Settings → Restart service para liberar memoria. Si persiste, revisar logs por queries lentas a Supabase. Si Supabase es la causa, ver `03_base_de_datos.md`. Como mitigación de fondo: upgrade a Railway Pro para más recursos. Investigar después: queries N+1 en `orders.service.ts`.

---

### 6. Variable de entorno faltante en Railway tras hacer deploy
**Status:** 🟡 Medio
**Síntoma visible:** Después de un push de código nuevo, ciertos endpoints comienzan a fallar con error tipo "Cannot read property of undefined" o "Missing API key". Antes funcionaba.
**Solución posible:** Identificar la nueva variable que agregó el código (revisar el último commit). Ir a Railway → Settings → Variables → verificar si la variable existe. Si no, agregarla con su valor correcto. Variables críticas que deben estar siempre: `DATABASE_URL`, `INTERNAL_API_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`. Después de agregar, Railway re-despliega automáticamente.

---

### 7. CORS bloquea requests del frontend al backend
**Status:** 🟡 Medio
**Síntoma visible:** En DevTools → Console aparece error rojo: "Access to fetch at 'https://...railway.app/...' from origin 'https://mybusinessformation.com' has been blocked by CORS policy". Acciones del panel admin no funcionan.
**Solución posible:** Ir a Railway → Settings → Variables → verificar `ALLOWED_ORIGINS`. Debe incluir TODOS los orígenes que llaman al backend: `https://mybusinessformation.com`, `https://www.mybusinessformation.com`, `https://mybusinessformation-web.vercel.app`, y cualquier preview URL `https://*.vercel.app` que se use para staging. Editar la variable agregando los orígenes faltantes (separados por coma). Restart del servicio.

---

### 8. El backend responde pero retorna datos vacíos o incorrectos
**Status:** 🟡 Medio
**Síntoma visible:** `/api/orders` responde 200 OK pero devuelve `[]` (array vacío) cuando debería tener órdenes. O devuelve datos de otro entorno (production muestra orders de staging).
**Solución posible:** Ir a Railway → Settings → Variables → verificar `DATABASE_URL`. Compararlo con la connection string en Supabase Dashboard → Settings → Database → "Connection string". Si están desincronizadas (apuntando a base equivocada), copiar la correcta y pegarla. Especial atención al sufijo `?pgbouncer=true&connection_limit=1` que debe estar para usar el pooler. Restart del servicio. Verificar que `/api/orders` devuelve datos.

---

### 9. Push a GitHub no dispara deploy en Railway
**Status:** 🟡 Medio
**Síntoma visible:** Hiciste `git push` con un cambio importante, GitHub muestra el commit, pero Railway no muestra deploy nuevo. Backend sigue corriendo código viejo.
**Solución posible:** Ir a Railway → Settings → "Deploy". Verificar que "Deploy on push" está activado y apunta a la branch correcta (normalmente `main`). Si está desconectado, click "Connect to GitHub" → re-autorizar repo. Como workaround inmediato, click "Deploy" manualmente desde Railway dashboard para forzar deploy del último commit.

---

### 10. Healthcheck de Railway falla y se reinicia constantemente
**Status:** 🔴 Crítico
**Síntoma visible:** En Railway Logs ves loops de "Service starting... Service crashed... Service starting...". El backend nunca queda estable. Errores 502/503 al cliente.
**Solución posible:** Ir a Railway logs y leer el error que crashea el servicio en cada inicio. Causas frecuentes: (1) Puerto incorrecto — Railway asigna `PORT` dinámico, el código debe usar `process.env.PORT`, no un puerto hardcoded. Verificar `server.ts` línea de `app.listen()`. (2) Memoria insuficiente al startup — temporalmente reducir conexiones de DB en pool. (3) Healthcheck path mal configurado — Railway → Settings → "Healthcheck path" debe apuntar a un endpoint real como `/api/health` que devuelva 200 OK. Si no existe, crear ese endpoint o desactivar healthcheck temporalmente.
