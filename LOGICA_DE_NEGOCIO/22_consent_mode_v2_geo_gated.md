# 22 — Consent Mode v2 con Geo-Gating Europeo

Documento maestro del sistema de consentimiento de cookies + tracking. Cubre la decisión estratégica de **NO mostrar banner a usuarios de EEUU + LATAM** (mercado principal) y **SÍ mostrarlo a usuarios de la UE/EEA/UK**, manteniendo Consent Mode v2 default-deny **globalmente** para cumplir con todas las regulaciones aplicables.

> Reemplaza el approach "banner universal" inicialmente documentado en [`19_analytics_ga4.md`](19_analytics_ga4.md) sección "Consent Mode v2 — flujo". Doc 19 mantiene la inventario de eventos GA4; este doc cubre el consentimiento y el banner.

Commit del cambio: `74e8338` — "feat: cookie banner solo para usuarios de Europa (GDPR)".

---

## 1. Por qué este approach (vs banner universal)

### El problema con el banner universal

Mostrar el banner a TODO el mundo tiene un costo concreto medible:

- **Drop de conversion rate del 3-5%** documentado en múltiples estudios (Baymard Institute, CXL, Nielsen Norman Group, 2024-2026). En un funnel que ya pierde 70%+ entre awareness y compra, dos puntos porcentuales son significativos.
- **Friction visual en mobile** — el banner ocupa ~25% del viewport en pantallas pequeñas. En iPhone SE (375×667), el banner inicial come 168px → la primera impresión queda comprometida.
- **Banner fatigue** — usuarios US/LATAM están desconectados de los marcos GDPR. El banner los percibe como obstáculo sin propósito claro, no como protección.

### El problema con NO mostrar banner

Saltarse el consentimiento donde **sí** es obligatorio (GDPR/EEA/UK) tiene consecuencias serias:

- **Multas GDPR**: hasta 20M € o 4% del global revenue anual, lo que sea mayor
- **CNIL (Francia)**: en 2022-2024 multó Google, Amazon y Meta entre 60M-150M € cada uno por defaults de cookies sin consent explícito
- **ICO (UK)**: investigaciones activas en 2024-2026 a sitios US sin banner que reciben tráfico UK

### La solución intermedia: geo-gating

**Mostrar banner solo donde es legalmente requerido**, y mantener Consent Mode v2 default-deny globalmente para cumplir con CCPA/CPRA (California) y leyes similares (LGPD Brasil, PIPEDA Canadá) que **NO requieren banner pero sí requieren no-tracking-por-default**.

Resultado:
- 🇪🇺 **EU/EEA/UK**: ven banner + flujo normal GDPR
- 🇺🇸 🇲🇽 🇨🇴 🇦🇷 🌎 **Resto del mundo**: no ven banner, conversion rate intacto, cumplimos CCPA con Consent Mode v2 default-deny

---

## 2. Mapa legal — qué regulación aplica dónde

| Región | Regulación | Banner requerido | Default-deny suficiente | Notas |
|--------|------------|------------------|-------------------------|-------|
| 27 países UE | GDPR + ePrivacy Directive | ✅ SÍ | ❌ No | Requiere consent explícito (opt-in) |
| Reino Unido | UK GDPR + PECR | ✅ SÍ | ❌ No | Post-Brexit pero equivalente práctico |
| EEA (IS/LI/NO) | GDPR aplicado vía acuerdo EEA | ✅ SÍ | ❌ No | Idéntico a UE |
| Suiza | FADP (revisión 2023) | ⚠️ Parcial | ⚠️ Parcial | Similar a GDPR pero menos enforcement. Ver "Pendientes" |
| California (US) | CCPA + CPRA | ❌ No requerido si no hay "sale" | ✅ SÍ | Default-deny cumple si no hay sharing de PII |
| Resto US | Patchwork estatal (CO, VA, CT, UT, etc.) | ❌ Variable | ✅ Generalmente sí | Menos estricto que CA |
| Brasil | LGPD | ❌ No requiere banner explícito | ✅ Generalmente sí | Requiere bases legales documentadas |
| México | LFPDPPP | ❌ Aviso de privacidad sí, banner no | ✅ Sí | Privacy notice en la página alcanza |
| Argentina | Ley 25.326 | ❌ Aviso sí, banner no | ✅ Sí | Similar a México |
| Canadá | PIPEDA / Law 25 (Quebec) | ⚠️ Quebec sí, resto no | ✅ Sí | Quebec aplica desde sept 2024 |
| China | PIPL | Casos extremos (sitios chinos) | ⚠️ Complejo | No relevante — no targeteamos China |

