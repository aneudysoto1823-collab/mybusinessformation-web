import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, pgErrorMessage } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'

export const dynamic = 'force-dynamic'

const IDIOMAS_VALIDOS = ['es', 'en', 'pt', 'fr', 'ht'] as const

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

// PATCH /api/opabiz/me/profile — el empleado edita su propio perfil.
// El email NO se edita acá a propósito: es el usuario de login y el destino
// de los avisos; si se escribe mal, el empleado queda afuera. Lo cambia el admin.
export async function PATCH(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const nombre = str(body.nombre, 120)
  if (!nombre) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

  const telefono = str(body.telefono, 30)
  const zip = str(body.direccionZip, 10)
  if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) {
    return NextResponse.json({ error: 'El código postal debe tener 5 dígitos' }, { status: 400 })
  }
  const idiomas = Array.isArray(body.idiomas)
    ? body.idiomas.filter((i: unknown): i is string => typeof i === 'string' && (IDIOMAS_VALIDOS as readonly string[]).includes(i))
    : []

  const supabase = getSupabaseAdmin()

  const { error: userErr } = await supabase
    .from('usuarios')
    .update({ nombre, telefono: telefono || 'N/A' })
    .eq('id', session.usuarioId)
  if (userErr) return NextResponse.json({ error: pgErrorMessage(userErr) }, { status: 500 })

  const { error: perfilErr } = await supabase
    .from('empleado_perfil')
    .update({
      direccion_calle: str(body.direccionCalle, 200) || null,
      direccion_ciudad: str(body.direccionCiudad, 100) || null,
      direccion_estado: str(body.direccionEstado, 2).toUpperCase() || null,
      direccion_zip: zip || null,
      idiomas,
    })
    .eq('empleado_id', session.empleadosId)
  if (perfilErr) return NextResponse.json({ error: pgErrorMessage(perfilErr) }, { status: 500 })

  return NextResponse.json({ ok: true })
}
