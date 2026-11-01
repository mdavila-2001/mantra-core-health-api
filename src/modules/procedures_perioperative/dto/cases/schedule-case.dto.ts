import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

// ---------------------------------------------------------------------------
// UC-53-01 · Programación del caso
// ---------------------------------------------------------------------------

/** Naturaleza del caso quirúrgico. */
export type SurgicalCaseType = 'ELECTIVE' | 'URGENT' | 'EMERGENCY';
export const CASE_TYPES = ['ELECTIVE', 'URGENT', 'EMERGENCY'] as const;

/** Prioridad con la que entra el caso. */
export type CasePriority = 'ROUTINE' | 'URGENT' | 'STAT';
export const CASE_PRIORITIES = ['ROUTINE', 'URGENT', 'STAT'] as const;

/** Cuerpo de `POST /procedure-cases` (UC-53-01). */
export class ScheduleCaseDto {
  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a service request.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Solicitud que origina el caso',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  /**
   * Identificador asociado a primary procedure.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  primaryProcedureId?: string;

  /**
   * Valor de case type mantenido por la instancia.
   */
  @ApiProperty({ enum: CASE_TYPES })
  @IsIn(CASE_TYPES)
  caseType!: SurgicalCaseType;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiProperty({ enum: CASE_PRIORITIES })
  @IsIn(CASE_PRIORITIES)
  priority!: CasePriority;

  /**
   * Identificador asociado a surgical specialty concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  surgicalSpecialtyConceptId?: string;

  /**
   * Identificador asociado a requested by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requestedByProfileId?: string;

  /**
   * Identificador asociado a primary surgeon profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Cirujano principal' })
  @IsUUID()
  primarySurgeonProfileId!: string;

  /**
   * Identificador asociado a practice site.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /**
   * Identificador asociado a operating room.
   */
  @ApiProperty({ format: 'uuid', description: 'Quirófano que se reserva' })
  @IsUUID()
  operatingRoomId!: string;

  /**
   * Valor de scheduled start at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  scheduledStartAt!: string;

  /**
   * Valor de scheduled end at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  scheduledEndAt!: string;

  /**
   * Valor de urgency reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Justificación de la urgencia; obligatoria si el caso no es electivo',
  })
  @IsOptional()
  @IsString()
  urgencyReasonText?: string;
}

/**
 * Define el contrato validado para case response.
 */
export class CaseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de case number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número del caso' })
  caseNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a operating room.
   */
  @ApiProperty({ format: 'uuid', description: 'Quirófano reservado' })
  operatingRoomId!: string;

  /**
   * Identificador asociado a milestone.
   */
  @ApiProperty({ format: 'uuid', description: 'Hito de programación creado' })
  milestoneId!: string;
}

/**
 * Cuerpo de `PATCH /procedure-cases/{id}` (C-13 · CAN-INT-001).
 * Corregir datos del caso todavía en borrador; el cambio de paciente está
 * restringido por estado y por dependencias (véase el servicio).
 */
export class UpdateCaseDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Paciente de la intervención. Sólo corregible con el caso en borrador y sin dependencias (CAN-INT-001).',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: CASE_PRIORITIES })
  @IsOptional()
  @IsIn(CASE_PRIORITIES)
  priority?: CasePriority;

  /**
   * Valor de scheduled start at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  scheduledStartAt?: string;

  /**
   * Valor de scheduled end at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  scheduledEndAt?: string;

  /**
   * Valor de urgency reason text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  urgencyReasonText?: string;
}

/**
 * Define el contrato validado para update case response.
 */
export class UpdateCaseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Paciente vigente del caso' })
  patientProfileId!: string;

  /**
   * Valor de patient changed mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se corrigió el paciente del caso' })
  patientChanged!: boolean;

  /**
   * Valor de reacceptance required mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si la modificación fue relevante y el equipo debe volver a aceptar',
  })
  reacceptanceRequired!: boolean;

  /**
   * Valor de acceptances invalidated mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Aceptaciones que quedaron invalidadas por la modificación relevante',
  })
  acceptancesInvalidated!: number;
}

/**
 * Respuesta de `POST /procedure-cases/{id}/confirm` (C-14 · CAN-INT-002).
 */
export class ConfirmCaseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Estado tras confirmar' })
  statusConceptId!: string;

  /**
   * Valor de team verified mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Miembros del equipo con credencial verificada al confirmar',
  })
  teamVerified!: number;
}
