import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Resultado técnico del intento contra la autoridad externa. */
export type AttemptOutcome = 'SUCCESS' | 'PENDING' | 'FAILED';

/** Cuerpo de `POST /identity/checks/{id}/attempts` (UC-27-05). */
export class RecordAttemptDto {
  @ApiProperty({ description: 'Endpoint de autoridad usado en el intento', format: 'uuid' })
  @IsUUID()
  identityAuthorityEndpointId!: string;

  @ApiPropertyOptional({ description: 'Resultado técnico del intento', enum: ['SUCCESS', 'PENDING', 'FAILED'], default: 'SUCCESS' })
  @IsOptional()
  @IsIn(['SUCCESS', 'PENDING', 'FAILED'])
  outcome?: AttemptOutcome;

  @ApiPropertyOptional({ description: 'Clave de idempotencia del intento', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Mensaje saliente correlacionado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requestMessageId?: string;

  @ApiPropertyOptional({ description: 'Mensaje entrante correlacionado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  responseMessageId?: string;

  @ApiPropertyOptional({ description: 'Código de error técnico', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  technicalErrorCode?: string;

  @ApiPropertyOptional({ description: '¿Es elegible para reintento?' })
  @IsOptional()
  @IsBoolean()
  retryEligible?: boolean;
}
