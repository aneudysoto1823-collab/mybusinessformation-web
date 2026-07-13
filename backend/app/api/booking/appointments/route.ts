import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function isAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return false
  return verifyAdminToken(token)
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await getSupabaseAdmin()
    .from('appointments')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  return NextResponse.json(data ?? [])
}
