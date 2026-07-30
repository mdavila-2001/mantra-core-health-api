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
   * Valor de zone type mantenido por la instancia.
   */
  @ApiProperty({ enum: ZONE_TYPES })
  @IsIn(ZONE_TYPES)
  zoneType!: string;

  /**
   * Identificador asociado a namespace.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  namespaceId?: string;

  /**
   * Valor de encryption profile code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Perfil de cifrado en reposo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  encryptionProfileCode?: string;

  /**
   * Valor de retention policy code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  retentionPolicyCode?: string;
}

/**
 * Define el contrato validado para zone response.
 */
export class ZoneResponseDto {
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
   * Valor de zone type mantenido por la instancia.
   */
  @ApiProperty({ enum: ZONE_TYPES })
  zoneType!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-63-02 · Catálogo / metastore
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /lakehouse/catalogs` (UC-63-02). */
export class RegisterCatalogDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de catalog type mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Motor del metastore, p. ej. `glue` o `hive`',
  })
  @IsString()
  @MaxLength(100)
  catalogType!: string;

  /**
   * Valor de metastore uri mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  metastoreUri!: string;

  /**
   * Valor de default format mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: STORAGE_FORMATS })
  @IsOptional()
  @IsIn(STORAGE_FORMATS)
  defaultFormat?: string;

  /**
   * Valor de default compression mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  defaultCompression?: string;
}

/**
 * Define el contrato validado para catalog response.
 */
export class CatalogResponseDto {
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
// UC-63-03 · Producto de datos y versión
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para quality rule.
 */
export class QualityRuleDto {
  /**
   * Valor de rule code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  ruleCode!: string;

  /**
   * Valor de dimension mantenido por la instancia.
   */
  @ApiProperty({ enum: QUALITY_DIMENSIONS })
  @IsIn(QUALITY_DIMENSIONS)
  dimension!: string;

  /**
   * Valor de expression mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Expresión declarativa de la regla',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  expression?: string;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiProperty({
    enum: RULE_SEVERITIES,
    description: '`blocking` cuarentena el dataset',
  })
  @IsIn(RULE_SEVERITIES)
  severity!: string;

  /**
   * Valor de threshold mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Código del producto; su clave natural con el tenant',
  })
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
   * Identificador asociado a owner team.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerTeamId?: string;

  /**
   * Valor de business purpose mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  businessPurpose?: string;

  /**
   * Valor de classification code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  classificationCode?: string;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si el producto contiene datos de paciente',
  })
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50, description: 'Versión que se publica' })
  @IsString()
  @MaxLength(50)
  version!: string;

  /**
   * Valor de contract schema json mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Contrato de esquema que el producto promete cumplir',
  })
  @IsObject()
  contractSchemaJson!: Record<string, unknown>;

  /**
   * Valor de quality slo json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Objetivos de calidad de los que salen las reglas',
  })
  @IsOptional()
  @IsObject()
  qualitySloJson?: Record<string, unknown>;

  /**
   * Valor de quality rules mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [QualityRuleDto], maxItems: MAX_QUALITY_RULES })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_QUALITY_RULES)
  @ValidateNested({ each: true })
  @Type(() => QualityRuleDto)
  qualityRules?: QualityRuleDto[];
}

/**
 * Define el contrato validado para product version response.
 */
export class ProductVersionResponseDto {
  /**
   * Identificador asociado a data product.
   */
  @ApiProperty({ format: 'uuid' })
  dataProductId!: string;

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
   * Identificador asociado a superseded version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión anterior que quedó superseded',
  })
  supersededVersionId?: string;

  /**
   * Valor de quality rules created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Reglas de calidad derivadas del SLO' })
  qualityRulesCreated!: number;
}

// ---------------------------------------------------------------------------
// UC-63-04 · Dataset y versión de esquema
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /lakehouse/datasets` (UC-63-04). */
export class RegisterDatasetDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a data product version.
   */
  @ApiProperty({ format: 'uuid', description: 'Versión de producto activa' })
  @IsUUID()
  dataProductVersionId!: string;

  /**
   * Identificador asociado a data lake zone.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  dataLakeZoneId!: string;

  /**
   * Identificador asociado a lakehouse catalog.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  lakehouseCatalogId!: string;

  /**
   * Valor de database name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  databaseName!: string;

  /**
   * Valor de table name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  tableName!: string;

  /**
   * Valor de storage format mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: STORAGE_FORMATS,
    description: 'Por omisión, el del catálogo',
  })
  @IsOptional()
  @IsIn(STORAGE_FORMATS)
  storageFormat?: string;

  /**
   * Valor de partition spec json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cómo se particiona la tabla' })
  @IsOptional()
  @IsObject()
  partitionSpecJson?: Record<string, unknown>;

  /**
   * Valor de source dataset code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceDatasetCode?: string;

  /**
   * Valor de schema json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Esquema inicial del dataset' })
  @IsObject()
  schemaJson!: Record<string, unknown>;

  /**
   * Valor de schema fingerprint mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Huella del esquema; identifica el contrato',
  })
  @IsString()
  @MaxLength(200)
  schemaFingerprint!: string;

  /**
   * Valor de compatibility mode mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: COMPATIBILITY_MODES, default: 'backward' })
  @IsOptional()
  @IsIn(COMPATIBILITY_MODES)
  compatibilityMode?: string;
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
   * Valor de database name mantenido por la instancia.
   */
  @ApiProperty()
  databaseName!: string;

