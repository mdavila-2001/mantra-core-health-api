import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConversionEvents } from '../entities';

/** Datos de un evento de conversión (UC-28-11). */
export interface CreateConversionData {
  /**
   * Identificador asociado a funnel definition.
   */
  funnelDefinitionId: string;
  /**
   * Identificador asociado a analytics subject.
   */
  analyticsSubjectId: string;
  /**
   * Identificador asociado a session journey.
   */
  sessionJourneyId?: string;
  /**
   * Identificador asociado a completion event.
   */
  completionEventId?: string;
  /**
   * Valor de converted at mantenido por la instancia.
   */
  convertedAt: Date;
  /**
   * Valor de attribution json mantenido por la instancia.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ConversionEvents`.
   */
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
