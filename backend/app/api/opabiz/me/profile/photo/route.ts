import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, pgErrorMessage } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'

export const dynamic = 'force-dynamic'

// Vercel corta los bodies de más de ~4.5 MB; el panel además achica la foto
// a 512px en el navegador antes de subirla, así que esto es solo un tope.
const MAX_BYTES = 4 * 1024 * 1024
const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// POST /api/opabiz/me/profile/photo — multipart `file`. Sube la foto de perfil
// al bucket público `opabiz-avatars` (path con timestamp, mismo criterio que
// opabiz-documentos) y guarda la URL en empleado_perfil.foto_url.
export async function POST(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No se recibió ninguna imagen' }, { status: 400 })
  }
  const ext = TIPOS[file.type]
  if (!ext) return NextResponse.json({ error: 'La foto debe ser JPG, PNG o WEBP' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'La foto no puede pesar más de 4 MB' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const path = `empleados/${session.empleadosId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('opabiz-avatars')
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false })
  if (uploadError) {
    return NextResponse.json({ error: `No se pudo subir la foto: ${uploadError.message}` }, { status: 500 })
  }

  const { data: pub } = supabase.storage.from('opabiz-avatars').getPublicUrl(path)

  const { error } = await supabase
    .from('empleado_perfil')
    .update({ foto_url: pub.publicUrl })
    .eq('empleado_id', session.empleadosId)
  if (error) return NextResponse.json({ error: pgErrorMessage(error) }, { status: 500 })

  return NextResponse.json({ fotoUrl: pub.publicUrl })
}
