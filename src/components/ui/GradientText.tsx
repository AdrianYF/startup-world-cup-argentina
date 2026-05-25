import type { ReactNode, CSSProperties, HTMLAttributes } from 'react'

type Variant = 'brand' | 'data'

const GRADIENTS: Record<Variant, string> = {
  // azul → violeta → magenta → coral. Para palabras-acento en titulos (H1/H2).
  brand: 'linear-gradient(90deg, #4F46E5 0%, #6c5ce7 35%, #c084fc 65%, #ff7675 100%)',
  // blanco → celeste. Para data numerica destacada (premio, countdown).
  data: 'linear-gradient(135deg, #ffffff 0%, #75AADB 40%, #75AADB 100%)',
}

type GradientTextProps = {
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'strong'
  variant?: Variant
  children: ReactNode
  className?: string
  style?: CSSProperties
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'style'>

/**
 * Texto con gradient brand (azul→violeta→magenta→coral) o data (blanco→celeste).
 * Usar SOLO para palabras-acento o data destacada. NO usar para body text.
 * Ver /COLORS.md
 */
export function GradientText({
  as: Tag = 'span',
  variant = 'brand',
  children,
  className = '',
  style,
  ...rest
}: GradientTextProps) {
  return (
    <Tag
      {...rest}
      className={`bg-clip-text text-transparent ${className}`}
      style={{ backgroundImage: GRADIENTS[variant], ...style }}
    >
      {children}
    </Tag>
  )
}

export default GradientText
