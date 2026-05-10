import { SignJWT, jwtVerify } from 'jose'

const getSecret = () => {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(process.env.SESSION_SECRET)
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload.role === 'admin'
  } catch {
    return false
  }
}

// Token temporal de 2FA — válido 5 min, solo para /login/verify
export async function createPendingToken(methods: string[]): Promise<string> {
  return new SignJWT({ role: 'admin_pending', methods })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(getSecret())
}

export async function verifyPendingToken(token: string): Promise<{ valid: boolean; methods: string[] }> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.role !== 'admin_pending') return { valid: false, methods: [] }
    return { valid: true, methods: (payload.methods as string[]) ?? [] }
  } catch {
    return { valid: false, methods: [] }
  }
}
