// POST /api/campaigns/companies/mark-sent
// Marca en lote las empresas seleccionadas (checkboxes del panel) como
// "carta ya enviada" — setea letter_sent_at. Nunca se hace automático al
// generar/descargar el PDF (eso solo previsualiza/descarga, no confirma que
// la carta salió por correo) — es una acción explícita del staff, a
// propósito, para no dar por enviado algo que todavía no se mandó de verdad.
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === 'string' && id) : []
    if (ids.length === 0) return NextResponse.json({ error: 'ids (array no vacío) es requerido' }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('prospective_companies')
      .update({ letter_sent_at: new Date().toISOString() })
      .in('id', ids)
      .select('id')

    if (error) throw error
    return NextResponse.json({ marked: data?.length ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
