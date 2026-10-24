import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de conexiones con proveedores (V12-08). */
export class IntegrationProviderConnectionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  environmentConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de conexiones con proveedores. */
export class ListConnectionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de conexiones con proveedores. */
export class IntegrationProviderConnectionPageDto extends pageResponseOf(
  IntegrationProviderConnectionItemDto,
  'IntegrationProviderConnectionPageDto',
) {}

/** Filtros del listado de conexiones de un proveedor. */
export class ListProviderConnectionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Fila de suscripciones de webhook de un proveedor (V12-13). */
export class IntegrationWebhookSubscriptionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  providerId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  eventType!: string;

  @ApiProperty({ type: String })
  callbackUrl!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de suscripciones de webhook de un proveedor. */
export class ListProviderWebhookSubscriptionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de suscripciones de webhook de un proveedor. */
export class IntegrationWebhookSubscriptionPageDto extends pageResponseOf(
  IntegrationWebhookSubscriptionItemDto,
  'IntegrationWebhookSubscriptionPageDto',
) {}
