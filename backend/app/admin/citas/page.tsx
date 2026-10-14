import { redirect } from 'next/navigation'

// Citas vive ahora como pestaña dentro de OpaBiz Connect (2026-10-14).
// Esta ruta se mantiene para links viejos (emails de cita nueva, manual).
export default function CitasRedirect() {
  redirect('/admin/opabiz?tab=citas')
}
