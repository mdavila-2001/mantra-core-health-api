import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /consent/processing-legal-bases` (UC-07-06). */
export class CreateProcessingLegalBasisDto {
  @ApiProperty({ description: 'Propósito de procesamiento activo', format: 'uuid' })
  @IsUUID()
  processingPurposeId!: string;

  @ApiPropertyOptional({ description: 'Jurisdicción (concept id); por defecto Perú' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({ description: 'Base legal general (concept id); por defecto consentimiento' })
  @IsOptional()
  @IsUUID()
  generalLegalBasisConceptId?: string;

  @ApiPropertyOptional({ description: 'Condición de categoría especial (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialCategoryConditionConceptId?: string;

  @ApiPropertyOptional({ description: 'Versión de la política' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyVersion?: string;

  @ApiPropertyOptional({ description: 'URI de referencia legal' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  legalReferenceUri?: string;

  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
