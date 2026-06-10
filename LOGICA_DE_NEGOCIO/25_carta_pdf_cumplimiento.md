# 25 — Sistema de Carta de Cumplimiento (New Business Letter PDF)

Documento maestro del generador de cartas físicas de "Notice of Business Compliance Services" que se envían por correo postal a empresas recién formadas en Florida, como complemento del flujo de email marketing del módulo de Campañas (doc 12).

> Implementado por Fabián en commits `b89e907` (generador base + endpoint + botones admin) y `8b999fb` (botón de preview en nueva pestaña). Diferente del flujo de QR + email del doc 12: estas cartas se imprimen y envían **físicamente por USPS** a la dirección registrada en Sunbiz.

---

## 1. Por qué un canal físico

El flujo de email tiene 3 limitaciones:

| Limitación | Solución carta física |
|------------|----------------------|
| Bounce rate alto (~30%) si el email registrado en Sunbiz es viejo | USPS llega a la dirección física actual o devuelve "return to sender" — siempre informativo |
| Inbox saturado, baja apertura (~20%) | Carta física tiene tasa de apertura ~95% (la abren para ver qué es) |
| Percepción de spam | Carta en papel con membrete profesional se percibe como comunicación oficial |

Trade-offs:
- ❌ Costo por unidad mucho mayor ($1-2 vs ~$0.001 del email)
- ❌ Latencia 3-7 días vs instantáneo
- ❌ No hay tracking de "scan" o "open" — solo conversion (¿pagaron?)

**Estrategia operativa**: usar email primero (escalable y barato). Carta física para empresas con email vacío o que no respondieron al email después de N días. Filtros en el panel admin permiten segmentar.

---

## 2. Anatomía visual de la carta PDF

Letter size US (612 × 792 pt). Una sola página. 10 secciones visualmente diferenciadas:

```
┌──────────────────────────────────────────────────────────────────┐
│ [FBFC]  FLORIDA BUSINESS FORMATION CENTER     ┌──────────────┐ │
│   ●     3700 SW 27TH ST Suite D104           │ Document ID# │ │
│         Gainesville, FL 32608                 │ Notice Date: │ │
│                                               │ Respond By:  │ │
│                                               │ Total Fee:🟡 │ │  ← Header + tabla info
│                                               └──────────────┘ │
├──────────────────────────────────────────────────────────────────┤  ← Divider
│ ████████ 2026 NOTICE OF BUSINESS COMPLIANCE SERVICES ████████  │  ← Title bar (navy)
├──────────────────────────────────────────────────────────────────┤
│ Owner Name                                                       │
│ Company Name                                                     │  ← Bloque dirección
│ Address                                                          │     del destinatario
│ City, FL ZIP                                                     │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ACTION REQUIRED — Keep Your Business Protected and Compliant │ │
│ │ Congratulations on registering [Company] with the State...   │ │  ← Action box
│ │ (4-5 líneas con instrucciones)                                │ │
│ └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │ Labor Law    │ │ EIN (Tax ID) │ │ Cert. Status │             │
│ │   $120.00    │ │   $161.00    │ │    $79.00    │             │  ← Grid 3 servicios
│ │   (desc...)  │ │   (desc...)  │ │   (desc...)  │             │
│ └──────────────┘ └──────────────┘ └──────────────┘             │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │                   PAY ONLINE                                  │ │
│ │            Fast processing: 1–3 business days                 │ │
│ │            VISIT: opabiz.com/new-business?id=...              │ │  ← Pay box + QR
│ │                   OR                                          │ │
│ │            EMAIL: info@opabiz.com                             │ │
│ │              [█▄▀█ QR code 72×72 pt █▄▀█]                    │ │
│ └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│ FLORIDA BUSINESS FORMATION CENTER is a privately owned third-... │  ← Disclaimer footer
│ ...party document preparation service and is not affiliated...   │     (legal)
└──────────────────────────────────────────────────────────────────┘
```

### Brand intencional — "Florida Business Formation Center" vs "OpaBiz"

La carta usa **"FLORIDA BUSINESS FORMATION CENTER"** como marca en el header + logo "FBFC" circular en navy + footer legal — **NO** "OpaBiz". Esto es **intencional**:

