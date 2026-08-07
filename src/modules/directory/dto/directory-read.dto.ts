import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Contratos de lectura de `directory`.
 *
 * Las respuestas se componen campo a campo en vez de devolver la entidad: así un
 * campo nuevo en el modelo no se publica solo, y las columnas de auditoría
 * (`created_by_user_id`, `row_version`) se quedan donde deben.
 */

/** Una fila del listado de organizaciones. */
export class TenantListItemDto {
  /**
   * Identificador de la organización.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Código único de la organización.
   */
  @ApiProperty()
  code!: string;

  /**
   * Razón social.
   */
  @ApiProperty()
  legalName!: string;

  /**
   * Nombre comercial, si lo tiene.
   */
  @ApiPropertyOptional()
  tradeName?: string;

  /**
   * Tipo de organización.
   */
  @ApiProperty({ format: 'uuid' })
  tenantTypeConceptId!: string;

  /**
   * Estado de la organización.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Estado de verificación de la documentación.
   */
  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;

  /**
   * Organización madre, si es una sub-organización.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentTenantId!: string | null;

  /**
   * Alta de la organización.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Página del listado de organizaciones. */
export class SearchTenantsResponseDto {
  /**
   * Organizaciones de esta página, ordenadas por código.
   */
  @ApiProperty({ type: [TenantListItemDto] })
  items!: TenantListItemDto[];

  /**
   * Cantidad devuelta en esta página.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty()
  limit!: number;

  /**
   * Cursor opaco de continuación, o `null` si ésta es la última página.
   */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}

/** Ficha de una organización. */
export class TenantDetailResponseDto extends TenantListItemDto {
  /**
   * Forma jurídica.
   */
  @ApiProperty({ format: 'uuid' })
  legalEntityTypeConceptId!: string;

  /**
   * País de constitución.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  countryConceptId?: string;

  /**
   * Jurisdicción bajo la que opera.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  jurisdictionConceptId?: string;

  /**
   * Región donde residen sus datos.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  dataResidencyRegionConceptId?: string;

  /**
   * Moneda con la que opera.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  currencyConceptId?: string;

  /**
   * Zona horaria de la organización.
   */
  @ApiPropertyOptional()
  timeZone?: string;

  /**
   * Última modificación del registro.
   */
  @ApiProperty()
  updatedAt!: Date;
}

/** Una membresía dentro de la organización. */
export class MembershipListItemDto {
  /**
   * Identificador de la membresía.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Usuario que la ostenta.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Rol de negocio en la organización.
   */
  @ApiProperty({ format: 'uuid' })
  tenantRoleConceptId!: string;

  /**
   * Estado de la membresía.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Alcance de acceso concedido.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  accessScopeConceptId?: string;

  /**
   * Sucursal principal, si la tiene.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  primaryBranchId!: string | null;

  /**
   * Inicio de la relación.
   */
  @ApiPropertyOptional({ nullable: true })
  startDate!: Date | null;

  /**
   * Fin de la relación, si terminó.
   */
  @ApiPropertyOptional({ nullable: true })
  endDate!: Date | null;

  /**
   * Alta de la membresía.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Página de las membresías de una organización. */
export class SearchMembershipsResponseDto {
  /**
   * Membresías de esta página, de la más antigua a la más reciente.
   */
  @ApiProperty({ type: [MembershipListItemDto] })
  items!: MembershipListItemDto[];

  /**
   * Cantidad devuelta en esta página.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty()
  limit!: number;

  /**
   * Cursor opaco de continuación, o `null` si ésta es la última página.
   */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}

/** Una sucursal de la organización. */
export class BranchListItemDto {
  /**
   * Identificador de la sucursal.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Código de la sucursal dentro de la organización.
   */
  @ApiProperty()
  code!: string;

  /**
   * Nombre de la sucursal.
   */
  @ApiProperty()
  name!: string;

  /**
   * Tipo de sucursal.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  branchTypeConceptId?: string;

  /**
   * Estado de la sucursal.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Zona horaria de la sucursal.
   */
  @ApiPropertyOptional()
  timeZone?: string;

  /**
   * Alta de la sucursal.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Sucursales de la organización. */
export class ListBranchesResponseDto {
  /**
   * Sucursales, ordenadas por código.
   */
  @ApiProperty({ type: [BranchListItemDto] })
  items!: BranchListItemDto[];

  /**
   * Cuántas sucursales trae la respuesta.
   */
  @ApiProperty()
  count!: number;
}

/** Una asignación de una membresía a una sucursal. */
export class BranchAssignmentListItemDto {
  /**
   * Identificador de la asignación.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Sucursal asignada.
   */
  @ApiProperty({ format: 'uuid' })
  branchId!: string;

  /**
   * Rol local en esa sucursal.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  localRoleConceptId?: string;

  /**
   * Estado de la asignación.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Alta de la asignación.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Asignaciones de sucursal de una membresía. */
export class ListBranchAssignmentsResponseDto {
  /**
   * Asignaciones, de la más reciente a la más antigua.
   */
  @ApiProperty({ type: [BranchAssignmentListItemDto] })
  items!: BranchAssignmentListItemDto[];

  /**
   * Cuántas asignaciones trae la respuesta.
   */
  @ApiProperty()
  count!: number;
}
