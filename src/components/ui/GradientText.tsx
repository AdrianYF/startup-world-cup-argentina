import type { ElementType, ReactNode, ComponentPropsWithoutRef } from 'react'

type Variant = 'brand' | 'data'

const GRADIENTS: Record<Variant, string> = {
  // azul → violeta → magenta → coral. Para palabras-acento en titulos (H1/H2).
  brand: 'linear-gradient(90deg, #4F46E5 0%, #6c5ce7 35%, #c084fc 65%, #ff7675 100%)',
  // blanco → celeste. Para data numerica destacada (premio, countdown).
  data: 'linear-gradient(135deg, #ffffff 0%, #75AADB 40%, #75AADB 100%)',
}

type GradientTextProps<E extends ElementType> = {
  as?: E
  variant?: Variant
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<E>, 'as' | 'children'>

/**
 * Texto con gradient brand (azul→violeta→magenta→coral) o data (blanco→celeste).
 * Usar SOLO para palabras-acento o data destacada. NO usar para body text.
 * Ver /COLORS.md
 */
export function GradientText<E extends ElementType = 'span'>({
  as,
  variant = 'brand',
  children,
  className = '',
  style,
  ...rest
}: GradientTextProps<E>) {
  const Tag = (as ?? 'span') as ElementType
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
