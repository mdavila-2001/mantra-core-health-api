import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta de `GET /geo/tracked-subjects/{id}/last-position` (UC-13-09). */
export class LastPositionResponseDto {
  /**
   * Identificador asociado a ping.
   */
  @ApiProperty({ description: 'Id del ping', format: 'uuid' })
  pingId!: string;

  /**
   * Identificador asociado a tracked subject.
   */
  @ApiProperty({ format: 'uuid' })
  trackedSubjectId!: string;

  /**
   * Valor de latitude mantenido por la instancia.
   */
  @ApiProperty({ description: 'Latitud en grados decimales' })
  latitude!: string;

  /**
   * Valor de longitude mantenido por la instancia.
   */
  @ApiProperty({ description: 'Longitud en grados decimales' })
  longitude!: string;

  /**
   * Valor de accuracy m mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Precisión horizontal (m)' })
  accuracyM?: string;

  /**
   * Valor de captured at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  capturedAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;
}
