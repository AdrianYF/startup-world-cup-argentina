/**
 * Figurita oficial del equipo de voluntarios — anti-Panini, anti-laminated-staff-badge.
 * Comparte el lenguaje visual de StartupCard (proporción 4:5, holo border,
 * split diagonal, sunburst sutil, grid tech), pero el mensaje central es la
 * frase de orgullo "Yo participo", no el rating OVR.
 *
 * Diferencias con StartupCard:
 *  - OVR circle → CREW # (credencial)
 *  - posición técnica → rol del voluntariado (PRODUCCIÓN / TECH / MENTOR ...)
 *  - 4 stats VIS/TEC/TRC/ESC → 3 días del evento como badges de disponibilidad
 *  - pitch → la frase "Yo participo..." con bandera 🇦🇷
 *  - paleta primaria coral (acento de marca), no violeta (que va para startups)
 */

export type VolunteerCardProps = {
  nombre?: string
  rol?: string
  ciudad?: string
  credencial?: string
  emoji?: string
  pledge?: string
  diasDisponibles?: string[]
  rarity?: 'crew' | 'lead' | 'mentor'
}

const rarityStyles: Record<NonNullable<VolunteerCardProps['rarity']>, {
  label: string
  bg: string
  ring: string
}> = {
  crew: {
    label: 'CREW · SWC AR 26',
    bg: 'bg-gradient-to-br from-[#ff7675] via-[#e85e5d] to-[#7a2625]',
    ring: 'from-[#ffb3b2] via-[#ff7675] to-[#7a2625]',
  },
  lead: {
    label: 'TEAM LEAD · SWC AR 26',
    bg: 'bg-gradient-to-br from-[#f05100] via-[#c63d00] to-[#5c1f00]',
    ring: 'from-[#ff9966] via-[#f05100] to-[#5c1f00]',
  },
  mentor: {
    label: 'MENTOR · SWC AR 26',
    bg: 'bg-gradient-to-br from-[#6c5ce7] via-[#5848c4] to-[#2a1d6e]',
    ring: 'from-[#a89cf0] via-[#6c5ce7] to-[#2a1d6e]',
  },
}

const TODOS_LOS_DIAS = ['MIÉ 5', 'JUE 6', 'VIE 7']

export function VolunteerCard({
  nombre = 'Tu Nombre',
  rol = 'PRODUCCIÓN',
  ciudad = 'Buenos Aires',
  credencial = 'V·047',
  emoji = '👤',
  pledge = 'Yo participo de la Startup World Cup Argentina',
  diasDisponibles = TODOS_LOS_DIAS,
  rarity = 'crew',
}: VolunteerCardProps) {
  const r = rarityStyles[rarity]

  return (
    <div className="relative font-sans select-none" style={{ aspectRatio: '4 / 5' }}>

      {/* Halo */}
      <div className={`absolute -inset-4 bg-gradient-to-br ${r.ring} opacity-30 blur-2xl rounded-3xl pointer-events-none`} />

      {/* Holo foil border animado */}
      <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 animate-[spin_12s_linear_infinite]"
          style={{
            background:
              'conic-gradient(from 90deg, #fda4af 0%, #fde68a 15%, #67e8f9 30%, #c4b5fd 45%, #fda4af 60%, #fde68a 75%, #fda4af 100%)',
          }}
        />
      </div>

      <div className={`relative h-full rounded-2xl overflow-hidden ${r.bg}`}>

        {/* Split diagonal */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              'linear-gradient(135deg, transparent 0%, transparent 45%, rgba(255,255,255,0.1) 50%, transparent 55%, transparent 100%)',
          }}
          aria-hidden
        />

        {/* Grid tech */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" aria-hidden>
          <defs>
            <pattern id="volunteer-card-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#volunteer-card-grid)" />
        </svg>

        {/* Sunburst */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <div
            className="w-3/4 h-3/4 opacity-[0.2]"
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
            {/* Credencial */}
            <div className="flex flex-col items-center">
              <div className="relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/40 shadow-lg">
                <span className="text-[8px] font-black tracking-widest opacity-80 leading-none mt-1">CREW</span>
                <span className="text-2xl font-black leading-none tracking-tighter mt-0.5">{credencial.split('·')[1] || '047'}</span>
              </div>
              <span className="mt-1.5 text-[10px] font-black tracking-widest opacity-90">{rol}</span>
            </div>

            {/* Rarity + ARG */}
            <div className="text-right">
              <div className="text-[9px] font-black tracking-widest opacity-80">{r.label}</div>
              <div className="text-[10px] font-bold opacity-60 mt-0.5">ID {credencial}</div>
              <div className="mt-2 text-[10px] font-black tracking-widest text-white/90 inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/20">
                🇦🇷 ARG
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex-1 flex items-center justify-center my-2">
            <div className="relative w-32 h-32 lg:w-36 lg:h-36 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center shadow-2xl">
              <span className="text-6xl lg:text-7xl drop-shadow-lg">{emoji}</span>
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.2) 100%)',
                }}
                aria-hidden
              />
              {/* Mini-badge oficial sobre el avatar */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#020618] border border-white/40 rounded-full px-2.5 py-0.5 text-[8px] font-black tracking-widest whitespace-nowrap">
                OFFICIAL
              </div>
            </div>
          </div>

          {/* Nombre + ciudad */}
          <div className="text-center mb-3">
            <h3 className="font-black text-xl tracking-tight leading-tight drop-shadow-sm">
              {nombre.toUpperCase()}
            </h3>
            <p className="text-[10px] font-bold tracking-widest opacity-80 mt-0.5">
              {ciudad.toUpperCase()}
            </p>
          </div>

          {/* Pledge — bloque destacado */}
          <div className="bg-[#020618]/40 backdrop-blur-sm rounded-lg p-2.5 border border-white/15 mb-2">
            <p className="text-[11px] font-black italic text-center leading-snug drop-shadow-sm">
              "{pledge} <span className="not-italic">🇦🇷</span>"
            </p>
          </div>

          {/* Días disponibles */}
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {TODOS_LOS_DIAS.map(d => {
              const activo = diasDisponibles.includes(d)
              return (
                <div
                  key={d}
                  className={`text-center py-1 rounded-md border text-[9px] font-black tracking-widest transition-all ${
                    activo
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-[#020618]/30 border-white/10 text-white/40 line-through'
                  }`}
                >
                  {d}
                </div>
              )
            })}
          </div>

          {/* Footer fechas evento */}
          <p className="text-[8px] font-bold tracking-widest opacity-70 text-center mt-3">
            5 · 6 · 7 AGOSTO 2026 · VEDIA, BA
          </p>

        </div>

        {/* Microprint esquinas */}
        <div
          className="absolute bottom-1.5 left-2 text-[6px] font-black tracking-[0.2em] opacity-40 whitespace-nowrap pointer-events-none"
          aria-hidden
        >
          SWC·ARGENTINA·2026·OFFICIAL·CREW
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

export default VolunteerCard
