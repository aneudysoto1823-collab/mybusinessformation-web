import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `expenses/${id}/receipt.${ext}`
  const bytes = await file.arrayBuffer()
  const supabase = getSupabaseAdmin()

  const { error: uploadError } = await supabase.storage
    .from('expense-receipts')
    .upload(path, Buffer.from(bytes), {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('expense-receipts').getPublicUrl(path)

  const { error: dbError } = await supabase
    .from('accounting_expenses')
    .update({ receipt_file_url: publicUrl })
    .eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ url: publicUrl })
}
