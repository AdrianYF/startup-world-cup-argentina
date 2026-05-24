import { content } from '../lib/content'

function Apoyan() {
  const categorias = content.apoyan

  return (
    <section id="apoyan" className="relative py-16 sm:py-24 bg-white text-[#020618]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black uppercase mb-4">
            <span className="text-[#020618]">QUIENES NOS </span>
            <span className="text-[#75AADB]">APOYAN</span>
          </h2>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            Las organizaciones que impulsan la innovación en Argentina y el mundo.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {categorias.map((cat, i) => (
            <div key={i}>
              <p className="text-center text-gray-500 text-xs uppercase tracking-widest mb-6">
                {cat.titulo}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {cat.logos.map((logo, j) => (
                  <div
                    key={j}
                    className="bg-white border border-gray-200 rounded-xl px-8 py-6 flex items-center justify-center min-w-36 hover:border-[#75AADB]/50 transition-colors duration-300"
                  >
                    {logo.img ? (
                      <img
                        src={logo.img}
                        alt={logo.nombre}
                        className="h-12 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-[filter,opacity] duration-300"
                      />
                    ) : (
                      <span className="text-[#020618] font-bold text-lg">{logo.nombre}</span>
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