- Es el DBA (Doing Business As) registrado para servicios de compliance documentation
- "Florida Business Formation Center" se percibe como entidad formal/oficial — alineado con el formato visual de notificaciones gubernamentales
- "OpaBiz" es la marca consumer-facing del sitio web; suena startup y casual

El footer aclara explícitamente: *"FLORIDA BUSINESS FORMATION CENTER is a privately owned third-party document preparation service and is not affiliated with or endorsed by any government agency"* — exigido por leyes anti-fraude estatales contra "deceptive solicitations".

⚠️ **Esto NO es un commit que rebrand olvidó actualizar** — es deliberado. NO cambiar a "OpaBiz" sin discusión con Aneury.

---

## 3. Servicios incluidos en la carta

Hardcoded en [`lib/new-business-letter.ts`](backend/lib/new-business-letter.ts) líneas 148-161. Los 3 servicios que se ofrecen por carta física:

| Servicio | Precio | Descripción usada |
|----------|--------|-------------------|
| **Labor Law Posters** | **$120.00** | "Both Federal and State Law require every business with at least one employee to post current labor law notices in a clearly visible workplace area. Non-compliance can lead to fines and legal consequences." |
| **EIN (Tax ID)** | **$161.00** | "An EIN is a 9-digit number issued by the IRS to identify your business. Required to open a bank account, hire employees, file federal tax returns, and conduct business with government agencies." |
| **Certificate of Status** | **$79.00** | "Official proof your business is active and authorized to conduct business in Florida. Often required when applying for loans, renewing licenses, or opening a business bank account." |

**Total Fee**: `$360.00` (hardcoded como suma en el endpoint, no calculado dinámicamente).

### Comparación con pricing del sitio web

| Servicio | En carta física | En `/servicios` (web) | Diferencial |
|----------|----------------|---------------------|-------------|
| Labor Law Posters | $120.00 | $69.99 (per doc 21 SEO + `app/page.tsx` packaging) | +$50 |
| EIN | $161.00 | $99.99 | +$61 |
| Certificate of Status | $79.00 | $49.99 | +$29 |

**Precio carta > precio web** intencional:
- El público que entra por carta física es menos sensible a precio comparativo (no está shopeando)
- Cubre costo de impresión + correo + procesamiento manual
- Si el cliente compara con el sitio y elige pagar por web, igual cerramos la venta

Decisión documentada — Aneury aprobada en flujo de campañas operativo.

### Bundle no expuesto en la carta

El sitio ofrece **Bundle 3 servicios = $189.99** (per `/new-business` y `/api/sunbiz/checkout`). La carta **no menciona el bundle** — solo los 3 precios individuales. Esto es intencional para que el cliente pague los $360 si llama a pagar la carta directamente. Si va al sitio (vía QR o URL) y elige bundle, hay un descuento natural.

---

## 4. Generación técnica

### Stack

- **`pdf-lib`** — generación de PDF nativa en Node (ya en deps por el certificate generator del wizard)
- **`qrcode`** — genera PNG del QR (ya en deps por las campañas email)
- **StandardFonts.Helvetica** + **StandardFonts.HelveticaBold** — embedded en el PDF, sin descargar fonts externos

### Función principal — `generateNewBusinessLetter()`

[`backend/lib/new-business-letter.ts`](backend/lib/new-business-letter.ts) — 213 líneas. Exporta una función async:

```ts
export type NewBusinessLetterData = {
  documentId: string    // e.g. "L26000127092"
  ownerName: string
  companyName: string
  address: string
  city: string
  zip: string
  noticeDate: string    // "MM/DD/YYYY"
  respondBy: string     // "MM/DD/YYYY"
  totalFee: string      // "$360.00"
  payUrl: string        // "opabiz.com/pay/ABC123"
  year?: number
}

export async function generateNewBusinessLetter(data: NewBusinessLetterData): Promise<Uint8Array>
```

### Diseño del código

