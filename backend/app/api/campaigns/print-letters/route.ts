// POST /api/campaigns/print-letters — "🖨 Print Selected" del panel de
// Campaigns & Letters. Genera la carta de cada empresa seleccionada (misma
// lógica que /api/campaigns/generate-letter, una por una) y las combina en
// UN solo PDF, para que el admin pueda abrirlo en una pestaña y mandar
// Cmd/Ctrl+P una sola vez en vez de una carta a la vez. Pensado como paso
// intermedio hasta que se conecte una impresora automática.
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'
import { generateNewBusinessLetter, entityLabelForLetter, formatLongDateForLetter, mergeLetterPdfs, type Lang } from '@/lib/new-business-letter'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_PRINT_BATCH = 100

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const ids: unknown = body.ids
  const lang: Lang = body.lang === 'es' ? 'es' : 'en'

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
  }
  if (ids.length > MAX_PRINT_BATCH) {
    return NextResponse.json({ error: `Máximo ${MAX_PRINT_BATCH} cartas por combo — imprimí en tandas más chicas.` }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: companies, error: fetchErr } = await supabase
    .from('prospective_companies')
    .select('id,document_id,company_name,company_type,owner_name,address,city,zip,registration_date')
    .in('id', ids)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  if (!companies || companies.length === 0) {
    return NextResponse.json({ error: 'No companies found for the given IDs' }, { status: 404 })
  }

  const noticeDate = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  try {
    const pdfs = await Promise.all(companies.map(c =>
      generateNewBusinessLetter({
        documentId: c.document_id,
        companyName: c.company_name,
        ownerName: c.owner_name || '',
        address: c.address || '',
        city: c.city || '',
        zip: c.zip || '',
        registrationDate: formatLongDateForLetter(c.registration_date, lang),
        noticeDate,
        entityType: entityLabelForLetter(c.company_type, lang),
        payUrl: `mybusinessformation.com/?id=${c.document_id}`,
        lang,
      })
    ))
    const merged = await mergeLetterPdfs(pdfs)
    return new NextResponse(Buffer.from(merged), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="notices-combo-${companies.length}-${lang}.pdf"`,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[print-letters] PDF generation failed:', msg)
    return NextResponse.json({ error: `PDF generation failed: ${msg}` }, { status: 500 })
  }
}
