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
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  COMPATIBILITY_MODES,
  MAX_FILES_PER_PARTITION,
  MAX_PARTITIONS_PER_RUN,
  MAX_QUALITY_RULES,
  QUALITY_DIMENSIONS,
  RULE_SEVERITIES,
  STORAGE_FORMATS,
  ZONE_TYPES,
} from '../constants';

// ---------------------------------------------------------------------------
// UC-63-01 · Zona del data lake
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /lakehouse/zones` (UC-63-01). */
export class DefineZoneDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ZONE_TYPES })
  @IsIn(ZONE_TYPES)
  zoneType!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  namespaceId?: string;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Perfil de cifrado en reposo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  encryptionProfileCode?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  retentionPolicyCode?: string;
}

export class ZoneResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ enum: ZONE_TYPES })
  zoneType!: string;

  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-63-02 · Catálogo / metastore
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /lakehouse/catalogs` (UC-63-02). */
export class RegisterCatalogDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Motor del metastore, p. ej. `glue` o `hive`',
  })
  @IsString()
  @MaxLength(100)
  catalogType!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  metastoreUri!: string;

  @ApiPropertyOptional({ enum: STORAGE_FORMATS })
  @IsOptional()
  @IsIn(STORAGE_FORMATS)
  defaultFormat?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  defaultCompression?: string;
}

export class CatalogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-63-03 · Producto de datos y versión
// ---------------------------------------------------------------------------

export class QualityRuleDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  ruleCode!: string;

  @ApiProperty({ enum: QUALITY_DIMENSIONS })
  @IsIn(QUALITY_DIMENSIONS)
  dimension!: string;

  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Expresión declarativa de la regla',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  expression?: string;

  @ApiProperty({
    enum: RULE_SEVERITIES,
    description: '`blocking` cuarentena el dataset',
  })
  @IsIn(RULE_SEVERITIES)
  severity!: string;

  @ApiPropertyOptional({
    description:
      'Umbral a partir del cual la regla falla; cadena por ser numeric',
  })
  @IsOptional()
  @IsNumberString()
  threshold?: string;
}

/** Cuerpo de `POST /lakehouse/data-products/{id}/versions` (UC-63-03). */
export class PublishProductVersionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Código del producto; su clave natural con el tenant',
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerTeamId?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  businessPurpose?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  classificationCode?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Si el producto contiene datos de paciente',
  })
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  @ApiProperty({ maxLength: 50, description: 'Versión que se publica' })
  @IsString()
  @MaxLength(50)
  version!: string;

  @ApiProperty({
    description: 'Contrato de esquema que el producto promete cumplir',
  })
  @IsObject()
  contractSchemaJson!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Objetivos de calidad de los que salen las reglas',
  })
  @IsOptional()
  @IsObject()
  qualitySloJson?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [QualityRuleDto], maxItems: MAX_QUALITY_RULES })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_QUALITY_RULES)
  @ValidateNested({ each: true })
  @Type(() => QualityRuleDto)
  qualityRules?: QualityRuleDto[];
}

export class ProductVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  dataProductId!: string;

  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  state!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión anterior que quedó superseded',
  })
  supersededVersionId?: string;

  @ApiProperty({ description: 'Reglas de calidad derivadas del SLO' })
  qualityRulesCreated!: number;
}

