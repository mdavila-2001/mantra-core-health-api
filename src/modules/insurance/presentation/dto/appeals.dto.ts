import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** UC-26-12: emitir decisión de apelación (inmutable). */
export class CreateAppealDecisionDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ enum: ['UPHELD', 'OVERTURNED'] })
  @IsIn(['UPHELD', 'OVERTURNED'])
  decision!: 'UPHELD' | 'OVERTURNED';

  /**
   * Valor de adjusted amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Monto ajustado tras la decisión',
    example: '15.00',
  })
  @IsOptional()
  @IsNumberString()
  adjustedAmount?: string;

  /**
   * Valor de rationale text mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rationaleText?: string;
}
