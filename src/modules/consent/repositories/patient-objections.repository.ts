import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientObjections } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para registrar una objeción del paciente. */
export interface CreatePatientObjectionData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a processing purpose.
   */
  processingPurposeId: string;
  /**
   * Identificador asociado a objection type concept.
   */
  objectionTypeConceptId: string;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de raised at mantenido por la instancia.
   */
  raisedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `consent.patient_objections`. */
@Injectable()
export class PatientObjectionsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PatientObjections | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PatientObjections`.
   */
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
