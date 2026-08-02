# Color system — Startup World Cup Argentina

Reglas para mantener la consistencia visual del sitio. Si un color no aparece acá, no se usa.

## Tokens

| Token | Valor | Rol |
|---|---|---|
| `--color-swc-bg` | `#020618` (slate-950) | Fondo principal dark de la mayoría de secciones |
| `--color-swc-surface` | `#0f172b` (slate-900) | Surface elevado: modals, cards, drawers |
| `--color-swc-light` | `#ffffff` | Texto primario sobre fondos dark |
| `--color-swc-accent` | `#75AADB` (celeste argentino) | Separadores, dots, glows ambientales, micro-acentos |
| `--color-swc-accent-dark` | `#5a93c5` | Hover de elementos celeste |
| `--color-swc-violet` | `#6c5ce7` | Centro del gradient brand (uso semántico limitado) |
| `--color-swc-coral` | `#ff7675` | Acento alternativo (Voluntarios, fin del gradient) |
| `--color-swc-orange` | `#ff6600` | Naranja Silicon Valley. Único uso: el asterisco de "AGENDA TENTATIVA*" |
| `--color-swc-muted` | `#9ca3af` (gray-400) | Texto muted, captions, info secundaria |
| `--color-swc-oro` | `#d4af37` | Dorado VIP: borde, badge, ✓ y fondo de botón de la Entrada VIP |
| `--color-swc-oro-claro` | `#f3e6b3` | Brillo del gradiente dorado |
| `--color-swc-oro-oscuro` | `#a67c00` | Sombra del gradiente dorado y hover del botón |
| `--gradient-brand` | `linear-gradient(90deg, #4F46E5 0%, #6c5ce7 35%, #c084fc 65%, #ff7675 100%)` | Palabras-acento en títulos |
| `--gradient-data` | `linear-gradient(135deg, #ffffff 0%, #75AADB 40%, #75AADB 100%)` | Data numérica destacada |

## Reglas por elemento

### Títulos H1 / H2

- **Palabra-acento** (la que destaca del título): **`gradient-brand`** vía `<GradientText>`
  - Ej: ARGENTINA (Hero), EVOLUCIÓN (Ruta), PITCH (Pitch Battle), PUERTA (Tickets), VOLUNTARI@ (Voluntarios), SPEAKERS, APOYAN, etc.
- **Palabras-contexto** (resto del título): `text-white`

```tsx
<h2>
  <span className="text-white">RUTA DE </span>
  <GradientText>EVOLUCIÓN</GradientText>
</h2>
```

### Data destacada

- "1 Million USD" del premio, números del countdown: **`gradient-data`** (blanco → celeste).
- Distinto al brand a propósito — separa "esto es información" de "esto es marca".

```tsx
<GradientText variant="data">1 Million</GradientText>
```

### Botones

| Tipo | Estilo |
|---|---|
| **Primary** | `bg-[#75AADB] hover:bg-[#5a93c5] text-white` — la acción esperada principal |
| **Secondary** | `border border-white/30 hover:border-[#75AADB] text-white` — alternativa |
| **Voluntarios (especial)** | `bg-[#ff7675] hover:bg-[#e85e5d] text-[#0f172b]` — solo para CTAs de voluntariado |

### Texto body

- Importante: `text-gray-300`
- Standard: `text-gray-400`
- Muted/microcopy: `text-white/55` o `text-white/60`
- Captions con tracking: `text-white/70 tracking-[0.3em] uppercase`

### Separadores y bordes

- **Sección → sección** (línea horizontal 1px): gradient celeste fade-out

```html
<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
```

- **Bordes de cards**: `border-white/10` (normal), `border-[#75AADB]/30` (hover/focus), `border-[#75AADB]` (active/selected)

### Dorado VIP (solo la Entrada VIP)

La Entrada VIP cuesta casi el doble que la general y hasta ahora se pintaba igual
que las tandas agotadas. El dorado la separa.

No es una paleta nueva: son los tres tonos del ticket premio de Pitch Battle
(`src/components/ui/WorldCupTicket.tsx`), donde el dorado ya significaba "esto es
lo excepcional".

