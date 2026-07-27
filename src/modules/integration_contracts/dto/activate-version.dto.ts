import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

/** Cuerpo de `POST /integration/contracts/{id}/versions/{versionId}/activate` (UC-31-10). */
export class ActivateVersionDto {
  @ApiPropertyOptional({
    description: 'Inicio de vigencia explícito (ISO 8601); por defecto now()',
  })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;
}
