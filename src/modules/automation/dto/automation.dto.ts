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
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a agent type concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  agentTypeConceptId!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Identificador asociado a default model concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  defaultModelConceptId?: string;

  /**
   * Identificador asociado a system service component.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  systemServiceComponentId?: string;

  /**
   * Identificador asociado a autonomy level concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Nivel de autonomía del agente' })
  @IsUUID()
  autonomyLevelConceptId!: string;

  /**
   * Identificador asociado a acts as user.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Identidad de servicio con la que el agente actúa; obligatoria si no sólo sugiere',
  })
  @IsOptional()
  @IsUUID()
  actsAsUserId?: string;

  /**
   * Valor de prompt template mantenido por la instancia.
   */
  @ApiProperty({ description: 'Plantilla de prompt de la versión 1' })
  @IsString()
  promptTemplate!: string;

  /**
   * Identificador asociado a model concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  modelConceptId?: string;

  /**
   * Valor de model params json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  modelParamsJson?: Record<string, unknown>;

  /**
   * Valor de input schema json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputSchemaJson?: Record<string, unknown>;

  /**
   * Valor de output schema json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  outputSchemaJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para agent response.
 */
export class AgentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de current version mantenido por la instancia.
   */
  @ApiProperty()
  currentVersion!: number;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Identificador asociado a agent version.
   */
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
  /**
   * Identificador asociado a agent version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Versión en borrador que se publica; si no se envía, se crea una nueva',
  })
  @IsOptional()
  @IsUUID()
  agentVersionId?: string;

  /**
   * Valor de prompt template mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Plantilla de la versión nueva' })
  @IsOptional()
  @IsString()
  promptTemplate?: string;

  /**
   * Identificador asociado a model concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  modelConceptId?: string;

  /**
   * Valor de model params json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  modelParamsJson?: Record<string, unknown>;

  /**
   * Valor de input schema json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputSchemaJson?: Record<string, unknown>;

  /**
   * Valor de output schema json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  outputSchemaJson?: Record<string, unknown>;

  /**
   * Valor de changelog mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Qué cambia respecto a la versión anterior',
  })
  @IsOptional()
  @IsString()
  changelog?: string;
}

/**
 * Define el contrato validado para agent version response.
 */
export class AgentVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a agent.
   */
  @ApiProperty({ format: 'uuid' })
  agentId!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty()
  version!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de current version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión vigente del agente tras publicar' })
  currentVersion!: number;
}

