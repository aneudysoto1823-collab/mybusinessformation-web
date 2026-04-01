import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { backendFetch } from '@/lib/backend'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('orderId') as string

    if (!file || !orderId) {
      return NextResponse.json({ error: 'Faltan: file, orderId' }, { status: 400 })
    }

    // 1. Subir PDF a Supabase Storage
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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

    // 2. Obtener datos de la orden para el email
    const orderRes = await backendFetch(`/api/orders/${orderId}`)
    if (!orderRes.ok) {
      return NextResponse.json({ error: 'Orden no encontrada en el backend' }, { status: 404 })
    }
    const orderData = await orderRes.json()
    const order = orderData.order ?? orderData.data ?? orderData

    // 3. Enviar email de certificate al cliente
    const emailRes = await backendFetch('/api/notifications/certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: order.id,
        firstName: order.firstName,
        email: order.email,
        companyName: order.companyName,
      }),
    })

    if (!emailRes.ok) {
      return NextResponse.json({ error: 'PDF subido pero falló el email' }, { status: 500 })
    }

    // 4. Actualizar orden a completed
    await backendFetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
