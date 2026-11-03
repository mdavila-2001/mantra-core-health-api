import { Injectable } from '@nestjs/common';
import type { MedicationRequests } from '../../../clinical/entities';
import {
  PrescriptionSharesService,
  type PharmacyPrescriptionShare,
} from '../../../delegated_access/services/prescription-shares.service';
import type {
  PharmacyPrescriptionSharesPort,
  PrescriptionShareOpenContext,
  SharedPrescriptionItemSnapshot,
  SharedPrescriptionSnapshot,
} from '../../application/ports/pharmacy-prescription-shares.port';

/**
 * Adaptador a los enlaces de receta del contexto `delegated_access` (FAR-01).
 *
 * Traduce las filas de `clinical.medication_requests` a un ítem plano antes de
 * entrar a `application/` (también dentro de `prepare`, que arma la vista antes
 * de que se registre el `OPENED`): la farmacia no recibe la entidad clínica ni nada
 * que no use. Los errores del contexto dueño (404 sin uso, 410 con `DENIED`)
 * pasan tal cual.
 */
@Injectable()
export class DelegatedAccessPrescriptionSharesAdapter implements PharmacyPrescriptionSharesPort {
  constructor(private readonly shares: PrescriptionSharesService) {}

  openForPharmacy<T>(
    token: string,
    context: PrescriptionShareOpenContext,
    prepare: (share: SharedPrescriptionSnapshot) => Promise<T>,
  ): Promise<T> {
    return this.shares.openForPharmacy(
      token,
      {
        sourceIp: context.sourceIp ?? null,
        userAgent: context.userAgent ?? null,
      },
      (share) => prepare(toShareSnapshot(share)),
    );
  }
}

/** La receta compartida, plana: sin entidades clínicas ni el tenant custodio. */
export function toShareSnapshot(
  share: PharmacyPrescriptionShare,
): SharedPrescriptionSnapshot {
  return {
    shareId: share.shareId,
    patientProfileId: share.patientProfileId,
    issuedAt: share.issuedAt,
    validTo: share.validTo,
    prescriber: {
      name: share.prescriber.name,
      license: share.prescriber.license
        ? {
            number: share.prescriber.license.number,
            authority: share.prescriber.license.authority,
            state: share.prescriber.license.state,
          }
        : null,
    },
    items: share.items.map(toItemSnapshot),
  };
}

/** Un ítem de receta, plano. Una cantidad ilegible cuenta como no fijada. */
export function toItemSnapshot(
  row: MedicationRequests,
): SharedPrescriptionItemSnapshot {
  const quantity =
    row.quantityDecimal == null ? null : Number(row.quantityDecimal);
  return {
    id: row.id,
    medicationConceptId: row.medicationConceptId,
    doseText: row.doseText ?? null,
    frequencyText: row.frequencyText ?? null,
    quantity: quantity !== null && Number.isFinite(quantity) ? quantity : null,
    unitConceptId: row.unitConceptId ?? null,
  };
}
