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
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a service component.
   */
  @ApiProperty({ format: 'uuid', description: 'Componente afectado' })
  @IsUUID()
  serviceComponentId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Valor de change type mantenido por la instancia.
   */
  @ApiProperty({ enum: CHANGE_TYPES })
  @IsIn(CHANGE_TYPES)
  changeType!: ChangeType;

  /**
   * Valor de risk mantenido por la instancia.
   */
  @ApiProperty({ enum: CHANGE_RISKS })
  @IsIn(CHANGE_RISKS)
  risk!: ChangeRisk;

  /**
   * Valor de planned start at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  plannedStartAt?: string;

  /**
   * Valor de planned end at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  plannedEndAt?: string;

  /**
   * Valor de rollback plan text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cómo se deshace el cambio si sale mal' })
  @IsOptional()
  @IsString()
  rollbackPlanText?: string;

  /**
   * Valor de validation plan text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Cómo se comprueba que el cambio funcionó',
  })
  @IsOptional()
  @IsString()
  validationPlanText?: string;

  /**
   * Identificador asociado a maintenance window.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ventana de mantenimiento a la que se ata',
  })
  @IsOptional()
  @IsUUID()
  maintenanceWindowId?: string;
}

/**
 * Define el contrato validado para change request response.
 */
export class ChangeRequestResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de change number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número correlativo del cambio en el tenant' })
  changeNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
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
  /**
   * Valor de approval step mantenido por la instancia.
   */
  @ApiProperty({ description: 'Paso del recorrido de aprobación', minimum: 1 })
  @IsInt()
  @Min(1)
  approvalStep!: number;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: ApprovalDecision;

  /**
   * Valor de decision reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Por qué se decide así' })
  @IsOptional()
  @IsString()
  decisionReason?: string;

  /**
   * Valor de required approval steps mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para approval response.
 */
export class ApprovalResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a change request.
   */
  @ApiProperty({ format: 'uuid' })
  changeRequestId!: string;

  /**
   * Identificador asociado a change status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado del cambio tras la decisión',
  })
  changeStatusConceptId!: string;

  /**
   * Valor de approved steps mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a service component.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  serviceComponentId!: string;

  /**
   * Identificador asociado a produced by tool.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Herramienta que lo construyó',
  })
  @IsOptional()
  @IsUUID()
  producedByToolId?: string;

  /**
   * Valor de artifact ref mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Referencia única del artefacto',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  artifactRef!: string;

  /**
   * Valor de artifact kind mantenido por la instancia.
   */
  @ApiProperty({ enum: ARTIFACT_KINDS })
  @IsIn(ARTIFACT_KINDS)
  artifactKind!: ArtifactKind;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión publicada', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  version!: string;

  /**
   * Valor de semver mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  semver?: string;

  /**
   * Valor de git ref mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gitRef?: string;

  /**
   * Valor de commit sha mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'SHA del commit', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  commitSha?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hash del contenido en hexadecimal; direcciona el artefacto',
    example: 'a'.repeat(64),
  })
  @Matches(/^[0-9a-f]{32,128}$/i, {
    message: 'contentHash debe ser un hash hexadecimal de 32 a 128 caracteres',
  })
  contentHash!: string;

  /**
   * Valor de storage uri mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'URI del blob en almacenamiento de objetos',
  })
  @IsOptional()
  @IsString()
  storageUri?: string;

  /**
   * Identificador asociado a file.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  /**
   * Valor de built at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  builtAt?: string;
}

/**
 * Define el contrato validado para artifact response.
 */