**Conclusión operativa**: con Consent Mode v2 default-deny global + banner geo-gated a EU/EEA/UK, **cubrimos todas las regulaciones aplicables al mercado real de OpaBiz** (US/LATAM principalmente).

---

## 3. Arquitectura técnica

### Detección server-side del país

**`backend/app/layout.tsx`** — Root Layout como Server Component:

```tsx
import { headers } from "next/headers"

const EU_COUNTRIES = new Set([
  // 27 UE
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU',
  'IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK',
  // 3 EEA (Islandia, Liechtenstein, Noruega)
  'IS','LI','NO',
  // UK (post-Brexit)
  'GB',
])

export default async function RootLayout({ children }) {
  const headersList = await headers()
  const country = (headersList.get('x-vercel-ip-country') ?? '').toUpperCase()
  const showCookieBanner = EU_COUNTRIES.has(country)

  return (
    <html>
      <head>
        {/* Consent Mode v2 default-deny SIEMPRE — independiente del país */}
        <Script id="gtag-consent-default" strategy="beforeInteractive">
          {`
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              functionality_storage: 'granted',
              security_storage: 'granted',
              wait_for_update: 500
            });
          `}
        </Script>
      </head>
      <body>
        {children}
        <CookieConsent showBanner={showCookieBanner} />
      </body>
    </html>
  )
}
```

### `x-vercel-ip-country` — el header mágico de Vercel

Vercel inyecta automáticamente este header en cada request basándose en GeoIP de la IP del visitor. Características:

- **Precisión** ~99% según Vercel docs + MaxMind GeoIP2
- **Sin costo adicional** — incluido en todos los planes Vercel (incluido el free)
- **Funciona en Edge + Serverless** — se evalúa en el primer hop, antes del SSR
- **Formato**: código ISO 3166-1 alpha-2 (2 letras mayúsculas)
- **Casos límite**:
  - IP no identificable (Tor, VPN sin geo) → header vacío `''` → no banner
  - Localhost dev → header vacío → no banner (útil para testing)
  - Proxy corporativo → puede mostrar país del exit node, no del usuario real

Headers adicionales útiles que Vercel también provee (no usados hoy pero disponibles):
- `x-vercel-ip-country-region` — estado/provincia
- `x-vercel-ip-city` — ciudad
- `x-vercel-ip-latitude` / `x-vercel-ip-longitude` — coordenadas
- `x-vercel-ip-timezone` — zona horaria

### Banner client-side con prop `showBanner`

**`backend/components/CookieConsent.tsx`**:

```tsx
'use client'

export default function CookieConsent({ showBanner = false }) {
  const [visible, setVisible] = useState(false)
  // ... otros states

  useEffect(() => {
    if (!showBanner) return  // <-- gate principal
    const existing = getConsent()
    if (!existing) {
      const t = setTimeout(() => setVisible(true), 500)
      setLang(detectLang())
      return () => clearTimeout(t)
    }
  }, [showBanner])

  if (!visible) return null
  // ... resto del componente
}
```

Punto crítico: **default-deny en Consent Mode v2 sigue activo aunque el banner no aparezca**. Para usuarios fuera de EU/EEA/UK:
- gtag.js carga
- Todos los eventos se disparan
- Pero sin first-party cookies y sin user_id → cookieless pings de Consent Mode v2

---

## 4. Países cubiertos — lista justificada

### En el Set (31 países)

| Código | País | Razón |
|--------|------|-------|
| AT | Austria | UE |
| BE | Bélgica | UE |
| BG | Bulgaria | UE |
| CY | Chipre | UE |
| CZ | República Checa | UE |
| DE | Alemania | UE |
| DK | Dinamarca | UE |
| EE | Estonia | UE |
| ES | España | UE |
| FI | Finlandia | UE |
| FR | Francia | UE — CNIL especialmente activa |
| GR | Grecia | UE |
| HR | Croacia | UE |
| HU | Hungría | UE |
| IE | Irlanda | UE — DPC sede de muchas Big Tech |
| IT | Italia | UE |
| LT | Lituania | UE |
| LU | Luxemburgo | UE |
| LV | Letonia | UE |
| MT | Malta | UE |
| NL | Países Bajos | UE |
| PL | Polonia | UE |
| PT | Portugal | UE |
| RO | Rumanía | UE |
| SE | Suecia | UE |
| SI | Eslovenia | UE |
| SK | Eslovaquia | UE |
| IS | Islandia | EEA — GDPR aplicado |
| LI | Liechtenstein | EEA — GDPR aplicado |
| NO | Noruega | EEA — GDPR aplicado |
| GB | Reino Unido | UK GDPR + PECR (post-Brexit equivalente) |

