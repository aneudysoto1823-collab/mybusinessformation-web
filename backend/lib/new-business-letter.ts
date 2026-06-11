import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib'
import QRCode from 'qrcode'

// ── Colors ────────────────────────────────────────────────────────────────────
const NAVY      = rgb(0.11, 0.18, 0.27)   // #1C2E44
const BLUE      = rgb(0.15, 0.39, 0.92)   // #2563EB
const GOLD      = rgb(0.96, 0.62, 0.04)   // total fee highlight
const WHITE     = rgb(1, 1, 1)
const BLACK     = rgb(0.08, 0.08, 0.08)
const GRAY      = rgb(0.42, 0.42, 0.42)
const LIGHT     = rgb(0.90, 0.90, 0.90)
const OFF_WHITE = rgb(0.97, 0.97, 0.97)

const PAGE_W = 612
const PAGE_H = 792
const MX = 50   // horizontal margin

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

// ── Draw helpers (closure over page+fonts) ────────────────────────────────────
function makeDrawers(page: PDFPage, bold: PDFFont, regular: PDFFont) {
  const t = (str: string, x: number, y: number, font: PDFFont, size: number, color = BLACK) =>
    page.drawText(str, { x, y, font, size, color })

  const r = (x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>,
             border?: { color: ReturnType<typeof rgb>; width: number }) =>
    page.drawRectangle({ x, y, width: w, height: h, color, borderColor: border?.color, borderWidth: border?.width })

  const line = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5, color = LIGHT) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color })

  const centered = (str: string, boxX: number, boxW: number, y: number, font: PDFFont, size: number, color = BLACK) => {
    const w = font.widthOfTextAtSize(str, size)
    t(str, boxX + (boxW - w) / 2, y, font, size, color)
  }

  return { t, r, line, centered }
}

