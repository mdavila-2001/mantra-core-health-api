/**
 * Pre-validación de un guardado de layout (CONTRATO-PLANO §3.4, paso 2).
 *
 * Recibe el estado actual del lienzo, el delta pedido y los datos del árbol
 * físico de los espacios involucrados, y devuelve **todos** los errores por
 * elemento (no sólo el primero) o el plan de escritura ya resuelto. Es puro: la
 * transacción, la base y los permisos son de quien lo llama.
 *
 * Es la ayuda que da el mensaje útil (qué figura choca con cuál y por cuántos
 * m²). La garantía sigue siendo la base: `ex_space_placements_no_overlap`, los
 * triggers de contención y los `CHECK`. Si este validador deja pasar algo que la
 * base rechaza, gana la base.
 */
import {
  GEOMETRY_LIMITS,
  bboxOf,
  bboxesTouch,
  checkVertexList,
  intersectionArea,
  polygonArea,
  polygonContains,
  polygonsShareAnyPoint,
  polylineLength,
  pointAlongPolyline,
  rectVertices,
  round3,
  shrinkVertices,
  validatePolygon,
  validateRect,
  type Bbox,
  type Pt,
} from './plan-geometry';
import type { PlanLayoutError } from '../plan/floor-plan.types';
import { FloorPlanReason } from '../plan/floor-plan.error-reasons';
import {
  ELEMENT_RANGES,
  HOSTED_KINDS,
  POLYGON_KINDS,
} from '../plan/floor-plan.constants';

/** Tope de errores que se devuelven en una respuesta. */
export const MAX_REPORTED_ERRORS = 200;

/** Lienzo contra el que se valida. */
export interface PlanCanvas {
  readonly widthM: number;
  readonly heightM: number;
  readonly toleranceM: number;
  readonly anchorSpaceId: string | null;
  readonly siteId: string;
}

/** Lo que el validador necesita saber de un espacio del árbol físico. */
export interface SpaceInfo {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly siteId: string;
  readonly retired: boolean;
}

/** Una ubicación ya guardada. */
export interface PlacementState {
  readonly placementId: string;
  readonly spaceId: string;
  readonly rowVersion: number;
  readonly zOrder: number;
  readonly locked: boolean;
  readonly shapeKind: 'RECT' | 'POLYGON';
  readonly centerXM: number | null;
  readonly centerYM: number | null;
  readonly widthM: number | null;
  readonly depthM: number | null;
  readonly rotationDeg: number | null;
  readonly vertices: readonly Pt[];
}

/** Un elemento ya guardado. */
export interface ElementState {
  readonly id: string;
  readonly kind: string;
  readonly rowVersion: number;
  readonly zOrder: number;
  readonly vertices: readonly Pt[] | null;
  readonly thicknessM: number | null;
  readonly hostElementId: string | null;
  readonly offsetM: number | null;
  readonly widthM: number | null;
  readonly swing: string | null;
  readonly swingSide: string | null;
  readonly label: string | null;
  readonly verticalLinkCode: string | null;
  readonly connectsSpaceAId: string | null;
  readonly connectsSpaceBId: string | null;
}

/** Ubicación pedida por el cliente (la geometría llega sin validar). */
export interface PlacementUpsert {
  readonly spaceId: string;
  readonly geometry: unknown;
  readonly zOrder?: number;
  readonly locked?: boolean;
  readonly expectedRowVersion?: number;
}

/** Elemento pedido por el cliente (campos sin validar). */
export interface ElementUpsert {
  readonly id: string;
  readonly kind: string;
  readonly vertices?: unknown;
  readonly thicknessM?: unknown;
  readonly hostElementId?: unknown;
  readonly offsetM?: unknown;
  readonly widthM?: unknown;
  readonly swing?: unknown;
  readonly swingSide?: unknown;
  readonly label?: unknown;
  readonly verticalLinkCode?: unknown;
  readonly connectsSpaceAId?: unknown;
  readonly connectsSpaceBId?: unknown;
  readonly zOrder?: number;
  readonly expectedRowVersion?: number;
}

/** Cambios pedidos sobre un lienzo. */
export interface LayoutDelta {
  readonly placements: readonly PlacementUpsert[];
  readonly elements: readonly ElementUpsert[];
  readonly removeSpaceIds: readonly string[];
  readonly removeElementIds: readonly string[];
  readonly cascade: boolean;
}

/** Entrada completa del validador. */
export interface ValidatorInput {
  readonly canvas: PlanCanvas;
  readonly spaces: ReadonlyMap<string, SpaceInfo>;
  readonly currentPlacements: readonly PlacementState[];
  readonly currentElements: readonly ElementState[];
  readonly delta: LayoutDelta;
}

/** Ubicación lista para escribir, con sus derivadas. */
export interface PlacementWrite {
  readonly spaceId: string;
  readonly placementId: string | null;
  readonly expectedRowVersion: number | null;
  readonly shapeKind: 'RECT' | 'POLYGON';
  readonly centerXM: number | null;
  readonly centerYM: number | null;
  readonly widthM: number | null;
  readonly depthM: number | null;
  readonly rotationDeg: number | null;
  readonly vertices: readonly Pt[];
  readonly zOrder: number;
  readonly locked: boolean;
  readonly areaM2: number;
  readonly isNew: boolean;
}

