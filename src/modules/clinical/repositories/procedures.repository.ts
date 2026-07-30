import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Procedures } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create procedure data.
 */
export interface CreateProcedureData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a code concept.
   */
  codeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a performer profile.
   */
  performerProfileId?: string;
  /**
   * Identificador asociado a service request.
   */
  serviceRequestId?: string;
  /**
   * Identificador asociado a parent procedure.
   */
  parentProcedureId?: string;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId?: string;
  /**
   * Identificador asociado a outcome concept.
   */
  outcomeConceptId?: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId?: string;
  /**
   * Identificador asociado a care space.
   */
  careSpaceId?: string;
  /**
   * Valor de occurrence start at mantenido por la instancia.
   */
  occurrenceStartAt?: Date;
  /**
   * Valor de occurrence end at mantenido por la instancia.
   */
  occurrenceEndAt?: Date;
  /**
   * Valor de recorded at mantenido por la instancia.
   */
  recordedAt?: Date;
  /**
   * Valor de follow up text mantenido por la instancia.
   */
  followUpText?: string;
  /**
   * Identificador asociado a operative report file.
   */
  operativeReportFileId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.procedures` (stateless). */
@Injectable()
export class ProceduresRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Procedures | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Procedures | null> {
    return em.findOne(Procedures, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Procedures`.
   */
  create(em: EntityManager, data: CreateProcedureData): Procedures {
    return em.create(
      Procedures,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        codeConceptId: data.codeConceptId,
        statusConceptId: data.statusConceptId,
        performerProfileId: data.performerProfileId,
        serviceRequestId: data.serviceRequestId,
        parentProcedureId: data.parentProcedureId,
        categoryConceptId: data.categoryConceptId,
        outcomeConceptId: data.outcomeConceptId,
        practiceSiteId: data.practiceSiteId,
        careSpaceId: data.careSpaceId,
        occurrenceStartAt: data.occurrenceStartAt,
        occurrenceEndAt: data.occurrenceEndAt,
        recordedAt: data.recordedAt,
        followUpText: data.followUpText,
        operativeReportFileId: data.operativeReportFileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
