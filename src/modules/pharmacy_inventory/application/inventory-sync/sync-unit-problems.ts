import type { ExternalProduct } from '../../domain/sync/external-catalog';
import {
  resolveExternalCodes,
  unitIssue,
  type ExternalMapping,
} from '../../domain/sync/external-mapping';
/** Un problema de unidad de un producto, por su código externo. */
export interface UnitProblem {
  readonly reason: 'UNIT_MISMATCH' | 'UNIT_NOT_REPORTED';
  readonly mappingUnitCode: string | null;
  readonly externalUnitCode: string | null;
}

/**
 * Los productos cuya línea no se puede leer en su unidad: el vínculo declara
 * una unidad y el catálogo externo cuenta ese código en otra, o no dice en
 * cuál.
 */
export function unitProblems(
  mappings: readonly ExternalMapping[],
  catalog: readonly ExternalProduct[],
): Map<string, UnitProblem> {
  const units = new Map(catalog.map((product) => [product.code, product]));
  const problems = new Map<string, UnitProblem>();
  for (const [code, resolution] of resolveExternalCodes(mappings)) {
    if (resolution.status !== 'MAPPED') continue;
    const externalUnitCode = units.get(code)?.unitCode ?? null;
    const reason = unitIssue(resolution.externalUnitCode, externalUnitCode);
    if (reason) {
      problems.set(resolution.productId, {
        reason,
        mappingUnitCode: resolution.externalUnitCode,
        externalUnitCode,
      });
    }
  }
  return problems;
}
