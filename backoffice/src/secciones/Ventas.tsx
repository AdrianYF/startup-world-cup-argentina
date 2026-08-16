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
  accionOrden, fechaCorta, pesos, reenviarMail, traerOrdenes, useRecurso, type Orden, type Venta,
} from '../lib/admin'
import { esVip, etiquetaVip } from '../lib/tipos'

/**
 * Todas las entradas del evento, con su plata y su canal.
 *
 * La unidad es la ENTRADA y no la compra. Antes era la compra, y la lista
 * mostraba 9 filas —las órdenes de Mercado Pago— debajo de un total que decía
 * 148 entradas: parecían faltar 139. No faltaban, pero tampoco estaban: Startup
 * Grind y Luma cobran por su cuenta y no generan una orden nuestra, sólo la
 * persona.
 *
 * Mercado Pago sigue siendo el único canal con plata que se puede destrabar,
 * liberar o marcar reembolsada, así que sólo sus filas abren la ficha con
 * acciones. Las otras son de lectura: lo que pasó con ellas pasó en la
 * plataforma del canal, no acá.
 */
const TONO_ESTADO: Record<string, 'ok' | 'warn' | 'coral' | 'neutro'> = {
  pagada: 'ok',
  confirmada: 'ok',
  reservando: 'warn',
  'sin pagar': 'neutro',
  rechazada: 'coral',
  reembolsada: 'neutro',
}

/** El estado de una orden de Mercado Pago, para la ficha. */
const ESTADOS: Record<Orden['status'], { label: string; tono: 'ok' | 'warn' | 'coral' | 'neutro' }> = {
  paid: { label: 'paid', tono: 'ok' },
  pending: { label: 'pending', tono: 'warn' },
  rejected: { label: 'rejected', tono: 'coral' },
  expired: { label: 'expired', tono: 'neutro' },
  refunded: { label: 'refunded', tono: 'neutro' },
}

const NOMBRE_CANAL: Record<string, string> = {
  MP: 'Mercado Pago',
  startupgrind: 'Startup Grind',
  luma: 'Luma',
  puerta: 'Puerta',
}

type Filtro = 'todas' | 'vip' | 'MP' | 'startupgrind' | 'luma' | 'sinPagar' | 'problema'

