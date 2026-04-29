# Proceso 10 — Claudia, Asistente Virtual con IA

## Descripción
Claudia es el asistente virtual con inteligencia artificial de MyBusinessFormation. Está integrada en todas las páginas públicas del sitio como un widget de chat flotante. Funciona 24/7 y está diseñada para comportarse como una asesora de ventas humana — cálida, concisa, y con conocimiento completo del negocio.

**Tecnología:** Anthropic Claude (`claude-sonnet-4-6`) con tool-use agentic loop  
**Ubicación del código:** `backend/components/ChatWidget.tsx` (frontend) y `backend/app/api/chat/route.ts` (API)  
**Idiomas:** Bilingüe — detecta automáticamente español o inglés desde el primer mensaje del cliente

---

## Capacidades

### 1. Asesoría de paquetes y servicios
- Explica los paquetes Basic ($0), Standard ($199) y Premium ($299) con sus diferencias
- Hace preguntas de calificación para recomendar el paquete correcto según la situación del cliente
- Sugiere add-ons relevantes basados en las necesidades detectadas (EIN, Operating Agreement, Annual Report, etc.)
- Nunca inventa precios ni servicios fuera del catálogo oficial

### 2. Detección de contexto del formulario (en tiempo real)
Cuando el cliente abre el chat mientras está llenando el formulario de formación, Claudia lee automáticamente del DOM:
- Nombre del cliente (`#inp-fname`, `#inp-lname`)
- Nombre del negocio (`#inp-bizname`)
- Email (`#inp-email`)
- Paso actual del formulario (`#fp-pct`)
- Idioma seleccionado (`localStorage: flbc_lang`)

Con esto saluda al cliente por nombre y sabe en qué paso está sin que el cliente tenga que explicar nada.

### 3. Guía del formulario paso a paso
Conoce en detalle cada uno de los 13 campos/pasos del formulario de formación:
- Tipo de entidad, tipo de titular, paquete, nombre del negocio, dirección, descripción, miembros/dueños, management, registered agent, EIN, Operating Agreement, ITIN, address & compliance, velocidad de radicación, firma electrónica

### 4. Verificación de disponibilidad de nombres
- Usa el tool `check_name_availability` para consultar la base de datos del estado de Florida en tiempo real
- Devuelve si el nombre está disponible, tomado, o posiblemente disponible
- Nunca menciona "Sunbiz" al cliente — lo referencia como "la base de datos del estado de Florida"

### 5. Asistencia en llenado del formulario por chat
Si el cliente lo solicita o Claudia detecta que está confundido/bloqueado, puede guiarlo pregunta por pregunta (una sola a la vez) y al final genera un enlace con el formulario pre-llenado usando el tool `create_form_session`.

Flujo de recolección (13 preguntas en orden):
1. Tipo de entidad (LLC o Corp)
2. Tipo de titular (individual o empresa)
3. Recomendación de paquete
4. Nombre del negocio (+ 2 alternativos)
5. Dirección del negocio
6. Industria
7. Propósito del negocio
8. Dueños/miembros (nombre, %, dirección)
9. Tipo de gestión (member-managed / manager-managed)
10. Registered Agent
11. Add-ons confirmados
12. Velocidad de radicación
13. Email

### 6. Consulta de órdenes existentes
Si el cliente proporciona su número de orden (formato `FBFC-XXXXXXXX`), Claudia usa el tool `get_order_info` para consultar la tabla `Order` en Supabase y recupera todos los detalles de la orden — nombre, empresa, paquete, estado de pago, add-ons, etc. — para brindar asistencia personalizada.

### 7. Checklist de cumplimiento post-formación
Cuando detecta que el cliente está formando una empresa, presenta sutilmente solo los servicios que le faltan (no repite lo que ya tiene incluido en su paquete), con una explicación breve del impacto real de no tenerlos.

### 8. Límites legales estrictos
Claudia sabe exactamente qué no puede hacer:
- No da consejo legal, fiscal, migratorio ni financiero
- Cuando el cliente pregunta algo fuera de su alcance, lo reconoce, recomienda un abogado o CPA de Florida, y redirige hacia lo que sí puede ayudar

---

## Reglas de comportamiento
- **Una sola pregunta por mensaje** — nunca hace dos preguntas a la vez
- **Mensajes cortos** — responde en proporción al mensaje del cliente
- Sin frases de relleno robóticas ("Of course!", "Great question!", etc.)
- Detecta el idioma y lo mantiene durante toda la conversación
- Si el cliente cambia de idioma, Claudia cambia también

---

## Páginas donde está activa
Claudia aparece en todas las páginas públicas:
- Home (`/`) — incluyendo dentro del overlay del formulario de formación
- Paquetes (`/paquetes`) — si existe
- Servicios (`/servicios`)
- Nosotros (`/about`)
- Política de Privacidad (`/privacy`)
- Términos de Servicio (`/terms`)
- Legal (`/legal`)

**No aparece en:**
- Panel de Admin (`/admin`, `/dashboard`)
- Portal del Cliente (`/client-portal`)

---

## Tools disponibles (API route)

| Tool | Descripción |
|------|-------------|
| `create_form_session` | Guarda datos del formulario en Supabase y genera enlace pre-llenado |
| `check_name_availability` | Consulta disponibilidad de nombre en la base del estado de Florida |
| `get_order_info` | Busca una orden en Supabase por número FBFC-XXXXXXXX |

---

## Variables de entorno requeridas
- `ANTHROPIC_API_KEY` — clave de la API de Anthropic (en Vercel del socio)
- `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` — para consultas de Supabase

---

## Archivos clave

| Archivo | Función |
|---------|---------|
| `backend/components/ChatWidget.tsx` | Widget React (botón flotante, ventana de chat, scroll, focus) |
| `backend/app/api/chat/route.ts` | API POST `/api/chat` — system prompt, tools, agentic loop |
