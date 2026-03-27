import { createClient } from '@supabase/supabase-js'

// Cliente admin con service_role — bypasa RLS, solo usar en server-side
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
