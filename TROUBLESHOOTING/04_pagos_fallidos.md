# 04 — Pagos fallidos (Stripe)

Problemas con Stripe: pagos rechazados, webhooks que no llegan, refunds, disputes y cuentas bloqueadas.

---

### 1. Webhook de Stripe falla con "signature verification failed"
**Status:** 🔴 Crítico
**Síntoma visible:** Cliente paga, Stripe procesa el cargo, pero la orden NUNCA pasa a estado `paid` en `/admin`. En Stripe Dashboard → Webhooks aparece el evento con status "Failed" código 400 y mensaje "No signatures found matching the expected signature".
**Solución posible:** Ir a https://dashboard.stripe.com → Developers → Webhooks → click sobre el endpoint → revelar "Signing secret" (botón "Reveal"). Copiar ese valor. Ir a Railway → Settings → Variables → `STRIPE_WEBHOOK_SECRET` → pegar el valor copiado. Restart del servicio. En Stripe webhook → "Recent deliveries" → click sobre eventos fallidos → botón "Resend" para reprocesar. Verificar que las órdenes ahora pasen a `paid`.

---

### 2. Cliente paga pero no recibe confirmación, orden queda en `pending`
**Status:** 🔴 Crítico
**Síntoma visible:** Cliente reporta "ya pagué con tarjeta y no me llegó nada". En Stripe Dashboard el cargo aparece como "Succeeded". En `/admin` la orden está en `pending` y `paymentStatus` también `pending`. Email de confirmación NO se envió.
**Solución posible:** Ir a Stripe Dashboard → Payments → buscar el cargo del cliente → click. Ver el `payment_intent` ID. Ir a Webhooks → buscar evento `payment_intent.succeeded` con ese ID — verificar si se entregó. Si "Failed", reenviar manualmente. Si "Succeeded" pero la orden sigue en pending, ir a Railway logs y buscar el evento por timestamp — leer el error del handler. Como mitigación inmediata mientras se debugea: ir a Supabase Table Editor → tabla `Order` → editar la orden manualmente: `status = in_review`, `paymentStatus = paid`. Luego en `/admin` disparar email de confirmación manualmente.

---

### 3. Tarjetas de clientes legítimos rechazadas en exceso
**Status:** 🟡 Medio
**Síntoma visible:** Múltiples reportes en mismo día de "mi tarjeta es válida pero el sitio dice que no se puede procesar". Tasa de pagos rechazados >20% en últimas 24h en Stripe Dashboard.
**Solución posible:** Ir a Stripe Dashboard → Radar → "Risk Insights". Verificar si Radar está rechazando legítimos por reglas muy estrictas. Ajustar nivel de Radar: Settings → Radar → bajar de "Strict" a "Standard". Revisar emails de Stripe — pueden haber flagged la cuenta. Si los rechazos son por tarjetas internacionales (latinos no-residentes), considerar habilitar más métodos de pago: Settings → Payment methods → activar "Cash App Pay", PayPal, ACH si aplica. Comunicarse con cliente afectado para alternativa.

---

### 4. Stripe flagea la cuenta y bloquea payouts
**Status:** 🔴 Crítico
**Síntoma visible:** Email de Stripe "Your account has been flagged for review" o "Your payouts have been paused". Banner amarillo/rojo en Stripe Dashboard. Cobros siguen funcionando pero el dinero no se transfiere a tu cuenta bancaria.
**Solución posible:** Ir a Stripe Dashboard → banner del aviso → click "Provide more information". Subir documentos solicitados (típicamente: ID, comprobante de domicilio, EIN, prueba de actividad de negocio, información del modelo de negocio). Responder TODOS los emails de Stripe Trust & Safety dentro de 24-48h — el silencio empeora el caso. Mientras tanto, los cobros siguen — pero NO empezar a depender del flujo de cash hasta resolver. Tener cuenta bancaria de respaldo para operación.

---

### 5. Refund procesado en Stripe pero orden no se actualiza en sistema
**Status:** 🟡 Medio
**Síntoma visible:** Admin hizo refund desde Stripe Dashboard, dinero regresó al cliente, pero en `/admin` la orden sigue mostrando `paymentStatus: paid`. Cliente confundido si ve el portal de cliente con orden activa.
**Solución posible:** Ir a Stripe Dashboard → Webhooks → buscar evento `charge.refunded` por el `charge_id` del refund. Verificar que se entregó al webhook. Si "Failed", reenviar. Si nunca llegó al webhook, agregar el evento `charge.refunded` a la lista de eventos suscritos en Stripe Dashboard (Webhooks → Edit endpoint). Como mitigación inmediata: ir a Supabase Table Editor → tabla `Order` → editar manualmente `paymentStatus = refunded`, agregar nota interna del refund.

