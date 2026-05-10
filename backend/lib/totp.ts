import { authenticator } from 'otplib'

authenticator.options = { window: 1 } // acepta ±30s de desfase de reloj

export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

export function generateTotpUri(secret: string, accountName: string): string {
  return authenticator.keyuri(accountName, 'MyBusinessFormation Admin', secret)
}

export function verifyTotpCode(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch {
    return false
  }
}
