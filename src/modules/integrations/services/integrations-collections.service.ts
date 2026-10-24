import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { ProviderConnections, WebhookSubscriptions } from '../entities';
import type {
  IntegrationProviderConnectionItemDto,
  IntegrationWebhookSubscriptionItemDto,
  ListConnectionsQueryDto,
  ListProviderConnectionsQueryDto,
  ListProviderWebhookSubscriptionsQueryDto,
} from '../dto';

/**
 * Lecturas de colección de `integrations`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class IntegrationsCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar conexiones con proveedores del tenant (V12-08).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listConnections(
    query: ListConnectionsQueryDto,
  ): Promise<PageResponseDto<IntegrationProviderConnectionItemDto>> {
    return listTenantCollection(this.em.fork(), ProviderConnections, {
      query,
      sortable: ['createdAt', 'updatedAt', 'validFrom'],
      where: definedFilters({
        providerId: query.providerId,
        stateConceptId: query.stateConceptId,
      }),
      map: (row): IntegrationProviderConnectionItemDto => ({
        id: row.id,
        providerId: row.providerId,
        tenantId: row.tenantId,
        environmentConceptId: row.environmentConceptId ?? null,
        stateConceptId: row.stateConceptId,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar conexiones de un proveedor del tenant (V12-11).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listProviderConnections(
    id: string,
    query: ListProviderConnectionsQueryDto,
  ): Promise<PageResponseDto<IntegrationProviderConnectionItemDto>> {
    return listTenantCollection(this.em.fork(), ProviderConnections, {
      query,
      sortable: ['createdAt', 'updatedAt', 'validFrom'],
      where: definedFilters({
        providerId: id,
        stateConceptId: query.stateConceptId,
      }),
      map: (row): IntegrationProviderConnectionItemDto => ({
        id: row.id,
        providerId: row.providerId,
        tenantId: row.tenantId,
        environmentConceptId: row.environmentConceptId ?? null,
        stateConceptId: row.stateConceptId,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar suscripciones de webhook de un proveedor del tenant (V12-13).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listProviderWebhookSubscriptions(
    id: string,
    query: ListProviderWebhookSubscriptionsQueryDto,
  ): Promise<PageResponseDto<IntegrationWebhookSubscriptionItemDto>> {
    return listTenantCollection(this.em.fork(), WebhookSubscriptions, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({
        providerId: id,
        stateConceptId: query.stateConceptId,
      }),
      map: (row): IntegrationWebhookSubscriptionItemDto => ({
        id: row.id,
        providerId: row.providerId ?? null,
        tenantId: row.tenantId ?? null,
        eventType: row.eventType,
        callbackUrl: row.callbackUrl,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
