import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de una sesión de tracking (UC-13-02 / UC-13-08). */
export class TrackingSessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  trackedSubjectId!: string;

  @ApiProperty({
    description: 'Concept id del estado de la sesión',
    format: 'uuid',
  })
  status!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  startedAt?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endedAt?: Date;
}
