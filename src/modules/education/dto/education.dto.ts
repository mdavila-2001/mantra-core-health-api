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

/**
 * Define el contrato validado para lesson.
 */
export class LessonDto {
  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  /**
   * Valor de content type mantenido por la instancia.
   */
  @ApiProperty({ enum: LESSON_CONTENT_TYPES })
  @IsIn(LESSON_CONTENT_TYPES)
  contentType!: LessonContentType;

  /**
   * Identificador asociado a media file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo en `common.files`',
  })
  @IsOptional()
  @IsUUID()
  mediaFileId?: string;

  /**
   * Valor de external url mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Recurso externo cuando el contenido no se aloja aquí',
  })
  @IsOptional()
  @IsString()
  externalUrl?: string;

  /**
   * Valor de duration minutes mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  /**
   * Valor de is preview mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Visible sin inscripción, como muestra del curso',
  })
  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;
}

/**
 * Define el contrato validado para course module.
 */
export class CourseModuleDto {
  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Valor de lessons mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del curso, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Valor de course type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['SELF_PACED', 'INSTRUCTOR_LED'] })
  @IsIn(['SELF_PACED', 'INSTRUCTOR_LED'])
  courseType!: CourseType;

  /**
   * Valor de level mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: COURSE_LEVELS })
  @IsOptional()
  @IsIn(COURSE_LEVELS)
  level?: CourseLevel;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Identificador asociado a language concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  languageConceptId?: string;

  /**
   * Valor de is accredited mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Un curso acreditado otorga créditos CME al completarse',
  })
  @IsOptional()
  @IsBoolean()
  isAccredited?: boolean;

  /**
   * Valor de cme credit hours mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Horas CME que otorga; obligatorio si está acreditado',
  })
  @IsOptional()
  @IsNumberString()
  cmeCreditHours?: string;

  /**
   * Identificador asociado a accrediting body concept.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Organismo acreditador' })
  @IsOptional()
  @IsUUID()
  accreditingBodyConceptId?: string;

  /**
   * Valor de price mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  price?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de modules mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para course response.
 */
export class CourseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de current version mantenido por la instancia.
   */
  @ApiProperty()
  currentVersion!: number;

  /**
   * Valor de module ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  moduleIds!: string[];

  /**
   * Valor de lessons mantenido por la instancia.
   */
  @ApiProperty({ description: 'Lecciones creadas en total' })
  lessons!: number;

  /**
   * Valor de duration minutes mantenido por la instancia.
   */
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
  /**
   * Valor de changelog mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Qué cambió respecto de la versión anterior',
  })
  @IsOptional()
  @IsString()
  changelog?: string;
}

/**
 * Define el contrato validado para course version response.
 */
export class CourseVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a course.
   */
  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Perfil profesional; si ya tiene ficha de instructor, se reutiliza',
  })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;

  /**
   * Identificador asociado a user.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  displayName!: string;

  /**
   * Valor de bio mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  /**
   * Valor de credentials text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Titulación tal como se muestra' })
  @IsOptional()
  @IsString()
  credentialsText?: string;

  /**
   * Valor de role mantenido por la instancia.
   */
  @ApiProperty({ enum: INSTRUCTOR_ROLES })
  @IsIn(INSTRUCTOR_ROLES)
  role!: InstructorRole;
}

/**
 * Define el contrato validado para instructor assignment response.
 */
export class InstructorAssignmentResponseDto {
  /**
   * Identificador asociado a instructor.
   */
  @ApiProperty({ format: 'uuid' })
  instructorId!: string;

  /**
   * Identificador asociado a course instructor.
   */
  @ApiProperty({ format: 'uuid' })
  courseInstructorId!: string;

  /**
   * Valor de instructor existed mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la ficha de instructor ya existía' })
  instructorExisted!: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
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
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código de la cohorte, único por curso',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de delivery mode mantenido por la instancia.
   */
  @ApiProperty({ enum: DELIVERY_MODES })
  @IsIn(DELIVERY_MODES)
  deliveryMode!: DeliveryMode;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  /**
   * Valor de capacity mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Plazas; sin ella la cohorte no tiene límite',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

/**
 * Define el contrato validado para cohort response.
 */
export class CohortResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a status concept.
   */
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
  /**
   * Identificador asociado a course.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  courseId!: string;

  /**
   * Identificador asociado a cohort.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cohortId?: string;

  /**
   * Valor de learner type mantenido por la instancia.
   */
  @ApiProperty({ enum: LEARNER_TYPES })
  @IsIn(LEARNER_TYPES)
  learnerType!: LearnerType;

