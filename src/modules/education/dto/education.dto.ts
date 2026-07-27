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

/** Tipo de aprendiz que se inscribe. */
export type LearnerType = 'PRACTITIONER' | 'STAFF' | 'PATIENT' | 'USER';
const LEARNER_TYPES = ['PRACTITIONER', 'STAFF', 'PATIENT', 'USER'] as const;

// ---------------------------------------------------------------------------
// UC-47-01 · Publicación del curso
// ---------------------------------------------------------------------------

/** Modalidad del curso. */
export type CourseType = 'SELF_PACED' | 'INSTRUCTOR_LED';

/** Nivel del curso. */
export type CourseLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
const COURSE_LEVELS = ['BASIC', 'INTERMEDIATE', 'ADVANCED'] as const;

/** Naturaleza del contenido de la lección. */
export type LessonContentType =
  'VIDEO' | 'ARTICLE' | 'PDF' | 'SCORM' | 'QUIZ' | 'LIVE_SESSION';
const LESSON_CONTENT_TYPES = [
  'VIDEO',
  'ARTICLE',
  'PDF',
  'SCORM',
  'QUIZ',
  'LIVE_SESSION',
] as const;

export class LessonDto {
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiProperty({ enum: LESSON_CONTENT_TYPES })
  @IsIn(LESSON_CONTENT_TYPES)
  contentType!: LessonContentType;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo en `common.files`',
  })
  @IsOptional()
  @IsUUID()
  mediaFileId?: string;

  @ApiPropertyOptional({
    description: 'Recurso externo cuando el contenido no se aloja aquí',
  })
  @IsOptional()
  @IsString()
  externalUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Visible sin inscripción, como muestra del curso',
  })
  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;
}

export class CourseModuleDto {
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [LessonDto],
    description: 'Lecciones del módulo, al menos una',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LessonDto)
  lessons!: LessonDto[];
}

/** Cuerpo de `POST /education/courses/publish` (UC-47-01). */
export class PublishCourseDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ description: 'Código del curso, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['SELF_PACED', 'INSTRUCTOR_LED'] })
  @IsIn(['SELF_PACED', 'INSTRUCTOR_LED'])
  courseType!: CourseType;

  @ApiPropertyOptional({ enum: COURSE_LEVELS })
  @IsOptional()
  @IsIn(COURSE_LEVELS)
  level?: CourseLevel;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  languageConceptId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Un curso acreditado otorga créditos CME al completarse',
  })
  @IsOptional()
  @IsBoolean()
  isAccredited?: boolean;

  @ApiPropertyOptional({
    description: 'Horas CME que otorga; obligatorio si está acreditado',
  })
  @IsOptional()
  @IsNumberString()
  cmeCreditHours?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Organismo acreditador' })
  @IsOptional()
  @IsUUID()
  accreditingBodyConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  price?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiProperty({
    type: [CourseModuleDto],
    description: 'Módulos del curso, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CourseModuleDto)
  modules!: CourseModuleDto[];
}

export class CourseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  currentVersion!: number;

  @ApiProperty({ type: [String], format: 'uuid' })
  moduleIds!: string[];

  @ApiProperty({ description: 'Lecciones creadas en total' })
  lessons!: number;

  @ApiProperty({
    description: 'Duración derivada de la suma de las lecciones, en minutos',
  })
  durationMinutes!: number;
}

// ---------------------------------------------------------------------------
// UC-47-02 · Versión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /education/courses/{id}/versions/publish` (UC-47-02). */
export class PublishVersionDto {
  @ApiPropertyOptional({
    description: 'Qué cambió respecto de la versión anterior',
  })
  @IsOptional()
  @IsString()
  changelog?: string;
}

export class CourseVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  @ApiProperty({
    description: 'Versión publicada; el curso pasa a apuntar a ella',
  })
  version!: number;
}

// ---------------------------------------------------------------------------
// UC-47-03 · Instructores
// ---------------------------------------------------------------------------

/** Papel del instructor en el curso. */
export type InstructorRole = 'LEAD' | 'CO' | 'GUEST' | 'ASSISTANT';
const INSTRUCTOR_ROLES = ['LEAD', 'CO', 'GUEST', 'ASSISTANT'] as const;

/** Cuerpo de `POST /education/courses/{id}/instructors` (UC-47-03). */
export class AssignInstructorDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Perfil profesional; si ya tiene ficha de instructor, se reutiliza',
  })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  displayName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Titulación tal como se muestra' })
  @IsOptional()
  @IsString()
  credentialsText?: string;

  @ApiProperty({ enum: INSTRUCTOR_ROLES })
  @IsIn(INSTRUCTOR_ROLES)
  role!: InstructorRole;
}

