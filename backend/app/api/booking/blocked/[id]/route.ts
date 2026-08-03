import { NextRequest, NextResponse } from 'next/server'
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await getSupabaseAdmin().from('blocked_slots').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Pausa/reactiva un bloqueo sin borrarlo — pensado para los bloqueos por día
// de la semana ("Fijo" hasta que se le haga uncheck), pero funciona igual
// para cualquier fila.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { active } = await req.json()
  if (typeof active !== 'boolean') return NextResponse.json({ error: 'active required' }, { status: 400 })
  const { error } = await getSupabaseAdmin().from('blocked_slots').update({ active }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
