import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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

/** Cuerpo de `PATCH /diagnostic-equipment/{id}` (UC-23-09). */
export class UpdateEquipmentDto {
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
