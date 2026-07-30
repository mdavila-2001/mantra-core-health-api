import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// ---------------------------------------------------------------------------
// UC-32-01 · Registrar definición de máquina de estado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workflow/state-machines` (UC-32-01). */
export class RegisterStateMachineDto {
  /**
   * Valor de machine code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100, description: 'Código único de la máquina' })
  @IsString()
  @MaxLength(100)
  machineCode!: string;

  /**
   * Valor de aggregate schema name mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 63,
    description: 'Esquema del agregado gobernado, p. ej. `clinical`',
  })
  @IsString()
  @MaxLength(63)
  aggregateSchemaName!: string;

  /**
   * Valor de aggregate entity name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 63, description: 'Tabla del agregado gobernado' })
  @IsString()
  @MaxLength(63)
  aggregateEntityName!: string;

  /**
   * Valor de status field name mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 63,
    description: 'Columna del agregado que guarda el estado',
  })
  @IsString()
  @MaxLength(63)
  statusFieldName!: string;

  /**
   * Identificador asociado a state value set.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Value set gobernado del que salen los estados (Módulo 04)',
  })
  @IsUUID()
  stateValueSetId!: string;
}

/**
 * Define el contrato validado para state machine response.
 */
export class StateMachineResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de machine code mantenido por la instancia.
   */
  @ApiProperty()
  machineCode!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-32-02 · Definir estados de la máquina
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para state definition.
 */
export class StateDefinitionDto {
  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Concepto de estado del value set',
  })
  @IsUUID()
  stateConceptId!: string;

  /**
   * Valor de state code snapshot mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Código legible del estado, congelado',
  })
  @IsString()
  @MaxLength(100)
  stateCodeSnapshot!: string;

  /**
   * Valor de is initial mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isInitial?: boolean;

  /**
   * Valor de is terminal mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isTerminal?: boolean;

  /**
   * Valor de allows edit mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description: 'Si el agregado admite edición mientras está en este estado',
  })
  @IsOptional()
  @IsBoolean()
  allowsEdit?: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0, description: 'Orden de presentación' })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** Cuerpo de `POST /workflow/state-machines/{id}/states` (UC-32-02). */
