import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ModerationRepository,
  PublicProfilesRepository,
} from '../repositories';
import {
  COMM,
  APPEAL_RESOLUTION_BY_CODE,
  REPORT_TARGET_CONCEPT_BY_CODE,
  REPORT_REASON_CONCEPT_BY_CODE,
  MODERATION_DECISION_BY_CODE,
  STRIKE_SEVERITY_BY_CODE,
} from '../community.concepts';
import {
  CreateReportDto,
  ModerationDecisionDto,
  CreateAppealDto,
  ResolveAppealDto,
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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param moderationRepo - Valor de moderation repo requerido por la operación.
   * @param profilesRepo - Perfiles públicos, para comprobar quién apela.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly moderationRepo: ModerationRepository,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityModerationService.name);
  }

  /**
   * Exige que el perfil que apela sea del actor.
   *
   * ## Por qué está acá y no en `CommunityVisibilityService`
   *
   * Porque este carril (P6) sale de `dev` en paralelo con P3, que es el que
   * lleva la versión compartida de esta regla (`assertActsAsProfile`). Meterla
   * allá desde acá sería escribir en el archivo de otro carril. **Al integrar
   * P3, esta comprobación se reemplaza por la compartida** — quedan los mismos
   * tres sujetos y el mismo criterio, así que el reemplazo es mecánico.
   *
   * No hay atajo de rol de plataforma, y es a propósito: revisar una apelación
   * ajena es trabajo de un moderador; **presentarla** en nombre de otro no lo es
   * de nadie.
   *
   * @param em - Transacción activa.
   * @param profileId - Perfil declarado como apelante.
   * @param actor - Quien pide la operación.
   * @throws ForbiddenException si ese perfil no es del actor.
   */
  private async assertApelanteEsDelActor(
    em: EntityManager,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const perfil = await this.profilesRepo.findById(em, profileId);
    const sujetos = actor.practitionerProfileId
      ? [actor.practitionerProfileId, actor.id]
      : [actor.id];
    if (
      perfil &&
      (sujetos.includes(perfil.targetId) || perfil.createdByUserId === actor.id)
    ) {
      return;
    }
    throw new ForbiddenException(
      'Sólo el titular del perfil sancionado puede apelar',
    );
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
      // El apelante no lo elige el cliente. Sin esta comprobación, cualquiera
      // podía abrir una apelación en nombre de otro — y como una decisión sólo
      // admite una apelación abierta a la vez, además le quemaba la suya al
      // sancionado, que después chocaba con un 409.
      await this.assertApelanteEsDelActor(tx, dto.appellantProfileId, actor);

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

  /**
   * UC-19-10, cierre: resuelve una apelación abierta.
   *
   * ## Lo que faltaba
   *
   * Se podía apelar y no había forma de cerrar la apelación. Toda apelación
   * quedaba abierta para siempre, y como apelar **re-encola** el contenido con
   * prioridad alta, esa entrada de cola tampoco tenía salida: la cola crecía con
   * trabajo que nadie podía terminar.
   *
   * ## Lo que se cierra y lo que no
   *
   * Se cierra la apelación y la entrada de cola que la apelación abrió. **No se
   * revierte la decisión original**: `OVERTURNED` deja constancia de que la
   * apelación prosperó, pero deshacer la sanción —restituir el contenido, anular
   * el strike— es una política de producto que nadie definió, y ejecutarla acá
   * sería inventarla. Queda registrada como decisión de producto pendiente en el
   * reporte del carril.
   *
   * @param appealId - Apelación a resolver.
   * @param dto - Resolución.
   * @param actor - Moderador que resuelve.
   * @returns El identificador de la apelación resuelta.
   * @throws ResourceNotFoundException si la apelación no existe.
   * @throws ConflictException si ya estaba resuelta.
   */
  async resolveAppeal(
    appealId: string,
    dto: ResolveAppealDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    this.logger.info(
      {
        operation: 'community.appeal.resolve',
        appealId,
        resolution: dto.resolution,
      },
      'Resolving appeal',
    );
    return this.em.transactional(async (tx) => {
      const appeal = await this.moderationRepo.findAppealById(tx, appealId);
      if (!appeal)
        throw new ResourceNotFoundException('Apelación no encontrada', {
          appealId,
        });
      if (appeal.statusConceptId !== COMM.APPEAL_OPEN) {
        throw new ConflictException('La apelación ya está resuelta', {
          appealId,
        });
      }

      const resolucion = APPEAL_RESOLUTION_BY_CODE[dto.resolution];
      appeal.statusConceptId = resolucion;
      appeal.resolutionConceptId = resolucion;
      appeal.reviewedByUserId = actor.id;
      appeal.resolvedAt = new Date();
      touch(appeal, actor.id);

      // Apelar re-encola el contenido con prioridad alta. Si esa entrada no se
      // cierra con la apelación, queda pidiendo para siempre una revisión que ya
      // se hizo — y la cola crece con trabajo que nadie puede terminar.
      const decision = await this.moderationRepo.findDecisionById(
        tx,
        appeal.moderationDecisionId,
      );
      const original = decision
        ? await this.moderationRepo.findQueueById(
            tx,
            decision.moderationQueueId,
          )
        : null;
      if (original) {
        const reencolada = await this.moderationRepo.findOpenQueueForContent(
          tx,
          original.contentRefId,
          COMM.QUEUE_RESOLVED,
        );
        if (reencolada) {
          reencolada.statusConceptId = COMM.QUEUE_RESOLVED;
          touch(reencolada, actor.id);
        }
      }

      await tx.flush();
      return { id: appeal.id };
    });
  }
}
