---
title: "OpaBiz Connect"
summary: "La app de los agentes de campo: asignación de órdenes, avisos y citas."
updated: "2026-10-07"
---

## Qué es

**OpaBiz Connect** es la app interna para los **agentes**: las personas que atienden a clientes en persona o por teléfono, hacen citas y ayudan a llenar órdenes. Es distinta del sitio público, y el cliente nunca la ve.

- Los agentes entran en **opabiz.com/opabiz/login**.
- El equipo la administra desde **/admin/opabiz**, con tres pestañas: **Empleados**, **Órdenes** y **Afiliados y Agentes**.

## Dar de alta a un agente

Hay dos caminos:

- **Desde el programa de agentes:** cuando se aprueba la solicitud de un agente en la pestaña "Afiliados y Agentes", se crea su cuenta sola y le llega un email con el link para crear su contraseña. Ver el capítulo "Afiliados y Agentes".
- **A mano:** en la pestaña **Empleados**, con el botón **"Crear Empleado"**.

El link de invitación vence a las 72 horas. Si no lo usó a tiempo, se puede **reenviar** desde el panel.

Desde la misma pestaña se puede **activar o desactivar** una cuenta. Un agente desactivado no puede entrar y no recibe órdenes.

## Qué ve el agente

- **Sus órdenes asignadas**, ordenadas por prioridad, con el botón para **aceptar** o **rechazar** (con un motivo).
- **Su perfil**, con foto, que puede editar.
- **"Mis solicitudes enviadas"**: las órdenes que llenó en nombre de clientes.
- **Notificaciones**: un interruptor para recibir avisos en el celular cuando le asignan una orden. En iPhone solo funcionan si la app está instalada en la pantalla de inicio (desde Safari: Compartir, Agregar a pantalla de inicio).
- Botón **EN/ES** para el idioma.

Puede recuperar o cambiar su contraseña él mismo desde el login.

## Cómo se asignan las órdenes

Cuando hay una orden para atender (por ejemplo, una cita agendada), el sistema elige al mejor agente disponible:

1. Solo considera agentes marcados como **disponibles**.
2. Entre ellos, elige al de **mayor puntaje**.
3. Si hay empate: el que tenga menos órdenes vencidas, después el que responde más rápido, y después el que lleva más tiempo sin recibir nada.

El agente recibe la orden con un aviso por email y, si las activó, por notificación en el celular.

**Si no la acepta en 10 minutos**, se la pasa al siguiente mejor agente y al primero se le anota una inactividad. Si ya nadie disponible la aceptó, la orden queda en **pendiente** y alguien del equipo tiene que asignarla a mano.

## Puntaje

- **+10 puntos** por cada orden completada.
- **+10 puntos** por cada orden que llena en nombre de un cliente (intake asistida).
- Cada orden que deja vencer sin aceptar se anota como inactividad, y eso lo baja en la prioridad de asignación.

Hay niveles (básico, intermedio, avanzado, administrador). Por ahora cualquier nivel puede recibir cualquier tipo de orden.

## De una cita a una orden

En **/admin/citas**, cada cita tiene un botón para convertirla en una orden de OpaBiz Connect y asignársela a un agente. El agente ve la orden con los datos del cliente y la hora de la cita, y **1 hora antes** le llega un recordatorio.

## Llenar una orden en nombre del cliente (intake asistida)

El agente puede hacer la orden por el cliente, usando el mismo formulario público del sitio:

1. Desde su panel entra al formulario en **modo agente** (opabiz.com/?agent=1).
2. Lo llena con los datos del cliente, como si fuera él.
3. En el último paso no aparece el pago: en su lugar toca **Guardar**.
4. Al cliente le llega un email con el link para revisar su orden y pagar.

Mientras llena el formulario, el agente tiene a **Claudia Agente** (abajo a la izquierda, con la foto de Claudia). Le puede preguntar lo que necesite, escribiendo o dictando con el micrófono, y Claudia le sugiere qué responderle al cliente. En este modo no aparece la Claudia normal del sitio, para no confundir.

**Si el agente se equivocó en algo**, desde **"Mis solicitudes enviadas"** puede volver a abrir la orden para corregirla o reenviarle el email al cliente, mientras el cliente todavía no haya pagado.

## Comisión del agente

Si el agente forma parte del programa de agentes, cada orden que llenó por un cliente y que el cliente paga le genera una comisión. Ver el capítulo "Afiliados y Agentes".