export class InstructorAssignmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  instructorId!: string;

  @ApiProperty({ format: 'uuid' })
  courseInstructorId!: string;

  @ApiProperty({ description: 'true si la ficha de instructor ya existía' })
  instructorExisted!: boolean;

  @ApiProperty({
    description: 'Posición en la lista de instructores del curso',
  })
  ordinal!: number;
}

// ---------------------------------------------------------------------------
// UC-47-04 · Cohorte
// ---------------------------------------------------------------------------

/** Cómo se imparte la cohorte. */
export type DeliveryMode = 'ONLINE' | 'IN_PERSON' | 'HYBRID';
const DELIVERY_MODES = ['ONLINE', 'IN_PERSON', 'HYBRID'] as const;

/** Cuerpo de `POST /education/courses/{id}/cohorts` (UC-47-04). */
export class OpenCohortDto {
  @ApiProperty({
    description: 'Código de la cohorte, único por curso',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ enum: DELIVERY_MODES })
  @IsIn(DELIVERY_MODES)
  deliveryMode!: DeliveryMode;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Plazas; sin ella la cohorte no tiene límite',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class CohortResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-47-05 · Inscripción
// ---------------------------------------------------------------------------

/** De dónde viene la inscripción. */
export type EnrollmentSource = 'SELF' | 'ASSIGNED' | 'PURCHASED' | 'PARTNER';
const ENROLLMENT_SOURCES = [
  'SELF',
  'ASSIGNED',
  'PURCHASED',
  'PARTNER',
] as const;

/** Cuerpo de `POST /education/enrollments` (UC-47-05). */
export class EnrollLearnerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  courseId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cohortId?: string;

  @ApiProperty({ enum: LEARNER_TYPES })
  @IsIn(LEARNER_TYPES)
  learnerType!: LearnerType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  learnerRefId!: string;

  @ApiProperty({ enum: ENROLLMENT_SOURCES })
  @IsIn(ENROLLMENT_SOURCES)
  source!: EnrollmentSource;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Intento de pago; obligatorio si la inscripción es PURCHASED',
  })
  @IsOptional()
  @IsUUID()
  paymentIntentId?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Caducidad del acceso',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class EnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Progreso del curso, en porcentaje' })
  progressPercent!: string;

  @ApiPropertyOptional({
    description: 'Plazas ocupadas de la cohorte tras inscribir',
  })
  cohortEnrolledCount?: number;
}

// ---------------------------------------------------------------------------
// UC-47-06 · Progreso
// ---------------------------------------------------------------------------

/** Estado de la lección para el aprendiz. */
export type LessonProgressStatus = 'IN_PROGRESS' | 'COMPLETED';

/** Cuerpo de `POST /education/enrollments/{id}/lesson-progress` (UC-47-06). */
export class RecordProgressDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  lessonId!: string;

  @ApiProperty({ enum: ['IN_PROGRESS', 'COMPLETED'] })
  @IsIn(['IN_PROGRESS', 'COMPLETED'])
  status!: LessonProgressStatus;

  @ApiPropertyOptional({ description: 'Segundos vistos del contenido' })
  @IsOptional()
  @IsInt()
  @Min(0)
  secondsWatched?: number;

  @ApiPropertyOptional({ description: 'Porcentaje visto de la lección' })
  @IsOptional()
  @IsNumberString()
  completionPercent?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió; por defecto, ahora',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

export class ProgressResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Anotación de progreso creada' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  enrollmentId!: string;

  @ApiProperty({ description: 'Progreso del curso recalculado' })
  progressPercent!: string;

  @ApiProperty({ description: 'Lecciones completadas' })
  completedLessons!: number;

  @ApiProperty({ description: 'Lecciones publicadas del curso' })
  totalLessons!: number;
}

// ---------------------------------------------------------------------------
// UC-47-07 · Diseño de evaluación
// ---------------------------------------------------------------------------

/** Naturaleza de la evaluación. */
export type AssessmentType = 'QUIZ' | 'EXAM' | 'SURVEY';
const ASSESSMENT_TYPES = ['QUIZ', 'EXAM', 'SURVEY'] as const;

/** Forma de la pregunta. */
export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'MATCHING';
const QUESTION_TYPES = [
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'MATCHING',
] as const;

export class AssessmentQuestionDto {
  @ApiProperty({ enum: QUESTION_TYPES })
  @IsIn(QUESTION_TYPES)
  questionType!: QuestionType;

  @ApiProperty({ description: 'Enunciado' })
  @IsString()
  promptText!: string;

