import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de un evento de geofence (UC-13-05). */
export class GeofenceEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  geofenceId!: string;

  @ApiProperty({ format: 'uuid' })
  trackedSubjectId!: string;

  @ApiProperty({ description: 'Concept id del tipo de evento', format: 'uuid' })
  eventType!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  occurredAt?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;
}
