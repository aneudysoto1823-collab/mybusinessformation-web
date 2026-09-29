import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { listOrdersWithSubscriptions } from '@/lib/order-subscriptions'
import { SERVICES_CATALOG, getRecurringServiceFee } from '@/lib/services-pricing'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// MRR = ingreso recurrente de servicio (nunca la tarifa estatal, que es un
// pass-through a Florida, no ganancia) de toda suscripción NO cancelada,
// prorrateado a mensual (anual / 12). Es un run-rate hacia adelante — cuánto
// vale la base de clientes recurrentes activa hoy — no dinero ya cobrado, que
// es lo que ya muestra accounting_income (irregular porque las renovaciones
// caen en el aniversario de cada cliente, no repartidas por mes).
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await listOrdersWithSubscriptions()

  const bySer: Record<string, { count: number; monthly: number }> = {}
  let mrr = 0

  for (const order of orders) {
    const brand = order.sourceBrand === 'fbfc' ? 'fbfc' : 'opabiz'
    for (const entry of order.subscriptions) {
      if (entry.status === 'canceled') continue
      const svc = SERVICES_CATALOG[entry.service]
      if (!svc) continue

      const fee = getRecurringServiceFee(entry.service, brand)
      const monthly = svc.billing === 'monthly' ? fee : fee / 12

      mrr += monthly
      const bucket = bySer[entry.service] ?? { count: 0, monthly: 0 }
      bucket.count += 1
      bucket.monthly += monthly
      bySer[entry.service] = bucket
    }
  }

  const breakdown = Object.entries(bySer)
    .map(([service, v]) => ({
      service,
      label: SERVICES_CATALOG[service]?.name_es ?? service,
      count: v.count,
      monthly: Math.round(v.monthly * 100) / 100,
    }))
    .sort((a, b) => b.monthly - a.monthly)

  return NextResponse.json({ mrr: Math.round(mrr * 100) / 100, breakdown })
}
