# Troubleshooting 16 — Alertas DOWN de BetterStack

Cómo responder cuando llega un email `[BetterStack]` con `DOWN` en producción.

---

## Qué significa la alerta

BetterStack chequea cada 30 segundos las URLs públicas del sitio. Cuando una URL deja de responder durante **2-3 chequeos consecutivos**, manda email tipo:

```
[BetterStack] DOWN: Home — opabiz.com
```

Después de **2-3 fallos consecutivos** (no 1 solo), para evitar falsos positivos por hiccups de red.

Lo opuesto: cuando vuelve a responder OK, llega `[BetterStack] UP` con el mismo nombre del monitor.

**Importante:** BetterStack chequea desde fuera. Si tu casa tiene problema de red, vos no podés cargar el sitio pero BetterStack desde otro lado sí. **Confiar en lo que BetterStack reporta** sobre la disponibilidad real.

---

## Primer chequeo — 2 minutos

### 1. Identificar QUÉ monitor cayó

Los 3 monitores activos son:
- **Home** — `https://opabiz.com/`
- **Admin Login** — `https://opabiz.com/admin`
- **API Client Portal** — endpoint health del portal

El subject del email dice cuál. Saber cuál es te orienta:

| Monitor caído | Hipótesis primera |
|---|---|
| **Home** solo | Vercel posiblemente caído, o cert SSL del dominio principal expirado, o DNS roto. Toda la app afectada. |
| **Admin Login** solo (Home OK) | Posible bug específico en `/admin` (deploy regression). |
| **API Client Portal** solo (Home OK) | API route específica rota. |
| **Los 3** | Vercel down, DNS down, o sitio entero caído. |

### 2. Verificar desde otra red

Antes de tomar acción drástica, verificar desde un dispositivo con red distinta (data móvil del celular, no el WiFi de la casa):

- Abrir el sitio en el navegador → ¿carga?
- Si carga normal desde la otra red → posiblemente falso positivo / problema regional / transient. Esperar 2-3 min y observar.
- Si NO carga desde la otra red → es real. Avanzar a la sección "Causa".

---

## Determinar la causa

Mirar **en este orden**:

### a) Status pages de los proveedores

- Vercel: https://www.vercel-status.com
- Supabase: https://status.supabase.com
- Resend: https://resend-status.com
- Stripe: https://status.stripe.com
- DNS provider: Netlify (hasta migración) o Namecheap

Si alguno reporta incidente activo → **es ese provider**. No hay fix nuestro. Esperar.

### b) Vercel Deployments

Abrir el dashboard de Vercel del proyecto → tab **Deployments**:

- ¿Hay un deploy reciente (últimos 30 min)? → posible regression. **Promote anterior** (Promote to Production) para rollback inmediato.
- ¿El último deploy está Failed? → Vercel quedó con el anterior, problema no es de deploy. Buscar otra causa.
- ¿Hay alguien (vos o Fabián) trabajando en algo que tocó configuración? → preguntar.

### c) DNS y SSL

- `curl -I https://opabiz.com/` desde la terminal → ¿responde?
- Si timeout/no resuelve → DNS. Revisar el registrar (Netlify hoy, Namecheap futuro).
- Si responde con error SSL → certificado expirado. Vercel auto-renueva con Let's Encrypt; si falla, refrescar el dominio en Settings → Domains.

### d) El código

Si nada de lo de arriba aplica → puede ser un bug nuevo que causa que el endpoint cuelgue o crashe. Mirar Sentry: ¿hay errores nuevos en la misma ventana de tiempo? Si sí → tratar como issue de Sentry (ver `15_sentry_alerts.md`).

---

## Acciones por causa

### Caja 1 — Provider down

- Esperar resolución del proveedor (mirar su status page para ETA).
- Avisar al equipo: "Vercel / Supabase / etc. está caído. Sitio puede estar lento o roto los próximos X minutos."
- **No hay fix nuestro.** No tocar Vercel, no tocar variables, no tocar código durante el incidente del provider. Cualquier intervención sin entender la causa real puede empeorar las cosas cuando el provider vuelva.

### Caja 2 — Deploy regression

1. **Rollback inmediato:** Vercel → Deployments → deploy anterior → Promote to Production.
2. Esperar BetterStack `[UP]` (~2 min).
3. Después del rollback, investigar el bug del deploy fallido sin presión. Fix en branch, PR, merge.
4. En BetterStack: el monitor vuelve a UP automáticamente cuando el sitio responde. No hay que tocarlo.

### Caja 3 — DNS / SSL

- **DNS:** revisar registrar (Netlify/Namecheap). Confirmar que los registros apuntan correctamente a Vercel.
- **SSL:** Vercel → Settings → Domains → click en el dominio → si dice "Invalid Configuration", seguir las instrucciones que muestra Vercel.
- Cambios de DNS tardan **propagación** (5 min a 48 hs). Documentar si fue cambio reciente.

### Caja 4 — Bug del código

Tratar como issue de Sentry: ver `TROUBLESHOOTING/15_sentry_alerts.md`. La diferencia es que aquí el bug fue tan grave que tiró el endpoint entero (no solo error en runtime). Probablemente requiere rollback inmediato.

---

## Cuándo cerrar el incidente

Cuando llega el email `[BetterStack] UP` del mismo monitor → el problema está resuelto desde la perspectiva de availability. Confirmar:

1. Cargar el sitio desde 2 redes distintas → debe estar OK.
2. Si fue caja 2 (regression): confirmar que el rollback dejó el sitio en estado estable y que el fix está en cola para merge.
3. Si fue caja 1 (provider): mirar la status page del provider → debe decir "Resolved".

---

## Falsos positivos comunes

- **Hiccups de red de BetterStack** — raro pero pasa. Si el `[UP]` llega en menos de 5 min sin que vos hicieras nada, fue transient. **No actuar.**
- **Cron de Vercel ejecutándose** — algunos endpoints toman 3-10 seg en frío. BetterStack tiene timeout configurable; ajustar si el endpoint legítimamente puede tomar más.

---

## Cuándo escalar / parar / pedir ayuda

- **Sitio caído más de 15 min sin causa clara identificada** → avisar a Fabián por canal directo. Considerar publicar un mensaje en redes sociales si hay clientes activos.
- **Sitio caído + Sentry sin alertas nuevas** → el problema es de infraestructura, no de código. Foco en Vercel/Supabase/DNS.
- **Sitio caído + Sentry con muchos errores nuevos** → es de código. Rollback primero, investigar después.

---

## Configuración relacionada

- **3 monitores activos** (2026-05-13): Home, Admin Login, API Client Portal. Umbral 2-3 fallos consecutivos antes de alertar.
- **Destinatarios email:** `admin@opabiz.com` por ahora. Segundo destinatario pendiente (Gmail compañía futuro).
- **Push notifications:** activas en iPhone vía app BetterStack (configuración 2026-05-13).
- **Status page pública:** pendiente hasta migración DNS Netlify → Namecheap.
- **Monitor de Railway (4to monitor):** DIFERIDO hasta Etapa 5 (Sunbiz). Hoy Railway está dormido, monitorearlo es ruido.

---

## Relacionados

- `LOGICA_DE_NEGOCIO/15_sentry_betterstack_monitoring.md` — matriz Sentry vs BetterStack
- `TROUBLESHOOTING/15_sentry_alerts.md` — runbook para alertas de Sentry
- `TROUBLESHOOTING/01_sitio_caido.md` — runbook general para sitio caído (puede tener overlap útil)
- `TROUBLESHOOTING/09_dominio_dns.md` — problemas específicos de dominio y DNS
