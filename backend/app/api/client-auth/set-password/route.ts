import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const sessionOrderId = req.cookies.get('client_session')?.value
  if (!sessionOrderId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { password } = await req.json()

  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const hash = bcrypt.hashSync(password, 10)

  const { error } = await getSupabaseAdmin()
    .from('Order')
    .update({ client_password_hash: hash })
    .eq('id', sessionOrderId)

  if (error) {
    return NextResponse.json({ error: 'Could not save password.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
