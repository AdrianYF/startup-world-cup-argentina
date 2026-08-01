#!/usr/bin/env node
/**
 * Audit WCAG 2.1 AA de contraste para la paleta del sitio.
 * Calcula ratio contra los pares (foreground, background) más usados.
 * AA normal text: >= 4.5 · AA large text (18pt+ o 14pt bold+): >= 3.0 · UI / non-text: >= 3.0
 */

// sRGB → relative luminance
function luminance(hex) {
  const c = hex.replace('#', '')
  const rgb = [0, 2, 4].map(i => parseInt(c.substring(i, i + 2), 16) / 255)
  const lin = rgb.map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

function contrast(fg, bg) {
  const L1 = luminance(fg)
  const L2 = luminance(bg)
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}

const tokens = {
  white:          '#ffffff',
  primary:        '#6c5ce7',
  primarySoft:    '#a89cf0',
  primaryDark:    '#5848c4',
  accent:         '#ff7675',
  celeste:        '#75AADB',
  bg:             '#020618',
  surface:        '#0f172b',
  muted:          '#62748e',
  mutedSoft:      '#90a1b9',
  gray400:        '#9ca3af',
  gray300:        '#d1d5db',
  gray200:        '#e5e7eb',
  gray500:        '#6b7280',
  oro:            '#d4af37',
  oroClaro:       '#f3e6b3',
}

// Solo combinaciones que se usan REALMENTE en el código actual.
const checks = [
  ['white',       'bg',       'Body text en bg',                     'normal'],
  ['white',       'surface',  'Body en surface (modals)',            'normal'],
  ['gray400',     'bg',       'Muted text en bg',                    'normal'],
  ['gray300',     'bg',       'Texto gray-300 en bg',                'normal'],
  ['gray200',     'surface',  'Modal body text',                     'normal'],
  ['mutedSoft',   'bg',       'Slate-400 en bg',                     'normal'],
  // brand colors as foreground
  ['primary',     'bg',       'Violet en bg (links, accents)',       'large'],
  ['primarySoft', 'bg',       'Violet-soft en bg (badges, ✓)',       'normal'],
  ['accent',      'bg',       'Coral en bg (CTA Voluntarios)',       'large'],
  ['celeste',     'bg',       'Celeste en bg (títulos)',             'large'],
  // brand as background — texto blanco/slate
  ['white',       'primary',     'White en botón violeta',           'normal'],
  ['surface',     'accent',      'Slate en botón coral (FIX)',       'normal'],
  ['white',       'primaryDark', 'White en primary-dark (hover)',    'normal'],
  // checkout — el modal de compra y las pantallas de /gracias y /entrada
  ['gray400',     'surface',  'Labels del form de compra',           'normal'],
  ['gray300',     'surface',  'Perks del modal de compra',           'normal'],
  // Ambos son texto chico (14px), así que van contra el umbral normal (4.5), no
  // contra el de texto grande.
  ['accent',      'surface',  'Error del form / "ya usada"',         'normal'],
  ['celeste',     'surface',  'Check ✓ y acentos del modal',         'normal'],
  // Dorado de la Entrada VIP. Sobre dorado va texto OSCURO: el blanco da 2,10 y
  // no llega al 4,5 de AA — ver el bloque de prohibidas.
  ['oro',         'bg',       'Oro en bg (borde y ✓ de la VIP)',     'normal'],
  ['surface',     'oro',      'Texto del badge y del botón VIP',     'normal'],
  ['oroClaro',    'bg',       'Oro claro en bg',                     'normal'],
]

/**
 * Combinaciones que NO se usan, y por qué. El audit las verifica al revés: si
 * alguna empezara a pasar, es que cambió un token y hay que revisar la nota.
 */
const prohibidas = [
  ['white', 'oro', 'Blanco sobre dorado — por eso el botón VIP lleva texto oscuro'],
]

const required = { normal: 4.5, large: 3.0 }
let pass = 0
let fail = 0
const failures = []

console.log('\n  WCAG 2.1 AA Contrast Audit — Startup World Cup Argentina')
console.log('  ─────────────────────────────────────────────────────────\n')
console.log('  Fg / Bg            Hex      / Hex      Ratio   Need    Result   Use case')

for (const [fgKey, bgKey, label, type] of checks) {
  const fg = tokens[fgKey]
  const bg = tokens[bgKey]
  const r = contrast(fg, bg)
  const need = required[type]
  const ok = r >= need
  if (ok) pass++; else { fail++; failures.push({ fgKey, bgKey, ratio: r, need, label, type }) }
  console.log(
    `  ${fgKey.padEnd(11)}/ ${bgKey.padEnd(8)} ${fg} / ${bg}  ${r.toFixed(2).padStart(5)}  >=${need.toFixed(1)}  ${ok ? 'PASS' : 'FAIL'}    ${label} (${type})`
  )
}

console.log('\n  Combinaciones prohibidas (tienen que seguir fallando):')
for (const [fgKey, bgKey, motivo] of prohibidas) {
  const r = contrast(tokens[fgKey], tokens[bgKey])
  const sigueMal = r < required.normal
  if (sigueMal) pass++
  else {
    fail++
    failures.push({ fgKey, bgKey, ratio: r, need: required.normal, type: 'normal',
      label: `${motivo} — YA NO FALLA: revisar la nota` })
  }
  console.log(`  ${fgKey.padEnd(11)}/ ${bgKey.padEnd(8)} ${r.toFixed(2).padStart(5)}   ${sigueMal ? 'OK (no se usa)' : 'REVISAR'}   ${motivo}`)
}

console.log(`\n  Total: ${pass} pass · ${fail} fail\n`)
if (failures.length) {
  console.log('  Failures que requieren atención:')
  for (const f of failures) {
    console.log(`    - ${f.fgKey} on ${f.bgKey}: ${f.ratio.toFixed(2)} (need ${f.need}) — ${f.label}`)
  }
  process.exit(1)
}
