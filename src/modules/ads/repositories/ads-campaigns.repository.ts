import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Campaigns,
  AdSets,
  AdPlacements,
  AdCreatives,
  CreativeAssets,
  Ads,
  TargetingSpecs,
  CustomAudiences,
  SavedAudiences,
  LookalikeSpecs,
  BudgetSchedules,
  AttributionSettings,
  AdsetLearningSnapshots,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create campaign data.
 */
export interface CreateCampaignData {
  /**
   * Identificador asociado a ad account.
   */
  adAccountId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a objective concept.
   */
  objectiveConceptId: string;
  /**
   * Identificador asociado a buying type concept.
   */
  buyingTypeConceptId: string;
  /**
   * Valor de special ad categories json mantenido por la instancia.
   */
  specialAdCategoriesJson?: unknown;
  /**
   * Valor de daily budget mantenido por la instancia.
   */
  dailyBudget?: string;
  /**
   * Valor de lifetime budget mantenido por la instancia.
   */
  lifetimeBudget?: string;
  /**
   * Valor de spend cap mantenido por la instancia.
   */
  spendCap?: string;
  /**
   * Identificador asociado a bid strategy concept.
   */
  bidStrategyConceptId?: string;
  /**
   * Valor de start at mantenido por la instancia.
   */
  startAt?: Date;
  /**
   * Valor de stop at mantenido por la instancia.
   */
  stopAt?: Date;
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
 * Describe el contrato estructural de create ad set data.
 */
export interface CreateAdSetData {
  /**
   * Identificador asociado a campaign.
   */
  campaignId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a optimization goal concept.
   */
  optimizationGoalConceptId: string;
  /**
   * Identificador asociado a billing event concept.
   */
  billingEventConceptId: string;
  /**
   * Valor de bid amount mantenido por la instancia.
   */
  bidAmount?: string;
  /**
   * Identificador asociado a bid strategy concept.
   */
  bidStrategyConceptId?: string;
  /**
   * Valor de daily budget mantenido por la instancia.
   */
  dailyBudget?: string;
  /**
   * Valor de lifetime budget mantenido por la instancia.
   */
  lifetimeBudget?: string;
  /**
   * Identificador asociado a targeting spec.
   */
  targetingSpecId?: string;
  /**
   * Valor de promoted object json mantenido por la instancia.
   */
  promotedObjectJson?: unknown;
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
 * Describe el contrato estructural de create creative data.
 */
export interface CreateCreativeData {
  /**
   * Identificador asociado a ad account.
   */
  adAccountId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a format concept.
   */
  formatConceptId: string;
  /**
   * Valor de body mantenido por la instancia.
   */
  body?: string;
  /**
   * Identificador asociado a call to action concept.
   */
  callToActionConceptId?: string;
  /**
   * Valor de link url mantenido por la instancia.
   */
  linkUrl?: string;
  /**
   * Valor de display url mantenido por la instancia.
   */
  displayUrl?: string;
  /**
   * Valor de object story json mantenido por la instancia.
   */
  objectStoryJson?: unknown;
  /**
   * Identificador asociado a primary media file.
   */
  primaryMediaFileId?: string;
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
 * Describe el contrato estructural de create targeting spec data.
 */
export interface CreateTargetingSpecData {
  /**
   * Identificador asociado a ad account.
   */
  adAccountId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name?: string;
  /**
   * Valor de geo locations json mantenido por la instancia.
   */
  geoLocationsJson?: unknown;
  /**
   * Valor de excluded geo locations json mantenido por la instancia.
   */
  excludedGeoLocationsJson?: unknown;
  /**
   * Valor de age min mantenido por la instancia.
   */
  ageMin?: number;
  /**
   * Valor de age max mantenido por la instancia.
   */
  ageMax?: number;
  /**
   * Valor de genders json mantenido por la instancia.
   */
  gendersJson?: unknown;
  /**
   * Valor de interests json mantenido por la instancia.
   */
  interestsJson?: unknown;
  /**
   * Valor de behaviors json mantenido por la instancia.
   */
  behaviorsJson?: unknown;
  /**
   * Valor de custom audience ids json mantenido por la instancia.
   */
  customAudienceIdsJson?: unknown;
  /**
   * Valor de locales json mantenido por la instancia.
   */
  localesJson?: unknown;
  /**
   * Valor de device platforms json mantenido por la instancia.
   */
  devicePlatformsJson?: unknown;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create budget schedule data.
 */
export interface CreateBudgetScheduleData {
  /**
   * Identificador asociado a entity type concept.
   */
  entityTypeConceptId: string;
  /**
   * Identificador asociado a entity ref.
   */
  entityRefId: string;
  /**
   * Identificador asociado a budget type concept.
   */
  budgetTypeConceptId: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
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
 * Acceso a la jerarquía de campaña de `ads.*`: campañas, conjuntos, ubicaciones,
 * creativos, anuncios, segmentación, audiencias y presupuesto.
 */
@Injectable()
export class AdsCampaignsRepository {
  // --- Jerarquía (UC-43-04) ---

