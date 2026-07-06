# Proceso 34 — Proceso Orden Salvada

## Qué es este proceso

Define **cuándo el sistema crea una orden en la base de datos** cuando un cliente está llenando el formulario de formación en el home (`/`).

La decisión importante: **NO todo cliente que empieza el form genera una orden real**. Solo se crea la orden en Supabase cuando el cliente **explícitamente da al botón Save** teniendo su email ya escrito. Los que solo avanzan pasos sin darle a Save **NO** entran a la base — se quedan en el localStorage de su navegador.

Esto evita ensuciar la base con miles de intentos abandonados y respeta la intención del cliente: si no apretó Save, no quería guardar.

---

## Los 3 escenarios del cliente

### Escenario 1 — Cliente pasó del paso 2 (puso email) Y le dio a Save

1. Cliente entra al form, elige LLC/Corp, elige paquete (paso 1)
2. Llena su email + nombre + apellido + empresa (paso 2)
3. **Le da al botón 💾 Save** en el footer del form

**Qué pasa**:
- Se crea una fila en Supabase `Order` con `isDraft: true`
- Se genera un número FBFC-XXXXXXXX (primeros 8 chars del UUID del Order en mayúsculas)
- Se muestra el FBFC al cliente en el header del form
- Se dispara el email `sendDraftSavedEmail` al cliente con el FBFC y un link `?continue=FBFC-XXX`
- Aparece en el panel admin en la sección **OrderDraft** (`/admin/drafts`)

Si el cliente vuelve a darle a Save después (misma sesión, mismo navegador):
- No crea otra orden — hace UPDATE de la misma fila con los datos actualizados
- NO envía otro email (solo el primero)

### Escenario 2 — Cliente pasó del paso 2 y avanzó hasta paso 4-5 sin darle a Save

1. Cliente llena email + nombre + empresa (paso 2)
2. Avanza a paso 3, 4, 5 llenando más datos
3. **Cierra el navegador o pestaña sin apretar Save**

**Qué pasa**:
- Solo se guarda en el `localStorage` del navegador del cliente (key `mbf_form_progress`)
- **NO** se crea nada en Supabase
- **NO** se genera FBFC
- **NO** se envía email
- **NO** aparece en el panel admin (no existe la orden)

Cuando el cliente vuelve al sitio desde el mismo navegador:
- El botón "Continue My Application" del landing lee el localStorage
- Si hay progreso guardado (step >= 2) → restaura el snapshot directo → abre el form donde quedó
- Si no hay progreso → abre modal que pide número FBFC (para clientes que sí tenían FBFC del escenario 1)

### Escenario 3 — Cliente vuelve desde otro dispositivo con el FBFC

Solo aplica si el cliente pasó por el Escenario 1 (le dio Save y recibió email con FBFC):

1. Cliente abre el link `?continue=FBFC-XXX` del email desde su otro dispositivo → auto-loguea + restaura snapshot
2. Alternativa: click "Continue My Application" en el landing → modal pide FBFC → cliente pega FBFC-XXX → restaura

---

## Regla técnica de qué función dispara qué

En `backend/app/page.tsx`:

| Función | Cuándo se llama | Qué hace |
|---|---|---|
| `fmSaveProgress()` | Cada `fmGoToStep()` (avance de paso) | Solo guarda localStorage. **No toca Supabase**. |
| `fmSaveProgressAndSync()` | Solo desde `saveOrder()` (botón Save) | Guarda localStorage **+** POST a `/api/orders/draft` |
| `fmSyncDraftToServer(snapshot)` | Solo desde `fmSaveProgressAndSync()` | Ejecuta el POST. Requiere firstName + lastName + email + companyName. |
| `saveOrder()` | onClick del botón 💾 Save del form | Llama `fmSaveProgressAndSync()` + muestra toast verde "Guardado". |