---

### 6. Cliente reporta cobro duplicado de la misma orden
**Status:** 🔴 Crítico
**Síntoma visible:** Cliente envía screenshot mostrando 2 cobros de $149 (o el monto del paquete) en su statement bancario por la misma orden. Solo hay 1 orden en `/admin`.
**Solución posible:** Ir a Stripe Dashboard → Customers → buscar email del cliente → ver Payment Intents. Confirmar si hay 2 charges sobre el mismo customer. Si SÍ son duplicados, hacer refund inmediato del segundo cargo desde Stripe Dashboard → click sobre el charge → "Refund". Investigar causa: probablemente el cliente clickeó el botón "Pagar" 2 veces. Para prevenir: en código del checkout, deshabilitar el botón después del primer click hasta resolver. Comunicar al cliente el refund y disculparte.

---

### 7. Disputes (chargebacks) recibidos
**Status:** 🟡 Medio (escalable a 🔴 si frecuente)
**Síntoma visible:** Email de Stripe "You received a dispute on payment". Banner en Stripe Dashboard "1 dispute needs response". El cliente reclamó el cobro a su banco.
**Solución posible:** Ir a Stripe Dashboard → Disputes → click sobre el dispute → leer la razón ("fraudulent", "product not received", etc.). Tienes 7-21 días para responder con evidencia: ir a la orden en `/admin` → exportar/screenshot del Certificate of Formation entregado, emails enviados al cliente, timestamps de cada paso. Subir evidencia en Stripe → "Submit response". Si el cliente tiene razón (ej: nunca recibió el certificate), aceptar el dispute para no acumular cargos extra. Mantener tasa de disputes <0.7% del volumen para no perder cuenta de Stripe.

---

### 8. Stripe Tax cobra impuesto incorrecto
**Status:** 🟡 Medio
**Síntoma visible:** Cliente reporta que el total cobrado tiene tax que no debería aplicar. Ejemplo: cliente fuera de Florida pagando un servicio digital con tax de FL aplicado.
**Solución posible:** Ir a Stripe Dashboard → Settings → Tax. Verificar que las "Tax behaviors" están configurados correctamente para servicios digitales. Para formación de LLC, normalmente NO aplica sales tax (es servicio profesional). Desactivar Stripe Tax si está activo y no debería aplicar — Settings → Tax → "Disable". Para clientes ya cobrados con tax mal aplicado, hacer refund parcial del monto del tax desde Stripe.

---

### 9. Pago en estado "requires_action" indefinidamente (3D Secure)
**Status:** 🟡 Medio
**Síntoma visible:** Cliente inició pago, pasó a 3D Secure (verificación con banco vía SMS o app), pero después de eso no pasa nada. Orden queda en `pending` con `paymentStatus: pending`. Cliente reporta "completé la verificación pero no veo confirmación".
**Solución posible:** Ir a Stripe Dashboard → Payments → filtrar por status "Requires action". Identificar el payment intent del cliente. Ver si hay error específico. Frecuente: el cliente abandonó después del 3D Secure. Solución: enviar email al cliente con link directo para reintentar el pago (Stripe genera un "Reusable payment link"). Si Stripe muestra el pago como capturado pero el sistema nuestro no se actualizó, ver `04 — punto 1 y 2` arriba.

---

### 10. Stripe está caído globalmente
**Status:** 🔴 Crítico
**Síntoma visible:** Cliente intenta pagar y aparece error "Stripe is temporarily unavailable" o "Network error". En Stripe Dashboard también ves errores. Múltiples reportes de fallos en mismo momento.
**Solución posible:** Ir a https://status.stripe.com — verificar incidente confirmado. Si Stripe está down, no hay solución de nuestro lado. Acciones: (1) Publicar banner en sitio "Estamos teniendo problemas con el procesador de pagos. Por favor intenta en X minutos". (2) Pausar campañas de Google/Meta Ads para no quemar presupuesto en tráfico que no convertirá. (3) Suscribirse a updates del incidente Stripe. (4) Cuando se restaure, monitorear pagos durante las primeras 2-4 horas por anomalías. (5) Documentar el incidente para post-mortem y considerar tener PayPal como backup payment method futuro.
