import { useState } from 'react'

const faqs = [
  {
    pregunta: '¿Cómo puedo participar en la final global en Silicon Valley?',
    respuesta: 'Para participar en la final global debés ganar el Pitch Battle Argentina. El ganador obtiene un pase directo a la gran final en Silicon Valley donde competirá contra los ganadores de más de 100 ciudades del mundo.',
  },
  {
    pregunta: '¿Qué recibe la startup ganadora a nivel regional?',
    respuesta: 'La startup ganadora del Pitch Battle Argentina recibe un pase directo a la final global en Silicon Valley, visibilidad internacional, acceso a la red de inversores de Pegasus Tech Ventures y cobertura mediática del evento.',
  },
  {
    pregunta: '¿Qué recibe el campeón mundial?',
    respuesta: 'El campeón mundial recibe una inversión de US$ 1.000.000 del fondo Pegasus Tech Ventures, además de acceso a la red global de inversores, mentores y corporaciones del ecosistema de Silicon Valley.',
  },
  {
    pregunta: '¿Cuántas startups participan en la competencia regional?',
    respuesta: 'A través de un proceso de selección riguroso, las 10 mejores startups de Argentina serán elegidas para competir en el Pitch Battle. El proceso incluye evaluación de modelo de negocio, tracción y potencial de escalabilidad.',
  },
  {
    pregunta: '¿Cuánto dura el pitch?',
    respuesta: 'Cada startup tiene 5 minutos para presentar su proyecto ante el jurado internacional, seguido de una ronda de preguntas y respuestas de 3 minutos.',
  },
  {
    pregunta: '¿El evento es solo para startups tech?',
    respuesta: 'No, el evento está abierto a startups de cualquier industria. Sin embargo, se valoran especialmente aquellas con componentes tecnológicos, modelos escalables y potencial de impacto global.',
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-24 bg-black">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black uppercase mb-4">
            <span className="text-white">PREGUNTAS </span>
            <span className="text-yellow-400">FRECUENTES</span>
          </h2>
          <p className="text-gray-400">Todo lo que necesitás saber sobre el evento.</p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-xl overflow-hidden transition-all ${open === i ? 'border-yellow-500/50' : 'border-white/10'}`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-white/5 hover:bg-white/8 transition-all"
              >
                <span className="text-white font-bold pr-4">{faq.pregunta}</span>
                <span className={`text-yellow-400 text-lg flex-shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}>
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

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
    </section>
  )
}

export default FAQ