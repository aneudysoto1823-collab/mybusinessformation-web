import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { CampaignsCompaniesInputSchema, parseOr400 } from '@/lib/schemas'
import { verifyAdminToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// GET — list companies with optional filters
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = req.nextUrl
    const status      = searchParams.get('status')
    const type        = searchParams.get('type')
    const dateFrom    = searchParams.get('date_from')
    const dateTo      = searchParams.get('date_to')
    // letter_status separa las que YA se marcaron como enviadas (letter_sent_at
    // seteado a mano desde el panel) de las nuevas — antes se mezclaban todas
    // para siempre en la misma lista.
    const letterStatus = searchParams.get('letter_status')

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('prospective_companies')
      .select('*')
      .order('created_at', { ascending: false })

    // status='contacted' es un valor especial (no un status real de la tabla):
    // "ya se le mandó al menos un email" = cualquier status que no sea 'new'
    // (email_sent/qr_scanned/purchased). Unifica el viejo filtro "All Status"
    // (4 valores puntuales) con letter_status en un solo selector del panel
    // (feedback founder 2026-09-12: quería Nuevas / Email enviado / Cartas
    // enviadas / Todas en un solo lugar, en vez de dos dropdowns separados).
    if (status === 'contacted') query = query.neq('status', 'new')
    else if (status && status !== 'all') query = query.eq('status', status)
    if (type   && type   !== 'all') query = query.eq('company_type', type)
    if (dateFrom) query = query.gte('registration_date', dateFrom)
    if (dateTo)   query = query.lte('registration_date', dateTo)
    if (letterStatus === 'sent')     query = query.not('letter_sent_at', 'is', null)
    if (letterStatus === 'not_sent') query = query.is('letter_sent_at', null)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ companies: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST — add company manually
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const raw = await req.json()
    const parsed = parseOr400(CampaignsCompaniesInputSchema, raw)
    if (!parsed.ok) {
      console.error('[/api/campaigns/companies] validation error:', parsed.details)
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { document_id, company_name, owner_name, address, city, zip, email, company_type, registration_date } = parsed.data

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('prospective_companies')
      .insert({
        document_id:       document_id.trim().toUpperCase(),
        company_name:      company_name.trim().toUpperCase(),
        owner_name:        owner_name   || null,
        address:           address      || null,
        city:              city         || null,
        zip:               zip          || null,
        email:             email        || null,
        company_type:      company_type || 'LLC',
        registration_date: registration_date || null,
        status:            'new',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A company with this Document ID already exists.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ company: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE — bulk delete companies (checkboxes en el panel, "🗑 Delete selected")
export async function DELETE(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === 'string' && id) : []
    if (ids.length === 0) return NextResponse.json({ error: 'ids (array no vacío) es requerido' }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { error, count } = await supabase
      .from('prospective_companies')
      .delete({ count: 'exact' })
      .in('id', ids)

    if (error) throw error
    return NextResponse.json({ deleted: count ?? ids.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PATCH — update a company's note
export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id, note } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('prospective_companies')
      .update({ note: (note ?? '').trim() || null })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ company: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
