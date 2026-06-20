import { content } from '../../lib/content'

/**
 * Botón flotante de WhatsApp "Enterate de las novedades" — fixed bottom-right.
 * Por defecto muestra solo el ícono; al hacer hover se expande revelando el texto.
 * Linkea al grupo/canal de WhatsApp (config.links.whatsapp).
 */
export function WhatsAppNews() {
  const url = content.config.links.whatsapp

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Enterate de las últimas novedades por WhatsApp"
      className="group fixed bottom-6 right-6 z-40 flex items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 transition-transform duration-300 ease-out hover:scale-[1.03] active:scale-95"
    >
      <span className="grid place-items-center w-14 h-14 shrink-0">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.518 5.26l-.999 3.648 3.97-1.039zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap font-black text-sm leading-tight pr-0 transition-all duration-300 ease-out group-hover:max-w-[260px] group-hover:pr-5 group-focus-visible:max-w-[260px] group-focus-visible:pr-5">
        Enterate de las últimas novedades
      </span>
    </a>
  )
}

export default WhatsAppNews
