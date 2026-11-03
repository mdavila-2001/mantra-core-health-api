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
  MarketingCampaigns,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create journey data.
 */
export interface CreateJourneyData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a entry trigger concept.
   */
  entryTriggerConceptId: string;
  /**
   * Identificador asociado a entry segment.
   */
  entrySegmentId?: string;
  /**
   * Identificador asociado a goal metric concept.
   */
  goalMetricConceptId?: string;
  /**
   * Valor de definition json mantenido por la instancia.
   */
  definitionJson?: unknown;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create journey step data.
 */
export interface CreateJourneyStepData {
  /**
   * Identificador asociado a journey.
   */
  journeyId: string;
  /**
   * Valor de step code mantenido por la instancia.
   */
  stepCode: string;
  /**
   * Identificador asociado a step type concept.
   */
  stepTypeConceptId: string;
  /**
   * Identificador asociado a channel concept.
   */
  channelConceptId?: string;
  /**
   * Identificador asociado a content template.
   */
  contentTemplateId?: string;
  /**
   * Valor de wait duration minutes mantenido por la instancia.
   */
  waitDurationMinutes?: number;
  /**
   * Valor de condition json mantenido por la instancia.
   */
  conditionJson?: unknown;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create enrollment data.
 */
export interface CreateEnrollmentData {
  /**
   * Identificador asociado a journey.
   */
  journeyId: string;
  /**
   * Identificador asociado a member type concept.
   */
  memberTypeConceptId: string;
  /**
   * Identificador asociado a member ref.
   */
  memberRefId: string;
  /**
   * Identificador asociado a current step.
   */
  currentStepId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create tracked link data.
 */
export interface CreateTrackedLinkData {
  /**
   * Identificador asociado a campaign.
   */
  campaignId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de target url mantenido por la instancia.
   */
  targetUrl: string;
  /**
   * Valor de utm source mantenido por la instancia.
   */
  utmSource?: string;
  /**
   * Valor de utm medium mantenido por la instancia.
   */
  utmMedium?: string;
  /**
   * Valor de utm campaign mantenido por la instancia.
   */
  utmCampaign?: string;
  /**
   * Valor de utm content mantenido por la instancia.
   */
  utmContent?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create touchpoint data.
 */
export interface CreateTouchpointData {
  /**
   * Identificador asociado a campaign.
   */
  campaignId?: string;
  /**
   * Identificador asociado a journey.
   */
  journeyId?: string;
  /**
   * Identificador asociado a tracked link.
   */
  trackedLinkId?: string;
  /**
   * Identificador asociado a member type concept.
   */
  memberTypeConceptId: string;
  /**
   * Identificador asociado a member ref.
   */
  memberRefId: string;
  /**
   * Identificador asociado a touch type concept.
   */
  touchTypeConceptId: string;
  /**
   * Identificador asociado a channel concept.
   */
  channelConceptId: string;
  /**
   * Identificador asociado a content template.
   */
  contentTemplateId?: string;
  /**
   * Valor de metadata json mantenido por la instancia.
   */
  metadataJson?: unknown;
  /**
   * Valor de occurred at mantenido por la instancia.
   */
  occurredAt?: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Describe el contrato estructural de create attribution touch data.
 */
export interface CreateAttributionTouchData {
  /**
   * Valor de conversion ref type mantenido por la instancia.
   */
  conversionRefType: string;
  /**
   * Identificador asociado a conversion ref.
   */
  conversionRefId: string;
  /**
   * Identificador asociado a marketing touchpoint.
   */
  marketingTouchpointId: string;
  /**
   * Identificador asociado a attribution model concept.
   */
  attributionModelConceptId: string;
  /**
   * Valor de weight mantenido por la instancia.
   */
  weight: string;
  /**
   * Valor de attributed value mantenido por la instancia.
   */
  attributedValue?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a position concept.
   */
  positionConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a `marketing.journeys`, `journey_steps`, `journey_enrollments`,
 * `tracked_links`, `marketing_touchpoints` y `attribution_touches`.
 */
@Injectable()
export class MarketingJourneysRepository {
  // --- Journeys y pasos (UC-50-06, UC-50-07) ---

  /**
   * Crea create journey.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create journey conforme al contrato `Journeys`.
   */
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

