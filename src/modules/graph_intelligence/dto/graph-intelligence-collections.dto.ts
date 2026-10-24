import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de alcances de acceso al grafo (V61-02). */
export class GraphAccessScopeItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  scopeCode!: string;

  @ApiProperty({})
  allowedNodeTypes!: string[];

  @ApiProperty({})
  allowedRelationshipTypes!: string[];

  @ApiProperty({})
  purposeOfUseCodes!: string[];

  @ApiProperty({ type: Number })
  maxHops!: number;

  @ApiProperty({ type: Boolean })
  requiresPatientContext!: boolean;

  @ApiProperty({ type: String })
  state!: string;
}

/** Filtros del listado de alcances de acceso al grafo. */
export class ListAccessScopesQueryDto extends PaginationQueryDto {}

/** Página de alcances de acceso al grafo. */
export class GraphAccessScopePageDto extends pageResponseOf(
  GraphAccessScopeItemDto,
  'GraphAccessScopePageDto',
) {}

/** Fila de trabajos de borrado del grafo (V61-05). */
export class GraphDeletionJobItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  sourceEntityType!: string;

  @ApiProperty({ format: 'uuid' })
  sourceEntityId!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: Number })
  nodesDeleted!: number;

  @ApiProperty({ type: Number })
  edgesDeleted!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  requestedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  verifiedAt!: Date;
}

/** Filtros del listado de trabajos de borrado del grafo. */
export class ListDeletionJobsQueryDto extends PaginationQueryDto {}

/** Página de trabajos de borrado del grafo. */
export class GraphDeletionJobPageDto extends pageResponseOf(
  GraphDeletionJobItemDto,
  'GraphDeletionJobPageDto',
) {}

/** Fila de ejecuciones de una proyección (V61-08). */
export class GraphProjectionRunItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  graphProjectionDefinitionId!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String })
  sourceCheckpoint!: string;

  @ApiProperty({ type: String })
  nodesWritten!: string;

  @ApiProperty({ type: String })
  edgesWritten!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: Date;
}

/** Filtros del listado de ejecuciones de una proyección. */
export class ListDefinitionRunsQueryDto extends PaginationQueryDto {}

/** Página de ejecuciones de una proyección. */
export class GraphProjectionRunPageDto extends pageResponseOf(
  GraphProjectionRunItemDto,
  'GraphProjectionRunPageDto',
) {}

/** Filtros del listado de ejecuciones de proyección. */
export class ListProjectionRunsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  graphProjectionDefinitionId?: string;
}

/** Fila de coincidencias de reglas del grafo (V61-11). */
export class GraphRuleHitItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  graphRuleDefinitionId!: string;

  @ApiProperty({ format: 'uuid' })
  primaryNodeId!: string;

  @ApiProperty({})
  relatedNodeIds!: string[];

  @ApiProperty({})
  evidenceEdgeIds!: string[];

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  detectedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  resolvedAt!: Date;
}

/** Filtros del listado de coincidencias de reglas del grafo. */
export class ListRuleHitsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  graphRuleDefinitionId?: string;
}

/** Página de coincidencias de reglas del grafo. */
export class GraphRuleHitPageDto extends pageResponseOf(
  GraphRuleHitItemDto,
  'GraphRuleHitPageDto',
) {}
