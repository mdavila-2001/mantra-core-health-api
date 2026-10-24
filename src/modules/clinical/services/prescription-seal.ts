import { createHash } from 'node:crypto';
import type { MedicationRequests } from '../entities';

/**
 * Forma canónica del contenido que se sella en el PDF oficial de una receta
 * (B.3): claves fijas, para que el mismo contenido produzca siempre el mismo
 * hash sin importar el orden en que TypeScript enumeró las propiedades.
 *
 * **No es** el `snapshot()` de `MedicationsService` (auditoría §2): ese lleva
 * `status`/`statusReasonText` y no lleva `id`/`patientProfileId`/
 * `prescriberProfileId` — es el contenido que cambió en cada evento, no una
 * identidad estable del documento. Este payload es el que un verificador
 * externo (`GET /public/prescriptions/:id/verify`) puede recalcular sin ver
 * PHI: por eso tampoco lleva `patientInstructionsText` en texto, sino su
 * hash lo cubre indirectamente al estar la receta entera adentro.
 */
export interface PrescriptionSealPayload {
  readonly id: string;
  readonly patientProfileId: string;
  readonly prescriberProfileId: string | null;
  readonly medicationConceptId: string;
  readonly substanceAtcConceptId: string | null;
  readonly doseText: string | null;
  readonly routeConceptId: string | null;
  readonly frequencyText: string | null;
  readonly quantityDecimal: string | null;
  readonly unitConceptId: string | null;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly patientInstructionsText: string | null;
  readonly indicationConditionId: string | null;
  readonly issuedAt: string | null;
}

/**
 * Arma el payload canónico de una receta, tal como queda una vez emitida
 * (`issue()` la sella: ningún campo clínico cambia después).
 *
 * `quantityDecimal` llega de la entidad como `numeric` mapeado a `string`
 * (`'1'`, `'1.00'`…); se usa tal cual sin canonizar el formato porque
 * `MedicationsService.prescribe()` ya lo escribe con `String(dto.quantityDecimal)`
 * una sola vez y la receta es inmutable desde `issue()` — dos lecturas del
 * mismo registro dan siempre el mismo string.
 *
 * @param request - La receta, ya cargada de la base.
 * @returns El payload canónico, listo para `JSON.stringify`.
 */
export function buildPrescriptionSealPayload(
  request: MedicationRequests,
): PrescriptionSealPayload {
  return {
    id: request.id,
    patientProfileId: request.patientProfileId,
    prescriberProfileId: request.prescriberProfileId ?? null,
    medicationConceptId: request.medicationConceptId,
    substanceAtcConceptId: request.substanceAtcConceptId ?? null,
    doseText: request.doseText ?? null,
    routeConceptId: request.routeConceptId ?? null,
    frequencyText: request.frequencyText ?? null,
    quantityDecimal: request.quantityDecimal ?? null,
    unitConceptId: request.unitConceptId ?? null,
    validFrom: request.validFrom ? request.validFrom.toISOString() : null,
    validTo: request.validTo ? request.validTo.toISOString() : null,
    patientInstructionsText: request.patientInstructionsText ?? null,
    indicationConditionId: request.indicationConditionId ?? null,
    issuedAt: request.issuedAt ? request.issuedAt.toISOString() : null,
  };
}

/**
 * El sello SHA-256 (hex) de una receta, calculado al vuelo — **no se
 * persiste**: la fila ya es inmutable desde `issue()` (CAN-RX-001..004,
 * `medications.service.ts`), así que recalcularlo siempre da el mismo
 * resultado y agregar una columna sería cambio de modelo sin necesidad.
 *
 * Mismo algoritmo que `EncounterSealService.computeHash` (`sha256` sobre el
 * JSON de un objeto de claves fijas), para que el criterio de sello sea uno
 * solo en todo el módulo clínico.
 *
 * @param request - La receta a sellar.
 * @returns El hash en hexadecimal (64 caracteres).
 */
export function computePrescriptionHash(request: MedicationRequests): string {
  const payload = buildPrescriptionSealPayload(request);
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
