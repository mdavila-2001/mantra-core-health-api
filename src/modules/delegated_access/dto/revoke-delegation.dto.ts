import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo de `POST /practitioner-delegates/{id}/revoke` (UC-29-07). */
export class RevokeDelegationDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo de la revocación (auditoría)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
