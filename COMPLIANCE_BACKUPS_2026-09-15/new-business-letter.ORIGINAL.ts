import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import { FBFC_SEAL_PNG_BASE64 } from './fbfc-seal'

// ── Colors ────────────────────────────────────────────────────────────────────
const NAVY      = rgb(0.11, 0.18, 0.27)   // #1C2E44
const BLUE      = rgb(0.15, 0.39, 0.92)   // #2563EB
const WHITE     = rgb(1, 1, 1)
const BLACK     = rgb(0.10, 0.10, 0.10)
const GRAY      = rgb(0.40, 0.40, 0.40)
const LIGHT     = rgb(0.85, 0.85, 0.85)
const OFF_WHITE = rgb(0.97, 0.97, 0.97)

const PAGE_W = 612
const PAGE_H = 792
const MX     = 50    // horizontal margin
const CW     = PAGE_W - MX * 2   // content width = 512
const BOTTOM = 56    // bottom margin — trigger page break below this

// IMPORTANT (pdf-lib WinAnsi): StandardFonts solo codifican CP1252.
// NO usar •  ↑ ↓ → ★ ✓  — rompen la generación. Acentos/ñ/¿/¡, el middot · (0xB7)
// y las rayas — – SÍ están soportados (CP1252 cubre todo Latin-1 + español).
export type Lang = 'en' | 'es'

// Florida entity type label a partir del company_type de Sunbiz, localizado
// por idioma — compartido por generate-letter/route.ts (una carta) y
// print-letters/route.ts (combo de varias, para "Print Selected" del panel).
export function entityLabelForLetter(companyType: string | undefined, lang: Lang): string {
  const maps: Record<Lang, Record<string, string>> = {
    en: { LLC: 'Florida LLC', CORP: 'Florida Corporation', PA: 'Florida P.A.', LTD: 'Florida Limited Partnership' },
    es: { LLC: 'LLC de Florida', CORP: 'Corporación de Florida', PA: 'P.A. de Florida', LTD: 'Sociedad Limitada de Florida' },
  }
  const key = (companyType || '').toUpperCase()
  const fallback = lang === 'es' ? (key ? `${key} de Florida` : 'LLC de Florida') : (key ? `Florida ${key}` : 'Florida LLC')
  return maps[lang][key] || fallback
}

