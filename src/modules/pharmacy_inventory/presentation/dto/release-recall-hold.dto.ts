import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsStrictBoolean } from '../../../pharmacy/dto/strict-boolean';

/** Cuerpo de `POST /pharmacy/recall-holds/:id/release` (UC-25-09). */
export class ReleaseRecallHoldDto {
  /**
   * Valor de write off mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Si es true, el stock en cuarentena se da de baja (write-off) en vez de reintegrarse',
    default: false,
  })
  @IsOptional()
  @IsStrictBoolean()
  writeOff?: boolean;
}
