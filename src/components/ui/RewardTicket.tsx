/**
 * Ticket de premio (celeste) que aparece al abrir la caja ganadora del
 * Mystery Box. Reutiliza el lenguaje visual del WorldCupTicket pero en celeste
 * y con el copy del perk ("Ganaste créditos de AWS").
 */
export function RewardTicket() {
  return (
    <div className="relative font-mono select-none w-full max-w-md mx-auto">
      {/* Halos */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#75AADB]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-[#75AADB]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative rounded-xl sm:rounded-2xl border border-[#75AADB] shadow-[0_0_24px_rgba(117,170,219,0.7),_0_0_60px_rgba(117,170,219,0.4)] overflow-hidden">
        {/* Fondo celeste */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#bcd5ea] via-[#75AADB] to-[#ffffff]" />

        {/* Franjas blancas */}
        <div className="absolute top-0 left-0 right-16 sm:right-28 h-1 sm:h-1.5 bg-white" />
        <div className="absolute bottom-0 left-0 right-16 sm:right-28 h-1 sm:h-1.5 bg-white" />

        <div className="relative flex items-stretch text-[#21313f]">
          {/* Cuerpo */}
          <div className="flex-1 p-4 sm:p-7 pt-5 sm:pt-8 min-w-0">
            <div className="text-[8px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-80 mb-3 sm:mb-6">
              Startup World Cup · Mystery Box
            </div>

            <div className="relative border-y-2 border-dashed border-[#0f172b]/40 py-3 sm:py-5 my-1 sm:my-2">
              <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] opacity-70 mb-1">
                ¡Ganaste!
              </div>
              <div className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]">
                Créditos de AWS
              </div>
            </div>

            <div className="flex items-start justify-between mt-3 sm:mt-5 gap-2">
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] opacity-60">
                  Premio
                </div>
                <div className="text-xs sm:text-sm font-black mt-0.5 truncate">PERK SECRETO</div>
              </div>
              <div className="text-right min-w-0">
                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] opacity-60">
                  Edición
                </div>
                <div className="text-xs sm:text-sm font-black mt-0.5 truncate">AR · 26</div>
              </div>
            </div>
          </div>

          {/* Perforación */}
          <div className="relative w-3 sm:w-5 bg-[#75AADB] border-l-2 border-dashed border-[#0f172b]/50 flex-shrink-0">
            <div className="absolute -top-1.5 sm:-top-2.5 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-5 sm:h-5 bg-[#020618] rounded-full" />
            <div className="absolute -bottom-1.5 sm:-bottom-2.5 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-5 sm:h-5 bg-[#020618] rounded-full" />
          </div>

          {/* Stub */}
          <div className="relative w-16 sm:w-28 bg-gradient-to-b from-[#75AADB] via-[#75AADB] to-[#ffffff] flex flex-col items-center justify-center p-2 sm:p-4 text-center gap-2 flex-shrink-0">
            <div className="text-3xl sm:text-5xl">🎉</div>
            <div className="text-[10px] sm:text-sm font-black tracking-widest">AWS</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RewardTicket