  /**
   * Obtiene un journey del tenant activo; uno ajeno cuenta como inexistente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant activo del actor.
   * @param id - Identificador de id.
   * @returns Resultado de find journey by id conforme al contrato `Promise<Journeys | null>`.
   */
  findJourneyById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<Journeys | null> {
    return em.findOne(Journeys, { id, tenantId });
  }

  /**
   * Obtiene el journey del tenant activo, bloqueado para actualizar.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant activo del actor.
   * @param id - Identificador de id.
   * @returns Resultado de find journey for update conforme al contrato `Promise<Journeys | null>`.
   */
  findJourneyForUpdate(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<Journeys | null> {
    return em.findOne(
      Journeys,
      { id, tenantId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find journey by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find journey by code conforme al contrato `Promise<Journeys | null>`.
   */
  findJourneyByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<Journeys | null> {
    return em.findOne(Journeys, { tenantId, code });
  }

  /**
   * Crea create journey step.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create journey step conforme al contrato `JourneySteps`.
   */
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

  /**
   * Obtiene find step by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find step by id conforme al contrato `Promise<JourneySteps | null>`.
   */
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

  /**
   * Crea create enrollment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create enrollment conforme al contrato `JourneyEnrollments`.
   */
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

  /**
   * Obtiene find enrollment for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find enrollment for update conforme al contrato `Promise<JourneyEnrollments | null>`.
   */
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

  /**
   * Crea create tracked link.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create tracked link conforme al contrato `TrackedLinks`.
   */
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

  /**
   * Obtiene find tracked link by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find tracked link by code conforme al contrato `Promise<TrackedLinks | null>`.
   */
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

  /** Enlace rastreable por id (sin tenant propio: el tenant sale de su campaña). */
  findTrackedLinkById(
    em: EntityManager,
    id: string,
  ): Promise<TrackedLinks | null> {
    return em.findOne(TrackedLinks, { id });
  }

  /** Touchpoints por id, para resolver a qué tenant pertenecen. */
  findTouchpointsByIds(
    em: EntityManager,
    ids: string[],
  ): Promise<MarketingTouchpoints[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(MarketingTouchpoints, { id: { $in: ids } });
  }

  /**
   * Conserva sólo los touchpoints que pertenecen al tenant: los que cuelgan de
   * una campaña o de un journey del tenant. La tabla no tiene `tenant_id`, y un
   * touchpoint sin campaña ni journey no tiene dueño, así que queda fuera.
   */
  async keepTouchpointsOfTenant(
    em: EntityManager,
    tenantId: string,
    touchpoints: MarketingTouchpoints[],
  ): Promise<MarketingTouchpoints[]> {
    const campaignIds = [
      ...new Set(
        touchpoints.flatMap((t) => (t.campaignId ? [t.campaignId] : [])),
      ),
    ];
    const journeyIds = [
      ...new Set(
        touchpoints.flatMap((t) => (t.journeyId ? [t.journeyId] : [])),
      ),
    ];
    // `campaign_id` de touchpoints y enlaces apunta a `ads.campaigns`; una
    // campaña de marketing la referencia por `ad_campaign_ref_id`. Ambas
    // identidades cuentan como propias si la campaña de marketing es del tenant.
    const ownCampaigns = new Set<string>();
    if (campaignIds.length > 0) {
      const own = await em.find(MarketingCampaigns, {
        tenantId,
        $or: [
          { id: { $in: campaignIds } },
          { adCampaignRefId: { $in: campaignIds } },
        ],
      });
      for (const campaign of own) {
        ownCampaigns.add(campaign.id);
        if (campaign.adCampaignRefId)
          ownCampaigns.add(campaign.adCampaignRefId);
      }
    }
    const ownJourneys = new Set(
      journeyIds.length === 0
        ? []
        : (await em.find(Journeys, { id: { $in: journeyIds }, tenantId })).map(
            (j) => j.id,
          ),
    );
    return touchpoints.filter(
      (t) =>
        (t.campaignId !== undefined &&
          t.campaignId !== null &&
          ownCampaigns.has(t.campaignId)) ||
        (t.journeyId !== undefined &&
          t.journeyId !== null &&
          ownJourneys.has(t.journeyId)),
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

  /**
   * Crea create attribution touch.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create attribution touch conforme al contrato `AttributionTouches`.
   */
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

  /**
   * Elimina o desactiva remove attribution touches.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param touches - Valor de touches requerido por la operación.
   */
  removeAttributionTouches(
    em: EntityManager,
    touches: AttributionTouches[],
  ): void {
    em.remove(touches);
  }
}
