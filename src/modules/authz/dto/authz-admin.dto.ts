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
} from 'class-validator';

/** Tope de elementos por página de los listados de administración de acceso. */
export const AUTHZ_ADMIN_MAX_PAGE_SIZE = 200;
export const AUTHZ_ADMIN_DEFAULT_PAGE_SIZE = 50;

/** Estado de una asignación de rol, tal como lo muestra la consola. */
export const ADMIN_ASSIGNMENT_STATES = [
  'ACTIVE',
  'REVOKED',
  'EXPIRED',
  'OTHER',
] as const;

/** Ámbito de un rol, tal como lo declara `authz.roles.scope_concept_id`. */
export const ADMIN_ROLE_SCOPES = [
  'SELF',
  'BRANCH',
  'TENANT',
  'GLOBAL',
] as const;

export class UserIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;
}

export class RoleAssignmentParamsDto extends UserIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assignmentId!: string;
}

export class RoleIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  roleId!: string;
}

/** Cursor y tope de los listados paginados por clave. */
class AdminPageQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: AUTHZ_ADMIN_MAX_PAGE_SIZE,
    default: AUTHZ_ADMIN_DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(AUTHZ_ADMIN_MAX_PAGE_SIZE)
  limit?: number;

  @ApiPropertyOptional({
    maxLength: 400,
    description: '`nextCursor` de la página anterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  cursor?: string;
}

export class PermissionsQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Texto a buscar en el código, el nombre y el recurso',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Categoría de permiso' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class InternalUsersQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Texto a buscar en el nombre visible',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    maxLength: 100,
    example: 'DPO',
    description:
      'Sólo quienes tienen este rol activo, en cualquier ámbito. Sin él, la lista son los usuarios con un rol de ámbito global o un rol global de plataforma',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleCode?: string;
}

export class UserRoleAssignmentDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) roleId!: string;
  @ApiProperty({ description: 'Código que exige `@Roles(...)`' })
  roleCode!: string;
  @ApiProperty() roleName!: string;
  @ApiPropertyOptional({ nullable: true, enum: ADMIN_ROLE_SCOPES })
  roleScope!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) tenantId!:
    string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) branchId!:
    string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) practiceId!:
    string | null;
  @ApiProperty({ enum: ADMIN_ASSIGNMENT_STATES }) status!: string;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  validFrom!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  validTo!: string | null;
  @ApiProperty({
    description:
      '`true` si la asignación está activa y su vigencia cubre el instante de la consulta: es la que llega al token',
  })
  isEffective!: boolean;
  @ApiProperty({
    description:
      '`true` si el rol es de ámbito global y se asignó sin tenant, sede ni consultorio: autoriza en las rutas sin tenant. Un rol global asignado con tenant no autoriza ahí',
  })
  appliesGlobally!: boolean;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  assignedByUserId!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
}

export class UserRoleAssignmentsDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ type: [UserRoleAssignmentDto] })
  items!: UserRoleAssignmentDto[];
}

export class RevokedAssignmentDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['REVOKED'] }) status!: 'REVOKED';
  @ApiProperty({
    description:
      'El rol deja de llegar al token en su próxima renovación; las sesiones ya emitidas lo conservan hasta entonces',
  })
  note!: string;
}

export class PermissionSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() resource!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) categoryId!:
    string | null;
  @ApiProperty() isDangerous!: boolean;
  @ApiProperty() isFieldLevel!: boolean;
  @ApiProperty({
    description: 'Sólo lo concede un rol, no una excepción por usuario',
  })
  isRoleRestricted!: boolean;
}

export class PermissionsPageDto {
  @ApiProperty({ type: [PermissionSummaryDto] }) items!: PermissionSummaryDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}

export class RolePermissionDto {
  @ApiProperty({ format: 'uuid' }) permissionId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() resource!: string;
  @ApiProperty({ enum: ['ALLOW', 'DENY', 'OTHER'] }) effect!: string;
  @ApiPropertyOptional({ nullable: true, enum: ADMIN_ROLE_SCOPES }) scope!:
    string | null;
}

export class RolePermissionsDto {
  @ApiProperty({ format: 'uuid' }) roleId!: string;
  @ApiProperty() roleCode!: string;
  @ApiProperty({ type: [RolePermissionDto] }) items!: RolePermissionDto[];
}

export class InternalUserAssignmentDto {
  @ApiProperty({ format: 'uuid' }) assignmentId!: string;
  @ApiProperty() roleCode!: string;
  @ApiProperty() roleName!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) tenantId!:
    string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  validTo!: string | null;
}

export class InternalUserDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  lastLoginAt!: string | null;
  @ApiProperty({
    type: [String],
    description:
      'Roles globales de `iam` activos (`SECURITY_ADMIN`, `SUPERADMIN`, …)',
  })
  globalRoles!: string[];
  @ApiProperty({
    type: [InternalUserAssignmentDto],
    description: 'Asignaciones de rol activas de `authz`',
  })
  assignments!: InternalUserAssignmentDto[];
}

export class InternalUsersPageDto {
  @ApiProperty({ type: [InternalUserDto] }) items!: InternalUserDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}
