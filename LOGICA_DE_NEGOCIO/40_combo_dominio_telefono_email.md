# Proceso 40 — Combo Dominio + Teléfono + Email comercial (en planificación, 2026-10-01)

Nuevo servicio en planificación: un combo de **presencia digital básica** para clientes que acaban de formar su LLC/Corp — dominio propio, número de teléfono comercial, y email bajo ese dominio — vendido como parte del catálogo de OpaBiz/MyBusinessFormation, igual que ya se vende Registered Agent o Virtual Address (ver [[37_registered_agent_service]]).

**Estado actual: solo cuentas de proveedores dadas de alta. No hay código de integración construido todavía.** Este doc es el punto de partida para cuando se retome.

---

## Por qué estos 3 proveedores (y no otros)

Se investigó el mercado antes de elegir — el criterio fue precio real a largo plazo + que permita facturación recurrente propia (no solo comisión de afiliado) + que encaje con el volumen bajo/variable con el que se va a arrancar (no una telco grande comprometiéndose a cientos de líneas desde el día 1).

### Dominio → ResellerClub (no Namecheap)

Namecheap **no tiene programa de reseller formal** — su propio soporte lo confirma ("Currently, we do not have a domain reseller program. Still, you can resell domains with us using our API"). Además su precio de entrada es engañoso: ~$7 el año 1, pero la renovación salta a **$18.48/año (+68%)** — y un dominio se renueva todos los años mientras el cliente tenga la empresa, así que a los 2-3 años ya perdió contra la alternativa.

**ResellerClub** sí tiene reseller real: slabs de precio mayorista (~$12.39/año .com, estable, sin el salto de renovación) + API dedicada para automatizar búsqueda/registro/renovación.

### Email → Zoho Mail (programa Value-Added Reseller)

Comparado contra Titan ($2.49/buzón/mes), Microsoft 365 ($6/user/mes) y Google Workspace ($6-7/user/mes) — **Zoho Mail es el más barato por lejos** ($1/buzón/mes en el plan Lite) y además ya es el proveedor de email que usa el negocio para sí mismo (6 buzones propios: noreply@, marketing@, support@, info@, admin@, alert@).

**Importante — por qué el programa formal y no la cuenta normal:** se evaluó simplemente agregar el dominio de cada cliente a la cuenta Zoho existente del negocio y facturar a mano. Se descartó: (a) el plan gratis de Zoho es **para UN SOLO dominio**, no se puede usar "5 gratis" por cada cliente nuevo — agregar un segundo dominio ya exige plan pago; (b) sin pasar por el programa formal de reventa, cobrar una cuota **mensual recurrente** por un servicio de un tercero sin ser reseller autorizado es legalmente ambiguo — el founder lo identificó solo y decidió correctamente no hacerlo así. Lo que sí es legítimo sin ser reseller formal: cobrar un fee **único** por el trabajo de setup, pero no una suscripción recurrente del producto en sí.

El 2026-10-01 se mandó un email a `partnership@zohoworkplace.com` solicitando el alta como Value-Added Reseller, mencionando que se va a ofrecer bajo **ambas marcas** (OpaBiz y MyBusinessFormation.com) — **respuesta pendiente**.

### Teléfono → Twilio API directo (no un "White Label VoIP")

Se investigaron primero plataformas de "White Label VoIP" (Viirtue, Skyswitch, Broadvoice, RingQ, VoIPLine) — son blancas reales (control total de marca/precio/facturación) pero **no publican precio**, piden cotización a medida, suelen tener compromiso mensual mínimo y cuota de alta — pensadas para MSPs que arrancan con cientos de líneas (ej. 50 clientes × 20 líneas), no para un combo de a un número por cliente.

**Twilio directo** es mejor fit: $1.15/mes por número local, **sin compromiso mínimo, sin cuota de alta**, pago por uso real (llamadas/SMS se cobran aparte, también por uso). Mismo patrón técnico que ResellerClub — no hay "programa" turnkey, se construye la integración vía API y se factura con marca propia. Igual de invisible para el cliente que la integración de RAI: el cliente nunca ve "Twilio" en ningún lado, para él el número "es de OpaBiz".

