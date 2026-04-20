# 07 — Panel admin

Problemas con `/admin` (Panel de Administración) y `/login` — autenticación, dashboard, acciones sobre órdenes, subida de documentos.

---

### 1. No puedo loguearme aunque las credenciales son correctas
**Status:** 🔴 Crítico
**Síntoma visible:** En `/login` ingresas usuario y contraseña correctos (verificados con tu password manager), click "Login", y pasa una de estas: (a) recarga la página sin error, (b) muestra "Invalid credentials" cuando NO lo son, (c) login se queda cargando indefinidamente.
**Solución posible:** Verificar primero variables de entorno en Vercel: Settings → Environment Variables → `ADMIN_USER`, `ADMIN_PASSWORD`, `SESSION_SECRET`. Confirmar que existen en ambiente "Production". Si fueron rotadas accidentalmente, restaurar valores correctos. Si están bien pero sigue fallando, abrir DevTools → Network → reproducir login → ver request a `/api/auth/login` — si devuelve 500, ir a Vercel Logs y buscar el error. Causa común: `SESSION_SECRET` cambió y las sesiones viejas no validan — limpiar cookies del navegador (DevTools → Application → Cookies → eliminar `admin_session`) y reintentar.

---

### 2. Logueado pero `/admin` me redirige a `/login` constantemente
**Status:** 🔴 Crítico
**Síntoma visible:** Login exitoso (te redirige a `/admin`), pero al llegar a `/admin` te rebota de vuelta a `/login`. Loop infinito. No puedes operar.
**Solución posible:** Causa típica: cookie `admin_session` no se está seteando correctamente, o el middleware no la está leyendo bien. Verificar en DevTools → Application → Cookies — ver si `admin_session` aparece con dominio correcto. Si no aparece: el SET-COOKIE en el response del login no se aplicó (problemas de SameSite/Secure en producción). Verificar en código `app/api/auth/login/route.ts` que cookie se setea con `secure: true` y `sameSite: 'lax'` para producción HTTPS. Limpiar cookies, reintentar. Si persiste, verificar `SESSION_SECRET` no cambió.

---

### 3. Tabla de órdenes en `/admin` está vacía aunque hay órdenes
**Status:** 🟡 Medio
**Síntoma visible:** `/admin` carga, las 4 tarjetas de estadísticas muestran números (ej: "Total: 47 órdenes"), pero la tabla principal está vacía o muestra "No orders found".
**Solución posible:** Verificar primero si hay filtros activos: tabs "Pending / In Review / Filed / Approved / Completed" — si la tab "All" no muestra nada, problema es de query. Si una tab específica está vacía pero otras tienen, es solo que no hay órdenes en ese estado. Si "All" está vacía, abrir DevTools → Network → buscar request a Supabase o `/api/proxy/orders` — leer la response. Si devuelve `[]` cuando debería tener datos, ir a Supabase Table Editor → tabla `Order` → confirmar que hay rows. Si SÍ hay rows pero el endpoint devuelve vacío, problema de RLS o filtro mal en query — ver `03_base_de_datos.md` punto 9.

---

### 4. Cambio de estado de orden no se guarda
**Status:** 🟡 Medio
**Síntoma visible:** En `/admin/orders/[id]` haces clic en "Mark as Filed" o cambias el dropdown de status. Aparece confirmación pero al recargar la página el status volvió al anterior.
**Solución posible:** Abrir DevTools → Network → repetir la acción → ver request PATCH a `/api/proxy/orders/[id]`. Si devuelve 401: sesión expirada — re-login. Si devuelve 500: ir a Railway logs por el endpoint correspondiente, leer el error. Si devuelve 200 pero no persiste: ir a Supabase Table Editor → buscar la orden → ver si el campo `status` cambió. Si no cambió, problema de Prisma o conexión. Si SÍ cambió en DB pero el panel muestra viejo, es caché del browser — hard refresh (Ctrl+Shift+R).

---

