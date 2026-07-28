import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * Cuerpo de `POST /geo/trips/{id}/close` (UC-13-07). La distancia/duración las
 * calcula normalmente el worker de ruta a partir de la trayectoria; se aceptan
 * como override opcional.
 */
export class CloseTripDto {
  /**
   * Valor de distance m mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Distancia recorrida (m)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceM?: number;

  /**
   * Valor de duration s mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Duración del viaje (s)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationS?: number;
}
