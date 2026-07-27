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
import {
  COMPATIBILITY_MODE,
  HEALTH_STATUS,
  VALIDATION_MODE,
  type CompatibilityMode,
  type HealthStatus,
  type SchemaValidationMode,
} from '../constants';

const COMPATIBILITY_MODES = [
  COMPATIBILITY_MODE.NONE,
  COMPATIBILITY_MODE.BACKWARD,
  COMPATIBILITY_MODE.FORWARD,
  COMPATIBILITY_MODE.FULL,
] as const;

const VALIDATION_MODES = [
  VALIDATION_MODE.STRICT,
  VALIDATION_MODE.LENIENT,
] as const;

const HEALTH_STATUSES = [
  HEALTH_STATUS.HEALTHY,
  HEALTH_STATUS.DEGRADED,
  HEALTH_STATUS.UNHEALTHY,
] as const;

// ---------------------------------------------------------------------------
// UC-54-01 · Backend de almacenamiento
// ---------------------------------------------------------------------------

export class BackendRegionDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  regionCode!: string;

  @ApiProperty({
    description: 'País donde reside físicamente el dato',
    maxLength: 10,
  })
  @IsString()
  @MaxLength(10)
  countryCode!: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  jurisdictionCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endpointUri?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Sólo una región puede serlo',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class BackendCapabilityDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  capabilityCode!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  capabilityVersion!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  configurationJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /governance/storage-backends` (UC-54-01). */
