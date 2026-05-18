import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib'

const MARGIN = 72
const PAGE_W = 612
const PAGE_H = 792
const BLACK = rgb(0.05, 0.05, 0.05)
const DARK = rgb(0.1, 0.1, 0.1)
const GRAY = rgb(0.45, 0.45, 0.45)
const LIGHT_GRAY = rgb(0.78, 0.78, 0.78)

// ── DocBuilder ────────────────────────────────────────────────────────────────
class DocBuilder {
  doc: PDFDocument
  page!: PDFPage
  bold!: PDFFont
  regular!: PDFFont
  y = 720

  private constructor(doc: PDFDocument) {
    this.doc = doc
  }

  static async create(): Promise<DocBuilder> {
    const b = new DocBuilder(await PDFDocument.create())
    b.bold = await b.doc.embedFont(StandardFonts.HelveticaBold)
    b.regular = await b.doc.embedFont(StandardFonts.Helvetica)
    b.page = b.doc.addPage([PAGE_W, PAGE_H])
    b.y = 720
    return b
  }

  newPage(): this {
    this.page = this.doc.addPage([PAGE_W, PAGE_H])
    this.y = 720
    return this
  }

  guard(minY = 90): this {
    if (this.y < minY) this.newPage()
    return this
  }

  title(text: string): this {
    this.page.drawText(text, {
      x: MARGIN, y: this.y, size: 15, font: this.bold, color: DARK,
      maxWidth: PAGE_W - MARGIN * 2,
    })
    this.y -= 28
    return this
  }

  subtitle(text: string): this {
    this.page.drawText(text, {
      x: MARGIN, y: this.y, size: 10, font: this.regular, color: GRAY,
    })
    this.y -= 18
    return this
  }

