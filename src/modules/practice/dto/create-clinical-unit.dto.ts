import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /sites/{siteId}/clinical-units` (UC-14-04). */
export class CreateClinicalUnitDto {
  /**
   * Identificador asociado a parent unit.
   */
  @ApiPropertyOptional({
    description: 'Unidad padre (misma sede)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentUnitId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único dentro de la sede',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre de la unidad', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a unit type concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de tipo de unidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  unitTypeConceptId?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de especialidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Identificador asociado a service mode concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de modo de servicio',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceModeConceptId?: string;
}
