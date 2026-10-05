import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, pgErrorMessage } from '@/lib/supabase'
import { CampaignsCompaniesInputSchema, parseOr400 } from '@/lib/schemas'
import { verifyAdminToken } from '@/lib/session'
import { MYBIZ_CONTACT_FIELDS, OPABIZ_CONTACT_FIELDS, opabizCutoffIso } from '@/lib/campaign-brand-order'

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
    // brand=opabiz (panel Campaigns & Letters OpaBiz, 2026-10-05): la cola y
    // los filtros salen del seguimiento propio de OpaBiz (carta_opabiz_sent_at
    // + letter_opabiz_sent_at), no del status general ni de letter_sent_at,
    // que son de MyBiz. Así una campaña no saca empresas de la cola de la otra.
    const isOpabiz = searchParams.get('brand') === 'opabiz'
    const emailField  = isOpabiz ? 'carta_opabiz_sent_at'  : null
    const letterField = isOpabiz ? 'letter_opabiz_sent_at' : 'letter_sent_at'

    if (emailField) {
      // Una empresa que ya compró (por cualquiera de las dos marcas) sale
      // también de la cola de OpaBiz.
      if (status === 'new') {
        query = query.is(emailField, null).neq('status', 'purchased')
        // MyBiz va primero: si MyBiz la contactó hace menos de
        // OPABIZ_WAIT_DAYS, todavía no entra a la cola de OpaBiz.
        const cutoff = opabizCutoffIso()
        for (const f of MYBIZ_CONTACT_FIELDS) query = query.or(`${f}.is.null,${f}.lt.${cutoff}`)
      }
      else if (status === 'contacted') query = query.not(emailField, 'is', null)
    } else if (status === 'contacted') query = query.neq('status', 'new')
    else if (status && status !== 'all') {
      query = query.eq('status', status)
      // Si OpaBiz ya la contactó, MyBiz no le vuelve a escribir con precios
      // más altos (ver lib/campaign-brand-order.ts).
      if (status === 'new') for (const f of OPABIZ_CONTACT_FIELDS) query = query.is(f, null)
    }
    if (type   && type   !== 'all') query = query.eq('company_type', type)
    if (dateFrom) query = query.gte('registration_date', dateFrom)
    if (dateTo)   query = query.lte('registration_date', dateTo)
    if (letterStatus === 'sent')     query = query.not(letterField, 'is', null)
    if (letterStatus === 'not_sent') query = query.is(letterField, null)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ companies: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: pgErrorMessage(err) }, { status: 500 })
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
    return NextResponse.json({ error: pgErrorMessage(err) }, { status: 500 })
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

    // email_campaigns/qr_scans/conversions referencian prospective_companies
    // por company_id (FK sin CASCADE) — borrar la empresa directo fallaba en
    // silencio con "[object Object]" (bug real reportado por el founder
    // 2026-09-29) apenas tenía algún historial de envío/scan/conversión, que
    // es el caso normal de cualquier empresa que ya se trabajó desde este
    // panel. "Eliminar para siempre" se toma en serio: se borra también su
    // historial relacionado, no solo la fila de la empresa.
    await supabase.from('email_campaigns').delete().in('company_id', ids)
    await supabase.from('qr_scans').delete().in('company_id', ids)
    await supabase.from('conversions').delete().in('company_id', ids)

    const { error, count } = await supabase
      .from('prospective_companies')
      .delete({ count: 'exact' })
      .in('id', ids)

    if (error) throw error
    return NextResponse.json({ deleted: count ?? ids.length })
  } catch (err) {
    return NextResponse.json({ error: pgErrorMessage(err) }, { status: 500 })
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
    return NextResponse.json({ error: pgErrorMessage(err) }, { status: 500 })
  }
}
