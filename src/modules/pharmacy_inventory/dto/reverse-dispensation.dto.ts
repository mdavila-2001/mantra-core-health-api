import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /pharmacy/dispensations/:id/reverse` (UC-25-11). */
export class ReverseDispensationDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo de la reversión' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  reason?: string;

  /**
   * Identificador asociado a inventory location.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ubicación a la que se reintegra el stock',
  })
  @IsOptional()
  @IsUUID()
  inventoryLocationId?: string;
}
