import { content } from '../../lib/content'

type Variant = 'compact' | 'full'

/* Paleta celeste argentino sobre slate */

/* -------- subcomponentes decorativos -------- */

function HolographicSeal({ size = 56 }: { size?: number }) {
  return (
    <div
      className="relative rounded-full border-2 border-[#0c2e4a]/80 shadow-inner overflow-hidden"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute inset-0 animate-[spin_8s_linear_infinite]"
        style={{
          background:
            'conic-gradient(from 0deg, #f0abfc, #fde68a, #67e8f9, #fda4af, #c4b5fd, #fde68a, #f0abfc)',
        }}
      />
      <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/40 to-[#0c2e4a]/30 backdrop-blur-[1px] flex items-center justify-center">
        <span className="font-black text-[#0c2e4a]/90" style={{ fontSize: size * 0.32 }}>
          SWC
        </span>
      </div>
      <div
        className="absolute inset-0 rounded-full mix-blend-overlay opacity-60"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 50%)',
        }}
      />
    </div>
  )
}

function MicroprintBand({ text = 'STARTUP·WORLD·CUP·ARGENTINA·' }: { text?: string }) {
  const repeated = (text + ' ').repeat(20)
  return (
    <div
      className="overflow-hidden whitespace-nowrap text-[#0c2e4a]/40 font-bold tracking-[0.2em] select-none"
      style={{ fontSize: 6 }}
      aria-hidden
    >
      {repeated}
    </div>
  )
}

function SolDeMayo({ size = 240, opacity = 0.18 }: { size?: number; opacity?: number }) {
  const rays = Array.from({ length: 16 })
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ opacity }}
      className="absolute pointer-events-none"
      aria-hidden
    >
      {rays.map((_, i) => {
        const angle = (i * 360) / rays.length
        return (
          <polygon
            key={i}
            points="50,5 52,40 48,40"
            fill="#fbbf24"
            transform={`rotate(${angle} 50 50)`}
          />
        )
      })}
      <circle cx="50" cy="50" r="14" fill="#f59e0b" />
      <circle cx="50" cy="50" r="11" fill="#fbbf24" />
    </svg>
  )
}

function GuillochePattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.15 }}
      aria-hidden
    >
      <defs>
        <pattern id="guilloche" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M0,20 Q10,0 20,20 T40,20"
            stroke="#0c2e4a"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M0,30 Q10,10 20,30 T40,30"
            stroke="#0c2e4a"
            strokeWidth="0.5"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#guilloche)" />
    </svg>
  )
}

function QRCode({ size = 56 }: { size?: number }) {
  const cells = 8
  const cellSize = size / cells
  const seed = [
    [1, 1, 1, 0, 1, 1, 1, 0],
    [1, 0, 1, 1, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 1],
    [0, 1, 0, 1, 1, 1, 0, 0],
    [1, 0, 1, 0, 0, 1, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 0],
    [0, 1, 1, 0, 1, 1, 0, 1],
    [1, 1, 0, 1, 0, 1, 1, 1],
  ]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <rect width={size} height={size} fill="#ffffff" />
      {seed.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#0c2e4a"
            />
          ) : null,
        ),
      )}
    </svg>
  )
}

/* -------- componente principal -------- */

