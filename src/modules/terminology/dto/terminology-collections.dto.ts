import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de políticas de catálogo del tenant (V03-12). */
export class TenantCatalogPolicyItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  valueSetId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  modeConceptId!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  allowSubset!: boolean | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  allowAlias!: boolean | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  allowLocalConcepts!: boolean | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de políticas de catálogo del tenant. */
export class ListCatalogPoliciesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  valueSetId?: string;
}

/** Página de políticas de catálogo del tenant. */
export class TenantCatalogPolicyPageDto extends pageResponseOf(
  TenantCatalogPolicyItemDto,
  'TenantCatalogPolicyPageDto',
) {}
