import { ApiPropertyOptional } from '@nestjs/swagger';
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
 * Cuerpo de `PATCH /surveys/templates/:id/questions/:questionId` (CL-60).
 *
 * Todo opcional: se manda sólo lo que cambió. **`options` y la escala se
 * reemplazan enteras** cuando viajan —no hay parche por índice, porque el orden
 * importa— y al cambiar de tipo el servicio descarta lo que el tipo nuevo no
 * usa. Sólo sobre la versión en borrador: una publicada responde 422.
 */
export class UpdateQuestionDto {
  /**
   * Enunciado que lee el paciente.
   */
  @ApiPropertyOptional({
    description: 'Enunciado de la pregunta',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  questionText?: string;

  /**
   * Tipo de respuesta esperado.
   */
  @ApiPropertyOptional({
    enum: ANSWER_TYPE_CODES,
    description: 'Tipo de respuesta esperado',
  })
  @IsOptional()
  @IsIn(ANSWER_TYPE_CODES as readonly string[])
  answerType?: AnswerTypeCode;

  /**
   * Si responderla es obligatorio para poder enviar.
   */
  @ApiPropertyOptional({ description: 'Si responderla es obligatorio' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /**
   * Opciones, enteras. Obligatorias en SINGLE_CHOICE / MULTIPLE_CHOICE.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'Opciones, enteras. Reemplazan a las anteriores.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  options?: string[];

  /**
   * Mínimo de la escala. Solo para SCALE.
   */
  @ApiPropertyOptional({ description: 'Mínimo de la escala. Solo para SCALE.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  scaleMin?: number;

  /**
   * Máximo de la escala. Solo para SCALE.
   */
  @ApiPropertyOptional({ description: 'Máximo de la escala. Solo para SCALE.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  scaleMax?: number;
}
