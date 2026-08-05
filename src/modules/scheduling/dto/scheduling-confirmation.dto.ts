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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de scope mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de alcance de la regla',
    enum: RULE_SCOPES,
  })
  @IsIn(RULE_SCOPES as readonly string[])
  scope!: RuleScope;

  /**
   * Identificador asociado a scope.
   */
  @ApiPropertyOptional({
    description:
      'Alcance concreto (practice/resource/service). Omitido = todo el tipo.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  scopeId?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Menor número = mayor prioridad',
    default: 100,
  })
  @IsOptional()
  @IsInt()
  priority?: number;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  effectiveFrom!: string;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveTo?: string;

  /**
   * Valor de condition mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Condición determinista { field, op, value } o combinador all/any/not.',
    type: Object,
  })
  @IsObject()
  condition!: RuleCondition;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ description: 'Decisión de la regla', enum: RULE_DECISIONS })
  @IsIn(RULE_DECISIONS as readonly string[])
  decision!: RuleDecision;
}

/**
 * Define el contrato validado para confirmation rule response.
 */
export class ConfirmationRuleResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a scope type concept.
   */
  @ApiProperty({ format: 'uuid' })
  scopeTypeConceptId!: string;

  /**
   * Identificador asociado a scope.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  scopeId?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiProperty()
  priority!: number;

  /**
   * Identificador asociado a decision concept.
   */
  @ApiProperty({ format: 'uuid' })
  decisionConceptId!: string;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @ApiProperty()
  enabled!: boolean;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty()
  version!: number;
}

/** Cuerpo de `POST /scheduling/confirmation-rules/evaluate` (C-11). */
export class EvaluateBookingRequestDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({
    description: 'Práctica de la solicitud',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Identificador asociado a resource.
   */
  @ApiPropertyOptional({
    description: 'Recurso de la solicitud',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  /**
   * Identificador asociado a service concept.
   */
  @ApiPropertyOptional({
    description: 'Servicio de la solicitud',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  /**
   * Valor de request data mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a rule.
   */
  @ApiPropertyOptional({
    description: 'Regla aplicada; ausente si ninguna resultó concluyente.',
    format: 'uuid',
  })
  ruleId?: string;

  /**
   * Valor de rule version mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Versión de la regla aplicada' })
  ruleVersion?: number;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Motivo de la decisión' })
  reason!: string;

  /**
   * Valor de variables mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Variables congeladas usadas en la evaluación',
    type: Object,
  })
  variables!: Record<string, unknown>;

  /**
   * Valor de evaluated rule ids mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Ids de reglas evaluadas antes de concluir',
    type: [String],
  })
  evaluatedRuleIds!: string[];
}

/**
 * Define el contrato validado para evaluate booking result.
 */
export class EvaluateBookingResultDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Decisión determinista',
    enum: RULE_DECISIONS,
  })
  decision!: RuleDecision;

  /**
   * Identificador asociado a decision concept.
   */
  @ApiProperty({ format: 'uuid' })
  decisionConceptId!: string;

  /**
   * Valor de explanation mantenido por la instancia.
   */
  @ApiProperty({ type: EvaluationExplanationDto })
  explanation!: EvaluationExplanationDto;
}
