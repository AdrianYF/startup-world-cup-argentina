/**
 * El andamio de los tests de integración.
 *
 * Estos corren los handlers de `api/` DE VERDAD contra el Postgres local, que es
 * la única forma de probar lo que importa. Los unitarios usan un doble de
 * Supabase que registra la cadena de llamadas: eso prueba que el código *pida*
 * `.neq('status','paid')`, no que Postgres lo respete, ni que un 23505 llegue con
 * `error.code === '23505'` a través de PostgREST, ni que un `upsert` con
 * `ignoreDuplicates` devuelva cero filas ante conflicto.
 *
 * Todo lo que se arregló en la tanda de bugs era comportamiento de base de datos.
 * Sin esta capa, esos arreglos están probados contra una imitación de Postgres.
 *
 * Requieren el Supabase local levantado (`supabase start`). Si no está, los tests
 * se saltean en vez de fallar: no quiero que `npm test` explote en la máquina de
 * alguien que sólo quería correr los unitarios.
 */
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { vercelizar } from '../../scripts/vite-plugin-api.mjs'

/** Credenciales del Supabase de Docker, o null si no está levantado. */
export function supabaseLocal() {
  try {
    const env = execFileSync('supabase', ['status', '-o', 'env'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const leer = clave => env.match(new RegExp(`^${clave}="?([^"\n]+)"?$`, 'm'))?.[1]
    const url = leer('API_URL')
    const key = leer('SERVICE_ROLE_KEY')
    if (!url || !key) return null

    // El cerrojo. Estos tests BORRAN órdenes y entradas, así que apuntar a la
    // base del evento sería destruir entradas vendidas.
    //
    // Hoy `supabase status` sólo puede devolver el Docker local, así que esto no
    // debería dispararse nunca. Está igual porque el costo de equivocarse es
    // asimétrico: si algún día `status` cambia de significado —o alguien mete un
    // `SUPABASE_URL` acá creyendo que ayuda— quiero que reviente y no que limpie
    // la base de producción en silencio.
    if (!/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/.test(url)) {
      throw new Error(
        `Los tests de integración sólo corren contra Postgres local, y esto apunta a ${url}. `
        + 'Se corta antes de tocar nada.',
      )
    }
    return { url, key }
  } catch (err) {
    // El cerrojo de arriba sí tiene que llegar a quien corre los tests: si lo
    // tragamos acá, se vería como «Supabase apagado» y los tests se saltearían.
    if (err instanceof Error && err.message.includes('sólo corren contra')) throw err
    return null
  }
}

/**
 * Prepara el entorno ANTES de que se importe cualquier módulo de `api/`.
 *
 * El orden no es negociable: `entorno.js` resuelve `ENTORNO` al cargarse y
 * `db.js` cachea el cliente de Supabase en la primera llamada. Si un test
 * importa un handler antes de esto, se queda con la configuración equivocada
 * para siempre.
 *
 * `PUBLIC_SITE_URL` se infiere y no se pide: es lo que arman las `back_urls` de
 * Mercado Pago y los links del mail, y dejarla a lo que tenga cada `.env.local`
 * hace que un test pase o falle según la máquina — o peor, que el harness herede
 * un túnel muerto, que es exactamente lo que rompió los links del mail real.
 */
export function prepararEntorno(supa) {
  process.env.ENTORNO = 'development'
  process.env.SUPABASE_URL = supa.url
  process.env.SUPABASE_SECRET_KEY = supa.key
  process.env.VENTA_PROPIA = 'on'
  process.env.MP_TEST_ACCESS_TOKEN = 'TEST-de-mentira-para-los-tests'
  process.env.MP_TEST_PUBLIC_KEY = 'TEST-public-de-mentira'
  process.env.MP_TEST_WEBHOOK_SECRET = 'secreto-de-mentira'
  process.env.PUBLIC_TEST_SITE_URL = BASE
  // Sin key el mail no sale y `enviarEntrada` avisa y devuelve false. Es lo que
  // queremos: ningún test manda un mail de verdad.
  delete process.env.RESEND_TEST_API_KEY
}

/**
 * La URL pública que ven los tests.
 *
 * Fija y no `localhost`, por una razón concreta: `checkout.js` decide con
 * `publica` si le manda `auto_return` y `notification_url` a Mercado Pago, y con
 * localhost los omite. O sea que con `localhost` estaríamos probando una rama
 * distinta de la que corre en producción.
 */
export const BASE = 'https://tests.swc.invalid'

/* -------------------------------------------------------------------------- */

/**
 * Invoca un handler como lo haría Vercel y devuelve `{ status, body, headers }`.
 *
 * Levanta un servidor HTTP de verdad y le pega, en vez de fabricar un `req`/`res`
 * de mentira. Es más lento y vale la pena: así el handler recibe streams reales,
 * headers reales y el mismo `vercelizar()` que usa el dev server.
 */
export async function invocar(handler, { metodo = 'GET', ruta = '/', cuerpo, headers = {} } = {}) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, BASE)
    vercelizar(req, res, url)
    // Vercel parsea el JSON del body por su cuenta; el plugin de dev también.
    if (metodo !== 'GET' && cuerpo !== undefined) req.body = cuerpo
    try {
      await handler(req, res)
    } catch (err) {
      if (!res.headersSent) {
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'handler_tiro', detalle: String(err) }))
      }
    }
  })

  await new Promise(r => server.listen(0, '127.0.0.1', r))
  const { port } = server.address()

  try {
    const res = await fetch(`http://127.0.0.1:${port}${ruta}`, {
      method: metodo,
      headers: {
        ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}),
    })
    const texto = await res.text()
    let body
    try { body = JSON.parse(texto) } catch { body = texto }
    return { status: res.status, body, headers: res.headers }
  } finally {
    server.close()
  }
}

