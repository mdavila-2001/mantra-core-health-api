import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// ---------------------------------------------------------------------------
// Vocabularios compartidos
// ---------------------------------------------------------------------------

/** Entorno de despliegue. */
export type OpsEnvironment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
const OPS_ENVIRONMENTS = ['DEVELOPMENT', 'STAGING', 'PRODUCTION'] as const;

// ---------------------------------------------------------------------------
// UC-46-01 · Solicitud de cambio
// ---------------------------------------------------------------------------

/** Naturaleza del cambio según su recorrido de aprobación. */
export type ChangeType = 'STANDARD' | 'NORMAL' | 'EMERGENCY';
const CHANGE_TYPES = ['STANDARD', 'NORMAL', 'EMERGENCY'] as const;

/** Riesgo declarado del cambio. */
export type ChangeRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
const CHANGE_RISKS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

/** Cuerpo de `POST /ops/change-requests` (UC-46-01). */
export class CreateChangeRequestDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ format: 'uuid', description: 'Componente afectado' })
  @IsUUID()
  serviceComponentId!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CHANGE_TYPES })
  @IsIn(CHANGE_TYPES)
  changeType!: ChangeType;

  @ApiProperty({ enum: CHANGE_RISKS })
  @IsIn(CHANGE_RISKS)
  risk!: ChangeRisk;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  plannedStartAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  plannedEndAt?: string;

  @ApiPropertyOptional({ description: 'Cómo se deshace el cambio si sale mal' })
  @IsOptional()
  @IsString()
  rollbackPlanText?: string;

  @ApiPropertyOptional({
    description: 'Cómo se comprueba que el cambio funcionó',
  })
  @IsOptional()
  @IsString()
  validationPlanText?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ventana de mantenimiento a la que se ata',
  })
  @IsOptional()
  @IsUUID()
  maintenanceWindowId?: string;
}

export class ChangeRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Número correlativo del cambio en el tenant' })
  changeNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-46-02 · Aprobación del CAB
// ---------------------------------------------------------------------------

/** Decisión del aprobador. */
export type ApprovalDecision = 'APPROVED' | 'REJECTED';

/** Cuerpo de `POST /ops/change-requests/{id}/approvals` (UC-46-02). */
export class RecordApprovalDto {
  @ApiProperty({ description: 'Paso del recorrido de aprobación', minimum: 1 })
  @IsInt()
  @Min(1)
  approvalStep!: number;

  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: ApprovalDecision;

  @ApiPropertyOptional({ description: 'Por qué se decide así' })
  @IsOptional()
  @IsString()
  decisionReason?: string;

  @ApiPropertyOptional({
    description: 'Pasos exigidos; por defecto, los pasos ya emitidos más éste',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  requiredApprovalSteps?: number;
}

export class ApprovalResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  changeRequestId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado del cambio tras la decisión',
  })
  changeStatusConceptId!: string;

  @ApiProperty({ description: 'Pasos aprobados hasta ahora' })
  approvedSteps!: number;
}

// ---------------------------------------------------------------------------
// UC-46-03 · Artefacto
// ---------------------------------------------------------------------------

/** Naturaleza del artefacto publicado. */
export type ArtifactKind =
  'CONTAINER_IMAGE' | 'PACKAGE' | 'BINARY' | 'HELM_CHART' | 'CONFIG_BUNDLE';
const ARTIFACT_KINDS = [
  'CONTAINER_IMAGE',
  'PACKAGE',
  'BINARY',
  'HELM_CHART',
  'CONFIG_BUNDLE',
] as const;

