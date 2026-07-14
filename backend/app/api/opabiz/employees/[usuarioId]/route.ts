import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

const VALORES_VALIDOS = ['activo', 'inactivo'] as const

// PATCH /api/opabiz/employees/[usuarioId] — activar/desactivar la cuenta de
// un empleado (usuarios.estado). Un empleado inactivo no puede loguearse
// (POST /api/opabiz/auth/login ya exige estado='activo') aunque tenga
// contraseña creada — no borra nada, solo bloquea el acceso.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ usuarioId: string }> }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { usuarioId } = await params
  const { estado } = await req.json().catch(() => ({}))

  if (!VALORES_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: `estado debe ser uno de: ${VALORES_VALIDOS.join(', ')}` }, { status: 400 })
  }

  const { data: usuario, error } = await getSupabaseAdmin()
    .from('usuarios')
    .update({ estado })
    .eq('id', usuarioId)
    .eq('rol', 'empleado')
    .select('id, estado')
    .maybeSingle()

  if (error || !usuario) {
    return NextResponse.json({ error: error?.message ?? 'Empleado no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ id: usuario.id, estado: usuario.estado })
}
