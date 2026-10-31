import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Tipos de regla de la organización (L1), CONTRATO-GOBIERNO §4.3. */
export const GOVERNANCE_RULE_KINDS = [
  'DENY_PERMISSION',
  'CEILING',
  'REQUIRE_CONDITION',
  'FIELD_FLOOR',
] as const;
export type GovernanceRuleKind = (typeof GOVERNANCE_RULE_KINDS)[number];

/** Visibilidad máxima que deja un piso de campo. */
export const FIELD_FLOOR_VISIBILITIES = [
  'PARTIAL',
  'REDACT',
  'NULLIFY',
] as const;

/** Mismo patrón que `ck_governance_rules_pattern`: un átomo o `prefijo.*`. */
export const GOVERNANCE_PATTERN_REGEX =
  /^([a-z_]+(\.[a-z_]+){2,3}|[a-z_]+(\.[a-z_]+){0,2}\.\*)$/;

export class CreateGovernanceRuleDto {
  @ApiProperty({ enum: GOVERNANCE_RULE_KINDS })
  @IsIn(GOVERNANCE_RULE_KINDS)
  kind!: GovernanceRuleKind;

  @ApiPropertyOptional({
    description:
      'Plantilla a la que aplica; vacío = todas (obligatoria en CEILING).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  roleTemplateCode?: string;

  @ApiProperty({ description: 'Átomo o prefijo con comodín (`billing.*`).' })
  @IsString()
  @Matches(GOVERNANCE_PATTERN_REGEX, {
    message: 'El patrón debe ser un permiso o un prefijo terminado en .*',
  })
  permissionPattern!: string;

  @ApiPropertyOptional({
    description: 'Texto para la persona cuando la regla niega.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;

  @ApiPropertyOptional({
    description: 'Condición v1 (solo en REQUIRE_CONDITION).',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  @ApiPropertyOptional({
    enum: ['ALL'],
    description: 'Solo `ALL`: una regla no se vuelve opcional.',
  })
  @IsOptional()
  @IsString()
  appliesTo?: string;

  @ApiPropertyOptional({ enum: FIELD_FLOOR_VISIBILITIES })
  @IsOptional()
  @IsIn(FIELD_FLOOR_VISIBILITIES)
  maxVisibility?: (typeof FIELD_FLOOR_VISIBILITIES)[number];

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

export class UpdateGovernanceRuleDto {
  @ApiProperty({
    description: 'Versión de la fila que usted leyó (`rowVersion`).',
  })
  @IsInt()
  @Min(1)
  expectedRowVersion!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: FIELD_FLOOR_VISIBILITIES })
  @IsOptional()
  @IsIn(FIELD_FLOOR_VISIBILITIES)
  maxVisibility?: (typeof FIELD_FLOOR_VISIBILITIES)[number];

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

export class RetireRuleDto {
  @ApiPropertyOptional({ description: 'Por qué se retira.' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason?: string;
}

export class ListGovernanceRulesQueryDto {
  @ApiPropertyOptional({ enum: GOVERNANCE_RULE_KINDS })
  @IsOptional()
  @IsIn(GOVERNANCE_RULE_KINDS)
  kind?: GovernanceRuleKind;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'REVOKED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'REVOKED'])
  status?: 'ACTIVE' | 'REVOKED';
}

export class GovernanceRuleViewDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: GOVERNANCE_RULE_KINDS }) kind!: GovernanceRuleKind;
  @ApiProperty({ enum: ['ACTIVE', 'REVOKED'] }) status!: 'ACTIVE' | 'REVOKED';
  @ApiPropertyOptional() roleTemplateCode?: string;
  @ApiProperty() permissionPattern!: string;
  @ApiPropertyOptional() message?: string;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  condition?: Record<string, unknown>;
  @ApiPropertyOptional({ enum: FIELD_FLOOR_VISIBILITIES })
  maxVisibility?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validFrom?: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) validTo?: Date;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
  @ApiProperty() rowVersion!: number;
}

export class ListGovernanceRulesResponseDto {
  @ApiProperty({ type: [GovernanceRuleViewDto] })
  items!: GovernanceRuleViewDto[];
  @ApiProperty() count!: number;
}
