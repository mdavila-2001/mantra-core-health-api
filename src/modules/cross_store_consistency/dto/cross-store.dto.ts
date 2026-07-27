import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class SubscriptionInputDto {
  @ApiProperty({
    maxLength: 200,
    description: 'Tipo de evento del outbox que suscribe',
  })
  @IsString()
  @MaxLength(200)
  sourceEventType!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  consumerCode!: string;

  @ApiProperty({ maxLength: 100, description: 'Store destino al que proyecta' })
  @IsString()
  @MaxLength(100)
  targetBackendCode!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  concurrencyLimit?: number;

  @ApiPropertyOptional({ description: 'Política de reintento del consumidor' })
  @IsOptional()
  @IsObject()
  retryPolicyJson?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  deadLetterEnabled?: boolean;
}

export class ConsistencySloInputDto {
  @ApiProperty({
    minimum: 0,
    description: 'Retraso máximo tolerado de la proyección',
  })
  @IsInt()
  @Min(0)
  maxProjectionLagSeconds!: number;

  @ApiPropertyOptional({
    description: 'Tasa máxima de deriva; cadena por ser numeric',
  })
  @IsOptional()
  @IsNumberString()
  maxDriftRate?: string;

  @ApiProperty({ minimum: 1, description: 'Cada cuánto se reconcilia' })
  @IsInt()
  @Min(1)
  reconciliationIntervalMinutes!: number;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  alertPolicyCode?: string;
}

