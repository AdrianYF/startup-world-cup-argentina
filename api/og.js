// Vercel Serverless Function — preview social (Open Graph) para los short links
// de la galería y del comité de selección: /swc/<CODE>
// (rewrite en vercel.json → /api/og?code=<CODE>).
//
// Los bots de WhatsApp/X/etc NO ejecutan JS: leen el HTML crudo. Por eso acá
// devolvemos un HTML con los meta tags OG apuntando a ESA imagen, y redirigimos
// a los humanos a la SPA (que la abre en el lightbox).
//
// El mapeo code→imagen replica el algoritmo de src/lib/shortlink.ts
// (FNV-1a → xorshift32 → base26 A–Z, largo 6). Mantener en sync.

// Mantener en sync con src/components/Galeria.tsx (mismas filas y conteos).
const ROW1_COUNT = 39
const ROW2_COUNT = 36
const ROW3_COUNT = 15
const CODE_LEN = 6
const pad = (n) => String(n).padStart(2, '0')
const ALL = [
  ...Array.from({ length: ROW1_COUNT }, (_, i) => `/galeria/r1-${pad(i + 1)}.jpg`),
  ...Array.from({ length: ROW2_COUNT }, (_, i) => `/galeria/r2-${pad(i + 1)}.jpg`),
  ...Array.from({ length: ROW3_COUNT }, (_, i) => `/galeria/r3-${pad(i + 1)}.jpg`),
]

// Mantener en sync con src/content/comite.json (el orden no importa: el código
// sale del path de la imagen). Va duplicado acá porque esta función se bundlea
// aparte del front y no comparte el import de JSON.
const COMITE = [
  ['diego-gonzalez', 'Diego Gonzalez'],
  ['francis-perelman', 'Francis Perelman'],
  ['susana-darin', 'Susana Darin'],
  ['karina-rasic', 'Karina Rasic'],
  ['claudio-cocconi', 'Claudio Cocconi'],
  ['franco-pagella', 'Franco Pagella'],
  ['fito-diaz-gramont', 'Fito Díaz Gramont'],
  ['lisa-ocampo', 'Lisa Ocampo'],
  ['omar-nievas', 'Omar Nievas'],
  ['matias-gonzalez', 'Matias Gonzalez'],
  ['lucas-navarro', 'Lucas Navarro'],
  ['matias-dellanno-irigoyen', 'Matias Dellanno Irigoyen'],
  ['lucas-heine', 'Lucas Heine'],
  ['celia-alfie', 'Celia Alfie'],
  ['carla-goglia', 'Carla Goglia'],
  ['aldo-montefiore', 'Aldo Montefiore'],
  ['ale-bustos', 'Ale Bustos'],
  ['rocio-minvielle-crocci', 'Rocío Minvielle Crocci'],
  ['gabriel-aufgang', 'Gabriel Aufgang'],
]

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
const COMITE_BY_CODE = Object.fromEntries(
  COMITE.map(([slug, nombre]) => {
    const img = `/comite/${slug}.jpg`
    return [codeFromSrc(img), { img, nombre }]
  }),
)

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export default function handler(req, res) {
  const code = String((req.query && req.query.code) || '').toUpperCase()
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || ''
  const origin = `${proto}://${host}`

  // Un mismo código puede ser de la galería o del comité: probamos ambas tablas.
  const photo = SRC_BY_CODE[code] || null
  const miembro = photo ? null : COMITE_BY_CODE[code] || null

  const image = origin + (photo || (miembro && miembro.img) || '/cup.png')
  const title = miembro
    ? `${miembro.nombre} · Comité de Selección — Startup World Cup Argentina`
    : 'Startup World Cup Argentina · Galería'
  // LinkedIn (y otras redes) no permiten prellenar el texto del post: muestran la
  // preview (OG). Por eso ponemos el mismo mensaje que el tweet en la description.
  const description = miembro
    ? `${miembro.nombre} es parte del Comité de Selección de la Startup World Cup Argentina @StartupWC_arg @StartupGrindBA`
    : 'Yo también participo de la Startup World Cup Argentina @StartupWC_arg @StartupGrindBA'
  const pageUrl = `${origin}/swc/${code}`
  // Humanos → SPA (abre la imagen vía ?g= / ?c=). Bots se quedan con los meta tags.
  let dest = '/#galeria'
  if (photo) dest = `/?g=${encodeURIComponent(code)}`
  else if (miembro) dest = `/?c=${encodeURIComponent(code)}`

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
