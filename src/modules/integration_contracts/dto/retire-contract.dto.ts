import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo de `POST /integration/contracts/{id}/retire` (UC-31-11). */
export class RetireContractDto {
  @ApiPropertyOptional({ description: 'Motivo del retiro (auditoría)', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Forzar dead-letter documentado de intercambios PENDING' })
  @IsOptional()
  @IsBoolean()
  forceDeadLetter?: boolean;
}
