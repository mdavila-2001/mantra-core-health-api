import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /telemetry/session-journeys/{id}/close` (UC-28-13). */
export class CloseJourneyDto {
  @ApiPropertyOptional({ description: 'Evento de salida', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  exitEventId?: string;

  @ApiPropertyOptional({
    description: 'Conteo final de eventos (si el worker lo consolida)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  eventCount?: number;
}

/** Respuesta del cierre de un journey. */
export class JourneyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  journeyStatusConceptId!: string;

  @ApiPropertyOptional()
  endedAt?: Date;

  @ApiProperty()
  eventCount!: number;
}
