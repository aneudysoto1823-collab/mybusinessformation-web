# Panel de Administración — Etapa 8

## Descripción
Panel interno para que el equipo de MyBusinessFormation gestione órdenes, clientes y notificaciones.

## Ubicación
- Ruta: /admin (dentro del proyecto Next.js en backend/)
- Login: /login
- Protección: middleware.ts con cookie admin_session

## Páginas
1. /login — Formulario de acceso con usuario y contraseña desde variables de entorno
2. /admin — Dashboard con estadísticas + tabla de todas las órdenes
3. /admin/orders/[id] — Vista detallada de cada orden con acciones

## Autenticación
- Variables de entorno: ADMIN_USER y ADMIN_PASSWORD
- Middleware de Next.js protege todas las rutas /admin
- Sesión manejada con cookie admin_session firmada con JWT (jose, HS256, expira 8h)
- Variable de entorno requerida: SESSION_SECRET

## Estadísticas del dashboard
- Total órdenes
- Órdenes pendientes de pago (paymentStatus = pending)
- Órdenes en revisión (status = in_review)
- Ingresos totales (suma de amount donde paymentStatus = paid)

## Acciones disponibles por orden
- Ver detalle completo del cliente y la empresa
- Cambiar status de la orden
- Agregar notas internas
- Disparar email "Nombres Tomados" → POST /api/notifications/names-taken
- Disparar email "Certificate of Formation" → POST /api/notifications/certificate

## Arquitectura de datos del dashboard

### Carga de órdenes en /admin (dashboard principal)
`app/admin/page.tsx` usa `getSupabaseAdmin()` directamente para leer las órdenes.

```
Browser → Vercel (admin/page.tsx Server Component)
              ↓ getSupabaseAdmin().from('Order').select(...)
          Supabase (PostgreSQL)
```

**Nota (2026-04-02):** Originalmente este Server Component llamaba al Express en Railway
vía `backendFetch()`. Se migró a Supabase directo después de diagnosticar que el
prerenderizado estático de Next.js capturaba un resultado vacío en tiempo de build
antes de que `INTERNAL_API_KEY` estuviera configurada en Vercel. El cambio no afecta
la seguridad — el código sigue corriendo server-side y la página está protegida por
el middleware JWT.

### Operaciones del panel de detalle (/admin/orders/[id])
Las acciones del panel de detalle (cliente) siguen pasando por el Express en Railway
a través de rutas proxy en `/api/proxy/`. Todas estas operaciones requieren `INTERNAL_API_KEY`:

| Acción | Proxy Next.js | Destino Express |
|--------|--------------|-----------------|
| Ver detalle de orden | `/api/proxy/orders/[id]` GET | `GET /api/orders/:id` |
| Cambiar estado / notas | `/api/proxy/orders/[id]` PATCH | `PATCH /api/orders/:id` |
| Disparar email | `/api/proxy/notifications/[type]` POST | `POST /api/notifications/:type` |
| Buscar nombres | `/api/proxy/names/check` GET | `GET /api/names/check` |
| Descargar documentos | `/api/proxy/documents/[orderId]/[endpoint]` GET | `GET /api/documents/:id/:endpoint` |

Cada proxy verifica la sesión admin antes de reenviar la petición al Express.

## Variables de entorno necesarias
ADMIN_USER=admin
ADMIN_PASSWORD=tuPasswordSeguro
SESSION_SECRET=                  # 32+ chars aleatorios — firma el JWT de sesión admin
INTERNAL_API_KEY=                # protege el Express en Railway (requerida para proxies)

## Flujo de estados de una orden

| Estado | Quién actúa | Qué pasa |
|--------|-------------|----------|
| `pending` | 🤖 Sistema | Cliente llenó formulario, NO ha pagado. El sistema no hace nada todavía. |
| `in_review` | 🤖 Sistema | Stripe confirmó el pago. Sistema busca los 3 nombres en la base de datos local de Sunbiz automáticamente en tiempo real. |
| `names_taken` | 👨‍💼 Equipo | Los 3 nombres están tomados. Email automático al cliente y al admin. El equipo entra al panel, busca hasta 10 nombres alternativos contra la base Sunbiz, selecciona los disponibles y le envía un email personalizado al cliente con sugerencias. La orden vuelve a `in_review` cuando el cliente responde con nuevos nombres. |
| `ready_to_file` | 👨‍💼 Equipo | Un nombre está disponible. El equipo entra al panel, ve la orden, va a sunbiz.org y llena el formulario manualmente. Luego cambia el estado a `filed`. |
| `filed` | 👨‍💼 Equipo | Formulario enviado al Estado de Florida. El equipo espera la respuesta. Cuando Florida responde, cambia el estado a `approved`. |
| `approved` | 👨‍💼 Equipo | Florida aprobó el negocio. El equipo sube el PDF del Certificate of Formation desde el panel. El sistema lo adjunta y lo envía al cliente por email automáticamente. |
| `completed` | 🤖 Sistema | Certificate enviado al cliente. Orden cerrada. |

## Lógica de búsqueda de nombres (Etapa 5 — pendiente)
- La base de datos de Sunbiz (~3.5 millones de registros) se descarga vía FTP y se importa a Supabase
- Se actualiza automáticamente cada noche
- Cuando Stripe confirma el pago, el sistema busca los 3 nombres en tiempo real contra esa base de datos local
- El buscador del panel admin también usa esa misma base de datos para buscar nombres alternativos
- Mientras la Etapa 5 no esté lista, el buscador del panel mostrará un mensaje de "base de datos no disponible aún"

## Funcionalidades construidas en el panel

1. Filtro de órdenes por estado (tabs o sidebar)
2. Buscador de nombres — ingresar hasta 10 nombres, ver cuáles están disponibles en Sunbiz local
3. Email personalizado al cliente con nombres sugeridos disponibles
4. Subida de PDF del Certificate a Supabase Storage — sistema lo envía por email al cliente
5. Botones claros para avanzar el estado de cada orden paso a paso
6. Notas internas por orden

## Estado
- [x] Estructura de archivos creada
- [x] Login funcional con JWT firmado (SESSION_SECRET)
- [x] Middleware de protección activo
- [x] Dashboard con estadísticas
- [x] Tabla de órdenes con filtros (estado, paquete, búsqueda, fechas)
- [x] Vista detallada por orden
- [x] Botones de acción funcionando
- [x] Rutas proxy protegidas con verificación de sesión admin

## Historial
- 2026-03-27: Inicio construcción del panel de admin
- 2026-03-27: Etapa 8 completada — panel de admin funcionando en producción. Railway conectado a Supabase usando pooler aws-1-us-east-1 puerto 6543. URL del panel: https://mybusinessformation-web.vercel.app/admin
- 2026-03-30: Mejoras al panel — (1) número FBFC clickeable en tabla, (2) dropdowns de ordenamiento (más recientes, más antiguas, mayor/menor monto, por paquete) y filtro por paquete (Basic/Standard/Premium), (3) badge ⚠️ +24h en tabla y aviso en detalle cuando una orden activa lleva más de 24h sin actualizar
- 2026-04-01: Auditoría de seguridad — cookie admin reemplazada por JWT firmado (jose), rutas proxy creadas para el panel de detalle, CORS del Express restringido
- 2026-04-02: `getOrders()` en dashboard migrado de Express (`backendFetch`) a Supabase directo (`getSupabaseAdmin()`). Motivo: prerenderizado estático de Next.js capturaba resultado vacío en build. `INTERNAL_API_KEY` sigue siendo requerida para todas las operaciones del panel de detalle. Filtro de fechas Desde/Hasta añadido a la tabla de órdenes.
