import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { DynamicEnumDefinitions, SystemContexts } from '../entities';
import type {
  DynamicEnumDefinitionItemDto,
  ListContextsQueryDto,
  ListDynamicEnumDefinitionsQueryDto,
  SystemContextItemDto,
} from '../dto';

/**
 * Lecturas de colección de `system_context`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class SystemContextCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar contextos de sistema del tenant (V45-01).
   *
   * Suma los contextos de plataforma (`tenant_id` nulo, alcance global o de país): son la base que
   * cada tenant hereda, y quien gobierna el contexto del tenant necesita verlos.
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listContexts(
    query: ListContextsQueryDto,
  ): Promise<PageResponseDto<SystemContextItemDto>> {
    return listTenantCollection(this.em.fork(), SystemContexts, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      includePlatformRows: true,
      map: (row): SystemContextItemDto => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description ?? null,
        contextTypeConceptId: row.contextTypeConceptId,
        scopeTypeConceptId: row.scopeTypeConceptId,
        tenantId: row.tenantId ?? null,
        countryConceptId: row.countryConceptId ?? null,
        localeConceptId: row.localeConceptId ?? null,
        currentVersionId: row.currentVersionId ?? null,
        refreshPolicyConceptId: row.refreshPolicyConceptId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar definiciones de catálogo dinámico del tenant (V45-05).
   *
   * Suma las definiciones de plataforma (`tenant_id` nulo): los catálogos globales que el tenant hereda.
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDynamicEnumDefinitions(
    query: ListDynamicEnumDefinitionsQueryDto,
  ): Promise<PageResponseDto<DynamicEnumDefinitionItemDto>> {
    return listTenantCollection(this.em.fork(), DynamicEnumDefinitions, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      includePlatformRows: true,
      map: (row): DynamicEnumDefinitionItemDto => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description ?? null,
        valueSetId: row.valueSetId,
        scopeTypeConceptId: row.scopeTypeConceptId,
        tenantId: row.tenantId ?? null,
        countryConceptId: row.countryConceptId ?? null,
        selectionModeConceptId: row.selectionModeConceptId ?? null,
        allowTenantExtension: row.allowTenantExtension ?? null,
        allowCustomValue: row.allowCustomValue ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
