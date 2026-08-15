import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ANSWER_TYPE_CODES, type AnswerTypeCode } from '../surveys.concepts';

/**
 * Cuerpo de `POST /surveys/templates/:id/questions`.
 *
 * La pregunta se agrega siempre a la versión en borrador de la plantilla. No
 * hay forma de agregarla a una publicada: eso es lo que hace demostrable que
 * una respuesta dada se corresponde exactamente con el cuestionario que la
 * persona vio.
 */
export class AddQuestionDto {
  /**
   * Valor de question text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Enunciado de la pregunta', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  questionText!: string;

  /**
   * Valor de answer type mantenido por la instancia.
   */
  @ApiProperty({
    enum: ANSWER_TYPE_CODES,
    description: 'Tipo de respuesta esperado',
  })
  @IsIn(ANSWER_TYPE_CODES as readonly string[])
  answerType!: AnswerTypeCode;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Si responderla es obligatorio para poder enviar',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /**
   * Valor de options mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    description:
      'Opciones. Obligatorias en SINGLE_CHOICE / MULTIPLE_CHOICE, prohibidas en el resto.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  options?: string[];

  /**
   * Valor de scale min mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Mínimo de la escala. Solo para SCALE.',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  scaleMin?: number;

  /**
   * Valor de scale max mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Máximo de la escala. Solo para SCALE.',
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  scaleMax?: number;
}
