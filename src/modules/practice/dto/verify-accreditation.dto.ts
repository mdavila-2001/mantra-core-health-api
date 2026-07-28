import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

/** Decisión de verificación de una acreditación. */
export type AccreditationDecision = 'VERIFIED' | 'EXPIRED';

/** Cuerpo de `POST /accreditations/{id}/verify` (UC-14-03). */
export class VerifyAccreditationDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Decisión de la transición (por defecto VERIFIED)',
    enum: ['VERIFIED', 'EXPIRED'],
  })
  @IsOptional()
  @IsIn(['VERIFIED', 'EXPIRED'])
  decision?: AccreditationDecision;
}
