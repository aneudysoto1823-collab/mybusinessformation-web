# 39 — Telegram Alert: alertas operativas fuera de Resend

**Creado:** 2026-09-30
**Archivos:** `backend/lib/ops-alert.ts`, `backend/lib/resend-client.ts`, `backend/app/api/cron/email-domain-health/route.ts`, `backend/app/api/webhooks/stripe/route.ts`

---

## Por qué existe

El 2026-09-30 alguien borró el registro DKIM de Resend (`resend._domainkey`) en el DNS de opabiz.com en Namecheap. Resend pasó el dominio a `failed` y dejaron de salir **todos** los emails `@opabiz.com`:

- la confirmación de orden al cliente,
- la alerta interna de "orden pagada" a `alert@opabiz.com`,
- el código 2FA para entrar al panel admin.

Se hizo una orden de prueba real, Stripe cobró y la orden quedó `paid`, pero **nadie se enteró**. La única forma de verla era entrar al panel admin, y el panel tampoco dejaba entrar porque el código 2FA viaja por email.

Había dos problemas de fondo:

1. **Un solo canal.** Todo aviso dependía de Resend. Si Resend cae, el aviso de que Resend cayó tampoco llega.
2. **Fallos silenciosos.** El SDK de Resend no lanza una excepción cuando rechaza un email: devuelve `{ error }`. Ninguno de los 45 envíos del sitio revisaba ese campo, así que el fallo no dejó ni una línea en los logs de Vercel.

**Regla que sale de esto:** una alerta que avisa que el email falló **nunca** puede viajar por email. Por eso las alertas operativas van por **Telegram**, con **Sentry** como respaldo.

---

## Qué llega a Telegram

Cada mensaje empieza con un color según su gravedad:

| Color | Significado |
|---|---|
| 🟢 | Informativo. Todo salió bien, es solo para que te enteres. |
| 🔴 | Error. Algo se rompió y hay que actuar. También queda registrado en **Sentry**. |

### 🟢 Orden pagada

Se manda **cada vez que un cliente paga**, en cualquiera de los 3 flujos:

| Flujo | Marca | Cómo aparece |
|---|---|---|
| Formación LLC/Corp (home) | OpaBiz | `Formación LLC basic` |
| Servicios à la carte (`/servicios/checkout`) | OpaBiz o MyBusinessFormation | `Servicios à la carte` |
| New Business legacy (addons) | MyBusinessFormation | `New Business (addons)` |

Ejemplo:

```
🟢 Orden pagada: FBFC-B1CB8C5B
OpaBiz · Formación LLC basic
Empresa: MI EMPRESA LLC
Cliente: ANEUDY SOTO
Total: $263.00
https://opabiz.com/admin/orders/b1cb8c5b-...
```

**Qué hacer:** nada urgente. Es el mismo aviso que llega por email a `alert@opabiz.com`, pero por un canal que no depende de Resend. El link abre la orden en el panel admin. Este aviso **se suma** al email interno, no lo reemplaza.

### 🔴 Email NO enviado

Se manda cuando Resend rechaza **cualquier** email del sitio: confirmaciones, citas, 2FA, campañas, recordatorios de renovación, invitaciones de OpaBiz Connect, etc. Cubre los 45 envíos, porque todos pasan por el mismo cliente (`lib/resend-client.ts`).

Ejemplo:

```
🔴 Email NO enviado
Asunto: OpaBiz: ✅ Order confirmed — MI EMPRESA LLC
Para: an***@gmail.com
Desde: OpaBiz <noreply@opabiz.com>
Error: The opabiz.com domain is not verified...
```

El email del destinatario sale enmascarado a propósito: para diagnosticar alcanza con el dominio.

**Qué hacer:**
- Si el error menciona **"domain is not verified"**: el DNS se rompió. Ver "Dominio no verificado" más abajo.
- Si el cliente necesitaba ese email (por ejemplo, la confirmación de orden): cuando el problema esté resuelto, reenviarlo desde `/admin/orders/[id]` con **"🔁 Reenviar Confirmación de Orden"**.
- Si llegan muchos seguidos, de golpe y de distintos tipos, es un problema general de Resend (dominio, API key o cuenta), no de un email puntual.

### 🔴 PAGO SIN ORDEN

Es **el peor caso posible**: Stripe cobró al cliente pero la orden no se pudo crear o actualizar en Supabase. El cliente pagó y no existe ningún rastro en el panel. Ya pasó una vez, el 2026-08-11: todas las compras de `/new-business` cobraban sin crear orden por culpa de una columna `NOT NULL` faltante.

Ejemplo:

```
🔴 PAGO SIN ORDEN: update de orden de formación b1cb... falló
Sesión Stripe: cs_live_...
Monto: $263.00
{"code":"23502","message":"null value in column ..."}
```

**Qué hacer:** actuar **de inmediato**.
1. Buscar la sesión en Stripe (Payments) para tener los datos del cliente.
2. Revisar el error: casi siempre es una columna nueva o faltante en la tabla `Order`.
3. Corregir la causa y reenviar el evento desde Stripe → Developers → Webhooks → `opabiz-checkout` → el evento → **Resend**.

Stripe reintenta el webhook solo durante varios días, así que este aviso puede repetirse hasta que se arregle. Eso es a propósito.

### 🔴 Dominio de email NO verificado

Lo manda el cron `/api/cron/email-domain-health`, que corre **cada hora** y le pregunta a Resend el estado de todos los dominios de envío (`opabiz.com`, `mybusinessformation.com`, `notices.mybusinessformation.com`).

