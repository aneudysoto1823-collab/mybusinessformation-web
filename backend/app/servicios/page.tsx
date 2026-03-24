import fs from 'fs'
import path from 'path'
export default function Servicios() {
  const htmlPath = path.join(process.cwd(), 'public', 'servicios.html')
  const rawHtml = fs.readFileSync(htmlPath, 'utf-8')
  const styleMatches = rawHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)
  const styleContent = [...styleMatches].map(m => `<style>${m[1]}</style>`).join('')
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const bodyContent = bodyMatch ? bodyMatch[1] : ''
  return (
    <main dangerouslySetInnerHTML={{ __html: styleContent + bodyContent }} />
  )
}