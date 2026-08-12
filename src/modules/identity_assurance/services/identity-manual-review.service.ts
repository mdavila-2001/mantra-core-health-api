import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';
import {
  IdentityManualReviewCasesRepository,
  IdentityVerificationCasesRepository,
  IdentityFraudSignalsRepository,
} from '../repositories';
import { ReviewDecisionDto, ReviewDecisionResponseDto } from '../dto';
import { IdentityChecksService } from './identity-checks.service';

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
   * @param casesRepo - Valor de cases repo requerido por la operación.
   * @param fraudRepo - Valor de fraud repo requerido por la operación.
   * @param checksService - Cierra los checks y emite la aserción al aprobar.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reviewRepo: IdentityManualReviewCasesRepository,
    private readonly casesRepo: IdentityVerificationCasesRepository,
    private readonly fraudRepo: IdentityFraudSignalsRepository,
    private readonly checksService: IdentityChecksService,
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
    return this.em.transactional(async (tx) => {
      const review = await this.reviewRepo.findById(tx, reviewId);
      if (!review)
        throw new ResourceNotFoundException('Revisión manual no encontrada', {
          reviewId,
        });
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

      const kase = await this.casesRepo.findById(
        tx,
        review.identityVerificationCaseId,
      );
      if (!kase) {
        throw new ResourceNotFoundException(
          'Caso de verificación no encontrado',
          {
            caseId: review.identityVerificationCaseId,
          },
        );
      }

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
