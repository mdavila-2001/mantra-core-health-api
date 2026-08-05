import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /telemetry/disclosure-acceptances` (UC-28-04). */
export class CreateDisclosureAcceptanceDto {
  /**
   * Identificador asociado a tracking disclosure version.
   */
  @ApiProperty({
    description: 'Versión de disclosure aceptada',
    format: 'uuid',
  })
  @IsUUID()
  trackingDisclosureVersionId!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiPropertyOptional({
    description: 'Usuario que acepta (por defecto el autenticado)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Identificador asociado a session.
   */
  @ApiPropertyOptional({ description: 'Sesión asociada', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  /**
   * Valor de ip prefix hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del prefijo de IP (sin PII en claro)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ipPrefixHash?: string;

  /**
   * Valor de user agent hash mantenido por la instancia.
   */
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
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a tracking disclosure version.
   */
  @ApiProperty({ format: 'uuid' })
  trackingDisclosureVersionId!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Valor de accepted at mantenido por la instancia.
   */
  @ApiProperty()
  acceptedAt!: Date;
}
