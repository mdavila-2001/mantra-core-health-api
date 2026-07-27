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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Solicitud que origina el caso',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  primaryProcedureId?: string;

  @ApiProperty({ enum: CASE_TYPES })
  @IsIn(CASE_TYPES)
  caseType!: SurgicalCaseType;

  @ApiProperty({ enum: CASE_PRIORITIES })
  @IsIn(CASE_PRIORITIES)
  priority!: CasePriority;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  surgicalSpecialtyConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requestedByProfileId?: string;

  @ApiProperty({ format: 'uuid', description: 'Cirujano principal' })
  @IsUUID()
  primarySurgeonProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  @ApiProperty({ format: 'uuid', description: 'Quirófano que se reserva' })
  @IsUUID()
  operatingRoomId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  scheduledStartAt!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  scheduledEndAt!: string;

  @ApiPropertyOptional({
    description:
      'Justificación de la urgencia; obligatoria si el caso no es electivo',
  })
  @IsOptional()
  @IsString()
  urgencyReasonText?: string;
}

export class CaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Número del caso' })
  caseNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid', description: 'Quirófano reservado' })
  operatingRoomId!: string;

  @ApiProperty({ format: 'uuid', description: 'Hito de programación creado' })
  milestoneId!: string;
}

// ---------------------------------------------------------------------------
// UC-53-02 · Diagnósticos y equipo
// ---------------------------------------------------------------------------

/** Papel del diagnóstico en el caso. */
export type DiagnosisRole = 'PRIMARY' | 'SECONDARY' | 'POSTOPERATIVE';
const DIAGNOSIS_ROLES = ['PRIMARY', 'SECONDARY', 'POSTOPERATIVE'] as const;

export class CaseDiagnosisDto {
  @ApiProperty({ format: 'uuid', description: 'Condición diagnosticada' })
  @IsUUID()
  conditionId!: string;

  @ApiProperty({ enum: DIAGNOSIS_ROLES })
  @IsIn(DIAGNOSIS_ROLES)
  role!: DiagnosisRole;

  @ApiPropertyOptional({ default: false, description: 'Presente al ingresar' })
  @IsOptional()
  @IsBoolean()
  presentOnAdmission?: boolean;
}

/** Cuerpo de `POST /procedure-cases/{id}/diagnoses` (UC-53-02). */
export class AddDiagnosesDto {
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

export class DiagnosesResponseDto {
  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  diagnosisIds!: string[];

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practitionerProfileId!: string;

  @ApiProperty({ enum: TEAM_ROLES })
  @IsIn(TEAM_ROLES)
  role!: TeamRole;
}

export class TeamMemberResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

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

export class RiskScoreDto {
  @ApiProperty({ enum: RISK_MODELS })
  @IsIn(RISK_MODELS)
  model!: RiskModel;

