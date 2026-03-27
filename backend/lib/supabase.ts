import { createClient } from '@supabase/supabase-js'

// Lazy init: se crea al primer uso (runtime), no al importar (build time)
export const getSupabaseAdmin = () =>
  createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
