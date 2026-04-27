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
- Never invent information about services we don't offer or make up processing times unless you are certain.

NAME AVAILABILITY CHECKS:
- When a client asks if a business name is available in Florida, use the check_name_availability tool immediately.
- Tell the client you are checking "en la base de datos del estado de Florida" (in Spanish) or "in the Florida state database" (in English). NEVER mention "Sunbiz" or any external website.
- After the tool returns results, explain clearly whether the name is available or not.
- If the name is taken, empathize and suggest they try a variation (e.g. adding a word, changing a descriptor).
- If the name is available, encourage them to proceed and offer to help them start the formation process.
- Remind the client that this is a preliminary check — the official reservation happens when we file with the state.`

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_name_availability',
    description: 'Check if a business name is available for registration in Florida. Use this whenever the client asks whether a name is available or wants to verify a business name.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'The business name to check exactly as the client provided it',
        },
      },
      required: ['name'],
    },
  },
]

async function checkNameAvailability(name: string): Promise<string> {
  try {
    const term = name.trim().toUpperCase()
    const encoded = encodeURIComponent(term)
    const url = `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?SearchTerm=${encoded}&SearchType=EntityName`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return JSON.stringify({ status: 'error', message: 'Could not reach state database' })
    }

    const html = await res.text()
    const lower = html.toLowerCase()

    // No results found
    if (lower.includes('no records found') || lower.includes('no entities found') || !lower.includes('<td')) {
      return JSON.stringify({ status: 'available', name })
    }

    // Results exist — check if any are active
    const hasActive = lower.includes('>active<') || lower.includes('>active ')

    // Extract up to 4 found entity names from result links
    const nameMatches = [...html.matchAll(/searchTerm=[^"]*"[^>]*>\s*([A-Z0-9][^<]{2,60})\s*<\/a>/gi)]
    const foundNames = nameMatches.slice(0, 4).map(m => m[1].trim()).filter(Boolean)

    if (!hasActive) {
      return JSON.stringify({
        status: 'possibly_available',
        name,
        note: 'Similar names exist but appear inactive or dissolved. Name may be available.',
        foundNames,
      })
    }

    return JSON.stringify({
      status: 'taken',
      name,
      note: 'One or more active entities found with this or a very similar name.',
      foundNames,
    })
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    return JSON.stringify({
      status: 'error',
      message: isTimeout ? 'State database timeout — please try again in a moment.' : 'Could not connect to state database.',
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, session_id } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const userMessages = messages.filter(
      (m: { role: string; content: string }) =>
        (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )

    // Tool-use agentic loop
    type MsgParam = Anthropic.MessageParam
    let apiMessages: MsgParam[] = userMessages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    let response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: apiMessages,
    })

    // Resolve any tool calls before returning the final text
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      if (!toolUseBlock) break

      let toolResult = ''
      if (toolUseBlock.name === 'check_name_availability') {
        const input = toolUseBlock.input as { name: string }
        toolResult = await checkNameAvailability(input.name)
      }

      apiMessages = [
        ...apiMessages,
        { role: 'assistant', content: response.content },
        {
          role: 'user',
          content: [{ type: 'tool_result' as const, tool_use_id: toolUseBlock.id, content: toolResult }],
        },
      ]

      response = await client.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: apiMessages,
      })
    }

    const reply = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''

    // Save to Supabase (fire and forget)
    if (session_id && typeof session_id === 'string') {
      const sid = session_id.slice(0, 128)
      const lastUserMsg = userMessages[userMessages.length - 1]
      const supabase = getSupabaseAdmin()
      supabase
        .from('chat_messages')
        .insert([
          { session_id: sid, role: 'user', content: lastUserMsg.content },
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
