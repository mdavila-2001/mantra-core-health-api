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
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// ---------------------------------------------------------------------------
// UC-48-01 · Registrar agente con su primera versión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/agents` (UC-48-01). */
export class RegisterAgentDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  agentTypeConceptId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  defaultModelConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  systemServiceComponentId?: string;

  @ApiProperty({ format: 'uuid', description: 'Nivel de autonomía del agente' })
  @IsUUID()
  autonomyLevelConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Identidad de servicio con la que el agente actúa; obligatoria si no sólo sugiere',
  })
  @IsOptional()
  @IsUUID()
  actsAsUserId?: string;

  @ApiProperty({ description: 'Plantilla de prompt de la versión 1' })
  @IsString()
  promptTemplate!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  modelConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  modelParamsJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputSchemaJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  outputSchemaJson?: Record<string, unknown>;
}

export class AgentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  currentVersion!: number;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Versión 1, creada en la misma transacción',
  })
  agentVersionId!: string;
}

// ---------------------------------------------------------------------------
// UC-48-02 · Publicar nueva versión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/agents/{id}/versions/publish` (UC-48-02). */
export class PublishAgentVersionDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Versión en borrador que se publica; si no se envía, se crea una nueva',
  })
  @IsOptional()
  @IsUUID()
  agentVersionId?: string;

  @ApiPropertyOptional({ description: 'Plantilla de la versión nueva' })
  @IsOptional()
  @IsString()
  promptTemplate?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  modelConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  modelParamsJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputSchemaJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  outputSchemaJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Qué cambia respecto a la versión anterior',
  })
  @IsOptional()
  @IsString()
  changelog?: string;
}

export class AgentVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  agentId!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Versión vigente del agente tras publicar' })
  currentVersion!: number;
}

// ---------------------------------------------------------------------------
// UC-48-03 · Registrar herramienta
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/tools` (UC-48-03). */
export class RegisterToolDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  toolTypeConceptId!: string;

  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Recurso sobre el que opera la herramienta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetResource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputSchemaJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  outputSchemaJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Endpoint de integración; obligatorio si la herramienta es una llamada HTTP',
  })
  @IsOptional()
  @IsUUID()
  integrationEndpointId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Si la herramienta escribe',
  })
  @IsOptional()
  @IsBoolean()
  isWrite?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Si su uso exige aprobación humana',
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}

export class ToolResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  isWrite!: boolean;

  @ApiProperty()
  requiresApproval!: boolean;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-48-04 · Enlazar herramientas a una versión
// ---------------------------------------------------------------------------

export class ToolBindingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  agentToolId!: string;

  @ApiPropertyOptional({
    description: 'Recorte del alcance de la herramienta para esta versión',
  })
  @IsOptional()
  @IsObject()
  scopeJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    minimum: 1,
    description: 'Tope de llamadas por ejecución',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCallsPerRun?: number;

  @ApiProperty({
    format: 'uuid',
    description: 'Si el enlace permite o deniega la herramienta',
  })
  @IsUUID()
  permissionEffectConceptId!: string;
}

/** Cuerpo de `POST /automation/agents/{id}/versions/{vid}/tool-bindings` (UC-48-04). */
export class BindToolsDto {
  @ApiProperty({ type: [ToolBindingDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ToolBindingDto)
  bindings!: ToolBindingDto[];
}

export class BindToolsResponseDto {
  @ApiProperty({ format: 'uuid' })
  agentVersionId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  bindingIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-48-05 · Guardrails
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/guardrails` (UC-48-05). */
export class DefineGuardrailDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  policyTypeConceptId!: string;

  @ApiPropertyOptional({ description: 'Regla declarativa de la política' })
  @IsOptional()
  @IsObject()
  ruleJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cómo se trata el dato de paciente',
  })
  @IsOptional()
  @IsUUID()
  piiPhiHandlingConceptId?: string;

  @ApiPropertyOptional({ description: 'Tope de coste; cadena por ser numeric' })
  @IsOptional()
  @IsNumberString()
  maxCostAmount?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Bloquea, avisa o sólo registra',
  })
  @IsUUID()
  enforcementConceptId!: string;
}