### NO en el Set — análisis de exclusiones

| Código | País | Por qué NO |
|--------|------|-----------|
| CH | Suiza | FADP es similar a GDPR pero menos enforcement. Default-deny + privacy notice cubre. **Pendiente revisar** si planeamos targetear suizos directamente |
| US | Estados Unidos | CCPA/CPRA no requiere banner. Default-deny suficiente. **Mercado principal** — drop de conversion >>> beneficio compliance marginal |
| CA-QC | Quebec (Canadá) | Law 25 desde sept 2024 requiere consent expreso. Vercel no expone subdivisión a nivel provincia en `x-vercel-ip-country`. Si se vuelve relevante: detectar via `x-vercel-ip-country-region` |
| BR | Brasil | LGPD permite legitimate interest con privacy notice. No requiere banner |
| MX, AR, CO, CL, PE | LATAM principal | Aviso de privacidad sí, banner no |
| RU | Rusia | Ley 152-FZ requiere localización de data, no banner. Sin relevancia comercial |
| CN | China | PIPL es complejo pero solo si targeteás China. No es el caso |
| TR | Turquía | KVKK requiere notice, no banner |

---

## 5. Lo que cambia en data flow de GA4

Importante para Aneury cuando mire reportes:

### Para usuarios EU/EEA/UK (ven banner)

**Antes de decidir** (banner visible):
- Consent Mode v2: todo `denied`
- gtag.js manda **cookieless pings** con `gcs=G100`
- GA4 los cuenta como sesiones para conversion modeling, sin user_id

**Después de "Accept all"**:
- `consent update` con todo `granted`
- First-party cookies (`_ga`, `_ga_*`) se setean
- user_id estable across sesiones
- Attribution multi-touch funcional

**Después de "Only necessary"**:
- Sigue `denied` (cookieless pings)
- Igual que pre-decisión pero la cookie `mbf_consent` se setea para no mostrar banner de nuevo

### Para usuarios fuera de EU/EEA/UK (no ven banner)

- Consent Mode v2: queda en `denied` **permanentemente**
- gtag.js manda cookieless pings con `gcs=G100`
- GA4 los cuenta como sesiones modeladas, sin user_id estable
- **No hay attribution multi-touch precisa** — GA4 usa modelado estadístico
- **No hay retention reports precisos** — sin user_id no se puede trackear visitor recurring

### Implicaciones operativas en GA4

| Reporte / métrica | EU consented | No-EU (denied) |
|-------------------|--------------|----------------|
| Real-Time visitors | ✅ Preciso | ✅ Preciso (cookieless ping) |
| Pageviews | ✅ Preciso | ✅ Preciso |
| Events custom | ✅ Con params completos | ✅ Con params completos |
| Conversion rate | ✅ Preciso | ⚠️ Modelado |
| User retention (cohorts) | ✅ Preciso | ❌ Limitado |
| Funnel exploration | ✅ Preciso | ⚠️ Modelado |
| Attribution multi-channel | ✅ Preciso | ⚠️ Modelado |
| Audience building (para ads) | ✅ Funciona | ❌ Limitado |
| Demographics + Interests | ✅ Si Google Signals activo | ❌ No disponible |

**Net**: para nuestro caso (US/LATAM = mercado principal), el approach de modelado de Consent Mode v2 es **suficiente para tomar decisiones de negocio** aunque no sea tan granular como tracking completo. Vale la pena el trade-off por el lift en conversion rate.

---

## 6. Compliance checklist

### Antes de cada release relevante