**Diseño pendiente de confirmar:** ¿el número solo reenvía llamadas/SMS al celular real del cliente (como una línea de negocio simple), o se construye algo más? Lo primero es mucho más simple de implementar (sin UI de softphone) y es el patrón más común en este tipo de combos — confirmar con el founder antes de diseñar el checkout.

---

## Cuentas ya creadas (2026-10-01)

| Proveedor | Estado | Detalle |
|---|---|---|
| **ResellerClub** | ✅ Activa | Cuenta `Juan R Fabian`, $25.26 de saldo cargado, API Key ya generada. Panel: resellerclub.webpropanel.com |
| **Twilio** | ✅ Activa | Cuenta "Full access" (no Limited trial), $20 de saldo con auto-recarga (recarga a $20 cuando baja de $10), 2FA activado, API Key tipo "Standard" generada. Legal business name: Florida Business Formation Center, dirección 3700 SW 27th St Apt D104, Gainesville, FL 32608. |
| **Zoho Mail (VAR)** | ⏸️ En pausa, no se firma | 2026-10-07 llegó el contrato (Zoho Partner Agreement estándar vía Zoho Sign): NO es mayorista sino comisión del 15% por 4 años sobre el precio de lista; logo "Zoho Reseller" obligatorio en el home (2.5); sin marca blanca (cliente bajo ToS de Zoho); soporte de 1er nivel nuestro; datos de clientes = información confidencial de Zoho (7.1/7.2); no usar agentes/canales sin permiso (2.2); ley de California. Se decidió no firmar por ahora. No crear otra organización Zoho con opabiz.com. |
| **ResellerClub Business Email** | ✅ Elegido para el email | Mismo panel que los dominios, marca blanca (backend Mailhostbox, webmail en webmail.<dominio>), costo Add $0.35–0.45 y **Renew $0.69/buzón/mes**. Prueba 2026-10-07 con buoval.com: DNS (MX prioridad 100, SPF, DKIM, CNAMEs, A interno + DMARC p=none) validado en el panel de Mailhostbox; correo llega a bandeja de entrada de Gmail. Limitación: webmail.<dominio> solo HTTP (cert solo cubre us3.webmail.mailhostbox.com); al cliente se le recomienda IMAP us2.imap.mailhostbox.com:993 SSL + SMTP us2.smtp.mailhostbox.com:587 STARTTLS. Paso a paso manual en el capítulo 19 del manual interno. |

Las credenciales (API keys, secrets) las guardó el founder localmente — **no están cargadas en Vercel todavía**, se cargan recién cuando se construya la integración real.

---

## Lo que falta construir (todo, no se empezó nada de código)

1. **Diseño del combo** — qué incluye exactamente, precio al cliente (con margen sobre el costo mayorista de cada pieza), si se vende junto o cada pieza por separado, si aplica solo en formación o también à la carte en `/servicios`.
2. **Integración ResellerClub** — búsqueda de disponibilidad de dominio + registro vía su API, usando el API Key ya generado.
3. **Integración Twilio** — búsqueda/compra de número vía API + decisión de diseño pendiente (forwarding simple vs. algo más).
4. **Integración Zoho** — aprovisionamiento de buzones vía su API de reseller, una vez confirmada el alta.
5. **Facturación recurrente** — los 3 componentes son recurrentes (dominio anual, teléfono mensual, email mensual) — esto encaja con el motor de Stripe Subscriptions que ya existe para Registered Agent/Annual Report (`lib/order-subscriptions.ts`, `lib/stripe-subscriptions.ts`), no hace falta construir un sistema de suscripciones nuevo, solo sumar estos 3 servicios al que ya está.
6. **Qué pasa si el cliente cancela** — liberar el número de Twilio, no renovar el dominio, dar de baja el buzón de Zoho. Mismo tipo de lógica que ya existe para cancelación de Registered Agent (`customer.subscription.deleted` en el webhook de Stripe).
7. **Contabilidad** — cada pieza tiene un costo mayorista real que hay que trackear como gasto (ya existe el módulo de Contabilidad con gastos recurrentes, ver CLAUDE.md sección correspondiente) frente al ingreso cobrado al cliente, para que el margen real quede visible.

**Siguiente sesión:** retomar cuando Zoho responda, o antes si se decide arrancar el diseño del combo mientras se espera.
