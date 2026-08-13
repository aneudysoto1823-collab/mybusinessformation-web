import { headers } from 'next/headers'
import ClientPortalLoginForm from './LoginForm'

export default async function ClientPortalPage() {
  const host = (await headers()).get('host') || ''
  const isFBFC = host.includes('mybusinessformation.com')
  return <ClientPortalLoginForm initialIsFBFC={isFBFC} />
}
