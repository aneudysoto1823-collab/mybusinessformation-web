# Proceso 4 — Pagos con Stripe

## Descripción
El sistema usa Stripe para procesar pagos de los clientes. La integración está planificada para la Etapa 4 del roadmap.

## Estado actual
- El módulo de pagos existe (`backend/modules/payments/payments.route.ts`) pero aún es un stub (placeholder)
- Los campos de Stripe ya están en el modelo de base de datos (schema.prisma)
- La integración real con Stripe se implementará en la Etapa 4

## Campos en la base de datos (listos)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `stripePaymentId` | String? | ID del PaymentIntent o sesión de Stripe |
| `paymentStatus` | String | Estado del pago: `pending`, `paid`, `failed`, `refunded` |
| `amount` | Float | Monto total cobrado (calculado en frontend) |
| `currency` | String | Moneda (default: `USD`) |

## Flujo planeado (Etapa 4)

### 1. Cliente elige paquete y add-ons
- Precio calculado dinámicamente en el formulario HTML
- Total enviado al backend como campo `amount`

### 2. Backend crea PaymentIntent en Stripe
- `POST /api/payments/create-intent`
- Devuelve `clientSecret` al frontend
- Frontend usa Stripe.js para mostrar formulario de pago

### 3. Cliente completa el pago
- Stripe procesa la tarjeta
- Redirige al cliente de vuelta al sitio

### 4. Webhook de Stripe confirma el pago
- `POST /api/payments/webhook`
- Stripe firma el evento (verificar con `STRIPE_WEBHOOK_SECRET`)
- Sistema actualiza `paymentStatus` a `paid`
- Sistema actualiza `status` de `pending` a `in_review`
- Sistema dispara emails automáticos (Etapa 7)

## Variables de entorno necesarias (Etapa 4)
```
STRIPE_SECRET_KEY=sk_live_...     # o sk_test_... para pruebas
STRIPE_WEBHOOK_SECRET=whsec_...   # para verificar webhooks
```

## Archivos clave
- `backend/modules/payments/payments.route.ts` — módulo de pagos (stub, pendiente implementar)
- `backend/prisma/schema.prisma` — campos `stripePaymentId`, `paymentStatus`, `amount`

## TODO (Etapa 4)
- [ ] Crear cuenta Stripe y obtener API keys
- [ ] Implementar `POST /api/payments/create-intent`
- [ ] Implementar `POST /api/payments/webhook`
- [ ] Conectar webhook en dashboard de Stripe
- [ ] Actualizar `paymentStatus` y `status` al confirmar pago
- [ ] Configurar variables de entorno en Railway