export class GuardrailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  isActive!: boolean;
}

/** Cuerpo de `POST /automation/agents/{id}/guardrails` (UC-48-05). */
export class AttachGuardrailDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  guardrailPolicyId!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class AttachGuardrailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  agentId!: string;

  @ApiProperty({ format: 'uuid' })
  guardrailPolicyId!: string;

  @ApiProperty()
  isEnabled!: boolean;
}

// ---------------------------------------------------------------------------
// UC-48-06 · Definir workflow y sus pasos
// ---------------------------------------------------------------------------

export class WorkflowStepDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  stepCode!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  stepTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  agentToolId?: string;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Código del paso siguiente si éste sale bien',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  onSuccessStepCode?: string;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Código del paso siguiente si éste falla',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  onFailureStepCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** Cuerpo de `POST /automation/workflows` (UC-48-06). */
export class DefineWorkflowDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  orchestrationTypeConceptId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  definitionJson?: Record<string, unknown>;

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps!: WorkflowStepDto[];
}

export class WorkflowResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  stepIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-48-07 · Configurar disparador
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/triggers` (UC-48-07). */
export class ConfigureTriggerDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  triggerTypeConceptId!: string;

  @ApiPropertyOptional({
    maxLength: 200,
    description:
      'Tipo de evento que suscribe; obligatorio para disparadores por evento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventType?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetResourceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    maxLength: 100,
    description:
      'Expresión cron de 5 campos; obligatoria para disparadores por calendario',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  scheduleCron?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workflowId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Calendario de campaña, si el cron viene de marketing',
  })
  @IsOptional()
  @IsUUID()
  campaignScheduleId?: string;
}

export class TriggerResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  isEnabled!: boolean;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-48-08 · Disparar workflow_run
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/workflows/{id}/runs` (UC-48-08). */
export class StartWorkflowRunDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Disparador que originó la ejecución',
  })
  @IsOptional()
  @IsUUID()
  triggerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'De dónde viene la ejecución: evento, calendario o mano',
  })
  @IsUUID()
  triggerSourceConceptId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Tipo del expediente sobre el que corre',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contextRefType?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Expediente sobre el que corre',
  })
  @IsOptional()
  @IsUUID()
  contextRefId?: string;
}

export class WorkflowRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  runNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description: 'Verdadero si ya había un run vivo para el mismo contexto',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-48-09 · Ejecutar agent_run y registrar pasos
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/runs/{workflowRunId}/agent-runs` (UC-48-09). */
export class StartAgentRunDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  agentId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Versión concreta; por omisión, la publicada vigente del agente',
  })
  @IsOptional()
  @IsUUID()
  agentVersionId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  taskTypeConceptId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputJson?: Record<string, unknown>;
}

export class AgentRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  agentVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /automation/agent-runs/{id}/steps` (UC-48-09). */
export class RecordAgentStepDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  stepKindConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Herramienta invocada, si el paso la usa',
  })
  @IsOptional()
  @IsUUID()
  agentToolId?: string;

  @ApiPropertyOptional({ description: 'Razonamiento del agente en este paso' })
  @IsOptional()
  @IsString()
  thoughtText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  toolInputJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  toolOutputJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  errorText?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió; por omisión, ahora',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({
    description:
      'Coste acumulado del run hasta este paso; cadena por ser numeric',
  })
  @IsOptional()
  @IsNumberString()
  accruedCostAmount?: string;
}

export class AgentStepResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  sequenceNo!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Aprobación creada si el paso quedó bloqueado esperando decisión humana',
  })
  approvalId?: string;

  @ApiProperty({
    description: 'Verdadero si el run quedó en pausa por este paso',
  })
  paused!: boolean;
}

