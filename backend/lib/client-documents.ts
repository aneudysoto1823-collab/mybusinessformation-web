// ─────────────────────────────────────────────────────────────────────────────
// Registro permanente y consultable de cada archivo real entregado a un
// cliente (Item 5 de la auditoría FTC/UPL, 2026-09-15) — ver
// supabase_migration_client_documents.sql para el alcance exacto (solo
// entregas reales vía /api/admin/send-approval-update, nunca los documentos
// auto-generados "por si acaso" del panel admin).
//
// Complementa, no reemplaza, a Order.deliveredItems/deliveredFiles (JSONB en
// la misma fila de Order) — esos siguen siendo la fuente de verdad para "¿ya
// se entregó este ítem?" (gating del checklist admin); esta tabla es el
// historial real de archivos, consultable a través de cualquier orden.
// ─────────────────────────────────────────────────────────────────────────────

import { getSupabaseAdmin } from './supabase'

export interface ClientDocumentRow {
  id: string
  orderId: string
  filename: string
  url: string
  itemKeys: string[]
  uploadedAt: string
}

// Una fila por archivo subido en la misma ronda de entrega — `itemKeys` es el
// conjunto completo de ítems aprobados en esa ronda (el admin no distingue
// qué archivo cubre qué ítem cuando sube varios a la vez, ver
// send-approval-update/route.ts). Fire-and-forget en el caller: un fallo acá
// nunca debe bloquear la entrega real (email + Order.deliveredFiles), que ya
// se hizo con éxito para cuando esto se llama.
export async function recordClientDocuments(
  orderId: string,
  files: { filename: string; url: string }[],
  itemKeys: string[]
): Promise<void> {
  if (files.length === 0) return
  const supabase = getSupabaseAdmin()
  const rows = files.map(f => ({
    order_id: orderId,
    filename: f.filename,
    url: f.url,
    item_keys: itemKeys,
  }))
  const { error } = await supabase.from('client_documents').insert(rows)
  if (error) throw error
}

export async function getClientDocumentsForOrder(orderId: string): Promise<ClientDocumentRow[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('client_documents')
    .select('id, order_id, filename, url, item_keys, uploaded_at')
    .eq('order_id', orderId)
    .order('uploaded_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id,
    orderId: r.order_id,
    filename: r.filename,
    url: r.url,
    itemKeys: Array.isArray(r.item_keys) ? r.item_keys : [],
    uploadedAt: r.uploaded_at,
  }))
}
