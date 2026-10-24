import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de cargas grandes (V60-04). */
export class LargePayloadManifestItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  payloadType!: string;

  @ApiProperty({ type: String })
  sourceEntityType!: string;

  @ApiProperty({ format: 'uuid' })
  sourceEntityId!: string;

  @ApiProperty({ format: 'uuid' })
  objectManifestId!: string;

  @ApiProperty({ type: Boolean })
  containsPhi!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Filtros del listado de cargas grandes. */
export class ListLargePayloadsQueryDto extends PaginationQueryDto {}

/** Página de cargas grandes. */
export class LargePayloadManifestPageDto extends pageResponseOf(
  LargePayloadManifestItemDto,
  'LargePayloadManifestPageDto',
) {}

/** Fila de cargas multiparte (V60-08, V60-05). */
export class MultipartUploadItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  namespaceId!: string;

  @ApiProperty({ type: String })
  providerUploadId!: string;

  @ApiProperty({ type: String })
  targetObjectKey!: string;

  @ApiProperty({ type: String })
  expectedSizeBytes!: string;

  @ApiProperty({ type: String })
  receivedSizeBytes!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Filtros del listado de cargas multiparte. */
export class ListUploadsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  namespaceId?: string;
}

/** Página de cargas multiparte. */
export class MultipartUploadPageDto extends pageResponseOf(
  MultipartUploadItemDto,
  'MultipartUploadPageDto',
) {}
