import { useMemo, useState } from 'react'
import { Boton, Tabs, type Opcion } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Dato, Datos } from '../ui/Campos'
import { Cargando, Chip, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { Hoja } from '../ui/Hoja'
import { Bloque, Limite, Operacion } from '../ui/Operacion'
import { Recurso } from '../ui/Recurso'
import Tabla, { type Columna } from '../ui/Tabla'
import { mensajeDeError } from '../lib/api'
import {
  accionOrden, fechaCorta, pesos, reenviarMail, traerOrdenes, useRecurso, type Orden,
} from '../lib/admin'

/**
 * Las compras que entraron por Mercado Pago.
 *
 * Es uno de los tres canales del evento —los otros dos, Luma y Startup Grind,
 * cobran por su cuenta y sólo llegan acá como CSV—, así que esta sección es la
 * única donde hay plata que se puede destrabar, liberar o marcar reembolsada.
 *
 * Hasta hace poco esto no existía en ninguna pantalla: ver una orden era una
 * query en el SQL Editor, y destrabar una que Mercado Pago aprobó pero el
 * webhook no acreditó dependía de que el comprador volviera solo al sitio. Si no
 * volvía, no la destrababa nadie.
 */
const ESTADOS: Record<Orden['status'], { label: string; tono: 'ok' | 'warn' | 'coral' | 'neutro' }> = {
  paid: { label: 'paid', tono: 'ok' },
  pending: { label: 'pending', tono: 'warn' },
  rejected: { label: 'rejected', tono: 'coral' },
  expired: { label: 'expired', tono: 'neutro' },
  refunded: { label: 'refunded', tono: 'neutro' },
}

type Filtro = 'todas' | 'paid' | 'pending' | 'problema'

function Ventas({ onSinSesion }: { onSinSesion: () => void }) {
  const { datos, error, cargando, recargar } = useRecurso(traerOrdenes, onSinSesion)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [abierta, setAbierta] = useState<Orden | null>(null)

  // En un memo: `|| []` devuelve un array nuevo en cada render y `visibles`
  // se recalcularía siempre.
  const ordenes = useMemo(() => datos?.ordenes || [], [datos])

  /** Lo que alguien tiene que mirar: pagada sin mail confirmado, o rechazada. */
  const esProblema = (o: Orden) => o.status === 'rejected' || (o.status === 'paid' && !o.mailEnviado)

  const cuentas = useMemo(() => ({
    todas: ordenes.length,
    paid: ordenes.filter(o => o.status === 'paid').length,
    pending: ordenes.filter(o => o.reservaCupo).length,
    problema: ordenes.filter(esProblema).length,
  }), [ordenes])

  const visibles = useMemo(() => {
    if (filtro === 'paid') return ordenes.filter(o => o.status === 'paid')
    if (filtro === 'pending') return ordenes.filter(o => o.reservaCupo)
    if (filtro === 'problema') return ordenes.filter(esProblema)
    return ordenes
  }, [ordenes, filtro])

  const columnas: Columna<Orden>[] = useMemo(() => [
    { clave: 'nombre', titulo: 'Buyer', orden: o => o.nombre, celda: o => o.nombre },
    { clave: 'email', titulo: 'Email', orden: o => o.email, celda: o => o.email, soloTabla: true },
    { clave: 'tier', titulo: 'Tier', orden: o => o.tier, celda: o => o.tier },
    { clave: 'cantidad', titulo: 'Tickets', orden: o => o.cantidad, celda: o => o.cantidad, numerica: true },
    { clave: 'total', titulo: 'Total', orden: o => o.total, celda: o => pesos(o.total), numerica: true },
    {
      clave: 'status',
      titulo: 'Status',
      orden: o => o.status,
      celda: o => (
        <span className="flex flex-wrap items-center gap-1.5">
          <Chip tono={ESTADOS[o.status].tono}>{ESTADOS[o.status].label}</Chip>
          {o.reservaCupo && <Chip tono="warn">holds a spot</Chip>}
          {o.status === 'paid' && !o.mailEnviado && <Chip tono="coral">no email</Chip>}
        </span>
      ),
    },
    {
      clave: 'creadaEn',
      titulo: 'Date',
      orden: o => o.creadaEn,
      celda: o => fechaCorta(o.creadaEn),
      soloTabla: true,
    },
  ], [])

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Roto error={error} onReintentar={recargar} />

  const t = datos?.totales

  const filtros: Opcion<Filtro>[] = [
    { id: 'todas', label: 'All', cuenta: cuentas.todas },
    { id: 'paid', label: 'Paid', cuenta: cuentas.paid },
    { id: 'pending', label: 'Holding a spot', cuenta: cuentas.pending },
    { id: 'problema', label: 'With a problem', cuenta: cuentas.problema },
  ]

  return (
    <>
      <Operacion
        contexto={
          <>
            <Bloque titulo="The till">
              <Datos>
                <Dato label="Collected" tono="ok">{t?.recaudadoTexto || '—'}</Dato>
                <Dato label="Paid purchases">{t?.pagadas ?? 0}</Dato>
                <Dato label="Tickets sold">{t?.entradas ?? 0}</Dato>
                <Dato label="Holding a spot" tono={t?.pendientes ? 'warn' : undefined}>
                  {t?.pendientes ?? 0}
                </Dato>
              </Datos>
            </Bloque>

            <Bloque titulo="What to look at first" className="mt-6">
              <p className="text-xs leading-relaxed text-gray-500">
                “With a problem” gathers the rejected ones and the paid ones whose email never
                went out. Both have someone waiting on the other side: one because they couldn't
                pay, the other because they paid and never got the ticket.
              </p>
              {cuentas.problema > 0 && (
                <Boton tono="secundario" tam="sm" className="mt-3" onClick={() => setFiltro('problema')}>
                  See the {cuentas.problema}
                </Boton>
              )}
            </Bloque>

            <Limite>
              Marking an order refunded takes its tickets off the list and gives the spot
              back, but it <strong>moves no money</strong>: the refund itself happens in
              Mercado Pago.
            </Limite>
          </>
        }
      >
        <Tarjetas>
          <Tarjeta label="Collected" valor={t?.recaudadoTexto || '—'} detalle="service fee included" tono="ok" />
          <Tarjeta label="Paid purchases" valor={t?.pagadas ?? 0} />
          <Tarjeta label="Tickets sold" valor={t?.entradas ?? 0} detalle="through Mercado Pago" />
          <Tarjeta
            label="Holding a spot"
            valor={t?.pendientes ?? 0}
            tono={t?.pendientes ? 'warn' : undefined}
            detalle="pending, not expired"
          />
        </Tarjetas>

        <Tabs opciones={filtros} valor={filtro} onCambio={setFiltro} etiqueta="Filter the purchases" />

        <div className="mt-4">
          <Tabla
            columnas={columnas}
            filas={visibles}
            claveDe={o => o.id}
            onFila={setAbierta}
            vacio="No purchases with that filter."
          />
        </div>
      </Operacion>

      {abierta && (
        <FichaOrden
          orden={abierta}
          onCerrar={() => setAbierta(null)}
          onCambio={() => { setAbierta(null); recargar() }}
        />
      )}
    </>
  )
}

function FichaOrden({ orden, onCerrar, onCambio }: {
  orden: Orden
  onCerrar: () => void
  onCambio: () => void
}) {
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState('')

  async function correr(que: string, fn: () => Promise<unknown>, exito?: string) {
    setOcupado(que)
    setError('')
    setAviso('')
    try {
      await fn()
      if (exito) setAviso(exito)
      else onCambio()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setOcupado('')
    }
  }

  return (
    <Hoja
      titulo={orden.nombre}
      subtitulo={orden.email}
      onCerrar={onCerrar}
      chips={<Chip tono={ESTADOS[orden.status].tono}>{ESTADOS[orden.status].label}</Chip>}
    >
      <Recurso
        titulo={orden.tier}
        subtitulo={`${orden.cantidad} ${orden.cantidad === 1 ? 'ticket' : 'tickets'} · ${fechaCorta(orden.creadaEn)}`}
        valor={pesos(orden.total, true)}
        detalle="total"
        tono={orden.status === 'paid' ? 'ok' : 'accent'}
      />

      <div className="mt-5">
        <Datos>
          <Dato label="Subtotal">{pesos(orden.subtotal, true)}</Dato>
          <Dato label="Service fee">{pesos(orden.cargo, true)}</Dato>
          {orden.status === 'pending' && <Dato label="Expires">{fechaCorta(orden.venceEn)}</Dato>}
          {orden.pagoId && <Dato label="MP payment">{orden.pagoId}</Dato>}
          {orden.detalle && <Dato label="Detail">{orden.detalle}</Dato>}
          <Dato label="Ticket email" tono={orden.mailEnviado ? undefined : 'coral'}>
            {orden.mailEnviado ? fechaCorta(orden.mailEnviado) : "didn't go out"}
          </Dato>
        </Datos>
      </div>

      {error && <Aviso tono="error" className="mt-4">{error}</Aviso>}
      {aviso && <Aviso tono="ok" className="mt-4">{aviso}</Aviso>}

      <div className="mt-5 flex flex-col gap-2">
        {/* Preguntarle a Mercado Pago por esta orden y acreditarla si el pago
            está aprobado. Es idempotente: si ya estaba, no vuelve a mandar el
            mail ni a emitir tokens. */}
        {orden.status !== 'paid' && (
          <Boton
            tam="lg"
            ancho
            onClick={() => correr('rec', () => accionOrden(orden.id, 'reconciliar'))}
            ocupado={ocupado === 'rec' ? 'Asking Mercado Pago…' : undefined}
            disabled={Boolean(ocupado)}
          >
            Reconcile against Mercado Pago
          </Boton>
        )}

        {orden.status === 'paid' && (
          <Boton
            tono="secundario"
            tam="lg"
            ancho
            onClick={() => correr('mail', () => reenviarMail({ orden: orden.id }), 'Email resent.')}
            ocupado={ocupado === 'mail' ? 'Sending…' : undefined}
            disabled={Boolean(ocupado)}
          >
            Resend the ticket email
          </Boton>
        )}

        {/* Liberar = vencerla. `stock_disponible` sólo cuenta las pendientes con
            `expires_at > now()`, así que con esto el cupo vuelve a la venta. No
            se borra nada. */}
        {orden.reservaCupo && (
          <Boton
            tono="fantasma"
            tam="lg"
            ancho
            onClick={() => correr('lib', () => accionOrden(orden.id, 'liberar'))}
            ocupado={ocupado === 'lib' ? 'Releasing…' : undefined}
            disabled={Boolean(ocupado)}
          >
            Release the spot it holds
          </Boton>
        )}

        {orden.status === 'paid' && (
          <Boton
            tono="peligro"
            tam="lg"
            ancho
            onClick={() => correr('ree', () => accionOrden(orden.id, 'reembolsar'))}
            ocupado={ocupado === 'ree' ? 'Marking…' : undefined}
            disabled={Boolean(ocupado)}
          >
            Mark as refunded
          </Boton>
        )}
      </div>

      {orden.status === 'paid' && (
        <Aviso tono="info" className="mt-4">
          Marking it refunded takes its {orden.cantidad === 1 ? 'ticket' : `${orden.cantidad} tickets`} off
          the door list and gives the spot back. The money is refunded in Mercado Pago, not here.
        </Aviso>
      )}
    </Hoja>
  )
}

export default Ventas