Se activa desde el contenido, no desde el código: la card lleva `"acento": "oro"`
en `src/content/tickets.json` y `Tickets.tsx` / `TicketCheckoutModal.tsx` lo
leen. Ninguna otra card lo usa.

| Elemento | Estilo |
|---|---|
| Borde de la card | `border-[#d4af37]/45` |
| Glow | `shadow-[0_0_24px_-6px_rgba(212,175,55,0.35)]` |
| Badge | `bg-[#d4af37] text-[#0f172b]` |
| ✓ de los perks | `text-[#d4af37]` |
| Botón | `bg-[#d4af37] text-[#0f172b] hover:bg-[#c19f2f]` |

**Sobre dorado va siempre texto oscuro.** Blanco sobre `#d4af37` da **2,10** y no
llega al 4,5 de AA; `#0f172b` da **8,48**. Mismo problema que ya tenía el chip
"Más rápido" sobre celeste, y misma solución.

El botón va plano y no con gradiente: es la regla general de abajo, y acá además
un gradiente dorado con texto oscuro pierde contraste en el extremo claro.

### Acentos por día (solo Agenda)

La Agenda le da identidad a cada jornada con una rampa fría: celeste `#75AADB` (día 1)
→ azul `#3B82F6` (día 2) → índigo `#6366F1` (día 3). Vive como el array `ACENTOS` en
`src/components/Agenda.tsx`, no como token CSS: el componente calcula tintes `rgba()`
en runtime (fondo de fila, borde, gradient del header) y necesita el hex en JS.

Excepción acotada a esa sección. No usar esta rampa en otro lado.

El asterisco de "AGENDA TENTATIVA\*" queda fuera de la rampa: va siempre en
`--color-swc-orange` (`#ff6600`). Es el único punto cálido de la sección y no
sigue al día activo — recupera el naranja del diseño original.

### Fondo de sección dark

Las secciones dark de contenido llevan `<SectionGlow />`
(`src/components/ui/SectionGlow.tsx`): dos radiales azules anclados arriba. Nació en
la Agenda y hoy lo comparten Tickets, Participan y Apoyan.

Va como primer hijo de la `<section>` (que tiene que ser `relative`) y el contenedor
del contenido necesita `relative`, si no el gradiente lo tapa.

Quedan afuera: Hero (fondo propio con video), FAQ (blanca) y Footer (cierre).

### Backgrounds de sección

- **Dark default**: `bg-[#020618]` (slate-950) — Hero, Stats, Ruta, Builders, Tickets, Startups, Partners, Speakers, Agenda
- **Light alternating**: `bg-white text-[#020618]` — Apoyan, FAQ, PitchBattle, Voluntarios
- **Surface (cards/modals)**: `bg-[#0f172b]` (slate-900)

## Lo que NO se hace

- ❌ Usar `gradient-brand` en body text, microcopy, labels, paragraphs.
- ❌ Usar `gradient-brand` y `gradient-data` simultáneamente en el mismo bloque (rompe jerarquía).
- ❌ Usar colores hex hardcoded fuera de los tokens listados acá (ej. otros violetas, otros corales).
- ❌ Usar gradient en botones (ilegible al hover, mata el contraste WCAG).
- ❌ Usar `text-[#75AADB]` plano para títulos H1/H2 — usar `gradient-brand` vía `<GradientText>`.

## Cómo agregar un nuevo color

1. Si es un caso único: NO. Buscá si alguno de los tokens existentes funciona.
2. Si realmente hace falta uno nuevo: agregarlo al `@theme` en `src/marca.css` Y documentarlo acá con su rol semántico. No usar arbitrary values en componentes.

`src/marca.css` es el archivo compartido por las dos apps del repo — el sitio
(`src/index.css`) y la puerta (`puerta/src/estilos.css`). Un token que se agregue
sólo en una de las dos se desincroniza a la primera.

## Audit

Correr `node scripts/contrast-audit.mjs` antes de cada release para verificar que todas las combinaciones text/bg pasan WCAG 2.1 AA.
