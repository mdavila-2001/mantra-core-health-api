import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /consent/processing-legal-bases` (UC-07-06). */
export class CreateProcessingLegalBasisDto {
  /**
   * Identificador asociado a processing purpose.
   */
  @ApiProperty({
    description: 'Propósito de procesamiento activo',
    format: 'uuid',
  })
  @IsUUID()
  processingPurposeId!: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    description: 'Jurisdicción (concept id); por defecto Perú',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Identificador asociado a general legal basis concept.
   */
  @ApiPropertyOptional({
    description: 'Base legal general (concept id); por defecto consentimiento',
  })
  @IsOptional()
  @IsUUID()
  generalLegalBasisConceptId?: string;

  /**
   * Identificador asociado a special category condition concept.
   */
  @ApiPropertyOptional({
    description: 'Condición de categoría especial (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialCategoryConditionConceptId?: string;

  /**
   * Valor de policy version mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Versión de la política' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyVersion?: string;

  /**
   * Valor de legal reference uri mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'URI de referencia legal' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  legalReferenceUri?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
