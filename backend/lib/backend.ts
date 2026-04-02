const BACKEND_URL =
  process.env.BACKEND_URL ||
  'https://mybusinessformation-web-production.up.railway.app'

export function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const apiKey = process.env.INTERNAL_API_KEY
  if (!apiKey) throw new Error('[backendFetch] INTERNAL_API_KEY is not set in environment')
const headers = new Headers(init?.headers as HeadersInit)
  headers.set('x-api-key', apiKey)
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers })
}
