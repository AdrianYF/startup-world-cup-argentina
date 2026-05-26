/**
 * Trading card estilo "Ultimate Team" - NO Panini.
 * Diferencias clave con Panini:
 *  - proporción 4:5 (vertical pero más ancha)
 *  - split diagonal del fondo, no horizontal
 *  - rating OVR en círculo superior izquierdo (FIFA UT)
 *  - 4 stats abreviadas abajo (VIS / TEC / TRC / ESC)
 *  - posición tipo "FOUNDER", no "DEL" o "MED"
 *  - holo foil border conic-gradient
 *  - sin franja blanca con bandera ni nombre en franja de color sólido
 */

export type StartupCardProps = {
  nombre?: string
  sector?: string
  ciudad?: string
  ovr?: number | string
  posicion?: string
  numero?: string
  pitch?: string
  tags?: string[]
  stats?: {
    vis?: number  // Visión
    tec?: number  // Tech
    trc?: number  // Tracción
    esc?: number  // Escalabilidad
  }
  emoji?: string
  rarity?: 'rookie' | 'rare' | 'legend'
}

const rarityStyles: Record<NonNullable<StartupCardProps['rarity']>, {
  label: string
  bg: string
  ring: string
}> = {
  rookie: {
    label: 'ROOKIE · SWC AR 26',
    bg: 'bg-gradient-to-br from-[#75AADB] via-[#5a93c5] to-[#75AADB]',
    ring: 'from-[#bcd5ea] via-[#75AADB] to-[#75AADB]',
  },
  rare: {
    label: 'RARE · SWC AR 26',
    bg: 'bg-gradient-to-br from-[#75AADB] via-[#5a93c5] to-[#5a93c5]',
    ring: 'from-[#bcd5ea] via-[#75AADB] to-[#5a93c5]',
  },
  legend: {
    label: 'LEGEND · SWC AR 26',
    bg: 'bg-gradient-to-br from-[#75AADB] via-[#75AADB] to-[#5a93c5]',
    ring: 'from-[#75AADB] via-[#75AADB] to-[#5a93c5]',
  },
}

export function StartupCard({
  nombre = 'Tu Startup',
  sector = 'SaaS',
  ciudad = 'Buenos Aires',
  ovr = '+200',
  posicion = 'FOUNDER',
  numero = '001',
  pitch = 'Acá va tu pitch en una línea - eso que vas a contar en el escenario.',
  tags = ['SaaS', 'B2B', 'LATAM'],
  stats = { vis: 88, tec: 91, trc: 82, esc: 84 },
  emoji = '🚀',
  rarity = 'rookie',
}: StartupCardProps) {
  const r = rarityStyles[rarity]
  const statItems: { key: string; label: string; value: number }[] = [
    { key: 'vis', label: 'VIS', value: stats.vis ?? 80 },
    { key: 'tec', label: 'TEC', value: stats.tec ?? 80 },
    { key: 'trc', label: 'TRC', value: stats.trc ?? 80 },
    { key: 'esc', label: 'ESC', value: stats.esc ?? 80 },
  ]

  return (
    <div className="relative font-sans select-none" style={{ aspectRatio: '4 / 5' }}>
      {/* Carta */}
      <div className={`relative h-full rounded-2xl overflow-hidden border border-[#75AADB]/40 ${r.bg}`}>

        {/* Diagonal split - capa secundaria */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              'linear-gradient(135deg, transparent 0%, transparent 45%, rgba(255,255,255,0.1) 50%, transparent 55%, transparent 100%)',
          }}
          aria-hidden
        />

        {/* Patrón de grid tech */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" aria-hidden>
          <defs>
            <pattern id="card-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#card-grid)" />
        </svg>

        {/* Sunburst sutil detrás del logo */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <div
            className="w-3/4 h-3/4 opacity-[0.18]"
            style={{
              background:
                'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.15) 0deg 8deg, transparent 8deg 16deg)',
              borderRadius: '50%',
              maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
            }}
          />
        </div>

        {/* Contenido */}
        <div className="relative h-full flex flex-col p-5 text-white">

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            {/* OVR + posición */}
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/40 shadow-lg">
                <span className={`font-black leading-none tracking-tighter ${String(ovr).length > 2 ? 'text-2xl' : 'text-4xl'}`}>{ovr}</span>
              </div>
              <span className="mt-1.5 text-[10px] font-black tracking-widest opacity-90">{posicion}</span>
            </div>

            {/* Numero + rarity */}
            <div className="text-right">
              <div className="text-[9px] font-black tracking-widest opacity-80">{r.label}</div>
              <div className="text-[10px] font-bold opacity-60 mt-0.5">N° {numero} / 010</div>
              <div className="mt-2 text-[10px] font-black tracking-widest text-white/90 inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/20">
                🇦🇷 ARG
              </div>
            </div>
          </div>

          {/* Logo / foto principal */}
          <div className="flex-1 flex items-center justify-center my-2">
            <div className="relative w-32 h-32 lg:w-36 lg:h-36 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl">
              <span className="text-6xl lg:text-7xl drop-shadow-lg">{emoji}</span>
              {/* shine */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.2) 100%)',
                }}
                aria-hidden
              />
            </div>
          </div>

          {/* Nombre + sector */}
          <div className="text-center mb-3">
            <h3 className="font-black text-xl tracking-tight leading-tight drop-shadow-sm">
              {nombre.toUpperCase()}
            </h3>
            <p className="text-[10px] font-bold tracking-widest opacity-80 mt-0.5">
              {sector.toUpperCase()} · {ciudad.toUpperCase()}
            </p>
          </div>

          {/* Stats - 4 columnas tipo FIFA UT */}
          <div className="grid grid-cols-4 gap-2 bg-[#020618]/30 backdrop-blur-sm rounded-lg p-2 border border-white/10">
            {statItems.map(s => (
              <div key={s.key} className="text-center">
                <div className="font-black text-base leading-none tabular-nums">{s.value}</div>
                <div className="text-[9px] font-black tracking-widest opacity-70 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Pitch line */}
          <p className="text-[10px] italic font-medium opacity-85 mt-3 line-clamp-2 text-center leading-snug">
            "{pitch}"
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 justify-center mt-2">
            {tags.slice(0, 3).map(t => (
              <span
                key={t}
                className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-white/10 border border-white/20"
              >
                {t}
              </span>
            ))}
          </div>

        </div>

        {/* Micro signature en la esquina */}
        <div
          className="absolute bottom-1.5 left-2 text-[6px] font-black tracking-[0.2em] opacity-40 whitespace-nowrap pointer-events-none"
          aria-hidden
        >
          SWC·ARGENTINA·2026·OFFICIAL·ROSTER
        </div>
        <div
          className="absolute bottom-1.5 right-2 text-[7px] font-black tracking-widest opacity-50"
          aria-hidden
        >
          ✦
        </div>
      </div>
    </div>
  )
}

export default StartupCard
