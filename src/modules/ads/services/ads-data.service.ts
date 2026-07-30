import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AdsAccountsRepository, AdsDataRepository } from '../repositories';
import { AdEventFieldRules } from '../entities';
import {
  CreateEventPolicyDto,
  EventPolicyResponseDto,
  IngestInsightsDto,
  IngestInsightsResponseDto,
  SendConversionDto,
  SendConversionResponseDto,
  UploadOfflineConversionsDto,
  OfflineUploadResponseDto,
  RunFeedDto,
  FeedRunResponseDto,
  type Jurisdiction,
  type AdPurpose,
  type FieldAction,
  type ActionSource,
  type AdEntityType,
} from '../dto';

const JURISDICTION_CONCEPT: Readonly<Record<Jurisdiction, string>> = {
  BO: CONCEPTS.JURISDICTION_BO,
  EU: CONCEPTS.JURISDICTION_EU,
  US: CONCEPTS.JURISDICTION_US,
};

const PURPOSE_CONCEPT: Readonly<Record<AdPurpose, string>> = {
  MARKETING: CONCEPTS.AD_PURPOSE_MARKETING,
  ANALYTICS: CONCEPTS.AD_PURPOSE_ANALYTICS,
};

const FIELD_ACTION_CONCEPT: Readonly<Record<FieldAction, string>> = {
  ALLOW: CONCEPTS.FIELD_ACTION_ALLOW,
  BLOCK: CONCEPTS.FIELD_ACTION_BLOCK,
  HASH: CONCEPTS.FIELD_ACTION_HASH,
  DROP: CONCEPTS.FIELD_ACTION_DROP,
};

const ACTION_SOURCE_CONCEPT: Readonly<Record<ActionSource, string>> = {
  WEBSITE: CONCEPTS.ACTION_SOURCE_WEBSITE,
  APP: CONCEPTS.ACTION_SOURCE_APP,
  SERVER: CONCEPTS.ACTION_SOURCE_SERVER,
  OFFLINE: CONCEPTS.ACTION_SOURCE_OFFLINE,
};

export const ENTITY_TYPE_CONCEPT: Readonly<Record<AdEntityType, string>> = {
  ACCOUNT: CONCEPTS.AD_ENTITY_ACCOUNT,
  CAMPAIGN: CONCEPTS.AD_ENTITY_CAMPAIGN,
  AD_SET: CONCEPTS.AD_ENTITY_ADSET,
  AD: CONCEPTS.AD_ENTITY_AD,
};

const ENTITY_OBJECT_CONCEPT: Readonly<Record<AdEntityType, string>> = {
  ACCOUNT: CONCEPTS.AD_OBJECT_INSIGHT,
  CAMPAIGN: CONCEPTS.AD_OBJECT_CAMPAIGN,
  AD_SET: CONCEPTS.AD_OBJECT_ADSET,
  AD: CONCEPTS.AD_OBJECT_AD,
};

/** Campos del evento de conversión que las reglas de política pueden alcanzar. */
const TRANSFORMABLE_FIELDS = [
  'user_data.external_user_id',
  'user_data.client_ip_address',
  'user_data.client_user_agent',
  'custom_data.value_amount',
  'custom_data.order_id',
] as const;

/**
 * Política de datos, ingesta de entrega, conversiones y catálogo de productos
 * (UC-43-06 … UC-43-09, UC-43-13).
 */