/** Cuerpo de `POST /ops/artifacts` (UC-46-03). */
export class PublishArtifactDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  serviceComponentId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Herramienta que lo construyó',
  })
  @IsOptional()
  @IsUUID()
  producedByToolId?: string;

  @ApiProperty({
    description: 'Referencia única del artefacto',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  artifactRef!: string;

  @ApiProperty({ enum: ARTIFACT_KINDS })
  @IsIn(ARTIFACT_KINDS)
  artifactKind!: ArtifactKind;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Versión publicada', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  version!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  semver?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gitRef?: string;

  @ApiPropertyOptional({ description: 'SHA del commit', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  commitSha?: string;

  @ApiProperty({
    description: 'Hash del contenido en hexadecimal; direcciona el artefacto',
    example: 'a'.repeat(64),
  })
  @Matches(/^[0-9a-f]{32,128}$/i, {
    message: 'contentHash debe ser un hash hexadecimal de 32 a 128 caracteres',
  })
  contentHash!: string;

  @ApiPropertyOptional({
    description: 'URI del blob en almacenamiento de objetos',
  })
  @IsOptional()
  @IsString()
  storageUri?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  builtAt?: string;
}

export class ArtifactResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  artifactRef!: string;

  @ApiProperty()
  contentHash!: string;

  @ApiProperty({
    description: 'Siempre true: el artefacto publicado no se reescribe',
  })
  isImmutable!: boolean;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-46-04 · Despliegue
// ---------------------------------------------------------------------------

/** Estrategia de despliegue. */
export type DeployStrategy = 'ROLLING' | 'BLUE_GREEN' | 'CANARY' | 'RECREATE';
const DEPLOY_STRATEGIES = [
  'ROLLING',
  'BLUE_GREEN',
  'CANARY',
  'RECREATE',
] as const;

/** Cómo terminó el despliegue que se reporta. */
export type DeployOutcome = 'SUCCEEDED' | 'FAILED';

/** Cuerpo de `POST /ops/deployments` (UC-46-04). */
export class CreateDeploymentDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Cambio aprobado que lo habilita',
  })
  @IsUUID()
  changeRequestId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  artifactId!: string;

  @ApiProperty({ enum: OPS_ENVIRONMENTS })
  @IsIn(OPS_ENVIRONMENTS)
  environment!: OpsEnvironment;

  @ApiProperty({ enum: DEPLOY_STRATEGIES })
  @IsIn(DEPLOY_STRATEGIES)
  strategy!: DeployStrategy;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gitRef?: string;

  @ApiPropertyOptional({
    enum: ['SUCCEEDED', 'FAILED'],
    description:
      'Desenlace si el pipeline ya terminó; si falta, queda en curso',
  })
  @IsOptional()
  @IsIn(['SUCCEEDED', 'FAILED'])
  outcome?: DeployOutcome;
}

export class DeploymentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  deploymentNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description: 'true si pasa a ser el despliegue vigente del entorno',
  })
  isCurrent!: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Despliegue que deja de ser vigente',
  })
  supersededDeploymentId?: string;
}

