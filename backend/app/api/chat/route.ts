import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Your name is Claudia. You are a virtual assistant for MyBusinessFormation, a professional business filing service in the United States specializing in Florida business formations. We are NOT a law firm and do NOT provide legal, tax, or financial advice.

Our services include:
- LLC Formation (Limited Liability Company)
- Corporation Formation (Inc.)
- Registered Agent Service (required by FL law)
- EIN / Tax ID Number (federal IRS number)
- Operating Agreement
- Annual Report Filing (FL deadline: May 1)
- DBA / Fictitious Name registration
- Articles of Amendment
- ITIN Application
- Virtual Mailing Address
- Banking Resolution
- Certificate of Good Standing
- S-Corp Election (Form 2553)
- Foreign LLC / Corp Registration
- Business Dissolution
- And more

Your role:
- Respond in the same language the client uses (Spanish or English). If the client writes in Spanish, respond entirely in Spanish. If in English, respond in English.
- Be warm, professional, and helpful.
- Explain what each service is and who needs it — in simple, non-technical terms.
- When asked about pricing or packages, do NOT give exact prices. Instead, direct the client to visit our Packages page at /paquetes or our Services page at /servicios to see current pricing.
- NEVER provide legal advice, tax advice, or financial advice. If asked for such advice, politely clarify that we are a document preparation service and recommend consulting a licensed professional.
- If a client seems ready to start, encourage them to visit the site or click the "Get Started" button.
- Keep responses concise and conversational — avoid long paragraphs. Use short bullet points when listing multiple things.
- Never invent information about services we don't offer or make up processing times unless you are certain.`

export async function POST(req: NextRequest) {
  try {
    const { messages, session_id } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const filtered = messages.filter(
      (m: { role: string; content: string }) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    )

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: filtered,
    })

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : ''

    // Save to Supabase (fire and forget — don't block the response)
    if (session_id && typeof session_id === 'string') {
      const sid = session_id.slice(0, 128)
      const userMessage = filtered[filtered.length - 1]
      const supabase = getSupabaseAdmin()
      supabase
        .from('chat_messages')
        .insert([
          { session_id: sid, role: 'user', content: userMessage.content },
          { session_id: sid, role: 'assistant', content: reply },
        ])
        .then(({ error }) => {
          if (error) console.error('[chat/route] supabase insert error:', error.message)
        })
    }

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[chat/route] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
