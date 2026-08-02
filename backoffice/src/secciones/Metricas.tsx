import { useState } from 'react'
import { Barra, Cargando, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { traerMetricas, useRecurso, type Cuenta, type Metricas as DatosMetricas } from '../lib/admin'

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

  return (
    <>
      {/* La plata y el cupo salen de las MISMAS cuentas que sirven Ventas y
          Stock, calculadas una sola vez en el servidor. Están acá porque
          "cómo viene el evento" no se contesta sin ellas, y hasta ahora había
          que abrir tres pestañas y sumar de cabeza. */}
      <Tarjetas>
        <Tarjeta
          label="Recaudado"
          valor={datos.ventas.recaudadoTexto}
          tono="ok"
          detalle={`${datos.ventas.entradas} entradas por la web`}
        />
        <Tarjeta
          label="Cupo web libre"
          valor={datos.cupo.libre}
          tono={datos.cupo.libre === 0 ? 'coral' : datos.cupo.libre <= 5 ? 'warn' : undefined}
          detalle={`de ${datos.cupo.total} · ${datos.cupo.tomado} tomado`}
        />
        <Tarjeta label="En la lista" valor={datos.total} detalle="los tres canales" />
        <Tarjeta label="Ingresos registrados" valor={entradosTotal} tono="ok" detalle="los tres días" />
      </Tarjetas>

      <Tarjetas>
        <Tarjeta
          label="Por canal"
          valor={datos.porCanal.length}
          detalle={datos.porCanal.map(c => `${c.clave}: ${c.total}`).join(' · ')}
        />
        <Tarjeta
          label="Reservando cupo"
          valor={datos.ventas.pendientes}
          tono={datos.ventas.pendientes ? 'warn' : undefined}
          detalle="pendientes sin vencer"
        />
        <Tarjeta
          label="Sin día reconocido"
          valor={datos.sinDia}
          tono={datos.sinDia ? 'coral' : undefined}
          detalle="no aparecen en ningún día"
        />
        <Tarjeta label="Compras pagadas" valor={datos.ventas.pagadas} detalle="por la web" />
      </Tarjetas>

      <Resumen datos={datos.resumen} />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {datos.porDia.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setDia(i)}
            className={`rounded-full px-4 py-2 text-xs font-black transition-colors ${
              i === dia ? 'bg-swc-accent text-swc-bg' : 'bg-white/[0.06] text-swc-muted'
            }`}
          >
            {d.nombre}
            <span className="ml-1.5 opacity-70">{d.entraron}/{d.esperados}</span>
          </button>
        ))}
        <button
          onClick={recargar}
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-black text-swc-muted active:scale-95"
        >
          Actualizar
        </button>
      </div>

      {activo && (
        <>
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-black text-swc-light">{activo.nombre}</h2>
              <p className="text-sm font-bold tabular-nums text-swc-muted">
                <span className="text-swc-ok">{activo.entraron}</span> de {activo.esperados}
              </p>
            </div>
            <Barra valor={activo.entraron} maximo={activo.esperados} tono="ok" />
            <p className="mt-2 text-xs text-gray-500">
              Faltan {Math.max(0, activo.esperados - activo.entraron)}. El total cuenta
              ingresos, no personas: quien salió y volvió aparece dos veces.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Serie titulo="Por hora" datos={activo.porHora} vacio="Todavía no entró nadie." />
            <Serie titulo="Por canal" datos={activo.porCanal} vacio="Sin ingresos." />
            <Serie
              titulo="Por quién acreditó"
              datos={activo.porPuerta}
              vacio="Sin ingresos."
              nota="Sale de quién cargó su nombre al entrar al backoffice."
            />
          </div>
        </>
      )}
    </>
  )
}

/**
 * Los tres días juntos.
 *
 * El resto de la pantalla cuenta INGRESOS de un día. Acá se cuentan PERSONAS a
 * lo largo del evento, que es la única forma de contestar dos preguntas que un
 * día suelto no contesta: si el contenido retuvo, y qué canal trae gente que
 * efectivamente aparece.
 */
function Resumen({ datos }: { datos: DatosMetricas['resumen'] }) {
  const { personas, entraron, noShow, recurrencia, porCanal, altas } = datos
  const tasaGeneral = personas ? Math.round((entraron / personas) * 100) : 0
  const maxRec = Math.max(1, ...recurrencia.map(r => r.personas))

  return (
    <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <h2 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
        Los tres días juntos · personas, no ingresos
      </h2>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Numero label="Aparecieron" valor={`${entraron}`} detalle={`de ${personas} · ${tasaGeneral}%`} tono="ok" />
        <Numero
          label="No vinieron"
          valor={`${noShow}`}
          detalle="en la lista, nunca entraron"
          tono={noShow > personas * 0.4 ? 'coral' : undefined}
        />
        <Numero
          label="Vinieron más de un día"
          valor={`${recurrencia.filter(r => r.dias > 1).reduce((a, r) => a + r.personas, 0)}`}
          detalle="volvieron al menos una vez"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
            Cuántos días vino cada uno
          </h3>
          <ul className="flex flex-col gap-2.5">
            {recurrencia.map(r => (
              <li key={r.dias}>
                <div className="mb-1 flex justify-between gap-3 text-xs">
                  <span className="text-gray-300">{r.dias === 1 ? '1 día' : `${r.dias} días`}</span>
                  <span className="font-bold tabular-nums text-swc-light">{r.personas}</span>
                </div>
                <Barra valor={r.personas} maximo={maxRec} tono={r.dias === 3 ? 'ok' : undefined} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-600">
            Mucha gente de un solo día es un evento que se vació; mucha de tres, uno que retuvo.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
            Asistencia por canal
          </h3>
          {porCanal.length === 0 ? (
            <p className="text-sm text-gray-600">Sin datos todavía.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {porCanal.map(c => (
                <li key={c.clave}>
                  <div className="mb-1 flex justify-between gap-3 text-xs">
                    <span className="truncate text-gray-300">{c.clave}</span>
                    <span className="shrink-0 tabular-nums text-gray-400">
                      <span className="font-bold text-swc-light">{c.entraron}</span>
                      /{c.esperados} · {c.tasa}%
                    </span>
                  </div>
                  <Barra valor={c.tasa} maximo={100} tono={c.tasa >= 70 ? 'ok' : undefined} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-gray-600">
            Un canal que trae 200 y vienen 40 vale menos que uno que trae 60 y vienen 55.
          </p>
        </div>
      </div>

      {altas.length > 0 && (
        <div className="mt-5 border-t border-white/5 pt-4">
          <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
            Altas hechas en el check-in
          </h3>
          <p className="text-sm text-gray-300">
            {altas.map(a => `${a.clave}: ${a.total}`).join(' · ')}
          </p>
        </div>
      )}
    </section>
  )
}

function Numero({ label, valor, detalle, tono }: {
  label: string
  valor: string
  detalle: string
  tono?: 'ok' | 'coral'
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums ${
        tono === 'ok' ? 'text-swc-ok' : tono === 'coral' ? 'text-swc-coral' : 'text-swc-light'
      }`}>
        {valor}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{detalle}</p>
    </div>
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
      <h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
        {titulo}
      </h3>

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
