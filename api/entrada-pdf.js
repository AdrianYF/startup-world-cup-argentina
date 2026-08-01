// GET /api/entrada-pdf?t=<token> — la entrada en PDF, para descargar.
//
// Una página que se guarda en el teléfono o se imprime, y que sirve aunque en
// la puerta no haya señal — que es justo donde suele no haber.
//
// El QR codifica la misma URL que el de la web (/entrada/<token>), así que la
// entrada descargada y la online son la misma cosa.
import QRCode from 'qrcode'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { db } from './_lib/db.js'
import { json, rejectMethod, first, siteUrl, formatARS } from './_lib/http.js'

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

// Paleta del sitio.
const FONDO = rgb(0x02 / 255, 0x06 / 255, 0x18 / 255)
const TARJETA = rgb(0x0f / 255, 0x17 / 255, 0x2b / 255)
const CELESTE = rgb(0x75 / 255, 0xaa / 255, 0xdb / 255)
const BLANCO = rgb(1, 1, 1)
const GRIS = rgb(0.61, 0.64, 0.69)

/** Helvetica va en WinAnsi, que cubre los acentos y la ñ del castellano. */
const A4 = [595.28, 841.89]

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return

  const token = String(first(req.query?.t) || '')
  if (!TOKEN_RE.test(token)) return json(res, 400, { error: 'token_invalido' })

  try {
    const { data, error } = await db()
      .from('orders')
      .select('id, tier_id, quantity, unit_price_ars, service_fee_ars, buyer_name, buyer_empresa, status, ticket_used_at, tiers(nombre)')
      .eq('ticket_token', token)
      .eq('status', 'paid')
      .maybeSingle()

    if (error) throw error
    if (!data) return json(res, 404, { error: 'entrada_inexistente' })

    const base = siteUrl(req)
    const url = `${base}/entrada/${token}`
    const qrPng = await QRCode.toBuffer(url, {
      type: 'png', width: 600, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#020618ff', light: '#ffffffff' },
    })

    const pdf = await PDFDocument.create()
    pdf.setTitle(`Entrada · Startup World Cup Argentina 2026`)
    pdf.setAuthor('Startup World Cup Argentina')

    const page = pdf.addPage(A4)
    const { width, height } = page.getSize()
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    const normal = await pdf.embedFont(StandardFonts.Helvetica)
    const qr = await pdf.embedPng(qrPng)

    // Fondo
    page.drawRectangle({ x: 0, y: 0, width, height, color: FONDO })

    // Datos del pie de la tarjeta. Se arman ANTES de dibujarla porque de cuántas
    // filas haya depende su alto.
    const subtotal = data.unit_price_ars * data.quantity
    const total = Math.round((subtotal + Number(data.service_fee_ars || 0)) * 100) / 100
    const filas = [
      ['A nombre de', data.buyer_name],
      ...(data.buyer_empresa ? [['Empresa', data.buyer_empresa]] : []),
      ['Cantidad', data.quantity === 1 ? '1 entrada' : `${data.quantity} entradas`],
      ['Total pagado', formatARS(total, { centavos: true })],
      ['Orden', data.id],
    ]

    // Tarjeta centrada.
    //
    // El alto sale de la suma real de lo que va adentro, no de un número a ojo:
    // la fila de empresa es opcional y la de "ya utilizada" también, así que con
    // un alto fijo o sobra un hueco o el contenido se sale por abajo.
    const ALTO = {
      kicker: 46, tier: 34, fechas: 22, linea: 26,
      qr: 250, pie: 26, antesDeFilas: 34, fila: 20,
      usada: data.ticket_used_at ? 28 : 0,
      respiro: 30,
    }
    const m = 56
    const cardW = width - m * 2
    const cardH =
      Object.values(ALTO).reduce((a, b) => a + b, 0) - ALTO.fila + filas.length * ALTO.fila
    const cardY = height - 110 - cardH
    page.drawRectangle({
      x: m, y: cardY, width: cardW, height: cardH,
      color: TARJETA, borderColor: CELESTE, borderWidth: 1,
    })

    const cx = width / 2
    const centrar = (texto, font, size) => cx - font.widthOfTextAtSize(texto, size) / 2
    let y = cardY + cardH - ALTO.kicker

    const kicker = 'STARTUP WORLD CUP ARGENTINA'
    page.drawText(kicker, { x: centrar(kicker, bold, 10), y, size: 10, font: bold, color: CELESTE })

    y -= ALTO.tier
    const tier = data.tiers?.nombre || data.tier_id
    page.drawText(tier, { x: centrar(tier, bold, 26), y, size: 26, font: bold, color: BLANCO })

    y -= ALTO.fechas
    const fechas = '5, 6 y 7 de agosto 2026  ·  Buenos Aires'
    page.drawText(fechas, { x: centrar(fechas, normal, 12), y, size: 12, font: normal, color: GRIS })

    // Línea de corte
    y -= ALTO.linea
    for (let x = m + 28; x < m + cardW - 28; x += 9) {
      page.drawLine({
        start: { x, y }, end: { x: x + 4.5, y },
        thickness: 1, color: rgb(0.29, 0.42, 0.55),
      })
    }

    // QR sobre blanco
    const qrLado = ALTO.qr - 30
    y -= ALTO.qr
    page.drawRectangle({
      x: cx - qrLado / 2 - 12, y: y - 12,
      width: qrLado + 24, height: qrLado + 24,
      color: BLANCO,
    })
    page.drawImage(qr, { x: cx - qrLado / 2, y, width: qrLado, height: qrLado })

    y -= ALTO.pie
    const pie = 'Mostrá este código en la puerta'
    page.drawText(pie, { x: centrar(pie, bold, 10), y, size: 10, font: bold, color: GRIS })

    y -= ALTO.antesDeFilas
    for (const [label, valor] of filas) {
      page.drawText(label, { x: m + 34, y, size: 10, font: normal, color: GRIS })
      const v = String(valor)
      const size = label === 'Orden' ? 8 : 10
      const f = label === 'Orden' ? normal : bold
      page.drawText(v, {
        x: m + cardW - 34 - f.widthOfTextAtSize(v, size),
        y, size, font: f, color: BLANCO,
      })
      y -= ALTO.fila
    }

    if (data.ticket_used_at) {
      y -= 8
      const usada = 'ENTRADA YA UTILIZADA'
      page.drawText(usada, {
        x: centrar(usada, bold, 12), y, size: 12, font: bold,
        color: rgb(1, 0.46, 0.46),
      })
    }

    // Pie de página
    const nota = 'Guardá esta entrada. Si la perdés, está en el mail de confirmación.'
    page.drawText(nota, {
      x: centrar(nota, normal, 9), y: cardY - 30, size: 9, font: normal, color: GRIS,
    })

    const bytes = await pdf.save()
    const archivo = `entrada-swc-2026-${data.id.slice(0, 8)}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    // `attachment` es lo que hace que el navegador descargue en vez de abrir.
    res.setHeader('Content-Disposition', `attachment; filename="${archivo}"`)
    res.setHeader('Cache-Control', 'private, max-age=300')
    res.status(200).send(Buffer.from(bytes))
  } catch (err) {
    console.error('[entrada-pdf]', err)
    json(res, 500, { error: 'pdf_fallo' })
  }
}