// ---------------------------------------------------------------------------
// UC-63-04 · Dataset y versión de esquema
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /lakehouse/datasets` (UC-63-04). */
export class RegisterDatasetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid', description: 'Versión de producto activa' })
  @IsUUID()
  dataProductVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  dataLakeZoneId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  lakehouseCatalogId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  databaseName!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  tableName!: string;

  @ApiPropertyOptional({
    enum: STORAGE_FORMATS,
    description: 'Por omisión, el del catálogo',
  })
  @IsOptional()
  @IsIn(STORAGE_FORMATS)
  storageFormat?: string;

  @ApiPropertyOptional({ description: 'Cómo se particiona la tabla' })
  @IsOptional()
  @IsObject()
  partitionSpecJson?: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceDatasetCode?: string;

  @ApiProperty({ description: 'Esquema inicial del dataset' })
  @IsObject()
  schemaJson!: Record<string, unknown>;

  @ApiProperty({
    maxLength: 200,
    description: 'Huella del esquema; identifica el contrato',
  })
  @IsString()
  @MaxLength(200)
  schemaFingerprint!: string;

  @ApiPropertyOptional({ enum: COMPATIBILITY_MODES, default: 'backward' })
  @IsOptional()
  @IsIn(COMPATIBILITY_MODES)
  compatibilityMode?: string;
}

export class DatasetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  databaseName!: string;

  @ApiProperty()
  tableName!: string;

  @ApiProperty()
  storageFormat!: string;

  @ApiProperty()
  lifecycleState!: string;

  @ApiProperty({ format: 'uuid' })
  schemaVersionId!: string;
}

// ---------------------------------------------------------------------------
// UC-63-05 y 06 · Corrida de transformación con linaje
// ---------------------------------------------------------------------------

export class MaterializedFileDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Manifiesto del objeto en el almacén',
  })
  @IsOptional()
  @IsUUID()
  objectManifestId?: string;

  @ApiProperty({ enum: STORAGE_FORMATS })
  @IsIn(STORAGE_FORMATS)
  fileFormat!: string;

  @ApiProperty({ description: 'Filas del archivo; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  rowCount!: string;

  @ApiProperty({ description: 'Tamaño en bytes; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  sizeBytes!: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Hash del contenido; el archivo es inmutable',
  })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  @ApiPropertyOptional({
    description: 'Mínimos y máximos por columna, para poda de particiones',
  })
  @IsOptional()
  @IsObject()
  minMaxStatisticsJson?: Record<string, unknown>;
}

export class MaterializedPartitionDto {
  @ApiProperty({
    maxLength: 200,
    description: 'Huella de los valores de partición',
  })
  @IsString()
  @MaxLength(200)
  partitionSpecHash!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  partitionValuesJson?: Record<string, unknown>;

  @ApiProperty({
    description: 'Registros de la partición; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  recordCount!: string;

  @ApiProperty({ description: 'Tamaño en bytes; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  sizeBytes!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  minEventAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  maxEventAt?: string;

  @ApiProperty({
    type: [MaterializedFileDto],
    maxItems: MAX_FILES_PER_PARTITION,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_FILES_PER_PARTITION)
  @ValidateNested({ each: true })
  @Type(() => MaterializedFileDto)
  files!: MaterializedFileDto[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Particiones fuente de las que sale ésta; alimentan el linaje',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sourcePartitionIds?: string[];
}

/** Cuerpo de `POST /lakehouse/transformations/{defId}/runs` (UC-63-05). */
export class RunTransformationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({
    description:
      'Punto de la fuente hasta el que procesó; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  sourceCheckpoint?: string;

  @ApiProperty({ description: 'Registros leídos; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  inputRecordCount!: string;

  @ApiProperty({ description: 'Registros escritos; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  outputRecordCount!: string;

  @ApiPropertyOptional({
    description: 'Registros rechazados; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  rejectedRecordCount?: string;

  @ApiProperty({
    type: [MaterializedPartitionDto],
    maxItems: MAX_PARTITIONS_PER_RUN,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PARTITIONS_PER_RUN)
  @ValidateNested({ each: true })
  @Type(() => MaterializedPartitionDto)
  partitions!: MaterializedPartitionDto[];

  @ApiPropertyOptional({
    default: false,
    description: 'Cierra la corrida como fallida',
  })
  @IsOptional()
  @IsBoolean()
  failed?: boolean;
}

export class TransformationRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ description: 'Particiones nuevas materializadas' })
  partitionsCommitted!: number;

  @ApiProperty({
    description: 'Particiones que ya existían con la misma huella',
  })
  partitionsSkipped!: number;

  @ApiProperty({ description: 'Archivos nuevos registrados' })
  filesWritten!: number;

  @ApiProperty({ description: 'Aristas de linaje registradas (UC-63-06)' })
  lineageEdges!: number;

  @ApiProperty({
    description:
      'Verdadero si ya había una corrida viva sobre el mismo objetivo',
  })
  alreadyRunning!: boolean;
}

// ---------------------------------------------------------------------------
// UC-63-07 · Ingesta curada de-identificada
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /lakehouse/ingestion/curated-runs` (UC-63-07). */
export class CuratedIngestionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Dataset destino, obligatoriamente en zona curated',
  })
  @IsUUID()
  targetDatasetId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Perfil de de-identificación aplicado',
  })
  @IsUUID()
  deidentificationProfileId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Propósito de la de-identificación',
  })
  @IsUUID()
  purposeConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Consentimiento que ampara el tratamiento',
  })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Manifiesto del lote de entrada',
  })
  @IsOptional()
  @IsUUID()
  inputManifestFileId?: string;

  @ApiProperty({
    description: 'Registros de-identificados; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  recordsProcessed!: string;

  @ApiPropertyOptional({
    description: 'Registros rechazados; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  recordsRejected?: string;

  @ApiProperty({
    type: [MaterializedPartitionDto],
    maxItems: MAX_PARTITIONS_PER_RUN,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PARTITIONS_PER_RUN)
  @ValidateNested({ each: true })
  @Type(() => MaterializedPartitionDto)
  partitions!: MaterializedPartitionDto[];
}

export class CuratedIngestionResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Corrida de de-identificación registrada',
  })
  deidentificationRunId!: string;

  @ApiProperty({ format: 'uuid' })
  targetDatasetId!: string;

  @ApiProperty()
  partitionsCommitted!: number;

  @ApiProperty()
  filesWritten!: number;
}

// ---------------------------------------------------------------------------
// UC-63-08 · Corrida de calidad
// ---------------------------------------------------------------------------

export class QualityFindingDto {
  @ApiProperty({ maxLength: 100, description: 'Código de la regla violada' })
  @IsString()
  @MaxLength(100)
  ruleCode!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  partitionId?: string;

  @ApiProperty({
    description: 'Registros que incumplen; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  issueCount!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Muestra para diagnosticar',
  })
  @IsOptional()
  @IsUUID()
  sampleObjectManifestId?: string;
}

/** Cuerpo de `POST /lakehouse/datasets/{id}/quality-runs` (UC-63-08). */
export class RunQualityCheckDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Corrida de transformación evaluada',
  })
  @IsOptional()
  @IsUUID()
  transformationRunId?: string;

  @ApiProperty({ description: 'Registros evaluados; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  evaluatedRecordCount!: string;

  @ApiPropertyOptional({ type: [QualityFindingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityFindingDto)
  findings?: QualityFindingDto[];
}

export class QualityRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  evaluatedRecordCount!: string;

  @ApiProperty()
  failedRecordCount!: string;

  @ApiProperty({ description: 'Hallazgos abiertos' })
  issuesOpened!: number;

  @ApiProperty({
    description:
      'Verdadero si una regla bloqueante puso el dataset en cuarentena',
  })
  datasetQuarantined!: boolean;
}

// ---------------------------------------------------------------------------
// UC-63-09 · Proyecto de investigación y cohorte
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /research/projects/{id}/cohorts` (UC-63-09). */
export class DefineCohortDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Código del proyecto; su clave natural con el tenant',
  })
  @IsString()
  @MaxLength(100)
  projectCode!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  protocolReference?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  principalInvestigatorId!: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Referencia de la aprobación ética',
  })
  @IsString()
  @MaxLength(200)
  ethicsApprovalReference!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Inicio de la ventana ética',
  })
  @IsISO8601()
  approvedFrom!: string;

  @ApiProperty({ format: 'date-time', description: 'Fin de la ventana ética' })
  @IsISO8601()
  approvedTo!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  cohortCode!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  cohortVersion!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  inclusionExpression?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  exclusionExpression?: string;

  @ApiProperty({
    format: 'uuid',
    description:
      'Perfil de de-identificación con el que se materializará el release',
  })
  @IsUUID()
  deidentificationProfileId!: string;
}

export class CohortResponseDto {
  @ApiProperty({ format: 'uuid' })
  researchProjectId!: string;

  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-63-10 · Solicitud de release
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /research/dataset-releases` (UC-63-10). */
export class RequestDatasetReleaseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  researchProjectId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  dataProductVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  cohortDefinitionId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  purposeOfUseCode!: string;
}

export class ReleaseRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ format: 'date-time' })
  requestedAt!: string;
}

