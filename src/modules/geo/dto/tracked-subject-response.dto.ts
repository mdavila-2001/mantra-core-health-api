import { ApiProperty } from '@nestjs/swagger';

/** Respuesta pública de un sujeto rastreado (UC-13-01). */
export class TrackedSubjectResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a subject.
   */
  @ApiProperty({ format: 'uuid' })
  subjectId!: string;

  /**
   * Valor de subject type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del tipo de sujeto', format: 'uuid' })
  subjectType!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado del sujeto',
    format: 'uuid',
  })
  state!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