  /**
   * Crea create campaign.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create campaign conforme al contrato `Campaigns`.
   */
  createCampaign(em: EntityManager, data: CreateCampaignData): Campaigns {
    return em.create(
      Campaigns,
      {
        adAccountId: data.adAccountId,
        name: data.name,
        objectiveConceptId: data.objectiveConceptId,
        buyingTypeConceptId: data.buyingTypeConceptId,
        specialAdCategoriesJson: data.specialAdCategoriesJson,
        dailyBudget: data.dailyBudget,
        lifetimeBudget: data.lifetimeBudget,
        spendCap: data.spendCap,
        bidStrategyConceptId: data.bidStrategyConceptId,
        startAt: data.startAt,
        stopAt: data.stopAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find campaign by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find campaign by id conforme al contrato `Promise<Campaigns | null>`.
   */
  findCampaignById(em: EntityManager, id: string): Promise<Campaigns | null> {
    return em.findOne(Campaigns, { id });
  }

  /**
   * Obtiene find campaign for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find campaign for update conforme al contrato `Promise<Campaigns | null>`.
   */
  findCampaignForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Campaigns | null> {
    return em.findOne(
      Campaigns,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Crea create ad set.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create ad set conforme al contrato `AdSets`.
   */
  createAdSet(em: EntityManager, data: CreateAdSetData): AdSets {
    return em.create(
      AdSets,
      {
        campaignId: data.campaignId,
        name: data.name,
        optimizationGoalConceptId: data.optimizationGoalConceptId,
        billingEventConceptId: data.billingEventConceptId,
        bidAmount: data.bidAmount,
        bidStrategyConceptId: data.bidStrategyConceptId,
        dailyBudget: data.dailyBudget,
        lifetimeBudget: data.lifetimeBudget,
        targetingSpecId: data.targetingSpecId,
        promotedObjectJson: data.promotedObjectJson,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find ad set by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find ad set by id conforme al contrato `Promise<AdSets | null>`.
   */
  findAdSetById(em: EntityManager, id: string): Promise<AdSets | null> {
    return em.findOne(AdSets, { id });
  }

  /**
   * Obtiene find ad set for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find ad set for update conforme al contrato `Promise<AdSets | null>`.
   */
  findAdSetForUpdate(em: EntityManager, id: string): Promise<AdSets | null> {
    return em.findOne(AdSets, { id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  }

  /**
   * Conjuntos de la campaña tomados con SKIP LOCKED: la evaluación de reglas
   * corre en paralelo por cuenta y no debe esperar a otra pasada.
   */
  findAdSetsForRule(em: EntityManager, campaignId: string): Promise<AdSets[]> {
    return em.find(
      AdSets,
      { campaignId },
      { lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE },
    );
  }

  /**
   * Crea create placement.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create placement conforme al contrato `AdPlacements`.
   */
  createPlacement(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad set.
       */
      adSetId: string;
      /**
       * Identificador asociado a platform concept.
       */
      platformConceptId: string;
      /**
       * Identificador asociado a position concept.
       */
      positionConceptId: string;
      /**
       * Identificador asociado a device concept.
       */
      deviceConceptId?: string;
      /**
       * Valor de is enabled mantenido por la instancia.
       */
      isEnabled: boolean;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AdPlacements {
    return em.create(
      AdPlacements,
      {
        adSetId: data.adSetId,
        platformConceptId: data.platformConceptId,
        positionConceptId: data.positionConceptId,
        deviceConceptId: data.deviceConceptId,
        isEnabled: data.isEnabled,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create creative.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create creative conforme al contrato `AdCreatives`.
   */
  createCreative(em: EntityManager, data: CreateCreativeData): AdCreatives {
    return em.create(
      AdCreatives,
      {
        adAccountId: data.adAccountId,
        name: data.name,
        formatConceptId: data.formatConceptId,
        body: data.body,
        callToActionConceptId: data.callToActionConceptId,
        linkUrl: data.linkUrl,
        displayUrl: data.displayUrl,
        objectStoryJson: data.objectStoryJson,
        primaryMediaFileId: data.primaryMediaFileId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create creative asset.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create creative asset conforme al contrato `CreativeAssets`.
   */
  createCreativeAsset(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad creative.
       */
      adCreativeId: string;
      /**
       * Identificador asociado a asset type concept.
       */
      assetTypeConceptId: string;
      /**
       * Identificador asociado a file.
       */
      fileId?: string;
      /**
       * Valor de external asset ref mantenido por la instancia.
       */
      externalAssetRef?: string;
      /**
       * Valor de hash mantenido por la instancia.
       */
      hash?: string;
      /**
       * Valor de width mantenido por la instancia.
       */
      width?: number;
      /**
       * Valor de height mantenido por la instancia.
       */
      height?: number;
      /**
       * Valor de duration s mantenido por la instancia.
       */
      durationS?: number;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal: number;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): CreativeAssets {
    return em.create(
      CreativeAssets,
      {
        adCreativeId: data.adCreativeId,
        assetTypeConceptId: data.assetTypeConceptId,
        fileId: data.fileId,
        externalAssetRef: data.externalAssetRef,
        hash: data.hash,
        width: data.width,
        height: data.height,
        durationS: data.durationS,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create ad.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create ad conforme al contrato `Ads`.
   */
  createAd(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad set.
       */
      adSetId: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Identificador asociado a creative.
       */
      creativeId: string;
      /**
       * Valor de tracking specs json mantenido por la instancia.
       */
      trackingSpecsJson?: unknown;
      /**
       * Valor de conversion domain mantenido por la instancia.
       */
      conversionDomain?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a effective status concept.
       */
      effectiveStatusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): Ads {
    return em.create(
      Ads,
      {
        adSetId: data.adSetId,
        name: data.name,
        creativeId: data.creativeId,
        trackingSpecsJson: data.trackingSpecsJson,
        conversionDomain: data.conversionDomain,
        statusConceptId: data.statusConceptId,
        effectiveStatusConceptId: data.effectiveStatusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find ad by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find ad by id conforme al contrato `Promise<Ads | null>`.
   */
  findAdById(em: EntityManager, id: string): Promise<Ads | null> {
    return em.findOne(Ads, { id });
  }

  /**
   * Obtiene find ad for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find ad for update conforme al contrato `Promise<Ads | null>`.
   */
  findAdForUpdate(em: EntityManager, id: string): Promise<Ads | null> {
    return em.findOne(Ads, { id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  }

  // --- Segmentación y audiencias (UC-43-05) ---

  /**
   * Crea create targeting spec.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create targeting spec conforme al contrato `TargetingSpecs`.
   */
  createTargetingSpec(
    em: EntityManager,
    data: CreateTargetingSpecData,
  ): TargetingSpecs {
    return em.create(
      TargetingSpecs,
      {
        adAccountId: data.adAccountId,
        name: data.name,
        geoLocationsJson: data.geoLocationsJson,
        excludedGeoLocationsJson: data.excludedGeoLocationsJson,
        ageMin: data.ageMin,
        ageMax: data.ageMax,
        gendersJson: data.gendersJson,
        interestsJson: data.interestsJson,
        behaviorsJson: data.behaviorsJson,
        customAudienceIdsJson: data.customAudienceIdsJson,
        localesJson: data.localesJson,
        devicePlatformsJson: data.devicePlatformsJson,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find targeting spec by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find targeting spec by id conforme al contrato `Promise<TargetingSpecs | null>`.
   */
  findTargetingSpecById(
    em: EntityManager,
    id: string,
  ): Promise<TargetingSpecs | null> {
    return em.findOne(TargetingSpecs, { id });
  }

  /**
   * Crea create custom audience.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create custom audience conforme al contrato `CustomAudiences`.
   */
  createCustomAudience(
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
       * Identificador asociado a audience type concept.
       */
      audienceTypeConceptId: string;
      /**
       * Identificador asociado a source concept.
       */
      sourceConceptId?: string;
      /**
       * Valor de rule json mantenido por la instancia.
       */
      ruleJson?: unknown;
      /**
       * Identificador asociado a data source pixel.
       */
      dataSourcePixelId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): CustomAudiences {
    return em.create(
      CustomAudiences,
      {
        adAccountId: data.adAccountId,
        name: data.name,
        audienceTypeConceptId: data.audienceTypeConceptId,
        sourceConceptId: data.sourceConceptId,
        ruleJson: data.ruleJson,
        dataSourcePixelId: data.dataSourcePixelId,
        // El tamaño aproximado lo publica la plataforma: derivado, nace en cero.
        approximateCount: '0',
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find custom audience by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find custom audience by id conforme al contrato `Promise<CustomAudiences | null>`.
   */
  findCustomAudienceById(
    em: EntityManager,
    id: string,
  ): Promise<CustomAudiences | null> {
    return em.findOne(CustomAudiences, { id });
  }

  /**
   * Crea create saved audience.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create saved audience conforme al contrato `SavedAudiences`.
   */
  createSavedAudience(
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
       * Valor de targeting spec json mantenido por la instancia.
       */
      targetingSpecJson?: unknown;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): SavedAudiences {
    return em.create(
      SavedAudiences,
      {
        adAccountId: data.adAccountId,
        name: data.name,
        targetingSpecJson: data.targetingSpecJson,
        approximateReach: '0',
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create lookalike spec.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create lookalike spec conforme al contrato `LookalikeSpecs`.
   */
  createLookalikeSpec(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad account.
       */
      adAccountId: string;
      /**
       * Identificador asociado a source audience.
       */
      sourceAudienceId: string;
      /**
       * Identificador asociado a country concept.
       */
      countryConceptId: string;
      /**
       * Valor de ratio percent mantenido por la instancia.
       */
      ratioPercent: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): LookalikeSpecs {
    return em.create(
      LookalikeSpecs,
      {
        adAccountId: data.adAccountId,
        sourceAudienceId: data.sourceAudienceId,
        countryConceptId: data.countryConceptId,
        ratioPercent: data.ratioPercent,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Presupuesto y aprendizaje (UC-43-16) ---

  /**
   * Crea create budget schedule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create budget schedule conforme al contrato `BudgetSchedules`.
   */
  createBudgetSchedule(
    em: EntityManager,
    data: CreateBudgetScheduleData,
  ): BudgetSchedules {
    return em.create(
      BudgetSchedules,
      {
        entityTypeConceptId: data.entityTypeConceptId,
        entityRefId: data.entityRefId,
        budgetTypeConceptId: data.budgetTypeConceptId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Tramos activos de la entidad. El servicio comprueba el solape en memoria
   * antes de chocar con el índice GIST sobre `tstzrange(valid_from, valid_to)`.
   */
  findActiveSchedules(
    em: EntityManager,
    entityTypeConceptId: string,
    entityRefId: string,
    activeStatusConceptId: string,
  ): Promise<BudgetSchedules[]> {
    return em.find(BudgetSchedules, {
      entityTypeConceptId,
      entityRefId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /**
   * Ejecuta la operación upsert attribution settings.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param existing - Valor de existing requerido por la operación.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de upsert attribution settings conforme al contrato `AttributionSettings`.
   */
  upsertAttributionSettings(
    em: EntityManager,
    existing: AttributionSettings | null,
    data: {
      /**
       * Identificador asociado a ad account.
       */
      adAccountId: string;
      /**
       * Valor de click window days mantenido por la instancia.
       */
      clickWindowDays: number;
      /**
       * Valor de view window days mantenido por la instancia.
       */
      viewWindowDays: number;
      /**
       * Identificador asociado a attribution model concept.
       */
      attributionModelConceptId?: string;
      /**
       * Valor de is default mantenido por la instancia.
       */
      isDefault: boolean;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AttributionSettings {
    if (existing) {
      existing.clickWindowDays = data.clickWindowDays;
      existing.viewWindowDays = data.viewWindowDays;
      existing.attributionModelConceptId = data.attributionModelConceptId;
      return existing;
    }
    return em.create(
      AttributionSettings,
      {
        adAccountId: data.adAccountId,
        clickWindowDays: data.clickWindowDays,
        viewWindowDays: data.viewWindowDays,
        attributionModelConceptId: data.attributionModelConceptId,
        isDefault: data.isDefault,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find default attribution settings.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param adAccountId - Identificador de ad account.
   * @returns Resultado de find default attribution settings conforme al contrato `Promise<AttributionSettings | null>`.
   */
  findDefaultAttributionSettings(
    em: EntityManager,
    adAccountId: string,
  ): Promise<AttributionSettings | null> {
    return em.findOne(AttributionSettings, { adAccountId, isDefault: true });
  }

  /** Instantánea de aprendizaje: log inmutable de la fase del conjunto. */
  createLearningSnapshot(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad set.
       */
      adSetId: string;
      /**
       * Identificador asociado a learning status concept.
       */
      learningStatusConceptId: string;
      /**
       * Valor de optimization events count mantenido por la instancia.
       */
      optimizationEventsCount?: string;
      /**
       * Valor de estimated learning exit at mantenido por la instancia.
       */
      estimatedLearningExitAt?: Date;
      /**
       * Valor de recommendations json mantenido por la instancia.
       */
      recommendationsJson?: unknown;
    },
  ): AdsetLearningSnapshots {
    return em.create(
      AdsetLearningSnapshots,
      {
        adSetId: data.adSetId,
        measuredAt: new Date(),
        learningStatusConceptId: data.learningStatusConceptId,
        optimizationEventsCount: data.optimizationEventsCount,
        estimatedLearningExitAt: data.estimatedLearningExitAt,
        recommendationsJson: data.recommendationsJson,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
