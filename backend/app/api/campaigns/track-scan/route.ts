import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// mybusinessformation.com (no opabiz.com) — separación de dominios 2026-08-13,
// la landing de new-business vive ahí ahora.
const BASE_URL = 'https://mybusinessformation.com'

export async function GET(req: NextRequest) {
  const doc = req.nextUrl.searchParams.get('doc')
  const cid = req.nextUrl.searchParams.get('cid')
  // dest=vip → campaña del Paquete VIP (Agente Registrado + Declaración
  // Anual, ver app/api/campaigns/send/route.ts buildVipEmail) — cualquier
  // otro valor (u omitido) sigue yendo al home, como siempre.
  const dest = req.nextUrl.searchParams.get('dest')
  const destPath = dest === 'vip' ? '/vip' : '/'

  // Always redirect — even if tracking fails, the client gets to the landing page
  const landingUrl = doc
    ? `${BASE_URL}${destPath}?id=${encodeURIComponent(doc)}`
    : `${BASE_URL}${destPath === '/' ? '' : destPath}`

  if (!doc || !cid) {
    return NextResponse.redirect(landingUrl)
  }

  try {
    const supabase = getSupabaseAdmin()

    // Get real IP (works behind Vercel/Cloudflare)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      null

    // Insert QR scan record
    await supabase.from('qr_scans').insert({
      company_id: cid,
      ip_address: ip,
      converted:  false,
    })

    // Update company status to qr_scanned — only if not already purchased
    await supabase
      .from('prospective_companies')
      .update({ status: 'qr_scanned' })
      .eq('id', cid)
      .not('status', 'eq', 'purchased')
  } catch (err) {
    // Non-blocking — log but don't block the redirect
    console.error('[track-scan]', err instanceof Error ? err.message : String(err))
  }

  return NextResponse.redirect(landingUrl)
}
