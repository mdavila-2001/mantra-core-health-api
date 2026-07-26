import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const MOD_TARGET_TYPES = ['CONTENT', 'USER', 'COMMENT', 'REVIEW'] as const;
export const MOD_ACTIONS = ['REMOVE', 'FLAG', 'APPROVE', 'RESTRICT', 'DISMISS'] as const;
export const MOD_REASONS = ['POLICY', 'ABUSE', 'SPAM', 'LEGAL'] as const;

/** Cuerpo de `POST /moderation/decisions` (UC-10-11). */
export class CreateModerationDecisionDto {
  @ApiProperty({ description: 'Tipo de destino moderado', enum: MOD_TARGET_TYPES })
  @IsIn(MOD_TARGET_TYPES as unknown as string[])
  targetType!: string;

  @ApiProperty({ description: 'Id del destino (validado vía entity_registry)', format: 'uuid' })
  @IsUUID()
  targetId!: string;

  @ApiProperty({ description: 'Acción de moderación', enum: MOD_ACTIONS })
  @IsIn(MOD_ACTIONS as unknown as string[])
  action!: string;

  @ApiPropertyOptional({ description: 'Motivo de la decisión', enum: MOD_REASONS })
  @IsOptional()
  @IsIn(MOD_REASONS as unknown as string[])
  reason?: string;

  @ApiPropertyOptional({ description: 'Versión de política aplicada', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  policyVersion?: string;

  @ApiPropertyOptional({ description: 'Evidencia estructurada de la decisión' })
  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'true si la decisión implica uso/gobernanza de datos (registra gobernanza)',
  })
  @IsOptional()
  governance?: boolean;

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
  @ApiProperty({ description: 'Id del evento de moderación' })
  id!: string;

  @ApiProperty({ description: 'Id del evento de auditoría (provenance)' })
  auditLogId!: string;

  @ApiProperty({ description: 'true si se versionó el historial de la decisión' })
  historyRecorded!: boolean;

  @ApiProperty({ description: 'Momento del registro', type: String, format: 'date-time' })
  recordedAt!: Date;
}
