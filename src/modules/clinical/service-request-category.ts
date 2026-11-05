import { CLIN } from './clinical.concepts';
import { DIAG } from '../diagnostics/diagnostics.concepts';

/**
 * P40 (carril C2, ADR-0016 del frontend): la clasificación textual de una orden
 * de análisis. Es una **vista** de `category_concept_id`, no una columna aparte:
 * guardar las dos sería tener dos lugares donde la categoría puede discrepar.
 */
export const ANALYSIS_CATEGORIES = ['LAB', 'IMAGING', 'OTHER'] as const;

/** `LAB | IMAGING | OTHER`. */
export type AnalysisCategory = (typeof ANALYSIS_CATEGORIES)[number];

/**
 * El concepto que se escribe cuando el alta trae sólo el texto.
 *
 * Imagen se escribe con el concepto de `diagnostics` porque es el que lee el
 * circuito diagnóstico (`DIAGNOSTIC_CATEGORIES`): con el de `clinical`, la
 * orden no aparecería en `GET /diagnostics/patients/:id/orders`.
 */
const CONCEPT_FOR: Readonly<Record<AnalysisCategory, string>> = {
  LAB: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
  IMAGING: DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
  OTHER: CLIN.SERVICE_REQUEST_CATEGORY_OTHER,
};

/** Los dos conceptos de imagen que conviven en el catálogo (`clinical` y `diagnostics`). */
const IMAGING_CONCEPTS: ReadonlySet<string> = new Set([
  CLIN.SERVICE_REQUEST_CATEGORY_IMAGING,
  DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
]);

/**
 * El concepto que corresponde a una categoría textual.
 *
 * @param category - Categoría del alta.
 * @returns El `category_concept_id` a guardar.
 */
export function categoryConceptIdFor(category: AnalysisCategory): string {
  return CONCEPT_FOR[category];
}

/**
 * La categoría textual de una orden, derivada de su concepto.
 *
 * Laboratorio y las dos imágenes se nombran; cualquier otra categoría
 * declarada (procedimiento, cardiología, anatomía patológica, `SR_OTHER`) es
 * `OTHER`, porque el contrato de C2 tiene tres valores y esas no son de
 * laboratorio ni de imagen. Sin concepto no hay categoría: `undefined`, nunca
 * una adivinanza.
 *
 * @param categoryConceptId - `category_concept_id` de la orden.
 * @returns La categoría, o `undefined` si la orden no la declara.
 */
export function analysisCategoryOf(
  categoryConceptId: string | null | undefined,
): AnalysisCategory | undefined {
  if (!categoryConceptId) return undefined;
  if (categoryConceptId === CLIN.SERVICE_REQUEST_CATEGORY_LAB) return 'LAB';
  if (IMAGING_CONCEPTS.has(categoryConceptId)) return 'IMAGING';
  return 'OTHER';
}
