---
title: "Citas"
summary: "Cómo agenda el cliente, cómo asignar, atender o cancelar y cómo bloquear horarios."
updated: "2026-10-14"
---

## Qué es

Un sistema de citas propio (no usamos Calendly ni nada externo). El cliente agenda una llamada para hacer preguntas o recibir ayuda.

- El cliente agenda en **opabiz.com/booking**.
- El equipo las maneja en **/admin/opabiz**, pestaña **Citas** (el link viejo /admin/citas lleva ahí).

## Horario

- **Lunes a sábado, de 9:00 am a 7:00 pm** (hora de Florida). Domingo cerrado.
- Cada cita dura **30 minutos**, con 10 minutos de margen entre una y otra.
- Hay **15 turnos por día**: 9:00, 9:40, 10:20, 11:00, 11:40, 12:20, 1:00, 1:40, 2:20, 3:00, 3:40, 4:20, 5:00, 5:40 y 6:20.

## Cómo agenda el cliente

1. Elige el día en un calendario y un horario libre.
2. Deja su nombre, email, teléfono y, si quiere, una nota.
3. Elige cómo quiere la reunión: **llamada telefónica** o **WhatsApp**.

Al cliente le llega un email de confirmación con dos botones: **Reprogramar** y **Cancelar**. Puede hacer cualquiera de las dos cosas él mismo, sin escribirnos. Al equipo le llega un aviso con sus datos y un link directo a su WhatsApp.

Las páginas de reprogramar y cancelar funcionan en inglés y en español.

## En el panel

En **/admin/opabiz**, pestaña **Citas**, ves todas las citas. Está dentro de OpaBiz Connect para ver citas, agentes y órdenes sin cambiar de pantalla. Arriba las próximas (la más cercana primero) y abajo las que ya pasaron. Cada cita tiene uno de estos estados:

- **Pendiente:** nadie la tiene asignada todavía.
- **Asignada:** ya tiene un agente.
- **Atendida:** ya se atendió al cliente.
- **Cancelada.**

El estado cambia solo: al asignar un agente pasa a Asignada, y cuando el agente marca la orden como completada en OpaBiz Connect pasa a Atendida. La columna **Agente** muestra quién la tiene y si ya la aceptó ("Por aceptar" o "Aceptada"). La pantalla se actualiza sola cada 20 segundos.

Desde ahí puedes:

- **Asignar agente:** convierte la cita en una orden de OpaBiz Connect para ese agente, que recibe un recordatorio 1 hora antes. Ver el capítulo "OpaBiz Connect".
- **Marcar atendida:** para cuando la atiendes tú, sin pasar por un agente.
- **Cancelar** una cita. Pide confirmación antes, para evitar cancelar una por error. Cancelar desde el panel no le avisa al cliente.

## Bloquear horarios

En la pestaña **"Horarios Bloqueados"**:

- **Fechas específicas:** un día suelto o un rango de días (vacaciones, feriados). Se pueden juntar varios rangos y bloquearlos todos a la vez.
- **Día de la semana fijo:** por ejemplo, todos los sábados. Cada bloqueo de este tipo se puede **pausar** sin borrarlo, con el botón "Activo / Pausado".

Los horarios bloqueados desaparecen solos de la página de agendar.

## Lo que todavía no hace

- No manda **recordatorio al cliente** antes de la cita. El recordatorio de 1 hora antes solo le llega al agente de OpaBiz Connect.
