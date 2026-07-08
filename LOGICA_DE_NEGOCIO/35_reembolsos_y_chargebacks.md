# Proceso 35 — Reembolsos y Chargebacks

## Qué es este proceso

Hasta el 2026-07-07, un reembolso hecho a mano en el Dashboard de Stripe (o un chargeback abierto por el banco del cliente) **nunca se reflejaba en el sitio**: la orden quedaba `paymentStatus: 'paid'` para siempre en `/admin/orders/[id]`, y esa plata se seguía contando como ingreso real en `/admin/contabilidad`, aunque ya no existiera.

El webhook de Stripe (`backend/app/api/webhooks/stripe/route.ts`) solo escuchaba `checkout.session.completed`. Cualquier otro evento se descartaba sin hacer nada.

**No se construyó ningún botón de "reembolsar" dentro del sitio.** El reembolso se sigue haciendo en Stripe como siempre (Dashboard → Payments → buscar el pago → Refund) — esto solo hace que el sitio se entere de lo que pasó ahí y lo refleje solo.

---

## Cómo se encuentra la orden desde un evento de Stripe

Un evento de reembolso o disputa llega referenciado por `payment_intent`, no por el `id` de nuestra orden. Antes de esto, el campo `Order.stripePaymentId` existía en el schema y en la UI pero **nunca se escribía** (campo muerto).

Ahora se persiste `stripePaymentId: session.payment_intent` en los 3 lugares donde una orden pasa a `paid`:
- `handleFormationPaid` (formación, home)
- `handleServicesPaid` (servicios à la carte)
- El flujo inline de add-ons/marketing (`/new-business`)

**Limitación conocida:** las órdenes pagadas *antes* de este deploy (2026-07-07) tienen `stripePaymentId` vacío. Un reembolso o chargeback sobre una de esas órdenes viejas no se puede emparejar automáticamente — el webhook simplemente loguea `skipped: 'no_order'` y devuelve 200. Solo afecta a órdenes ya pagadas para esa fecha; todo lo pagado después queda cubierto.

---

## Reembolsos (`charge.refunded`)

Handler: `handleChargeRefunded` en `backend/app/api/webhooks/stripe/route.ts`.

Se recalcula siempre desde los montos **acumulados** de Stripe (`charge.amount` / `charge.amount_refunded`), nunca por incremento — así es seguro si Stripe reintenta el mismo evento (idempotente).

| Caso | `Order.paymentStatus` | `accounting_income` (por `order_id`) |
|---|---|---|
| Reembolso total (`amount_refunded >= amount`) | `'refunded'` | `payment_status:'refunded'`, `amount_paid:0` |
| Reembolso parcial | sin cambio (sigue `'paid'`) + nota fechada en `Order.notes` con el monto | `payment_status:'partial'`, `amount_paid:` neto restante |

No se manda ningún email — el founder ya sabe que lo hizo (fue él quien apretó "Refund" en Stripe).

---

## Chargebacks (`charge.dispute.created` / `charge.dispute.closed`)

A diferencia del reembolso, el chargeback **no lo inicia el founder** — lo abre el cliente con su banco, sin avisar. Stripe da un plazo corto para responder con evidencia, así que sí se manda un email de alerta interna.

Handlers: `handleDisputeCreated` y `handleDisputeClosed`, mismo archivo.

- **`charge.dispute.created`**: `Order.paymentStatus = 'disputed'` (badge rojo "En disputa" en el panel). **No se toca `accounting_income` todavía** — el resultado de la disputa no se sabe aún, así que se sigue contando como ingreso hasta que se resuelva (evita ajustar dos veces si se gana). Se manda un email a `alert@opabiz.com` (mismo patrón `FROM_OPABIZ_ALERTS` que las demás alertas internas de este archivo) con los datos de la orden, el monto en disputa, y un link a `/admin/orders/[id]`.
- **`charge.dispute.closed`** con `status === 'lost'`: se trata exactamente como un reembolso total (`paymentStatus:'refunded'`, `accounting_income` igual que arriba), con una nota distinguiendo que fue un chargeback perdido y no un reembolso voluntario.
- **`charge.dispute.closed`** con cualquier otro resultado (`won`, `warning_closed`, etc.): `Order.paymentStatus` vuelve a `'paid'`, con nota de que se resolvió a favor. No se toca `accounting_income` (nunca se había tocado).

