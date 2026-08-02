import type { Dia } from '../lib/tipos'

/**
 * Lo que queda fijo arriba: el día, cuánta gente entró, el buscador y —cuando
 * corresponde— el aviso de que no hay señal.
 *
 * El buscador es lo que más se usa, así que va pegado al pulgar y con autofocus:
 * en la puerta se tipean tres letras del apellido y listo.
 */
type Props = {
  dias: Dia[]
  diaActivo: string
  onDia: (id: string) => void
  adentro: number
  total: number
  busqueda: string
  onBusqueda: (v: string) => void
  sinConexion: boolean
  enCola: number
}

function Cabecera({
  dias, diaActivo, onDia, adentro, total, busqueda, onBusqueda, sinConexion, enCola,
}: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-swc-bg/95 backdrop-blur">
      <div className="mx-auto max-w-lg px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {dias.map(d => (
              <button
                key={d.id}
                onClick={() => onDia(d.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
                  d.id === diaActivo ? 'bg-swc-accent text-swc-bg' : 'bg-white/[0.06] text-swc-muted'
                }`}
              >
                {d.label} {d.fecha.slice(-2).replace(/^0/, '')}
              </button>
            ))}
          </div>
          <p className="shrink-0 text-xs font-bold tabular-nums text-swc-muted">
            <span className="text-swc-light">{adentro}</span>/{total}
          </p>
        </div>

        <input
          value={busqueda}
          onChange={e => onBusqueda(e.target.value)}
          placeholder="Buscar por apellido, mail o empresa"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          className="mt-3 w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-4 py-3 text-base text-swc-light placeholder:text-gray-600 outline-none focus:border-swc-accent"
        />
      </div>

      {(sinConexion || enCola > 0) && (
        <p className="bg-swc-warn/15 px-4 py-1.5 text-center text-[11px] font-bold text-swc-warn">
          {sinConexion ? 'Sin conexión' : 'Sincronizando'}
          {enCola > 0 && ` · ${enCola} sin mandar`}
        </p>
      )}
    </header>
  )
}

export default Cabecera
