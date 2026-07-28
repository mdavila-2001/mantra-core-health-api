import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsIn,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';
import type { RuleCondition } from '../entities';

/** Tipo de alcance admitido para una regla de confirmación. */
export type RuleScope = 'TENANT' | 'PRACTICE' | 'RESOURCE' | 'SERVICE';
export const RULE_SCOPES: readonly RuleScope[] = [
  'TENANT',
  'PRACTICE',
  'RESOURCE',
  'SERVICE',
];

/** Decisión que puede fijar una regla. */
export type RuleDecision = 'AUTO_CONFIRM' | 'AUTO_REJECT' | 'MANUAL_REVIEW';
export const RULE_DECISIONS: readonly RuleDecision[] = [
  'AUTO_CONFIRM',
  'AUTO_REJECT',
  'MANUAL_REVIEW',
];

/** Cuerpo de `POST /scheduling/confirmation-rules` (C-11). */
export class CreateConfirmationRuleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Tipo de alcance de la regla', enum: RULE_SCOPES })
  @IsIn(RULE_SCOPES as readonly string[])
  scope!: RuleScope;

  @ApiPropertyOptional({
    description: 'Alcance concreto (practice/resource/service). Omitido = todo el tipo.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  scopeId?: string;

  @ApiPropertyOptional({
    description: 'Menor número = mayor prioridad',
    default: 100,
  })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  effectiveFrom!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveTo?: string;

  @ApiProperty({
    description:
      'Condición determinista { field, op, value } o combinador all/any/not.',
    type: Object,
  })
  @IsObject()
  condition!: RuleCondition;

  @ApiProperty({ description: 'Decisión de la regla', enum: RULE_DECISIONS })
  @IsIn(RULE_DECISIONS as readonly string[])
  decision!: RuleDecision;
}

export class ConfirmationRuleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  scopeTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  scopeId?: string;

  @ApiProperty()
  priority!: number;

  @ApiProperty({ format: 'uuid' })
  decisionConceptId!: string;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  version!: number;
}

/** Cuerpo de `POST /scheduling/confirmation-rules/evaluate` (C-11). */
export class EvaluateBookingRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ description: 'Práctica de la solicitud', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({ description: 'Recurso de la solicitud', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Servicio de la solicitud', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  @ApiProperty({
    description:
      'Datos congelados de la solicitud sobre los que se evalúan las condiciones.',
    type: Object,
  })
  @IsObject()
  requestData!: Record<string, unknown>;
}

/** Explicación reproducible de la decisión tomada. */
export class EvaluationExplanationDto {
  @ApiPropertyOptional({
    description: 'Regla aplicada; ausente si ninguna resultó concluyente.',
    format: 'uuid',
  })
  ruleId?: string;

  @ApiPropertyOptional({ description: 'Versión de la regla aplicada' })
  ruleVersion?: number;

  @ApiProperty({ description: 'Motivo de la decisión' })
  reason!: string;

  @ApiProperty({
    description: 'Variables congeladas usadas en la evaluación',
    type: Object,
  })
  variables!: Record<string, unknown>;

  @ApiProperty({
    description: 'Ids de reglas evaluadas antes de concluir',
    type: [String],
  })
  evaluatedRuleIds!: string[];
}

export class EvaluateBookingResultDto {
  @ApiProperty({
    description: 'Decisión determinista',
    enum: RULE_DECISIONS,
  })
  decision!: RuleDecision;

  @ApiProperty({ format: 'uuid' })
  decisionConceptId!: string;

  @ApiProperty({ type: EvaluationExplanationDto })
  explanation!: EvaluationExplanationDto;
}
