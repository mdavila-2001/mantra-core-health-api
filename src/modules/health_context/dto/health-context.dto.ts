import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Qué disparó la corrida de recolección. */
export type CollectionTrigger = 'SCHEDULED' | 'MANUAL';
const COLLECTION_TRIGGERS = ['SCHEDULED', 'MANUAL'] as const;

/** Cómo se acepta la observación recogida. */
export type ObservationStatus = 'ACCEPTED' | 'REJECTED';
const OBSERVATION_STATUSES = ['ACCEPTED', 'REJECTED'] as const;

/** Desenlace de la revisión de calidad. */
export type ReviewOutcome = 'APPROVED' | 'REJECTED';
const REVIEW_OUTCOMES = ['APPROVED', 'REJECTED'] as const;

/** Cómo termina la corrida de recolección. */
export type RunOutcome = 'SUCCEEDED' | 'PARTIAL' | 'FAILED';
const RUN_OUTCOMES = ['SUCCEEDED', 'PARTIAL', 'FAILED'] as const;

/** Por qué se retira la versión vigente. */
export type SupersedeMode = 'SUPERSEDED' | 'EXPIRED';
const SUPERSEDE_MODES = ['SUPERSEDED', 'EXPIRED'] as const;

// ---------------------------------------------------------------------------
// UC-44-01 · Agente recolector
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/agents` (UC-44-01). */
export class CreateAgentDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único del agente', maxLength: 100 })
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
  @ApiProperty({
    format: 'uuid',
    description: 'Naturaleza del agente (catálogo abierto)',
  })
  @IsUUID()
  agentTypeConceptId!: string;

  /**
   * Identificador asociado a provider.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Proveedor externo que lo opera',
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  /**
   * Valor de implementation ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia a la implementación',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  implementationRef?: string;

  /**
   * Identificador asociado a owner tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerTenantId?: string;
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
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-44-02 · Fuente de contexto
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/sources` (UC-44-02). */
export class CreateSourceDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único de la fuente', maxLength: 100 })
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
   * Identificador asociado a source type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Naturaleza de la fuente (catálogo abierto)',
  })
  @IsUUID()
  sourceTypeConceptId!: string;

  /**
   * Identificador asociado a trust tier concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Nivel de confianza; gobierna qué observaciones se aceptan',
  })
  @IsUUID()
  trustTierConceptId!: string;

  /**
   * Valor de owner name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Quién publica la fuente',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerName?: string;

  /**
   * Valor de canonical url mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'URL canónica de la fuente' })
  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  /**
   * Identificador asociado a country concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Valor de license text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Licencia bajo la que se puede usar el dato',
  })
  @IsOptional()
  @IsString()
  licenseText?: string;
}

/**
 * Define el contrato validado para source response.
 */
export class SourceResponseDto {
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
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-44-03 · Programación de recolección
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/schedules` (UC-44-03). */
@ApiSchema({ name: 'HealthContextCreateScheduleDto' })
export class CreateScheduleDto {
  /**
   * Identificador asociado a country concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  countryConceptId!: string;

  /**
   * Identificador asociado a agent.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Agente que ejecuta la recolección',
  })
  @IsUUID()
  agentId!: string;

  /**
   * Valor de schedule expression mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Expresión cron de cinco campos',
    example: '0 3 * * *',
  })
  @IsString()
  @MaxLength(200)
  scheduleExpression!: string;

  /**
   * Identificador asociado a timezone concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  timezoneConceptId?: string;

  /**
   * Valor de lookback days mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Días hacia atrás que revisa cada corrida',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lookbackDays?: number;

  /**
   * Valor de freshness ttl seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Segundos que el contexto se considera fresco',
    minimum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  freshnessTtlSeconds?: number;

  /**
   * Valor de next run at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Primera ejecución prevista',
  })
  @IsOptional()
  @IsISO8601()
  nextRunAt?: string;
}

/**
 * Define el contrato validado para schedule response.
 */
export class ScheduleResponseDto {
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
   * Valor de next run at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  nextRunAt?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /internal/health-context/schedules/run-due`. */
export class RunDueSchedulesDto {
  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tamaño máximo del lote de programaciones a evaluar',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/** Resultado de evaluar una programación vencida del lote. */
export class DueScheduleRunResultDto {
  /**
   * Identificador asociado a schedule.
   */
  @ApiProperty({ format: 'uuid' })
  scheduleId!: string;