  hr(): this {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 0.5, color: LIGHT_GRAY,
    })
    this.y -= 12
    return this
  }

  sectionHeader(text: string): this {
    this.guard(110)
    this.y -= 8
    this.page.drawText(text.toUpperCase(), {
      x: MARGIN, y: this.y, size: 8, font: this.bold, color: GRAY,
    })
    this.y -= 16
    this.hr()
    return this
  }

  field(label: string, value: string | null | undefined): this {
    this.guard()
    const safeVal = value || '—'
    this.page.drawText(label + ':', {
      x: MARGIN, y: this.y, size: 9, font: this.bold, color: GRAY,
    })
    const lines = this.wrapText(safeVal, this.regular, 10, PAGE_W - MARGIN - 180 - 36)
    lines.forEach((line, i) => {
      this.page.drawText(line, {
        x: MARGIN + 180, y: this.y - i * 14, size: 10, font: this.regular, color: BLACK,
      })
    })
    this.y -= Math.max(18, lines.length * 14)
    return this
  }

  para(text: string, size = 10, bold = false): this {
    const font = bold ? this.bold : this.regular
    const lines = this.wrapText(text, font, size, PAGE_W - MARGIN * 2)
    for (const line of lines) {
      this.guard()
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font, color: BLACK })
      this.y -= size + 5
    }
    return this
  }

  boldText(text: string, size = 10): this {
    return this.para(text, size, true)
  }

  skip(n = 12): this {
    this.y -= n
    return this
  }

  sigBlock(name: string, signatureText: string | null | undefined): this {
    this.guard(120)
    this.skip(16)
    this.para('Signature: _________________________________', 10)
    this.skip(6)
    if (signatureText) {
      this.para(signatureText, 11, true)
    }
    this.skip(6)
    this.para(`Name: ${name}`, 10)
    this.para(`Date: ${today()}`, 10)
    return this
  }

  private wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
    const words = text.split(' ')
    const result: string[] = []
    let cur = ''
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w
      if (font.widthOfTextAtSize(test, size) > maxW && cur) {
        result.push(cur)
        cur = w
      } else {
        cur = test
      }
    }
    if (cur) result.push(cur)
    return result.length > 0 ? result : ['']
  }

  async toBuffer(): Promise<Buffer> {
    return Buffer.from(await this.doc.save())
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseMembers(raw: unknown): Array<{
  firstName?: string
  lastName?: string
  title?: string
  ownership?: number
  useCompanyAddress?: boolean
  address?: string
}> {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
  return []
}

function today(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function entityLabel(entityType: string): string {
  return (entityType || 'llc').toLowerCase() === 'corp'
    ? 'Corporation'
    : 'Limited Liability Company (LLC)'
}

// ── 1. Operating Agreement ────────────────────────────────────────────────────
export async function generateOperatingAgreement(order: any): Promise<Buffer> {
  const b = await DocBuilder.create()
  const members = parseMembers(order.members)
  const companyName = `${order.companyName}, ${(order.entityType || 'LLC').toUpperCase()}`

  b.title('OPERATING AGREEMENT')
  b.subtitle(`${companyName} — State of Florida`)
  b.skip(4).hr().skip(4)

  b.para(`This Operating Agreement ("Agreement") is entered into as of ${today()}, by and among the member(s) listed herein, for the purpose of forming and operating a limited liability company under the laws of the State of Florida (Chapter 605, Florida Statutes).`)
  b.skip(8)

  b.sectionHeader('Article I — Organization')
  b.field('Company Name', companyName)
  b.field('State of Formation', 'Florida')
  b.field('Principal Office', order.businessAddress)
  b.field('Date of Organization', today())
  b.skip(4)

  b.sectionHeader('Article II — Members and Ownership')
  if (members.length > 0) {
    members.forEach((m, i) => {
      b.guard(120)
      const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
      const addr = m.useCompanyAddress ? order.businessAddress : (m.address || order.businessAddress)
      b.boldText(`Member ${i + 1}: ${name}`)
      b.field('Title', m.title || 'Member')
      b.field('Ownership Interest', m.ownership != null ? `${m.ownership}%` : '—')
      b.field('Address', addr)
      b.skip(8)
    })
  } else {
    b.field('Owner', `${order.firstName} ${order.lastName}`)
    b.field('Ownership Interest', '100%')
    b.field('Address', order.businessAddress)
    b.skip(4)
  }

  b.sectionHeader('Article III — Management')
  b.para('The Company shall be managed by its Member(s). All Members shall have equal rights in the management and conduct of the Company\'s business unless otherwise agreed in writing. Day-to-day operations may be delegated to a designated Manager appointed by the Members.')
  b.skip(8)

  b.sectionHeader('Article IV — Capital Contributions')
  b.para('Each Member\'s initial capital contribution shall be as agreed upon by the Members. No Member shall be required to make additional capital contributions without unanimous written consent. Contributions shall be recorded in the Company\'s books.')
  b.skip(8)

  b.sectionHeader('Article V — Allocations and Distributions')
  b.para('Net profits and losses of the Company shall be allocated among the Members in proportion to their respective ownership interests. Distributions of cash or other Company assets shall be made at such times and in such amounts as unanimously determined by the Members, subject to Florida law.')
  b.skip(8)

  b.sectionHeader('Article VI — Transfer of Membership Interest')
  b.para('No Member may transfer, sell, assign, pledge, or otherwise dispose of any membership interest without the prior written consent of all other Members. Any purported transfer in violation of this Agreement shall be void and of no effect.')
  b.skip(8)

  b.sectionHeader('Article VII — Books, Records, and Accounting')
  b.para('The Company shall maintain complete and accurate books of account and other Company records. Each Member shall have access to inspect and copy such records at any reasonable time. The fiscal year of the Company shall end on December 31 of each year.')
  b.skip(8)

  b.sectionHeader('Article VIII — Dissolution')
  b.para('The Company shall be dissolved upon: (a) unanimous written consent of all Members; (b) the occurrence of any event requiring dissolution under Florida Statutes Chapter 605; or (c) entry of a judicial decree of dissolution. Upon dissolution, Company assets shall be liquidated and distributed in accordance with Florida law.')
  b.skip(8)

  b.sectionHeader('Article IX — Registered Agent')
  b.field('Registered Agent', order.registeredAgent === 'us' ? 'MyBusinessFormation.com (Service Included)' : (order.registeredAgent || '—'))
  b.field('State', 'Florida')
  b.skip(4)

  b.sectionHeader('Article X — Amendments and Miscellaneous')
  b.para('This Agreement may be amended only by unanimous written consent of all Members. This Agreement shall be governed by and construed in accordance with the laws of the State of Florida. This Agreement constitutes the entire agreement of the Members with respect to the subject matter hereof.')
  b.skip(16)

  b.guard(140)
  b.hr()
  b.boldText('ORGANIZER SIGNATURE', 9)
  b.sigBlock(`${order.firstName} ${order.lastName}`, order.orgSignature)

  return b.toBuffer()
}

// ── 2. EIN SS-4 ───────────────────────────────────────────────────────────────
export async function generateEINSS4(order: any): Promise<Buffer> {
  const b = await DocBuilder.create()
  const members = parseMembers(order.members)

  b.title('Form SS-4 — Application for Employer Identification Number (EIN)')
  b.subtitle('Internal Revenue Service — Pre-filled Draft for Review and Submission')
  b.skip(4).hr().skip(4)

  b.sectionHeader('Part I — Identification of Applicant')
  b.field('1. Legal Name of Entity', order.companyName)
  b.field('2. Trade Name (DBA)', '—')
  b.field('3. Executor / Administrator', '—')
  b.field('4a. Mailing Address (Street)', order.businessAddress)
  b.field('4b. City, State, ZIP', '(see full address above)')
  b.field('5a. County and State (principal business)', 'Florida, USA')
  b.field('6. County where entity is located', 'Florida')
  b.field('7a. Responsible Party Name', `${order.firstName} ${order.lastName}`)
  b.field('7b. SSN / ITIN of Responsible Party', '(to be completed by applicant)')
  b.skip(4)

  b.sectionHeader('Part II — Type of Entity')
  b.field('8a. Type of Entity', entityLabel(order.entityType))
  b.field('8b. State / Country of Incorporation', 'Florida, USA')
  b.field('9. Reason for Applying', 'Started a new business')
  b.field('10. Date Business Started or Acquired', today())
  b.field('11. Closing Month of Accounting Year', 'December')
  b.field('12. First Date Wages Paid', '(if applicable)')
  b.field('13. Highest # of Employees (next 12 months)', '—')
  b.field('14. Employment tax liability under $1,000?', 'Yes')
  b.field('15. First Date Excise Tax Liability', '(if applicable)')
  b.skip(4)

  b.sectionHeader('Part III — Members / Officers')
  if (members.length > 0) {
    members.forEach((m, i) => {
      const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
      b.field(`Member ${i + 1}`, name + (m.title ? ` — ${m.title}` : ''))
    })
  } else {
    b.field('Member / Owner', `${order.firstName} ${order.lastName}`)
  }
  b.skip(4)

  b.sectionHeader('Part IV — Declaration and Signature')
  b.para('Under penalties of perjury, I declare that I have examined this application, and to the best of my knowledge and belief, it is true, correct, and complete.')
  b.sigBlock(`${order.firstName} ${order.lastName}`, order.orgSignature)
  b.para('Title: Authorized Member / Organizer', 10)
  b.skip(20)

  b.hr()
  b.para('NOTE: This is a pre-filled draft for your review. Submit to the IRS by fax to (855) 641-6935 or by mail to the IRS. EIN can also be obtained online at irs.gov/ein (available for U.S.-based principals only). Processing time: immediate online, 4 days fax, 4-5 weeks mail.', 9)

  return b.toBuffer()
}

// ── 3. BOI Filing ─────────────────────────────────────────────────────────────
export async function generateBOIFiling(order: any): Promise<Buffer> {
  const b = await DocBuilder.create()
  const members = parseMembers(order.members)
  const owners = members.length > 0
    ? members
    : [{ firstName: order.firstName, lastName: order.lastName, ownership: 100, address: order.businessAddress }]

  b.title('Beneficial Ownership Information (BOI) Report')
  b.subtitle('Financial Crimes Enforcement Network (FinCEN) — Pre-filled Draft')
  b.skip(4).hr().skip(4)

  b.para('Required by the Corporate Transparency Act (CTA), effective January 1, 2024. All reporting companies formed after January 1, 2024 must file within 90 days of formation. Filing is free at boiefiling.fincen.gov.')
  b.skip(12)

  b.sectionHeader('Section A — Reporting Company Information')
  b.field('Legal Name of Company', order.companyName)
  b.field('State of Formation', 'Florida')
  b.field('Principal Business Address', order.businessAddress)
  b.field('Type of Entity', entityLabel(order.entityType))
  b.field('Tax Identification Number (EIN)', '(to be completed — apply with SS-4)')
  b.skip(4)

  b.sectionHeader('Section B — Beneficial Owners')
  b.para('A beneficial owner is any individual who (1) exercises substantial control over the company, or (2) owns or controls at least 25% of ownership interests.')
  b.skip(8)

  owners.forEach((m: any, i: number) => {
    b.guard(180)
    const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
    const addr = m.useCompanyAddress ? order.businessAddress : (m.address || order.businessAddress)
    b.boldText(`Beneficial Owner ${i + 1}`)
    b.field('Full Legal Name', name)
    b.field('Date of Birth', '(Required — complete before filing)')
    b.field('Residential Street Address', addr)
    b.field('Ownership Percentage', m.ownership != null ? `${m.ownership}%` : '—')
    b.field('Government ID Type', '(Passport or State Driver\'s License required)')
    b.field('Government ID Number', '(Required — complete before filing)')
    b.field('Issuing Jurisdiction', '(Required — complete before filing)')
    b.field('Image of ID Document', '(Required — attach copy before filing)')
    b.skip(10)
  })

  b.sectionHeader('Section C — Company Applicant')
  b.para('Required for companies formed after January 1, 2024. The company applicant is the person who directly filed the document creating the company.')
  b.skip(6)
  b.field('Full Legal Name', `${order.firstName} ${order.lastName}`)
  b.field('Address', order.businessAddress)
  b.field('Email', order.email)
  b.skip(10)

  b.hr()
  b.para('IMPORTANT: This document is a pre-filled draft. Before filing, you must add: (1) Date of birth for each beneficial owner, (2) Government-issued ID copy (passport or driver\'s license) for each owner. File for free at boiefiling.fincen.gov — no attorney required. Penalties for non-compliance: up to $591/day.', 9)

  return b.toBuffer()
}

// ── 4. Articles of Organization ───────────────────────────────────────────────
export async function generateArticlesOfOrganization(order: any): Promise<Buffer> {
  const b = await DocBuilder.create()
  const members = parseMembers(order.members)
  const isCorp = (order.entityType || 'llc').toLowerCase() === 'corp'
  const entityName = isCorp ? 'Articles of Incorporation' : 'Articles of Organization'
  const statute = isCorp ? 'Chapter 607' : 'Chapter 605'

  b.title(`${entityName}`)
  b.subtitle(`State of Florida — Pre-filled for Submission to Sunbiz (Divison of Corporations)`)
  b.skip(4).hr().skip(4)

  b.para(`Pursuant to the provisions of ${statute}, Florida Statutes, the undersigned Organizer adopts the following ${entityName}:`)
  b.skip(12)

  b.sectionHeader('Article I — Name of Company')
  b.field('Company Name', order.companyName)
  if (order.companyName2) b.field('Alternate Name 1', order.companyName2)
  if (order.companyName3) b.field('Alternate Name 2', order.companyName3)
  b.skip(4)

  b.sectionHeader('Article II — Principal Office Address')
  b.field('Principal Office Address', order.businessAddress)
  b.field('Mailing Address', order.businessAddress)
  b.skip(4)

  b.sectionHeader('Article III — Registered Agent')
  b.field('Registered Agent Name', order.registeredAgent === 'us'
    ? 'MyBusinessFormation.com (Service Included)'
    : (order.registeredAgent || `${order.firstName} ${order.lastName}`))
  b.field('Registered Agent Street Address', order.businessAddress)
  b.field('State', 'Florida')
  b.skip(4)

  b.sectionHeader('Article IV — Management')
  const mgmtType = members.length > 1 ? 'Member-Managed (Multiple Members)' : 'Member-Managed (Single Member)'
  b.field('Management Type', mgmtType)
  b.skip(6)
  if (members.length > 0) {
    members.forEach((m: any, i: number) => {
      b.guard(90)
      const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
      b.field(`Manager / Member ${i + 1}`, name + (m.title ? ` — ${m.title}` : ''))
      b.field('Address', m.useCompanyAddress ? order.businessAddress : (m.address || order.businessAddress))
    })
  } else {
    b.field('Manager / Member', `${order.firstName} ${order.lastName}`)
    b.field('Address', order.businessAddress)
  }
  b.skip(4)

  b.sectionHeader('Article V — Purpose')
  b.para('The purpose for which this company is organized is to engage in any lawful business or activity for which a limited liability company may be organized under the laws of the State of Florida.')
  b.skip(4)

  b.sectionHeader('Article VI — Effective Date')
  b.field('Date of Filing', today())
  b.field('Effective Date', 'Upon filing with the Florida Division of Corporations')
  b.skip(16)

  b.guard(150)
  b.hr()
  b.boldText('ORGANIZER SIGNATURE', 9)
  b.para('The undersigned, acting as Organizer, hereby adopts these Articles of Organization:')
  b.sigBlock(`${order.firstName} ${order.lastName}`, order.orgSignature)
  b.para('Title: Organizer', 10)
  b.skip(20)

  b.hr()
  b.para('NOTE: Submit to: Florida Division of Corporations — Sunbiz.org. Filing fees: LLC $125, Corporation $78.75. Can be filed online, by mail, or in person at 2415 N. Monroe St., Suite 810, Tallahassee, FL 32303. Make check payable to: "Florida Department of State".', 9)

  return b.toBuffer()
}

// ── 5. DBA / Fictitious Name ──────────────────────────────────────────────────
export async function generateDBA(order: any): Promise<Buffer> {
  const b = await DocBuilder.create()

  b.title('Application for Registration of Fictitious Name (DBA)')
  b.subtitle('State of Florida — Pre-filled for Submission to Sunbiz')
  b.skip(4).hr().skip(4)

  b.para('Pursuant to Section 865.09, Florida Statutes, this application is submitted for the registration of the following fictitious name. A fictitious name registration does not constitute authority to do business in Florida and does not constitute proof of ownership of the name.')
  b.skip(12)

  b.sectionHeader('Section I — Fictitious Name')
  b.field('Fictitious Name (DBA)', order.companyName)
  b.field('Business Activity / Purpose', 'General business services and operations')
  b.field('Business Email', order.email)
  b.field('Business Phone', order.phone || '—')
  b.skip(4)

  b.sectionHeader('Section II — Owner Information')
  b.field('Owner Full Legal Name', `${order.firstName} ${order.lastName}`)
  b.field('Email Address', order.email)
  b.field('Mailing Address', order.businessAddress)
  b.field('Phone Number', order.phone || '—')
  b.skip(4)

  b.sectionHeader('Section III — Type of Business Entity')
  b.field('Entity Type', entityLabel(order.entityType))
  b.field('State of Formation / Incorporation', 'Florida')
  b.field('Florida Document / Registration Number', '(to be completed after LLC/Corp is formed)')
  b.field('County', 'Florida')
  b.skip(4)

  b.sectionHeader('Section IV — Publication')
  b.para('Florida law requires that a notice of intent to use a fictitious name be published in a newspaper of general circulation in the county where the principal place of business is located, once a week for two consecutive weeks, prior to filing the registration.')
  b.skip(6)
  b.field('Newspaper Publication Date 1', '(to be completed)')
  b.field('Newspaper Publication Date 2', '(to be completed)')
  b.skip(4)

  b.sectionHeader('Section V — Signature')
  b.para('I certify that the information indicated on this form is true and accurate and that I am authorized to file this registration.')
  b.sigBlock(`${order.firstName} ${order.lastName}`, order.orgSignature)
  b.skip(20)

  b.hr()
  b.para('NOTE: Submit to: Florida Division of Corporations — Sunbiz.org. Filing fee: $50. The fictitious name registration is valid for 5 years and must be renewed. Annual Report must also be filed each year between January 1 and May 1.', 9)

  return b.toBuffer()
}
