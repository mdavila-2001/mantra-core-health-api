import type { MedicationRequests } from '../../clinical/entities';
import { prescriptionItemState } from '../../clinical/services/prescription-validity';
import { DELEG } from '../delegated_access.concepts';
import type { PrescriptionShareResourceType } from '../dto/prescription-shares.dto';

/**
 * Piezas puras del enlace compartido de receta: qué ítems comparte un enlace
 * y cuáles siguen vigentes. La regla de ítem vigente es la única del sistema
 * (`clinical/services/prescription-validity.ts`); acá solo se aplica.
 */

/** Lo que estas piezas leen de la fila del enlace. */
export interface ShareResourceRef {
  readonly patientProfileId: string;
  readonly resourceTypeConceptId: string;
  readonly resourceId: string;
}

/** Concepto del tipo de recurso → nombre que viaja en la API. */
const RESOURCE_TYPE_NAME: Readonly<
  Record<string, PrescriptionShareResourceType>
> = {
  [DELEG.SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER]: 'PRESCRIPTION_ENCOUNTER',
  [DELEG.SHARE_RESOURCE_MEDICATION_REQUEST]: 'MEDICATION_REQUEST',
};

/**
 * Nombre del tipo de recurso de un enlace.
 *
 * @param link - Fila del enlace.
 * @returns `PRESCRIPTION_ENCOUNTER` o `MEDICATION_REQUEST`.
 */
export function shareResourceTypeOf(
  link: ShareResourceRef,
): PrescriptionShareResourceType {
  return RESOURCE_TYPE_NAME[link.resourceTypeConceptId] ?? 'MEDICATION_REQUEST';
}

/**
 * Si el enlace comparte la receta de un encuentro.
 *
 * @param link - Fila del enlace.
 * @returns `true` para `PRESCRIPTION_ENCOUNTER`.
 */
export function sharesEncounter(link: ShareResourceRef): boolean {
  return (
    link.resourceTypeConceptId === DELEG.SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER
  );
}

/**
 * Los ítems emitidos y vigentes (S-2).
 *
 * @param items - Ítems de la receta, en cualquier estado.
 * @param now - Instante de la lectura.
 * @returns Solo los `ACTIVE` según `prescriptionItemState`.
 */
export function activeItemsOf(
  items: readonly MedicationRequests[],
  now: Date,
): MedicationRequests[] {
  return items.filter((item) => prescriptionItemState(item, now) === 'ACTIVE');
}

/**
 * Los ítems que comparte un enlace, entre los leídos para varios enlaces. Solo
 * los del mismo paciente del enlace.
 *
 * @param link - Fila del enlace.
 * @param items - Ítems leídos.
 * @returns Los del encuentro (o el fármaco) del enlace.
 */
export function itemsOfLink(
  link: ShareResourceRef,
  items: readonly MedicationRequests[],
): MedicationRequests[] {
  const isEncounter = sharesEncounter(link);
  return items.filter(
    (item) =>
      item.patientProfileId === link.patientProfileId &&
      (isEncounter
        ? item.encounterId === link.resourceId
        : item.id === link.resourceId),
  );
}

/**
 * Los recursos distintos de un tipo entre varios enlaces.
 *
 * @param links - Filas de enlaces.
 * @param resourceTypeConceptId - `DELEG.SHARE_RESOURCE_*`.
 * @returns Ids de recurso sin repetir.
 */
export function resourceIdsOf(
  links: readonly ShareResourceRef[],
  resourceTypeConceptId: string,
): string[] {
  return [
    ...new Set(
      links
        .filter((link) => link.resourceTypeConceptId === resourceTypeConceptId)
        .map((link) => link.resourceId),
    ),
  ];
}

/**
 * La fecha más temprana, ignorando las ausentes.
 *
 * @param dates - Fechas, algunas ausentes.
 * @returns La menor, o `null` si no hay ninguna.
 */
export function earliestDate(
  dates: ReadonlyArray<Date | null | undefined>,
): Date | null {
  let earliest: Date | null = null;
  for (const date of dates) {
    if (date && (!earliest || date.getTime() < earliest.getTime())) {
      earliest = date;
    }
  }
  return earliest;
}
