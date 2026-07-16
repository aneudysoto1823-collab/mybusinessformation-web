import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// PATCH /api/opabiz/orders/[id] — edición rápida de una orden de OPABIZ desde
// el panel admin, hoy solo soporta `notas` (nota interna para el empleado,
// visible también en su propio dashboard). Separado del endpoint /assign a
// propósito: reasignar y anotar son dos acciones independientes, no hace
// falta elegir un empleado solo para agregar una nota.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: ordenId } = await params
  const { notas } = await req.json().catch(() => ({}))

  if (typeof notas !== 'string') {
    return NextResponse.json({ error: 'notas requerido' }, { status: 400 })
  }

  const { data: orden, error } = await getSupabaseAdmin()
    .from('ordenes_opabiz')
    .update({ notas: notas || null })
    .eq('id', ordenId)
    .select()
    .single()

  if (error || !orden) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  return NextResponse.json({ orden })
}
