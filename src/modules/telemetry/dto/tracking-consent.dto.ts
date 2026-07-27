import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /telemetry/tracking-consents` (UC-28-05). */
export class CreateTrackingConsentDto {
  @ApiProperty({
    description: 'Propósito de tracking (requiere consentimiento)',
    format: 'uuid',
  })
  @IsUUID()
  purposeDefinitionId!: string;

  @ApiPropertyOptional({
    description: 'Usuario que consiente (por defecto el autenticado)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Jurisdicción (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({
    description: 'Versión del consentimiento',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  consentVersion?: string;

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
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  purposeDefinitionId!: string;

  @ApiProperty({ format: 'uuid' })
  decisionConceptId!: string;

  @ApiPropertyOptional()
  grantedAt?: Date;

  @ApiPropertyOptional()
  withdrawnAt?: Date;
}
