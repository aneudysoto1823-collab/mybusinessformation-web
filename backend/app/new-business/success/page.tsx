import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order Confirmed — Florida Business Formation Center',
  robots: { index: false, follow: false },
}

export default function NewBusinessSuccessPage() {
  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '80px 24px' }}>
      <h1>Payment Successful</h1>
      <p style={{ marginTop: 16, color: '#64748b' }}>We will contact you shortly with your documents.</p>
    </div>
  )
}