/** Elemento listo para escribir. */
export interface ElementWrite {
  readonly id: string;
  readonly isNew: boolean;
  readonly expectedRowVersion: number | null;
  readonly kind: string;
  readonly vertices: readonly Pt[] | null;
  readonly thicknessM: number | null;
  readonly hostElementId: string | null;
  readonly offsetM: number | null;
  readonly widthM: number | null;
  readonly swing: string | null;
  readonly swingSide: string | null;
  readonly label: string | null;
  readonly verticalLinkCode: string | null;
  readonly connectsSpaceAId: string | null;
  readonly connectsSpaceBId: string | null;
  readonly zOrder: number;
}

/** Un `expectedRowVersion` que no coincide con la fila vigente. */
export interface RowVersionConflict {
  readonly kind: 'SPACE' | 'ELEMENT';
  readonly id: string;
  readonly currentRowVersion: number;
  readonly expectedRowVersion: number;
}

/** Resultado de validar. */
export interface ValidationOutcome {
  readonly errors: PlanLayoutError[];
  /** Errores que se omitieron del listado por el tope. */
  readonly omittedErrors: number;
  readonly rowVersionConflicts: RowVersionConflict[];
  readonly placementsToWrite: PlacementWrite[];
  /** En orden de borrado: hijos antes que padres. */
  readonly placementsToRemove: PlacementState[];
  /** Muros antes que aberturas. */
  readonly elementsToWrite: ElementWrite[];
  /** Aberturas antes que muros. */
  readonly elementsToRemove: ElementState[];
  readonly counts: {
    readonly placed: number;
    readonly moved: number;
    readonly removed: number;
    readonly elementsUpserted: number;
    readonly elementsRemoved: number;
  };
}

/** Figura de trabajo de una ubicación ya resuelta. */
interface Shape {
  readonly spaceId: string;
  readonly vertices: readonly Pt[];
  readonly contact: readonly Pt[];
  readonly bbox: Bbox;
  readonly contactBbox: Bbox;
}

const isNum = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const nullish = (value: unknown): boolean =>
  value === undefined || value === null;

/** Etiqueta «CODIGO · Nombre» de un espacio. */
function spaceLabel(info: SpaceInfo | undefined, fallback: string): string {
  return info ? `${info.code} · ${info.name}` : fallback;
}

function toShape(
  spaceId: string,
  vertices: readonly Pt[],
  toleranceM: number,
): Shape {
  const contact = shrinkVertices(vertices, toleranceM);
  return {
    spaceId,
    vertices,
    contact,
    bbox: bboxOf(vertices),
    contactBbox: bboxOf(contact),
  };
}

/** ¿La caja está dentro del lienzo (con la tolerancia de contacto)? */
export function insideCanvas(bbox: Bbox, canvas: PlanCanvas): boolean {
  const tol = canvas.toleranceM;
  return !(
    bbox[0] < -tol ||
    bbox[1] < -tol ||
    bbox[2] > canvas.widthM + tol ||
    bbox[3] > canvas.heightM + tol
  );
}

/**
 * Vértices de una ubicación guardada o pedida, tal como los deriva la base.
 *
 * @param state - Ubicación con sus parámetros.
 * @returns Los vértices canónicos.
 */
export function verticesOfPlacement(
  state: Pick<
    PlacementState,
    | 'shapeKind'
    | 'centerXM'
    | 'centerYM'
    | 'widthM'
    | 'depthM'
    | 'rotationDeg'
    | 'vertices'
  >,
): readonly Pt[] {
  if (
    state.shapeKind === 'RECT' &&
    state.centerXM !== null &&
    state.centerYM !== null &&
    state.widthM !== null &&
    state.depthM !== null &&
    state.rotationDeg !== null
  ) {
    return rectVertices(
      state.centerXM,
      state.centerYM,
      state.widthM,
      state.depthM,
      state.rotationDeg,
    );
  }
  return state.vertices;
}

/**
 * Valida un delta de layout contra el estado actual del lienzo.
 *
 * @param input - Lienzo, árbol, estado actual y cambios pedidos.
 * @returns Errores por elemento o plan de escritura.
 */