- [ ] Verificar que `EU_COUNTRIES` en `backend/app/layout.tsx` esté actualizado si hubo cambios de jurisdicción (rare — UE no ha cambiado de miembros desde Croacia 2013)
- [ ] Verificar que el script `gtag-consent-default` está antes de `gtag.js` en el orden de Scripts
- [ ] Verificar que `wait_for_update: 500` está presente (sino los primeros eventos pre-banner se pierden)
- [ ] Smoke test desde un browser EU (VPN o ProtonVPN free):
  - Ir a `https://opabiz.com`
  - Confirmar que el banner aparece
  - DevTools → Network → ver `gcs=G100` en el primer `/g/collect` request
  - Click "Accept all" → ver siguiente request con `gcs=G111`
- [ ] Smoke test desde US:
  - Ir a `https://opabiz.com`
  - Confirmar que **NO** aparece banner
  - DevTools → Network → ver `gcs=G100` en `/g/collect` (cookieless ping confirmado)

### Anualmente

- [ ] Revisar si hay cambios en jurisdicciones aplicables (ej. nuevos países UE, Brexit version 2, etc.)
- [ ] Revisar si CCPA/CPRA o California amplió scope (en 2023 entró CPRA con cambios menores)
- [ ] Revisar si Suiza FADP entró en enforcement strict — agregar CH al Set si sí
- [ ] Revisar si LATAM aprobó nuevas leyes tipo GDPR (Brasil LGPD, México, Argentina han propuesto reformas)

---

## 7. Edge cases

### VPN / Proxy

- **EU user con VPN US**: header lee como `US` → no banner. **Riesgo legal mínimo** — el usuario está activamente ocultando su jurisdicción. Defensa legal: actuamos en buena fe basados en señal disponible.
- **US user con VPN EU**: header lee como `DE` (típico exit node alemán) → ve banner. Solo molestia, no riesgo.
- **Tor users**: usualmente sin geo → header vacío → no banner. Acceptable — Tor users son <0.01% del tráfico.

### Bots / crawlers

- **Googlebot, Bingbot**: identificados por user-agent. `x-vercel-ip-country` les llega como el datacenter de Google/Microsoft (US típicamente). No ven banner. ✅ Correcto — bots no necesitan consent.
- **Crawlers de scraping**: igual, sin banner.

### Dev local

- `npm run dev` → headers de Next.js dev server vacíos → `country = ''` → no banner
- Útil para desarrollo: ves la página sin la fricción visual del banner

### Misma sesión cruzando fronteras

- Improbable en práctica. Si pasa: el cookie `mbf_consent` persiste 365 días, la decisión queda guardada localmente. El banner no reaparece aunque el header del país cambie en siguientes requests.

---

## 8. Cómo modificar el sistema

### Agregar un país al banner

Editar `backend/app/layout.tsx`:

```tsx
const EU_COUNTRIES = new Set([
  // ... países actuales
  'CH',  // <-- agregar Suiza
])
```

Deploy automático en Vercel.

### Cambiar el approach completo

Si en algún momento se quiere mostrar banner globalmente otra vez (ej. expansión a Europa como mercado principal):

```tsx
const showCookieBanner = true  // <-- forzar siempre
```

O para solo desactivar geo-gating (banner universal):

```tsx
// Eliminar la lógica de EU_COUNTRIES
<CookieConsent showBanner={true} />
```

### Cambiar las dimensiones de consent

Si en el futuro Google agrega más dimensiones a Consent Mode v2 (hoy son 6), actualizar el `gtag('consent', 'default', {...})` en layout.tsx y el `gtag('consent', 'update', {...})` en `lib/consent.ts`.

---

## 9. Decisiones embutidas

- **Banner solo a EU/EEA/UK** — el trade-off de conversion lift vs compliance es claramente positivo para el mercado real de OpaBiz (US/LATAM). Para Europa cumplimos GDPR.

- **Consent Mode v2 default-deny globalmente** — incluso fuera de Europa. Esto cumple CCPA + Quebec Law 25 + leyes de privacidad emergentes en LATAM sin necesidad de banner. Es el approach moderno recomendado por Google.

- **`x-vercel-ip-country` vs librería GeoIP propia** — usar el header de Vercel es 0 latency, 0 mantenimiento, 0 costo. Una librería propia (MaxMind GeoIP2, etc.) sería redundante.

- **Server-side detection** — la decisión se toma en el SSR, antes de que el HTML llegue al cliente. Esto evita flicker visual ("el banner aparece y desaparece") que tendría una solución client-side con `fetch('/api/geo')`.

