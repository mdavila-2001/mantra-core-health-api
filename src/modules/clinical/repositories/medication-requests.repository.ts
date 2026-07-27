import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MedicationRequests } from '../entities';
import { createdBy } from '../../../common';

export interface CreateMedicationRequestData {
  custodianTenantId: string;
  patientProfileId: string;
  encounterId?: string;
  medicationConceptId: string;
  substanceAtcConceptId?: string;
  intentConceptId?: string;
  statusConceptId: string;
  prescriberProfileId?: string;
  doseText?: string;
  routeConceptId?: string;
  frequencyText?: string;
  quantityDecimal?: string;
  unitConceptId?: string;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `clinical.medication_requests` (stateless). */
@Injectable()
export class MedicationRequestsRepository {
  findById(em: EntityManager, id: string): Promise<MedicationRequests | null> {
    return em.findOne(MedicationRequests, { id });
  }

  create(
    em: EntityManager,
    data: CreateMedicationRequestData,
  ): MedicationRequests {
    return em.create(
      MedicationRequests,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        medicationConceptId: data.medicationConceptId,
        substanceAtcConceptId: data.substanceAtcConceptId,
        intentConceptId: data.intentConceptId,
        statusConceptId: data.statusConceptId,
        prescriberProfileId: data.prescriberProfileId,
        doseText: data.doseText,
        routeConceptId: data.routeConceptId,
        frequencyText: data.frequencyText,
        quantityDecimal: data.quantityDecimal,
        unitConceptId: data.unitConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
