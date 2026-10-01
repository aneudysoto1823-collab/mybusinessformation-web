# Asistente Claudia para WhatsApp

Extensión de Chrome (solo para uso interno del equipo, no se publica en la
Chrome Web Store) que agrega un panel flotante dentro de WhatsApp Web
(`web.whatsapp.com`) con sugerencias de respuesta de Claudia. Nunca manda
mensajes por su cuenta — solo inserta el texto sugerido en el cuadro de
escribir; el envío siempre lo hace la persona, a mano.

## Instalar (cada persona, en su propia computadora)

1. Abrí Chrome y andá a `chrome://extensions`.
2. Activá "Modo de desarrollador" (arriba a la derecha).
3. Click en "Cargar descomprimida" y seleccioná esta carpeta
   (`whatsapp-assistant-extension/`).
4. Click derecho en el ícono de la extensión → **Opciones**.
5. Pegá la clave de acceso que te dieron (ver abajo) y guardá. El campo
   "URL del sitio" ya viene con `https://www.opabiz.com` — no hace falta
   tocarlo salvo que usen otro dominio.

## Usar

1. Abrí `https://web.whatsapp.com` y entrá a una conversación.
2. Click en el botón circular "C" abajo a la derecha — abre el panel.
3. Copiá el mensaje del cliente (click derecho → Copiar, o seleccionarlo)
   y pegalo en "Mensaje del cliente" — o apretá el micrófono 🎤 y dictalo
   (elegí Español/English en el selector de al lado antes de hablar; Chrome
   lo transcribe solo, sin ningún servicio nuestro de por medio — el audio
   lo procesan los servidores de Google, como cualquier dictado de Chrome).
4. Click en "Preguntarle a Claudia" — tarda unos segundos.
5. Revisá/editá la respuesta sugerida y click en "Usar esta respuesta" —
   se inserta en el cuadro de WhatsApp. Apretá Enter para mandarla, como
   siempre.

## Configuración pendiente en el servidor

Esta extensión necesita que la variable de entorno `WHATSAPP_ASSISTANT_KEY`
esté cargada en Vercel (Production) con el mismo valor que se pega en el
paso 5 de arriba. Sin esa variable, el endpoint rechaza todas las
solicitudes con 401.
