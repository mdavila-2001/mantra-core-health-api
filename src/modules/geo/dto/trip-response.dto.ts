import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de un viaje (UC-13-06 / UC-13-07). */
export class TripResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a tracking session.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  trackingSessionId?: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado del viaje',
    format: 'uuid',
  })
  status!: string;

  /**
   * Valor de distance m mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Distancia recorrida (m)' })
  distanceM?: string;

  /**
   * Valor de duration s mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Duración (s)' })
  durationS?: number;

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