  @ApiProperty({ description: 'Versión del modelo aplicada', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  modelVersion!: string;

  @ApiProperty({ description: 'Puntuación obtenida' })
  @IsNumberString()
  scoreValue!: string;

  @ApiPropertyOptional({ description: 'Entradas con las que se calculó' })
  @IsOptional()
  @IsObject()
  inputsJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interpretationText?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/preoperative-assessments` (UC-53-03). */
export class CreatePreopAssessmentDto {
  @ApiProperty({ enum: ['ANESTHESIA', 'SURGICAL'] })
  @IsIn(['ANESTHESIA', 'SURGICAL'])
  assessmentType!: 'ANESTHESIA' | 'SURGICAL';

  @ApiProperty({ format: 'uuid', description: 'Profesional que valora' })
  @IsUUID()
  assessedByProfileId!: string;

  @ApiProperty({ enum: FITNESS_STATUSES })
  @IsIn(FITNESS_STATUSES)
  fitnessStatus!: FitnessStatus;

  @ApiPropertyOptional({ enum: ASA_CLASSES })
  @IsOptional()
  @IsIn(ASA_CLASSES)
  asaClass?: AsaClass;

  @ApiProperty({ description: 'Se revisaron las alergias del paciente' })
  @IsBoolean()
  allergiesReviewed!: boolean;

  @ApiProperty({ description: 'Se revisó la medicación del paciente' })
  @IsBoolean()
  medicationsReviewed!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  anticoagulationPlanText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fastingInstructionsText?: string;

  @ApiPropertyOptional({ description: 'Detalle estructurado de la valoración' })
  @IsOptional()
  @IsObject()
  assessmentJson?: Record<string, unknown>;

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

export class PreopAssessmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  fitnessStatusConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  riskScoreIds!: string[];

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Hito de aptitud preoperatoria, si el paciente quedó apto',
  })
  milestoneId?: string;
}

// ---------------------------------------------------------------------------
// UC-53-04 · Verificación de órdenes
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /procedure-cases/{id}/preoperative-orders/verify` (UC-53-04). */
export class VerifyOrdersDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Órdenes que se dan por verificadas',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  orderIds!: string[];

  @ApiProperty({ format: 'uuid', description: 'Profesional que verifica' })
  @IsUUID()
  verifiedByProfileId!: string;
}

export class VerifyOrdersResponseDto {
  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  @ApiProperty({ description: 'Órdenes que pasaron a verificadas' })
  verified!: number;

  @ApiProperty({ description: 'Órdenes obligatorias que siguen pendientes' })
  pendingMandatory!: number;

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

export class ChecklistResponseItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ enum: RESPONSE_STATUSES })
  @IsIn(RESPONSE_STATUSES)
  status!: ResponseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  responseBoolean?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responseText?: string;

  @ApiPropertyOptional({
    description: 'Justificación; obligatoria cuando la respuesta es EXCEPTION',
  })
  @IsOptional()
  @IsString()
  exceptionReason?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/safety-checklists/{cid}/responses` (UC-53-05). */
export class SubmitChecklistPhaseDto {
  @ApiProperty({ enum: CHECKLIST_PHASES })
  @IsIn(CHECKLIST_PHASES)
  phase!: ChecklistPhase;

  @ApiProperty({ format: 'uuid', description: 'Profesional que responde' })
  @IsUUID()
  respondedByProfileId!: string;

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

export class ChecklistPhaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  checklistId!: string;

  @ApiProperty({ description: 'Respuestas registradas en esta fase' })
  recorded!: number;

  @ApiProperty({ description: 'true si la fase quedó completa' })
  phaseCompleted!: boolean;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

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

export class AirwayAssessmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assessedByProfileId!: string;

  @ApiPropertyOptional({ enum: MALLAMPATI_CLASSES })
  @IsOptional()
  @IsIn(MALLAMPATI_CLASSES)
  mallampati?: MallampatiClass;

  @ApiPropertyOptional({ description: 'Apertura bucal en milímetros' })
  @IsOptional()
  @IsNumberString()
  mouthOpeningMm?: string;

  @ApiPropertyOptional({
    description: 'Distancia tiromentoniana en milímetros',
  })
  @IsOptional()
  @IsNumberString()
  thyromentalDistanceMm?: string;

  @ApiProperty({ description: 'Se anticipa vía aérea difícil' })
  @IsBoolean()
  difficultAirwayExpected!: boolean;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  anesthesiologistProfileId!: string;

  @ApiProperty({ enum: ANESTHESIA_TYPES })
  @IsIn(ANESTHESIA_TYPES)
  anesthesiaType!: AnesthesiaType;

  @ApiPropertyOptional({ enum: AIRWAY_PLANS })
  @IsOptional()
  @IsIn(AIRWAY_PLANS)
  airwayPlan?: AirwayPlan;

  @ApiPropertyOptional({ description: 'Monitorización planificada' })
  @IsOptional()
  @IsObject()
  monitoringPlanJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Medicación planificada' })
  @IsOptional()
  @IsObject()
  medicationsPlanJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postoperativeAnalgesiaPlanText?: string;

  @ApiProperty({
    type: AirwayAssessmentDto,
    description: 'Valoración de vía aérea',
  })
  @ValidateNested()
  @Type(() => AirwayAssessmentDto)
  airwayAssessment!: AirwayAssessmentDto;
}

export class AnesthesiaPlanResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  airwayAssessmentId!: string;

  @ApiProperty({ description: 'true si se anticipa vía aérea difícil' })
  difficultAirwayExpected!: boolean;
}

export class ApprovePlanResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

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
  @ApiProperty({ enum: ANESTHESIA_EVENT_TYPES })
  @IsIn(ANESTHESIA_EVENT_TYPES)
  eventType!: AnesthesiaEventType;

  @ApiProperty({ format: 'date-time', description: 'Momento del evento' })
  @IsISO8601()
  occurredAt!: string;

  @ApiPropertyOptional({ enum: CLINICAL_SEVERITIES, default: 'ROUTINE' })
  @IsOptional()
  @IsIn(CLINICAL_SEVERITIES)
  severity?: ClinicalSeverity;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicationAdministrationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  observationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performedByProfileId?: string;

  @ApiPropertyOptional({ description: 'Detalle del evento' })
  @IsOptional()
  @IsObject()
  detailsJson?: Record<string, unknown>;
}

export class AnesthesiaEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  eventTypeConceptId!: string;

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
  @ApiProperty({ format: 'uuid', description: 'Código del paso operatorio' })
  @IsUUID()
  stepCodeConceptId!: string;

  @ApiProperty({ description: 'Qué se hizo' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performedByProfileId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sitio anatómico intervenido',
  })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  @ApiPropertyOptional({ enum: LATERALITIES })
  @IsOptional()
  @IsIn(LATERALITIES)
  laterality?: Laterality;
}

export class OperativeStepResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Número del paso dentro del caso' })
  stepNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/findings` (UC-53-08). */
export class RecordFindingDto {
  @ApiProperty({ format: 'uuid', description: 'Código del hallazgo' })
  @IsUUID()
  findingCodeConceptId!: string;