// ---------------------------------------------------------------------------
// UC-63-11 · Aprobar y materializar
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /research/dataset-releases/{id}/approve` (UC-63-11). */
export class ApproveDatasetReleaseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Propósito con el que corre la de-identificación',
  })
  @IsUUID()
  purposeConceptId!: string;

  @ApiProperty({
    description: 'Registros del manifiesto; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  recordCount!: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Hash del contenido materializado',
  })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Manifiesto del objeto de-identificado',
  })
  @IsOptional()
  @IsUUID()
  objectManifestId?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  schemaVersion?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 3650,
    description: 'Días de vigencia del acceso; por omisión, 90',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  ttlDays?: number;
}

export class ReleaseManifestResponseDto {
  @ApiProperty({ format: 'uuid' })
  datasetReleaseRequestId!: string;

  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  deidentificationRunId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({
    description: 'Verdadero si el release ya estaba materializado',
  })
  alreadyReleased!: boolean;
}

// ---------------------------------------------------------------------------
// UC-63-12 · Expirar o revocar
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /research/dataset-releases/{id}/revoke` (UC-63-12). */
export class RevokeDatasetReleaseDto {
  @ApiPropertyOptional({
    default: false,
    description:
      'Cierra por vencimiento del plazo en vez de por decisión de gobernanza',
  })
  @IsOptional()
  @IsBoolean()
  expired?: boolean;

  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Motivo; queda en el evento publicado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class RevokeReleaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ description: 'Verdadero si el release ya estaba cerrado' })
  alreadyClosed!: boolean;
}
