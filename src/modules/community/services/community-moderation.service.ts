import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ModerationRepository } from '../repositories';
import {
  COMM,
  REPORT_TARGET_CONCEPT_BY_CODE,
  REPORT_REASON_CONCEPT_BY_CODE,
  MODERATION_DECISION_BY_CODE,
  STRIKE_SEVERITY_BY_CODE,
} from '../community.concepts';
import {
  CreateReportDto,
  ModerationDecisionDto,
  CreateAppealDto,
  ReportResponseDto,
  ModerationDecisionResponseDto,
  IdResponseDto,
} from '../dto';

/** Tipo de contenido para la cola de moderación derivado del target del reporte. */
const CONTENT_TYPE_BY_TARGET: Record<string, string> = {
  POST: COMM.CONTENT_TYPE_POST,
  COMMENT: COMM.CONTENT_TYPE_COMMENT,
  PROFILE: COMM.CONTENT_TYPE_PROFILE,
  MESSAGE: COMM.CONTENT_TYPE_MESSAGE,
  REVIEW: COMM.CONTENT_TYPE_REVIEW,
};

/**
 * Confianza y seguridad: reporte de contenido con encolado (UC-19-08), resolución
 * de moderación con decisión y strike (UC-19-09) y apelación (UC-19-10).
 */
@Injectable()
export class CommunityModerationService {
  constructor(
    private readonly em: EntityManager,
    private readonly moderationRepo: ModerationRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityModerationService.name);
  }

  /** UC-19-08: reporta contenido y lo encola (dedup por contenido en cola abierta). */
  async report(
    dto: CreateReportDto,
    actor: AuthenticatedUser,
  ): Promise<ReportResponseDto> {
    this.logger.info(
      { operation: 'community.report.create', targetId: dto.targetId },
      'Reporting content',
    );
    return this.em.transactional(async (tx) => {
      const report = this.moderationRepo.createReport(tx, {
        reporterUserId: actor.id,
        targetTypeConceptId: REPORT_TARGET_CONCEPT_BY_CODE[dto.targetType],
        targetId: dto.targetId,
        reasonConceptId: REPORT_REASON_CONCEPT_BY_CODE[dto.reason],
        detailText: dto.detailText,
        statusConceptId: COMM.REPORT_OPEN,
      });
      await tx.flush();

      // Dedup: reutiliza la entrada de cola abierta del mismo contenido si existe.
      let queue = await this.moderationRepo.findOpenQueueForContent(
        tx,
        dto.targetId,
        COMM.QUEUE_RESOLVED,
      );
      if (!queue) {
        queue = this.moderationRepo.createQueue(tx, {
          contentTypeConceptId: CONTENT_TYPE_BY_TARGET[dto.targetType],
          contentRefId: dto.targetId,
          sourceConceptId: COMM.QUEUE_SOURCE_USER_REPORT,
          contentReportId: report.id,
          priorityConceptId: COMM.QUEUE_PRIORITY_NORMAL,
          statusConceptId: COMM.QUEUE_QUEUED,
          actorUserId: actor.id,
        });
        await tx.flush();
      }

      return { id: report.id, moderationQueueId: queue.id };
    });
  }

  /** UC-19-09: resuelve la moderación (decisión + strike opcional). */
  async decide(
    queueId: string,
    dto: ModerationDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<ModerationDecisionResponseDto> {
    this.logger.info(
      {
        operation: 'community.moderation.decide',
        queueId,
        decision: dto.decision,
      },
      'Resolving moderation',
    );
    return this.em.transactional(async (tx) => {
      const queue = await this.moderationRepo.findQueueById(tx, queueId);
      if (!queue)
        throw new ResourceNotFoundException('Entrada de cola no encontrada', {
          queueId,
        });
      if (queue.statusConceptId === COMM.QUEUE_RESOLVED) {
        throw new ConflictException('La entrada de cola ya está resuelta', {
          queueId,
        });
      }

      const map = MODERATION_DECISION_BY_CODE[dto.decision];
      const decision = this.moderationRepo.createDecision(tx, {
        moderationQueueId: queueId,
        decisionConceptId: map.decision,
        policyConceptId: COMM.POLICY_COMMUNITY_GUIDELINES,
        rationaleText: dto.rationaleText,
        actionTakenConceptId: map.action,
        decidedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Cierra la cola y todos los reportes ligados al contenido.
      queue.statusConceptId = COMM.QUEUE_RESOLVED;
      touch(queue, actor.id);
      const reports = await this.moderationRepo.findReportsByTarget(
        tx,
        queue.contentRefId,
      );
      const now = new Date();
      for (const r of reports) {
        r.statusConceptId = COMM.REPORT_RESOLVED;
        r.resolvedAt = now;
        r.updatedAt = now;
      }

      // Emite strike si la decisión sanciona y se indicó sujeto + severidad.
      let strikeId: string | null = null;
      if (
        dto.subjectProfileId &&
        dto.strikeSeverity &&
        dto.decision !== 'DISMISSED'
      ) {
        const severity = STRIKE_SEVERITY_BY_CODE[dto.strikeSeverity];
        const strike = this.moderationRepo.createStrike(tx, {
          subjectProfileId: dto.subjectProfileId,
          moderationDecisionId: decision.id,
          severityConceptId: severity.concept,
          points: severity.points,
          statusConceptId: COMM.STRIKE_ACTIVE,
          actorUserId: actor.id,
        });
        await tx.flush();
        strikeId = strike.id;
      }

      return { id: decision.id, strikeId, decision: dto.decision };
    });
  }

  /** UC-19-10: apela una decisión de moderación (una apelación abierta por decisión). */
  async appeal(
    decisionId: string,
    dto: CreateAppealDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.em.transactional(async (tx) => {
      const decision = await this.moderationRepo.findDecisionById(
        tx,
        decisionId,
      );
      if (!decision)
        throw new ResourceNotFoundException('Decisión no encontrada', {
          decisionId,
        });

      const open = await this.moderationRepo.findOpenAppealForDecision(
        tx,
        decisionId,
        COMM.APPEAL_OPEN,
      );
      if (open)
        throw new ConflictException(
          'Ya existe una apelación abierta para esta decisión',
          { decisionId },
        );

      const appeal = this.moderationRepo.createAppeal(tx, {
        moderationDecisionId: decisionId,
        appellantProfileId: dto.appellantProfileId,
        reasonText: dto.reasonText,
        statusConceptId: COMM.APPEAL_OPEN,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Re-encola el contenido para re-revisión (source=appeal).
      const queue = await this.moderationRepo.findQueueById(
        tx,
        decision.moderationQueueId,
      );
      if (queue) {
        this.moderationRepo.createQueue(tx, {
          contentTypeConceptId: queue.contentTypeConceptId,
          contentRefId: queue.contentRefId,
          sourceConceptId: COMM.QUEUE_SOURCE_APPEAL,
          priorityConceptId: COMM.QUEUE_PRIORITY_HIGH,
          statusConceptId: COMM.QUEUE_QUEUED,
          actorUserId: actor.id,
        });
        await tx.flush();
      }

      return { id: appeal.id };
    });
  }
}
