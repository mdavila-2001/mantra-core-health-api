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
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { RETENTION_LOCK_MODE, type RetentionLockMode } from '../constants';

const RETENTION_LOCK_MODES = [
  RETENTION_LOCK_MODE.COMPLIANCE,
  RETENTION_LOCK_MODE.GOVERNANCE,
] as const;

/** Un SHA-256 en hexadecimal. */
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;

// ---------------------------------------------------------------------------
// UC-60-01 · Iniciar carga multiparte
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/namespaces/{code}/uploads/initiate` (UC-60-01). */
export class InitiateUploadDto {
  /**
   * Identificador asociado a provider upload.
   */
  @ApiProperty({
    description: 'Identificador de la carga en el proveedor',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  providerUploadId!: string;

  /**
   * Valor de target object key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave de destino. Opaca: no debe llevar datos del paciente.',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  targetObjectKey!: string;

  /**
   * Valor de expected size bytes mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tamaño esperado en bytes; cadena por ser bigint',
    example: '10485760',
  })
  @IsNumberString({ no_symbols: true })
  expectedSizeBytes!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo caduca la carga a medias',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

/**
 * Define el contrato validado para upload response.
 */
export class UploadResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a namespace.
   */
  @ApiProperty({ format: 'uuid' })
  namespaceId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si esa carga del proveedor ya estaba iniciada',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-60-02 · Completar carga y materializar versión
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para encryption envelope.
 */
export class EncryptionEnvelopeDto {
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
  @ApiProperty({
    description: 'Proveedor de gestión de claves',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  keyManagementProvider!: string;

  /**
   * Valor de encrypted data key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave de datos cifrada. Nunca la clave en claro.',
  })
  @IsString()
  encryptedDataKey!: string;

  /**
   * Valor de key version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  keyVersion!: string;

  /**
   * Valor de encryption context hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  encryptionContextHash?: string;
}

/** Cuerpo de `POST /object-storage/uploads/{id}/complete` (UC-60-02). */
export class CompleteUploadDto {
  /**
   * Identificador asociado a logical object.
   */
  @ApiProperty({
    description: 'Identificador lógico del objeto en el espacio',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  logicalObjectId!: string;

  /**
   * Valor de object type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Naturaleza del objeto', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  objectType!: string;

  /**
   * Valor de sha256 mantenido por la instancia.
   */
  @ApiProperty({
    description: 'SHA-256 del contenido subido',
    example: 'a'.repeat(64),
  })
  @Matches(SHA256_PATTERN, {
    message: 'sha256 debe ser un hexadecimal de 64 caracteres',
  })
  sha256!: string;

  /**
   * Valor de received size bytes mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tamaño recibido; debe cuadrar con el esperado' })
  @IsNumberString({ no_symbols: true })
  receivedSizeBytes!: string;

  /**
   * Identificador asociado a provider version.
   */
  @ApiProperty({
    description: 'Identificador de la versión en el proveedor',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  providerVersionId!: string;

  /**
   * Valor de etag mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  etag!: string;

  /**
   * Valor de mime type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  mimeType!: string;

  /**
   * Valor de provider uri mantenido por la instancia.
   */
  @ApiProperty({ description: 'URI del objeto en el proveedor' })
  @IsString()
  providerUri!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paciente al que pertenece, si aplica',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Valor de compression mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  compression?: string;

  /**
   * Valor de storage class mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Clase de almacenamiento; por defecto, la del espacio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageClass?: string;

  /**
   * Valor de encryption mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: EncryptionEnvelopeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EncryptionEnvelopeDto)
  encryption?: EncryptionEnvelopeDto;
}

/**
 * Define el contrato validado para object version response.
 */
export class ObjectVersionResponseDto {
  /**
   * Identificador asociado a manifest.
   */
  @ApiProperty({ format: 'uuid' })
  manifestId!: string;

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
   * Valor de sha256 mantenido por la instancia.
   */
  @ApiProperty()
  sha256!: string;

  /**
   * Valor de manifest created mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el manifiesto se creó en esta operación',
  })
  manifestCreated!: boolean;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si ese contenido ya estaba versionado y no se duplicó',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-60-03 · Nueva versión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/objects/{manifestId}/versions` (UC-60-03). */
