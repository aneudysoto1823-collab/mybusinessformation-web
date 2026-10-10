---
title: "Cancelación de suscripciones"
summary: "Las dos formas de cancelar una suscripción (la renovación o el servicio), cómo se hace desde el panel admin y desde el portal del cliente, qué email recibe el cliente y qué hay que avisarle al proveedor."
updated: "2026-10-10"
---

## Qué se puede cancelar

Las suscripciones son los servicios que se cobran solos cada año: **Agente Registrado** y **Declaración Anual**. También quedan órdenes viejas con **Dirección Virtual**, que ya no se vende.

El botón de cancelar es **el mismo para todas las órdenes**, sin importar de dónde vinieron: un paquete de formación de opabiz.com, un servicio suelto, o una orden de mybusinessformation.com. Cada suscripción tiene un número único en Stripe (empieza con `sub_`) y se cancela por ese número.

El flujo es **igual en el panel admin y en el portal del cliente**: las mismas dos opciones, con los mismos textos.

## Las dos formas de cancelar

**1. Cancelar la renovación automática.** El servicio sigue funcionando normal hasta el último día ya pagado. En el Agente Registrado, eso quiere decir que hasta esa fecha seguimos recibiendo la correspondencia a nombre de su empresa y la publicamos en su portal de cliente. Después el servicio termina y no se renueva.

**2. Dar de baja el servicio.** El cliente no quiere seguir con el servicio, aunque su período pagado siga vigente. No se corta en el momento: hay un **margen de 30 días** desde que lo pide. Al cliente se le explica que es para que reciba también la correspondencia oficial que ya viene en camino (por dentro, también es el tiempo para darlo de baja con el proveedor, pero **al cliente nunca se le menciona al proveedor**). Hasta ese día seguimos recibiendo la correspondencia a nombre de su empresa y la publicamos en su portal; después ya no recibimos nada a su nombre. Si la renovación cae antes de esos 30 días, el servicio termina en la fecha de renovación (así nunca se le hace un cobro nuevo).

En las dos opciones:

- **No hay reembolso** del período ya pagado.
- **No se le cobra nada más.**

Estos dos puntos no se le repiten al cliente en la ventana ni en el email: ya están en los Términos (sección de servicios recurrentes), decisión del founder 2026-10-09.

### Qué opciones tiene cada servicio

| Servicio | Opciones | Margen al cancelar el servicio |
|---|---|---|
| Agente Registrado | Las dos | 30 días |
| Declaración Anual | Solo cancelar la renovación | No aplica |
| Dirección Virtual (órdenes viejas) | Las dos | Se corta el mismo día |

La Declaración Anual solo tiene "cancelar la renovación" porque es un trámite una vez al año: no llegan documentos a ninguna dirección.

> El margen de 30 días del Agente Registrado es provisorio. Todavía falta confirmar con Registered Agents Inc cuánto aviso exigen. Si piden otro plazo, se cambia en un solo lugar del sistema y todo (pantallas y emails) se actualiza solo.

## Cómo cancelar desde el panel admin

1. Abre la orden (botón **Ver** en la tabla de órdenes).
2. Baja hasta **Suscripciones recurrentes**.
3. Toca **Cancelar** en la suscripción.
4. Lee las dos opciones y marca una. Cada una dice exactamente hasta qué fecha sigue el servicio.
5. Elige el **motivo**. Es obligatorio. Si es una orden de prueba o un error, usa **Otro** y explícalo en el comentario.
6. Decide si se **avisa al cliente por email** (viene marcado).
7. Toca **Confirmar cancelación** y confirma.

## Cómo cancela el cliente desde su portal

En **Mis Suscripciones** toca **Cancelar**. Le aparecen las dos opciones, las dos visibles, cada una con su explicación y la fecha exacta. Marca una y toca **Confirmar Cancelación**. El motivo es opcional para el cliente. Al terminar ve la confirmación en pantalla y le llega el email.

## Qué email recibe el cliente

Uno de confirmación, en su idioma y con la marca de su orden (OpaBiz o Florida Business Formation Center), que explica exactamente lo que eligió:

- **Cancelar la renovación automática:** que el servicio sigue activo hasta la fecha, que hasta ese día seguimos recibiendo su correspondencia y la publicamos en su portal, y que después el servicio termina y no se renueva. Si cambia de opinión, puede reactivarla desde su cuenta.
- **Dar de baja el servicio:** la fecha exacta en que termina y el motivo de esa fecha. Si son los 30 días, que es para que reciba la correspondencia que ya viene en camino. Si la renovación cae antes, que termina el último día de su período ya pagado. Después de esa fecha ya no recibimos correspondencia a nombre de su empresa.

