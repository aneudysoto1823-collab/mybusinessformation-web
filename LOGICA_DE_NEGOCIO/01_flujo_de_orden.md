# Proceso 1 — Flujo Completo de una Orden

## Descripción
Una orden es el registro central del negocio. Representa a un cliente que quiere formar una LLC o Corporación en Florida.

## Pasos del flujo

### 1. Cliente llena el formulario
- Elige tipo de entidad: LLC o Corporación
- Propone hasta 3 nombres para su negocio (`companyName`, `companyName2`, `companyName3`)
- Elige paquete: Basic ($49), Standard ($149), Premium ($249)
- Agrega add-ons opcionales: EIN, Operating Agreement, ITIN, Annual Report
- Ingresa datos de contacto y dirección
- Selecciona Agente Registrado (nuestro servicio o propio)
- La orden se guarda en la base de datos con estado `pending`

### 2. Cliente paga (Etapa 4 — Stripe)
- La orden permanece en `pending` hasta confirmar pago
- Stripe envía webhook → `paymentStatus` se actualiza a `paid`
- Estado de la orden avanza a `in_review`
- **Se disparan automáticamente:** Email de confirmación al cliente

### 3. Equipo verifica disponibilidad de nombres en Sunbiz
El proceso es secuencial: se verifica nombre por nombre.

```
Nombre 1 disponible → continúa con ese nombre
Nombre 1 tomado → verifica Nombre 2
  Nombre 2 disponible → continúa con ese nombre
  Nombre 2 tomado → verifica Nombre 3
    Nombre 3 disponible → continúa con ese nombre
    Nombre 3 tomado → TODOS TOMADOS:
      - Orden permanece en in_review
      - Email al cliente pidiendo nuevas opciones
      - Alerta al admin para hacer seguimiento
      - Proceso se pausa hasta que el cliente responda
```

### 4. Equipo procesa la orden
- Estado avanza: `in_review` → `filed` → `approved` → `completed`
- `filed`: documentos enviados al Estado de Florida
- `approved`: Estado aprobó — negocio formado oficialmente
- `completed`: Certificate of Formation entregado al cliente

### 5. Entrega final
- Se envía el Certificate of Formation al cliente por email
- EIN, Operating Agreement y otros documentos según paquete elegido

## Estados posibles de una orden
| Estado       | Significado                                            |
|-------------|--------------------------------------------------------|
| `pending`   | Orden guardada, esperando confirmación de pago          |
| `in_review` | Pago confirmado — verificando nombres, preparando docs  |
| `filed`     | Documentos enviados al Estado de Florida                |
| `approved`  | Estado aprobó — negocio formado oficialmente            |
| `completed` | Certificate of Formation entregado al cliente           |

## Archivos clave
- `backend/modules/orders/orders.service.ts` — guardar y leer órdenes (Prisma)
- `backend/modules/orders/orders.controller.ts` — lógica HTTP
- `backend/modules/orders/orders.route.ts` — rutas Express
- `backend/prisma/schema.prisma` — modelo Order en base de datos
