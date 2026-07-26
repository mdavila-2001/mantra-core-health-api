import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Veredicto del check registrado de forma inmutable. */
export type CheckResultOutcome = 'MATCH' | 'NO_MATCH';

/** Cuerpo de `POST /identity/checks/{id}/results` (UC-27-06). */
export class RecordResultDto {
  @ApiProperty({ description: 'Veredicto del check', enum: ['MATCH', 'NO_MATCH'], default: 'MATCH' })
  @IsIn(['MATCH', 'NO_MATCH'])
  result!: CheckResultOutcome;

  @ApiPropertyOptional({ description: 'Puntaje de coincidencia (0..1)', example: '0.98' })
  @IsOptional()
  @IsNumberString()
  matchScore?: string;

  @ApiPropertyOptional({ description: 'Códigos de discrepancia detectados', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  discrepancyCodes?: string[];

  @ApiPropertyOptional({ description: 'Hash de la respuesta fuente', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceResponseHash?: string;
}
