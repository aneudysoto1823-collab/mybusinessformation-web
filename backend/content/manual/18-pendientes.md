---
title: "Pendientes y decisiones abiertas"
summary: "Lo que falta para el lanzamiento y las decisiones de negocio todavía sin cerrar."
updated: "2026-10-09"
---

Esta lista cambia seguido. La lista técnica completa está en `CHECKLIST_PRELANZAMIENTO.md`, dentro del proyecto.

## Antes de cobrar en real (Stripe Live)

Stripe ya está preparado. Antes de activarlo hay que resolver todo esto:

1. **Seguro de responsabilidad profesional** de la compañía.
2. **Pasar ZeroBounce a plan pago**: el gratis (100 verificaciones por mes) se acaba en días con volumen real.
3. **Pasar Resend a plan pago**: el gratis tiene un solo cupo de envíos para todo y llegó al límite de dominios. Al pasarlo, agregar el dominio de envío de las cartas de OpaBiz.
4. **Cambiar los logos** de MyBiz y OpaBiz.
5. **Configurar los reintentos de cobro** en Stripe (prueba y real): Settings, Billing, "Manage failed payments". Lo recomendado: reintentos durante 1 mes, cancelar al final y no activar los emails propios de Stripe.
6. **Poner el sistema en cero**: borrar los datos de prueba después de un respaldo, con una simulación previa aprobada por los dos socios. En contabilidad se borran solo los ingresos y clientes de prueba, nunca los gastos.
7. **Revisión de abogado** de los Términos y la Política de Privacidad.
8. Confirmar que las claves de Turso estén cargadas también en Railway (sin ellas, el buscador de nombres del panel dice "disponible" a todo sin avisar).

## Decisiones de negocio pendientes

- **Precio del procesamiento acelerado:** el sistema cobra {{precio:acelerado}}, pero documentos viejos decían $79. Confirmar cuál es el correcto.
- **Combo de dominio, teléfono y email:** proveedores elegidos (ResellerClub para dominio y email, Twilio para el teléfono). Falta fijar los precios (línea sola por menos de $25 al mes, dominio, email y el combo), decidir si se vende solo con la formación o también suelto, cambiar "Juan R Fabian" por OpaBiz en ResellerClub, y la respuesta de su soporte sobre el webmail seguro.
- **Plazos de cancelación del Agente Registrado:** averiguar con Registered Agents Inc dos cosas:
  - Cuánto aviso exigen para que un servicio **no se renueve**. Si son 3 meses, el aviso de renovación al cliente tiene que salir antes (hoy sale 30 días antes).
  - Una vez pedida la **baja del servicio**, a los cuántos días dejan de recibir la correspondencia de la empresa y de cargarla al portal del cliente. Hoy el sistema le da al cliente un margen provisorio de 30 días (capítulo 20); con la respuesta se ajusta ese margen para que la fecha que ve el cliente coincida con la real.
- **Dirección Virtual:** sacada del sitio hasta conseguir proveedor. El precio sigue guardado para reactivarla.
- **Guía de configuración de Stripe:** tarjeta en /servicios que dice "Coming soon", a definir con el socio.
- **Guías III (Cuenta de banco) y IV (Stripe):** en mejora, todavía no terminadas. Solo existen en español y con la marca OpaBiz. Cuando estén listas: versión en inglés, versión MyBiz y decidir si se regalan por email.
- **Galería de plantillas, segunda etapa:** sumar a /admin/plantillas los emails automáticos (confirmación de pago, pago fallido, renovación, cancelación, documentos listos, citas).

## Ideas para más adelante

- **Pregúntale al manual:** hacerle preguntas a este manual y que la IA responda con el link a la sección.
- **Blog** del sitio, junto con las guías.
- **Teléfono oficial** del negocio, para mostrarlo en Google.
- Listar el negocio en **directorios** (Google Business, Bing, Yelp, BBB) para ganar visibilidad.
- **Recordatorio al cliente** antes de su cita.
