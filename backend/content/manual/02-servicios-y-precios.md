---
title: "Servicios y precios"
summary: "Paquetes de formación, servicios sueltos, combos y tarifas del estado. Los precios se leen directo del sistema."
updated: "2026-10-06"
---

> Todos los precios de este capítulo salen directamente del sistema que cobra. Si un precio cambia, este capítulo se actualiza solo en el siguiente deploy.

## Cómo se arma un precio

Casi todo lo que vendemos tiene dos partes:

1. **Nuestra tarifa de servicio:** lo que cobramos por preparar y presentar el trámite.
2. **La tarifa del estado** (o del IRS): lo que cobra el gobierno. La pagamos nosotros en nombre del cliente y se la cobramos aparte, en una línea separada, para que vea claramente qué es nuestro y qué es del gobierno.

Algunos trámites no tienen tarifa del gobierno (por ejemplo, el EIN es gratis en el IRS). En esos casos el cliente solo paga nuestro servicio.

## Paquetes de formación (opabiz.com)

Es lo que el cliente elige en el home cuando quiere formar una empresa nueva.

{{precios:paquetes}}

A eso se le suma siempre la **tarifa del estado de Florida**: {{precio:estatal-llc}} para una LLC o {{precio:estatal-corp}} para una Corporación.

**Agente registrado según el paquete:**
- En **Standard y Premium**, el primer año va incluido. Después se renueva a precio normal.
- En **Basic**, si el cliente elige nuestro agente registrado, se cobra {{precio:agente-basic}} el primer año.
- Si el cliente decide ser su propio agente, no se cobra nada en ningún paquete.

**Procesamiento acelerado:** cuesta {{precio:acelerado}} y es gratis con Premium. Solo aparece en el resumen cuando el cliente llega a ese paso (no se lo mostramos cobrado antes de ofrecérselo).

## Servicios extra dentro de la formación

Mientras arma su formación, el cliente puede sumar estos servicios:

{{precios:addons-formacion}}

El Nombre Ficticio (DBA) además lleva la tarifa del estado de {{precio:dba-estatal}}.

**Lo que ya viene en el paquete no se vuelve a ofrecer:** con Standard no se le ofrece el EIN, y con Premium no se le ofrecen ni el EIN ni el Operating Agreement, porque ya los tiene incluidos.

## Servicios sueltos

Se venden en /servicios (opabiz.com) y en mybusinessformation.com, para empresas que ya existen o para quien solo necesita un trámite.

{{precios:servicios}}

La última columna muestra si el precio cambia en MyBiz. Hoy la única diferencia es el EIN.

**Servicios que se renuevan solos** ("por año" o "por mes"): se cobran automáticamente cada período hasta que el cliente cancele desde su portal. Ver el capítulo "Pagos con Stripe".

## Combos

Un combo agrupa varios servicios con descuento. Cuando el cliente elige un combo, sus servicios no se cobran por separado: se cobra el precio del combo más las tarifas del estado que correspondan.

{{precios:combos}}

**Si el cliente ya tenía uno de los servicios del combo en su carrito**, el combo no le vuelve a cobrar ese servicio: solo cobra lo nuevo, con {{precio:descuento-combo}} de descuento. Así nunca paga dos veces lo mismo.

## Servicios que no se venden por ahora

- **Dirección Virtual:** se sacó del sitio porque todavía no tenemos proveedor. El precio sigue guardado en el sistema para reactivarla cuando se consiga uno.

## Cambiar un precio

Los precios viven en el código del sitio, no en un panel. Para cambiar uno, pídeselo a Claude indicando el servicio y el precio nuevo. El cambio se aplica a la vez en el checkout, los emails, el resumen de la orden y este manual.
