// El Labor Law Poster se movió a la galería de plantillas (2026-10-09).
// Se conserva esta ruta solo para que los links viejos sigan funcionando.
import { redirect } from 'next/navigation'

export default function LaborLawPosterRedirect() {
  redirect('/admin/plantillas?tipo=poster')
}
