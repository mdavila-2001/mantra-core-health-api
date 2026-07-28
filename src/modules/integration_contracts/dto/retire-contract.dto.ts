import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo de `POST /integration/contracts/{id}/retire` (UC-31-11). */
export class RetireContractDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Motivo del retiro (auditoría)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  /**
   * Valor de force dead letter mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Forzar dead-letter documentado de intercambios PENDING',
  })
  @IsOptional()
  @IsBoolean()
  forceDeadLetter?: boolean;
}
