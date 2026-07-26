import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Acciones soportadas por el catálogo de permisos. */
export const PERMISSION_ACTIONS = [
  'READ',
  'WRITE',
  'CREATE',
  'DELETE',
  'EXECUTE',
  'APPROVE',
] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/** Ámbitos por defecto de un permiso. */
export const PERMISSION_SCOPES = ['SELF', 'BRANCH', 'TENANT', 'GLOBAL'] as const;
export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

/** Cuerpo de `POST /authz/permissions` (UC-06-01). */
export class CreatePermissionDto {
  @ApiProperty({ description: 'Código único del permiso', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  code!: string;

  @ApiProperty({ description: 'Nombre legible', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Recurso protegido (p. ej. patient, encounter)', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  resource!: string;

  @ApiProperty({ description: 'Acción', enum: PERMISSION_ACTIONS })
  @IsIn(PERMISSION_ACTIONS)
  action!: PermissionAction;

  @ApiPropertyOptional({ description: 'Id de la categoría', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Ámbito por defecto', enum: PERMISSION_SCOPES })
  @IsOptional()
  @IsIn(PERMISSION_SCOPES)
  defaultScope?: PermissionScope;

  @ApiPropertyOptional({ description: 'Permiso a nivel de campo' })
  @IsOptional()
  @IsBoolean()
  isFieldLevel?: boolean;

  @ApiPropertyOptional({ description: 'Permiso peligroso (exige aprobación de segundo admin)' })
  @IsOptional()
  @IsBoolean()
  isDangerous?: boolean;

  @ApiPropertyOptional({ description: 'Restringido a un rol concreto' })
  @IsOptional()
  @IsBoolean()
  isRoleRestricted?: boolean;

  @ApiPropertyOptional({ description: 'Código de rol requerido si es restringido', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requiredRoleCode?: string;

  @ApiPropertyOptional({ description: 'Permite concesión directa a usuario' })
  @IsOptional()
  @IsBoolean()
  allowDirectUserGrant?: boolean;
}
