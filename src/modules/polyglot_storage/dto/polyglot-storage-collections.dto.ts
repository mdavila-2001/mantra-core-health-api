import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de fotografías de costo de almacenamiento (V54-02). */
export class StorageCostSnapshotItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  storageBackendRegionId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  datasetDefinitionId!: string;

  @ApiProperty({ type: String, format: 'date' })
  periodStart!: Date;

  @ApiProperty({ type: String, format: 'date' })
  periodEnd!: Date;

  @ApiProperty({ type: String })
  storageBytes!: string;

  @ApiProperty({ type: String })
  readUnits!: string;

  @ApiProperty({ type: String })
  writeUnits!: string;

  @ApiProperty({ type: String })
  egressBytes!: string;

  @ApiProperty({ type: String })
  estimatedCost!: string;

  @ApiProperty({ type: String })
  currencyCode!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Filtros del listado de fotografías de costo de almacenamiento. */
export class ListStorageCostSnapshotsQueryDto extends PaginationQueryDto {}

/** Página de fotografías de costo de almacenamiento. */
export class StorageCostSnapshotPageDto extends pageResponseOf(
  StorageCostSnapshotItemDto,
  'StorageCostSnapshotPageDto',
) {}

/** Fila de vínculos de almacenamiento del tenant (V54-11). */
export class TenantStorageBindingItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  datasetDefinitionId!: string;

  @ApiProperty({ format: 'uuid' })
  primaryPlacementId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  secondaryPlacementId!: string | null;

  @ApiProperty({ type: String })
  tenantPartitionKey!: string;

  @ApiProperty({ type: String })
  state!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de vínculos de almacenamiento del tenant. */
export class ListStorageBindingsQueryDto extends PaginationQueryDto {}

/** Página de vínculos de almacenamiento del tenant. */
export class TenantStorageBindingPageDto extends pageResponseOf(
  TenantStorageBindingItemDto,
  'TenantStorageBindingPageDto',
) {}
