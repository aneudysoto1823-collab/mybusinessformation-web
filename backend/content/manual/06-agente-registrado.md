---
title: "Agente Registrado"
summary: "Cómo se activa el servicio con el proveedor, qué recibe el cliente y cómo se renueva."
updated: "2026-10-07"
---

## Qué es

Toda empresa de Florida está obligada a tener un **Agente Registrado**: una persona o empresa con dirección física en Florida que recibe en nombre de la empresa las notificaciones legales y del Estado. Lo ofrecemos como servicio para que el cliente no tenga que usar su propia dirección ni estar siempre disponible.

Nosotros no somos el agente directamente: el servicio lo presta un proveedor mayorista, **RegisteredAgentsInc (Corporate Tools)**. **El cliente nunca ve el nombre del proveedor**: para él, el servicio es de OpaBiz.

## Cuánto cuesta y cuándo se cobra

- **Standard y Premium:** el primer año va incluido en el paquete.
- **Basic:** si el cliente elige nuestro agente, se cobra {{precio:agente-basic}} el primer año.
- **Comprado suelto** en /servicios: el primer año es gratis si lo compra junto con otro servicio. Solo, cuesta lo mismo que la renovación.
- **Renovación:** cada año, automática, al mismo precio. 30 días antes el cliente recibe un aviso por email. Ver el capítulo "Pagos con Stripe".

Si el cliente decide ser su propio agente, no se cobra nada: solo se guarda la dirección que nos da.

## Cómo se activa

Cuando un cliente paga una orden con nuestro agente, el sistema hace todo solo, en segundos. Vale tanto para la formación del home como para el agente comprado suelto o en un combo en /servicios, en los dos sitios:

1. Crea la empresa del cliente en el sistema del proveedor.
2. Activa el servicio de agente para Florida. El proveedor asigna la dirección al instante.
3. Busca la factura que nos cobra el proveedor por ese servicio.
4. Le manda al cliente un email **"Su Agente Registrado está activo"** con la dirección que tiene que usar, con la marca del sitio donde compró.

Todo queda guardado en la orden, en la sección **"Registered Agent (RAI Provisioning)"**: el estado, los códigos del proveedor, el número de factura y la dirección.

## Lo que hace el equipo a mano

- **Pagarle la factura al proveedor.** No es automático a propósito. En la orden aparece el número de factura; se paga desde el portal del proveedor.
- **Si la activación falla**, llega una alerta a alert@opabiz.com que dice en qué paso falló. En la orden aparece el botón **"Retry RA provisioning"**: vuelve a intentar solo los pasos que faltaron, sin crear nada duplicado ni generar facturas nuevas.

## Si el cliente cancela

El cliente cancela la renovación desde su portal. Llega una alerta al equipo. Pendiente de confirmar con el proveedor cuánto aviso previo exigen para dar de baja un servicio (se cree que unos 3 meses); de eso depende si el aviso de renovación tiene que salir antes de los 30 días actuales.
