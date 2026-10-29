import { PreconditionFailedException } from '../../../../../common';
import {
  exceptionSourceKind,
  isManualException,
} from '../../../domain/catalog/catalog-concepts';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/**
 * Una excepción que creó un bloqueo del consultorio o el estado de un equipo (F5d) se cambia
 * en su origen —terminar el bloqueo, devolver el equipo a servicio—, nunca desde la agenda:
 * editarla o borrarla dejaría la agenda diciendo una cosa y el espacio otra.
 *
 * @param sourceKindConceptId - `source_kind_concept_id` de la fila (`null` ≡ manual).
 * @throws PreconditionFailedException (422 `EXCEPTION_SOURCE_READ_ONLY`).
 */
export function assertManualException(
  sourceKindConceptId: string | null | undefined,
): void {
  if (isManualException(sourceKindConceptId)) return;
  throw new PreconditionFailedException(
    'Este bloqueo lo creó el consultorio o el equipo: se levanta desde su origen',
    { sourceKind: exceptionSourceKind(sourceKindConceptId) },
    SchedulingErrorReason.EXCEPTION_SOURCE_READ_ONLY,
  );
}
