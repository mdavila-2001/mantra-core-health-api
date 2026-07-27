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
  @ApiProperty({ maxLength: 100, description: 'Código único de la máquina' })
  @IsString()
  @MaxLength(100)
  machineCode!: string;

  @ApiProperty({
    maxLength: 63,
    description: 'Esquema del agregado gobernado, p. ej. `clinical`',
  })
  @IsString()
  @MaxLength(63)
  aggregateSchemaName!: string;

  @ApiProperty({ maxLength: 63, description: 'Tabla del agregado gobernado' })
  @IsString()
  @MaxLength(63)
  aggregateEntityName!: string;

  @ApiProperty({
    maxLength: 63,
    description: 'Columna del agregado que guarda el estado',
  })
  @IsString()
  @MaxLength(63)
  statusFieldName!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Value set gobernado del que salen los estados (Módulo 04)',
  })
  @IsUUID()
  stateValueSetId!: string;
}

export class StateMachineResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  machineCode!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-32-02 · Definir estados de la máquina
// ---------------------------------------------------------------------------

export class StateDefinitionDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Concepto de estado del value set',
  })
  @IsUUID()
  stateConceptId!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Código legible del estado, congelado',
  })
  @IsString()
  @MaxLength(100)
  stateCodeSnapshot!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isInitial?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isTerminal?: boolean;

  @ApiPropertyOptional({
    default: true,
    description: 'Si el agregado admite edición mientras está en este estado',
  })
  @IsOptional()
  @IsBoolean()
  allowsEdit?: boolean;

  @ApiProperty({ minimum: 0, description: 'Orden de presentación' })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** Cuerpo de `POST /workflow/state-machines/{id}/states` (UC-32-02). */
export class DefineStatesDto {
  @ApiProperty({ type: [StateDefinitionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StateDefinitionDto)
  states!: StateDefinitionDto[];
}

export class DefineStatesResponseDto {
  @ApiProperty({ format: 'uuid' })
  stateMachineDefinitionId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  stateIds!: string[];

  @ApiProperty({ description: 'Total de estados definidos en la máquina' })
  totalStates!: number;
}

// ---------------------------------------------------------------------------
// UC-32-03 · Definir transición con guardas y efectos
// ---------------------------------------------------------------------------

export class TransitionGuardDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  guardCode!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de guarda (expresión, permiso, estado)',
  })
  @IsUUID()
  guardTypeConceptId!: string;

  @ApiProperty({
    minimum: 0,
    description: 'Orden de evaluación; la primera que falla corta',
  })
  @IsInt()
  @Min(0)
  evaluationOrder!: number;

  @ApiPropertyOptional({ description: 'Expresión declarativa de la guarda' })
  @IsOptional()
  @IsObject()
  expressionJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Código de fallo estable que se devuelve al rechazar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  failureCode?: string;

  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Clave del mensaje traducible',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  failureMessageKey?: string;
}

export class TransitionSideEffectDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sideEffectCode!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de efecto (outbox, tarea, notificación)',
  })
  @IsUUID()
  sideEffectTypeConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Modo de ejecución (síncrono o asíncrono)',
  })
  @IsUUID()
  executionModeConceptId!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  executionOrder!: number;

  @ApiPropertyOptional({
    maxLength: 200,
    description:
      'Tipo de evento que se publica en el outbox al aplicar la transición',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  outboxEventType?: string;

  @ApiPropertyOptional({ description: 'Qué hace el efecto' })
  @IsOptional()
  @IsObject()
  actionSpecJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Cómo se deshace; sin esto la transición no es compensable',
  })
  @IsOptional()
  @IsObject()
  compensationSpecJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /workflow/state-machines/{id}/transitions` (UC-32-03). */
export class DefineTransitionDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  transitionCode!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fromStateConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  toStateConceptId!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Comando que dispara la transición',
  })
  @IsString()
  @MaxLength(100)
  commandCode!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Permiso exigido al actor (Módulo 05)',
  })
  @IsUUID()
  requiredPermissionId!: string;

  @ApiProperty({ format: 'uuid', description: 'Propósito de uso admitido' })
  @IsUUID()
  purposeOfUseConceptId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  idempotencyRequired?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  optimisticLockRequired?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  reasonRequired?: boolean;

  @ApiPropertyOptional({
    minimum: 1,
    description: 'Plazo tras el que la transición se considera vencida',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  transitionTimeoutSeconds?: number;

  @ApiPropertyOptional({ type: [TransitionGuardDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransitionGuardDto)
  guards?: TransitionGuardDto[];

  @ApiPropertyOptional({ type: [TransitionSideEffectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransitionSideEffectDto)
  sideEffects?: TransitionSideEffectDto[];
}

export class TransitionDefinitionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  transitionCode!: string;

  @ApiProperty({ description: 'Guardas creadas' })
  guardCount!: number;

  @ApiProperty({ description: 'Efectos creados' })
  sideEffectCount!: number;
}

// ---------------------------------------------------------------------------
// UC-32-04 · Publicar versión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workflow/state-machines/{id}/publish` (UC-32-04). */
export class PublishStateMachineDto {
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Desde cuándo rige; por omisión, ahora',
  })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;
}

