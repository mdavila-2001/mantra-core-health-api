import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { LargePayloadManifests, MultipartUploads } from '../entities';
import type {
  LargePayloadManifestItemDto,
  ListLargePayloadsQueryDto,
  ListUploadsQueryDto,
  MultipartUploadItemDto,
} from '../dto';

/**
 * Lecturas de colección de `object_storage`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class ObjectStorageCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar cargas grandes del tenant (V60-04).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listLargePayloads(
    query: ListLargePayloadsQueryDto,
  ): Promise<PageResponseDto<LargePayloadManifestItemDto>> {
    return listTenantCollection(this.em.fork(), LargePayloadManifests, {
      query,
      sortable: ['createdAt'],
      map: (row): LargePayloadManifestItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        payloadType: row.payloadType,
        sourceEntityType: row.sourceEntityType,
        sourceEntityId: row.sourceEntityId,
        objectManifestId: row.objectManifestId,
        containsPhi: row.containsPhi,
        createdAt: row.createdAt,
      }),
    });
  }

  /**
   * Listar cargas multiparte del tenant (V60-08, V60-05).
   *
   * Sirve también a V60-05: la ruta de alta nombra el namespace por código, no por uuid; acá se filtra por `namespaceId`.
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listUploads(
    query: ListUploadsQueryDto,
  ): Promise<PageResponseDto<MultipartUploadItemDto>> {
    return listTenantCollection(this.em.fork(), MultipartUploads, {
      query,
      sortable: ['createdAt'],
      where: definedFilters({ namespaceId: query.namespaceId }),
      map: (row): MultipartUploadItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        namespaceId: row.namespaceId,
        providerUploadId: row.providerUploadId,
        targetObjectKey: row.targetObjectKey,
        expectedSizeBytes: row.expectedSizeBytes,
        receivedSizeBytes: row.receivedSizeBytes,
        status: row.status,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
      }),
    });
  }
}
