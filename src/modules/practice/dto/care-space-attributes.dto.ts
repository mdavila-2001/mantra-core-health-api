import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Atributos descriptivos y técnicos de un espacio (F1, contrato §1.1 y §3).
 *
 * Los `*Code` son códigos del catálogo (`GET /practice/infrastructure-catalog`),
 * no uuids: el cliente no maneja ids de conceptos. En un PATCH, `null` borra
 * el valor y ausente lo deja como está.
 */
export class CareSpaceAttributesDto {
  @ApiPropertyOptional({ description: 'Descripción libre', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({ description: 'Capacidad (nº de plazas)', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number | null;

  @ApiPropertyOptional({ description: 'Piso (negativo = subsuelo)' })
  @IsOptional()
  @IsInt()
  @Min(-20)
  @Max(300)
  floorNumber?: number | null;

  @ApiPropertyOptional({ description: 'Superficie útil en m²', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999)
  areaM2?: number | null;

  @ApiPropertyOptional({ description: 'Asepsia (ASEPSIS_*)' })
  @IsOptional()
  @IsString()
  asepsisCode?: string | null;

  @ApiPropertyOptional({ description: 'Presión relativa (PRESSURE_*)' })
  @IsOptional()
  @IsString()
  pressureCode?: string | null;

  @ApiPropertyOptional({ description: 'Renovaciones de aire por hora (ACH)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999)
  airChangesPerHour?: number | null;

  @ApiPropertyOptional({
    description: 'Fecha de validación HVAC (YYYY-MM-DD)',
    format: 'date',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  hvacValidatedOn?: string | null;

  @ApiPropertyOptional({ description: 'Restricción de sexo (SEX_*)' })
  @IsOptional()
  @IsString()
  sexRestrictionCode?: string | null;

  @ApiPropertyOptional({ description: 'Grupo etario (AGE_*)' })
  @IsOptional()
  @IsString()
  ageGroupCode?: string | null;

  @ApiPropertyOptional({ description: 'Categoría de cama (BED_CAT_*)' })
  @IsOptional()
  @IsString()
  bedCategoryCode?: string | null;

  @ApiPropertyOptional({ description: 'Cama censable (cuenta para el censo)' })
  @IsOptional()
  @IsBoolean()
  censable?: boolean | null;

  @ApiPropertyOptional({ description: 'Minutos de preparación', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  prepMinutes?: number | null;

  @ApiPropertyOptional({ description: 'Minutos de limpieza', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  cleanupMinutes?: number | null;

  @ApiPropertyOptional({ description: 'GS1 GLN (13 dígitos)' })
  @IsOptional()
  @Matches(/^\d{13}$/)
  gln?: string | null;
}
