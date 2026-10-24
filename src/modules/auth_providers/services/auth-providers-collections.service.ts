import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  IdentityProviders,
  ProviderTenantBindings,
  ProvisioningRules,
} from '../entities';
import type {
  IdentityProviderItemDto,
  ListIdentityProvidersQueryDto,
  ListProvisioningRulesQueryDto,
  ListTenantBindingsQueryDto,
  ProviderTenantBindingItemDto,
  ProvisioningRuleItemDto,
} from '../dto';

/**
 * Lecturas de colección de `auth_providers`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class AuthProvidersCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar los proveedores de identidad del tenant y los globales (V40-03).
   *
   * Suma los proveedores globales (`tenant_id` nulo, `is_global`): el módulo ya los
   * ofrece a todos los tenants en el inicio de sesión federado.
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listIdentityProviders(
    query: ListIdentityProvidersQueryDto,
  ): Promise<PageResponseDto<IdentityProviderItemDto>> {
    return listTenantCollection(this.em.fork(), IdentityProviders, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({
        protocolConceptId: query.protocolConceptId,
        stateConceptId: query.stateConceptId,
      }),
      includePlatformRows: true,
      map: (row): IdentityProviderItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        code: row.code,
        name: row.name,
        protocolConceptId: row.protocolConceptId,
        providerCategoryConceptId: row.providerCategoryConceptId,
        issuer: row.issuer ?? null,
        logoFileId: row.logoFileId ?? null,
        isGlobal: row.isGlobal ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las reglas de aprovisionamiento de un proveedor en el tenant (V40-07).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listProvisioningRules(
    id: string,
    query: ListProvisioningRulesQueryDto,
  ): Promise<PageResponseDto<ProvisioningRuleItemDto>> {
    return listTenantCollection(this.em.fork(), ProvisioningRules, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ providerId: id }),
      map: (row): ProvisioningRuleItemDto => ({
        id: row.id,
        providerId: row.providerId,
        tenantId: row.tenantId ?? null,
        priority: row.priority,
        conditionJson: row.conditionJson ?? null,
        assignRoleConceptId: row.assignRoleConceptId ?? null,
        assignTenantId: row.assignTenantId ?? null,
        effectConceptId: row.effectConceptId ?? null,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar los proveedores habilitados en el tenant (V40-09).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listTenantBindings(
    query: ListTenantBindingsQueryDto,
  ): Promise<PageResponseDto<ProviderTenantBindingItemDto>> {
    return listTenantCollection(this.em.fork(), ProviderTenantBindings, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ providerId: query.providerId }),
      map: (row): ProviderTenantBindingItemDto => ({
        id: row.id,
        providerId: row.providerId,
        tenantId: row.tenantId,
        isEnabled: row.isEnabled,
        autoProvision: row.autoProvision ?? null,
        defaultRoleConceptId: row.defaultRoleConceptId ?? null,
        allowedEmailDomains: row.allowedEmailDomains ?? null,
        justInTimeProvisioning: row.justInTimeProvisioning ?? null,
        ordinal: row.ordinal ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
