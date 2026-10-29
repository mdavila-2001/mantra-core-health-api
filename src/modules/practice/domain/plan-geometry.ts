/**
 * Geometría del plano de planta (CONTRATO-PLANO §1.2, INV-PL-02/04/05).
 *
 * Funciones puras, sin Nest ni ORM. Espejan **a propósito** las funciones
 * `practice.plan_*` del patch F1c del modelo (`plan_rect_vertices`,
 * `plan_polygon_is_simple`, `plan_shrink_vertices`, `plan_polygon_area`…): el
 * servidor rechaza antes de escribir lo que la base rechazaría, y puede decir
 * **cuál** figura choca con **cuál** y por cuántos m² (la base sólo dice
 * «exclusion_violation»). La base sigue siendo la red de seguridad: si este
 * archivo y ella discrepan, gana la base y el caso se registra.
 *
 * Coordenadas en metros; x hacia la derecha, y hacia abajo. Sin librerías de
 * recorte de polígonos: la intersección usa triangulación por orejas más
 * recorte convexo (Sutherland–Hodgman), exacta para polígonos simples.
 */

/** Un punto `[x, y]` en metros. */
export type Pt = readonly [number, number];
/** Vértices de una figura (sin repetir el primero al final). */
export type Vertices = readonly Pt[];
/** Caja envolvente `[minX, minY, maxX, maxY]`. */
export type Bbox = readonly [number, number, number, number];

/** Límites de la geometría (los mismos del modelo y del catálogo). */
export const GEOMETRY_LIMITS = {
  /** Vértices por figura. */
  maxVertices: 64,
  /** |x| y |y| máximos, en metros. */
  maxCoordinateM: 100_000,
  /** Lado mínimo de un rectángulo. */
  minRectSideM: 0.05,
  /** Lado máximo de un rectángulo. */
  maxRectSideM: 1000,
} as const;

/** Tolerancia numérica de las pruebas de orientación (igual que `plan_orient`). */
const EPS = 1e-9;

/** Por qué una figura no es válida. */
export type GeometryProblemCode =
  | 'VERTEX_COUNT'
  | 'NOT_FINITE'
  | 'OUT_OF_RANGE'
  | 'REPEATED_VERTEX'
  | 'AREA_ZERO'
  | 'SPIKE'
  | 'SELF_INTERSECTION'
  | 'RECT_SIZE'
  | 'ROTATION';

/** Problema de geometría, con un texto para personas. */
export interface GeometryProblem {
  /** Código estable. */
  readonly code: GeometryProblemCode;
  /** Mensaje para personas, sin datos del sistema. */
  readonly message: string;
}

/** Redondea a 3 decimales (milímetro), como `round(…, 3)` del modelo. */
export function round3(value: number): number {
  return Math.round(value * 1000 + Number.EPSILON * Math.sign(value)) / 1000;
}

/** Redondea a `digits` decimales. */
function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Vértices de un rectángulo rotable (`practice.plan_rect_vertices`).
 *
 * `rotationDeg` es **horaria en pantalla** (y hacia abajo), igual que `rotate()`
 * de SVG; `widthM` va sobre el eje x local y `depthM` sobre el y local.
 *
 * @param centerX - Centro x.
 * @param centerY - Centro y.
 * @param widthM - Ancho local.
 * @param depthM - Fondo local.
 * @param rotationDeg - Rotación en grados.
 * @returns Los cuatro vértices, redondeados al milímetro.
 */
export function rectVertices(
  centerX: number,
  centerY: number,
  widthM: number,
  depthM: number,
  rotationDeg: number,
): Pt[] {
  const r = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const corners: [number, number][] = [
    [-widthM / 2, -depthM / 2],
    [widthM / 2, -depthM / 2],
    [widthM / 2, depthM / 2],
    [-widthM / 2, depthM / 2],
  ];
  return corners.map(([lx, ly]) => [
    round3(centerX + lx * cos - ly * sin),
    round3(centerY + lx * sin + ly * cos),
  ]);
}

/** Área absoluta por la fórmula del cordón. */
export function polygonArea(vertices: Vertices): number {
  return Math.abs(signedArea(vertices));
}

