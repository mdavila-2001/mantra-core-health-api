import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { ImagingEndpoints } from '../entities';
import type {
  ImagingEndpointItemDto,
  ListImagingEndpointsQueryDto,
} from '../dto';

/**
 * Lecturas de colección de `diagnostics`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class DiagnosticsCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar endpoints de imagenología del tenant (V20-09).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listImagingEndpoints(
    query: ListImagingEndpointsQueryDto,
  ): Promise<PageResponseDto<ImagingEndpointItemDto>> {
    return listTenantCollection(this.em.fork(), ImagingEndpoints, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): ImagingEndpointItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        endpointTypeConceptId: row.endpointTypeConceptId,
        baseUri: row.baseUri,
        connectionId: row.connectionId ?? null,
        storageRegionConceptId: row.storageRegionConceptId ?? null,
        dicomConformanceStatementUri: row.dicomConformanceStatementUri ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
