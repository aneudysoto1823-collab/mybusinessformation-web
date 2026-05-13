# Troubleshooting 15 — Alertas de Sentry

Cómo responder cuando llega un email `[Sentry]` con un error nuevo de producción.

---

## Qué significa la alerta

Cuando Sentry te manda un email es porque hay **un error en runtime que afectó al menos a 1 usuario** (o a vos durante un test). El email viene de `noreply@sentry.io` con subject tipo:

```
[Sentry] [Issue] javascript-nextjs — TypeError: Cannot read property 'X' of null
```

Sentry agrupa errores idénticos por "fingerprint" (combinación archivo + línea + tipo de error). **El primer email es por un issue nuevo.** Si el mismo error vuelve a pasar, NO te llega otro email (a menos que cambies la regla de alerta).

---

## Primer chequeo — 5 minutos

### 1. Abrir el issue en el dashboard

El email tiene un link directo. Abrir → vas a sentry.io → el issue te muestra:
- **Stack trace completo** (qué archivo, qué línea, qué función).
- **Browser + OS + país** del usuario.
- **Cuántos eventos** y **cuántos usuarios** afectados.
- **Breadcrumbs**: los últimos pasos del usuario antes del error (clicks, navegación, requests).
- **Tags**: `environment` (debe ser `production`), `release`, `runtime` (node/browser/edge).

### 2. ¿Está afectando a clientes reales o es ruido?

Mirar el tab **Users Affected**:

- **0-1 user affected, `environment: development` o `preview`** → ruido (probablemente un test propio). **Resolver** el issue en Sentry y seguir.
- **0-1 user affected, `environment: production`** → puede ser ruido (un bot, una request inválida) o un caso raro. Investigar 5 min, decidir.
- **3+ users affected, production** → bug real. Tratar como incidente.

### 3. Categorizar el error en 1 de 4 cajas

| Caja | Síntoma | Acción inmediata |
|---|---|---|
| **A. Bug nuevo del código** | El stack trace apunta a un archivo nuestro (`backend/app/...` o `backend/lib/...`) | Hotfix en branch + PR + merge + Vercel deploya |
| **B. Endpoint downstream caído** | El error es `Network error`, `fetch failed`, `503`, `timeout` o menciona Supabase/Stripe/Resend | Verificar status de ese servicio. Si está caído: esperar o switchear a fallback si existe |
| **C. Regression** | El error empezó después de un deploy reciente. Mirar el campo `release` del issue | Rollback en Vercel (Deployments → Promote anterior) mientras se investiga |
| **D. Spam de bots / requests inválidos** | Errores tipo `Invalid JSON in body`, paths raros (`/wp-admin`, `/.env`, `/api/v1/...` que no existe), volumen anormal | Silenciar el issue en Sentry (Action → Ignore) o agregar regla en `beforeSend` del filter PII si conviene |

---

## Acciones por caja

### Caja A — Bug nuevo del código

1. Abrir el archivo y la línea exactos que dice el stack trace.
2. Reproducir local con `npm run dev` si es posible (`http://localhost:3000` + replicar el flujo del breadcrumb).
3. Fix + commit + push. Vercel deploya solo.
4. En el issue de Sentry: **Resolve in next release**. Cuando el deploy esté Active, Sentry marca el issue como resolved automáticamente.
5. Si vuelve a aparecer post-deploy → el fix no funcionó. Re-investigar.

### Caja B — Endpoint downstream caído

1. Verificar el status del servicio que falla:
   - Supabase: https://status.supabase.com
   - Stripe: https://status.stripe.com
   - Resend: https://resend-status.com
   - Vercel: https://www.vercel-status.com
2. Si está caído → esperar resolución del proveedor. **No hay fix nuestro.** Avisar al usuario por canal interno que va a haber lentitud/errores temporales.
3. Si NO está caído pero igual falla → puede ser:
   - Variable de entorno mal configurada (API key inválida).
   - Rate limit de nuestro lado (Resend free tier, etc.).
   - Latencia transitoria — observar 10 min antes de actuar.
