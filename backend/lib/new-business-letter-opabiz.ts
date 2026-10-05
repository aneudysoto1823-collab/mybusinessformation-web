// Carta física de cumplimiento (PDF) — versión OpaBiz (2026-10-05).
// Copia separada a propósito de lib/new-business-letter.ts (la carta de
// mybusinessformation.com): el founder pidió las dos marcas completamente
// separadas. Mismo layout de 1 página, mismas reglas FTC/UPL (disclaimer
// antes de los precios, precio tipo factura, disclosure completo) y el mismo
// ajuste de escala para que el español entre en una hoja. Cambia: membrete
// OpaBiz (logo OB), precios de opabiz.com (EIN $79, Good Standing $49 + $9),
// nota del combo 10% y QR/dominio a opabiz.com/oferta. Las utilidades neutras
// (fechas, tipo de entidad, unir PDFs) se reusan del archivo de mybiz.
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import { OPABIZ_LOGO_PNG_BASE64 } from './opabiz-logo'
import type { NewBusinessLetterData } from './new-business-letter'

// ── Colors ────────────────────────────────────────────────────────────────────
const NAVY      = rgb(0.11, 0.18, 0.27)   // #1C2E44
const BLUE      = rgb(0.15, 0.39, 0.92)   // #2563EB
const WHITE     = rgb(1, 1, 1)
const BLACK     = rgb(0.10, 0.10, 0.10)
const GRAY      = rgb(0.40, 0.40, 0.40)
const LIGHT     = rgb(0.85, 0.85, 0.85)
const OFF_WHITE = rgb(0.97, 0.97, 0.97)
// Disclaimer superior (auditoría FTC/UPL 2026-09-15) — mismo tinte azul que
// ya usa vip-reminder-email.ts y campaign-email.ts (2026-09-17, pedido
// founder: "suavizarlo, que no asuste tanto"; antes era verde).
const DISC_TINT   = rgb(0.937, 0.965, 1.0)    // #EFF6FF
const DISC_BORDER = rgb(0.749, 0.859, 0.996)  // #BFDBFE
const DISC_TEXT   = rgb(0.118, 0.251, 0.686)  // #1E40AF

const PAGE_W = 612
const PAGE_H = 792
const MX     = 50    // horizontal margin
const CW     = PAGE_W - MX * 2   // content width = 512
const BOTTOM = 56    // bottom margin — trigger page break below this

// ── Contenido bilingüe (solo el texto FIJO; los datos variables vienen en data) ──
type LetterContent = {
  title: string
  // Disclaimer privado/no-gobierno, agregado ANTES del recuadro de registro
  // y de cualquier precio — hallazgo #2 de la auditoría FTC/UPL 2026-09-15
  // (antes el disclosure legal solo aparecía al final, después de los precios).
  topDisclaimer: string
  labels: { doc: string; reg: string; notice: string; entity: string }
  greeting: (company: string) => string
  body: [string, string, string]
  // govFeeLabel/govFeeAmount: línea opcional bajo el precio para el servicio
  // que sí tiene una tarifa gubernamental real que desglosar (hoy solo EIN,
  // "IRS Fee $0.00" — hallazgo #3 de la misma auditoría). Labor Law Posters
  // y Certificate of Status no tienen una tarifa de gobierno separada, así
  // que quedan sin esas 2 propiedades.
  // feeLabel: override de la etiqueta "FILING SERVICES FEE" para servicios
  // que no son un trámite ante ninguna agencia (ej. Labor Law Posters, un
  // producto físico) — ahí "Filing" sería inexacto, usa "SERVICE FEE" en su lugar.
  services: { name: string; price: string; desc: string; feeLabel?: string; govFeeLabel?: string; govFeeAmount?: string }[]
  combo: string
  cta: [string, string]
  disclosureHeading: string
  disclosure: string
}

