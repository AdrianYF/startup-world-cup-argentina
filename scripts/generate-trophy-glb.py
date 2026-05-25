#!/usr/bin/env python3
"""
generate-trophy-glb.py — convierte public/gold.png en un GLB 3D volumétrico
usando heightmap + silueta inflada (balloon-style inflation).

Algoritmo:
  1. Downsample del PNG a un grid manejable (TARGET_GRID_W)
  2. Para cada pixel "on" (alpha > umbral):
       z_inflated = sqrt(distance_transform_edt(alpha_mask)) * INFLATION_HEIGHT
       z_relief   = luminance(rgb) * RELIEF_AMPLITUDE
       z          = gaussian_blur(z_inflated + z_relief, sigma=SMOOTH_SIGMA)
  3. Construye triángulos solo entre quads "on-on-on-on"
  4. Mirror al back side (z negativo) + sella perímetro
  5. UVs planares (u=x/w, v=1-y/h) → la PNG matchea 1:1 front y back
  6. Centra, normaliza escala a 2 unidades, flip Y, exporta GLB con textura embebida

Run:
  /tmp/.glb-venv/bin/python scripts/generate-trophy-glb.py [--output trophy-v2.glb]
"""
import argparse
import os
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, gaussian_filter
import trimesh


# ────────────────────────────── tuneables ──────────────────────────────
TARGET_GRID_W = 256       # resolución horizontal del grid
INFLATION_WEIGHT = 0.80   # peso relativo del componente "balloon" en el heightmap (0..1)
RELIEF_WEIGHT = 0.20      # peso del componente "luminancia" en el heightmap (0..1)
MAX_Z_RATIO = 0.15        # amplitud z final como fracción del ancho de imagen (depth real ≈ 2 × este valor)
SMOOTH_SIGMA = 1.5        # gaussian blur del heightmap
ALPHA_THRESHOLD = 128     # binarización del alfa


