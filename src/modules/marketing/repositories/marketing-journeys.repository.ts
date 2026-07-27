import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Journeys,
  JourneySteps,
  JourneyEnrollments,
  TrackedLinks,
  MarketingTouchpoints,
  AttributionTouches,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateJourneyData {
  tenantId: string;
  code: string;
  name: string;
  entryTriggerConceptId: string;
  entrySegmentId?: string;
  goalMetricConceptId?: string;
  definitionJson?: unknown;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateJourneyStepData {
  journeyId: string;
  stepCode: string;
  stepTypeConceptId: string;
  channelConceptId?: string;
  contentTemplateId?: string;
  waitDurationMinutes?: number;
  conditionJson?: unknown;
  ordinal: number;
  actorUserId?: string;
}

export interface CreateEnrollmentData {
  journeyId: string;
  memberTypeConceptId: string;
  memberRefId: string;
  currentStepId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateTrackedLinkData {
  campaignId?: string;
  code: string;
  targetUrl: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateTouchpointData {
  campaignId?: string;
  journeyId?: string;
  trackedLinkId?: string;
  memberTypeConceptId: string;
  memberRefId: string;
  touchTypeConceptId: string;
  channelConceptId: string;
  contentTemplateId?: string;
  metadataJson?: unknown;
  occurredAt?: Date;
  recordedByUserId?: string;
}

export interface CreateAttributionTouchData {
  conversionRefType: string;
  conversionRefId: string;
  marketingTouchpointId: string;
  attributionModelConceptId: string;
  weight: string;
  attributedValue?: string;
  currencyConceptId?: string;
  positionConceptId?: string;
  actorUserId?: string;
}

/**
 * Acceso a `marketing.journeys`, `journey_steps`, `journey_enrollments`,
 * `tracked_links`, `marketing_touchpoints` y `attribution_touches`.
 */
@Injectable()
export class MarketingJourneysRepository {
  // --- Journeys y pasos (UC-50-06, UC-50-07) ---

  createJourney(em: EntityManager, data: CreateJourneyData): Journeys {
    return em.create(
      Journeys,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        entryTriggerConceptId: data.entryTriggerConceptId,
        entrySegmentId: data.entrySegmentId,
        goalMetricConceptId: data.goalMetricConceptId,
        definitionJson: data.definitionJson,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findJourneyById(em: EntityManager, id: string): Promise<Journeys | null> {
    return em.findOne(Journeys, { id });
  }

  findJourneyForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Journeys | null> {
    return em.findOne(
      Journeys,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findJourneyByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<Journeys | null> {
    return em.findOne(Journeys, { tenantId, code });
  }

  createJourneyStep(
    em: EntityManager,
    data: CreateJourneyStepData,
  ): JourneySteps {
    return em.create(
      JourneySteps,
      {
        journeyId: data.journeyId,
        stepCode: data.stepCode,
        stepTypeConceptId: data.stepTypeConceptId,
        channelConceptId: data.channelConceptId,
        contentTemplateId: data.contentTemplateId,
        waitDurationMinutes: data.waitDurationMinutes,
        conditionJson: data.conditionJson,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Pasos del journey en orden de ejecución: el primero es el punto de entrada. */
  findStepsByJourney(
    em: EntityManager,
    journeyId: string,
  ): Promise<JourneySteps[]> {
    return em.find(
      JourneySteps,
      { journeyId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  findStepById(em: EntityManager, id: string): Promise<JourneySteps | null> {
    return em.findOne(JourneySteps, { id });
  }

  /** Último ordinal usado, para encadenar pasos añadidos en llamadas sucesivas. */
  findLastStep(
    em: EntityManager,
    journeyId: string,
  ): Promise<JourneySteps | null> {
    return em.findOne(
      JourneySteps,
      { journeyId },
      { orderBy: { ordinal: 'DESC' } },
    );
  }

  // --- Inscripciones (UC-50-07, UC-50-08, UC-50-09) ---

  createEnrollment(
    em: EntityManager,
    data: CreateEnrollmentData,
  ): JourneyEnrollments {
    return em.create(
      JourneyEnrollments,
      {
        journeyId: data.journeyId,
        memberTypeConceptId: data.memberTypeConceptId,
        memberRefId: data.memberRefId,
        currentStepId: data.currentStepId,
        enteredAt: new Date(),
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Inscripción activa del miembro en el journey. Refleja la UNIQUE parcial
   * `WHERE status = active`: la doble inscripción se rechaza antes de llegar a ella.
   */
  findActiveEnrollment(
    em: EntityManager,
    journeyId: string,
    memberTypeConceptId: string,
    memberRefId: string,
    activeStatusConceptId: string,
  ): Promise<JourneyEnrollments | null> {
    return em.findOne(JourneyEnrollments, {
      journeyId,
      memberTypeConceptId,
      memberRefId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /**
   * `FOR UPDATE SKIP LOCKED`: varios orquestadores avanzan inscripciones en
   * paralelo y ninguno debe esperar a la que otro ya está procesando.
   */
  findEnrollmentForUpdateSkipLocked(
    em: EntityManager,
    id: string,
  ): Promise<JourneyEnrollments | null> {
    return em.findOne(
      JourneyEnrollments,
      { id },
      { lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE },
    );
  }

  findEnrollmentForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<JourneyEnrollments | null> {
    return em.findOne(
      JourneyEnrollments,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Enlaces rastreables (UC-50-10) ---

  createTrackedLink(
    em: EntityManager,
    data: CreateTrackedLinkData,
  ): TrackedLinks {
    return em.create(
      TrackedLinks,
      {
        campaignId: data.campaignId,
        code: data.code,
        targetUrl: data.targetUrl,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmContent: data.utmContent,
        // bigint: el contador viaja como cadena decimal.
        clickCount: '0',
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findTrackedLinkByCode(
    em: EntityManager,
    code: string,
  ): Promise<TrackedLinks | null> {
    return em.findOne(TrackedLinks, { code });
  }

  /** El contador de clicks se incrementa bajo bloqueo para no perder eventos concurrentes. */
  findTrackedLinkByCodeForUpdate(
    em: EntityManager,
    code: string,
  ): Promise<TrackedLinks | null> {
    return em.findOne(
      TrackedLinks,
      { code },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Touchpoints y atribución (UC-50-11, UC-50-12) ---

  /** Log inmutable: se inserta, nunca se actualiza. */
  createTouchpoint(
    em: EntityManager,
    data: CreateTouchpointData,
  ): MarketingTouchpoints {
    return em.create(
      MarketingTouchpoints,
      {
        campaignId: data.campaignId,
        journeyId: data.journeyId,
        trackedLinkId: data.trackedLinkId,
        memberTypeConceptId: data.memberTypeConceptId,
        memberRefId: data.memberRefId,
        touchTypeConceptId: data.touchTypeConceptId,
        channelConceptId: data.channelConceptId,
        contentTemplateId: data.contentTemplateId,
        metadataJson: data.metadataJson,
        occurredAt: data.occurredAt ?? new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Touchpoints del miembro dentro de la ventana de atribución, en orden
   * cronológico: la posición (first/middle/last) sale de este orden.
   */
  findTouchpointsInWindow(
    em: EntityManager,
    memberTypeConceptId: string,
    memberRefId: string,
    from: Date,
    to: Date,
  ): Promise<MarketingTouchpoints[]> {
    return em.find(
      MarketingTouchpoints,
      {
        memberTypeConceptId,
        memberRefId,
        occurredAt: { $gte: from, $lte: to },
      },
      { orderBy: { occurredAt: 'ASC' } },
    );
  }

  createAttributionTouch(
    em: EntityManager,
    data: CreateAttributionTouchData,
  ): AttributionTouches {
    return em.create(
      AttributionTouches,
      {
        conversionRefType: data.conversionRefType,
        conversionRefId: data.conversionRefId,
        marketingTouchpointId: data.marketingTouchpointId,
        attributionModelConceptId: data.attributionModelConceptId,
        weight: data.weight,
        attributedValue: data.attributedValue,
        currencyConceptId: data.currencyConceptId,
        positionConceptId: data.positionConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Reparto previo de la misma conversión y modelo. Recalcular lo reemplaza en
   * bloque: la restricción SUM(weight)=1 no admite dos repartos superpuestos.
   */
  findAttributionTouches(
    em: EntityManager,
    conversionRefType: string,
    conversionRefId: string,
    attributionModelConceptId: string,
  ): Promise<AttributionTouches[]> {
    return em.find(AttributionTouches, {
      conversionRefType,
      conversionRefId,
      attributionModelConceptId,
    });
  }

  removeAttributionTouches(
    em: EntityManager,
    touches: AttributionTouches[],
  ): void {
    em.remove(touches);
  }
}