/** Cuerpo de `POST /admin/projections/definitions` (UC-62-01). */
export class RegisterProjectionDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Dataset canónico del que se proyecta',
  })
  @IsUUID()
  sourceDatasetId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Dataset destino en el store secundario',
  })
  @IsUUID()
  targetDatasetId!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  projectionVersion!: string;

  @ApiPropertyOptional({ enum: DELIVERY_SEMANTICS, default: 'AT_LEAST_ONCE' })
  @IsOptional()
  @IsIn(DELIVERY_SEMANTICS)
  deliverySemantics?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  transformationRef?: string;

  @ApiProperty({ type: [SubscriptionInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubscriptionInputDto)
  subscriptions!: SubscriptionInputDto[];

  @ApiPropertyOptional({ type: ConsistencySloInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConsistencySloInputDto)
  slo?: ConsistencySloInputDto;
}

export class ProjectionDefinitionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  projectionVersion!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  subscriptionIds!: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  sloId?: string;
}

// ---------------------------------------------------------------------------
// UC-62-02 y 03 · Entrega y checkpoint
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workers/projections/deliveries/process` (UC-62-02 + 03). */
export class ProcessDeliveryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  projectionSubscriptionId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Evento del outbox que se proyecta',
  })
  @IsUUID()
  outboxEventId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Hash del payload; parte de la identidad del intento',
  })
  @IsString()
  @MaxLength(200)
  payloadHash!: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Clave de partición del checkpoint',
  })
  @IsString()
  @MaxLength(200)
  partitionKey!: string;

  @ApiProperty({
    description:
      'Posición en la fuente; cadena por ser bigint. Monótona creciente.',
  })
  @IsNumberString({ no_symbols: true })
  sourcePosition!: string;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Versión escrita en el destino',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetVersion?: string;

  @ApiPropertyOptional({
    default: true,
    description:
      'Falso si la escritura en el destino falló; el intento queda FAILED',
  })
  @IsOptional()
  @IsBoolean()
  durableWriteConfirmed?: boolean;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Código de error si falló',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;
}

export class DeliveryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  attemptNumber!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty({
    description: 'Verdadero si el evento ya se había aplicado con esa clave',
  })
  duplicate!: boolean;

  @ApiProperty({
    description: 'Verdadero si el checkpoint avanzó con esta entrega',
  })
  checkpointAdvanced!: boolean;

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
  @ApiProperty({
    format: 'uuid',
    description: 'Intento fallido que se manda a la cola muerta',
  })
  @IsUUID()
  projectionDeliveryAttemptId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  reasonCode!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Payload preservado en el almacén de objetos',
  })
  @IsOptional()
  @IsUUID()
  payloadObjectId?: string;
}

export class DeadLetterResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({
    description: 'Verdadero si ese intento ya estaba en la cola muerta',
  })
  duplicate!: boolean;
}

/** Cuerpo de `POST /admin/projections/dead-letters/{id}/replay` (UC-62-04). */
export class ReplayDeadLetterDto {
  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Hash del payload reprocesado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  payloadHash?: string;
}

export class ReplayResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Intento nuevo creado para el reproceso',
  })
  attemptId!: string;

  @ApiProperty()
  attemptNumber!: number;

  @ApiProperty({
    description: 'Clave de idempotencia conservada del intento original',
  })
  idempotencyKey!: string;

  @ApiProperty()
  deadLetterState!: string;
}

// ---------------------------------------------------------------------------
// UC-62-05 y 06 · Reconciliación y deriva
// ---------------------------------------------------------------------------

export class ReconciliationItemDto {
  @ApiProperty({ format: 'uuid', description: 'Entidad canónica comparada' })
  @IsUUID()
  canonicalEntityId!: string;

  @ApiPropertyOptional({
    description: 'Versión canónica; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  canonicalVersion?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetDocumentId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetVersion?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  canonicalHash?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetHash?: string;

  @ApiProperty({ enum: ITEM_RESULTS })
  @IsIn(ITEM_RESULTS)
  result!: string;
}

/** Cuerpo de `POST /admin/reconciliation/runs` (UC-62-05 + 06). */
export class RunReconciliationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetId!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Store canónico; siempre PostgreSQL',
  })
  @IsString()
  @MaxLength(100)
  sourceBackendCode!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetBackendCode!: string;

  @ApiPropertyOptional({ description: 'Qué abarca la corrida' })
  @IsOptional()
  @IsObject()
  reconciliationScopeJson?: Record<string, unknown>;

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

export class ReconciliationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ description: 'Entidades comparadas' })
  itemsEvaluated!: number;

  @ApiProperty({ description: 'Entidades que coinciden' })
  matched!: number;

  @ApiProperty({ description: 'Derivas abiertas por esta corrida (UC-62-06)' })
  driftsOpened!: number;

  @ApiProperty({ description: 'Divergencias que ya tenían una deriva viva' })
  driftsSkipped!: number;

  @ApiProperty({ description: 'Derivas abiertas por clase' })
  driftsByType!: Record<string, number>;
}

// ---------------------------------------------------------------------------
// UC-62-07 · Reparación de deriva
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /admin/projections/drift/{id}/repair-jobs` (UC-62-07). */
export class RepairDriftDto {
  @ApiProperty({ enum: REPAIR_ACTIONS })
  @IsIn(REPAIR_ACTIONS)
  repairAction!: string;

  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Alias de origen para el reindexado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceAlias?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetIndex?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetSchemaVersion?: string;
}

export class RepairJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  repairAction!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ format: 'uuid' })
  projectionDriftEventId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job de reindexado creado, si procede',
  })
  reindexJobId?: string;

  @ApiProperty({ description: 'Verdadero si esa deriva ya tenía reparación' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-62-08 · Solicitud de borrado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /admin/deletion-requests` (UC-62-08). */
export class RequestDeletionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100, description: 'Qué clase de sujeto se borra' })
  @IsString()
  @MaxLength(100)
  subjectType!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  reasonCode!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Base legal del borrado; sin ella no se acepta',
  })
  @IsString()
  @MaxLength(100)
  legalBasisCode!: string;

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

export class DeletionRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Fecha límite de cumplimiento',
  })
  dueAt!: string;

  @ApiProperty({
    description: 'Verdadero si ya había una solicitud viva para el sujeto',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-62-09 · Expandir a objetivos
// ---------------------------------------------------------------------------

export class DeletionTargetInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  backendCode!: string;

  @ApiProperty({
    maxLength: 500,
    description: 'Dónde está el dato dentro del store',
  })
  @IsString()
  @MaxLength(500)
  targetLocator!: string;

  @ApiProperty({ enum: DELETION_MODES })
  @IsIn(DELETION_MODES)
  deletionMode!: string;

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

export class ExpandDeletionResponseDto {
  @ApiProperty({ format: 'uuid' })
  deletionRequestId!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({ description: 'Objetivos nuevos creados' })
  targetsCreated!: number;

  @ApiProperty({ description: 'Objetivos que ya estaban declarados' })
  targetsSkipped!: number;

  @ApiProperty({ description: 'Objetivos bloqueados por retención legal' })
  blockedByLegalHold!: number;
}

// ---------------------------------------------------------------------------
// UC-62-10 · Ejecutar borrado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workers/deletion-targets/{id}/executions` (UC-62-10). */
export class ExecuteDeletionDto {
  @ApiPropertyOptional({
    maxLength: 300,
    description: 'Acuse del proveedor; evidencia del borrado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  providerReceipt?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Falso si el borrado en el proveedor falló',
  })
  @IsOptional()
  @IsBoolean()
  succeeded?: boolean;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;
}

export class DeletionExecutionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  attemptNumber!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty({ description: 'Estado en el que queda el objetivo' })
  targetState!: string;

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
  @ApiProperty({ enum: VERIFICATION_METHODS })
  @IsIn(VERIFICATION_METHODS)
  verificationMethod!: string;

  @ApiProperty({ description: 'Si el dato ya no está en el store' })
  @IsBoolean()
  verifiedAbsent!: boolean;

  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
    description: 'Referencias residuales encontradas',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  residualReferenceCount?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evidencia guardada en el almacén de objetos',
  })
  @IsOptional()
  @IsUUID()
  evidenceObjectId?: string;
}