- **Closures de drawing helpers**: `makeDrawers(page, bold, regular)` retorna `{ t, r, line, centered }` para evitar pasar `page` + fonts a cada call. Patrón limpio que mantiene el cuerpo del generador legible.
- **Word-wrap manual**: `wrapLines(text, font, size, maxWidth)` itera palabra a palabra midiendo width con `font.widthOfTextAtSize()`. No usa Knuth-Plass — algoritmo greedy simple, suficiente para textos cortos como este.
- **Coordinate system**: PDF usa origen abajo-izquierda. La variable `y` arranca arriba (`PAGE_H - 36`) y decrementa hacia abajo a medida que se renderizan secciones.

### QR code generation

```ts
const fullPayUrl = data.payUrl.startsWith('http') ? data.payUrl : `https://${data.payUrl}`
let qrImage = null
try {
  const qrPng = await QRCode.toBuffer(fullPayUrl, { width: 80, margin: 1 })
  qrImage = await doc.embedPng(qrPng)
} catch { /* skip QR if fails */ }
```

Notas:
- Si `qrcode` falla (caso raro), el PDF se genera sin QR pero con la URL en texto. **Graceful degradation**.
- Tamaño del QR: 72×72 pt en el PDF (suficientemente legible para scan desde cámara móvil).
- Auto-prefija `https://` si la URL no incluye scheme.

### Performance

Una carta toma típicamente <300ms en generar:
- ~50ms QR generation
- ~150ms PDF assembly (fonts + 10 secciones + image embed)
- ~100ms response serialization

Aceptable para uso interactivo (preview + download) desde el panel admin. Para envío masivo (1000 cartas → 5 min) habría que paralelizar — no es caso de uso actual.

---

## 5. Endpoint API

[`backend/app/api/campaigns/generate-letter/route.ts`](backend/app/api/campaigns/generate-letter/route.ts) — 47 líneas.

```
POST /api/campaigns/generate-letter
```

**Body JSON**:
```json
{
  "documentId":  "L26000127092",
  "ownerName":   "John Smith",
  "companyName": "My Business LLC",
  "address":     "123 Main St",
  "city":        "Miami",
  "zip":         "33101",
  "payUrl":      "opabiz.com/new-business?id=L26000127092"
}
```

**Response**: `application/pdf` con `Content-Disposition: attachment; filename="notice-L26000127092.pdf"`.

**Validación**: si falta cualquier campo → `400 Missing required fields`. Cero validación de formato (no verifica que `documentId` exista en `sunbiz_corps`, no valida ZIP, etc.).

### Computación server-side

- **`noticeDate`** = `today()` en formato `MM/DD/YYYY`
- **`respondBy`** = `today() + 21 días` (3 semanas de ventana — alineado con tiempo promedio de USPS + lectura + acción)
- **`totalFee`** = hardcoded `'$360.00'` (no calculado de servicios)
- **`year`** = `today().getFullYear()` para el título "2026 NOTICE..."

### Auth admin — cerrado 2026-06-10

El endpoint **valida `admin_session` con el helper `verifyAdminToken`** (cerrado en sprint de seguridad 2026-06-10). Sin este check quedaría expuesto a:

1. **Generación de PDFs falsos con la marca FBFC** que parecen comunicaciones oficiales de OpaBiz/FBFC
2. **Phishing/fraud risk** externo usando el generador para crear cartas con `payUrl` apuntando a sites maliciosos
3. **DoS por costo de PDF generation** (~300ms CPU por request)
4. **Generación de cartas dirigidas a empresas reales** con datos públicos de Sunbiz pero apariencia oficial

Patrón aplicado:

```ts
import { verifyAdminToken } from '@/lib/session'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ... resto igual
}
```

Mismo patrón consistente que `/api/contabilidad/*` y `/api/campaigns/*` cerrado en auditoría OWASP del commit `7cf1411`.

---

## 6. UI del admin — preview + download

[`backend/app/admin/campaigns/page.tsx`](backend/app/admin/campaigns/page.tsx) líneas 96-123.

Función `generateLetter(company, preview = false)`:
1. Construye `payUrl = opabiz.com/new-business?id=<document_id>`
2. POST a `/api/campaigns/generate-letter` con datos de la company
3. Recibe blob → crea `URL.createObjectURL(blob)`
4. Si `preview` → `window.open(url, '_blank')` (nueva pestaña con preview del PDF)
5. Si no → `<a download>` programático con filename `notice-<documentId>.pdf`

