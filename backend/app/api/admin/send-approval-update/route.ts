import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendOrderApprovalUpdate } from '@/lib/notifications'
import { logAdminAction } from '@/lib/audit-log'
import { verifyAdminToken } from '@/lib/session'
import { getOrderItemKeys } from '@/lib/order-items'

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// Reemplaza los viejos endpoints separados de "Approved" (solo status, ya no
// manda email) y "upload-certificate" (A7). Este es el único lugar donde se le
// avisa al cliente que algo de su orden quedó aprobado/entregado — sirve tanto
// para la formación (LLC/Corp) como para cualquier addon (EIN, ITIN, etc.),
// con 0, 1 o varios archivos adjuntos en el mismo email.
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const formData = await request.formData()
    const orderId = formData.get('orderId') as string
    const approvedItemsRaw = formData.get('approvedItems') as string
    const sendWithoutFile = formData.get('sendWithoutFile') === 'true'
    const files = formData.getAll('files') as File[]

    if (!orderId || !approvedItemsRaw) {
      return NextResponse.json({ error: 'Faltan: orderId, approvedItems' }, { status: 400 })
    }

    let approvedItems: string[]
    try {
      approvedItems = JSON.parse(approvedItemsRaw)
      if (!Array.isArray(approvedItems) || approvedItems.length === 0) throw new Error('empty')
    } catch {
      return NextResponse.json({ error: 'approvedItems debe ser un array JSON no vacío' }, { status: 400 })
    }

    const hasFiles = files.length > 0 && files.some(f => f && f.size > 0)
    if (!hasFiles && !sendWithoutFile) {
      return NextResponse.json({ error: 'Falta adjuntar archivo (o confirmar envío sin archivo)' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, firstName, lastName, email, companyName, entityType, package, addons, deliveredItems, deliveredFiles, unsubscribed, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // 1. Subir archivos (si hay) a Supabase Storage — nombres únicos por timestamp
    //    para no pisar entregas anteriores de la misma orden.
    const uploadedFiles: { url: string; filename: string; uploadedAt: string }[] = []
    const attachments: { filename: string; content: Buffer }[] = []
    const now = new Date().toISOString()

    for (const file of files) {
      if (!file || file.size === 0) continue
      const bytes = Buffer.from(await file.arrayBuffer())
      const path = `orders/${orderId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(path, bytes, { contentType: file.type || 'application/pdf', upsert: false })
      if (uploadError) {
        return NextResponse.json({ error: `Error al subir ${file.name}: ${uploadError.message}` }, { status: 500 })
      }
      const { data: pub } = supabase.storage.from('certificates').getPublicUrl(path)
      uploadedFiles.push({ url: pub.publicUrl, filename: file.name, uploadedAt: now })
      attachments.push({ filename: file.name, content: bytes })
    }

    // 2. Calcular qué queda pendiente: universo de ítems = formación + addons
    //    marcados true en la orden, menos lo que ya está entregado acumulado.
    const existingDelivered = (order.deliveredItems ?? {}) as Record<string, boolean>
    const allItemKeys = getOrderItemKeys(order.package, order.addons)
    const newDelivered: Record<string, boolean> = { ...existingDelivered }
    for (const key of approvedItems) newDelivered[key] = true
    const pendingItems = allItemKeys.filter(k => !newDelivered[k])

    // 3. Enviar el email unificado (aprobado ahora + qué sigue pendiente).
    try {
      await sendOrderApprovalUpdate(
        {
          id: order.id,
          firstName: order.firstName,
          lastName: order.lastName,
          email: order.email,
          companyName: order.companyName,
          entityType: order.entityType ?? undefined,
          unsubscribed: order.unsubscribed ?? false,
          lang: 'en',
        },
        { approvedItems, pendingItems, attachments: attachments.length ? attachments : undefined }
      )
    } catch (emailErr: unknown) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr)
      console.error('[send-approval-update] email error:', msg)
      return NextResponse.json({ error: `Archivo(s) subido(s) pero falló el email: ${msg}` }, { status: 500 })
    }

    // 4. Actualizar la orden: estado mínimo 'approved', 'completed' si no queda
    //    nada pendiente. deliveredItems/deliveredFiles se acumulan entre rondas.
    const existingFiles = Array.isArray(order.deliveredFiles) ? order.deliveredFiles : []
    const newStatus = pendingItems.length === 0
      ? 'completed'
      : (order.status === 'filed' ? 'approved' : order.status)

    const { error: updateError } = await supabase
      .from('Order')
      .update({
        deliveredItems: newDelivered,
        deliveredFiles: [...existingFiles, ...uploadedFiles],
        status: newStatus,
        updatedAt: now,
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('[send-approval-update] update error:', updateError.message)
    }

    await logAdminAction({
      action: 'order.approval_update_sent',
      entity: 'Order',
      entityId: orderId,
      after: { approvedItems, pendingItems, files: uploadedFiles.map(f => f.filename), newStatus },
      request,
    })

    return NextResponse.json({ success: true, pendingItems, status: newStatus })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