export class ArtifactResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de artifact ref mantenido por la instancia.
   */
  @ApiProperty()
  artifactRef!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty()
  contentHash!: string;

  /**
   * Valor de is immutable mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Siempre true: el artefacto publicado no se reescribe',
  })
  isImmutable!: boolean;

  /**
   * Identificador asociado a state concept.
   */
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
  /**
   * Identificador asociado a change request.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Cambio aprobado que lo habilita',
  })
  @IsUUID()
  changeRequestId!: string;

  /**
   * Identificador asociado a artifact.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  artifactId!: string;

  /**
   * Valor de environment mantenido por la instancia.
   */
  @ApiProperty({ enum: OPS_ENVIRONMENTS })
  @IsIn(OPS_ENVIRONMENTS)
  environment!: OpsEnvironment;

  /**
   * Valor de strategy mantenido por la instancia.
   */
  @ApiProperty({ enum: DEPLOY_STRATEGIES })
  @IsIn(DEPLOY_STRATEGIES)
  strategy!: DeployStrategy;

  /**
   * Valor de git ref mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gitRef?: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: ['SUCCEEDED', 'FAILED'],
    description:
      'Desenlace si el pipeline ya terminó; si falta, queda en curso',
  })
  @IsOptional()
  @IsIn(['SUCCEEDED', 'FAILED'])
  outcome?: DeployOutcome;
}

/**
 * Define el contrato validado para deployment response.
 */
export class DeploymentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de deployment number mantenido por la instancia.
   */
  @ApiProperty()
  deploymentNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de is current mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si pasa a ser el despliegue vigente del entorno',
  })
  isCurrent!: boolean;

  /**
   * Identificador asociado a superseded deployment.
   */
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
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se revierte' })
  @IsString()
  reason!: string;

  /**
   * Identificador asociado a target deployment.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Despliegue estable al que volver; por defecto, el correcto anterior',
  })
  @IsOptional()
  @IsUUID()
  targetDeploymentId?: string;
}

/**
 * Define el contrato validado para rollback response.
 */
export class RollbackResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Despliegue de reversión creado',
  })
  id!: string;

  /**
   * Valor de deployment number mantenido por la instancia.
   */
  @ApiProperty()
  deploymentNumber!: string;

  /**
   * Identificador asociado a rolled back deployment.
   */
  @ApiProperty({ format: 'uuid', description: 'Despliegue revertido' })
  rolledBackDeploymentId!: string;

  /**
   * Identificador asociado a artifact.
   */
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
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ enum: HEALTH_RUN_STATUSES })
  @IsIn(HEALTH_RUN_STATUSES)
  status!: HealthRunStatus;

  /**
   * Valor de source mantenido por la instancia.
   */
  @ApiProperty({ enum: HEALTH_RUN_SOURCES })
  @IsIn(HEALTH_RUN_SOURCES)
  source!: HealthRunSource;

  /**
   * Valor de latency ms mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 100, maximum: 599 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  httpStatus?: number;

  /**
   * Valor de observed value mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Valor observado, como cadena para no perder precisión',
  })
  @IsOptional()
  @IsString()
  observedValue?: string;

  /**
   * Valor de message mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  /**
   * Identificador asociado a deployment.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Despliegue bajo el que se observa',
  })
  @IsOptional()
  @IsUUID()
  deploymentId?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  finishedAt?: string;
}

/**
 * Define el contrato validado para health run response.
 */
export class HealthRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de consecutive failures mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Fallos consecutivos acumulados tras esta corrida',
  })
  consecutiveFailures!: number;

  /**
   * Identificador asociado a health incident.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Incidente abierto o ya vivo',
  })
  healthIncidentId?: string;

  /**
   * Valor de incident opened mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para incident responder.
 */
export class IncidentResponderDto {
  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  /**
   * Valor de role mantenido por la instancia.
   */
  @ApiProperty({ enum: RESPONDER_ROLES })
  @IsIn(RESPONDER_ROLES)
  role!: ResponderRole;

  /**
   * Valor de acknowledged mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'true si el respondiente ya acusó recibo',
  })
  @IsOptional()
  @IsBoolean()
  acknowledged?: boolean;
}

/**
 * Define el contrato validado para incident communication.
 */
export class IncidentCommunicationDto {
  /**
   * Valor de type mantenido por la instancia.
   */
  @ApiProperty({ enum: COMMUNICATION_TYPES })
  @IsIn(COMMUNICATION_TYPES)
  type!: CommunicationType;

