import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MedicationRecords } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create medication record data.
 */
export interface CreateMedicationRecordData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a request.
   */
  requestId?: string;
  /**
   * Identificador asociado a medication concept.
   */
  medicationConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a record type concept.
   */
  recordTypeConceptId?: string;
  /**
   * Valor de dose decimal mantenido por la instancia.
   */
  doseDecimal?: string;
  /**
   * Identificador asociado a unit concept.
   */
  unitConceptId?: string;
  /**
   * Valor de administered at mantenido por la instancia.
   */
  administeredAt?: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.medication_records` (stateless). */
@Injectable()
export class MedicationRecordsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<MedicationRecords | null>`.
   */
  findById(em: EntityManager, id: string): Promise<MedicationRecords | null> {
    return em.findOne(MedicationRecords, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `MedicationRecords`.
   */
  create(
    em: EntityManager,
    data: CreateMedicationRecordData,
  ): MedicationRecords {
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
