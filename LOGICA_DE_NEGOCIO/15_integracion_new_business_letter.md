# 15 — Integración New Business Letter con Admin Panel y Portal de Clientes

## Qué es

Conjunto de mejoras que conectan el flujo de Marketing Automation (Etapa 12) con el panel de administración y el portal de clientes. Antes de esta etapa, las órdenes generadas por el webhook de Stripe (campañas QR) existían en la base de datos pero eran invisibles en el admin y el cliente no podía acceder a ellas desde el portal.

---

## Qué se hizo

### 1. Diferenciación de números de orden

Las órdenes del sistema tienen dos prefijos según su origen:

| Prefijo | Origen | Ejemplo |
|---|---|---|
| `FBFC-XXXXXXXX` | Formación de empresa (home) | FBFC-B3DE45D8 |
| `FBNB-XXXXXXXX` | New Business Letter (campaña QR) | FBNB-37286609 |

El número se construye con los primeros 8 caracteres del `Order.id` en mayúsculas.

---

### 2. Admin Panel — tabla de órdenes

Archivo: `app/admin/OrdersTable.tsx`

- Badge naranja **"New Business Letter"** para órdenes con `package = 'addon'`
- Filtro propio: dropdown incluye opción "New Business Letter"
- Número de orden muestra `FBNB-` en lugar de `FBFC-`
- Servicios mostrados desde array (formato addon) con labels legibles

---

### 3. Admin Panel — detalle de orden

Archivo: `app/admin/orders/[id]/page.tsx`

- Sección "Paquete y Pago" detecta si es addon y lista los servicios del array
- Botones de email de formación se ocultan en órdenes addon (no aplican)
- Número de orden correcto según tipo de paquete

---

### 4. Webhook Stripe actualizado

Archivo: `app/api/webhooks/stripe/route.ts`

- Genera número `FBNB-XXXXXXXX` y lo envía al cliente por email
- Status inicial: `in_review` (compatible con los estados del admin)
- Envía notificación al admin (`aneurysoto@gmail.com`) de cada nueva orden
- URL del portal en el email: `/client-portal`

---

### 5. Portal de Clientes — autenticación

Archivo: `app/api/client-auth/route.ts`

- Regex actualizado: acepta `FBFC-XXXXXXXX` y `FBNB-XXXXXXXX`
- El cliente de New Business Letter entra al portal igual que cualquier cliente de formación

---

### 6. Portal de Clientes — dashboard

Archivo: `app/client-portal/dashboard/page.tsx`

**Para órdenes addon:**
- Timeline simplificado de 3 pasos: Payment Confirmed → Processing → Services Delivered
- Sección "Your Services" lista los servicios del array con checkmarks
- Documentos mostrados según servicios comprados (EIN letter, Certificate, Labor Poster)

**Para todos los clientes:**
- `getOrder()` lee directo de Supabase (ya no depende del servidor Railway)
- Sección **"My Orders"** visible solo cuando el cliente tiene más de 1 orden — permite ver formación + addon en un solo lugar

---

### 7. "My Orders" — lógica multi-orden

El sistema busca todas las órdenes asociadas al email del cliente (no solo la del cookie de sesión). Si hay más de una, muestra una grilla de cards navegables con `?order=<id>` en la URL.

```
Cookie client_session = order_id (sesión activa)
        ↓
getOrder(id) → obtiene email del cliente
        ↓
getOrdersByEmail(email) → lista todas sus órdenes
        ↓
Si hay > 1 → muestra sección "My Orders"
El cliente puede cambiar de orden sin volver a hacer login
```

---

### 8. Email corporativo en todas las páginas

`info@opabiz.com` agregado en el footer de:
- Home (`/`)
- About (`/about`)
- Terms (`/terms`)
- Privacy (`/privacy`)
- Legal (`/legal`)
- New Business (`/new-business`)

---

## Estados de una orden addon

| Status | Significado en portal |
|---|---|
| `in_review` | Processing Your Services (paso 2 de 3) |
| `processing` | Processing Your Services (paso 2 de 3) |
| `completed` | Services Delivered (paso 3 de 3) |

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/admin/OrdersTable.tsx` | Badge, filtro y número FBNB para addons |
| `app/admin/orders/[id]/page.tsx` | Detalle de orden addon con servicios en array |
| `app/api/webhooks/stripe/route.ts` | Número FBNB, status in_review, notificación admin |
| `app/api/client-auth/route.ts` | Regex acepta FBFC y FBNB |
| `app/client-portal/page.tsx` | Placeholder actualizado |
| `app/client-portal/dashboard/page.tsx` | My Orders, timeline addon, getOrder vía Supabase |
| `app/page.tsx` y otras 5 páginas | Email corporativo en footer |

---

## Pendiente (próximas etapas)

- Cambiar status de una orden addon desde el admin (in_review → processing → completed)
- Email automático al cliente cuando el admin cambia el status
- Configurar Resend para que los emails salgan desde `info@opabiz.com`
- Eliminar órdenes de prueba cuando ya no sean necesarias:
  ```sql
  DELETE FROM "Order"
  WHERE email = 'jrfabian2011@gmail.com'
  AND "companyName" LIKE 'TEST%';
  ```
