# 05 — Emails no se envían (Resend)

Problemas con el sistema de emails: emails no llegan, van a spam, dominio no verificado, bounces altos o rate limits.

---

### 1. Email de confirmación nunca llega al cliente
**Status:** 🔴 Crítico
**Síntoma visible:** Cliente paga, orden aparece como `paid` en `/admin`, pero cliente reporta "no me llegó email". Pasaron más de 10 minutos.
**Solución posible:** Primer paso: pedir al cliente revisar carpeta SPAM/Promociones (causa más común). Si no está ahí, ir a https://resend.com/emails → buscar email del cliente en la lista. Si aparece como "delivered" pero cliente dice no recibirlo, es spam filter del cliente — usar `Resend` botón "Resend" para reenviar. Si NO aparece en Resend en absoluto: el código no llegó a llamar al `send()`. Ir a Railway logs → buscar timestamp del pago → ver si hay error en `notifications.service.ts` → `sendOrderConfirmation()`. Mitigación: enviar email manualmente al cliente desde Gmail con datos de la orden.

---

### 2. Emails caen en spam masivamente (todos los clientes reportan)
**Status:** 🔴 Crítico
**Síntoma visible:** Múltiples clientes reportan en mismo período que el email cae en spam. Bounces visibles en Resend Dashboard >5%.
**Solución posible:** Causa #1: dominio NO verificado en Resend (estamos enviando desde `onboarding@resend.dev` que tiene reputation neutra). Solución urgente: ir a https://resend.com/domains → "Add Domain" → `mybusinessformation.com` → seguir instrucciones DNS. Agregar registros SPF, DKIM, DMARC en el proveedor de DNS (Cloudflare/Namecheap/GoDaddy). Esperar verificación (~30 min). Cambiar `FROM_EMAIL` en variables de entorno Railway a `noreply@mybusinessformation.com`. Después de cambio, deliverability sube del ~60% al ~95%+.

---

### 3. Rate limit de Resend hit (free tier 100/día)
**Status:** 🟡 Medio
**Síntoma visible:** Después de cierto volumen de emails en el día, los siguientes empiezan a fallar con error "Rate limit exceeded — 100 emails per day". Esto pasa especialmente si hay drip campaign de waitlist activa.
**Solución posible:** Ir a https://resend.com/billing → upgrade a Pro $20/mes (50,000 emails/mes, suficiente para waitlist + transaccionales). Activación inmediata. Si necesitas mitigación instantánea sin upgrade, las funciones críticas (orden, confirmación) usan `sendOrderConfirmation` que es transaccional — esos siguen pasando. Los emails de marketing (drip nurture) se pueden pausar temporalmente.

---

### 4. Resend está caído (status page rojo)
**Status:** 🟡 Medio
**Síntoma visible:** Múltiples emails fallan con error "Service temporarily unavailable". En Railway logs aparecen errores de Resend repetidos.
**Solución posible:** Ir a https://resend-status.com — verificar incidente activo. Si confirmado: no hay solución upstream, los emails se acumulan en cola del backend. Acción: (1) Suscribirse a updates del incidente. (2) En Railway logs identificar emails que fallaron — guardar lista de destinatarios para reenvío manual cuando Resend se restaure. (3) Para órdenes nuevas durante el outage, enviar email de confirmación manual desde Gmail con datos copy-paste. (4) Después de restauración, masivamente reenviar los pendientes desde `/admin` con botones de email.

---

### 5. API key de Resend revocada o inválida
**Status:** 🔴 Crítico
**Síntoma visible:** TODOS los emails empiezan a fallar simultáneamente con error "Invalid API key" o "Unauthorized". Ningún email sale.
**Solución posible:** Ir a https://resend.com/api-keys → verificar que la key activa coincide con la guardada en Railway. Si fue rotada o eliminada: crear nueva API key (botón "Create API Key" → permission "Sending access"). Copiar la nueva. Ir a Railway → Settings → Variables → `RESEND_API_KEY` → pegar valor nuevo. Restart del servicio. Verificar que un email de prueba sale OK desde `/admin` (botón "Send test email" si existe, o disparar manualmente un email de Certificate sobre orden de testing).

---

