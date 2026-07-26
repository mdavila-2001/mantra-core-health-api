import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { AttemptOutcome } from './record-attempt.dto';

/** Cuerpo de `POST /integration/exchanges/{recordId}/retry` (UC-31-07). */
export class RetryExchangeDto {
  @ApiPropertyOptional({ description: 'Resultado del reintento (por defecto SUCCESS)', enum: ['SUCCESS', 'FAILED'] })
  @IsOptional()
  @IsIn(['SUCCESS', 'FAILED'])
  outcome?: AttemptOutcome;

  @ApiPropertyOptional({ description: 'Código de estado HTTP recibido', minimum: 100, maximum: 599 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  httpStatus?: number;

  @ApiPropertyOptional({ description: 'Id de traza distribuida', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  traceId?: string;
}
