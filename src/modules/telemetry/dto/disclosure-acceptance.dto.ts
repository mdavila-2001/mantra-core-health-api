import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /telemetry/disclosure-acceptances` (UC-28-04). */
export class CreateDisclosureAcceptanceDto {
  @ApiProperty({
    description: 'Versión de disclosure aceptada',
    format: 'uuid',
  })
  @IsUUID()
  trackingDisclosureVersionId!: string;

  @ApiPropertyOptional({
    description: 'Usuario que acepta (por defecto el autenticado)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Sesión asociada', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Hash del prefijo de IP (sin PII en claro)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ipPrefixHash?: string;

  @ApiPropertyOptional({
    description: 'Hash del user agent (sin PII en claro)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userAgentHash?: string;
}

/** Respuesta de una aceptación de disclosure. */
export class DisclosureAcceptanceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  trackingDisclosureVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  acceptedAt!: Date;
}
