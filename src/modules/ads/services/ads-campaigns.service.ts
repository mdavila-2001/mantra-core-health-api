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
import { AdsAccountsRepository, AdsCampaignsRepository } from '../repositories';
import { PLATFORM_CONCEPT } from './ads-accounts.service';
import {
  LaunchCampaignDto,
  LaunchCampaignResponseDto,
  CreateTargetingDto,
  TargetingResponseDto,
  AssignIdentityDto,
  AssignIdentityResponseDto,
  CreateBudgetScheduleDto,
  BudgetScheduleResponseDto,
  type AdObjective,
  type BuyingType,
  type BidStrategy,
  type OptimizationGoal,
  type AdBillingEvent,
  type PlacementPosition,
  type CreativeFormat,
  type AudienceSource,
} from '../dto';

const OBJECTIVE_CONCEPT: Readonly<Record<AdObjective, string>> = {
  AWARENESS: CONCEPTS.AD_OBJECTIVE_AWARENESS,
  TRAFFIC: CONCEPTS.AD_OBJECTIVE_TRAFFIC,
  CONVERSIONS: CONCEPTS.AD_OBJECTIVE_CONVERSIONS,
  LEADS: CONCEPTS.AD_OBJECTIVE_LEADS,
};

const BUYING_TYPE_CONCEPT: Readonly<Record<BuyingType, string>> = {
  AUCTION: CONCEPTS.BUYING_AUCTION,
  RESERVED: CONCEPTS.BUYING_RESERVED,
};

const BID_STRATEGY_CONCEPT: Readonly<Record<BidStrategy, string>> = {
  LOWEST_COST: CONCEPTS.BID_LOWEST_COST,
  COST_CAP: CONCEPTS.BID_COST_CAP,
  BID_CAP: CONCEPTS.BID_BID_CAP,
};

const OPT_GOAL_CONCEPT: Readonly<Record<OptimizationGoal, string>> = {
  LINK_CLICKS: CONCEPTS.OPT_GOAL_LINK_CLICKS,
  IMPRESSIONS: CONCEPTS.OPT_GOAL_IMPRESSIONS,
  CONVERSIONS: CONCEPTS.OPT_GOAL_CONVERSIONS,
};

const BILLING_EVENT_CONCEPT: Readonly<Record<AdBillingEvent, string>> = {
  IMPRESSIONS: CONCEPTS.BILLING_EVENT_IMPRESSIONS,
  CLICKS: CONCEPTS.BILLING_EVENT_CLICKS,
};

const POSITION_CONCEPT: Readonly<Record<PlacementPosition, string>> = {
  FEED: CONCEPTS.PLACEMENT_FEED,
  STORY: CONCEPTS.PLACEMENT_STORY,
  REELS: CONCEPTS.PLACEMENT_REELS,
};

const CREATIVE_FORMAT_CONCEPT: Readonly<Record<CreativeFormat, string>> = {
  SINGLE_IMAGE: CONCEPTS.CREATIVE_SINGLE_IMAGE,
  VIDEO: CONCEPTS.CREATIVE_VIDEO,
  CAROUSEL: CONCEPTS.CREATIVE_CAROUSEL,
};

const AUDIENCE_SOURCE_CONCEPT: Readonly<Record<AudienceSource, string>> = {
  PIXEL: CONCEPTS.AUDIENCE_SOURCE_PIXEL,
  CUSTOMER_LIST: CONCEPTS.AUDIENCE_SOURCE_LIST,
  ENGAGEMENT: CONCEPTS.AUDIENCE_SOURCE_ENGAGEMENT,
};

const ASSET_TYPE_CONCEPT: Readonly<Record<'IMAGE' | 'VIDEO', string>> = {
  IMAGE: CONCEPTS.ASSET_TYPE_IMAGE,
  VIDEO: CONCEPTS.ASSET_TYPE_VIDEO,
};

const DEFAULT_CLICK_WINDOW_DAYS = 7;
const DEFAULT_VIEW_WINDOW_DAYS = 1;

/**
 * Jerarquía de campaña, segmentación, identidad y presupuesto
 * (UC-43-04, UC-43-05, UC-43-16).
 */