/** Área con signo (positiva si el recorrido es antihorario en ejes matemáticos). */
function signedArea(vertices: Vertices): number {
  let sum = 0;
  for (let i = 0; i < vertices.length; i += 1) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % vertices.length];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

/** Longitud de una polilínea abierta (`practice.plan_polyline_length`). */
export function polylineLength(vertices: Vertices): number {
  let total = 0;
  for (let i = 0; i + 1 < vertices.length; i += 1) {
    total += Math.hypot(
      vertices[i + 1][0] - vertices[i][0],
      vertices[i + 1][1] - vertices[i][1],
    );
  }
  return total;
}

/** Caja envolvente de una figura o polilínea. */
export function bboxOf(vertices: Vertices): Bbox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of vertices) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

/** Une cajas envolventes. */
export function unionBbox(boxes: readonly Bbox[]): Bbox | null {
  if (boxes.length === 0) return null;
  let [minX, minY, maxX, maxY] = boxes[0];
  for (const box of boxes) {
    minX = Math.min(minX, box[0]);
    minY = Math.min(minY, box[1]);
    maxX = Math.max(maxX, box[2]);
    maxY = Math.max(maxY, box[3]);
  }
  return [minX, minY, maxX, maxY];
}

/** ¿Se tocan o se cruzan dos cajas? (con holgura `eps`). */
export function bboxesTouch(a: Bbox, b: Bbox, eps = EPS): boolean {
  return (
    a[0] <= b[2] + eps &&
    b[0] <= a[2] + eps &&
    a[1] <= b[3] + eps &&
    b[1] <= a[3] + eps
  );
}

/** Orientación de tres puntos: 1, -1 o 0 (colineales), con tolerancia. */
function orient(a: Pt, b: Pt, c: Pt): -1 | 0 | 1 {
  const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(cross) < EPS) return 0;
  return cross > 0 ? 1 : -1;
}

/** ¿`p` está en la caja del segmento `a-b`? */
function onSegmentBox(a: Pt, b: Pt, p: Pt): boolean {
  return (
    p[0] >= Math.min(a[0], b[0]) - EPS &&
    p[0] <= Math.max(a[0], b[0]) + EPS &&
    p[1] >= Math.min(a[1], b[1]) - EPS &&
    p[1] <= Math.max(a[1], b[1]) + EPS
  );
}

/** Dos segmentos se cortan o se tocan (`practice.plan_seg_intersect`). */
export function segmentsIntersect(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegmentBox(a, b, c)) return true;
  if (o2 === 0 && onSegmentBox(a, b, d)) return true;
  if (o3 === 0 && onSegmentBox(c, d, a)) return true;
  if (o4 === 0 && onSegmentBox(c, d, b)) return true;
  return false;
}

/** Los segmentos se cruzan en un punto interior de ambos (no sólo se tocan). */
function segmentsCrossProperly(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  return o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0 && o1 !== o2 && o3 !== o4;
}

/**
 * Valida la lista de vértices **sin** exigir polígono simple: forma, cantidad,
 * finitud y rango (`practice.plan_vertices_ok`).
 *
 * @param raw - Lo recibido.
 * @param min - Mínimo de vértices.
 * @param max - Máximo de vértices.
 * @returns El problema, o `null` si es válida.
 */
export function checkVertexList(
  raw: unknown,
  min: number,
  max: number,
): GeometryProblem | null {
  if (!Array.isArray(raw)) {
    return { code: 'VERTEX_COUNT', message: 'Los vértices deben ser una lista' };
  }
  if (raw.length < min || raw.length > max) {
    return {
      code: 'VERTEX_COUNT',
      message: `La figura necesita entre ${min} y ${max} vértices`,
    };
  }
  for (const point of raw as unknown[]) {
    if (
      !Array.isArray(point) ||
      point.length !== 2 ||
      typeof point[0] !== 'number' ||
      typeof point[1] !== 'number'
    ) {
      return {
        code: 'NOT_FINITE',
        message: 'Cada vértice es un par [x, y] de números',
      };
    }
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
      return { code: 'NOT_FINITE', message: 'Los vértices deben ser finitos' };
    }
    if (
      Math.abs(point[0]) > GEOMETRY_LIMITS.maxCoordinateM ||
      Math.abs(point[1]) > GEOMETRY_LIMITS.maxCoordinateM
    ) {
      return {
        code: 'OUT_OF_RANGE',
        message: `Las coordenadas no pueden pasar de ${GEOMETRY_LIMITS.maxCoordinateM} m`,
      };
    }
  }
  return null;
}

