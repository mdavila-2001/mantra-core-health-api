import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Extensión del gobierno de acceso (permisos por campo de un rol y permisos por alcance de
 * recurso). Vive aparte de `authz-governance.dto.ts` —«quién puede qué», revisiones y simulador—
 * para no cruzarse con él.
 */

/** El motivo de terminar un permiso DENY queda en el rastro: mínimo para que diga algo. */
export const GOVERNANCE_REASON_MIN = 10;
export const GOVERNANCE_REASON_MAX = 500;

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
  @ApiProperty({ type: [RoleFieldPermissionDto] })
  items!: RoleFieldPermissionDto[];
}

export class ResourceScopeGrantsQueryDto {
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
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
  @ApiPropertyOptional({ maxLength: 400 })
  @IsOptional()
  @IsString()
  @MaxLength(400)
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
  @ApiProperty({
    enum: ['PATIENT', 'ENCOUNTER', 'DOCUMENT', 'RECORD', 'OTHER'],
  })
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
