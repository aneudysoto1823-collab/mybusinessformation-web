# 17 — GA4 Smoke Test & Troubleshooting

Protocolo para validar que GA4 está funcionando correctamente después de un deploy, o para diagnosticar cuando los eventos no aparecen en GA4.

> Ver doc maestro en [`LOGICA_DE_NEGOCIO/19_analytics_ga4.md`](../LOGICA_DE_NEGOCIO/19_analytics_ga4.md).

---

## Pre-requisitos

- `NEXT_PUBLIC_GA_ID=G-6F9CHVYRXW` configurado en Vercel (al menos Production)
- Deploy reciente que incluya `lib/tracking.ts`, `app/layout.tsx` con los 3 Script tags, y `components/CookieConsent.tsx`
- Acceso a https://analytics.google.com → property `mybusinessformation.com`

---

## Smoke test — checklist completo

Hacelo una vez al día siguiente del deploy para confirmar que todo el pipeline funciona end-to-end.

### Paso 1: ¿gtag.js cargó?

1. Abrir https://mybusinessformation.com en un browser **en modo incógnito** (para empezar sin consent guardado).
2. DevTools → Network → filtrar `gtag`.
3. Debe aparecer: `gtag/js?id=G-6F9CHVYRXW` con status 200.

❌ No aparece → el env var no está en Vercel o el deploy no es reciente. Verificar en Vercel → Settings → Environment Variables.

### Paso 2: ¿Consent Mode v2 inicia denied?

1. DevTools → Application → Cookies → buscar `mbf_consent`. **No debe existir** todavía (incógnito limpio).
2. DevTools → Console → ejecutar:
   ```js
   window.dataLayer.filter(x => Array.isArray(x) && x[0] === 'consent')
   ```
3. Debe mostrar:
   ```
   ['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ... }]
   ```

❌ No aparece → el Script `gtag-consent-default` (strategy `beforeInteractive`) no corrió. Revisar `app/layout.tsx`.

### Paso 3: ¿El banner aparece?

1. Al recargar la página, después de ~500ms debe aparecer el card oscuro abajo con "Cookie preferences" + 3 botones.

❌ No aparece → revisar consola por errores en `CookieConsent.tsx`. Si dice "already decided", borrar localStorage + cookie y refrescar.

### Paso 4: ¿El consent update funciona?

1. Click en "Accept all".
2. DevTools → Console:
   ```js
   window.dataLayer.filter(x => Array.isArray(x) && x[0] === 'consent' && x[1] === 'update')
   ```
3. Debe mostrar:
   ```
   ['consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted', ... }]
   ```
4. Cookies → `mbf_consent` debe existir con `analytics: true, marketing: true`.

❌ No aparece → revisar `setConsent()` en `lib/consent.ts` y que `updateGtagConsent()` se llama.

### Paso 5: ¿Los eventos custom llegan?

1. En GA4 → Reports → Realtime → **Event count by Event name**.
2. En el sitio (mismo browser/sesión que aceptó consent):
   - Click en EN/ES toggle → debe llegar `lang_toggle`
   - Click en una pricing card "Get Started" → debe llegar `package_selected` + `formation_start`
   - Llenar step 1 del wizard + Next → debe llegar `step_completed` con `step_number: 1`
   - Click en el botón del chat de Claudia, escribir un mensaje, enviar → debe llegar `claudia_message_sent`

Real-Time tiene **~30-60 segundos de delay**. Esperar.

❌ No aparecen los eventos:
  - Consola del browser: ¿`window.gtag` está definido? `typeof window.gtag` debe ser `function`.
  - ¿Consent es `granted`? Si está `denied`, eventos van como cookieless ping (todavía deberían contar en GA4, pero a veces tardan más en aparecer).
  - ¿Ad-blocker activo? uBlock Origin / Brave Shields bloquean `googletagmanager.com`. Probar en otro browser.
  - ¿El Measurement ID es correcto? Comparar con el de GA4 → Admin → Data Streams.

