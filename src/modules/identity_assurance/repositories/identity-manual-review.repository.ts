import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityManualReviewCases } from '../entities';
import { createdBy } from '../../../common';

/** Escalado de un caso a revisión manual (UC-27-08). */
export interface CreateManualReviewData {
  /**
   * Identificador asociado a identity verification case.
   */
  identityVerificationCaseId: string;
  /**
   * Identificador asociado a review reason concept.
   */
  reviewReasonConceptId: string;
  /**
   * Identificador asociado a assigned to user.
   */
  assignedToUserId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de opened at mantenido por la instancia.
   */
  openedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `identity_assurance.identity_manual_review_cases`. */
@Injectable()
export class IdentityManualReviewCasesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<IdentityManualReviewCases | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IdentityManualReviewCases | null> {
    return em.findOne(IdentityManualReviewCases, { id });
  }

  /**
   * Ejecuta la operación count open by case.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param caseId - Identificador de case.
   * @param openStatusConceptId - Identificador de open status concept.
   * @returns Resultado de count open by case conforme al contrato `Promise<number>`.
   */
  countOpenByCase(
    em: EntityManager,
    caseId: string,
    openStatusConceptId: string,
  ): Promise<number> {
    return em.count(IdentityManualReviewCases, {
      identityVerificationCaseId: caseId,
      statusConceptId: openStatusConceptId,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityManualReviewCases`.
   */
  create(
    em: EntityManager,
    data: CreateManualReviewData,
  ): IdentityManualReviewCases {
    return em.create(
      IdentityManualReviewCases,
      {
        identityVerificationCaseId: data.identityVerificationCaseId,
        reviewReasonConceptId: data.reviewReasonConceptId,
        assignedToUserId: data.assignedToUserId,
        statusConceptId: data.statusConceptId,
        openedAt: data.openedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * La revisión manual ya decidida más reciente del caso.
   *
   * Es de donde sale el motivo de aceptación/rechazo que ve el titular
   * (FT-32-R05): un caso resuelto sin escalar a revisión manual no tiene fila
   * acá, y por tanto no tiene motivo de texto — sólo el trace de sus checks.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param caseId - Caso a consultar.
   * @returns La revisión decidida más reciente, o `null` si no hubo ninguna.
   */
  findLatestDecidedByCase(
    em: EntityManager,
    caseId: string,
  ): Promise<IdentityManualReviewCases | null> {
    return em.findOne(
      IdentityManualReviewCases,
      { identityVerificationCaseId: caseId, decidedAt: { $ne: null } },
      { orderBy: { decidedAt: 'DESC' } },
    );
  }
}
