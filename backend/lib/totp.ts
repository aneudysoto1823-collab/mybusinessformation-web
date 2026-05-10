import { TOTP, Secret } from 'otpauth'

export function generateTotpSecret(): string {
  return new Secret().base32
}

export function generateTotpUri(secret: string, accountName: string): string {
  const totp = new TOTP({
    issuer: 'MyBusinessFormation Admin',
    label: accountName,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  })
  return totp.toString()
}

export function verifyTotpCode(token: string, secret: string): boolean {
  try {
    const totp = new TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secret),
    })
    return totp.validate({ token, window: 1 }) !== null
  } catch {
    return false
  }
}
