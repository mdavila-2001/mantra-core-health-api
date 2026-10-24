import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  assertRouteTenant,
  listTenantCollection,
} from '../../../common';
import { StorageCostSnapshots, TenantStorageBindings } from '../entities';
import type {
  ListStorageBindingsQueryDto,
  ListStorageCostSnapshotsQueryDto,
  StorageCostSnapshotItemDto,
  TenantStorageBindingItemDto,
} from '../dto';

/**
 * Lecturas de colección de `polyglot_storage`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class PolyglotStorageCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar fotografías de costo de almacenamiento del tenant (V54-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listStorageCostSnapshots(
    query: ListStorageCostSnapshotsQueryDto,
  ): Promise<PageResponseDto<StorageCostSnapshotItemDto>> {
    return listTenantCollection(this.em.fork(), StorageCostSnapshots, {
      query,
      sortable: ['createdAt'],
      map: (row): StorageCostSnapshotItemDto => ({
        id: row.id,
        storageBackendRegionId: row.storageBackendRegionId,
        tenantId: row.tenantId,
        datasetDefinitionId: row.datasetDefinitionId,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        storageBytes: row.storageBytes,
        readUnits: row.readUnits,
        writeUnits: row.writeUnits,
        egressBytes: row.egressBytes,
        estimatedCost: row.estimatedCost,
        currencyCode: row.currencyCode,
        createdAt: row.createdAt,
      }),
    });
  }

  /**
   * Listar vínculos de almacenamiento del tenant del tenant (V54-11).
   *
   * @param tenantId - Tenant de la ruta; tiene que ser el del contexto.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  async listStorageBindings(
    tenantId: string,
    query: ListStorageBindingsQueryDto,
  ): Promise<PageResponseDto<TenantStorageBindingItemDto>> {
    assertRouteTenant(tenantId);
    return listTenantCollection(this.em.fork(), TenantStorageBindings, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      map: (row): TenantStorageBindingItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        datasetDefinitionId: row.datasetDefinitionId,
        primaryPlacementId: row.primaryPlacementId,
        secondaryPlacementId: row.secondaryPlacementId ?? null,
        tenantPartitionKey: row.tenantPartitionKey,
        state: row.state,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
