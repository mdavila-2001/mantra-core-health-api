import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * Una respuesta suelta dentro del envío. Cuál de los cuatro valores viaja lo
 * decide el tipo de la pregunta; el servicio rechaza el que no corresponda en
 * vez de guardar el primero que encuentre.
 */
export class AnswerInputDto {
  /**
   * Identificador asociado a survey question.
   */
  @ApiProperty({ description: 'Pregunta contestada', format: 'uuid' })
  @IsUUID()
  questionId!: string;

  /**
   * Valor de value text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Respuesta de texto libre (TEXT)' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  valueText?: string;

  /**
   * Valor de value number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Respuesta numérica (SCALE)' })
  @IsOptional()
  @IsInt()
  valueNumber?: number;

  /**
   * Valor de value boolean mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Respuesta sí/no (BOOLEAN)' })
  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;

  /**
   * Valor de value choices mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'Opciones elegidas (SINGLE_CHOICE / MULTIPLE_CHOICE)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  valueChoices?: string[];
}

/**
 * Cuerpo de `POST /surveys/me/invitations/:id/responses`.
 *
 * El envío es **atómico y único**: o entra el cuestionario entero —con todas
 * las obligatorias contestadas— o no entra nada, y una invitación ya respondida
 * no admite un segundo envío. Guardar a medias dejaría respuestas parciales que
 * el profesional leería como si fueran definitivas.
 */
export class SubmitResponseDto {
  /**
   * Valor de answers mantenido por la instancia.
   */
  @ApiProperty({
    type: [AnswerInputDto],
    description: 'Respuestas del cuestionario',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => AnswerInputDto)
  answers!: AnswerInputDto[];
}
