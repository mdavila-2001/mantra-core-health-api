import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceCatalog } from '../entities';
import { createdBy } from '../../../common';

/** Servicio del catálogo a crear. */
export interface CreateServiceCatalogItemData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de description text mantenido por la instancia.
   */
  descriptionText?: string;
  /**
   * Identificador asociado a image file.
   */
  imageFileId?: string;
  /**
   * Identificador asociado a service concept.
   */
  serviceConceptId?: string;
  /**
   * Valor de default price mantenido por la instancia.
   */
  defaultPrice: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a tax code.
   */
  taxCodeId?: string;
  /**
   * Identificador asociado a income account.
   */
  incomeAccountId?: string;
  /**
   * Valor de is active mantenido por la instancia.
   */
  isActive: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Filtros de búsqueda paginada del catálogo. */
export interface SearchServiceCatalogFilters {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Texto libre sobre código o nombre.
   */
  query?: string;
  /**
   * Sólo servicios activos cuando es `true`.
   */
  isActive?: boolean;
  /**
   * Último código de la página anterior.
   */
  afterCode?: string;
}

/** Acceso a datos de `billing.service_catalog`. */
@Injectable()
export class ServiceCatalogRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ServiceCatalog | null>`.
   */
  findById(em: EntityManager, id: string): Promise<ServiceCatalog | null> {
    return em.findOne(ServiceCatalog, { id });
  }

  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param code - Código interno a buscar.
   * @returns Resultado de find by code conforme al contrato `Promise<ServiceCatalog | null>`.
   */
  findByCode(
    em: EntityManager,
    practiceId: string,
    code: string,
  ): Promise<ServiceCatalog | null> {
    return em.findOne(ServiceCatalog, { practiceId, code });
  }

  /**
   * Busca una página de servicios ordenada por código (keyset).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filters - Filtros de la búsqueda.
   * @param limit - Tope de filas a devolver.
   * @returns Página de servicios que casan con el filtro.
   */
  searchPage(
    em: EntityManager,
    filters: SearchServiceCatalogFilters,
    limit: number,
  ): Promise<ServiceCatalog[]> {
    const where: Record<string, unknown> = { practiceId: filters.practiceId };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.afterCode !== undefined) {
      where.code = { $gt: filters.afterCode };
    }
    if (filters.query) {
      const pattern = `%${filters.query}%`;
      where.$or = [
        { code: { $ilike: pattern } },
        { name: { $ilike: pattern } },
      ];
    }

    return em.find(ServiceCatalog, where, {
      orderBy: { code: 'ASC' },
      limit,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ServiceCatalog`.
   */
  create(
    em: EntityManager,
    data: CreateServiceCatalogItemData,
  ): ServiceCatalog {
    return em.create(
      ServiceCatalog,
      {
        practiceId: data.practiceId,
        code: data.code,
        name: data.name,
        descriptionText: data.descriptionText,
        imageFileId: data.imageFileId,
        serviceConceptId: data.serviceConceptId,
        defaultPrice: data.defaultPrice,
        currencyConceptId: data.currencyConceptId,
        taxCodeId: data.taxCodeId,
        incomeAccountId: data.incomeAccountId,
        isActive: data.isActive,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
