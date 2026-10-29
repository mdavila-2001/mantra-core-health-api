import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/** Cuerpo de `POST /diagnostic-unit-sites/{siteId}/equipment` (UC-23-09). */
export class CreateEquipmentDto {
  /**
   * Identificador asociado a equipment type concept.
   */
  @ApiProperty({ description: 'Tipo de equipo (concept id)', format: 'uuid' })
  @IsUUID()
  equipmentTypeConceptId!: string;

  /**
   * Valor de manufacturer mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fabricante', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturer?: string;

  /**
   * Valor de model mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Modelo', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  model?: string;

  /**
   * Valor de serial number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nº de serie', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  serialNumber?: string;

  /**
   * Identificador asociado a modality concept.
   */
  @ApiPropertyOptional({
    description: 'Modalidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  modalityConceptId?: string;

  /**
   * Valor de last calibration at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Última calibración',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastCalibrationAt?: Date;

  /**
   * Valor de next calibration due at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Próxima calibración',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextCalibrationDueAt?: Date;

  /**
   * Identificador asociado a operational status concept.
   */
  @ApiPropertyOptional({
    description: 'Estado operativo (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  operationalStatusConceptId?: string;
}

/**
 * Ubicación y estación DICOM en `PATCH /diagnostic-equipment/{id}` (F5a). Va aparte del DTO
 * base solo para documentarlo; `UpdateEquipmentDto` lo hereda.
 */
export class UpdateEquipmentLocationFields {
  /**
   * Sala donde está el equipo. `null` lo desubica. Tiene que ser un espacio del tenant, de la
   * misma sede que el sitio del equipo y de una función que aloje equipos (sala de imagen para
   * una modalidad).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'Sala donde está el equipo (misma sede, función que aloja equipos). null lo desubica',
  })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsUUID()
  careSpaceId?: string | null;

  /**
   * AE Title DICOM (1 a 16 caracteres imprimibles, sin barra invertida). `null` lo quita. La
   * validación fina la hace el servicio (422 `AE_TITLE_INVALID`, no 400).
   */
  @ApiPropertyOptional({
    nullable: true,
    description:
      'AE Title DICOM: 1 a 16 caracteres imprimibles, sin barra invertida. Único por sitio',
  })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(200)
  aeTitle?: string | null;

  /** Scheduled Station Name (0040,0010): hasta 16 caracteres. `null` lo quita. */
  @ApiPropertyOptional({
    nullable: true,
    description: 'Nombre de la estación DICOM (0040,0010), hasta 16 caracteres',
  })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(200)
  stationName?: string | null;

  /**
   * Reconoce las reservas futuras del equipo al sacarlo de servicio. Sin esto, el cambio a
   * mantenimiento o fuera de servicio con reservas es 409 `FUTURE_COMMITMENTS_CONFLICT`.
   */
  @ApiPropertyOptional({
    description:
      'Reconoce las reservas futuras al pasar el equipo a mantenimiento o fuera de servicio',
  })
  @IsOptional()
  @IsBoolean()
  acknowledgeConflicts?: boolean;
}

/** Cuerpo de `PATCH /diagnostic-equipment/{id}` (UC-23-09). */
export class UpdateEquipmentDto extends UpdateEquipmentLocationFields {
  /**
   * Valor de manufacturer mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fabricante', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturer?: string;

  /**
   * Valor de model mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Modelo', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  model?: string;

  /**
   * Valor de last calibration at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Última calibración',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastCalibrationAt?: Date;

  /**
   * Valor de next calibration due at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Próxima calibración',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextCalibrationDueAt?: Date;

  /**
   * Identificador asociado a operational status concept.
   */
  @ApiPropertyOptional({
    description: 'Estado operativo (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  operationalStatusConceptId?: string;
}

/** Cuerpo de `POST /diagnostic-equipment/{id}/resource` (F5a). */
export class LinkEquipmentResourceDto {
  /** Nombre del recurso agendable. Por omisión, fabricante y modelo del equipo. */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  /** Zona horaria IANA del recurso. */
  @ApiPropertyOptional({ description: 'Zona horaria IANA del recurso' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /** Estudios simultáneos que admite el equipo. */
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
