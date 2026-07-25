import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MedicationRecords } from '../entities';
import { createdBy } from '../../../common';

export interface CreateMedicationRecordData {
  custodianTenantId: string;
  patientProfileId: string;
  requestId?: string;
  medicationConceptId: string;
  statusConceptId: string;
  recordTypeConceptId?: string;
  doseDecimal?: string;
  unitConceptId?: string;
  administeredAt?: Date;
  recordedByUserId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical.medication_records` (stateless). */
@Injectable()
export class MedicationRecordsRepository {
  findById(em: EntityManager, id: string): Promise<MedicationRecords | null> {
    return em.findOne(MedicationRecords, { id });
  }

  create(em: EntityManager, data: CreateMedicationRecordData): MedicationRecords {
    return em.create(
      MedicationRecords,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        requestId: data.requestId,
        medicationConceptId: data.medicationConceptId,
        statusConceptId: data.statusConceptId,
        recordTypeConceptId: data.recordTypeConceptId,
        doseDecimal: data.doseDecimal,
        unitConceptId: data.unitConceptId,
        administeredAt: data.administeredAt,
        recordedByUserId: data.recordedByUserId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
