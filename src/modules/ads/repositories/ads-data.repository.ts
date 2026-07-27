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

export interface CreateEventPolicyData {
  tenantId: string;
  code: string;
  name: string;
  jurisdictionConceptId: string;
  purposeOfUseConceptId: string;
  requiresConsent: boolean;
  defaultActionConceptId: string;
  prohibitedDataClassesJson?: unknown;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateFieldRuleData {
  adEventDataPolicyId: string;
  eventNamePattern: string;
  fieldPath: string;
  actionConceptId: string;
  transformationConceptId?: string;
  rationale?: string;
  stateConceptId: string;
  actorUserId?: string;
}

export interface UpsertInsightsDailyData {
  adAccountId: string;
  entityTypeConceptId: string;
  entityRefId: string;
  statDate: Date;
  impressions?: string;
  clicks?: string;
  spend?: string;
  conversions?: string;
  conversionValue?: string;
  currencyConceptId?: string;
  recordedByUserId?: string;
}

export interface CreateServerEventData {
  tenantId: string;
  conversionDatasetId: string;
  eventName: string;
  eventId: string;
  eventTime: Date;
  actionSourceConceptId: string;
  eventSourceUrl?: string;
  externalOrderId?: string;
  paymentTransactionId?: string;
  consentDirectiveId?: string;
  processingStatusConceptId: string;
  blockedReasonConceptId?: string;
}

/**
 * Acceso a la política de datos, la ingesta de entrega, las conversiones y el
 * catálogo de productos de `ads.*`.
 */
@Injectable()
export class AdsDataRepository {
  // --- Política de datos de evento (UC-43-06) ---

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

  findEventPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<AdEventDataPolicies | null> {
    return em.findOne(AdEventDataPolicies, { id });
  }

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

  createInsightRun(
    em: EntityManager,
    data: {
      tenantId: string;
      adAccountId: string;
      platformConnectionId: string;
      dateStart?: Date;
      dateEnd?: Date;
      objectLevelConceptId?: string;
      metricCodesJson?: unknown;
      statusConceptId: string;
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

  createFactRow(
    em: EntityManager,
    data: {
      insightQueryRunId: string;
      factDate: Date;
      objectTypeConceptId: string;
      externalObjectId: string;
      campaignId?: string;
      adSetId?: string;
      adId?: string;
      dimensionsJson?: unknown;
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

  createDeliverySnapshot(
    em: EntityManager,
    data: {
      adAccountId: string;
      entityTypeConceptId: string;
      entityRefId: string;
      effectiveStatusConceptId: string;
      reviewStatusConceptId?: string;
      issuesJson?: unknown;
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

  createBillingEvent(
    em: EntityManager,
    data: {
      adAccountId: string;
      billingEventTypeConceptId: string;
      amount: string;
      currencyConceptId: string;
      periodStart?: Date;
      periodEnd?: Date;
      externalBillingRef?: string;
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

  createDedup(
    em: EntityManager,
    data: {
      conversionDatasetId: string;
      eventName: string;
      eventId: string;
      serverConversionEventId?: string;
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
      serverConversionEventId: string;
      externalUserIdHash?: string;
      clientIpAddressEncrypted?: string;
      clientUserAgentEncrypted?: string;
      clickId?: string;
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

  createEventCustomData(
    em: EntityManager,
    data: {
      serverConversionEventId: string;
      currencyCode?: string;
      valueAmount?: string;
      contentIdsJson?: unknown;
      contentType?: string;
      numItems?: number;
      orderId?: string;
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

  createBlockedEvent(
    em: EntityManager,
    data: {
      tenantId: string;
      adEventDataPolicyId: string;
      sourceEventReference?: string;
      eventName: string;
      reasonConceptId: string;
      blockedFieldPathsJson?: unknown;
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

  createDeliveryAttempt(
    em: EntityManager,
    data: {
      serverConversionEventId: string;
      platformConnectionId: string;
      attemptNumber: number;
      resultConceptId: string;
      httpStatus?: number;
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

  createOfflineSet(
    em: EntityManager,
    data: {
      adAccountId: string;
      name: string;
      uploadSourceConceptId: string;
      fileId?: string;
      statusConceptId: string;
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

  createOfflineEvent(
    em: EntityManager,
    data: {
      offlineConversionSetId: string;
      eventName: string;
      eventTime?: Date;
      matchKeysHashJson?: unknown;
      valueAmount?: string;
      currencyConceptId?: string;
      orderRef?: string;
      isMatched: boolean;
      attributedCampaignRefId?: string;
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

  findCatalogById(
    em: EntityManager,
    id: string,
  ): Promise<ProductCatalogs | null> {
    return em.findOne(ProductCatalogs, { id });
  }

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

  findProductByRetailerId(
    em: EntityManager,
    productCatalogId: string,
    retailerProductId: string,
  ): Promise<CatalogProducts | null> {
    return em.findOne(CatalogProducts, { productCatalogId, retailerProductId });
  }

  createProduct(
    em: EntityManager,
    data: {
      productCatalogId: string;
      retailerProductId: string;
      title: string;
      description?: string;
      availabilityConceptId: string;
      conditionConceptId: string;
      price?: string;
      currencyConceptId?: string;
      brand?: string;
      imageUrl?: string;
      linkUrl?: string;
      inventoryCount?: number;
      statusConceptId: string;
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

  countProducts(em: EntityManager, productCatalogId: string): Promise<number> {
    return em.count(CatalogProducts, { productCatalogId });
  }

  findDynamicSets(
    em: EntityManager,
    productCatalogId: string,
  ): Promise<ProductSets[]> {
    return em.find(ProductSets, { productCatalogId, isDynamic: true });
  }

  findSetMember(
    em: EntityManager,
    productSetId: string,
    catalogProductId: string,
  ): Promise<ProductSetMembers | null> {
    return em.findOne(ProductSetMembers, { productSetId, catalogProductId });
  }

  createSetMember(
    em: EntityManager,
    data: {
      productSetId: string;
      catalogProductId: string;
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

  countSetMembers(em: EntityManager, productSetId: string): Promise<number> {
    return em.count(ProductSetMembers, { productSetId });
  }

  createFeedRunLog(
    em: EntityManager,
    data: {
      catalogFeedId: string;
      statusConceptId: string;
      itemsRead: number;
      itemsUpserted: number;
      itemsErrored: number;
      errorSampleJson?: unknown;
      startedAt: Date;
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