// ---------------------------------------------------------------------------
// UC-48-03 · Registrar herramienta
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/tools` (UC-48-03). */
export class RegisterToolDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a tool type concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  toolTypeConceptId!: string;

  /**
   * Valor de target resource mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Recurso sobre el que opera la herramienta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetResource?: string;

  /**
   * Valor de input schema json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputSchemaJson?: Record<string, unknown>;

  /**
   * Valor de output schema json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  outputSchemaJson?: Record<string, unknown>;

  /**
   * Identificador asociado a integration endpoint.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Endpoint de integración; obligatorio si la herramienta es una llamada HTTP',
  })
  @IsOptional()
  @IsUUID()
  integrationEndpointId?: string;

  /**
   * Valor de is write mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si la herramienta escribe',
  })
  @IsOptional()
  @IsBoolean()
  isWrite?: boolean;

  /**
   * Valor de requires approval mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si su uso exige aprobación humana',
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}

/**
 * Define el contrato validado para tool response.
 */
export class ToolResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de is write mantenido por la instancia.
   */
  @ApiProperty()
  isWrite!: boolean;

  /**
   * Valor de requires approval mantenido por la instancia.
   */
  @ApiProperty()
  requiresApproval!: boolean;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-48-04 · Enlazar herramientas a una versión
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para tool binding.
 */
export class ToolBindingDto {
  /**
   * Identificador asociado a agent tool.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  agentToolId!: string;

  /**
   * Valor de scope json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Recorte del alcance de la herramienta para esta versión',
  })
  @IsOptional()
  @IsObject()
  scopeJson?: Record<string, unknown>;

  /**
   * Valor de max calls per run mantenido por la instancia.
   */
  @ApiPropertyOptional({
    minimum: 1,
    description: 'Tope de llamadas por ejecución',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCallsPerRun?: number;

  /**
   * Identificador asociado a permission effect concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Si el enlace permite o deniega la herramienta',
  })
  @IsUUID()
  permissionEffectConceptId!: string;
}

/** Cuerpo de `POST /automation/agents/{id}/versions/{vid}/tool-bindings` (UC-48-04). */
export class BindToolsDto {
  /**
   * Valor de bindings mantenido por la instancia.
   */
  @ApiProperty({ type: [ToolBindingDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ToolBindingDto)
  bindings!: ToolBindingDto[];
}

/**
 * Define el contrato validado para bind tools response.
 */
export class BindToolsResponseDto {
  /**
   * Identificador asociado a agent version.
   */
  @ApiProperty({ format: 'uuid' })
  agentVersionId!: string;

  /**
   * Valor de binding ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  bindingIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-48-05 · Guardrails
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/guardrails` (UC-48-05). */
export class DefineGuardrailDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a policy type concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  policyTypeConceptId!: string;

  /**
   * Valor de rule json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Regla declarativa de la política' })
  @IsOptional()
  @IsObject()
  ruleJson?: Record<string, unknown>;

  /**
   * Identificador asociado a pii phi handling concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cómo se trata el dato de paciente',
  })
  @IsOptional()
  @IsUUID()
  piiPhiHandlingConceptId?: string;

  /**
   * Valor de max cost amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tope de coste; cadena por ser numeric' })
  @IsOptional()
  @IsNumberString()
  maxCostAmount?: string;

  /**
   * Identificador asociado a enforcement concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Bloquea, avisa o sólo registra',
  })
  @IsUUID()
  enforcementConceptId!: string;
}

/**
 * Define el contrato validado para guardrail response.
 */
export class GuardrailResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @ApiProperty()
  isActive!: boolean;
}

/** Cuerpo de `POST /automation/agents/{id}/guardrails` (UC-48-05). */
export class AttachGuardrailDto {
  /**
   * Identificador asociado a guardrail policy.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  guardrailPolicyId!: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

/**
 * Define el contrato validado para attach guardrail response.
 */
export class AttachGuardrailResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a agent.
   */
  @ApiProperty({ format: 'uuid' })
  agentId!: string;

  /**
   * Identificador asociado a guardrail policy.
   */
  @ApiProperty({ format: 'uuid' })
  guardrailPolicyId!: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @ApiProperty()
  isEnabled!: boolean;
}

// ---------------------------------------------------------------------------
// UC-48-06 · Definir workflow y sus pasos
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para workflow step.
 */
export class WorkflowStepDto {
  /**
   * Valor de step code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  stepCode!: string;

  /**
   * Identificador asociado a step type concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  stepTypeConceptId!: string;

  /**
   * Identificador asociado a agent.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  /**
   * Identificador asociado a agent tool.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  agentToolId?: string;

  /**
   * Valor de on success step code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Código del paso siguiente si éste sale bien',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  onSuccessStepCode?: string;

  /**
   * Valor de on failure step code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Código del paso siguiente si éste falla',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  onFailureStepCode?: string;

  /**
   * Valor de config json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** Cuerpo de `POST /automation/workflows` (UC-48-06). */
export class DefineWorkflowDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Identificador asociado a orchestration type concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  orchestrationTypeConceptId!: string;

  /**
   * Valor de definition json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  definitionJson?: Record<string, unknown>;

  /**
   * Valor de steps mantenido por la instancia.
   */
  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps!: WorkflowStepDto[];
}

/**
 * Define el contrato validado para workflow response.
 */
