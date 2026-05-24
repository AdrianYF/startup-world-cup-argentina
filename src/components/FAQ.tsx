import { useState } from 'react'
import { content } from '../lib/content'

function FAQ() {
  const faqs = content.faqs
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-24 bg-[#020618]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />

      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black uppercase mb-4">
            <span className="text-white">PREGUNTAS </span>
            <span className="text-[#6c5ce7]">FRECUENTES</span>
          </h2>
          <p className="text-gray-400">Todo lo que necesitás saber sobre el evento.</p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-xl overflow-hidden transition-all ${open === i ? 'border-[#6c5ce7]/50' : 'border-white/10'}`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-white/5 hover:bg-white/8 transition-all cursor-pointer"
              >
                <span className="text-white font-bold pr-4">{faq.pregunta}</span>
                <span className={`text-[#6c5ce7] text-lg flex-shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}>
                  ↓
                </span>
              </button>
              {open === i && (
                <div className="px-6 py-4 bg-white/3 border-t border-white/10">
                  <p className="text-gray-300 leading-relaxed">{faq.respuesta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />
    </section>
  )
}

export default FAQ