### Paso 6: ¿payment_completed llega después de Stripe?

> Solo se puede testear con una compra real (modo test de Stripe en dev/preview, modo live en producción).

1. Hacer una compra de test en `/new-business` (modo test de Stripe).
2. Después del redirect a `/new-business/success?session_id=cs_test_xxx`:
3. GA4 Real-Time debe mostrar `payment_completed` con `stripe_session: 'cs_test_xxx'`.

---

## Errores comunes

### "gtag is not defined"

- Causa: `NEXT_PUBLIC_GA_ID` no está en Vercel. Sin el ID, `layout.tsx` no renderiza los Scripts de `gtag.js` ni `gtag-init`.
- Fix: agregar el env var, redeployar.

### "Eventos no aparecen en GA4 Realtime"

1. **Esperar 60 segundos** — Realtime no es instantáneo.
2. Verificar que el evento se mandó: DevTools → Network → filtro `collect` (o `g/collect`). Cada `trackEvent` dispara un POST a `https://region1.google-analytics.com/g/collect`.
3. Si los POSTs salen pero GA4 no los muestra: ¿el Measurement ID del POST coincide con el de la property? `tid=G-XXX` en la URL del request.

### "Pageviews sí, eventos custom no"

- Causa: `trackEvent()` se llamó server-side (no entrega) o antes de que `gtag.js` cargara.
- Fix: `lib/tracking.ts` ya chequea `typeof window === 'undefined'`. Si pasa eso es porque `trackEvent` se ejecuta antes de `afterInteractive`. Mover el call a un `onClick`, `useEffect`, o handler.

### "Consent Mode v2 manda eventos a denied"

- Causa: el usuario rechazó el banner, o nunca lo abrió y el default es `denied`.
- Comportamiento esperado: gtag manda un **cookieless ping** que GA4 cuenta para el conversion modelado, pero no rastrea visitor individual.
- Verificar: el ping tiene `gcs=G100` (denied) o `gcs=G111` (granted) en la URL.

### "Los eventos llegan duplicados"

- Causa probable: el componente que tiene `trackEvent` se monta dos veces (StrictMode en dev) o el event handler se registra varias veces.
- Verificar: ¿hay un `useEffect` sin dep array bien hecho? ¿Un `onClick` que se duplica con React 19 effects?

### "El banner aparece todas las veces"

- Causa: la cookie `mbf_consent` no se está guardando, o el dominio del cookie no coincide.
- Verificar: en DevTools → Application → Cookies, después de aceptar, `mbf_consent` debe estar con domain `mybusinessformation.com` y path `/`.

### Real-Time muestra 0 visitors pero hay tráfico

- ¿Filtros internos de IP en GA4 → Admin → Data Streams → tu Stream → Internal Traffic? Quizás tu IP está excluida.
- ¿Estás mirando la property correcta? Si hay varias.
- ¿El reporte es de los últimos 30 minutos? Cambiar a 5 minutos.

---

## Validación post-incidente

Si hubo un downtime / rollback / cambio mayor:

1. Correr Pasos 1-5 del checklist arriba.
2. Verificar que `NEXT_PUBLIC_GA_ID` no cambió en Vercel.
3. Revisar últimos commits a `lib/tracking.ts`, `lib/consent.ts`, `app/layout.tsx`, `components/CookieConsent.tsx`.
4. Si todo OK pero los eventos no llegan: revisar GA4 → Admin → Data Streams → ¿el stream sigue activo? ¿Cambió el Measurement ID?

---

## Referencias

- Doc maestro: [`LOGICA_DE_NEGOCIO/19_analytics_ga4.md`](../LOGICA_DE_NEGOCIO/19_analytics_ga4.md)
- Consent Mode v2 spec: https://developers.google.com/tag-platform/security/guides/consent
- gtag.js reference: https://developers.google.com/tag-platform/gtagjs/reference
- GA4 events guide: https://support.google.com/analytics/answer/9322688
