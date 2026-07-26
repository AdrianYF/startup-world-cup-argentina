import { useState } from 'react'
import { content } from '../lib/content'

function FAQ() {
  const faqs = content.faqs
  const [abierta, setAbierta] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-16 sm:py-24 bg-white text-[#020618]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
      <div className="max-w-3xl mx-auto px-4">
        {/* Título = toggle: la sección arranca colapsada y se despliega al tocar. */}
        <button
          onClick={() => setAbierta(v => !v)}
          aria-expanded={abierta}
          aria-controls="faq-lista"
          className="w-full flex items-center justify-center gap-3 text-center cursor-pointer group"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase">
            <span className="text-[#020618]">PREGUNTAS </span>
            <span className="text-[#75AADB]">FRECUENTES</span>
          </h2>
          <span
            aria-hidden
            className={`text-[#75AADB] text-3xl sm:text-4xl leading-none transition-transform duration-300 ${abierta ? 'rotate-180' : ''}`}
          >
            ↓
          </span>
        </button>
        <p className="text-gray-700 text-lg max-w-2xl mx-auto text-center mt-4">
          Todo lo que necesitás saber sobre el evento.
        </p>

        {abierta && (
          <div id="faq-lista" className="flex flex-col gap-3 mt-10">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`border rounded-xl overflow-hidden transition-colors ${open === i ? 'border-[#75AADB]' : 'border-gray-200'}`}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <span className="text-[#020618] font-bold pr-4">{faq.pregunta}</span>
                  <span
                    className={`text-[#75AADB] text-lg flex-shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    ↓
                  </span>
                </button>
                {open === i && (
                  <div className="px-6 py-4 bg-white border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{faq.respuesta}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default FAQ
