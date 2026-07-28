import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  AdEventDataPolicies,
  AdEventFieldRules,
  InsightQueryRuns,
  InsightFactRows,
  InsightsDaily,
  DeliveryStatusSnapshots,
  AdBillingEvents,
  ConversionDatasets,
  ConversionEventDeduplication,
  ServerConversionEvents,
  ConversionEventUserData,
  ConversionEventCustomData,
  BlockedAdEvents,
  ConversionEventDeliveryAttempts,
  OfflineConversionSets,
  OfflineConversionEvents,
  ProductCatalogs,
  CatalogFeeds,
  CatalogProducts,
  ProductSets,
  ProductSetMembers,
  FeedRunLogs,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create event policy data.
 */
export interface CreateEventPolicyData {
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
   * Identificador asociado a jurisdiction concept.
   */
  jurisdictionConceptId: string;
  /**
   * Identificador asociado a purpose of use concept.
   */
  purposeOfUseConceptId: string;
  /**
   * Valor de requires consent mantenido por la instancia.
   */
  requiresConsent: boolean;
  /**
   * Identificador asociado a default action concept.
   */
  defaultActionConceptId: string;
  /**
   * Valor de prohibited data classes json mantenido por la instancia.
   */
  prohibitedDataClassesJson?: unknown;
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
 * Describe el contrato estructural de create field rule data.
 */
export interface CreateFieldRuleData {
  /**
   * Identificador asociado a ad event data policy.
   */
  adEventDataPolicyId: string;
  /**
   * Valor de event name pattern mantenido por la instancia.
   */
  eventNamePattern: string;
  /**
   * Valor de field path mantenido por la instancia.
   */
  fieldPath: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a transformation concept.
   */
  transformationConceptId?: string;
  /**
   * Valor de rationale mantenido por la instancia.
   */
  rationale?: string;
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
 * Describe el contrato estructural de upsert insights daily data.
 */
export interface UpsertInsightsDailyData {
  /**
   * Identificador asociado a ad account.
   */
  adAccountId: string;
  /**
   * Identificador asociado a entity type concept.
   */
  entityTypeConceptId: string;
  /**
   * Identificador asociado a entity ref.
   */
  entityRefId: string;
  /**
   * Valor de stat date mantenido por la instancia.
   */
  statDate: Date;
  /**
   * Valor de impressions mantenido por la instancia.
   */
  impressions?: string;
  /**
   * Valor de clicks mantenido por la instancia.
   */
  clicks?: string;
  /**
   * Valor de spend mantenido por la instancia.
   */
  spend?: string;
  /**
   * Valor de conversions mantenido por la instancia.
   */
  conversions?: string;
  /**
   * Valor de conversion value mantenido por la instancia.
   */
  conversionValue?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Describe el contrato estructural de create server event data.
 */
export interface CreateServerEventData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a conversion dataset.
   */
  conversionDatasetId: string;
  /**
   * Valor de event name mantenido por la instancia.
   */
  eventName: string;
  /**
   * Identificador asociado a event.
   */
  eventId: string;
  /**
   * Valor de event time mantenido por la instancia.
   */
  eventTime: Date;
  /**
   * Identificador asociado a action source concept.
   */
  actionSourceConceptId: string;
  /**
   * Valor de event source url mantenido por la instancia.
   */
  eventSourceUrl?: string;
  /**
   * Identificador asociado a external order.
   */
  externalOrderId?: string;
  /**
   * Identificador asociado a payment transaction.
   */
  paymentTransactionId?: string;
  /**
   * Identificador asociado a consent directive.
   */
  consentDirectiveId?: string;
  /**
   * Identificador asociado a processing status concept.
   */
  processingStatusConceptId: string;
  /**
   * Identificador asociado a blocked reason concept.
   */
  blockedReasonConceptId?: string;
}

/**
 * Acceso a la política de datos, la ingesta de entrega, las conversiones y el
 * catálogo de productos de `ads.*`.
 */
@Injectable()
export class AdsDataRepository {
  // --- Política de datos de evento (UC-43-06) ---