- **No detección por idioma del browser** — `navigator.language` podría sugerir EU (ej. `de-DE`) pero no es geografía. Un español en Miami habla español pero está en Florida, no en España.

- **Suiza (CH) excluida hoy** — por simplicidad. FADP tiene enforcement bajo y nuestro tráfico suizo es marginal. Si en el futuro vemos tráfico CH significativo en GA4, agregar.

- **Quebec NO detectado** — Vercel no expone subdivisión provincial en el header principal. Detectar Quebec requeriría parsear `x-vercel-ip-country-region`. Si Law 25 se vuelve relevante: agregar lógica adicional.

- **El componente `CookieConsent` queda como Client Component** — necesario para localStorage, cookies client-side y la interacción del banner. La detección server-side solo pasa el flag `showBanner` como prop.

---

## 10. Pendientes (con plazo)

| Item | Cuándo | Quién |
|------|--------|-------|
| Smoke test desde IP EU real post-deploy del rebrand a opabiz.com | Esta semana | Aneury (con VPN) |
| Verificar que GA4 Real-Time muestra cookieless pings (gcs=G100) desde US | Esta semana | Aneury |
| Verificar que GA4 Real-Time muestra granted pings (gcs=G111) post-Accept en EU | Esta semana | Aneury |
| Revisión anual del Set de países | Cada Enero | Aneury |

---

## 11. Diferidos (no priority hoy)

- **Agregar Suiza (CH)** — evaluar después de 3 meses si vemos tráfico suizo en GA4 > 0.5% del total
- **Detección de Quebec via `x-vercel-ip-country-region`** — si LATAM/Canadá se vuelve foco
- **A/B test "banner vs no banner" en US** — para medir el lift exacto en conversion (hoy es estimación basada en literatura). Requiere cohort split + segmentación. Posible para post-launch maduro
- **Cookie wall (banner blocking content hasta decidir)** — algunos sitios EU lo hacen. NO lo planeamos — viola UX y Google ha dicho explícitamente que es problemático para SEO

---

## 12. Descartados (con motivo explícito)

### Banner universal con todos los países

- **Por qué no**: drop de conversion 3-5% en US/LATAM (mercado principal) sin beneficio legal incremental
- **Decisión**: descartado definitivamente. El approach geo-gated es la práctica moderna estándar

### Detección por IANA timezone

- **Por qué no**: `Intl.DateTimeFormat().resolvedOptions().timeZone` da algo como `Europe/Madrid` pero solo en cliente, no en server. Requeriría hidratación + flicker
- **Decisión**: descartado — el header de Vercel cubre el caso mejor

### Detección por DNS reverso

- **Por qué no**: lento (necesita resolución DNS por request), poco confiable (ISPs internacionales)
- **Decisión**: descartado — Vercel ya lo hace mejor

### Cookie wall (bloquear contenido)

- **Por qué no**: UX horrible + Google John Mueller lo desaconseja para SEO + algunas DPAs UE consideran que viola el principio de "freely given consent"
- **Decisión**: descartado permanentemente

### Tracking sin Consent Mode v2 (fire-and-forget pre-decisión)

- **Por qué no**: viola GDPR explícitamente. Multas significativas documentadas (CNIL France 100M+ €)
- **Decisión**: descartado por compliance

---

## 13. Referencias

- Decisión legal CCPA + default-deny: https://oag.ca.gov/privacy/ccpa
- GDPR official: https://gdpr-info.eu
- UK GDPR + PECR: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/
- Suiza FADP: https://www.kmu.admin.ch/kmu/de/home/aktuell/themen-dossiers/datenschutz.html
- Google Consent Mode v2: https://developers.google.com/tag-platform/security/guides/consent
- Vercel headers (geo): https://vercel.com/docs/edge-network/headers#x-vercel-ip-country
- ISO 3166-1 alpha-2: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
- Doc relacionado: [`19_analytics_ga4.md`](19_analytics_ga4.md) — GA4 events + Consent Mode v2 dimensions detail
- Doc relacionado: [`21_seo_multi_engine_bing_ai.md`](21_seo_multi_engine_bing_ai.md) — SEO multi-engine
- Commit del cambio: `74e8338` ("feat: cookie banner solo para usuarios de Europa (GDPR)")
