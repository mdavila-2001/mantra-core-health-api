import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';
import { TARGET_TYPE_CODES, type TargetTypeCode } from '../surveys.concepts';

/**
 * Cuerpo de `POST /surveys/assignments`.
 *
 * Asocia una versión **publicada** a la cosa evaluada. Sobre una versión en
 * borrador se rechaza: repartir un cuestionario que todavía puede cambiar
 * produciría respuestas a preguntas que nadie sabría reconstruir.
 */
export class CreateAssignmentDto {
  /**
   * Identificador asociado a survey version.
   */
  @ApiProperty({
    description: 'Versión publicada que se reparte',
    format: 'uuid',
  })
  @IsUUID()
  surveyVersionId!: string;

  /**
   * Valor de target type mantenido por la instancia.
   */
  @ApiProperty({
    enum: TARGET_TYPE_CODES,
    description: 'Qué se evalúa: la reserva, el servicio o el tipo de atención',
  })
  @IsIn(TARGET_TYPE_CODES as readonly string[])
  targetType!: TargetTypeCode;

  /**
   * Identificador asociado a target.
   */
  @ApiProperty({
    description: 'Identificador de la cosa evaluada, según `targetType`',
    format: 'uuid',
  })
  @IsUUID()
  targetId!: string;
}
