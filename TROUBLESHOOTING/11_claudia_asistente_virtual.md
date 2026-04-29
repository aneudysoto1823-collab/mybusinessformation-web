# Proceso 11 — Troubleshooting

## Claudia — Asistente Virtual

---

### ❌ Claudia no aparece en el sitio

**Síntomas:** El botón flotante no se ve en ninguna página.

**Causas posibles y solución:**
1. **El componente no está importado en esa página** — verificar que la página tenga `import ChatWidget from '@/components/ChatWidget'` y `<ChatWidget />` en el return.
2. **Z-index insuficiente** — el widget usa `z-index: 9999`. Si algún overlay del sitio tiene un z-index mayor, lo tapa. Verificar en DevTools qué elemento está encima.
3. **Error de build en Vercel** — revisar el log de deployment en Vercel. Si el build falló, el sitio sigue corriendo la versión anterior.

---

### ❌ Claudia no aparece dentro del formulario de formación

**Síntomas:** El botón de Claudia desaparece cuando el cliente abre el overlay del formulario.

**Causa:** El overlay del formulario tiene un z-index alto que cubre el widget.  
**Solución:** El widget ya está en `z-index: 9999` (tanto el botón flotante como la ventana de chat). Si vuelve a ocurrir, buscar en `page.tsx` el elemento `.form-overlay` o `#formOverlay` y verificar que su z-index sea menor a 9999. Si no, subir el widget a `z-index: 10000`.

---

### ❌ Error 500 al enviar un mensaje

**Síntomas:** El chat muestra "No se pudo obtener respuesta" o el network tab devuelve HTTP 500.

**Causas posibles:**
1. **`ANTHROPIC_API_KEY` no configurada o inválida** — ir a Vercel → Settings → Environment Variables y verificar que `ANTHROPIC_API_KEY` existe y está activa. Crear una nueva en [console.anthropic.com](https://console.anthropic.com) si es necesario.
2. **Modelo inválido** — el modelo configurado en `route.ts` debe ser `claude-sonnet-4-6`. Verificar que no haya un ID de modelo incorrecto.
3. **`SUPABASE_SERVICE_ROLE_KEY` faltante** — necesaria para `create_form_session` y `get_order_info`. Sin ella, esos tools fallan con 500.
4. **Variable en el Vercel equivocado** — las variables deben estar en el Vercel del socio (el que hace el deploy), no en el Vercel del dueño del repo.

**Diagnóstico rápido:** Abrir DevTools → Network → mensaje enviado a `/api/chat` → ver el cuerpo de la respuesta. Debe haber un campo `detail` con el mensaje de error específico.

---

### ❌ Claudia da precios incorrectos

**Síntomas:** Le dice al cliente un precio que no coincide con lo que ve en el sitio.

**Causa:** El system prompt en `backend/app/api/chat/route.ts` no fue actualizado cuando se cambiaron los precios del sitio.  
**Solución:** Actualizar la sección `FORMATION PACKAGES` en el system prompt con los precios actuales del sitio (`page.tsx`). Los precios actuales son Basic $0, Standard $199, Premium $299 (+ cargo estatal de Florida).

**Prevención:** Cada vez que se cambien precios en `page.tsx`, actualizar también el system prompt de Claudia en `route.ts`.

---

### ❌ Claudia hace más de una pregunta a la vez

**Síntomas:** En un solo mensaje Claudia hace dos preguntas seguidas.

**Causa:** El modelo a veces ignora la instrucción si no está en posición dominante en el prompt.  
**Solución actual:** La regla `ABSOLUTE RULE` está al principio del system prompt. Si persiste, hacerla aún más prominente o reducir el `max_tokens` a 512 para forzar respuestas más cortas.

---

### ❌ El input del chat pierde el foco

**Síntomas:** Después de que Claudia responde, el cliente tiene que hacer click en el campo de texto para poder seguir escribiendo.

**Causa:** El foco no se restablece automáticamente tras recibir una respuesta.  
**Solución:** En `ChatWidget.tsx`, el `useEffect` que maneja scroll después de mensajes incluye `setTimeout(() => inputRef.current?.focus(), 50)` al recibir un mensaje de Claudia. Si el problema reaparece, verificar que ese `setTimeout` siga presente y que el `inputRef` esté asignado al `<input>`.

---

### ❌ Claudia no lee el contexto del formulario (nombre, paso, negocio)

**Síntomas:** Claudia no saluda por nombre aunque el cliente ya lo escribió en el formulario, o no sabe en qué paso está.

**Causas posibles:**
1. **IDs del formulario cambiaron** — `readFormContext()` en `ChatWidget.tsx` busca elementos por ID: `#inp-fname`, `#inp-lname`, `#inp-bizname`, `#inp-email`, `#fp-pct`. Si algún ID cambió en el HTML del formulario, la lectura devuelve vacío.
2. **El formulario no está visible en el DOM** — `readFormContext()` se ejecuta al abrir el chat. Si el formulario no estaba abierto aún, los campos no existen en el DOM todavía.
3. **`localStorage('flbc_lang')` no se guarda** — el idioma se lee de `localStorage`. Si el toggle de idioma no lo está guardando correctamente, Claudia no detecta el idioma del sitio.

**Diagnóstico:** Abrir DevTools → Console → ejecutar `document.getElementById('inp-fname')?.value` y `localStorage.getItem('flbc_lang')` para verificar que los valores están disponibles.

---

### ❌ La búsqueda de nombres no funciona

**Síntomas:** Claudia dice "no pude conectar con la base de datos del estado" o da un resultado incorrecto.

**Causas posibles:**
1. **Sunbiz bloqueó el request** — el servidor de Sunbiz puede bloquear requests automáticos. El timeout está configurado en 10 segundos. Si falla, Claudia le informa al cliente e invita a intentar de nuevo.
2. **El HTML de Sunbiz cambió** — el parser en `checkNameAvailability()` busca patrones específicos en el HTML. Si Sunbiz cambia su estructura, la lógica de detección puede fallar. Revisar `backend/app/api/chat/route.ts` → función `checkNameAvailability`.

---

### ❌ El tool `get_order_info` no encuentra la orden

**Síntomas:** Claudia dice que la orden no fue encontrada aunque el número es correcto.

**Causas posibles:**
1. **Formato incorrecto del número** — el número debe ser `FBFC-XXXXXXXX` (8 caracteres después del guión). El tool extrae el prefijo del UUID de la tabla `Order`.
2. **La tabla se llama diferente** — el query busca en la tabla `Order` (mayúscula). Si Supabase cambió el nombre de la tabla, actualizar el query en `getOrderInfo()`.
3. **`SUPABASE_SERVICE_ROLE_KEY` sin permisos** — la service role key debe tener acceso de lectura a la tabla `Order`. Verificar en Supabase → Authentication → Policies.

---

### ❌ El deployment automático no se activa

**Síntomas:** Se hace push a `main` pero Vercel no despliega la nueva versión.

**Causas posibles:**
1. **Push fue al repo del dueño, no al del socio** — Vercel está conectado al repo `aneudysoto1823-collab/mybusinessformation-web`. Verificar que el remote `origin` apunte a ese repo: `git remote -v`.
2. **Build falló en Vercel** — ir a Vercel → Deployments → ver el log del último intento fallido.
3. **Vercel no está conectado al repo** — revisar en Vercel → Settings → Git que el repositorio correcto esté vinculado y que la rama `main` esté configurada como rama de producción.

**Verificación rápida:** Después de cada push, esperar 2–3 minutos y verificar en Vercel que aparece un nuevo deployment en progreso.
