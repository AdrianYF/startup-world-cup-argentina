/**
 * En qué entorno corre esto, y con qué credenciales de Mercado Pago.
 *
 * Existe por una razón concreta: las pruebas del checkout se hicieron con las
 * credenciales de producción (`APP_USR-`) y movieron plata de verdad — cuatro
 * pagos aprobados contra una tarjeta real, $147.809,08 que después hay que
 * devolver a mano. No había nada que lo impidiera porque no había forma de
 * distinguir «estoy probando» de «esto cobra».
 *
 * Ahora hay dos juegos de credenciales y el entorno elige. Y, sobre todo, hay
 * un cerrojo: en desarrollo, una credencial de producción **tira**. No avisa,
 * no sigue de largo con un warning — corta.
 *
 * ─── Cómo se decide el entorno ──────────────────────────────────────────────
 *
 *   1. `ENTORNO`, si está puesta. Es la escotilla: sirve para hacer una compra
 *      real de verificación desde un preview, y hay que ponerla a mano, que es
 *      justamente la fricción que se busca.
 *   2. `VERCEL_ENV === 'production'` → producción.
 *   3. Todo lo demás → desarrollo.
 *
 * El default importa: un preview de Vercel cae en **desarrollo**. Es donde se
 * probó con el túnel de Cloudflare y donde se gastaron los $147.809.
 */

const PRODUCCION = 'production'
const DESARROLLO = 'development'

/** `production` o `development`. Nunca otra cosa. */
export const ENTORNO = (() => {
  const explicito = (process.env.ENTORNO || '').trim().toLowerCase()
  if (explicito === PRODUCCION || explicito === DESARROLLO) return explicito
  return process.env.VERCEL_ENV === PRODUCCION ? PRODUCCION : DESARROLLO
})()

export const enProduccion = ENTORNO === PRODUCCION

/**
 * Las credenciales de Mercado Pago del entorno actual.
 *
 * Se resuelve en cada llamada y no una vez al importar el módulo: si algo falta
 * o está cruzado, el error tiene que aparecer cuando alguien intenta cobrar
 * —donde se puede devolver un 503 y loguear qué pasó— y no al cargar el módulo,
 * que en Vercel es un FUNCTION_INVOCATION_FAILED sin explicación. Ya nos pasó
 * con los templates de mail.
 */
export function credencialesMP() {
  const v = enProduccion
    ? {
      accessToken: process.env.MP_ACCESS_TOKEN,
      // Sin prefijo `VITE_` porque ya no se inlinea en el build: la manda el
      // servidor en la respuesta del checkout. Se acepta el nombre viejo para
      // no romper lo que ya esté cargado en Vercel.
      publicKey: process.env.MP_PUBLIC_KEY || process.env.VITE_MP_PUBLIC_KEY,
      webhookSecret: process.env.MP_WEBHOOK_SECRET,
    }
    : {
      accessToken: process.env.MP_TEST_ACCESS_TOKEN,
      publicKey: process.env.MP_TEST_PUBLIC_KEY,
      webhookSecret: process.env.MP_TEST_WEBHOOK_SECRET,
    }

  const prefijo = ENTORNO === PRODUCCION ? 'MP_' : 'MP_TEST_'
  if (!v.accessToken) {
    throw new ErrorDeEntorno(`falta ${prefijo}ACCESS_TOKEN (entorno: ${ENTORNO})`)
  }

  // El cerrojo. Una credencial `APP_USR-` en desarrollo cobra de verdad: es
  // exactamente lo que ya pasó, y es plata que después alguien tiene que
  // devolver pago por pago desde el panel.
  if (!enProduccion && v.accessToken.startsWith('APP_USR-')) {
    throw new ErrorDeEntorno(
      'MP_TEST_ACCESS_TOKEN es una credencial de PRODUCCIÓN (empieza con APP_USR-). '
      + 'En desarrollo eso cobra plata de verdad. Poné las credenciales de prueba '
      + '(TEST-) del panel de Mercado Pago, o exportá ENTORNO=production si de '
      + 'verdad querés cobrar.',
    )
  }

  // El espejo: credenciales de prueba en producción no cobran nada, así que la
  // gente se llevaría la entrada gratis y el evento se enteraría en la puerta.
  if (enProduccion && v.accessToken.startsWith('TEST-')) {
    throw new ErrorDeEntorno(
      'MP_ACCESS_TOKEN es una credencial de PRUEBA (empieza con TEST-) y el '
      + 'entorno es producción: las compras no cobrarían nada.',
    )
  }

  return v
}

/**
 * Un error de configuración, no un fallo de la operación.
 *
 * Se distingue con su propia clase para que quien llama pueda contestar 503
 * —«esto está mal configurado, no es tu culpa ni un error transitorio»— en vez
 * de un 500 genérico que invita a reintentar.
 */
export class ErrorDeEntorno extends Error {
  constructor(mensaje) {
    super(mensaje)
    this.name = 'ErrorDeEntorno'
  }
}