### 6. Dominio mybusinessformation.com no se verifica en Resend
**Status:** 🟡 Medio
**Síntoma visible:** Agregaste el dominio en Resend hace >24h y sigue marcado como "Not verified" o "Pending". Los emails siguen saliendo desde `onboarding@resend.dev`.
**Solución posible:** Ir a https://resend.com/domains → click sobre `mybusinessformation.com` → ver "Required DNS records". Comparar con lo que está en el DNS provider real (Cloudflare/Namecheap/GoDaddy). Verificar que se agregaron EXACTAMENTE como Resend lo pidió: SPF (`TXT v=spf1 include:_spf.resend.com ~all`), DKIM (record largo único de Resend), DMARC (`TXT v=DMARC1; p=none;`). Si están bien, esperar más (DNS puede tardar hasta 48h en propagar). Para verificar propagación: usar https://dnschecker.org → query del registro TXT desde múltiples regiones. Si se ve correcto en dnschecker, en Resend click "Verify Domain" para forzar re-check.

---

### 7. Bounce rate alto (>5%) — emails rebotan
**Status:** 🟡 Medio
**Síntoma visible:** En Resend Dashboard la tasa de "Bounced" está sobre 5%. Emails enviados a clientes específicos rebotan con error "Mailbox unavailable" o "Address does not exist".
**Solución posible:** Ir a Resend → Logs → filtrar por "Bounced". Identificar patrones: ¿son emails típicos como `cliente@hotmail.com` mal escritos? Mejorar validación de email en el formulario de orden — usar regex más estricto y/o servicio de validación (`emailable.com` o `kickbox.io`). Para emails que rebotan ya en sistema: marcar `unsubscribed = true` en Supabase Order para esos emails (no más sends). Bounce alto sostenido daña la reputation — limpiar lista activamente.

---

### 8. Cliente dice "el email tiene mi nombre mal" o datos incorrectos
**Status:** 🟢 Bajo
**Síntoma visible:** Cliente recibe email de confirmación pero el saludo dice "Hola undefined" o muestra otra orden, o nombre del negocio es incorrecto.
**Solución posible:** Ir a Resend → Logs → buscar el email enviado al cliente → click "View email" → ver HTML enviado. Si aparece `undefined` o `null`, el código tiene un bug de variable no definida. Ir al template de email correspondiente en `notifications.service.ts` y ver qué campo se está usando. Verificar en Supabase que la orden tiene los datos. Si los datos están en DB pero el template falla, el bug es de template — fix y push. Reenviar email correcto al cliente manualmente.

---

### 9. Webhook de Resend para tracking no funciona
**Status:** 🟢 Bajo
**Síntoma visible:** En el panel admin no se actualiza el estado del email (delivered, opened, clicked). No sabemos si el cliente abrió el email.
**Solución posible:** Esto es feature secundaria, no bloqueante. Ir a https://resend.com/webhooks → verificar que el webhook está configurado apuntando a `/api/webhooks/resend` (si existe el endpoint en el backend). Si no existe el endpoint, crear uno simple que recibe eventos `email.delivered`, `email.opened`, `email.clicked` y actualiza tabla `Order` con esos timestamps. Como mitigación: usar Resend Dashboard directamente para verificar manualmente el estado de emails específicos.

---

### 10. Cliente hace unsubscribe pero sigue recibiendo emails
**Status:** 🟡 Medio (legal — CAN-SPAM compliance)
**Síntoma visible:** Cliente reporta "le di unsubscribe pero sigo recibiendo emails de ustedes". Esto es violación de CAN-SPAM Act y puede generar reportes a Resend.
**Solución posible:** Ir a Supabase Table Editor → tabla `Order` → buscar por email del cliente → verificar que `unsubscribed = true`. Si está en `false`, marcarlo manualmente en `true`. Verificar que el endpoint `/api/unsubscribe` está funcionando — probarlo manualmente con curl o Postman. Si recibe el POST pero no actualiza, debug en código `app/api/unsubscribe/route.ts`. Importante: emails transaccionales críticos (confirmación de orden, certificate entregado) SÍ se pueden enviar incluso si `unsubscribed = true` por ley — solo emails de marketing deben respetar el unsubscribe.
