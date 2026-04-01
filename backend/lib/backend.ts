const BACKEND_URL =
  process.env.BACKEND_URL ||
  'https://mybusinessformation-web-production.up.railway.app'

export function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  headers.set('x-api-key', process.env.INTERNAL_API_KEY!)
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers })
}
