import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Lateralidad del sitio anatómico. */
export type Laterality = 'LEFT' | 'RIGHT' | 'BILATERAL';
const LATERALITIES = ['LEFT', 'RIGHT', 'BILATERAL'] as const;

/** Gravedad de un evento clínico. */
export type ClinicalSeverity = 'ROUTINE' | 'MINOR' | 'MAJOR' | 'CRITICAL';
const CLINICAL_SEVERITIES = ['ROUTINE', 'MINOR', 'MAJOR', 'CRITICAL'] as const;

// ---------------------------------------------------------------------------
// UC-53-01 · Programación del caso
// ---------------------------------------------------------------------------

/** Naturaleza del caso quirúrgico. */
export type SurgicalCaseType = 'ELECTIVE' | 'URGENT' | 'EMERGENCY';
const CASE_TYPES = ['ELECTIVE', 'URGENT', 'EMERGENCY'] as const;

/** Prioridad con la que entra el caso. */
export type CasePriority = 'ROUTINE' | 'URGENT' | 'STAT';
const CASE_PRIORITIES = ['ROUTINE', 'URGENT', 'STAT'] as const;

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

// ---------------------------------------------------------------------------
// UC-53-02 · Diagnósticos y equipo
// ---------------------------------------------------------------------------

/** Papel del diagnóstico en el caso. */
export type DiagnosisRole = 'PRIMARY' | 'SECONDARY' | 'POSTOPERATIVE';
const DIAGNOSIS_ROLES = ['PRIMARY', 'SECONDARY', 'POSTOPERATIVE'] as const;

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
const TEAM_ROLES = [
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
const TEAM_PARTICIPATION_RESPONSES = [
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

// ---------------------------------------------------------------------------
// UC-53-03 · Valoración preoperatoria
// ---------------------------------------------------------------------------

/** Aptitud del paciente para la cirugía. */
export type FitnessStatus = 'FIT' | 'FIT_WITH_CAUTION' | 'UNFIT';
const FITNESS_STATUSES = ['FIT', 'FIT_WITH_CAUTION', 'UNFIT'] as const;

/** Clase ASA del paciente. */
export type AsaClass = 'I' | 'II' | 'III' | 'IV' | 'V';
const ASA_CLASSES = ['I', 'II', 'III', 'IV', 'V'] as const;

/** Modelo con el que se calcula la puntuación de riesgo. */
export type RiskModel = 'ASA' | 'RCRI' | 'APFEL';
const RISK_MODELS = ['ASA', 'RCRI', 'APFEL'] as const;

/**
 * Define el contrato validado para risk score.
 */
export class RiskScoreDto {
  /**
   * Valor de model mantenido por la instancia.
   */
  @ApiProperty({ enum: RISK_MODELS })
  @IsIn(RISK_MODELS)
  model!: RiskModel;

  /**
   * Valor de model version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión del modelo aplicada', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  modelVersion!: string;

  /**
   * Valor de score value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Puntuación obtenida' })
  @IsNumberString()
  scoreValue!: string;

  /**
   * Valor de inputs json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Entradas con las que se calculó' })
  @IsOptional()
  @IsObject()
  inputsJson?: Record<string, unknown>;

  /**
   * Valor de interpretation text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interpretationText?: string;
}

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

/**
 * Detalle completo del caso quirúrgico.
 *
 * Va agregado a propósito: quien abre un caso necesita a la vez su equipo, sus
 * diagnósticos, sus órdenes, la valoración, el plan anestésico y el informe.
 * Servirlo en una sola respuesta evita que la pantalla encadene ocho llamadas
 * —y que muestre un caso a medias si una de ellas falla.
 */
export class CaseDetailDto {
  /**
   * Datos de cabecera del caso.
   */
  @ApiProperty({ type: CaseSummaryDto })
  case!: CaseSummaryDto;

  /**
   * Valor de diagnoses mantenido por la instancia.
   */
  @ApiProperty({
    isArray: true,
    description: 'Diagnósticos del caso con su papel y orden',
  })
  diagnoses!: {
    /** Identificador del diagnóstico del caso. */
    id: string;
    /** Condición clínica a la que apunta. */
    conditionId: string;
    /** Papel del diagnóstico (principal, secundario, postoperatorio). */
    diagnosisRoleConceptId: string;
    /** Orden dentro del caso. */
    sequenceNumber: number;
  }[];

  /**
   * Valor de team mantenido por la instancia.
   */
  @ApiProperty({ type: [TeamMemberSummaryDto] })
  team!: TeamMemberSummaryDto[];

  /**
   * Valor de milestones mantenido por la instancia.
   */
  @ApiProperty({ isArray: true, description: 'Hitos del caso' })
  milestones!: {
    /** Identificador del hito. */
    id: string;
    /** Tipo de hito. */
    milestoneTypeConceptId: string;
    /** Estado del hito. */
    statusConceptId: string;
    /** Momento planificado, si lo tiene. */
    plannedAt?: Date;
    /** Momento en que se alcanzó, si ya ocurrió. */
    reachedAt?: Date;
  }[];

  /**
   * Valor de preoperative orders mantenido por la instancia.
   */
  @ApiProperty({ isArray: true, description: 'Órdenes preoperatorias' })
  preoperativeOrders!: {
    /** Identificador de la orden. */
    id: string;
    /** Orden clínica a la que apunta. */
    serviceRequestId: string;
    /** Papel de la orden. */
    orderRoleConceptId: string;
    /** Estado: pendiente o verificada. */
    statusConceptId: string;
  }[];

  /**
   * Valor de preoperative assessment mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Valoración preoperatoria, si ya se hizo',
  })
  preoperativeAssessment?: {
    /** Identificador de la valoración. */
    id: string;
    /** Aptitud del paciente para la intervención. */
    fitnessStatusConceptId: string;
    /** Clase ASA, si se registró. */
    asaClassConceptId?: string;
  } | null;

  /**
   * Valor de anesthesia plan mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Plan anestésico, si ya se redactó' })
  anesthesiaPlan?: {
    /** Identificador del plan. */
    id: string;
    /** Tipo de anestesia previsto. */
    anesthesiaTypeConceptId: string;
    /** Estado del plan: borrador o aprobado. */
    statusConceptId: string;
  } | null;

  /**
   * Valor de operative reports mantenido por la instancia.
   */
  @ApiProperty({
    isArray: true,
    description: 'Versiones del informe operatorio, de la última a la primera',
  })
  operativeReports!: {
    /** Identificador del informe. */
    id: string;
    /** Número de versión. */
    reportVersion: number;
    /** Estado: borrador o firmado. */
    statusConceptId: string;
    /** Cuándo se firmó, si ya ocurrió. */
    signedAt?: Date;
  }[];

  /**
   * Pasos operatorios, del primero al último.
   *
   * Se agregan a la respuesta porque hasta ahora sólo se podían escribir: los
   * `POST` de pasos, hallazgos e implantes no tenían ninguna lectura que los
   * devolviera, así que el registro intraoperatorio entraba y no volvía a salir
   * por ninguna parte de la API.
   */
  @ApiProperty({
    type: () => [OperativeStepItemDto],
    description: 'Pasos de la intervención, en orden',
  })
  operativeSteps!: OperativeStepItemDto[];

  /** Hallazgos intraoperatorios, del más reciente al más antiguo. */
  @ApiProperty({
    isArray: true,
    description: 'Hallazgos registrados durante la intervención',
  })
  findings!: {
    /** Identificador del hallazgo. */
    id: string;
    /** Paso en el que se halló, si se ató a uno. */
    operativeStepId?: string;
    /** Código del hallazgo. */
    findingCodeConceptId: string;
    /** Descripción escrita por quien lo halló. */
    findingText: string;
    /** Sitio anatómico, si se registró. */
    bodySiteConceptId?: string;
    /** Lateralidad, si aplica. */
    lateralityConceptId?: string;
    /** Severidad, si se graduó. */
    severityConceptId?: string;
    /** Profesional que lo registró, si consta. */
    recordedByProfileId?: string;
    /** Cuándo se registró. */
    recordedAt: Date;
  }[];

  /**
   * Implantes del caso, con sus identificadores.
   *
   * Los identificadores (UDI, lote, serie) van anidados y no en una lista
   * aparte: un implante sin su lote no es trazable, que es justamente para lo
   * que se lleva un registro de implantes —una alerta de retiro del mercado se
   * resuelve por lote, no por modelo.
   */
  @ApiProperty({
    isArray: true,
    description: 'Implantes colocados, con sus identificadores',
  })
  implants!: {
    /** Identificador del implante en el caso. */
    id: string;
    /** Procedimiento clínico al que se imputa. */
    procedureId: string;
    /** Dispositivo implantado. */
    implantDeviceId: string;
    /** Papel del implante en la intervención. */
    implantRoleConceptId: string;
    /** Sitio anatómico, si se registró. */
    bodySiteConceptId?: string;
    /** Lateralidad, si aplica. */
    lateralityConceptId?: string;
    /** Cuándo se implantó. */
    implantedAt: Date;
    /** Cuándo se explantó, si se explantó. */
    explantedAt?: Date;
    /** Estado del implante, si se registró. */
    statusConceptId?: string;
    /** UDI, lote y serie del implante. */
    identifiers: {
      /** Identificador de la fila. */
      id: string;
      /** Tipo de identificador (UDI-DI, UDI-PI, …). */
      identifierTypeConceptId: string;
      /** Valor del identificador. */
      identifierValue: string;
      /** Sistema emisor, si consta. */
      issuingSystem?: string;
      /** Número de lote, si consta. */
      lotNumber?: string;
      /** Número de serie, si consta. */
      serialNumber?: string;
      /** Vencimiento, si consta. */
      expirationDate?: Date;
    }[];
  }[];
}

/** Cuerpo de `POST /procedure-cases/{id}/preoperative-assessments` (UC-53-03). */
export class CreatePreopAssessmentDto {
  /**
   * Valor de assessment type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['ANESTHESIA', 'SURGICAL'] })
  @IsIn(['ANESTHESIA', 'SURGICAL'])
  assessmentType!: 'ANESTHESIA' | 'SURGICAL';

  /**
   * Identificador asociado a assessed by profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Profesional que valora' })
  @IsUUID()
  assessedByProfileId!: string;

  /**
   * Valor de fitness status mantenido por la instancia.
   */
  @ApiProperty({ enum: FITNESS_STATUSES })
  @IsIn(FITNESS_STATUSES)
  fitnessStatus!: FitnessStatus;

  /**
   * Valor de asa class mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ASA_CLASSES })
  @IsOptional()
  @IsIn(ASA_CLASSES)
  asaClass?: AsaClass;

  /**
   * Valor de allergies reviewed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Se revisaron las alergias del paciente' })
  @IsBoolean()
  allergiesReviewed!: boolean;

  /**
   * Valor de medications reviewed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Se revisó la medicación del paciente' })
  @IsBoolean()
  medicationsReviewed!: boolean;

  /**
   * Valor de anticoagulation plan text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  anticoagulationPlanText?: string;

  /**
   * Valor de fasting instructions text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fastingInstructionsText?: string;

  /**
   * Valor de assessment json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Detalle estructurado de la valoración' })
  @IsOptional()
  @IsObject()
  assessmentJson?: Record<string, unknown>;

  /**
   * Valor de risk scores mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [RiskScoreDto],
    description: 'Puntuaciones de riesgo calculadas',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskScoreDto)
  riskScores?: RiskScoreDto[];
}

/**
 * Define el contrato validado para preop assessment response.
 */
export class PreopAssessmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a fitness status concept.
   */
  @ApiProperty({ format: 'uuid' })
  fitnessStatusConceptId!: string;

  /**
   * Valor de risk score ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  riskScoreIds!: string[];

  /**
   * Identificador asociado a milestone.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Hito de aptitud preoperatoria, si el paciente quedó apto',
  })
  milestoneId?: string;
}

// ---------------------------------------------------------------------------
// UC-53-04 · Verificación de órdenes
// ---------------------------------------------------------------------------

/** Papel de la orden preoperatoria. */
export type PreopOrderRole = 'LAB' | 'IMAGING' | 'CONSULT' | 'MEDICATION';
const PREOP_ORDER_ROLES = ['LAB', 'IMAGING', 'CONSULT', 'MEDICATION'] as const;

/**
 * Cuerpo de `POST /procedure-cases/{id}/preoperative-orders` (UC-53-04).
 *
 * El endpoint faltaba: `PeriopPreopRepository.createOrder` existía sin un solo
 * llamador, así que ningún caso tenía órdenes que verificar y la verificación
 * —que es lo que deja el caso listo para cirugía— no podía ejecutarse nunca.
 */
export class CreatePreoperativeOrderDto {
  /**
   * Identificador asociado a service request.
   *
   * Alternativa a `serviceRequestCodeConceptId`: hay que indicar uno de los dos.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Orden clínica ya existente',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  /**
   * Código de la orden clínica, cuando todavía no existe.
   *
   * Igual que en el diagnóstico del caso: quien indica una prueba preoperatoria
   * no puede llamar antes a `POST /clinical/service-requests`, que es de
   * `CLINICIAN`/`PRACTITIONER`.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Código de la orden clínica a registrar si aún no existe',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestCodeConceptId?: string;

  /**
   * Valor de order role mantenido por la instancia.
   */
  @ApiProperty({ enum: PREOP_ORDER_ROLES })
  @IsIn(PREOP_ORDER_ROLES)
  orderRole!: PreopOrderRole;

  /**
   * Valor de mandatory mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description:
      'Si es obligatoria antes de la cirugía; una pendiente impide que el caso quede listo',
  })
  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;
}

/** Respuesta del alta de una orden preoperatoria. */
export class PreoperativeOrderResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a service request.
   */
  @ApiProperty({ format: 'uuid' })
  serviceRequestId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/preoperative-orders/verify` (UC-53-04). */
export class VerifyOrdersDto {
  /**
   * Valor de order ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Órdenes que se dan por verificadas',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  orderIds!: string[];

  /**
   * Identificador asociado a verified by profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Profesional que verifica' })
  @IsUUID()
  verifiedByProfileId!: string;
}

/**
 * Define el contrato validado para verify orders response.
 */
export class VerifyOrdersResponseDto {
  /**
   * Identificador asociado a procedure case.
   */
  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  /**
   * Valor de verified mantenido por la instancia.
   */
  @ApiProperty({ description: 'Órdenes que pasaron a verificadas' })
  verified!: number;

  /**
   * Valor de pending mandatory mantenido por la instancia.
   */
  @ApiProperty({ description: 'Órdenes obligatorias que siguen pendientes' })
  pendingMandatory!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el caso',
  })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-53-05 · Checklist de seguridad
// ---------------------------------------------------------------------------

/** Fase del checklist quirúrgico de la OMS. */
export type ChecklistPhase = 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT';
const CHECKLIST_PHASES = ['SIGN_IN', 'TIME_OUT', 'SIGN_OUT'] as const;

/** Cómo se responde a un ítem del checklist. */
export type ResponseStatus = 'CONFIRMED' | 'NOT_APPLICABLE' | 'EXCEPTION';
const RESPONSE_STATUSES = ['CONFIRMED', 'NOT_APPLICABLE', 'EXCEPTION'] as const;

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

// ---------------------------------------------------------------------------
// UC-53-06 · Plan de anestesia
// ---------------------------------------------------------------------------

/** Tipo de anestesia planificada. */
export type AnesthesiaType = 'GENERAL' | 'REGIONAL' | 'LOCAL' | 'SEDATION';
const ANESTHESIA_TYPES = ['GENERAL', 'REGIONAL', 'LOCAL', 'SEDATION'] as const;

/** Plan de vía aérea. */
export type AirwayPlan = 'ETT' | 'LMA' | 'MASK';
const AIRWAY_PLANS = ['ETT', 'LMA', 'MASK'] as const;

/** Clase de Mallampati observada. */
export type MallampatiClass = 'I' | 'II' | 'III' | 'IV';
const MALLAMPATI_CLASSES = ['I', 'II', 'III', 'IV'] as const;

/**
 * Define el contrato validado para airway assessment.
 */
export class AirwayAssessmentDto {
  /**
   * Identificador asociado a assessed by profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assessedByProfileId!: string;

  /**
   * Valor de mallampati mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: MALLAMPATI_CLASSES })
  @IsOptional()
  @IsIn(MALLAMPATI_CLASSES)
  mallampati?: MallampatiClass;

  /**
   * Valor de mouth opening mm mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Apertura bucal en milímetros' })
  @IsOptional()
  @IsNumberString()
  mouthOpeningMm?: string;

  /**
   * Valor de thyromental distance mm mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Distancia tiromentoniana en milímetros',
  })
  @IsOptional()
  @IsNumberString()
  thyromentalDistanceMm?: string;

  /**
   * Valor de difficult airway expected mantenido por la instancia.
   */
  @ApiProperty({ description: 'Se anticipa vía aérea difícil' })
  @IsBoolean()
  difficultAirwayExpected!: boolean;

  /**
   * Valor de rescue plan text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Plan de rescate; obligatorio si se anticipa vía aérea difícil',
  })
  @IsOptional()
  @IsString()
  rescuePlanText?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/anesthesia-plans` (UC-53-06). */
export class CreateAnesthesiaPlanDto {
  /**
   * Identificador asociado a anesthesiologist profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  anesthesiologistProfileId!: string;

  /**
   * Valor de anesthesia type mantenido por la instancia.
   */
  @ApiProperty({ enum: ANESTHESIA_TYPES })
  @IsIn(ANESTHESIA_TYPES)
  anesthesiaType!: AnesthesiaType;

  /**
   * Valor de airway plan mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: AIRWAY_PLANS })
  @IsOptional()
  @IsIn(AIRWAY_PLANS)
  airwayPlan?: AirwayPlan;

  /**
   * Valor de monitoring plan json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Monitorización planificada' })
  @IsOptional()
  @IsObject()
  monitoringPlanJson?: Record<string, unknown>;

  /**
   * Valor de medications plan json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Medicación planificada' })
  @IsOptional()
  @IsObject()
  medicationsPlanJson?: Record<string, unknown>;

  /**
   * Valor de postoperative analgesia plan text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postoperativeAnalgesiaPlanText?: string;

  /**
   * Valor de airway assessment mantenido por la instancia.
   */
  @ApiProperty({
    type: AirwayAssessmentDto,
    description: 'Valoración de vía aérea',
  })
  @ValidateNested()
  @Type(() => AirwayAssessmentDto)
  airwayAssessment!: AirwayAssessmentDto;
}

/**
 * Define el contrato validado para anesthesia plan response.
 */
export class AnesthesiaPlanResponseDto {
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
   * Identificador asociado a airway assessment.
   */
  @ApiProperty({ format: 'uuid' })
  airwayAssessmentId!: string;

  /**
   * Valor de difficult airway expected mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se anticipa vía aérea difícil' })
  difficultAirwayExpected!: boolean;
}

/**
 * Define el contrato validado para approve plan response.
 */
export class ApprovePlanResponseDto {
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
   * Identificador asociado a anesthesiologist profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Anestesiólogo asignado al caso',
  })
  anesthesiologistProfileId!: string;
}

// ---------------------------------------------------------------------------
// UC-53-07 · Eventos de anestesia
// ---------------------------------------------------------------------------

/** Naturaleza del evento intraoperatorio de anestesia. */
export type AnesthesiaEventType =
  | 'INDUCTION'
  | 'INTUBATION'
  | 'MEDICATION'
  | 'VITALS'
  | 'EMERGENCE'
  | 'COMPLICATION';
const ANESTHESIA_EVENT_TYPES = [
  'INDUCTION',
  'INTUBATION',
  'MEDICATION',
  'VITALS',
  'EMERGENCE',
  'COMPLICATION',
] as const;

/** Cuerpo de `POST /procedure-cases/{id}/anesthesia-events` (UC-53-07). */
export class RecordAnesthesiaEventDto {
  /**
   * Valor de event type mantenido por la instancia.
   */
  @ApiProperty({ enum: ANESTHESIA_EVENT_TYPES })
  @IsIn(ANESTHESIA_EVENT_TYPES)
  eventType!: AnesthesiaEventType;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time', description: 'Momento del evento' })
  @IsISO8601()
  occurredAt!: string;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: CLINICAL_SEVERITIES, default: 'ROUTINE' })
  @IsOptional()
  @IsIn(CLINICAL_SEVERITIES)
  severity?: ClinicalSeverity;

  /**
   * Identificador asociado a medication administration.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicationAdministrationId?: string;

  /**
   * Identificador asociado a observation.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  observationId?: string;

  /**
   * Identificador asociado a device.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  /**
   * Identificador asociado a performed by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performedByProfileId?: string;

  /**
   * Valor de details json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Detalle del evento' })
  @IsOptional()
  @IsObject()
  detailsJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para anesthesia event response.
 */
export class AnesthesiaEventResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a event type concept.
   */
  @ApiProperty({ format: 'uuid' })
  eventTypeConceptId!: string;

  /**
   * Identificador asociado a milestone.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Hito creado si el evento fue inducción o despertar',
  })
  milestoneId?: string;
}

// ---------------------------------------------------------------------------
// UC-53-08 · Pasos y hallazgos
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /procedure-cases/{id}/operative-steps` (UC-53-08). */
export class CreateOperativeStepDto {
  /**
   * Identificador asociado a step code concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Código del paso operatorio' })
  @IsUUID()
  stepCodeConceptId!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiProperty({ description: 'Qué se hizo' })
  @IsString()
  description!: string;

  /**
   * Identificador asociado a procedure.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  /**
   * Identificador asociado a performed by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performedByProfileId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sitio anatómico intervenido',
  })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Valor de laterality mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: LATERALITIES })
  @IsOptional()
  @IsIn(LATERALITIES)
  laterality?: Laterality;
}

/**
 * Define el contrato validado para operative step response.
 */
export class OperativeStepResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de step number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número del paso dentro del caso' })
  stepNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/**
 * Un paso operatorio dentro de {@link CaseDetailDto.operativeSteps} (CL-55).
 *
 * Antes era un tipo TypeScript inline: `@ApiProperty({ isArray: true })` sin
 * `type` no le da forma a los ítems en el esquema OpenAPI generado, así que un
 * cliente que regenera tipos desde el contrato veía `operativeSteps: any[]`.
 * Esta clase es la misma forma que ya devuelve el servicio, con decoradores.
 */
export class OperativeStepItemDto {
  /** Identificador del paso. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Orden dentro de la intervención. */
  @ApiProperty()
  stepNumber!: number;

  /** Código del paso. */
  @ApiProperty({ format: 'uuid' })
  stepCodeConceptId!: string;

  /** Descripción escrita por quien lo registró. */
  @ApiProperty()
  description!: string;

  /** Profesional que lo ejecutó, si se registró. */
  @ApiPropertyOptional({ format: 'uuid' })
  performedByProfileId?: string;

  /** Sitio anatómico, si se registró. */
  @ApiPropertyOptional({ format: 'uuid' })
  bodySiteConceptId?: string;

  /** Lateralidad, si aplica. */
  @ApiPropertyOptional({ format: 'uuid' })
  lateralityConceptId?: string;

  /** Estado del paso. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Cuándo empezó, si se cronometró. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  startedAt?: Date;

  /** Cuándo terminó, si se cronometró. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endedAt?: Date;
}

/** Cuerpo de `POST /procedure-cases/{id}/findings` (UC-53-08). */
export class RecordFindingDto {
  /**
   * Identificador asociado a finding code concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Código del hallazgo' })
  @IsUUID()
  findingCodeConceptId!: string;

  /**
   * Valor de finding text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Qué se encontró' })
  @IsString()
  findingText!: string;

  /**
   * Identificador asociado a operative step.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paso en el que se observó',
  })
  @IsOptional()
  @IsUUID()
  operativeStepId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Valor de laterality mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: LATERALITIES })
  @IsOptional()
  @IsIn(LATERALITIES)
  laterality?: Laterality;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: CLINICAL_SEVERITIES })
  @IsOptional()
  @IsIn(CLINICAL_SEVERITIES)
  severity?: ClinicalSeverity;

  /**
   * Identificador asociado a observation.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  observationId?: string;

  /**
   * Identificador asociado a recorded by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  recordedByProfileId?: string;
}

/**
 * Define el contrato validado para finding response.
 */
export class FindingResponseDto {
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
   * Valor de body site recorded mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el sitio anatómico se registró en el procedimiento',
  })
  bodySiteRecorded!: boolean;
}

// ---------------------------------------------------------------------------
// UC-53-09 · Implantes
// ---------------------------------------------------------------------------

/** Papel del implante en la intervención. */
export type ImplantRole = 'PRIMARY' | 'ADJUNCT';

/** Tipo de identificador del implante. */
export type ImplantIdentifierType = 'UDI_DI' | 'UDI_PI' | 'SERIAL';
const IMPLANT_IDENTIFIER_TYPES = ['UDI_DI', 'UDI_PI', 'SERIAL'] as const;

/**
 * Define el contrato validado para implant identifier.
 */
export class ImplantIdentifierDto {
  /**
   * Valor de identifier type mantenido por la instancia.
   */
  @ApiProperty({ enum: IMPLANT_IDENTIFIER_TYPES })
  @IsIn(IMPLANT_IDENTIFIER_TYPES)
  identifierType!: ImplantIdentifierType;

  /**
   * Valor de identifier value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor del identificador', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  identifierValue!: string;

  /**
   * Valor de issuing system mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Sistema emisor', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  issuingSystem?: string;

  /**
   * Valor de lot number mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string;

  /**
   * Valor de serial number mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  /**
   * Valor de expiration date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  expirationDate?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/implants` (UC-53-09). */
export class RecordImplantDto {
  /**
   * Identificador asociado a procedure.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  procedureId!: string;

  /**
   * Identificador asociado a implant device.
   */
  @ApiProperty({ format: 'uuid', description: 'Dispositivo implantado' })
  @IsUUID()
  implantDeviceId!: string;

  /**
   * Valor de implant role mantenido por la instancia.
   */
  @ApiProperty({ enum: ['PRIMARY', 'ADJUNCT'] })
  @IsIn(['PRIMARY', 'ADJUNCT'])
  implantRole!: ImplantRole;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Valor de laterality mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: LATERALITIES })
  @IsOptional()
  @IsIn(LATERALITIES)
  laterality?: Laterality;

  /**
   * Valor de identifiers mantenido por la instancia.
   */
  @ApiProperty({
    type: [ImplantIdentifierDto],
    description: 'Identificadores de trazabilidad, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImplantIdentifierDto)
  identifiers!: ImplantIdentifierDto[];

  /**
   * Valor de udi carrier mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Portador UDI leído del envase',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  udiCarrier?: string;
}

/**
 * Define el contrato validado para implant response.
 */
export class ImplantResponseDto {
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
   * Valor de identifier ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  identifierIds!: string[];

  /**
   * Identificador asociado a device use.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Registro del dispositivo usado',
  })
  deviceUseId!: string;
}

// ---------------------------------------------------------------------------
// UC-53-10 · Insumos y muestras
// ---------------------------------------------------------------------------

/** Para qué se usó el medicamento en la intervención. */
export type MedicationUseRole = 'ANESTHESIA' | 'ANTIBIOTIC' | 'ANALGESIA';
const MEDICATION_USE_ROLES = ['ANESTHESIA', 'ANTIBIOTIC', 'ANALGESIA'] as const;

/** Naturaleza de la muestra tomada. */
export type SpecimenRole = 'BIOPSY' | 'RESECTION' | 'CULTURE';
const SPECIMEN_ROLES = ['BIOPSY', 'RESECTION', 'CULTURE'] as const;

/** Cuerpo de `POST /procedure-cases/{id}/medication-uses` (UC-53-10). */
export class RecordMedicationUseDto {
  /**
   * Identificador asociado a medication administration.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Administración registrada en farmacia',
  })
  @IsUUID()
  medicationAdministrationId!: string;

  /**
   * Valor de use role mantenido por la instancia.
   */
  @ApiProperty({ enum: MEDICATION_USE_ROLES })
  @IsIn(MEDICATION_USE_ROLES)
  useRole!: MedicationUseRole;

  /**
   * Identificador asociado a procedure.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  /**
   * Identificador asociado a operative step.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paso durante el que se administró',
  })
  @IsOptional()
  @IsUUID()
  operativeStepId?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/specimens` (UC-53-10). */
export class RecordSpecimenDto {
  /**
   * Identificador asociado a procedure.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  procedureId!: string;

  /**
   * Identificador asociado a specimen.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Muestra registrada en laboratorio',
  })
  @IsUUID()
  specimenId!: string;

  /**
   * Valor de specimen role mantenido por la instancia.
   */
  @ApiProperty({ enum: SPECIMEN_ROLES })
  @IsIn(SPECIMEN_ROLES)
  specimenRole!: SpecimenRole;

  /**
   * Identificador asociado a operative step.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  operativeStepId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Valor de orientation text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Orientación de la pieza para el patólogo',
  })
  @IsOptional()
  @IsString()
  orientationText?: string;

  /**
   * Valor de surgeon comment mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  surgeonComment?: string;
}

/**
 * Define el contrato validado para supplies response.
 */
export class SuppliesResponseDto {
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
}

// ---------------------------------------------------------------------------
// UC-53-11 · Reporte operatorio
// ---------------------------------------------------------------------------

/** Destino del paciente al salir del quirófano. */
export type Disposition = 'PACU' | 'ICU' | 'WARD' | 'HOME';
const DISPOSITIONS = ['PACU', 'ICU', 'WARD', 'HOME'] as const;

/** Relación de la complicación con lo hecho. */
export type Relatedness = 'PROCEDURE' | 'ANESTHESIA' | 'UNRELATED';
const RELATEDNESS = ['PROCEDURE', 'ANESTHESIA', 'UNRELATED'] as const;

/**
 * Define el contrato validado para complication.
 */
export class ComplicationDto {
  /**
   * Identificador asociado a complication code concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  complicationCodeConceptId!: string;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiProperty({ enum: CLINICAL_SEVERITIES })
  @IsIn(CLINICAL_SEVERITIES)
  severity!: ClinicalSeverity;

  /**
   * Valor de relatedness mantenido por la instancia.
   */
  @ApiProperty({ enum: RELATEDNESS })
  @IsIn(RELATEDNESS)
  relatedness!: Relatedness;

  /**
   * Identificador asociado a condition.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  conditionId?: string;

  /**
   * Valor de management text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cómo se manejó' })
  @IsOptional()
  @IsString()
  managementText?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/operative-reports` (UC-53-11). */
export class DraftOperativeReportDto {
  /**
   * Identificador asociado a procedure.
   *
   * Alternativa a `procedureCodeConceptId`: hay que indicar uno de los dos.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Procedimiento ya registrado en la historia clínica',
  })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  /**
   * Código del procedimiento, cuando todavía no está en la historia.
   *
   * El informe operatorio describe el acto que se acaba de realizar: obligar a
   * registrarlo antes en `clinical.procedures` —endpoint que el cirujano
   * tampoco puede invocar— dejaba el informe fuera de su alcance. Con este
   * campo el procedimiento se crea junto al informe, con el caso como origen.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Código del procedimiento a registrar si aún no existe',
  })
  @IsOptional()
  @IsUUID()
  procedureCodeConceptId?: string;

  /**
   * Identificador asociado a author profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Autor del reporte' })
  @IsUUID()
  authorProfileId!: string;

  /**
   * Valor de preoperative diagnosis text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preoperativeDiagnosisText?: string;

  /**
   * Valor de postoperative diagnosis text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postoperativeDiagnosisText?: string;

  /**
   * Valor de procedure description mantenido por la instancia.
   */
  @ApiProperty({ description: 'Descripción de lo realizado' })
  @IsString()
  procedureDescription!: string;

  /**
   * Valor de findings text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findingsText?: string;

  /**
   * Valor de estimated blood loss ml mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Sangrado estimado en mililitros' })
  @IsOptional()
  @IsNumberString()
  estimatedBloodLossMl?: string;

  /**
   * Valor de drains text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  drainsText?: string;

  /**
   * Valor de complications text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complicationsText?: string;

  /**
   * Valor de disposition mantenido por la instancia.
   */
  @ApiProperty({ enum: DISPOSITIONS })
  @IsIn(DISPOSITIONS)
  disposition!: Disposition;

  /**
   * Valor de complications mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [ComplicationDto],
    description: 'Complicaciones a registrar',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComplicationDto)
  complications?: ComplicationDto[];
}

/**
 * Define el contrato validado para operative report response.
 */
export class OperativeReportResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de report version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión del reporte' })
  reportVersion!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de complication ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  complicationIds!: string[];
}

/** Cuerpo de `POST /procedure-cases/{id}/operative-reports/{rid}/sign` (UC-53-11). */
export class SignReportDto {
  /**
   * Identificador asociado a signature.
   */
  @ApiProperty({ format: 'uuid', description: 'Firma electrónica aplicada' })
  @IsUUID()
  signatureId!: string;

  /**
   * Identificador asociado a file.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Documento firmado' })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}

/**
 * Define el contrato validado para sign report response.
 */
export class SignReportResponseDto {
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
   * Identificador asociado a case status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el caso',
  })
  caseStatusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-53-12 · PACU
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /procedure-cases/{id}/pacu-stays` (UC-53-12). */
export class AdmitToPacuDto {
  /**
   * Identificador asociado a care space.
   */
  @ApiProperty({ format: 'uuid', description: 'Espacio de recuperación' })
  @IsUUID()
  careSpaceId!: string;

  /**
   * Identificador asociado a admitted by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  admittedByProfileId?: string;
}

/**
 * Define el contrato validado para pacu stay response.
 */
export class PacuStayResponseDto {
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
   * Identificador asociado a location.
   */
  @ApiProperty({ format: 'uuid', description: 'Ubicación del caso creada' })
  locationId!: string;
}

/** Cuerpo de `POST /pacu-stays/{id}/assessments` (UC-53-12). */
export class RecordPacuAssessmentDto {
  /**
   * Identificador asociado a assessed by profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assessedByProfileId!: string;

  /**
   * Valor de aldrete score mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Puntuación de Aldrete',
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  aldreteScore?: number;

  /**
   * Valor de pain score mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Escala de dolor' })
  @IsOptional()
  @IsNumberString()
  painScore?: string;

  /**
   * Valor de nausea score mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Escala de náusea' })
  @IsOptional()
  @IsNumberString()
  nauseaScore?: string;

  /**
   * Valor de airway status mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['PATENT', 'SUPPORTED'] })
  @IsOptional()
  @IsIn(['PATENT', 'SUPPORTED'])
  airwayStatus?: 'PATENT' | 'SUPPORTED';

  /**
   * Valor de observations json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Observaciones registradas' })
  @IsOptional()
  @IsObject()
  observationsJson?: Record<string, unknown>;

  /**
   * Valor de criteria json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Criterios de alta evaluados' })
  @IsOptional()
  @IsObject()
  criteriaJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para pacu assessment response.
 */
export class PacuAssessmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a pacu stay.
   */
  @ApiProperty({ format: 'uuid' })
  pacuStayId!: string;

  /**
   * Valor de meets discharge criteria mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si la valoración cumple el criterio de alta',
  })
  meetsDischargeCriteria!: boolean;
}

/**
 * Define el contrato validado para postoperative order.
 */
export class PostoperativeOrderDto {
  /**
   * Identificador asociado a service request.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  serviceRequestId!: string;

  /**
   * Valor de order role mantenido por la instancia.
   */
  @ApiProperty({ enum: ['LAB', 'IMAGING', 'CONSULT', 'MEDICATION'] })
  @IsIn(['LAB', 'IMAGING', 'CONSULT', 'MEDICATION'])
  orderRole!: 'LAB' | 'IMAGING' | 'CONSULT' | 'MEDICATION';
}

/**
 * Define el contrato validado para postoperative followup.
 */
export class PostoperativeFollowupDto {
  /**
   * Valor de followup type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['WOUND_CHECK', 'VISIT'] })
  @IsIn(['WOUND_CHECK', 'VISIT'])
  followupType!: 'WOUND_CHECK' | 'VISIT';

  /**
   * Identificador asociado a appointment.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  /**
   * Valor de instructions text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructionsText?: string;
}

/** Cuerpo de `POST /pacu-stays/{id}/discharge` (UC-53-12). */
export class DischargePacuDto {
  /**
   * Valor de destination mantenido por la instancia.
   */
  @ApiProperty({ enum: DISPOSITIONS })
  @IsIn(DISPOSITIONS)
  destination!: Disposition;

  /**
   * Identificador asociado a discharged by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  dischargedByProfileId?: string;

  /**
   * Valor de orders mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [PostoperativeOrderDto],
    description: 'Órdenes postoperatorias',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostoperativeOrderDto)
  orders?: PostoperativeOrderDto[];

  /**
   * Valor de followups mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [PostoperativeFollowupDto],
    description: 'Seguimientos a agendar',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostoperativeFollowupDto)
  followups?: PostoperativeFollowupDto[];
}

/**
 * Define el contrato validado para discharge pacu response.
 */
export class DischargePacuResponseDto {
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
   * Valor de orders created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Órdenes postoperatorias creadas' })
  ordersCreated!: number;

  /**
   * Valor de followups created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Seguimientos agendados' })
  followupsCreated!: number;
}

// ---------------------------------------------------------------------------
// UC-53-13 · Cancelación
// ---------------------------------------------------------------------------

/** A quién se atribuye la cancelación. */
export type CancellationCategory = 'PATIENT' | 'FACILITY' | 'CLINICAL';
const CANCELLATION_CATEGORIES = ['PATIENT', 'FACILITY', 'CLINICAL'] as const;

/** Cuerpo de `POST /procedure-cases/{id}/cancel` (UC-53-13). */
export class CancelCaseDto {
  /**
   * Identificador asociado a cancellation reason concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Motivo de la cancelación' })
  @IsUUID()
  cancellationReasonConceptId!: string;

  /**
   * Valor de category mantenido por la instancia.
   */
  @ApiProperty({ enum: CANCELLATION_CATEGORIES })
  @IsIn(CANCELLATION_CATEGORIES)
  category!: CancellationCategory;

  /**
   * Valor de preventable mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Si era evitable; es lo que mide la calidad del proceso',
  })
  @IsBoolean()
  preventable!: boolean;

  /**
   * Valor de explanation text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanationText?: string;

  /**
   * Valor de reschedule required mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  rescheduleRequired?: boolean;
}

/**
 * Define el contrato validado para cancel case response.
 */
export class CancelCaseResponseDto {
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
   * Identificador asociado a cancellation.
   */
  @ApiProperty({ format: 'uuid', description: 'Registro de la cancelación' })
  cancellationId!: string;

  /**
   * Valor de operating room released mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se liberó el quirófano reservado' })
  operatingRoomReleased!: boolean;
}

// ---------------------------------------------------------------------------
// UC-53-14 · Cargos y utilización
// ---------------------------------------------------------------------------

/** Naturaleza del cargo generado. */
export type ChargeType = 'PROCEDURE' | 'IMPLANT' | 'SUPPLY' | 'OR_TIME';
const CHARGE_TYPES = ['PROCEDURE', 'IMPLANT', 'SUPPLY', 'OR_TIME'] as const;

/**
 * Define el contrato validado para charge item.
 */
export class ChargeItemDto {
  /**
   * Valor de charge type mantenido por la instancia.
   */
  @ApiProperty({ enum: CHARGE_TYPES })
  @IsIn(CHARGE_TYPES)
  chargeType!: ChargeType;

  /**
   * Identificador asociado a billable item.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Concepto facturable del catálogo',
  })
  @IsUUID()
  billableItemId!: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cantidad, como cadena decimal' })
  @IsNumberString()
  quantity!: string;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Precio unitario' })
  @IsOptional()
  @IsNumberString()
  unitPrice?: string;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/charge-items/post` (UC-53-14). */
export class PostChargesDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({
    type: [ChargeItemDto],
    description: 'Cargos a generar, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChargeItemDto)
  items!: ChargeItemDto[];

  /**
   * Valor de consolidate utilization mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description: 'Consolidar además el uso real del quirófano',
  })
  @IsOptional()
  @IsBoolean()
  consolidateUtilization?: boolean;

  /**
   * Valor de turnover seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Segundos de recambio hasta el siguiente caso',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  turnoverSeconds?: number;
}

/**
 * Define el contrato validado para post charges response.
 */
export class PostChargesResponseDto {
  /**
   * Identificador asociado a procedure case.
   */
  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  /**
   * Valor de charged mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cargos generados' })
  charged!: number;

  /**
   * Valor de total amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe total de los cargos' })
  totalAmount!: string;

  /**
   * Valor de actual duration seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Duración real del caso, en segundos' })
  actualDurationSeconds?: number;

  /**
   * Valor de schedule variance seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Desviación frente a lo programado, en segundos',
  })
  scheduleVarianceSeconds?: number;
}
