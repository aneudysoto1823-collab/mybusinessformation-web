---
title: "Cancelación de suscripciones"
summary: "Cómo cancelar o reactivar desde el panel admin una suscripción (Agente Registrado, Declaración Anual o Dirección Virtual) de cualquier orden, de cualquiera de los dos sitios."
updated: "2026-10-09"
---

## Qué se puede cancelar

Las suscripciones son los servicios que se cobran solos cada año (o cada mes): **Agente Registrado**, **Declaración Anual** y la **Dirección Virtual** (ya no se vende, pero hay órdenes viejas que la tienen).

El botón de cancelar es **el mismo para todas las órdenes**, sin importar de dónde vinieron:

- Un paquete de formación de opabiz.com.
- Un servicio suelto de opabiz.com.
- Una orden de mybusinessformation.com.

Cada suscripción tiene un número único en Stripe (empieza con `sub_`), y el panel cancela por ese número. Por eso no importa la marca ni el tipo de orden.

## Cómo cancelar

1. En el panel de administración abre la orden (botón **Ver** en la tabla).
2. Baja hasta la sección **Suscripciones recurrentes**. Ahí aparece cada suscripción con su estado y la próxima fecha de cobro.
3. Toca **Cancelar** en la suscripción que quieres cortar.
4. Elige **cuándo** se cancela (ver abajo).
5. Elige el **motivo**. Es obligatorio. Si es una orden de prueba, un error o un servicio que ya no damos, usa **Otro** y explícalo en el comentario.
6. Decide si se **avisa al cliente por email** (viene marcado). Desmárcalo en órdenes de prueba o si ya hablaste con el cliente.
7. Toca **Cancelar suscripción** y confirma.

En unos segundos el estado cambia solo: **Cancelada** (si fue inmediata) o **Cancelación programada** (si fue al final del período).

## Inmediata o al final del período

- **Inmediata:** el servicio se corta en el momento. Si había un cobro fallido pendiente, se anula, así que Stripe deja de reintentar y **dejan de llegar las alertas de "Subscription payment failed"**. No se puede deshacer: si el cliente lo quiere de nuevo, tiene que volver a comprarlo.
- **Al final del período:** el cliente sigue teniendo el servicio hasta la fecha que ya pagó y después no se renueva. Es lo mismo que pasa cuando el cliente cancela desde su portal.

Regla práctica: si el cliente ya pagó el año y solo no quiere renovar, usa **al final del período**. Si es una orden de prueba, un error, o una suscripción con pago fallido que hay que cortar ya, usa **inmediata**.

## Suscripciones con "Cancelación programada"

Si una suscripción dice **Cancelación programada**, ya alguien la canceló para el final del período: el cliente desde su portal, el equipo desde este panel, o directo en Stripe. En vez de "Próximo cobro" dice **"Termina"** con la fecha en que se corta, porque esa fecha ya no se cobra.

Con estas suscripciones hay dos botones:

- **Cancelar:** la corta **ya**, sin esperar a la fecha de fin. La ventana solo ofrece la opción inmediata y no manda otro email al cliente (el aviso ya se manejó cuando se programó). No se puede deshacer.
- **Reactivar:** quita la cancelación programada. La suscripción vuelve a renovarse sola en su fecha, como si nunca se hubiera cancelado. Úsalo si el cliente se arrepiente y quiere seguir. No le llega ningún email al cliente; si quieres, avísale tú.

Reactivar solo funciona mientras la suscripción no haya terminado. Si ya dice **Cancelada**, no se puede revivir: el cliente tiene que volver a comprar el servicio.

## Qué queda registrado

- **Notas de la orden:** se agrega una línea con la fecha, el servicio, el tipo de cancelación, el motivo y si se avisó al cliente.
- **Stripe:** el motivo y el comentario quedan guardados en la suscripción.
- **Registro de auditoría** del panel (quién canceló y cuándo).
- **Alerta interna:** llega a alert@opabiz.com el aviso de "Subscription canceled", como con cualquier cancelación.

## Qué recibe el cliente

Si dejaste marcado **Avisar al cliente por email**, le llega un correo con la marca correcta (OpaBiz o Florida Business Formation Center):

- Si fue **inmediata**: que el servicio ya no está activo.
- Si fue **al final del período**: hasta qué fecha sigue teniendo el servicio.

Si lo desmarcaste, el cliente no recibe nada.

## Cuidado

- **Agente Registrado:** si se cancela, la empresa del cliente se queda sin agente registrado ante Florida y tiene que poner otro. Antes de cancelar uno real, habla con el cliente.
- **Órdenes de prueba:** las que se hicieron en modo de prueba de Stripe se cancelan igual con este botón. No mueven dinero real.
- El cliente también puede cancelar sus propias suscripciones desde su portal (ver el capítulo del portal del cliente). Este botón es para cuando lo hace el equipo.
