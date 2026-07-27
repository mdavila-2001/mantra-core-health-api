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

export interface CreateCampaignData {
  adAccountId: string;
  name: string;
  objectiveConceptId: string;
  buyingTypeConceptId: string;
  specialAdCategoriesJson?: unknown;
  dailyBudget?: string;
  lifetimeBudget?: string;
  spendCap?: string;
  bidStrategyConceptId?: string;
  startAt?: Date;
  stopAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateAdSetData {
  campaignId: string;
  name: string;
  optimizationGoalConceptId: string;
  billingEventConceptId: string;
  bidAmount?: string;
  bidStrategyConceptId?: string;
  dailyBudget?: string;
  lifetimeBudget?: string;
  targetingSpecId?: string;
  promotedObjectJson?: unknown;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateCreativeData {
  adAccountId: string;
  name: string;
  formatConceptId: string;
  body?: string;
  callToActionConceptId?: string;
  linkUrl?: string;
  displayUrl?: string;
  objectStoryJson?: unknown;
  primaryMediaFileId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateTargetingSpecData {
  adAccountId: string;
  name?: string;
  geoLocationsJson?: unknown;
  excludedGeoLocationsJson?: unknown;
  ageMin?: number;
  ageMax?: number;
  gendersJson?: unknown;
  interestsJson?: unknown;
  behaviorsJson?: unknown;
  customAudienceIdsJson?: unknown;
  localesJson?: unknown;
  devicePlatformsJson?: unknown;
  actorUserId?: string;
}

export interface CreateBudgetScheduleData {
  entityTypeConceptId: string;
  entityRefId: string;
  budgetTypeConceptId: string;
  amount: string;
  currencyConceptId: string;
  validFrom: Date;
  validTo?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a la jerarquía de campaña de `ads.*`: campañas, conjuntos, ubicaciones,
 * creativos, anuncios, segmentación, audiencias y presupuesto.
 */
@Injectable()
export class AdsCampaignsRepository {
  // --- Jerarquía (UC-43-04) ---

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

  findCampaignById(em: EntityManager, id: string): Promise<Campaigns | null> {
    return em.findOne(Campaigns, { id });
  }

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

  findAdSetById(em: EntityManager, id: string): Promise<AdSets | null> {
    return em.findOne(AdSets, { id });
  }

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

  createPlacement(
    em: EntityManager,
    data: {
      adSetId: string;
      platformConceptId: string;
      positionConceptId: string;
      deviceConceptId?: string;
      isEnabled: boolean;
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

  createCreativeAsset(
    em: EntityManager,
    data: {
      adCreativeId: string;
      assetTypeConceptId: string;
      fileId?: string;
      externalAssetRef?: string;
      hash?: string;
      width?: number;
      height?: number;
      durationS?: number;
      ordinal: number;
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

  createAd(
    em: EntityManager,
    data: {
      adSetId: string;
      name: string;
      creativeId: string;
      trackingSpecsJson?: unknown;
      conversionDomain?: string;
      statusConceptId: string;
      effectiveStatusConceptId: string;
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

  findAdById(em: EntityManager, id: string): Promise<Ads | null> {
    return em.findOne(Ads, { id });
  }

  findAdForUpdate(em: EntityManager, id: string): Promise<Ads | null> {
    return em.findOne(Ads, { id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  }

  // --- Segmentación y audiencias (UC-43-05) ---

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

  findTargetingSpecById(
    em: EntityManager,
    id: string,
  ): Promise<TargetingSpecs | null> {
    return em.findOne(TargetingSpecs, { id });
  }

  createCustomAudience(
    em: EntityManager,
    data: {
      adAccountId: string;
      name: string;
      audienceTypeConceptId: string;
      sourceConceptId?: string;
      ruleJson?: unknown;
      dataSourcePixelId?: string;
      statusConceptId: string;
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

  findCustomAudienceById(
    em: EntityManager,
    id: string,
  ): Promise<CustomAudiences | null> {
    return em.findOne(CustomAudiences, { id });
  }

  createSavedAudience(
    em: EntityManager,
    data: {
      adAccountId: string;
      name: string;
      targetingSpecJson?: unknown;
      statusConceptId: string;
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

  createLookalikeSpec(
    em: EntityManager,
    data: {
      adAccountId: string;
      sourceAudienceId: string;
      countryConceptId: string;
      ratioPercent: string;
      statusConceptId: string;
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

  upsertAttributionSettings(
    em: EntityManager,
    existing: AttributionSettings | null,
    data: {
      adAccountId: string;
      clickWindowDays: number;
      viewWindowDays: number;
      attributionModelConceptId?: string;
      isDefault: boolean;
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
      adSetId: string;
      learningStatusConceptId: string;
      optimizationEventsCount?: string;
      estimatedLearningExitAt?: Date;
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
