// Vercel Serverless Function — preview social (Open Graph) para los short links
// de la galería (/swc/<CODE>) y del comité de selección (/swc/c-<slug>)
// (rewrite en vercel.json → /api/og?code=<CODE>).
//
// Los bots de WhatsApp/X/etc NO ejecutan JS: leen el HTML crudo. Por eso acá
// devolvemos un HTML con los meta tags OG apuntando a ESA imagen, y redirigimos
// a los humanos a la SPA (que la abre en el lightbox).
//
// Galería y comité usan el MISMO código opaco (/swc/<CODE>): el mapeo code→imagen
// replica el algoritmo de src/lib/shortlink.ts (FNV-1a → xorshift32 → base26 A–Z,
// largo 6). Mantener en sync.
//
// La lista del comité NO se duplica acá: se importa comite.json (el bundler de
// Vercel sigue el import). El import va protegido: si por lo que sea la lista no
// está disponible, las previews del comité caen al placeholder pero la galería
// (que no depende de ese import) sigue intacta.

import { rejectMethod, siteUrl } from './_lib/http.js'

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

// Comité: code → /comite/<slug>.jpg, derivado de comite.json (sin duplicar la
// lista). Protegido: si el import falla, queda vacío y solo se pierde la preview
// del comité — la galería no toca esto.
let COMITE_BY_CODE = {}
try {
  const { default: comite } = await import('../src/content/comite.json', { with: { type: 'json' } })
  COMITE_BY_CODE = Object.fromEntries(comite.map(m => [codeFromSrc(m.img), m.img]))
} catch {
  /* comité sin previews; galería intacta */
}

// Startups: code → /startups/<slug>.jpg, derivado de startups.json (mismo criterio
// que el comité). El link redirige a la página dedicada /startups?s=<CODE>.
let STARTUP_BY_CODE = {}
try {
  const { default: startups } = await import('../src/content/startups.json', { with: { type: 'json' } })
  STARTUP_BY_CODE = Object.fromEntries(startups.map(s => [codeFromSrc(s.img), s.img]))
} catch {
  /* startups sin previews; el resto intacto */
}

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export default function handler(req, res) {
  // Como todas las demás rutas. Sin esto contestaba 200 con HTML a un POST o a un
  // DELETE, que es la única función de `api/` sin guard de método.
  if (rejectMethod(req, res, 'GET')) return

  const code = String((req.query && req.query.code) || '').toUpperCase()

  // De `siteUrl()` y no leyendo los headers acá: era la segunda copia de esa
  // lectura, y la que no tenía el cuidado de la primera. El origen termina en el
  // `og:image` y en el `og:url` que ven las redes.
  //
  // Si falta la configuración, esta página igual tiene que salir: una preview sin
  // imagen es mejor que un 500 en el link que alguien acaba de compartir.
  let origin = ''
  try {
    origin = siteUrl(req)
  } catch {
    /* sin origen las URLs quedan relativas; el redirect de abajo funciona igual */
  }

  // Mismo código para las tres secciones: probamos galería, comité y startups.
  const photo = SRC_BY_CODE[code] || null
  const card = photo ? null : COMITE_BY_CODE[code] || null
  const startup = photo || card ? null : STARTUP_BY_CODE[code] || null

  const image = origin + (photo || card || startup || '/cup.png')
  // La card ya lleva el nombre impreso, así que el título no lo repite.
  let title = 'Startup World Cup Argentina · Galería'
  if (card) title = 'Comité de Selección · Startup World Cup Argentina'
  else if (startup) title = 'Startup seleccionada · Startup World Cup Argentina'
  // LinkedIn (y otras redes) no permiten prellenar el texto del post: muestran la
  // preview (OG). Por eso ponemos el mismo mensaje que el tweet en la description.
  let description = 'Yo también participo de la Startup World Cup Argentina @StartupWC_arg @StartupGrindBA'
  if (card) description = 'Comité de Selección de la Startup World Cup Argentina @StartupWC_arg @StartupGrindBA'
  else if (startup) description = 'Startup seleccionada de la Startup World Cup Argentina @StartupWC_arg @StartupGrindBA'
  const pageUrl = `${origin}/swc/${code}`
  // Humanos → la ruta que muestra esa imagen y abre el lightbox. Bots se quedan con los meta tags.
  // Galería → /galeria ; Comité → /startups ; Startups → /startups (cada página lee su query).
  let dest = '/galeria'
  if (photo) dest = `/galeria?g=${encodeURIComponent(code)}`
  else if (card) dest = `/startups?c=${encodeURIComponent(code)}`
  else if (startup) dest = `/startups?s=${encodeURIComponent(code)}`

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
