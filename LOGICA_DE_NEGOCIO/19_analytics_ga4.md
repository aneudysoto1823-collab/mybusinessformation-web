# 19 — Google Analytics 4 (GA4)

Documento maestro del sistema de analytics del proyecto. Cubre cómo está armado, qué eventos se disparan, dónde, con qué params, y qué decisiones de privacidad/PII aplican.

> **Slot 13 del roadmap original (CONTEXTO Etapa 13)** se quedó sin número en `LOGICA_DE_NEGOCIO/` porque slot 13 ya lo ocupaba `13_seguridad_panel_admin.md`. Por eso este doc va con el siguiente número libre — 19. Cuando alguien busque "Etapa 13" en CONTEXTO, este es el doc.

---

## Stack

| Componente | Versión / Producto | Rol |
|------------|--------------------|-----|
| GA4 property | `opabiz.com` | Recibe eventos |
| Measurement ID | `G-6F9CHVYRXW` | Identifica la property en gtag |
| gtag.js | `https://www.googletagmanager.com/gtag/js` | Script oficial de Google |
| Consent Mode v2 | configurado en `lib/consent.ts` | CCPA/GDPR compliance |
| Cookie Consent banner | `components/CookieConsent.tsx` | UI del consent |
| Helper único | `backend/lib/tracking.ts` | API `trackEvent(name, params)` SSR-safe |

---

## Env vars

```env
NEXT_PUBLIC_GA_ID=G-6F9CHVYRXW
```

**Por qué `NEXT_PUBLIC_`**: el ID se inlinea en el bundle del cliente (gtag.js corre en el browser). No es un secreto — cualquiera que abra el sitio lo ve en la URL del Script tag.

**Vercel**: agregar en Production. Recomendado: agregarlo también en Preview/Development para que el dev local con `vercel env pull` reciba GA, pero **registrar custom dimensions y validar Real-Time SOLO en Production** para no contaminar datos.

**Sin el env var**: `layout.tsx` no carga gtag.js y `trackEvent()` queda en no-op silencioso. El sitio funciona normal.

---

## Carga inicial (orden de Scripts en `app/layout.tsx`)

1. **`gtag-consent-default`** (strategy `beforeInteractive`) — antes de que cualquier tracker cargue, declara `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` como `denied`. `functionality_storage` y `security_storage` quedan `granted` (son sin consent en CCPA/GDPR). `wait_for_update: 500` le dice a gtag que espere hasta 500 ms antes de bloquear pixels, para que el banner haga su decisión sin perder el primer pageview.

2. **`gtag-js`** (strategy `afterInteractive`) — carga `https://www.googletagmanager.com/gtag/js?id=G-...`. Gated en `process.env.NEXT_PUBLIC_GA_ID`: si no está seteado, el Script no se renderiza.

3. **`gtag-init`** (strategy `afterInteractive`) — corre `gtag('js', new Date())` y `gtag('config', '<ID>', { send_page_view: true, anonymize_ip: true })`.

`send_page_view: true` ⇒ GA4 trackea pageviews automáticamente en cada navegación. No hay que llamar manualmente.

`anonymize_ip: true` ⇒ la IP del visitante se trunca antes de almacenarse (último octeto IPv4, últimos 80 bits IPv6). Requerido por GDPR para legitimate interest.

---

## Consent Mode v2 — flujo

```
Default (antes del banner)
  analytics_storage   = denied
  ad_storage          = denied
  ad_user_data        = denied
  ad_personalization  = denied

Cliente clickea en banner:

  "Accept all"        → analytics=granted, marketing=granted
  "Only necessary"    → analytics=denied,  marketing=denied
  "Customize" + save  → según toggles del usuario

→ setConsent({analytics, marketing}) en lib/consent.ts:
   - guarda en cookie `mbf_consent` (1 año) + localStorage
   - llama updateGtagConsent() que mapea:
       analytics_storage     ← analytics
       ad_storage            ← marketing
       ad_user_data          ← marketing
       ad_personalization    ← marketing
   - dispara CustomEvent('mbf:consent-change') para otros tabs/componentes
```

