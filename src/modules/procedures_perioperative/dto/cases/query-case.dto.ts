import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/** Filtros de `GET /procedure-cases` (agenda quirúrgica). */
export class ListCasesQueryDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Paciente' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a operating room.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Quirófano reservado' })
  @IsOptional()
  @IsUUID()
  operatingRoomId?: string;

  /**
   * Identificador asociado a primary surgeon profile.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Cirujano principal' })
  @IsOptional()
  @IsUUID()
  primarySurgeonProfileId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Estado del caso' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;

  /**
   * Valor de from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Inicio de la ventana (inclusive)',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  /**
   * Valor de to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Fin de la ventana (exclusivo)',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  /**
   * Valor de offset mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/** Caso tal como aparece en la agenda quirúrgica. */
/** Quirófano de un caso. */
export class CaseOperatingRoomDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
}

/** Bloque de quirófano de un caso, con el dueño resuelto. */
export class CaseBlockRefDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'Servicio (unidad) o cirujano dueño del bloque' })
  label!: string;
}

/** Concepto `{code, display}`. */
export class CaseConceptRefDto {
  @ApiProperty() code!: string;
  @ApiProperty() display!: string;
}

/** Fase del check-list OMS. */
export class ChecklistPhaseDto {
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;
}

/** Check-list OMS del caso. */
export class CaseChecklistDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: ChecklistPhaseDto }) signIn!: ChecklistPhaseDto;
  @ApiProperty({ type: ChecklistPhaseDto }) timeOut!: ChecklistPhaseDto;
  @ApiProperty({ type: ChecklistPhaseDto }) signOut!: ChecklistPhaseDto;
}

/** Evento de sala del caso. */
export class CaseRoomEventDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({
    description:
      'PATIENT_IN_ROOM, ANESTHESIA_START, INCISION, CLOSURE, PATIENT_OUT_OF_ROOM, CLEANUP_START, CLEANUP_END, ROOM_READY',
  })
  eventCode!: string;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  occurredAt!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  recordedByUserId!: string | null;
}

/** Orden de limpieza del recambio de sala (F2). */
export class CaseTurnoverCleaningDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ nullable: true, type: String }) status!: string | null;
  @ApiProperty() rowVersion!: number;
  @ApiProperty({ type: [String] }) allowedTransitions!: string[];
}

export class CaseSummaryDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de case number mantenido por la instancia.
   */
  @ApiProperty()
  caseNumber!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a primary surgeon profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  primarySurgeonProfileId?: string;

  /**
   * Identificador asociado a operating room.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  operatingRoomId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de scheduled start at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  scheduledStartAt?: Date;

  /**
   * Valor de scheduled end at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  scheduledEndAt?: Date;

  @ApiPropertyOptional({ type: () => CaseOperatingRoomDto, nullable: true })
  operatingRoom?: CaseOperatingRoomDto | null;

  @ApiPropertyOptional({ type: () => CaseBlockRefDto, nullable: true })
  block?: CaseBlockRefDto | null;

  @ApiPropertyOptional({ type: () => CaseConceptRefDto, nullable: true })
  caseType?: CaseConceptRefDto | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  encounterId?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Inicio reservado (programado − preparación)',
  })
  reservedStartAt?: Date | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Fin reservado (programado + limpieza)',
  })
  reservedEndAt?: Date | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  prepMinutes?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  cleanupMinutes?: number | null;
}

/** Página de la agenda quirúrgica. */
export class CaseListResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [CaseSummaryDto] })
  items!: CaseSummaryDto[];

  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiProperty({ description: 'Casos que cumplen el filtro, sin paginar' })
  total!: number;
}

/** Integrante del equipo tal como lo devuelve la consulta del caso. */
export class TeamMemberSummaryDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  /**
   * Identificador asociado a team role concept.
   */
  @ApiProperty({ format: 'uuid' })
  teamRoleConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Asignado o aceptado' })
  statusConceptId!: string;
}
