# Proceso 1 — Flujo Completo de una Orden

## Descripción
Una orden es el registro central del negocio. Representa a un cliente que quiere formar una LLC o Corporación en Florida.

## Pasos del flujo

### 1. Cliente llena el formulario
- Elige tipo de entidad: LLC o Corporación
- Propone hasta 3 nombres para su negocio (`companyName`, `companyName2`, `companyName3`). **companyName2 y companyName3 son opcionales** — el cliente puede mandar solo 1 nombre.
- Elige paquete: Basic ($0), Standard ($199), Premium ($299)
- Agrega add-ons opcionales: EIN, Operating Agreement, ITIN, Annual Report, BTR, STR, Certified Copy
- Ingresa datos de contacto y **dirección del negocio** (puede ser física o **virtual asignada por OpaBiz**)
- **Paso "Members / Owners":** dropdown 1-10 miembros (antes era botón "Add Another Member"). Cambiar el número agrega o quita bloques dinámicamente.
- **Address presets en cada miembro:** si el cliente puso dirección física del negocio aparece un check "📍 Usar la dirección del negocio" — al marcarlo, se rellena automáticamente con esa dirección y se ocultan Country/Street/City/State/ZIP. Si eligió dirección virtual, aparece un check "📍 Usar la dirección virtual asignada por OpaBiz" con el mismo efecto. Permite no escribir 2 veces la misma dirección.
- Selecciona Agente Registrado (nuestro servicio o propio)
- La orden se guarda en la base de datos con estado `pending`
- **Se disparan automáticamente:** A1 (confirmación al cliente con FROM "OpaBiz") + A0 (alerta interna "🆕 NUEVA ORDEN CREADA" a `alert@opabiz.com` con link al panel admin)

### 2. Cliente paga (Etapa 4 — Stripe)
- La orden permanece en `pending` hasta confirmar pago
- Stripe envía webhook → `paymentStatus` se actualiza a `paid`
- Estado de la orden avanza a `in_review`
- **Se disparan automáticamente:** Email de confirmación al cliente

### 3. Equipo verifica disponibilidad de nombres en Sunbiz
El proceso es secuencial: se verifica nombre por nombre.

```
Nombre 1 disponible → continúa con ese nombre
Nombre 1 tomado → verifica Nombre 2 (si el cliente lo puso)
  Nombre 2 disponible → continúa con ese nombre
  Nombre 2 tomado → verifica Nombre 3 (si el cliente lo puso)
    Nombre 3 disponible → continúa con ese nombre
    Nombre 3 tomado → TODOS TOMADOS:
      - Orden permanece en in_review
      - A2: Email al cliente pidiendo 3 NUEVAS opciones
        (desde support@opabiz.com con display "OpaBiz Support" — claro
         para el cliente que puede contestarnos directo)
      - A3: Alerta al equipo en alert@opabiz.com
      - Proceso se pausa hasta que el cliente responda
```

**Nota:** los emails A2 + A3 funcionan con **1, 2 o 3 nombres** (commit `601abaa` 2026-06-19). Antes exigían exactamente 3 — daban 400 si el cliente había puesto solo 1. Los templates adaptan singular/plural según la cantidad real.

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