  /**
   * Identificador asociado a run.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Corrida encolada, si la programación pudo dispararse',
  })
  runId?: string;

  /**
   * Valor de next run at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  nextRunAt?: string;

  /**
   * Valor de skipped reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Motivo si no se pudo encolar la corrida',
  })
  skippedReason?: string;
}

/** Respuesta de `POST /internal/health-context/schedules/run-due`. */
export class RunDueSchedulesResponseDto {
  /**
   * Valor de claimed mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Programaciones vencidas reclamadas en este lote',
  })
  claimed!: number;

  /**
   * Valor de queued mantenido por la instancia.
   */
  @ApiProperty({ description: 'Corridas efectivamente encoladas' })
  queued!: number;

  /**
   * Valor de results mantenido por la instancia.
   */
  @ApiProperty({ type: [DueScheduleRunResultDto] })
  results!: DueScheduleRunResultDto[];
}

// ---------------------------------------------------------------------------
// UC-44-04 · Contexto de país
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/contexts` (UC-44-04). */
export class CreateContextDto {
  /**
   * Identificador asociado a country concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  countryConceptId!: string;

  /**
   * Identificador asociado a context domain concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Dominio del contexto (catálogo abierto)',
  })
  @IsUUID()
  contextDomainConceptId!: string;

  /**
   * Valor de context key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave del contexto dentro del dominio',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  contextKey!: string;

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
}

/**
 * Define el contrato validado para context response.
 */
export class ContextResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de context key mantenido por la instancia.
   */
  @ApiProperty()
  contextKey!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'El contexto nace en borrador, sin versión vigente',
  })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-44-05 · Corrida de recolección
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/collection-runs` (UC-44-05). */
export class StartCollectionRunDto {
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave de idempotencia de la corrida',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  idempotencyKey!: string;

  /**
   * Valor de trigger mantenido por la instancia.
   */
  @ApiProperty({ enum: COLLECTION_TRIGGERS })
  @IsIn(COLLECTION_TRIGGERS)
  trigger!: CollectionTrigger;