export class PublishStateMachineResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

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
  @ApiProperty({
    maxLength: 100,
    description: 'Máquina de estado que gobierna el agregado',
  })
  @IsString()
  @MaxLength(100)
  machineCode!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Tenant en cuyo nombre actúa el llamante; queda en el evento de transición',
  })
  @IsOptional()
  @IsUUID()
  actorTenantId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Motivo del movimiento' })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;

  @ApiPropertyOptional({ description: 'Texto libre del motivo' })
  @IsOptional()
  @IsString()
  reasonText?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Versión del agregado que vio el llamante; exigida si la transición usa bloqueo optimista',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedRowVersion?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Hilo de negocio al que pertenece',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Evento que causó éste' })
  @IsOptional()
  @IsUUID()
  causationId?: string;

  @ApiPropertyOptional({ description: 'Datos del comando para las guardas' })
  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;
}

export class TransitionEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  aggregateId!: string;

  @ApiProperty({ format: 'uuid' })
  fromStateConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  toStateConceptId!: string;

  @ApiProperty({ format: 'date-time' })
  occurredAt!: string;

  @ApiProperty({
    description:
      'Eventos publicados en el outbox por los efectos de la transición',
  })
  publishedEffects!: number;

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
  @ApiProperty({ description: 'Por qué se compensa' })
  @IsString()
  reasonText!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Saga a la que pertenece la compensación',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;
}

export class CompensateTransitionResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Evento de compensación registrado',
  })
  compensationEventId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Evento original que se revierte',
  })
  originalEventId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado al que vuelve el agregado',
  })
  restoredStateConceptId!: string;

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
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Instancia en `retry_scheduled` que vuelve a `running`',
  })
  @IsOptional()
  @IsUUID()
  workflowInstanceId?: string;
}

export class RetryTransitionResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Evento de reintento registrado',
  })
  retryEventId!: string;

  @ApiProperty({ format: 'uuid' })
  originalEventId!: string;

  @ApiPropertyOptional({
    description:
      'Clave de idempotencia conservada del original, para no duplicar el efecto de negocio',
  })
  idempotencyKey?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  workflowInstanceId?: string;
}

// ---------------------------------------------------------------------------
// UC-32-10 · Barrido de timeouts
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workflow/instances/sweep-timeouts` (UC-32-10). */
export class SweepTimeoutsDto {
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

export class SweepTimeoutsResponseDto {
  @ApiProperty({ description: 'Instancias que quedaron escaladas' })
  escalatedInstances!: number;

  @ApiProperty({ description: 'Tareas que quedaron escaladas' })
  escalatedTasks!: number;

  @ApiProperty({ type: [String], format: 'uuid' })
  instanceIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-32-11 · Consultar historial
// ---------------------------------------------------------------------------

/** Query de `GET /workflow/aggregates/{aggregateId}/transitions` (UC-32-11). */
export class QueryTransitionHistoryDto {
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Filtra por máquina de estado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  machineCode?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class TransitionHistoryEntryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  fromStateConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  toStateConceptId!: string;

  @ApiPropertyOptional({ description: 'Código de la transición aplicada' })
  transitionCode?: string;

  @ApiPropertyOptional({ description: 'Comando que la disparó' })
  commandCode?: string;

  @ApiProperty({ format: 'uuid' })
  actorUserId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  reasonConceptId?: string;

  @ApiPropertyOptional()
  reasonText?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  correlationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  causationId?: string;

  @ApiProperty({ format: 'date-time' })
  occurredAt!: string;
}

export class TransitionHistoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  aggregateId!: string;

  @ApiProperty({ type: [TransitionHistoryEntryDto] })
  transitions!: TransitionHistoryEntryDto[];

  @ApiProperty({ description: 'Total de transiciones que cumplen el filtro' })
  total!: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Estado actual de la instancia asociada',
  })
  currentStateConceptId?: string;
}

// ---------------------------------------------------------------------------
// UC-32-12 · Crear instancia y tareas
// ---------------------------------------------------------------------------

export class WorkflowTaskInputDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  taskCode!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  taskTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedRoleConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requiredPermissionId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;
}

/** Cuerpo de `POST /workflow/instances` (UC-32-12). */
export class CreateWorkflowInstanceDto {
  @ApiProperty({
    maxLength: 100,
    description: 'Código de la máquina activa que gobierna el flujo',
  })
  @IsString()
  @MaxLength(100)
  workflowCode!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  subjectTypeConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Agregado sobre el que corre el flujo',
  })
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  currentStepCode?: string;

  @ApiPropertyOptional({ description: 'Contexto del flujo' })
  @IsOptional()
  @IsObject()
  contextJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Plazo de la instancia',
  })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

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

export class WorkflowInstanceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  workflowCode!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado inicial tomado de la definición',
  })
  currentStateConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  taskIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-32-13 · Completar tarea
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workflow/tasks/{id}/complete` (UC-32-13). */
export class CompleteTaskDto {
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Comando de la máquina que dispara el completado, si lo hay',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  commandCode?: string;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Paso al que avanza la instancia',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nextStepCode?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Nuevo plazo de la instancia',
  })
  @IsOptional()
  @IsISO8601()
  nextDueAt?: string;

  @ApiPropertyOptional({
    description: 'Resultado de la tarea, para el contexto de la instancia',
  })
  @IsOptional()
  @IsObject()
  resultJson?: Record<string, unknown>;
}

export class CompleteTaskResponseDto {
  @ApiProperty({ format: 'uuid' })
  taskId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  workflowInstanceId!: string;

  @ApiPropertyOptional({ description: 'Paso al que avanzó la instancia' })
  currentStepCode?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Transición disparada por el completado, si la tarea la tenía asociada',
  })
  transitionEventId?: string;

  @ApiProperty({ description: 'Tareas que quedan abiertas en la instancia' })
  remainingOpenTasks!: number;
}
