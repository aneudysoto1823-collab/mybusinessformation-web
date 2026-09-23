import { createClient } from '@supabase/supabase-js'

// Lazy init: se crea al primer uso (runtime), no al importar (build time)
export const getSupabaseAdmin = () =>
  createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

// Un PostgrestError de Supabase es un objeto plano sin toString propio —
// String(err) da literalmente "[object Object]" (bug real visto en
// /admin/afiliados 2026-09-23: el admin veía ese texto en vez del motivo
// real). Extrae el mensaje real, o cae a JSON si no hay .message.
export function pgErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return JSON.stringify(err)
}
