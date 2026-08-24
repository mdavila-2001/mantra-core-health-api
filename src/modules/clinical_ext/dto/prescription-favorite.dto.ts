import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /prescription-favorites` (Patch v4.1.7). */
export class CreatePrescriptionFavoriteDto {
  /**
   * Rótulo con el que el profesional reconoce el favorito en su lista.
   */
  @ApiProperty({
    description:
      'Rótulo del favorito, único dentro de la lista del profesional ' +
      '(p. ej. «ATB post extracción»)',
    maxLength: 120,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  /**
   * Identificador asociado a medication concept.
   */
  @ApiProperty({
    description: 'Medicamento codificado (terminology.catalog_concepts)',
    format: 'uuid',
  })
  @IsUUID()
  medicationConceptId!: string;

  /**
   * Identificador asociado a substance atc concept.
   */
  @ApiPropertyOptional({ description: 'Principio activo ATC', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  substanceAtcConceptId?: string;

  /**
   * Valor de dose text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Posología por defecto' })
  @IsOptional()
  @IsString()
  doseText?: string;

  /**
   * Identificador asociado a route concept.
   */
  @ApiPropertyOptional({
    description: 'Vía de administración por defecto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  routeConceptId?: string;

  /**
   * Valor de frequency text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Frecuencia por defecto' })
  @IsOptional()
  @IsString()
  frequencyText?: string;

  /**
   * Valor de quantity decimal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad por defecto' })
  @IsOptional()
  @IsNumber()
  quantityDecimal?: number;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({
    description: 'Unidad de la cantidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Valor de patient instructions text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Indicaciones al paciente por defecto, separadas de la posología',
  })
  @IsOptional()
  @IsString()
  patientInstructionsText?: string;
}

/** Un favorito de prescripción tal como se devuelve al profesional. */
export class PrescriptionFavoriteResponseDto {
  /**
   * Identificador de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Rótulo del favorito.
   */
  @ApiProperty()
  name!: string;

  /**
   * Identificador asociado a medication concept.
   */
  @ApiProperty({ format: 'uuid' })
  medicationConceptId!: string;

  /**
   * Identificador asociado a substance atc concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  substanceAtcConceptId?: string;

  /**
   * Posología por defecto.
   */
  @ApiPropertyOptional({ nullable: true })
  doseText?: string;

  /**
   * Identificador asociado a route concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  routeConceptId?: string;

  /**
   * Frecuencia por defecto.
   */
  @ApiPropertyOptional({ nullable: true })
  frequencyText?: string;

  /**
   * Cantidad por defecto.
   */
  @ApiPropertyOptional({ nullable: true })
  quantityDecimal?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  unitConceptId?: string;

  /**
   * Indicaciones al paciente por defecto.
   */
  @ApiPropertyOptional({ nullable: true })
  patientInstructionsText?: string;
}