const EN: LetterContent = {
  title: 'BUSINESS COMPLIANCE INFORMATION NOTICE',
  topDisclaimer:
    'Running a business means plenty of paperwork, and we handle it for you. We are a private, optional ' +
    'document preparation service, not affiliated with the State of Florida or the IRS.',
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
    'To assist newly registered businesses, OpaBiz offers the services described below.',
  ],
  services: [
    {
      name: 'Labor Law Poster', price: '$120', feeLabel: 'SERVICE FEE', govFeeLabel: 'Shipping', govFeeAmount: 'included',
      desc: 'Federal and Florida law require every business with at least one employee to display current labor ' +
            'law notices where employees can see them. These notices cover wages, workplace safety, and equal ' +
            'employment rights. We ship an up-to-date, all-in-one poster that helps you avoid costly fines.',
    },
    {
      name: 'EIN (Tax ID)', price: '$79', govFeeLabel: 'IRS Fee', govFeeAmount: '$0.00',
      desc: 'A nine-digit number issued by the IRS to identify your business for federal tax purposes. By law, ' +
            'any business with at least one employee must obtain an EIN for payroll and employment tax reporting. ' +
            'Also commonly required to open a business bank account, file taxes, and apply for licenses. Filing it ' +
            'with our specialized team helps avoid errors and approval delays.',
    },
    {
      name: 'Certificate of Good Standing', price: '$49', govFeeLabel: 'Florida State Fee', govFeeAmount: '$9',
      desc: 'An official document from the State of Florida confirming your business is active and in good ' +
            'standing. Frequently requested by banks, lenders, vendors, and partners when opening accounts, ' +
            'applying for financing, or entering into contracts. Our specialized team handles the request correctly, ' +
            'helping avoid delays.',
    },
  ],
  combo: 'Get all 3 services together and save 10%.',
  cta: ['To request these services, scan the code', 'below or visit opabiz.com/oferta'],
  disclosureHeading: 'IMPORTANT DISCLOSURE',
  disclosure:
    'OpaBiz is a trade name of Florida Business Formation Center, a professional document preparation and ' +
    'filing service. We are not a law firm and do not provide legal, tax, or financial advice. Our services do ' +
    'not constitute the practice of law and do not create an attorney-client relationship. All filings are ' +
    'subject to approval by the Florida Division of Corporations and the IRS. For legal or tax guidance specific ' +
    'to your situation, we encourage you to consult a licensed Florida attorney or certified public accountant. ' +
    'OpaBiz is not affiliated with, endorsed by, or approved by any federal, state, ' +
    'or local government agency, including the IRS, the U.S. Department of Labor, or the Florida Division of ' +
    'Corporations. This notice is not a bill, invoice, or demand for payment. The services described are optional.',
}

