/**
 * En qué entorno corre esto, y con qué credenciales.
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
 * Empezó siendo sólo Mercado Pago y hoy es todo lo que tenga dos caras: Resend,
 * la URL del sitio, el PIN de la puerta. La razón de extenderlo es que «estoy
 * en desarrollo» era media verdad —el checkout no cobraba, pero los mails
 * salían con el remitente real y el PIN era el del evento— y cuál mitad valía
 * dependía de qué servicio tocaras.
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
 * Cómo se llama una variable en un entorno.
 *
 *   producción    MP_ACCESS_TOKEN        RESEND_API_KEY        PUERTA_PIN
 *   desarrollo    MP_TEST_ACCESS_TOKEN   RESEND_TEST_API_KEY   PUERTA_TEST_PIN
 *
 * El `TEST_` va después del servicio y no adelante porque es la forma que ya
 * tenían las de Mercado Pago, que son las que están cargadas en Vercel:
 * renombrarlas sería romper producción para que el código quede prolijo.
 *
 * El entorno va por parámetro y no sale del módulo para que la regla se pueda
 * usar desde afuera: el plugin del dev server la necesita ANTES de que el
 * `.env.local` esté leído (o sea, con `ENTORNO` todavía sin resolver), y el
 * chequeo de `npm run entorno` necesita los dos entornos en la misma corrida.
 * Es la única copia de esta regla que hay en el proyecto.
 */
export function nombreEn(nombre, entorno = ENTORNO) {
  if (entorno === PRODUCCION) return nombre
  const corte = nombre.indexOf('_')
  return corte === -1
    ? `TEST_${nombre}`
    : `${nombre.slice(0, corte)}_TEST${nombre.slice(corte)}`
}

/**
 * El id de la cuenta que emitió un token de Mercado Pago.
 *
 * Va adentro del propio token, en el último segmento:
 * `APP_USR-<app>-<fecha>-<hash>-<userId>`. No hay que preguntarle a nadie, y es
 * lo único que distingue una `APP_USR-` de una cuenta de prueba de la `APP_USR-`
 * que cobra: las dos tienen el mismo prefijo.
 */
export function cuentaDe(token) {
  return (token || '').split('-').pop()
}

/** token → si su cuenta es de prueba. Una consulta por proceso y por token. */
const cuentasVerificadas = new Map()

/**
 * ¿Este token es de una cuenta de prueba de Mercado Pago?
 *
 * Se lo pregunta a Mercado Pago, que es el único que lo sabe: los test users
 * vienen con el tag `test_user`. El prefijo no alcanza —emiten `APP_USR-` igual
 * que las cuentas que cobran— y una variable declarándolo tampoco, porque una
 * declaración se puede equivocar y desarma el cerrojo sin que nadie se entere.
 *
 * Sólo corre en desarrollo y una vez por token: en producción no se pregunta
 * nada. Si Mercado Pago no contesta, **no** se asume que es de prueba: el
 * checkout corta. Preferimos no poder cobrar antes que cobrarle a alguien sin
 * querer.
 */
async function esCuentaDePrueba(token) {
  if (cuentasVerificadas.has(token)) return cuentasVerificadas.get(token)

  let cuenta
  try {
    const r = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    cuenta = await r.json()
  } catch (err) {
    throw new ErrorDeEntorno(
      `No pude confirmar con Mercado Pago que la cuenta ${cuentaDe(token)} sea de `
      + `prueba (${err.message}). En desarrollo, una credencial sin confirmar no `
      + 'cobra: revisá la conexión o poné credenciales TEST- del panel.',
    )
  }

  const esDePrueba = (cuenta.tags || []).includes('test_user')
  cuentasVerificadas.set(token, esDePrueba)
  return esDePrueba
}

/**
 * Qué va a hacer el cerrojo con este token, dicho antes de que alguien pague.
 *
 * Es el mismo criterio que aplican los `if` de `credencialesMP()` — abajo — pero
 * en forma de frase: lo usan el cartel del dev server y `npm run entorno` para
 * anunciarlo al arrancar en vez de que aparezca en el primer intento de cobro.
 */
