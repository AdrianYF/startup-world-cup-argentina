// POST /api/puerta-login — el PIN del staff a cambio de un token de sesión.
//
// Un PIN compartido y no cuentas: el equipo de puerta se arma el día anterior,
// nadie va a dar de alta usuarios a las 8 de la mañana. Lo que protege es la
// lista de asistentes (nombres, mails, teléfonos), así que `PUERTA_PIN` tiene
// que ser largo, no cuatro dígitos.
import { json, rejectMethod, readBody } from './_lib/http.js'
import { pinValido, firmarSesion, DIAS } from './_lib/puerta.js'

/**
 * Ante un PIN incorrecto se espera antes de contestar. No es rate limiting de
 * verdad —en serverless no hay estado compartido donde llevar la cuenta— pero
 * baja de miles a un puñado los intentos por minuto, que para un PIN largo
 * alcanza.
 */
const ESPERA_MS = 400

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return

  const { pin } = readBody(req)

  if (!process.env.PUERTA_PIN || !process.env.PUERTA_SECRET) {
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