/**
 * Polígono simple (`practice.plan_polygon_is_simple`): 3–64 vértices finitos,
 * área > 0, sin vértices consecutivos repetidos, sin aristas que se crucen o se
 * toquen (salvo las contiguas en su vértice común) y sin giros de 180°.
 *
 * @param raw - Vértices recibidos.
 * @returns El problema, o `null` si la figura es válida.
 */
export function validatePolygon(raw: unknown): GeometryProblem | null {
  const list = checkVertexList(raw, 3, GEOMETRY_LIMITS.maxVertices);
  if (list) return list;
  const v = raw as Vertices;
  const n = v.length;
  if (polygonArea(v) < 0.000001) {
    return { code: 'AREA_ZERO', message: 'La figura no encierra superficie' };
  }
  for (let i = 0; i < n; i += 1) {
    const next = v[(i + 1) % n];
    if (v[i][0] === next[0] && v[i][1] === next[1]) {
      return {
        code: 'REPEATED_VERTEX',
        message: 'Hay dos vértices consecutivos en el mismo punto',
      };
    }
  }
  for (let i = 0; i < n - 1; i += 1) {
    const i2 = (i + 1) % n;
    for (let j = i + 1; j < n; j += 1) {
      const j2 = (j + 1) % n;
      if (j === i2) {
        if (orient(v[i], v[j], v[j2]) === 0 && dot(v[i], v[j], v[j2]) > 0) {
          return {
            code: 'SPIKE',
            message: 'Dos aristas vuelven sobre sí mismas (giro de 180°)',
          };
        }
      } else if (j2 === i) {
        if (orient(v[j], v[i], v[i2]) === 0 && dot(v[j], v[i], v[i2]) > 0) {
          return {
            code: 'SPIKE',
            message: 'Dos aristas vuelven sobre sí mismas (giro de 180°)',
          };
        }
      } else if (segmentsIntersect(v[i], v[i2], v[j], v[j2])) {
        return {
          code: 'SELF_INTERSECTION',
          message: 'Las aristas de la figura se cruzan o se tocan',
        };
      }
    }
  }
  return null;
}

/** Producto punto de (a→b) y (a→c)… en el vértice `b`: (a−b)·(c−b). */
function dot(a: Pt, b: Pt, c: Pt): number {
  return (a[0] - b[0]) * (c[0] - b[0]) + (a[1] - b[1]) * (c[1] - b[1]);
}

/**
 * Valida un rectángulo rotable.
 *
 * @param widthM - Ancho local.
 * @param depthM - Fondo local.
 * @param rotationDeg - Rotación en [0, 360).
 * @returns El problema, o `null` si es válido.
 */
export function validateRect(
  widthM: number,
  depthM: number,
  rotationDeg: number,
): GeometryProblem | null {
  const sides = [widthM, depthM];
  if (
    sides.some(
      (side) =>
        !Number.isFinite(side) ||
        side < GEOMETRY_LIMITS.minRectSideM ||
        side > GEOMETRY_LIMITS.maxRectSideM,
    )
  ) {
    return {
      code: 'RECT_SIZE',
      message: `Ancho y fondo van de ${GEOMETRY_LIMITS.minRectSideM} a ${GEOMETRY_LIMITS.maxRectSideM} m`,
    };
  }
  if (!Number.isFinite(rotationDeg) || rotationDeg < 0 || rotationDeg >= 360) {
    return {
      code: 'ROTATION',
      message: 'La rotación va de 0 (incluido) a 360 (excluido) grados',
    };
  }
  return null;
}

/**
 * Contorno de contacto (`practice.plan_shrink_vertices`): la figura achicada
 * hacia el centro de su caja envolvente para que dos locales con pared
 * compartida no cuenten como solapados.
 *
 * @param vertices - Vértices de la figura.
 * @param toleranceM - `floor_plans.contact_tolerance_m`; 0 no achica.
 * @returns Los vértices achicados, redondeados a 6 decimales.
 */