// ---------------------------------------------------------------------------
// UC-48-10 · Pausar run por guardrail (solicitud de aprobación)
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/agent-runs/{id}/approvals` (UC-48-10). */
export class RequestApprovalDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Qué clase de aprobación se pide',
  })
  @IsUUID()
  approvalTypeConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paso que quedó bloqueado',
  })
  @IsOptional()
  @IsUUID()
  agentRunStepId?: string;

  @ApiPropertyOptional({
    description: 'Acción que el agente quiere ejecutar y está esperando',
  })
  @IsOptional()
  @IsObject()
  requestedActionJson?: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetResourceType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetRefId?: string;
}

export class ApprovalResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  agentRunId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el agent_run',
  })
  agentRunStatusConceptId!: string;

  @ApiProperty({
    description: 'Verdadero si ya había una aprobación pendiente para ese paso',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-48-11 · Decidir aprobación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/approvals/{id}/decide` (UC-48-11). */
export class DecideApprovalDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: 'Por qué se aprueba o se rechaza' })
  @IsOptional()
  @IsString()
  decisionNote?: string;
}

export class DecideApprovalResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  agentRunId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el agent_run',
  })
  agentRunStatusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Paso de resolución añadido a la traza',
  })
  resolutionStepId!: string;
}

// ---------------------------------------------------------------------------
// UC-48-12 · Persistir memoria del agente
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/agents/{id}/memory` (UC-48-12). */
export class UpsertAgentMemoryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  scopeConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'A qué se refiere la memoria; obligatorio salvo en el ámbito global',
  })
  @IsOptional()
  @IsUUID()
  scopeRefId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memoryTypeConceptId!: string;

  @ApiProperty()
  @IsString()
  contentText!: string;

  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Referencia del embedding en el índice',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  embeddingRef?: string;

  @ApiPropertyOptional({
    description: 'Importancia relativa; cadena por ser numeric',
  })
  @IsOptional()
  @IsNumberString()
  importance?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo caduca la memoria',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class AgentMemoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  agentId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description:
      'Verdadero si actualizó una memoria existente en vez de crearla',
  })
  updated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-48-13 · Ejecutar record_automation con dedupe
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/agent-runs/{id}/record-automations/{automationId}/execute` (UC-48-13). */
export class ExecuteRecordAutomationDto {
  @ApiProperty({
    description:
      'Datos de los que sale el registro, según el mapeo de la automatización',
  })
  @IsObject()
  payloadJson!: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Paso de la traza que ejecuta la escritura; si no se envía, se crea uno',
  })
  @IsOptional()
  @IsUUID()
  agentRunStepId?: string;
}

export class ExecuteRecordAutomationResponseDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Registro escrito en el destino',
  })
  targetRecordId?: string;

  @ApiProperty({ description: 'Falso si la clave de deduplicación ya existía' })
  written!: boolean;

  @ApiProperty({
    format: 'uuid',
    description: 'Paso de traza que deja constancia de la escritura',
  })
  agentRunStepId!: string;

  @ApiProperty({
    description:
      'Verdadero si el modo de escritura es borrador y no se tocó el destino',
  })
  draft!: boolean;
}

// ---------------------------------------------------------------------------
// UC-48-14 · Cerrar workflow_run
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/runs/{workflowRunId}/finalize` (UC-48-14). */
export class FinalizeWorkflowRunDto {
  @ApiPropertyOptional({
    default: false,
    description:
      'Cierra el run como fallido aunque los agent_runs hayan terminado bien',
  })
  @IsOptional()
  @IsBoolean()
  failed?: boolean;

  @ApiPropertyOptional({ description: 'Motivo del fallo' })
  @IsOptional()
  @IsString()
  errorText?: string;
}

export class FinalizeWorkflowRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description: 'Suma del coste de los agent_runs; cadena por ser numeric',
  })
  totalCostAmount!: string;

  @ApiProperty({ description: 'Agent runs cerrados por esta llamada' })
  closedAgentRuns!: number;

  @ApiProperty({
    description: 'Verdadero si el run ya estaba cerrado y no se tocó nada',
  })
  alreadyFinalized!: boolean;
}
