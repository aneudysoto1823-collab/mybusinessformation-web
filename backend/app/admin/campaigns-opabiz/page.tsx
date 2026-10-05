import { redirect } from 'next/navigation'

// El panel de OpaBiz se fusionó con el de MyBiz en /admin/campaigns
// (2026-10-05). Se conserva la ruta por si quedó algún link guardado.
export default function CampaignsOpabizPage() {
  redirect('/admin/campaigns')
}
