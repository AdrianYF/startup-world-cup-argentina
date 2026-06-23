// Vercel Serverless Function — preview social (Open Graph) para los short links
// de la galería: /swc/<CODE> (rewrite en vercel.json → /api/og?code=<CODE>).
//
// Los bots de WhatsApp/X/etc NO ejecutan JS: leen el HTML crudo. Por eso acá
// devolvemos un HTML con los meta tags OG apuntando a ESA foto, y redirigimos a
// los humanos a la SPA (que abre la foto en el lightbox).
//
// El mapeo code→foto replica el algoritmo de src/components/Galeria.tsx
// (FNV-1a → xorshift32 → base26 A–Z, largo 6). Mantener en sync.

const PHOTO_COUNT = 55
const CODE_LEN = 6
const ALL = Array.from(
  { length: PHOTO_COUNT },
  (_, i) => `/galeria/foto-${String(i + 1).padStart(2, '0')}.jpg`,
)

function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
function codeFromSrc(src) {
  let h = fnv1a(src) || 1
  let out = ''
  for (let i = 0; i < CODE_LEN; i++) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    h >>>= 0
    out += String.fromCharCode(65 + (h % 26))
  }
  return out
}
const SRC_BY_CODE = Object.fromEntries(ALL.map(s => [codeFromSrc(s), s]))

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export default function handler(req, res) {
  const code = String((req.query && req.query.code) || '').toUpperCase()
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || ''
  const origin = `${proto}://${host}`

  const photo = SRC_BY_CODE[code] || null
  const image = origin + (photo || '/cup.png')
  const title = 'Startup World Cup Argentina · Galería'
  const description = 'Viví la experiencia Startup World Cup Argentina.'
  const pageUrl = `${origin}/swc/${code}`
  // Humanos → SPA (abre la foto vía ?g=). Bots se quedan con los meta tags.
  const dest = photo ? `/?g=${encodeURIComponent(code)}` : '/#galeria'

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600')
  res.status(200).send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:url" content="${esc(pageUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<script>window.location.replace(${JSON.stringify(dest)})</script>
</head>
<body style="margin:0;background:#020618;color:#fff;font-family:system-ui,sans-serif">
<noscript><a href="${esc(dest)}">Ver la galería</a></noscript>
</body>
</html>`)
}
