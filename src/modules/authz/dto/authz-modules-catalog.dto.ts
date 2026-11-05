import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  CANONICAL_ACTIONS,
  OTHER_ACTION,
} from '../services/authz-modules-route-derivation';

/** Acciones que puede tener una celda de la matriz: las canónicas y `other`. */
export const MODULE_CELL_ACTIONS = [
  ...CANONICAL_ACTIONS,
  OTHER_ACTION,
] as const;

/** Cómo autoriza una ruta, leído de los decoradores del controlador. */
export const ROUTE_AUTH_STATUSES = [
  'PUBLIC',
  'ROLE_ONLY',
  'GUARD_ONLY',
  'SELF_SERVICE',
  'UNDECLARED_AUTH',
] as const;
export type RouteAuthStatus = (typeof ROUTE_AUTH_STATUSES)[number];

/** Estado de cobertura de una celda (recurso × acción). */
export const CELL_COVERAGES = [
  'FINE_PERMISSION',
  'UNDECLARED_AUTH',
  'ROLE_ONLY',
  'GUARD_ONLY',
  'NOT_APPLICABLE',
] as const;
export type CellCoverage = (typeof CELL_COVERAGES)[number];

export const GAP_KINDS = [
  'MODULE_WITHOUT_FINE_PERMISSIONS',
  'ROLE_ONLY',
  'GUARD_ONLY',
  'UNDECLARED_AUTH',
] as const;
export type GapKind = (typeof GAP_KINDS)[number];

export const GAP_SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type GapSeverity = (typeof GAP_SEVERITIES)[number];

/** Filtro de `GET /authz/catalog/modules`. */
export class ModulesCatalogQueryDto {
  @ApiPropertyOptional({
    description: 'Sólo este módulo (clave en snake_case, p. ej. `pharma_lab`)',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9_]*$/)
  module?: string;
}

export class ModuleRouteStatsDto {
  @ApiProperty() total!: number;
  @ApiProperty() publicRoutes!: number;
  @ApiProperty({ description: 'Autorizadas por `@Roles(...)` y nada más' })
  roleOnly!: number;
  @ApiProperty({ description: 'Sin `@Roles`, con un `@UseGuards` de dominio' })
  guardOnly!: number;
  @ApiProperty({ description: 'Rutas `/me/...`: operan sobre el titular' })
  selfService!: number;
  @ApiProperty({
    description:
      'Sin `@Roles`, sin `@Public` y sin guard: la autorización no está declarada en el controlador (puede resolverse en el servicio por pertenencia o propiedad)',
  })
  undeclaredAuth!: number;
  @ApiProperty({ description: 'Rutas que cambian estado' }) mutating!: number;
  @ApiProperty({
    description: 'Rutas que cambian estado y sólo tienen `@Roles`',
  })
  mutatingRoleOnly!: number;
}

export class ModuleGrantDto {
  @ApiProperty({ format: 'uuid' }) roleId!: string;
  @ApiProperty() roleCode!: string;
  @ApiProperty() roleName!: string;
  @ApiProperty({ enum: ['ALLOW', 'DENY'] }) effect!: 'ALLOW' | 'DENY';
  @ApiPropertyOptional({
    description: 'SELF | BRANCH | TENANT | GLOBAL; nulo si no tiene ámbito',
    nullable: true,
  })
  scope!: string | null;
  @ApiPropertyOptional({
    description:
      'Restricción ABAC del vínculo. Viaja para que quien reemplaza los permisos del rol pueda conservarla.',
    nullable: true,
    type: Object,
  })
  constraintJson!: Record<string, unknown> | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  fieldValueSetId!: string | null;
}

export class ModulePermissionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: 'Recurso tal como está en el catálogo' })
  resource!: string;
  @ApiPropertyOptional({
    description: 'Acción sembrada (READ, WRITE…), tal como está en el catálogo',
    nullable: true,
  })
  legacyAction!: string | null;
  @ApiProperty({ enum: MODULE_CELL_ACTIONS }) action!: string;
  @ApiProperty({
    description: 'El código ya tiene la forma `<modulo>.<recurso>.<accion>`',
  })
  canonicalCode!: boolean;
  @ApiProperty() isDangerous!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ type: [ModuleGrantDto] }) grants!: ModuleGrantDto[];
}

