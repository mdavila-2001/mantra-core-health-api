import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Resultados posibles de un intento outbound. */
export type AttemptOutcome = 'SUCCESS' | 'FAILED';
/** Decisión de reintento tras un intento fallido. */
export type RetryDecision = 'RETRYABLE' | 'PERMANENT';

/** Cuerpo de `POST /integration/contracts/{id}/exchanges/{recordId}/attempts` (UC-31-06). */
@ApiSchema({ name: 'IntegrationContractsRecordAttemptDto' })
export class RecordAttemptDto {
  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Resultado del intento',
    enum: ['SUCCESS', 'FAILED'],
  })
  @IsIn(['SUCCESS', 'FAILED'])
  outcome!: AttemptOutcome;

  /**
   * Identificador asociado a endpoint.
   */
  @ApiPropertyOptional({
    description: 'Endpoint destino usado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  endpointId?: string;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Código de estado HTTP recibido',
    minimum: 100,
    maximum: 599,
  })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  httpStatus?: number;

  /**
   * Valor de provider error code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Código de error del proveedor',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  providerErrorCode?: string;

  /**
   * Valor de retry decision mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Decisión de reintento si falla',
    enum: ['RETRYABLE', 'PERMANENT'],
  })
  @IsOptional()
  @IsIn(['RETRYABLE', 'PERMANENT'])
  retryDecision?: RetryDecision;

  /**
   * Valor de response hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Hash del response', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  responseHash?: string;

  /**
   * Valor de response reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia de respuesta idempotente',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  responseReference?: string;

  /**
   * Identificador asociado a trace.
   */
  @ApiPropertyOptional({
    description: 'Id de traza distribuida',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  traceId?: string;
}
