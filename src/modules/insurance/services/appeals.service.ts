import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { DisputeRepository } from '../repositories';
import { INS } from '../insurance.concepts';
import { CreateAppealDecisionDto, CreatedResourceDto } from '../dto';

/**
 * UC-26-12: emitir decisión de apelación inmutable. Cada `decision_version`
 * supersede la anterior (append-only) y la disputa transiciona OPEN/IN_REVIEW →
 * RESOLVED.
 */
@Injectable()
export class AppealsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: DisputeRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AppealsService.name);
  }

  async decide(
    disputeId: string,
    dto: CreateAppealDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    this.logger.info(
      { operation: 'insurance.appeal.decide', disputeId, actorId: actor.id },
      'Deciding appeal',
    );
    return this.em.transactional(async (tx) => {
      const dispute = await this.repo.findDispute(tx, disputeId);
      if (!dispute)
        throw new ResourceNotFoundException('Disputa no encontrada', {
          disputeId,
        });
      if (
        ![INS.DISPUTE_OPEN, INS.DISPUTE_IN_REVIEW].includes(
          dispute.statusConceptId,
        )
      ) {
        throw new PreconditionFailedException(
          'La disputa no admite decisión en su estado actual',
          { disputeId },
        );
      }

      const previous = await this.repo.latestDecision(tx, disputeId);
      const nextVersion = (previous?.decisionVersion ?? 0) + 1;
      const decision = this.repo.createAppealDecision(tx, {
        claimDisputeId: disputeId,
        appealLevelConceptId: INS.APPEAL_LEVEL_FIRST,
        decisionVersion: nextVersion,
        decisionConceptId:
          dto.decision === 'UPHELD'
            ? INS.APPEAL_DECISION_UPHELD
            : INS.APPEAL_DECISION_OVERTURNED,
        adjustedAmount: dto.adjustedAmount,
        rationaleText: dto.rationaleText,
        supersedesDecisionId: previous?.id,
        actorUserId: actor.id,
      });

      dispute.statusConceptId = INS.DISPUTE_RESOLVED;
      touch(dispute, actor.id);
      await tx.flush();

      return { id: decision.id };
    });
  }
}