### 5. Botones "Send Names Taken Email" o "Send Certificate" no funcionan
**Status:** 🟡 Medio
**Síntoma visible:** En `/admin/orders/[id]` clickeas el botón de email, aparece spinner por unos segundos, después error "Email failed" o silencio (nada visible). Cliente no recibe el email.
**Solución posible:** Abrir DevTools → Network → reproducir el click → ver request POST a `/api/proxy/notifications/[type]`. Si 500, ir a Railway logs y buscar el error de Resend. Causas frecuentes: (a) `RESEND_API_KEY` faltante en Railway — ver `05_emails_no_envian.md` punto 5. (b) Email del cliente inválido — verificar en Supabase. (c) Cliente con `unsubscribed = true` y trying to send certificate — el sistema debería permitirlo (transaccional crítico) pero verificar lógica en `notifications.service.ts`.

---

### 6. Subida de PDF de Certificate falla
**Status:** 🟡 Medio
**Síntoma visible:** En `/admin/orders/[id]` intentas subir el PDF del Certificate of Formation. El upload se queda colgado o falla con error genérico. El archivo no aparece en la sección de documentos del cliente.
**Solución posible:** Verificar tamaño del PDF — si excede 5MB puede haber límites de Vercel/Supabase Storage. Comprimir PDF antes de subir (usar https://smallpdf.com o similar). Verificar formato — debe ser PDF real, no escaneo de imagen renombrado. En DevTools → Network → ver request POST a `/api/admin/upload-certificate` — si 413 (Payload too large), problema de tamaño. Si 500, ir a Railway/Vercel logs por el error específico de Supabase Storage. Si Supabase Storage está al 100% del free tier, ver `03_base_de_datos.md` punto 5 — upgrade a Pro.

---

### 7. Buscador de órdenes no encuentra órdenes que SÍ existen
**Status:** 🟢 Bajo
**Síntoma visible:** En `/admin` el campo de búsqueda muestra "No results" cuando buscas un email o nombre que claramente existe en las órdenes.
**Solución posible:** Verificar si la búsqueda es case-sensitive por error: probar variaciones del término (mayúsculas, minúsculas, parciales). Si el bug es real, ir al código de filtro en `app/admin/page.tsx` y verificar que usa `.toLowerCase()` para comparación. Como workaround inmediato: usar las tabs de filtro por estado para limitar resultados, después scrollear. O ir directo a Supabase Table Editor para encontrar la orden.

---

### 8. Buscador de nombres alternativos en panel admin no responde
**Status:** 🟡 Medio
**Síntoma visible:** En `/admin/orders/[id]` ingresas nombres alternativos para verificar disponibilidad y el botón "Search" no devuelve nada o tarda mucho. El widget se queda cargando.
**Solución posible:** Mientras Etapa 5 no esté activa, este buscador es mock — verificar que el código devuelve el mock correctamente. Si Etapa 5 sí está activa, ver `06_busqueda_nombres.md`. Si todo lo demás del panel funciona pero solo este componente falla, probable bug específico — abrir DevTools → Network → reproducir → ver request a `/api/proxy/names/check`. Leer error.

---

### 9. Sesión admin expira muy rápido (cada 30 minutos)
**Status:** 🟢 Bajo
**Síntoma visible:** Estabas trabajando en `/admin`, vas a hacer un cambio y te rebota a `/login`. Tienes que loguearte muy seguido durante un día de trabajo.
**Solución posible:** Por defecto las cookies de sesión admin duran 8 horas (configurado con JWT expira 8h). Si expira más rápido, verificar configuración en `lib/session.ts` — el `expiresIn` del JWT. Si está bien pero igual expira, podría ser que el browser está bloqueando cookies. Verificar Settings del navegador. Como mejora futura: implementar refresh token o extender duración a 24h para sesiones de trabajo largas.

---

### 10. Notas internas escritas en una orden desaparecen
**Status:** 🟡 Medio
**Síntoma visible:** Admin escribió notas en `/admin/orders/[id]`, click "Save", confirma "Saved". Al volver a entrar a la orden las notas no aparecen — están vacías.
**Solución posible:** Reproducir el bug: agregar nota nueva, click Save, recargar inmediatamente — si desaparece, el bug es que el PATCH del save no persiste. Ir a Supabase Table Editor → buscar la orden → ver columna `internalNotes` — si está vacía, el save no llegó a la DB. Ir a Vercel Logs y buscar el PATCH para ver el error. Como mitigación inmediata: copiar la nota al portapapeles ANTES de guardar como respaldo. Después de fix, copiar y pegar la nota.
