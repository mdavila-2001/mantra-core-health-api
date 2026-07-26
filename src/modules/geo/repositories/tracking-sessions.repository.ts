import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TrackingSessions } from '../entities';
import { createdBy } from '../../../common';

/** Datos para iniciar una sesión de tracking. */
export interface CreateTrackingSessionData {
  trackedSubjectId: string;
  purposeConceptId?: string;
  relatedResourceType?: string;
  relatedResourceId?: string;
  statusConceptId: string;
  startedAt: Date;
  actorUserId?: string;
}

/**
 * Acceso a datos de `geo.tracking_sessions`. Stateless: recibe el
 * `EntityManager` activo en cada método.
 */
@Injectable()
export class TrackingSessionsRepository {
  /** Busca una sesión por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<TrackingSessions | null> {
    return em.findOne(TrackingSessions, { id });
  }

  /**
   * Sesión OPEN de un sujeto (evita sesiones concurrentes). `null` si no hay.
   */
  findOpenBySubject(
    em: EntityManager,
    trackedSubjectId: string,
    openStatusConceptId: string,
  ): Promise<TrackingSessions | null> {
    return em.findOne(TrackingSessions, {
      trackedSubjectId,
      statusConceptId: openStatusConceptId,
    });
  }

  /** Todas las sesiones OPEN de un sujeto (para cierre en cascada). */
  findAllOpenBySubject(
    em: EntityManager,
    trackedSubjectId: string,
    openStatusConceptId: string,
  ): Promise<TrackingSessions[]> {
    return em.find(TrackingSessions, {
      trackedSubjectId,
      statusConceptId: openStatusConceptId,
    });
  }

  /** Crea la sesión de tracking en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateTrackingSessionData): TrackingSessions {
    return em.create(
      TrackingSessions,
      {
        trackedSubjectId: data.trackedSubjectId,
        purposeConceptId: data.purposeConceptId,
        relatedResourceType: data.relatedResourceType,
        relatedResourceId: data.relatedResourceId,
        statusConceptId: data.statusConceptId,
        startedAt: data.startedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
