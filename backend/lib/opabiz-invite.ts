import { Redis } from '@upstash/redis'
import { Resend } from 'resend'
import crypto from 'crypto'
import { FROM_OPABIZ_INTERNAL } from './email-constants'

// Invitación por email para que un empleado de OpaBiz Connect (sistema interno)
// cree su propia contraseña — mismo patrón que la recuperación de contraseña del admin
// (/api/auth/recover), pero TTL más generoso (72h en vez de 15min) porque un
// empleado no revisa el mail al instante como sí lo hace un admin recuperando
// acceso urgente.
const TTL_SECONDS = 60 * 60 * 72

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}
function getResend() { return new Resend(process.env.RESEND_API_KEY) }

function redisKey(token: string) {
  return `opabiz-invite:${token}`
}

/** Genera y guarda un token de invitación nuevo para un usuario, TTL 72h. */
export async function createInviteToken(usuarioId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  await getRedis().set(redisKey(token), usuarioId, { ex: TTL_SECONDS })
  return token
}

/** Devuelve el usuarioId si el token es válido, sin consumirlo. */
export async function peekInviteToken(token: string): Promise<string | null> {
  const usuarioId = await getRedis().get<string>(redisKey(token))
  return usuarioId ?? null
}

/** Borra el token — llamar después de setear la contraseña con éxito. */
export async function consumeInviteToken(token: string): Promise<void> {
  await getRedis().del(redisKey(token))
}

export async function sendInviteEmail(opts: { email: string; nombre: string; token: string }): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://opabiz.com'
  const link = `${baseUrl}/opabiz/invite/${opts.token}`

  await getResend().emails.send({
    from: FROM_OPABIZ_INTERNAL,
    to: opts.email,
    subject: 'OpaBiz Connect: Creá tu contraseña de acceso',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#1C2E44;padding:20px;text-align:center;border-radius:8px 8px 0 0">
          <p style="color:#fff;font-size:1.1rem;font-weight:700;margin:0">OpaBiz Connect</p>
        </div>
        <div style="background:#f8fafc;padding:28px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
          <p style="color:#1e293b;font-size:.95rem">Hola ${opts.nombre},</p>
          <p style="color:#1e293b;font-size:.95rem">Se creó tu cuenta de empleado en OpaBiz Connect. Hacé clic en el botón para crear tu contraseña y acceder a tus órdenes asignadas.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${link}" style="background:#2563EB;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:.95rem">
              Crear mi contraseña →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:.78rem">Este link expira en 72 horas. Si no esperabas este email, ignoralo.</p>
        </div>
      </div>
    `,
  })
}