@Injectable()
export class AdsDataService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dataRepo - Valor de data repo requerido por la operación.
   * @param accountsRepo - Valor de accounts repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly dataRepo: AdsDataRepository,
    private readonly accountsRepo: AdsAccountsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdsDataService.name);
  }

  /**
   * UC-43-06: publicar la política de datos de evento y sus reglas de campo.
   * Es el cortafuegos que impide que un dato de salud salga hacia la plataforma.
   */
  async createEventPolicy(
    dto: CreateEventPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<EventPolicyResponseDto> {
    this.logger.info(
      {
        operation: 'ads.policy.create',
        tenantId: dto.tenantId,
        code: dto.code,
      },
      'Publishing ad event data policy',
    );

    const duplicate = await this.dataRepo.findEventPolicyByCode(
      this.em,
      dto.tenantId,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe una política con ese código', {
        tenantId: dto.tenantId,
        code: dto.code,
      });
    }
    for (const rule of dto.fieldRules) {
      if (rule.action === 'HASH' && !rule.transformation) {
        throw new PreconditionFailedException(
          'Una regla HASH necesita transformación',
          {
            fieldPath: rule.fieldPath,
          },
        );
      }
    }

    return this.em.transactional(async (tx) => {
      const policy = this.dataRepo.createEventPolicy(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        jurisdictionConceptId: JURISDICTION_CONCEPT[dto.jurisdiction],
        purposeOfUseConceptId: PURPOSE_CONCEPT[dto.purposeOfUse],
        requiresConsent: dto.requiresConsent ?? true,
        defaultActionConceptId: FIELD_ACTION_CONCEPT[dto.defaultAction],
        prohibitedDataClassesJson: dto.prohibitedDataClassesJson,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      const fieldRuleIds = dto.fieldRules.map(
        (rule) =>
          this.dataRepo.createFieldRule(tx, {
            adEventDataPolicyId: policy.id,
            eventNamePattern: rule.eventNamePattern,
            fieldPath: rule.fieldPath,
            actionConceptId: FIELD_ACTION_CONCEPT[rule.action],
            transformationConceptId:
              rule.transformation === 'SHA256'
                ? CONCEPTS.TRANSFORM_SHA256
                : rule.transformation === 'TRUNCATE'
                  ? CONCEPTS.TRANSFORM_TRUNCATE
                  : undefined,
            rationale: rule.rationale,
            stateConceptId: CONCEPTS.STATE_ACTIVE,
            actorUserId: actor.id,
          }).id,
      );

      return {
        id: policy.id,
        code: dto.code,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        fieldRuleIds,
      };
    });
  }

  /**
   * UC-43-07: ingerir entrega e insights. Las filas de hecho son append-only y
   * el rollup diario se **reescribe**, no se acumula sobre sí mismo: reingerir
   * el mismo día tiene que dar el mismo número, no el doble.
   */
  async ingestInsights(
    dto: IngestInsightsDto,
    actor: AuthenticatedUser,
  ): Promise<IngestInsightsResponseDto> {
    this.logger.info(
      {
        operation: 'ads.insights.ingest',
        adAccountId: dto.adAccountId,
        rows: dto.rows.length,
      },
      'Ingesting delivery insights',
    );

    return this.em.transactional(async (tx) => {
      const connection = await this.accountsRepo.findConnectionById(
        tx,
        dto.platformConnectionId,
      );
      if (!connection) {
        throw new ResourceNotFoundException(
          'Conexión de plataforma no encontrada',
          {
            platformConnectionId: dto.platformConnectionId,
          },
        );
      }
      if (connection.statusConceptId !== CONCEPTS.CONNECTION_CONNECTED) {
        throw new PreconditionFailedException(
          'La conexión de plataforma no está activa',
          {
            platformConnectionId: dto.platformConnectionId,
          },
        );
      }

      const account = await this.accountsRepo.findAdAccountForUpdate(
        tx,
        dto.adAccountId,
      );
      if (!account) {
        throw new ResourceNotFoundException(
          'Cuenta publicitaria no encontrada',
          {
            adAccountId: dto.adAccountId,
          },
        );
      }

      const run = this.dataRepo.createInsightRun(tx, {
        tenantId: dto.tenantId,
        adAccountId: dto.adAccountId,
        platformConnectionId: dto.platformConnectionId,
        dateStart: new Date(dto.dateStart),
        dateEnd: new Date(dto.dateEnd),
        metricCodesJson: {
          metrics: ['impressions', 'clicks', 'spend', 'conversions'],
        },
        statusConceptId: CONCEPTS.INSIGHT_RUN_RUNNING,
      });

      let rollupsCreated = 0;
      let rollupsUpdated = 0;
      let periodSpend = 0;

      for (const row of dto.rows) {
        const statDate = new Date(row.statDate);
        const entityTypeConceptId = ENTITY_TYPE_CONCEPT[row.entityType];

        this.dataRepo.createFactRow(tx, {
          insightQueryRunId: run.id,
          factDate: statDate,
          objectTypeConceptId: ENTITY_OBJECT_CONCEPT[row.entityType],
          externalObjectId: row.externalObjectId,
          campaignId:
            row.entityType === 'CAMPAIGN' ? row.entityRefId : undefined,
          adSetId: row.entityType === 'AD_SET' ? row.entityRefId : undefined,
          adId: row.entityType === 'AD' ? row.entityRefId : undefined,
          metricsJson: {
            impressions: row.impressions,
            clicks: row.clicks,
            spend: row.spend,
            conversions: row.conversions,
            conversionValue: row.conversionValue,
          },
        });

        const existing = await this.dataRepo.findInsightsDaily(
          tx,
          dto.adAccountId,
          entityTypeConceptId,
          row.entityRefId,
          statDate,
        );
        // El gasto acumulado sólo crece con el delta: reingerir un día ya
        // contabilizado no debe volver a sumarlo entero.
        const previousSpend = Number(existing?.spend ?? '0');
        periodSpend += Number(row.spend ?? '0') - previousSpend;

        if (existing) {
          existing.impressions = row.impressions;
          existing.clicks = row.clicks;
          existing.spend = row.spend;
          existing.conversions = row.conversions;
          existing.conversionValue = row.conversionValue;
          existing.recordedAt = new Date();
          existing.recordedByUserId = actor.id;
          rollupsUpdated += 1;
        } else {
          this.dataRepo.createInsightsDaily(tx, {
            adAccountId: dto.adAccountId,
            entityTypeConceptId,
            entityRefId: row.entityRefId,
            statDate,
            impressions: row.impressions,
            clicks: row.clicks,
            spend: row.spend,
            conversions: row.conversions,
            conversionValue: row.conversionValue,
            currencyConceptId:
              dto.currencyConceptId ?? account.currencyConceptId,
            recordedByUserId: actor.id,
          });
          rollupsCreated += 1;
        }

        this.dataRepo.createDeliverySnapshot(tx, {
          adAccountId: dto.adAccountId,
          entityTypeConceptId,
          entityRefId: row.entityRefId,
          effectiveStatusConceptId: CONCEPTS.AD_EFFECTIVE_ACTIVE,
          recordedByUserId: actor.id,
        });
      }

      if (dto.recordBillingEvent && periodSpend > 0) {
        this.dataRepo.createBillingEvent(tx, {
          adAccountId: dto.adAccountId,
          billingEventTypeConceptId: CONCEPTS.AD_BILLING_CHARGE,
          amount: this.round(periodSpend),
          currencyConceptId: dto.currencyConceptId ?? account.currencyConceptId,
          periodStart: new Date(dto.dateStart),
          periodEnd: new Date(dto.dateEnd),
          recordedByUserId: actor.id,
        });
      }

      const amountSpent = this.round(
        Number(account.amountSpent ?? '0') + periodSpend,
      );
      account.amountSpent = amountSpent;
      touch(account, actor.id);

      run.statusConceptId = CONCEPTS.INSIGHT_RUN_COMPLETED;
      run.completedAt = new Date();
      run.rowCount = String(dto.rows.length);

      const spendCapReached =
        account.spendCapAmount !== undefined &&
        Number(amountSpent) >= Number(account.spendCapAmount);
      if (spendCapReached) {
        this.logger.warn(
          {
            operation: 'ads.insights.ingest',
            adAccountId: dto.adAccountId,
            amountSpent,
          },
          'Ad account reached its spend cap',
        );
      }

      return {
        insightQueryRunId: run.id,
        factRows: dto.rows.length,
        rollupsCreated,
        rollupsUpdated,
        amountSpent,
        spendCapReached,
      };
    });
  }

  /**
   * UC-43-08: recibir una conversión server-side. Se deduplica contra el evento
   * del navegador y se aplica la política de datos antes de persistir nada
   * identificable.
   */
  async sendConversion(
    datasetId: string,
    dto: SendConversionDto,
    actor: AuthenticatedUser,
  ): Promise<SendConversionResponseDto> {
    this.logger.info(
      { operation: 'ads.conversion.send', datasetId, eventName: dto.eventName },
      'Receiving server-side conversion',
    );

    return this.em.transactional(async (tx) => {
      const dataset = await this.dataRepo.findDatasetById(tx, datasetId);
      if (!dataset) {
        throw new ResourceNotFoundException(
          'Dataset de conversión no encontrado',
          { datasetId },
        );
      }
      if (dataset.statusConceptId !== CONCEPTS.DATASET_ACTIVE) {
        throw new PreconditionFailedException(
          'El dataset de conversión no está activo',
          {
            datasetId,
          },
        );
      }

      // El pixel del navegador y el servidor mandan el mismo evento: sólo el
      // primero cuenta, el segundo sube el contador de duplicados.
      const dedup = await this.dataRepo.findDedupForUpdate(
        tx,
        datasetId,
        dto.eventName,
        dto.eventId,
      );
      if (dedup) {
        dedup.duplicateCount += 1;
        dedup.lastSeenAt = new Date();
        dedup.resolutionConceptId = CONCEPTS.DEDUP_DUPLICATE;
        return {
          eventId: dedup.serverConversionEventId,
          processingStatusConceptId: CONCEPTS.EVENT_ACCEPTED,
          duplicate: true,
          blocked: false,
          transformedFields: [],
        };
      }

      const policy = await this.dataRepo.findActiveEventPolicy(
        tx,
        dto.tenantId,
        CONCEPTS.STATE_ACTIVE,
      );
      // Sin consentimiento no se procesa lo que la política condiciona a él.
      if (policy?.requiresConsent && !dto.consentDirectiveId) {
        throw new PreconditionFailedException(
          'La política exige consentimiento y el evento no lo aporta',
          { datasetId, eventName: dto.eventName },
        );
      }

      const rules = policy
        ? await this.dataRepo.findFieldRules(
            tx,
            policy.id,
            CONCEPTS.STATE_ACTIVE,
          )
        : [];
      const verdict = this.applyPolicy(rules, dto.eventName);

      if (verdict.blocked) {
        this.logger.warn(
          {
            operation: 'ads.conversion.send',
            datasetId,
            eventName: dto.eventName,
          },
          'Conversion event blocked by data policy',
        );
        this.dataRepo.createBlockedEvent(tx, {
          tenantId: dto.tenantId,
          adEventDataPolicyId: policy!.id,
          sourceEventReference: dto.eventId,
          eventName: dto.eventName,
          reasonConceptId: CONCEPTS.BLOCKED_BY_POLICY,
          blockedFieldPathsJson: { fields: verdict.blockedFields },
          payloadHash: this.hash(dto.eventId),
        });
        const blockedEvent = this.dataRepo.createServerEvent(tx, {
          tenantId: dto.tenantId,
          conversionDatasetId: datasetId,
          eventName: dto.eventName,
          eventId: dto.eventId,
          eventTime: new Date(dto.eventTime),
          actionSourceConceptId: ACTION_SOURCE_CONCEPT[dto.actionSource],
          consentDirectiveId: dto.consentDirectiveId,
          processingStatusConceptId: CONCEPTS.EVENT_BLOCKED,
          blockedReasonConceptId: CONCEPTS.BLOCKED_BY_POLICY,
        });
        this.dataRepo.createDedup(tx, {
          conversionDatasetId: datasetId,
          eventName: dto.eventName,
          eventId: dto.eventId,
          serverConversionEventId: blockedEvent.id,
          resolutionConceptId: CONCEPTS.DEDUP_UNIQUE,
        });
        return {
          eventId: blockedEvent.id,
          processingStatusConceptId: CONCEPTS.EVENT_BLOCKED,
          duplicate: false,
          blocked: true,
          transformedFields: verdict.blockedFields,
        };
      }

      const event = this.dataRepo.createServerEvent(tx, {
        tenantId: dto.tenantId,
        conversionDatasetId: datasetId,
        eventName: dto.eventName,
        eventId: dto.eventId,
        eventTime: new Date(dto.eventTime),
        actionSourceConceptId: ACTION_SOURCE_CONCEPT[dto.actionSource],
        eventSourceUrl: dto.eventSourceUrl,
        externalOrderId: dto.customData?.orderId,
        paymentTransactionId: dto.paymentTransactionId,
        consentDirectiveId: dto.consentDirectiveId,
        processingStatusConceptId: CONCEPTS.EVENT_ACCEPTED,
      });

      if (dto.userData) {
        const dropped = new Set(verdict.droppedFields);
        this.dataRepo.createEventUserData(tx, {
          serverConversionEventId: event.id,
          // El identificador de usuario se persiste hasheado siempre, aunque
          // ninguna regla lo exija: aquí no entra identificación en claro.
          externalUserIdHash: dropped.has('user_data.external_user_id')
            ? undefined
            : dto.userData.externalUserIdHash,
          clientIpAddressEncrypted: dropped.has('user_data.client_ip_address')
            ? undefined
            : dto.userData.clientIpAddress,
          clientUserAgentEncrypted: dropped.has('user_data.client_user_agent')
            ? undefined
            : dto.userData.clientUserAgent,
          clickId: dto.userData.clickId,
          browserId: dto.userData.browserId,
        });
      }

      if (dto.customData) {
        this.dataRepo.createEventCustomData(tx, {
          serverConversionEventId: event.id,
          currencyCode: dto.customData.currencyCode,
          valueAmount: dto.customData.valueAmount,
          contentIdsJson: dto.customData.contentIdsJson,
          numItems: dto.customData.numItems,
          orderId: dto.customData.orderId,
        });
      }

      this.dataRepo.createDedup(tx, {
        conversionDatasetId: datasetId,
        eventName: dto.eventName,
        eventId: dto.eventId,
        serverConversionEventId: event.id,
        resolutionConceptId: CONCEPTS.DEDUP_UNIQUE,
      });

      if (dto.platformConnectionId) {
        this.dataRepo.createDeliveryAttempt(tx, {
          serverConversionEventId: event.id,
          platformConnectionId: dto.platformConnectionId,
          attemptNumber: 1,
          resultConceptId: CONCEPTS.DELIVERY_QUEUED,
        });
      }

      return {
        eventId: event.id,
        processingStatusConceptId: CONCEPTS.EVENT_ACCEPTED,
        duplicate: false,
        blocked: false,
        transformedFields: verdict.hashedFields,
      };
    });
  }

  /**
   * UC-43-09: subir conversiones offline. La tasa de coincidencia y el valor
   * atribuido son derivados: se recalculan sobre lo subido, no se aceptan.
   */
  async uploadOfflineConversions(
    dto: UploadOfflineConversionsDto,
    actor: AuthenticatedUser,
  ): Promise<OfflineUploadResponseDto> {
    this.logger.info(
      {
        operation: 'ads.offline.upload',
        adAccountId: dto.adAccountId,
        events: dto.events.length,
      },
      'Uploading offline conversions',
    );

    return this.em.transactional(async (tx) => {
      const account = await this.accountsRepo.findAdAccountById(
        tx,
        dto.adAccountId,
      );
      if (!account) {
        throw new ResourceNotFoundException(
          'Cuenta publicitaria no encontrada',
          {
            adAccountId: dto.adAccountId,
          },
        );
      }

      const set = this.dataRepo.createOfflineSet(tx, {
        adAccountId: dto.adAccountId,
        name: dto.name,
        uploadSourceConceptId:
          dto.uploadSource === 'FILE'
            ? CONCEPTS.UPLOAD_SOURCE_FILE
            : CONCEPTS.UPLOAD_SOURCE_API,
        fileId: dto.fileId,
        statusConceptId: CONCEPTS.OFFLINE_SET_PROCESSING,
        actorUserId: actor.id,
      });

      let matchedEvents = 0;
      let attributedValue = 0;

      for (const event of dto.events) {
        // Un evento cuenta como emparejado cuando trae la campaña a la que se
        // atribuye: sin ella no hay a qué imputar el valor.
        const isMatched = Boolean(event.attributedCampaignRefId);
        if (isMatched) {
          matchedEvents += 1;
          attributedValue += Number(event.valueAmount ?? '0');
        }
        this.dataRepo.createOfflineEvent(tx, {
          offlineConversionSetId: set.id,
          eventName: event.eventName,
          eventTime: event.eventTime ? new Date(event.eventTime) : undefined,
          matchKeysHashJson: event.matchKeysHashJson,
          valueAmount: event.valueAmount,
          currencyConceptId: dto.currencyConceptId,
          orderRef: event.orderRef,
          isMatched,
          attributedCampaignRefId: event.attributedCampaignRefId,
          recordedByUserId: actor.id,
        });
      }

      const matchRate = (matchedEvents / dto.events.length).toFixed(4);
      set.totalEvents = dto.events.length;
      set.matchedEvents = matchedEvents;
      set.matchRate = matchRate;
      set.attributedValue = this.round(attributedValue);
      set.statusConceptId = CONCEPTS.OFFLINE_SET_COMPLETED;
      touch(set, actor.id);

      return {
        offlineConversionSetId: set.id,
        totalEvents: dto.events.length,
        matchedEvents,
        matchRate,
        attributedValue: this.round(attributedValue),
        statusConceptId: CONCEPTS.OFFLINE_SET_COMPLETED,
      };
    });
  }

  /**
   * UC-43-13: correr el feed del catálogo. El upsert es idempotente por
   * `retailer_product_id` y los contadores (`item_count`, `product_count`) se
   * recalculan: son derivados.
   */
  async runFeed(
    catalogId: string,
    feedId: string,
    dto: RunFeedDto,
    actor: AuthenticatedUser,
  ): Promise<FeedRunResponseDto> {
    this.logger.info(
      {
        operation: 'ads.catalog.feed-run',
        catalogId,
        feedId,
        items: dto.items.length,
      },
      'Running catalog feed',
    );

    const startedAt = new Date();

    return this.em.transactional(async (tx) => {
      const catalog = await this.dataRepo.findCatalogForUpdate(tx, catalogId);
      if (!catalog) {
        throw new ResourceNotFoundException('Catálogo no encontrado', {
          catalogId,
        });
      }

      const feed = await this.dataRepo.findFeedForUpdate(tx, feedId);
      if (!feed) {
        throw new ResourceNotFoundException('Feed no encontrado', { feedId });
      }
      if (feed.productCatalogId !== catalogId) {
        throw new PreconditionFailedException(
          'El feed pertenece a otro catálogo',
          {
            catalogId,
            feedId,
          },
        );
      }
      if (feed.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El feed no está activo', {
          feedId,
        });
      }

      const dynamicSets = await this.dataRepo.findDynamicSets(tx, catalogId);

      let itemsCreated = 0;
      let itemsUpdated = 0;
      let setMembershipsAdded = 0;

      for (const item of dto.items) {
        const availabilityConceptId =
          item.availability === 'IN_STOCK'
            ? CONCEPTS.PRODUCT_IN_STOCK
            : CONCEPTS.PRODUCT_OUT_OF_STOCK;
        const conditionConceptId =
          item.condition === 'REFURBISHED'
            ? CONCEPTS.PRODUCT_CONDITION_REFURBISHED
            : CONCEPTS.PRODUCT_CONDITION_NEW;

        let product = await this.dataRepo.findProductByRetailerId(
          tx,
          catalogId,
          item.retailerProductId,
        );
        if (product) {
          product.title = item.title;
          product.description = item.description;
          product.availabilityConceptId = availabilityConceptId;
          product.conditionConceptId = conditionConceptId;
          product.price = item.price;
          product.brand = item.brand;
          product.imageUrl = item.imageUrl;
          product.linkUrl = item.linkUrl;
          product.inventoryCount = item.inventoryCount;
          touch(product, actor.id);
          itemsUpdated += 1;
        } else {
          product = this.dataRepo.createProduct(tx, {
            productCatalogId: catalogId,
            retailerProductId: item.retailerProductId,
            title: item.title,
            description: item.description,
            availabilityConceptId,
            conditionConceptId,
            price: item.price,
            currencyConceptId:
              dto.currencyConceptId ?? catalog.defaultCurrencyConceptId,
            brand: item.brand,
            imageUrl: item.imageUrl,
            linkUrl: item.linkUrl,
            inventoryCount: item.inventoryCount,
            statusConceptId: CONCEPTS.PRODUCT_ACTIVE,
            actorUserId: actor.id,
          });
          itemsCreated += 1;
        }

        // Los conjuntos dinámicos incorporan lo nuevo; el filtro concreto lo
        // evalúa quien define el conjunto, aquí sólo se garantiza pertenencia.
        for (const set of dynamicSets) {
          const member = await this.dataRepo.findSetMember(
            tx,
            set.id,
            product.id,
          );
          if (member) continue;
          this.dataRepo.createSetMember(tx, {
            productSetId: set.id,
            catalogProductId: product.id,
            actorUserId: actor.id,
          });
          setMembershipsAdded += 1;
        }
      }

      for (const set of dynamicSets) {
        set.productCount = await this.dataRepo.countSetMembers(tx, set.id);
        touch(set, actor.id);
      }

      const catalogItemCount = await this.dataRepo.countProducts(tx, catalogId);
      catalog.itemCount = catalogItemCount;
      touch(catalog, actor.id);

      feed.lastRunAt = new Date();
      feed.lastStatusConceptId = CONCEPTS.FEED_RUN_SUCCEEDED;
      feed.totalItems = dto.items.length;
      feed.errorCount = 0;
      touch(feed, actor.id);

      const log = this.dataRepo.createFeedRunLog(tx, {
        catalogFeedId: feedId,
        statusConceptId: CONCEPTS.FEED_RUN_SUCCEEDED,
        itemsRead: dto.items.length,
        itemsUpserted: itemsCreated + itemsUpdated,
        itemsErrored: 0,
        startedAt,
        recordedByUserId: actor.id,
      });

      return {
        feedRunLogId: log.id,
        itemsRead: dto.items.length,
        itemsCreated,
        itemsUpdated,
        setMembershipsAdded,
        catalogItemCount,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Evalúa las reglas de campo contra el evento. Una regla `BLOCK` que aplique
   * tumba el evento entero; `HASH` y `DROP` sólo afectan a su campo.
   */
  private applyPolicy(
    rules: AdEventFieldRules[],
    eventName: string,
  ): {
    /**
     * Valor de blocked mantenido por la instancia.
     */
    blocked: boolean;
    /**
     * Valor de blocked fields mantenido por la instancia.
     */
    blockedFields: string[];
    /**
     * Valor de hashed fields mantenido por la instancia.
     */
    hashedFields: string[];
    /**
     * Valor de dropped fields mantenido por la instancia.
     */
    droppedFields: string[];
  } {
    const applicable = rules.filter((rule) =>
      this.matchesEvent(rule.eventNamePattern, eventName),
    );

    const blockedFields = applicable
      .filter((r) => r.actionConceptId === CONCEPTS.FIELD_ACTION_BLOCK)
      .map((r) => r.fieldPath);
    const hashedFields = applicable
      .filter((r) => r.actionConceptId === CONCEPTS.FIELD_ACTION_HASH)
      .map((r) => r.fieldPath);
    const droppedFields = applicable
      .filter((r) => r.actionConceptId === CONCEPTS.FIELD_ACTION_DROP)
      .map((r) => r.fieldPath);

    return {
      blocked: blockedFields.length > 0,
      blockedFields,
      hashedFields: hashedFields.filter((f) =>
        (TRANSFORMABLE_FIELDS as readonly string[]).includes(f),
      ),
      droppedFields,
    };
  }

  /** El patrón admite `*` como comodín de sufijo; el resto es coincidencia exacta. */
  private matchesEvent(pattern: string, eventName: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('*'))
      return eventName.startsWith(pattern.slice(0, -1));
    return pattern === eventName;
  }

  /**
   * Obtiene hash.
   *
   * @param value - Valor de value requerido por la operación.
   * @returns Resultado de hash conforme al contrato `string`.
   */
  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  /** Los importes se transportan como cadena decimal con 2 decimales. */
  private round(value: number): string {
    return value.toFixed(2);
  }
}
