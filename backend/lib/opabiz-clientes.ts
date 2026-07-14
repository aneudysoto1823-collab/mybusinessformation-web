import type { getSupabaseAdmin } from './supabase'

type Supabase = ReturnType<typeof getSupabaseAdmin>

// ordenes_opabiz.cliente_id apunta a usuarios.id (rol='cliente') — un
// concepto de cliente propio de OpaBiz Connect, separado del `Order` del
// sitio público (ver LOGICA_DE_NEGOCIO/17). Usado tanto por la creación
// manual de órdenes desde una cita como por el intake asistido.
export async function findOrCreateClienteUsuario(
  supabase: Supabase,
  data: { email: string; nombre: string; telefono?: string | null },
): Promise<string> {
  const email = data.email.toLowerCase().trim()

  const { data: existente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existente) return existente.id

  const { data: nuevo, error } = await supabase
    .from('usuarios')
    .insert({
      email,
      nombre: data.nombre,
      telefono: data.telefono || 'N/A',
      rol: 'cliente',
      estado: 'activo',
    })
    .select('id')
    .single()

  if (error || !nuevo) {
    throw new Error(error?.message ?? 'No se pudo crear el usuario cliente')
  }
  return nuevo.id
}
