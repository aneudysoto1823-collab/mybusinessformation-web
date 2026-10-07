---
title: "Emails automáticos"
summary: "Qué emails salen solos, cuándo y desde qué dirección, y cómo reenviar uno."
updated: "2026-10-07"
---

## Cómo salen los emails

Todos los emails del sistema se envían con **Resend**, un servicio de envío de emails. Los buzones donde el equipo lee y contesta están en **Zoho Mail**. Son dos cosas distintas: Resend solo envía, Zoho es donde llegan las respuestas.

**Remitente según la marca:**

| | OpaBiz | MyBiz |
|---|---|---|
| Emails al cliente | OpaBiz, desde noreply@opabiz.com | Florida Business Formation Center, desde noreply@mybusinessformation.com |
| Cuando el cliente responde, le llega a | info@opabiz.com | info@mybusinessformation.com |
| Marketing | marketing@opabiz.com | dirección propia para cartas de campaña |

Las **alertas internas** del equipo llegan todas a **alert@opabiz.com**, y las más importantes también por **Telegram**.

## Emails al cliente, en orden

**Mientras compra:**
- **Guarde su número de solicitud:** cuando empieza el formulario, con un botón para continuar donde lo dejó.
- **Su cuenta está lista:** si crea una cuenta sin haber comprado.

**Al pagar:**
- **Confirmación de pago:** número de orden, qué compró con el precio de cada cosa y los próximos pasos.
- **Guía gratuita:** si compró una formación, va adjunta en el mismo email.
- **Su Agente Registrado está activo:** con la dirección del agente, si lo compró.

**Mientras se procesa:**
- **Orden procesada:** cuando el equipo marca la orden como presentada ante el Estado (o sola, a las 24 horas, si pagó el acelerado).
- **Documentos listos:** cuando el equipo entrega documentos desde el panel. Dice qué está listo, qué sigue en proceso, y lleva los archivos.
- **Nombre no disponible / sugerencias de nombres:** solo si el nombre resulta tomado.

**Suscripciones:**
- **Su servicio se renueva pronto:** 30 días antes de cada renovación.
- **Actualice su tarjeta:** 5 días antes del cobro, solo si la tarjeta guardada vence antes.
- **Renovación exitosa:** después de cada cobro.
- **No se pudo procesar el pago:** si el cobro falla, con la fecha del próximo intento.
- **Su suscripción fue cancelada.**

**Otros:**
- **Citas:** confirmación, cambio de horario y cancelación.
- **Formulario de contacto:** le confirma al visitante que recibimos su mensaje.

Todos los emails al cliente salen en su idioma y con la marca del sitio donde compró.

## Alertas internas del equipo

| Alerta | Cuándo | Llega por |
|---|---|---|
| Orden pagada | Cada pago | Email y Telegram |
| Pago sin orden | Stripe cobró pero no se creó la orden | Telegram |
| Pago de suscripción fallido | Cada intento que falla | Email y Telegram |
| Suscripción cancelada | El cliente cancela o se termina | Email |
| Contracargo abierto | El banco del cliente disputa un cobro | Email |
| Falla del Agente Registrado | No se pudo activar con el proveedor | Email |
| Rebote o queja de spam | Un email no se pudo entregar o lo marcaron como spam | Email |
| Dominio de email caído | Revisión automática cada hora | Telegram |
| Mensaje de contacto | Alguien escribe por el formulario de /contact | Email a info@ |

## Reenviar un email

- **Confirmación de la orden:** en el detalle de la orden, en **Acciones manuales**, toca **"Reenviar: Confirmación de Orden"**.
- **Documentos:** se vuelven a mandar desde "Enviar documento(s) al cliente".

## Emails que rebotan

Si un email rebota (la dirección no existe) o el cliente lo marca como spam, el sistema guarda esa dirección en una **lista de bloqueo** y no le vuelve a mandar marketing, para cuidar la reputación de nuestros dominios.

## Darse de baja

Los emails de marketing y las campañas tienen un link para darse de baja. Quien se da de baja no vuelve a recibir campañas. Los emails de su propia orden sí le siguen llegando.