  @ApiPropertyOptional({ description: 'Opciones que se muestran al aprendiz' })
  @IsOptional()
  @IsObject()
  optionsJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Respuesta correcta. Sólo la lee la corrección; nunca se devuelve al aprendiz.',
  })
  @IsOptional()
  @IsObject()
  correctAnswerJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Puntos de la pregunta', default: '1' })
  @IsOptional()
  @IsNumberString()
  points?: string;
}

/** Cuerpo de `POST /education/courses/{id}/assessments` (UC-47-07). */
export class CreateAssessmentDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Módulo al que pertenece la evaluación',
  })
  @IsOptional()
  @IsUUID()
  courseModuleId?: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiProperty({ enum: ASSESSMENT_TYPES })
  @IsIn(ASSESSMENT_TYPES)
  assessmentType!: AssessmentType;

  @ApiPropertyOptional({
    description: 'Puntuación mínima para aprobar, en porcentaje',
  })
  @IsOptional()
  @IsNumberString()
  passingScore?: string;

  @ApiPropertyOptional({ description: 'Intentos permitidos', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimitMinutes?: number;

  @ApiPropertyOptional({ default: true, description: 'Una encuesta no puntúa' })
  @IsOptional()
  @IsBoolean()
  isGraded?: boolean;

  @ApiProperty({
    type: [AssessmentQuestionDto],
    description: 'Preguntas, al menos una',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AssessmentQuestionDto)
  questions!: AssessmentQuestionDto[];
}

export class AssessmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  questionIds!: string[];

  @ApiProperty({ description: 'Suma de los puntos de las preguntas' })
  totalPoints!: string;
}

// ---------------------------------------------------------------------------
// UC-47-08 / UC-47-09 · Intentos
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /education/assessments/{id}/attempts` (UC-47-08). */
export class StartAttemptDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  enrollmentId!: string;
}

export class AttemptResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Número del intento' })
  attemptNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({
    description: 'Momento límite para enviarlo, si la evaluación lo acota',
  })
  dueAt?: string;
}

/** Cuerpo de `POST /education/attempts/{id}/submit` (UC-47-09). */
export class SubmitAttemptDto {
  @ApiProperty({
    description:
      'Respuestas por pregunta, con la forma { "<questionId>": <respuesta> }',
  })
  @IsObject()
  responsesJson!: Record<string, unknown>;
}

export class GradedAttemptResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Puntuación obtenida, en porcentaje' })
  score!: string;

  @ApiProperty()
  passed!: boolean;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Preguntas acertadas' })
  correctAnswers!: number;

  @ApiProperty({ description: 'Preguntas de la evaluación' })
  totalQuestions!: number;
}

// ---------------------------------------------------------------------------
// UC-47-10 · Finalización
// ---------------------------------------------------------------------------

export class CompleteEnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  progressPercent!: string;

  @ApiProperty({ description: 'true si ya estaba completada' })
  alreadyCompleted!: boolean;
}

// ---------------------------------------------------------------------------
// UC-47-11 / UC-47-14 · Certificado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /education/enrollments/{id}/certificate` (UC-47-11). */
export class IssueCertificateDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Documento del certificado',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  @ApiPropertyOptional({ description: 'Vigencia del certificado, en meses' })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityMonths?: number;
}

export class CertificateResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Número del certificado' })
  certificateNumber!: string;

  @ApiProperty({ description: 'Código con el que un tercero lo verifica' })
  verificationCode!: string;

  @ApiPropertyOptional({ description: 'Horas CME acreditadas' })
  cmeCreditsAwarded?: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'true si ya estaba emitido' })
  alreadyIssued!: boolean;
}

/** Cuerpo de `POST /education/certificates/{id}/revoke` (UC-47-14). */
export class RevokeCertificateDto {
  @ApiProperty({ description: 'Por qué se revoca' })
  @IsString()
  reason!: string;
}

export class RevokeCertificateResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Créditos CME revertidos' })
  cmeRecordsReversed!: number;
}

// ---------------------------------------------------------------------------
// UC-47-12 · Créditos CME
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /education/certificates/{id}/cme-credits` (UC-47-12). */
export class RecordCmeCreditDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Perfil profesional al que se acredita',
  })
  @IsUUID()
  practitionerProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({
    description: 'Año del periodo de acreditación; por defecto, el actual',
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  periodYear?: number;
}

export class CmeCreditResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Horas acreditadas' })
  creditHours!: string;

  @ApiProperty()
  periodYear!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'true si el crédito ya estaba acreditado' })
  alreadyAwarded!: boolean;
}

// ---------------------------------------------------------------------------
// UC-47-13 · Reseña
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /education/courses/{id}/reviews` (UC-47-13). */
export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewText?: string;
}

export class ReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  @ApiProperty()
  rating!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
