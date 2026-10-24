import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de políticas de datos de evento (V43-13). */
export class AdEventDataPolicyItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  jurisdictionConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  purposeOfUseConceptId!: string;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  requiresConsent!: boolean | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  consentScopeConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  defaultActionConceptId!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  prohibitedDataClassesJson!: unknown;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de políticas de datos de evento. */
export class ListEventDataPoliciesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de políticas de datos de evento. */
export class AdEventDataPolicyPageDto extends pageResponseOf(
  AdEventDataPolicyItemDto,
  'AdEventDataPolicyPageDto',
) {}

/** Fila de conexiones con plataformas de anuncios (V43-16). */
export class AdPlatformConnectionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  businessManagerId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  adAccountId!: string | null;

  @ApiProperty({ format: 'uuid' })
  platformConceptId!: string;

  @ApiProperty({ type: String })
  connectionName!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  apiVersion!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  externalBusinessId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  externalAdAccountId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastSuccessfulSyncAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de conexiones con plataformas de anuncios. */
export class ListPlatformConnectionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de conexiones con plataformas de anuncios. */
export class AdPlatformConnectionPageDto extends pageResponseOf(
  AdPlatformConnectionItemDto,
  'AdPlatformConnectionPageDto',
) {}
