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
  @ApiProperty({ description: 'Tipo de equipo (concept id)', format: 'uuid' })
  @IsUUID()
  equipmentTypeConceptId!: string;

  @ApiPropertyOptional({ description: 'Fabricante', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Modelo', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  model?: string;

  @ApiPropertyOptional({ description: 'Nº de serie', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  serialNumber?: string;

  @ApiPropertyOptional({
    description: 'Modalidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  modalityConceptId?: string;

  @ApiPropertyOptional({
    description: 'Última calibración',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastCalibrationAt?: Date;

  @ApiPropertyOptional({
    description: 'Próxima calibración',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextCalibrationDueAt?: Date;

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
  @ApiPropertyOptional({ description: 'Fabricante', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Modelo', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  model?: string;

  @ApiPropertyOptional({
    description: 'Última calibración',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastCalibrationAt?: Date;

  @ApiPropertyOptional({
    description: 'Próxima calibración',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextCalibrationDueAt?: Date;

  @ApiPropertyOptional({
    description: 'Estado operativo (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  operationalStatusConceptId?: string;
}
