import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Resultado técnico del intento contra la autoridad externa. */
export type AttemptOutcome = 'SUCCESS' | 'PENDING' | 'FAILED';

/** Cuerpo de `POST /identity/checks/{id}/attempts` (UC-27-05). */
export class RecordAttemptDto {
  /**
   * Identificador asociado a identity authority endpoint.
   */
  @ApiProperty({
    description: 'Endpoint de autoridad usado en el intento',
    format: 'uuid',
  })
  @IsUUID()
  identityAuthorityEndpointId!: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Resultado técnico del intento',
    enum: ['SUCCESS', 'PENDING', 'FAILED'],
    default: 'SUCCESS',
  })
  @IsOptional()
  @IsIn(['SUCCESS', 'PENDING', 'FAILED'])
  outcome?: AttemptOutcome;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Clave de idempotencia del intento',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;

  /**
   * Identificador asociado a request message.
   */
  @ApiPropertyOptional({
    description: 'Mensaje saliente correlacionado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestMessageId?: string;

  /**
   * Identificador asociado a response message.
   */
  @ApiPropertyOptional({
    description: 'Mensaje entrante correlacionado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  responseMessageId?: string;

  /**
   * Valor de technical error code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Código de error técnico',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  technicalErrorCode?: string;

  /**
   * Valor de retry eligible mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Es elegible para reintento?' })
  @IsOptional()
  @IsBoolean()
  retryEligible?: boolean;
}