const ES: LetterContent = {
  title: 'AVISO INFORMATIVO DE CUMPLIMIENTO EMPRESARIAL',
  topDisclaimer:
    'Formar y mantener una empresa implica mucho papeleo, y nosotros nos encargamos por usted. Somos un ' +
    'servicio privado y opcional de preparación de documentos, sin afiliación con el Estado de Florida ni el IRS.',
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
    'Para asistir a las empresas recién registradas, OpaBiz ofrece los servicios que se describen a continuación.',
  ],
  services: [
    {
      name: 'Póster de Leyes Laborales', price: '$120', feeLabel: 'SERVICE FEE', govFeeLabel: 'Envío', govFeeAmount: 'incluido',
      desc: 'Las leyes federales y de Florida exigen que toda empresa con al menos un empleado exhiba los avisos ' +
            'laborales vigentes en un lugar visible para los empleados. Informan sobre salarios, seguridad laboral e ' +
            'igualdad de oportunidades. Le enviamos un póster actualizado que le ayuda a evitar multas.',
    },
    {
      name: 'EIN (Número Fiscal)', price: '$79', govFeeLabel: 'IRS Fee', govFeeAmount: '$0.00',
      desc: 'Número de nueve dígitos emitido por el IRS para identificar su negocio ante el fisco federal. Por ley, ' +
            'toda empresa con al menos un empleado debe obtener un EIN para la nómina y la declaración de impuestos ' +
            'laborales. También suele requerirse para abrir una cuenta bancaria comercial, declarar impuestos y ' +
            'obtener licencias. Presentarlo con nuestro equipo especializado ayuda a evitar errores y demoras.',
    },
    {
      name: 'Certificado de Buena Reputación', price: '$49', govFeeLabel: 'Tarifa Estatal FL', govFeeAmount: '$9',
      desc: 'Documento oficial del Estado de Florida que confirma que su negocio está activo y en buen estado. ' +
            'Suele ser solicitado por bancos, prestamistas, proveedores y socios al abrir cuentas, solicitar ' +
            'financiamiento o firmar contratos. Nuestro equipo especializado se encarga de tramitarlo correctamente.',
    },
  ],
  combo: 'Contrate los 3 servicios juntos y ahorre un 10%.',
  cta: ['Para solicitar estos servicios, escanee el código', 'o visite opabiz.com/oferta'],
  disclosureHeading: 'AVISO IMPORTANTE',
  disclosure:
    'OpaBiz es un nombre comercial de Florida Business Formation Center, un servicio profesional de preparación ' +
    'y presentación de documentos. No somos un bufete de abogados y no brindamos asesoría legal, fiscal ni ' +
    'financiera. Nuestros servicios no constituyen el ejercicio de la abogacía ni crean una relación ' +
    'abogado-cliente. Todas las presentaciones están sujetas a la aprobación de la División de Corporaciones de ' +
    'Florida y del IRS. Para orientación legal o fiscal específica a su situación, le recomendamos consultar a un ' +
    'abogado de Florida con licencia o a un contador público certificado. OpaBiz no ' +
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
export async function generateOpabizLetter(input: NewBusinessLetterData): Promise<Uint8Array> {
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

  // ── 2. SENDER / BRAND (OpaBiz) ─────────────────────────────────────────
  // Logo OB real (PNG con el gradiente navy→azul, el mismo que usan los
  // emails de OpaBiz). Si el embed falla, cae a un cuadrado navy con "OB".
  const logoD  = 44
  const logoY  = y - 44
  try {
    const logoImg = await doc.embedPng(Buffer.from(OPABIZ_LOGO_PNG_BASE64, 'base64'))
    page.drawImage(logoImg, { x: MX, y: logoY, width: logoD, height: logoD })
  } catch {
    rect(MX, logoY, logoD, logoD, NAVY)
    const obW = bold.widthOfTextAtSize('OB', 14)
    t('OB', MX + (logoD - obW) / 2, logoY + logoD / 2 - 5, bold, 14, WHITE)
  }

  const txtX = MX + logoD + 12
  const opaW = bold.widthOfTextAtSize('Opa', 15)
  t('Opa', txtX, y - 13, bold, 15, NAVY)
  t('Biz', txtX + opaW, y - 13, bold, 15, BLUE)
  const dom = 'opabiz.com'
  const domW = bold.widthOfTextAtSize(dom, 10)
  t(dom, PAGE_W - MX - domW, y - 10, bold, 10, BLUE)
  t('3700 SW 27TH ST Suite D104', txtX, y - 27, regular, 8, GRAY)
  t('GAINESVILLE FL 32608', txtX, y - 38, regular, 8, GRAY)
  // Menos aire que la de mybiz (78): el logo OB es más bajo que el sello y
  // la carta de OpaBiz suma la línea del combo; así el español entra en 1 hoja.
  y -= 60

  // ── 2.5 DISCLAIMER SUPERIOR (antes de cualquier precio) ───────────────────
  // Hallazgo #2 de la auditoría FTC/UPL 2026-09-15: antes el aviso de "no
  // somos gobierno" solo vivía al final de la carta, después de los precios.
  // Este bloque va justo después del membrete, antes del recuadro de
  // registro — nunca escalado por `scale` (es corto y fijo en los 2 idiomas,
  // a diferencia del cuerpo/servicios/disclosure final que sí varían).
  {
    const discSize = 7.3
    const discLh = 9.5
    const discLines = wrapLines(C.topDisclaimer, regular, discSize, CW - 20)
    const discPad = 7
    const discH = discPad * 2 + discLines.length * discLh
    ensure(discH + 10)
    rect(MX, y - discH, CW, discH, DISC_TINT, { color: DISC_BORDER, width: 0.75 })
    let dly = y - discPad - 6.5
    discLines.forEach(line => { t(line, MX + 10, dly, regular, discSize, DISC_TEXT); dly -= discLh })
    y -= discH + 16
  }

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

  // ── 5. SERVICES GRID (3 columnas, precio en formato de factura) ───────────
  // Hallazgo #3 auditoría FTC/UPL: el precio ya no es un número suelto —
  // ahora lleva la etiqueta "FILING SERVICES FEE" arriba (deja claro que es
  // NUESTRO honorario, no un cargo de gobierno), y el servicio que sí tiene
  // una tarifa gubernamental real (EIN → IRS Fee $0.00) la muestra en una
  // segunda línea chica debajo. El espacio de esa 2da línea se reserva por
  // igual en las 3 columnas (aunque solo EIN la usa) para que la grilla
  // quede pareja — ver mismo criterio en campaign-email.ts.
  const services = C.services
  const colGap   = 10
  const colW     = (CW - colGap * 2) / 3
  const descSize = 6.5 * scale
  const descLh   = 8.5 * scale
  const headerH  = 18
  const feeLabelOffset  = 9    // "FILING SERVICES FEE" — debajo del header
  const priceOffset     = 21   // precio principal
  const govFeeOffset    = 30   // 2da línea opcional (ej. "IRS Fee: $0.00")
  const descStartOffset = 42   // inicio de la descripción — fijo en las 3 columnas
  const descPad  = 8
  const descLinesArr = services.map(s => wrapLines(s.desc, regular, descSize, colW - 14))
  const maxLines = Math.max(...descLinesArr.map(a => a.length))
  const gridH = headerH + descStartOffset + maxLines * descLh + descPad

  ensure(gridH + 4)   // mantener la grilla íntegra (no partirla entre páginas)
  services.forEach((s, i) => {
    const cx = MX + i * (colW + colGap)
    rect(cx, y - gridH, colW, gridH, WHITE, { color: LIGHT, width: 0.75 })
    // Header navy
    rect(cx, y - headerH, colW, headerH, NAVY)
    centered(s.name, cx, colW, y - headerH + 5.5, bold, 7.5, WHITE)
    // "FILING SERVICES FEE" + precio (o el override de s.feeLabel)
    const feeLabel = s.feeLabel ?? 'FILING SERVICES FEE'
    const flw = regular.widthOfTextAtSize(feeLabel, 5.2)
    t(feeLabel, cx + (colW - flw) / 2, y - headerH - feeLabelOffset, regular, 5.2, GRAY)
    const pw = bold.widthOfTextAtSize(s.price, 15)
    t(s.price, cx + (colW - pw) / 2, y - headerH - priceOffset, bold, 15, BLACK)
    // Línea opcional de tarifa gubernamental (solo EIN hoy)
    if (s.govFeeLabel && s.govFeeAmount) {
      const gline = `${s.govFeeLabel}: ${s.govFeeAmount}`
      const gw = regular.widthOfTextAtSize(gline, 6)
      t(gline, cx + (colW - gw) / 2, y - headerH - govFeeOffset, regular, 6, GRAY)
    }
    // Description
    let dy = y - headerH - descStartOffset
    descLinesArr[i].forEach(line => { t(line, cx + 7, dy, regular, descSize, GRAY); dy -= descLh })
  })
  y -= gridH + 14 * scale
  centered(C.combo, MX, CW, y, bold, 9, NAVY)
  y -= 14 * scale

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
  centered('opabiz.com/oferta', MX, CW, y, bold, 10, BLUE)
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
