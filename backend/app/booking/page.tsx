import { redirect } from 'next/navigation'

// Citas desactivadas 2026-10-14 (decisión socios): la atención es por email y
// WhatsApp. El sistema queda guardado: la página vieja está en BookingPage.tsx
// (para reactivar, volver a exportarla como default acá y prender
// BOOKING_ENABLED en app/api/booking/route.ts). Reprogramar y cancelar siguen
// funcionando para las citas que ya existían.
export default function BookingRedirect() {
  redirect('/contact')
}
