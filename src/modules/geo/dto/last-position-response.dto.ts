import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta de `GET /geo/tracked-subjects/{id}/last-position` (UC-13-09). */
export class LastPositionResponseDto {
  @ApiProperty({ description: 'Id del ping', format: 'uuid' })
  pingId!: string;

  @ApiProperty({ format: 'uuid' })
  trackedSubjectId!: string;

  @ApiProperty({ description: 'Latitud en grados decimales' })
  latitude!: string;

  @ApiProperty({ description: 'Longitud en grados decimales' })
  longitude!: string;

  @ApiPropertyOptional({ description: 'Precisión horizontal (m)' })
  accuracyM?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  capturedAt?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;
}
