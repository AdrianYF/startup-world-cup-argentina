// GET /api/puerta?dia=jue — la lista de la puerta de un día, con sus ingresos.
//
//   ?dia=jue              todo: la lista completa + los ingresos del día
//   ?dia=jue&desde=<iso>  sólo lo nuevo, para que dos puertas se vean entre sí
//                         sin volver a bajar la lista entera
//
// Es la misma vista `acreditacion` que imprime `scripts/lista-puerta.mjs`, pero
// SIN el `token` de cada entrada: es la credencial de quien compró, y el celular
// del staff no la necesita para nada. El escaneo manda el token que leyó y lo
// resuelve el servidor (ver api/puerta-checkin.js).
import { db } from './_lib/db.js'
import { json, rejectMethod, first } from './_lib/http.js'
import { DIAS, dia as buscarDia, diaDeHoy, habilitaDia, rejectSinSesion } from './_lib/puerta.js'

const CAMPOS = 'id, origen, nombre, email, telefono, empresa, entrada, dias'

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return
  if (rejectSinSesion(req, res)) return

  const d = buscarDia(first(req.query?.dia)) || diaDeHoy()

  // El cursor viaja en la URL y ahora también filtra `registrado_en`: si llega
  // basura, PostgREST tira un error de casteo y el poll de la puerta empieza a
  // devolver 500. Se ignora en vez de fallar — sin cursor válido lo que
  // corresponde es la lista entera, que es exactamente lo que hace el cliente.
  const crudo = first(req.query?.desde)
  const desde = crudo && !Number.isNaN(Date.parse(crudo)) ? crudo : null

  try {
    // El cursor se toma ANTES de leer. Si sale después, un check-in que entre
    // entre la lectura y el reloj se pierde para siempre en el próximo delta.
    const cursor = new Date().toISOString()

    let ingresos = db()
      .from('checkins')
      .select('id, origen, entrada_id, externo_id, por, anulado_en, creado_en')
      .eq('dia', d.fecha)

    // Una anulación no crea una fila, actualiza una existente: si el delta
    // filtrara sólo por `creado_en`, deshacer en una puerta no se vería en la otra.
    if (desde) ingresos = ingresos.or(`creado_en.gt.${desde},anulado_en.gt.${desde}`)

    const { data: checkins, error: errIngresos } = await ingresos
    if (errIngresos) throw errIngresos

    const cuerpo = {
      dia: d,
      dias: DIAS,
      cursor,
      delta: Boolean(desde),
      checkins: (checkins || []).map(c => ({
        id: c.id,
        // La fila de `acreditacion` a la que pertenece, sea de la venta propia
        // o de un canal externo.
        ref: c.entrada_id || c.externo_id,
        origen: c.origen,
        por: c.por,
        anuladoEn: c.anulado_en,
        creadoEn: c.creado_en,
      })),
    }

    // Las personas viajan SIEMPRE, también en el delta.
    //
    // Antes sólo iban en la carga completa, y como la pantalla sólo la pide al
    // cambiar de día, un alta hecha en una puerta no aparecía nunca en la otra
    // —ni un import a mitad del evento—. El delta filtra por `registrado_en`,
    // que es lo que `puerta-agregar.js` escribe con la hora del alta.
    const { personas, sinDia } = await traerPersonas(d, desde)
    cuerpo.personas = personas

    // Cuántas filas de la lista no caen en NINGÚN día del evento.
    //
    // `acreditacion.dias` es texto libre que escribe cada canal y `habilitaDia`
    // lo resuelve con un `includes`: si un CSV exporta "6/8" o "Miercoles" sin
    // tilde, esa persona no aparece en ninguna puerta. Sin este número el
    // problema es invisible — alguien queda afuera y nadie se entera.
    if (sinDia !== null) cuerpo.sinDia = sinDia

    json(res, 200, cuerpo)
  } catch (err) {
    console.error('[puerta]', err)
    json(res, 500, { error: 'puerta_fallo' })
  }
}

/**
 * Las filas de la lista habilitadas para `d`, marcadas con su pago doble.
 *
 * Con `desde`, sólo las que se registraron después: es el delta. `sinDia` sale
 * en null ahí, porque para contar las que no matchean ningún día hace falta
 * mirar la lista entera.
 */
async function traerPersonas(d, desde) {
  let query = db().from('acreditacion').select(CAMPOS + ', registrado_en')
  if (desde) query = query.gt('registrado_en', desde)

  const { data, error } = await query
  if (error) throw error
  const todas = data || []

  // El delta corre cada 10s en cada dispositivo y casi siempre viene vacío. La
  // vista de pagos dobles agrupa la lista entera, así que sólo se paga cuando
  // hay a quién marcar.
  const dobles = todas.length ? await pagosDobles() : new Set()
  return {
    personas: todas
      .filter(f => habilitaDia(f.dias, d.label))
      .map(({ registrado_en: _, ...f }) => ({ ...f, pagoDoble: dobles.has(f.email) })),
    sinDia: desde
      ? null
      : todas.filter(f => !DIAS.some(x => habilitaDia(f.dias, x.label))).length,
  }
}

/**
 * Los mails que compraron la MISMA entrada en Startup Grind y en la web.
 *
 * Los dos canales venden lo mismo, así que se puede pagar dos veces sin querer.
 * La puerta lo muestra antes de dejar pasar, para que quede anotado el reembolso.
 */
async function pagosDobles() {
  const { data } = await db().from('acreditacion_ambos_canales').select('email, origenes')
  return new Set(
    (data || [])
      .filter(p => (p.origenes || '').includes('web') && (p.origenes || '').includes('startupgrind'))
      .map(p => p.email),
  )
}
