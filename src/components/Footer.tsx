import { useState } from 'react'
import { content } from '../lib/content'
import { openTicketing, openStartupForm, openPartnerForm } from '../lib/ticketing'
import { Modal } from './ui/Modal'

/**
 * Footer dark con cierre fuerte:
 *  1. Final CTA strip (Aplica Startup + Ser Partner) como último punto de conversión.
 *  2. Logo wordmark consistente con navbar (no PNG colorido).
 *  3. 3 columnas: Brand · Navegación · Contacto/Social.
 *  4. Recordatorio fecha+lugar.
 *  5. Línea legal (placeholder hasta que existan las páginas).
 */

const NAV_LINKS = [
  { href: '#ruta', label: 'Ruta' },
  { href: '#pitch', label: 'Pitch Battle' },
  { href: '#agenda', label: 'Agenda' },
  // { href: '#speakers', label: 'Speakers' }, // TODO: re-habilitar cuando se confirmen
  // { href: '#partners', label: 'Partners' }, // removido por pedido
  { href: '#faq', label: 'FAQ' },
] as const


function Footer() {
  const cfg = content.config
  const links = cfg.links
  const fechas = cfg.evento.fechas
  const hasSocial = Boolean(links.linkedin || links.instagram || links.twitter)
  const [basesOpen, setBasesOpen] = useState(false)

  return (
    <footer className="relative bg-[#020618] text-white">

      {/* Separador celeste - coherente con el resto de secciones del sitio */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      {/* ═══ FINAL CTA STRIP ═══ */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-2xl sm:text-3xl font-black uppercase leading-tight text-center md:text-left">
              <span className="text-white">¿List@ para el </span>
              <span className="text-[#75AADB]">Mundial</span>
              <span className="text-white">?</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={() => openStartupForm()}
                aria-label="Aplicá como Startup (abre formulario en una nueva pestaña)"
                style={{ backgroundImage: 'var(--gradient-cta)' }}
                className="inline-flex items-center justify-center gap-2 active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-sm sm:text-base px-6 sm:px-7 py-3 min-h-[48px] rounded-full transition-transform uppercase tracking-wide cursor-pointer whitespace-nowrap hover:scale-105"
              >
                Aplicá como Startup
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  {/* Heroicons rocket-launch (solid) */}
                  <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
                  <path d="M5.26 17.242a1.5 1.5 0 1 0-2.567-1.555 5.97 5.97 0 0 0-.83 2.336 5.99 5.99 0 0 0-.27 1.405.75.75 0 0 0 .47.7 5.969 5.969 0 0 0 1.405-.27 5.97 5.97 0 0 0 2.337-.83 1.5 1.5 0 1 0-1.555-2.566L5.26 17.242Z" />
                </svg>
              </button>
              <button
                onClick={() => openPartnerForm()}
                aria-label="Quiero ser Partner (contactanos)"
                className="relative active:scale-95 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3 min-h-[48px] rounded-full transition-transform uppercase tracking-wide cursor-pointer whitespace-nowrap hover:scale-105"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    padding: '1px',
                    background: 'var(--gradient-cta)',
                    WebkitMask:
                      'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />
                <span className="relative inline-flex items-center justify-center gap-2">
                  Quiero ser Partner
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    {/* Lucide handshake */}
                    <path d="m11 17 2 2a1 1 0 1 0 3-3" />
                    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
                    <path d="m21 3 1 11h-2" />
                    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
                    <path d="M3 4h8" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ COLUMNAS ═══ */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 pb-12">

          {/* Brand */}
          <div className="md:col-span-5">
            {/* Wordmark consistente con navbar */}
            <div className="flex items-baseline gap-2 mb-5">
              <span className="font-black text-white text-3xl leading-none tracking-tight">SWC</span>
              <span className="text-[#75AADB] font-bold uppercase tracking-[0.2em] leading-none text-xs">
                Argentina·26
              </span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed font-medium max-w-[42ch] mb-6">
              La competencia de startups más grande del mundo aterriza en
              Buenos Aires para potenciar el ecosistema regional.
            </p>

            {/* Recordatorio fecha + lugar */}
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold">
              <CalendarIcon />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'var(--gradient-cta)' }}
              >
                {fechas}
              </span>
            </div>
          </div>

          {/* Navegación */}
          <nav className="md:col-span-3" aria-label="Navegación del footer">
            <h4 className="text-gray-400 text-[11px] uppercase tracking-[0.18em] font-semibold mb-5">
              Navegación
            </h4>
            <ul className="flex flex-col gap-3">
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white hover:text-[#75AADB] text-[15px] font-medium transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setBasesOpen(true)}
                  className="text-white hover:text-[#75AADB] text-[15px] font-medium transition-colors duration-200 cursor-pointer text-left"
                >
                  Bases y Condiciones
                </button>
              </li>
              <li className="mt-2">
                <button
                  onClick={() => openTicketing('footer')}
                  aria-label="Comprar tickets (abre Startup Grind en nueva pestaña)"
                  className="inline-flex items-center gap-2 text-[15px] font-bold cursor-pointer hover:opacity-80 transition-opacity duration-200"
                >
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'var(--gradient-cta)' }}
                  >
                    Comprar tickets
                  </span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Contacto + Social */}
          <div className="md:col-span-4">
            <h4 className="text-gray-400 text-[11px] uppercase tracking-[0.18em] font-semibold mb-5">
              Contacto
            </h4>
            <ul className="flex flex-col gap-3 mb-7">
              <li>
                <a
                  href={`mailto:${links.emailGeneral}`}
                  className="inline-flex items-center gap-2 text-white hover:text-[#75AADB] text-[15px] font-medium transition-colors duration-200"
                >
                  <MailIcon />
                  {links.emailGeneral}
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-gray-400 text-[15px] font-medium">
                <PinIcon />
                Buenos Aires, Argentina
              </li>
            </ul>

            {hasSocial && (
              <div>
                <h4 className="text-gray-400 text-[11px] uppercase tracking-[0.18em] font-semibold mb-3">
                  Seguinos
                </h4>
                <div className="flex gap-2">
                  {links.linkedin && (
                    <SocialLink href={links.linkedin} label="LinkedIn">
                      <LinkedInIcon />
                    </SocialLink>
                  )}
                  {links.instagram && (
                    <SocialLink href={links.instagram} label="Instagram">
                      <InstagramIcon />
                    </SocialLink>
                  )}
                  {links.twitter && (
                    <SocialLink href={links.twitter} label="X (Twitter)">
                      <XIcon />
                    </SocialLink>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ COPYRIGHT + LEGAL ═══ */}
        <div className="pt-6 text-xs text-gray-400 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p>© 2026 Startup World Cup Argentina · Todos los derechos reservados</p>
        </div>
      </div>

      {basesOpen && (
        <Modal onClose={() => setBasesOpen(false)} titleId="bases-modal-title" size="3xl">
          <BasesContent onClose={() => setBasesOpen(false)} />
        </Modal>
      )}
    </footer>
  )
}

function BasesContent({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-gray-200 text-base leading-relaxed">
      <h3 id="bases-modal-title" className="text-white font-black text-2xl sm:text-3xl mb-1">
        Bases y Condiciones
      </h3>
      <p className="text-[#75AADB] font-bold text-xs uppercase tracking-widest mb-5">
        Startup World Cup – Regional Argentina
      </p>

      <div className="max-h-[55vh] overflow-y-auto pr-3 -mr-2 swc-scrollbar">

      <p className="mb-4">
        La presente convocatoria establece las bases y condiciones para participar en la competencia{' '}
        <strong className="text-white">Startup World Cup – Regional Argentina</strong>, organizada
        por Startup Grind Buenos Aires, cuyo objetivo es seleccionar una startup que represente a
        Argentina en la final global de Startup World Cup en Silicon Valley, Estados Unidos.
      </p>
      <p className="mb-6">
        Startup World Cup es una competencia global organizada por Pegasus Tech Ventures que reúne
        a startups de distintos países a través de eventos regionales. El ganador del evento
        regional tendrá la oportunidad de representar a Argentina en la final global, donde se
        compite por una inversión de hasta USD 1.000.000. Para más detalles de la competencia
        final y sus Términos y Condiciones, visitá{' '}
        <a
          href="https://www.startupworldcup.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#75AADB] hover:underline"
        >
          startupworldcup.io
        </a>
      </p>

      <Section n="1" title="Requisitos de elegibilidad">
        <p className="mb-2">Podrán participar startups que cumplan con los siguientes requisitos:</p>
        <ol className="list-[lower-alpha] pl-5 space-y-2">
          <li>La startup debe estar legalmente constituida en su país de origen o jurisdicción correspondiente.</li>
          <li>
            La startup debe tener vínculo comprobable con Argentina, cumpliendo al menos una de
            las siguientes condiciones:
            <ol className="list-[lower-roman] pl-5 mt-2 space-y-1">
              <li>Contar con al menos un fundador o cofundador de nacionalidad argentina, o</li>
              <li>Tener operaciones activas en Argentina, lo cual deberá poder demostrarse mediante presencia del equipo, clientes, mercado principal, oficina o actividad comercial en el país.</li>
            </ol>
          </li>
          <li>La startup debe contar con al menos un producto, prototipo funcional o MVP.</li>
          <li>El proyecto debe presentar potencial de escalabilidad global y un modelo de negocio innovador.</li>
          <li>La startup no debe haber levantado más de USD 10.000.000 en financiamiento total al momento de la postulación.</li>
          <li>No podrán participar empresas públicas ni subsidiarias de grandes corporaciones.</li>
          <li>Al menos uno de los fundadores o representantes deberá poder presentar el pitch en inglés en caso de avanzar a instancias internacionales.</li>
          <li>En caso de resultar ganadora del evento regional, la startup deberá contar con documentación migratoria válida para viajar a Estados Unidos, incluyendo visa vigente o la posibilidad de tramitarla a tiempo para asistir a la final global.</li>
          <li>Cada startup podrá presentar una única postulación.</li>
        </ol>
      </Section>

      <Section n="2" title="Proceso de selección">
        <p className="mb-2">El proceso de selección constará de las siguientes etapas:</p>
        <ol className="list-[lower-alpha] pl-5 space-y-1.5 mb-4">
          <li>Convocatoria abierta y recepción de postulaciones.</li>
          <li>Evaluación inicial por parte del comité organizador.</li>
          <li>Selección de startups finalistas.</li>
          <li>Presentación de pitch en vivo durante el evento Startup World Cup – Regional Argentina frente a un jurado compuesto por inversores, referentes del ecosistema y expertos de la industria.</li>
          <li>Selección de la startup ganadora que representará a Argentina en la final global.</li>
        </ol>
        <p className="mb-2">Los criterios de evaluación podrán incluir, entre otros:</p>
        <ol className="list-decimal pl-5 space-y-1.5 mb-4">
          <li>Innovación y diferenciación</li>
          <li>Tamaño de mercado</li>
          <li>Potencial de escalabilidad</li>
          <li>Tracción o validación</li>
          <li>Equipo fundador</li>
          <li>Claridad del modelo de negocio</li>
        </ol>
        <p>La decisión del jurado será final e inapelable.</p>
      </Section>

      <Section n="3" title="Formato de presentación">
        <p className="mb-2">
          Las startups seleccionadas deberán presentar un pitch en vivo durante el evento
          regional. La organización informará previamente a las startups finalistas:
        </p>
        <ul className="list-none pl-0 space-y-1">
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Duración del pitch</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Formato de presentación (slides u otros materiales)</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Espacio para preguntas del jurado</li>
        </ul>
      </Section>

      <Section n="4" title="Premio">
        <p className="mb-2">La startup ganadora del Regional Argentina obtendrá:</p>
        <ol className="list-decimal pl-5 space-y-1.5 mb-3">
          <li>El derecho a representar a Argentina en la final global de Startup World Cup en Silicon Valley.</li>
          <li>Acceso a visibilidad internacional frente a inversores y líderes del ecosistema.</li>
          <li>La posibilidad de competir por una inversión de hasta USD 1.000.000 en la final global.</li>
        </ol>
        <p>Podrán existir premios adicionales otorgados por sponsors o partners del evento.</p>
      </Section>

      <Section n="5" title="Gastos de viaje y participación">
        <p className="mb-2">
          La participación en la final global no incluye necesariamente cobertura de gastos de
          viaje, alojamiento o viáticos. Salvo que la organización o sponsors anuncien beneficios
          específicos, la startup ganadora será responsable de cubrir:
        </p>
        <ul className="list-none pl-0 space-y-1">
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Pasajes aéreos</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Alojamiento</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Traslados</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Trámites migratorios o visas</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Cualquier otro gasto relacionado con la participación en la final global</li>
        </ul>
      </Section>

      <Section n="6" title="Propiedad intelectual">
        <p>
          Cada startup participante declara ser titular de los derechos de propiedad intelectual
          sobre su proyecto o contar con autorización para presentarlo en esta competencia. La
          organización no reclama derechos sobre los proyectos presentados.
        </p>
      </Section>

      <Section n="7" title="Uso de imagen y comunicación">
        <p className="mb-2">Las startups participantes autorizan a los organizadores a utilizar:</p>
        <ul className="list-none pl-0 space-y-1 mb-3">
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Nombre de la startup</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Logotipo</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Imágenes del equipo</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Fotografías o grabaciones del evento y del pitch</li>
        </ul>
        <p>
          con fines de comunicación, difusión del evento y promoción del ecosistema emprendedor.
          Los datos personales y datos de la startup inscripta pueden ser compartidos a Startup
          Grind y Pegasus Ventures como partners principales y sponsors del evento.
        </p>
      </Section>

      <Section n="8" title="Información veraz">
        <p>
          Las startups participantes declaran que toda la información proporcionada durante el
          proceso de postulación y selección es veraz, completa y actualizada. En caso de
          detectarse información falsa, incompleta o engañosa, la organización podrá descalificar
          a la startup en cualquier etapa del proceso, incluso después del evento.
        </p>
      </Section>

      <Section n="9" title="Descalificación">
        <p className="mb-2">
          La organización se reserva el derecho de descalificar o excluir a cualquier startup que:
        </p>
        <ul className="list-none pl-0 space-y-1">
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Incumpla las presentes bases y condiciones</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Proporcione información falsa o engañosa</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>No cumpla con los requisitos de elegibilidad</li>
          <li className="flex gap-2"><span className="text-[#75AADB] mt-0.5">·</span>Incumpla normas de conducta durante el evento o el proceso de selección</li>
        </ul>
      </Section>

      <Section n="10" title="Conflicto de interés">
        <p>
          En caso de que algún miembro del jurado tenga relación directa con una startup
          participante (como inversión previa, asesoría, empleo o vínculo comercial relevante),
          deberá declararlo previamente. La organización podrá solicitar a dicho jurado abstenerse
          de votar o evaluar esa startup para preservar la transparencia del proceso.
        </p>
      </Section>

      <Section n="11" title="Modificaciones">
        <p>
          La organización se reserva el derecho de realizar ajustes en el proceso de selección,
          formato del evento o cronograma cuando resulte necesario para garantizar el correcto
          desarrollo de la competencia.
        </p>
      </Section>

      <Section n="12" title="Aceptación de las bases">
        <p>
          La postulación a la convocatoria implica la aceptación plena de las presentes bases y
          condiciones.
        </p>
      </Section>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{ backgroundImage: 'var(--gradient-cta)' }}
        className="mt-6 inline-flex items-center gap-2 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-sm px-6 py-2.5 rounded-full uppercase tracking-wide cursor-pointer hover:scale-105 active:scale-95 transition-transform"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver
      </button>
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h4 className="text-white font-black text-base mb-2">
        <span className="text-[#75AADB] mr-2">{n}.</span>
        {title}
      </h4>
      <div className="text-gray-300">{children}</div>
    </section>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-[#75AADB] text-white transition-[transform,background-color] duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
    >
      {children}
    </a>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="url(#cta-grad-calendar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <defs>
        <linearGradient id="cta-grad-calendar" x1="0.047" y1="0.711" x2="0.953" y2="0.289">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="30%" stopColor="#6c5ce7" />
          <stop offset="60%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#ff7675" />
        </linearGradient>
      </defs>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 18H6V10h2.5v8zM7.25 8.7a1.45 1.45 0 1 1 0-2.9 1.45 1.45 0 0 1 0 2.9zM18 18h-2.5v-4.2c0-1-.02-2.3-1.4-2.3-1.4 0-1.6 1.1-1.6 2.2V18H10V10h2.4v1.1h.03c.33-.6 1.14-1.3 2.34-1.3 2.5 0 3.23 1.65 3.23 3.8V18z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export default Footer
