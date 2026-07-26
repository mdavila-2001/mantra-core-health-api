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
export type BaseRole = (typeof BASE_ROLES)[number];

/** Ámbito del rol. */
export const ROLE_SCOPES = ['SELF', 'BRANCH', 'TENANT', 'GLOBAL'] as const;
export type RoleScope = (typeof ROLE_SCOPES)[number];

/** Cuerpo de `POST /authz/roles` (UC-06-03). */
export class CreateRoleDto {
  @ApiProperty({ description: 'Código único del rol', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre legible', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Tenant propietario (omitir para rol de sistema)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Rol padre (herencia)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentRoleId?: string;

  @ApiPropertyOptional({ description: 'Rol base', enum: BASE_ROLES })
  @IsOptional()
  @IsIn(BASE_ROLES)
  baseRole?: BaseRole;

  @ApiPropertyOptional({ description: 'Ámbito', enum: ROLE_SCOPES })
  @IsOptional()
  @IsIn(ROLE_SCOPES)
  scope?: RoleScope;

  @ApiPropertyOptional({ description: 'Rol de sistema (global, sin tenant)' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: 'Asignable a usuarios' })
  @IsOptional()
  @IsBoolean()
  isAssignable?: boolean;

  @ApiPropertyOptional({ description: 'Prioridad' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
