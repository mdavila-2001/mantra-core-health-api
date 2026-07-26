import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Decisión de la revisión manual. */
export type ReviewDecision = 'APPROVED' | 'REJECTED';

/** Cuerpo de `POST /identity/manual-review/{id}/decision` (UC-27-09). */
export class ReviewDecisionDto {
  @ApiProperty({ description: 'Decisión del revisor', enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: ReviewDecision;

  @ApiPropertyOptional({ description: 'Motivo de la decisión', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  decisionReason?: string;
}
