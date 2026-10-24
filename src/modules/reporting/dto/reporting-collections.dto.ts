import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de definiciones de reporte (V39-01). */
export class ReportDefinitionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  categoryConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  dataSourceId!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  querySpecJson!: unknown;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  defaultOutputFormatConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  requiredPermissionId!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  isPublic!: boolean | null;

  @ApiProperty({ type: Number })
  currentVersion!: number;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de definiciones de reporte. */
export class ListDefinitionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de definiciones de reporte. */
export class ReportDefinitionPageDto extends pageResponseOf(
  ReportDefinitionItemDto,
  'ReportDefinitionPageDto',
) {}

/** Fila de ejecuciones de una definición (V39-02). */
export class ReportExecutionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  reportDefinitionId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  reportVersionId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  scheduleId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ format: 'uuid' })
  triggerConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  requestedByUserId!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  parametersJson!: unknown;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  finishedAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  rowCount!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  outputFormatConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  outputFileId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  errorText!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de ejecuciones de una definición. */
export class ListDefinitionExecutionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de ejecuciones de una definición. */
export class ReportExecutionPageDto extends pageResponseOf(
  ReportExecutionItemDto,
  'ReportExecutionPageDto',
) {}

/** Fila de agendas de una definición (V39-03). */
export class ReportScheduleItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  reportDefinitionId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  cronExpression!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  timeZone!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  parametersJson!: unknown;

  @ApiProperty({ format: 'uuid' })
  outputFormatConceptId!: string;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  isEnabled!: boolean | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  nextRunAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastRunAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de agendas de una definición. */
export class ListSchedulesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de agendas de una definición. */
export class ReportSchedulePageDto extends pageResponseOf(
  ReportScheduleItemDto,
  'ReportSchedulePageDto',
) {}

/** Filtros del listado de ejecuciones de reporte. */
export class ListExecutionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  reportDefinitionId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Fila de tableros (V39-07). */
export class DashboardItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  layoutJson!: unknown;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  requiredPermissionId!: string | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de tableros. */
export class ListDashboardsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de tableros. */
export class DashboardPageDto extends pageResponseOf(
  DashboardItemDto,
  'DashboardPageDto',
) {}

/** Fila de fuentes de datos de reporte (V39-08). */
export class ReportDataSourceItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  sourceTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  readModelDefinitionId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  viewName!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  specJson!: unknown;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  rowSecurityJson!: unknown;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de fuentes de datos de reporte. */
export class ListDataSourcesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de fuentes de datos de reporte. */
export class ReportDataSourcePageDto extends pageResponseOf(
  ReportDataSourceItemDto,
  'ReportDataSourcePageDto',
) {}