  /**
   * Crea create event policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create event policy conforme al contrato `AdEventDataPolicies`.
   */
  createEventPolicy(
    em: EntityManager,
    data: CreateEventPolicyData,
  ): AdEventDataPolicies {
    return em.create(
      AdEventDataPolicies,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        jurisdictionConceptId: data.jurisdictionConceptId,
        purposeOfUseConceptId: data.purposeOfUseConceptId,
        requiresConsent: data.requiresConsent,
        defaultActionConceptId: data.defaultActionConceptId,
        prohibitedDataClassesJson: data.prohibitedDataClassesJson,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find event policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find event policy by id conforme al contrato `Promise<AdEventDataPolicies | null>`.
   */
  findEventPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<AdEventDataPolicies | null> {
    return em.findOne(AdEventDataPolicies, { id });
  }

  /**
   * Obtiene find event policy by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find event policy by code conforme al contrato `Promise<AdEventDataPolicies | null>`.
   */
  findEventPolicyByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<AdEventDataPolicies | null> {
    return em.findOne(AdEventDataPolicies, { tenantId, code });
  }

  /** Política activa del tenant: es la que se aplica a cada evento entrante. */
  findActiveEventPolicy(
    em: EntityManager,
    tenantId: string,
    activeStateConceptId: string,
  ): Promise<AdEventDataPolicies | null> {
    return em.findOne(AdEventDataPolicies, {
      tenantId,
      stateConceptId: activeStateConceptId,
    });
  }

  /**
   * Crea create field rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create field rule conforme al contrato `AdEventFieldRules`.
   */
  createFieldRule(
    em: EntityManager,
    data: CreateFieldRuleData,
  ): AdEventFieldRules {
    return em.create(
      AdEventFieldRules,
      {
        adEventDataPolicyId: data.adEventDataPolicyId,
        eventNamePattern: data.eventNamePattern,
        fieldPath: data.fieldPath,
        actionConceptId: data.actionConceptId,
        transformationConceptId: data.transformationConceptId,
        rationale: data.rationale,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find field rules.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param adEventDataPolicyId - Identificador de ad event data policy.
   * @param activeStateConceptId - Identificador de active state concept.
   * @returns Resultado de find field rules conforme al contrato `Promise<AdEventFieldRules[]>`.
   */
  findFieldRules(
    em: EntityManager,
    adEventDataPolicyId: string,
    activeStateConceptId: string,
  ): Promise<AdEventFieldRules[]> {
    return em.find(AdEventFieldRules, {
      adEventDataPolicyId,
      stateConceptId: activeStateConceptId,
    });
  }

  // --- Ingesta de entrega e insights (UC-43-07) ---

  /**
   * Crea create insight run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create insight run conforme al contrato `InsightQueryRuns`.
   */
  createInsightRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a ad account.
       */
      adAccountId: string;
      /**
       * Identificador asociado a platform connection.
       */
      platformConnectionId: string;
      /**
       * Valor de date start mantenido por la instancia.
       */
      dateStart?: Date;
      /**
       * Valor de date end mantenido por la instancia.
       */
      dateEnd?: Date;
      /**
       * Identificador asociado a object level concept.
       */
      objectLevelConceptId?: string;
      /**
       * Valor de metric codes json mantenido por la instancia.
       */
      metricCodesJson?: unknown;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a external report.
       */
      externalReportId?: string;
    },
  ): InsightQueryRuns {
    return em.create(
      InsightQueryRuns,
      {
        tenantId: data.tenantId,
        adAccountId: data.adAccountId,
        platformConnectionId: data.platformConnectionId,
        requestedAt: new Date(),
        dateStart: data.dateStart,
        dateEnd: data.dateEnd,
        objectLevelConceptId: data.objectLevelConceptId,
        metricCodesJson: data.metricCodesJson,
        statusConceptId: data.statusConceptId,
        externalReportId: data.externalReportId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create fact row.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create fact row conforme al contrato `InsightFactRows`.
   */
  createFactRow(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a insight query run.
       */
      insightQueryRunId: string;
      /**
       * Valor de fact date mantenido por la instancia.
       */
      factDate: Date;
      /**
       * Identificador asociado a object type concept.
       */
      objectTypeConceptId: string;
      /**
       * Identificador asociado a external object.
       */
      externalObjectId: string;
      /**
       * Identificador asociado a campaign.
       */
      campaignId?: string;
      /**
       * Identificador asociado a ad set.
       */
      adSetId?: string;
      /**
       * Identificador asociado a ad.
       */
      adId?: string;
      /**
       * Valor de dimensions json mantenido por la instancia.
       */
      dimensionsJson?: unknown;
      /**
       * Valor de metrics json mantenido por la instancia.
       */
      metricsJson: unknown;
    },
  ): InsightFactRows {
    return em.create(
      InsightFactRows,
      {
        insightQueryRunId: data.insightQueryRunId,
        factDate: data.factDate,
        objectTypeConceptId: data.objectTypeConceptId,
        externalObjectId: data.externalObjectId,
        campaignId: data.campaignId,
        adSetId: data.adSetId,
        adId: data.adId,
        dimensionsJson: data.dimensionsJson,
        metricsJson: data.metricsJson,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Rollup diario ya existente: la ingesta reescribe, no acumula sobre sí misma. */
  findInsightsDaily(
    em: EntityManager,
    adAccountId: string,
    entityTypeConceptId: string,
    entityRefId: string,
    statDate: Date,
  ): Promise<InsightsDaily | null> {
    return em.findOne(InsightsDaily, {
      adAccountId,
      entityTypeConceptId,
      entityRefId,
      statDate,
    });
  }

  /**
   * Crea create insights daily.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create insights daily conforme al contrato `InsightsDaily`.
   */
  createInsightsDaily(
    em: EntityManager,
    data: UpsertInsightsDailyData,
  ): InsightsDaily {
    return em.create(
      InsightsDaily,
      {
        adAccountId: data.adAccountId,
        entityTypeConceptId: data.entityTypeConceptId,
        entityRefId: data.entityRefId,
        statDate: data.statDate,
        impressions: data.impressions,
        clicks: data.clicks,
        spend: data.spend,
        conversions: data.conversions,
        conversionValue: data.conversionValue,
        currencyConceptId: data.currencyConceptId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Crea create delivery snapshot.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create delivery snapshot conforme al contrato `DeliveryStatusSnapshots`.
   */
  createDeliverySnapshot(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad account.
       */
      adAccountId: string;
      /**
       * Identificador asociado a entity type concept.
       */
      entityTypeConceptId: string;
      /**
       * Identificador asociado a entity ref.
       */
      entityRefId: string;
      /**
       * Identificador asociado a effective status concept.
       */
      effectiveStatusConceptId: string;
      /**
       * Identificador asociado a review status concept.
       */
      reviewStatusConceptId?: string;
      /**
       * Valor de issues json mantenido por la instancia.
       */
      issuesJson?: unknown;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): DeliveryStatusSnapshots {
    return em.create(
      DeliveryStatusSnapshots,
      {
        adAccountId: data.adAccountId,
        entityTypeConceptId: data.entityTypeConceptId,
        entityRefId: data.entityRefId,
        effectiveStatusConceptId: data.effectiveStatusConceptId,
        reviewStatusConceptId: data.reviewStatusConceptId,
        issuesJson: data.issuesJson,
        capturedAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Crea create billing event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create billing event conforme al contrato `AdBillingEvents`.
   */
  createBillingEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad account.
       */
      adAccountId: string;
      /**
       * Identificador asociado a billing event type concept.
       */
      billingEventTypeConceptId: string;
      /**
       * Valor de amount mantenido por la instancia.
       */
      amount: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId: string;
      /**
       * Valor de period start mantenido por la instancia.
       */
      periodStart?: Date;
      /**
       * Valor de period end mantenido por la instancia.
       */
      periodEnd?: Date;
      /**
       * Valor de external billing ref mantenido por la instancia.
       */
      externalBillingRef?: string;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): AdBillingEvents {
    return em.create(
      AdBillingEvents,
      {
        adAccountId: data.adAccountId,
        billingEventTypeConceptId: data.billingEventTypeConceptId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        externalBillingRef: data.externalBillingRef,
        occurredAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /** Eventos de facturación del periodo: la factura se arma agregándolos. */
  findBillingEventsInPeriod(
    em: EntityManager,
    adAccountId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<AdBillingEvents[]> {
    return em.find(AdBillingEvents, {
      adAccountId,
      occurredAt: { $gte: periodStart, $lte: periodEnd },
    });
  }

  /** Rollups del periodo por campaña: dan las líneas de la factura. */
  findInsightsInPeriod(
    em: EntityManager,
    adAccountId: string,
    entityTypeConceptId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<InsightsDaily[]> {
    return em.find(InsightsDaily, {
      adAccountId,
      entityTypeConceptId,
      statDate: { $gte: periodStart, $lte: periodEnd },
    });
  }

  // --- Conversiones server-side (UC-43-08) ---

  /**
   * Obtiene find dataset by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find dataset by id conforme al contrato `Promise<ConversionDatasets | null>`.
   */
  findDatasetById(
    em: EntityManager,
    id: string,
  ): Promise<ConversionDatasets | null> {
    return em.findOne(ConversionDatasets, { id });
  }

  /**
   * Entrada de deduplicación del par evento-identificador, bloqueada: el pixel
   * del navegador y el servidor mandan el mismo evento y sólo uno debe contar.
   */
  findDedupForUpdate(
    em: EntityManager,
    conversionDatasetId: string,
    eventName: string,
    eventId: string,
  ): Promise<ConversionEventDeduplication | null> {
    return em.findOne(
      ConversionEventDeduplication,
      { conversionDatasetId, eventName, eventId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Crea create dedup.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create dedup conforme al contrato `ConversionEventDeduplication`.
   */
  createDedup(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a conversion dataset.
       */
      conversionDatasetId: string;
      /**
       * Valor de event name mantenido por la instancia.
       */
      eventName: string;
      /**
       * Identificador asociado a event.
       */
      eventId: string;
      /**
       * Identificador asociado a server conversion event.
       */
      serverConversionEventId?: string;
      /**
       * Identificador asociado a resolution concept.
       */
      resolutionConceptId: string;
    },
  ): ConversionEventDeduplication {
    return em.create(
      ConversionEventDeduplication,
      {
        conversionDatasetId: data.conversionDatasetId,
        eventName: data.eventName,
        eventId: data.eventId,
        serverConversionEventId: data.serverConversionEventId,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        duplicateCount: 0,
        resolutionConceptId: data.resolutionConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create server event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create server event conforme al contrato `ServerConversionEvents`.
   */
  createServerEvent(
    em: EntityManager,
    data: CreateServerEventData,
  ): ServerConversionEvents {
    return em.create(
      ServerConversionEvents,
      {
        tenantId: data.tenantId,
        conversionDatasetId: data.conversionDatasetId,
        eventName: data.eventName,
        eventId: data.eventId,
        eventTime: data.eventTime,
        actionSourceConceptId: data.actionSourceConceptId,
        eventSourceUrl: data.eventSourceUrl,
        externalOrderId: data.externalOrderId,
        paymentTransactionId: data.paymentTransactionId,
        consentDirectiveId: data.consentDirectiveId,
        processingStatusConceptId: data.processingStatusConceptId,
        blockedReasonConceptId: data.blockedReasonConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Sólo hashes y valores cifrados: aquí nunca entra identificación en claro. */
  createEventUserData(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a server conversion event.
       */
      serverConversionEventId: string;
      /**
       * Valor de external user id hash mantenido por la instancia.
       */
      externalUserIdHash?: string;
      /**
       * Valor de client ip address encrypted mantenido por la instancia.
       */
      clientIpAddressEncrypted?: string;
      /**
       * Valor de client user agent encrypted mantenido por la instancia.
       */
      clientUserAgentEncrypted?: string;
      /**
       * Identificador asociado a click.
       */
      clickId?: string;
      /**
       * Identificador asociado a browser.
       */
      browserId?: string;
    },
  ): ConversionEventUserData {
    return em.create(
      ConversionEventUserData,
      {
        serverConversionEventId: data.serverConversionEventId,
        externalUserIdHash: data.externalUserIdHash,
        clientIpAddressEncrypted: data.clientIpAddressEncrypted,
        clientUserAgentEncrypted: data.clientUserAgentEncrypted,
        clickId: data.clickId,
        browserId: data.browserId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create event custom data.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create event custom data conforme al contrato `ConversionEventCustomData`.
   */
  createEventCustomData(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a server conversion event.
       */
      serverConversionEventId: string;
      /**
       * Valor de currency code mantenido por la instancia.
       */
      currencyCode?: string;
      /**
       * Valor de value amount mantenido por la instancia.
       */
      valueAmount?: string;
      /**
       * Valor de content ids json mantenido por la instancia.
       */
      contentIdsJson?: unknown;
      /**
       * Valor de content type mantenido por la instancia.
       */
      contentType?: string;
      /**
       * Valor de num items mantenido por la instancia.
       */
      numItems?: number;
      /**
       * Identificador asociado a order.
       */
      orderId?: string;
      /**
       * Valor de custom properties json mantenido por la instancia.
       */
      customPropertiesJson?: unknown;
    },
  ): ConversionEventCustomData {
    return em.create(
      ConversionEventCustomData,
      {
        serverConversionEventId: data.serverConversionEventId,
        currencyCode: data.currencyCode,
        valueAmount: data.valueAmount,
        contentIdsJson: data.contentIdsJson,
        contentType: data.contentType,
        numItems: data.numItems,
        orderId: data.orderId,
        customPropertiesJson: data.customPropertiesJson,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create blocked event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create blocked event conforme al contrato `BlockedAdEvents`.
   */
  createBlockedEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a ad event data policy.
       */
      adEventDataPolicyId: string;
      /**
       * Valor de source event reference mantenido por la instancia.
       */
      sourceEventReference?: string;
      /**
       * Valor de event name mantenido por la instancia.
       */
      eventName: string;
      /**
       * Identificador asociado a reason concept.
       */
      reasonConceptId: string;
      /**
       * Valor de blocked field paths json mantenido por la instancia.
       */
      blockedFieldPathsJson?: unknown;
      /**
       * Valor de payload hash mantenido por la instancia.
       */
      payloadHash?: string;
    },
  ): BlockedAdEvents {
    return em.create(
      BlockedAdEvents,
      {
        tenantId: data.tenantId,
        adEventDataPolicyId: data.adEventDataPolicyId,
        sourceEventReference: data.sourceEventReference,
        eventName: data.eventName,
        blockedAt: new Date(),
        reasonConceptId: data.reasonConceptId,
        blockedFieldPathsJson: data.blockedFieldPathsJson,
        payloadHash: data.payloadHash,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create delivery attempt.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create delivery attempt conforme al contrato `ConversionEventDeliveryAttempts`.
   */
  createDeliveryAttempt(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a server conversion event.
       */
      serverConversionEventId: string;
      /**
       * Identificador asociado a platform connection.
       */
      platformConnectionId: string;
      /**
       * Valor de attempt number mantenido por la instancia.
       */
      attemptNumber: number;
      /**
       * Identificador asociado a result concept.
       */
      resultConceptId: string;
      /**
       * Valor de http status mantenido por la instancia.
       */
      httpStatus?: number;
      /**
       * Valor de retry at mantenido por la instancia.
       */
      retryAt?: Date;
    },
  ): ConversionEventDeliveryAttempts {
    return em.create(
      ConversionEventDeliveryAttempts,
      {
        serverConversionEventId: data.serverConversionEventId,
        platformConnectionId: data.platformConnectionId,
        attemptNumber: data.attemptNumber,
        attemptedAt: new Date(),
        resultConceptId: data.resultConceptId,
        httpStatus: data.httpStatus,
        retryAt: data.retryAt,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  // --- Conversiones offline (UC-43-09) ---

  /**
   * Crea create offline set.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create offline set conforme al contrato `OfflineConversionSets`.
   */
  createOfflineSet(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad account.
       */
      adAccountId: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Identificador asociado a upload source concept.
       */
      uploadSourceConceptId: string;
      /**
       * Identificador asociado a file.
       */
      fileId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): OfflineConversionSets {
    return em.create(
      OfflineConversionSets,
      {
        adAccountId: data.adAccountId,
        name: data.name,
        uploadSourceConceptId: data.uploadSourceConceptId,
        fileId: data.fileId,
        totalEvents: 0,
        matchedEvents: 0,
        statusConceptId: data.statusConceptId,
        uploadedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find offline set for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find offline set for update conforme al contrato `Promise<OfflineConversionSets | null>`.
   */
  findOfflineSetForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<OfflineConversionSets | null> {
    return em.findOne(
      OfflineConversionSets,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Crea create offline event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create offline event conforme al contrato `OfflineConversionEvents`.
   */
  createOfflineEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a offline conversion set.
       */
      offlineConversionSetId: string;
      /**
       * Valor de event name mantenido por la instancia.
       */
      eventName: string;
      /**
       * Valor de event time mantenido por la instancia.
       */
      eventTime?: Date;
      /**
       * Valor de match keys hash json mantenido por la instancia.
       */
      matchKeysHashJson?: unknown;
      /**
       * Valor de value amount mantenido por la instancia.
       */
      valueAmount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Valor de order ref mantenido por la instancia.
       */
      orderRef?: string;
      /**
       * Valor de is matched mantenido por la instancia.
       */
      isMatched: boolean;
      /**
       * Identificador asociado a attributed campaign ref.
       */
      attributedCampaignRefId?: string;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): OfflineConversionEvents {
    return em.create(
      OfflineConversionEvents,
      {
        offlineConversionSetId: data.offlineConversionSetId,
        eventName: data.eventName,
        eventTime: data.eventTime,
        matchKeysHashJson: data.matchKeysHashJson,
        valueAmount: data.valueAmount,
        currencyConceptId: data.currencyConceptId,
        orderRef: data.orderRef,
        isMatched: data.isMatched,
        attributedCampaignRefId: data.attributedCampaignRefId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  // --- Catálogo de productos (UC-43-13) ---

  /**
   * Obtiene find catalog by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find catalog by id conforme al contrato `Promise<ProductCatalogs | null>`.
   */
  findCatalogById(
    em: EntityManager,
    id: string,
  ): Promise<ProductCatalogs | null> {
    return em.findOne(ProductCatalogs, { id });
  }

  /**
   * Obtiene find catalog for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find catalog for update conforme al contrato `Promise<ProductCatalogs | null>`.
   */
  findCatalogForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ProductCatalogs | null> {
    return em.findOne(
      ProductCatalogs,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** El feed se bloquea: dos ejecuciones simultáneas duplicarían el upsert. */
  findFeedForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<CatalogFeeds | null> {
    return em.findOne(
      CatalogFeeds,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find product by retailer id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param productCatalogId - Identificador de product catalog.
   * @param retailerProductId - Identificador de retailer product.
   * @returns Resultado de find product by retailer id conforme al contrato `Promise<CatalogProducts | null>`.
   */
  findProductByRetailerId(
    em: EntityManager,
    productCatalogId: string,
    retailerProductId: string,
  ): Promise<CatalogProducts | null> {
    return em.findOne(CatalogProducts, { productCatalogId, retailerProductId });
  }

  /**
   * Crea create product.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create product conforme al contrato `CatalogProducts`.
   */
  createProduct(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a product catalog.
       */
      productCatalogId: string;
      /**
       * Identificador asociado a retailer product.
       */
      retailerProductId: string;
      /**
       * Valor de title mantenido por la instancia.
       */
      title: string;
      /**
       * Valor de description mantenido por la instancia.
       */
      description?: string;
      /**
       * Identificador asociado a availability concept.
       */
      availabilityConceptId: string;
      /**
       * Identificador asociado a condition concept.
       */
      conditionConceptId: string;
      /**
       * Valor de price mantenido por la instancia.
       */
      price?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Valor de brand mantenido por la instancia.
       */
      brand?: string;
      /**
       * Valor de image url mantenido por la instancia.
       */
      imageUrl?: string;
      /**
       * Valor de link url mantenido por la instancia.
       */
      linkUrl?: string;
      /**
       * Valor de inventory count mantenido por la instancia.
       */
      inventoryCount?: number;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): CatalogProducts {
    return em.create(
      CatalogProducts,
      {
        productCatalogId: data.productCatalogId,
        retailerProductId: data.retailerProductId,
        title: data.title,
        description: data.description,
        availabilityConceptId: data.availabilityConceptId,
        conditionConceptId: data.conditionConceptId,
        price: data.price,
        currencyConceptId: data.currencyConceptId,
        brand: data.brand,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        inventoryCount: data.inventoryCount,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Ejecuta la operación count products.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param productCatalogId - Identificador de product catalog.
   * @returns Resultado de count products conforme al contrato `Promise<number>`.
   */
  countProducts(em: EntityManager, productCatalogId: string): Promise<number> {
    return em.count(CatalogProducts, { productCatalogId });
  }

  /**
   * Obtiene find dynamic sets.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param productCatalogId - Identificador de product catalog.
   * @returns Resultado de find dynamic sets conforme al contrato `Promise<ProductSets[]>`.
   */
  findDynamicSets(
    em: EntityManager,
    productCatalogId: string,
  ): Promise<ProductSets[]> {
    return em.find(ProductSets, { productCatalogId, isDynamic: true });
  }

  /**
   * Obtiene find set member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param productSetId - Identificador de product set.
   * @param catalogProductId - Identificador de catalog product.
   * @returns Resultado de find set member conforme al contrato `Promise<ProductSetMembers | null>`.
   */
  findSetMember(
    em: EntityManager,
    productSetId: string,
    catalogProductId: string,
  ): Promise<ProductSetMembers | null> {
    return em.findOne(ProductSetMembers, { productSetId, catalogProductId });
  }

  /**
   * Crea create set member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create set member conforme al contrato `ProductSetMembers`.
   */
  createSetMember(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a product set.
       */
      productSetId: string;
      /**
       * Identificador asociado a catalog product.
       */
      catalogProductId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): ProductSetMembers {
    return em.create(
      ProductSetMembers,
      {
        productSetId: data.productSetId,
        catalogProductId: data.catalogProductId,
        addedByRule: true,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Ejecuta la operación count set members.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param productSetId - Identificador de product set.
   * @returns Resultado de count set members conforme al contrato `Promise<number>`.
   */
  countSetMembers(em: EntityManager, productSetId: string): Promise<number> {
    return em.count(ProductSetMembers, { productSetId });
  }

  /**
   * Crea create feed run log.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create feed run log conforme al contrato `FeedRunLogs`.
   */
  createFeedRunLog(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a catalog feed.
       */
      catalogFeedId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de items read mantenido por la instancia.
       */
      itemsRead: number;
      /**
       * Valor de items upserted mantenido por la instancia.
       */
      itemsUpserted: number;
      /**
       * Valor de items errored mantenido por la instancia.
       */
      itemsErrored: number;
      /**
       * Valor de error sample json mantenido por la instancia.
       */
      errorSampleJson?: unknown;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): FeedRunLogs {
    return em.create(
      FeedRunLogs,
      {
        catalogFeedId: data.catalogFeedId,
        statusConceptId: data.statusConceptId,
        itemsRead: data.itemsRead,
        itemsUpserted: data.itemsUpserted,
        itemsErrored: data.itemsErrored,
        errorSampleJson: data.errorSampleJson,
        startedAt: data.startedAt,
        finishedAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }
}
