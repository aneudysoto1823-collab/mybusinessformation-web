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
export type GuideBrand = 'opabiz' | 'fbfc'
export type Lang = 'en' | 'es'

// Dos variantes de cada PDF: los CTAs/links internos apuntan a opabiz.com o a
// mybusinessformation.com según quién manda el email (ver GUIAS_PDF/generate-pdf.py
// --brand). 'opabiz' es el default histórico — todos los callers previos a esta
// distinción (order confirmation, /guia-gratis) siguen recibiendo exactamente lo
// mismo que antes sin pasar `brand`.
const BASE_URL = process.env.NEXT_PUBLIC_URL ?? 'https://opabiz.com'
// Mismo patrón literal que brandHeaderHtml() en email-constants.ts (fbfc-seal.png)
// — mybusinessformation.com sirve el mismo bundle/public que opabiz.com, así que
// el link solo cambia de dominio para que el email FBFC no muestre un link a
// opabiz.com.
const BASE_URL_FBFC = 'https://mybusinessformation.com'

const GUIDE_FILES: Record<GuideKey, Record<GuideBrand, string>> = {
  guide1: { opabiz: 'guia-1-florida-formacion.pdf', fbfc: 'guia-1-florida-formacion-fbfc.pdf' },
  guide2: { opabiz: 'guia-2-despues-de-formar.pdf', fbfc: 'guia-2-despues-de-formar-fbfc.pdf' },
}

const GUIDE_TITLES: Record<GuideKey, { en: string; es: string }> = {
  guide1: { en: 'Guide I — Form Your LLC or Corporation in Florida', es: 'Guía I — Formar su LLC o Corporación en Florida' },
  guide2: { en: 'Guide II — Keep Your Company in Good Standing in Florida', es: 'Guía II — Mantenga su Empresa al Día en Florida' },
}

// Mismo subtítulo que trae la portada de cada PDF (ver GUIAS_PDF/*.md) — así
// el bloque de regalo del email adelanta qué cubre la guía, no solo el título.
const GUIDE_DESCRIPTIONS: Record<GuideKey, { en: string; es: string }> = {
  guide1: {
    en: 'Filings, licenses, and basic structure for a new business, explained step by step: registered agent, EIN, operating agreement, licenses, DBA, and more.',
    es: 'Trámites, licencias y estructura básica para un nuevo negocio, explicados paso a paso: agente registrado, EIN, Operating Agreement, licencias, DBA y más.',
  },
  guide2: {
    en: 'Compliance, taxes, and first operational steps to keep a company in good standing: Annual Report, Registered Agent, taxes, local licensing, and common mistakes to avoid.',
    es: 'Cumplimiento, impuestos y primeros pasos operativos para mantener una empresa al día: Declaración Anual, Agente Registrado, impuestos, licencia local y errores comunes a evitar.',
  },
}

export function getGuideUrl(guide: GuideKey, brand: GuideBrand = 'opabiz'): string {
  const base = brand === 'fbfc' ? BASE_URL_FBFC : BASE_URL
  return `${base}/guias/${GUIDE_FILES[guide][brand]}`
}

export async function getGuidePdfBuffer(guide: GuideKey, brand: GuideBrand = 'opabiz'): Promise<Buffer> {
  const res = await fetch(getGuideUrl(guide, brand))
  if (!res.ok) throw new Error(`[guides] no se pudo descargar ${guide} (${brand}): ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// El dedup es por marca (ver migración supabase_migration_guide_sends_brand.sql):
// alguien que ya recibió la Guía I con branding OpaBiz igual la recibe con
// branding FBFC si aparece en la campaña de mybusinessformation.com, y viceversa
// — son PDFs distintos (links/logo distintos), no el mismo envío duplicado.
export async function hasReceivedGuide(email: string, guide: GuideKey, brand: GuideBrand = 'opabiz'): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from('guide_sends')
    .select('id')
    .eq('email', normalizeEmail(email))
    .eq('guide', guide)
    .eq('brand', brand)
    .maybeSingle()
  return !!data
}

// Idempotente: si ya existe la fila (email,guide,brand), el conflicto de unicidad
// se ignora sin lanzar error — mismo criterio defensivo que otros inserts
// idempotentes del proyecto (ej. document_id en prospective_companies).
// `name` es opcional (no todos los orígenes lo tienen a mano igual de fácil)
// pero se guarda siempre que esté disponible — lo usa /admin/guias para el
// seguimiento de leads de la landing (ver CLAUDE.md).
export async function recordGuideSent(email: string, guide: GuideKey, source: GuideSource, name?: string | null, brand: GuideBrand = 'opabiz'): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('guide_sends')
    .insert({ email: normalizeEmail(email), guide, source, name: name?.trim() || null, brand })
  if (error && error.code !== '23505') {
    console.error('[guides] error registrando envío:', error)
  }
}

// Bloque HTML reusable para insertar dentro de un email ya existente (campaña
// B1, confirmación de pago) cuando corresponde regalar una o más guías.
export function buildGuideBonusHtml(guides: GuideKey[], lang: Lang, brand: GuideBrand = 'opabiz'): string {
  if (guides.length === 0) return ''
  const isEs = lang === 'es'
  const heading = isEs
    ? (guides.length > 1 ? 'De regalo, sus Guías gratuitas' : 'De regalo, su Guía gratuita')
    : (guides.length > 1 ? 'As a gift, your free Guides' : 'As a gift, your free Guide')
  const intro = isEs
    ? 'Le adjuntamos el PDF directamente a este correo. Si prefiere, también puede descargarlo desde este link:'
    : "We've attached the PDF directly to this email. If you prefer, you can also download it from this link:"
  const items = guides
    .map(g => `
      <div style="margin:0 0 12px 0;">
        <a href="${getGuideUrl(g, brand)}" style="color:#2563EB;text-decoration:none;font-weight:600;">${isEs ? GUIDE_TITLES[g].es : GUIDE_TITLES[g].en} →</a>
        <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.55;">${isEs ? GUIDE_DESCRIPTIONS[g].es : GUIDE_DESCRIPTIONS[g].en}</p>
      </div>`)
    .join('')
  return `
    <div style="margin:20px 0;padding:16px 20px;background:#f0f4f8;border-radius:8px;">
      <p style="margin:0 0 8px 0;font-weight:700;color:#1C2E44;">${heading}</p>
      <p style="margin:0 0 12px 0;color:#475569;font-size:14px;">${intro}</p>
      ${items}
    </div>`
}

export async function getGuideAttachments(guides: GuideKey[], brand: GuideBrand = 'opabiz'): Promise<{ filename: string; content: Buffer }[]> {
  return Promise.all(
    guides.map(async g => ({ filename: GUIDE_FILES[g][brand], content: await getGuidePdfBuffer(g, brand) }))
  )
}
