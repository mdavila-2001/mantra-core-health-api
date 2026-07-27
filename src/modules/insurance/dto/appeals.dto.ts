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
  @ApiProperty({ enum: ['UPHELD', 'OVERTURNED'] })
  @IsIn(['UPHELD', 'OVERTURNED'])
  decision!: 'UPHELD' | 'OVERTURNED';

  @ApiPropertyOptional({
    description: 'Monto ajustado tras la decisión',
    example: '15.00',
  })
  @IsOptional()
  @IsNumberString()
  adjustedAmount?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rationaleText?: string;
}
