import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** El motivo es obligatorio en toda acción de gobierno: queda en el rastro de seguridad. */
export const GOVERNANCE_REASON_MIN = 10;
export const GOVERNANCE_REASON_MAX = 500;

/** Cuerpo de las acciones del ciclo de vida: suspender, reactivar y dar de baja. */
export class LifecycleActionDto {
  @ApiProperty({
    minLength: GOVERNANCE_REASON_MIN,
    maxLength: GOVERNANCE_REASON_MAX,
    description: 'Por qué se hace; queda en el historial',
  })
  @IsString()
  @MinLength(GOVERNANCE_REASON_MIN)
  @MaxLength(GOVERNANCE_REASON_MAX)
  reason!: string;
}

/** Estados que la API distingue de una cuenta interna. */
export const USER_LIFECYCLE_STATES = [
  'ACTIVE',
  'SUSPENDED',
  'OFFBOARDED',
  'LOCKED_OTHER',
  'ANONYMIZED',
  'OTHER',
] as const;
export type UserLifecycleState = (typeof USER_LIFECYCLE_STATES)[number];

export class LifecycleEventDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['SUSPENDED', 'REACTIVATED', 'OFFBOARDED'] })
  kind!: 'SUSPENDED' | 'REACTIVATED' | 'OFFBOARDED';
  @ApiProperty() reason!: string;
  @ApiProperty({ nullable: true, type: String }) actorUserId!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) recordedAt!: Date;
}

export class UserLifecycleDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ enum: USER_LIFECYCLE_STATES }) state!: UserLifecycleState;
  @ApiProperty({ type: [LifecycleEventDto] }) history!: LifecycleEventDto[];
}

export class LifecycleResultDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ enum: USER_LIFECYCLE_STATES }) state!: UserLifecycleState;
  @ApiProperty({
    description:
      'Cuántas asignaciones de rol se revocaron (sólo la baja revoca roles)',
  })
  revokedAssignments!: number;
  @ApiProperty() note!: string;
}

/** Decisiones posibles de una revisión periódica de accesos. */
export const ACCESS_REVIEW_DECISIONS = [
  'CERTIFIED',
  'CHANGES_REQUIRED',
] as const;
export type AccessReviewDecision = (typeof ACCESS_REVIEW_DECISIONS)[number];

export class RecordAccessReviewDto {
  @ApiProperty({ enum: ACCESS_REVIEW_DECISIONS })
  @IsIn(ACCESS_REVIEW_DECISIONS)
  decision!: AccessReviewDecision;

  @ApiProperty({ minLength: GOVERNANCE_REASON_MIN, maxLength: GOVERNANCE_REASON_MAX })
  @IsString()
  @MinLength(GOVERNANCE_REASON_MIN)
  @MaxLength(GOVERNANCE_REASON_MAX)
  reason!: string;

  @ApiProperty({
    type: [String],
    description:
      'Las asignaciones activas que se revisaron. Deben ser de ese usuario y seguir activas.',
  })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  assignmentIds!: string[];
}

export class AccessReviewDto {
  @ApiProperty() id!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ enum: ACCESS_REVIEW_DECISIONS }) decision!: AccessReviewDecision;
  @ApiProperty() reason!: string;
  @ApiProperty({ type: [String] }) assignmentIds!: string[];
  @ApiProperty({ nullable: true, type: String }) reviewerUserId!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) reviewedAt!: Date;
}

export class UserAccessReviewsDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ type: [AccessReviewDto] }) items!: AccessReviewDto[];
}

/** Cuenta con accesos activos y la última revisión que tuvo (si tuvo alguna). */
export class AccessReviewDueDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ description: 'Asignaciones de rol activas hoy' })
  activeAssignments!: number;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  lastReviewedAt!: Date | null;
}

export class AccessReviewDueQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 3650,
    description:
      'Se listan quienes no se revisaron en los últimos N días, o nunca. La cadencia la fija quien pregunta: la API no inventa una.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  olderThanDays?: number;
}

export class AccessReviewDuePageDto {
  @ApiProperty({ type: [AccessReviewDueDto] }) items!: AccessReviewDueDto[];
  @ApiProperty({ nullable: true, type: Number }) olderThanDays!: number | null;
}

/* ---- Permisos por campo y por alcance de recurso ---------------------------- */

export class RoleFieldPermissionDto {
  @ApiProperty() entity!: string;
  @ApiProperty() columnName!: string;
  @ApiProperty() canRead!: boolean;
  @ApiProperty() canWrite!: boolean;
  @ApiProperty({ nullable: true, type: String }) maskStrategy!: string | null;
  @ApiProperty({ nullable: true, type: Object })
  conditionJson!: Record<string, unknown> | null;
}

export class RoleFieldPermissionsDto {
  @ApiProperty({ format: 'uuid' }) roleId!: string;
  @ApiProperty({ type: [RoleFieldPermissionDto] }) items!: RoleFieldPermissionDto[];
}

export class ResourceScopeGrantsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID()
  subjectId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID()
  resourceId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID()
  permissionId?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
  @ApiPropertyOptional({ maxLength: 400 }) @IsOptional() @IsString() @MaxLength(400)
  cursor?: string;
}

export class ResourceScopeGrantViewDto {
  @ApiProperty() id!: string;
  @ApiProperty({ format: 'uuid' }) subjectId!: string;
  @ApiProperty({ format: 'uuid' }) permissionId!: string;
  @ApiProperty({ format: 'uuid' }) resourceId!: string;
  @ApiProperty({ nullable: true, type: String }) tenantId!: string | null;
  @ApiProperty({ enum: ['USER', 'ROLE', 'SERVICE', 'OTHER'] })
  subjectType!: string;
  @ApiProperty({ enum: ['PATIENT', 'ENCOUNTER', 'DOCUMENT', 'RECORD', 'OTHER'] })
  resourceType!: string;
  @ApiProperty({ enum: ['ALLOW', 'DENY', 'OTHER'] }) effect!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  validFrom!: Date | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  validTo!: Date | null;
  @ApiProperty({ description: 'Vigente en el instante de la consulta' })
  isEffective!: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

export class ResourceScopeGrantsPageDto {
  @ApiProperty({ type: [ResourceScopeGrantViewDto] })
  items!: ResourceScopeGrantViewDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}

export class ResourceScopeGrantIdParamDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() grantId!: string;
}

/**
 * Cuerpo opcional de `DELETE /authz/resource-scope-grants/:grantId`. Es opcional para no romper a
 * los clientes que no lo envían; el servicio lo exige cuando el permiso a terminar es de efecto
 * DENY (`RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED`), porque levantar una denegación abre un acceso.
 */
export class EndResourceScopeGrantDto {
  @ApiPropertyOptional({
    minLength: GOVERNANCE_REASON_MIN,
    maxLength: GOVERNANCE_REASON_MAX,
    description:
      'Por qué se termina. Obligatorio si el permiso es de efecto DENY; opcional en un ALLOW.',
  })
  @IsOptional()
  @IsString()
  @MinLength(GOVERNANCE_REASON_MIN)
  @MaxLength(GOVERNANCE_REASON_MAX)
  reason?: string;
}

export class EndedResourceScopeGrantDto {
  @ApiProperty() id!: string;
  @ApiProperty({ type: String, format: 'date-time' }) validTo!: Date;
}