### Botones por fila en la tabla de campañas

| Botón | onClick | Tooltip |
|-------|---------|---------|
| 👁 | `generateLetter(c, true)` | "Preview letter (PDF)" |
| 📄 | `generateLetter(c, false)` | "Download letter (PDF)" |

Ambos botones en la columna de acciones de cada empresa listada en `/admin/campaigns`.

### Flujo operativo típico

1. Admin filtra empresas que no respondieron al email después de 14 días
2. Click 👁 para preview (verifica que el PDF se ve bien con los datos de esa empresa)
3. Si OK → click 📄 para descargar
4. Imprime el PDF
5. Mete en sobre + estampilla + dirige al `address + city + zip` que el PDF muestra
6. Envía por USPS

---

## 7. Variables de entorno y campos requeridos

| Variable | Para qué | Notas |
|----------|----------|-------|
| (ninguna específica) | — | El generador es self-contained |
| Implícitamente: `NEXT_PUBLIC_URL` | Para construir `payUrl` en el admin UI | Si falta, fallback a `opabiz.com` |

### Datos mínimos requeridos por carta

Para que la carta sea válida, la empresa debe tener en `prospective_companies` (o `sunbiz_corps`):
- `document_id` (siempre presente — es la PK efectiva)
- `company_name`
- `owner_name` (si falta, usa `company_name`)
- `address` + `city` + `zip`

Si falta address/city/zip → la carta no se puede enviar (no hay dirección física). El admin debería filtrar la tabla por empresas con dirección completa antes de generar.

---

## 8. Decisiones embutidas

- **Marca "Florida Business Formation Center" / FBFC (no OpaBiz)** — DBA registrado para servicios de compliance documentation. Da formalidad. Cambiar a "OpaBiz" en cartas físicas requiere discusión legal — NO refactor unilateral.

- **Precios carta > precios web** ($120/$161/$79 vs $69/$99/$49) — segmento de carta es menos sensible a precio comparativo + cubre costo operativo de printing+mail+manual processing.

- **No menciona el bundle ($189)** — fuerza decisión "pago los $360 ahora o voy al sitio". Si voy al sitio descubro bundle = upsell natural.

- **Respond By = today + 21 días** — ventana de 3 semanas. Más corto sería estresar al cliente con fecha imposible (USPS demora). Más largo perdería sentido de urgencia.

- **Total Fee hardcoded en endpoint** — los 3 servicios son fijos por ahora. Si en el futuro el equipo agrega/quita servicios de la carta, recalcular. Hardcoded simple > sumatoria dinámica que puede divergir.

- **QR code apunta a `/new-business?id=...`** — misma URL que las campañas email. El landing detecta `?id=` y autorrellena con `sunbiz_corps` o `prospective_companies` (path A de doc 06).

- **No envío automático** — el admin imprime y manda manual. No hay integración con servicios de mailing API (Lob, PostGrid, etc.). Más control en early stage, agregar API cuando volumen justifique.

- **PDF generado on-demand, no cacheado** — el admin típicamente lo descarga 1 vez. Cachear archivos PDF en Supabase Storage agregaría complejidad sin beneficio claro.

- **Server Component-friendly endpoint** — devuelve `application/pdf` directo, sin storage intermedio. Más simple que generar → subir a S3 → devolver URL firmada.

---

## 9. Pendientes (con plazo)

| Item | Cuándo | Quién |
|------|--------|-------|
| ~~Agregar `verifyAdminToken` al endpoint `/api/campaigns/generate-letter`~~ — ✅ cerrado 2026-06-10 en sprint de seguridad | Hecho | — |
| Tracking de cuántas cartas físicas se generan por mes (audit log o counter) — útil para reporting de ROI | Mes 2 post-launch | Aneury |
| Smoke test del PDF impreso a tamaño real (Letter US) — verificar que márgenes funcionan en impresoras típicas | Antes de primer batch | Aneury |
| Documentar el proceso operativo (qué printer, qué papel, dónde se compran estampillas) en un runbook de TROUBLESHOOTING | Antes de primer batch | Aneury |

