import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

// ---------------------------------------------------------------------------
// UC-53-05 · Checklist de seguridad
// ---------------------------------------------------------------------------

/** Fase del checklist quirúrgico de la OMS. */
export type ChecklistPhase = 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT';
export const CHECKLIST_PHASES = ['SIGN_IN', 'TIME_OUT', 'SIGN_OUT'] as const;

/** Cómo se responde a un ítem del checklist. */
export type ResponseStatus = 'CONFIRMED' | 'NOT_APPLICABLE' | 'EXCEPTION';
export const RESPONSE_STATUSES = [
  'CONFIRMED',
  'NOT_APPLICABLE',
  'EXCEPTION',
] as const;

/**
 * Define el contrato validado para checklist response item.
 */
export class ChecklistResponseItemDto {
  /**
   * Identificador asociado a item.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  itemId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ enum: RESPONSE_STATUSES })
  @IsIn(RESPONSE_STATUSES)
  status!: ResponseStatus;

  /**
   * Valor de response boolean mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  responseBoolean?: boolean;

  /**
   * Valor de response text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responseText?: string;

  /**
   * Valor de exception reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Justificación; obligatoria cuando la respuesta es EXCEPTION',
  })
  @IsOptional()
  @IsString()
  exceptionReason?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/safety-checklists/{cid}/responses` (UC-53-05). */
export class SubmitChecklistPhaseDto {
  /**
   * Valor de phase mantenido por la instancia.
   */
  @ApiProperty({ enum: CHECKLIST_PHASES })
  @IsIn(CHECKLIST_PHASES)
  phase!: ChecklistPhase;

  /**
   * Identificador asociado a responded by profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Profesional que responde' })
  @IsUUID()
  respondedByProfileId!: string;

  /**
   * Valor de responses mantenido por la instancia.
   */
  @ApiProperty({
    type: [ChecklistResponseItemDto],
    description: 'Respuestas de la fase',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChecklistResponseItemDto)
  responses!: ChecklistResponseItemDto[];
}

/**
 * Define el contrato validado para checklist phase response.
 */
export class ChecklistPhaseResponseDto {
  /**
   * Identificador asociado a checklist.
   */
  @ApiProperty({ format: 'uuid' })
  checklistId!: string;

  /**
   * Valor de recorded mantenido por la instancia.
   */
  @ApiProperty({ description: 'Respuestas registradas en esta fase' })
  recorded!: number;

  /**
   * Valor de phase completed mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la fase quedó completa' })
  phaseCompleted!: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a milestone.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Hito de time-out, si la fase completada fue esa',
  })
  milestoneId?: string;
}
