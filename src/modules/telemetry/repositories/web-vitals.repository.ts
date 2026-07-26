import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { WebVitals } from '../entities';

/** Datos de una métrica Core Web Vital (UC-28-09, append-only). */
export interface CreateWebVitalData {
  userActivityEventId?: string;
  sessionJourneyId?: string;
  analyticsSubjectId?: string;
  clientContextId?: string;
  portalTypeConceptId: string;
  routeTemplate?: string;
  metricConceptId: string;
  metricValue?: string;
  ratingConceptId?: string;
  navigationTypeConceptId?: string;
  measuredAt?: Date;
}

/** Acceso a `telemetry.web_vitals`. */
@Injectable()
export class WebVitalsRepository {
  create(em: EntityManager, data: CreateWebVitalData): WebVitals {
    return em.create(
      WebVitals,
      {
        userActivityEventId: data.userActivityEventId,
        sessionJourneyId: data.sessionJourneyId,
        analyticsSubjectId: data.analyticsSubjectId,
        clientContextId: data.clientContextId,
        portalTypeConceptId: data.portalTypeConceptId,
        routeTemplate: data.routeTemplate,
        metricConceptId: data.metricConceptId,
        metricValue: data.metricValue,
        ratingConceptId: data.ratingConceptId,
        navigationTypeConceptId: data.navigationTypeConceptId,
        measuredAt: data.measuredAt ?? new Date(),
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
