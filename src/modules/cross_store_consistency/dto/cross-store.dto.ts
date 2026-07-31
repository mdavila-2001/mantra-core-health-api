import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CACHE_SCOPES,
  DELETION_MODES,
  DELIVERY_SEMANTICS,
  ITEM_RESULTS,
  MAX_DELETION_TARGETS,
  MAX_RECONCILIATION_ITEMS,
  MIGRATION_STRATEGIES,
  MOVEMENT_MODES,
  REPAIR_ACTIONS,
  VERIFICATION_METHODS,
} from '../constants';

// ---------------------------------------------------------------------------
// UC-62-01 · Definición y suscripciones de proyección
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para subscription input.
 */
export class SubscriptionInputDto {
  /**
   * Valor de source event type mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Tipo de evento del outbox que suscribe',
  })
  @IsString()
  @MaxLength(200)
  sourceEventType!: string;

  /**
   * Valor de consumer code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  consumerCode!: string;

  /**
   * Valor de target backend code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100, description: 'Store destino al que proyecta' })
  @IsString()
  @MaxLength(100)
  targetBackendCode!: string;

  /**
   * Valor de concurrency limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  concurrencyLimit?: number;

  /**
   * Valor de retry policy json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Política de reintento del consumidor' })
  @IsOptional()
  @IsObject()
  retryPolicyJson?: Record<string, unknown>;

  /**
   * Valor de dead letter enabled mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  deadLetterEnabled?: boolean;
}

/**
 * Define el contrato validado para consistency slo input.
 */
export class ConsistencySloInputDto {
  /**
   * Valor de max projection lag seconds mantenido por la instancia.
   */
  @ApiProperty({
    minimum: 0,
    description: 'Retraso máximo tolerado de la proyección',
  })
  @IsInt()
  @Min(0)
  maxProjectionLagSeconds!: number;

  /**
   * Valor de max drift rate mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tasa máxima de deriva; cadena por ser numeric',
  })
  @IsOptional()
  @IsNumberString()
  maxDriftRate?: string;

  /**
   * Valor de reconciliation interval minutes mantenido por la instancia.
   */
  @ApiProperty({ minimum: 1, description: 'Cada cuánto se reconcilia' })
  @IsInt()
  @Min(1)
  reconciliationIntervalMinutes!: number;

  /**
   * Valor de alert policy code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  alertPolicyCode?: string;
}

/** Cuerpo de `POST /admin/projections/definitions` (UC-62-01). */
export class RegisterProjectionDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Identificador asociado a source dataset.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Dataset canónico del que se proyecta',
  })
  @IsUUID()
  sourceDatasetId!: string;

  /**
   * Identificador asociado a target dataset.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Dataset destino en el store secundario',
  })
  @IsUUID()
  targetDatasetId!: string;

  /**
   * Valor de projection version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  projectionVersion!: string;

  /**
   * Valor de delivery semantics mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: DELIVERY_SEMANTICS, default: 'AT_LEAST_ONCE' })
  @IsOptional()
  @IsIn(DELIVERY_SEMANTICS)
  deliverySemantics?: string;

  /**
   * Valor de transformation ref mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  transformationRef?: string;

  /**
   * Valor de subscriptions mantenido por la instancia.
   */
  @ApiProperty({ type: [SubscriptionInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubscriptionInputDto)
  subscriptions!: SubscriptionInputDto[];

  /**
   * Valor de slo mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: ConsistencySloInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConsistencySloInputDto)
  slo?: ConsistencySloInputDto;
}

/**
 * Define el contrato validado para projection definition response.
 */
export class ProjectionDefinitionResponseDto {
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
   * Valor de projection version mantenido por la instancia.
   */
  @ApiProperty()
  projectionVersion!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de subscription ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  subscriptionIds!: string[];

  /**
   * Identificador asociado a slo.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  sloId?: string;
}

// ---------------------------------------------------------------------------
// UC-62-02 y 03 · Entrega y checkpoint
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workers/projections/deliveries/process` (UC-62-02 + 03). */
export class ProcessDeliveryDto {
  /**
   * Identificador asociado a projection subscription.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  projectionSubscriptionId!: string;

  /**
   * Identificador asociado a outbox event.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Evento del outbox que se proyecta',
  })
  @IsUUID()
  outboxEventId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Hash del payload; parte de la identidad del intento',
  })
  @IsString()
  @MaxLength(200)
  payloadHash!: string;

  /**
   * Valor de partition key mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Clave de partición del checkpoint',
  })
  @IsString()
  @MaxLength(200)
  partitionKey!: string;

  /**
   * Valor de source position mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Posición en la fuente; cadena por ser bigint. Monótona creciente.',
  })
  @IsNumberString({ no_symbols: true })
  sourcePosition!: string;

  /**
   * Valor de target version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Versión escrita en el destino',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetVersion?: string;

  /**
   * Valor de durable write confirmed mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description:
      'Falso si la escritura en el destino falló; el intento queda FAILED',
  })
  @IsOptional()
  @IsBoolean()
  durableWriteConfirmed?: boolean;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Código de error si falló',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;
}

/**
 * Define el contrato validado para delivery response.
 */
export class DeliveryResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @ApiProperty()
  attemptNumber!: number;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si el evento ya se había aplicado con esa clave',
  })
  duplicate!: boolean;

  /**
   * Valor de checkpoint advanced mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si el checkpoint avanzó con esta entrega',
  })
  checkpointAdvanced!: boolean;

  /**
   * Valor de source position mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Posición del checkpoint tras la entrega',
  })
  sourcePosition?: string;
}

// ---------------------------------------------------------------------------
// UC-62-04 · Cola muerta y reproceso
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workers/projections/dead-letters` (UC-62-04). */
export class SendToDeadLetterDto {
  /**
   * Identificador asociado a projection delivery attempt.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Intento fallido que se manda a la cola muerta',
  })
  @IsUUID()
  projectionDeliveryAttemptId!: string;

  /**
   * Valor de reason code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  reasonCode!: string;

  /**
   * Identificador asociado a payload object.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Payload preservado en el almacén de objetos',
  })
  @IsOptional()
  @IsUUID()
  payloadObjectId?: string;
}

/**
 * Define el contrato validado para dead letter response.
 */
export class DeadLetterResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si ese intento ya estaba en la cola muerta',
  })
  duplicate!: boolean;
}

