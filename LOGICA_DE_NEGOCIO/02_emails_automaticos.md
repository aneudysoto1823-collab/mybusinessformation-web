# Proceso 2 — Emails Automáticos (Resend)

## Descripción
El sistema envía 4 emails en total: 3 al cliente y 1 al administrador. Los emails son en inglés porque los clientes son internacionales y los documentos de Florida son en inglés.

## Configuración
- **Plataforma:** Resend (resend.com)
- **Remitente actual:** `onboarding@resend.dev` (dominio de prueba de Resend)
- **Remitente futuro:** `noreply@mybusinessformation.com` (cuando se verifique el dominio)
- **Variable de entorno:** `RESEND_API_KEY` en el archivo `.env`
- **Email admin:** `aneurysoto@gmail.com`

## Los 4 emails

### Email 1 — Confirmación de Orden → CLIENTE
- **Cuándo:** Al confirmar el pago (webhook de Stripe)
- **Destinatario:** Cliente (`order.email`)
- **Función:** `sendOrderConfirmation(order)`
- **Contenido:** Resumen de la orden, número de orden, próximos pasos

### Email 2 — Nombres Tomados → CLIENTE
- **Cuándo:** Cuando el equipo verifica en Sunbiz y los 3 nombres están registrados
- **Destinatario:** Cliente (`order.email`)
- **Función:** `sendAllNamesTaken(order)` — este función envía emails 2 y 3 en paralelo
- **Contenido:** Lista los 3 nombres rechazados con ❌, pide 3 nuevas opciones, enlaza a search.sunbiz.org

### Email 3 — Alerta Nombres Tomados → ADMIN
- **Cuándo:** Mismo momento que Email 2 (Promise.all)
- **Destinatario:** Admin (`aneurysoto@gmail.com`)
- **Función:** parte interna de `sendAllNamesTaken(order)`
- **Contenido:** Alerta roja con datos del cliente, nombres rechazados, instrucción de hacer seguimiento

### Email 4 — Certificate of Formation → CLIENTE
- **Cuándo:** Cuando el negocio es aprobado por el Estado de Florida (estado `approved`)
- **Destinatario:** Cliente (`order.email`)
- **Función:** `sendCertificateDelivery(order)`
- **Contenido:** Felicitación, documento adjunto (futuro), próximos pasos post-formación

## Resumen de destinatarios
| Email | Para | Trigger |
|-------|------|---------|
| 1 — Confirmación de orden | Cliente | Pago confirmado (Stripe webhook) |
| 2 — Nombres tomados | Cliente | Los 3 nombres están en Sunbiz |
| 3 — Alerta nombres tomados | Admin | Mismo momento que Email 2 |
| 4 — Certificate of Formation | Cliente | Estado de Florida aprueba el negocio |

## Flujo técnico
1. Stripe confirma pago → webhook → `orders.controller.ts`
2. Controller actualiza `paymentStatus = paid` y `status = in_review`
3. Controller llama `sendOrderConfirmation()` en background (no bloquea respuesta)
4. Equipo verifica nombres en Sunbiz manualmente
5. Si todos tomados → equipo llama `POST /api/notifications/names-taken`
6. `sendAllNamesTaken()` dispara Email 2 (cliente) y Email 3 (admin) en paralelo
7. Cliente responde con nuevos nombres → equipo retoma el proceso
8. Estado llega a `approved` → equipo llama `POST /api/notifications/certificate`
9. `sendCertificateDelivery()` dispara Email 4 al cliente

## Endpoints disponibles
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/notifications` | Health check — verifica que Resend está configurado |
| POST | `/api/notifications/test-full-flow` | **PRUEBA:** dispara los 4 emails de una vez |
| POST | `/api/notifications/order-confirmation` | Producción: enviar Email 1 al cliente |
| POST | `/api/notifications/names-taken` | Producción: enviar Emails 2 y 3 |
| POST | `/api/notifications/certificate` | Producción: enviar Email 4 al cliente |

## Archivos clave
- `backend/modules/notifications/notifications.service.ts` — lógica de emails (3 funciones)
- `backend/modules/notifications/notifications.route.ts` — rutas Express
- `backend/modules/orders/orders.controller.ts` — donde se dispara Email 1 al crear orden

## TODO futuro
- [ ] Verificar dominio `mybusinessformation.com` en Resend → cambiar `FROM_EMAIL`
- [ ] Adjuntar PDF del Certificate en Email 4
- [ ] WhatsApp Business API como canal adicional (opcional)