export class ModuleCellDto {
  @ApiProperty({ enum: MODULE_CELL_ACTIONS }) action!: string;
  @ApiPropertyOptional({
    description:
      'Código sugerido, derivado de las rutas reales. No está sembrado.',
    nullable: true,
  })
  proposedCode!: string | null;
  @ApiProperty({ enum: CELL_COVERAGES }) coverage!: CellCoverage;
  @ApiProperty({ type: [String], description: 'Permisos finos de esta celda' })
  permissionIds!: string[];
  @ApiProperty() routeCount!: number;
  @ApiProperty() mutatingRouteCount!: number;
  @ApiProperty() undeclaredRouteCount!: number;
  @ApiProperty() publicRouteCount!: number;
  @ApiProperty({
    type: [String],
    description: 'Códigos de rol que las rutas de la celda exigen con `@Roles`',
  })
  routeRoles!: string[];
}

export class ModuleResourceDto {
  @ApiProperty() resource!: string;
  @ApiProperty({ type: [ModulePermissionDto] })
  permissions!: ModulePermissionDto[];
  @ApiProperty({ type: [ModuleCellDto] }) cells!: ModuleCellDto[];
}

export class ModuleGapRouteDto {
  @ApiProperty() method!: string;
  @ApiProperty() template!: string;
  @ApiProperty() controller!: string;
  @ApiProperty() handler!: string;
  @ApiProperty({ type: [String] }) roles!: string[];
}

export class ModuleGapDto {
  @ApiProperty({ enum: GAP_KINDS }) kind!: GapKind;
  @ApiProperty({ enum: GAP_SEVERITIES }) severity!: GapSeverity;
  @ApiProperty() module!: string;
  @ApiPropertyOptional({ nullable: true }) resource!: string | null;
  @ApiPropertyOptional({ enum: CANONICAL_ACTIONS, nullable: true })
  action!: string | null;
  @ApiPropertyOptional({ nullable: true }) proposedCode!: string | null;
  @ApiProperty() routeCount!: number;
  @ApiProperty({ type: [ModuleGapRouteDto] })
  sampleRoutes!: ModuleGapRouteDto[];
  @ApiProperty({ type: [String] }) roles!: string[];
}

export class ModuleEntryDto {
  @ApiProperty({ description: 'Clave del módulo (snake_case)' }) key!: string;
  @ApiProperty({ type: ModuleRouteStatsDto }) routes!: ModuleRouteStatsDto;
  @ApiProperty() permissionCount!: number;
  @ApiProperty({ description: 'Vínculos rol→permiso activos del módulo' })
  grantCount!: number;
  @ApiProperty({ type: [String], description: 'Roles que el código exige' })
  roleCodesInCode!: string[];
  @ApiProperty({ type: [ModuleResourceDto] }) resources!: ModuleResourceDto[];
  @ApiProperty({ type: [ModuleGapDto] }) gaps!: ModuleGapDto[];
}

export class ModuleRoleRefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() isSystem!: boolean;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;
}

export class ModulesCatalogSummaryDto {
  @ApiProperty() modules!: number;
  @ApiProperty() permissions!: number;
  @ApiProperty() routes!: number;
  @ApiProperty() roleOnlyRoutes!: number;
  @ApiProperty() undeclaredAuthRoutes!: number;
  @ApiProperty() gaps!: number;
  @ApiProperty() modulesWithoutFinePermissions!: number;
}

export class ModulesCatalogDto {
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ type: [String] }) canonicalActions!: string[];
  @ApiProperty({
    type: [String],
    description:
      'Lo que esta lectura NO prueba: léase antes de interpretar los números',
  })
  notes!: string[];
  @ApiProperty({
    description:
      'Si el catálogo, los roles o los vínculos superaron el tope de lectura. Con `true`, no editar roles desde estos datos.',
  })
  truncated!: boolean;
  @ApiProperty({ type: [String] }) availableModules!: string[];
  @ApiProperty({ type: ModulesCatalogSummaryDto })
  summary!: ModulesCatalogSummaryDto;
  @ApiProperty({ type: [ModuleRoleRefDto] }) roles!: ModuleRoleRefDto[];
  @ApiProperty({ type: [ModuleEntryDto] }) modules!: ModuleEntryDto[];
}
