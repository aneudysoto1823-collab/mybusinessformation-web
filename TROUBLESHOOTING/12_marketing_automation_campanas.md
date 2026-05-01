# Troubleshooting — Sistema de Marketing Automation

## 1. El email no se envía

**Síntoma:** El botón "Send Email" no hace nada o devuelve error.

**Causas y soluciones:**
- La empresa no tiene email registrado → el sistema la salta (`skipped: no email`). Agregar email manualmente desde el panel.
- `RESEND_API_KEY` no configurada en Vercel → agregar en Environment Variables.
- Dominio `mybusinessformation.com` no verificado en Resend → solo puede enviar a emails propios hasta verificar el dominio.

---

## 2. El QR no redirige correctamente

**Síntoma:** El cliente escanea el QR y llega a una página de error o al home.

**Causas y soluciones:**
- El `document_id` o `company_id` en la URL están vacíos o malformados → verificar que la empresa tiene `document_id` en la tabla.
- La ruta `/api/campaigns/track-scan` lanzó error → revisar logs de Vercel en Functions tab.

---

## 3. La landing page `/new-business` no encuentra la empresa

**Síntoma:** El cliente llega a `/new-business?id=...` pero aparece el campo de búsqueda vacío o "not found".

**Causas y soluciones:**
- La empresa no está en `prospective_companies` y Sunbiz no la encontró → verificar el `document_id` en sunbiz.org manualmente.
- Sunbiz está caído o lento (timeout 10s) → el cliente puede reintentar. Es un servicio externo fuera de nuestro control.
- El `?id=` en la URL está URL-encoded incorrectamente → verificar que `document_id` no tiene caracteres especiales.

---

## 4. El pago se completa pero no se crea la Order

**Síntoma:** El cliente pagó en Stripe pero no recibe email con FBFC y no puede entrar al portal.

**Causas y soluciones:**
- `STRIPE_WEBHOOK_SECRET` no configurado en Vercel → la firma del webhook falla y el handler la rechaza.
- El webhook no está registrado en Stripe → ir a dashboard.stripe.com → Webhooks → agregar endpoint `https://mybusinessformation.com/api/webhooks/stripe` con evento `checkout.session.completed`.
- El cliente no ingresó su email en Stripe checkout → sin email no se puede crear la Order. Stripe debería pedirlo automáticamente.
- Verificar en Supabase → tabla `Order` si el registro existe. Si no existe, revisar logs de Vercel en la ruta `/api/webhooks/stripe`.

---

## 5. El cliente no puede entrar al Portal de Clientes después de pagar

**Síntoma:** El cliente tiene su número FBFC pero el login dice "Invalid credentials".

**Causas y soluciones:**
- El email que ingresa en el portal no coincide con el email que usó en Stripe → deben ser exactamente iguales (case-insensitive).
- La Order no fue creada (ver problema 4 arriba).
- Verificar en Supabase → tabla `Order` → buscar por email → confirmar que el campo `id` empieza con los 8 caracteres del FBFC.

---

## 6. El build de Vercel falla con error de Stripe o Resend

**Síntoma:** Deploy en rojo con `Neither apiKey nor config.authenticator provided` o `Missing API key`.

**Causa:** Stripe o Resend se están instanciando a nivel de módulo (fuera de la función handler). Durante el build las env vars no existen.

**Solución:** Los SDKs deben instanciarse dentro de una función `getStripe()` / `getResend()`, no como constantes globales. Nunca usar `const stripe = new Stripe(...)` a nivel de módulo.

---

## 7. Las stats del dashboard muestran cero aunque hay datos

**Síntoma:** Las tarjetas de stats en `/admin/campaigns` muestran 0 en todo.

**Causas y soluciones:**
- Las tablas Supabase no fueron creadas → ejecutar el SQL de creación en el SQL Editor de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` no configurada → el cliente admin no puede acceder a las tablas.
- Verificar con "List Public Tables" en Supabase que existen: `prospective_companies`, `email_campaigns`, `qr_scans`, `conversions`.
