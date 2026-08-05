import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProcessingLegalBases } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para versionar una base legal de procesamiento. */
export interface CreateProcessingLegalBasisData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a processing purpose.
   */
  processingPurposeId: string;
  /**
   * Identificador asociado a jurisdiction concept.
   */
  jurisdictionConceptId: string;
  /**
   * Identificador asociado a general legal basis concept.
   */
  generalLegalBasisConceptId: string;
  /**
   * Identificador asociado a special category condition concept.
   */
  specialCategoryConditionConceptId?: string;
  /**
   * Valor de policy version mantenido por la instancia.
   */
  policyVersion?: string;
  /**
   * Valor de legal reference uri mantenido por la instancia.
   */
  legalReferenceUri?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `consent.processing_legal_bases` (entidad versionada). */
@Injectable()
export class ProcessingLegalBasesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ProcessingLegalBases | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<ProcessingLegalBases | null> {
    return em.findOne(ProcessingLegalBases, { id });
  }

  /**
   * Versión vigente (sin `valid_to`) para un propósito+jurisdicción: se cierra al
   * insertar una versión nueva (UC-07-06).
   */
  findCurrentVersion(
    em: EntityManager,
    tenantId: string,
    processingPurposeId: string,
    jurisdictionConceptId: string,
    activeStatusConceptId: string,
  ): Promise<ProcessingLegalBases | null> {
    return em.findOne(ProcessingLegalBases, {
      tenantId,
      processingPurposeId,
      jurisdictionConceptId,
      statusConceptId: activeStatusConceptId,
      validTo: null,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ProcessingLegalBases`.
   */
  create(
    em: EntityManager,
    data: CreateProcessingLegalBasisData,
  ): ProcessingLegalBases {
    return em.create(
      ProcessingLegalBases,
      {
        tenantId: data.tenantId,
        processingPurposeId: data.processingPurposeId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        generalLegalBasisConceptId: data.generalLegalBasisConceptId,
        specialCategoryConditionConceptId:
          data.specialCategoryConditionConceptId,
        policyVersion: data.policyVersion,
        legalReferenceUri: data.legalReferenceUri,
        validFrom: data.validFrom,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