export class CreateVersionDto {
  /**
   * Valor de sha256 mantenido por la instancia.
   */
  @ApiProperty({
    description: 'SHA-256 del contenido nuevo',
    example: 'b'.repeat(64),
  })
  @Matches(SHA256_PATTERN, {
    message: 'sha256 debe ser un hexadecimal de 64 caracteres',
  })
  sha256!: string;

  /**
   * Identificador asociado a provider version.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  providerVersionId!: string;

  /**
   * Valor de object key mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  objectKey!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiProperty()
  @IsNumberString({ no_symbols: true })
  sizeBytes!: string;

  /**
   * Valor de etag mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  etag!: string;

  /**
   * Valor de mime type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  mimeType!: string;

  /**
   * Valor de provider uri mantenido por la instancia.
   */
  @ApiProperty({ description: 'URI del objeto en el proveedor' })
  @IsString()
  providerUri!: string;

  /**
   * Valor de compression mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  compression?: string;

  /**
   * Valor de storage class mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageClass?: string;

  /**
   * Valor de encryption mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: EncryptionEnvelopeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EncryptionEnvelopeDto)
  encryption?: EncryptionEnvelopeDto;
}

// ---------------------------------------------------------------------------
// UC-60-04 · Catálogo DICOM
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para dicom instance.
 */
export class DicomInstanceDto {
  /**
   * Valor de sop instance uid mantenido por la instancia.
   */
  @ApiProperty({ description: 'SOP Instance UID', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  sopInstanceUid!: string;

  /**
   * Identificador asociado a object manifest.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Objeto ya materializado con el píxel',
  })
  @IsUUID()
  objectManifestId!: string;

  /**
   * Valor de sop class uid mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sopClassUid?: string;

  /**
   * Valor de instance number mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  instanceNumber?: number;

  /**
   * Valor de transfer syntax uid mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  transferSyntaxUid?: string;

  /**
   * Valor de frame count mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  frameCount?: number;

  /**
   * Valor de metadata json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Metadatos DICOM sin identificadores directos',
  })
  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para dicom series.
 */
export class DicomSeriesDto {
  /**
   * Valor de series instance uid mantenido por la instancia.
   */
  @ApiProperty({ description: 'Series Instance UID', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  seriesInstanceUid!: string;

  /**
   * Valor de modality mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  modality?: string;

  /**
   * Valor de series number mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  seriesNumber?: number;

  /**
   * Valor de body part examined mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bodyPartExamined?: string;

  /**
   * Identificador asociado a thumbnail object manifest.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  thumbnailObjectManifestId?: string;

  /**
   * Valor de instances mantenido por la instancia.
   */
  @ApiProperty({ type: [DicomInstanceDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DicomInstanceDto)
  instances!: DicomInstanceDto[];
}

/** Cuerpo de `POST /object-storage/dicom/studies/catalog` (UC-60-04). */
export class CatalogDicomStudyDto {
  /**
   * Valor de study instance uid mantenido por la instancia.
   */
  @ApiProperty({ description: 'Study Instance UID', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  studyInstanceUid!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a imaging study.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Estudio en el módulo de diagnóstico',
  })
  @IsOptional()
  @IsUUID()
  imagingStudyId?: string;

  /**
   * Valor de accession number mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accessionNumber?: string;

  /**
   * Valor de study date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  studyDate?: string;

  /**
   * Valor de series mantenido por la instancia.
   */
  @ApiProperty({ type: [DicomSeriesDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DicomSeriesDto)
  series!: DicomSeriesDto[];
}

/**
 * Define el contrato validado para catalog dicom study response.
 */
export class CatalogDicomStudyResponseDto {
  /**
   * Identificador asociado a study.
   */
  @ApiProperty({ format: 'uuid' })
  studyId!: string;

  /**
   * Valor de study instance uid mantenido por la instancia.
   */
  @ApiProperty()
  studyInstanceUid!: string;

  /**
   * Valor de series count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Series del estudio tras catalogar' })
  seriesCount!: number;

  /**
   * Valor de instance count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Instancias del estudio tras catalogar' })
  instanceCount!: number;

  /**
   * Valor de instances added mantenido por la instancia.
   */
  @ApiProperty({ description: 'Instancias nuevas registradas en esta llamada' })
  instancesAdded!: number;

  /**
   * Valor de instances skipped mantenido por la instancia.
   */
  @ApiProperty({ description: 'Instancias que ya estaban catalogadas' })
  instancesSkipped!: number;

  /**
   * Valor de study created mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el estudio se creó en esta llamada' })
  studyCreated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-60-05 · Acceso DICOMweb
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para dicom instance access response.
 */
export class DicomInstanceAccessResponseDto {
  /**
   * Identificador asociado a access log.
   */
  @ApiProperty({ format: 'uuid', description: 'Registro del acceso' })
  accessLogId!: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty()
  outcome!: string;

  /**
   * Identificador asociado a object manifest.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Objeto que contiene el píxel',
  })
  objectManifestId?: string;

  /**
   * Identificador asociado a current version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión vigente del objeto',
  })
  currentVersionId?: string;

  /**
   * Valor de denial reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Por qué se denegó' })
  denialReason?: string;
}

// ---------------------------------------------------------------------------
// UC-60-06 · Payload grande
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/large-payloads` (UC-60-06). */
export class RegisterLargePayloadDto {
  /**
   * Identificador asociado a object manifest.
   */
  @ApiProperty({ format: 'uuid', description: 'Objeto ya materializado' })
  @IsUUID()
  objectManifestId!: string;

  /**
   * Valor de payload type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Naturaleza del payload', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  payloadType!: string;

  /**
   * Valor de source entity type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entidad de origen', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sourceEntityType!: string;

  /**
   * Identificador asociado a source entity.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceEntityId!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hash del contenido', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Si lleva datos de paciente; gobierna su tratamiento',
  })
  @IsBoolean()
  containsPhi!: boolean;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

/**
 * Define el contrato validado para large payload response.
 */
export class LargePayloadResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a object manifest.
   */
  @ApiProperty({ format: 'uuid' })
  objectManifestId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si ese origen y tipo ya estaban registrados',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-60-07 · Retención WORM
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/versions/{versionId}/retention-lock` (UC-60-07). */
export class ApplyRetentionLockDto {
  /**
   * Valor de lock mode mantenido por la instancia.
   */
  @ApiProperty({
    enum: RETENTION_LOCK_MODES,
    description:
      '`compliance` es WORM: no se acorta ni se libera antes de tiempo',
  })
  @IsIn(RETENTION_LOCK_MODES)
  lockMode!: RetentionLockMode;

  /**
   * Valor de retain until mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Hasta cuándo se retiene; debe ser futuro',
  })
  @IsISO8601()
  retainUntil!: string;

  /**
   * Valor de policy code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Política que lo justifica',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyCode?: string;
}

/**
 * Define el contrato validado para retention lock response.
 */
export class RetentionLockResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a object version.
   */
  @ApiProperty({ format: 'uuid' })
  objectVersionId!: string;

  /**
   * Valor de lock mode mantenido por la instancia.
   */
  @ApiProperty()
  lockMode!: string;

  /**
   * Valor de retain until mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  retainUntil!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Ciclo de vida en el que queda el objeto' })
  lifecycleState!: string;
}

// ---------------------------------------------------------------------------
// UC-60-08 · Retención legal
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/versions/{versionId}/legal-holds` (UC-60-08). */
export class PlaceLegalHoldDto {
  /**
   * Valor de legal case reference mantenido por la instancia.
   */
  @ApiProperty({ description: 'Referencia del caso legal', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  legalCaseReference!: string;
}

/**
 * Define el contrato validado para legal hold response.
 */
export class LegalHoldResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a object version.
   */
  @ApiProperty({ format: 'uuid' })
  objectVersionId!: string;

  /**
   * Valor de hold state mantenido por la instancia.
   */
  @ApiProperty()
  holdState!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Ciclo de vida en el que queda el objeto' })
  lifecycleState!: string;

  /**
   * Valor de active holds mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Retenciones legales que siguen vivas sobre la versión',
  })
  activeHolds!: number;
}

// ---------------------------------------------------------------------------
// UC-60-09 · URL firmada
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/versions/{versionId}/signed-url` (UC-60-09). */
export class IssueSignedUrlDto {
  /**
   * Valor de purpose of use code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Propósito de uso; sin él no se emite',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  purposeOfUseCode!: string;

  /**
   * Valor de expires in seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Segundos de validez',
    default: 300,
    minimum: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  expiresInSeconds?: number;

  /**
   * Valor de study instance uid mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Study UID si el objeto es DICOM',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  studyInstanceUid?: string;
}

/**
 * Define el contrato validado para signed url response.
 */
export class SignedUrlResponseDto {
  /**
   * Identificador asociado a object version.
   */
  @ApiProperty({ format: 'uuid' })
  objectVersionId!: string;

  /**
   * Valor de provider uri mantenido por la instancia.
   */
  @ApiProperty({ description: 'URI del proveedor sobre la que se firma' })
  providerUri!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time', description: 'Cuándo caduca el acceso' })
  expiresAt!: string;

  /**
   * Valor de key version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión de la clave con la que se descifra',
  })
  keyVersion?: string;

  /**
   * Identificador asociado a access log.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Registro del acceso si el objeto es DICOM',
  })
  accessLogId?: string;
}

// ---------------------------------------------------------------------------
// UC-60-10 · Integridad
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/versions/{versionId}/integrity-checks` (UC-60-10). */
export class RecordIntegrityCheckDto {
  /**
   * Valor de actual hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'SHA-256 recomputado sobre el objeto almacenado',
  })
  @Matches(SHA256_PATTERN, {
    message: 'actualHash debe ser un hexadecimal de 64 caracteres',
  })
  actualHash!: string;

  /**
   * Identificador asociado a repair job.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job de reparación si hay que repararlo',
  })
  @IsOptional()
  @IsUUID()
  repairJobId?: string;
}

/**
 * Define el contrato validado para integrity check response.
 */
export class IntegrityCheckResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Derivado de comparar el hash esperado con el recomputado',
  })
  status!: string;

  /**
   * Valor de expected hash mantenido por la instancia.
   */
  @ApiProperty()
  expectedHash!: string;

  /**
   * Valor de actual hash mantenido por la instancia.
   */
  @ApiProperty()
  actualHash!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Ciclo de vida en el que queda el objeto' })
  lifecycleState!: string;
}

// ---------------------------------------------------------------------------
// UC-60-11 · Archivado en frío
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/archive-jobs/build` (UC-60-11). */
export class BuildArchiveJobDto {
  /**
   * Identificador asociado a object manifest.
   */
  @ApiProperty({ format: 'uuid', description: 'Objeto que se archiva' })
  @IsUUID()
  objectManifestId!: string;

  /**
   * Valor de archive type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Naturaleza del archivado', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  archiveType!: string;

  /**
   * Identificador asociado a archive namespace.
   */
  @ApiProperty({ format: 'uuid', description: 'Espacio frío de destino' })
  @IsUUID()
  archiveNamespaceId!: string;

  /**
   * Valor de manifest hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hash del lote; lo hace idempotente',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  manifestHash!: string;

  /**
   * Valor de provider uri mantenido por la instancia.
   */
  @ApiProperty({ description: 'URI de la copia fría' })
  @IsString()
  providerUri!: string;

  /**
   * Valor de source scope json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Qué entra en el lote' })
  @IsOptional()
  @IsObject()
  sourceScopeJson?: Record<string, unknown>;

  /**
   * Valor de storage class mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Clase fría de destino',
    default: 'glacier',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageClass?: string;
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
   * Identificador asociado a object manifest.
   */
  @ApiProperty({ format: 'uuid' })
  objectManifestId!: string;

  /**
   * Valor de record count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Versiones movidas a frío; cadena por ser bigint',
  })
  recordCount!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Ciclo de vida en el que queda el objeto' })
  lifecycleState!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si ese lote ya se había archivado' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-60-12 · Borrado gobernado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/objects/{manifestId}/request-deletion` (UC-60-12). */
export class RequestDeletionDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se borra' })
  @IsString()
  reason!: string;

  /**
   * Identificador asociado a requested by job.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job que ejecutará el borrado',
  })
  @IsOptional()
  @IsUUID()
  requestedByJobId?: string;

  /**
   * Valor de effective at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo se hace efectivo',
  })
  @IsOptional()
  @IsISO8601()
  effectiveAt?: string;
}

/**
 * Define el contrato validado para deletion marker response.
 */
export class DeletionMarkerResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a object manifest.
   */
  @ApiProperty({ format: 'uuid' })
  objectManifestId!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Ciclo de vida en el que queda el objeto' })
  lifecycleState!: string;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty()
  verificationStatus!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el borrado ya estaba solicitado' })
  duplicate!: boolean;
}
