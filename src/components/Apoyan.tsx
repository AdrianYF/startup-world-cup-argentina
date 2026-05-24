import { content } from '../lib/content'

function Apoyan() {
  const categorias = content.apoyan

  return (
    <section id="apoyan" className="relative py-16 sm:py-24 bg-white text-[#020618]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-4">
            <span className="text-[#020618]">QUIENES NOS </span>
            <span className="text-[#75AADB]">APOYAN</span>
          </h2>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            Las organizaciones que impulsan la innovación en Argentina y el mundo.
          </p>
        </div>

        <div className="flex flex-col gap-16">
          {categorias.map((cat, i) => (
            <div key={i}>
              <p className="text-center text-gray-500 text-xs uppercase tracking-[0.3em] font-bold mb-8">
                {cat.titulo}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-0 gap-y-0.5 items-center justify-items-center">
                {cat.logos.map((logo, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-center w-full h-28 sm:h-32"
                  >
                    {logo.img ? (
                      <img
                        src={logo.img}
                        alt={logo.nombre}
                        className="max-h-24 sm:max-h-32 max-w-[280px] sm:max-w-[320px] w-auto object-contain grayscale contrast-150 brightness-50 hover:filter-none hover:contrast-100 hover:brightness-100 transition-[filter] duration-300"
                      />
                    ) : (
                      <span className="text-gray-700 font-black text-3xl sm:text-4xl uppercase tracking-wide hover:text-[#020618] transition-colors">
                        {logo.nombre}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Apoyan