  /**
   * Identificador asociado a schedule.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Programación que la dispara',
  })
  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  /**
   * Identificador asociado a agent.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Agente; por defecto, el de la programación',
  })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  /**
   * Identificador asociado a country concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'País; por defecto, el de la programación',
  })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Valor de next run at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Próxima ejecución recalculada',
  })
  @IsOptional()
  @IsISO8601()
  nextRunAt?: string;
}

/**
 * Define el contrato validado para collection run response.
 */
export class CollectionRunResponseDto {
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
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si la clave ya se había usado y se devuelve la corrida previa',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-44-06 · Observación de fuente
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/collection-runs/{id}/observations` (UC-44-06). */
export class RecordObservationDto {
  /**
   * Identificador asociado a source.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceId!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hash del contenido recogido; permite deduplicar',
  })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ enum: OBSERVATION_STATUSES })
  @IsIn(OBSERVATION_STATUSES)
  status!: ObservationStatus;

  /**
   * Valor de source locator mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dónde se encontró el dato' })
  @IsOptional()
  @IsString()
  sourceLocator?: string;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo lo publicó la fuente',
  })
  @IsOptional()
  @IsISO8601()
  publishedAt?: string;

  /**
   * Valor de retrieved at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo se recogió; por defecto, ahora',
  })
  @IsOptional()
  @IsISO8601()
  retrievedAt?: string;

  /**
   * Valor de media type mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mediaType?: string;

  /**
   * Identificador asociado a raw payload file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo con el payload crudo',
  })
  @IsOptional()
  @IsUUID()
  rawPayloadFileId?: string;

  /**
   * Valor de extracted payload json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Datos extraídos. Sólo agregado de país: nunca datos de paciente.',
  })
  @IsOptional()
  @IsObject()
  extractedPayloadJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para observation response.
 */
export class ObservationResponseDto {
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
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si ya se había recogido el mismo contenido en la corrida',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-44-07 · Versión con hechos y evidencia
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para fact evidence.
 */
export class FactEvidenceDto {
  /**
   * Identificador asociado a source observation.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Observación que respalda el hecho',
  })
  @IsUUID()
  sourceObservationId!: string;

  /**
   * Valor de evidence locator json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Dónde dentro de la observación está la evidencia',
  })
  @IsOptional()
  @IsObject()
  evidenceLocatorJson?: Record<string, unknown>;

  /**
   * Valor de relevance score mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Relevancia, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  relevanceScore?: string;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceHash?: string;
}

/**
 * Define el contrato validado para context fact.
 */
export class ContextFactDto {
  /**
   * Valor de fact key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave del hecho dentro de la versión',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  factKey!: string;

  /**
   * Valor de value type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo técnico del valor', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  valueType!: string;

  /**
   * Valor de value json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor del hecho' })
  @IsObject()
  valueJson!: Record<string, unknown>;

  /**
   * Identificador asociado a metric concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  metricConceptId?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  periodStart?: string;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  periodEnd?: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Confianza, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  confidenceScore?: string;

  /**
   * Valor de evidence mantenido por la instancia.
   */
  @ApiProperty({
    type: [FactEvidenceDto],
    description: 'Un hecho sin evidencia retenida no se acepta',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FactEvidenceDto)
  evidence!: FactEvidenceDto[];
}

/** Cuerpo de `POST /health-context/contexts/{id}/versions` (UC-44-07). */
export class DraftContextVersionDto {
  /**
   * Identificador asociado a collection run.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Corrida de la que salen las observaciones',
  })
  @IsUUID()
  collectionRunId!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  schemaVersion?: string;

  /**
   * Valor de summary mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  /**
   * Valor de context payload json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Contenido del contexto en esta versión' })
  @IsObject()
  contextPayloadJson!: Record<string, unknown>;

  /**
   * Valor de observed at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'A qué momento corresponde lo observado',
  })
  @IsOptional()
  @IsISO8601()
  observedAt?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo caduca la vigencia',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Confianza global, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  confidenceScore?: string;

  /**
   * Valor de facts mantenido por la instancia.
   */
  @ApiProperty({
    type: [ContextFactDto],
    description: 'Hechos con su evidencia',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ContextFactDto)
  facts!: ContextFactDto[];
}

/**
 * Define el contrato validado para context version response.
 */
export class ContextVersionResponseDto {
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
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty()
  contentHash!: string;

  /**
   * Valor de fact ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  factIds!: string[];

  /**
   * Valor de evidence count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Enlaces hecho → observación creados' })
  evidenceCount!: number;
}

// ---------------------------------------------------------------------------
// UC-44-08 · Revisión de calidad
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/versions/{id}/quality-reviews` (UC-44-08). */
export class RecordQualityReviewDto {
  /**
   * Identificador asociado a review type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de revisión (catálogo abierto)',
  })
  @IsUUID()
  reviewTypeConceptId!: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({ enum: REVIEW_OUTCOMES })
  @IsIn(REVIEW_OUTCOMES)
  outcome!: ReviewOutcome;

  /**
   * Identificador asociado a reviewer agent.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Agente revisor, si la revisión es automática',
  })
  @IsOptional()
  @IsUUID()
  reviewerAgentId?: string;

  /**
   * Valor de issues json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Problemas encontrados' })
  @IsOptional()
  @IsObject()
  issuesJson?: Record<string, unknown>;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Define el contrato validado para quality review response.
 */
export class QualityReviewResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a context version.
   */
  @ApiProperty({ format: 'uuid' })
  contextVersionId!: string;

