import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /admin/governance/write-policies` (UC-11-02). */
export class CreateWritePolicyDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Modo de inserción (concept id)', format: 'uuid' })
  @IsUUID()
  insertModeConceptId!: string;

  @ApiProperty({ description: 'Modo de actualización (concept id)', format: 'uuid' })
  @IsUUID()
  updateModeConceptId!: string;

  @ApiProperty({ description: 'Modo de borrado (concept id)', format: 'uuid' })
  @IsUUID()
  deleteModeConceptId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresReason?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dualControl?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxBatchSize?: number;
}

/** Cuerpo de `PATCH /admin/governance/entity-registry/{id}/write-policy` (UC-11-02). */
export class ApplyWritePolicyDto {
  @ApiProperty({ description: 'Política de escritura a vincular', format: 'uuid' })
  @IsUUID()
  writePolicyId!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Cuerpo de `POST /admin/governance/retention-policies` (UC-11-03). */
export class CreateRetentionPolicyDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Periodo de retención en días' })
  @IsOptional()
  @IsInt()
  @Min(0)
  retentionPeriodDays?: number;

  @ApiPropertyOptional({ description: 'Base legal (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  legalBasisConceptId?: string;

  @ApiPropertyOptional({ description: 'Disposición al vencer (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  dispositionConceptId?: string;

  @ApiPropertyOptional({ description: 'Jurisdicción (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;
}

/** Cuerpo de `PATCH /admin/governance/entity-registry/{id}/retention` (UC-11-03). */
export class ApplyRetentionPolicyDto {
  @ApiProperty({ description: 'Política de retención a vincular', format: 'uuid' })
  @IsUUID()
  retentionPolicyId!: string;

  @ApiProperty({ description: 'Razón (obligatoria por gobierno)', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

/** Cuerpo de `POST /admin/governance/anonymization-rules` (UC-11-04). */
export class CreateAnonymizationRuleDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Técnica de anonimización (concept id)', format: 'uuid' })
  @IsUUID()
  techniqueConceptId!: string;

  @ApiPropertyOptional({ description: 'Parámetros de la técnica (JSON libre)' })
  @IsOptional()
  @IsObject()
  parametersJson?: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
