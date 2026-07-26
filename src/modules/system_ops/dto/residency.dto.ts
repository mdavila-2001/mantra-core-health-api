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
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Jurisdicción (concept id)', format: 'uuid' })
  @IsUUID()
  jurisdictionConceptId!: string;

  @ApiProperty({ description: 'Clasificación de datos (system_ops.data_classifications.id)', format: 'uuid' })
  @IsUUID()
  dataClassificationId!: string;

  @ApiProperty({ description: 'Value set de regiones de almacenamiento permitidas', format: 'uuid' })
  @IsUUID()
  allowedStorageRegionValueSetId!: string;

  @ApiPropertyOptional({ description: 'Value set de regiones de procesamiento permitidas', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  allowedProcessingRegionValueSetId?: string;

  @ApiPropertyOptional({ description: 'Base de transferencia transfronteriza (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  crossBorderTransferBasisConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  transferImpactAssessmentRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  encryptionKeyRegionLocked?: boolean;

  @ApiPropertyOptional({ description: 'Vigencia desde (ISO)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Vigencia hasta (ISO)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `POST /admin/governance/tenant-residency-bindings` (UC-11-06). */
export class CreateTenantResidencyBindingDto {
  @ApiProperty({ description: 'Tenant a vincular', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Política de residencia (polyglot_storage.residency_policies.id)', format: 'uuid' })
  @IsUUID()
  residencyPolicyId!: string;

  @ApiProperty({ description: 'Región primaria (concept id)', format: 'uuid' })
  @IsUUID()
  primaryRegionConceptId!: string;

  @ApiPropertyOptional({ description: 'Región de recuperación ante desastres (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  disasterRecoveryRegionConceptId?: string;

  @ApiPropertyOptional({ description: 'Efectivo desde (ISO)' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}

/** Cuerpo de `POST /admin/governance/cross-border-transfers` (UC-11-07). */
export class CreateCrossBorderTransferDto {
  @ApiProperty({ description: 'Tenant origen', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Categoría de datos (concept id)', format: 'uuid' })
  @IsUUID()
  dataCategoryConceptId!: string;

  @ApiProperty({ description: 'Región origen (concept id)', format: 'uuid' })
  @IsUUID()
  sourceRegionConceptId!: string;

  @ApiProperty({ description: 'Región destino (concept id)', format: 'uuid' })
  @IsUUID()
  destinationRegionConceptId!: string;

  @ApiProperty({ description: 'Base de transferencia (concept id)', format: 'uuid' })
  @IsUUID()
  transferBasisConceptId!: string;

  @ApiPropertyOptional({ description: 'Tenant destinatario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  recipientTenantId?: string;

  @ApiProperty({ description: 'Referencia idempotente de la transferencia', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  transferReference!: string;
}