En el Agente Registrado, el email también le recuerda que su empresa tiene que designar un nuevo Agente Registrado ante Florida antes de esa fecha. En la Declaración Anual, que Florida la exige cada año.

## Avisarle al proveedor (Registered Agents Inc)

Cuando se cancela un **Agente Registrado** (cualquiera de las dos opciones), llega una alerta a **alert@opabiz.com** y a Telegram con el aviso **"ACCIÓN REQUERIDA: avisar a Registered Agents Inc..."**, el nombre de la empresa y la fecha en que termina.

Hoy ese aviso al proveedor **se hace a mano**: el sistema todavía no se conecta con Registered Agents Inc para dar de baja. Hazlo apenas llegue la alerta.

## Cómo se ve en el panel

En la sección **Suscripciones recurrentes** de la orden:

- **Renovación cancelada:** dice **"Termina"** con la fecha. Tiene dos botones:
  - **Reactivar:** quita la cancelación y la suscripción vuelve a renovarse sola. Sirve si el cliente se arrepiente.
  - **Cancelar:** para pasar a **dar de baja el servicio** (la opción de renovación aparece marcada como "ya elegida").
- **Baja del servicio en curso:** dice **"Termina"** con la fecha, sin botones. Ya no se puede reactivar, porque la baja ya se le avisa al proveedor.
- **Cancelada:** el servicio ya terminó. El cliente lo puede volver a contratar desde su portal con **Reactivar servicio** (ver más abajo).

En el portal del cliente se ve igual: "No se renueva · termina el..." (con Reactivar y Dar de Baja) o "En proceso de baja · termina el...".

## Reactivar un servicio que ya terminó

Cuando un **Agente Registrado** o una **Declaración Anual** ya terminó, en el portal del cliente aparece el botón **Reactivar servicio**. Se puede usar siempre, sin límite de tiempo: es como una orden nueva.

Al tocarlo se abre una ventana con:
- el servicio y el **precio actual** (la Declaración Anual muestra aparte la tarifa estatal de Florida y el total),
- la tarjeta guardada ("Se cobrará a su tarjeta Visa terminada en 4242"), con la opción de usar otra,
- en el Agente Registrado, el aviso de que la dirección puede ser distinta a la anterior,
- la casilla obligatoria de aceptar la renovación automática y los Términos.

Al pagar:
- **Si se cobra:** el servicio vuelve a quedar activo en la misma orden, se renueva solo cada año desde esa fecha, y le llega un email de confirmación con el monto, la tarjeta y la próxima renovación. Al equipo le llega un aviso por Telegram.
- **Si la tarjeta es rechazada:** se lo dice ahí mismo y le pide otra tarjeta.
- **Si el banco pide verificación:** la confirma en la misma ventana y recién ahí se cobra.

En el **Agente Registrado**, al reactivar se da de alta otra vez con el proveedor de forma automática, y al cliente le llega por email la dirección nueva.

La **Dirección Virtual** no se puede reactivar mientras no se venda: dice "Servicio finalizado".

En la orden queda una nota con la fecha, el servicio y la tarjeta, y la aceptación de Términos (ver "Qué queda registrado").

## Qué queda registrado

- **Notas de la orden:** una línea con la fecha, quién canceló (cliente o admin), el tipo, la fecha de fin, el motivo y si se avisó al cliente.
- **Stripe:** el motivo y el comentario quedan guardados en la suscripción.
- **Registro de auditoría** del panel, cuando lo hace el admin.
- **Alerta interna** al pedir la cancelación, y otra cuando el servicio termina de verdad.
- **Aceptación de Términos:** cuando el cliente reactiva, queda guardado en la orden cuándo aceptó, desde qué conexión y el texto exacto (sección "Aceptación de Términos" del detalle de la orden).

## Pagos fallidos

Al **cancelar el servicio**, si había una renovación sin pagar, se anula: Stripe deja de reintentar el cobro y dejan de llegar las alertas de "Subscription payment failed".

Lo mismo al **cancelar la renovación** de una suscripción que ya tiene el pago fallido: como el período en curso es justamente el que no se pudo cobrar, el servicio termina ese mismo día y se anula ese cobro.
