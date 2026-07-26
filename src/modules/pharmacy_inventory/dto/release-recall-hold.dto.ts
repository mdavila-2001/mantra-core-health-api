import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/** Cuerpo de `POST /pharmacy/recall-holds/:id/release` (UC-25-09). */
export class ReleaseRecallHoldDto {
  @ApiPropertyOptional({
    description: 'Si es true, el stock en cuarentena se da de baja (write-off) en vez de reintegrarse',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  writeOff?: boolean;
}
