import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsUUID, ValidateIf } from 'class-validator';
import {
  SURVEYS,
  TARGET_TYPE_CODES,
  type TargetTypeCode,
} from '../surveys.concepts';

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
    description:
      'Qué se evalúa: la reserva, el servicio o el tipo de atención. `CARE_TYPE` sólo admite «todas mis consultas»',
  })
  @IsIn(TARGET_TYPE_CODES as readonly string[])
  targetType!: TargetTypeCode;

  /**
   * Identificador de la cosa evaluada, según `targetType`.
   */
  @ApiPropertyOptional({
    description:
      'Identificador de la cosa evaluada, según `targetType`: la reserva (`APPOINTMENT`) o el servicio del catálogo, `billing.service_catalog.id` (`SERVICE`). Con `CARE_TYPE` se puede omitir: es «todas mis consultas» (`' +
      SURVEYS.CARE_TYPE_CONSULTATION +
      '`), el único tipo de atención admitido.',
    format: 'uuid',
  })
  @ValidateIf((dto: CreateAssignmentDto) => dto.targetType !== 'CARE_TYPE')
  @IsUUID()
  targetId?: string;
}
