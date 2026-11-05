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

/** Filtros del listado administrativo, que cruza prácticas de una organización. */
export interface SearchAdminServiceCatalogFilters {
  /** Prácticas alcanzables por el actor (ya acotadas a su organización). */
  practiceIds: readonly string[];
  /** Texto libre sobre código o nombre. */
  query?: string;
  /** Sólo activos (`true`) o sólo inactivos (`false`). */
  isActive?: boolean;
  /** Última fila de la página anterior: el orden es `(code, id)`. */
  after?: { code: string; id: string };
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
   * Los ítems de un lote, para armar listas sin una consulta por fila.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ítems pedidos; con la lista vacía no consulta.
   * @returns Los ítems que existen.
   */
  findByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<ServiceCatalog[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(ServiceCatalog, { id: { $in: [...ids] } });
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
   * Cuáles de esos códigos ya existen en el catálogo de la práctica.
   *
   * Es la misma clave que `findByCode` (práctica + código), pero para un lote:
   * la importación del arancel necesita saber cuáles saltar sin hacer una
   * consulta por código.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Práctica dueña del catálogo.
   * @param codes - Códigos candidatos.
   * @returns El subconjunto de `codes` que ya está dado de alta.
   */
  async findExistingCodes(
    em: EntityManager,
    practiceId: string,
    codes: readonly string[],
  ): Promise<Set<string>> {
    if (codes.length === 0) return new Set();
    const rows = await em.find(
      ServiceCatalog,
      { practiceId, code: { $in: [...codes] } },
      { fields: ['code'] },
    );
    return new Set(rows.map((row) => row.code));
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
   * Página del listado administrativo, ordenada de forma determinista por
   * `(code, id)`: el código sólo es único dentro de una práctica, así que el
   * desempate por `id` evita saltarse o repetir filas entre páginas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filters - Filtros ya acotados a la organización del actor.
   * @param limit - Tope de filas a devolver.
   * @returns Página de servicios que casan con el filtro.
   */
  searchAdminPage(
    em: EntityManager,
    filters: SearchAdminServiceCatalogFilters,
    limit: number,
  ): Promise<ServiceCatalog[]> {
    if (filters.practiceIds.length === 0) return Promise.resolve([]);
    const and: Record<string, unknown>[] = [
      { practiceId: { $in: [...filters.practiceIds] } },
    ];
    if (filters.isActive !== undefined) {
      and.push({ isActive: filters.isActive });
    }
    if (filters.query) {
      const pattern = `%${filters.query}%`;
      and.push({
        $or: [{ code: { $ilike: pattern } }, { name: { $ilike: pattern } }],
      });
    }
    if (filters.after) {
      and.push({
        $or: [
          { code: { $gt: filters.after.code } },
          { code: filters.after.code, id: { $gt: filters.after.id } },
        ],
      });
    }
    return em.find(
      ServiceCatalog,
      { $and: and },
      {
        orderBy: { code: 'ASC', id: 'ASC' },
        limit,
      },
    );
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
