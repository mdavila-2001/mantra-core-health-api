import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Cuerpo de `POST /telemetry/tracking-purposes` (UC-28-01). */
export class CreateTrackingPurposeDto {
  /**
   * Valor de purpose code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único del propósito de tracking',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  purposeCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre legible del propósito', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a purpose category concept.
   */
  @ApiPropertyOptional({
    description: 'Categoría del propósito (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  purposeCategoryConceptId?: string;

  /**
   * Identificador asociado a legal basis concept.
   */
  @ApiPropertyOptional({
    description: 'Base legal (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  legalBasisConceptId?: string;

  /**
   * Valor de requires consent mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Requiere consentimiento explícito',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  requiresConsent?: boolean;

  /**
   * Valor de permits marketing use mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Permite uso de marketing' })
  @IsOptional()
  @IsBoolean()
  permitsMarketingUse?: boolean;

  /**
   * Valor de permits cross tenant aggregation mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Permite agregación cross-tenant' })
  @IsOptional()
  @IsBoolean()
  permitsCrossTenantAggregation?: boolean;

  /**
   * Valor de default retention days mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Días de retención por defecto' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(36500)
  defaultRetentionDays?: number;
}

/** Respuesta de un propósito de tracking. */
export class TrackingPurposeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de purpose code mantenido por la instancia.
   */
  @ApiProperty()
  purposeCode!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de requires consent mantenido por la instancia.
   */
  @ApiProperty({ description: 'Requiere consentimiento' })
  requiresConsent!: boolean;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}