export class RegisterBackendDto {
  @ApiProperty({ description: 'Código único del backend', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Naturaleza del motor', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  backendType!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  providerCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  controlPlaneEndpoint?: string;

  @ApiProperty({
    type: [BackendRegionDto],
    description: 'Un backend sin región no puede alojar nada',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BackendRegionDto)
  regions!: BackendRegionDto[];

  @ApiPropertyOptional({ type: [BackendCapabilityDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BackendCapabilityDto)
  capabilities?: BackendCapabilityDto[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsTransactions?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsTtl?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsEncryption?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsVersioning?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsWorm?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsVectorSearch?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsFullText?: boolean;
}

export class BackendResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  regionIds!: string[];

  @ApiProperty({
    description: 'Capacidades registradas, todas pendientes de verificar',
  })
  capabilityCount!: number;
}

// ---------------------------------------------------------------------------
// UC-54-02 · Dataset gobernado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/datasets` (UC-54-02). */
export class DefineDatasetDto {
  @ApiProperty({ description: 'Código único del dataset', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Módulo dueño del dato', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  owningModuleCode!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Clasificación que gobierna su tratamiento',
  })
  @IsUUID()
  dataClassificationId!: string;

  @ApiProperty({ description: 'Dónde vive la verdad del dato', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sourceOfTruth!: string;

  @ApiProperty({ description: 'Huella del esquema inicial', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  schemaFingerprint!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  canonicalEntityType?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Documento del esquema' })
  @IsOptional()
  @IsUUID()
  schemaDocumentFileId?: string;
}

export class DatasetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  lifecycleState!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Versión 1.0.0, creada en la misma transacción',
  })
  initialVersionId!: string;

  @ApiProperty()
  initialVersion!: string;
}

// ---------------------------------------------------------------------------
// UC-54-03 · Versión de dataset
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/datasets/{id}/versions` (UC-54-03). */
export class PublishDatasetVersionDto {
  @ApiProperty({ description: 'Versión semántica nueva', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  version!: string;

  @ApiProperty({
    description: 'Huella recalculada del esquema',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  schemaFingerprint!: string;

  @ApiProperty({ enum: COMPATIBILITY_MODES })
  @IsIn(COMPATIBILITY_MODES)
  compatibilityMode!: CompatibilityMode;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  schemaDocumentFileId?: string;
}

export class DatasetVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({ description: 'Ciclo de vida en el que queda el dataset' })
  datasetLifecycleState!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión que queda superseded',
  })
  supersededVersionId?: string;
}

// ---------------------------------------------------------------------------
// UC-54-04 · Colección y esquema
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/collections` (UC-54-04). */
export class DefineCollectionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storageBackendId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetDefinitionId!: string;

  @ApiProperty({
    description: 'Nombre lógico, único dentro del backend',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  logicalName!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Versión del dataset que materializa',
  })
  @IsUUID()
  datasetVersionId!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  schemaVersion!: string;

  @ApiProperty({ enum: VALIDATION_MODES })
  @IsIn(VALIDATION_MODES)
  validationMode!: SchemaValidationMode;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  physicalNamePattern?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  partitioningStrategy?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tenantIsolationMode?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  routingKeyExpression?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shardKeyExpression?: string;

  @ApiPropertyOptional({ description: 'Documento del esquema de la colección' })
  @IsOptional()
  @IsObject()
  schemaDocumentJson?: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  migrationStrategy?: string;
}

export class CollectionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  logicalName!: string;

  @ApiProperty()
  lifecycleState!: string;

  @ApiProperty({ format: 'uuid' })
  schemaVersionId!: string;
}

// ---------------------------------------------------------------------------
// UC-54-05 · Aprobar colocación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/placements/{id}/approve` (UC-54-05). */
export class ApprovePlacementDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storageBackendRegionId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  collectionDefinitionId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Política de residencia a satisfacer',
  })
  @IsUUID()
  residencyPolicyId!: string;

  @ApiProperty({ format: 'uuid', description: 'Perfil de cifrado a aplicar' })
  @IsUUID()
  encryptionProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  replicationPolicyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  consistencyPolicyId?: string;

  @ApiPropertyOptional({
    description: 'Papel de la colocación',
    default: 'PRIMARY',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  placementRole?: string;
}

export class PlacementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty()
  placementRole!: string;

  @ApiProperty({ description: 'true si la colocación ya estaba aprobada' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-54-06 · Política de consistencia
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/consistency-policies` (UC-54-06). */
export class DefineConsistencyPolicyDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  readConsistency!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  writeConsistency!: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  conflictResolution?: string;

  @ApiPropertyOptional({
    description: 'Debe ser 0 si se exige leer lo propio recién escrito',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  staleReadToleranceSeconds?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresReadYourWrites?: boolean;
}

export class PolicyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-54-07 · Política de acceso al dato
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/datasets/{id}/data-access-policies` (UC-54-07). */
export class DefineAccessPolicyDto {
  @ApiProperty({
    description: 'Propósito de uso al que aplica',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  purposeOfUseCode!: string;

  @ApiProperty({
    description: 'Tipo de principal al que aplica',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  principalType!: string;

  @ApiPropertyOptional({ description: 'Qué campos se ven y cuáles no' })
  @IsOptional()
  @IsObject()
  fieldPolicyJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Filtro de filas visibles',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rowFilterExpression?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  maskingProfileCode?: string;
}

export class AccessPolicyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  datasetDefinitionId!: string;

  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-54-08 · Vínculo del tenant
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/tenants/{tenantId}/storage-bindings` (UC-54-08). */
export class BindTenantStorageDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetDefinitionId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Colocación primaria, ya aprobada',
  })
  @IsUUID()
  primaryPlacementId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Colocación de respaldo para el failover',
  })
  @IsOptional()
  @IsUUID()
  secondaryPlacementId?: string;

  @ApiPropertyOptional({
    description: 'Clave de partición del tenant',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tenantPartitionKey?: string;

  @ApiPropertyOptional({
    description: 'Referencia de la clave del tenant en el KMS',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tenantEncryptionKeyRef?: string;
}

export class TenantBindingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({ description: 'Estado en el que queda la colocación primaria' })
  primaryPlacementState!: string;
}

// ---------------------------------------------------------------------------
// UC-54-09 · Perfil de cifrado
// ---------------------------------------------------------------------------

export class RotationPolicyDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  rotationIntervalDays!: number;

  @ApiPropertyOptional({
    description: 'Días que conviven las dos claves',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  overlapDays?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  reencryptExistingData?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  emergencyRotationEnabled?: boolean;
}

/** Cuerpo de `POST /governance/encryption-profiles` (UC-54-09). */
export class DefineEncryptionProfileDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  algorithm!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  keyManagementProvider!: string;

  @ApiProperty({
    description: 'Referencia en el KMS. Nunca la clave.',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  keyReference!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  envelopeEncryption?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Obligatorio si el dataset ligado contiene datos de paciente',
  })
  @IsOptional()
  @IsBoolean()
  fieldLevelEncryption?: boolean;

  @ApiPropertyOptional({
    description: 'Campos con cifrado determinista para poder buscarlos',
  })
  @IsOptional()
  @IsObject()
  deterministicFieldsJson?: Record<string, unknown>;

  @ApiPropertyOptional({ type: RotationPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RotationPolicyDto)
  rotationPolicy?: RotationPolicyDto;
}

export class EncryptionProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  state!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Política de rotación creada o reutilizada',
  })
  rotationPolicyId?: string;
}

// ---------------------------------------------------------------------------
// UC-54-10 · Políticas de residencia, replicación y retención
// ---------------------------------------------------------------------------

export class ResidencyPolicyDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Países donde sí puede residir',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedCountryCodes?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Países donde no puede residir',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  forbiddenCountryCodes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedRegionCodes?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresInCountryBackup?: boolean;

  @ApiPropertyOptional({
    description: 'Base legal de la transferencia internacional',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  crossBorderTransferBasis?: string;
}

export class ReplicationPolicyDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  replicaCount!: number;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  replicationMode!: string;

  @ApiProperty({
    description: 'Modo de reacción ante una región caída',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  failoverMode!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  crossRegionEnabled?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxReplicationLagSeconds?: number;
}

export class RetentionPolicyDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  retentionDays!: number;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  deletionMode!: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  archiveAfterDays?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  legalHoldOverridesDeletion?: boolean;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  jurisdictionCode?: string;
}

/** Cuerpo de `POST /governance/policies` (UC-54-10). */
export class DefineStoragePoliciesDto {
  @ApiPropertyOptional({ type: ResidencyPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResidencyPolicyDto)
  residency?: ResidencyPolicyDto;

  @ApiPropertyOptional({ type: ReplicationPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReplicationPolicyDto)
  replication?: ReplicationPolicyDto;

  @ApiPropertyOptional({ type: RetentionPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RetentionPolicyDto)
  retention?: RetentionPolicyDto;
}

export class StoragePoliciesResponseDto {
  @ApiPropertyOptional({ format: 'uuid' })
  residencyPolicyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  replicationPolicyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  retentionPolicyId?: string;

  @ApiProperty({ description: 'Políticas creadas en esta llamada' })
  created!: number;
}

// ---------------------------------------------------------------------------
// UC-54-11 · Salud y failover
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ops/store-health-checks` (UC-54-11). */
export class RecordHealthCheckDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storageBackendRegionId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  checkType!: string;

  @ApiProperty({ enum: HEALTH_STATUSES })
  @IsIn(HEALTH_STATUSES)
  status!: HealthStatus;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  detailsJson?: Record<string, unknown>;
}

export class HealthCheckResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({
    description: 'Colocaciones que quedaron degradadas por esta comprobación',
  })
  degradedPlacements!: number;

  @ApiProperty({
    description: 'Vínculos de tenant cuyo primario se movió al secundario',
  })
  swappedBindings!: number;
}

/** Cuerpo de `POST /governance/placements/{id}/failover` (UC-54-11). */
export class FailoverPlacementDto {
  @ApiProperty({ description: 'Por qué se fuerza el failover' })
  @IsString()
  reason!: string;
}

export class FailoverResponseDto {
  @ApiProperty({ format: 'uuid' })
  placementId!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({ description: 'Vínculos cuyo primario se movió' })
  swappedBindings!: number;
}

// ---------------------------------------------------------------------------
// UC-54-12 · Instantánea de costes
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /finops/storage-cost-snapshots` (UC-54-12). */
export class ConsolidateCostSnapshotDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storageBackendRegionId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodStart!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodEnd!: string;

  @ApiProperty({ description: 'Bytes almacenados; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  storageBytes!: string;

  @ApiProperty({ description: 'Unidades de lectura; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  readUnits!: string;

  @ApiProperty({ description: 'Unidades de escritura; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  writeUnits!: string;

  @ApiProperty({ description: 'Bytes de salida; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  egressBytes!: string;

  @ApiProperty({ description: 'Coste estimado, como cadena decimal' })
  @IsNumberString()
  estimatedCost!: string;

  @ApiProperty({ maxLength: 10 })
  @IsString()
  @MaxLength(10)
  currencyCode!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  datasetDefinitionId?: string;
}

export class CostSnapshotResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  estimatedCost!: string;

  @ApiProperty({
    description: 'true si el periodo ya estaba consolidado y se actualizó',
  })
  updated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-54-13 · Integridad de la proyección
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ops/integrity-policies` (UC-54-13). */
export class DefineIntegrityPolicyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetDefinitionId!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  hashAlgorithm!: string;

  @ApiProperty({ description: 'Cada cuánto se verifica', minimum: 1 })
  @IsInt()
  @Min(1)
  verificationIntervalHours!: number;

  @ApiProperty({ description: 'Porcentaje de la muestra, como cadena decimal' })
  @IsNumberString()
  samplePercentage!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  compareWithCanonicalSource?: boolean;

  @ApiPropertyOptional({
    default: true,
    description: 'Cuarentenar la proyección si el hash no cuadra',
  })
  @IsOptional()
  @IsBoolean()
  quarantineOnMismatch?: boolean;
}

export class IntegrityPolicyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  datasetDefinitionId!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({ description: 'true si la política ya existía y se actualizó' })
  updated!: boolean;
}

/** Cuerpo de `POST /ops/integrity/{datasetId}/verify` (UC-54-13). */
export class VerifyIntegrityDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Colocación cuya proyección se verifica',
  })
  @IsUUID()
  placementId!: string;

  @ApiProperty({ description: 'Hash de la fuente canónica', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  canonicalHash!: string;

  @ApiProperty({
    description: 'Hash calculado sobre la proyección',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  projectionHash!: string;
}

export class VerifyIntegrityResponseDto {
  @ApiProperty({ format: 'uuid' })
  placementId!: string;

  @ApiProperty({ description: 'true si los dos hashes coinciden' })
  matched!: boolean;

  @ApiProperty({ description: 'Estado en el que queda la colocación' })
  placementState!: string;

  @ApiProperty({ description: 'true si la política ordenó cuarentenarla' })
  quarantined!: boolean;
}
