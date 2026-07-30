import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /telemetry/tracking-consents` (UC-28-05). */
export class CreateTrackingConsentDto {
  /**
   * Identificador asociado a purpose definition.
   */
  @ApiProperty({
    description: 'Propósito de tracking (requiere consentimiento)',
    format: 'uuid',
  })
  @IsUUID()
  purposeDefinitionId!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiPropertyOptional({
    description: 'Usuario que consiente (por defecto el autenticado)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    description: 'Jurisdicción (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Valor de consent version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión del consentimiento',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  consentVersion?: string;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash de la evidencia de consentimiento',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceHash?: string;
}

/** Respuesta de un consentimiento de tracking. */
export class TrackingConsentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Identificador asociado a purpose definition.
   */
  @ApiProperty({ format: 'uuid' })
  purposeDefinitionId!: string;

  /**
   * Identificador asociado a decision concept.
   */
  @ApiProperty({ format: 'uuid' })
  decisionConceptId!: string;

  /**
   * Valor de granted at mantenido por la instancia.
   */
  @ApiPropertyOptional()
  grantedAt?: Date;

  /**
   * Valor de withdrawn at mantenido por la instancia.
   */
  @ApiPropertyOptional()
  withdrawnAt?: Date;
}
