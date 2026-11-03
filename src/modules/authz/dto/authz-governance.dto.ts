import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AdminPageQueryDto, UserRoleAssignmentDto } from './authz-admin.dto';
import { EvaluateDecisionDto } from './evaluate-decision.dto';
import type { DecisionResponseDto } from './authz-responses.dto';

/** Estado de la cuenta, tal como lo muestra la consola de gobierno. */
export const GOVERNANCE_ACCOUNT_STATUSES = [
  'ACTIVE',
  'LOCKED',
  'ANONYMIZED',
  'OTHER',
] as const;

/** Qué vigencia ver en los listados de concesiones. */
export const GOVERNANCE_GRANT_FILTERS = ['EFFECTIVE', 'ALL'] as const;

/** Camino por el que un usuario tiene un permiso. */
export const HOLDER_SOURCES = ['ROLE', 'USER', 'RESOURCE'] as const;

/** Tope de días de la revisión periódica. */
export const ACCESS_REVIEW_MAX_DAYS = 3650;
export const ACCESS_REVIEW_DEFAULT_DAYS = 90;

export class PermissionIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  permissionId!: string;
}

/** Listado de concesiones de un usuario: qué vigencia y la paginación. */
export class GrantsQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({
    enum: GOVERNANCE_GRANT_FILTERS,
    default: 'EFFECTIVE',
    description:
      '`EFFECTIVE`: activas y dentro de su vigencia. `ALL`: también las revocadas, vencidas y futuras',
  })
  @IsOptional()
  @IsIn(GOVERNANCE_GRANT_FILTERS)
  show?: (typeof GOVERNANCE_GRANT_FILTERS)[number];
}

export class HoldersQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({
    enum: HOLDER_SOURCES,
    description: 'Sólo quienes lo tienen por ese camino',
  })
  @IsOptional()
  @IsIn(HOLDER_SOURCES)
  source?: (typeof HOLDER_SOURCES)[number];

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Texto a buscar en el nombre visible',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class ReviewsQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Cuenta revisada' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Quien revisó' })
  @IsOptional()
  @IsUUID()
  reviewerId?: string;
}

export class DueReviewsQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: ACCESS_REVIEW_MAX_DAYS,
    default: ACCESS_REVIEW_DEFAULT_DAYS,
    description:
      'Cuentas cuya última revisión es anterior a estos días, o que nunca fueron revisadas',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ACCESS_REVIEW_MAX_DAYS)
  olderThanDays?: number;
}

export class AccessReviewDto {
  @ApiProperty({ format: 'uuid', description: 'Id del sello en la bitácora' })
  id!: string;
  @ApiProperty({ format: 'uuid', description: 'Cuenta revisada' })
  userId!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  userDisplayName!: string | null;
  @ApiProperty({ format: 'uuid', description: 'Quien revisó' })
  reviewerUserId!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  reviewerDisplayName!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) reviewedAt!: string;
}

export class AccessReviewsPageDto {
  @ApiProperty({ type: [AccessReviewDto] }) items!: AccessReviewDto[];
  @ApiPropertyOptional({ nullable: true, type: String }) nextCursor!:
    string | null;
  @ApiProperty() limit!: number;
}

export class DueReviewDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: GOVERNANCE_ACCOUNT_STATUSES }) accountStatus!: string;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    format: 'date-time',
    description: '`null`: sin revisión dentro del horizonte de búsqueda',
  })
  lastReviewedAt!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', type: String })
  lastReviewerUserId!: string | null;
}

export class DueReviewsPageDto {
  @ApiProperty({ type: [DueReviewDto] }) items!: DueReviewDto[];
  @ApiPropertyOptional({ nullable: true, type: String }) nextCursor!:
    string | null;
  @ApiProperty() limit!: number;
  @ApiProperty() olderThanDays!: number;
  @ApiProperty({
    description:
      'Días hacia atrás en que se buscan revisiones: más allá, una cuenta cuenta como no revisada',
  })
  lookbackDays!: number;
}

export class AccessMapCountsDto {
  @ApiProperty({ description: 'Excepciones de permiso por usuario vigentes' })
  directGrants!: number;
  @ApiProperty({ description: 'Grants sobre un recurso concreto vigentes' })
  resourceScopeGrants!: number;
  @ApiProperty({
    description:
      'Campos restringidos (sin lectura, sin escritura o enmascarados) por sus roles efectivos',
  })
  restrictedFields!: number;
}

export class AccessMapUserDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: GOVERNANCE_ACCOUNT_STATUSES }) accountStatus!: string;
}

