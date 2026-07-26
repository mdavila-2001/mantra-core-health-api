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
  @ApiProperty({ description: 'Código único del propósito de tracking', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  purposeCode!: string;

  @ApiProperty({ description: 'Nombre legible del propósito', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Categoría del propósito (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purposeCategoryConceptId?: string;

  @ApiPropertyOptional({ description: 'Base legal (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  legalBasisConceptId?: string;

  @ApiPropertyOptional({ description: 'Requiere consentimiento explícito', default: true })
  @IsOptional()
  @IsBoolean()
  requiresConsent?: boolean;

  @ApiPropertyOptional({ description: 'Permite uso de marketing' })
  @IsOptional()
  @IsBoolean()
  permitsMarketingUse?: boolean;

  @ApiPropertyOptional({ description: 'Permite agregación cross-tenant' })
  @IsOptional()
  @IsBoolean()
  permitsCrossTenantAggregation?: boolean;

  @ApiPropertyOptional({ description: 'Días de retención por defecto' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(36500)
  defaultRetentionDays?: number;
}

/** Respuesta de un propósito de tracking. */
export class TrackingPurposeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  purposeCode!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Requiere consentimiento' })
  requiresConsent!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
