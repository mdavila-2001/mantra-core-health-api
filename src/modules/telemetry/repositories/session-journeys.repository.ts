import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SessionJourneys } from '../entities';

/** Datos de creación de un journey de sesión. */
export interface CreateSessionJourneyData {
  /**
   * Identificador asociado a session.
   */
  sessionId: string;
  /**
   * Identificador asociado a analytics subject.
   */
  analyticsSubjectId?: string;
  /**
   * Identificador asociado a portal type concept.
   */
  portalTypeConceptId: string;
  /**
   * Identificador asociado a journey status concept.
   */
  journeyStatusConceptId: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt?: Date;
  /**
   * Identificador asociado a entry event.
   */
  entryEventId?: string;
  /**
   * Valor de event count mantenido por la instancia.
   */
  eventCount?: number;
}

/** Acceso a `telemetry.session_journeys`. */
@Injectable()
export class SessionJourneysRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<SessionJourneys | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `SessionJourneys`.
   */
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