export function validateLayoutDelta(input: ValidatorInput): ValidationOutcome {
  const { canvas, spaces, delta } = input;
  const errors: PlanLayoutError[] = [];
  let omitted = 0;
  const push = (error: PlanLayoutError): void => {
    if (errors.length < MAX_REPORTED_ERRORS) errors.push(error);
    else omitted += 1;
  };
  const rowVersionConflicts: RowVersionConflict[] = [];

  const currentBySpace = new Map(
    input.currentPlacements.map((p) => [p.spaceId, p]),
  );
  const currentElements = new Map(input.currentElements.map((e) => [e.id, e]));

  // ----------------------------------------------------------- 1. quitar
  const removeSet = new Set(delta.removeSpaceIds);
  for (const spaceId of delta.removeSpaceIds) {
    if (!currentBySpace.has(spaceId)) removeSet.delete(spaceId);
  }
  const childrenOf = new Map<string, string[]>();
  for (const placement of input.currentPlacements) {
    const parentId = spaces.get(placement.spaceId)?.parentId;
    if (!parentId) continue;
    const list = childrenOf.get(parentId) ?? [];
    list.push(placement.spaceId);
    childrenOf.set(parentId, list);
  }
  if (delta.cascade) {
    const queue = [...removeSet];
    while (queue.length > 0) {
      const next = queue.pop() as string;
      for (const child of childrenOf.get(next) ?? []) {
        if (!removeSet.has(child)) {
          removeSet.add(child);
          queue.push(child);
        }
      }
    }
  }
  const upsertSpaceIds = new Set(delta.placements.map((p) => p.spaceId));
  for (const spaceId of removeSet) {
    if (upsertSpaceIds.has(spaceId)) {
      const info = spaces.get(spaceId);
      push({
        kind: 'SPACE',
        id: spaceId,
        code: FloorPlanReason.PLAN_ELEMENT_INVALID,
        message: `${spaceLabel(info, spaceId)} figura a la vez para quitar y para guardar`,
        nextAction: {
          label: 'Revisar el guardado',
          hint: 'Mandá el espacio en `upsert` o en `remove`, no en los dos.',
        },
      });
    }
    if (!delta.cascade) {
      const stay = (childrenOf.get(spaceId) ?? []).filter(
        (child) => !removeSet.has(child),
      );
      if (stay.length > 0) {
        const info = spaces.get(spaceId);
        push({
          kind: 'SPACE',
          id: spaceId,
          code: FloorPlanReason.PLAN_HAS_PLACED_CHILDREN,
          message: `${spaceLabel(info, spaceId)} tiene ${stay.length} hijo(s) dibujados`,
          conflictsWith: stay.map((child) => ({
            kind: 'SPACE' as const,
            id: child,
            code: spaces.get(child)?.code ?? child,
            name: spaces.get(child)?.name ?? '',
          })),
          nextAction: {
            label: 'Quitar también los hijos',
            hint: 'Quitá antes los hijos dibujados o repetí con `cascade=true`.',
          },
        });
      }
    }
  }

  // ------------------------------------------------- 2. ubicaciones nuevas
  const writes: PlacementWrite[] = [];
  const shapes = new Map<string, Shape>();
  const nextPlacements = new Map<string, { spaceId: string }>();
  for (const current of input.currentPlacements) {
    if (removeSet.has(current.spaceId)) continue;
    nextPlacements.set(current.spaceId, { spaceId: current.spaceId });
    shapes.set(
      current.spaceId,
      toShape(
        current.spaceId,
        verticesOfPlacement(current),
        canvas.toleranceM,
      ),
    );
  }
  const seenSpaces = new Set<string>();
  const affected = new Set<string>();

  for (const item of delta.placements) {
    const info = spaces.get(item.spaceId);
    const current = currentBySpace.get(item.spaceId);
    if (seenSpaces.has(item.spaceId)) {
      push({
        kind: 'SPACE',
        id: item.spaceId,
        code: FloorPlanReason.PLAN_ELEMENT_INVALID,
        message: `${spaceLabel(info, item.spaceId)} aparece más de una vez en el guardado`,
      });
      continue;
    }
    seenSpaces.add(item.spaceId);
    if (!info || info.siteId !== canvas.siteId) {
      push({
        kind: 'SPACE',
        id: item.spaceId,
        code: FloorPlanReason.PLAN_SPACE_NOT_PLACEABLE,
        field: 'parent',
        message: 'El espacio no es de la sede de este lienzo',
      });
      continue;
    }
    if (!current && info.retired) {
      push({
        kind: 'SPACE',
        id: item.spaceId,
        code: FloorPlanReason.PLAN_SPACE_NOT_PLACEABLE,
        message: `${spaceLabel(info, item.spaceId)} está clausurado y no se dibuja de nuevo`,
        nextAction: {
          label: 'Elegir otro espacio',
          hint: 'Un espacio clausurado conserva su dibujo anterior, pero no admite uno nuevo.',
        },
      });
      continue;
    }
    if (
      current &&
      item.expectedRowVersion !== undefined &&
      item.expectedRowVersion !== current.rowVersion
    ) {
      rowVersionConflicts.push({
        kind: 'SPACE',
        id: item.spaceId,
        currentRowVersion: current.rowVersion,
        expectedRowVersion: item.expectedRowVersion,
      });
      continue;
    }

    const resolved = resolveGeometry(item.geometry);
    if ('problem' in resolved) {
      push({
        kind: 'SPACE',
        id: item.spaceId,
        code: FloorPlanReason.PLAN_GEOMETRY_INVALID,
        field: 'geometry',
        message: `${spaceLabel(info, item.spaceId)}: ${resolved.problem}`,
        nextAction: {
          label: 'Corregir la figura',
          hint: 'Un polígono simple de 3 a 64 vértices con superficie, o un rectángulo de 0,05 a 1000 m.',
        },
      });
      continue;
    }
    const zOrder = item.zOrder ?? current?.zOrder ?? 0;
    if (!Number.isInteger(zOrder) || Math.abs(zOrder) > 1000) {
      push({
        kind: 'SPACE',
        id: item.spaceId,
        code: FloorPlanReason.PLAN_GEOMETRY_INVALID,
        field: 'size',
        message: `${spaceLabel(info, item.spaceId)}: el orden de pintado va de -1000 a 1000`,
      });
      continue;
    }
    const shape = toShape(item.spaceId, resolved.vertices, canvas.toleranceM);
    if (!insideCanvas(shape.bbox, canvas)) {
      push({
        kind: 'SPACE',
        id: item.spaceId,
        code: FloorPlanReason.PLAN_OUT_OF_BOUNDS,
        field: 'geometry',
        message: `${spaceLabel(info, item.spaceId)} sale del lienzo (${canvas.widthM} × ${canvas.heightM} m)`,
        nextAction: {
          label: 'Mover la figura',
          hint: 'Acercala al interior del lienzo o agrandá el lienzo.',
        },
      });
      continue;
    }
    shapes.set(item.spaceId, shape);
    nextPlacements.set(item.spaceId, { spaceId: item.spaceId });
    affected.add(item.spaceId);
    writes.push({
      spaceId: item.spaceId,
      placementId: current?.placementId ?? null,
      expectedRowVersion: item.expectedRowVersion ?? null,
      shapeKind: resolved.shapeKind,
      centerXM: resolved.centerXM,
      centerYM: resolved.centerYM,
      widthM: resolved.widthM,
      depthM: resolved.depthM,
      rotationDeg: resolved.rotationDeg,
      vertices: resolved.vertices,
      zOrder,
      locked: item.locked ?? current?.locked ?? false,
      areaM2: round3(polygonArea(resolved.vertices)),
      isNew: !current,
    });
  }

  // Lo sin cambios reales no se escribe ni se cuenta (reintentar es idempotente).
  const effective = writes.filter((write) => {
    const current = currentBySpace.get(write.spaceId);
    if (!current) return true;
    return !samePlacement(current, write);
  });
  const unchanged = new Set(
    writes.filter((w) => !effective.includes(w)).map((w) => w.spaceId),
  );
  for (const spaceId of unchanged) affected.delete(spaceId);

  // --------------------------------------- 3. árbol: padre, contención, solape
  const removedAncestors = removeSet;
  for (const spaceId of affected) {
    const info = spaces.get(spaceId);
    const shape = shapes.get(spaceId) as Shape;
    if (!info) continue;
    // padre
    if (info.parentId === null) {
      if (canvas.anchorSpaceId !== null) {
        push({
          kind: 'SPACE',
          id: spaceId,
          code: FloorPlanReason.PLAN_PARENT_NOT_PLACED,
          field: 'parent',
          message: `${spaceLabel(info, spaceId)} no tiene padre y este lienzo está anclado a un espacio`,
          nextAction: {
            label: 'Usar el lienzo de campus',
            hint: 'Los espacios raíz se dibujan en el lienzo de campus de la sede.',
          },
        });
      }
    } else if (info.parentId !== canvas.anchorSpaceId) {
      const parentShape = shapes.get(info.parentId);
      if (!parentShape || removedAncestors.has(info.parentId)) {
        const parent = spaces.get(info.parentId);
        push({
          kind: 'SPACE',
          id: spaceId,
          code: FloorPlanReason.PLAN_PARENT_NOT_PLACED,
          field: 'parent',
          message: `El padre de ${spaceLabel(info, spaceId)} (${spaceLabel(parent, info.parentId)}) no está dibujado en este lienzo`,
          nextAction: {
            label: 'Dibujar primero el padre',
            hint: 'Dibujá el padre en este lienzo y después sus hijos (pueden ir en el mismo guardado).',
          },
        });
      } else if (!polygonContains(parentShape.vertices, shape.contact)) {
        const parent = spaces.get(info.parentId);
        push({
          kind: 'SPACE',
          id: spaceId,
          code: FloorPlanReason.PLAN_CHILD_OUTSIDE_PARENT,
          field: 'geometry',
          message: `${spaceLabel(info, spaceId)} no cabe dentro de ${spaceLabel(parent, info.parentId)}`,
          conflictsWith: [
            {
              kind: 'SPACE',
              id: info.parentId,
              code: parent?.code ?? info.parentId,
              name: parent?.name ?? '',
            },
          ],
          nextAction: {
            label: 'Mover o achicar el espacio',
            hint: 'El espacio tiene que quedar completo dentro de la figura de su padre.',
          },
        });
      }
    }
    // hijos ya dibujados (o en este mismo guardado) dentro de la figura nueva
    for (const childId of childrenOfNext(spaceId, nextPlacements, spaces)) {
      const childShape = shapes.get(childId);
      if (!childShape) continue;
      // Un hijo que también viaja se valida desde su propio lado.
      if (affected.has(childId)) continue;
      if (!polygonContains(shape.vertices, childShape.contact)) {
        const child = spaces.get(childId);
        push({
          kind: 'SPACE',
          id: childId,
          code: FloorPlanReason.PLAN_CHILD_OUTSIDE_PARENT,
          field: 'geometry',
          message: `${spaceLabel(child, childId)} quedaría fuera de ${spaceLabel(info, spaceId)}`,
          conflictsWith: [
            {
              kind: 'SPACE',
              id: spaceId,
              code: info.code,
              name: info.name,
            },
          ],
          nextAction: {
            label: 'Mover también el hijo',
            hint: 'Mové el hijo en el mismo guardado que su padre.',
          },
        });
      }
    }
    // hermanos
    const group = info.parentId ?? info.siteId;
    for (const other of nextPlacements.keys()) {
      if (other === spaceId) continue;
      if (affected.has(other) && other < spaceId) continue;
      const otherInfo = spaces.get(other);
      if (!otherInfo || (otherInfo.parentId ?? otherInfo.siteId) !== group)
        continue;
      const otherShape = shapes.get(other);
      if (!otherShape) continue;
      if (!bboxesTouch(shape.contactBbox, otherShape.contactBbox)) continue;
      if (!polygonsShareAnyPoint(shape.contact, otherShape.contact)) continue;
      const overlap = intersectionArea(shape.vertices, otherShape.vertices);
      push({
        kind: 'SPACE',
        id: spaceId,
        code: FloorPlanReason.PLAN_SIBLING_OVERLAP,
        field: 'geometry',
        message: `${spaceLabel(info, spaceId)} se solapa con ${spaceLabel(otherInfo, other)}`,
        conflictsWith: [
          {
            kind: 'SPACE',
            id: other,
            code: otherInfo.code,
            name: otherInfo.name,
            overlapAreaM2: overlap,
          },
        ],
        nextAction: {
          label: 'Separar las figuras',
          hint: 'Dos espacios hermanos pueden compartir pared, pero no superficie.',
        },
      });
    }
  }

  // ----------------------------------------------------------- 4. elementos
  const elementResult = validateElements(
    input,
    push,
    rowVersionConflicts,
    currentElements,
  );

  // ------------------------------------------------------- 5. plan de escritura
  const toRemove = input.currentPlacements
    .filter((p) => removeSet.has(p.spaceId))
    .sort((a, b) => depthOf(b.spaceId, spaces) - depthOf(a.spaceId, spaces));
  effective.sort(
    (a, b) => depthOf(a.spaceId, spaces) - depthOf(b.spaceId, spaces),
  );

  return {
    errors,
    omittedErrors: omitted,
    rowVersionConflicts,
    placementsToWrite: effective,
    placementsToRemove: toRemove,
    elementsToWrite: elementResult.write,
    elementsToRemove: elementResult.remove,
    counts: {
      placed: effective.filter((w) => w.isNew).length,
      moved: effective.filter((w) => !w.isNew).length,
      removed: toRemove.length,
      elementsUpserted: elementResult.write.length,
      elementsRemoved: elementResult.remove.length,
    },
  };
}

