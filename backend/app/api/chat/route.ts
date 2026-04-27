import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a virtual assistant for MyBusinessFormation, a professional business filing service in the United States specializing in Florida business formations. We are NOT a law firm and do NOT provide legal, tax, or financial advice.

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
    const { messages } = await req.json()

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

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply: text })
  } catch (err) {
    console.error('[chat/route] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
