import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

// ---------------------------------------------------------------------------
// UC-53-03 · Valoración preoperatoria
// ---------------------------------------------------------------------------

/** Aptitud del paciente para la cirugía. */
export type FitnessStatus = 'FIT' | 'FIT_WITH_CAUTION' | 'UNFIT';
export const FITNESS_STATUSES = ['FIT', 'FIT_WITH_CAUTION', 'UNFIT'] as const;

/** Clase ASA del paciente. */
export type AsaClass = 'I' | 'II' | 'III' | 'IV' | 'V';
export const ASA_CLASSES = ['I', 'II', 'III', 'IV', 'V'] as const;

/** Modelo con el que se calcula la puntuación de riesgo. */
export type RiskModel = 'ASA' | 'RCRI' | 'APFEL';
export const RISK_MODELS = ['ASA', 'RCRI', 'APFEL'] as const;

/**
 * Define el contrato validado para risk score.
 */
export class RiskScoreDto {
  /**
   * Valor de model mantenido por la instancia.
   */
  @ApiProperty({ enum: RISK_MODELS })
  @IsIn(RISK_MODELS)
  model!: RiskModel;

  /**
   * Valor de model version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión del modelo aplicada', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  modelVersion!: string;

  /**
   * Valor de score value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Puntuación obtenida' })
  @IsNumberString()
  scoreValue!: string;

  /**
   * Valor de inputs json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Entradas con las que se calculó' })
  @IsOptional()
  @IsObject()
  inputsJson?: Record<string, unknown>;

  /**
   * Valor de interpretation text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interpretationText?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/preoperative-assessments` (UC-53-03). */
export class CreatePreopAssessmentDto {
  /**
   * Valor de assessment type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['ANESTHESIA', 'SURGICAL'] })
  @IsIn(['ANESTHESIA', 'SURGICAL'])
  assessmentType!: 'ANESTHESIA' | 'SURGICAL';

  /**
   * Identificador asociado a assessed by profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Profesional que valora' })
  @IsUUID()
  assessedByProfileId!: string;

  /**
   * Valor de fitness status mantenido por la instancia.
   */
  @ApiProperty({ enum: FITNESS_STATUSES })
  @IsIn(FITNESS_STATUSES)
  fitnessStatus!: FitnessStatus;

  /**
   * Valor de asa class mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ASA_CLASSES })
  @IsOptional()
  @IsIn(ASA_CLASSES)
  asaClass?: AsaClass;

  /**
   * Valor de allergies reviewed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Se revisaron las alergias del paciente' })
  @IsBoolean()
  allergiesReviewed!: boolean;

  /**
   * Valor de medications reviewed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Se revisó la medicación del paciente' })
  @IsBoolean()
  medicationsReviewed!: boolean;

  /**
   * Valor de anticoagulation plan text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  anticoagulationPlanText?: string;

  /**
   * Valor de fasting instructions text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fastingInstructionsText?: string;

  /**
   * Valor de assessment json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Detalle estructurado de la valoración' })
  @IsOptional()
  @IsObject()
  assessmentJson?: Record<string, unknown>;

  /**
   * Valor de risk scores mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [RiskScoreDto],
    description: 'Puntuaciones de riesgo calculadas',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskScoreDto)
  riskScores?: RiskScoreDto[];
}

/**
 * Define el contrato validado para preop assessment response.
 */
export class PreopAssessmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a fitness status concept.
   */
  @ApiProperty({ format: 'uuid' })
  fitnessStatusConceptId!: string;

  /**
   * Valor de risk score ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  riskScoreIds!: string[];

  /**
   * Identificador asociado a milestone.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Hito de aptitud preoperatoria, si el paciente quedó apto',
  })
  milestoneId?: string;
}