function samePlacement(current: PlacementState, write: PlacementWrite): boolean {
  if (
    current.zOrder !== write.zOrder ||
    current.locked !== write.locked ||
    current.shapeKind !== write.shapeKind
  )
    return false;
  const a = verticesOfPlacement(current);
  const b = write.vertices;
  if (a.length !== b.length) return false;
  return a.every(
    (point, index) =>
      Math.abs(point[0] - b[index][0]) < 0.0005 &&
      Math.abs(point[1] - b[index][1]) < 0.0005,
  );
}

function depthOf(spaceId: string, spaces: ReadonlyMap<string, SpaceInfo>): number {
  let depth = 0;
  let cursor = spaces.get(spaceId)?.parentId ?? null;
  while (cursor && depth < 64) {
    depth += 1;
    cursor = spaces.get(cursor)?.parentId ?? null;
  }
  return depth;
}

function* childrenOfNext(
  parentId: string,
  next: ReadonlyMap<string, unknown>,
  spaces: ReadonlyMap<string, SpaceInfo>,
): Generator<string> {
  for (const spaceId of next.keys()) {
    if (spaces.get(spaceId)?.parentId === parentId) yield spaceId;
  }
}

interface ResolvedGeometry {
  readonly shapeKind: 'RECT' | 'POLYGON';
  readonly centerXM: number | null;
  readonly centerYM: number | null;
  readonly widthM: number | null;
  readonly depthM: number | null;
  readonly rotationDeg: number | null;
  readonly vertices: readonly Pt[];
}

