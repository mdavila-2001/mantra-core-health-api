import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { Journeys, MarketingCampaigns, MarketingSegments } from '../entities';
import type {
  JourneyItemDto,
  ListCampaignsQueryDto,
  ListJourneysQueryDto,
  ListSegmentsQueryDto,
  MarketingCampaignItemDto,
  MarketingSegmentItemDto,
} from '../dto';

/**
 * Lecturas de colección de `marketing`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class MarketingCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar recorridos de marketing del tenant (V50-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listJourneys(
    query: ListJourneysQueryDto,
  ): Promise<PageResponseDto<JourneyItemDto>> {
    return listTenantCollection(this.em.fork(), Journeys, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): JourneyItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        code: row.code,
        name: row.name,
        entryTriggerConceptId: row.entryTriggerConceptId,
        entrySegmentId: row.entrySegmentId ?? null,
        goalMetricConceptId: row.goalMetricConceptId ?? null,
        definitionJson: row.definitionJson ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar segmentos de marketing del tenant (V50-04).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listSegments(
    query: ListSegmentsQueryDto,
  ): Promise<PageResponseDto<MarketingSegmentItemDto>> {
    return listTenantCollection(this.em.fork(), MarketingSegments, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): MarketingSegmentItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        code: row.code,
        name: row.name,
        segmentTypeConceptId: row.segmentTypeConceptId,
        definitionJson: row.definitionJson ?? null,
        sourceReadModelId: row.sourceReadModelId ?? null,
        estimatedSize: row.estimatedSize ?? null,
        lastRefreshedAt: row.lastRefreshedAt ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar campañas de marketing del tenant (V50-06).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listCampaigns(
    query: ListCampaignsQueryDto,
  ): Promise<PageResponseDto<MarketingCampaignItemDto>> {
    return listTenantCollection(this.em.fork(), MarketingCampaigns, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): MarketingCampaignItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        code: row.code,
        name: row.name,
        campaignTypeConceptId: row.campaignTypeConceptId,
        objectiveConceptId: row.objectiveConceptId,
        channelConceptId: row.channelConceptId ?? null,
        segmentId: row.segmentId ?? null,
        budgetAmount: row.budgetAmount ?? null,
        currencyConceptId: row.currencyConceptId ?? null,
        adCampaignRefId: row.adCampaignRefId ?? null,
        promotionId: row.promotionId ?? null,
        startAt: row.startAt ?? null,
        endAt: row.endAt ?? null,
        ownerUserId: row.ownerUserId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        governanceScopeConceptId: row.governanceScopeConceptId ?? null,
        requiresExplicitPublish: row.requiresExplicitPublish ?? null,
        publishedVersion: row.publishedVersion ?? null,
        publishedAt: row.publishedAt ?? null,
        publishedByUserId: row.publishedByUserId ?? null,
        cancellationReason: row.cancellationReason ?? null,
        cancelledAt: row.cancelledAt ?? null,
        cancelledByUserId: row.cancelledByUserId ?? null,
      }),
    });
  }
}
