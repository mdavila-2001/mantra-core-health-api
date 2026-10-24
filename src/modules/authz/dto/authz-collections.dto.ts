import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de concesiones de acceso clínico (V06-03, V06-06). */
export class ClinicalAccessGrantItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  grantedUserId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  branchId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  encounterId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  consentId!: string | null;

  @ApiProperty({ format: 'uuid' })
  reasonConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  accessLevelConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  validFrom!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  validTo!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de concesiones de acceso clínico. */
export class ListClinicalAccessGrantsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  grantedUserId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de concesiones de acceso clínico. */
export class ClinicalAccessGrantPageDto extends pageResponseOf(
  ClinicalAccessGrantItemDto,
  'ClinicalAccessGrantPageDto',
) {}

/** Fila de concesiones de alcance de recurso (V06-10). */
export class ResourceScopeGrantItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  subjectTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  subjectId!: string;

  @ApiProperty({ format: 'uuid' })
  permissionId!: string;

  @ApiProperty({ format: 'uuid' })
  resourceTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  @ApiProperty({ format: 'uuid' })
  effectConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de concesiones de alcance de recurso. */
export class ListResourceScopeGrantsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  permissionId?: string;
}

/** Página de concesiones de alcance de recurso. */
export class ResourceScopeGrantPageDto extends pageResponseOf(
  ResourceScopeGrantItemDto,
  'ResourceScopeGrantPageDto',
) {}

/** Fila de políticas de acceso (V06-14). */
export class AccessPolicyItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  effectConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  targetResource!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  conditionJson!: unknown;

  @ApiPropertyOptional({ type: Number, nullable: true })
  priority!: number | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de políticas de acceso. */
export class ListAccessPoliciesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de políticas de acceso. */
export class AccessPolicyPageDto extends pageResponseOf(
  AccessPolicyItemDto,
  'AccessPolicyPageDto',
) {}

/** Fila de excepciones de permiso de un usuario (V06-15). */
export class UserPermissionGrantItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  permissionId!: string;

  @ApiProperty({ format: 'uuid' })
  effectConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  scopeConceptId!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  resourceSelectorJson!: unknown;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  reason!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo!: Date | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de excepciones de permiso de un usuario. */
export class ListUserPermissionGrantsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  permissionId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de excepciones de permiso de un usuario. */
export class UserPermissionGrantPageDto extends pageResponseOf(
  UserPermissionGrantItemDto,
  'UserPermissionGrantPageDto',
) {}