def build_mesh(src_path: str, out_path: str) -> None:
    img = Image.open(src_path).convert('RGBA')
    w0, h0 = img.size
    print(f'[1/7] input: {src_path} | {w0}×{h0}')

    # 1. Downsample manteniendo aspect ratio
    scale = TARGET_GRID_W / w0
    nw, nh = TARGET_GRID_W, int(round(h0 * scale))
    img_small = img.resize((nw, nh), Image.LANCZOS)
    arr = np.array(img_small)
    rgb = arr[:, :, :3].astype(np.float32)
    alpha = arr[:, :, 3]
    mask = alpha > ALPHA_THRESHOLD
    print(f'[2/7] downsample: {nw}×{nh} | on-pixels: {mask.sum():,} / {mask.size:,}')

    # 2a. Inflación tipo globo via distance transform (normalizado 0..1)
    dist = distance_transform_edt(mask)
    dist_max = dist.max() if dist.max() > 0 else 1.0
    z_inflated = np.sqrt(dist / dist_max)  # ∈ [0, 1]
    print(f'[3/7] distance transform: max_dist={dist_max:.1f}px')

    # 2b. Relieve por luminancia (normalizado 0..1)
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    lum_norm = (lum / 255.0) * mask  # 0 fuera de la silueta

    # 2c. Composición ponderada en [0, 1]
    z = INFLATION_WEIGHT * z_inflated + RELIEF_WEIGHT * lum_norm
    z = gaussian_filter(z, sigma=SMOOTH_SIGMA)
    z = z * mask  # forzar 0 fuera de silueta tras blur
    # 2d. Re-escala absoluta: z amplitude = MAX_Z_RATIO × ancho_imagen (en unidades mask = nw)
    z_max = z.max() if z.max() > 0 else 1.0
    target_z = MAX_Z_RATIO * (nw / nw)  # = MAX_Z_RATIO (ancho normalizado es 'aspect')
    # En las coords de vértice usaremos xs ∈ [0, aspect] (ver paso 3), así que escalamos z a un fraction de aspect
    aspect_for_z = nw / nh  # aspect ratio del grid
    target_z_amplitude = MAX_Z_RATIO * aspect_for_z
    z = z * (target_z_amplitude / z_max)
    print(f'[4/7] heightmap: z_min={z.min():.3f}, z_max={z.max():.3f}, target_z={target_z_amplitude:.3f}')

    # 3. Vertices front (z positivo) — solo donde mask es True
    # Coords normalizadas: x ∈ [0, 1] * aspect_ratio, y ∈ [0, 1]
    aspect = nw / nh
    xs = np.arange(nw) / (nw - 1) * aspect
    ys = np.arange(nh) / (nh - 1)

    # Index map: pixel (y,x) → vertex id (o -1 si no está en mask)
    vmap_front = np.full((nh, nw), -1, dtype=np.int64)
    vmap_back = np.full((nh, nw), -1, dtype=np.int64)
    front_verts = []
    back_verts = []
    uvs_front = []
    uvs_back = []

    for y in range(nh):
        for x in range(nw):
            if mask[y, x]:
                vmap_front[y, x] = len(front_verts)
                front_verts.append((xs[x], ys[y], float(z[y, x])))
                uvs_front.append((x / (nw - 1), 1.0 - y / (nh - 1)))

    n_front = len(front_verts)
    for y in range(nh):
        for x in range(nw):
            if mask[y, x]:
                vmap_back[y, x] = n_front + len(back_verts)
                back_verts.append((xs[x], ys[y], -float(z[y, x])))
                uvs_back.append((x / (nw - 1), 1.0 - y / (nh - 1)))

    print(f'[5/7] vertices: {n_front:,} front + {len(back_verts):,} back = {n_front + len(back_verts):,}')

    # 4. Triángulos front: quad (y,x)-(y,x+1)-(y+1,x+1)-(y+1,x) split en 2 tris
    # Solo si los 4 vértices existen (mask True en los 4)
    faces = []
    for y in range(nh - 1):
        for x in range(nw - 1):
            v00 = vmap_front[y, x]
            v01 = vmap_front[y, x + 1]
            v10 = vmap_front[y + 1, x]
            v11 = vmap_front[y + 1, x + 1]
            if v00 >= 0 and v01 >= 0 and v10 >= 0 and v11 >= 0:
                # CCW para que el normal apunte hacia +Z
                faces.append((v00, v10, v11))
                faces.append((v00, v11, v01))

                # Back side: mismo quad pero CW (flipped) en mirror -Z
                b00 = vmap_back[y, x]
                b01 = vmap_back[y, x + 1]
                b10 = vmap_back[y + 1, x]
                b11 = vmap_back[y + 1, x + 1]
                faces.append((b00, b11, b10))
                faces.append((b00, b01, b11))

    # 5. Sellado lateral: borde = pixeles "on" cuyo vecino es "off" (o fuera del grid)
    # Para cada arista del borde, conecto front[v] con back[v] formando un quad con su vecino borde
    # Estrategia simple: iteramos pares adyacentes (horizontal y vertical) donde uno está "on" y el otro "off",
    # eso define un edge border. Conectamos el edge front con su back-mirror.
    def is_on(y, x):
        return 0 <= y < nh and 0 <= x < nw and mask[y, x]

    # Direcciones del vecino "off" + las dos esquinas del edge a conectar
    # edge horizontal: pixel (y,x) on, (y+1,x) off → edge entre (y,x) y (y,x+1) si (y,x+1) también on
    # Más simple: iterar cada vertice on; si alguno de sus 4 vecinos está off → contribuir al perímetro
    # Mejor: detectar edges como segmentos entre vértices adyacentes que están en el borde de la región
    border_edges = []  # lista de (v_front_a, v_front_b) — los back se computan vía vmap_back

    # Edges horizontales: entre (y,x) y (y,x+1)
    for y in range(nh):
        for x in range(nw - 1):
            a_on = mask[y, x]
            b_on = mask[y, x + 1]
            if a_on and b_on:
                # Edge interno solo si el pixel "de arriba" o "de abajo" está off en al menos uno de los lados
                above_off = not (is_on(y - 1, x) and is_on(y - 1, x + 1))
                below_off = not (is_on(y + 1, x) and is_on(y + 1, x + 1))
                if above_off and y == 0:
                    border_edges.append((vmap_front[y, x], vmap_front[y, x + 1], 'top'))
                elif below_off and y == nh - 1:
                    border_edges.append((vmap_front[y, x], vmap_front[y, x + 1], 'bottom'))
                elif above_off:
                    border_edges.append((vmap_front[y, x], vmap_front[y, x + 1], 'top'))
                elif below_off:
                    border_edges.append((vmap_front[y, x], vmap_front[y, x + 1], 'bottom'))

    # Edges verticales: entre (y,x) y (y+1,x)
    for y in range(nh - 1):
        for x in range(nw):
            a_on = mask[y, x]
            b_on = mask[y + 1, x]
            if a_on and b_on:
                left_off = not (is_on(y, x - 1) and is_on(y + 1, x - 1))
                right_off = not (is_on(y, x + 1) and is_on(y + 1, x + 1))
                if left_off and x == 0:
                    border_edges.append((vmap_front[y, x], vmap_front[y + 1, x], 'left'))
                elif right_off and x == nw - 1:
                    border_edges.append((vmap_front[y, x], vmap_front[y + 1, x], 'right'))
                elif left_off:
                    border_edges.append((vmap_front[y, x], vmap_front[y + 1, x], 'left'))
                elif right_off:
                    border_edges.append((vmap_front[y, x], vmap_front[y + 1, x], 'right'))

    # Generar quads de pared lateral
    # Para cada edge front (v_a, v_b), conecto con back (v_a_back, v_b_back) → quad → 2 tris
    # Winding según side para que normals apunten "hacia afuera"
    for edge in border_edges:
        v_a, v_b, side = edge
        # Buscar back-equivalents: front_verts[i] tiene la misma (x,y) que back_verts[i - n_front... ]
        # Pero el ordering puede diferir. Solución: armar diccionario inverso una sola vez.
        pass

    # Simplification: armo un index map de front→back desde vmap_front/vmap_back
    front_to_back = {}
    for y in range(nh):
        for x in range(nw):
            if vmap_front[y, x] >= 0:
                front_to_back[vmap_front[y, x]] = vmap_back[y, x]

    for v_a, v_b, side in border_edges:
        a_back = front_to_back[v_a]
        b_back = front_to_back[v_b]
        # Quad: v_a (front) - v_b (front) - b_back - a_back
        # Winding depende de side para que normal apunte hacia afuera
        if side in ('top', 'right'):
            faces.append((v_a, v_b, b_back))
            faces.append((v_a, b_back, a_back))
        else:  # bottom, left
            faces.append((v_a, b_back, v_b))
            faces.append((v_a, a_back, b_back))

    print(f'[6/7] faces: {len(faces):,} ({len(border_edges):,} border edges sellados)')

    # 6. Build mesh
    all_verts = np.array(front_verts + back_verts, dtype=np.float64)
    all_uvs = np.array(uvs_front + uvs_back, dtype=np.float64)
    all_faces = np.array(faces, dtype=np.int64)

    mesh = trimesh.Trimesh(vertices=all_verts, faces=all_faces, process=False)

    # 7. Normalización
    mesh.apply_translation(-mesh.centroid)
    extents = mesh.extents
    norm_scale = 2.0 / max(extents[0], extents[1])
    mesh.apply_scale(norm_scale)
    # Flip Y: en image-coords y crece down, en 3D-coords y crece up
    flip = trimesh.transformations.scale_matrix(-1, direction=[0, 1, 0])
    mesh.apply_transform(flip)

    # Arreglar winding tras el flip Y: compensa el cambio de handedness
    # (sin esto las normals quedan invertidas, los faces se ven "del revés" en raytraced)
    mesh.invert()
    mesh.fix_normals()

    # Cerrar gaps del sellado perimétrico (mi algoritmo de border edges deja agujeritos
    # en juntas de pixel diagonales — fill_holes los completa)
    trimesh.repair.fill_holes(mesh)
    mesh.process(validate=True)

    # Textura: re-usa el PNG original con UVs ya computadas
    mesh.visual = trimesh.visual.TextureVisuals(uv=all_uvs, image=img)

    # Sanity check
    print()
    print('═══ MESH STATS ═══')
    print(f'verts:         {len(mesh.vertices):,}')
    print(f'faces:         {len(mesh.faces):,}')
    print(f'extents:       {mesh.extents}')
    print(f'volume:        {mesh.volume:.4f}  (cookie-cutter actual = 0)')
    print(f'is_watertight: {mesh.is_watertight}')
    print()

    mesh.export(out_path)
    out_size = os.path.getsize(out_path)
    print(f'[7/7] exported: {out_path} | {out_size:,} bytes ({out_size / 1024 / 1024:.2f} MB)')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--input',
        default='public/gold.png',
        help='PNG con transparencia (default: public/gold.png)',
    )
    parser.add_argument(
        '--output',
        default='public/trophy-v2.glb',
        help='GLB destino (default: public/trophy-v2.glb)',
    )
    args = parser.parse_args()
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = os.path.join(repo_root, args.input)
    dst = os.path.join(repo_root, args.output)
    if not os.path.exists(src):
        print(f'ERROR: no existe {src}', file=sys.stderr)
        return 1
    build_mesh(src, dst)
    return 0


if __name__ == '__main__':
    sys.exit(main())
