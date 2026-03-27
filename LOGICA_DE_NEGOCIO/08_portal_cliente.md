# Portal del Cliente — Etapa 9

## Descripción
Portal donde el cliente puede ver el estado de su orden en tiempo real usando su email y número de confirmación. No requiere crear contraseña.

## Ubicación
- Login: /client-portal
- Dashboard: /client-portal/dashboard
- Protección: middleware.ts con cookie client_session

## Autenticación
- El cliente ingresa su email + número de confirmación
- Número de confirmación: `FBFC-` + primeros 8 caracteres del ID de la orden en mayúsculas
  - Ejemplo: si el ID es `550e8400-e29b-41d4-...` → número de confirmación: `FBFC-550E8400`
- El sistema busca la orden en Railway donde email coincide e ID empieza con esos 8 chars
- Si encuentra → crea cookie `client_session` con valor = orderId (24 horas)
- Si no encuentra → 401

## Páginas

### /client-portal — Login
- Campo: Email address
- Campo: Confirmation number (placeholder FBFC-00000000)
- Botón: Access My Order
- Link a soporte si no tiene el número de confirmación

### /client-portal/dashboard — Dashboard
Cargado como Server Component — lee cookie `client_session`, obtiene la orden, renderiza:

**1. Header** — Logo + botón Log Out (llama a /api/client-auth/logout)

**2. Welcome** — "Welcome, [firstName]!" + número de confirmación

**3. Timeline de 7 pasos:**
| Paso | Estado de orden correspondiente |
|------|--------------------------------|
| Order Received | pending |
| Payment Confirmed | in_review, names_taken |
| Name Availability Check | in_review (activo), names_taken (activo), ready_to_file+ (completo) |
| Ready to File | ready_to_file |
| Filed with Florida | filed |
| Approved by State | approved |
| Completed | completed |

Pasos completados: checkmark verde. Paso activo: resaltado en índigo con badge "In Progress". Pasos futuros: gris.

**4. What's Next** — Texto explicando el estado actual en inglés

**5. Your Company Details** — Company name, entity type, package, amount, order date, email

## Endpoints

### POST /api/client-auth
- Body: `{ email, confirmationNumber }`
- Lógica: busca en Railway /api/orders, filtra por email + id prefix
- Éxito: cookie client_session = orderId, 200
- Error: 401

### GET /api/client-auth/logout
- Elimina cookie client_session
- Redirige a /client-portal

## Middleware actualizado
```ts
if (pathname.startsWith('/admin')) {
  // verifica admin_session → redirige a /login
}
if (pathname.startsWith('/client-portal/dashboard')) {
  // verifica client_session → redirige a /client-portal
}
```

## Estado
- [x] Página de login del cliente (/client-portal)
- [x] Endpoint de autenticación (/api/client-auth)
- [x] Endpoint de logout (/api/client-auth/logout)
- [x] Dashboard con timeline de 7 pasos (/client-portal/dashboard)
- [x] Middleware protegiendo /client-portal/dashboard
- [x] Sección "What's Next" según estado actual
- [x] Sección "Your Company Details"

## Variables de entorno necesarias
- `BACKEND_URL` — URL del servidor Railway (ya configurada)
- `NEXT_PUBLIC_BASE_URL` — URL base de Vercel (para redirect de logout)

## Pendiente
- Botón "Log In" en el header del HTML principal — lo agrega el socio del proyecto en mybusinessformation.html, apuntando a `/client-portal`

## Historial
- 2026-03-27: Etapa 9 construida — portal del cliente con login y dashboard de estado en tiempo real
