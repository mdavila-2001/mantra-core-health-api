import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const MOD_TARGET_TYPES = [
  'CONTENT',
  'USER',
  'COMMENT',
  'REVIEW',
] as const;
export const MOD_ACTIONS = [
  'REMOVE',
  'FLAG',
  'APPROVE',
  'RESTRICT',
  'DISMISS',
] as const;
export const MOD_REASONS = ['POLICY', 'ABUSE', 'SPAM', 'LEGAL'] as const;

/** Cuerpo de `POST /moderation/decisions` (UC-10-11). */
export class CreateModerationDecisionDto {
  /**
   * Valor de target type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de destino moderado',
    enum: MOD_TARGET_TYPES,
  })
  @IsIn(MOD_TARGET_TYPES)
  targetType!: string;

  /**
   * Identificador asociado a target.
   */
  @ApiProperty({
    description: 'Id del destino (validado vía entity_registry)',
    format: 'uuid',
  })
  @IsUUID()
  targetId!: string;

  /**
   * Valor de action mantenido por la instancia.
   */
  @ApiProperty({ description: 'Acción de moderación', enum: MOD_ACTIONS })
  @IsIn(MOD_ACTIONS)
  action!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Motivo de la decisión',
    enum: MOD_REASONS,
  })
  @IsOptional()
  @IsIn(MOD_REASONS)
  reason?: string;

  /**
   * Valor de policy version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión de política aplicada',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  policyVersion?: string;

  /**
   * Valor de evidence mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Evidencia estructurada de la decisión' })
  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;

  /**
   * Valor de governance mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'true si la decisión implica uso/gobernanza de datos (registra gobernanza)',
  })
  @IsOptional()
  governance?: boolean;

  /**
   * Identificador asociado a moderation decision.
   */
  @ApiPropertyOptional({
    description:
      'Id REAL de la decisión (FK community.moderation_decisions) para versionar su historial',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  moderationDecisionId?: string;
}

/** Resultado de una decisión de moderación. */
export class ModerationDecisionResultDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id del evento de moderación' })
  id!: string;

  /**
   * Identificador asociado a audit log.
   */
  @ApiProperty({ description: 'Id del evento de auditoría (provenance)' })
  auditLogId!: string;

  /**
   * Valor de history recorded mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si se versionó el historial de la decisión',
  })
  historyRecorded!: boolean;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Momento del registro',
    type: String,
    format: 'date-time',
  })
  recordedAt!: Date;
}