  /**
   * Valor de audience mantenido por la instancia.
   */
  @ApiProperty({ enum: COMMUNICATION_AUDIENCES })
  @IsIn(COMMUNICATION_AUDIENCES)
  audience!: CommunicationAudience;

  /**
   * Valor de message text mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 4000 })
  @IsString()
  @MaxLength(4000)
  messageText!: string;

  /**
   * Valor de channel reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  channelReference?: string;
}

/** Cuerpo de `PATCH /ops/incidents/{id}` (UC-46-07). */
export class UpdateIncidentDto {
  /**
   * Valor de transition mantenido por la instancia.
   */
  @ApiProperty({
    enum: INCIDENT_TRANSITIONS,
    description: '`UPDATE` sólo añade sin mover el estado',
  })
  @IsIn(INCIDENT_TRANSITIONS)
  transition!: IncidentTransition;

  /**
   * Valor de summary mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Qué se apunta en el timeline',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  /**
   * Valor de root cause text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Causa raíz; obligatoria al resolver' })
  @IsOptional()
  @IsString()
  rootCauseText?: string;

  /**
   * Valor de resolution text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Cómo se resolvió; obligatoria al resolver',
  })
  @IsOptional()
  @IsString()
  resolutionText?: string;

  /**
   * Valor de responders mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [IncidentResponderDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncidentResponderDto)
  responders?: IncidentResponderDto[];

  /**
   * Valor de communications mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [IncidentCommunicationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncidentCommunicationDto)
  communications?: IncidentCommunicationDto[];
}

/**
 * Define el contrato validado para incident response.
 */
export class IncidentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de added responder ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Respondientes añadidos',
  })
  addedResponderIds!: string[];

  /**
   * Valor de communication ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Comunicaciones publicadas',
  })
  communicationIds!: string[];

  /**
   * Valor de timeline event ids mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para action item.
 */
export class ActionItemDto {
  /**
   * Valor de action code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código de la acción, único en el postmortem',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  actionCode!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  description!: string;

  /**
   * Valor de action type mantenido por la instancia.
   */
  @ApiProperty({ enum: ACTION_TYPES })
  @IsIn(ACTION_TYPES)
  actionType!: ActionType;

  /**
   * Identificador asociado a owner user.
   */
  @ApiProperty({ format: 'uuid', description: 'Quién responde de la acción' })
  @IsUUID()
  ownerUserId!: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: IMPROVEMENT_PRIORITIES, default: 'MEDIUM' })
  @IsOptional()
  @IsIn(IMPROVEMENT_PRIORITIES)
  priority?: ImprovementPriority;
}

/** Cuerpo de `POST /ops/incidents/{id}/postmortem` (UC-46-08). */
export class OpenPostmortemDto {
  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  /**
   * Identificador asociado a owner user.
   */
  @ApiProperty({ format: 'uuid', description: 'Quién conduce el postmortem' })
  @IsUUID()
  ownerUserId!: string;

  /**
   * Valor de impact summary mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  impactSummary?: string;

  /**
   * Valor de detection summary mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detectionSummary?: string;

  /**
   * Valor de response summary mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responseSummary?: string;

  /**
   * Valor de root cause summary mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCauseSummary?: string;

  /**
   * Valor de contributing factors json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Factores contribuyentes' })
  @IsOptional()
  @IsObject()
  contributingFactorsJson?: Record<string, unknown>;

  /**
   * Valor de lessons learned mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lessonsLearned?: string;

  /**
   * Valor de action items mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para postmortem response.
 */
export class PostmortemResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de action item ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  actionItemIds!: string[];

