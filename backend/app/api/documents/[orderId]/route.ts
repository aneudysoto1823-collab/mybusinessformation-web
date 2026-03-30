import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase'

const BUCKET = 'certificates'

const VALID_FILES: Record<string, string> = {
  'certificate':         'orders/{orderId}/certificate.pdf',
  'operating-agreement': 'orders/{orderId}/operating-agreement.pdf',
  'ein-letter':          'orders/{orderId}/ein-letter.pdf',
  'itin-application':    'orders/{orderId}/itin-application.pdf',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  // Verify client session belongs to this order
  const cookieStore = await cookies()
  const session = cookieStore.get('client_session')?.value
  if (!session || session !== orderId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const file = request.nextUrl.searchParams.get('file')
  if (!file || !VALID_FILES[file]) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 })
  }

  const path = VALID_FILES[file].replace('{orderId}', orderId)

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
