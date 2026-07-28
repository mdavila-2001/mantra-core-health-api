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
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a insert mode concept.
   */
  @ApiProperty({
    description: 'Modo de inserción (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  insertModeConceptId!: string;

  /**
   * Identificador asociado a update mode concept.
   */
  @ApiProperty({
    description: 'Modo de actualización (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  updateModeConceptId!: string;

  /**
   * Identificador asociado a delete mode concept.
   */
  @ApiProperty({ description: 'Modo de borrado (concept id)', format: 'uuid' })
  @IsUUID()
  deleteModeConceptId!: string;

  /**
   * Valor de requires reason mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresReason?: boolean;

  /**
   * Valor de requires approval mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  /**
   * Valor de dual control mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dualControl?: boolean;

  /**
   * Valor de max batch size mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxBatchSize?: number;
}

/** Cuerpo de `PATCH /admin/governance/entity-registry/{id}/write-policy` (UC-11-02). */
export class ApplyWritePolicyDto {
  /**
   * Identificador asociado a write policy.
   */
  @ApiProperty({
    description: 'Política de escritura a vincular',
    format: 'uuid',
  })
  @IsUUID()
  writePolicyId!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Cuerpo de `POST /admin/governance/retention-policies` (UC-11-03). */
export class CreateRetentionPolicyDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Valor de retention period days mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Periodo de retención en días' })
  @IsOptional()
  @IsInt()
  @Min(0)
  retentionPeriodDays?: number;

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
   * Identificador asociado a disposition concept.
   */
  @ApiPropertyOptional({
    description: 'Disposición al vencer (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dispositionConceptId?: string;

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
}

/** Cuerpo de `PATCH /admin/governance/entity-registry/{id}/retention` (UC-11-03). */
export class ApplyRetentionPolicyDto {
  /**
   * Identificador asociado a retention policy.
   */
  @ApiProperty({
    description: 'Política de retención a vincular',
    format: 'uuid',
  })
  @IsUUID()
  retentionPolicyId!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Razón (obligatoria por gobierno)',
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

/** Cuerpo de `POST /admin/governance/anonymization-rules` (UC-11-04). */
export class CreateAnonymizationRuleDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Identificador asociado a technique concept.
   */
  @ApiProperty({
    description: 'Técnica de anonimización (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  techniqueConceptId!: string;

  /**
   * Valor de parameters json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Parámetros de la técnica (JSON libre)' })
  @IsOptional()
  @IsObject()
  parametersJson?: Record<string, unknown>;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
