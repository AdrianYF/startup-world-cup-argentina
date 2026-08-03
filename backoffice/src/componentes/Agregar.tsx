import { useMemo, useState, type FormEvent } from 'react'
import { Boton, Pildoras, type Opcion } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Campo, Opcional, Rotulo } from '../ui/Campos'
import { Hoja } from '../ui/Hoja'
import { mensajeDeError } from '../lib/api'
import type { Persona } from '../lib/tipos'

/**
 * Alta en el check-in: alguien que no está en ninguna lista y hay que dejar entrar.
 *
 * Pide lo mínimo. Con una persona parada adelante y cola atrás, cada campo de
 * más es tiempo — por eso sólo el nombre es obligatorio, y el mail, que en los
 * canales externos siempre viene, acá es opcional.
 *
 * Agregar y acreditar son un solo botón: a nadie se lo da de alta para dejarlo
 * afuera.
 */
type Datos = {
  nombre: string
  email?: string
  telefono?: string
  empresa?: string
  motivo?: string
}

type Props = {
  /** Lo que venía tipeado en el buscador. Casi siempre es el nombre. */
  inicial?: string
  dia: string
  /** Para avisar antes de crear a alguien que ya está. */
  buscarParecidos: (nombre: string) => Persona[]
  onCerrar: () => void
  onAgregar: (datos: Datos) => Promise<void>
}

/**
 * Por qué se lo deja entrar.
 *
 * Acá NO se cobra: la compra se hace afuera y el check-in sólo la valida.
 * «Compró, no figura» existe para marcar a quien dice haber comprado y no
 * aparece, y poder buscar su orden después. Los demás sirven para saber, al
 * cerrar el evento, de dónde salió cada alta.
 */
const MOTIVOS: Opcion<string>[] = [
  { id: '', label: 'Sin especificar' },
  { id: 'invitacion', label: 'Invitación' },
  { id: 'prensa', label: 'Prensa' },
  { id: 'speaker', label: 'Speaker' },
  { id: 'staff', label: 'Staff' },
  { id: 'comprada', label: 'Compró, no figura' },
]

function Agregar({ inicial = '', dia, buscarParecidos, onCerrar, onAgregar }: Props) {
  const [nombre, setNombre] = useState(inicial)
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Dar de alta a alguien que ya está crea una fila más y ensucia los conteos
  // —sin mail, el índice único de la base no lo puede atajar—. Se avisa acá, que
  // es el único momento en que alguien lo puede corregir.
  const parecidos = useMemo(
    () => (nombre.trim().length >= 3 ? buscarParecidos(nombre).slice(0, 3) : []),
    [nombre, buscarParecidos],
  )

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (nombre.trim().length < 2 || enviando) return

    setEnviando(true)
    setError('')
    try {
      await onAgregar({ nombre, email, telefono, empresa, motivo })
      onCerrar()
    } catch (err) {
      // El formulario NO se cierra: si el mail no pasó la validación, cerrarlo
      // obligaría a tipear todo de nuevo con la persona esperando adelante.
      setError(mensajeDeError(err))
      setEnviando(false)
    }
  }

  return (
    <Hoja
      titulo="Agregar a la lista"
      subtitulo={`Queda acreditada para el ${dia}, como alta de check-in.`}
      onCerrar={onCerrar}
      onSubmit={enviar}
      // Centrada en todos los anchos: son cinco campos y un aviso de duplicados,
      // y pegada abajo el teclado del celular se come la mitad del formulario.
      posicion="centrada"
      cerrar="Cancelar"
    >
      <div className="flex flex-col gap-4">
        <div>
          <Campo
            id="ag-nombre"
            label="Nombre y apellido"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            autoFocus
            autoComplete="off"
            autoCapitalize="words"
            required
            minLength={2}
          />
          {parecidos.length > 0 && (
            <Aviso
              tono="warn"
              className="mt-2"
              titulo={parecidos.length === 1 ? 'Ya hay alguien parecido' : 'Ya hay gente parecida'}
            >
              <ul className="text-xs">
                {parecidos.map(p => (
                  <li key={`${p.origen}-${p.id}`} className="truncate">
                    {p.nombre}
                    {p.empresa ? ` · ${p.empresa}` : ''}
                    <span className="text-gray-500"> · {p.entrada}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[11px] text-gray-500">
                Si es la misma persona, cerrá y buscala por apellido.
              </p>
            </Aviso>
          )}
        </div>

        <div>
          <Rotulo className="mb-1.5">Por qué entra</Rotulo>
          <Pildoras
            opciones={MOTIVOS}
            valor={motivo}
            onCambio={setMotivo}
            etiqueta="Motivo del alta"
            tam="sm"
          />
        </div>

        <Campo
          id="ag-email"
          label={<>Email<Opcional /></>}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          inputMode="email"
        />
        <Campo
          id="ag-telefono"
          label={<>Teléfono<Opcional /></>}
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          autoComplete="off"
          inputMode="tel"
        />
        <Campo
          id="ag-empresa"
          label={<>Empresa<Opcional /></>}
          value={empresa}
          onChange={e => setEmpresa(e.target.value)}
          autoComplete="off"
        />
      </div>

      {error && <Aviso tono="error" className="mt-4">{error}</Aviso>}

      <Boton
        type="submit"
        tono="ok"
        tam="lg"
        ancho
        className="mt-6"
        disabled={nombre.trim().length < 2}
        ocupado={enviando ? 'Agregando…' : undefined}
      >
        Agregar y acreditar
      </Boton>
    </Hoja>
  )
}

export default Agregar
