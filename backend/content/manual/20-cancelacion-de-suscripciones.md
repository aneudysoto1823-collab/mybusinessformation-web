---
title: "Cancelación de suscripciones"
summary: "Las dos formas de cancelar una suscripción (la renovación o el servicio), cómo se hace desde el panel admin y desde el portal del cliente, qué email recibe el cliente y qué hay que avisarle al proveedor."
updated: "2026-10-09"
---

## Qué se puede cancelar

Las suscripciones son los servicios que se cobran solos cada año: **Agente Registrado** y **Declaración Anual**. También quedan órdenes viejas con **Dirección Virtual**, que ya no se vende.

El botón de cancelar es **el mismo para todas las órdenes**, sin importar de dónde vinieron: un paquete de formación de opabiz.com, un servicio suelto, o una orden de mybusinessformation.com. Cada suscripción tiene un número único en Stripe (empieza con `sub_`) y se cancela por ese número.

El flujo es **igual en el panel admin y en el portal del cliente**: las mismas dos opciones, con los mismos textos.

## Las dos formas de cancelar

**1. Cancelar la renovación.** El servicio sigue funcionando normal hasta el último día ya pagado. En el Agente Registrado, eso quiere decir que el cliente sigue recibiendo sus documentos como siempre hasta esa fecha. Después no se le cobra más y el servicio termina.

**2. Cancelar el servicio ahora.** El cliente no quiere seguir con el servicio. No se puede cortar en el momento, porque hay que darlo de baja con el proveedor y puede que un documento ya esté en camino. Por eso hay un **margen de 30 días**: el servicio termina 30 días después de pedir la baja. Hasta ese día se le siguen enviando los documentos que lleguen; después ya no recibe nada en esa dirección. Si la renovación cae antes de esos 30 días, el servicio termina en la fecha de renovación (así nunca se le hace un cobro nuevo).

En las dos opciones:

- **No hay reembolso** del período ya pagado.
- **No se le cobra nada más.**

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

- **Cancelar la renovación:** que el servicio sigue activo hasta la fecha, que hasta ese día sigue recibiendo sus documentos, y que después no se le cobra más. Si cambia de opinión, puede reactivarla desde su cuenta.
- **Cancelar el servicio:** que necesitamos 30 días para darlo de baja con el proveedor, la fecha exacta en que termina, y que después de esa fecha ya no recibe documentos.

En el Agente Registrado, el email también le recuerda que su empresa tiene que designar un nuevo Agente Registrado ante Florida antes de esa fecha. En la Declaración Anual, que Florida la exige cada año.

## Avisarle al proveedor (Registered Agents Inc)

Cuando se cancela un **Agente Registrado** (cualquiera de las dos opciones), llega una alerta a **alert@opabiz.com** y a Telegram con el aviso **"ACCIÓN REQUERIDA: avisar a Registered Agents Inc..."**, el nombre de la empresa y la fecha en que termina.

Hoy ese aviso al proveedor **se hace a mano**: el sistema todavía no se conecta con Registered Agents Inc para dar de baja. Hazlo apenas llegue la alerta.

## Cómo se ve en el panel

En la sección **Suscripciones recurrentes** de la orden:

- **Renovación cancelada:** dice **"Termina"** con la fecha. Tiene dos botones:
  - **Reactivar:** quita la cancelación y la suscripción vuelve a renovarse sola. Sirve si el cliente se arrepiente.
  - **Cancelar:** para pasar a **cancelar el servicio ahora** (la opción de renovación aparece marcada como "ya elegida").
- **Baja del servicio en curso:** dice **"Termina"** con la fecha, sin botones. Ya no se puede reactivar, porque la baja ya se le avisa al proveedor.
- **Cancelada:** el servicio ya terminó. No se puede revivir: el cliente tiene que volver a comprarlo.

En el portal del cliente se ve igual: "No se renueva · termina el..." (con Reactivar y Cancelar Servicio) o "En proceso de baja · termina el...".

## Qué queda registrado

- **Notas de la orden:** una línea con la fecha, quién canceló (cliente o admin), el tipo, la fecha de fin, el motivo y si se avisó al cliente.
- **Stripe:** el motivo y el comentario quedan guardados en la suscripción.
- **Registro de auditoría** del panel, cuando lo hace el admin.
- **Alerta interna** al pedir la cancelación, y otra cuando el servicio termina de verdad.

## Pagos fallidos

Al **cancelar el servicio**, si había una renovación sin pagar, se anula: Stripe deja de reintentar el cobro y dejan de llegar las alertas de "Subscription payment failed".
