import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de liberaciones de datasets (V63-01). */
export class DatasetReleaseRequestItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  researchProjectId!: string;

  @ApiProperty({ format: 'uuid' })
  dataProductVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  cohortDefinitionId!: string;

  @ApiProperty({ type: String })
  purposeOfUseCode!: string;

  @ApiProperty({ format: 'uuid' })
  requestedByUserId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  requestedAt!: Date;

  @ApiProperty({ type: String })
  status!: string;
}

/** Filtros del listado de liberaciones de datasets. */
export class ListDatasetReleasesQueryDto extends PaginationQueryDto {}

/** Página de liberaciones de datasets. */
export class DatasetReleaseRequestPageDto extends pageResponseOf(
  DatasetReleaseRequestItemDto,
  'DatasetReleaseRequestPageDto',
) {}

/** Fila de datasets del lakehouse (V63-05). */
export class LakehouseDatasetItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  dataProductVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  dataLakeZoneId!: string;

  @ApiProperty({ format: 'uuid' })
  lakehouseCatalogId!: string;

  @ApiProperty({ type: String })
  databaseName!: string;

  @ApiProperty({ type: String })
  tableName!: string;

  @ApiProperty({ type: String })
  storageFormat!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  partitionSpecJson!: unknown;

  @ApiProperty({ type: String })
  sourceDatasetCode!: string;

  @ApiProperty({ type: String })
  lifecycleState!: string;
}

/** Filtros del listado de datasets del lakehouse. */
export class ListDatasetsQueryDto extends PaginationQueryDto {}

/** Página de datasets del lakehouse. */
export class LakehouseDatasetPageDto extends pageResponseOf(
  LakehouseDatasetItemDto,
  'LakehouseDatasetPageDto',
) {}

/** Fila de corridas de calidad de un dataset (V63-06). */
export class LakehouseQualityRunItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  lakehouseDatasetId!: string;

  @ApiProperty({ format: 'uuid' })
  transformationRunId!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String })
  evaluatedRecordCount!: string;

  @ApiProperty({ type: String })
  failedRecordCount!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: Date;
}

/** Filtros del listado de corridas de calidad de un dataset. */
export class ListQualityRunsQueryDto extends PaginationQueryDto {}

/** Página de corridas de calidad de un dataset. */
export class LakehouseQualityRunPageDto extends pageResponseOf(
  LakehouseQualityRunItemDto,
  'LakehouseQualityRunPageDto',
) {}

/** Fila de ejecuciones de una transformación (V63-08). */
export class TransformationRunItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  transformationDefinitionId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  sourceCheckpoint!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String })
  inputRecordCount!: string;

  @ApiProperty({ type: String })
  outputRecordCount!: string;

  @ApiProperty({ type: String })
  rejectedRecordCount!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: Date;
}

/** Filtros del listado de ejecuciones de una transformación. */
export class ListRunsQueryDto extends PaginationQueryDto {}

/** Página de ejecuciones de una transformación. */
export class TransformationRunPageDto extends pageResponseOf(
  TransformationRunItemDto,
  'TransformationRunPageDto',
) {}