export function shrinkVertices(vertices: Vertices, toleranceM: number): Pt[] {
  const [minX, minY, maxX, maxY] = bboxOf(vertices);
  const mx = (minX + maxX) / 2;
  const my = (minY + maxY) / 2;
  const scale =
    toleranceM <= 0
      ? 1
      : Math.max(
          0.5,
          1 -
            toleranceM /
              Math.max(0.001, Math.min(maxX - minX, maxY - minY) / 2),
        );
  return vertices.map(([x, y]) => [
    roundTo(mx + (x - mx) * scale, 6),
    roundTo(my + (y - my) * scale, 6),
  ]);
}

/** ¿`p` está dentro del polígono o sobre su borde? */
export function pointInPolygon(p: Pt, polygon: Vertices): boolean {
  const n = polygon.length;
  for (let i = 0; i < n; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    if (orient(a, b, p) === 0 && onSegmentBox(a, b, p)) return true;
  }
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Los polígonos comparten algún punto (`polygon && polygon` de Postgres: cuenta
 * **tocarse**). Es lo que evalúa el `EXCLUDE` sobre el contorno de contacto.
 */
export function polygonsShareAnyPoint(a: Vertices, b: Vertices): boolean {
  if (!bboxesTouch(bboxOf(a), bboxOf(b))) return false;
  for (let i = 0; i < a.length; i += 1) {
    const a2 = a[(i + 1) % a.length];
    for (let j = 0; j < b.length; j += 1) {
      if (segmentsIntersect(a[i], a2, b[j], b[(j + 1) % b.length])) return true;
    }
  }
  return pointInPolygon(a[0], b) || pointInPolygon(b[0], a);
}

/**
 * `outer @> inner` de Postgres: todo `inner` está dentro de `outer` o sobre su
 * borde, sin que ninguna arista de `inner` salga de él.
 */
export function polygonContains(outer: Vertices, inner: Vertices): boolean {
  if (!inner.every((p) => pointInPolygon(p, outer))) return false;
  for (let i = 0; i < inner.length; i += 1) {
    const a = inner[i];
    const b = inner[(i + 1) % inner.length];
    for (let j = 0; j < outer.length; j += 1) {
      if (segmentsCrossProperly(a, b, outer[j], outer[(j + 1) % outer.length]))
        return false;
    }
    // El punto medio de cada arista también debe caer dentro: detecta una
    // arista que atraviesa una muesca cóncava sin cruzar otra arista.
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (!pointInPolygon(mid, outer)) return false;
  }
  return true;
}

type Triangle = readonly [Pt, Pt, Pt];

/** Triangula un polígono simple por orejas. Tolera vértices colineales. */
export function triangulate(vertices: Vertices): Triangle[] {
  const ring: Pt[] = signedArea(vertices) >= 0 ? [...vertices] : [...vertices].reverse();
  const triangles: Triangle[] = [];
  let guard = ring.length * ring.length + 10;
  while (ring.length > 3 && guard > 0) {
    guard -= 1;
    let clipped = false;
    for (let i = 0; i < ring.length; i += 1) {
      const prev = ring[(i + ring.length - 1) % ring.length];
      const curr = ring[i];
      const next = ring[(i + 1) % ring.length];
      const cross =
        (curr[0] - prev[0]) * (next[1] - prev[1]) -
        (curr[1] - prev[1]) * (next[0] - prev[0]);
      if (Math.abs(cross) < EPS) {
        ring.splice(i, 1);
        clipped = true;
        break;
      }
      if (cross < 0) continue;
      const tri: Triangle = [prev, curr, next];
      const blocked = ring.some(
        (p) =>
          p !== prev &&
          p !== curr &&
          p !== next &&
          !samePoint(p, prev) &&
          !samePoint(p, curr) &&
          !samePoint(p, next) &&
          pointInTriangle(p, tri),
      );
      if (blocked) continue;
      triangles.push(tri);
      ring.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) {
      // Numéricamente degenerado: se descarta el vértice de menor giro.
      let best = 0;
      let bestCross = Infinity;
      for (let i = 0; i < ring.length; i += 1) {
        const prev = ring[(i + ring.length - 1) % ring.length];
        const curr = ring[i];
        const next = ring[(i + 1) % ring.length];
        const c = Math.abs(
          (curr[0] - prev[0]) * (next[1] - prev[1]) -
            (curr[1] - prev[1]) * (next[0] - prev[0]),
        );
        if (c < bestCross) {
          bestCross = c;
          best = i;
        }
      }
      ring.splice(best, 1);
    }
  }
  if (ring.length === 3) triangles.push([ring[0], ring[1], ring[2]]);
  return triangles;
}

function samePoint(a: Pt, b: Pt): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** `p` dentro del triángulo o sobre su borde (triángulo antihorario). */
function pointInTriangle(p: Pt, tri: Triangle): boolean {
  const [a, b, c] = tri;
  const d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const d2 = (c[0] - b[0]) * (p[1] - b[1]) - (c[1] - b[1]) * (p[0] - b[0]);
  const d3 = (a[0] - c[0]) * (p[1] - c[1]) - (a[1] - c[1]) * (p[0] - c[0]);
  return d1 >= -EPS && d2 >= -EPS && d3 >= -EPS;
}

/** Recorta un polígono convexo `subject` contra el triángulo convexo `clip` (antihorario). */
function clipConvex(subject: readonly Pt[], clip: Triangle): Pt[] {
  let output: Pt[] = [...subject];
  for (let i = 0; i < 3 && output.length > 0; i += 1) {
    const a = clip[i];
    const b = clip[(i + 1) % 3];
    const input = output;
    output = [];
    const side = (p: Pt): number =>
      (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    for (let k = 0; k < input.length; k += 1) {
      const cur = input[k];
      const prev = input[(k + input.length - 1) % input.length];
      const sc = side(cur);
      const sp = side(prev);
      if (sc >= 0) {
        if (sp < 0) output.push(lineCross(prev, cur, a, b, sp, sc));
        output.push(cur);
      } else if (sp >= 0) {
        output.push(lineCross(prev, cur, a, b, sp, sc));
      }
    }
  }
  return output;
}

function lineCross(p: Pt, q: Pt, _a: Pt, _b: Pt, sp: number, sq: number): Pt {
  const t = sp / (sp - sq);
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
}

/**
 * Área común de dos polígonos simples, en m² (suma de las intersecciones de sus
 * triángulos). 0 si sólo se tocan.
 *
 * @param a - Primera figura.
 * @param b - Segunda figura.
 * @returns El área de solape, redondeada al milímetro cuadrado.
 */
export function intersectionArea(a: Vertices, b: Vertices): number {
  if (!bboxesTouch(bboxOf(a), bboxOf(b))) return 0;
  const ta = triangulate(a);
  const tb = triangulate(b);
  let total = 0;
  for (const t1 of ta) {
    for (const t2 of tb) {
      const clipped = clipConvex(t1, t2);
      if (clipped.length >= 3) total += polygonArea(clipped);
    }
  }
  return round3(total);
}

/**
 * Posición del punto de una abertura sobre un muro, medida desde su primer
 * vértice: `{x, y, angleDeg}` del tramo que la contiene. Sirve para rutas y
 * para comprobar que la abertura cabe.
 *
 * @param wall - Polilínea del muro.
 * @param offsetM - Distancia desde el primer vértice.
 * @returns El punto y la dirección del tramo, o `null` si excede el largo.
 */
export function pointAlongPolyline(
  wall: Vertices,
  offsetM: number,
): { x: number; y: number; angleDeg: number } | null {
  let remaining = offsetM;
  for (let i = 0; i + 1 < wall.length; i += 1) {
    const [x1, y1] = wall[i];
    const [x2, y2] = wall[i + 1];
    const length = Math.hypot(x2 - x1, y2 - y1);
    if (remaining <= length + 1e-9) {
      const t = length === 0 ? 0 : remaining / length;
      return {
        x: round3(x1 + (x2 - x1) * t),
        y: round3(y1 + (y2 - y1) * t),
        angleDeg: round3((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI),
      };
    }
    remaining -= length;
  }
  return null;
}
