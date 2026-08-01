/** @jsxRuntime automatic */
/** @jsxImportSource react */
//
// Las dos líneas de arriba no son decorativas: el tsconfig.json de la raíz es
// sólo un archivo de referencias, sin `compilerOptions`, así que el bundler que
// compila api/ no encuentra ningún `jsx` configurado y cae al transform clásico
// (`React.createElement`) sin importar React. Resultado: "React is not defined",
// en runtime y sólo en producción. Con el pragma, el transform queda fijado acá.
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components'

/**
 * Mail de confirmación con la entrada y su QR.
 *
 * Escrito con React Email en vez de un string de HTML: los componentes ya
 * resuelven las tablas anidadas y los estilos inline que los clientes de mail
 * necesitan, y se acabó el escapado a mano del nombre del comprador (React
 * escapa por definición).
 *
 * Resend lo renderiza solo cuando se le pasa por la prop `react`.
 *
 * Paleta del sitio: #020618 de fondo, #0f172b la tarjeta, #75AADB el acento.
 */

export type EntradaEmailProps = {
  nombre: string
  tierNombre: string
  unidades: string
  subtotal: string
  cargo: string
  total: string
  ordenId: string
  ticketUrl: string
  qrUrl: string
  fechas: string
}

const BG = '#020618'
const CARD = '#0f172b'
const ACENTO = '#75AADB'
const BORDE = 'rgba(117,170,219,0.25)'

export function EntradaEmail({
  nombre,
  tierNombre,
  unidades,
  subtotal,
  cargo,
  total,
  ordenId,
  ticketUrl,
  qrUrl,
  fechas,
}: EntradaEmailProps) {
  return (
    <Html lang="es-AR">
      <Head />
      {/* Lo que se ve en la bandeja, al lado del asunto. */}
      <Preview>
        Tu entrada para Startup World Cup Argentina 2026 — {tierNombre}
      </Preview>
      <Body style={body}>
        <Container style={card}>
          <Section style={{ padding: '28px 28px 0' }}>
            <Text style={kicker}>Startup World Cup Argentina</Text>
            <Heading as="h1" style={titulo}>
              ¡Listo, {nombre}!
            </Heading>
            <Text style={bajada}>
              Tu compra está confirmada. Nos vemos el <strong style={{ color: '#ffffff' }}>{fechas}</strong>.
            </Text>
          </Section>

          <Section style={{ padding: '24px 28px 0' }}>
            <Section style={detalle}>
              <Fila label="Entrada" valor={tierNombre} />
              <Fila label="Cantidad" valor={unidades} />
              <Fila label="Subtotal" valor={subtotal} />
              <Fila label="Cargo de servicio" valor={cargo} />
              <Hr style={separador} />
              <Fila label="Total" valor={total} destacado />
              <Fila label="Orden" valor={ordenId} mono />
            </Section>
          </Section>

          <Section style={{ padding: '26px 28px 0', textAlign: 'center' as const }}>
            <Text style={{ ...bajada, margin: '0 0 14px', fontSize: '13px' }}>
              Mostrá este código en la puerta
            </Text>
            {/* El QR va como imagen remota: los clientes de mail no ejecutan JS,
                así que el que dibuja el sitio con qrcode.react no les sirve. */}
            <Img
              src={qrUrl}
              width="180"
              height="180"
              alt="Código QR de tu entrada"
              style={qr}
            />
          </Section>

          <Section style={{ padding: '24px 28px 0', textAlign: 'center' as const }}>
            <Button href={ticketUrl} style={boton}>
              Ver mi entrada
            </Button>
          </Section>

          <Section style={{ padding: '22px 28px 28px' }}>
            <Text style={pie}>
              Si el código no se ve, abrí{' '}
              <Link href={ticketUrl} style={{ color: ACENTO }}>
                tu entrada en el sitio
              </Link>
              .
              <br />
              Guardá este mail: es tu comprobante.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

function Fila({
  label,
  valor,
  destacado,
  mono,
}: {
  label: string
  valor: string
  destacado?: boolean
  mono?: boolean
}) {
  return (
    <Row>
      <Column>
        <Text style={{ ...filaLabel, ...(destacado ? { color: '#ffffff', fontWeight: 700 } : {}) }}>
          {label}
        </Text>
      </Column>
      <Column align="right">
        <Text
          style={{
            ...filaValor,
            ...(destacado ? { fontSize: '15px', fontWeight: 800 } : {}),
            ...(mono ? { fontFamily: 'monospace', fontSize: '11px', fontWeight: 400 } : {}),
          }}
        >
          {valor}
        </Text>
      </Column>
    </Row>
  )
}

/* ---------- estilos ---------- */

const body = {
  margin: 0,
  padding: '32px 16px',
  backgroundColor: BG,
  fontFamily: 'Helvetica, Arial, sans-serif',
}

const card = {
  maxWidth: '520px',
  margin: '0 auto',
  backgroundColor: CARD,
  border: `1px solid ${BORDE}`,
  borderRadius: '16px',
  overflow: 'hidden' as const,
}

const kicker = {
  margin: 0,
  color: ACENTO,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
}

const titulo = {
  margin: '8px 0 0',
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: 800,
  lineHeight: 1.2,
}

const bajada = {
  margin: '10px 0 0',
  color: '#9ca3af',
  fontSize: '15px',
  lineHeight: 1.5,
}

const detalle = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(117,170,219,0.15)',
  borderRadius: '12px',
  padding: '10px 20px',
}

const filaLabel = { margin: '6px 0', color: '#9ca3af', fontSize: '13px' }
const filaValor = {
  margin: '6px 0',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 700,
  textAlign: 'right' as const,
}

const separador = { borderColor: 'rgba(117,170,219,0.2)', margin: '8px 0' }

const qr = {
  display: 'block',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  padding: '12px',
  borderRadius: '12px',
}

const boton = {
  backgroundColor: ACENTO,
  color: '#0f172b',
  fontSize: '14px',
  fontWeight: 800,
  textDecoration: 'none',
  padding: '13px 30px',
  borderRadius: '999px',
}

const pie = {
  margin: 0,
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: 1.6,
  textAlign: 'center' as const,
}

export default EntradaEmail
