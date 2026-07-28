import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TreatmentInformedConsents } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para capturar un consentimiento informado de tratamiento. */
export interface CreateTreatmentInformedConsentData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId: string;
  /**
   * Identificador asociado a procedure code concept.
   */
  procedureCodeConceptId?: string;
  /**
   * Valor de information version mantenido por la instancia.
   */
  informationVersion?: string;
  /**
   * Identificador asociado a interpreter user.
   */
  interpreterUserId?: string;
  /**
   * Identificador asociado a witness user.
   */
  witnessUserId?: string;
  /**
   * Identificador asociado a decision concept.
   */
  decisionConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de signed at mantenido por la instancia.
   */
  signedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `consent.treatment_informed_consents` (entidad versionada). */
@Injectable()
export class TreatmentInformedConsentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<TreatmentInformedConsents | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<TreatmentInformedConsents | null> {
    return em.findOne(TreatmentInformedConsents, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `TreatmentInformedConsents`.
   */
  create(
    em: EntityManager,
    data: CreateTreatmentInformedConsentData,
  ): TreatmentInformedConsents {
    return em.create(
      TreatmentInformedConsents,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        encounterId: data.encounterId,
        procedureCodeConceptId: data.procedureCodeConceptId,
        informationVersion: data.informationVersion,
        interpreterUserId: data.interpreterUserId,
        witnessUserId: data.witnessUserId,
        decisionConceptId: data.decisionConceptId,
        statusConceptId: data.statusConceptId,
        signedAt: data.signedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
