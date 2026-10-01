import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeSession } from '@/lib/opabiz-session'
import { SYSTEM_PROMPT } from '@/app/api/chat/route'

export const dynamic = 'force-dynamic'

// Asistente interno para AgentAssistWidget — un agente de OpaBiz Connect
// llenando el formulario en vivo frente a un cliente (intake asistida,
// opabiz.com/?agent=1) le pregunta algo a Claudia sin cortar la llamada.
// Mismo patrón que /api/extension/suggest-reply (reusa SYSTEM_PROMPT con
// otro framing), pero acá la auth es la cookie opabiz_session normal —
// mismo origen que el sitio, no hace falta secreto compartido como en la
// extensión de WhatsApp.
const INTERNAL_FRAMING = `You are now helping an OpaBiz field agent (OpaBiz Connect) who is filling out the formation form live, in front of or on a call with a client right now. You are NOT talking to the client — you're answering the agent's own question so they can keep the conversation going without putting the client on hold.

Rules for this mode:
- Answer directly and concisely — the agent needs this fast while mid-conversation, not a long explanation.
- Answer in the same language the agent asked in (English or Spanish).
- If you're not sure about something specific (an exact order status, a price that may have changed), say so plainly instead of guessing.
- Output ONLY the answer. No preamble like "Sure, here's the answer:".

Use the business knowledge below as your reference for accurate pricing, services, and policies.
═══════════════════════════════════════
BUSINESS KNOWLEDGE (Claudia's own system prompt, reused as reference)
═══════════════════════════════════════
${SYSTEM_PROMPT}`

export async function POST(request: NextRequest) {
  const session = await getEmployeeSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const question = typeof body?.question === 'string' ? body.question.trim() : ''
  if (!question) return NextResponse.json({ error: 'question es requerido' }, { status: 400 })
  if (question.length > 2000) return NextResponse.json({ error: 'Pregunta demasiado larga' }, { status: 400 })

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: INTERNAL_FRAMING,
      messages: [{ role: 'user', content: question }],
    })
    const reply = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
    return NextResponse.json({ reply })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[opabiz/assist] error:', msg)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
