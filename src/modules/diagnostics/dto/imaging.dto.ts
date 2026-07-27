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
  @ApiProperty({ description: 'URI base del endpoint (STOW-RS/WADO)' })
  @IsString()
  @MaxLength(2000)
  baseUri!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de endpoint (concept id)',
  })
  @IsOptional()
  @IsUUID()
  endpointTypeConceptId?: string;

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
  @ApiProperty({ description: 'DICOM SOP Instance UID' })
  @IsString()
  @MaxLength(200)
  dicomSopInstanceUid!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'SOP Class (concept id)',
  })
  @IsOptional()
  @IsUUID()
  sopClassConceptId?: string;

  @ApiPropertyOptional({ description: 'Nº de instancia' })
  @IsOptional()
  @IsInt()
  @Min(0)
  instanceNumber?: number;

  @ApiPropertyOptional({ description: 'URI de recuperación' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  retrievalUri?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Backend de almacenamiento del objeto binario',
  })
  @IsOptional()
  @IsUUID()
  storageBackendId?: string;

  @ApiPropertyOptional({
    description: 'Object key en el backend (requerido si hay backend)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  objectKey?: string;

  @ApiPropertyOptional({ description: 'Hash del contenido del objeto' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contentHash?: string;

  @ApiPropertyOptional({ description: 'Tamaño en bytes' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sizeBytes?: string;
}

/** Serie dentro de un estudio (STOW-RS). */
export class StowSeriesDto {
  @ApiProperty({ description: 'DICOM Series Instance UID' })
  @IsString()
  @MaxLength(200)
  dicomSeriesInstanceUid!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Modalidad de la serie (concept id)',
  })
  @IsOptional()
  @IsUUID()
  modalityConceptId?: string;

  @ApiPropertyOptional({ description: 'Nº de serie' })
  @IsOptional()
  @IsInt()
  @Min(0)
  seriesNumber?: number;

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
  @ApiProperty({ format: 'uuid', description: 'Paciente del estudio' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid', description: 'Endpoint DICOM activo' })
  @IsUUID()
  imagingEndpointId!: string;

  @ApiProperty({ description: 'DICOM Study Instance UID' })
  @IsString()
  @MaxLength(200)
  dicomStudyInstanceUid!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant custodio (por defecto el del token)',
  })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiPropertyOptional({ description: 'Nº de acesión del estudio' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  accessionNumber?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  @ApiProperty({ type: [StowSeriesDto], description: 'Series del estudio' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StowSeriesDto)
  series!: StowSeriesDto[];
}

/** Cuerpo de `POST /diagnostics/imaging-studies/{id}/dose-events` (UC-20-13). */
export class RecordDoseEventDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Serie de imagen relacionada',
  })
  @IsOptional()
  @IsUUID()
  imagingSeriesId?: string;

  @ApiPropertyOptional({ description: 'Dose Length Product' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  doseLengthProduct?: string;

  @ApiPropertyOptional({ description: 'CTDI' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  computedTomographyDoseIndex?: string;

  @ApiPropertyOptional({ description: 'Dose Area Product' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  doseAreaProduct?: string;

  @ApiPropertyOptional({ description: 'Dosis efectiva (mSv)' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  effectiveDoseMsv?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Unidad de dosis (concept id)',
  })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  @ApiPropertyOptional({
    description: 'SOP Instance UID de origen (evita doble conteo)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceSopInstanceUid?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Dispositivo/modalidad (device id)',
  })
  @IsOptional()
  @IsUUID()
  deviceId?: string;
}
