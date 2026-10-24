import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de trabajos de movimiento de datos (V62-02). */
export class DataMovementJobItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  datasetId!: string;

  @ApiProperty({ format: 'uuid' })
  sourcePlacementId!: string;

  @ApiProperty({ format: 'uuid' })
  targetPlacementId!: string;

  @ApiProperty({ type: String })
  movementMode!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: Date;
}

/** Filtros del listado de trabajos de movimiento de datos. */
export class ListDataMovementJobsQueryDto extends PaginationQueryDto {}

/** Página de trabajos de movimiento de datos. */
export class DataMovementJobPageDto extends pageResponseOf(
  DataMovementJobItemDto,
  'DataMovementJobPageDto',
) {}

/** Fila de solicitudes de borrado (V62-03). */
export class CrossStoreDeletionRequestItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  subjectType!: string;

  @ApiProperty({ format: 'uuid' })
  subjectId!: string;

  @ApiProperty({ type: String })
  reasonCode!: string;

  @ApiProperty({ type: String })
  legalBasisCode!: string;

  @ApiProperty({ format: 'uuid' })
  requestedByUserId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  requestedAt!: Date;

  @ApiProperty({ type: String })
  state!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dueAt!: Date;
}

/** Filtros del listado de solicitudes de borrado. */
export class ListDeletionRequestsQueryDto extends PaginationQueryDto {}

/** Página de solicitudes de borrado. */
export class CrossStoreDeletionRequestPageDto extends pageResponseOf(
  CrossStoreDeletionRequestItemDto,
  'CrossStoreDeletionRequestPageDto',
) {}

/** Fila de mensajes fallidos de proyección (V62-04). */
export class ProjectionDeadLetterItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  projectionDeliveryAttemptId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  reasonCode!: string;

  @ApiProperty({ format: 'uuid' })
  payloadObjectId!: string;

  @ApiProperty({ type: String })
  state!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  resolvedAt!: Date;
}

/** Filtros del listado de mensajes fallidos de proyección. */
export class ListDeadLettersQueryDto extends PaginationQueryDto {}

/** Página de mensajes fallidos de proyección. */
export class ProjectionDeadLetterPageDto extends pageResponseOf(
  ProjectionDeadLetterItemDto,
  'ProjectionDeadLetterPageDto',
) {}

/** Fila de trabajos de reparación de una deriva (V62-06). */
export class ProjectionRepairJobItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  projectionDriftEventId!: string;

  @ApiProperty({ type: String })
  repairAction!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  requestedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: Date;
}

/** Filtros del listado de trabajos de reparación de una deriva. */
export class ListRepairJobsQueryDto extends PaginationQueryDto {}

/** Página de trabajos de reparación de una deriva. */
export class ProjectionRepairJobPageDto extends pageResponseOf(
  ProjectionRepairJobItemDto,
  'ProjectionRepairJobPageDto',
) {}

/** Fila de invalidaciones de caché (V62-08). */
export class CacheInvalidationJobItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  datasetId!: string;

  @ApiProperty({ format: 'uuid' })
  entityId!: string;

  @ApiProperty({ type: String })
  entityVersion!: string;

  @ApiProperty({ type: String })
  cacheScope!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: Date;
}

/** Filtros del listado de invalidaciones de caché. */
export class ListInvalidationsQueryDto extends PaginationQueryDto {}

/** Página de invalidaciones de caché. */
export class CacheInvalidationJobPageDto extends pageResponseOf(
  CacheInvalidationJobItemDto,
  'CacheInvalidationJobPageDto',
) {}

/** Filtros del listado de solicitudes de borrado para workers. */
export class ListWorkerDeletionRequestsQueryDto extends PaginationQueryDto {}

/** Filtros del listado de mensajes fallidos de proyección para workers. */
export class ListWorkerDeadLettersQueryDto extends PaginationQueryDto {}