function Ventas({ onSinSesion }: { onSinSesion: () => void }) {
  const { datos, error, cargando, recargar } = useRecurso(traerOrdenes, onSinSesion)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [abierta, setAbierta] = useState<Orden | null>(null)

  // En un memo: `|| []` devuelve un array nuevo en cada render y `visibles`
  // se recalcularía siempre.
  const ordenes = useMemo(() => datos?.ordenes || [], [datos])
  const ventas = useMemo(() => datos?.ventas || [], [datos])

  /** La orden detrás de una fila, si es de Mercado Pago. */
  const ordenDe = (v: Venta) => (v.ordenId ? ordenes.find(o => o.id === v.ordenId) || null : null)

  /** Lo que alguien tiene que mirar: pagada sin mail confirmado, o rechazada. */
  const esProblema = (v: Venta) => {
    const o = ordenDe(v)
    return !!o && (o.status === 'rejected' || (o.status === 'paid' && !o.mailEnviado))
  }

  const cuentas = useMemo(() => ({
    todas: ventas.length,
    vip: ventas.filter(v => esVip(v.entrada)).length,
    MP: ventas.filter(v => v.canal === 'MP').length,
    startupgrind: ventas.filter(v => v.canal === 'startupgrind').length,
    luma: ventas.filter(v => v.canal === 'luma').length,
    sinPagar: ventas.filter(v => !v.emitida).length,
    problema: ventas.filter(esProblema).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [ventas, ordenes])

  const visibles = useMemo(() => {
    if (filtro === 'vip') return ventas.filter(v => esVip(v.entrada))
    if (filtro === 'sinPagar') return ventas.filter(v => !v.emitida)
    if (filtro === 'problema') return ventas.filter(esProblema)
    if (filtro !== 'todas') return ventas.filter(v => v.canal === filtro)
    return ventas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventas, ordenes, filtro])

  const columnas: Columna<Venta>[] = useMemo(() => [
    { clave: 'nombre', titulo: 'Person', orden: v => v.nombre, celda: v => v.nombre },
    { clave: 'email', titulo: 'Email', orden: v => v.email, celda: v => v.email, soloTabla: true },
    {
      clave: 'canal',
      titulo: 'Channel',
      orden: v => v.canal,
      celda: v => NOMBRE_CANAL[v.canal] || v.canal,
    },
    {
      clave: 'entrada',
      titulo: 'Ticket',
      // Los VIP primero al ordenar: son 10 sobre 154 y es lo que se busca.
      orden: v => `${esVip(v.entrada) ? 0 : 1}${v.entrada}`,
      celda: v => (
        <span className="flex items-center gap-1.5">
          {etiquetaVip(v.entrada) && <Chip tono="oro">{etiquetaVip(v.entrada)}</Chip>}
          {v.entrada}
        </span>
      ),
    },
    {
      clave: 'monto',
      titulo: 'Price',
      orden: v => v.monto ?? -1,
      // `null` no es $0: el canal no informó el precio. Decirlo con un guion
      // evita que una lista sin dato se lea como un evento regalado.
      celda: v => (v.monto === null ? <span className="text-gray-600">sin dato</span> : pesos(v.monto)),
      numerica: true,
    },
    {
      clave: 'estado',
      titulo: 'Status',
      orden: v => v.estado,
      celda: v => {
        const o = ordenDe(v)
        return (
          <span className="flex flex-wrap items-center gap-1.5">
            <Chip tono={TONO_ESTADO[v.estado] || 'neutro'}>{v.estado}</Chip>
            {o?.reservaCupo && <Chip tono="warn">reserva cupo</Chip>}
            {o?.status === 'paid' && !o.mailEnviado && <Chip tono="coral">sin mail</Chip>}
            {v.usadaEn && <Chip tono="ok">acreditada</Chip>}
          </span>
        )
      },
    },
    {
      clave: 'creadaEn',
      titulo: 'Date',
      orden: v => ordenDe(v)?.creadaEn || '',
      celda: v => {
        const o = ordenDe(v)
        return o ? fechaCorta(o.creadaEn) : <span className="text-gray-600">—</span>
      },
      soloTabla: true,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [ordenes])

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Roto error={error} onReintentar={recargar} />

  const t = datos?.totales

  // Los tres canales parten el total sin superponerse. «Sin pagar» y «Con
  // problema» son miradas transversales: caen dentro de Mercado Pago, que es el
  // único canal donde una compra puede quedar a mitad de camino.
  const filtros: Opcion<Filtro>[] = [
    { id: 'todas', label: 'All', cuenta: cuentas.todas },
    { id: 'vip', label: 'VIP', cuenta: cuentas.vip },
    { id: 'MP', label: 'Mercado Pago', cuenta: cuentas.MP },
    { id: 'startupgrind', label: 'Startup Grind', cuenta: cuentas.startupgrind },
    { id: 'luma', label: 'Luma', cuenta: cuentas.luma },
    { id: 'sinPagar', label: 'Unpaid', cuenta: cuentas.sinPagar },
    { id: 'problema', label: 'With a problem', cuenta: cuentas.problema },
  ]

  return (
    <>
      <Operacion
        contexto={
          <>
            <Bloque titulo="The till">
              <Datos>
                <Dato label="Collected · whole event" tono="ok">{t?.recaudadoTexto || '—'}</Dato>
                {/* Los canales por separado: sin esto, «recaudado» es un número
                    que no se puede conciliar contra ninguna cuenta, porque
                    ninguna cuenta cobró ese total. */}
                {(t?.canales || []).filter(c => c.entradas > 0).map(c => (
                  <Dato key={c.id} label={`· ${c.nombre}`}>
                    {c.montoTexto} <span className="text-gray-500">· {c.entradas}</span>
                  </Dato>
                ))}
                <Dato label="Paid purchases">{t?.pagadas ?? 0}</Dato>
                <Dato label="Holding a spot" tono={t?.pendientes ? 'warn' : undefined}>
                  {t?.pendientes ?? 0}
                </Dato>
              </Datos>
            </Bloque>

            <Bloque titulo="What to look at first" className="mt-6">
              <p className="text-xs leading-relaxed text-gray-500">
                The list is <strong>all three channels</strong>, one row per ticket: the{' '}
                {t?.entradasTotales ?? 0} issued plus {cuentas.sinPagar} purchases that were never
                paid. Only the Mercado Pago ones can be opened — whatever happens to a Startup
                Grind or Luma one gets fixed in that channel's platform.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                “VIP” gathers the {cuentas.vip} from all three channels, each of which names them
                its own way: «Entrada VIP» in Startup Grind, «Invitado VIP» in Luma. Sorting the
                column left them apart.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                “Unpaid” are the ones that were started and expired. They cost no spot and no
                money, but they are people who tried to buy and couldn't: worth looking into.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
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
          <Tarjeta
            label="Collected"
            valor={t?.recaudadoTexto || '—'}
            detalle={`${t?.canales?.filter(c => c.entradas > 0).length ?? 0} channels · ${t?.entradasTotales ?? 0} tickets`}
            tono="ok"
          />
          <Tarjeta
            label="Through Mercado Pago"
            valor={t?.propiaTexto || '—'}
            detalle={`${t?.entradas ?? 0} tickets · what the site charged`}
          />
          <Tarjeta label="Paid purchases" valor={t?.pagadas ?? 0} detalle="own sales" />
          <Tarjeta
            label="Holding a spot"
            valor={t?.pendientes ?? 0}
            tono={t?.pendientes ? 'warn' : undefined}
            detalle="pending, not expired"
          />
        </Tarjetas>

        <Tabs opciones={filtros} valor={filtro} onCambio={setFiltro} etiqueta="Filter the tickets" />

        <div className="mt-4">
          <Tabla
            columnas={columnas}
            filas={visibles}
            claveDe={v => v.id}
            // Sólo Mercado Pago abre ficha: es el único canal donde hay algo que
            // hacer. Lo que le pase a una entrada de Startup Grind o de Luma se
            // arregla en la plataforma del canal, no acá.
            onFila={v => setAbierta(ordenDe(v))}
            vacio="No tickets with that filter."
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
