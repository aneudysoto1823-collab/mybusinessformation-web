import { getSupabaseAdmin } from './supabase'
import { encrypt, decrypt } from './encryption'
import { createHash } from 'crypto'

const TABLE = 'admin_security_config'
const ROW_ID = 1

export interface TwoFAConfig {
  totp_enabled: boolean
  email_enabled: boolean
}

export async function getTwoFAConfig(): Promise<TwoFAConfig> {
  const { data } = await getSupabaseAdmin()
    .from(TABLE)
    .select('totp_enabled, email_enabled')
    .eq('id', ROW_ID)
    .single()
  return data ?? { totp_enabled: false, email_enabled: false }
}

export async function updateTwoFAConfig(fields: Partial<TwoFAConfig>) {
  await getSupabaseAdmin()
    .from(TABLE)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', ROW_ID)
}

export async function saveTotpSecret(secret: string) {
  await getSupabaseAdmin()
    .from(TABLE)
    .update({ totp_secret: encrypt(secret), updated_at: new Date().toISOString() })
    .eq('id', ROW_ID)
}

export async function getTotpSecret(): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .from(TABLE)
    .select('totp_secret')
    .eq('id', ROW_ID)
    .single()
  if (!data?.totp_secret) return null
  return decrypt(data.totp_secret)
}

export async function saveEmailCode(code: string) {
  const hashed = createHash('sha256').update(code).digest('hex')
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
  await getSupabaseAdmin()
    .from(TABLE)
    .update({ email_pending_code: hashed, email_code_expires_at: expires, updated_at: new Date().toISOString() })
    .eq('id', ROW_ID)
}

export async function verifyEmailCode(code: string): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from(TABLE)
    .select('email_pending_code, email_code_expires_at')
    .eq('id', ROW_ID)
    .single()
  if (!data?.email_pending_code || !data?.email_code_expires_at) return false
  if (new Date(data.email_code_expires_at) < new Date()) return false
  const hashed = createHash('sha256').update(code).digest('hex')
  const valid = hashed === data.email_pending_code
  if (valid) {
    await getSupabaseAdmin()
      .from(TABLE)
      .update({ email_pending_code: null, email_code_expires_at: null })
      .eq('id', ROW_ID)
  }
  return valid
}
