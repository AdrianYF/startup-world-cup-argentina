# Trofeo 3D en React Three Fiber (R3F) — Spec completo

Meta-prompt canónico de la copa para la sección "Camino a la Copa".

---

## Geometría (silueta por revolución, `LatheGeometry`)
Sólido radialmente simétrico. Perfil de abajo hacia arriba, con proporciones
relativas sobre una altura total **H = 1.0**:

- **Base escalonada** (3 escalones): `0.00 → 0.14 H`, radio máx **0.42**
- **Tambor cilíndrico** decorado: `0.14 → 0.30 H`, radio **0.30**
- **Anillo de laurel** (toro saliente): `0.30 → 0.36 H`, radio **0.34**
- **Tallo / fuste con éntasis** (curva sutil, no recto): `0.36 → 0.58 H`, radio **0.10 → 0.14**
- **Collar** (gola cóncava + nudo saliente): `0.58 → 0.66 H`, radio **0.22**
- **Bol hemisférico**: `0.66 → 1.00 H`, radio de boca **0.46**
- **Laurel fino** en el borde del bol, grosor **1/4** del grosor del bol

Cada banda del perfil queda en su lugar, **sin deformación**.
Referencia de silueta: trofeo Pegasus.

## Decoración barroca recursiva (vía normal + displacement map, no geometría)
- **Arabescos / rinceaux**: volutas acanto donde cada espiral genera espirales más
  chicas, autosimilar, **2–3 niveles de recursión**.
- Aplicar en: **tambor** (banda continua), **collar** (festón) y **arranque del bol**.
- **Protuberancias**: cuentas/perlas y **godrones (gadroons)** en el anillo y la base,
  como relieve real instanciado alrededor del eje (`InstancedMesh`, rotación radial).
- **Laurel fino** grabado en bajorrelieve en el borde del bol.
- **Inscripción grabada "STARTUP WORLD CUP ARGENTINA"** en el bol, continua,
  **sin logos de marca**, sin bordes negros, sin deformación.
- Ornamento continuo y simétrico, cada motivo en su lugar del perfil.

## Material (`MeshPhysicalMaterial`)
- Plata pulida espejada, realista, geometría legible.
- `metalness: 1.0`
- `roughness: 0.08` base, modulada por `roughnessMap` (imperfecciones).
- `clearcoat: 0.6`, `clearcoatRoughness: 0.15` (capa de brillo encima).
- `anisotropy: 0.4` con `anisotropyRotation` siguiendo la dirección del pulido,
  para reflejos alargados tipo metal cepillado fino.
- `envMapIntensity: 1.2`
- Reflejos neutros y limpios, sin tinte, sin lavado.

## Imperfecciones del metal (nobles, no mugre)
- `roughnessMap`: variación sutil del pulido, halos alrededor del grabado,
  microrayas finas direccionales.
- Micro-pitting muy leve y disperso, casi imperceptible.
- `normalMap` aporta el detalle del relieve + microabolladuras mínimas.
- Sin manchas negras, sin óxido, sin lavado ni sucio.

## Iluminación y sombra
- **Key light**: `SpotLight` cálida-neutra arriba-frente-izquierda, `castShadow`,
  penumbra alta para sombra suave.
- **Rim light**: luz fría detrás-arriba-derecha, para separar del fondo y marcar
  el borde del bol.
- **Fill**: luz suave frontal de relleno, baja intensidad, para abrir las sombras.
- **Environment** de Lightformers (`@react-three/drei`): 2–3 paneles rectangulares
  blancos como softbox de estudio, que dan los reflejos limpios sobre la plata.
  Preset neutro de estudio.
- **Sombra de piso**: `ContactShadows` debajo del trofeo (blur ~2.5, opacity ~0.5,
  resolution alta), para anclarlo a un piso aunque flote levemente.
  El trofeo no toca el piso pero proyecta su sombra.

## Comportamiento
- Rotación 360° continua y lenta sobre el eje Y.
- Leve flotación vertical (oscilación senoidal suave).
- Fondo transparente (el canvas no pinta fondo, lo pone la sección).

## Integración (web)
- Sección "Camino a la Copa", layout de 2 columnas.
- Fondo claro celeste, mismo tono que la sección "Pitch Battle".
- Copa grande, protagonista de la columna.

## Notas técnicas R3F
- **Geometría**: `LatheGeometry` con array de `Vector2` para el perfil; segmentos
  altos (>= 128) para que la curva del bol y el éntasis se lean limpios.
- **Relieve barroco**: `normalMap` + `displacementMap` sobre el lathe; cuentas y
  godrones como `InstancedMesh` distribuidos por ángulo.
- **Material**: `MeshPhysicalMaterial` con los maps de arriba.
- **Reflejos**: `<Environment>` con `<Lightformer>` de drei (no HDRI con tinte).
- **Sombra**: `<ContactShadows>` de drei.
- **Animación**: `useFrame` para rotación Y + flotación.
- **Canvas** con `alpha:true` y `antialias`; `shadows` habilitadas; `dpr [1, 2]`.

## Maps que necesita el material
- `normalMap` (arabescos recursivos + microdetalle)
- `displacementMap` (relieve barroco suave)
- `roughnessMap` (imperfecciones del pulido)
- *(opcional)* `aoMap` para profundizar las hendiduras del ornamento

---

## Versión 2 — Prompt corto (solo para generar la textura en un modelo de imagen)
> Textura PBR sin costuras (tileable) de plata pulida espejada para un trofeo
> barroco. Ornamento de volutas acanto recursivas (cada espiral genera espirales
> más chicas, autosimilar), rinceaux finos, cuentas y godrones. Bajorrelieve de
> laurel fino. Metal noble con imperfecciones sutiles: microrayas direccionales,
> pulido irregular, micro-pitting muy leve. Reflejos neutros y limpios, sin tinte,
> sin manchas negras, sin óxido. Iluminación de estudio plana, fondo neutro.
> Generar como set PBR: albedo, normal, displacement/height y roughness.
> Estilo: orfebrería realista, alta gama, detalle fino.