**Importante**: si el usuario rechaza analytics, gtag sigue enviando un **cookieless ping** anonimizado (no almacena cookies, pero sí registra el conversion modelado). Esto es Consent Mode v2 estándar — no perdemos datos de funnel, solo el atribuible al usuario individual.

---

## Eventos custom — inventario

Cada `trackEvent(name, params)` se dispara solo si `window.gtag` está cargado (SSR-safe). Params nunca llevan PII.

### Funnel de formación (home wizard)

| Evento | Trigger | Archivo:Línea | Params | Insight |
|--------|---------|---------------|--------|---------|
| `formation_start` | Click en CTA de una pricing card que abre el form | [`app/page.tsx`](backend/app/page.tsx) `openFormFromPkg()` | `package`, `entity` | Visitor pasó de "browsing" a "intent". Base del funnel. |
| `step_completed` | Validación del step pasa y avanza al siguiente | [`app/page.tsx`](backend/app/page.tsx) `fmNext()` | `step_number`, `package`, `entity` | Identificar dónde se traba el wizard. Drop-off rate por step. |
| `package_selected` | Click en una pricing card | [`app/page.tsx`](backend/app/page.tsx) `openFormFromPkg()` | `package`, `entity`, `source` | Qué paquete elige la gente antes de empezar (compare con package final). |
| `payment_started` | Click en checkout de `/new-business` (marketing flow) | [`app/new-business/page.tsx`](backend/app/new-business/page.tsx) `handleCheckout()` | `services`, `services_count`, `is_bundle`, `lang`, `source` | Conversion del flujo de marketing automation. |
| `payment_completed` | Redirect de Stripe a `/new-business/success` | [`app/new-business/success/PaymentCompletedTracker.tsx`](backend/app/new-business/success/PaymentCompletedTracker.tsx) | `stripe_session`, `source` | Confirmación de compra (mirror cliente del webhook server). |

### Chat Claudia

| Evento | Trigger | Archivo:Línea | Params | Insight |
|--------|---------|---------------|--------|---------|
| `claudia_message_sent` | Usuario envía mensaje en el chat | [`components/ChatWidget.tsx`](backend/components/ChatWidget.tsx) `send()` | `message_length`, `turn` | Engagement con Claudia. NO el texto (puede tener PII). |
| `claudia_session_link_used` | Click en link de sesión que Claudia genera | [`components/ChatWidget.tsx`](backend/components/ChatWidget.tsx) `renderMessageContent()` | — | Eficacia de la "warm handoff" Claudia → wizard. |

### Portal cliente

| Evento | Trigger | Archivo:Línea | Params | Insight |
|--------|---------|---------------|--------|---------|
| `client_login_success` | Login en `/client-portal` exitoso | [`app/client-portal/page.tsx`](backend/app/client-portal/page.tsx) `handleSubmit()` | `lang` | Retención de clientes. |

### UX

| Evento | Trigger | Archivo:Línea | Params | Insight |
|--------|---------|---------------|--------|---------|
| `lang_toggle` | Click en EN/ES toggle | [`app/page.tsx`](backend/app/page.tsx) `setLang()`, [`app/client-portal/page.tsx`](backend/app/client-portal/page.tsx) `switchLang()`, [`app/client-portal/dashboard/DashboardView.tsx`](backend/app/client-portal/dashboard/DashboardView.tsx) `switchLang()` | `from`, `to`, `source` | Split EN/ES de la audiencia. |

---

## Custom dimensions (registrar en GA4 Admin)

GA4 → Admin → Custom Definitions → Create custom dimension. Scope `Event` para todas:

