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

---

## Decisión 2026-04-28 — Sección de paquetes vive en el home

### Contexto
Hasta esta fecha existían **dos lugares** donde se mostraban los paquetes:
1. La sección `<section id="pricing">` dentro del home (`backend/app/page.tsx`) —
   actualizada, bilingüe, con toggle LLC/Corporación.
2. Una página dedicada `/paquetes` (`backend/app/paquetes/page.tsx`) —
   desactualizada, hero por defecto en inglés, con un botón "Start My Business /
   Iniciar Mi Negocio" que ya había sido eliminado del resto del sitio, y usa
   `overflow-x:hidden` (que va contra la regla del proyecto).

Toda la navegación pública (navbars de servicios, about, privacy, terms, legal;
botones del footer; CTAs de about; el botón "Ver Paquetes de Formación" al final
de servicios) apuntaba a la página vieja `/paquetes`, no a la sección moderna
del home. Eso causaba que el cliente aterrizara en una página inconsistente.

### Decisión
**La sección de paquetes vive en el home (`/#pricing`). Ese es el único lugar
canónico para el cliente.**

Toda la navegación pública se redirigió a `/#pricing` (11 enlaces en 5 archivos:
servicios, about, privacy, terms, legal). Los query params antiguos
`?entity=llc` y `?entity=corp` del dropdown del navbar de servicios fueron
eliminados — el home aún no soporta preselección de entidad por query string.

### Por qué no se eliminó `/paquetes` ese mismo día
La ruta `/paquetes` aún es usada por el **bot del chat AI**
(`backend/app/api/chat/route.ts`), que genera deep-links con token de sesión:
`${origin}/paquetes?session=${token}`. Eliminar la página rompería ese flujo.

### Tarea pendiente para eliminar `/paquetes` definitivamente
1. Reescribir el flujo del bot AI en `backend/app/api/chat/route.ts` para que el
   deep-link con token apunte a otra ruta (ej. al home o a una ruta nueva dedicada).
2. Migrar el manejo del query param `?session=<token>` a esa ruta destino.
3. Borrar `backend/app/paquetes/page.tsx` y la entrada en la navegación interna.

Mientras tanto, `/paquetes` queda huérfana de la navegación pública pero viva
para el bot.

---

## Cierre 2026-04-29 — `/paquetes` eliminada

### Migración del flujo de Claudia (Fabián, commit `3725f61`)
- `backend/app/api/chat/route.ts:369` — el deep-link cambió de
  `${origin}/paquetes?session=${token}` a `${origin}/?session=${token}`.
- `backend/app/api/chat/route.ts:101, 110` — los prompts del bot ya no mencionan
  `/paquetes`, ahora dicen "visit the homepage".
- `backend/app/page.tsx` — se agregaron ~94 líneas con:
  - Listener IIFE que detecta `?session=TOKEN` en la URL.
  - Fetch a `/api/form-session/<token>` para recuperar `form_data`.
  - Función `claudiaPrefill()` que pre-llena: tipo de entidad, nombre del negocio
    (separando sufijo LLC/Corp), nombres alternativos, contacto, miembros,
    agente registrado.
  - Banner azul "✓ Claudia pre-llenó tu formulario" con i18n EN/ES,
    auto-eliminado a los 7s.
- Endpoint `backend/app/api/form-session/[token]/route.ts` ya existía y resuelve
  el token contra Supabase.

### Eliminación final (2026-04-29)
- Verificación previa al borrado:
  - Cero referencias a `/paquetes` en código de navegación pública.
  - Cero referencias a `/paquetes` en `chat/route.ts`.
  - Endpoint `/api/form-session/[token]` operativo.
  - Claudia respondió correctamente en `localhost:3000` con la API key cargada
    desde `.env.local`.
- `backend/app/paquetes/page.tsx` eliminada del repo (1502 líneas).

### Trade-offs aceptados
- Los query params antiguos `?entity=llc` y `?entity=corp` siguen sin soporte
  en el home. Un click desde el dropdown "Formación de LLC / Corporación" en el
  navbar de servicios lleva a `/#pricing` plano sin preseleccionar la entidad.
  Si en el futuro se quiere recuperar esa preselección, hay que agregar lógica
  en el home para leer el query param y activar el toggle LLC/Corp al cargar.
