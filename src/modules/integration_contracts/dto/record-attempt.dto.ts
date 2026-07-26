import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

/** Resultados posibles de un intento outbound. */
export type AttemptOutcome = 'SUCCESS' | 'FAILED';
/** Decisión de reintento tras un intento fallido. */
export type RetryDecision = 'RETRYABLE' | 'PERMANENT';

/** Cuerpo de `POST /integration/contracts/{id}/exchanges/{recordId}/attempts` (UC-31-06). */
export class RecordAttemptDto {
  @ApiProperty({ description: 'Resultado del intento', enum: ['SUCCESS', 'FAILED'] })
  @IsIn(['SUCCESS', 'FAILED'])
  outcome!: AttemptOutcome;

  @ApiPropertyOptional({ description: 'Endpoint destino usado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  endpointId?: string;

  @ApiPropertyOptional({ description: 'Código de estado HTTP recibido', minimum: 100, maximum: 599 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  httpStatus?: number;

  @ApiPropertyOptional({ description: 'Código de error del proveedor', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  providerErrorCode?: string;

  @ApiPropertyOptional({ description: 'Decisión de reintento si falla', enum: ['RETRYABLE', 'PERMANENT'] })
  @IsOptional()
  @IsIn(['RETRYABLE', 'PERMANENT'])
  retryDecision?: RetryDecision;

  @ApiPropertyOptional({ description: 'Hash del response', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  responseHash?: string;

  @ApiPropertyOptional({ description: 'Referencia de respuesta idempotente', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  responseReference?: string;

  @ApiPropertyOptional({ description: 'Id de traza distribuida', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  traceId?: string;
}
