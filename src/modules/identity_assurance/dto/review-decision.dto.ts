import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Decisión de la revisión manual. */
export type ReviewDecision = 'APPROVED' | 'REJECTED';

/** Cuerpo de `POST /identity/manual-review/{id}/decision` (UC-27-09). */
export class ReviewDecisionDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Decisión del revisor',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: ReviewDecision;

  /**
   * Valor de decision reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo de la decisión', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  decisionReason?: string;
}
