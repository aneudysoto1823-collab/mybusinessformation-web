import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from '@/app/api/chat/route'

// Backend de la extensión de Chrome "Asistente Claudia para WhatsApp" — lee
// (a mano, pegado por el staff) el mensaje del cliente en WhatsApp Web y
// devuelve una sugerencia de respuesta, reusando el mismo conocimiento de
// negocio que Claudia (SYSTEM_PROMPT) pero con otro framing: acá no le habla
// al cliente, le arma un borrador al staff para que lo revise y lo mande.
//
// Auth: un secreto compartido (WHATSAPP_ASSISTANT_KEY) pegado una vez en las
// Opciones de la extensión — no la cookie admin_session, que es SameSite:
// 'strict' y nunca viaja en un fetch iniciado desde una extensión.
const INTERNAL_FRAMING = `You are now drafting a WhatsApp reply for the OpaBiz/Florida Business Formation Center team — NOT talking to the client directly. A team member pasted the client's message below and will review, possibly edit, and send your suggestion themselves.

Rules for this mode:
- Keep it short and conversational, like a real WhatsApp message — a few sentences, never a long email-style paragraph.
- Match the language the client wrote in (English or Spanish).
- If you're not sure about something specific (an exact order status, a price that may have changed, a timing promise), say so plainly in the draft instead of inventing it — the team member will fill in the gap before sending.
- Output ONLY the suggested reply text. No preamble like "Here's a suggestion:", no quotes around it.

Use the business knowledge below as your reference for accurate pricing, services, and policies.
═══════════════════════════════════════
BUSINESS KNOWLEDGE (Claudia's own system prompt, reused as reference)
═══════════════════════════════════════
${SYSTEM_PROMPT}`

export async function POST(request: NextRequest) {
  const key = request.headers.get('x-assistant-key')
  if (!key || key !== process.env.WHATSAPP_ASSISTANT_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const clientMessage = typeof body?.clientMessage === 'string' ? body.clientMessage.trim() : ''
  if (!clientMessage) {
    return NextResponse.json({ error: 'clientMessage es requerido' }, { status: 400 })
  }
  if (clientMessage.length > 4000) {
    return NextResponse.json({ error: 'Mensaje demasiado largo' }, { status: 400 })
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: INTERNAL_FRAMING,
      messages: [{ role: 'user', content: `Client's WhatsApp message:\n\n${clientMessage}` }],
    })
    const reply = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
    return NextResponse.json({ reply })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[extension/suggest-reply] error:', msg)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