/** Cuerpo de `POST /admin/projections/dead-letters/{id}/replay` (UC-62-04). */
export class ReplayDeadLetterDto {
  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Hash del payload reprocesado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  payloadHash?: string;
}

/**
 * Define el contrato validado para replay response.
 */
export class ReplayResponseDto {
  /**
   * Identificador asociado a attempt.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Intento nuevo creado para el reproceso',
  })
  attemptId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @ApiProperty()
  attemptNumber!: number;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave de idempotencia conservada del intento original',
  })
  idempotencyKey!: string;

  /**
   * Valor de dead letter state mantenido por la instancia.
   */
  @ApiProperty()
  deadLetterState!: string;
}

// ---------------------------------------------------------------------------
// UC-62-05 y 06 · Reconciliación y deriva
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para reconciliation item.
 */
export class ReconciliationItemDto {
  /**
   * Identificador asociado a canonical entity.
   */
  @ApiProperty({ format: 'uuid', description: 'Entidad canónica comparada' })
  @IsUUID()
  canonicalEntityId!: string;

  /**
   * Valor de canonical version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión canónica; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  canonicalVersion?: string;

  /**
   * Identificador asociado a target document.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetDocumentId?: string;

  /**
   * Valor de target version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetVersion?: string;

  /**
   * Valor de canonical hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  canonicalHash?: string;

  /**
   * Valor de target hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetHash?: string;

  /**
   * Valor de result mantenido por la instancia.
   */
  @ApiProperty({ enum: ITEM_RESULTS })
  @IsIn(ITEM_RESULTS)
  result!: string;
}

/** Cuerpo de `POST /admin/reconciliation/runs` (UC-62-05 + 06). */
export class RunReconciliationDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a dataset.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetId!: string;

  /**
   * Valor de source backend code mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Store canónico; siempre PostgreSQL',
  })
  @IsString()
  @MaxLength(100)
  sourceBackendCode!: string;

  /**
   * Valor de target backend code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetBackendCode!: string;

  /**
   * Valor de reconciliation scope json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Qué abarca la corrida' })
  @IsOptional()
  @IsObject()
  reconciliationScopeJson?: Record<string, unknown>;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({
    type: [ReconciliationItemDto],
    maxItems: MAX_RECONCILIATION_ITEMS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_RECONCILIATION_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => ReconciliationItemDto)
  items!: ReconciliationItemDto[];
}

/**
 * Define el contrato validado para reconciliation response.
 */
