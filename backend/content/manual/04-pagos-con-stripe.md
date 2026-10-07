---
title: "Pagos con Stripe"
summary: "Cómo cobramos, cómo funcionan las renovaciones automáticas, los códigos de descuento, los reembolsos y los contracargos."
updated: "2026-10-06"
---

## Qué es Stripe

Stripe es la empresa que procesa los pagos con tarjeta. El cliente escribe los datos de su tarjeta en un formulario de Stripe que aparece dentro de nuestra página. **Nosotros nunca vemos ni guardamos el número de la tarjeta**; eso lo maneja Stripe.

En el estado de cuenta bancario del cliente, el cobro aparece como **OPABIZ.COM** (compras en opabiz.com) o **MYBIZFORMATION** (compras en mybusinessformation.com).

## Modo de prueba y modo real

Stripe tiene dos modos separados:

- **Prueba:** se usan tarjetas de mentira (por ejemplo, 4242 4242 4242 4242) y no se mueve dinero real.
- **Real (Live):** se cobran tarjetas de verdad.

**Hoy el sitio está en modo de prueba.** El modo real ya está preparado en Stripe, pero no se activa hasta resolver estos pendientes:

- Comprar el seguro de responsabilidad profesional de la compañía.
- Pasar ZeroBounce (verificación de emails) a plan pago.
- Pasar Resend (envío de emails) a plan pago.
- Cambiar los logos de MyBiz y OpaBiz.

Activarlo es un solo interruptor para todo el sitio: no hay forma de cobrar real en una página y de prueba en otra.

## El precio lo calcula el sistema, no el navegador

Cuando el cliente paga, el sistema vuelve a calcular el total desde cero con los precios oficiales. Aunque alguien modificara el precio en su navegador, se le cobra el precio correcto.

## Servicios que se renuevan solos

Agente Registrado y Declaración Anual se cobran cada año automáticamente, hasta que el cliente cancele:

- La tarifa del estado de la Declaración Anual se cobra como línea aparte, para que el cliente vea qué es nuestro y qué es del gobierno.
- 30 días antes de cada renovación, el cliente recibe un aviso por email. Si su tarjeta guardada vence antes de esa fecha, el mismo aviso se lo dice y le pide actualizarla.
- **El cliente cancela desde su portal**, con un botón propio que le pide el motivo y una confirmación. Puede reactivar después si cambia de idea.
- **Cambiar la tarjeta** también se hace desde el portal, sin salir del sitio.

## Si una renovación no se puede cobrar

Pasa cuando la tarjeta venció, no tiene fondos o el banco la rechaza. El sistema avisa solo:

- **Al equipo:** email a alert@opabiz.com y aviso por Telegram, con el cliente, el servicio, el monto, el número de intento y la fecha del próximo intento.
- **Al cliente:** email con un botón para actualizar la tarjeta y pagar, y la fecha en que se va a reintentar el cobro, para que lo resuelva antes.
- **En el panel:** el contador **Pagos Fallidos** del panel principal muestra cuántas hay, con la lista y un link a cada orden. Dentro de la orden, la suscripción aparece como "Pago fallido".
- **En el portal del cliente:** la suscripción aparece como "Problema de pago".

**Qué hacer:** si después de un par de días sigue en "Pago fallido", escríbele o llámalo al cliente. Si actualiza la tarjeta y el cobro pasa, todo vuelve a "activa" solo.

**Reintentos:** Stripe reintenta el cobro varias veces durante algunos días. Cuántas veces y qué pasa cuando se acaban los intentos (cancelar la suscripción o dejarla impaga) se configura en el panel de Stripe: Settings, Billing, "Manage failed payments". Si se cancela, llega otra alerta de "suscripción cancelada".

## Códigos de descuento

En el formulario de pago hay un campo para escribir un código de descuento.

- **Los códigos se crean en el panel de Stripe**, no en nuestro sitio. Hay que crearlos por separado en modo de prueba y en modo real.
- **Los afiliados** tienen su propio código (10% de descuento para el cliente). Se crea solo cuando se aprueba al afiliado. Ver el capítulo "Afiliados y Agentes".

## Reembolsos

1. El reembolso se hace **directamente en el panel de Stripe**, buscando el pago del cliente. No hay botón de reembolso en nuestro sitio.
2. En cuanto lo haces, el sistema lo refleja solo: la orden pasa a "reembolsada" en el panel y se ajusta la contabilidad.

**Ojo:** las órdenes pagadas antes del 7 de julio de 2026 no se actualizan solas al reembolsarlas. Hay que ajustarlas a mano.

## Contracargos (disputas)

Un contracargo es cuando el cliente le dice a su banco que no reconoce el cobro y el banco nos quita el dinero mientras investiga.

- Cuando se abre uno, llega una **alerta por email** al equipo.
- La orden se marca como "en disputa" en el panel.
- La respuesta al banco (con pruebas: confirmación del cliente, términos aceptados, documentos entregados) se hace desde el panel de Stripe, dentro del plazo que indica.
- Cuando se cierra, el sistema actualiza la orden solo.

## Si un pago no aparece

- **El cliente pagó pero la orden sigue "pendiente":** casi siempre es que Stripe no pudo avisarle al sitio. En el panel de Stripe, en la sección de webhooks, busca el evento fallido y tócale **Resend**. La orden se actualiza y salen los emails.
- **Aviso de "pago sin orden" por Telegram:** revisar con Claude antes de hacer nada; nunca volver a cobrarle al cliente.
