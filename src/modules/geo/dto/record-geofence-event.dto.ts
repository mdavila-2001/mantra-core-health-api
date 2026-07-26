import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Transiciones de geofence. */
export type GeofenceEventTypeCode = 'ENTER' | 'EXIT';

/** Cuerpo de `POST /geo/geofence-events` (UC-13-05, worker). */
export class RecordGeofenceEventDto {
  @ApiProperty({ description: 'Geofence cruzado', format: 'uuid' })
  @IsUUID()
  geofenceId!: string;

  @ApiProperty({ description: 'Sujeto rastreado que cruzó', format: 'uuid' })
  @IsUUID()
  trackedSubjectId!: string;

  @ApiProperty({ description: 'Tipo de transición', enum: ['ENTER', 'EXIT'] })
  @IsIn(['ENTER', 'EXIT'])
  eventType!: GeofenceEventTypeCode;

  @ApiPropertyOptional({ description: 'Ping que originó el evento', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  locationPingId?: string;

  @ApiPropertyOptional({ description: 'Instante del cruce', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  occurredAt?: Date;
}
