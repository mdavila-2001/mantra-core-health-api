// =============================================================================
// Jerarquía de enfermedades (TAREA-41 F3.4). Puro: no toca red ni base.
//
// `SUBCLASS_OF` de la ficha es el `REL_IS_A` que ya existe (decisión de F1.1):
// hijo → padre, sin evidencia ni fuerza (es navegación, no una columna del
// mapa). Sólo se llevan aristas que la propia fuente DECLARA:
//
//  - MONDO y DOID: el campo `parents` de cada registro del catálogo de
//    enfermedades (`diseases/data/`), que sale de `is_a` del OBO.
//  - CIE-10-ES: el último elemento de `hierarchy` de la ficha es su categoría
//    padre cuando ese código es otro diagnóstico del glosario. Los capítulos y
//    bloques («Cap.01», «A00-A09») no son conceptos y no se cargan.
//  - MeSH: el snapshot sólo trae claves de cruce (`parents` vacío en los
//    9 320 registros): no hay jerarquía que cargar y no se deduce de los
//    números de árbol.
//
// Las aristas se llevan a los conceptos del glosario con la identidad MONDO de
// F3.1 (`resolve`), de modo que una enfermedad con ficha CIE-10-ES queda
// conectada por la ficha y no por el nodo de catálogo. Una arista cuyos dos
// extremos son el propio nodo MONDO del catálogo ya la cargó
// `diseases/load-catalog.mjs` con otro id; se cuenta y no se vuelve a emitir.
// =============================================================================

import { conceptId as glossaryConceptId, md5uuid } from './load-plan.mjs';
import { conceptId as diseaseCatalogConceptId } from '../../diseases/lib/code-systems.mjs';
import { INTERNAL } from '../../diseases/lib/plan.mjs';

export const IS_A_RELATION_TYPE = INTERNAL.REL_IS_A;

/** Aristas hijo → padre de registros de catálogo (`{ cs, code, parents }`). */
export function catalogParentEdges(records) {
  const edges = [];
  for (const r of records) {
    if (r.status && r.status !== 'active') continue;
    for (const parent of r.parents ?? []) edges.push({ child: r.code, parent, via: r.cs });
  }
  return edges;
}

/**
 * Aristas de la ruta declarada por CIE-10-ES: ficha → categoría padre (si es otro
 * diagnóstico). Las dos puntas son fichas del glosario, es decir, ya son
 * conceptos: llevan su `conceptId` y no pasan por la identidad MONDO.
 */
export function cie10ParentEdges(glossaryRows) {
  const slugByCode = new Map(glossaryRows.map((r) => [r.code, r.slug]));
  const edges = [];
  for (const r of glossaryRows) {
    const parent = r.hierarchy?.at(-1)?.code;
    if (!parent || parent === r.code || !slugByCode.has(parent)) continue;
    edges.push({
      child: `ICD10CM:${r.code}`,
      parent: `ICD10CM:${parent}`,
      via: 'cie10-es',
      childConceptId: glossaryConceptId(r.slug),
      parentConceptId: glossaryConceptId(slugByCode.get(parent)),
    });
  }
  return edges;
}

export const isAEdgeId = (childConceptId, parentConceptId) => md5uuid(`mantra:f3:rel:is-a:${childConceptId}:${parentConceptId}`);

/**
 * Aristas por código → filas `[id, source, target, type, ordinal]` de
 * `concept_relationships`.
 *
 * @param {{ child: string, parent: string, via: string, childConceptId?: string, parentConceptId?: string }[]} edges
 *   Códigos con prefijo (`MONDO:…`, `DOID:…`, `ICD10CM:…`); si traen `…ConceptId` se usa ese concepto sin resolver.
 * @param {(curie: string) => { conceptId: string|null, reason?: string|null }} resolve
 */
export function hierarchyToRelationshipRows(edges, resolve) {
  const stats = { read: 0, unresolved: {}, selfEdges: 0, alreadyInCatalog: 0, duplicates: 0, rows: 0, byVia: {} };
  const seen = new Set();
  const rows = [];
  const miss = (reason) => { stats.unresolved[reason] = (stats.unresolved[reason] ?? 0) + 1; };

  for (const e of edges) {
    stats.read += 1;
    const child = e.childConceptId ? { conceptId: e.childConceptId } : resolve(e.child);
    const parent = e.parentConceptId ? { conceptId: e.parentConceptId } : resolve(e.parent);
    if (!child?.conceptId || !parent?.conceptId) {
      miss(child?.conceptId ? (parent?.reason ?? 'parent-unresolved') : (child?.reason ?? 'child-unresolved'));
      continue;
    }
    if (child.conceptId === parent.conceptId) {
      stats.selfEdges += 1;
      continue;
    }
    if (e.via === 'mondo' && child.conceptId === diseaseCatalogConceptId('mondo', e.child) && parent.conceptId === diseaseCatalogConceptId('mondo', e.parent)) {
      stats.alreadyInCatalog += 1;
      continue;
    }
    const id = isAEdgeId(child.conceptId, parent.conceptId);
    if (seen.has(id)) {
      stats.duplicates += 1;
      continue;
    }
    seen.add(id);
    rows.push([id, child.conceptId, parent.conceptId, IS_A_RELATION_TYPE, null]);
    stats.byVia[e.via] = (stats.byVia[e.via] ?? 0) + 1;
  }
  stats.rows = rows.length;
  return { rows, stats };
}
