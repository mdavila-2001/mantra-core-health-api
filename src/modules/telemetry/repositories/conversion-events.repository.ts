import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConversionEvents } from '../entities';

/** Datos de un evento de conversión (UC-28-11). */
export interface CreateConversionData {
  funnelDefinitionId: string;
  analyticsSubjectId: string;
  sessionJourneyId?: string;
  completionEventId?: string;
  convertedAt: Date;
  attributionJson?: unknown;
}

/** Acceso a `telemetry.conversion_events`. */
@Injectable()
export class ConversionEventsRepository {
  /** Idempotencia por (funnel, subject, journey) para evitar doble conversión. */
  findExisting(
    em: EntityManager,
    funnelDefinitionId: string,
    analyticsSubjectId: string,
    sessionJourneyId?: string,
  ): Promise<ConversionEvents | null> {
    return em.findOne(ConversionEvents, {
      funnelDefinitionId,
      analyticsSubjectId,
      sessionJourneyId: sessionJourneyId ?? null,
    });
  }

  create(em: EntityManager, data: CreateConversionData): ConversionEvents {
    return em.create(
      ConversionEvents,
      {
        funnelDefinitionId: data.funnelDefinitionId,
        analyticsSubjectId: data.analyticsSubjectId,
        sessionJourneyId: data.sessionJourneyId,
        completionEventId: data.completionEventId,
        convertedAt: data.convertedAt,
        attributionJson: data.attributionJson,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
