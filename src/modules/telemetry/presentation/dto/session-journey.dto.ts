import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /telemetry/session-journeys/{id}/close` (UC-28-13). */
export class CloseJourneyDto {
  /**
   * Identificador asociado a exit event.
   */
  @ApiPropertyOptional({ description: 'Evento de salida', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  exitEventId?: string;

  /**
   * Valor de event count mantenido por la instancia.
   */
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
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a journey status concept.
   */
  @ApiProperty({ format: 'uuid' })
  journeyStatusConceptId!: string;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @ApiPropertyOptional()
  endedAt?: Date;

  /**
   * Valor de event count mantenido por la instancia.
   */
  @ApiProperty()
  eventCount!: number;
}
