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

/**
 * Define el contrato validado para backend region.
 */
export class BackendRegionDto {
  /**
   * Valor de region code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  regionCode!: string;

  /**
   * Valor de country code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'País donde reside físicamente el dato',
    maxLength: 10,
  })
  @IsString()
  @MaxLength(10)
  countryCode!: string;

  /**
   * Valor de jurisdiction code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  jurisdictionCode?: string;

  /**
   * Valor de endpoint uri mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endpointUri?: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Sólo una región puede serlo',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

/**
 * Define el contrato validado para backend capability.
 */
export class BackendCapabilityDto {
  /**
   * Valor de capability code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  capabilityCode!: string;

  /**
   * Valor de capability version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  capabilityVersion!: string;

  /**
   * Valor de configuration json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  configurationJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /governance/storage-backends` (UC-54-01). */
export class RegisterBackendDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único del backend', maxLength: 100 })
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
   * Valor de backend type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Naturaleza del motor', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  backendType!: string;

  /**
   * Valor de provider code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  providerCode!: string;

  /**
   * Valor de control plane endpoint mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  controlPlaneEndpoint?: string;

  /**
   * Valor de regions mantenido por la instancia.
   */
  @ApiProperty({
    type: [BackendRegionDto],
    description: 'Un backend sin región no puede alojar nada',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BackendRegionDto)
  regions!: BackendRegionDto[];

  /**
   * Valor de capabilities mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [BackendCapabilityDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BackendCapabilityDto)
  capabilities?: BackendCapabilityDto[];

  /**
   * Valor de supports transactions mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsTransactions?: boolean;

  /**
   * Valor de supports ttl mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsTtl?: boolean;

  /**
   * Valor de supports encryption mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsEncryption?: boolean;

  /**
   * Valor de supports versioning mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsVersioning?: boolean;

  /**
   * Valor de supports worm mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsWorm?: boolean;

  /**
   * Valor de supports vector search mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsVectorSearch?: boolean;

  /**
   * Valor de supports full text mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  supportsFullText?: boolean;
}

/**
 * Define el contrato validado para backend response.
 */
export class BackendResponseDto {
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
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de region ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  regionIds!: string[];

  /**
   * Valor de capability count mantenido por la instancia.
   */
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
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único del dataset', maxLength: 100 })
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
   * Valor de owning module code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Módulo dueño del dato', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  owningModuleCode!: string;

  /**
   * Identificador asociado a data classification.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Clasificación que gobierna su tratamiento',
  })
  @IsUUID()
  dataClassificationId!: string;

  /**
   * Valor de source of truth mantenido por la instancia.
   */
  @ApiProperty({ description: 'Dónde vive la verdad del dato', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sourceOfTruth!: string;

  /**
   * Valor de schema fingerprint mantenido por la instancia.
   */
  @ApiProperty({ description: 'Huella del esquema inicial', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  schemaFingerprint!: string;

  /**
   * Valor de canonical entity type mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  canonicalEntityType?: string;

  /**
   * Identificador asociado a schema document file.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Documento del esquema' })
  @IsOptional()
  @IsUUID()
  schemaDocumentFileId?: string;
}

/**
 * Define el contrato validado para dataset response.
 */
export class DatasetResponseDto {
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
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty()
  lifecycleState!: string;

  /**
   * Identificador asociado a initial version.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Versión 1.0.0, creada en la misma transacción',
  })
  initialVersionId!: string;

  /**
   * Valor de initial version mantenido por la instancia.
   */
  @ApiProperty()
  initialVersion!: string;
}

// ---------------------------------------------------------------------------
// UC-54-03 · Versión de dataset
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/datasets/{id}/versions` (UC-54-03). */
export class PublishDatasetVersionDto {
  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión semántica nueva', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  version!: string;

  /**
   * Valor de schema fingerprint mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Huella recalculada del esquema',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  schemaFingerprint!: string;

  /**
   * Valor de compatibility mode mantenido por la instancia.
   */
  @ApiProperty({ enum: COMPATIBILITY_MODES })
  @IsIn(COMPATIBILITY_MODES)
  compatibilityMode!: CompatibilityMode;

  /**
   * Identificador asociado a schema document file.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  schemaDocumentFileId?: string;
}

/**
 * Define el contrato validado para dataset version response.
 */
export class DatasetVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty()
  version!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de dataset lifecycle state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Ciclo de vida en el que queda el dataset' })
  datasetLifecycleState!: string;

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
// UC-54-04 · Colección y esquema
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/collections` (UC-54-04). */
export class DefineCollectionDto {
  /**
   * Identificador asociado a storage backend.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storageBackendId!: string;

  /**
   * Identificador asociado a dataset definition.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetDefinitionId!: string;

  /**
   * Valor de logical name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nombre lógico, único dentro del backend',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  logicalName!: string;

  /**
   * Identificador asociado a dataset version.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Versión del dataset que materializa',
  })
  @IsUUID()
  datasetVersionId!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  schemaVersion!: string;

  /**
   * Valor de validation mode mantenido por la instancia.
   */
  @ApiProperty({ enum: VALIDATION_MODES })
  @IsIn(VALIDATION_MODES)
  validationMode!: SchemaValidationMode;

  /**
   * Valor de physical name pattern mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  physicalNamePattern?: string;

  /**
   * Valor de partitioning strategy mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  partitioningStrategy?: string;

  /**
   * Valor de tenant isolation mode mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tenantIsolationMode?: string;

  /**
   * Valor de routing key expression mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  routingKeyExpression?: string;

  /**
   * Valor de shard key expression mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shardKeyExpression?: string;

  /**
   * Valor de schema document json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Documento del esquema de la colección' })
  @IsOptional()
  @IsObject()
  schemaDocumentJson?: Record<string, unknown>;

  /**
   * Valor de migration strategy mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  migrationStrategy?: string;
}

/**
 * Define el contrato validado para collection response.
 */
export class CollectionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de logical name mantenido por la instancia.
   */
  @ApiProperty()
  logicalName!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty()
  lifecycleState!: string;

  /**
   * Identificador asociado a schema version.
   */
  @ApiProperty({ format: 'uuid' })
  schemaVersionId!: string;
}

// ---------------------------------------------------------------------------
// UC-54-05 · Aprobar colocación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/placements/{id}/approve` (UC-54-05). */
export class ApprovePlacementDto {
  /**
   * Identificador asociado a dataset version.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetVersionId!: string;

  /**
   * Identificador asociado a storage backend region.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storageBackendRegionId!: string;

  /**
   * Identificador asociado a collection definition.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  collectionDefinitionId!: string;

  /**
   * Identificador asociado a residency policy.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Política de residencia a satisfacer',
  })
  @IsUUID()
  residencyPolicyId!: string;

  /**
   * Identificador asociado a encryption profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Perfil de cifrado a aplicar' })
  @IsUUID()
  encryptionProfileId!: string;

  /**
   * Identificador asociado a replication policy.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  replicationPolicyId?: string;

  /**
   * Identificador asociado a consistency policy.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  consistencyPolicyId?: string;

  /**
   * Valor de placement role mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Papel de la colocación',
    default: 'PRIMARY',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  placementRole?: string;
}

/**
 * Define el contrato validado para placement response.
 */
export class PlacementResponseDto {
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
   * Valor de placement role mantenido por la instancia.
   */
  @ApiProperty()
  placementRole!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la colocación ya estaba aprobada' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-54-06 · Política de consistencia
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/consistency-policies` (UC-54-06). */
export class DefineConsistencyPolicyDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de read consistency mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  readConsistency!: string;

  /**
   * Valor de write consistency mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  writeConsistency!: string;

  /**
   * Valor de conflict resolution mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  conflictResolution?: string;

  /**
   * Valor de stale read tolerance seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Debe ser 0 si se exige leer lo propio recién escrito',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  staleReadToleranceSeconds?: number;

  /**
   * Valor de requires read your writes mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresReadYourWrites?: boolean;
}

/**
 * Define el contrato validado para policy response.
 */
export class PolicyResponseDto {
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
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-54-07 · Política de acceso al dato
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/datasets/{id}/data-access-policies` (UC-54-07). */
export class DefineAccessPolicyDto {
  /**
   * Valor de purpose of use code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Propósito de uso al que aplica',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  purposeOfUseCode!: string;

  /**
   * Valor de principal type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de principal al que aplica',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  principalType!: string;

  /**
   * Valor de field policy json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Qué campos se ven y cuáles no' })
  @IsOptional()
  @IsObject()
  fieldPolicyJson?: Record<string, unknown>;

  /**
   * Valor de row filter expression mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Filtro de filas visibles',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rowFilterExpression?: string;

  /**
   * Valor de masking profile code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  maskingProfileCode?: string;
}

/**
 * Define el contrato validado para access policy response.
 */
export class AccessPolicyResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a dataset definition.
   */
  @ApiProperty({ format: 'uuid' })
  datasetDefinitionId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-54-08 · Vínculo del tenant
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /governance/tenants/{tenantId}/storage-bindings` (UC-54-08). */
export class BindTenantStorageDto {
  /**
   * Identificador asociado a dataset definition.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetDefinitionId!: string;

  /**
   * Identificador asociado a primary placement.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Colocación primaria, ya aprobada',
  })
  @IsUUID()
  primaryPlacementId!: string;

  /**
   * Identificador asociado a secondary placement.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Colocación de respaldo para el failover',
  })
  @IsOptional()
  @IsUUID()
  secondaryPlacementId?: string;

  /**
   * Valor de tenant partition key mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Clave de partición del tenant',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tenantPartitionKey?: string;

  /**
   * Valor de tenant encryption key ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia de la clave del tenant en el KMS',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tenantEncryptionKeyRef?: string;
}

/**
 * Define el contrato validado para tenant binding response.
 */
export class TenantBindingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de primary placement state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado en el que queda la colocación primaria' })
  primaryPlacementState!: string;
}

// ---------------------------------------------------------------------------
// UC-54-09 · Perfil de cifrado
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para rotation policy.
 */
export class RotationPolicyDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de rotation interval days mantenido por la instancia.
   */
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  rotationIntervalDays!: number;

  /**
   * Valor de overlap days mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Días que conviven las dos claves',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  overlapDays?: number;

  /**
   * Valor de reencrypt existing data mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  reencryptExistingData?: boolean;

  /**
   * Valor de emergency rotation enabled mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  emergencyRotationEnabled?: boolean;
}

/** Cuerpo de `POST /governance/encryption-profiles` (UC-54-09). */
export class DefineEncryptionProfileDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de algorithm mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  algorithm!: string;

  /**
   * Valor de key management provider mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  keyManagementProvider!: string;

  /**
   * Valor de key reference mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Referencia en el KMS. Nunca la clave.',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  keyReference!: string;

  /**
   * Valor de envelope encryption mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  envelopeEncryption?: boolean;

  /**
   * Valor de field level encryption mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Obligatorio si el dataset ligado contiene datos de paciente',
  })
  @IsOptional()
  @IsBoolean()
  fieldLevelEncryption?: boolean;

  /**
   * Valor de deterministic fields json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Campos con cifrado determinista para poder buscarlos',
  })
  @IsOptional()
  @IsObject()
  deterministicFieldsJson?: Record<string, unknown>;

  /**
   * Valor de rotation policy mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: RotationPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RotationPolicyDto)
  rotationPolicy?: RotationPolicyDto;
}

/**
 * Define el contrato validado para encryption profile response.
 */
export class EncryptionProfileResponseDto {
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
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Identificador asociado a rotation policy.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Política de rotación creada o reutilizada',
  })
  rotationPolicyId?: string;
}

// ---------------------------------------------------------------------------
// UC-54-10 · Políticas de residencia, replicación y retención
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para residency policy.
 */
export class ResidencyPolicyDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de allowed country codes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'Países donde sí puede residir',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedCountryCodes?: string[];

  /**
   * Valor de forbidden country codes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'Países donde no puede residir',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  forbiddenCountryCodes?: string[];

  /**
   * Valor de allowed region codes mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedRegionCodes?: string[];

  /**
   * Valor de requires in country backup mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresInCountryBackup?: boolean;

  /**
   * Valor de cross border transfer basis mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Base legal de la transferencia internacional',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  crossBorderTransferBasis?: string;
}

/**
 * Define el contrato validado para replication policy.
 */
export class ReplicationPolicyDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de replica count mantenido por la instancia.
   */
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  replicaCount!: number;

  /**
   * Valor de replication mode mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  replicationMode!: string;

  /**
   * Valor de failover mode mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Modo de reacción ante una región caída',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  failoverMode!: string;

  /**
   * Valor de cross region enabled mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  crossRegionEnabled?: boolean;

  /**
   * Valor de max replication lag seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxReplicationLagSeconds?: number;
}

/**
 * Define el contrato validado para retention policy.
 */
export class RetentionPolicyDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de retention days mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  retentionDays!: number;

  /**
   * Valor de deletion mode mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  deletionMode!: string;

  /**
   * Valor de archive after days mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  archiveAfterDays?: number;

  /**
   * Valor de legal hold overrides deletion mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  legalHoldOverridesDeletion?: boolean;

  /**
   * Valor de jurisdiction code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  jurisdictionCode?: string;
}

/** Cuerpo de `POST /governance/policies` (UC-54-10). */
export class DefineStoragePoliciesDto {
  /**
   * Valor de residency mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: ResidencyPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResidencyPolicyDto)
  residency?: ResidencyPolicyDto;

  /**
   * Valor de replication mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: ReplicationPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReplicationPolicyDto)
  replication?: ReplicationPolicyDto;

  /**
   * Valor de retention mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: RetentionPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RetentionPolicyDto)
  retention?: RetentionPolicyDto;
}

/**
 * Define el contrato validado para storage policies response.
 */
export class StoragePoliciesResponseDto {
  /**
   * Identificador asociado a residency policy.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  residencyPolicyId?: string;

  /**
   * Identificador asociado a replication policy.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  replicationPolicyId?: string;

  /**
   * Identificador asociado a retention policy.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  retentionPolicyId?: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Políticas creadas en esta llamada' })
  created!: number;
}

// ---------------------------------------------------------------------------
// UC-54-11 · Salud y failover
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ops/store-health-checks` (UC-54-11). */
export class RecordHealthCheckDto {
  /**
   * Identificador asociado a storage backend region.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storageBackendRegionId!: string;

  /**
   * Valor de check type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  checkType!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ enum: HEALTH_STATUSES })
  @IsIn(HEALTH_STATUSES)
  status!: HealthStatus;

  /**
   * Valor de latency ms mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  /**
   * Valor de details json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  detailsJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para health check response.
 */
export class HealthCheckResponseDto {
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
   * Valor de degraded placements mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Colocaciones que quedaron degradadas por esta comprobación',
  })
  degradedPlacements!: number;

  /**
   * Valor de swapped bindings mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Vínculos de tenant cuyo primario se movió al secundario',
  })
  swappedBindings!: number;
}

/** Cuerpo de `POST /governance/placements/{id}/failover` (UC-54-11). */
export class FailoverPlacementDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se fuerza el failover' })
  @IsString()
  reason!: string;
}

/**
 * Define el contrato validado para failover response.
 */
export class FailoverResponseDto {
  /**
   * Identificador asociado a placement.
   */
  @ApiProperty({ format: 'uuid' })
  placementId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de swapped bindings mantenido por la instancia.
   */
  @ApiProperty({ description: 'Vínculos cuyo primario se movió' })
  swappedBindings!: number;
}

// ---------------------------------------------------------------------------
// UC-54-12 · Instantánea de costes
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /finops/storage-cost-snapshots` (UC-54-12). */
export class ConsolidateCostSnapshotDto {
  /**
   * Identificador asociado a storage backend region.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storageBackendRegionId!: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodStart!: string;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodEnd!: string;

  /**
   * Valor de storage bytes mantenido por la instancia.
   */
  @ApiProperty({ description: 'Bytes almacenados; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  storageBytes!: string;

  /**
   * Valor de read units mantenido por la instancia.
   */
  @ApiProperty({ description: 'Unidades de lectura; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  readUnits!: string;

  /**
   * Valor de write units mantenido por la instancia.
   */
  @ApiProperty({ description: 'Unidades de escritura; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  writeUnits!: string;

  /**
   * Valor de egress bytes mantenido por la instancia.
   */
  @ApiProperty({ description: 'Bytes de salida; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  egressBytes!: string;

  /**
   * Valor de estimated cost mantenido por la instancia.
   */
  @ApiProperty({ description: 'Coste estimado, como cadena decimal' })
  @IsNumberString()
  estimatedCost!: string;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 10 })
  @IsString()
  @MaxLength(10)
  currencyCode!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a dataset definition.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  datasetDefinitionId?: string;
}

/**
 * Define el contrato validado para cost snapshot response.
 */
export class CostSnapshotResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de estimated cost mantenido por la instancia.
   */
  @ApiProperty()
  estimatedCost!: string;

  /**
   * Valor de updated mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a dataset definition.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  datasetDefinitionId!: string;

  /**
   * Valor de hash algorithm mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  hashAlgorithm!: string;

  /**
   * Valor de verification interval hours mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cada cuánto se verifica', minimum: 1 })
  @IsInt()
  @Min(1)
  verificationIntervalHours!: number;

  /**
   * Valor de sample percentage mantenido por la instancia.
   */
  @ApiProperty({ description: 'Porcentaje de la muestra, como cadena decimal' })
  @IsNumberString()
  samplePercentage!: string;

  /**
   * Valor de compare with canonical source mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  compareWithCanonicalSource?: boolean;

  /**
   * Valor de quarantine on mismatch mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description: 'Cuarentenar la proyección si el hash no cuadra',
  })
  @IsOptional()
  @IsBoolean()
  quarantineOnMismatch?: boolean;
}

/**
 * Define el contrato validado para integrity policy response.
 */
export class IntegrityPolicyResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a dataset definition.
   */
  @ApiProperty({ format: 'uuid' })
  datasetDefinitionId!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de updated mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la política ya existía y se actualizó' })
  updated!: boolean;
}

/** Cuerpo de `POST /ops/integrity/{datasetId}/verify` (UC-54-13). */
export class VerifyIntegrityDto {
  /**
   * Identificador asociado a placement.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Colocación cuya proyección se verifica',
  })
  @IsUUID()
  placementId!: string;

  /**
   * Valor de canonical hash mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hash de la fuente canónica', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  canonicalHash!: string;

  /**
   * Valor de projection hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hash calculado sobre la proyección',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  projectionHash!: string;
}

/**
 * Define el contrato validado para verify integrity response.
 */
export class VerifyIntegrityResponseDto {
  /**
   * Identificador asociado a placement.
   */
  @ApiProperty({ format: 'uuid' })
  placementId!: string;

  /**
   * Valor de matched mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si los dos hashes coinciden' })
  matched!: boolean;

  /**
   * Valor de placement state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado en el que queda la colocación' })
  placementState!: string;

  /**
   * Valor de quarantined mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la política ordenó cuarentenarla' })
  quarantined!: boolean;
}
