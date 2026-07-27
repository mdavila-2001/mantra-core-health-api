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
  @ApiProperty({
    description: 'Identificador de la carga en el proveedor',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  providerUploadId!: string;

  @ApiProperty({
    description: 'Clave de destino. Opaca: no debe llevar datos del paciente.',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  targetObjectKey!: string;

  @ApiProperty({
    description: 'Tamaño esperado en bytes; cadena por ser bigint',
    example: '10485760',
  })
  @IsNumberString({ no_symbols: true })
  expectedSizeBytes!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo caduca la carga a medias',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class UploadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  namespaceId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({
    description: 'true si esa carga del proveedor ya estaba iniciada',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-60-02 · Completar carga y materializar versión
// ---------------------------------------------------------------------------

export class EncryptionEnvelopeDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  algorithm!: string;

  @ApiProperty({
    description: 'Proveedor de gestión de claves',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  keyManagementProvider!: string;

  @ApiProperty({
    description: 'Clave de datos cifrada. Nunca la clave en claro.',
  })
  @IsString()
  encryptedDataKey!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  keyVersion!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  encryptionContextHash?: string;
}

/** Cuerpo de `POST /object-storage/uploads/{id}/complete` (UC-60-02). */
export class CompleteUploadDto {
  @ApiProperty({
    description: 'Identificador lógico del objeto en el espacio',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  logicalObjectId!: string;

  @ApiProperty({ description: 'Naturaleza del objeto', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  objectType!: string;

  @ApiProperty({
    description: 'SHA-256 del contenido subido',
    example: 'a'.repeat(64),
  })
  @Matches(SHA256_PATTERN, {
    message: 'sha256 debe ser un hexadecimal de 64 caracteres',
  })
  sha256!: string;

  @ApiProperty({ description: 'Tamaño recibido; debe cuadrar con el esperado' })
  @IsNumberString({ no_symbols: true })
  receivedSizeBytes!: string;

  @ApiProperty({
    description: 'Identificador de la versión en el proveedor',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  providerVersionId!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  etag!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  mimeType!: string;

  @ApiProperty({ description: 'URI del objeto en el proveedor' })
  @IsString()
  providerUri!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paciente al que pertenece, si aplica',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  compression?: string;

  @ApiPropertyOptional({
    description: 'Clase de almacenamiento; por defecto, la del espacio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageClass?: string;

  @ApiPropertyOptional({ type: EncryptionEnvelopeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EncryptionEnvelopeDto)
  encryption?: EncryptionEnvelopeDto;
}

export class ObjectVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  manifestId!: string;

  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty()
  sha256!: string;

  @ApiProperty({
    description: 'true si el manifiesto se creó en esta operación',
  })
  manifestCreated!: boolean;

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
  @ApiProperty({
    description: 'SHA-256 del contenido nuevo',
    example: 'b'.repeat(64),
  })
  @Matches(SHA256_PATTERN, {
    message: 'sha256 debe ser un hexadecimal de 64 caracteres',
  })
  sha256!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  providerVersionId!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  objectKey!: string;

  @ApiProperty()
  @IsNumberString({ no_symbols: true })
  sizeBytes!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  etag!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  mimeType!: string;

  @ApiProperty({ description: 'URI del objeto en el proveedor' })
  @IsString()
  providerUri!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  compression?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageClass?: string;

  @ApiPropertyOptional({ type: EncryptionEnvelopeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EncryptionEnvelopeDto)
  encryption?: EncryptionEnvelopeDto;
}

// ---------------------------------------------------------------------------
// UC-60-04 · Catálogo DICOM
// ---------------------------------------------------------------------------

export class DicomInstanceDto {
  @ApiProperty({ description: 'SOP Instance UID', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  sopInstanceUid!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Objeto ya materializado con el píxel',
  })
  @IsUUID()
  objectManifestId!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sopClassUid?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  instanceNumber?: number;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  transferSyntaxUid?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  frameCount?: number;

  @ApiPropertyOptional({
    description: 'Metadatos DICOM sin identificadores directos',
  })
  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;
}

export class DicomSeriesDto {
  @ApiProperty({ description: 'Series Instance UID', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  seriesInstanceUid!: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  modality?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  seriesNumber?: number;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bodyPartExamined?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  thumbnailObjectManifestId?: string;

  @ApiProperty({ type: [DicomInstanceDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DicomInstanceDto)
  instances!: DicomInstanceDto[];
}

/** Cuerpo de `POST /object-storage/dicom/studies/catalog` (UC-60-04). */
export class CatalogDicomStudyDto {
  @ApiProperty({ description: 'Study Instance UID', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  studyInstanceUid!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Estudio en el módulo de diagnóstico',
  })
  @IsOptional()
  @IsUUID()
  imagingStudyId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accessionNumber?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  studyDate?: string;

  @ApiProperty({ type: [DicomSeriesDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DicomSeriesDto)
  series!: DicomSeriesDto[];
}

export class CatalogDicomStudyResponseDto {
  @ApiProperty({ format: 'uuid' })
  studyId!: string;

  @ApiProperty()
  studyInstanceUid!: string;

  @ApiProperty({ description: 'Series del estudio tras catalogar' })
  seriesCount!: number;

  @ApiProperty({ description: 'Instancias del estudio tras catalogar' })
  instanceCount!: number;

  @ApiProperty({ description: 'Instancias nuevas registradas en esta llamada' })
  instancesAdded!: number;

  @ApiProperty({ description: 'Instancias que ya estaban catalogadas' })
  instancesSkipped!: number;

  @ApiProperty({ description: 'true si el estudio se creó en esta llamada' })
  studyCreated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-60-05 · Acceso DICOMweb
// ---------------------------------------------------------------------------

export class DicomInstanceAccessResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Registro del acceso' })
  accessLogId!: string;

  @ApiProperty()
  outcome!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Objeto que contiene el píxel',
  })
  objectManifestId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión vigente del objeto',
  })
  currentVersionId?: string;

  @ApiPropertyOptional({ description: 'Por qué se denegó' })
  denialReason?: string;
}

// ---------------------------------------------------------------------------
// UC-60-06 · Payload grande
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/large-payloads` (UC-60-06). */
export class RegisterLargePayloadDto {
  @ApiProperty({ format: 'uuid', description: 'Objeto ya materializado' })
  @IsUUID()
  objectManifestId!: string;

  @ApiProperty({ description: 'Naturaleza del payload', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  payloadType!: string;

  @ApiProperty({ description: 'Entidad de origen', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sourceEntityType!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceEntityId!: string;

  @ApiProperty({ description: 'Hash del contenido', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  @ApiProperty({
    description: 'Si lleva datos de paciente; gobierna su tratamiento',
  })
  @IsBoolean()
  containsPhi!: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class LargePayloadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  objectManifestId!: string;

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
  @ApiProperty({
    enum: RETENTION_LOCK_MODES,
    description:
      '`compliance` es WORM: no se acorta ni se libera antes de tiempo',
  })
  @IsIn(RETENTION_LOCK_MODES)
  lockMode!: RetentionLockMode;

  @ApiProperty({
    format: 'date-time',
    description: 'Hasta cuándo se retiene; debe ser futuro',
  })
  @IsISO8601()
  retainUntil!: string;

  @ApiPropertyOptional({
    description: 'Política que lo justifica',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyCode?: string;
}

export class RetentionLockResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  objectVersionId!: string;

  @ApiProperty()
  lockMode!: string;

  @ApiProperty({ format: 'date-time' })
  retainUntil!: string;

  @ApiProperty({ description: 'Ciclo de vida en el que queda el objeto' })
  lifecycleState!: string;
}

// ---------------------------------------------------------------------------
// UC-60-08 · Retención legal
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/versions/{versionId}/legal-holds` (UC-60-08). */
export class PlaceLegalHoldDto {
  @ApiProperty({ description: 'Referencia del caso legal', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  legalCaseReference!: string;
}

export class LegalHoldResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  objectVersionId!: string;

  @ApiProperty()
  holdState!: string;

  @ApiProperty({ description: 'Ciclo de vida en el que queda el objeto' })
  lifecycleState!: string;

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
  @ApiProperty({
    description: 'Propósito de uso; sin él no se emite',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  purposeOfUseCode!: string;

  @ApiPropertyOptional({
    description: 'Segundos de validez',
    default: 300,
    minimum: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  expiresInSeconds?: number;

  @ApiPropertyOptional({
    description: 'Study UID si el objeto es DICOM',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  studyInstanceUid?: string;
}

export class SignedUrlResponseDto {
  @ApiProperty({ format: 'uuid' })
  objectVersionId!: string;

  @ApiProperty({ description: 'URI del proveedor sobre la que se firma' })
  providerUri!: string;

  @ApiProperty({ format: 'date-time', description: 'Cuándo caduca el acceso' })
  expiresAt!: string;

  @ApiPropertyOptional({
    description: 'Versión de la clave con la que se descifra',
  })
  keyVersion?: string;

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
  @ApiProperty({
    description: 'SHA-256 recomputado sobre el objeto almacenado',
  })
  @Matches(SHA256_PATTERN, {
    message: 'actualHash debe ser un hexadecimal de 64 caracteres',
  })
  actualHash!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job de reparación si hay que repararlo',
  })
  @IsOptional()
  @IsUUID()
  repairJobId?: string;
}

export class IntegrityCheckResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description: 'Derivado de comparar el hash esperado con el recomputado',
  })
  status!: string;

  @ApiProperty()
  expectedHash!: string;

  @ApiProperty()
  actualHash!: string;

  @ApiProperty({ description: 'Ciclo de vida en el que queda el objeto' })
  lifecycleState!: string;
}

// ---------------------------------------------------------------------------
// UC-60-11 · Archivado en frío
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/archive-jobs/build` (UC-60-11). */
export class BuildArchiveJobDto {
  @ApiProperty({ format: 'uuid', description: 'Objeto que se archiva' })
  @IsUUID()
  objectManifestId!: string;

  @ApiProperty({ description: 'Naturaleza del archivado', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  archiveType!: string;

  @ApiProperty({ format: 'uuid', description: 'Espacio frío de destino' })
  @IsUUID()
  archiveNamespaceId!: string;

  @ApiProperty({
    description: 'Hash del lote; lo hace idempotente',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  manifestHash!: string;

  @ApiProperty({ description: 'URI de la copia fría' })
  @IsString()
  providerUri!: string;

  @ApiPropertyOptional({ description: 'Qué entra en el lote' })
  @IsOptional()
  @IsObject()
  sourceScopeJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Clase fría de destino',
    default: 'glacier',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageClass?: string;
}

export class ArchiveJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  objectManifestId!: string;

  @ApiProperty({
    description: 'Versiones movidas a frío; cadena por ser bigint',
  })
  recordCount!: string;

  @ApiProperty({ description: 'Ciclo de vida en el que queda el objeto' })
  lifecycleState!: string;

  @ApiProperty({ description: 'true si ese lote ya se había archivado' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-60-12 · Borrado gobernado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /object-storage/objects/{manifestId}/request-deletion` (UC-60-12). */
export class RequestDeletionDto {
  @ApiProperty({ description: 'Por qué se borra' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job que ejecutará el borrado',
  })
  @IsOptional()
  @IsUUID()
  requestedByJobId?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo se hace efectivo',
  })
  @IsOptional()
  @IsISO8601()
  effectiveAt?: string;
}

export class DeletionMarkerResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  objectManifestId!: string;

  @ApiProperty({ description: 'Ciclo de vida en el que queda el objeto' })
  lifecycleState!: string;

  @ApiProperty()
  verificationStatus!: string;

  @ApiProperty({ description: 'true si el borrado ya estaba solicitado' })
  duplicate!: boolean;
}
