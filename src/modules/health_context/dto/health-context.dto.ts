import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Código único del agente', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Naturaleza del agente (catálogo abierto)',
  })
  @IsUUID()
  agentTypeConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Proveedor externo que lo opera',
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({
    description: 'Referencia a la implementación',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  implementationRef?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerTenantId?: string;
}

export class AgentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-44-02 · Fuente de contexto
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/sources` (UC-44-02). */
export class CreateSourceDto {
  @ApiProperty({ description: 'Código único de la fuente', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Naturaleza de la fuente (catálogo abierto)',
  })
  @IsUUID()
  sourceTypeConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Nivel de confianza; gobierna qué observaciones se aceptan',
  })
  @IsUUID()
  trustTierConceptId!: string;

  @ApiPropertyOptional({
    description: 'Quién publica la fuente',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerName?: string;

  @ApiPropertyOptional({ description: 'URL canónica de la fuente' })
  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  @ApiPropertyOptional({
    description: 'Licencia bajo la que se puede usar el dato',
  })
  @IsOptional()
  @IsString()
  licenseText?: string;
}

export class SourceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-44-03 · Programación de recolección
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/schedules` (UC-44-03). */
export class CreateScheduleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  countryConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Agente que ejecuta la recolección',
  })
  @IsUUID()
  agentId!: string;

  @ApiProperty({
    description: 'Expresión cron de cinco campos',
    example: '0 3 * * *',
  })
  @IsString()
  @MaxLength(200)
  scheduleExpression!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  timezoneConceptId?: string;

  @ApiPropertyOptional({
    description: 'Días hacia atrás que revisa cada corrida',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lookbackDays?: number;

  @ApiPropertyOptional({
    description: 'Segundos que el contexto se considera fresco',
    minimum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  freshnessTtlSeconds?: number;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Primera ejecución prevista',
  })
  @IsOptional()
  @IsISO8601()
  nextRunAt?: string;
}

export class ScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  agentId!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  nextRunAt?: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-44-04 · Contexto de país
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/contexts` (UC-44-04). */
export class CreateContextDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  countryConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Dominio del contexto (catálogo abierto)',
  })
  @IsUUID()
  contextDomainConceptId!: string;

  @ApiProperty({
    description: 'Clave del contexto dentro del dominio',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  contextKey!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class ContextResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  contextKey!: string;

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
  @ApiProperty({
    description: 'Clave de idempotencia de la corrida',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  idempotencyKey!: string;

  @ApiProperty({ enum: COLLECTION_TRIGGERS })
  @IsIn(COLLECTION_TRIGGERS)
  trigger!: CollectionTrigger;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Programación que la dispara',
  })
  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Agente; por defecto, el de la programación',
  })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'País; por defecto, el de la programación',
  })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Próxima ejecución recalculada',
  })
  @IsOptional()
  @IsISO8601()
  nextRunAt?: string;
}

export class CollectionRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceId!: string;

  @ApiProperty({
    description: 'Hash del contenido recogido; permite deduplicar',
  })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  @ApiProperty({ enum: OBSERVATION_STATUSES })
  @IsIn(OBSERVATION_STATUSES)
  status!: ObservationStatus;

  @ApiPropertyOptional({ description: 'Dónde se encontró el dato' })
  @IsOptional()
  @IsString()
  sourceLocator?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo lo publicó la fuente',
  })
  @IsOptional()
  @IsISO8601()
  publishedAt?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo se recogió; por defecto, ahora',
  })
  @IsOptional()
  @IsISO8601()
  retrievedAt?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mediaType?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo con el payload crudo',
  })
  @IsOptional()
  @IsUUID()
  rawPayloadFileId?: string;

  @ApiPropertyOptional({
    description:
      'Datos extraídos. Sólo agregado de país: nunca datos de paciente.',
  })
  @IsOptional()
  @IsObject()
  extractedPayloadJson?: Record<string, unknown>;
}

export class ObservationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description:
      'true si ya se había recogido el mismo contenido en la corrida',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-44-07 · Versión con hechos y evidencia
// ---------------------------------------------------------------------------

export class FactEvidenceDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Observación que respalda el hecho',
  })
  @IsUUID()
  sourceObservationId!: string;

  @ApiPropertyOptional({
    description: 'Dónde dentro de la observación está la evidencia',
  })
  @IsOptional()
  @IsObject()
  evidenceLocatorJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Relevancia, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  relevanceScore?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceHash?: string;
}

export class ContextFactDto {
  @ApiProperty({
    description: 'Clave del hecho dentro de la versión',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  factKey!: string;

  @ApiProperty({ description: 'Tipo técnico del valor', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  valueType!: string;

  @ApiProperty({ description: 'Valor del hecho' })
  @IsObject()
  valueJson!: Record<string, unknown>;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  metricConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  periodStart?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  periodEnd?: string;

  @ApiPropertyOptional({ description: 'Confianza, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  confidenceScore?: string;

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
  @ApiProperty({
    format: 'uuid',
    description: 'Corrida de la que salen las observaciones',
  })
  @IsUUID()
  collectionRunId!: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  schemaVersion?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @ApiProperty({ description: 'Contenido del contexto en esta versión' })
  @IsObject()
  contextPayloadJson!: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'A qué momento corresponde lo observado',
  })
  @IsOptional()
  @IsISO8601()
  observedAt?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo caduca la vigencia',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Confianza global, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  confidenceScore?: string;

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

export class ContextVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  contentHash!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  factIds!: string[];

  @ApiProperty({ description: 'Enlaces hecho → observación creados' })
  evidenceCount!: number;
}

// ---------------------------------------------------------------------------
// UC-44-08 · Revisión de calidad
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/versions/{id}/quality-reviews` (UC-44-08). */
export class RecordQualityReviewDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de revisión (catálogo abierto)',
  })
  @IsUUID()
  reviewTypeConceptId!: string;

  @ApiProperty({ enum: REVIEW_OUTCOMES })
  @IsIn(REVIEW_OUTCOMES)
  outcome!: ReviewOutcome;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Agente revisor, si la revisión es automática',
  })
  @IsOptional()
  @IsUUID()
  reviewerAgentId?: string;

  @ApiPropertyOptional({ description: 'Problemas encontrados' })
  @IsOptional()
  @IsObject()
  issuesJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QualityReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  contextVersionId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda la versión',
  })
  versionStatusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-44-09 · Publicación
