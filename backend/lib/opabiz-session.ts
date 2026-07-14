import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

// Sesión del empleado de OPABIZ (sistema interno, cookie separada de
// admin_session/client_session). Mismo SESSION_SECRET que el resto del sitio
// — no hace falta un secret nuevo, el `role` en el payload ya distingue los
// tokens entre sí.
const getSecret = () => {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(process.env.SESSION_SECRET)
}

export interface EmployeeTokenPayload {
  usuarioId: string
  empleadosId: string
}

export async function createEmployeeToken(payload: EmployeeTokenPayload): Promise<string> {
  return new SignJWT({ role: 'empleado', usuarioId: payload.usuarioId, empleadosId: payload.empleadosId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyEmployeeToken(token: string): Promise<EmployeeTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.role !== 'empleado' || typeof payload.usuarioId !== 'string' || typeof payload.empleadosId !== 'string') {
      return null
    }
    return { usuarioId: payload.usuarioId, empleadosId: payload.empleadosId }
  } catch {
    return null
  }
}

// Helper compartido por todas las rutas /api/opabiz/me/* — lee la cookie
// opabiz_session del request y devuelve el payload verificado, o null.
export async function getEmployeeSession(req: NextRequest): Promise<EmployeeTokenPayload | null> {
  const session = req.cookies.get('opabiz_session')
  if (!session?.value) return null
  return verifyEmployeeToken(session.value)
}