// ── Main generator ────────────────────────────────────────────────────────────
export async function generateNewBusinessLetter(data: NewBusinessLetterData): Promise<Uint8Array> {
  const doc   = await PDFDocument.create()
  const page  = doc.addPage([PAGE_W, PAGE_H])
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const { t, r, line, centered } = makeDrawers(page, bold, regular)

  const year     = data.year ?? new Date().getFullYear()
  const CW       = PAGE_W - MX * 2   // content width = 512
  let y          = PAGE_H - 36

  // ── 1. HEADER ───────────────────────────────────────────────────────────────
  // Circle logo "FBFC"
  const cx = MX + 22
  const cy = y - 18
  page.drawCircle({ x: cx, y: cy, size: 22, color: NAVY })
  const fbfcW = bold.widthOfTextAtSize('FBFC', 8)
  t('FBFC', cx - fbfcW / 2, cy - 4, bold, 8, WHITE)

  // Company name + address
  t('FLORIDA BUSINESS FORMATION CENTER', MX + 50, y - 8,  bold, 9, NAVY)
  t('3700 SW 27TH ST Suite D104  |  Gainesville, FL 32608', MX + 50, y - 20, regular, 7, GRAY)

  // Info table (right side)
  const tX = 376
  const tW = 186
  const rows = [
    { label: 'Document ID#',       value: data.documentId, bg: OFF_WHITE },
    { label: 'Notice Date:',       value: data.noticeDate,  bg: WHITE     },
    { label: 'Please Respond By:', value: data.respondBy,   bg: OFF_WHITE },
  ]
  let rowY = y
  const rowH = 16
  rows.forEach(row => {
    r(tX, rowY - rowH, tW, rowH, row.bg, { color: LIGHT, width: 0.5 })
    t(row.label, tX + 6, rowY - rowH + 5, bold, 7, NAVY)
    t(row.value, tX + 100, rowY - rowH + 5, regular, 7, BLACK)
    rowY -= rowH
  })
  // Total fee row (navy bg)
  r(tX, rowY - rowH, tW, rowH, NAVY, { color: NAVY, width: 0.5 })
  t('Total Fee:', tX + 6, rowY - rowH + 5, bold, 7, WHITE)
  const feeW = bold.widthOfTextAtSize(data.totalFee, 9)
  t(data.totalFee, tX + tW - feeW - 8, rowY - rowH + 4, bold, 9, GOLD)

  y = y - 4 * rowH - 10

  // ── 2. DIVIDER ──────────────────────────────────────────────────────────────
  line(MX, y, PAGE_W - MX, y, 1, LIGHT)
  y -= 12

  // ── 3. TITLE BAR ────────────────────────────────────────────────────────────
  const titleH = 24
  r(MX, y - titleH, CW, titleH, NAVY)
  centered(`${year} NOTICE OF BUSINESS COMPLIANCE SERVICES`, MX, CW, y - titleH + 8, bold, 10, WHITE)
  y -= titleH + 14

  // ── 4. CLIENT ADDRESS BLOCK ─────────────────────────────────────────────────
  const addrLines = [data.ownerName, data.companyName, data.address, `${data.city}, FL ${data.zip}`]
  addrLines.forEach(ln => { t(ln, MX, y, regular, 9, BLACK); y -= 13 })
  y -= 8

  // ── 5. DIVIDER ──────────────────────────────────────────────────────────────
  line(MX, y, PAGE_W - MX, y, 0.5, LIGHT)
  y -= 14

  // ── 6. ACTION REQUIRED BOX ──────────────────────────────────────────────────
  const bodyText = `Congratulations on registering ${data.companyName} with the State of Florida. As a newly formed business there are a few important steps you may need to complete to ensure your company is fully operational and compliant. We are here to help you get everything in order quickly and easily. You can complete your request online by visiting the link below or scanning the QR code.`
  const bodyLines = wrapLines(bodyText, regular, 7.5, CW - 16)
  const actionH = 16 + bodyLines.length * 10 + 10
  r(MX, y - actionH, CW, actionH, OFF_WHITE, { color: NAVY, width: 1 })
  t('ACTION REQUIRED — Keep Your Business Protected and Compliant', MX + 8, y - 13, bold, 8.5, NAVY)
  let bodyY = y - 26
  bodyLines.forEach(ln => { t(ln, MX + 8, bodyY, regular, 7.5, BLACK); bodyY -= 10 })
  y -= actionH + 12

  // ── 7. SERVICES GRID ────────────────────────────────────────────────────────
  const services = [
    {
      name: 'Labor Law Posters', price: '$120.00',
      desc: 'Both Federal and State Law require every business with at least one employee to post current labor law notices in a clearly visible workplace area. Non-compliance can lead to fines and legal consequences.',
    },
    {
      name: 'EIN (Tax ID)', price: '$161.00',
      desc: 'An EIN is a 9-digit number issued by the IRS to identify your business. Required to open a bank account, hire employees, file federal tax returns, and conduct business with government agencies.',
    },
    {
      name: 'Certificate of Status', price: '$79.00',
      desc: 'Official proof your business is active and authorized to conduct business in Florida. Often required when applying for loans, renewing licenses, or opening a business bank account.',
    },
  ]
  const colW  = CW / 3
  const gridH = 108
  services.forEach((svc, i) => {
    const cx2 = MX + i * colW
    r(cx2, y - gridH, colW, gridH, WHITE, { color: LIGHT, width: 0.5 })
    // Header row
    r(cx2, y - 20, colW, 20, OFF_WHITE)
    centered(svc.name, cx2, colW, y - 13, bold, 8, NAVY)
    // Price
    const prW = bold.widthOfTextAtSize(svc.price, 14)
    t(svc.price, cx2 + (colW - prW) / 2, y - 40, bold, 14, BLUE)
    // Description
    const descLines = wrapLines(svc.desc, regular, 6.5, colW - 12)
    let dY = y - 56
    descLines.forEach(ln => { t(ln, cx2 + 6, dY, regular, 6.5, GRAY); dY -= 9 })
  })
  y -= gridH + 14

  // ── 8. PAY ONLINE BOX ───────────────────────────────────────────────────────
  // Generate QR code PNG
  const fullPayUrl = data.payUrl.startsWith('http') ? data.payUrl : `https://${data.payUrl}`
  let qrImage = null
  try {
    const qrPng = await QRCode.toBuffer(fullPayUrl, { width: 80, margin: 1 })
    qrImage = await doc.embedPng(qrPng)
  } catch { /* skip QR if fails */ }

  const qrDim  = 72
  const payH   = qrImage ? 160 : 70   // texto 68px + gap 10 + QR 72px + padding 10
  r(MX, y - payH, CW, payH, OFF_WHITE, { color: NAVY, width: 1 })

  // Texto en la parte superior
  centered('PAY ONLINE', MX, CW, y - 17, bold, 12, NAVY)
  centered('Fast processing: 1–3 business days', MX, CW, y - 32, bold, 8, BLUE)
  centered(`VISIT: ${data.payUrl}`, MX, CW, y - 46, regular, 8, BLACK)
  centered('OR', MX, CW, y - 57, bold, 7, GRAY)
  centered('EMAIL: info@opabiz.com', MX, CW, y - 68, regular, 8, BLACK)

  // QR debajo del texto con margen suficiente
  if (qrImage) {
    const qrX = MX + (CW - qrDim) / 2
    const qrY = y - payH + 10          // bottom del QR con padding inferior
    page.drawImage(qrImage, { x: qrX, y: qrY, width: qrDim, height: qrDim })
    // Label debajo del QR
    centered('Scan above to pay', MX, CW, qrY - 10, regular, 7, GRAY)
  }
  y -= payH + 12

  // ── 9. FOOTER ───────────────────────────────────────────────────────────────
  const footerText = 'FLORIDA BUSINESS FORMATION CENTER is a privately owned third-party document preparation service and is not affiliated with or endorsed by any government agency, including the IRS, Department of Labor, or Florida Department of State. This is a solicitation for services, not an official government notice. Fees include administrative and processing costs. All sales are final and non-refundable. Business registration data is sourced from public records.'
  const footerLines = wrapLines(footerText, regular, 6, CW - 12)
  const footerH = footerLines.length * 8 + 10
  const footerY = 36
  r(MX, footerY, CW, footerH, OFF_WHITE)
  let fY = footerY + footerH - 8
  footerLines.forEach(ln => { t(ln, MX + 6, fY, regular, 6, GRAY); fY -= 8 })

  return doc.save()
}
