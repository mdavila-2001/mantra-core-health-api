import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CatalogProductPageDto,
  CatalogProductQueryDto,
} from '../dto/catalog-product.dto';
import { CATALOG_SEARCH_DEFAULT_LIMIT } from '../pharmacy-catalog.properties';
import { MedicineCatalogRepository } from '../repositories';

/**
 * Búsqueda en el catálogo universal de medicamentos (registros sanitarios
 * oficiales). Sólo lectura sobre un fork del `EntityManager`.
 *
 * No filtra por tenant: el registro sanitario es el mismo para todas las
 * farmacias, y que sea único es justamente lo que evita los conflictos de
 * integración entre ellas.
 */
@Injectable()
export class MedicineCatalogSearchService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param catalogRepo - Lectura del catálogo de medicamentos.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: MedicineCatalogRepository,
  ) {}

  /** Busca por nombre, principio activo, ATC, titular o nº de registro. */
  async search(query: CatalogProductQueryDto): Promise<CatalogProductPageDto> {
    const limit = query.limit ?? CATALOG_SEARCH_DEFAULT_LIMIT;
    const page = await this.catalogRepo.search(this.em.fork(), {
      text: query.search,
      source: query.source,
      atc: query.atc,
      limit,
    });
    return { items: page.items, limit, truncated: page.truncated };
  }
}