  /**
   * Identificador asociado a version status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda la versión',
  })
  versionStatusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-44-09 · Publicación
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para publish version response.
 */
export class PublishVersionResponseDto {
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
   * Identificador asociado a country health context.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Contexto que pasa a apuntar a esta versión',
  })
  countryHealthContextId!: string;

  /**
   * Identificador asociado a superseded version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión que queda superseded',
  })
  supersededVersionId?: string;
}

// ---------------------------------------------------------------------------
// UC-44-10 · Cierre de la corrida
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/collection-runs/{id}/finish` (UC-44-10). */
export class FinishCollectionRunDto {
  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({ enum: RUN_OUTCOMES })
  @IsIn(RUN_OUTCOMES)
  outcome!: RunOutcome;

  /**
   * Valor de continuation cursor json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cursor para continuar donde se quedó' })
  @IsOptional()
  @IsObject()
  continuationCursorJson?: Record<string, unknown>;

  /**
   * Valor de error summary mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Qué salió mal; obligatorio si la corrida falla',
  })
  @IsOptional()
  @IsString()
  errorSummary?: string;
}

/**
 * Define el contrato validado para finish run response.
 */
export class FinishRunResponseDto {
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
   * Valor de observations read mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Observaciones leídas, conciliadas contra la tabla',
  })
  observationsRead!: string;

  /**
   * Valor de observations accepted mantenido por la instancia.
   */
  @ApiProperty()
  observationsAccepted!: string;

  /**
   * Valor de observations rejected mantenido por la instancia.
   */
  @ApiProperty()
  observationsRejected!: string;

  /**
   * Valor de source count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Fuentes distintas que aportaron observaciones' })
  sourceCount!: number;
}

// ---------------------------------------------------------------------------
// UC-44-11 · Retiro de la versión vigente
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/versions/{id}/supersede` (UC-44-11). */
export class SupersedeVersionDto {
  /**
   * Valor de mode mantenido por la instancia.
   */
  @ApiProperty({
    enum: SUPERSEDE_MODES,
    description: '`EXPIRED` retira sin reemplazo y deja el contexto obsoleto',
  })
  @IsIn(SUPERSEDE_MODES)
  mode!: SupersedeMode;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se retira' })
  @IsString()
  reason!: string;

  /**
   * Identificador asociado a replacement version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión que la sustituye; obligatoria en modo SUPERSEDED',
  })
  @IsOptional()
  @IsUUID()
  replacementVersionId?: string;
}

/**
 * Define el contrato validado para supersede version response.
 */
export class SupersedeVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Versión retirada' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a current version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión que queda vigente',
  })
  currentVersionId?: string;

  /**
   * Identificador asociado a context status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el contexto',
  })
  contextStatusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-44-12 · Resolución para consumo
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para resolved fact.
 */
export class ResolvedFactDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de fact key mantenido por la instancia.
   */
  @ApiProperty()
  factKey!: string;

  /**
   * Valor de value type mantenido por la instancia.
   */
  @ApiProperty()
  valueType!: string;

  /**
   * Valor de value json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor del hecho' })
  valueJson!: unknown;

  /**
   * Identificador asociado a metric concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  metricConceptId?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  unitConceptId?: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @ApiPropertyOptional()
  confidenceScore?: string;

  /**
   * Valor de evidence observation ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Observaciones que respaldan el hecho',
  })
  evidenceObservationIds!: string[];
}

/**
 * Define el contrato validado para resolved context response.
 */
export class ResolvedContextResponseDto {
  /**
   * Identificador asociado a context.
   */
  @ApiProperty({ format: 'uuid' })
  contextId!: string;

  /**
   * Identificador asociado a version.
   */
  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Valor de context payload json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Contenido de la versión vigente' })
  contextPayloadJson!: unknown;

  /**
   * Valor de observed at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  observedAt?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  expiresAt?: string;

  /**
   * Valor de stale mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la versión vigente ya caducó' })
  stale!: boolean;

  /**
   * Valor de facts mantenido por la instancia.
   */
  @ApiProperty({ type: [ResolvedFactDto] })
  facts!: ResolvedFactDto[];
}
