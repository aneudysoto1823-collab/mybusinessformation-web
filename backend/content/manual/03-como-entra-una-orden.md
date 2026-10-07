---
title: "Cómo entra una orden"
summary: "El camino de una orden desde que el cliente empieza el formulario hasta que paga y recibe su confirmación."
updated: "2026-10-06"
---

## Las tres puertas de entrada

Una orden puede llegar por tres caminos:

1. **Formación de empresa** (home de opabiz.com): el cliente elige un paquete y llena un formulario por pasos.
2. **Servicios sueltos** (/servicios en opabiz.com o mybusinessformation.com): el cliente arma un carrito con uno o varios trámites.
3. **Ayudada por un agente** (OpaBiz Connect): un agente llena el formulario en nombre del cliente, en persona o por teléfono.

Las tres terminan en el mismo lugar: una orden en el panel de administración, con su número FBFC.

## Formación de empresa, paso a paso

1. **El cliente elige el paquete** (Basic, Standard o Premium) y el tipo de empresa (LLC o Corporación).
2. **Llena sus datos:** nombre de la empresa, su información de contacto, dirección del negocio, agente registrado, dueños o miembros.
3. **Elige la velocidad:** normal o acelerada.
4. **Puede sumar servicios extra** (EIN, Operating Agreement, licencias, etc.).
5. **Revisa todo** en la pantalla final.
6. **Paga** con tarjeta en un formulario de Stripe que aparece dentro de la misma página. El cliente nunca sale del sitio.
7. **Ve la pantalla de confirmación** con su número de orden, y le llega un email de confirmación con el detalle.

**El nombre de la empresa:** el cliente da un solo nombre. El sistema lo revisa contra el registro de Florida cuando se crea la orden, y el resultado (verde, rojo o ámbar) aparece en la alerta interna. Al cliente no se le muestra nada de esto, para no frenarlo.

## Guardar y continuar después

El cliente no tiene que terminar todo de una vez:

- Desde que completa sus datos, la orden queda **guardada como borrador**.
- Le llega un email con su número de orden y un botón **"Continue My Application"** que lo devuelve al formulario exactamente donde lo dejó, desde cualquier dispositivo.
- También puede tocar el botón de guardar en cualquier momento.
- Los borradores **no aparecen** en la lista de órdenes del panel, para no mezclarse con las reales. Se ven aparte en "OrderDraft".

**El SSN o ITIN nunca se guarda en el borrador**, por seguridad. Si el cliente vuelve, tiene que escribirlo de nuevo.

## Servicios sueltos

Funciona igual, pero más corto:

1. El cliente agrega servicios al carrito en /servicios.
2. Pasa a un formulario por pasos que solo pide lo que esos servicios necesitan (por ejemplo, si compra un EIN, le pide los datos del responsable).
3. Si la empresa ya existe, puede escribir su número de documento de Florida y el sistema completa solo los datos de la empresa.
4. En algunos pasos le ofrecemos combos con descuento.
5. Paga dentro de la página, igual que en la formación.

El carrito es **compartido** entre las páginas de MyBiz: lo que el cliente agrega en una página sigue ahí al pasar a otra.

## Qué pasa cuando el cliente paga

En cuanto el pago se confirma, el sistema hace todo esto solo:

- Marca la orden como **pagada** y la pasa a **En revisión**.
- Le manda al cliente el email de confirmación con su número de orden y el detalle de lo que compró.
- Avisa al equipo con una alerta interna (email a alert@opabiz.com y aviso por Telegram).
- Si compró una formación, le manda de regalo la Guía gratuita.
- Si compró Agente Registrado, activa el servicio con el proveedor y le manda al cliente un segundo email con la dirección de su agente.
- Si el pago vino con un código de afiliado, le registra la comisión al afiliado.

## Si algo no llegó

- **El cliente dice que no le llegó el email de confirmación:** revisa que la orden exista y esté pagada en el panel. Desde el detalle de la orden puedes reenviarlo con el botón "Reenviar Confirmación de Orden".
- **Llega un aviso de "pago sin orden" por Telegram:** Stripe cobró pero la orden no se creó. Es raro y requiere revisar con Claude; no le vuelvas a cobrar al cliente.

Lo que pasa después de que la orden entra está en el capítulo "Procesar una orden en el panel".
