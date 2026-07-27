import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientObjections } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para registrar una objeción del paciente. */
export interface CreatePatientObjectionData {
  patientProfileId: string;
  tenantId: string;
  processingPurposeId: string;
  objectionTypeConceptId: string;
  reasonText?: string;
  statusConceptId: string;
  raisedAt: Date;
  actorUserId?: string;
}

/** Acceso a datos de `consent.patient_objections`. */
@Injectable()
export class PatientObjectionsRepository {
  findById(em: EntityManager, id: string): Promise<PatientObjections | null> {
    return em.findOne(PatientObjections, { id });
  }

  /** Objeción abierta duplicada (mismo paciente/propósito) para el guard de unicidad. */
  findOpenByPurpose(
    em: EntityManager,
    patientProfileId: string,
    processingPurposeId: string,
    raisedStatusConceptId: string,
  ): Promise<PatientObjections | null> {
    return em.findOne(PatientObjections, {
      patientProfileId,
      processingPurposeId,
      statusConceptId: raisedStatusConceptId,
    });
  }

  create(
    em: EntityManager,
    data: CreatePatientObjectionData,
  ): PatientObjections {
    return em.create(
      PatientObjections,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        processingPurposeId: data.processingPurposeId,
        objectionTypeConceptId: data.objectionTypeConceptId,
        reasonText: data.reasonText,
        statusConceptId: data.statusConceptId,
        raisedAt: data.raisedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