  @ApiProperty({ description: 'Qué se encontró' })
  @IsString()
  findingText!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paso en el que se observó',
  })
  @IsOptional()
  @IsUUID()
  operativeStepId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  @ApiPropertyOptional({ enum: LATERALITIES })
  @IsOptional()
  @IsIn(LATERALITIES)
  laterality?: Laterality;

  @ApiPropertyOptional({ enum: CLINICAL_SEVERITIES })
  @IsOptional()
  @IsIn(CLINICAL_SEVERITIES)
  severity?: ClinicalSeverity;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  observationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  recordedByProfileId?: string;
}

export class FindingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

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

export class ImplantIdentifierDto {
  @ApiProperty({ enum: IMPLANT_IDENTIFIER_TYPES })
  @IsIn(IMPLANT_IDENTIFIER_TYPES)
  identifierType!: ImplantIdentifierType;

  @ApiProperty({ description: 'Valor del identificador', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  identifierValue!: string;

  @ApiPropertyOptional({ description: 'Sistema emisor', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  issuingSystem?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  expirationDate?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/implants` (UC-53-09). */
export class RecordImplantDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  procedureId!: string;

  @ApiProperty({ format: 'uuid', description: 'Dispositivo implantado' })
  @IsUUID()
  implantDeviceId!: string;

  @ApiProperty({ enum: ['PRIMARY', 'ADJUNCT'] })
  @IsIn(['PRIMARY', 'ADJUNCT'])
  implantRole!: ImplantRole;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  @ApiPropertyOptional({ enum: LATERALITIES })
  @IsOptional()
  @IsIn(LATERALITIES)
  laterality?: Laterality;

  @ApiProperty({
    type: [ImplantIdentifierDto],
    description: 'Identificadores de trazabilidad, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImplantIdentifierDto)
  identifiers!: ImplantIdentifierDto[];

  @ApiPropertyOptional({
    description: 'Portador UDI leído del envase',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  udiCarrier?: string;
}

export class ImplantResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  identifierIds!: string[];

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
  @ApiProperty({
    format: 'uuid',
    description: 'Administración registrada en farmacia',
  })
  @IsUUID()
  medicationAdministrationId!: string;

  @ApiProperty({ enum: MEDICATION_USE_ROLES })
  @IsIn(MEDICATION_USE_ROLES)
  useRole!: MedicationUseRole;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  procedureId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Muestra registrada en laboratorio',
  })
  @IsUUID()
  specimenId!: string;

  @ApiProperty({ enum: SPECIMEN_ROLES })
  @IsIn(SPECIMEN_ROLES)
  specimenRole!: SpecimenRole;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  operativeStepId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  @ApiPropertyOptional({
    description: 'Orientación de la pieza para el patólogo',
  })
  @IsOptional()
  @IsString()
  orientationText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  surgeonComment?: string;
}

export class SuppliesResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

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

export class ComplicationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  complicationCodeConceptId!: string;

  @ApiProperty({ enum: CLINICAL_SEVERITIES })
  @IsIn(CLINICAL_SEVERITIES)
  severity!: ClinicalSeverity;

  @ApiProperty({ enum: RELATEDNESS })
  @IsIn(RELATEDNESS)
  relatedness!: Relatedness;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  conditionId?: string;

  @ApiPropertyOptional({ description: 'Cómo se manejó' })
  @IsOptional()
  @IsString()
  managementText?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/operative-reports` (UC-53-11). */
export class DraftOperativeReportDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  procedureId!: string;

  @ApiProperty({ format: 'uuid', description: 'Autor del reporte' })
  @IsUUID()
  authorProfileId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preoperativeDiagnosisText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postoperativeDiagnosisText?: string;

  @ApiProperty({ description: 'Descripción de lo realizado' })
  @IsString()
  procedureDescription!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findingsText?: string;

  @ApiPropertyOptional({ description: 'Sangrado estimado en mililitros' })
  @IsOptional()
  @IsNumberString()
  estimatedBloodLossMl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  drainsText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complicationsText?: string;

  @ApiProperty({ enum: DISPOSITIONS })
  @IsIn(DISPOSITIONS)
  disposition!: Disposition;

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

export class OperativeReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Versión del reporte' })
  reportVersion!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  complicationIds!: string[];
}

/** Cuerpo de `POST /procedure-cases/{id}/operative-reports/{rid}/sign` (UC-53-11). */
export class SignReportDto {
  @ApiProperty({ format: 'uuid', description: 'Firma electrónica aplicada' })
  @IsUUID()
  signatureId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Documento firmado' })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}

export class SignReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

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
  @ApiProperty({ format: 'uuid', description: 'Espacio de recuperación' })
  @IsUUID()
  careSpaceId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  admittedByProfileId?: string;
}

export class PacuStayResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid', description: 'Ubicación del caso creada' })
  locationId!: string;
}

/** Cuerpo de `POST /pacu-stays/{id}/assessments` (UC-53-12). */
export class RecordPacuAssessmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assessedByProfileId!: string;

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

  @ApiPropertyOptional({ description: 'Escala de dolor' })
  @IsOptional()
  @IsNumberString()
  painScore?: string;

  @ApiPropertyOptional({ description: 'Escala de náusea' })
  @IsOptional()
  @IsNumberString()
  nauseaScore?: string;

  @ApiPropertyOptional({ enum: ['PATENT', 'SUPPORTED'] })
  @IsOptional()
  @IsIn(['PATENT', 'SUPPORTED'])
  airwayStatus?: 'PATENT' | 'SUPPORTED';

  @ApiPropertyOptional({ description: 'Observaciones registradas' })
  @IsOptional()
  @IsObject()
  observationsJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Criterios de alta evaluados' })
  @IsOptional()
  @IsObject()
  criteriaJson?: Record<string, unknown>;
}

export class PacuAssessmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  pacuStayId!: string;

  @ApiProperty({
    description: 'true si la valoración cumple el criterio de alta',
  })
  meetsDischargeCriteria!: boolean;
}

export class PostoperativeOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  serviceRequestId!: string;

