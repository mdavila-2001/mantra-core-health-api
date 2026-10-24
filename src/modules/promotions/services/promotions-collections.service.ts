import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { Promotions } from '../entities';
import type { ListPromotionsQueryDto, PromotionItemDto } from '../dto';

/**
 * Lecturas de colección de `promotions`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class PromotionsCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar promociones del tenant (V51-08).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listPromotions(
    query: ListPromotionsQueryDto,
  ): Promise<PageResponseDto<PromotionItemDto>> {
    return listTenantCollection(this.em.fork(), Promotions, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code', 'validFrom'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): PromotionItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        code: row.code,
        name: row.name,
        promotionTypeConceptId: row.promotionTypeConceptId,
        description: row.description ?? null,
        campaignRefId: row.campaignRefId ?? null,
        priority: row.priority,
        stackable: row.stackable ?? null,
        budgetAmount: row.budgetAmount ?? null,
        currencyConceptId: row.currencyConceptId ?? null,
        totalRedemptionLimit: row.totalRedemptionLimit ?? null,
        perUserLimit: row.perUserLimit ?? null,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