// ---------------------------------------------------------------------------
// UC-46-05 · Rollback
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ops/deployments/{id}/rollback` (UC-46-05). */
export class RollbackDeploymentDto {
  @ApiProperty({ description: 'Por qué se revierte' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Despliegue estable al que volver; por defecto, el correcto anterior',
  })
  @IsOptional()
  @IsUUID()
  targetDeploymentId?: string;
}

export class RollbackResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Despliegue de reversión creado',
  })
  id!: string;

  @ApiProperty()
  deploymentNumber!: string;

  @ApiProperty({ format: 'uuid', description: 'Despliegue revertido' })
  rolledBackDeploymentId!: string;

  @ApiProperty({ format: 'uuid', description: 'Artefacto al que se vuelve' })
  artifactId!: string;
}

// ---------------------------------------------------------------------------
// UC-46-06 · Corrida de health check
// ---------------------------------------------------------------------------

/** Desenlace de la corrida. */
export type HealthRunStatus = 'PASS' | 'WARN' | 'FAIL' | 'TIMEOUT' | 'ERROR';
const HEALTH_RUN_STATUSES = [
  'PASS',
  'WARN',
  'FAIL',
  'TIMEOUT',
  'ERROR',
] as const;

/** Quién disparó la corrida. */
export type HealthRunSource = 'SCHEDULER' | 'PROBE' | 'MANUAL';
const HEALTH_RUN_SOURCES = ['SCHEDULER', 'PROBE', 'MANUAL'] as const;

/** Cuerpo de `POST /ops/health-checks/{id}/runs` (UC-46-06). */
export class RecordHealthRunDto {
  @ApiProperty({ enum: HEALTH_RUN_STATUSES })
  @IsIn(HEALTH_RUN_STATUSES)
  status!: HealthRunStatus;

  @ApiProperty({ enum: HEALTH_RUN_SOURCES })
  @IsIn(HEALTH_RUN_SOURCES)
  source!: HealthRunSource;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  @ApiPropertyOptional({ minimum: 100, maximum: 599 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  httpStatus?: number;

  @ApiPropertyOptional({
    description: 'Valor observado, como cadena para no perder precisión',
  })
  @IsOptional()
  @IsString()
  observedValue?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Despliegue bajo el que se observa',
  })
  @IsOptional()
  @IsUUID()
  deploymentId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  finishedAt?: string;
}

export class HealthRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description: 'Fallos consecutivos acumulados tras esta corrida',
  })
  consecutiveFailures!: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Incidente abierto o ya vivo',
  })
  healthIncidentId?: string;

  @ApiProperty({ description: 'true si esta corrida abrió el incidente' })
  incidentOpened!: boolean;
}

// ---------------------------------------------------------------------------
// UC-46-07 · Ciclo de vida del incidente
// ---------------------------------------------------------------------------

/** Transición pedida sobre el incidente. */
export type IncidentTransition =
  'ACKNOWLEDGE' | 'MITIGATE' | 'RESOLVE' | 'UPDATE';
const INCIDENT_TRANSITIONS = [
  'ACKNOWLEDGE',
  'MITIGATE',
  'RESOLVE',
  'UPDATE',
] as const;

/** Rol del respondiente. */
export type ResponderRole =
  'COMMANDER' | 'OPERATIONS' | 'COMMUNICATIONS' | 'SCRIBE';
const RESPONDER_ROLES = [
  'COMMANDER',
  'OPERATIONS',
  'COMMUNICATIONS',
  'SCRIBE',
] as const;

/** Naturaleza de la comunicación. */
export type CommunicationType = 'STATUS_UPDATE' | 'ESCALATION' | 'RESOLUTION';
const COMMUNICATION_TYPES = [
  'STATUS_UPDATE',
  'ESCALATION',
  'RESOLUTION',
] as const;

/** A quién se dirige. */
export type CommunicationAudience = 'INTERNAL' | 'CUSTOMERS' | 'REGULATORS';
const COMMUNICATION_AUDIENCES = [
  'INTERNAL',
  'CUSTOMERS',
  'REGULATORS',
] as const;

export class IncidentResponderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: RESPONDER_ROLES })
  @IsIn(RESPONDER_ROLES)
  role!: ResponderRole;

  @ApiPropertyOptional({
    description: 'true si el respondiente ya acusó recibo',
  })
  @IsOptional()
  @IsBoolean()
  acknowledged?: boolean;
}

export class IncidentCommunicationDto {
  @ApiProperty({ enum: COMMUNICATION_TYPES })
  @IsIn(COMMUNICATION_TYPES)
  type!: CommunicationType;

  @ApiProperty({ enum: COMMUNICATION_AUDIENCES })
  @IsIn(COMMUNICATION_AUDIENCES)
  audience!: CommunicationAudience;

  @ApiProperty({ maxLength: 4000 })
  @IsString()
  @MaxLength(4000)
  messageText!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  channelReference?: string;
}

/** Cuerpo de `PATCH /ops/incidents/{id}` (UC-46-07). */
export class UpdateIncidentDto {
  @ApiProperty({
    enum: INCIDENT_TRANSITIONS,
    description: '`UPDATE` sólo añade sin mover el estado',
  })
  @IsIn(INCIDENT_TRANSITIONS)
  transition!: IncidentTransition;

  @ApiPropertyOptional({
    description: 'Qué se apunta en el timeline',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional({ description: 'Causa raíz; obligatoria al resolver' })
  @IsOptional()
  @IsString()
  rootCauseText?: string;

  @ApiPropertyOptional({
    description: 'Cómo se resolvió; obligatoria al resolver',
  })
  @IsOptional()
  @IsString()
  resolutionText?: string;

  @ApiPropertyOptional({ type: [IncidentResponderDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncidentResponderDto)
  responders?: IncidentResponderDto[];

  @ApiPropertyOptional({ type: [IncidentCommunicationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncidentCommunicationDto)
  communications?: IncidentCommunicationDto[];
}

export class IncidentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Respondientes añadidos',
  })
  addedResponderIds!: string[];

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Comunicaciones publicadas',
  })
  communicationIds!: string[];

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Entradas de timeline creadas',
  })
  timelineEventIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-46-08 · Postmortem
// ---------------------------------------------------------------------------

/** Naturaleza de la acción derivada. */
export type ActionType = 'PREVENTIVE' | 'CORRECTIVE' | 'DETECTIVE' | 'PROCESS';
const ACTION_TYPES = [
  'PREVENTIVE',
  'CORRECTIVE',
  'DETECTIVE',
  'PROCESS',
] as const;

/** Prioridad con la que entra al backlog de mejoras. */
export type ImprovementPriority = 'LOW' | 'MEDIUM' | 'HIGH';
const IMPROVEMENT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export class ActionItemDto {
  @ApiProperty({
    description: 'Código de la acción, único en el postmortem',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  actionCode!: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ enum: ACTION_TYPES })
  @IsIn(ACTION_TYPES)
  actionType!: ActionType;

  @ApiProperty({ format: 'uuid', description: 'Quién responde de la acción' })
  @IsUUID()
  ownerUserId!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @ApiPropertyOptional({ enum: IMPROVEMENT_PRIORITIES, default: 'MEDIUM' })
  @IsOptional()
  @IsIn(IMPROVEMENT_PRIORITIES)
  priority?: ImprovementPriority;
}

/** Cuerpo de `POST /ops/incidents/{id}/postmortem` (UC-46-08). */
export class OpenPostmortemDto {
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiProperty({ format: 'uuid', description: 'Quién conduce el postmortem' })
  @IsUUID()
  ownerUserId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  impactSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detectionSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responseSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCauseSummary?: string;

  @ApiPropertyOptional({ description: 'Factores contribuyentes' })
  @IsOptional()
  @IsObject()
  contributingFactorsJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lessonsLearned?: string;

  @ApiProperty({
    type: [ActionItemDto],
    description: 'Un postmortem sin acciones no cambia nada',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ActionItemDto)
  actionItems!: ActionItemDto[];
}

export class PostmortemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  actionItemIds!: string[];

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Mejoras abiertas para seguimiento',
  })
  improvementItemIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-46-09 · Medición SLO
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ops/slo/{id}/measurements` (UC-46-09). */
export class RecordSloMeasurementDto {
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  windowStart!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  windowEnd!: string;

