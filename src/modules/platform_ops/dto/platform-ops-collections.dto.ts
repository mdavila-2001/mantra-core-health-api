import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de despliegues (V46-01). */
export class DeploymentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ format: 'uuid' })
  serviceComponentId!: string;

  @ApiProperty({ format: 'uuid' })
  artifactId!: string;

  @ApiProperty({ format: 'uuid' })
  environmentConceptId!: string;

  @ApiProperty({ type: String })
  deploymentNumber!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  strategyConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  deployedByUserId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  gitRef!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  finishedAt!: Date | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  isCurrent!: boolean | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  rollbackOfDeploymentId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de despliegues. */
export class ListDeploymentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de despliegues. */
export class DeploymentPageDto extends pageResponseOf(
  DeploymentItemDto,
  'DeploymentPageDto',
) {}

/** Fila de artefactos (V46-02). */
export class ArtifactItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  serviceComponentId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  producedByToolId!: string | null;

  @ApiProperty({ type: String })
  artifactRef!: string;

  @ApiProperty({ format: 'uuid' })
  artifactTypeConceptId!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  version!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  semver!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  gitRef!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  commitSha!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  storageUri!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  fileId!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  sizeBytes!: number | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  isImmutable!: boolean | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  builtAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de artefactos. */
export class ListArtifactsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de artefactos. */
export class ArtifactPageDto extends pageResponseOf(
  ArtifactItemDto,
  'ArtifactPageDto',
) {}

/** Fila de solicitudes de cambio (V46-04). */
export class ChangeRequestItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ format: 'uuid' })
  serviceComponentId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  deploymentId!: string | null;

  @ApiProperty({ type: String })
  changeNumber!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ format: 'uuid' })
  changeTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  riskLevelConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  requestedByUserId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  plannedStartAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  plannedEndAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  rollbackPlanText!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  validationPlanText!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  maintenanceWindowId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  implementedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  closedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de solicitudes de cambio. */
export class ListChangeRequestsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de solicitudes de cambio. */
export class ChangeRequestPageDto extends pageResponseOf(
  ChangeRequestItemDto,
  'ChangeRequestPageDto',
) {}

/** Fila de incidentes de salud (V46-08). */
export class HealthIncidentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ format: 'uuid' })
  serviceComponentId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  healthCheckId!: string | null;

  @ApiProperty({ type: String })
  incidentNumber!: string;

  @ApiProperty({ format: 'uuid' })
  severityConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  detectedByRunId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  openedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  acknowledgedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  resolvedAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  rootCauseText!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  resolutionText!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de incidentes de salud. */
export class ListIncidentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de incidentes de salud. */
export class HealthIncidentPageDto extends pageResponseOf(
  HealthIncidentItemDto,
  'HealthIncidentPageDto',
) {}

/** Fila de ejercicios de resiliencia (V46-11). */
export class ResilienceExerciseItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ format: 'uuid' })
  serviceComponentId!: string;

  @ApiProperty({ format: 'uuid' })
  exerciseTypeConceptId!: string;

  @ApiProperty({ type: String })
  scenarioName!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  hypothesisText!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  plannedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endedAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  resultConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  observedRtoSeconds!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  observedRpoSeconds!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  evidenceUri!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  findingsJson!: unknown;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de ejercicios de resiliencia. */
export class ListResilienceExercisesQueryDto extends PaginationQueryDto {}

/** Página de ejercicios de resiliencia. */
export class ResilienceExercisePageDto extends pageResponseOf(
  ResilienceExerciseItemDto,
  'ResilienceExercisePageDto',
) {}