**Regla histórica del bug**: la función `fmSaveProgress` antes (código de Fabián, revertido 2026-07-06) sincronizaba al server en cada avance de paso. Eso generaba FBFC + email cuando el cliente **no había pedido** guardar. Fue cambiado para que solo dispare cuando el cliente clickea Save.

---

## Regla técnica del panel admin

En `backend/app/admin/page.tsx`:
- `getOrders()` filtra `.filter(o => !o.isDraft)` → los drafts NO aparecen en el panel principal.
- Motivo: el panel operativo del equipo solo debe mostrar órdenes reales (paidas o esperando pago después de checkout).

En `backend/app/admin/drafts/page.tsx` (nueva sección **OrderDraft**):
- `getDrafts()` filtra `.eq('isDraft', true)`.
- Ordena por `updatedAt` descendente (los más recientes primero).
- Muestra: FBFC, empresa, cliente, email, teléfono, paso alcanzado, última actualización.
- Stats: total drafts, últimas 24h, últimos 7 días.

---

## Endpoints involucrados

| Endpoint | Método | Trigger | Efecto |
|---|---|---|---|
| `/api/orders/draft` | POST | `fmSyncDraftToServer` (solo desde saveOrder) | INSERT o UPDATE de Order con `isDraft:true`. La primera vez envía email al cliente. |
| `/api/orders/draft` | GET | `findOrder()` cuando cliente pega FBFC | Devuelve `{isDraft, orderId, snapshot}` para restaurar |
| `/api/client-auth` | POST | `findOrder()` cuando cliente pega FBFC | Setea cookie `client_session` con el orderId. Blindaje contra adivinar orderIds. |
| `/api/orders` | POST | Cliente completa el checkout (pago Stripe) | Promueve el draft a orden real: `isDraft:false`, dispara A1 al cliente + A0 al equipo. |

---

## Email al cliente (Escenario 1)

Configurado en `backend/app/api/orders/draft/route.ts` función `sendDraftSavedEmail`:
- Subject: `OpaBiz: Save your application number — FBFC-XXX`
- Contenido: nombre del cliente, nombre de la empresa, link `Continue My Application →` que reabre el form ya restaurado
- Copy del número FBFC en cuadro visible
- Disclaimer: "This isn't a confirmed order yet — it's just your progress so far. No payment has been made."

Este email se envía solo la primera vez que se crea el draft (path INSERT del endpoint). Los updates posteriores no envían más emails.

---

## Diferencia con la orden real (paidas)

| Aspecto | Draft (isDraft:true) | Orden real (isDraft:false) |
|---|---|---|
| Se crea cuando | Cliente da al botón Save | Cliente completa el pago con Stripe |
| Aparece en panel admin | `/admin/drafts` (sección OrderDraft) | `/admin` (panel principal) |
| Email al cliente | `sendDraftSavedEmail` — "Save your application number" | A1 — "Order confirmation" |
| Email al equipo | Ninguno | A0 alerta "🆕 NUEVA ORDEN CREADA" a `alert@opabiz.com` |
| Puede pagarse | No — es solo un borrador | Ya está paga |
| Puede editarse | Sí, cliente sigue llenando pasos | No |
| Se promociona a real | Sí, cuando el cliente completa el checkout | — |

---

## Escenarios que NO cubre este proceso

- **Cliente entra al form pero no llena email** → NO se guarda nada, ni siquiera localStorage significativo (se ignora hasta que pase el paso 2).
- **Cliente termina y paga sin Save** → sigue funcionando: al completar el checkout, la orden se crea directamente `isDraft:false` con A1 y A0. No pasa por draft.

---

## Historial

- **2026-07-02**: Fabián implementa el sistema de draft con FBFC + email desde el server (`POST /api/orders/draft`), disparado en cada avance de paso.
- **2026-07-06**: se refactoriza el trigger — el sync al server ya NO dispara en cada avance de paso, solo cuando el cliente clickea Save. Se crea la sección `/admin/drafts`. Doc 34 creado (este archivo).
