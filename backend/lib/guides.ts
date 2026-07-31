// ─────────────────────────────────────────────────────────────────────────────
// Envío de las Guías PDF de marketing (I: formación, II: post-formación) por
// email, con tracking por email para no reenviar la Guía I dos veces a la
// misma persona sin importar el canal (campaña B1, landing /guia-gratis, o
// confirmación de pago de formación). Único lugar que toca la tabla
// `guide_sends` — ver migración en CLAUDE.md.
// ─────────────────────────────────────────────────────────────────────────────

import { getSupabaseAdmin } from './supabase'

export type GuideKey = 'guide1' | 'guide2'
export type GuideSource = 'campaign' | 'landing' | 'order'
export type Lang = 'en' | 'es'

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? 'https://opabiz.com'

const GUIDE_FILES: Record<GuideKey, string> = {
  guide1: 'guia-1-florida-formacion.pdf',
  guide2: 'guia-2-despues-de-formar.pdf',
}

const GUIDE_TITLES: Record<GuideKey, { en: string; es: string }> = {
  guide1: { en: 'Guide I — Form Your LLC or Corporation in Florida', es: 'Guía I — Formar su LLC o Corporación en Florida' },
  guide2: { en: 'Guide II — Keep Your Company in Good Standing in Florida', es: 'Guía II — Mantenga su Empresa al Día en Florida' },
}

export function getGuideUrl(guide: GuideKey): string {
  return `${BASE_URL}/guias/${GUIDE_FILES[guide]}`
}

export async function getGuidePdfBuffer(guide: GuideKey): Promise<Buffer> {
  const res = await fetch(getGuideUrl(guide))
  if (!res.ok) throw new Error(`[guides] no se pudo descargar ${guide}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function hasReceivedGuide(email: string, guide: GuideKey): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from('guide_sends')
    .select('id')
    .eq('email', normalizeEmail(email))
    .eq('guide', guide)
    .maybeSingle()
  return !!data
}

// Idempotente: si ya existe la fila (email,guide), el conflicto de unicidad
// se ignora sin lanzar error — mismo criterio defensivo que otros inserts
// idempotentes del proyecto (ej. document_id en prospective_companies).
// `name` es opcional (no todos los orígenes lo tienen a mano igual de fácil)
// pero se guarda siempre que esté disponible — lo usa /admin/guias para el
// seguimiento de leads de la landing (ver CLAUDE.md).
export async function recordGuideSent(email: string, guide: GuideKey, source: GuideSource, name?: string | null): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('guide_sends')
    .insert({ email: normalizeEmail(email), guide, source, name: name?.trim() || null })
  if (error && error.code !== '23505') {
    console.error('[guides] error registrando envío:', error)
  }
}

// Bloque HTML reusable para insertar dentro de un email ya existente (campaña
// B1, confirmación de pago) cuando corresponde regalar una o más guías.
export function buildGuideBonusHtml(guides: GuideKey[], lang: Lang): string {
  if (guides.length === 0) return ''
  const isEs = lang === 'es'
  const heading = isEs
    ? (guides.length > 1 ? '🎁 De regalo, sus Guías gratuitas' : '🎁 De regalo, su Guía gratuita')
    : (guides.length > 1 ? '🎁 As a gift, your free Guides' : '🎁 As a gift, your free Guide')
  const intro = isEs
    ? 'Le adjuntamos el PDF directamente a este correo. Si prefiere, también puede descargarlo desde este link:'
    : "We've attached the PDF directly to this email. If you prefer, you can also download it from this link:"
  const links = guides
    .map(g => `<a href="${getGuideUrl(g)}" style="color:#2563EB;text-decoration:none;font-weight:600;">${isEs ? GUIDE_TITLES[g].es : GUIDE_TITLES[g].en} →</a>`)
    .join('<br/>')
  return `
    <div style="margin:20px 0;padding:16px 20px;background:#f0f4f8;border-radius:8px;">
      <p style="margin:0 0 8px 0;font-weight:700;color:#1C2E44;">${heading}</p>
      <p style="margin:0 0 10px 0;color:#475569;font-size:14px;">${intro}</p>
      <p style="margin:0;font-size:14px;">${links}</p>
    </div>`
}

export async function getGuideAttachments(guides: GuideKey[]): Promise<{ filename: string; content: Buffer }[]> {
  return Promise.all(
    guides.map(async g => ({ filename: GUIDE_FILES[g], content: await getGuidePdfBuffer(g) }))
  )
}
