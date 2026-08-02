/**
 * Los iconos del backoffice.
 *
 * Dibujados a mano y no una librería: son catorce, pesan ~2 KB en total, y
 * traerse `lucide` o `heroicons` a un bundle que se abre con el 4G del venue
 * para usar catorce iconos no se paga. Mismo criterio que los gráficos de
 * Métricas.
 *
 * Todos en `currentColor` y con trazo, no relleno: heredan el color del texto
 * que los rodea, así que en la puerta salen blancos sin decírselo a cada uno, y
 * el mismo icono sirve en verde sobre la confirmación o en ámbar sobre el aviso.
 */

type Props = {
  /** En píxeles. 20 es el tamaño de línea de texto; 16 el de una etiqueta. */
  tam?: number
  className?: string
  /** Sólo para los iconos que dicen algo que el texto de al lado no dice. */
  titulo?: string
}

function Svg({ tam = 20, className = '', titulo, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden={titulo ? undefined : true}
      role={titulo ? 'img' : undefined}
    >
      {titulo && <title>{titulo}</title>}
      {children}
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* La metáfora del escaneo                                                     */
/* -------------------------------------------------------------------------- */

/** QR: tres ojos y un cuerpo. Es lo que la gente reconoce sin leer nada. */
export function IconoQR(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM20 14v0M14 20h3M20 17v4" />
    </Svg>
  )
}

export function IconoCamara(p: Props) {
  return (
    <Svg {...p}>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7a1 1 0 0 0 .83-.44l.94-1.4A1 1 0 0 1 9.8 3.7h4.4a1 1 0 0 1 .83.45l.94 1.4A1 1 0 0 0 16.8 6h1.7A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />
      <circle cx="12" cy="12.8" r="3.4" />
    </Svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Acreditación                                                                */
/* -------------------------------------------------------------------------- */

/**
 * El tilde. Con `animar`, se dibuja solo en 420ms.
 *
 * Es el feedback central de toda la app: la diferencia entre "toqué el botón" y
 * "la persona entró". Un tilde que aparece de golpe se confunde con uno que ya
 * estaba; uno que se dibuja no.
 */
export function IconoTick({ animar, ...p }: Props & { animar?: boolean }) {
  return (
    <Svg {...p}>
      <path d="M4.5 12.5l5 5 10-11" className={animar ? 'swc-tick' : undefined} />
    </Svg>
  )
}

/** Tilde dentro de un círculo: para la confirmación grande, no la de la fila. */
export function IconoTickCirculo({ animar, ...p }: Props & { animar?: boolean }) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" className={animar ? 'swc-circulo' : undefined} />
      <path d="M8 12.3l2.6 2.6L16 9.4" className={animar ? 'swc-tick' : undefined} />
    </Svg>
  )
}

/** Una cruz, para el escaneo que no sirvió. */
export function IconoCruz(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </Svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Gente                                                                       */
/* -------------------------------------------------------------------------- */

export function IconoPersona(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c0-3.6 3.4-5.6 7.5-5.6s7.5 2 7.5 5.6" />
    </Svg>
  )
}

/** Persona con un más: el alta de alguien que no estaba en la lista. */
export function IconoSumarPersona(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="9.5" cy="8" r="3.6" />
      <path d="M2.5 20c0-3.6 3.1-5.6 7-5.6 1 0 1.9.13 2.7.37" />
      <path d="M17.5 14v6M14.5 17h6" />
    </Svg>
  )
}

export function IconoBuscar(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </Svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Datos de la ficha                                                           */
/* -------------------------------------------------------------------------- */

export function IconoEntrada(p: Props) {
  return (
    <Svg {...p}>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5v2a2 2 0 0 0 0 3.9v2A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5v-2a2 2 0 0 0 0-3.9z" />
      <path d="M13 7v2M13 11.5v1.5M13 15.5V18" />
    </Svg>
  )
}

export function IconoDia(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Svg>
  )
}

export function IconoReloj(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.3l3.3 2" />
    </Svg>
  )
}

export function IconoEmpresa(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 21V6.5A1.5 1.5 0 0 1 5.5 5h7A1.5 1.5 0 0 1 14 6.5V21" />
      <path d="M14 11h4.5A1.5 1.5 0 0 1 20 12.5V21M2.5 21h19" />
      <path d="M7 9h4M7 13h4M7 17h4M17 15h0M17 18h0" />
    </Svg>
  )
}

export function IconoTelefono(p: Props) {
  return (
    <Svg {...p}>
      <path d="M6.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5z" />
      <path d="M10.5 17.5h3" />
    </Svg>
  )
}

export function IconoCanal(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    </Svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Estado                                                                      */
/* -------------------------------------------------------------------------- */

/** La ⓘ de los avisos: lo que conviene saber antes de apretar el botón. */
export function IconoInfo(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8h0" />
    </Svg>
  )
}

/** Recargar. Era un `⟳` de texto, que cada sistema dibuja de un tamaño distinto. */
export function IconoRecargar(p: Props) {
  return (
    <Svg {...p}>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4v4.5h-4.5" />
    </Svg>
  )
}

/** Triángulo de atención: el pago doble, el duplicado al dar de alta. */
export function IconoAlerta(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 4.2L21.2 20H2.8z" />
      <path d="M12 10v4M12 17h0" />
    </Svg>
  )
}

/** Sin señal: la nube tachada de la cola offline. */
export function IconoSinSenal(p: Props) {
  return (
    <Svg {...p}>
      <path d="M7.5 18.5h9.8a3.7 3.7 0 0 0 .7-7.3 5.5 5.5 0 0 0-9.2-3" />
      <path d="M7.5 18.5a3.5 3.5 0 0 1-.4-7" />
      <path d="M3 3l18 18" />
    </Svg>
  )
}

export function IconoSalir(p: Props) {
  return (
    <Svg {...p}>
      <path d="M14.5 4.5h3A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5h-3" />
      <path d="M10 8l-4 4 4 4M6 12h9" />
    </Svg>
  )
}

export function IconoDeshacer(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 9h11a5 5 0 0 1 0 10h-6" />
      <path d="M8 5L4 9l4 4" />
    </Svg>
  )
}