export class DefineStatesDto {
  /**
   * Valor de states mantenido por la instancia.
   */
  @ApiProperty({ type: [StateDefinitionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StateDefinitionDto)
  states!: StateDefinitionDto[];
}

/**
 * Define el contrato validado para define states response.
 */
export class DefineStatesResponseDto {
  /**
   * Identificador asociado a state machine definition.
   */
  @ApiProperty({ format: 'uuid' })
  stateMachineDefinitionId!: string;

  /**
   * Valor de state ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  stateIds!: string[];

  /**
   * Valor de total states mantenido por la instancia.
   */
  @ApiProperty({ description: 'Total de estados definidos en la máquina' })
  totalStates!: number;
}

// ---------------------------------------------------------------------------
// UC-32-03 · Definir transición con guardas y efectos
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para transition guard.
 */
export class TransitionGuardDto {
  /**
   * Valor de guard code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  guardCode!: string;

  /**
   * Identificador asociado a guard type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de guarda (expresión, permiso, estado)',
  })
  @IsUUID()
  guardTypeConceptId!: string;

  /**
   * Valor de evaluation order mantenido por la instancia.
   */
  @ApiProperty({
    minimum: 0,
    description: 'Orden de evaluación; la primera que falla corta',
  })
  @IsInt()
  @Min(0)
  evaluationOrder!: number;

  /**
   * Valor de expression json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Expresión declarativa de la guarda' })
  @IsOptional()
  @IsObject()
  expressionJson?: Record<string, unknown>;

  /**
   * Valor de failure code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Código de fallo estable que se devuelve al rechazar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  failureCode?: string;

  /**
   * Valor de failure message key mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Clave del mensaje traducible',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  failureMessageKey?: string;
}

/**
 * Define el contrato validado para transition side effect.
 */
export class TransitionSideEffectDto {
  /**
   * Valor de side effect code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sideEffectCode!: string;

  /**
   * Identificador asociado a side effect type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de efecto (outbox, tarea, notificación)',
  })
  @IsUUID()
  sideEffectTypeConceptId!: string;

  /**
   * Identificador asociado a execution mode concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Modo de ejecución (síncrono o asíncrono)',
  })
  @IsUUID()
  executionModeConceptId!: string;

  /**
   * Valor de execution order mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  executionOrder!: number;

  /**
   * Valor de outbox event type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description:
      'Tipo de evento que se publica en el outbox al aplicar la transición',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  outboxEventType?: string;

  /**
   * Valor de action spec json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Qué hace el efecto' })
  @IsOptional()
  @IsObject()
  actionSpecJson?: Record<string, unknown>;

  /**
   * Valor de compensation spec json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Cómo se deshace; sin esto la transición no es compensable',
  })
  @IsOptional()
  @IsObject()
  compensationSpecJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /workflow/state-machines/{id}/transitions` (UC-32-03). */
export class DefineTransitionDto {
  /**
   * Valor de transition code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  transitionCode!: string;

  /**
   * Identificador asociado a from state concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fromStateConceptId!: string;

  /**
   * Identificador asociado a to state concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  toStateConceptId!: string;

  /**
   * Valor de command code mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Comando que dispara la transición',
  })
  @IsString()
  @MaxLength(100)
  commandCode!: string;

  /**
   * Identificador asociado a required permission.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Permiso exigido al actor (Módulo 05)',
  })
  @IsUUID()
  requiredPermissionId!: string;

  /**
   * Identificador asociado a purpose of use concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Propósito de uso admitido' })
  @IsUUID()
  purposeOfUseConceptId!: string;

  /**
   * Valor de idempotency required mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  idempotencyRequired?: boolean;

  /**
   * Valor de optimistic lock required mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  optimisticLockRequired?: boolean;

  /**
   * Valor de reason required mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  reasonRequired?: boolean;

  /**
   * Valor de transition timeout seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    minimum: 1,
    description: 'Plazo tras el que la transición se considera vencida',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  transitionTimeoutSeconds?: number;

  /**
   * Valor de guards mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [TransitionGuardDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransitionGuardDto)
  guards?: TransitionGuardDto[];

  /**
   * Valor de side effects mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [TransitionSideEffectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransitionSideEffectDto)
  sideEffects?: TransitionSideEffectDto[];
}

/**
 * Define el contrato validado para transition definition response.
 */
export class TransitionDefinitionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de transition code mantenido por la instancia.
   */
  @ApiProperty()
  transitionCode!: string;

  /**
   * Valor de guard count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Guardas creadas' })
  guardCount!: number;

  /**
   * Valor de side effect count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Efectos creados' })
  sideEffectCount!: number;
}

// ---------------------------------------------------------------------------
// UC-32-04 · Publicar versión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workflow/state-machines/{id}/publish` (UC-32-04). */
export class PublishStateMachineDto {
  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Desde cuándo rige; por omisión, ahora',
  })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;
}

/**
 * Define el contrato validado para publish state machine response.
 */
export class PublishStateMachineResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a retired version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión anterior que quedó retirada',
  })
  retiredVersionId?: string;
}

