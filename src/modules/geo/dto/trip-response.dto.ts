import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de un viaje (UC-13-06 / UC-13-07). */
export class TripResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  trackingSessionId?: string;

  @ApiProperty({ description: 'Concept id del estado del viaje', format: 'uuid' })
  status!: string;

  @ApiPropertyOptional({ description: 'Distancia recorrida (m)' })
  distanceM?: string;

  @ApiPropertyOptional({ description: 'Duración (s)' })
  durationS?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  startedAt?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endedAt?: Date;
}
