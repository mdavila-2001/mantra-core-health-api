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
/**
 * Define el tipo de dominio permission action.
 */
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/** Ámbitos por defecto de un permiso. */
export const PERMISSION_SCOPES = [
  'SELF',
  'BRANCH',
  'TENANT',
  'GLOBAL',
] as const;
/**
 * Define el tipo de dominio permission scope.
 */
export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

/** Cuerpo de `POST /authz/permissions` (UC-06-01). */
export class CreatePermissionDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único del permiso', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre legible', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Valor de resource mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Recurso protegido (p. ej. patient, encounter)',
    maxLength: 150,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  resource!: string;

  /**
   * Valor de action mantenido por la instancia.
   */
  @ApiProperty({ description: 'Acción', enum: PERMISSION_ACTIONS })
  @IsIn(PERMISSION_ACTIONS)
  action!: PermissionAction;

  /**
   * Identificador asociado a category.
   */
  @ApiPropertyOptional({ description: 'Id de la categoría', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /**
   * Valor de default scope mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Ámbito por defecto',
    enum: PERMISSION_SCOPES,
  })
  @IsOptional()
  @IsIn(PERMISSION_SCOPES)
  defaultScope?: PermissionScope;

  /**
   * Valor de is field level mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Permiso a nivel de campo' })
  @IsOptional()
  @IsBoolean()
  isFieldLevel?: boolean;

  /**
   * Valor de is dangerous mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Permiso peligroso (exige aprobación de segundo admin)',
  })
  @IsOptional()
  @IsBoolean()
  isDangerous?: boolean;

  /**
   * Valor de is role restricted mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Restringido a un rol concreto' })
  @IsOptional()
  @IsBoolean()
  isRoleRestricted?: boolean;

  /**
   * Valor de required role code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Código de rol requerido si es restringido',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requiredRoleCode?: string;

  /**
   * Valor de allow direct user grant mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Permite concesión directa a usuario' })
  @IsOptional()
  @IsBoolean()
  allowDirectUserGrant?: boolean;
}
