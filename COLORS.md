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
| `--color-swc-muted` | `#9ca3af` (gray-400) | Texto muted, captions, info secundaria |
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

### Backgrounds de sección

- **Dark default**: `bg-[#020618]` (slate-950) — Hero, Stats, Ruta, Builders, Tickets, Startups, Partners, Speakers
- **Light alternating**: `bg-white text-[#020618]` — Agenda, Apoyan, FAQ, PitchBattle, Voluntarios
- **Surface (cards/modals)**: `bg-[#0f172b]` (slate-900)

## Lo que NO se hace

- ❌ Usar `gradient-brand` en body text, microcopy, labels, paragraphs.
- ❌ Usar `gradient-brand` y `gradient-data` simultáneamente en el mismo bloque (rompe jerarquía).
- ❌ Usar colores hex hardcoded fuera de los tokens listados acá (ej. otros violetas, otros corales).
- ❌ Usar gradient en botones (ilegible al hover, mata el contraste WCAG).
- ❌ Usar `text-[#75AADB]` plano para títulos H1/H2 — usar `gradient-brand` vía `<GradientText>`.

## Cómo agregar un nuevo color

1. Si es un caso único: NO. Buscá si alguno de los tokens existentes funciona.
2. Si realmente hace falta uno nuevo: agregarlo al `@theme` en `src/index.css` Y documentarlo acá con su rol semántico. No usar arbitrary values en componentes.

## Audit

Correr `node scripts/contrast-audit.mjs` antes de cada release para verificar que todas las combinaciones text/bg pasan WCAG 2.1 AA.