export function WorldCupTicket({ variant = 'full' }: { variant?: Variant }) {
  const premio = content.config.evento.premioUSD
  const formatUSD = new Intl.NumberFormat('en-US').format(premio)

  /* ---------- COMPACT ---------- */

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-stretch font-mono select-none drop-shadow-lg">
        <div className="relative bg-gradient-to-br from-[#a8d4ed] via-[#75AADB] to-[#5a93c5] rounded-l-lg px-4 py-2 border-2 border-r-0 border-[#0c2e4a]/80 overflow-hidden">
          <GuillochePattern />
          <div className="relative flex items-center gap-3">
            <HolographicSeal size={32} />
            <div>
              <div className="text-[8px] font-black tracking-[0.2em] uppercase text-[#0c2e4a]/80">
                Final · Silicon Valley
              </div>
              <div className="text-xl font-black leading-none text-[#0c2e4a] mt-0.5">
                US$ {formatUSD}
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-3 bg-[#75AADB] border-2 border-[#0c2e4a]/80 border-l-0 border-r-0">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-[#0c2e4a]/50" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0c2e4a] rounded-full" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0c2e4a] rounded-full" />
        </div>

        <div className="bg-gradient-to-br from-[#75AADB] to-[#4a82b8] rounded-r-lg px-3 py-2 border-2 border-l-0 border-[#0c2e4a]/80 flex items-center justify-center">
          <div className="text-center text-[#0c2e4a]">
            <div className="text-[7px] font-black uppercase tracking-widest opacity-70 leading-none">Champ</div>
            <div className="text-base font-black leading-tight">26</div>
            <div className="text-[7px] font-bold uppercase tracking-widest leading-none">AR</div>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- FULL ---------- */

  return (
    <div className="relative font-mono select-none">

      {/* Halos exteriores */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#75AADB]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative rounded-2xl border-[3px] border-[#0c2e4a]/90 shadow-[0_25px_70px_-15px_rgba(12,46,74,0.7)] overflow-hidden">

        {/* Capa base — gradiente celeste argentino */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#bfdef0] via-[#75AADB] to-[#4a82b8]" />

        {/* Sol de Mayo de fondo */}
        <SolDeMayo size={320} opacity={0.08} />

        {/* Guilloche pattern */}
        <GuillochePattern />

        {/* Franja blanca arriba */}
        <div className="absolute top-0 left-0 right-28 h-1.5 flex">
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-white" />
        </div>

        <div className="relative flex items-stretch text-[#0c2e4a]">

          {/* === CUERPO PRINCIPAL === */}
          <div className="flex-1 p-6 pt-7">

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-80">
                    Official Final Ticket
                  </span>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-amber-500">
                    ✶ AR ✶
                  </span>
                </div>
                <div className="text-[11px] font-black tracking-wider uppercase mt-0.5">
                  Startup World Cup · Champion 2026
                </div>
              </div>
              <div className="relative">
                <div className="bg-[#0c2e4a] text-amber-300 text-[9px] font-black px-2 py-1 rounded tracking-[0.2em] uppercase">
                  Match 01
                </div>
                <div className="text-[8px] font-bold uppercase tracking-widest opacity-70 text-right mt-0.5">
                  Group Stage
                </div>
              </div>
            </div>

            {/* Premio — bloque hero */}
            <div className="relative border-y-2 border-dashed border-[#0c2e4a]/40 py-4 my-2">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <SolDeMayo size={180} opacity={0.22} />
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[9px] font-black uppercase tracking-[0.25em] opacity-70">
                    Prize Pool
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-[0.25em] opacity-70">
                    Pegasus Tech Ventures
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black opacity-70">US$</span>
                  <span className="text-6xl lg:text-7xl font-black tracking-tight leading-none drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]">
                    {formatUSD}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">
                    One Million USD
                  </span>
                  <span className="text-[9px] font-bold italic opacity-60">
                    payable to: World Champion
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-6 gap-2 mt-4">
              <div className="col-span-2">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Kick-off</div>
                <div className="text-sm font-black leading-tight">05·08·2026</div>
                <div className="text-[10px] font-bold opacity-80">09:00 ART</div>
              </div>
              <div className="col-span-2">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Venue</div>
                <div className="text-sm font-black leading-tight">VEDIA</div>
                <div className="text-[10px] font-bold opacity-80">BUENOS AIRES</div>
              </div>
              <div className="text-center bg-white/30 rounded border border-[#0c2e4a]/30 py-1">
                <div className="text-[7px] font-black uppercase tracking-widest opacity-60">Gate</div>
                <div className="text-sm font-black leading-tight">A</div>
              </div>
              <div className="text-center bg-white/30 rounded border border-[#0c2e4a]/30 py-1">
                <div className="text-[7px] font-black uppercase tracking-widest opacity-60">Sect</div>
                <div className="text-sm font-black leading-tight">ARG</div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 mt-2">
              <div className="col-span-4">
                <MicroprintBand />
              </div>
              <div className="text-center bg-white/30 rounded border border-[#0c2e4a]/30 py-1">
                <div className="text-[7px] font-black uppercase tracking-widest opacity-60">Row</div>
                <div className="text-sm font-black leading-tight">26</div>
              </div>
              <div className="text-center bg-white/30 rounded border border-[#0c2e4a]/30 py-1">
                <div className="text-[7px] font-black uppercase tracking-widest opacity-60">Seat</div>
                <div className="text-sm font-black leading-tight">08</div>
              </div>
            </div>

            {/* Serial + microprint */}
            <div className="mt-4 pt-3 border-t border-[#0c2e4a]/30 flex items-center justify-between">
              <div>
                <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Serial №</div>
                <div className="text-xs font-black tracking-wider">SWC·26·AR·100208</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Issued</div>
                <div className="text-xs font-black tracking-wider">2026·05·23</div>
              </div>
            </div>
          </div>

          {/* === PERFORACIÓN === */}
          <div className="relative w-5 bg-[#75AADB] border-l-2 border-dashed border-[#0c2e4a]/50">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#0c2e4a] rounded-full" />
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#0c2e4a] rounded-full" />
            <div
              className="absolute inset-y-4 left-1/2 -translate-x-1/2 text-[#0c2e4a]/40 font-bold whitespace-nowrap"
              style={{
                fontSize: 5,
                writingMode: 'vertical-rl',
                letterSpacing: '0.2em',
              }}
              aria-hidden
            >
              · SWC · ARGENTINA · 2026 · SWC · ARGENTINA · 2026 ·
            </div>
          </div>

          {/* === STUB === */}
          <div className="relative w-32 bg-gradient-to-b from-[#75AADB] via-[#5a93c5] to-[#4a82b8] flex flex-col items-center justify-between p-4 text-center">
            <GuillochePattern />

            <div className="relative">
              <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-70 leading-none">
                Stub
              </div>
              <div className="text-[8px] font-bold opacity-60 mt-0.5">Conservar</div>
            </div>

            <div className="relative my-2">
              <HolographicSeal size={56} />
            </div>

            <div className="relative bg-white p-1 rounded border border-[#0c2e4a]/40">
              <QRCode size={48} />
            </div>

            <div className="relative pt-1">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">SWC·AR</div>
              <div className="text-[8px] font-black opacity-60 mt-0.5">N° 100208</div>
            </div>
          </div>
        </div>

        {/* Franja blanca abajo */}
        <div className="absolute bottom-0 left-0 right-28 h-1.5 flex">
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-white" />
        </div>
      </div>

      <p className="text-center text-gray-400 text-xs mt-4 italic">
        🇦🇷 Tu startup puede ser la próxima en cobrar este ticket.
      </p>
    </div>
  )
}

export default WorldCupTicket
