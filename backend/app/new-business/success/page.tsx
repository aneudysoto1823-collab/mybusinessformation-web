import type { Metadata } from 'next'
import { Suspense } from 'react'
import PaymentCompletedTracker from './PaymentCompletedTracker'
import SuccessContent from './SuccessContent'

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false, follow: false },
}

export default function NewBusinessSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentCompletedTracker />
      <SuccessContent />
    </Suspense>
  )
}
