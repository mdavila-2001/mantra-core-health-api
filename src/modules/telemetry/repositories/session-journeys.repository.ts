import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SessionJourneys } from '../entities';

/** Datos de creación de un journey de sesión. */
export interface CreateSessionJourneyData {
  sessionId: string;
  analyticsSubjectId?: string;
  portalTypeConceptId: string;
  journeyStatusConceptId: string;
  startedAt?: Date;
  entryEventId?: string;
  eventCount?: number;
}

/** Acceso a `telemetry.session_journeys`. */
@Injectable()
export class SessionJourneysRepository {
  findById(em: EntityManager, id: string): Promise<SessionJourneys | null> {
    return em.findOne(SessionJourneys, { id });
  }

  /** Journey no cerrado (sin ended_at) para una sesión. */
  findOpenBySession(
    em: EntityManager,
    sessionId: string,
  ): Promise<SessionJourneys | null> {
    return em.findOne(
      SessionJourneys,
      { sessionId, endedAt: null },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  create(em: EntityManager, data: CreateSessionJourneyData): SessionJourneys {
    const now = new Date();
    return em.create(
      SessionJourneys,
      {
        sessionId: data.sessionId,
        analyticsSubjectId: data.analyticsSubjectId,
        portalTypeConceptId: data.portalTypeConceptId,
        journeyStatusConceptId: data.journeyStatusConceptId,
        startedAt: data.startedAt ?? now,
        entryEventId: data.entryEventId,
        eventCount: data.eventCount ?? 0,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
  }
}
