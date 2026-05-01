# 12 — Sistema de Marketing Automation con Campañas QR

## Qué es

Sistema de marketing outbound que identifica empresas ya registradas en Florida, les envía emails personalizados con un código QR único, rastrea la interacción, y las lleva a una landing page donde pueden comprar servicios de cumplimiento empresarial. Al completar el pago, el sistema crea automáticamente una orden en el sistema y el cliente puede acceder al Portal de Clientes igual que cualquier cliente que compró un paquete de formación.

## Para qué sirve

Abre un canal de ventas a empresas existentes en Florida que necesitan servicios de cumplimiento — clientes que nunca pasarían por el flujo de formación. Los servicios vendidos (Labor Law Poster, EIN, Certificate of Status) son obligatorios o recurrentes, lo que genera ingresos anuales.

---

## Flujo completo (end-to-end)

```
Admin agrega empresa
        ↓
Admin envía email desde /admin/campaigns
        ↓
Sistema genera QR único con URL de tracking
        ↓
Email HTML bilingüe se envía vía Resend
        ↓
Cliente escanea QR → /api/campaigns/track-scan registra el scan
        ↓
Redirect a /new-business?id=<document_id>
        ↓
Landing page auto-busca la empresa (DB → Sunbiz scraping)
        ↓
Cliente selecciona servicios → Stripe Checkout
        ↓
Stripe webhook → crea Order + envía email con FBFC-XXXXXXXX
        ↓
Cliente accede al Portal de Clientes con email + FBFC
```

---

## Estados de una empresa (prospective_companies.status)

| Estado | Significado |
|---|---|
| `new` | Recién importada, sin contacto |
| `email_sent` | Email enviado, sin interacción |
| `qr_scanned` | Escaneó el QR, visitó la landing page |
| `purchased` | Completó la compra — tiene una Order en el sistema |

---

## Servicios disponibles

| Servicio | Precio | Notas |
|---|---|---|
| Labor Law Poster 2026 | $69.99 | Se renueva cada año — recurrente |
| EIN / Tax ID Number | $99.99 | Una sola vez |
| Certificate of Status (FL) | $49.99 | Se renueva según necesidad |
| Business Essentials Bundle | $189.99 | Los 3 juntos (ahorro de $30) |

---

## Tablas en Supabase

### `prospective_companies`
Empresas objetivo. Fuente: importación manual desde el panel admin o scraping de Sunbiz.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK |
| document_id | text | Número de documento Sunbiz (único) |
| company_name | text | Nombre de la empresa |
| owner_name | text | Propietario (si está disponible) |
| address, city, zip | text | Dirección postal |
| email | text | Email de contacto — requerido para enviar campaña |
| company_type | text | LLC, CORP, PA, LTD |
| registration_date | date | Fecha de registro en Florida |
| status | text | new → email_sent → qr_scanned → purchased |
| created_at | timestamptz | Fecha de ingreso al sistema |

### `email_campaigns`
Un registro por cada email enviado.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → prospective_companies |
| sent_at | timestamptz | Cuándo se envió |
| email_to | text | Destinatario |
| qr_code_url | text | URL de tracking embebida en el QR |
| lang | text | Idioma del email: 'en' o 'es' |
| status | text | sent, bounced, etc. |

### `qr_scans`
Un registro por cada escaneo del QR.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → prospective_companies |
| scanned_at | timestamptz | Momento del scan |
| ip_address | text | IP del cliente |
| converted | boolean | true si completó la compra |

### `conversions`
Un registro por cada compra completada.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK → prospective_companies |
| order_id | uuid | FK → Order (tabla principal del sistema) |
| email | text | Email del comprador |
| services | text[] | Lista de servicios comprados |
| total_amount | numeric | Monto pagado |
| converted_at | timestamptz | Momento de la compra |

---

## Archivos principales

| Archivo | Función |
|---|---|
| `app/admin/campaigns/page.tsx` | Panel admin: stats, tabla de empresas, filtros, envío de emails, alta manual |
| `app/new-business/page.tsx` | Landing page bilingüe: lookup de empresa, selección de servicios, checkout |
| `app/new-business/success/page.tsx` | Página post-pago con instrucciones para acceder al portal |
| `app/api/campaigns/send/route.ts` | POST: genera QR, construye email HTML, envía vía Resend |
| `app/api/campaigns/track-scan/route.ts` | GET: registra scan, actualiza status, redirige a /new-business |
| `app/api/campaigns/stats/route.ts` | GET: devuelve métricas del dashboard |
| `app/api/campaigns/companies/route.ts` | GET (con filtros) + POST (alta manual) |
| `app/api/sunbiz/route.ts` | GET: busca empresa en DB primero, fallback a scraping de Sunbiz |
| `app/api/sunbiz/checkout/route.ts` | POST: crea sesión de Stripe para los servicios seleccionados |
| `app/api/webhooks/stripe/route.ts` | POST: recibe pago confirmado → crea Order → envía email con FBFC |

---

## Integración con el Portal de Clientes

Cuando el cliente completa el pago, el webhook de Stripe crea un registro en la tabla `Order` con:

- `package: 'addon'`
- `addons`: lista de servicios comprados
- `paymentStatus: 'paid'`
- `status: 'processing'`

El cliente recibe un email con su número `FBFC-XXXXXXXX` y puede entrar al Portal de Clientes (`/login`) con ese número y su email — exactamente igual que un cliente que compró un paquete de formación.

---

## Variables de entorno requeridas

| Variable | Dónde obtenerla |
|---|---|
| `RESEND_API_KEY` | Ya configurada (usada en emails de formación) |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | dashboard.stripe.com → Webhooks → registrar endpoint `/api/webhooks/stripe` con evento `checkout.session.completed` |

---

## Panel de Administración (`/admin/campaigns`)

Accesible desde `/admin` con las mismas credenciales de administrador.

**Secciones:**
1. **Stats** — Total empresas, emails enviados hoy/mes, tasa de scan (%), revenue total
2. **Filtros** — Por status, tipo de empresa, rango de fechas
3. **Tabla de empresas** — Nombre, Document ID, email, fecha, tipo, status con badge de color, botones Send Email y Preview
4. **Acciones bulk** — "Send to All New" para enviar a todas las empresas en estado `new`
5. **Pausa del sistema** — Toggle para detener envíos sin eliminar datos
6. **Alta manual** — Formulario con lookup automático de Sunbiz por Document ID

**Badges de status:**
- 🔵 `new` — recién importada
- 🟡 `email_sent` — email enviado
- 🟠 `qr_scanned` — escaneo registrado
- 🟢 `purchased` — compra completada
