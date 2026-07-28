import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Transiciones de geofence. */
export type GeofenceEventTypeCode = 'ENTER' | 'EXIT';

/** Cuerpo de `POST /geo/geofence-events` (UC-13-05, worker). */
export class RecordGeofenceEventDto {
  /**
   * Identificador asociado a geofence.
   */
  @ApiProperty({ description: 'Geofence cruzado', format: 'uuid' })
  @IsUUID()
  geofenceId!: string;

  /**
   * Identificador asociado a tracked subject.
   */
  @ApiProperty({ description: 'Sujeto rastreado que cruzó', format: 'uuid' })
  @IsUUID()
  trackedSubjectId!: string;

  /**
   * Valor de event type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de transición', enum: ['ENTER', 'EXIT'] })
  @IsIn(['ENTER', 'EXIT'])
  eventType!: GeofenceEventTypeCode;

  /**
   * Identificador asociado a location ping.
   */
  @ApiPropertyOptional({
    description: 'Ping que originó el evento',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  locationPingId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Instante del cruce',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  occurredAt?: Date;
}
