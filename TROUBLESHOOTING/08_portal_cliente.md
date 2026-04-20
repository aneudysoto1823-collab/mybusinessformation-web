# 08 — Portal del cliente

Problemas con `/client-portal` y `/client-portal/dashboard` — login del cliente, descarga de documentos, datos correctos en pantalla.

---

### 1. Cliente no puede loguearse con email + número de confirmación FBFC
**Status:** 🔴 Crítico
**Síntoma visible:** Cliente reporta que ingresa su email y el número FBFC-XXXXXXXX que recibió por email, click "Access My Order", y aparece "Order not found" o "Unauthorized". Está seguro que los datos son correctos.
**Solución posible:** Pedir al cliente que confirme: (1) Está usando el MISMO email con el que hizo la orden (puede tener varios). (2) El FBFC es exactamente como está en el email (mayúsculas, sin espacios, formato `FBFC-12345678`). (3) No está en navegador con bloqueo de cookies. Si todo OK, ir a `/admin` → buscar la orden → confirmar email + ID. Verificar que el ID empiece con los 8 caracteres del FBFC del cliente (case-insensitive). Si los datos no coinciden, problema de algoritmo del FBFC. Como mitigación: enviar al cliente nuevo email con el FBFC correcto, o crear sesión manual desde `/admin`.

---

### 2. Cliente loguea pero ve datos de OTRA orden
**Status:** 🔴 Crítico (privacidad)
**Síntoma visible:** Cliente reporta "entré a mi cuenta y veo el nombre de otra empresa, dirección que no es mía". Filtración de datos entre clientes — bug grave de seguridad.
**Solución posible:** Acción inmediata: ir a Vercel Dashboard → Logs → buscar el evento de login del cliente → identificar qué orderId se asoció a la cookie. Verificar si la cookie fue compartida o el algoritmo asignó mal. En código `app/api/client-auth/route.ts`, verificar la query: debe filtrar por email Y por id prefix simultáneamente, no devolver el primer match. Como hotfix temporal: invalidar cookie del cliente afectado (eliminar manualmente desde Supabase si está cacheada), pedirle re-loguearse. Después: investigar a fondo el código y subir fix.

---

### 3. Después de loguearse, dashboard muestra "Loading..." infinitamente
**Status:** 🟡 Medio
**Síntoma visible:** Login exitoso, redirige a `/client-portal/dashboard`, pero la página queda en spinner sin cargar contenido. Datos de la empresa, timeline, documentos — nada aparece.
**Solución posible:** Abrir DevTools → Console → ver errores. Network → filtrar por XHR/Fetch → ver requests fallidos. Si el dashboard llama a `/api/orders/[id]` (vía proxy) y falla con 401, problema de cookie no propagada — pedir al cliente cerrar sesión y volver a entrar. Si 500, ir a Railway logs y buscar el error. Si el dashboard es Server Component, verificar Vercel logs en lugar de Railway. Como mitigación: pedir al cliente abrir en navegador incógnito.

---

### 4. Botón "Download PDF" del Certificate no funciona
**Status:** 🟡 Medio
**Síntoma visible:** Cliente ya tiene su orden completada, en el portal aparece sección "My Documents" con el Certificate listado, pero al click "Download PDF" no pasa nada o sale error 404.
**Solución posible:** Ir a Supabase Dashboard → Storage → bucket `certificates` → buscar archivo del cliente (nombre suele ser `<orderId>/certificate.pdf`). Si NO existe el archivo, admin no lo subió aún — ir a `/admin/orders/[id]` y subir el PDF. Si SÍ existe el archivo, verificar permisos del bucket: debe permitir lectura con signed URL. En el código `app/api/documents/[orderId]/route.ts` verificar que genera signed URL válida (60 min). Si la URL se genera pero falla, problema de permisos en el bucket — Storage → Policies → revisar.

---