@Injectable()
export class AdsCampaignsService {
  constructor(
    private readonly em: EntityManager,
    private readonly campaignsRepo: AdsCampaignsRepository,
    private readonly accountsRepo: AdsAccountsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdsCampaignsService.name);
  }

  /**
   * UC-43-04: crear campaña, conjuntos, creativos y anuncios en una sola
   * transacción. Todo nace **pausado** y el anuncio en revisión: publicar es un
   * acto aparte, y una jerarquía a medias no debe empezar a gastar.
   */
  async launchCampaign(
    adAccountId: string,
    dto: LaunchCampaignDto,
    actor: AuthenticatedUser,
  ): Promise<LaunchCampaignResponseDto> {
    this.logger.info(
      {
        operation: 'ads.campaign.launch',
        adAccountId,
        adSets: dto.adSets.length,
      },
      'Launching ad campaign',
    );

    const startAt = dto.startAt ? new Date(dto.startAt) : undefined;
    const stopAt = dto.stopAt ? new Date(dto.stopAt) : undefined;
    if (startAt && stopAt && stopAt <= startAt) {
      throw new PreconditionFailedException(
        'La campaña debe terminar después de empezar',
        {
          startAt: dto.startAt,
          stopAt: dto.stopAt,
        },
      );
    }
    if (
      !dto.dailyBudget &&
      !dto.lifetimeBudget &&
      !dto.adSets.some((s) => s.dailyBudget || s.lifetimeBudget)
    ) {
      throw new PreconditionFailedException(
        'La campaña o sus conjuntos necesitan presupuesto',
        { adAccountId },
      );
    }

    return this.em.transactional(async (tx) => {
      const account = await this.accountsRepo.findAdAccountById(
        tx,
        adAccountId,
      );
      if (!account) {
        throw new ResourceNotFoundException(
          'Cuenta publicitaria no encontrada',
          { adAccountId },
        );
      }
      if (account.accountStatusConceptId !== CONCEPTS.AD_ACCOUNT_ACTIVE) {
        throw new PreconditionFailedException(
          'La cuenta publicitaria no está activa',
          {
            adAccountId,
          },
        );
      }
      // Gastar por encima del tope es lo que el tope existe para impedir.
      if (
        account.spendCapAmount &&
        Number(account.amountSpent ?? '0') >= Number(account.spendCapAmount)
      ) {
        throw new PreconditionFailedException(
          'La cuenta agotó su tope de gasto',
          {
            adAccountId,
            spendCapAmount: account.spendCapAmount,
          },
        );
      }

      const campaign = this.campaignsRepo.createCampaign(tx, {
        adAccountId,
        name: dto.name,
        objectiveConceptId: OBJECTIVE_CONCEPT[dto.objective],
        buyingTypeConceptId: BUYING_TYPE_CONCEPT[dto.buyingType],
        dailyBudget: dto.dailyBudget,
        lifetimeBudget: dto.lifetimeBudget,
        spendCap: dto.spendCap,
        bidStrategyConceptId: dto.bidStrategy
          ? BID_STRATEGY_CONCEPT[dto.bidStrategy]
          : undefined,
        startAt,
        stopAt,
        statusConceptId: CONCEPTS.AD_STATUS_PAUSED,
        actorUserId: actor.id,
      });

      const adSetIds: string[] = [];
      const adIds: string[] = [];

      for (const spec of dto.adSets) {
        if (spec.targetingSpecId) {
          const targeting = await this.campaignsRepo.findTargetingSpecById(
            tx,
            spec.targetingSpecId,
          );
          if (!targeting) {
            throw new ResourceNotFoundException('Segmentación no encontrada', {
              targetingSpecId: spec.targetingSpecId,
            });
          }
        }

        const adSet = this.campaignsRepo.createAdSet(tx, {
          campaignId: campaign.id,
          name: spec.name,
          optimizationGoalConceptId: OPT_GOAL_CONCEPT[spec.optimizationGoal],
          billingEventConceptId: BILLING_EVENT_CONCEPT[spec.billingEvent],
          bidAmount: spec.bidAmount,
          dailyBudget: spec.dailyBudget,
          lifetimeBudget: spec.lifetimeBudget,
          targetingSpecId: spec.targetingSpecId,
          statusConceptId: CONCEPTS.AD_STATUS_PAUSED,
          actorUserId: actor.id,
        });
        adSetIds.push(adSet.id);

        for (const placement of spec.placements ?? []) {
          this.campaignsRepo.createPlacement(tx, {
            adSetId: adSet.id,
            platformConceptId: PLATFORM_CONCEPT[placement.platform],
            positionConceptId: POSITION_CONCEPT[placement.position],
            isEnabled: true,
            actorUserId: actor.id,
          });
        }

        const creative = this.campaignsRepo.createCreative(tx, {
          adAccountId,
          name: spec.creative.name,
          formatConceptId: CREATIVE_FORMAT_CONCEPT[spec.creative.format],
          body: spec.creative.body,
          linkUrl: spec.creative.linkUrl,
          objectStoryJson: spec.creative.objectStoryJson,
          primaryMediaFileId: spec.creative.primaryMediaFileId,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });

        (spec.creative.assets ?? []).forEach((asset, index) => {
          this.campaignsRepo.createCreativeAsset(tx, {
            adCreativeId: creative.id,
            assetTypeConceptId: ASSET_TYPE_CONCEPT[asset.assetType],
            fileId: asset.fileId,
            hash: asset.hash,
            width: asset.width,
            height: asset.height,
            ordinal: index + 1,
            actorUserId: actor.id,
          });
        });

        const ad = this.campaignsRepo.createAd(tx, {
          adSetId: adSet.id,
          name: spec.adName,
          creativeId: creative.id,
          statusConceptId: CONCEPTS.AD_STATUS_PAUSED,
          // El anuncio no puede entregar antes de que la plataforma lo revise.
          effectiveStatusConceptId: CONCEPTS.AD_EFFECTIVE_PENDING_REVIEW,
          actorUserId: actor.id,
        });
        adIds.push(ad.id);
      }

      return {
        campaignId: campaign.id,
        statusConceptId: CONCEPTS.AD_STATUS_PAUSED,
        adSetIds,
        adIds,
      };
    });
  }

  /**
   * UC-43-05: guardar la segmentación y, si se pide, la audiencia que la nutre.
   * La audiencia nace `populating`: su tamaño lo publica la plataforma después.
   */
  async createTargeting(
    adAccountId: string,
    dto: CreateTargetingDto,
    actor: AuthenticatedUser,
  ): Promise<TargetingResponseDto> {
    this.logger.info(
      { operation: 'ads.targeting.create', adAccountId },
      'Creating targeting spec',
    );

    if (dto.ageMin && dto.ageMax && dto.ageMax < dto.ageMin) {
      throw new PreconditionFailedException('El rango de edad está invertido', {
        ageMin: dto.ageMin,
        ageMax: dto.ageMax,
      });
    }

    return this.em.transactional(async (tx) => {
      const account = await this.accountsRepo.findAdAccountById(
        tx,
        adAccountId,
      );
      if (!account) {
        throw new ResourceNotFoundException(
          'Cuenta publicitaria no encontrada',
          { adAccountId },
        );
      }

      let customAudienceId: string | undefined;
      let lookalikeSpecId: string | undefined;

      if (dto.customAudience) {
        const audience = this.campaignsRepo.createCustomAudience(tx, {
          adAccountId,
          name: dto.customAudience.name,
          audienceTypeConceptId: CONCEPTS.AUDIENCE_CUSTOM,
          sourceConceptId: AUDIENCE_SOURCE_CONCEPT[dto.customAudience.source],
          ruleJson: dto.customAudience.ruleJson,
          dataSourcePixelId: dto.customAudience.dataSourcePixelId,
          statusConceptId: CONCEPTS.AUDIENCE_POPULATING,
          actorUserId: actor.id,
        });
        customAudienceId = audience.id;

        if (dto.customAudience.lookalikeRatioPercent) {
          if (!dto.customAudience.lookalikeCountryConceptId) {
            throw new PreconditionFailedException(
              'Una lookalike necesita país',
              {
                adAccountId,
              },
            );
          }
          const lookalike = this.campaignsRepo.createLookalikeSpec(tx, {
            adAccountId,
            sourceAudienceId: audience.id,
            countryConceptId: dto.customAudience.lookalikeCountryConceptId,
            ratioPercent: dto.customAudience.lookalikeRatioPercent,
            statusConceptId: CONCEPTS.AUDIENCE_POPULATING,
            actorUserId: actor.id,
          });
          lookalikeSpecId = lookalike.id;
        }
      }

      const targeting = this.campaignsRepo.createTargetingSpec(tx, {
        adAccountId,
        name: dto.name,
        geoLocationsJson: dto.geoLocationsJson,
        excludedGeoLocationsJson: dto.excludedGeoLocationsJson,
        ageMin: dto.ageMin,
        ageMax: dto.ageMax,
        interestsJson: dto.interestsJson,
        customAudienceIdsJson: dto.customAudienceIdsJson,
        actorUserId: actor.id,
      });

      return {
        targetingSpecId: targeting.id,
        customAudienceId,
        lookalikeSpecId,
      };
    });
  }

  /**
   * UC-43-05: asignar la identidad con la que se publica el conjunto. Sólo hay
   * una vigente por rol: la anterior se cierra en la misma transacción.
   */
  async assignIdentity(
    adSetId: string,
    dto: AssignIdentityDto,
    actor: AuthenticatedUser,
  ): Promise<AssignIdentityResponseDto> {
    this.logger.info(
      { operation: 'ads.identity.assign', adSetId },
      'Assigning identity to ad set',
    );

    const roleConceptId =
      dto.role === 'SECONDARY'
        ? CONCEPTS.ASSIGNMENT_ROLE_SECONDARY
        : CONCEPTS.ASSIGNMENT_ROLE_PRIMARY;

    return this.em.transactional(async (tx) => {
      const adSet = await this.campaignsRepo.findAdSetById(tx, adSetId);
      if (!adSet) {
        throw new ResourceNotFoundException(
          'Conjunto de anuncios no encontrado',
          { adSetId },
        );
      }

      const identity = await this.accountsRepo.findIdentityAssetById(
        tx,
        dto.adIdentityAssetId,
      );
      if (!identity) {
        throw new ResourceNotFoundException('Identidad no encontrada', {
          adIdentityAssetId: dto.adIdentityAssetId,
        });
      }
      if (identity.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('La identidad no está activa', {
          adIdentityAssetId: dto.adIdentityAssetId,
        });
      }

      const current = await this.accountsRepo.findActiveAssignmentForUpdate(
        tx,
        CONCEPTS.ASSIGNABLE_AD_SET,
        adSetId,
        roleConceptId,
      );
      let supersededAssignmentId: string | undefined;
      if (current) {
        current.effectiveTo = new Date();
        touch(current, actor.id);
        supersededAssignmentId = current.id;
      }

      const assignment = this.accountsRepo.createIdentityAssignment(tx, {
        adIdentityAssetId: dto.adIdentityAssetId,
        assignableTypeConceptId: CONCEPTS.ASSIGNABLE_AD_SET,
        assignableId: adSetId,
        assignmentRoleConceptId: roleConceptId,
        actorUserId: actor.id,
      });

      return { assignmentId: assignment.id, adSetId, supersededAssignmentId };
    });
  }

  /**
   * UC-43-16: programar un tramo de presupuesto. Cambiar presupuesto o puja
   * reinicia la fase de aprendizaje del conjunto, y eso se deja anotado.
   */
  async createBudgetSchedule(
    adSetId: string,
    dto: CreateBudgetScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<BudgetScheduleResponseDto> {
    this.logger.info(
      { operation: 'ads.budget.schedule', adSetId, budgetType: dto.budgetType },
      'Creating budget schedule',
    );

    const validFrom = new Date(dto.validFrom);
    const validTo = dto.validTo ? new Date(dto.validTo) : undefined;
    if (validTo && validTo <= validFrom) {
      throw new PreconditionFailedException(
        'El tramo debe terminar después de empezar',
        {
          validFrom: dto.validFrom,
          validTo: dto.validTo,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const adSet = await this.campaignsRepo.findAdSetForUpdate(tx, adSetId);
      if (!adSet) {
        throw new ResourceNotFoundException(
          'Conjunto de anuncios no encontrado',
          { adSetId },
        );
      }

      const campaign = await this.campaignsRepo.findCampaignById(
        tx,
        adSet.campaignId,
      );
      if (!campaign) {
        throw new ResourceNotFoundException(
          'Campaña del conjunto no encontrada',
          {
            campaignId: adSet.campaignId,
          },
        );
      }
      const account = await this.accountsRepo.findAdAccountById(
        tx,
        campaign.adAccountId,
      );
      // El tramo no puede prometer más de lo que la cuenta tiene autorizado.
      if (
        account?.spendCapAmount &&
        Number(dto.amount) > Number(account.spendCapAmount)
      ) {
        throw new PreconditionFailedException(
          'El presupuesto del tramo excede el tope de gasto de la cuenta',
          { amount: dto.amount, spendCapAmount: account.spendCapAmount },
        );
      }

      // El índice GIST rechazaría el solape; comprobarlo antes permite dar un
      // error de dominio en vez de una violación de restricción.
      const existing = await this.campaignsRepo.findActiveSchedules(
        tx,
        CONCEPTS.AD_ENTITY_ADSET,
        adSetId,
        CONCEPTS.BUDGET_SCHEDULE_ACTIVE,
      );
      const overlapping = existing.find((s) =>
        this.overlaps(s.validFrom, s.validTo, validFrom, validTo),
      );
      if (overlapping) {
        throw new ConflictException('El tramo se solapa con otro vigente', {
          adSetId,
          existingScheduleId: overlapping.id,
        });
      }

      const schedule = this.campaignsRepo.createBudgetSchedule(tx, {
        entityTypeConceptId: CONCEPTS.AD_ENTITY_ADSET,
        entityRefId: adSetId,
        budgetTypeConceptId:
          dto.budgetType === 'DAILY'
            ? CONCEPTS.BUDGET_TYPE_DAILY
            : CONCEPTS.BUDGET_TYPE_LIFETIME,
        amount: dto.amount,
        currencyConceptId: dto.currencyConceptId,
        validFrom,
        validTo,
        statusConceptId: CONCEPTS.BUDGET_SCHEDULE_ACTIVE,
        actorUserId: actor.id,
      });

      const budgetChanged =
        dto.budgetType === 'DAILY'
          ? adSet.dailyBudget !== dto.amount
          : adSet.lifetimeBudget !== dto.amount;
      const bidChanged =
        dto.bidAmount !== undefined && adSet.bidAmount !== dto.bidAmount;

      if (dto.budgetType === 'DAILY') {
        adSet.dailyBudget = dto.amount;
      } else {
        adSet.lifetimeBudget = dto.amount;
      }
      if (dto.bidAmount !== undefined) adSet.bidAmount = dto.bidAmount;
      touch(adSet, actor.id);

      if (dto.clickWindowDays || dto.viewWindowDays) {
        const current = await this.campaignsRepo.findDefaultAttributionSettings(
          tx,
          campaign.adAccountId,
        );
        this.campaignsRepo.upsertAttributionSettings(tx, current, {
          adAccountId: campaign.adAccountId,
          clickWindowDays:
            dto.clickWindowDays ??
            current?.clickWindowDays ??
            DEFAULT_CLICK_WINDOW_DAYS,
          viewWindowDays:
            dto.viewWindowDays ??
            current?.viewWindowDays ??
            DEFAULT_VIEW_WINDOW_DAYS,
          isDefault: true,
          actorUserId: actor.id,
        });
      }

      let learningSnapshotId: string | undefined;
      const learningReset = budgetChanged || bidChanged;
      if (learningReset) {
        const snapshot = this.campaignsRepo.createLearningSnapshot(tx, {
          adSetId,
          learningStatusConceptId: CONCEPTS.LEARNING_LEARNING,
          optimizationEventsCount: '0',
        });
        learningSnapshotId = snapshot.id;
      }

      return {
        id: schedule.id,
        adSetId,
        amount: dto.amount,
        learningReset,
        learningSnapshotId,
      };
    });
  }

  /** Dos tramos se solapan si cada uno empieza antes de que el otro termine. */
  private overlaps(
    aFrom: Date | undefined,
    aTo: Date | undefined,
    bFrom: Date,
    bTo: Date | undefined,
  ): boolean {
    const startA = aFrom ?? new Date(0);
    const endA = aTo ?? new Date(8.64e15);
    const endB = bTo ?? new Date(8.64e15);
    return startA < endB && bFrom < endA;
  }
}