export class ReconciliationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de items evaluated mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entidades comparadas' })
  itemsEvaluated!: number;

  /**
   * Valor de matched mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entidades que coinciden' })
  matched!: number;

  /**
   * Valor de drifts opened mantenido por la instancia.
   */
  @ApiProperty({ description: 'Derivas abiertas por esta corrida (UC-62-06)' })
  driftsOpened!: number;

  /**
   * Valor de drifts skipped mantenido por la instancia.
   */
  @ApiProperty({ description: 'Divergencias que ya tenían una deriva viva' })
  driftsSkipped!: number;

  /**
   * Valor de drifts by type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Derivas abiertas por clase' })
  driftsByType!: Record<string, number>;
}

// ---------------------------------------------------------------------------
// UC-62-07 · Reparación de deriva
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /admin/projections/drift/{id}/repair-jobs` (UC-62-07). */
export class RepairDriftDto {
  /**
   * Valor de repair action mantenido por la instancia.
   */
  @ApiProperty({ enum: REPAIR_ACTIONS })
  @IsIn(REPAIR_ACTIONS)
  repairAction!: string;

  /**
   * Valor de source alias mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Alias de origen para el reindexado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceAlias?: string;

  /**
   * Valor de target index mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetIndex?: string;

  /**
   * Valor de target schema version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetSchemaVersion?: string;
}

/**
 * Define el contrato validado para repair job response.
 */
export class RepairJobResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de repair action mantenido por la instancia.
   */
  @ApiProperty()
  repairAction!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Identificador asociado a projection drift event.
   */
  @ApiProperty({ format: 'uuid' })
  projectionDriftEventId!: string;

  /**
   * Identificador asociado a reindex job.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job de reindexado creado, si procede',
  })
  reindexJobId?: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'Verdadero si esa deriva ya tenía reparación' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-62-08 · Solicitud de borrado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /admin/deletion-requests` (UC-62-08). */
@ApiSchema({ name: 'CrossStoreConsistencyRequestDeletionDto' })
export class RequestDeletionDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de subject type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100, description: 'Qué clase de sujeto se borra' })
  @IsString()
  @MaxLength(100)
  subjectType!: string;

  /**
   * Identificador asociado a subject.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  subjectId!: string;

  /**
   * Valor de reason code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  reasonCode!: string;

  /**
   * Valor de legal basis code mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Base legal del borrado; sin ella no se acepta',
  })
  @IsString()
  @MaxLength(100)
  legalBasisCode!: string;

  /**
   * Valor de sla days mantenido por la instancia.
   */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 365,
    description: 'Días de plazo para cumplirlo; por omisión, 30',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  slaDays?: number;
}

/**
 * Define el contrato validado para deletion request response.
 */
export class DeletionRequestResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Fecha límite de cumplimiento',
  })
  dueAt!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si ya había una solicitud viva para el sujeto',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-62-09 · Expandir a objetivos
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para deletion target input.
 */
export class DeletionTargetInputDto {
  /**
   * Identificador asociado a dataset.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetId!: string;

  /**
   * Valor de backend code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  backendCode!: string;

  /**
   * Valor de target locator mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 500,
    description: 'Dónde está el dato dentro del store',
  })
  @IsString()
  @MaxLength(500)
  targetLocator!: string;

  /**
   * Valor de deletion mode mantenido por la instancia.
   */
  @ApiProperty({ enum: DELETION_MODES })
  @IsIn(DELETION_MODES)
  deletionMode!: string;

  /**
   * Valor de blocked by legal hold mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si una retención legal impide borrarlo',
  })
  @IsOptional()
  @IsBoolean()
  blockedByLegalHold?: boolean;
}

/** Cuerpo de `POST /workers/deletion-requests/{id}/expand` (UC-62-09). */
export class ExpandDeletionDto {
  /**
   * Valor de targets mantenido por la instancia.
   */
  @ApiProperty({
    type: [DeletionTargetInputDto],
    maxItems: MAX_DELETION_TARGETS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_DELETION_TARGETS)
  @ValidateNested({ each: true })
  @Type(() => DeletionTargetInputDto)
  targets!: DeletionTargetInputDto[];
}

/**
 * Define el contrato validado para expand deletion response.
 */
export class ExpandDeletionResponseDto {
  /**
   * Identificador asociado a deletion request.
   */
  @ApiProperty({ format: 'uuid' })
  deletionRequestId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de targets created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Objetivos nuevos creados' })
  targetsCreated!: number;