---

## 10. Diferidos (no priority hoy)

- **Integración con Lob/PostGrid API** — para automatizar print+mail por API en vez de manual. Justifica el costo (~$1.50/carta) cuando el volumen sea 100+/mes.
- **A/B test de copy de la carta** — variantes de subject line de la sección "ACTION REQUIRED" para medir conversion. Requiere tracker en `payUrl`.
- **Cartas multi-idioma** — hoy solo EN. Si el target es founders LATAM, vale la pena variante ES. Bajo prioridad porque el target principal de cartas físicas son empresas nuevas registradas en FL (founders US-resident).
- **QR personalizado por carta** con UTM tracking — hoy el QR apunta a `/new-business?id=X` directo. Agregar `?utm_source=postal&utm_campaign=2026` permitiría medir en GA4 si los scan vienen de carta física vs email.
- **Compresión del PDF** — hoy ~50KB sin compress. Para envío por email sería relevante. Para impresión local no importa.
- **Plantilla alternativa "soft sell"** — la carta actual usa tono urgente ("ACTION REQUIRED"). Algunas audiencias responden mejor a tono cordial. Test post-PMF.

---

## 11. Descartados (con motivo explícito)

### Envío automático por servicios como Lob desde el día 1

- **Por qué no**: $1.50/carta × N empresas = costo significativo sin haber validado tasa de conversion. Imprimir manual los primeros 100 lotes permite iterar el copy + diseño antes de scale.
- **Decisión**: imprimir manual hasta tener >50 conversions/mes que justifiquen API automation.

### Email + carta física simultáneos siempre

- **Por qué no**: derrocha presupuesto. Email es ~free, carta es ~$1.50. Usar carta solo cuando email falla o no existe.
- **Decisión**: email primero, carta como fallback con criterio de filtrado en admin.

### Diseño "carta blanco y negro" minimalista

- **Por qué no**: las cartas oficiales (IRS, FL DOR) sí usan colores en encabezados (azul navy, dorado en montos importantes). La carta debe **competir visualmente** con esas para ser percibida como importante.
- **Decisión**: usar navy + blue + gold deliberadamente. Riesgo legal mitigado por disclaimer footer explícito.

### Adjuntar invoice/receipt con la carta

- **Por qué no**: la carta es una **oferta de servicios**, no una factura. Si el cliente paga, el receipt llega por email vía Stripe.
- **Decisión**: carta = solicitation. Receipt = email post-pago.

---

## 12. Referencias

- Generador PDF: [`backend/lib/new-business-letter.ts`](../backend/lib/new-business-letter.ts)
- Endpoint API: [`backend/app/api/campaigns/generate-letter/route.ts`](../backend/app/api/campaigns/generate-letter/route.ts)
- UI admin (botones preview + download): [`backend/app/admin/campaigns/page.tsx`](../backend/app/admin/campaigns/page.tsx) líneas 96-123 + 467-468
- Commits clave:
  - `b89e907` — feat: generador de carta de cumplimiento (PDF) para campañas
  - `8b999fb` — feat(campaigns): agrega botón de preview de carta PDF en nueva pestaña
- Doc relacionado: [`12_marketing_automation_campanas.md`](12_marketing_automation_campanas.md) — flujo de email + QR (canal complementario)
- Doc relacionado: [`09_documentos_automaticos.md`](09_documentos_automaticos.md) — patrón general de `pdf-lib` para generación de docs en este proyecto
- Doc relacionado: [`15_integracion_new_business_letter.md`](15_integracion_new_business_letter.md) — flujo de captura del lead que llega vía carta (página `/new-business`)
- Doc relacionado: [`06_busqueda_nombres_sunbiz.md`](06_busqueda_nombres_sunbiz.md) — fuente de los datos de empresas (`sunbiz_corps` + `prospective_companies`)
- pdf-lib docs: https://pdf-lib.js.org/
- qrcode npm: https://www.npmjs.com/package/qrcode
- Florida statute sobre solicitations: F.S. § 817.39 (deceptive solicitations — el footer disclaimer es para cumplir esto)
