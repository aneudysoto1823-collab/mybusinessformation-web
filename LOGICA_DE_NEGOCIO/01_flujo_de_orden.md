# Proceso 1 — Flujo de una Orden

## Descripción
Una orden es el registro central del negocio. Representa a un cliente que quiere formar una LLC o Corporación en Florida.

## Pasos del flujo

### 1. Cliente llena el formulario en el sitio
- Elige tipo de entidad: LLC o Corporación
- Ingresa nombre(s) preferidos del negocio
- Elige paquete: Basic ($49), Standard ($149), Premium ($249)
- Agrega opciones: EIN, Operating Agreement, ITIN, Annual Report
- Ingresa datos de contacto y dirección
- Selecciona Agente Registrado (nuestro servicio o propio)

### 2. Cliente paga (Etapa 4 — Stripe)
- La orden queda en estado `pending` hasta confirmar pago
- Stripe envía webhook → actualizamos `paymentStatus` a `paid`

### 3. Sistema dispara emails automáticos (Etapa 7 — Resend)
- Email de confirmación al cliente
- Alerta interna a aneudysoto1823@gmail.com

### 4. Equipo procesa la orden
- Estado avanza: `pending` → `in_review` → `filed` → `approved` → `completed`
- Cada cambio de estado envía email al cliente
- **Caso especial — nombres tomados:** Si los 3 nombres propuestos están registrados en Sunbiz,
  el equipo envía `sendAllNamesTaken()` al cliente pidiéndole nuevas opciones antes de continuar

### 5. Entrega de documentos
- Certificate of Formation llega al cliente por email (con PDF adjunto)
- EIN, Operating Agreement, etc. se entregan según paquete

## Estados posibles de una orden
| Estado       | Significado                                      |
|-------------|--------------------------------------------------|
| `pending`   | Orden recibida, esperando pago                   |
| `in_review` | Pago confirmado, revisando documentos            |
| `filed`     | Documentos enviados al Estado de Florida         |
| `approved`  | Estado aprobó — negocio formado oficialmente     |
| `completed` | Todos los documentos entregados al cliente       |

## Archivos clave
- `backend/modules/orders/orders.service.ts` — guardar y leer órdenes (Prisma)
- `backend/modules/orders/orders.controller.ts` — lógica HTTP
- `backend/modules/orders/orders.route.ts` — rutas Express
- `backend/prisma/schema.prisma` — modelo Order en base de datos
