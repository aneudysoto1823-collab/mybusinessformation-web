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
- Sesión manejada con cookie admin_session

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

## Variables de entorno necesarias
ADMIN_USER=admin
ADMIN_PASSWORD=tuPasswordSeguro

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

## Funcionalidades pendientes de construir en el panel

1. Filtro de órdenes por estado (tabs o sidebar)
2. Buscador de nombres — ingresar hasta 10 nombres, ver cuáles están disponibles en Sunbiz local
3. Email personalizado al cliente con nombres sugeridos disponibles
4. Subida de PDF del Certificate a Supabase Storage — sistema lo envía por email al cliente
5. Botones claros para avanzar el estado de cada orden paso a paso
6. Notas internas por orden

## Estado
- [ ] Estructura de archivos creada
- [ ] Login funcional
- [ ] Middleware de protección activo
- [ ] Dashboard con estadísticas
- [ ] Tabla de órdenes
- [ ] Vista detallada por orden
- [ ] Botones de acción funcionando

## Historial
- 2026-03-27: Inicio construcción del panel de admin
