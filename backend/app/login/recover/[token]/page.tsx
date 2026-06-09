import { redirect } from 'next/navigation'
import { Redis } from '@upstash/redis'
import { createAdminToken } from '@/lib/session'
import { cookies } from 'next/headers'

export default async function RecoverPage({ params }: { params: { token: string } }) {
  const { token } = params

  const url   = process.env.UPSTASH_REDIS_REST_URL
  const tkn   = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !tkn) redirect('/login?error=config')

  const redis = new Redis({ url, token: tkn })
  const valid = await redis.get(`recover:${token}`)

  if (!valid) redirect('/login?error=expired')

  await redis.del(`recover:${token}`)

  const session = await createAdminToken()
  const jar     = await cookies()
  jar.set('admin_session', session, {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 60 * 60 * 8, path: '/',
  })

  redirect('/admin')
}
