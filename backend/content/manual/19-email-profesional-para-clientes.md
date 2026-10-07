---
title: "Email profesional para clientes"
summary: "Cómo activarle a un cliente un correo con su propio dominio (info@suempresa.com) con ResellerClub, paso a paso. Parte del combo dominio, teléfono y email."
updated: "2026-10-07"
---

> El combo de dominio, teléfono y email todavía no se vende en el sitio. Mientras no esté automatizado, este capítulo explica cómo hacerlo a mano. Cuando el sistema lo haga solo, este capítulo se actualiza.

## Qué es y con quién lo hacemos

Le damos al cliente un correo con el dominio de su empresa, por ejemplo **info@suempresa.com**, en vez de un Gmail.

- **Proveedor:** ResellerClub, producto **Business Email**. Por detrás funciona con Mailhostbox, un servicio de correo grande y con buena reputación.
- **Marca blanca:** el cliente nunca ve ResellerClub. Entra a su correo desde **webmail.sudominio.com**.
- **Panel de ResellerClub:** resellerclub.webpropanel.com, con el login de la empresa.
- **Costo para nosotros:** alrededor de $0.69 por buzón al mes al renovar (la primera compra sale algo más barata). Revisar el valor vigente en el panel: MY SHOP, Business Email, vista "Detailed".

Se descartó Zoho para esto: cobra más, no es marca blanca y obliga a poner su logo en el home del sitio.

## Antes de empezar

- **El dominio tiene que existir y ser del cliente.** Escríbelo con cuidado: un error de una letra hace que el correo se compre para un dominio que no existe (nos pasó en la prueba).
- **Nunca uses opabiz.com ni mybusinessformation.com** para probar. Esos dominios reciben el correo del equipo en Zoho, y cambiar su configuración corta todos los emails del negocio.
- Lo ideal es que **el dominio también se compre en ResellerClub**. Así todo queda en el mismo panel y la configuración es más simple.

## Paso 1: comprar el email

1. En el panel de ResellerClub toca **+ BUY** (o la tienda Express Cart) y elige **Emails, Business Email**.
2. Escribe el dominio del cliente y la cantidad de buzones.
3. En **"Who are you buying for"** elige **Customer** y crea su registro con sus datos reales: nombre, email, dirección, teléfono. En **Company name** va el nombre de su LLC: así el dominio queda legalmente a nombre de su empresa.
4. Paga con **Pay with Wallet** (el saldo de la cuenta). Si no alcanza, carga saldo con **Add Funds**.

## Paso 2: crear el buzón

1. En la orden del email toca **Create Email**.
2. Dirección (por ejemplo **info**), el nombre que verán los destinatarios y un **email alterno** del cliente: ahí le llegan los datos de acceso.
3. Revisa que **"Configured email accounts"** pase de 0 a 1. Si sigue en 0, el buzón no existe todavía.

## Paso 3: configurar el dominio (DNS)

En la orden, **DNS Records, View Details** muestra los registros que hay que agregar en el dominio. Son de cuatro tipos:

| Para qué | Tipo | Host |
|---|---|---|
| Recibir correo (3 servidores) | MX | @ (prioridad 100 en los tres) |
| Autorizar el envío (SPF) | TXT | @ |
| Firma digital (DKIM) | TXT | el que indique el panel, por ejemplo 20261007._domainkey |
| Webmail y apps de correo | CNAME | webmail, smtp, imap, pop |
| Uso interno de ResellerClub | A | el que indique el panel |

Agrega además este, que no viene en la lista pero ayuda a no caer en spam:

| Tipo | Host | Valor |
|---|---|---|
| TXT | _dmarc | `v=DMARC1; p=none` |

**Dónde se cargan:** en el panel de DNS de donde esté registrado el dominio. Si está en ResellerClub, en su propio panel. Si está en Namecheap, en **Advanced DNS**: en **Mail Settings** se elige **Custom MX** para los MX, y el resto va en **Host Records**.

**Cuidados al cargarlos:**
- En el campo Host va solo la parte de adelante (`@`, `webmail`, `smtp`), nunca el dominio completo.
- Los valores TXT van sin comillas, y la firma DKIM se copia completa, de una sola vez.
- Solo puede haber **un** registro SPF. Si ya existe otro que empieza con `v=spf1`, se borra.
- Si el dominio tenía una redirección de página web que no corresponde, se quita.

## Paso 4: confirmar que todo esté bien

1. Espera unas horas: los cambios tardan entre unos minutos y 6 horas en verse en todo internet.
2. En la orden, **Go to Admin Panel** abre el panel de correo (Mailhostbox). En **DNS Configuration**, todo tiene que decir **"Valid"**: MX, POP, IMAP, SMTP, WEBMAIL, DKIM y SPF.
3. **No le mandes correos de prueba al cliente antes de que DKIM diga "Valid".** Si se envía antes, el correo sale sin firma y cae en spam (nos pasó en la prueba).
4. Prueba real: desde el webmail del cliente manda un correo a un Gmail **con contenido normal** (un asunto y un par de oraciones, nunca solo "test") y responde desde el Gmail. Tiene que llegar a la bandeja de entrada en los dos sentidos.

## Paso 5: dejar el webmail limpio

El webmail trae paneles de la frase del día, el clima y noticias que se ven poco profesionales. Se quitan desde el webmail del cliente: **engranaje de configuración, Preferences, Sidebar**, apagar los paneles y **Save**. "Today's Agenda" puede quedarse: es el calendario del propio correo.

## Lo que le explicamos al cliente

- **Cómo entrar:** webmail.sudominio.com, con su dirección completa y su contraseña.
- **Recomendado: usarlo desde el celular o la computadora** (Gmail app, Mail del iPhone, Outlook). Con estos datos:
  - Recibir (IMAP): **us2.imap.mailhostbox.com**, puerto 993, SSL.
  - Enviar (SMTP): **us2.smtp.mailhostbox.com**, puerto 465, SSL.
  - Usuario: su dirección completa. Contraseña: la del buzón.
  - Son los datos habituales de este proveedor: confírmalos con el email de configuración que ResellerClub manda al correo alterno al crear el buzón.
- **Que el correo tarda unas horas en quedar activo** después de configurarlo.

## Limitaciones conocidas

- **El webmail con el dominio del cliente no es seguro.** webmail.sudominio.com funciona solo sin cifrado y el navegador muestra "Not Secure". La dirección segura es **https://us3.webmail.mailhostbox.com**, pero muestra "mailhostbox" en vez de su dominio. Por eso conviene que use el correo desde el celular o Outlook, donde la conexión sí va cifrada.
- **El panel de correo y la tienda muestran "Juan R Fabian".** Hay que cambiarlo por OpaBiz en la configuración de marca de ResellerClub (PRO-SUITE) antes de dar acceso a clientes.
- **Las renovaciones necesitan saldo.** Si el saldo de ResellerClub se acaba y no hay un método de pago automático registrado, el email y el dominio del cliente se vencen.

## Pendiente

- Respuesta de soporte de ResellerClub: webmail seguro con el dominio del cliente, quitar los paneles para todos los clientes de una vez, y si la verificación del dominio se puede hacer por la API.
- Fijar los precios del combo (email, dominio, teléfono).
- Automatizarlo: que al pagar el combo el sistema haga todos estos pasos solo.