  /**
   * Valor de improvement item ids mantenido por la instancia.
   */
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
  /**
   * Valor de window start mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  windowStart!: string;

  /**
   * Valor de window end mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  windowEnd!: string;

  /**
   * Valor de good events mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Eventos buenos de la ventana; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  goodEvents!: string;

  /**
   * Valor de total events mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Eventos totales de la ventana; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  totalEvents!: string;

  /**
   * Valor de source reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'De dónde salieron los datos',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceReference?: string;
}

/**
 * Define el contrato validado para slo measurement response.
 */
export class SloMeasurementResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de attained value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cumplimiento alcanzado, como cadena decimal' })
  attainedValue!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
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
  /**
   * Valor de window seconds mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Ventana evaluada en segundos; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  windowSeconds!: string;

  /**
   * Valor de burn rate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Ritmo de consumo del presupuesto, como cadena decimal',
  })
  @IsNumberString()
  burnRate!: string;

  /**
   * Valor de remaining budget percent mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Presupuesto restante en porcentaje, como cadena decimal',
  })
  @IsNumberString()
  remainingBudgetPercent!: string;

  /**
   * Valor de action taken json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Qué se hizo al detectarlo' })
  @IsOptional()
  @IsObject()
  actionTakenJson?: Record<string, unknown>;

  /**
   * Identificador asociado a health incident.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Incidente de fiabilidad asociado',
  })
  @IsOptional()
  @IsUUID()
  healthIncidentId?: string;
}

/**
 * Define el contrato validado para burn event response.
 */
export class BurnEventResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiProperty({ format: 'uuid' })
  severityConceptId!: string;

  /**
   * Valor de deployment freeze active mantenido por la instancia.
   */
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
  /**
   * Valor de metric mantenido por la instancia.
   */
  @ApiProperty({ enum: CAPACITY_METRICS })
  @IsIn(CAPACITY_METRICS)
  metric!: CapacityMetric;

  /**
   * Valor de observed value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor observado, como cadena decimal' })
  @IsNumberString()
  observedValue!: string;

  /**
   * Valor de capacity value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Capacidad disponible, como cadena decimal' })
  @IsNumberString()
  capacityValue!: string;

  /**
   * Valor de measured at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo se midió; por defecto, ahora',
  })
  @IsOptional()
  @IsISO8601()
  measuredAt?: string;

  /**
   * Valor de source reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceReference?: string;

  /**
   * Valor de demand forecast json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Previsión de demanda recalculada' })
  @IsOptional()
  @IsObject()
  demandForecastJson?: Record<string, unknown>;

  /**
   * Valor de scaling policy json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Política de escalado recalculada' })
  @IsOptional()
  @IsObject()
  scalingPolicyJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para capacity measurement response.
 */
export class CapacityMeasurementResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de utilization percent mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Utilización calculada en porcentaje, como cadena decimal',
  })
  utilizationPercent!: string;

  /**
   * Valor de guardrail crossed mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si la utilización cruzó el guardrail del plan',
  })
  guardrailCrossed!: boolean;

  /**
   * Valor de plan updated mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el plan se recalculó en esta medición' })
  planUpdated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-46-12 · Revisión de preparación
// ---------------------------------------------------------------------------

/** Decisión de la revisión. */
export type ReviewDecision = 'GO' | 'NO_GO';

/**
 * Define el contrato validado para resolved finding.
 */
export class ResolvedFindingDto {
  /**
   * Identificador asociado a finding.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  findingId!: string;

  /**
   * Valor de evidence json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Evidencia del cierre' })
  @IsOptional()
  @IsObject()
  evidenceJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /ops/readiness-reviews/{id}/complete` (UC-46-12). */
export class CompleteReadinessReviewDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ enum: ['GO', 'NO_GO'] })
  @IsIn(['GO', 'NO_GO'])
  decision!: ReviewDecision;

  /**
   * Valor de resolved findings mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [ResolvedFindingDto],
    description: 'Hallazgos que se cierran',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResolvedFindingDto)
  resolvedFindings?: ResolvedFindingDto[];

  /**
   * Valor de evidence json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Evidencia de la revisión' })
  @IsOptional()
  @IsObject()
  evidenceJson?: Record<string, unknown>;

  /**
   * Identificador asociado a improvement owner user.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Quién responde de los hallazgos que quedan abiertos',
  })
  @IsUUID()
  improvementOwnerUserId!: string;
}

/**
 * Define el contrato validado para readiness review response.
 */