// ---------------------------------------------------------------------------
// UC-32-05 · Disparar transición
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workflow/aggregates/{aggregateId}/transitions/{commandCode}` (UC-32-05). */
export class TriggerTransitionDto {
  /**
   * Valor de machine code mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Máquina de estado que gobierna el agregado',
  })
  @IsString()
  @MaxLength(100)
  machineCode!: string;

  /**
   * Identificador asociado a actor tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Tenant en cuyo nombre actúa el llamante; queda en el evento de transición',
  })
  @IsOptional()
  @IsUUID()
  actorTenantId?: string;

  /**
   * Identificador asociado a reason concept.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Motivo del movimiento' })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Texto libre del motivo' })
  @IsOptional()
  @IsString()
  reasonText?: string;

  /**
   * Valor de expected row version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Versión del agregado que vio el llamante; exigida si la transición usa bloqueo optimista',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedRowVersion?: number;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Hilo de negocio al que pertenece',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  /**
   * Identificador asociado a causation.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Evento que causó éste' })
  @IsOptional()
  @IsUUID()
  causationId?: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Datos del comando para las guardas' })
  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para transition event response.
 */
export class TransitionEventResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a aggregate.
   */
  @ApiProperty({ format: 'uuid' })
  aggregateId!: string;

  /**
   * Identificador asociado a from state concept.
   */
  @ApiProperty({ format: 'uuid' })
  fromStateConceptId!: string;

  /**
   * Identificador asociado a to state concept.
   */
  @ApiProperty({ format: 'uuid' })
  toStateConceptId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  occurredAt!: string;

  /**
   * Valor de published effects mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Eventos publicados en el outbox por los efectos de la transición',
  })
  publishedEffects!: number;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Verdadero si la clave de idempotencia ya se había aplicado y se devuelve el resultado previo',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-32-08 · Compensar transición
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/compensate` (UC-32-08). */
export class CompensateTransitionDto {
  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se compensa' })
  @IsString()
  reasonText!: string;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Saga a la que pertenece la compensación',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;
}

/**
 * Define el contrato validado para compensate transition response.
 */
export class CompensateTransitionResponseDto {
  /**
   * Identificador asociado a compensation event.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Evento de compensación registrado',
  })
  compensationEventId!: string;

  /**
   * Identificador asociado a original event.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Evento original que se revierte',
  })
  originalEventId!: string;

  /**
   * Identificador asociado a restored state concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado al que vuelve el agregado',
  })
  restoredStateConceptId!: string;

  /**
   * Valor de published effects mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Eventos de compensación publicados en el outbox',
  })
  publishedEffects!: number;
}

// ---------------------------------------------------------------------------
// UC-32-09 · Reintentar transición fallida
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/retry` (UC-32-09). */
export class RetryTransitionDto {
  /**
   * Identificador asociado a workflow instance.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Instancia en `retry_scheduled` que vuelve a `running`',
  })
  @IsOptional()
  @IsUUID()
  workflowInstanceId?: string;
}

/**
 * Define el contrato validado para retry transition response.
 */
export class RetryTransitionResponseDto {
  /**
   * Identificador asociado a retry event.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Evento de reintento registrado',
  })
  retryEventId!: string;

  /**
   * Identificador asociado a original event.
   */
  @ApiProperty({ format: 'uuid' })
  originalEventId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Clave de idempotencia conservada del original, para no duplicar el efecto de negocio',
  })
  idempotencyKey?: string;

  /**
   * Identificador asociado a workflow instance.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  workflowInstanceId?: string;
}

// ---------------------------------------------------------------------------
// UC-32-10 · Barrido de timeouts
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workflow/instances/sweep-timeouts` (UC-32-10). */
export class SweepTimeoutsDto {
  /**
   * Valor de batch size mantenido por la instancia.
   */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 500,
    default: 50,
    description: 'Cuántas instancias vencidas toma este barrido',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  batchSize?: number;
}

/**
 * Define el contrato validado para sweep timeouts response.
 */
export class SweepTimeoutsResponseDto {
  /**
   * Valor de escalated instances mantenido por la instancia.
   */
  @ApiProperty({ description: 'Instancias que quedaron escaladas' })
  escalatedInstances!: number;

  /**
   * Valor de escalated tasks mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tareas que quedaron escaladas' })
  escalatedTasks!: number;

  /**
   * Valor de instance ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  instanceIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-32-11 · Consultar historial
// ---------------------------------------------------------------------------

/** Query de `GET /workflow/aggregates/{aggregateId}/transitions` (UC-32-11). */
export class QueryTransitionHistoryDto {
  /**
   * Valor de machine code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Filtra por máquina de estado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  machineCode?: string;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  /**
   * Valor de offset mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/**
 * Define el contrato validado para transition history entry.
 */
export class TransitionHistoryEntryDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a from state concept.
   */
  @ApiProperty({ format: 'uuid' })
  fromStateConceptId!: string;

  /**
   * Identificador asociado a to state concept.
   */
  @ApiProperty({ format: 'uuid' })
  toStateConceptId!: string;

