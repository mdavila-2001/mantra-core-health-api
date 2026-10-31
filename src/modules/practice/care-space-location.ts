import { PRAC } from './practice.concepts';

/** Tipo físico FHIR de un espacio de atención (`Location.physicalType`). */
export type FhirPhysicalType = 'bu' | 'lvl' | 'wi' | 'ro' | 'bd' | 'si';

/**
 * Ruta materializada de un espacio: `/<sede>/<edificio>/<piso>/<sala>/`. Lista
 * de la sede al propio espacio todos los ancestros, de modo que «dentro de una
 * ubicación» es «el id de la ubicación aparece en la ruta».
 *
 * @param siteId - Sede que contiene el espacio.
 * @param spaceId - Id del propio espacio.
 * @param parent - Espacio padre, si lo tiene, con su ruta ya calculada.
 * @returns La ruta del espacio, terminada en `/`.
 */
export function computeLocationPath(
  siteId: string,
  spaceId: string,
  parent?: { id: string; locationPath?: string | null },
): string {
  const parentPath = parent
    ? (parent.locationPath ?? `/${siteId}/${parent.id}/`)
    : `/${siteId}/`;
  return `${parentPath}${spaceId}/`;
}

/**
 * Tipo físico FHIR de un espacio según su tipo.
 *
 * @param spaceTypeConceptId - Concepto del tipo de espacio.
 * @returns `bu`, `lvl`, `wi`, `ro` o `bd`; `ro` para cualquier sala.
 */
export function fhirPhysicalTypeOf(
  spaceTypeConceptId: string,
): FhirPhysicalType {
  switch (spaceTypeConceptId) {
    case PRAC.SPACE_TYPE_BUILDING:
      return 'bu';
    case PRAC.SPACE_TYPE_LEVEL:
      return 'lvl';
    case PRAC.SPACE_TYPE_WING:
      return 'wi';
    case PRAC.SPACE_TYPE_BED:
      return 'bd';
    default:
      return 'ro';
  }
}

/** Espacio mínimo para recalcular rutas: id, padre y ruta actual. */
export interface SpaceNode {
  id: string;
  parentSpaceId?: string | null;
  locationPath?: string | null;
}

/**
 * Rutas nuevas al mover un espacio bajo otro padre (o a la raíz de la sede).
 * Devuelve la ruta del espacio movido y la de cada uno de sus descendientes;
 * el resto de la sede queda intacto.
 *
 * @param siteId - Sede de los espacios.
 * @param spaces - Todos los espacios de la sede.
 * @param movedId - Espacio que se mueve.
 * @param newParentId - Nuevo padre, o `null` para colgarlo de la sede.
 * @returns Mapa id → ruta nueva, solo con los espacios afectados.
 * @throws Error si el padre no existe en la sede o si crearía un ciclo.
 */
export function relocateSubtree(
  siteId: string,
  spaces: SpaceNode[],
  movedId: string,
  newParentId: string | null,
): Map<string, string> {
  const byId = new Map(spaces.map((s) => [s.id, s]));
  const moved = byId.get(movedId);
  if (!moved) throw new Error('El espacio no pertenece a la sede');
  const children = new Map<string, SpaceNode[]>();
  for (const s of spaces) {
    if (!s.parentSpaceId) continue;
    children.set(s.parentSpaceId, [
      ...(children.get(s.parentSpaceId) ?? []),
      s,
    ]);
  }
  const descendants = new Set<string>();
  const queue = [movedId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of children.get(current) ?? []) {
      descendants.add(child.id);
      queue.push(child.id);
    }
  }
  if (newParentId !== null) {
    if (newParentId === movedId || descendants.has(newParentId)) {
      throw new Error(
        'Un espacio no puede colgar de sí mismo ni de un descendiente',
      );
    }
    if (!byId.has(newParentId)) {
      throw new Error('El espacio padre no pertenece a la sede');
    }
  }
  // Prefijo del nuevo padre: se reconstruye por la cadena de ancestros y no
  // por la ruta guardada, que en espacios anteriores a la ruta puede faltar.
  let base = `/${siteId}/`;
  if (newParentId !== null) {
    const chain: string[] = [];
    for (
      let cursor: SpaceNode | undefined = byId.get(newParentId);
      cursor;
      cursor = cursor.parentSpaceId ? byId.get(cursor.parentSpaceId) : undefined
    ) {
      chain.unshift(cursor.id);
    }
    base = `/${siteId}/${chain.join('/')}/`;
  }
  const result = new Map<string, string>();
  const walk = (node: SpaceNode, prefix: string): void => {
    const path = `${prefix}${node.id}/`;
    result.set(node.id, path);
    for (const child of children.get(node.id) ?? []) walk(child, path);
  };
  walk(moved, base);
  return result;
}
