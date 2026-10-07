---
title: "Procesar una orden en el panel"
summary: "Los estados de una orden, qué hacer en cada uno y cómo entregarle los documentos al cliente."
updated: "2026-10-07"
---

Todo el trabajo sobre una orden se hace en su página de detalle: en el panel de administración, toca la orden en la lista. La página se actualiza sola cada 20 segundos, así que si entra un pago o un reembolso mientras la tienes abierta, lo ves sin recargar.

## Los estados de una orden

Una orden avanza siempre en este orden:

| Estado | Qué significa | Qué hace el equipo |
|---|---|---|
| **Pending** | Se creó pero todavía no está pagada | Nada. Si el cliente no paga, se queda así |
| **In review** | Pagada. Hay que revisarla | Revisar los datos y el nombre de la empresa |
| **Ready to file** | Revisada y lista para presentar | Presentarla ante el Estado de Florida |
| **Filed** | Presentada ante el Estado | Esperar la aprobación |
| **Approved** | El Estado la aprobó | Entregarle los documentos al cliente |
| **Completed** | Todo entregado. Orden cerrada | Nada más |

Cuando el cliente paga, la orden pasa sola a **In review**. De ahí en adelante, cada paso lo marca el equipo con los botones de la sección **Gestión de Estado**.

## Paso a paso

### 1. Revisar (In review)

Revisa los datos del cliente, la empresa, los dueños y lo que compró. En la alerta interna que llegó al pagar está el resultado del chequeo del nombre contra el registro de Florida:

- **Verde:** el nombre parece disponible.
- **Rojo:** ya existe una empresa con ese nombre.
- **Ámbar:** hay nombres parecidos; conviene mirarlo.

Si todo está bien, toca **"Nombre disponible → Ready to file"**.

### 2. Presentar (Ready to file)

Presenta el trámite ante el Estado de Florida. Para ayudarte, en la sección **Pre-filled Documents** de la orden puedes ver y descargar documentos ya llenados con los datos del cliente. Arriba aparecen los que compró (siempre Articles of Organization y BOI, más la solicitud del EIN, el Operating Agreement o el DBA si los tiene). Abajo, en **"Otros documentos disponibles"**, están los que no compró, por si después los pide.

Cuando lo presentaste, toca **"Filed"**. Eso le manda al cliente el email **"Orden Procesada"**, que le avisa que su trámite ya está presentado ante el Estado.

**Órdenes con procesamiento acelerado:** si el equipo no marca "Filed" a tiempo, el sistema le manda ese mismo email al cliente solo, alrededor de 24 horas después del pago (respetando fines de semana, feriados de Florida y horario de día). En ese caso, en la orden aparece un aviso verde y el botón "Filed" ya no lo reenvía. El sistema solo manda el email: el estado lo sigue cambiando el equipo.

### 3. Aprobada (Filed → Approved)

Cuando el Estado aprueba, toca **"Approved"**. Este botón **no le avisa nada al cliente**: es solo para que el equipo sepa en qué está la orden.

### 4. Entregar los documentos

Con la orden en **Filed** o **Approved** aparece la sección **"Enviar documento(s) al cliente"**:

1. Marca qué quedó listo en esta entrega (la formación, el EIN, el Operating Agreement, etc.).
2. Si quieres, escribe el **número de documento del Estado** (por ejemplo L26000123456).
3. Adjunta uno o varios archivos.
4. Toca **"Enviar al cliente"**.

El cliente recibe un email que le dice qué está listo, qué sigue en proceso, y con los archivos adjuntos.

- **Se puede entregar por partes.** Lo que ya se entregó queda marcado como "ya entregado" y no se vuelve a ofrecer en la siguiente entrega.
- **Cuando no queda nada pendiente**, la orden pasa sola a **Completed**.
- **Sin archivo:** para mandar el aviso sin adjuntar nada, marca "Enviar sin adjuntar archivo". Sin esa casilla, el botón no se activa si no hay archivo.

## Si el nombre ya está tomado

Hoy casi no pasa, pero si el nombre resulta no disponible:

1. Toca **"Nombres tomados → Names taken"**.
2. Aparece un **buscador de nombres**: escribe hasta 10 alternativas, una por línea, y el sistema te dice cuáles están disponibles.
3. Toca **"Enviar sugerencias al cliente"** para mandarle las disponibles.
4. Cuando el cliente responde, toca **"Cliente respondió → In review"** y sigue desde el paso 1.

Recuerda: si Florida rechaza el nombre, el nuevo intento no lleva cargo de servicio, pero la nueva tarifa del Estado la paga el cliente (está en los términos).

## Otras secciones de la orden

- **Notas internas:** texto libre que solo ve el equipo. Úsalo para dejar constancia de llamadas, acuerdos o problemas.
- **Agente Registrado:** si el cliente lo compró, muestra si el servicio ya se activó con el proveedor y la dirección asignada. Ver el capítulo "Agente Registrado".
- **Suscripciones recurrentes:** qué servicios se renuevan solos y en qué estado están (activa, pago fallido, cancelada).
- **Acciones manuales:** para casos especiales. Permite poner cualquier estado a mano y reenviar la confirmación de la orden si al cliente no le llegó.

## Borradores

Las órdenes que el cliente empezó y no terminó **no aparecen** en la lista principal: están en **OrderDraft**, en el menú del panel. Sirve para ver quién se quedó a mitad de camino y, si conviene, contactarlo.