  /**
   * Valor de table name mantenido por la instancia.
   */
  @ApiProperty()
  tableName!: string;

  /**
   * Valor de storage format mantenido por la instancia.
   */
  @ApiProperty()
  storageFormat!: string;

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
// UC-63-05 y 06 · Corrida de transformación con linaje
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para materialized file.
 */
export class MaterializedFileDto {
  /**
   * Identificador asociado a object manifest.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Manifiesto del objeto en el almacén',
  })
  @IsOptional()
  @IsUUID()
  objectManifestId?: string;

  /**
   * Valor de file format mantenido por la instancia.
   */
  @ApiProperty({ enum: STORAGE_FORMATS })
  @IsIn(STORAGE_FORMATS)
  fileFormat!: string;

  /**
   * Valor de row count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Filas del archivo; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  rowCount!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tamaño en bytes; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  sizeBytes!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Hash del contenido; el archivo es inmutable',
  })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  /**
   * Valor de min max statistics json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Mínimos y máximos por columna, para poda de particiones',
  })
  @IsOptional()
  @IsObject()
  minMaxStatisticsJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para materialized partition.
 */
export class MaterializedPartitionDto {
  /**
   * Valor de partition spec hash mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Huella de los valores de partición',
  })
  @IsString()
  @MaxLength(200)
  partitionSpecHash!: string;

  /**
   * Valor de partition values json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  partitionValuesJson?: Record<string, unknown>;

  /**
   * Valor de record count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Registros de la partición; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  recordCount!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tamaño en bytes; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  sizeBytes!: string;

  /**
   * Valor de min event at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  minEventAt?: string;

  /**
   * Valor de max event at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  maxEventAt?: string;

  /**
   * Valor de files mantenido por la instancia.
   */
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

  /**
   * Valor de source partition ids mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de source checkpoint mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Punto de la fuente hasta el que procesó; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  sourceCheckpoint?: string;

  /**
   * Valor de input record count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Registros leídos; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  inputRecordCount!: string;

  /**
   * Valor de output record count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Registros escritos; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  outputRecordCount!: string;

  /**
   * Valor de rejected record count mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Registros rechazados; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  rejectedRecordCount?: string;

  /**
   * Valor de partitions mantenido por la instancia.
   */
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

  /**
   * Valor de failed mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Cierra la corrida como fallida',
  })
  @IsOptional()
  @IsBoolean()
  failed?: boolean;
}

/**
 * Define el contrato validado para transformation run response.
 */
export class TransformationRunResponseDto {
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
   * Valor de partitions committed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Particiones nuevas materializadas' })
  partitionsCommitted!: number;

  /**
   * Valor de partitions skipped mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Particiones que ya existían con la misma huella',
  })
  partitionsSkipped!: number;

  /**
   * Valor de files written mantenido por la instancia.
   */
  @ApiProperty({ description: 'Archivos nuevos registrados' })
  filesWritten!: number;

  /**
   * Valor de lineage edges mantenido por la instancia.
   */
  @ApiProperty({ description: 'Aristas de linaje registradas (UC-63-06)' })
  lineageEdges!: number;

  /**
   * Valor de already running mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a target dataset.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Dataset destino, obligatoriamente en zona curated',
  })
  @IsUUID()
  targetDatasetId!: string;

  /**
   * Identificador asociado a deidentification profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Perfil de de-identificación aplicado',
  })
  @IsUUID()
  deidentificationProfileId!: string;

  /**
   * Identificador asociado a purpose concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Propósito de la de-identificación',
  })
  @IsUUID()
  purposeConceptId!: string;

  /**
   * Identificador asociado a consent directive.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Consentimiento que ampara el tratamiento',
  })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  /**
   * Identificador asociado a input manifest file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Manifiesto del lote de entrada',
  })
  @IsOptional()
  @IsUUID()
  inputManifestFileId?: string;

  /**
   * Valor de records processed mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Registros de-identificados; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  recordsProcessed!: string;

  /**
   * Valor de records rejected mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Registros rechazados; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  recordsRejected?: string;

  /**
   * Valor de partitions mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para curated ingestion response.
 */
export class CuratedIngestionResponseDto {
  /**
   * Identificador asociado a deidentification run.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Corrida de de-identificación registrada',
  })
  deidentificationRunId!: string;

  /**
   * Identificador asociado a target dataset.
   */
  @ApiProperty({ format: 'uuid' })
  targetDatasetId!: string;

  /**
   * Valor de partitions committed mantenido por la instancia.
   */
  @ApiProperty()
  partitionsCommitted!: number;

