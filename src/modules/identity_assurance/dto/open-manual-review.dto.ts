import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /identity/verification-cases/{id}/manual-review` (UC-27-08). */
export class OpenManualReviewDto {
  /**
   * Identificador asociado a review reason concept.
   */
  @ApiProperty({
    description: 'Concepto: motivo de la revisión',
    format: 'uuid',
  })
  @IsUUID()
  reviewReasonConceptId!: string;

  /**
   * Identificador asociado a assigned to user.
   */
  @ApiPropertyOptional({
    description: 'Usuario revisor asignado (por defecto el actor)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;
}