| Dimension name | Event parameter | Scope | Por qué |
|----------------|-----------------|-------|---------|
| Package | `package` | Event | Segmentar conversion por paquete (basic/standard/premium) |
| Step number | `step_number` | Event | Funnel breakdown por step del wizard |
| Idioma | `lang` | Event | EN vs ES como audiencia |

Sin registrarlas, GA4 igual recibe los params pero no son filtrables en reports.

---

## PII audit

Política: **ningún `trackEvent` envía datos personales**. PII = email, nombre, apellido, dirección, teléfono, ITIN/SSN, número de tarjeta, FBFC/FBNB del cliente, ID interno de orden.

Verificación por evento:

- `formation_start` — `package`, `entity` — OK
- `step_completed` — `step_number`, `package`, `entity` — OK
- `package_selected` — `package`, `entity`, `source` — OK
- `payment_started` — `services`, `services_count`, `is_bundle`, `lang`, `source` — OK (NO `company_name`, NO `email`)
- `payment_completed` — `stripe_session` (opaco, no PII), `source` — OK
- `claudia_message_sent` — `message_length`, `turn` — OK (NO `content` del mensaje)
- `claudia_session_link_used` — sin params — OK
- `client_login_success` — `lang` — OK (NO `email`, NO FBFC)
- `lang_toggle` — `from`, `to`, `source` — OK

Si un evento futuro necesita identificar al cliente, usar `gtag('set', { user_id: '<hash>' })` con un hash determinístico (SHA-256 del email + salt local), nunca el email crudo.

---

## Smoke test

Ver protocolo en [`TROUBLESHOOTING/17_ga4_smoke_test.md`](TROUBLESHOOTING/17_ga4_smoke_test.md).

---

## Decisiones embutidas

- **`anonymize_ip: true`** — más conservador. Algunos preferirían IPs completas para geolocation precisa, pero la diferencia es mínima (GA4 ya hace city-level por IP truncada) y el upside de privacidad pesa.

- **Pageviews automáticos** (`send_page_view: true`) — más simple. En Next.js App Router, cada navegación dispara un pageview automáticamente. No necesitamos hook manual con `usePathname()`.

- **Cookieless ping aceptado** — Consent Mode v2 estándar. Si el usuario rechaza analytics, igual queremos saber que pasó (no qué visitor). Compliance OK con CCPA/GDPR.

- **Helper único `trackEvent()`** vs llamar gtag directo — el helper es SSR-safe (chequea `window`), tipa el nombre del evento (`GAEventName` union), y filtra `undefined` antes de mandar. Cuando agregás un evento nuevo, lo agregás al type union y el compilador te avisa si lo mistipear en algún call site.

- **No usar `next/script` para gtag-init inline en CSP**: el CSP tiene `'unsafe-inline'` para scripts (ya documentado en `18_security_headers_y_hardening.md`). Si en el futuro quitamos `'unsafe-inline'`, los scripts inline de gtag necesitarán un nonce.

---

## Cómo agregar un evento nuevo

1. Agregar el nombre al type union en [`lib/tracking.ts`](backend/lib/tracking.ts):
   ```ts
   export type GAEventName = 'formation_start' | 'step_completed' | ... | 'mi_evento_nuevo'
   ```

2. Llamar `trackEvent('mi_evento_nuevo', { param: value })` en el sitio del trigger.

3. **NO incluir PII** en params. Si dudás, miralo de nuevo.

4. Actualizar este doc con la fila nueva en la tabla de inventario.

5. Si necesitás filtrar/segmentar por un param nuevo en reports, registrar la custom dimension en GA4 Admin.

---

## Troubleshooting

Ver [`TROUBLESHOOTING/17_ga4_smoke_test.md`](TROUBLESHOOTING/17_ga4_smoke_test.md) — incluye:
- Cómo validar Real-Time
- Qué hacer si los eventos no aparecen
- Cómo confirmar que Consent Mode v2 está activo
- Errores comunes (gtag undefined, eventos sin params, etc.)