export class WorkflowResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Valor de step ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  stepIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-48-07 · Configurar disparador
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/triggers` (UC-48-07). */
export class ConfigureTriggerDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a trigger type concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  triggerTypeConceptId!: string;

  /**
   * Valor de event type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description:
      'Tipo de evento que suscribe; obligatorio para disparadores por evento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventType?: string;

  /**
   * Valor de target resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetResourceType?: string;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;

  /**
   * Valor de schedule cron mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description:
      'Expresión cron de 5 campos; obligatoria para disparadores por calendario',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  scheduleCron?: string;

  /**
   * Identificador asociado a workflow.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workflowId!: string;

  /**
   * Identificador asociado a campaign schedule.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Calendario de campaña, si el cron viene de marketing',
  })
  @IsOptional()
  @IsUUID()
  campaignScheduleId?: string;
}

/**
 * Define el contrato validado para trigger response.
 */
export class TriggerResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @ApiProperty()
  isEnabled!: boolean;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-48-08 · Disparar workflow_run
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /automation/workflows/{id}/runs` (UC-48-08). */
export class StartWorkflowRunDto {
  /**
   * Identificador asociado a trigger.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Disparador que originó la ejecución',
  })
  @IsOptional()
  @IsUUID()
  triggerId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a trigger source concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'De dónde viene la ejecución: evento, calendario o mano',
  })
  @IsUUID()
  triggerSourceConceptId!: string;

  /**
   * Valor de input json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputJson?: Record<string, unknown>;

  /**
   * Valor de context ref type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Tipo del expediente sobre el que corre',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contextRefType?: string;

  /**
   * Identificador asociado a context ref.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Expediente sobre el que corre',
  })
  @IsOptional()
  @IsUUID()
  contextRefId?: string;
}

/**
 * Define el contrato validado para workflow run response.
 */
export class WorkflowRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de run number mantenido por la instancia.
   */
  @ApiProperty()
  runNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a agent.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  agentId!: string;

