import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  TrackedSubjectsRepository,
  TrackingSessionsRepository,
  LocationPingsRepository,
} from '../repositories';
import {
  CreateTrackedSubjectDto,
  TrackedSubjectResponseDto,
  IngestPingsDto,
  IngestPingsResultDto,
  LastPositionResponseDto,
  StatusResultDto,
} from '../dto';
import {
  GEO,
  SUBJECT_TYPE_CONCEPT_BY_CODE,
  NETWORK_CONCEPT_BY_CODE,
} from '../geo.concepts';

/** Convierte un número opcional a la representación `numeric` (string) del ORM. */
const num = (v?: number): string | undefined =>
  v === undefined || v === null ? undefined : String(v);

/**
 * Casos de uso sobre `geo.tracked_subjects`: alta con consentimiento (UC-13-01),
 * ingesta de pings de alta frecuencia (UC-13-03), última posición (UC-13-09) y
 * revocación de consentimiento con pausa de rastreo (UC-13-10).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de crear hijos (las FK son columnas uuid; MikroORM no ordena
 * inserts entre entidades no relacionadas).
 */
@Injectable()
export class GeoTrackedSubjectsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param subjectsRepo - Valor de subjects repo requerido por la operación.
   * @param sessionsRepo - Valor de sessions repo requerido por la operación.
   * @param pingsRepo - Valor de pings repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly subjectsRepo: TrackedSubjectsRepository,
    private readonly sessionsRepo: TrackingSessionsRepository,
    private readonly pingsRepo: LocationPingsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GeoTrackedSubjectsService.name);
  }

  /** UC-13-01: da de alta un sujeto rastreado en estado ACTIVE. */
  async enroll(
    dto: CreateTrackedSubjectDto,
    actor: AuthenticatedUser,
  ): Promise<TrackedSubjectResponseDto> {
    this.logger.info(
      { operation: 'geo.subject.enroll', actorId: actor.id },
      'Enrolling tracked subject',
    );
    return this.em.transactional(async (tx) => {
      const subjectTypeConceptId =
        SUBJECT_TYPE_CONCEPT_BY_CODE[dto.subjectType ?? 'PERSON'];

      const clash = await this.subjectsRepo.findActiveBySubject(
        tx,
        subjectTypeConceptId,
        dto.subjectId,
        GEO.SUBJECT_ACTIVE,
        dto.tenantId,
      );
      if (clash) {
        this.logger.warn(
          { operation: 'geo.subject.enroll', reason: 'already-tracked' },
          'Rejected enrollment: subject already tracked',
        );
        throw new ConflictException('El sujeto ya está siendo rastreado', {
          subjectId: dto.subjectId,
        });
      }

      const subject = this.subjectsRepo.create(tx, {
        subjectTypeConceptId,
        subjectId: dto.subjectId,
        deviceId: dto.deviceId,
        tenantId: dto.tenantId,
        stateConceptId: GEO.SUBJECT_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'geo.subject.enroll', subjectId: subject.id },
        'Tracked subject enrolled',
      );
      return {
        id: subject.id,
        subjectId: subject.subjectId,
        subjectType: subject.subjectTypeConceptId,
        state: subject.stateConceptId,
        createdAt: subject.createdAt,
      };
    });
  }

  /** UC-13-03: ingiere un batch de pings append-only para el sujeto. */
  async ingestPings(
    trackedSubjectId: string,
    dto: IngestPingsDto,
    actor: AuthenticatedUser,
  ): Promise<IngestPingsResultDto> {
    this.logger.info(
      {
        operation: 'geo.subject.pings',
        trackedSubjectId,
        count: dto.pings.length,
      },
      'Ingesting location pings',
    );
    return this.em.transactional(async (tx) => {
      const subject = await this.subjectsRepo.findById(tx, trackedSubjectId);
      if (!subject)
        throw new ResourceNotFoundException('Sujeto rastreado no encontrado', {
          trackedSubjectId,
        });

      // Tras una revocación de consentimiento el sujeto queda SUSPENDED: rechaza ingesta.
      if (subject.stateConceptId !== GEO.SUBJECT_ACTIVE) {
        throw new PreconditionFailedException(
          'El sujeto no está activo para rastreo',
          {
            trackedSubjectId,
          },
        );
      }

      const openSession = await this.sessionsRepo.findOpenBySubject(
        tx,
        trackedSubjectId,
        GEO.SESSION_OPEN,
      );
      if (!openSession) {
        throw new PreconditionFailedException(
          'No hay una sesión de tracking abierta para el sujeto',
          {
            trackedSubjectId,
          },
        );
      }

      for (const p of dto.pings) {
        this.pingsRepo.record(tx, {
          trackedSubjectId,
          deviceId: p.deviceId ?? subject.deviceId,
          latitude: String(p.latitude),
          longitude: String(p.longitude),
          accuracyM: num(p.accuracyM),
          altitudeM: num(p.altitudeM),
          speedMps: num(p.speedMps),
          headingDeg: num(p.headingDeg),
          batteryPct: p.batteryPct,
          networkConceptId: p.network
            ? NETWORK_CONCEPT_BY_CODE[p.network]
            : undefined,
          capturedAt: p.capturedAt,
          recordedByUserId: actor.id,
        });
      }

      return { recorded: dto.pings.length };
    });
  }

  /** UC-13-09: última posición conocida del sujeto (lectura). */
  async lastPosition(
    trackedSubjectId: string,
  ): Promise<LastPositionResponseDto> {
    this.logger.info(
      { operation: 'geo.subject.last-position', trackedSubjectId },
      'Reading last known position',
    );
    const em = this.em.fork();

    const subject = await this.subjectsRepo.findById(em, trackedSubjectId);
    if (!subject)
      throw new ResourceNotFoundException('Sujeto rastreado no encontrado', {
        trackedSubjectId,
      });

    const ping = await this.pingsRepo.findLastBySubject(em, trackedSubjectId);
    if (!ping) {
      throw new ResourceNotFoundException(
        'El sujeto no tiene posiciones registradas',
        { trackedSubjectId },
      );
    }

    return {
      pingId: ping.id,
      trackedSubjectId,
      latitude: ping.latitude,
      longitude: ping.longitude,
      accuracyM: ping.accuracyM,
      capturedAt: ping.capturedAt,
      recordedAt: ping.recordedAt,
    };
  }

  /** UC-13-10: revoca consentimiento, suspende el sujeto y cierra sus sesiones OPEN. */
  async revokeConsent(
    trackedSubjectId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      {
        operation: 'geo.subject.revoke-consent',
        trackedSubjectId,
        actorId: actor.id,
      },
      'Revoking location consent',
    );
    return this.em.transactional(async (tx) => {
      const subject = await this.subjectsRepo.findById(tx, trackedSubjectId);
      if (!subject)
        throw new ResourceNotFoundException('Sujeto rastreado no encontrado', {
          trackedSubjectId,
        });

      if (subject.stateConceptId === GEO.SUBJECT_SUSPENDED) {
        throw new PreconditionFailedException(
          'El rastreo del sujeto ya está suspendido',
          {
            trackedSubjectId,
          },
        );
      }

      subject.stateConceptId = GEO.SUBJECT_SUSPENDED;
      touch(subject, actor.id);

      // Cierra en cascada las sesiones OPEN (UC-13-08 embebido).
      const openSessions = await this.sessionsRepo.findAllOpenBySubject(
        tx,
        trackedSubjectId,
        GEO.SESSION_OPEN,
      );
      const now = new Date();
      for (const session of openSessions) {
        session.statusConceptId = GEO.SESSION_CLOSED;
        session.endedAt = now;
        touch(session, actor.id, now);
      }

      this.logger.info(
        {
          operation: 'geo.subject.revoke-consent',
          trackedSubjectId,
          closedSessions: openSessions.length,
        },
        'Location consent revoked and tracking paused',
      );
      return { ok: true };
    });
  }
}
