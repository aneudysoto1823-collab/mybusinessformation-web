import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'

export const dynamic = 'force-dynamic'

// POST /api/opabiz/me/orders/[id]/documents — el empleado sube uno o más
// documentos de la orden (multipart, mismo patrón que
// api/admin/send-approval-update). Bucket público `opabiz-documentos`, path
// con timestamp (no adivinable) — mismo criterio que `certificates`/
// `expense-receipts` en el resto del proyecto.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: orden } = await supabase
    .from('ordenes_opabiz')
    .select('id, empleado_id')
    .eq('id', id)
    .maybeSingle()

  if (!orden || orden.empleado_id !== session.empleadosId) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  const formData = await req.formData()
  const tipoDocumento = (formData.get('tipoDocumento') as string) || 'general'
  const files = formData.getAll('files') as File[]
  const validFiles = files.filter(f => f && f.size > 0)

  if (validFiles.length === 0) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  }

  const inserted: { id: string; url_archivo: string }[] = []

  for (const file of validFiles) {
    const bytes = Buffer.from(await file.arrayBuffer())
    const path = `orders/${id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('opabiz-documentos')
      .upload(path, bytes, { contentType: file.type || 'application/octet-stream', upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: `Error al subir ${file.name}: ${uploadError.message}` }, { status: 500 })
    }

    const { data: pub } = supabase.storage.from('opabiz-documentos').getPublicUrl(path)

    const { data: row, error: insertError } = await supabase
      .from('documentos')
      .insert({ order_id: id, tipo_documento: tipoDocumento, url_archivo: pub.publicUrl })
      .select('id, url_archivo')
      .single()

    if (insertError || !row) {
      return NextResponse.json({ error: insertError?.message ?? 'No se pudo registrar el documento' }, { status: 500 })
    }
    inserted.push(row)
  }

  return NextResponse.json({ documentos: inserted }, { status: 201 })
}