export function diagnosticoMP(token, entorno = ENTORNO) {
  const prod = entorno === PRODUCCION
  if (!token) return { ok: false, texto: `falta ${nombreEn('MP_ACCESS_TOKEN', entorno)}` }
  if (token.startsWith('TEST-')) {
    return prod
      ? { ok: false, texto: 'credenciales de PRUEBA en producción → el checkout corta' }
      : { ok: true, texto: 'credenciales de prueba' }
  }
  if (token.startsWith('APP_USR-')) {
    return prod
      ? { ok: true, texto: 'credenciales de producción' }
      // Sin veredicto: saber si es de prueba requiere preguntarle a Mercado
      // Pago, y esto se usa donde no se puede esperar una respuesta de red. Lo
      // confirma `npm run entorno`, o el propio checkout la primera vez.
      : { ok: true, texto: `cuenta ${cuentaDe(token)} · se confirma con Mercado Pago` }
  }
  return { ok: true, texto: 'configurado' }
}

/**
 * El valor de una variable en el entorno actual.
 *
 * Lo que NO hace, y es su razón de ser: caer al valor del otro entorno cuando
 * falta el propio. Que falte `RESEND_TEST_API_KEY` y el mail salga con la key
 * de producción es la misma clase de silencio que cobró los $147.809. Si falta,
 * corta y dice cuál falta.
 *
 * `obligatoria: false` es para lo que sabe seguir sin el valor —el mail se
 * saltea y avisa— y nunca para una credencial que cobra.
 */
export function valorDe(nombre, { obligatoria = true } = {}) {
  const clave = nombreEn(nombre)
  const valor = process.env[clave]
  if (!valor && obligatoria) {
    throw new ErrorDeEntorno(`falta ${clave} (entorno: ${ENTORNO})`)
  }
  return valor
}

/**
 * Las credenciales de Mercado Pago del entorno actual.
 *
 * Se resuelve en cada llamada y no una vez al importar el módulo: si algo falta
 * o está cruzado, el error tiene que aparecer cuando alguien intenta cobrar
 * —donde se puede devolver un 503 y loguear qué pasó— y no al cargar el módulo,
 * que en Vercel es un FUNCTION_INVOCATION_FAILED sin explicación. Ya nos pasó
 * con los templates de mail.
 */
export async function credencialesMP() {
  const v = {
    // Tira acá si falta: es la única de las tres sin la cual no hay checkout.
    accessToken: valorDe('MP_ACCESS_TOKEN'),
    // Sin prefijo `VITE_` porque ya no se inlinea en el build: la manda el
    // servidor en la respuesta del checkout. Se acepta el nombre viejo para
    // no romper lo que ya esté cargado en Vercel.
    publicKey: valorDe('MP_PUBLIC_KEY', { obligatoria: false })
      || (enProduccion ? process.env.VITE_MP_PUBLIC_KEY : undefined),
    // El webhook chequea que esté y contesta 500 si falta, para que Mercado
    // Pago reintente en vez de dar la notificación por entregada.
    webhookSecret: valorDe('MP_WEBHOOK_SECRET', { obligatoria: false }),
  }

  // El cerrojo. Una credencial `APP_USR-` en desarrollo cobra de verdad: es
  // exactamente lo que ya pasó, y es plata que después alguien tiene que
  // devolver pago por pago desde el panel.
  //
  // Pero el prefijo solo no alcanza para decidir, y creer que sí tuvo su propio
  // costo: las **cuentas de prueba** de Mercado Pago (los test users, esos con
  // nickname `TESTUSER…`) también emiten credenciales `APP_USR-` y no mueven un
  // peso. Rechazarlas dejaba el checkout local sin forma de probarse.
  //
  // Quién decide, entonces, es Mercado Pago: se le pregunta de qué cuenta es el
  // token. No hay nada que configurar y no hay forma de mentirle — pegar acá la
  // credencial que cobra sigue cortando, que es el caso de los $147.809.
  if (!enProduccion && v.accessToken.startsWith('APP_USR-')) {
    if (!await esCuentaDePrueba(v.accessToken)) {
      throw new ErrorDeEntorno(
        `MP_TEST_ACCESS_TOKEN es de la cuenta ${cuentaDe(v.accessToken)}, que NO es `
        + 'de prueba: en desarrollo eso cobra plata de verdad. Poné las credenciales '
        + 'de una cuenta de prueba, o exportá ENTORNO=production si de verdad querés '
        + 'cobrar.',
      )
    }
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