  /**
   * Identificador asociado a learner ref.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  learnerRefId!: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @ApiProperty({ enum: ENROLLMENT_SOURCES })
  @IsIn(ENROLLMENT_SOURCES)
  source!: EnrollmentSource;

  /**
   * Identificador asociado a payment intent.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Intento de pago; obligatorio si la inscripción es PURCHASED',
  })
  @IsOptional()
  @IsUUID()
  paymentIntentId?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Caducidad del acceso',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

/**
 * Define el contrato validado para enrollment response.
 */
export class EnrollmentResponseDto {
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
   * Valor de progress percent mantenido por la instancia.
   */
  @ApiProperty({ description: 'Progreso del curso, en porcentaje' })
  progressPercent!: string;

  /**
   * Valor de cohort enrolled count mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a lesson.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  lessonId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ enum: ['IN_PROGRESS', 'COMPLETED'] })
  @IsIn(['IN_PROGRESS', 'COMPLETED'])
  status!: LessonProgressStatus;

  /**
   * Valor de seconds watched mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Segundos vistos del contenido' })
  @IsOptional()
  @IsInt()
  @Min(0)
  secondsWatched?: number;

  /**
   * Valor de completion percent mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Porcentaje visto de la lección' })
  @IsOptional()
  @IsNumberString()
  completionPercent?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió; por defecto, ahora',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

/**
 * Define el contrato validado para progress response.
 */
export class ProgressResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Anotación de progreso creada' })
  id!: string;

  /**
   * Identificador asociado a enrollment.
   */
  @ApiProperty({ format: 'uuid' })
  enrollmentId!: string;

  /**
   * Valor de progress percent mantenido por la instancia.
   */
  @ApiProperty({ description: 'Progreso del curso recalculado' })
  progressPercent!: string;

  /**
   * Valor de completed lessons mantenido por la instancia.
   */
  @ApiProperty({ description: 'Lecciones completadas' })
  completedLessons!: number;

  /**
   * Valor de total lessons mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para assessment question.
 */
export class AssessmentQuestionDto {
  /**
   * Valor de question type mantenido por la instancia.
   */
  @ApiProperty({ enum: QUESTION_TYPES })
  @IsIn(QUESTION_TYPES)
  questionType!: QuestionType;

  /**
   * Valor de prompt text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Enunciado' })
  @IsString()
  promptText!: string;

  /**
   * Valor de options json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Opciones que se muestran al aprendiz' })
  @IsOptional()
  @IsObject()
  optionsJson?: Record<string, unknown>;

  /**
   * Valor de correct answer json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Respuesta correcta. Sólo la lee la corrección; nunca se devuelve al aprendiz.',
  })
  @IsOptional()
  @IsObject()
  correctAnswerJson?: Record<string, unknown>;

  /**
   * Valor de points mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Puntos de la pregunta', default: '1' })
  @IsOptional()
  @IsNumberString()
  points?: string;
}

/** Cuerpo de `POST /education/courses/{id}/assessments` (UC-47-07). */
export class CreateAssessmentDto {
  /**
   * Identificador asociado a course module.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Módulo al que pertenece la evaluación',
  })
  @IsOptional()
  @IsUUID()
  courseModuleId?: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  /**
   * Valor de assessment type mantenido por la instancia.
   */
  @ApiProperty({ enum: ASSESSMENT_TYPES })
  @IsIn(ASSESSMENT_TYPES)
  assessmentType!: AssessmentType;

  /**
   * Valor de passing score mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Puntuación mínima para aprobar, en porcentaje',
  })
  @IsOptional()
  @IsNumberString()
  passingScore?: string;

  /**
   * Valor de max attempts mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Intentos permitidos', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  /**
   * Valor de time limit minutes mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimitMinutes?: number;

  /**
   * Valor de is graded mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true, description: 'Una encuesta no puntúa' })
  @IsOptional()
  @IsBoolean()
  isGraded?: boolean;

  /**
   * Valor de questions mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para assessment response.
 */
export class AssessmentResponseDto {
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
   * Valor de question ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  questionIds!: string[];

