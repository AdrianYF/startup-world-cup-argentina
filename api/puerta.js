// GET /api/puerta?dia=jue — la lista de la puerta de un día, con sus ingresos.
//
//   ?dia=jue              todo: la lista completa + los ingresos del día
//   ?dia=jue&desde=<iso>  sólo los ingresos nuevos, para que dos puertas se vean
//                         entre sí sin volver a bajar la lista entera
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
  const desde = first(req.query?.desde)

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

    if (!desde) {
      const [{ data: filas, error }, { data: ambos }] = await Promise.all([
        db().from('acreditacion').select(CAMPOS),
        db().from('acreditacion_ambos_canales').select('email, origenes'),
      ])
      if (error) throw error

      // Startup Grind y la venta propia venden la MISMA entrada, así que alguien
      // pudo pagar dos veces. Que la puerta lo vea antes de dejarlo pasar.
      const dobles = new Set(
        (ambos || [])
          .filter(p => (p.origenes || '').includes('web') && (p.origenes || '').includes('startupgrind'))
          .map(p => p.email),
      )

      cuerpo.personas = (filas || [])
        .filter(f => habilitaDia(f.dias, d.label))
        .map(f => ({ ...f, pagoDoble: dobles.has(f.email) }))
    }

    json(res, 200, cuerpo)
  } catch (err) {
    console.error('[puerta]', err)
    json(res, 500, { error: 'puerta_fallo' })
  }
}
