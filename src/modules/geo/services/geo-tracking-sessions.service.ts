import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  TrackingSessionsRepository,
  TrackedSubjectsRepository,
  TripsRepository,
} from '../repositories';
import { StartTrackingSessionDto, TrackingSessionResponseDto } from '../dto';
import { GEO } from '../geo.concepts';
import { assertSubjectInTenant } from '../geo-scope';
import { GeoErrorReason } from '../geo.error-reasons';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';

/**
 * Casos de uso sobre `geo.tracking_sessions`: iniciar sesión (UC-13-02) y
 * cerrarla (UC-13-08). El servicio controla la transacción; hace `flush` del
 * padre antes de crear hijos y marca `updated_at` en el sujeto asociado.
 */
@Injectable()
export class GeoTrackingSessionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param sessionsRepo - Valor de sessions repo requerido por la operación.
   * @param subjectsRepo - Valor de subjects repo requerido por la operación.
   * @param tripsRepo - Valor de trips repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly sessionsRepo: TrackingSessionsRepository,
    private readonly subjectsRepo: TrackedSubjectsRepository,
    private readonly tripsRepo: TripsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GeoTrackingSessionsService.name);
  }

  /** UC-13-02: inicia una sesión OPEN para un sujeto ACTIVE sin sesión previa abierta. */
  async start(
    dto: StartTrackingSessionDto,
    actor: AuthenticatedUser,
  ): Promise<TrackingSessionResponseDto> {
    this.logger.info(
      {
        operation: 'geo.session.start',
        trackedSubjectId: dto.trackedSubjectId,
        actorId: actor.id,
      },
      'Starting tracking session',
    );
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const subject = assertSubjectInTenant(
        await this.subjectsRepo.findById(tx, dto.trackedSubjectId),
        tenantId,
      );
      if (subject.stateConceptId !== GEO.SUBJECT_ACTIVE) {
        throw new PreconditionFailedException(
          'El sujeto no está activo para rastreo',
          {
            trackedSubjectId: dto.trackedSubjectId,
          },
        );
      }

      const open = await this.sessionsRepo.findOpenBySubject(
        tx,
        dto.trackedSubjectId,
        GEO.SESSION_OPEN,
      );
      if (open) {
        throw new ConflictException(
          'El sujeto ya tiene una sesión de tracking abierta',
          {
            trackedSubjectId: dto.trackedSubjectId,
          },
        );
      }

      const now = new Date();
      const session = this.sessionsRepo.create(tx, {
        trackedSubjectId: dto.trackedSubjectId,
        purposeConceptId: dto.purposeConceptId,
        relatedResourceType: dto.relatedResourceType,
        relatedResourceId: dto.relatedResourceId,
        statusConceptId: GEO.SESSION_OPEN,
        startedAt: now,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Marca el sujeto en-seguimiento.
      touch(subject, actor.id, now);

      this.logger.info(
        { operation: 'geo.session.start', sessionId: session.id },
        'Tracking session started',
      );
      return {
        id: session.id,
        trackedSubjectId: session.trackedSubjectId,
        status: session.statusConceptId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      };
    });
  }

  /** UC-13-08: cierra una sesión OPEN, siempre que no tenga viajes IN_PROGRESS. */
  async close(
    sessionId: string,
    actor: AuthenticatedUser,
  ): Promise<TrackingSessionResponseDto> {
    this.logger.info(
      { operation: 'geo.session.close', sessionId, actorId: actor.id },
      'Closing tracking session',
    );
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      // La sesión no lleva tenant propio: lo hereda del sujeto rastreado.
      const found = await this.sessionsRepo.findById(tx, sessionId);
      const subject = found
        ? await this.subjectsRepo.findById(tx, found.trackedSubjectId)
        : null;
      const session = assertResourceInTenant(
        found,
        subject?.tenantId,
        tenantId,
        {
          message: 'Sesión de tracking no encontrada',
          reason: GeoErrorReason.TRACKING_SESSION_NOT_AVAILABLE,
        },
      );

      if (session.statusConceptId !== GEO.SESSION_OPEN) {
        throw new PreconditionFailedException('La sesión no está abierta', {
          sessionId,
        });
      }

      const inProgress = await this.tripsRepo.countBySessionAndStatus(
        tx,
        sessionId,
        GEO.TRIP_IN_PROGRESS,
      );
      if (inProgress > 0) {
        throw new PreconditionFailedException(
          'La sesión tiene viajes en progreso',
          { sessionId },
        );
      }

      const now = new Date();
      session.statusConceptId = GEO.SESSION_CLOSED;
      session.endedAt = now;
      touch(session, actor.id, now);

      // Libera el estado en-seguimiento del sujeto.
      if (subject) touch(subject, actor.id, now);

      this.logger.info(
        { operation: 'geo.session.close', sessionId },
        'Tracking session closed',
      );
      return {
        id: session.id,
        trackedSubjectId: session.trackedSubjectId,
        status: session.statusConceptId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      };
    });
  }
}
