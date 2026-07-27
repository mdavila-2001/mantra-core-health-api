import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProcessingLegalBases } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para versionar una base legal de procesamiento. */
export interface CreateProcessingLegalBasisData {
  tenantId: string;
  processingPurposeId: string;
  jurisdictionConceptId: string;
  generalLegalBasisConceptId: string;
  specialCategoryConditionConceptId?: string;
  policyVersion?: string;
  legalReferenceUri?: string;
  validFrom: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `consent.processing_legal_bases` (entidad versionada). */
@Injectable()
export class ProcessingLegalBasesRepository {
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
