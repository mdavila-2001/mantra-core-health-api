import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Rol base de composición. */
export const BASE_ROLES = ['CLINICAL', 'ADMIN', 'STAFF'] as const;
/**
 * Define el tipo de dominio base role.
 */
export type BaseRole = (typeof BASE_ROLES)[number];

/** Ámbito del rol. */
export const ROLE_SCOPES = ['SELF', 'BRANCH', 'TENANT', 'GLOBAL'] as const;
/**
 * Define el tipo de dominio role scope.
 */
export type RoleScope = (typeof ROLE_SCOPES)[number];

/** Cuerpo de `POST /authz/roles` (UC-06-03). */
export class CreateRoleDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único del rol', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
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
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant propietario (omitir para rol de sistema)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a parent role.
   */
  @ApiPropertyOptional({ description: 'Rol padre (herencia)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentRoleId?: string;

  /**
   * Valor de base role mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Rol base', enum: BASE_ROLES })
  @IsOptional()
  @IsIn(BASE_ROLES)
  baseRole?: BaseRole;

  /**
   * Valor de scope mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Ámbito', enum: ROLE_SCOPES })
  @IsOptional()
  @IsIn(ROLE_SCOPES)
  scope?: RoleScope;

  /**
   * Valor de is system mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Rol de sistema (global, sin tenant)' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  /**
   * Valor de is assignable mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Asignable a usuarios' })
  @IsOptional()
  @IsBoolean()
  isAssignable?: boolean;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Prioridad' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
