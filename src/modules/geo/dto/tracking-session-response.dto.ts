import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de una sesión de tracking (UC-13-02 / UC-13-08). */
export class TrackingSessionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a tracked subject.
   */
  @ApiProperty({ format: 'uuid' })
  trackedSubjectId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de la sesión',
    format: 'uuid',
  })
  status!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  startedAt?: Date;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endedAt?: Date;
}