  @ApiProperty({
    description: 'Eventos buenos de la ventana; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  goodEvents!: string;

  @ApiProperty({
    description: 'Eventos totales de la ventana; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  totalEvents!: string;

  @ApiPropertyOptional({
    description: 'De dónde salieron los datos',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceReference?: string;
}

export class SloMeasurementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Cumplimiento alcanzado, como cadena decimal' })
  attainedValue!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description:
      'true si la ventana ya estaba medida y se devuelve la anterior',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-46-10 · Quema de error budget
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ops/error-budget/{policyId}/burn-events` (UC-46-10). */
export class RecordBurnEventDto {
  @ApiProperty({
    description: 'Ventana evaluada en segundos; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  windowSeconds!: string;

  @ApiProperty({
    description: 'Ritmo de consumo del presupuesto, como cadena decimal',
  })
  @IsNumberString()
  burnRate!: string;

  @ApiProperty({
    description: 'Presupuesto restante en porcentaje, como cadena decimal',
  })
  @IsNumberString()
  remainingBudgetPercent!: string;

  @ApiPropertyOptional({ description: 'Qué se hizo al detectarlo' })
  @IsOptional()
  @IsObject()
  actionTakenJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Incidente de fiabilidad asociado',
  })
  @IsOptional()
  @IsUUID()
  healthIncidentId?: string;
}

export class BurnEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  severityConceptId!: string;

  @ApiProperty({
    description: 'true si a partir de ahora los despliegues quedan congelados',
  })
  deploymentFreezeActive!: boolean;
}

// ---------------------------------------------------------------------------
// UC-46-11 · Medición de capacidad
// ---------------------------------------------------------------------------

/** Métrica medida. */
export type CapacityMetric =
  'CPU' | 'MEMORY' | 'STORAGE' | 'THROUGHPUT' | 'CONNECTIONS';
const CAPACITY_METRICS = [
  'CPU',
  'MEMORY',
  'STORAGE',
  'THROUGHPUT',
  'CONNECTIONS',
] as const;

/** Cuerpo de `POST /ops/capacity-plans/{id}/measurements` (UC-46-11). */
export class RecordCapacityMeasurementDto {
  @ApiProperty({ enum: CAPACITY_METRICS })
  @IsIn(CAPACITY_METRICS)
  metric!: CapacityMetric;

  @ApiProperty({ description: 'Valor observado, como cadena decimal' })
  @IsNumberString()
  observedValue!: string;

  @ApiProperty({ description: 'Capacidad disponible, como cadena decimal' })
  @IsNumberString()
  capacityValue!: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo se midió; por defecto, ahora',
  })
  @IsOptional()
  @IsISO8601()
  measuredAt?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceReference?: string;

  @ApiPropertyOptional({ description: 'Previsión de demanda recalculada' })
  @IsOptional()
  @IsObject()
  demandForecastJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Política de escalado recalculada' })
  @IsOptional()
  @IsObject()
  scalingPolicyJson?: Record<string, unknown>;
}

export class CapacityMeasurementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description: 'Utilización calculada en porcentaje, como cadena decimal',
  })
  utilizationPercent!: string;

  @ApiProperty({
    description: 'true si la utilización cruzó el guardrail del plan',
  })
  guardrailCrossed!: boolean;

  @ApiProperty({ description: 'true si el plan se recalculó en esta medición' })
  planUpdated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-46-12 · Revisión de preparación
// ---------------------------------------------------------------------------

/** Decisión de la revisión. */
export type ReviewDecision = 'GO' | 'NO_GO';

export class ResolvedFindingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  findingId!: string;

  @ApiPropertyOptional({ description: 'Evidencia del cierre' })
  @IsOptional()
  @IsObject()
  evidenceJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /ops/readiness-reviews/{id}/complete` (UC-46-12). */
export class CompleteReadinessReviewDto {
  @ApiProperty({ enum: ['GO', 'NO_GO'] })
  @IsIn(['GO', 'NO_GO'])
  decision!: ReviewDecision;

  @ApiPropertyOptional({
    type: [ResolvedFindingDto],
    description: 'Hallazgos que se cierran',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResolvedFindingDto)
  resolvedFindings?: ResolvedFindingDto[];

  @ApiPropertyOptional({ description: 'Evidencia de la revisión' })
  @IsOptional()
  @IsObject()
  evidenceJson?: Record<string, unknown>;

  @ApiProperty({
    format: 'uuid',
    description: 'Quién responde de los hallazgos que quedan abiertos',
  })
  @IsUUID()
  improvementOwnerUserId!: string;
}

export class ReadinessReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  decisionConceptId!: string;

  @ApiProperty({ description: 'Hallazgos cerrados en esta operación' })
  resolvedCount!: number;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Mejoras abiertas por lo que queda',
  })
  improvementItemIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-46-13 · Runbooks
// ---------------------------------------------------------------------------

/** Cómo se ejecuta el runbook. */
export type ExecutionMode = 'MANUAL' | 'ASSISTED' | 'AUTOMATED';
const EXECUTION_MODES = ['MANUAL', 'ASSISTED', 'AUTOMATED'] as const;

/** Cómo terminó la ejecución. */
export type ExecutionResult = 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'ABORTED';
const EXECUTION_RESULTS = ['SUCCESS', 'PARTIAL', 'FAILED', 'ABORTED'] as const;

/** Cuerpo de `POST /ops/runbooks/{id}/versions` (UC-46-13). */
export class PublishRunbookVersionDto {
  @ApiProperty({ description: 'Contenido del runbook en Markdown' })
  @IsString()
  contentMarkdown!: string;

  @ApiPropertyOptional({
    description: 'Definición de la automatización asociada',
  })
  @IsOptional()
  @IsObject()
  automationDefinitionJson?: Record<string, unknown>;
}

export class RunbookVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description: 'Número de versión, correlativo dentro del runbook',
  })
  versionNumber!: number;

  @ApiProperty({
    format: 'uuid',
    description: 'Versión que pasa a ser la vigente del runbook',
  })
  runbookId!: string;
}

/** Cuerpo de `POST /ops/runbook-executions` (UC-46-13). */
export class RecordRunbookExecutionDto {
  @ApiProperty({ format: 'uuid', description: 'Versión ejecutada' })
  @IsUUID()
  runbookVersionId!: string;

  @ApiProperty({ enum: EXECUTION_MODES })
  @IsIn(EXECUTION_MODES)
  mode!: ExecutionMode;

  @ApiProperty({ enum: EXECUTION_RESULTS })
  @IsIn(EXECUTION_RESULTS)
  result!: ExecutionResult;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startedAt!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endedAt?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Incidente en el que se ejecutó',
  })
  @IsOptional()
  @IsUUID()
  healthIncidentId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cambio en el que se ejecutó',
  })
  @IsOptional()
  @IsUUID()
  changeRequestId?: string;

  @ApiPropertyOptional({ description: 'URI del log de ejecución' })
  @IsOptional()
  @IsString()
  executionLogUri?: string;

  @ApiPropertyOptional({ description: 'Salida de la ejecución' })
  @IsOptional()
  @IsObject()
  outputJson?: Record<string, unknown>;
}

