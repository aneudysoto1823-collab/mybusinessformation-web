---
title: "Pendientes y decisiones abiertas"
summary: "Lo que falta para el lanzamiento y las decisiones de negocio todavía sin cerrar."
updated: "2026-10-07"
---

Esta lista cambia seguido. La lista técnica completa está en `CHECKLIST_PRELANZAMIENTO.md`, dentro del proyecto.

## Antes de cobrar en real (Stripe Live)

Stripe ya está preparado. Antes de activarlo hay que resolver todo esto:

1. **Seguro de responsabilidad profesional** de la compañía.
2. **Pasar ZeroBounce a plan pago**: el gratis (100 verificaciones por mes) se acaba en días con volumen real.
3. **Pasar Resend a plan pago**: el gratis tiene un solo cupo de envíos para todo y llegó al límite de dominios. Al pasarlo, agregar el dominio de envío de las cartas de OpaBiz.
4. **Cambiar los logos** de MyBiz y OpaBiz.
5. **Configurar los reintentos de cobro** en Stripe (prueba y real): Settings, Billing, "Manage failed payments". Lo recomendado: reintentos durante 1 mes, cancelar al final y no activar los emails propios de Stripe.
6. **Poner el sistema en cero**: borrar los datos de prueba después de un respaldo, con una simulación previa aprobada por los dos socios. **No usar** el botón "Poner en cero" de Contabilidad, porque borra también los gastos reales.
7. **Revisión de abogado** de los Términos y la Política de Privacidad.
8. Confirmar que las claves de Turso estén cargadas también en Railway (sin ellas, el buscador de nombres del panel dice "disponible" a todo sin avisar).

## Decisiones de negocio pendientes

- **Precio del procesamiento acelerado:** el sistema cobra {{precio:acelerado}}, pero documentos viejos decían $79. Confirmar cuál es el correcto.
- **Combo de dominio, teléfono y email:** falta fijar los precios (línea sola por menos de $25 al mes, dominio, email y el combo) y decidir si se vende solo con la formación o también suelto. El email depende de la respuesta de Zoho.
- **Aviso de cancelación del Agente Registrado:** averiguar con el proveedor cuánto aviso exigen para dar de baja un servicio. Si son 3 meses, el aviso de renovación tiene que salir antes.
- **Dirección Virtual:** sacada del sitio hasta conseguir proveedor. El precio sigue guardado para reactivarla.
- **Guía de configuración de Stripe:** tarjeta en /servicios que dice "Coming soon", a definir con el socio.
- **Entrenamiento de los agentes:** contenido y formato sin definir.

## Arreglos pendientes encontrados

- **Agente Registrado comprado suelto** (en /servicios o en el combo de cumplimiento): se cobra, pero no se activa solo con el proveedor ni le llega la dirección al cliente. Hoy hay que hacerlo a mano.
- **Notificaciones en iPhone de OpaBiz Connect:** solo funcionan con la app instalada en la pantalla de inicio. Falta una guía en la app que se lo explique al agente.
- **Textos del portal del cliente:** prometen "3 a 5 días hábiles" para la aprobación del Estado (no controlamos ese plazo) y tutean al cliente, cuando la regla del sitio es usar "usted".
- **Documentos prellenados del panel:** ofrecen el Operating Agreement en Standard y el DBA en Premium, aunque esos paquetes no los incluyen.

## Ideas para más adelante

- **Pregúntale al manual:** hacerle preguntas a este manual y que la IA responda con el link a la sección.
- **Blog** del sitio, junto con las guías.
- **Teléfono oficial** del negocio, para mostrarlo en Google.
- Listar el negocio en **directorios** (Google Business, Bing, Yelp, BBB) para ganar visibilidad.
- **Recordatorio al cliente** antes de su cita.
