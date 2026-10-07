---
title: "Afiliados y Agentes"
summary: "Cómo se aprueban, cómo ganan comisión y cómo se les paga."
updated: "2026-10-07"
---

## Dos programas, un solo formulario

En **opabiz.com/afiliados** (y en mybusinessformation.com/afiliados) hay un formulario con dos botones para elegir cómo quiere participar la persona:

| | Afiliado | Agente |
|---|---|---|
| Qué hace | Recomienda clientes con un código de descuento | Atiende clientes y llena sus órdenes en OpaBiz Connect |
| Perfil típico | Preparador de impuestos, contador | Persona de campo, vendedor |
| Requisito | Número PTIN del IRS | PTIN, dirección, situación laboral y experiencia |
| Comisión por defecto | 15% | 25% |
| El cliente recibe | 10% de descuento | Nada extra |

Las solicitudes se revisan en **/admin/opabiz**, pestaña **"Afiliados y Agentes"**. Se filtran por estado (pendiente, aprobado, rechazado) y por tipo, y con **"Ver detalle"** se ven todos los datos que mandó la persona.

## Aprobar o rechazar

- **Afiliado aprobado:** el sistema le crea un **código de descuento** propio en Stripe (letras y números al azar) y se lo manda por email.
- **Agente aprobado:** se le crea la cuenta de OpaBiz Connect y le llega un email con el link para crear su contraseña. Lo primero que hace adentro es el entrenamiento (ver el capítulo "OpaBiz Connect").
- **Rechazado:** le llega un email avisándole.

Los emails salen en el idioma en que la persona llenó la solicitud. La comisión de cada uno se puede cambiar desde el panel.

## Cómo se gana la comisión

**Afiliado:** cuando un cliente paga usando su código:
- El cliente tiene 10% de descuento.
- El afiliado gana su porcentaje sobre **nuestras tarifas de servicio**, nunca sobre las tarifas del Estado (eso es dinero del gobierno).

**Agente:** cuando un cliente paga una orden que el agente llenó por él en OpaBiz Connect, gana su porcentaje sobre nuestras tarifas de servicio. Para que se le cuente, su solicitud tiene que estar vinculada a su cuenta de OpaBiz Connect. Al aprobarlo se vincula solo, y si no, se hace desde "Ver detalle". Las órdenes que hizo antes de estar vinculado no generan comisión.

Todo se calcula y se anota solo al momento del pago. En el panel, **"Historial"** muestra las comisiones de cada persona.

## Cómo se paga

- Una comisión **se vence** cuando la persona junta **$200**, o cuando pasan **2 meses** desde su primera venta, lo que pase primero.
- El pago se hace **a mano** (Zelle u otro medio). No lo hace el sistema.
- Después de pagar, toca **"Marcar como pagado"**. Eso deja el saldo en cero y anota el pago como gasto en Contabilidad, sin tener que cargarlo aparte.