export class VerificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  targetState!: string;

  @ApiProperty({
    description:
      'Verdadero si quedan referencias y hay que reintentar el borrado',
  })
  requiresReexecution!: boolean;
}

/** Cuerpo de `PATCH /admin/deletion-requests/{id}` (UC-62-11). */
export class CloseDeletionRequestDto {
  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Nota de cierre; queda en el evento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class CloseDeletionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({ description: 'Objetivos verificados ausentes' })
  verifiedTargets!: number;

  @ApiProperty({ description: 'Objetivos bloqueados por retención legal' })
  blockedTargets!: number;

  @ApiProperty({ description: 'Objetivos que todavía no están verificados' })
  pendingTargets!: number;
}

// ---------------------------------------------------------------------------
// UC-62-12 · Invalidación de caché
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /workers/cache/invalidations` (UC-62-12). */
export class InvalidateCacheDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  entityId!: string;

  @ApiProperty({ description: 'Versión de la entidad; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  entityVersion!: string;

  @ApiProperty({ enum: CACHE_SCOPES })
  @IsIn(CACHE_SCOPES)
  cacheScope!: string;
}

export class CacheInvalidationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourcePlacementId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetPlacementId!: string;

  @ApiProperty({ enum: MOVEMENT_MODES })
  @IsIn(MOVEMENT_MODES)
  movementMode!: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Huella del lote movido; garantiza idempotencia',
  })
  @IsString()
  @MaxLength(200)
  manifestHash!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Colección cuyo esquema cambia en el destino',
  })
  @IsOptional()
  @IsUUID()
  collectionDefinitionId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fromSchemaVersion?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  toSchemaVersion?: string;

  @ApiPropertyOptional({ enum: MIGRATION_STRATEGIES })
  @IsOptional()
  @IsIn(MIGRATION_STRATEGIES)
  migrationStrategy?: string;
}

export class MovementJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Migración de esquema encolada, si procede',
  })
  schemaMigrationJobId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Invalidación de caché encolada',
  })
  cacheInvalidationJobId?: string;

  @ApiProperty({ description: 'Verdadero si ese lote ya se había movido' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-62-14 · Archivar por retención
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /admin/archive-jobs` (UC-62-14). */
export class ArchiveDataDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetId!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Se archiva lo anterior a este corte',
  })
  @IsISO8601()
  retentionCutoff!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Manifiesto en el almacén frío. Sin él no se purga la copia caliente.',
  })
  @IsOptional()
  @IsUUID()
  archiveManifestObjectId?: string;

  @ApiProperty({ description: 'Filas archivadas; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  archivedCount!: string;

  @ApiPropertyOptional({
    description: 'Filas purgadas de la copia caliente; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  deletedHotCount?: string;
}

export class ArchiveJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  archivedCount!: string;

  @ApiProperty()
  deletedHotCount!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  cacheInvalidationJobId?: string;

  @ApiProperty({ description: 'Verdadero si ese corte ya se había archivado' })
  duplicate!: boolean;
}