/** Valida y normaliza la geometría pedida. */
function resolveGeometry(raw: unknown): ResolvedGeometry | { problem: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { problem: 'la geometría debe ser un objeto con `kind`' };
  }
  const g = raw as Record<string, unknown>;
  if (g.kind === 'RECT') {
    const { centerXM, centerYM, widthM, depthM, rotationDeg } = g;
    if (
      !isNum(centerXM) ||
      !isNum(centerYM) ||
      !isNum(widthM) ||
      !isNum(depthM) ||
      !isNum(rotationDeg)
    ) {
      return {
        problem:
          'un rectángulo lleva centerXM, centerYM, widthM, depthM y rotationDeg numéricos',
      };
    }
    const problem = validateRect(widthM, depthM, rotationDeg);
    if (problem) return { problem: problem.message };
    if (
      Math.abs(centerXM) > GEOMETRY_LIMITS.maxCoordinateM ||
      Math.abs(centerYM) > GEOMETRY_LIMITS.maxCoordinateM
    ) {
      return { problem: 'el centro está fuera del rango permitido' };
    }
    const vertices = rectVertices(centerXM, centerYM, widthM, depthM, rotationDeg);
    return {
      shapeKind: 'RECT',
      centerXM: round3(centerXM),
      centerYM: round3(centerYM),
      widthM: round3(widthM),
      depthM: round3(depthM),
      rotationDeg: round3(rotationDeg),
      vertices,
    };
  }
  if (g.kind === 'POLYGON') {
    const problem = validatePolygon(g.vertices);
    if (problem) return { problem: problem.message };
    const vertices = (g.vertices as Pt[]).map(
      ([x, y]) => [round3(x), round3(y)] as Pt,
    );
    const again = validatePolygon(vertices);
    if (again) return { problem: again.message };
    return {
      shapeKind: 'POLYGON',
      centerXM: null,
      centerYM: null,
      widthM: null,
      depthM: null,
      rotationDeg: null,
      vertices,
    };
  }
  return { problem: '`kind` debe ser RECT o POLYGON' };
}

