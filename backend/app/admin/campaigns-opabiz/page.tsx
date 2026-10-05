'use client'

import CampaignsPanel from '../campaigns/CampaignsPanel'

// Campaigns & Letters de OpaBiz: mismas empresas que el de MyBiz, pero solo
// la campaña de OpaBiz y su propio seguimiento de envíos.
export default function CampaignsOpabizPage() {
  return <CampaignsPanel brand="opabiz" />
}