  /**
   * Valor de files written mantenido por la instancia.
   */
  @ApiProperty()
  filesWritten!: number;
}

// ---------------------------------------------------------------------------
// UC-63-08 · Corrida de calidad
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para quality finding.
 */
export class QualityFindingDto {
  /**
   * Valor de rule code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100, description: 'Código de la regla violada' })
  @IsString()
  @MaxLength(100)
  ruleCode!: string;

  /**
   * Identificador asociado a partition.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  partitionId?: string;

  /**
   * Valor de issue count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Registros que incumplen; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  issueCount!: string;

  /**
   * Identificador asociado a sample object manifest.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a transformation run.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Corrida de transformación evaluada',
  })
  @IsOptional()
  @IsUUID()
  transformationRunId?: string;

  /**
   * Valor de evaluated record count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Registros evaluados; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  evaluatedRecordCount!: string;

  /**
   * Valor de findings mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [QualityFindingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityFindingDto)
  findings?: QualityFindingDto[];
}

/**
 * Define el contrato validado para quality run response.
 */
export class QualityRunResponseDto {
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
   * Valor de evaluated record count mantenido por la instancia.
   */
  @ApiProperty()
  evaluatedRecordCount!: string;

  /**
   * Valor de failed record count mantenido por la instancia.
   */
  @ApiProperty()
  failedRecordCount!: string;

  /**
   * Valor de issues opened mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hallazgos abiertos' })
  issuesOpened!: number;

  /**
   * Valor de dataset quarantined mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de project code mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Código del proyecto; su clave natural con el tenant',
  })
  @IsString()
  @MaxLength(100)
  projectCode!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  /**
   * Valor de protocol reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  protocolReference?: string;

  /**
   * Identificador asociado a principal investigator.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  principalInvestigatorId!: string;

  /**
   * Valor de ethics approval reference mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Referencia de la aprobación ética',
  })
  @IsString()
  @MaxLength(200)
  ethicsApprovalReference!: string;

  /**
   * Valor de approved from mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Inicio de la ventana ética',
  })
  @IsISO8601()
  approvedFrom!: string;

  /**
   * Valor de approved to mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time', description: 'Fin de la ventana ética' })
  @IsISO8601()
  approvedTo!: string;

  /**
   * Valor de cohort code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  cohortCode!: string;

  /**
   * Valor de cohort version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  cohortVersion!: string;

  /**
   * Valor de inclusion expression mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  inclusionExpression?: string;

  /**
   * Valor de exclusion expression mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  exclusionExpression?: string;

  /**
   * Identificador asociado a deidentification profile.
   */
  @ApiProperty({
    format: 'uuid',
    description:
      'Perfil de de-identificación con el que se materializará el release',
  })
  @IsUUID()
  deidentificationProfileId!: string;
}

/**
 * Define el contrato validado para cohort response.
 */
export class CohortResponseDto {
  /**
   * Identificador asociado a research project.
   */
  @ApiProperty({ format: 'uuid' })
  researchProjectId!: string;

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
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty()
  version!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-63-10 · Solicitud de release
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /research/dataset-releases` (UC-63-10). */
export class RequestDatasetReleaseDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a research project.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  researchProjectId!: string;

  /**
   * Identificador asociado a data product version.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  dataProductVersionId!: string;

  /**
   * Identificador asociado a cohort definition.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  cohortDefinitionId!: string;

  /**
   * Valor de purpose of use code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  purposeOfUseCode!: string;
}

/**
 * Define el contrato validado para release request response.
 */
export class ReleaseRequestResponseDto {
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
   * Valor de requested at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  requestedAt!: string;
}

// ---------------------------------------------------------------------------
// UC-63-11 · Aprobar y materializar
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /research/dataset-releases/{id}/approve` (UC-63-11). */
export class ApproveDatasetReleaseDto {
  /**
   * Identificador asociado a purpose concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Propósito con el que corre la de-identificación',
  })
  @IsUUID()
  purposeConceptId!: string;

  /**
   * Valor de record count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Registros del manifiesto; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  recordCount!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Hash del contenido materializado',
  })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  /**
   * Identificador asociado a object manifest.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Manifiesto del objeto de-identificado',
  })
  @IsOptional()
  @IsUUID()
  objectManifestId?: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  schemaVersion?: string;

  /**
   * Valor de ttl days mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para release manifest response.
 */
export class ReleaseManifestResponseDto {
  /**
   * Identificador asociado a dataset release request.
   */
  @ApiProperty({ format: 'uuid' })
  datasetReleaseRequestId!: string;

  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a deidentification run.
   */
  @ApiProperty({ format: 'uuid' })
  deidentificationRunId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  /**
   * Valor de already released mantenido por la instancia.
   */
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
  /**
   * Valor de expired mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description:
      'Cierra por vencimiento del plazo en vez de por decisión de gobernanza',
  })
  @IsOptional()
  @IsBoolean()
  expired?: boolean;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Motivo; queda en el evento publicado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

/**
 * Define el contrato validado para revoke release response.
 */
export class RevokeReleaseResponseDto {
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
   * Valor de already closed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Verdadero si el release ya estaba cerrado' })
  alreadyClosed!: boolean;
}