4. Si es por rate limit → upgrade del plan del servicio o backoff en código.

### Caja C — Regression

1. Verificar el `release` en el issue (debería ser el commit SHA).
2. Mirar el último deploy en Vercel → ver qué commit cambió.
3. Si claramente es del último commit:
   - **Rollback inmediato** en Vercel: Deployments → buscar el anterior → "Promote to Production".
   - Después fix el bug en branch sin presión.
4. En Sentry: marcar el issue como **Resolve in next release** una vez fixed.

### Caja D — Spam de bots

1. Abrir el issue, mirar los breadcrumbs y el path del request.
2. Si claramente es un bot (path tipo `/wp-admin`, `/admin.php`, `/.git/config`, etc.):
   - **Action → Ignore** en Sentry. Esto silencia el issue para siempre.
3. Si es un patrón frecuente (varios issues similares):
   - Considerar agregar filtro en `backend/lib/sentry-pii-filter.ts` → `beforeSend` puede retornar `null` para descartar el evento.
   - Ejemplo: `if (event.request?.url?.includes('/wp-admin')) return null`
4. **No reglar de más.** Solo silenciar si es claramente ruido sin valor.

---

## Cómo cerrar el incidente

Después de aplicar la acción correspondiente:

1. **En Sentry**: marcar el issue como `Resolved` (Action → Resolve, o "Resolve in next release" si esperás un deploy).
2. **En el chat del equipo** (si se notificó): confirmar resolución con SHA del fix.
3. **Si fue caja A o C**: agregar al doc `LOGICA_DE_NEGOCIO/<el archivo del área afectada>` si la causa raíz fue algo no obvio que vale documentar para futuro.
4. **Si fue caja B** y se repite con el mismo proveedor varias veces: anotar para evaluar un upgrade de plan o un cambio arquitectural.

---

## Cuándo escalar / parar / pedir ayuda

- **Más de 50 users affected en 30 min** → incidente mayor. Avisar a Fabián por canal directo. Considerar poner el sitio en mantenimiento si es crítico (`/api/health` con flag, o ENVIRONMENT=maintenance en Vercel).
- **Stack trace no ayuda** (todo minificado, no se entiende): activar `SENTRY_AUTH_TOKEN` para sourcemaps (item pendiente de Etapa 15). Sin eso es muy difícil debuggear código de browser de producción.
- **El issue se cierra y vuelve a aparecer 3+ veces** después de fix → fix incompleto. Parar, re-pensar, posiblemente pedir code review.

---

## Configuración relacionada

- **Alert Rule en Sentry:** configurada el 2026-05-13. Manda email a `admin@mybusinessformation.com` en la primera ocurrencia de cada error nuevo (no spamea con errores repetidos).
- **Filtro PII:** `backend/lib/sentry-pii-filter.ts` limpia email/teléfono/SSN/tarjetas/passwords antes de enviar a Sentry. NUNCA modificar este filtro sin auditar el impacto privacy.
- **Tunnel route:** `/monitoring/*` en Next.js. Evita ad-blockers. No tocar.

---

## Smoke test mensual de Sentry

Ver protocolo completo en `LOGICA_DE_NEGOCIO/15_sentry_betterstack_monitoring.md` (sección "Validación periódica").

Resumen rápido:
1. Visitar `/sentry-client-test` en preview (NO en production, ahí da 404).
2. Apretar los 3 botones.
3. Confirmar que los 3 eventos aparecen en el dashboard de Sentry en menos de 60 segundos.
4. Marcar los 3 issues como Resolved post-validación.

---

## Relacionados

- `LOGICA_DE_NEGOCIO/14_sentry_monitoreo_errores.md` — qué cubre Sentry, arquitectura, decisiones embutidas
- `LOGICA_DE_NEGOCIO/15_sentry_betterstack_monitoring.md` — matriz Sentry vs BetterStack y validación periódica
- `TROUBLESHOOTING/16_betterstack_down.md` — qué hacer cuando BetterStack avisa que un sitio está down
