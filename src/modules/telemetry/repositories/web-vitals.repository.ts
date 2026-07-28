import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { WebVitals } from '../entities';

/** Datos de una métrica Core Web Vital (UC-28-09, append-only). */
export interface CreateWebVitalData {
  /**
   * Identificador asociado a user activity event.
   */
  userActivityEventId?: string;
  /**
   * Identificador asociado a session journey.
   */
  sessionJourneyId?: string;
  /**
   * Identificador asociado a analytics subject.
   */
  analyticsSubjectId?: string;
  /**
   * Identificador asociado a client context.
   */
  clientContextId?: string;
  /**
   * Identificador asociado a portal type concept.
   */
  portalTypeConceptId: string;
  /**
   * Valor de route template mantenido por la instancia.
   */
  routeTemplate?: string;
  /**
   * Identificador asociado a metric concept.
   */
  metricConceptId: string;
  /**
   * Valor de metric value mantenido por la instancia.
   */
  metricValue?: string;
  /**
   * Identificador asociado a rating concept.
   */
  ratingConceptId?: string;
  /**
   * Identificador asociado a navigation type concept.
   */
  navigationTypeConceptId?: string;
  /**
   * Valor de measured at mantenido por la instancia.
   */
  measuredAt?: Date;
}

/** Acceso a `telemetry.web_vitals`. */
@Injectable()
export class WebVitalsRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `WebVitals`.
   */
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
