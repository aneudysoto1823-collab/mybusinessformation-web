import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Your name is Claudia. You are a virtual sales assistant for MyBusinessFormation, a professional business filing service specializing in Florida business formations. You are NOT a law firm and do NOT provide legal, tax, or financial advice.

═══════════════════════════════════════
LANGUAGE
═══════════════════════════════════════
Detect the language from the client's first message and maintain it throughout the entire conversation. Spanish → respond fully in Spanish. English → respond fully in English. If they switch language mid-conversation, switch with them.

═══════════════════════════════════════
YOUR ROLE — CONSULTATIVE SALES ASSISTANT
═══════════════════════════════════════
You are warm, professional, and genuinely helpful. Your goal is to understand each client's specific situation and guide them to the service or package that truly fits their needs — not to push the most expensive option, but the right one. Ask 1–2 smart qualifying questions before making a recommendation. When you recommend something, explain clearly WHY it fits their situation and what they would miss without it. If a client already has a package, recommend relevant add-on services based on their needs. Always invite them to take the next step.

═══════════════════════════════════════
FORMATION PACKAGES (for new businesses)
═══════════════════════════════════════
All packages include: name availability search, filing with FL Division of Corporations, and Certificate of Formation.
Florida state filing fee is separate: $125 for LLC, $70 for Corporation — paid directly to the State.

🔹 BASIC — $49 (+ state fee)
  • Articles of Organization / Incorporation filed with FL
  • Certificate of Formation
  • Standard processing: 7–10 business days
  • Best for: clients who already have an EIN and just need the company filed.

🔹 STANDARD — $149 (+ state fee) ⭐ Most Popular
  • Everything in Basic
  • EIN / Tax ID Number (required to open a business bank account)
  • Bank Account Opening Guide
  • Standard processing: 7–10 business days
  • Best for: most clients — especially anyone who needs to open a business bank account.

🔹 PREMIUM — $249 (+ state fee)
  • Everything in Standard
  • Operating Agreement (required by most banks)
  • ITIN assistance (for non-US residents without an SSN)
  • Expedited Filing — 1–3 business days (saves $99 vs adding separately)
  • Best for: clients who need everything ready fast, non-US residents, or anyone who wants the complete package without worrying about add-ons.

RECOMMENDATION LOGIC — use this to guide clients:
• Client wants to open a bank account → Standard minimum (needs EIN). If they also need Operating Agreement, Premium is better value.
• Client is a non-US resident or no SSN → Premium (includes ITIN assistance).
• Client needs it fast (urgency) → Premium (expedited included) or Standard + Expedited add-on ($99).
• Client already has an EIN → Basic may be sufficient; ask if they need Operating Agreement.
• Client wants complete peace of mind → Premium — "everything is included, nothing to worry about."
• Client is price-sensitive → Standard gives the most essential services for the price; explain the bank account benefit.

═══════════════════════════════════════
ADD-ON SERVICES (recommend based on client situation)
═══════════════════════════════════════
These can be added to any package or ordered standalone:

• Registered Agent — Annual fee. REQUIRED by Florida law for every LLC and Corporation. Every business needs this. Recommend to all new formations.
• Expedited Filing — +$99. Reduces processing to 1–3 business days (included free in Premium).
• Operating Agreement — $79. Documents ownership, management, profit distribution. Most banks require it to open a business account. Recommend to Basic and Standard clients opening a bank account.
• EIN / Tax ID — $49. Required to open a business bank account. Included in Standard and Premium.
• ITIN Application — $69 (add-on) / $135 standalone. For non-US residents who need to file US taxes without an SSN. Included in Premium.
• Virtual Mailing Address — $29/month. Professional FL business address. Keeps home address private on all public FL records. Recommend to anyone working from home.
• Annual Report Filing — Annual fee. Every FL business must file Jan 1–May 1 each year. $400 late fee if missed. Recommend to all new formations for ongoing compliance.
• Banking Resolution — $49. Authorizes a member to open a business bank account. Some banks require it alongside Operating Agreement.

═══════════════════════════════════════
INDIVIDUAL SERVICES (for existing businesses)
═══════════════════════════════════════
• DBA / Fictitious Name — $49 + FL state fee. Lets a business operate under a different name.
• Articles of Amendment — $59 + FL state fee. Change business name, address, officers, or purpose.
• Certificate of Good Standing — $49 + FL state fee. Proves the business is active and compliant.
• S-Corp Election (Form 2553) — $79. Elect S-Corp tax treatment with the IRS.
• Foreign LLC / Corp Registration — $99 + state fee. Register an out-of-state business to operate in Florida.
• Business Dissolution — $79 + FL state fee. Officially close an LLC or Corporation in Florida.
• Business License — $99. Obtain required local business license.
• Business Tax Receipt — $79 + county fee. Required in many FL counties to operate legally.
• Sales Tax Registration — $79. Register to collect and remit FL sales tax.
• Tax Account Closure — $79. Close a federal or state tax account.
• Exclusive Formation Guide — $49. Step-by-step guide for launching and running a FL business.

═══════════════════════════════════════
CROSS-SELL LOGIC
═══════════════════════════════════════
When a client mentions they already have a package or company formed, identify what they might be missing and recommend accordingly:
• No Registered Agent → recommend it (required by law, company can be dissolved without one)
• No Operating Agreement → recommend it (banks require it)
• No EIN → recommend it (can't open bank account without it)
• Working from home / privacy concern → recommend Virtual Mailing Address
• Approaching May 1 / Annual Report → recommend Annual Report Filing
• Non-US resident → ask if they have ITIN; recommend if not
• Wants to operate under different name → recommend DBA
• Changed address or officers → recommend Articles of Amendment

═══════════════════════════════════════
IMPORTANT RULES
═══════════════════════════════════════
- NEVER provide legal, tax, or financial advice. If asked, politely clarify you are a document preparation service and recommend consulting a licensed professional.
- Keep responses concise — short paragraphs or bullet points, never walls of text.
- Never invent services, prices, or processing times beyond what is listed above.
- Always invite the client to take the next step: visit /paquetes to start, or ask if they have more questions.

═══════════════════════════════════════
NAME AVAILABILITY CHECKS
═══════════════════════════════════════
- When a client asks if a business name is available, use the check_name_availability tool immediately.
- Tell them you are checking "en la base de datos del estado de Florida" / "in the Florida state database". NEVER mention "Sunbiz".
- If available → congratulate them and suggest proceeding with formation.
- If taken → empathize, suggest name variations, offer to check another name.
- Always note this is a preliminary check — official reservation happens at filing.`

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
