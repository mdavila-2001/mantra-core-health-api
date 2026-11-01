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
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

// ---------------------------------------------------------------------------
// UC-53-02 · Diagnósticos y equipo
// ---------------------------------------------------------------------------

/** Papel del diagnóstico en el caso. */
export type DiagnosisRole = 'PRIMARY' | 'SECONDARY' | 'POSTOPERATIVE';
export const DIAGNOSIS_ROLES = ['PRIMARY', 'SECONDARY', 'POSTOPERATIVE'] as const;

/**
 * Define el contrato validado para case diagnosis.
 */
export class CaseDiagnosisDto {
  /**
   * Identificador asociado a condition.
   *
   * Alternativa a `conditionCodeConceptId`: hay que indicar uno de los dos.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Condición ya registrada en la historia clínica',
  })
  @IsOptional()
  @IsUUID()
  conditionId?: string;

  /**
   * Código de la condición, cuando todavía no está en la historia.
   *
   * El diagnóstico postoperatorio se descubre en quirófano: exigir que alguien
   * lo registre antes como condición clínica obligaba al cirujano a una llamada
   * previa que además no puede hacer —`POST /clinical/conditions` es de
   * `CLINICIAN`/`PRACTITIONER`—, así que el paso quedaba fuera de su alcance.
   * Con este campo, la condición se crea junto al diagnóstico, en la misma
   * transacción y a través del servicio de `clinical`, que sigue siendo el
   * dueño de la historia.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Código de la condición a registrar si aún no existe',
  })
  @IsOptional()
  @IsUUID()
  conditionCodeConceptId?: string;

  /**
   * Valor de role mantenido por la instancia.
   */
  @ApiProperty({ enum: DIAGNOSIS_ROLES })
  @IsIn(DIAGNOSIS_ROLES)
  role!: DiagnosisRole;

  /**
   * Valor de present on admission mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false, description: 'Presente al ingresar' })
  @IsOptional()
  @IsBoolean()
  presentOnAdmission?: boolean;
}

/** Cuerpo de `POST /procedure-cases/{id}/diagnoses` (UC-53-02). */
export class AddDiagnosesDto {
  /**
   * Valor de diagnoses mantenido por la instancia.
   */
  @ApiProperty({
    type: [CaseDiagnosisDto],
    description: 'Diagnósticos del caso, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CaseDiagnosisDto)
  diagnoses!: CaseDiagnosisDto[];
}

/**
 * Define el contrato validado para diagnoses response.
 */
export class DiagnosesResponseDto {
  /**
   * Identificador asociado a procedure case.
   */
  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  /**
   * Valor de diagnosis ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  diagnosisIds!: string[];

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Diagnósticos que ya estaban registrados y se omitieron',
  })
  skipped!: number;
}

/** Papel del profesional en el equipo quirúrgico. */
export type TeamRole =
  | 'SURGEON'
  | 'ASSISTANT'
  | 'ANESTHESIOLOGIST'
  | 'SCRUB_NURSE'
  | 'CIRCULATING_NURSE';
export const TEAM_ROLES = [
  'SURGEON',
  'ASSISTANT',
  'ANESTHESIOLOGIST',
  'SCRUB_NURSE',
  'CIRCULATING_NURSE',
] as const;

/** Cuerpo de `POST /procedure-cases/{id}/team-members` (UC-53-02). */
export class AssignTeamMemberDto {
  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practitionerProfileId!: string;

  /**
   * Valor de role mantenido por la instancia.
   */
  @ApiProperty({ enum: TEAM_ROLES })
  @IsIn(TEAM_ROLES)
  role!: TeamRole;
}

/**
 * Las tres respuestas negativas del integrante a su participación.
 *
 * Aceptar tiene endpoint propio (`.../accept`) porque es la única que hace
 * avanzar el caso y la única que exige credencial vigente. Las otras tres
 * comparten forma —todas piden un motivo y ninguna deja al integrante
 * disponible— así que comparten endpoint y se distinguen por este campo.
 *
 * No son sinónimos y por eso no se colapsan en un solo «rechazado»: quien pide
 * una modificación **sigue queriendo participar**, y quien informa
 * indisponibilidad no está objetando la intervención. Al responsable le cambia
 * la decisión: en un caso negocia, en otro reemplaza.
 */
export type TeamParticipationResponse =
  'DECLINE' | 'REQUEST_CHANGE' | 'UNAVAILABLE';
export const TEAM_PARTICIPATION_RESPONSES = [
  'DECLINE',
  'REQUEST_CHANGE',
  'UNAVAILABLE',
] as const;

/** Cuerpo de `POST /procedure-cases/{id}/team-members/{memberId}/respond`. */
export class RespondTeamMemberDto {
  /**
   * Valor de response mantenido por la instancia.
   */
  @ApiProperty({
    enum: TEAM_PARTICIPATION_RESPONSES,
    description:
      'Rechazo, solicitud de modificación o indisponibilidad informada',
  })
  @IsIn(TEAM_PARTICIPATION_RESPONSES)
  response!: TeamParticipationResponse;

  /**
   * Valor de reason text mantenido por la instancia.
   *
   * Obligatorio: el motivo es lo que el responsable necesita para decidir si
   * negocia, reemplaza o reprograma. Sin él la notificación diría sólo que
   * alguien se bajó, que es justo lo que no ayuda.
   */
  @ApiProperty({
    description: 'Motivo de la respuesta (obligatorio)',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reasonText!: string;
}

/**
 * Define el contrato validado para team member response.
 */
export class TeamMemberResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a procedure case.
   */
  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de team size mantenido por la instancia.
   */
  @ApiProperty({ description: 'Miembros del equipo tras la asignación' })
  teamSize!: number;
}
