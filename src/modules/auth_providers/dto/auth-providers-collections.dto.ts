import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de proveedores de identidad (V40-03). */
export class IdentityProviderItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  protocolConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  providerCategoryConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  issuer!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  logoFileId!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  isGlobal!: boolean | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de proveedores de identidad. */
export class ListIdentityProvidersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  protocolConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de proveedores de identidad. */
export class IdentityProviderPageDto extends pageResponseOf(
  IdentityProviderItemDto,
  'IdentityProviderPageDto',
) {}

/** Fila de reglas de aprovisionamiento (V40-07). */
export class ProvisioningRuleItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: Number })
  priority!: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  conditionJson!: unknown;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  assignRoleConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  assignTenantId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  effectConceptId!: string | null;

  @ApiProperty({ type: Boolean })
  isActive!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de reglas de aprovisionamiento. */
export class ListProvisioningRulesQueryDto extends PaginationQueryDto {}

/** Página de reglas de aprovisionamiento. */
export class ProvisioningRulePageDto extends pageResponseOf(
  ProvisioningRuleItemDto,
  'ProvisioningRulePageDto',
) {}

/** Fila de vínculos de proveedor con el tenant (V40-09). */
export class ProviderTenantBindingItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: Boolean })
  isEnabled!: boolean;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  autoProvision!: boolean | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  defaultRoleConceptId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  allowedEmailDomains!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  justInTimeProvisioning!: boolean | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  ordinal!: number | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de vínculos de proveedor con el tenant. */
export class ListTenantBindingsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  providerId?: string;
}

/** Página de vínculos de proveedor con el tenant. */
export class ProviderTenantBindingPageDto extends pageResponseOf(
  ProviderTenantBindingItemDto,
  'ProviderTenantBindingPageDto',
) {}
