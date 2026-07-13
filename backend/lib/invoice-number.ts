import type { getSupabaseAdmin } from './supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Numeración de facturas (accounting_income.invoice_number, formato
// "INV-{año}-{seq}"). Antes cada route.ts (ingresos, sync-orders) tenía su
// propia copia de generateInvoiceNumber() — una contaba TODAS las filas sin
// filtrar por año (nunca reiniciaba en enero pese al formato) y ninguna era
// atómica (SELECT count + INSERT separados, condición de carrera si dos
// requests corren a la vez) (auditoría 2026-07-12).
//
// Este módulo resuelve ambos problemas: cuenta solo facturas del año actual, y
// reintenta con el siguiente número si el insert choca por una violación de
// unicidad — requiere la constraint UNIQUE de
// supabase_migration_invoice_number_unique.sql (correr en Supabase SQL Editor;
// mientras no esté aplicada, el retry simplemente nunca se activa y el
// comportamiento es igual al de antes, sin regresión).
// ─────────────────────────────────────────────────────────────────────────────

type Supabase = ReturnType<typeof getSupabaseAdmin>

const POSTGRES_UNIQUE_VIOLATION = '23505'

async function countInvoicesForYear(supabase: Supabase, year: number): Promise<number> {
  const { count } = await supabase
    .from('accounting_income')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `INV-${year}-%`)
  return count ?? 0
}

function formatInvoiceNumber(year: number, seq: number): string {
  return `INV-${year}-${seq.toString().padStart(3, '0')}`
}

/**
 * Inserta una fila en accounting_income generando su invoice_number en el
 * momento del insert (no antes), reintentando con el siguiente número si otro
 * request se adelantó y ya tomó ese mismo número.
 */
export async function insertIncomeWithInvoiceNumber(
  supabase: Supabase,
  buildRow: (invoiceNumber: string) => Record<string, unknown>,
  maxAttempts = 5,
): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> {
  const year = new Date().getFullYear()
  let lastError: { message: string; code?: string } | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seq = (await countInvoicesForYear(supabase, year)) + 1 + attempt
    const invoice_number = formatInvoiceNumber(year, seq)
    const { data, error } = await supabase
      .from('accounting_income')
      .insert(buildRow(invoice_number))
      .select()
      .single()

    if (!error) return { data, error: null }
    if (error.code !== POSTGRES_UNIQUE_VIOLATION) return { data: null, error }
    lastError = error
  }

  return { data: null, error: lastError }
}
