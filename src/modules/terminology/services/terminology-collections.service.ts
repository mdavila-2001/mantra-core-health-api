import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  assertRouteTenant,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { TenantCatalogPolicies } from '../entities';
import type {
  ListCatalogPoliciesQueryDto,
  TenantCatalogPolicyItemDto,
} from '../dto';

/**
 * Lecturas de colección de `terminology`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class TerminologyCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar las políticas de catálogo del tenant (V03-12).
   *
   * @param tenantId - Tenant de la ruta; tiene que ser el del contexto.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  async listCatalogPolicies(
    tenantId: string,
    query: ListCatalogPoliciesQueryDto,
  ): Promise<PageResponseDto<TenantCatalogPolicyItemDto>> {
    assertRouteTenant(tenantId);
    return listTenantCollection(this.em.fork(), TenantCatalogPolicies, {
      query,
      sortable: ['createdAt', 'updatedAt', 'validFrom'],
      where: definedFilters({ valueSetId: query.valueSetId }),
      map: (row): TenantCatalogPolicyItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        valueSetId: row.valueSetId,
        modeConceptId: row.modeConceptId ?? null,
        allowSubset: row.allowSubset ?? null,
        allowAlias: row.allowAlias ?? null,
        allowLocalConcepts: row.allowLocalConcepts ?? null,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