  /**
   * Identificador asociado a agent version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Versión concreta; por omisión, la publicada vigente del agente',
  })
  @IsOptional()
  @IsUUID()
  agentVersionId?: string;

  /**
   * Identificador asociado a task type concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  taskTypeConceptId!: string;

  /**
   * Valor de input json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para agent run response.
 */
export class AgentRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a agent version.
   */
  @ApiProperty({ format: 'uuid' })
  agentVersionId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /automation/agent-runs/{id}/steps` (UC-48-09). */
export class RecordAgentStepDto {
  /**
   * Identificador asociado a step kind concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  stepKindConceptId!: string;

  /**
   * Identificador asociado a agent tool.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Herramienta invocada, si el paso la usa',
  })
  @IsOptional()
  @IsUUID()
  agentToolId?: string;

  /**
   * Valor de thought text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Razonamiento del agente en este paso' })
  @IsOptional()
  @IsString()
  thoughtText?: string;

  /**
   * Valor de tool input json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  toolInputJson?: Record<string, unknown>;

  /**
   * Valor de tool output json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  toolOutputJson?: Record<string, unknown>;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  errorText?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió; por omisión, ahora',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  /**
   * Valor de accrued cost amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Coste acumulado del run hasta este paso; cadena por ser numeric',
  })
  @IsOptional()
  @IsNumberString()
  accruedCostAmount?: string;
}

/**
 * Define el contrato validado para agent step response.
 */
export class AgentStepResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de sequence no mantenido por la instancia.
   */
  @ApiProperty()
  sequenceNo!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a approval.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Aprobación creada si el paso quedó bloqueado esperando decisión humana',
  })
  approvalId?: string;

  /**
   * Valor de paused mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a approval type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Qué clase de aprobación se pide',
  })
  @IsUUID()
  approvalTypeConceptId!: string;

  /**
   * Identificador asociado a agent run step.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paso que quedó bloqueado',
  })
  @IsOptional()
  @IsUUID()
  agentRunStepId?: string;

  /**
   * Valor de requested action json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Acción que el agente quiere ejecutar y está esperando',
  })
  @IsOptional()
  @IsObject()
  requestedActionJson?: Record<string, unknown>;

  /**
   * Valor de target resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetResourceType?: string;

  /**
   * Identificador asociado a target ref.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetRefId?: string;
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
   * Identificador asociado a agent run.
   */
  @ApiProperty({ format: 'uuid' })
  agentRunId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a agent run status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el agent_run',
  })
  agentRunStatusConceptId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
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
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  /**
   * Valor de decision note mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Por qué se aprueba o se rechaza' })
  @IsOptional()
  @IsString()
  decisionNote?: string;
}

/**
 * Define el contrato validado para decide approval response.
 */
export class DecideApprovalResponseDto {
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
   * Identificador asociado a agent run.
   */
  @ApiProperty({ format: 'uuid' })
  agentRunId!: string;

  /**
   * Identificador asociado a agent run status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el agent_run',
  })
  agentRunStatusConceptId!: string;

  /**
   * Identificador asociado a resolution step.
   */
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
  /**
   * Identificador asociado a scope concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  scopeConceptId!: string;

  /**
   * Identificador asociado a scope ref.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'A qué se refiere la memoria; obligatorio salvo en el ámbito global',
  })
  @IsOptional()
  @IsUUID()
  scopeRefId?: string;

  /**
   * Identificador asociado a memory type concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memoryTypeConceptId!: string;

  /**
   * Valor de content text mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  contentText!: string;

  /**
   * Valor de embedding ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Referencia del embedding en el índice',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  embeddingRef?: string;

  /**
   * Valor de importance mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Importancia relativa; cadena por ser numeric',
  })
  @IsOptional()
  @IsNumberString()
  importance?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo caduca la memoria',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

/**
 * Define el contrato validado para agent memory response.
 */
export class AgentMemoryResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a agent.
   */
  @ApiProperty({ format: 'uuid' })
  agentId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de updated mantenido por la instancia.
   */
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
  /**
   * Valor de payload json mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Datos de los que sale el registro, según el mapeo de la automatización',
  })
  @IsObject()
  payloadJson!: Record<string, unknown>;

  /**
   * Identificador asociado a agent run step.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Paso de la traza que ejecuta la escritura; si no se envía, se crea uno',
  })
  @IsOptional()
  @IsUUID()
  agentRunStepId?: string;
}

/**
 * Define el contrato validado para execute record automation response.
 */
export class ExecuteRecordAutomationResponseDto {
  /**
   * Identificador asociado a target record.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Registro escrito en el destino',
  })
  targetRecordId?: string;

  /**
   * Valor de written mantenido por la instancia.
   */
  @ApiProperty({ description: 'Falso si la clave de deduplicación ya existía' })
  written!: boolean;

  /**
   * Identificador asociado a agent run step.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Paso de traza que deja constancia de la escritura',
  })
  agentRunStepId!: string;

  /**
   * Valor de draft mantenido por la instancia.
   */
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
  /**
   * Valor de failed mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description:
      'Cierra el run como fallido aunque los agent_runs hayan terminado bien',
  })
  @IsOptional()
  @IsBoolean()
  failed?: boolean;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo del fallo' })
  @IsOptional()
  @IsString()
  errorText?: string;
}

/**
 * Define el contrato validado para finalize workflow run response.
 */
export class FinalizeWorkflowRunResponseDto {
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
   * Valor de total cost amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Suma del coste de los agent_runs; cadena por ser numeric',
  })
  totalCostAmount!: string;

  /**
   * Valor de closed agent runs mantenido por la instancia.
   */
  @ApiProperty({ description: 'Agent runs cerrados por esta llamada' })
  closedAgentRuns!: number;

  /**
   * Valor de already finalized mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si el run ya estaba cerrado y no se tocó nada',
  })
  alreadyFinalized!: boolean;
}
