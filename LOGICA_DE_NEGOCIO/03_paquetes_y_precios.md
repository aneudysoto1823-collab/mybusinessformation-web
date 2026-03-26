# Proceso 3 — Paquetes y Precios

## Descripción
El negocio ofrece 3 paquetes principales de formación más servicios adicionales (add-ons).

## Paquetes principales

### Basic — $49 + cargo estatal
Incluye:
- Registro de formación (LLC o Corporación)
- Búsqueda de disponibilidad de nombre
- Certificado de Formación de Florida

### Standard — $149 + cargo estatal ⭐ Más popular
Incluye todo lo de Basic más:
- EIN / Número de Identificación Fiscal
- Guía de Cuenta Bancaria
- Agente Registrado (primer año gratis)

### Premium — $249 + cargo estatal
Incluye todo lo de Standard más:
- Operating Agreement (Acuerdo Operativo)
- Tramitación acelerada gratis (1–3 días)
- Solicitud de ITIN
- DBA / Nombre Ficticio
- Artículos de Enmienda

## Cargo estatal de Florida (adicional al paquete)
- LLC: $125
- Corporación: $70
- Este cargo va directamente al Estado de Florida, no al negocio

## Add-ons (servicios adicionales)
| Servicio | Precio |
|----------|--------|
| EIN / Tax ID | $49 |
| Operating Agreement | $79 |
| Expedited Filing | $99 |
| Bank Account Guide | $29 |
| ITIN Application | $69 |
| DBA / Fictitious Name | $49 |
| Articles of Amendment | $59 |
| Annual Report Filing | Anual |
| Virtual Mailing Address | $29/mes |

## Lógica del formulario
- El formulario en el sitio permite seleccionar paquete y add-ons
- El total se calcula dinámicamente en el frontend (JavaScript)
- El monto final se envía con la orden al backend
- El campo `amount` en la base de datos guarda el total cobrado
- El campo `package` guarda: `basic`, `standard`, o `premium`

## Archivos clave
- `backend/public/mybusinessformation.html` — formulario con lógica de precios (frontend)
- `backend/prisma/schema.prisma` — campos `package` y `amount` en modelo Order
