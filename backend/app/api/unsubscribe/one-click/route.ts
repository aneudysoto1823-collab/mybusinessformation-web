// POST /api/unsubscribe/one-click?email=... — soporte de "One-Click
// Unsubscribe" (RFC 8058), requerido por Gmail/Yahoo desde 2024 para
// remitentes de volumen (auditoría 2026-09-13/14). Distinto de
// POST /api/unsubscribe (que espera un body JSON {email} y lo dispara un
// humano desde la página /unsubscribe): a este endpoint lo llama el propio
// proveedor de correo, automáticamente, cuando el destinatario aprieta el
// botón nativo de "Cancelar suscripción" en su bandeja — sin abrir el email
// ni ver ninguna página. El body de esa llamada es
// `List-Unsubscribe=One-Click` (form-encoded, no JSON), así que esta ruta
// nunca intenta parsearlo — toma el email del query string, que es el mismo
// que ya viaja en el header List-Unsubscribe que armamos al enviar
// (buildListUnsubscribeHeaders en lib/email-constants.ts).
import { NextRequest, NextResponse } from 'next/server'
import { markUnsubscribed } from '@/lib/email-suppression'

export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'email query param required' }, { status: 400 })
  }
  try {
    await markUnsubscribed(email)
  } catch (err) {
    console.error('[unsubscribe/one-click] error:', err)
  }
  // Responder 200 siempre que el email vino presente — RFC 8058 no define un
  // manejo especial de error para el proveedor, y no ganamos nada
  // devolviendo un 500 acá (el proveedor no reintenta ni se lo muestra al
  // usuario). Mejor tratar de nuevo en la próxima corrida si algo falló.
  return NextResponse.json({ success: true })
}