  @ApiProperty({ enum: ['LAB', 'IMAGING', 'CONSULT', 'MEDICATION'] })
  @IsIn(['LAB', 'IMAGING', 'CONSULT', 'MEDICATION'])
  orderRole!: 'LAB' | 'IMAGING' | 'CONSULT' | 'MEDICATION';
}

export class PostoperativeFollowupDto {
  @ApiProperty({ enum: ['WOUND_CHECK', 'VISIT'] })
  @IsIn(['WOUND_CHECK', 'VISIT'])
  followupType!: 'WOUND_CHECK' | 'VISIT';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructionsText?: string;
}

/** Cuerpo de `POST /pacu-stays/{id}/discharge` (UC-53-12). */
export class DischargePacuDto {
  @ApiProperty({ enum: DISPOSITIONS })
  @IsIn(DISPOSITIONS)
  destination!: Disposition;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  dischargedByProfileId?: string;

  @ApiPropertyOptional({
    type: [PostoperativeOrderDto],
    description: 'Órdenes postoperatorias',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostoperativeOrderDto)
  orders?: PostoperativeOrderDto[];

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

export class DischargePacuResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Órdenes postoperatorias creadas' })
  ordersCreated!: number;

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
  @ApiProperty({ format: 'uuid', description: 'Motivo de la cancelación' })
  @IsUUID()
  cancellationReasonConceptId!: string;

  @ApiProperty({ enum: CANCELLATION_CATEGORIES })
  @IsIn(CANCELLATION_CATEGORIES)
  category!: CancellationCategory;

  @ApiProperty({
    description: 'Si era evitable; es lo que mide la calidad del proceso',
  })
  @IsBoolean()
  preventable!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanationText?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  rescheduleRequired?: boolean;
}

export class CancelCaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid', description: 'Registro de la cancelación' })
  cancellationId!: string;