  /**
   * Valor de targets skipped mantenido por la instancia.
   */
  @ApiProperty({ description: 'Objetivos que ya estaban declarados' })
  targetsSkipped!: number;

  /**
   * Valor de blocked by legal hold mantenido por la instancia.
   */
  @ApiProperty({ description: 'Objetivos bloqueados por retención legal' })
  blockedByLegalHold!: number;
}

// ---------------------------------------------------------------------------
// Descubrimiento del worker de borrado (Fase 4 del plan de corrección de
// workers) · sin UC propio: infraestructura de lectura para que el worker
// sepa qué `targetId` llamar en `executions`/`verifications`, tal como el
// README documenta que le corresponde al worker ("Concurrencia").
// ---------------------------------------------------------------------------

/** Un objetivo de borrado, resumido para el worker que lo descubre. */
export class DeletionTargetSummaryDto {
  /**
   * Identificador único del objetivo.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a deletion request.
   */
  @ApiProperty({ format: 'uuid' })
  deletionRequestId!: string;

  /**
   * Identificador asociado a dataset.
   */
  @ApiProperty({ format: 'uuid' })
  datasetId!: string;

  /**
   * Valor de backend code mantenido por la instancia.
   */
  @ApiProperty()
  backendCode!: string;

  /**
   * Valor de target locator mantenido por la instancia.
   */
  @ApiProperty()
  targetLocator!: string;

  /**
   * Valor de deletion mode mantenido por la instancia.
   */
  @ApiProperty()
  deletionMode!: string;
}

/** Cuerpo de respuesta de `GET /workers/deletion-targets/pending`. */
export class PendingDeletionTargetsResponseDto {
  /**
   * Valor de targets mantenido por la instancia.
   */
  @ApiProperty({ type: [DeletionTargetSummaryDto] })
  targets!: DeletionTargetSummaryDto[];
}

/** Cuerpo de respuesta de `GET /workers/deletion-targets/executed`. */
export class ExecutedDeletionTargetsResponseDto {
  /**
   * Valor de targets mantenido por la instancia.
   */
  @ApiProperty({ type: [DeletionTargetSummaryDto] })
  targets!: DeletionTargetSummaryDto[];
}

// ---------------------------------------------------------------------------
// UC-62-10 · Ejecutar borrado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workers/deletion-targets/{id}/executions` (UC-62-10). */
export class ExecuteDeletionDto {
  /**
   * Valor de provider receipt mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 300,
    description: 'Acuse del proveedor; evidencia del borrado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  providerReceipt?: string;

  /**
   * Valor de succeeded mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description: 'Falso si el borrado en el proveedor falló',
  })
  @IsOptional()
  @IsBoolean()
  succeeded?: boolean;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;
}

/**
 * Define el contrato validado para deletion execution response.
 */
export class DeletionExecutionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @ApiProperty()
  attemptNumber!: number;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de target state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado en el que queda el objetivo' })
  targetState!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si ese borrado ya se había ejecutado',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-62-11 · Verificar ausencia y cerrar
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workers/deletion-targets/{id}/verifications` (UC-62-11). */
export class VerifyDeletionDto {
  /**
   * Valor de verification method mantenido por la instancia.
   */
  @ApiProperty({ enum: VERIFICATION_METHODS })
  @IsIn(VERIFICATION_METHODS)
  verificationMethod!: string;

  /**
   * Valor de verified absent mantenido por la instancia.
   */
  @ApiProperty({ description: 'Si el dato ya no está en el store' })
  @IsBoolean()
  verifiedAbsent!: boolean;

  /**
   * Valor de residual reference count mantenido por la instancia.
   */
  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
    description: 'Referencias residuales encontradas',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  residualReferenceCount?: number;

  /**
   * Identificador asociado a evidence object.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evidencia guardada en el almacén de objetos',
  })
  @IsOptional()
  @IsUUID()
  evidenceObjectId?: string;
}

/**
 * Define el contrato validado para verification response.
 */
export class VerificationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de target state mantenido por la instancia.
   */
  @ApiProperty()
  targetState!: string;

  /**
   * Valor de requires reexecution mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Verdadero si quedan referencias y hay que reintentar el borrado',
  })
  requiresReexecution!: boolean;
}

/** Cuerpo de `PATCH /admin/deletion-requests/{id}` (UC-62-11). */
export class CloseDeletionRequestDto {
  /**
   * Valor de note mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Nota de cierre; queda en el evento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

/**
 * Define el contrato validado para close deletion response.
 */
export class CloseDeletionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de verified targets mantenido por la instancia.
   */
  @ApiProperty({ description: 'Objetivos verificados ausentes' })
  verifiedTargets!: number;

  /**
   * Valor de blocked targets mantenido por la instancia.
   */
  @ApiProperty({ description: 'Objetivos bloqueados por retención legal' })
  blockedTargets!: number;

  /**
   * Valor de pending targets mantenido por la instancia.
   */
  @ApiProperty({ description: 'Objetivos que todavía no están verificados' })
  pendingTargets!: number;
}

// ---------------------------------------------------------------------------
// UC-62-12 · Invalidación de caché
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workers/cache/invalidations` (UC-62-12). */
@ApiSchema({ name: 'CrossStoreConsistencyInvalidateCacheDto' })
export class InvalidateCacheDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a dataset.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetId!: string;

