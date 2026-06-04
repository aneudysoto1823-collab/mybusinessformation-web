import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const session = req.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

const CATEGORIES = ['marketing', 'software', 'office', 'state_fees', 'payroll', 'taxes', 'other']

const PROMPT = `Analiza esta factura/recibo y extrae la información en JSON con exactamente estos campos:
{
  "vendor": "nombre del proveedor o tienda",
  "date": "fecha en formato YYYY-MM-DD (si no hay año claro usa el año actual)",
  "amount": número con decimales (solo el total final a pagar, sin símbolo $),
  "description": "descripción breve del gasto en español (máx 60 chars)",
  "category": una de estas opciones exactas: ${CATEGORIES.join(' | ')},
  "is_recurring": true o false (¿es una suscripción mensual o anual?),
  "recurrence": "monthly" | "annual" | "none"
}

Responde SOLO con el JSON, sin texto adicional, sin markdown, sin bloques de código.`

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada en las variables de entorno.' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })

  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no soportado. Usa PDF, JPG, PNG o WEBP.' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const isPdf = file.type === 'application/pdf'

  const contentBlock = isPdf
    ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 } }
    : { type: 'image' as const, source: { type: 'base64' as const, media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp', data: base64 } }

  const client = getAnthropicClient()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [contentBlock, { type: 'text', text: PROMPT }],
      },
    ],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Claude no pudo extraer los datos. Intenta con una imagen más clara.' }, { status: 422 })
  }

  // Sanitize
  const today = new Date().toISOString().split('T')[0]
  return NextResponse.json({
    vendor:       String(parsed.vendor ?? ''),
    date:         String(parsed.date ?? today),
    amount:       Number(parsed.amount ?? 0),
    description:  String(parsed.description ?? ''),
    category:     CATEGORIES.includes(String(parsed.category)) ? String(parsed.category) : 'other',
    is_recurring: Boolean(parsed.is_recurring),
    recurrence:   ['monthly', 'annual', 'none'].includes(String(parsed.recurrence)) ? String(parsed.recurrence) : 'none',
  })
}