### 5. Timeline del cliente muestra paso incorrecto
**Status:** 🟢 Bajo
**Síntoma visible:** Cliente dice "el progreso muestra que mi orden está en 'Filed' pero ustedes me dijeron que ya fue Approved". Los pasos del timeline no reflejan estado real.
**Solución posible:** Ir a Supabase Table Editor → buscar la orden → verificar columna `status`. Si dice `approved`, el dashboard debería mostrar el paso "Approved by State" como activo. Si muestra otro paso, hay desfase entre el estado real y el render. Pedir al cliente refrescar la página (Ctrl+Shift+R). Si persiste, hay bug de mapping entre status y timeline en el código `client-portal/dashboard/page.tsx`. Mientras se debugea: explicar al cliente el estado real por email/WhatsApp.

---

### 6. Cliente recibió email de confirmación pero no tiene FBFC visible
**Status:** 🟡 Medio
**Síntoma visible:** Cliente reporta "recibí el email de confirmación pero no veo el número de confirmación FBFC para entrar al portal".
**Solución posible:** Verificar que la plantilla de email "Order Confirmation" en `notifications.service.ts` incluye el FBFC visible y un botón directo "Track Your Order". Si la plantilla no lo tiene, agregarlo. Como mitigación inmediata: ir a `/admin/orders/[id]` → ver el FBFC en la tabla → enviarlo al cliente por email/WhatsApp manualmente. El FBFC se calcula como `FBFC-` + primeros 8 caracteres del UUID de la orden en mayúsculas — visible siempre en `/admin`.

---

### 7. Cliente entra al portal pero no ve la sección "My Documents"
**Status:** 🟢 Bajo
**Síntoma visible:** Cliente loguea correctamente al portal, ve su empresa, ve timeline, pero la sección "My Documents" no aparece o aparece vacía aunque su orden ya está `completed`.
**Solución posible:** Verificar el paquete que compró el cliente — algunos paquetes (Basic) solo dan Certificate, otros (Standard/Premium) incluyen más documentos. Es lógica condicional: si paquete es `basic` solo muestra Certificate. Si el cliente esperaba más por addons (ej: compró EIN como add-on), verificar que `addons.ein = true` en la orden — si no está, el documento no aparece en la lista. Corregir manualmente en Supabase si es necesario y subir el documento desde `/admin`.

---

### 8. Cliente cerró sesión y al volver tiene que re-ingresar todo
**Status:** 🟢 Bajo
**Síntoma visible:** Cliente cerró sesión voluntariamente o por inactividad. Al volver al portal, los campos de email y FBFC están vacíos, debe ingresar manualmente cada vez.
**Solución posible:** Esto es comportamiento esperado por seguridad — no auto-fill de credenciales. Como UX improvement: enviar siempre al cliente el link directo desde email con parámetros pre-llenos: `https://mybusinessformation.com/client-portal?email=cliente@example.com&order=FBFC-12345678` — el código ya soporta esto, verificar que la plantilla de email incluye este link en el botón "Track Your Order".

---

### 9. Cliente reporta que el sitio muestra otro idioma del que esperaba
**Status:** 🟢 Bajo
**Síntoma visible:** Cliente entró al portal en inglés (default), no encuentra cómo cambiar a español, o se cambió a español sin querer y no encuentra cómo volver a inglés.
**Solución posible:** El toggle EN/ES está en el header arriba a la derecha. Pedir al cliente buscar los 2 botones pequeños "EN | ES". El idioma se guarda en localStorage del navegador, así que al cambiar permanece. Si el cliente está en navegador incógnito, no se guarda — cada visita default a EN. Como mejora futura: detectar `navigator.language` y default a ES si el browser está en español.

---

### 10. Cliente no puede ver órdenes anteriores (solo la última)
**Status:** 🟢 Bajo
**Síntoma visible:** Cliente que ha hecho 2-3 órdenes con nosotros (ej: formó LLC en marzo, luego compró DBA en julio) entra al portal con email y solo ve UNA orden en su dashboard.
**Solución posible:** El sistema actual asocia 1 cookie de sesión a 1 orderId específico. Para ver otra orden, debe loguear con email + el FBFC específico de esa otra orden. Mejora futura: implementar dashboard que liste TODAS las órdenes del cliente (multi-order portal). Por ahora, mitigación: explicar al cliente que use el FBFC específico de cada orden para verla. Enviarle por email/WhatsApp los FBFCs de todas sus órdenes.
