import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticStudyOfferings } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de publicación de una oferta de estudio (UC-23-05). */
export interface CreateOfferingData {
  diagnosticUnitId: string;
  studyCode: string;
  studyConceptId: string;
  displayName: string;
  diagnosticUnitSiteId?: string;
  modalityConceptId?: string;
  bodySiteConceptId?: string;
  specimenTypeConceptId?: string;
  description?: string;
  preparationInstructions?: string;
  expectedDurationMinutes?: number;
  expectedTurnaroundMinutes?: number;
  requiresMedicalOrder?: boolean;
  requiresPriorAuthorization?: boolean;
  homeCollectionEligible?: boolean;
  statusConceptId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_study_offerings`. */
@Injectable()
export class DiagnosticStudyOfferingsRepository {
  findById(em: EntityManager, id: string): Promise<DiagnosticStudyOfferings | null> {
    return em.findOne(DiagnosticStudyOfferings, { id });
  }

  /** Oferta por (unidad, study_code): la UK que evita duplicados. */
  findByStudyCode(
    em: EntityManager,
    diagnosticUnitId: string,
    studyCode: string,
  ): Promise<DiagnosticStudyOfferings | null> {
    return em.findOne(DiagnosticStudyOfferings, { diagnosticUnitId, studyCode });
  }

  create(em: EntityManager, data: CreateOfferingData): DiagnosticStudyOfferings {
    return em.create(
      DiagnosticStudyOfferings,
      {
        diagnosticUnitId: data.diagnosticUnitId,
        diagnosticUnitSiteId: data.diagnosticUnitSiteId,
        studyCode: data.studyCode,
        studyConceptId: data.studyConceptId,
        modalityConceptId: data.modalityConceptId,
        bodySiteConceptId: data.bodySiteConceptId,
        specimenTypeConceptId: data.specimenTypeConceptId,
        displayName: data.displayName,
        description: data.description,
        preparationInstructions: data.preparationInstructions,
        expectedDurationMinutes: data.expectedDurationMinutes,
        expectedTurnaroundMinutes: data.expectedTurnaroundMinutes,
        requiresMedicalOrder: data.requiresMedicalOrder,
        requiresPriorAuthorization: data.requiresPriorAuthorization,
        homeCollectionEligible: data.homeCollectionEligible,
        statusConceptId: data.statusConceptId ?? DUNIT.OFFERING_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