export class RunbookExecutionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  resultConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Entrada de timeline si la ejecución fue en un incidente',
  })
  timelineEventId?: string;
}

// ---------------------------------------------------------------------------
// UC-46-14 · Ejercicio de resiliencia
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ops/resilience-exercises/{id}/complete` (UC-46-14). */
export class CompleteResilienceExerciseDto {
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startedAt!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  endedAt!: string;

  @ApiProperty({
    description:
      'Tiempo de recuperación observado en segundos; cadena por ser bigint',
    example: '900',
  })
  @IsNumberString({ no_symbols: true })
  observedRtoSeconds!: string;

  @ApiPropertyOptional({
    description:
      'Pérdida de datos observada en segundos; cadena por ser bigint',
    example: '300',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  observedRpoSeconds?: string;

  @ApiPropertyOptional({ description: 'URI de la evidencia' })
  @IsOptional()
  @IsString()
  evidenceUri?: string;

  @ApiPropertyOptional({ description: 'Hallazgos del ejercicio' })
  @IsOptional()
  @IsObject()
  findingsJson?: Record<string, unknown>;

  @ApiProperty({
    format: 'uuid',
    description: 'Quién responde de la mejora si se incumple el objetivo',
  })
  @IsUUID()
  improvementOwnerUserId!: string;
}

export class ResilienceExerciseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Resultado derivado de comparar con el objetivo',
  })
  resultConceptId!: string;

  @ApiProperty({ description: 'true si el RTO observado supera el objetivo' })
  rtoBreached!: boolean;

  @ApiProperty({ description: 'true si el RPO observado supera el objetivo' })
  rpoBreached!: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Mejora abierta por el incumplimiento',
  })
  improvementItemId?: string;
}
