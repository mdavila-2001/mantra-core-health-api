import { PreconditionFailedException } from '../../common';
import {
  CONTAINER_TYPE_CONCEPTS,
  SPECIMEN_TYPE_CONCEPTS,
} from './diagnostics.concepts';

/*
 * Validación de pertenencia a los catálogos de la recepción de muestras
 * (`specimen-type`, `specimen-container-type`). Vive aparte de
 * `diagnostics.concepts.ts` para que ese archivo siga siendo datos puros: lo
 * importan los seeds, que no tienen por qué arrastrar excepciones HTTP.
 */
/**
 * Motivos estables (`details.reason`) del 422 `PRECONDITION_FAILED` que
 * responden el alta de espécimen y la de contenedor cuando el concepto no es
 * de su catálogo. El cliente ramifica sobre esto, no sobre el mensaje.
 */
export const SPECIMEN_CATALOG_REASONS = {
  SPECIMEN_TYPE: 'SPECIMEN_TYPE_NOT_IN_CATALOG',
  CONTAINER_TYPE: 'CONTAINER_TYPE_NOT_IN_CATALOG',
} as const;

const SPECIMEN_TYPE_SET = new Set(SPECIMEN_TYPE_CONCEPTS);
const CONTAINER_TYPE_SET = new Set(CONTAINER_TYPE_CONCEPTS);

/**
 * Exige que el tipo de espécimen sea uno de `specimen-type`.
 *
 * Hasta que el catálogo existió, el DTO aceptaba cualquier uuid de concepto
 * (la FK sólo prueba que el concepto exista): un «estado activo» pasaba por
 * tipo de espécimen. Es un 422 y no un 400 porque el uuid está bien formado;
 * lo que falla es a qué catálogo pertenece. Mismo criterio que las modalidades
 * de un alta de centro de diagnóstico.
 *
 * @param conceptId - Tipo de espécimen recibido.
 * @throws PreconditionFailedException con `reason: SPECIMEN_TYPE_NOT_IN_CATALOG`.
 */
export function assertSpecimenTypeInCatalog(conceptId: string): void {
  if (SPECIMEN_TYPE_SET.has(conceptId)) return;
  throw new PreconditionFailedException(
    'El tipo de espécimen no pertenece al catálogo de tipos de espécimen',
    {
      reason: SPECIMEN_CATALOG_REASONS.SPECIMEN_TYPE,
      field: 'specimenTypeConceptId',
      conceptId,
      catalog: 'specimen-type',
    },
  );
}

/**
 * Exige que el tipo de contenedor sea uno de `specimen-container-type`.
 *
 * @param conceptId - Tipo de contenedor recibido.
 * @throws PreconditionFailedException con `reason: CONTAINER_TYPE_NOT_IN_CATALOG`.
 */
export function assertContainerTypeInCatalog(conceptId: string): void {
  if (CONTAINER_TYPE_SET.has(conceptId)) return;
  throw new PreconditionFailedException(
    'El tipo de contenedor no pertenece al catálogo de contenedores de muestra',
    {
      reason: SPECIMEN_CATALOG_REASONS.CONTAINER_TYPE,
      field: 'containerTypeConceptId',
      conceptId,
      catalog: 'specimen-container-type',
    },
  );
}