  /**
   * Valor de total points mantenido por la instancia.
   */
  @ApiProperty({ description: 'Suma de los puntos de las preguntas' })
  totalPoints!: string;
}

// ---------------------------------------------------------------------------
// UC-47-08 / UC-47-09 · Intentos
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /education/assessments/{id}/attempts` (UC-47-08). */
export class StartAttemptDto {
  /**
   * Identificador asociado a enrollment.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  enrollmentId!: string;
}

/**
 * Define el contrato validado para attempt response.
 */
export class AttemptResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número del intento' })
  attemptNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Momento límite para enviarlo, si la evaluación lo acota',
  })
  dueAt?: string;
}

/** Cuerpo de `POST /education/attempts/{id}/submit` (UC-47-09). */
export class SubmitAttemptDto {
  /**
   * Valor de responses json mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Respuestas por pregunta, con la forma { "<questionId>": <respuesta> }',
  })
  @IsObject()
  responsesJson!: Record<string, unknown>;
}

/**
 * Define el contrato validado para graded attempt response.
 */
export class GradedAttemptResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de score mantenido por la instancia.
   */
  @ApiProperty({ description: 'Puntuación obtenida, en porcentaje' })
  score!: string;

  /**
   * Valor de passed mantenido por la instancia.
   */
  @ApiProperty()
  passed!: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de correct answers mantenido por la instancia.
   */
  @ApiProperty({ description: 'Preguntas acertadas' })
  correctAnswers!: number;

  /**
   * Valor de total questions mantenido por la instancia.
   */
  @ApiProperty({ description: 'Preguntas de la evaluación' })
  totalQuestions!: number;
}

// ---------------------------------------------------------------------------
// UC-47-10 · Finalización
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para complete enrollment response.
 */
export class CompleteEnrollmentResponseDto {
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
   * Valor de progress percent mantenido por la instancia.
   */
  @ApiProperty()
  progressPercent!: string;

  /**
   * Valor de already completed mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si ya estaba completada' })
  alreadyCompleted!: boolean;
}

// ---------------------------------------------------------------------------
// UC-47-11 / UC-47-14 · Certificado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /education/enrollments/{id}/certificate` (UC-47-11). */
export class IssueCertificateDto {
  /**
   * Identificador asociado a file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Documento del certificado',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  /**
   * Valor de validity months mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigencia del certificado, en meses' })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityMonths?: number;
}

/**
 * Define el contrato validado para certificate response.
 */
export class CertificateResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de certificate number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número del certificado' })
  certificateNumber!: string;

  /**
   * Valor de verification code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código con el que un tercero lo verifica' })
  verificationCode!: string;

  /**
   * Valor de cme credits awarded mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Horas CME acreditadas' })
  cmeCreditsAwarded?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de already issued mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si ya estaba emitido' })
  alreadyIssued!: boolean;
}

/** Cuerpo de `POST /education/certificates/{id}/revoke` (UC-47-14). */
export class RevokeCertificateDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se revoca' })
  @IsString()
  reason!: string;
}

/**
 * Define el contrato validado para revoke certificate response.
 */
export class RevokeCertificateResponseDto {
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
   * Valor de cme records reversed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Créditos CME revertidos' })
  cmeRecordsReversed!: number;
}

// ---------------------------------------------------------------------------
// UC-47-12 · Créditos CME
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /education/certificates/{id}/cme-credits` (UC-47-12). */
export class RecordCmeCreditDto {
  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Perfil profesional al que se acredita',
  })
  @IsUUID()
  practitionerProfileId!: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Valor de period year mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Año del periodo de acreditación; por defecto, el actual',
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  periodYear?: number;
}

/**
 * Define el contrato validado para cme credit response.
 */
export class CmeCreditResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de credit hours mantenido por la instancia.
   */
  @ApiProperty({ description: 'Horas acreditadas' })
  creditHours!: string;

  /**
   * Valor de period year mantenido por la instancia.
   */
  @ApiProperty()
  periodYear!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de already awarded mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el crédito ya estaba acreditado' })
  alreadyAwarded!: boolean;
}

// ---------------------------------------------------------------------------
// UC-47-13 · Reseña
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /education/courses/{id}/reviews` (UC-47-13). */
export class CreateReviewDto {
  /**
   * Valor de rating mantenido por la instancia.
   */
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  /**
   * Valor de review text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewText?: string;
}

/**
 * Define el contrato validado para review response.
 */
export class ReviewResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a course.
   */
  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  /**
   * Valor de rating mantenido por la instancia.
   */
  @ApiProperty()
  rating!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
