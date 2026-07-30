import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Cuerpo de `POST /diagnostics/imaging-endpoints` (soporte: alta de endpoint DICOM). */
export class CreateImagingEndpointDto {
  /**
   * Valor de base uri mantenido por la instancia.
   */
  @ApiProperty({ description: 'URI base del endpoint (STOW-RS/WADO)' })
  @IsString()
  @MaxLength(2000)
  baseUri!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a endpoint type concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de endpoint (concept id)',
  })
  @IsOptional()
  @IsUUID()
  endpointTypeConceptId?: string;

  /**
   * Identificador asociado a storage region concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Región de almacenamiento (concept id)',
  })
  @IsOptional()
  @IsUUID()
  storageRegionConceptId?: string;
}

/** Instancia SOP dentro de una serie (STOW-RS). */
export class StowInstanceDto {
  /**
   * Valor de dicom sop instance uid mantenido por la instancia.
   */
  @ApiProperty({ description: 'DICOM SOP Instance UID' })
  @IsString()
  @MaxLength(200)
  dicomSopInstanceUid!: string;

  /**
   * Identificador asociado a sop class concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'SOP Class (concept id)',
  })
  @IsOptional()
  @IsUUID()
  sopClassConceptId?: string;

  /**
   * Valor de instance number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nº de instancia' })
  @IsOptional()
  @IsInt()
  @Min(0)
  instanceNumber?: number;

  /**
   * Valor de retrieval uri mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'URI de recuperación' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  retrievalUri?: string;

  /**
   * Identificador asociado a storage backend.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Backend de almacenamiento del objeto binario',
  })
  @IsOptional()
  @IsUUID()
  storageBackendId?: string;

  /**
   * Valor de object key mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Object key en el backend (requerido si hay backend)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  objectKey?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Hash del contenido del objeto' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contentHash?: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tamaño en bytes' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sizeBytes?: string;
}

/** Serie dentro de un estudio (STOW-RS). */
export class StowSeriesDto {
  /**
   * Valor de dicom series instance uid mantenido por la instancia.
   */
  @ApiProperty({ description: 'DICOM Series Instance UID' })
  @IsString()
  @MaxLength(200)
  dicomSeriesInstanceUid!: string;

  /**
   * Identificador asociado a modality concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Modalidad de la serie (concept id)',
  })
  @IsOptional()
  @IsUUID()
  modalityConceptId?: string;

  /**
   * Valor de series number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nº de serie' })
  @IsOptional()
  @IsInt()
  @Min(0)
  seriesNumber?: number;

  /**
   * Valor de instances mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [StowInstanceDto],
    description: 'Instancias SOP de la serie',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StowInstanceDto)
  instances?: StowInstanceDto[];
}

/** Cuerpo de `POST /dicomweb/studies` (UC-20-11, STOW-RS). */
export class StoreImagingStudyDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Paciente del estudio' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a imaging endpoint.
   */
  @ApiProperty({ format: 'uuid', description: 'Endpoint DICOM activo' })
  @IsUUID()
  imagingEndpointId!: string;

  /**
   * Valor de dicom study instance uid mantenido por la instancia.
   */
  @ApiProperty({ description: 'DICOM Study Instance UID' })
  @IsString()
  @MaxLength(200)
  dicomStudyInstanceUid!: string;

  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant custodio (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  /**
   * Valor de accession number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nº de acesión del estudio' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  accessionNumber?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a service request.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  /**
   * Valor de series mantenido por la instancia.
   */
  @ApiProperty({ type: [StowSeriesDto], description: 'Series del estudio' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StowSeriesDto)
  series!: StowSeriesDto[];
}

/** Cuerpo de `POST /diagnostics/imaging-studies/{id}/dose-events` (UC-20-13). */
export class RecordDoseEventDto {
  /**
   * Identificador asociado a imaging series.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Serie de imagen relacionada',
  })
  @IsOptional()
  @IsUUID()
  imagingSeriesId?: string;

  /**
   * Valor de dose length product mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dose Length Product' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  doseLengthProduct?: string;

  /**
   * Valor de computed tomography dose index mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'CTDI' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  computedTomographyDoseIndex?: string;

  /**
   * Valor de dose area product mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dose Area Product' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  doseAreaProduct?: string;

  /**
   * Valor de effective dose msv mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Dosis efectiva (mSv)' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  effectiveDoseMsv?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Unidad de dosis (concept id)',
  })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Valor de source sop instance uid mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'SOP Instance UID de origen (evita doble conteo)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceSopInstanceUid?: string;

  /**
   * Identificador asociado a device.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Dispositivo/modalidad (device id)',
  })
  @IsOptional()
  @IsUUID()
  deviceId?: string;
}
