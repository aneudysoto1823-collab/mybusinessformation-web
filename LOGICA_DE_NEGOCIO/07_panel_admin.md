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