interface ElementValidation {
  readonly write: ElementWrite[];
  readonly remove: ElementState[];
}

function validateElements(
  input: ValidatorInput,
  push: (error: PlanLayoutError) => void,
  conflicts: RowVersionConflict[],
  currentElements: ReadonlyMap<string, ElementState>,
): ElementValidation {
  const { canvas, spaces, delta } = input;

  // Quitar: un muro arrastra las aberturas que aloja.
  const removeIds = new Set(
    delta.removeElementIds.filter((id) => currentElements.has(id)),
  );
  for (const element of currentElements.values()) {
    if (element.hostElementId && removeIds.has(element.hostElementId)) {
      removeIds.add(element.id);
    }
  }
  const upsertIds = new Set(delta.elements.map((e) => e.id));
  for (const id of removeIds) {
    if (upsertIds.has(id)) {
      push({
        kind: 'ELEMENT',
        id,
        code: FloorPlanReason.PLAN_ELEMENT_INVALID,
        message: 'El elemento figura a la vez para quitar y para guardar',
      });
    }
  }

  // Estado resultante de los elementos.
  const next = new Map<string, ElementState | ElementWrite>();
  for (const element of currentElements.values()) {
    if (!removeIds.has(element.id)) next.set(element.id, element);
  }

  const write: ElementWrite[] = [];
  const seen = new Set<string>();
  for (const item of delta.elements) {
    if (seen.has(item.id)) {
      push({
        kind: 'ELEMENT',
        id: item.id,
        code: FloorPlanReason.PLAN_ELEMENT_INVALID,
        message: 'El elemento aparece más de una vez en el guardado',
      });
      continue;
    }
    seen.add(item.id);
    const current = currentElements.get(item.id);
    if (
      current &&
      item.expectedRowVersion !== undefined &&
      item.expectedRowVersion !== current.rowVersion
    ) {
      conflicts.push({
        kind: 'ELEMENT',
        id: item.id,
        currentRowVersion: current.rowVersion,
        expectedRowVersion: item.expectedRowVersion,
      });
      continue;
    }
    const resolved = resolveElement(item, current ?? null, spaces, canvas);
    if ('error' in resolved) {
      push({
        kind: 'ELEMENT',
        id: item.id,
        code: resolved.code,
        field: resolved.field,
        message: resolved.error,
        nextAction: resolved.nextAction,
      });
      continue;
    }
    write.push(resolved.write);
    next.set(item.id, resolved.write);
  }

  // Aberturas: anfitrión muro del mismo lienzo y que quepan (también si el muro cambió).
  const changedWalls = new Set(
    write.filter((w) => w.kind === 'WALL').map((w) => w.id),
  );
  const hostedToCheck = new Map<string, ElementState | ElementWrite>();
  for (const element of next.values()) {
    if (!HOSTED_KINDS.includes(element.kind)) continue;
    const isWritten = write.some((w) => w.id === element.id);
    if (isWritten || (element.hostElementId && changedWalls.has(element.hostElementId))) {
      hostedToCheck.set(element.id, element);
    }
  }
  for (const element of hostedToCheck.values()) {
    const host = element.hostElementId ? next.get(element.hostElementId) : undefined;
    if (!host || host.kind !== 'WALL' || !host.vertices) {
      push({
        kind: 'ELEMENT',
        id: element.id,
        code: FloorPlanReason.PLAN_HOST_NOT_WALL,
        field: 'host',
        message: 'La puerta, ventana o abertura debe estar sobre un muro de este lienzo',
        nextAction: {
          label: 'Elegir un muro',
          hint: 'Indicá `hostElementId` de un muro del mismo lienzo (puede viajar en el mismo guardado).',
        },
      });
      continue;
    }
    const length = polylineLength(host.vertices);
    if ((element.offsetM ?? 0) + (element.widthM ?? 0) > length + 0.001) {
      push({
        kind: 'ELEMENT',
        id: element.id,
        code: FloorPlanReason.PLAN_OPENING_OUTSIDE_WALL,
        field: 'size',
        message: `La abertura (desde ${element.offsetM} m, ${element.widthM} m de ancho) excede el largo del muro (${round3(length)} m)`,
        nextAction: {
          label: 'Ajustar la abertura',
          hint: 'Acercala al inicio del muro, achicala o alargá el muro.',
        },
      });
    }
  }

  const removeStates = [...removeIds]
    .map((id) => currentElements.get(id))
    .filter((e): e is ElementState => Boolean(e));
  // Aberturas antes que muros al borrar; muros antes que aberturas al escribir.
  removeStates.sort(
    (a, b) =>
      Number(HOSTED_KINDS.includes(b.kind)) -
      Number(HOSTED_KINDS.includes(a.kind)),
  );
  write.sort(
    (a, b) =>
      Number(HOSTED_KINDS.includes(a.kind)) -
      Number(HOSTED_KINDS.includes(b.kind)),
  );
  return { write, remove: removeStates };
}

