import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Pregunta de una encuesta post-visita. */
export class SurveyQuestionDto {
  /**
   * Enunciado.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  prompt!: string;

  /**
   * Tipo de respuesta esperada.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  answerTypeConceptId!: string;

  /**
   * Si la respuesta es obligatoria.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  /**
   * Opciones, para preguntas de opción única.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  options?: string[];
}

/** Configuración de una encuesta posterior a la visita (UC-17-27). */
export class CreateVisitSurveyDto {
  /**
   * Título.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title!: string;

  /**
   * Visitador al que se acota.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicalVisitorId?: string;

  /**
   * Producto al que se acota.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pharmaProductId?: string;

  /**
   * Campaña a la que se acota.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  campaignCode?: string;

  /**
   * Especialidad a la que se acota.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Inicio de vigencia.
   */
  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  validFrom!: string;

  /**
   * Fin de vigencia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  /**
   * Horas después de la visita en que se envía.
   */
  @ApiPropertyOptional({ minimum: 0, maximum: 720 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  sendDelayHours?: number;

  /**
   * Recordatorios programados.
   */
  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  reminderCount?: number;

  /**
   * Preguntas, en el orden en que se presentan.
   */
  @ApiProperty({ type: [SurveyQuestionDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions!: SurveyQuestionDto[];
}

/** Respuesta a una pregunta concreta. */
export class SurveyAnswerDto {
  /**
   * Pregunta respondida.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  visitSurveyQuestionId!: string;

  /**
   * Respuesta numérica, para escalas.
   */
  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  numericValue?: number;

  /**
   * Respuesta booleana.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  booleanValue?: boolean;

  /**
   * Respuesta libre o la opción elegida.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  textValue?: string;
}

/** Envío de las respuestas por parte del doctor visitado (UC-17-28). */
export class SubmitSurveyResponseDto {
  /**
   * Respuestas de la encuesta.
   */
  @ApiProperty({ type: [SurveyAnswerDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerDto)
  answers!: SurveyAnswerDto[];
}
