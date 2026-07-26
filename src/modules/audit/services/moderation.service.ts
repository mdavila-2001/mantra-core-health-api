import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import {
  ModerationRepository,
  AnalyticsGovernanceLogRepository,
  AuditLogRepository,
} from '../repositories';
import { AUD } from '../audit.concepts';
import { CreateModerationDecisionDto, ModerationDecisionResultDto } from '../dto';

const TARGET_TYPE: Record<string, string> = {
  CONTENT: AUD.MOD_TARGET_CONTENT,
  USER: AUD.MOD_TARGET_USER,
  COMMENT: AUD.MOD_TARGET_COMMENT,
  REVIEW: AUD.MOD_TARGET_REVIEW,
};
const ACTION: Record<string, string> = {
  REMOVE: AUD.MOD_ACTION_REMOVE,
  FLAG: AUD.MOD_ACTION_FLAG,
  APPROVE: AUD.MOD_ACTION_APPROVE,
  RESTRICT: AUD.MOD_ACTION_RESTRICT,
  DISMISS: AUD.MOD_ACTION_DISMISS,
};
const REASON: Record<string, string> = {
  POLICY: AUD.MOD_REASON_POLICY,
  ABUSE: AUD.MOD_REASON_ABUSE,
  SPAM: AUD.MOD_REASON_SPAM,
  LEGAL: AUD.MOD_REASON_LEGAL,
};

/**
 * UC-10-11: registra una decisión de moderación / gobernanza analítica. El evento
 * es WORM (`moderation_events`); si la decisión implica gobernanza de datos se
 * añade una fila en `analytics_governance_log`, y siempre se sella provenance en
 * `audit_log`. El versionado en `moderation_decisions_history` solo se escribe si
 * el cliente aporta un `moderationDecisionId` REAL (FK NOT NULL a community).
 */
@Injectable()
export class ModerationService {
  constructor(
    private readonly em: EntityManager,
    private readonly moderationRepo: ModerationRepository,
    private readonly governanceRepo: AnalyticsGovernanceLogRepository,
    private readonly auditLogRepo: AuditLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ModerationService.name);
  }

  async recordDecision(
    dto: CreateModerationDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<ModerationDecisionResultDto> {
    this.logger.info(
      { operation: 'audit.moderation.record', actorId: actor.id, action: dto.action },
      'Recording moderation decision',
    );
    return this.em.transactional(async (tx) => {
      const event = this.moderationRepo.record(tx, {
        targetTypeConceptId: TARGET_TYPE[dto.targetType],
        targetId: dto.targetId,
        actionConceptId: ACTION[dto.action],
        reasonConceptId: dto.reason ? REASON[dto.reason] : undefined,
        policyVersion: dto.policyVersion,
        evidenceJson: dto.evidence,
        recordedByUserId: actor.id,
      });

      if (dto.governance) {
        this.governanceRepo.record(tx, {
          actorUserId: actor.id,
          actionConceptId: AUD.GOVERNANCE_DISCLOSURE,
          approvalStatusConceptId: AUD.APPROVAL_APPROVED,
          exportReference: `moderation-${event.id}`,
        });
      }

      let historyRecorded = false;
      if (dto.moderationDecisionId) {
        this.moderationRepo.recordHistory(tx, {
          moderationDecisionsId: dto.moderationDecisionId,
          operationConceptId: AUD.OPERATION_INSERT,
          dataSnapshot: {
            targetType: dto.targetType,
            targetId: dto.targetId,
            action: dto.action,
            reason: dto.reason,
            policyVersion: dto.policyVersion,
          },
          changedByUserId: actor.id,
        });
        historyRecorded = true;
      }

      const audit = await this.auditLogRepo.append(tx, {
        userId: actor.id,
        action: 'MODERATION_DECISION',
        entity: 'moderation_events',
        entityId: event.id,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        recordedByUserId: actor.id,
      });

      return {
        id: event.id,
        auditLogId: audit.id,
        historyRecorded,
        recordedAt: event.recordedAt,
      };
    });
  }
}