/** «Quién puede qué» de un usuario: lo que no es paginable va aquí; el resto, en sus listados. */
export class AccessMapDto {
  @ApiProperty({ type: AccessMapUserDto }) user!: AccessMapUserDto;
  @ApiProperty({
    type: [String],
    description: 'Roles globales de `iam` activos',
  })
  globalRoles!: string[];
  @ApiProperty({
    type: [UserRoleAssignmentDto],
    description: 'Asignaciones de rol de `authz`, vigentes o no',
  })
  assignments!: UserRoleAssignmentDto[];
  @ApiProperty({ type: AccessMapCountsDto }) counts!: AccessMapCountsDto;
  @ApiPropertyOptional({ type: AccessReviewDto, nullable: true })
  lastReview!: AccessReviewDto | null;
}

export class DirectGrantDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) permissionId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() resource!: string;
  @ApiProperty({ enum: ['ALLOW', 'DENY', 'OTHER'] }) effect!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) scope!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', type: String })
  tenantId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) reason!: string | null;
  @ApiProperty({ enum: ['ACTIVE', 'REVOKED', 'EXPIRED', 'OTHER'] })
  status!: string;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  validFrom!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  validTo!: string | null;
  @ApiProperty({ description: 'Activa y dentro de su vigencia: cuenta hoy' })
  isEffective!: boolean;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', type: String })
  grantedByUserId!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
}

export class ScopeGrantDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) permissionId!: string;
  @ApiProperty() code!: string;
  @ApiProperty({
    enum: ['PATIENT', 'ENCOUNTER', 'DOCUMENT', 'RECORD', 'OTHER'],
  })
  resourceType!: string;
  @ApiProperty({ format: 'uuid' }) resourceId!: string;
  @ApiProperty({ enum: ['ALLOW', 'DENY', 'OTHER'] }) effect!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', type: String })
  tenantId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  validFrom!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  validTo!: string | null;
  @ApiProperty({ description: 'Dentro de su vigencia: cuenta hoy' })
  isEffective!: boolean;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', type: String })
  grantedByUserId!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
}

export class RestrictedFieldDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) roleId!: string;
  @ApiProperty({
    description: 'Rol que define la regla (puede ser un rol padre heredado)',
  })
  roleCode!: string;
  @ApiProperty() entity!: string;
  @ApiProperty() columnName!: string;
  @ApiProperty() canRead!: boolean;
  @ApiProperty() canWrite!: boolean;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    enum: ['REDACT', 'HASH', 'PARTIAL', 'NULLIFY'],
  })
  maskStrategy!: string | null;
}

/** Página genérica de la vista de gobierno. */
class GovernancePageBase {
  @ApiPropertyOptional({ nullable: true, type: String }) nextCursor!:
    string | null;
  @ApiProperty() limit!: number;
}
export class DirectGrantsPageDto extends GovernancePageBase {
  @ApiProperty({ type: [DirectGrantDto] }) items!: DirectGrantDto[];
}
export class ScopeGrantsPageDto extends GovernancePageBase {
  @ApiProperty({ type: [ScopeGrantDto] }) items!: ScopeGrantDto[];
}
export class RestrictedFieldsPageDto extends GovernancePageBase {
  @ApiProperty({ type: [RestrictedFieldDto] }) items!: RestrictedFieldDto[];
}

export class HolderSourceDto {
  @ApiProperty({ enum: HOLDER_SOURCES }) source!: string;
  @ApiProperty({ enum: ['ALLOW', 'DENY', 'OTHER'] }) effect!: string;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: '`ROLE`: rol que tiene asignado',
  })
  roleCode!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description:
      '`ROLE`: rol que define el permiso (distinto del asignado si lo hereda de un rol padre)',
  })
  viaRoleCode!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', type: String })
  resourceId!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', type: String })
  tenantId!: string | null;
}

export class PermissionHolderDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: GOVERNANCE_ACCOUNT_STATUSES }) accountStatus!: string;
  @ApiProperty({ type: [HolderSourceDto] }) sources!: HolderSourceDto[];
}

export class PermissionHoldersPageDto extends GovernancePageBase {
  @ApiProperty({ format: 'uuid' }) permissionId!: string;
  @ApiProperty({ type: [PermissionHolderDto] }) items!: PermissionHolderDto[];
}

/** Cuerpo de la simulación: el mismo de `POST /authz/decisions/evaluate`. */
export class SimulateDecisionDto extends EvaluateDecisionDto {}

export class SimulationResultDto {
  @ApiProperty({
    enum: [true],
    description: 'Siempre `true`: nada se aplicó ni se concedió',
  })
  simulated!: true;
  @ApiProperty({
    description:
      'La decisión que devuelve el PDP real, sin transformar: la misma que `POST /authz/decisions/evaluate`',
  })
  decision!: DecisionResponseDto;
}