  /**
   * Identificador asociado a entity.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  entityId!: string;

  /**
   * Valor de entity version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión de la entidad; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  entityVersion!: string;

  /**
   * Valor de cache scope mantenido por la instancia.
   */
  @ApiProperty({ enum: CACHE_SCOPES })
  @IsIn(CACHE_SCOPES)
  cacheScope!: string;
}

/**
 * Define el contrato validado para cache invalidation response.
 */
export class CacheInvalidationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si esa versión y ámbito ya se habían encolado',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-62-13 · Movimiento entre zonas
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /admin/data-movement-jobs` (UC-62-13). */
export class MoveDataDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a dataset.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetId!: string;

  /**
   * Identificador asociado a source placement.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourcePlacementId!: string;

  /**
   * Identificador asociado a target placement.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetPlacementId!: string;

  /**
   * Valor de movement mode mantenido por la instancia.
   */
  @ApiProperty({ enum: MOVEMENT_MODES })
  @IsIn(MOVEMENT_MODES)
  movementMode!: string;

  /**
   * Valor de manifest hash mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Huella del lote movido; garantiza idempotencia',
  })
  @IsString()
  @MaxLength(200)
  manifestHash!: string;

  /**
   * Identificador asociado a collection definition.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Colección cuyo esquema cambia en el destino',
  })
  @IsOptional()
  @IsUUID()
  collectionDefinitionId?: string;

  /**
   * Valor de from schema version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fromSchemaVersion?: string;

  /**
   * Valor de to schema version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  toSchemaVersion?: string;

  /**
   * Valor de migration strategy mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: MIGRATION_STRATEGIES })
  @IsOptional()
  @IsIn(MIGRATION_STRATEGIES)
  migrationStrategy?: string;
}

/**
 * Define el contrato validado para movement job response.
 */
export class MovementJobResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Identificador asociado a schema migration job.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Migración de esquema encolada, si procede',
  })
  schemaMigrationJobId?: string;

  /**
   * Identificador asociado a cache invalidation job.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Invalidación de caché encolada',
  })
  cacheInvalidationJobId?: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'Verdadero si ese lote ya se había movido' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-62-14 · Archivar por retención
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /admin/archive-jobs` (UC-62-14). */
export class ArchiveDataDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a dataset.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetId!: string;

  /**
   * Valor de retention cutoff mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Se archiva lo anterior a este corte',
  })
  @IsISO8601()
  retentionCutoff!: string;

  /**
   * Identificador asociado a archive manifest object.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Manifiesto en el almacén frío. Sin él no se purga la copia caliente.',
  })
  @IsOptional()
  @IsUUID()
  archiveManifestObjectId?: string;

  /**
   * Valor de archived count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Filas archivadas; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  archivedCount!: string;

  /**
   * Valor de deleted hot count mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Filas purgadas de la copia caliente; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  deletedHotCount?: string;
}

/**
 * Define el contrato validado para archive job response.
 */
export class ArchiveJobResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de archived count mantenido por la instancia.
   */
  @ApiProperty()
  archivedCount!: string;

  /**
   * Valor de deleted hot count mantenido por la instancia.
   */
  @ApiProperty()
  deletedHotCount!: string;

  /**
   * Identificador asociado a cache invalidation job.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  cacheInvalidationJobId?: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'Verdadero si ese corte ya se había archivado' })
  duplicate!: boolean;
}
