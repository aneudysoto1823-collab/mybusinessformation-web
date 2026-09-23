// Genera el PNG del logo "OB" de OpaBiz (gradiente navy->azul horneado en la
// imagen, no CSS) usado en lib/opabiz-logo.ts. Correr de nuevo solo si se
// cambia el diseño del mark — ver el comentario de opabiz-logo.ts para el
// porqué de usar una imagen en vez del div con linear-gradient que usa el
// sitio. Uso: node scripts/gen-opabiz-logo.mjs (desde backend/), imprime el
// export listo para pegar en lib/opabiz-logo.ts.
import sharp from 'sharp'

const SIZE = 84 // 2x de 42px para que se vea nítido en pantallas HiDPI
const RADIUS = 20

const svg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1C2E44"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" fill="url(#g)"/>
  <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="32" font-weight="700"
        fill="#ffffff">OB</text>
</svg>
`.trim()

const buf = await sharp(Buffer.from(svg)).png().toBuffer()
const base64 = buf.toString('base64')

console.log(`// Logo "OB" de OpaBiz — gradiente navy (#1C2E44) a azul (#2563EB), mismo
// mark que ya usa el sitio (.logo-mark en page.tsx/afiliados/page.tsx), pero
// horneado como imagen PNG en vez de CSS background. Generado 2026-09-23
// (scripts/gen-opabiz-logo.mjs) para reemplazar el navy sólido #22364E que
// usaban los emails: un div con linear-gradient renderizaba distinto entre
// Gmail mobile y Gmail web/Safari (fix 2026-09-07) — una imagen no depende
// de soporte CSS del cliente de correo, así que resuelve la inconsistencia
// sin reintroducir ese bug. Embebido en base64 (mismo patrón que
// fbfc-seal.ts) para no depender de un asset servido por URL.
export const OPABIZ_LOGO_PNG_BASE64 = '${base64}'
`)
console.error('bytes:', buf.length, 'base64 length:', base64.length)
