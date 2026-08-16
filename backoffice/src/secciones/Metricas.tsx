import { useState } from 'react'
import { Boton, Pildoras, type Opcion } from '../ui/Acciones'
import { Dato, Datos, Rotulo } from '../ui/Campos'
import { Barra, Cargando, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { Bloque, Limite, Operacion } from '../ui/Operacion'
import { nombreCanal } from '../lib/canales'
import { traerMetricas, useRecurso, type Cuenta } from '../lib/admin'

/**
 * El pulso del evento: cuántos entraron, cuándo y por qué puerta.
 *
 * Sin librería de gráficos: son barras proporcionales sobre el máximo de cada
 * serie. Traer una dependencia de charts a un bundle que se abre en la fila de
 * entrada, para mostrar seis barras, no se paga.
 */
function Metricas({ onSinSesion }: { onSinSesion: () => void }) {
  const { datos, error, cargando, recargar } = useRecurso(traerMetricas, onSinSesion)
  const [dia, setDia] = useState(0)

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Roto error={error} onReintentar={recargar} />
  if (!datos) return null

  const activo = datos.porDia[dia]
  const entradosTotal = datos.porDia.reduce((a, d) => a + d.entraron, 0)

  const opcionesDia: Opcion<string>[] = datos.porDia.map((d, i) => ({
    id: String(i),
    label: d.nombre,
    cuenta: d.entraron,
  }))

  return (
    <Operacion
      contexto={
        <>
          <Bloque titulo="The whole event">
            <Datos>
              <Dato label="People">{datos.resumen.personas}</Dato>
              <Dato label="Came in" tono="ok">{datos.resumen.entraron}</Dato>
              <Dato label="No show" tono={datos.resumen.noShow ? 'warn' : undefined}>
                {datos.resumen.noShow}
              </Dato>
              <Dato label="Check-ins recorded">{entradosTotal}</Dato>
            </Datos>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              This counts people. The check-in number is higher: whoever stepped out and came
              back shows up twice.
            </p>
          </Bloque>

          {/* La comparación que antes no se podía hacer: cuánta gente trajo cada
              canal y qué proporción de esa gente terminó entrando. Con «venta
              propia» como bucket único, Mercado Pago no se podía cruzar contra
              Luma ni contra Startup Grind. */}
          {datos.resumen.porCanal.length > 0 && (
            <Bloque titulo="By channel" className="mt-6">
              <ul className="flex flex-col gap-2.5">
                {datos.resumen.porCanal.map(c => (
                  <li key={c.clave}>
                    <div className="mb-1 flex justify-between gap-3 text-xs">
                      <span className="truncate text-gray-300">{nombreCanal(c.clave)}</span>
                      <span className="shrink-0 font-bold tabular-nums text-swc-light">
                        {c.entraron}/{c.esperados}
                        {/* `tasa` ya viene redondeada a porcentaje entero desde
                            el servidor (api/_lib/admin.js). */}
                        <span className="ml-1.5 font-normal text-gray-500">{c.tasa}%</span>
                      </span>
                    </div>
                    <Barra valor={c.entraron} maximo={c.esperados} tono="ok" />
                  </li>
                ))}
              </ul>
            </Bloque>
          )}

          {datos.resumen.recurrencia.length > 0 && (
            <Bloque titulo="How many days each one came" className="mt-6">
              <Datos>
                {datos.resumen.recurrencia.map(r => (
                  <Dato key={r.dias} label={r.dias === 1 ? '1 day' : `${r.dias} days`}>
                    {r.personas}
                  </Dato>
                ))}
              </Datos>
            </Bloque>
          )}

          <Bloque titulo="Money and caps" className="mt-6">
            <Datos>
              <Dato label="Collected · whole event" tono="ok">{datos.ventas.recaudadoTexto}</Dato>
              {datos.ventas.canales.filter(c => c.entradas > 0).map(c => (
                <Dato key={c.id} label={`· ${c.nombre}`}>
                  {c.montoTexto} <span className="text-gray-500">· {c.entradas}</span>
                </Dato>
              ))}
              <Dato label="MP spots left" tono={datos.cupo.libre === 0 ? 'coral' : undefined}>
                {datos.cupo.libre} of {datos.cupo.total}
              </Dato>
            </Datos>
          </Bloque>

          <Limite>
            Everything comes from the same numbers behind “Sales” and “Stock”, computed once
            on the server. If a number doesn't add up, the problem is in the data, not on this
            screen.
          </Limite>
        </>
      }
    >
      <Tarjetas>
        <Tarjeta
          label="Collected"
          valor={datos.ventas.recaudadoTexto}
          tono="ok"
          detalle={`${datos.ventas.entradasTotales} tickets · all channels`}
        />
        <Tarjeta
          label="MP spots left"
          valor={datos.cupo.libre}
          tono={datos.cupo.libre === 0 ? 'coral' : datos.cupo.libre <= 5 ? 'warn' : undefined}
          detalle={`of ${datos.cupo.total} · ${datos.cupo.tomado} taken`}
        />
        <Tarjeta label="On the list" valor={datos.total} detalle="all three channels" />
        <Tarjeta
          label="No recognized day"
          valor={datos.sinDia}
          tono={datos.sinDia ? 'coral' : undefined}
          detalle="they show up at no door"
        />
      </Tarjetas>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Pildoras
          opciones={opcionesDia}
          valor={String(dia)}
          onCambio={id => setDia(Number(id))}
          etiqueta="Event day"
        />
        <Boton tono="fantasma" tam="sm" onClick={recargar}>Refresh</Boton>
      </div>

      {activo && (
        <>
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-black text-swc-light">{activo.nombre}</h2>
              <p className="text-sm font-bold tabular-nums text-swc-muted">
                <span className="text-swc-ok">{activo.entraron}</span> of {activo.esperados}
              </p>
            </div>
            <Barra valor={activo.entraron} maximo={activo.esperados} tono="ok" />
            <p className="mt-2 text-xs text-gray-500">
              {Math.max(0, activo.esperados - activo.entraron)} to go. The total counts
              check-ins, not people: whoever stepped out and came back shows up twice.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Serie titulo="By hour" datos={activo.porHora} vacio="Nobody has come in yet." />
            <Serie
              titulo="By channel"
              datos={activo.porCanal.map(c => ({ ...c, clave: nombreCanal(c.clave) }))}
              vacio="No check-ins."
            />
            <Serie
              titulo="By who checked them in"
              datos={activo.porPuerta}
              vacio="No check-ins."
              nota="Comes from whoever typed their name when logging into the backoffice."
            />
          </div>
        </>
      )}
    </Operacion>
  )
}

function Serie({ titulo, datos, vacio, nota }: {
  titulo: string
  datos: Cuenta[]
  vacio: string
  nota?: string
}) {
  const maximo = Math.max(1, ...datos.map(d => d.total))

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <Rotulo className="mb-3">{titulo}</Rotulo>

      {datos.length === 0 ? (
        <p className="text-sm text-gray-600">{vacio}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {datos.map(d => (
            <li key={d.clave}>
              <div className="mb-1 flex justify-between gap-3 text-xs">
                <span className="truncate text-gray-300">{d.clave}</span>
                <span className="shrink-0 font-bold tabular-nums text-swc-light">{d.total}</span>
              </div>
              <Barra valor={d.total} maximo={maximo} />
            </li>
          ))}
        </ul>
      )}

      {nota && <p className="mt-3 text-xs text-gray-600">{nota}</p>}
    </section>
  )
}

export default Metricas