  @ApiProperty({ description: 'true si se liberó el quirófano reservado' })
  operatingRoomReleased!: boolean;
}

// ---------------------------------------------------------------------------
// UC-53-14 · Cargos y utilización
// ---------------------------------------------------------------------------

/** Naturaleza del cargo generado. */
export type ChargeType = 'PROCEDURE' | 'IMPLANT' | 'SUPPLY' | 'OR_TIME';
const CHARGE_TYPES = ['PROCEDURE', 'IMPLANT', 'SUPPLY', 'OR_TIME'] as const;

export class ChargeItemDto {
  @ApiProperty({ enum: CHARGE_TYPES })
  @IsIn(CHARGE_TYPES)
  chargeType!: ChargeType;

  @ApiProperty({
    format: 'uuid',
    description: 'Concepto facturable del catálogo',
  })
  @IsUUID()
  billableItemId!: string;

  @ApiProperty({ description: 'Cantidad, como cadena decimal' })
  @IsNumberString()
  quantity!: string;

  @ApiPropertyOptional({ description: 'Precio unitario' })
  @IsOptional()
  @IsNumberString()
  unitPrice?: string;

  @ApiPropertyOptional({ maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/charge-items/post` (UC-53-14). */
export class PostChargesDto {
  @ApiProperty({
    type: [ChargeItemDto],
    description: 'Cargos a generar, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChargeItemDto)
  items!: ChargeItemDto[];

  @ApiPropertyOptional({
    default: true,
    description: 'Consolidar además el uso real del quirófano',
  })
  @IsOptional()
  @IsBoolean()
  consolidateUtilization?: boolean;

  @ApiPropertyOptional({
    description: 'Segundos de recambio hasta el siguiente caso',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  turnoverSeconds?: number;
}

export class PostChargesResponseDto {
  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  @ApiProperty({ description: 'Cargos generados' })
  charged!: number;

  @ApiProperty({ description: 'Importe total de los cargos' })
  totalAmount!: string;

  @ApiPropertyOptional({ description: 'Duración real del caso, en segundos' })
  actualDurationSeconds?: number;

  @ApiPropertyOptional({
    description: 'Desviación frente a lo programado, en segundos',
  })
  scheduleVarianceSeconds?: number;
}
