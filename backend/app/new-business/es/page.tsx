'use client'

import { Suspense } from 'react'
import { NewBusinessContent } from '../page'

export default function NewBusinessEsPage() {
  return (
    <Suspense>
      <NewBusinessContent defaultLang="es" />
    </Suspense>
  )
}
