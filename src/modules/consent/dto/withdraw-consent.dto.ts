import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /consent/consents/{id}/withdraw` (UC-07-02). */
export class WithdrawConsentDto {
  /**
   * Identificador asociado a withdrawal reason concept.
   */
  @ApiPropertyOptional({
    description: 'Motivo de retiro (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  withdrawalReasonConceptId?: string;
}