// ---------------------------------------------------------------------------

export class PublishVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Contexto que pasa a apuntar a esta versión',
  })
  countryHealthContextId!: string;

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
  @ApiProperty({ enum: RUN_OUTCOMES })
  @IsIn(RUN_OUTCOMES)
  outcome!: RunOutcome;

  @ApiPropertyOptional({ description: 'Cursor para continuar donde se quedó' })
  @IsOptional()
  @IsObject()
  continuationCursorJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Qué salió mal; obligatorio si la corrida falla',
  })
  @IsOptional()
  @IsString()
  errorSummary?: string;
}

export class FinishRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description: 'Observaciones leídas, conciliadas contra la tabla',
  })
  observationsRead!: string;

  @ApiProperty()
  observationsAccepted!: string;

  @ApiProperty()
  observationsRejected!: string;

  @ApiProperty({ description: 'Fuentes distintas que aportaron observaciones' })
  sourceCount!: number;
}

// ---------------------------------------------------------------------------
// UC-44-11 · Retiro de la versión vigente
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-context/versions/{id}/supersede` (UC-44-11). */
export class SupersedeVersionDto {
  @ApiProperty({
    enum: SUPERSEDE_MODES,
    description: '`EXPIRED` retira sin reemplazo y deja el contexto obsoleto',
  })
  @IsIn(SUPERSEDE_MODES)
  mode!: SupersedeMode;

  @ApiProperty({ description: 'Por qué se retira' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión que la sustituye; obligatoria en modo SUPERSEDED',
  })
  @IsOptional()
  @IsUUID()
  replacementVersionId?: string;
}

export class SupersedeVersionResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Versión retirada' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión que queda vigente',
  })
  currentVersionId?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el contexto',
  })
  contextStatusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-44-12 · Resolución para consumo
// ---------------------------------------------------------------------------

export class ResolvedFactDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  factKey!: string;

  @ApiProperty()
  valueType!: string;

  @ApiProperty({ description: 'Valor del hecho' })
  valueJson!: unknown;

  @ApiPropertyOptional({ format: 'uuid' })
  metricConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  unitConceptId?: string;

  @ApiPropertyOptional()
  confidenceScore?: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Observaciones que respaldan el hecho',
  })
  evidenceObservationIds!: string[];
}

export class ResolvedContextResponseDto {
  @ApiProperty({ format: 'uuid' })
  contextId!: string;

  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ description: 'Contenido de la versión vigente' })
  contextPayloadJson!: unknown;

  @ApiPropertyOptional({ format: 'date-time' })
  observedAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  expiresAt?: string;

  @ApiProperty({ description: 'true si la versión vigente ya caducó' })
  stale!: boolean;

  @ApiProperty({ type: [ResolvedFactDto] })
  facts!: ResolvedFactDto[];
}
