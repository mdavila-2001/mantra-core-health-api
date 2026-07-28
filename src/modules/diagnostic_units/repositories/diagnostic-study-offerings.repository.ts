import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticStudyOfferings } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de publicación de una oferta de estudio (UC-23-05). */
export interface CreateOfferingData {
  /**
   * Identificador asociado a diagnostic unit.
   */
  diagnosticUnitId: string;
  /**
   * Valor de study code mantenido por la instancia.
   */
  studyCode: string;
  /**
   * Identificador asociado a study concept.
   */
  studyConceptId: string;
  /**
   * Valor de display name mantenido por la instancia.
   */
  displayName: string;
  /**
   * Identificador asociado a diagnostic unit site.
   */
  diagnosticUnitSiteId?: string;
  /**
   * Identificador asociado a modality concept.
   */
  modalityConceptId?: string;
  /**
   * Identificador asociado a body site concept.
   */
  bodySiteConceptId?: string;
  /**
   * Identificador asociado a specimen type concept.
   */
  specimenTypeConceptId?: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Valor de preparation instructions mantenido por la instancia.
   */
  preparationInstructions?: string;
  /**
   * Valor de expected duration minutes mantenido por la instancia.
   */
  expectedDurationMinutes?: number;
  /**
   * Valor de expected turnaround minutes mantenido por la instancia.
   */
  expectedTurnaroundMinutes?: number;
  /**
   * Valor de requires medical order mantenido por la instancia.
   */
  requiresMedicalOrder?: boolean;
  /**
   * Valor de requires prior authorization mantenido por la instancia.
   */
  requiresPriorAuthorization?: boolean;
  /**
   * Valor de home collection eligible mantenido por la instancia.
   */
  homeCollectionEligible?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_study_offerings`. */
@Injectable()
export class DiagnosticStudyOfferingsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DiagnosticStudyOfferings | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DiagnosticStudyOfferings | null> {
    return em.findOne(DiagnosticStudyOfferings, { id });
  }

  /** Oferta por (unidad, study_code): la UK que evita duplicados. */
  findByStudyCode(
    em: EntityManager,
    diagnosticUnitId: string,
    studyCode: string,
  ): Promise<DiagnosticStudyOfferings | null> {
    return em.findOne(DiagnosticStudyOfferings, {
      diagnosticUnitId,
      studyCode,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DiagnosticStudyOfferings`.
   */
  create(
    em: EntityManager,
    data: CreateOfferingData,
  ): DiagnosticStudyOfferings {
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