---

## Cambios en la UI

**Panel de órdenes** (`backend/app/admin/OrdersTable.tsx` y `backend/app/admin/orders/[id]/page.tsx`, mapa `PAYMENT_BADGE` en ambos): nuevo badge
```ts
disputed: { label: 'En disputa', bg: '#fecdd3', color: '#9f1239' }
```
(`refunded` ya existía sin usar — ahora se dispara solo, no hizo falta agregarlo.)

**Contabilidad** — el estado `'refunded'` no existía en `accounting_income.payment_status` (solo `paid`/`pending`/`partial`). Se agregó en 3 pantallas:
- `backend/app/admin/contabilidad/ingresos/page.tsx` — `STATUS_OPTS`, `STATUS_LABEL`, `STATUS_CLASS` (+ clase CSS `.badge-orange`)
- `backend/app/admin/contabilidad/clientes/[id]/page.tsx` — `PAY_LABEL`, `PAY_CLASS` (+ `.badge-orange`)
- `backend/app/admin/contabilidad/reportes/page.tsx` — ternario inline de la tabla de ingresos

**Fix de cálculo:** `backend/app/api/contabilidad/dashboard/route.ts`, la consulta de `pendingIncome` (dinero pendiente de cobrar) usaba `.neq('payment_status','paid')`, lo que metía una fila reembolsada dentro de "plata que nos deben" — incorrecto, esa plata no se debe, se devolvió. Se cambió a excluir ambos: `.not('payment_status','in','("paid","refunded")')`.

Los totales de ingresos (`sumPaid` en `dashboard/route.ts` y `reportes/route.ts`) **no necesitaron tocarse** — ya usaban `amount_paid` como fallback para cualquier estado que no fuera `'paid'`, así que al poner `amount_paid:0` en el reembolso, el total baja solo.

---

## Verificación de Supabase (2026-07-07)

`accounting_income.payment_status` **no tiene ningún CHECK constraint** — se confirmó corriendo:
```sql
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'accounting_income'::regclass;
```
Solo devolvió la FK a `accounting_clients`, el `UNIQUE` de `invoice_number` y la primary key. Es texto libre — `'refunded'` no necesitó ninguna migración.

---

## Configuración manual requerida en Stripe (hecha 2026-07-07)

Los webhooks de Stripe (test/sandbox **y** Live) tenían que agregar estos 3 eventos a su lista de "Listening to" — no vienen solos, hay que sumarlos a mano en cada uno:
```
charge.refunded
charge.dispute.created
charge.dispute.closed
```
✅ Hecho en ambos webhooks el 2026-07-07.

---

## Qué NO cubre este proceso

- **No hay botón de "reembolsar" en el sitio.** El reembolso siempre se inicia en Stripe.
- **Chargebacks sobre órdenes pagadas antes del 2026-07-07** no se pueden emparejar (ver limitación de `stripePaymentId` arriba).
- **No hay email cuando se resuelve una disputa** (ganada o perdida) — solo se avisa cuando se *abre* (`charge.dispute.created`). Si hace falta avisar también en la resolución, es una extensión simple del mismo patrón.
- **Reembolsos parciales no generan alerta por email** — solo se anota en `Order.notes` y se ajusta la contabilidad.

## Historial

- **2026-07-07**: implementado durante la preparación de Stripe Live — surgió al preguntar "¿cómo manejamos un reembolso?" y confirmar que era 100% manual. Se sumaron los chargebacks al mismo alcance porque tocaba exactamente la misma zona del código. Doc creado.