// Fecha en formato largo localizado. Date-only se parsea sin shift de timezone.
export function formatLongDateForLetter(input: string | undefined, lang: Lang): string {
  if (!input) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(input)
  if (isNaN(d.getTime())) return input
  return d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Combina varios PDFs (cada uno con 1 o más páginas — la versión en español
// a veces ocupa 2 por texto más largo, ver getPageIndices() abajo) en un
// solo PDF — usado por "Print Selected" del panel de Campaigns & Letters
// para que el admin pueda mandar Cmd/Ctrl+P una sola vez en vez de abrir un
// PDF por empresa.
export async function mergeLetterPdfs(pdfs: Uint8Array[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create()
  for (const bytes of pdfs) {
    const src = await PDFDocument.load(bytes)
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }
  return merged.save()
}

export type NewBusinessLetterData = {
  documentId: string        // "L26000075446"
  companyName: string       // "GARLICBAKED LLC"
  ownerName?: string        // destinatario (opcional, ya no se imprime)
  address?: string          // dirección de la empresa (opcional)
  city?: string             // ciudad (opcional)
  zip?: string              // ZIP (opcional)
  registrationDate: string  // ya formateado según lang (vacío permitido)
  noticeDate: string        // ya formateado según lang
  entityType: string        // ya localizado ("Florida LLC" | "LLC de Florida")
  payUrl: string            // "mybusinessformation.com/?id=..."
  lang?: Lang               // idioma del texto fijo (default 'en')
}

// ── Contenido bilingüe (solo el texto FIJO; los datos variables vienen en data) ──
type LetterContent = {
  title: string
  labels: { doc: string; reg: string; notice: string; entity: string }
  greeting: (company: string) => string
  body: [string, string, string]
  services: { name: string; price: string; desc: string }[]
  cta: [string, string]
  disclosureHeading: string
  disclosure: string
}

const EN: LetterContent = {
  title: 'BUSINESS COMPLIANCE INFORMATION NOTICE',
  labels: { doc: 'Document Number', reg: 'Registration Date', notice: 'Notice Date', entity: 'Entity Type' },
  greeting: c => `Congratulations on the recent registration of ${c}.`,
  body: [
    'As a newly formed Florida business, there are several filings, registrations, and compliance-related ' +
    'services commonly requested during the early stages of operation. These services can help establish ' +
    'business credibility, support banking relationships, maintain accurate business records, and assist with ' +
    'the long-term good standing of your company.',
    'Many financial institutions, vendors, lenders, government agencies, and business partners may request ' +
    'documentation confirming your business status, tax identification information, and compliance history. ' +
    'Completing applicable filings in a timely manner can help avoid unnecessary delays when opening business ' +
    'bank accounts, applying for financing, entering into contracts, hiring employees, or expanding operations.',
    'To assist newly registered businesses, Florida Business Formation Center offers the services described below.',
  ],
  services: [
    {
      name: 'Labor Law Posters', price: '$120',
      desc: 'Federal and Florida law require every business with at least one employee to display current labor ' +
            'law notices where employees can see them. These notices cover wages, workplace safety, and equal ' +
            'employment rights. Displaying outdated posters can result in fines during an inspection.',
    },
    {
      name: 'EIN (Tax ID)', price: '$161',
      desc: 'A nine-digit number issued by the IRS to identify your business for federal tax purposes. By law, ' +
            'any business with at least one employee must obtain an EIN for payroll and employment tax reporting. ' +
            'Also commonly required to open a business bank account, file taxes, and apply for licenses.',
    },
    {
      name: 'Certificate of Status', price: '$79',
      desc: 'An official document from the State of Florida confirming your business is active and in good ' +
            'standing. Frequently requested by banks, lenders, vendors, and partners when opening accounts, ' +
            'applying for financing, or entering into contracts.',
    },
  ],
  cta: ['To request these services, scan the code', 'below or visit mybusinessformation.com'],
  disclosureHeading: 'IMPORTANT DISCLOSURE',
  disclosure:
    'Florida Business Formation Center is a professional document preparation and filing service. We are not a ' +
    'law firm and do not provide legal, tax, or financial advice. Our services do ' +
    'not constitute the practice of law and do not create an attorney-client relationship. All filings are ' +
    'subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific ' +
    'to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant. ' +
    'Florida Business Formation Center is not affiliated with, endorsed by, or approved by any federal, state, ' +
    'or local government agency, including the IRS, the U.S. Department of Labor, or the Florida Division of ' +
    'Corporations. This notice is not a bill, invoice, or demand for payment. The services described are optional.',
}

const ES: LetterContent = {
  title: 'AVISO INFORMATIVO DE CUMPLIMIENTO EMPRESARIAL',
  labels: { doc: 'Número de Documento', reg: 'Fecha de Registro', notice: 'Fecha del Aviso', entity: 'Tipo de Entidad' },
  greeting: c => `Felicitaciones por el registro reciente de ${c}.`,
  body: [
    'Como empresa de reciente formación en Florida, existen varios trámites, registros y servicios de ' +
    'cumplimiento que suelen solicitarse durante las primeras etapas de operación. Estos servicios ayudan a ' +
    'establecer la credibilidad del negocio, respaldar relaciones bancarias, mantener registros precisos y ' +
    'contribuir al buen estado legal de su empresa a largo plazo.',
    'Muchas instituciones financieras, proveedores, prestamistas, agencias gubernamentales y socios comerciales ' +
    'pueden solicitar documentación que confirme el estado de su negocio, su información de identificación fiscal ' +
    'y su historial de cumplimiento. Completar los trámites correspondientes a tiempo ayuda a evitar demoras ' +
    'innecesarias al abrir cuentas bancarias comerciales, solicitar financiamiento, firmar contratos, contratar ' +
    'empleados o expandir operaciones.',
    'Para asistir a las empresas recién registradas, Florida Business Formation Center ofrece los servicios que ' +
    'se describen a continuación.',
  ],
  services: [
    {
      name: 'Carteles de Ley Laboral', price: '$120',
      desc: 'Las leyes federales y de Florida exigen que toda empresa con al menos un empleado exhiba los carteles ' +
            'vigentes de ley laboral en un lugar visible para los empleados. Informan sobre salarios, seguridad ' +
            'laboral e igualdad de oportunidades. Exhibir carteles desactualizados puede generar multas en una inspección.',
    },
    {
      name: 'EIN (Número Fiscal)', price: '$161',
      desc: 'Número de nueve dígitos emitido por el IRS para identificar su negocio ante el fisco federal. Por ley, ' +
            'toda empresa con al menos un empleado debe obtener un EIN para la nómina y la declaración de impuestos ' +
            'laborales. También suele requerirse para abrir una cuenta bancaria comercial, declarar impuestos y obtener licencias.',
    },
    {
      name: 'Certificado de Estatus', price: '$79',
      desc: 'Documento oficial del Estado de Florida que confirma que su negocio está activo y en buen estado. ' +
            'Suele ser solicitado por bancos, prestamistas, proveedores y socios al abrir cuentas, solicitar ' +
            'financiamiento o firmar contratos.',
    },
  ],
  cta: ['Para solicitar estos servicios, escanee el código', 'o visite mybusinessformation.com'],
  disclosureHeading: 'AVISO IMPORTANTE',
  disclosure:
    'Florida Business Formation Center es un servicio profesional de preparación y presentación de documentos. ' +
    'No somos un bufete de abogados y no brindamos asesoría legal, fiscal ni ' +
    'financiera. Nuestros servicios no constituyen el ejercicio de la abogacía ni crean una relación ' +
    'abogado-cliente. Todas las presentaciones están sujetas a la aprobación de la División de Corporaciones de ' +
    'Florida y del IRS. Para orientación legal o fiscal específica a su situación, le recomendamos consultar a un ' +
    'abogado de Florida con licencia o a un contador público certificado. Florida Business Formation Center no ' +
    'está afiliado, respaldado ni aprobado por ninguna agencia gubernamental federal, estatal o local, incluidos ' +
    'el IRS, el Departamento de Trabajo de EE. UU. o la División de Corporaciones de Florida. Este aviso no es una ' +
    'factura ni una solicitud de pago. Los servicios descritos son opcionales.',
}

// Blinda contra crashes por caracteres que WinAnsi (CP1252) no puede codificar
// en campos de texto libre (nombre de empresa, dueño, dirección) — ej. "Ń"
// (Polaco, U+0143) tipeado por error en vez de "Ñ" (U+00D1, sí soportado).
// Antes cualquier caracter así tiraba abajo TODA la generación del PDF con un
// 500 sin aviso claro de cuál campo lo causó (bug real 2026-09-11, encontrado
// con la empresa de prueba "PEPE CAMPAÑA COMPANY"). Intenta primero quitar el
// acento/diacrítico (NFKD) — si el resultado es ASCII imprimible lo usa, si no
// simplemente omite el caracter en vez de romper todo el documento.
function sanitizeForWinAnsi(str: string, font: PDFFont): string {
  let out = ''
  for (const ch of str) {
    try {
      font.widthOfTextAtSize(ch, 10)
      out += ch
    } catch {
      const stripped = ch.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      if (stripped && /^[\x20-\x7E]*$/.test(stripped)) out += stripped
    }
  }
  return out
}

// ── Word-wrap helper ──────────────────────────────────────────────────────────
function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? current + ' ' + word : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

// ── Main generator ────────────────────────────────────────────────────────────
// La carta SIEMPRE debe caber en 1 sola página (decisión de negocio, no una
// preferencia estética) — pero el texto en español ocupa más espacio que en
// inglés en varios bloques (párrafos del cuerpo, descripciones de servicios,
// aviso legal), y con tamaños fijos eso a veces desbordaba a una 2da página
// (bug real encontrado 2026-09-14 probando el combo de "Print Selected").
//
// Fix: `renderInto(scale)` dibuja la carta completa aplicando `scale` SOLO a
// los bloques de texto largo/variable (párrafos del cuerpo, descripción de
// servicios, aviso legal) y a los espacios chicos entre ellos — nunca al
// título, el QR, los precios, ni el recuadro de registro, que deben verse
// siempre igual de legibles sin importar el idioma. Se intenta primero a
// escala 1.0 (el caso común, ej. inglés); si el resultado da más de 1
// página, se reintenta con una escala un poco menor hasta que entre, con un
// piso para nunca volver el texto ilegible.
export async function generateNewBusinessLetter(input: NewBusinessLetterData): Promise<Uint8Array> {
  const C = input.lang === 'es' ? ES : EN

  async function renderInto(scale: number): Promise<PDFDocument> {
  const doc     = await PDFDocument.create()
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  // Sanitiza los campos de texto libre (tipeados a mano por el admin, a
  // diferencia de entityType/registrationDate/etc. que ya vienen localizados
  // y controlados por el código) contra caracteres no soportados por WinAnsi.
  // Se recalcula en cada intento a partir de `input` (nunca mutado) —
  // sanitizar dos veces el mismo texto da el mismo resultado, sin riesgo de
  // ir "sobre-limpiando" en escalas sucesivas. `data` acá adentro sombrea a
  // propósito el `input` de la función exportada — el resto del cuerpo de
  // renderInto no necesita tocarse, ya lee `data` como siempre.
  const data: NewBusinessLetterData = {
    ...input,
    companyName: sanitizeForWinAnsi(input.companyName, regular),
    ownerName: input.ownerName ? sanitizeForWinAnsi(input.ownerName, regular) : input.ownerName,
    address: input.address ? sanitizeForWinAnsi(input.address, regular) : input.address,
    city: input.city ? sanitizeForWinAnsi(input.city, regular) : input.city,
  }

  // Mutable page cursor — los helpers leen `page`/`y` actuales vía closure.
  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - 40

  const newPage = () => { page = doc.addPage([PAGE_W, PAGE_H]); y = PAGE_H - 50 }
  const ensure  = (h: number) => { if (y - h < BOTTOM) newPage() }

  // ── Draw helpers (usan el `page` actual) ──────────────────────────────────
  const t = (str: string, x: number, yy: number, font: PDFFont, size: number, color = BLACK) =>
    page.drawText(str, { x, y: yy, font, size, color })

  const rect = (x: number, yy: number, w: number, h: number, color: ReturnType<typeof rgb>,
                border?: { color: ReturnType<typeof rgb>; width: number }) =>
    page.drawRectangle({ x, y: yy, width: w, height: h, color, borderColor: border?.color, borderWidth: border?.width })

  const centered = (str: string, boxX: number, boxW: number, yy: number, font: PDFFont, size: number, color = BLACK) => {
    const w = font.widthOfTextAtSize(str, size)
    t(str, boxX + (boxW - w) / 2, yy, font, size, color)
  }

  // Párrafo justificado a la izquierda con salto de página automático por línea.
  const para = (text: string, font: PDFFont, size: number, lh: number, color = BLACK) => {
    for (const line of wrapLines(text, font, size, CW)) {
      ensure(lh)
      t(line, MX, y, font, size, color)
      y -= lh
    }
  }

  // ── 1. TITLE (sin recuadro) ───────────────────────────────────────────────
  centered(C.title, MX, CW, y - 15, bold, 17, NAVY)
  y -= 54

  // ── 2. SENDER / BRAND ─────────────────────────────────────────────────────
  // Sello real FBFC (navy) embebido desde ./fbfc-seal. Si por alguna razón falla
  // el embed, cae al círculo provisional "FBFC" para no romper la generación.
  const logoR  = 26
  const logoCx = MX + logoR
  const logoCy = y - 22
  const logoD  = logoR * 2
  try {
    const sealImg = await doc.embedPng(Buffer.from(FBFC_SEAL_PNG_BASE64, 'base64'))
    page.drawImage(sealImg, { x: MX, y: logoCy - logoR, width: logoD, height: logoD })
  } catch {
    page.drawCircle({ x: logoCx, y: logoCy, size: logoR, color: NAVY })
    const fbfcW = bold.widthOfTextAtSize('FBFC', 9)
    t('FBFC', logoCx - fbfcW / 2, logoCy - 3.5, bold, 9, WHITE)
  }

  const txtX = MX + logoR * 2 + 12
  t('FLORIDA BUSINESS FORMATION CENTER', txtX, y - 10, bold, 11, NAVY)
  const dom = 'mybusinessformation.com'
  const domW = bold.widthOfTextAtSize(dom, 10)
  t(dom, PAGE_W - MX - domW, y - 10, bold, 10, BLUE)
  t('3700 SW 27TH ST Suite D104', txtX, y - 25, regular, 8, GRAY)
  t('GAINESVILLE FL 32608', txtX, y - 36, regular, 8, GRAY)
  y -= 78

  // ── 3. DESTINATARIO (izq) + RECUADRO DE REGISTRO (der) ────────────────────
  const topY = y

  // Bloque destinatario: empresa + dirección
  let ly = topY - 4
  const recipient: { s: string; f: PDFFont; sz: number; c: ReturnType<typeof rgb> }[] = []
  recipient.push({ s: data.companyName, f: bold, sz: 11, c: NAVY })
  if (data.address) recipient.push({ s: data.address, f: regular, sz: 9, c: BLACK })
  let cityLine = ''
  if (data.city && data.zip) cityLine = `${data.city}, FL ${data.zip}`
  else if (data.city)        cityLine = `${data.city}, FL`
  else if (data.zip)         cityLine = `FL ${data.zip}`
  if (cityLine) recipient.push({ s: cityLine, f: regular, sz: 9, c: BLACK })
  for (const r of recipient) {
    t(r.s, MX, ly, r.f, r.sz, r.c)
    ly -= 13
  }
  const leftH = topY - ly

  // Recuadro de registro (derecha)
  const boxX = 355
  const boxW = PAGE_W - MX - boxX   // 207
  const boxRows: [string, string][] = [
    [C.labels.doc,    data.documentId],
    [C.labels.reg,    data.registrationDate || '—'],
    [C.labels.notice, data.noticeDate],
    [C.labels.entity, data.entityType],
  ]
  const brH    = 13
  const boxPad = 8
  const accent = 4
  const boxH   = accent + boxPad + boxRows.length * brH + 4
  rect(boxX, topY - boxH, boxW, boxH, OFF_WHITE, { color: LIGHT, width: 0.75 })
  rect(boxX, topY - accent, boxW, accent, NAVY)   // franja superior navy
  let by = topY - accent - boxPad - 4
  for (const [label, value] of boxRows) {
    t(label, boxX + 9, by, bold, 6.8, GRAY)
    // Blindaje: el valor se alinea a la derecha, así que un dato largo (ej. un
    // document_id tecleado a mano) crecería hasta encimarse con la etiqueta.
    // Se achica el tamaño hasta caber en el hueco libre; si aún no cabe al mínimo,
    // se trunca con puntos suspensivos. Nunca se encima, sea cual sea el dato.
    const labelW = bold.widthOfTextAtSize(label, 6.8)
    const availW = boxW - 18 - labelW - 6   // hueco a la derecha de la etiqueta
    let vSize = 7.5
    let vStr  = value
    while (vSize > 5 && regular.widthOfTextAtSize(vStr, vSize) > availW) vSize -= 0.5
    if (regular.widthOfTextAtSize(vStr, vSize) > availW) {
      while (vStr.length > 1 && regular.widthOfTextAtSize(vStr + '…', vSize) > availW) vStr = vStr.slice(0, -1)
      vStr += '…'
    }
    const vw = regular.widthOfTextAtSize(vStr, vSize)
    t(vStr, boxX + boxW - 9 - vw, by, regular, vSize, BLACK)
    by -= brH
  }

  y = topY - Math.max(leftH, boxH) - 30

  // ── 4. BODY ───────────────────────────────────────────────────────────────
  // Tamaño/interlineado escalados — este es el bloque de texto más largo y
  // el que más varía entre inglés y español (ver comentario de scale arriba
  // del export). El saludo se deja fijo (una sola línea corta, no aporta al
  // desborde).
  para(C.greeting(data.companyName), bold, 9.5, 14, NAVY)
  y -= 4 * scale
  para(C.body[0], regular, 8.5 * scale, 12.5 * scale, BLACK)
  y -= 6 * scale
  para(C.body[1], regular, 8.5 * scale, 12.5 * scale, BLACK)
  y -= 6 * scale
  para(C.body[2], regular, 8.5 * scale, 12.5 * scale, BLACK)
  y -= 12 * scale

  // ── 5. SERVICES GRID (3 columnas con precio + resumen) ────────────────────
  const services = C.services
  const colGap   = 10
  const colW     = (CW - colGap * 2) / 3
  const descSize = 6.5 * scale
  const descLh   = 8.5 * scale
  const headerH  = 18
  const priceGap = 24
  const descPad  = 8
  const descLinesArr = services.map(s => wrapLines(s.desc, regular, descSize, colW - 14))
  const maxLines = Math.max(...descLinesArr.map(a => a.length))
  const gridH = headerH + priceGap + maxLines * descLh + descPad

  ensure(gridH + 4)   // mantener la grilla íntegra (no partirla entre páginas)
  services.forEach((s, i) => {
    const cx = MX + i * (colW + colGap)
    rect(cx, y - gridH, colW, gridH, WHITE, { color: LIGHT, width: 0.75 })
    // Header navy
    rect(cx, y - headerH, colW, headerH, NAVY)
    centered(s.name, cx, colW, y - headerH + 5.5, bold, 7.5, WHITE)
    // Price
    const pw = bold.widthOfTextAtSize(s.price, 15)
    t(s.price, cx + (colW - pw) / 2, y - headerH - priceGap + 7, bold, 15, BLACK)
    // Description
    let dy = y - headerH - priceGap - 2
    descLinesArr[i].forEach(line => { t(line, cx + 7, dy, regular, descSize, GRAY); dy -= descLh })
  })
  y -= gridH + 16 * scale

  // ── 6. CTA (discreto) + QR ────────────────────────────────────────────────
  // El QR y su texto se dejan siempre a tamaño fijo — nunca debe volverse
  // menos escaneable ni menos legible por un ajuste de espacio.
  const fullPayUrl = data.payUrl.startsWith('http') ? data.payUrl : `https://${data.payUrl}`
  let qrImage = null
  try {
    const qrPng = await QRCode.toBuffer(fullPayUrl, { width: 200, margin: 1 })
    qrImage = await doc.embedPng(qrPng)
  } catch { /* skip QR si falla */ }

  const qrDim = 76
  ensure(40 + qrDim + 30)
  y -= 6 * scale
  centered(C.cta[0], MX, CW, y, bold, 9.5, NAVY)
  y -= 13
  centered(C.cta[1], MX, CW, y, bold, 9.5, NAVY)
  y -= 12
  if (qrImage) {
    const qx = MX + (CW - qrDim) / 2
    page.drawImage(qrImage, { x: qx, y: y - qrDim, width: qrDim, height: qrDim })
    y -= qrDim + 6
  }
  centered('mybusinessformation.com', MX, CW, y, bold, 10, BLUE)
  y -= 18 * scale

  // ── 7. IMPORTANT DISCLOSURE ───────────────────────────────────────────────
  // El texto legal es el otro bloque largo que varía por idioma — se escala
  // igual que el cuerpo. El encabezado ("IMPORTANT DISCLOSURE"/"AVISO
  // IMPORTANTE") se deja fijo, es corto y no aporta al desborde.
  ensure(24)
  y -= 6 * scale
  t(C.disclosureHeading, MX, y, bold, 8.5, NAVY)
  y -= 12 * scale
  para(C.disclosure, regular, 6.8 * scale, 9 * scale, GRAY)

  return doc
  }

  // Escala 1.0 primero (cubre el caso común, ej. inglés, sin ningún costo
  // extra) — si el resultado da más de 1 página, se reintenta con una
  // escala un poco menor hasta que entre. Piso en 0.8 para nunca dejar el
  // texto ilegiblemente chico; si ni al piso entra (caso extremo, ej. un
  // nombre de empresa larguísimo sumado a todo lo demás), se acepta el
  // resultado igual antes que romper o generar un PDF corrupto.
  const SCALE_FLOOR = 0.8
  const SCALE_STEP = 0.05
  let scale = 1.0
  let doc = await renderInto(scale)
  while (doc.getPageCount() > 1 && scale > SCALE_FLOOR) {
    scale = Math.max(SCALE_FLOOR, scale - SCALE_STEP)
    doc = await renderInto(scale)
  }

  return doc.save()
}
