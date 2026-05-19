import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendCertificateDelivery } from '@/lib/notifications'
import { logAdminAction } from '@/lib/audit-log'
import { verifyAdminToken } from '@/lib/session'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('orderId') as string

    if (!file || !orderId) {
      return NextResponse.json({ error: 'Faltan: file, orderId' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // 1. Subir PDF a Supabase Storage
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(`orders/${orderId}/certificate.pdf`, Buffer.from(bytes), {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Error al subir: ${uploadError.message}` }, { status: 500 })
    }

    // 2. Leer datos de la orden para el email
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, firstName, email, companyName, unsubscribed')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // 3. Enviar email de Certificate al cliente
    try {
      await sendCertificateDelivery({
        id: order.id,
        firstName: order.firstName,
        email: order.email,
        companyName: order.companyName,
        unsubscribed: order.unsubscribed ?? false,
      })
    } catch (emailErr: unknown) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr)
      console.error('[upload-certificate] email error:', msg)
      return NextResponse.json({ error: 'PDF subido pero falló el email' }, { status: 500 })
    }

    // 4. Marcar orden como completed
    const { error: updateError } = await supabase
      .from('Order')
      .update({ status: 'completed', updatedAt: new Date().toISOString() })
      .eq('id', orderId)

    if (updateError) {
      console.error('[upload-certificate] update error:', updateError.message)
      // PDF subido y email enviado OK; el cambio de status falló pero no es fatal.
      // El admin puede forzar el status manualmente desde el panel.
    }

    // Audit log — fail-quiet.
    await logAdminAction({
      action: 'order.certificate_uploaded',
      entity: 'Order',
      entityId: orderId,
      after: { status: 'completed', certificate_path: `orders/${orderId}/certificate.pdf` },
      request,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
