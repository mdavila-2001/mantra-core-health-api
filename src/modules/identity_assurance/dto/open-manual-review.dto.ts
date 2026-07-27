import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /identity/verification-cases/{id}/manual-review` (UC-27-08). */
export class OpenManualReviewDto {
  @ApiProperty({
    description: 'Concepto: motivo de la revisión',
    format: 'uuid',
  })
  @IsUUID()
  reviewReasonConceptId!: string;

  @ApiPropertyOptional({
    description: 'Usuario revisor asignado (por defecto el actor)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;
}
