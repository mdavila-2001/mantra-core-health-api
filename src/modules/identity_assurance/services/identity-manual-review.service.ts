import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';
import {
  IdentityManualReviewCasesRepository,
  IdentityFraudSignalsRepository,
} from '../repositories';
import { ReviewDecisionDto, ReviewDecisionResponseDto } from '../dto';
import { IdentityChecksService } from './identity-checks.service';
import { IdentityCaseScope } from './identity-case-scope.service';
import { IdentityAssuranceErrorReason } from '../identity_assurance.error-reasons';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';

/**
 * UC-27-09: resolución de una revisión manual. La decisión del revisor lleva el
 * caso a verificado o rechazado y cierra las señales de fraude asociadas.
 */
@Injectable()
export class IdentityManualReviewService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reviewRepo - Valor de review repo requerido por la operación.
   * @param fraudRepo - Valor de fraud repo requerido por la operación.
   * @param checksService - Cierra los checks y emite la aserción al aprobar.
   * @param scope - Alcance por tenant de los casos.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reviewRepo: IdentityManualReviewCasesRepository,
    private readonly fraudRepo: IdentityFraudSignalsRepository,
    private readonly checksService: IdentityChecksService,
    private readonly scope: IdentityCaseScope,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentityManualReviewService.name);
  }

  /** UC-27-09: registra la decisión (aprobado/rechazado) de la revisión. */
  async decide(
    reviewId: string,
    dto: ReviewDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<ReviewDecisionResponseDto> {
    this.logger.info(
      {
        operation: 'ida.review.decide',
        actorId: actor.id,
        reviewId,
        decision: dto.decision,
      },
      'Deciding manual review',
    );
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      // La revisión no lleva tenant: lo hereda del sujeto de su caso. Ajena e
      // inexistente responden igual y la decisión no se registra.
      const found = await this.reviewRepo.findById(tx, reviewId);
      const ownCase = found
        ? await this.scope.findAuthorizedCase(
            tx,
            found.identityVerificationCaseId,
            tenantId,
          )
        : null;
      const review = assertResourceInTenant(
        found,
        ownCase ? tenantId : null,
        tenantId,
        {
          message: 'Revisión manual no encontrada',
          reason: IdentityAssuranceErrorReason.REVIEW_NOT_AVAILABLE,
        },
      );
      if (review.statusConceptId !== IDA.REVIEW_OPEN) {
        throw new PreconditionFailedException('La revisión ya fue decidida', {
          reviewId,
          status: review.statusConceptId,
        });
      }
      if (review.assignedToUserId && review.assignedToUserId !== actor.id) {
        throw new PreconditionFailedException(
          'La revisión está asignada a otro revisor',
          { reviewId },
        );
      }

      const kase = assertResourceInTenant(ownCase, tenantId, tenantId, {
        message: 'Caso de verificación no encontrado',
        reason: IdentityAssuranceErrorReason.CASE_NOT_AVAILABLE,
      });

      const approved = dto.decision === 'APPROVED';
      const now = new Date();
      review.statusConceptId = IDA.REVIEW_DECIDED;
      review.decidedAt = now;
      review.decisionConceptId = approved
        ? IDA.DECISION_APPROVED
        : IDA.DECISION_REJECTED;
      review.decisionReason = dto.decisionReason;
      touch(review, actor.id);

      if (approved) {
        // H-01: aprobar tiene que cerrar también los checks obligatorios y
        // emitir la aserción — por el mismo camino que el veredicto automático.
        await this.checksService.settleManualApproval(tx, kase, actor);
      } else {
        kase.statusConceptId = IDA.CASE_REJECTED;
        kase.completedAt = now;
        touch(kase, actor.id);
      }

      await this.fraudRepo.resolveOpenForCase(
        tx,
        kase.id,
        IDA.FRAUD_OPEN,
        IDA.FRAUD_RESOLVED,
      );

      await tx.flush();
      return {
        id: review.id,
        status: review.statusConceptId,
        caseStatus: kase.statusConceptId,
      };
    });
  }
}
