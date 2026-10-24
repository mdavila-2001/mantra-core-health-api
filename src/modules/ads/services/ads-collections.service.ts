import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { AdEventDataPolicies, AdPlatformConnections } from '../entities';
import type {
  AdEventDataPolicyItemDto,
  AdPlatformConnectionItemDto,
  ListEventDataPoliciesQueryDto,
  ListPlatformConnectionsQueryDto,
} from '../dto';

/**
 * Lecturas de colección de `ads`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class AdsCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar políticas de datos de evento del tenant (V43-13).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listEventDataPolicies(
    query: ListEventDataPoliciesQueryDto,
  ): Promise<PageResponseDto<AdEventDataPolicyItemDto>> {
    return listTenantCollection(this.em.fork(), AdEventDataPolicies, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): AdEventDataPolicyItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        code: row.code,
        name: row.name,
        jurisdictionConceptId: row.jurisdictionConceptId,
        purposeOfUseConceptId: row.purposeOfUseConceptId,
        requiresConsent: row.requiresConsent ?? null,
        consentScopeConceptId: row.consentScopeConceptId ?? null,
        defaultActionConceptId: row.defaultActionConceptId,
        prohibitedDataClassesJson: row.prohibitedDataClassesJson ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar conexiones con plataformas de anuncios del tenant (V43-16).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listPlatformConnections(
    query: ListPlatformConnectionsQueryDto,
  ): Promise<PageResponseDto<AdPlatformConnectionItemDto>> {
    return listTenantCollection(this.em.fork(), AdPlatformConnections, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): AdPlatformConnectionItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        businessManagerId: row.businessManagerId,
        adAccountId: row.adAccountId ?? null,
        platformConceptId: row.platformConceptId,
        connectionName: row.connectionName,
        apiVersion: row.apiVersion ?? null,
        externalBusinessId: row.externalBusinessId ?? null,
        externalAdAccountId: row.externalAdAccountId ?? null,
        lastSuccessfulSyncAt: row.lastSuccessfulSyncAt ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
