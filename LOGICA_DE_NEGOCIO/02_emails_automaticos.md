# Proceso 2 — Emails Automáticos (Resend)

## Descripción
El sistema envía 4 tipos de emails usando la plataforma Resend. Los emails son en inglés porque los clientes son internacionales y los documentos de Florida son en inglés.

## Configuración
- **Plataforma:** Resend (resend.com)
- **Remitente actual:** `onboarding@resend.dev` (dominio de prueba)
- **Remitente futuro:** `noreply@mybusinessformation.com` (cuando se verifique el dominio)
- **Variable de entorno:** `RESEND_API_KEY` en el archivo `.env`

## Los 4 tipos de email

### Email 1 — Confirmación de Orden (automático)
- **Cuándo se envía:** Inmediatamente cuando se guarda una orden nueva en la base de datos
- **Destinatario:** El cliente (su email ingresado en el formulario)
- **Función:** `sendOrderConfirmation(order)` en `notifications.service.ts`
- **Contenido:** Resumen de la orden, número de orden, próximos pasos

### Email 2 — Alerta Interna (automático)
- **Cuándo se envía:** Al mismo tiempo que el Email 1
- **Destinatario:** `aneudysoto1823@gmail.com` (equipo interno)
- **Función:** `sendInternalAlert(order)` en `notifications.service.ts`
- **Contenido:** Todos los datos de la orden en tabla para revisar rápido

### Email 3 — Actualización de Estado (manual/automático)
- **Cuándo se envía:** Cuando el equipo actualiza el estado de la orden
- **Destinatario:** El cliente
- **Función:** `sendStatusUpdate(order, status)` en `notifications.service.ts`
- **Estados que activan email:** `in_review`, `filed`, `approved`, `completed`
- **Cómo dispararlo:** POST `/api/notifications/status-update`

### Email 4 — Certificate of Formation (manual)
- **Cuándo se envía:** Cuando el negocio es aprobado por el Estado de Florida
- **Destinatario:** El cliente
- **Función:** `sendCertificateDelivery(order)` en `notifications.service.ts`
- **Cómo dispararlo:** POST `/api/notifications/certificate`

## Flujo técnico
1. Cliente envía formulario → `POST /api/orders`
2. `orders.controller.ts` llama `saveOrder()` → guarda en Supabase
3. Responde 201 al cliente inmediatamente
4. En background: llama `sendOrderConfirmation()` y `sendInternalAlert()`
5. Si el email falla, se imprime error en consola pero NO bloquea la respuesta

## Archivos clave
- `backend/modules/notifications/notifications.service.ts` — lógica de emails
- `backend/modules/notifications/notifications.route.ts` — rutas de la API
- `backend/modules/orders/orders.controller.ts` — donde se disparan los emails al crear orden

## Endpoints disponibles
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/notifications` | Health check |
| POST | `/api/notifications/test-confirmation` | Prueba manual de email |
| POST | `/api/notifications/status-update` | Notificar cambio de estado |
| POST | `/api/notifications/certificate` | Enviar Certificate al cliente |

## TODO futuro
- [ ] Verificar dominio `mybusinessformation.com` en Resend → cambiar FROM_EMAIL
- [ ] Agregar PDF del Certificate como adjunto en Email 4
- [ ] WhatsApp Business API como canal adicional (opcional)