/* -------------------------------------------------------------------------- */

/** Un cliente mínimo de PostgREST, para preparar y mirar el estado. */
export function db(supa) {
  const pedir = async (ruta, opciones = {}) => {
    const res = await fetch(`${supa.url}/rest/v1/${ruta}`, {
      ...opciones,
      headers: {
        apikey: supa.key,
        Authorization: `Bearer ${supa.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...opciones.headers,
      },
    })
    const texto = await res.text()
    if (!res.ok) throw new Error(`${ruta} → ${res.status} ${texto}`)
    return texto ? JSON.parse(texto) : []
  }

  return {
    leer: ruta => pedir(ruta),
    escribir: (tabla, fila) => pedir(tabla, { method: 'POST', body: JSON.stringify(fila) }),
    parchar: (ruta, cambios) => pedir(ruta, { method: 'PATCH', body: JSON.stringify(cambios) }),
    borrar: ruta => pedir(ruta, { method: 'DELETE' }),

    /**
     * Deja la base como la espera cada test: `stock` entradas DISPONIBLES en
     * `general`, y sin órdenes del mail de prueba.
     *
     * `stock` es cupo libre, no `stock_total`, y la diferencia importa: el
     * Postgres local de cualquiera tiene órdenes de antes —pruebas viejas, una
     * compra real— y esas ya están consumiendo cupo. Poner `stock_total = 1` con
     * una orden paga dando vueltas deja CERO disponibles y el test falla por el
     * estado de la máquina, no por el código.
     *
     * Así que se cuenta lo que ya está tomado y se suma. La cuenta es la misma
     * que hace `stock_disponible()` en la base: pagadas, más pendientes que no
     * vencieron.
     *
     * Se limpia por mail y no con un `db reset`, que tarda segundos y se llevaría
     * puesto lo que alguien tenga en su Postgres local mientras desarrolla.
     */
    async preparar({ stock = 20, activo = true, precio = 35000 } = {}) {
      const ordenes = await pedir(`orders?buyer_email=like.*${MAIL_TEST_SUFIJO}&select=id`)
      if (ordenes.length) {
        const ids = `(${ordenes.map(o => `"${o.id}"`).join(',')})`
        const entradas = await pedir(`entradas?order_id=in.${ids}&select=id`)
        if (entradas.length) {
          await pedir(`checkins?entrada_id=in.(${entradas.map(e => `"${e.id}"`).join(',')})`, { method: 'DELETE' })
        }
        await pedir(`entradas?order_id=in.${ids}`, { method: 'DELETE' })
        await pedir(`orders?id=in.${ids}`, { method: 'DELETE' })
      }

      const ahora = new Date().toISOString()
      const ocupadas = await pedir(
        `orders?tier_id=eq.general&select=quantity,status,expires_at`
        + `&or=(status.eq.paid,and(status.eq.pending,expires_at.gt.${ahora}))`,
      )
      const tomado = ocupadas.reduce((a, o) => a + o.quantity, 0)

      await pedir('tiers?id=eq.general', {
        method: 'PATCH',
        body: JSON.stringify({ stock_total: tomado + stock, activo, price_ars: precio }),
      })
    },
  }
}

/** Todos los mails de test terminan así, para poder limpiarlos sin tocar nada más. */
export const MAIL_TEST_SUFIJO = '@integracion.test'

let n = 0
/** Un mail único por test, así dos tests no se pisan las órdenes. */
export const mailDePrueba = () => `t${Date.now()}-${n++}${MAIL_TEST_SUFIJO}`
