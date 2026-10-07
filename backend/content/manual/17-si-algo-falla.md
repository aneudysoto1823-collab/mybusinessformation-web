---
title: "Qué hacer si algo falla"
summary: "Los problemas más comunes y cómo resolverlos paso a paso."
updated: "2026-10-07"
---

Antes de tocar nada: **no le vuelvas a cobrar a un cliente** por un problema del sistema, y **no borres nada** sin estar seguro. Si el problema no está acá o la solución no funciona, pídele ayuda a Claude contándole qué pasó. Para fallas técnicas hay guías detalladas en la carpeta `TROUBLESHOOTING` del proyecto.

## El cliente pagó pero no le llegó el email

1. Busca la orden en el panel (por su email o nombre).
2. Si está **pagada**, entra a la orden y en **Acciones manuales** toca **"Reenviar: Confirmación de Orden"**.
3. Pídele que revise la carpeta de spam o promociones.
4. Si tampoco llega el reenvío, puede ser un problema de envío de emails (ver más abajo).

## El cliente pagó pero la orden sigue en "Pending"

Stripe cobró pero no pudo avisarle al sitio.

1. Entra al panel de Stripe, en **Developers, Webhooks**.
2. Abre el webhook del sitio y busca el evento que falló.
3. Toca **Resend**. La orden pasa sola a pagada y salen los emails.

## Llegó "pago sin orden" por Telegram

Stripe cobró y la orden no se creó. Es raro. No le vuelvas a cobrar al cliente: pásale el aviso a Claude para revisar qué pasó y crear la orden con los datos del pago.

## No sale ningún email

Si llega por Telegram el aviso de **dominio de email caído**, o ningún cliente recibe nada:

1. Entra a Resend, en **Domains**, y revisa si algún dominio dice "failed".
2. Lo más común: alguien cambió o borró un registro en Namecheap (la configuración de los dominios).
3. Pásale el aviso a Claude para restaurar los registros.

Mientras tanto, las órdenes pagadas igual se ven en el panel y llegan por Telegram.

## El cliente no puede entrar al portal

- Revisa en el panel que el **email** de su orden sea el mismo que está escribiendo.
- El número de orden funciona con o sin guion (FBFC-XXXXXXXX o FBFCXXXXXXXX).
- Si se olvidó la contraseña, que entre con su número de orden y cree una nueva desde el portal.

## Falló la activación del Agente Registrado

Llega una alerta por email que dice en qué paso falló.

1. Entra a la orden, sección **Registered Agent (RAI Provisioning)**.
2. Toca **"Retry RA provisioning"**. Solo repite los pasos que faltaron.
3. Si vuelve a fallar, revisa con Claude, porque puede ser un problema del lado del proveedor.

## Claudia no responde

Casi siempre es que se acabó el crédito de Anthropic. Entra a la consola de Anthropic y revisa el saldo. Tiene recarga automática, pero puede fallar si cambió la tarjeta.

## Pago de suscripción fallido

Ver el capítulo "Pagos con Stripe". El cliente ya recibió un email para actualizar su tarjeta. Si sigue fallando después de un par de días, contáctalo.

## Un agente no recibe órdenes

- Revisa en **/admin/opabiz** que su cuenta esté **activa** y que esté **disponible**.
- Si una orden quedó en **pendiente** porque nadie la aceptó, asígnala a mano.

## El sitio no carga o no se publicó un cambio

- Revisa en Vercel si el último deploy falló.
- Si falla con un error de fuentes o de caché que no tiene sentido, la solución conocida es volver a publicar **sin caché** (en Vercel, "Redeploy" sin usar el caché de la compilación anterior).
- Si el sitio entero está caído, revisa el estado de Vercel y de Supabase en sus páginas de estado.
