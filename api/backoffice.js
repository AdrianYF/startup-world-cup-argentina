// /api/backoffice — el PIN del staff, y todo lo que hace el backoffice.
//
//   POST  (sin ?r)          { pin }        → token de sesión
//   GET   ?r=asistentes                    → la lista entera, con tokens
//   GET   ?r=ordenes                       → las compras y su plata
//   GET   ?r=tiers                         → precio, stock y cupo libre
//   GET   ?r=metricas                      → ingresos por día, canal y puerta
//   POST  ?r=persona        { id, … }      → corregir datos
//   POST  ?r=baja           { id }         → sacar de la lista (canales externos)
//   POST  ?r=reenviar       { orden }      → volver a mandar el mail
//   POST  ?r=orden          { id, accion } → reconciliar | liberar | reembolsar
//   POST  ?r=tier           { id, … }      → stock, precio, activo
//   POST  ?r=importar       { csv, … }     → CSV de un canal externo
//
// Un solo archivo y no una ruta por recurso porque `api/` ya tiene 12
// funciones, que es el tope del plan Hobby de Vercel: una más y el deploy no
// sale. El efecto secundario es bueno — toda la superficie protegida por el PIN
// entra por acá, y auditarla es leer un archivo.
//
// Un PIN compartido y no cuentas: el equipo de puerta se arma el día anterior,
// nadie va a dar de alta usuarios a las 8 de la mañana. Lo que protege es la
// lista de asistentes (nombres, mails, teléfonos) y ahora también las ventas,
// así que `PUERTA_PIN` tiene que ser largo, no cuatro dígitos.
import { json, rejectMethod, readBody, first, siteUrl } from './_lib/http.js'
import { pinValido, firmarSesion, rejectSinSesion, DIAS } from './_lib/puerta.js'
import { valorDe } from './_lib/entorno.js'
import * as admin from './_lib/admin.js'

/**
 * Ante un PIN incorrecto se espera antes de contestar. No es rate limiting de
 * verdad —en serverless no hay estado compartido donde llevar la cuenta— pero
 * baja de miles a un puñado los intentos por minuto, que para un PIN largo
 * alcanza.
 */
const ESPERA_MS = 400

export default async function handler(req, res) {
  const recurso = first(req.query?.r) || ''

  // Sin `?r` esto es el login, que es lo único que no puede pedir sesión.
  if (!recurso) return login(req, res)

  if (rejectSinSesion(req, res)) return

  try {
    if (req.method === 'GET') {
      switch (recurso) {
        case 'asistentes': return await admin.asistentes(res)
        case 'ordenes': return await admin.ordenes(res)
        case 'tiers': return await admin.tiers(res)
        case 'metricas': return await admin.metricas(res)
        default: return json(res, 404, { error: 'recurso_desconocido' })
      }
    }

    if (req.method === 'POST') {
      const body = readBody(req)
      switch (recurso) {
        case 'persona': return await admin.editarPersona(res, body)
        case 'baja': return await admin.bajaPersona(res, body)
        case 'reenviar': return await admin.reenviar(res, body, siteUrl(req))
        case 'orden': return await admin.accionOrden(res, body, siteUrl(req))
        case 'tier': return await admin.editarTier(res, body)
        case 'importar': return await admin.importarCSV(res, body)
        default: return json(res, 404, { error: 'recurso_desconocido' })
      }
    }

    res.setHeader('Allow', 'GET, POST')
    json(res, 405, { error: 'method_not_allowed' })
  } catch (err) {
    console.error(`[backoffice:${recurso}]`, err)
    json(res, 500, { error: 'backoffice_fallo' })
  }
}

async function login(req, res) {
  if (rejectMethod(req, res, 'POST')) return

  const { pin } = readBody(req)

  // Del entorno activo: en desarrollo son PUERTA_TEST_PIN y PUERTA_TEST_SECRET.
  // El 503 separa «esto no está configurado» de «ese PIN no es», que desde el
  // celular en la puerta son dos problemas muy distintos.
  const configurada = valorDe('PUERTA_PIN', { obligatoria: false })
    && valorDe('PUERTA_SECRET', { obligatoria: false })
  if (!configurada) {
    return json(res, 503, { error: 'puerta_no_configurada' })
  }

  if (!pinValido(pin)) {
    await new Promise(r => setTimeout(r, ESPERA_MS))
    return json(res, 401, { error: 'pin_invalido' })
  }

  // Los días viajan acá para que la pantalla los guarde y pueda abrir en el día
  // correcto aunque después no haya señal.
  json(res, 200, { token: firmarSesion(), dias: DIAS })
}