export class ReadinessReviewResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a decision concept.
   */
  @ApiProperty({ format: 'uuid' })
  decisionConceptId!: string;

  /**
   * Valor de resolved count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hallazgos cerrados en esta operación' })
  resolvedCount!: number;

  /**
   * Valor de improvement item ids mantenido por la instancia.
   */
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
  /**
   * Valor de content markdown mantenido por la instancia.
   */
  @ApiProperty({ description: 'Contenido del runbook en Markdown' })
  @IsString()
  contentMarkdown!: string;

  /**
   * Valor de automation definition json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Definición de la automatización asociada',
  })
  @IsOptional()
  @IsObject()
  automationDefinitionJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para runbook version response.
 */
export class RunbookVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Número de versión, correlativo dentro del runbook',
  })
  versionNumber!: number;

  /**
   * Identificador asociado a runbook.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Versión que pasa a ser la vigente del runbook',
  })
  runbookId!: string;
}

/** Cuerpo de `POST /ops/runbook-executions` (UC-46-13). */
export class RecordRunbookExecutionDto {
  /**
   * Identificador asociado a runbook version.
   */
  @ApiProperty({ format: 'uuid', description: 'Versión ejecutada' })
  @IsUUID()
  runbookVersionId!: string;

  /**
   * Valor de mode mantenido por la instancia.
   */
  @ApiProperty({ enum: EXECUTION_MODES })
  @IsIn(EXECUTION_MODES)
  mode!: ExecutionMode;

  /**
   * Valor de result mantenido por la instancia.
   */
  @ApiProperty({ enum: EXECUTION_RESULTS })
  @IsIn(EXECUTION_RESULTS)
  result!: ExecutionResult;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startedAt!: string;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endedAt?: string;

  /**
   * Identificador asociado a health incident.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Incidente en el que se ejecutó',
  })
  @IsOptional()
  @IsUUID()
  healthIncidentId?: string;

  /**
   * Identificador asociado a change request.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cambio en el que se ejecutó',
  })
  @IsOptional()
  @IsUUID()
  changeRequestId?: string;

  /**
   * Valor de execution log uri mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'URI del log de ejecución' })
  @IsOptional()
  @IsString()
  executionLogUri?: string;

  /**
   * Valor de output json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Salida de la ejecución' })
  @IsOptional()
  @IsObject()
  outputJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para runbook execution response.
 */
export class RunbookExecutionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a result concept.
   */
  @ApiProperty({ format: 'uuid' })
  resultConceptId!: string;

  /**
   * Identificador asociado a timeline event.
   */
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
  /**
   * Valor de started at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startedAt!: string;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  endedAt!: string;

  /**
   * Valor de observed rto seconds mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Tiempo de recuperación observado en segundos; cadena por ser bigint',
    example: '900',
  })
  @IsNumberString({ no_symbols: true })
  observedRtoSeconds!: string;

  /**
   * Valor de observed rpo seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Pérdida de datos observada en segundos; cadena por ser bigint',
    example: '300',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  observedRpoSeconds?: string;

  /**
   * Valor de evidence uri mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'URI de la evidencia' })
  @IsOptional()
  @IsString()
  evidenceUri?: string;

  /**
   * Valor de findings json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Hallazgos del ejercicio' })
  @IsOptional()
  @IsObject()
  findingsJson?: Record<string, unknown>;

  /**
   * Identificador asociado a improvement owner user.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Quién responde de la mejora si se incumple el objetivo',
  })
  @IsUUID()
  improvementOwnerUserId!: string;
}

/**
 * Define el contrato validado para resilience exercise response.
 */
export class ResilienceExerciseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a result concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Resultado derivado de comparar con el objetivo',
  })
  resultConceptId!: string;

  /**
   * Valor de rto breached mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el RTO observado supera el objetivo' })
  rtoBreached!: boolean;

  /**
   * Valor de rpo breached mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el RPO observado supera el objetivo' })
  rpoBreached!: boolean;

  /**
   * Identificador asociado a improvement item.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Mejora abierta por el incumplimiento',
  })
  improvementItemId?: string;
}
