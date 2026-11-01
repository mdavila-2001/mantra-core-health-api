import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

// ---------------------------------------------------------------------------
// UC-53-06 · Plan de anestesia
// ---------------------------------------------------------------------------

/** Tipo de anestesia planificada. */
export type AnesthesiaType = 'GENERAL' | 'REGIONAL' | 'LOCAL' | 'SEDATION';
export const ANESTHESIA_TYPES = [
  'GENERAL',
  'REGIONAL',
  'LOCAL',
  'SEDATION',
] as const;

/** Plan de vía aérea. */
export type AirwayPlan = 'ETT' | 'LMA' | 'MASK';
export const AIRWAY_PLANS = ['ETT', 'LMA', 'MASK'] as const;

/** Clase de Mallampati observada. */
export type MallampatiClass = 'I' | 'II' | 'III' | 'IV';
export const MALLAMPATI_CLASSES = ['I', 'II', 'III', 'IV'] as const;

/**
 * Define el contrato validado para airway assessment.
 */
export class AirwayAssessmentDto {
  /**
   * Identificador asociado a assessed by profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assessedByProfileId!: string;

  /**
   * Valor de mallampati mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: MALLAMPATI_CLASSES })
  @IsOptional()
  @IsIn(MALLAMPATI_CLASSES)
  mallampati?: MallampatiClass;

  /**
   * Valor de mouth opening mm mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Apertura bucal en milímetros' })
  @IsOptional()
  @IsNumberString()
  mouthOpeningMm?: string;

  /**
   * Valor de thyromental distance mm mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Distancia tiromentoniana en milímetros',
  })
  @IsOptional()
  @IsNumberString()
  thyromentalDistanceMm?: string;

  /**
   * Valor de difficult airway expected mantenido por la instancia.
   */
  @ApiProperty({ description: 'Se anticipa vía aérea difícil' })
  @IsBoolean()
  difficultAirwayExpected!: boolean;

  /**
   * Valor de rescue plan text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Plan de rescate; obligatorio si se anticipa vía aérea difícil',
  })
  @IsOptional()
  @IsString()
  rescuePlanText?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/anesthesia-plans` (UC-53-06). */
export class CreateAnesthesiaPlanDto {
  /**
   * Identificador asociado a anesthesiologist profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  anesthesiologistProfileId!: string;

  /**
   * Valor de anesthesia type mantenido por la instancia.
   */
  @ApiProperty({ enum: ANESTHESIA_TYPES })
  @IsIn(ANESTHESIA_TYPES)
  anesthesiaType!: AnesthesiaType;

  /**
   * Valor de airway plan mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: AIRWAY_PLANS })
  @IsOptional()
  @IsIn(AIRWAY_PLANS)
  airwayPlan?: AirwayPlan;

  /**
   * Valor de monitoring plan json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Monitorización planificada' })
  @IsOptional()
  @IsObject()
  monitoringPlanJson?: Record<string, unknown>;

  /**
   * Valor de medications plan json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Medicación planificada' })
  @IsOptional()
  @IsObject()
  medicationsPlanJson?: Record<string, unknown>;

  /**
   * Valor de postoperative analgesia plan text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postoperativeAnalgesiaPlanText?: string;

  /**
   * Valor de airway assessment mantenido por la instancia.
   */
  @ApiProperty({
    type: AirwayAssessmentDto,
    description: 'Valoración de vía aérea',
  })
  @ValidateNested()
  @Type(() => AirwayAssessmentDto)
  airwayAssessment!: AirwayAssessmentDto;
}

/**
 * Define el contrato validado para anesthesia plan response.
 */
export class AnesthesiaPlanResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a airway assessment.
   */
  @ApiProperty({ format: 'uuid' })
  airwayAssessmentId!: string;

  /**
   * Valor de difficult airway expected mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se anticipa vía aérea difícil' })
  difficultAirwayExpected!: boolean;
}

/**
 * Define el contrato validado para approve plan response.
 */
export class ApprovePlanResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a anesthesiologist profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Anestesiólogo asignado al caso',
  })
  anesthesiologistProfileId!: string;
}