  /**
   * Valor de transition code mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Código de la transición aplicada' })
  transitionCode?: string;

  /**
   * Valor de command code mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Comando que la disparó' })
  commandCode?: string;

  /**
   * Identificador asociado a actor user.
   */
  @ApiProperty({ format: 'uuid' })
  actorUserId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  reasonConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  reasonText?: string;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  correlationId?: string;

  /**
   * Identificador asociado a causation.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  causationId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  occurredAt!: string;
}

/**
 * Define el contrato validado para transition history response.
 */
export class TransitionHistoryResponseDto {
  /**
   * Identificador asociado a aggregate.
   */
  @ApiProperty({ format: 'uuid' })
  aggregateId!: string;

  /**
   * Valor de transitions mantenido por la instancia.
   */
  @ApiProperty({ type: [TransitionHistoryEntryDto] })
  transitions!: TransitionHistoryEntryDto[];

  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiProperty({ description: 'Total de transiciones que cumplen el filtro' })
  total!: number;

  /**
   * Identificador asociado a current state concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Estado actual de la instancia asociada',
  })
  currentStateConceptId?: string;
}

// ---------------------------------------------------------------------------
// UC-32-12 · Crear instancia y tareas
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para workflow task input.
 */
export class WorkflowTaskInputDto {
  /**
   * Valor de task code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  taskCode!: string;

  /**
   * Identificador asociado a task type concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  taskTypeConceptId!: string;

  /**
   * Identificador asociado a assigned user.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  /**
   * Identificador asociado a assigned role concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedRoleConceptId?: string;

  /**
   * Identificador asociado a required permission.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requiredPermissionId?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;
}

/** Cuerpo de `POST /workflow/instances` (UC-32-12). */
export class CreateWorkflowInstanceDto {
  /**
   * Valor de workflow code mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Código de la máquina activa que gobierna el flujo',
  })
  @IsString()
  @MaxLength(100)
  workflowCode!: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Agregado sobre el que corre el flujo',
  })
  @IsUUID()
  subjectId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de current step code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  currentStepCode?: string;

  /**
   * Valor de context json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Contexto del flujo' })
  @IsOptional()
  @IsObject()
  contextJson?: Record<string, unknown>;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Plazo de la instancia',
  })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  /**
   * Valor de tasks mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [WorkflowTaskInputDto],
    description: 'Tareas de los pasos iniciales',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowTaskInputDto)
  tasks?: WorkflowTaskInputDto[];
}

/**
 * Define el contrato validado para workflow instance response.
 */
export class WorkflowInstanceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de workflow code mantenido por la instancia.
   */
  @ApiProperty()
  workflowCode!: string;

  /**
   * Identificador asociado a current state concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado inicial tomado de la definición',
  })
  currentStateConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de task ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  taskIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-32-13 · Completar tarea
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workflow/tasks/{id}/complete` (UC-32-13). */
export class CompleteTaskDto {
  /**
   * Valor de command code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Comando de la máquina que dispara el completado, si lo hay',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  commandCode?: string;

  /**
   * Valor de next step code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Paso al que avanza la instancia',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nextStepCode?: string;

  /**
   * Valor de next due at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Nuevo plazo de la instancia',
  })
  @IsOptional()
  @IsISO8601()
  nextDueAt?: string;

  /**
   * Valor de result json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Resultado de la tarea, para el contexto de la instancia',
  })
  @IsOptional()
  @IsObject()
  resultJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para complete task response.
 */
export class CompleteTaskResponseDto {
  /**
   * Identificador asociado a task.
   */
  @ApiProperty({ format: 'uuid' })
  taskId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a workflow instance.
   */
  @ApiProperty({ format: 'uuid' })
  workflowInstanceId!: string;

  /**
   * Valor de current step code mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Paso al que avanzó la instancia' })
  currentStepCode?: string;

  /**
   * Identificador asociado a transition event.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Transición disparada por el completado, si la tarea la tenía asociada',
  })
  transitionEventId?: string;

  /**
   * Valor de remaining open tasks mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tareas que quedan abiertas en la instancia' })
  remainingOpenTasks!: number;
}
