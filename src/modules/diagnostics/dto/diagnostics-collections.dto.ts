import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de endpoints de imagenología (V20-09). */
export class ImagingEndpointItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  endpointTypeConceptId!: string;

  @ApiProperty({ type: String })
  baseUri!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  connectionId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  storageRegionConceptId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  dicomConformanceStatementUri!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de endpoints de imagenología. */
export class ListImagingEndpointsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de endpoints de imagenología. */
export class ImagingEndpointPageDto extends pageResponseOf(
  ImagingEndpointItemDto,
  'ImagingEndpointPageDto',
) {}
