import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta pública de un evento de geofence (UC-13-05). */
export class GeofenceEventResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a geofence.
   */
  @ApiProperty({ format: 'uuid' })
  geofenceId!: string;

  /**
   * Identificador asociado a tracked subject.
   */
  @ApiProperty({ format: 'uuid' })
  trackedSubjectId!: string;

  /**
   * Valor de event type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del tipo de evento', format: 'uuid' })
  eventType!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  occurredAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;
}