Ejemplo:

```
🔴 Dominio(s) de email NO verificados en Resend — los emails desde ahí NO están saliendo:
• opabiz.com: failed
```

Este aviso llega **antes** de que un cliente pague y no reciba nada. El incidente del 30 de septiembre se habría detectado en menos de una hora.

**Qué hacer:**
1. Namecheap → el dominio afectado → **Advanced DNS**.
2. Comprobar que existan los 3 registros de Resend:
   - TXT `resend._domainkey` (DKIM)
   - TXT `send` → `v=spf1 include:amazonses.com ~all`
   - MX `send` → `feedback-smtp.us-east-1.amazonses.com` (está en la sección "Mail Settings" de Namecheap, no en la tabla principal)
3. El valor exacto de cada registro está en Resend → Domains → el dominio.
4. Volver a crear el que falte y tocar **Verify DNS Records** en Resend. Tarda unos minutos.

⚠️ **No confundir con el DKIM de Zoho.** En opabiz.com también existe `opabiz._domainkey`: es el DKIM de **Zoho** (los buzones info@, alert@, etc.), no el de Resend. Los dos tienen que existir; borrar cualquiera rompe uno de los dos servicios.

Mientras el dominio siga caído, el aviso se repite una vez por hora. Eso también es a propósito: el problema corta el negocio y no debe poder ignorarse.

### 🔴 Resend no responde al chequeo

Lo manda el mismo cron cuando la API de Resend devuelve un error. Un `401` significa que la API key (`RESEND_API_KEY`) fue revocada o cambió.

**Qué hacer:** revisar la API key en Resend → API Keys y en Vercel → Environment Variables.

---

## Configuración (una sola vez)

### 1. Crear el bot

1. En Telegram, abrir **@BotFather** y mandar `/newbot`.
2. Elegir un nombre (por ejemplo `OpaBiz Alertas`) y un usuario que termine en `bot` (por ejemplo `opabiz_alertas_bot`).
3. BotFather responde con el **token** (formato `123456789:AAH...`). Ese es el `TELEGRAM_BOT_TOKEN`.

### 2. Obtener el chat ID

**Solo para vos:**
1. Abrir el bot recién creado y mandarle cualquier mensaje, por ejemplo "hola".
2. Abrir en el navegador `https://api.telegram.org/bot<TOKEN>/getUpdates`.
3. Buscar `"chat":{"id":123456789,...}`. Ese número es el `TELEGRAM_CHAT_ID`.

**Para vos y tu socio (grupo):**
1. Crear un grupo de Telegram y agregar el bot.
2. Mandar un mensaje en el grupo.
3. Mismo `getUpdates`. El ID del grupo es **negativo** (por ejemplo `-1001234567890`) y se copia con el signo menos incluido.

### 3. Cargar en Vercel

Vercel → proyecto → Settings → Environment Variables → **Production** (y Preview si se quiere):

```
TELEGRAM_BOT_TOKEN = 123456789:AAH...
TELEGRAM_CHAT_ID   = 123456789
```

Después, **Redeploy**. Las variables nuevas no aplican hasta el siguiente deploy.

### 4. Probar que llega

Desde cualquier terminal, sin tocar el sitio:

```bash
curl -s "https://api.telegram.org/bot<TOKEN>/sendMessage" -d chat_id=<CHAT_ID> -d text="Prueba OpaBiz"
```

Si llega el mensaje, el sitio también puede mandar. La prueba real completa es hacer una orden de prueba y esperar el aviso 🟢 "Orden pagada".

---

## Cómo funciona por dentro

| Pieza | Qué hace |
|---|---|
| `lib/ops-alert.ts` → `notifyOps(texto, nivel)` | Manda el mensaje a Telegram (timeout de 5s) y, si es `warning` o `error`, también a Sentry. **Nunca lanza excepción**: si Telegram falla o faltan las variables, deja un log y sigue. Un aviso roto nunca puede tumbar un pago. |
| `lib/resend-client.ts` → `getResend()` | Cliente Resend compartido por **todo** el sitio. Tiene la misma firma y el mismo resultado que el SDK original, pero si `emails.send` devuelve `{ error }` o lanza, lo loguea y llama a `notifyOps(..., 'error')`. Reemplazó las 23 copias locales de `getResend()` que había en el código. |
| `webhooks/stripe/route.ts` → `alertOrderPaid()` / `alertPaidWithoutOrder()` | Avisos de orden pagada y de pago sin orden. Corren dentro de `after()` de Next.js, así no demoran la respuesta a Stripe y Vercel no mata la función antes de mandarlos. |
| `cron/email-domain-health` | Cron cada hora (`vercel.json`), protegido con `CRON_SECRET` como el resto de los crons. |

**Regla para código nuevo:** todo email nuevo debe usar `getResend()` de `@/lib/resend-client`. **Nunca** `new Resend(...)` directo, porque se pierde la detección de fallos.

**Sin configurar Telegram** el sitio funciona igual: los errores siguen llegando a Sentry y a los logs de Vercel, pero los avisos 🟢 de orden pagada no llegan a ningún lado.

---

## Complementos recomendados (fuera del código)

- **Emails de Stripe por cada pago:** Stripe → Settings → Communication preferences → "Successful payments". Stripe avisa con su propia infraestructura. Hay que activarlo en Test **y** en Live por separado.
- **2FA del admin por app (TOTP) en vez de email:** `/admin/security`. Así el acceso al panel no depende de Resend. En el incidente del 30 de septiembre, el 2FA por email dejó al founder sin poder entrar.