interface ElementProblem {
  readonly error: string;
  readonly code: string;
  readonly field?: 'geometry' | 'parent' | 'host' | 'size';
  readonly nextAction?: { label: string; hint: string };
}

function resolveElement(
  item: ElementUpsert,
  current: ElementState | null,
  spaces: ReadonlyMap<string, SpaceInfo>,
  canvas: PlanCanvas,
): { write: ElementWrite } | ElementProblem {
  const invalid = (
    error: string,
    field?: ElementProblem['field'],
  ): ElementProblem => ({
    error,
    code: FloorPlanReason.PLAN_ELEMENT_INVALID,
    field,
  });
  const kind = item.kind;
  const known = [...HOSTED_KINDS, ...POLYGON_KINDS, 'WALL', 'ANNOTATION'];
  if (!known.includes(kind)) return invalid(`Tipo de elemento desconocido: ${kind}`);

  const zOrder = item.zOrder ?? current?.zOrder ?? 0;
  if (
    !Number.isInteger(zOrder) ||
    zOrder < ELEMENT_RANGES.zOrder.min ||
    zOrder > ELEMENT_RANGES.zOrder.max
  ) {
    return invalid('El orden de pintado va de -1000 a 1000', 'size');
  }

  const onlyIn = (
    name: string,
    value: unknown,
    allowed: readonly string[],
  ): ElementProblem | null =>
    !nullish(value) && !allowed.includes(kind)
      ? invalid(`\`${name}\` no corresponde a un elemento ${kind}`)
      : null;

  // Campos que sólo aplican a ciertos tipos.
  const misplaced =
    onlyIn('thicknessM', item.thicknessM, ['WALL']) ??
    onlyIn('hostElementId', item.hostElementId, HOSTED_KINDS) ??
    onlyIn('offsetM', item.offsetM, HOSTED_KINDS) ??
    onlyIn('widthM', item.widthM, HOSTED_KINDS) ??
    onlyIn('swing', item.swing, ['DOOR']) ??
    onlyIn('swingSide', item.swingSide, ['DOOR']) ??
    onlyIn('verticalLinkCode', item.verticalLinkCode, ['STAIRS', 'ELEVATOR']) ??
    onlyIn('connectsSpaceAId', item.connectsSpaceAId, ['DOOR', 'OPENING']) ??
    onlyIn('connectsSpaceBId', item.connectsSpaceBId, ['DOOR', 'OPENING']) ??
    onlyIn('label', item.label, ['ANNOTATION']) ??
    (HOSTED_KINDS.includes(kind) ? onlyIn('vertices', item.vertices, []) : null);
  if (misplaced) return misplaced;

  const base: Omit<ElementWrite, 'vertices'> = {
    id: item.id,
    isNew: !current,
    expectedRowVersion: item.expectedRowVersion ?? null,
    kind,
    thicknessM: null,
    hostElementId: null,
    offsetM: null,
    widthM: null,
    swing: null,
    swingSide: null,
    label: null,
    verticalLinkCode: null,
    connectsSpaceAId: null,
    connectsSpaceBId: null,
    zOrder,
  };

  if (HOSTED_KINDS.includes(kind)) {
    if (typeof item.hostElementId !== 'string' || item.hostElementId === '') {
      return {
        error: 'Falta el muro que aloja la abertura (`hostElementId`)',
        code: FloorPlanReason.PLAN_HOST_NOT_WALL,
        field: 'host',
      };
    }
    if (!isNum(item.offsetM) || item.offsetM < 0) {
      return invalid('`offsetM` debe ser un número mayor o igual a 0', 'size');
    }
    if (
      !isNum(item.widthM) ||
      item.widthM < ELEMENT_RANGES.hostedWidthM.min ||
      item.widthM > ELEMENT_RANGES.hostedWidthM.max
    ) {
      return invalid(
        `\`widthM\` va de ${ELEMENT_RANGES.hostedWidthM.min} a ${ELEMENT_RANGES.hostedWidthM.max} m`,
        'size',
      );
    }
    if (
      !nullish(item.swing) &&
      !(ELEMENT_RANGES.swing as readonly unknown[]).includes(item.swing)
    ) {
      return invalid('`swing` debe ser LEFT, RIGHT, DOUBLE, SLIDING o NONE');
    }
    if (
      !nullish(item.swingSide) &&
      !(ELEMENT_RANGES.swingSide as readonly unknown[]).includes(item.swingSide)
    ) {
      return invalid('`swingSide` debe ser A o B');
    }
    const connects: (string | null)[] = [];
    for (const [name, value] of [
      ['connectsSpaceAId', item.connectsSpaceAId],
      ['connectsSpaceBId', item.connectsSpaceBId],
    ] as const) {
      if (nullish(value)) {
        connects.push(null);
        continue;
      }
      if (typeof value !== 'string') return invalid(`\`${name}\` debe ser un id`);
      const info = spaces.get(value);
      if (!info || info.siteId !== canvas.siteId) {
        return invalid(`\`${name}\` no es un espacio de la sede del lienzo`, 'host');
      }
      connects.push(value);
    }
    return {
      write: {
        ...base,
        vertices: null,
        hostElementId: item.hostElementId,
        offsetM: round3(item.offsetM),
        widthM: round3(item.widthM),
        swing: (item.swing as string | undefined) ?? null,
        swingSide: (item.swingSide as string | undefined) ?? null,
        connectsSpaceAId: connects[0],
        connectsSpaceBId: connects[1],
      },
    };
  }

  if (kind === 'WALL') {
    const problem = checkVertexList(
      item.vertices,
      2,
      GEOMETRY_LIMITS.maxVertices,
    );
    if (problem) return invalid(problem.message, 'geometry');
    if (
      !isNum(item.thicknessM) ||
      item.thicknessM < ELEMENT_RANGES.thicknessM.min ||
      item.thicknessM > ELEMENT_RANGES.thicknessM.max
    ) {
      return invalid(
        `\`thicknessM\` va de ${ELEMENT_RANGES.thicknessM.min} a ${ELEMENT_RANGES.thicknessM.max} m`,
        'size',
      );
    }
    const vertices = (item.vertices as Pt[]).map(
      ([x, y]) => [round3(x), round3(y)] as Pt,
    );
    const bounds = boundsProblem(bboxOf(vertices), canvas);
    if (bounds) return bounds;
    return {
      write: { ...base, vertices, thicknessM: round3(item.thicknessM) },
    };
  }

  if (kind === 'ANNOTATION') {
    const problem = checkVertexList(item.vertices, 1, 1);
    if (problem) return invalid('Una anotación lleva un único punto', 'geometry');
    if (
      typeof item.label !== 'string' ||
      item.label.trim() === '' ||
      item.label.length > ELEMENT_RANGES.labelMax
    ) {
      return invalid(
        `Una anotación lleva un rótulo de hasta ${ELEMENT_RANGES.labelMax} caracteres`,
      );
    }
    const vertices = (item.vertices as Pt[]).map(
      ([x, y]) => [round3(x), round3(y)] as Pt,
    );
    const bounds = boundsProblem(bboxOf(vertices), canvas);
    if (bounds) return bounds;
    return { write: { ...base, vertices, label: item.label.trim() } };
  }

  // STAIRS · ELEVATOR · CIRCULATION · COLUMN
  const problem = validatePolygon(item.vertices);
  if (problem) return invalid(problem.message, 'geometry');
  const vertices = (item.vertices as Pt[]).map(
    ([x, y]) => [round3(x), round3(y)] as Pt,
  );
  const again = validatePolygon(vertices);
  if (again) return invalid(again.message, 'geometry');
  if (!nullish(item.verticalLinkCode)) {
    if (
      typeof item.verticalLinkCode !== 'string' ||
      item.verticalLinkCode.trim() === '' ||
      item.verticalLinkCode.length > ELEMENT_RANGES.verticalLinkMax
    ) {
      return invalid(
        `\`verticalLinkCode\` es un texto de hasta ${ELEMENT_RANGES.verticalLinkMax} caracteres`,
      );
    }
  }
  const bounds = boundsProblem(bboxOf(vertices), canvas);
  if (bounds) return bounds;
  return {
    write: {
      ...base,
      vertices,
      verticalLinkCode:
        typeof item.verticalLinkCode === 'string'
          ? item.verticalLinkCode.trim()
          : null,
    },
  };
}

function boundsProblem(bbox: Bbox, canvas: PlanCanvas): ElementProblem | null {
  if (insideCanvas(bbox, canvas)) return null;
  return {
    error: `El elemento sale del lienzo (${canvas.widthM} × ${canvas.heightM} m)`,
    code: FloorPlanReason.PLAN_OUT_OF_BOUNDS,
    field: 'geometry',
    nextAction: {
      label: 'Mover el elemento',
      hint: 'Acercalo al interior del lienzo o agrandá el lienzo.',
    },
  };
}

/**
 * Posición de una abertura sobre su muro, para las rutas y el dibujo.
 *
 * @param host - Vértices del muro anfitrión.
 * @param offsetM - Distancia desde el primer vértice.
 * @param widthM - Ancho de la abertura.
 * @returns El punto central y la dirección del tramo, o `null` si no cabe.
 */
export function openingPosition(
  host: readonly Pt[],
  offsetM: number,
  widthM: number,
): { x: number; y: number; angleDeg: number } | null {
  return pointAlongPolyline(host, offsetM + widthM / 2);
}
