import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /admin/governance/residency-policies` (UC-11-06). */
export class CreateResidencyPolicyDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiProperty({ description: 'Jurisdicción (concept id)', format: 'uuid' })
  @IsUUID()
  jurisdictionConceptId!: string;

  /**
   * Identificador asociado a data classification.
   */
  @ApiProperty({
    description: 'Clasificación de datos (system_ops.data_classifications.id)',
    format: 'uuid',
  })
  @IsUUID()
  dataClassificationId!: string;

  /**
   * Identificador asociado a allowed storage region value set.
   */
  @ApiProperty({
    description: 'Value set de regiones de almacenamiento permitidas',
    format: 'uuid',
  })
  @IsUUID()
  allowedStorageRegionValueSetId!: string;

  /**
   * Identificador asociado a allowed processing region value set.
   */
  @ApiPropertyOptional({
    description: 'Value set de regiones de procesamiento permitidas',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  allowedProcessingRegionValueSetId?: string;

  /**
   * Identificador asociado a cross border transfer basis concept.
   */
  @ApiPropertyOptional({
    description: 'Base de transferencia transfronteriza (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  crossBorderTransferBasisConceptId?: string;

  /**
   * Valor de transfer impact assessment required mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  transferImpactAssessmentRequired?: boolean;

  /**
   * Valor de encryption key region locked mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  encryptionKeyRegionLocked?: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigencia desde (ISO)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigencia hasta (ISO)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `POST /admin/governance/tenant-residency-bindings` (UC-11-06). */
export class CreateTenantResidencyBindingDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant a vincular', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a residency policy.
   */
  @ApiProperty({
    description:
      'Política de residencia (polyglot_storage.residency_policies.id)',
    format: 'uuid',
  })
  @IsUUID()
  residencyPolicyId!: string;

  /**
   * Identificador asociado a primary region concept.
   */
  @ApiProperty({ description: 'Región primaria (concept id)', format: 'uuid' })
  @IsUUID()
  primaryRegionConceptId!: string;

  /**
   * Identificador asociado a disaster recovery region concept.
   */
  @ApiPropertyOptional({
    description: 'Región de recuperación ante desastres (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  disasterRecoveryRegionConceptId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Efectivo desde (ISO)' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}

/** Cuerpo de `POST /admin/governance/cross-border-transfers` (UC-11-07). */
export class CreateCrossBorderTransferDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant origen', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a data category concept.
   */
  @ApiProperty({
    description: 'Categoría de datos (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  dataCategoryConceptId!: string;

  /**
   * Identificador asociado a source region concept.
   */
  @ApiProperty({ description: 'Región origen (concept id)', format: 'uuid' })
  @IsUUID()
  sourceRegionConceptId!: string;

  /**
   * Identificador asociado a destination region concept.
   */
  @ApiProperty({ description: 'Región destino (concept id)', format: 'uuid' })
  @IsUUID()
  destinationRegionConceptId!: string;

  /**
   * Identificador asociado a transfer basis concept.
   */
  @ApiProperty({
    description: 'Base de transferencia (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  transferBasisConceptId!: string;

  /**
   * Identificador asociado a recipient tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant destinatario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  recipientTenantId?: string;

  /**
   * Valor de transfer reference mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Referencia idempotente de la transferencia',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  transferReference!: string;
}
