import type { MedicationRequests } from '../../../clinical/entities';
import { prescriptionItemState } from '../../../clinical/services/prescription-validity';
import type {
  PrescriptionItemStatus,
  PrescriptionOrderItem,
} from '../../domain/prescription-order-policy';
/**
 * Traduce un `medication_request` al ítem del módulo, con su estado resuelto
 * por la regla única de receta vigente (`prescriptionItemState`).
 *
 * @param row - La fila de `clinical.medication_requests`.
 * @param now - Instante contra el que se mide el vencimiento.
 * @returns El ítem plano que usan el guard y la política del pedido.
 */
export function toPrescriptionOrderItem(
  row: MedicationRequests,
  now: Date,
): PrescriptionOrderItem {
  const state: PrescriptionItemStatus = prescriptionItemState(row, now);
  const quantity =
    row.quantityDecimal == null ? null : Number(row.quantityDecimal);
  return {
    id: row.id,
    patientProfileId: row.patientProfileId,
    encounterId: row.encounterId ?? null,
    medicationConceptId: row.medicationConceptId,
    state,
    quantity: quantity !== null && Number.isFinite(quantity) ? quantity : null,
    unitConceptId: row.unitConceptId ?? null,
  };
}
