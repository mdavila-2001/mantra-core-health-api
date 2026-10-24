import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  DatasetReleaseRequests,
  LakehouseDatasets,
  LakehouseQualityRuns,
  TransformationRuns,
} from '../entities';
import type {
  DatasetReleaseRequestItemDto,
  LakehouseDatasetItemDto,
  LakehouseQualityRunItemDto,
  ListDatasetReleasesQueryDto,
  ListDatasetsQueryDto,
  ListQualityRunsQueryDto,
  ListRunsQueryDto,
  TransformationRunItemDto,
} from '../dto';

/**
 * Lecturas de colección de `lakehouse`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class LakehouseCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar liberaciones de datasets del tenant (V63-01).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDatasetReleases(
    query: ListDatasetReleasesQueryDto,
  ): Promise<PageResponseDto<DatasetReleaseRequestItemDto>> {
    return listTenantCollection(this.em.fork(), DatasetReleaseRequests, {
      query,
      sortable: ['requestedAt'],
      map: (row): DatasetReleaseRequestItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        researchProjectId: row.researchProjectId,
        dataProductVersionId: row.dataProductVersionId,
        cohortDefinitionId: row.cohortDefinitionId,
        purposeOfUseCode: row.purposeOfUseCode,
        requestedByUserId: row.requestedByUserId,
        requestedAt: row.requestedAt,
        status: row.status,
      }),
    });
  }

  /**
   * Listar datasets del lakehouse del tenant (V63-05).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDatasets(
    query: ListDatasetsQueryDto,
  ): Promise<PageResponseDto<LakehouseDatasetItemDto>> {
    return listTenantCollection(this.em.fork(), LakehouseDatasets, {
      query,
      sortable: [],
      map: (row): LakehouseDatasetItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        dataProductVersionId: row.dataProductVersionId,
        dataLakeZoneId: row.dataLakeZoneId,
        lakehouseCatalogId: row.lakehouseCatalogId,
        databaseName: row.databaseName,
        tableName: row.tableName,
        storageFormat: row.storageFormat,
        partitionSpecJson: row.partitionSpecJson,
        sourceDatasetCode: row.sourceDatasetCode,
        lifecycleState: row.lifecycleState,
      }),
    });
  }

  /**
   * Listar corridas de calidad de un dataset del tenant (V63-06).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listQualityRuns(
    id: string,
    query: ListQualityRunsQueryDto,
  ): Promise<PageResponseDto<LakehouseQualityRunItemDto>> {
    return listTenantCollection(this.em.fork(), LakehouseQualityRuns, {
      query,
      sortable: ['startedAt', 'completedAt'],
      where: definedFilters({ lakehouseDatasetId: id }),
      map: (row): LakehouseQualityRunItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        lakehouseDatasetId: row.lakehouseDatasetId,
        transformationRunId: row.transformationRunId,
        status: row.status,
        evaluatedRecordCount: row.evaluatedRecordCount,
        failedRecordCount: row.failedRecordCount,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
      }),
    });
  }

  /**
   * Listar ejecuciones de una transformación del tenant (V63-08).
   *
   * @param defId - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listRuns(
    defId: string,
    query: ListRunsQueryDto,
  ): Promise<PageResponseDto<TransformationRunItemDto>> {
    return listTenantCollection(this.em.fork(), TransformationRuns, {
      query,
      sortable: ['startedAt', 'completedAt'],
      where: definedFilters({ transformationDefinitionId: defId }),
      map: (row): TransformationRunItemDto => ({
        id: row.id,
        transformationDefinitionId: row.transformationDefinitionId,
        tenantId: row.tenantId,
        sourceCheckpoint: row.sourceCheckpoint,
        status: row.status,
        inputRecordCount: row.inputRecordCount,
        outputRecordCount: row.outputRecordCount,
        rejectedRecordCount: row.rejectedRecordCount,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
      }),
    });
  }
}
