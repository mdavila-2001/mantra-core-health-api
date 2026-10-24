import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de contextos de sistema (V45-01). */
export class SystemContextItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ format: 'uuid' })
  contextTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  scopeTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  countryConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  localeConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currentVersionId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  refreshPolicyConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de contextos de sistema. */
export class ListContextsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de contextos de sistema. */
export class SystemContextPageDto extends pageResponseOf(
  SystemContextItemDto,
  'SystemContextPageDto',
) {}

/** Fila de definiciones de catálogo dinámico (V45-05). */
export class DynamicEnumDefinitionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ format: 'uuid' })
  valueSetId!: string;

  @ApiProperty({ format: 'uuid' })
  scopeTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  countryConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  selectionModeConceptId!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  allowTenantExtension!: boolean | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  allowCustomValue!: boolean | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de definiciones de catálogo dinámico. */
export class ListDynamicEnumDefinitionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de definiciones de catálogo dinámico. */
export class DynamicEnumDefinitionPageDto extends pageResponseOf(
  DynamicEnumDefinitionItemDto,
  'DynamicEnumDefinitionPageDto',
) {}
