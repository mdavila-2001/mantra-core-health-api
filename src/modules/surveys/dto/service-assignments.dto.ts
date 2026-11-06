import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';
import { ANSWER_TYPE_CODES, type AnswerTypeCode } from '../surveys.concepts';
import { SERVICE_KINDS, type ServiceKind } from '../surveys-standard.catalog';

/** Fuente de un instrumento del catálogo estándar. */
export class StandardSurveySourceDto {
  /** Instrumento de origen. */
  @ApiProperty({ example: 'CAHPS Clinician & Group Survey 3.0' })
  instrument!: string;

  /** Licencia o régimen de uso. */
  @ApiProperty({ example: 'Dominio público (AHRQ)' })
  license!: string;

  /** Página oficial del instrumento o de su licencia. */
  @ApiProperty({ format: 'uri' })
  url!: string;
}

/** Una pregunta de una plantilla del catálogo estándar. */
export class StandardSurveyQuestionDto {
  /** Enunciado tal como lo lee el paciente. */
  @ApiProperty()
  text!: string;

  /** Tipo de respuesta. */
  @ApiProperty({ enum: ANSWER_TYPE_CODES })
  answerType!: AnswerTypeCode;

  /** Siempre `false`: las preguntas del profesional son opcionales. */
  @ApiProperty()
  required!: boolean;

  /** Opciones en orden (sólo elección). */
  @ApiPropertyOptional({ type: [String] })
  options?: string[];

  /** Mínimo de la escala (sólo `SCALE`). */
  @ApiPropertyOptional()
  scaleMin?: number;

  /** Máximo de la escala (sólo `SCALE`). */
  @ApiPropertyOptional()
  scaleMax?: number;

  /** Tema que mide (slug estable). Orienta; no se persiste. */
  @ApiProperty({ example: 'espera' })
  dimension!: string;
}

/** Una plantilla del catálogo estándar. */
export class StandardSurveyDto {
  /** Código estable `STD_<KIND>_V<n>`. */
  @ApiProperty({ example: 'STD_IMAGING_V1' })
  code!: string;

  /** Título. */
  @ApiProperty()
  title!: string;

  /** Consigna que ve el paciente. */
  @ApiProperty()
  description!: string;

  /** Tipos de servicio a los que apunta (orienta, no restringe). */
  @ApiProperty({ enum: SERVICE_KINDS, isArray: true })
  serviceKinds!: ServiceKind[];

  /** Fuente principal. */
  @ApiProperty({ type: StandardSurveySourceDto })
  source!: StandardSurveySourceDto;

  /** Otras fuentes de las que salen ítems. */
  @ApiProperty({ type: [StandardSurveySourceDto] })
  additionalSources!: StandardSurveySourceDto[];

  /** Las preguntas, en orden. */
  @ApiProperty({ type: [StandardSurveyQuestionDto] })
  questions!: StandardSurveyQuestionDto[];
}

/** Respuesta de `GET /surveys/catalog`. */
export class StandardSurveyCatalogDto {
  /** Las plantillas, una por tipo de servicio (la consulta no está). */
  @ApiProperty({ type: [StandardSurveyDto] })
  items!: StandardSurveyDto[];
}

/** Una pregunta de la encuesta base de consulta del sistema. */
export class BaseSurveyQuestionDto {
  /** Posición desde 1. */
  @ApiProperty({ example: 1 })
  position!: number;

  /** Enunciado tal como lo lee el paciente. */
  @ApiProperty()
  text!: string;

  /** Tipo de respuesta. */
  @ApiProperty({ enum: ANSWER_TYPE_CODES })
  answerType!: AnswerTypeCode;

  /** Si el paciente debe contestarla. */
  @ApiProperty()
  required!: boolean;

  /** Opciones en orden (sólo elección). */
  @ApiPropertyOptional({ type: [String] })
  options?: string[];

  /** Mínimo de la escala (sólo `SCALE`). */
  @ApiPropertyOptional()
  scaleMin?: number;

  /** Máximo de la escala (sólo `SCALE`). */
  @ApiPropertyOptional()
  scaleMax?: number;
}

/** La fila fija «Cita médica»: la encuesta base de consulta del sistema. */
export class ConsultationSurveyRowDto {
  /** Siempre `true`: es del sistema. */
  @ApiProperty({ example: true })
  system!: boolean;

  /** Rótulo de la fila. */
  @ApiProperty({ example: 'Cita médica' })
  title!: string;

  /** Título de la encuesta base. */
  @ApiProperty({ example: 'Encuesta de su consulta médica' })
  templateTitle!: string;

  /** Cantidad de preguntas de la versión vigente de la base. */
  @ApiProperty({ example: 12 })
  questionCount!: number;

  /** Siempre `false`: la base de consulta no se reemplaza ni se quita. */
  @ApiProperty({ example: false })
  replaceable!: boolean;

  /** Las preguntas de la versión vigente de la base, en orden. */
  @ApiProperty({ type: [BaseSurveyQuestionDto] })
  questions!: BaseSurveyQuestionDto[];
}

/** La encuesta activa de un servicio. */
export class ServiceSurveyAssignmentDto {
  /** Asignación activa. */
  @ApiProperty({ format: 'uuid' })
  assignmentId!: string;

  /**
   * Código del catálogo del que se importó. `null` sólo en una asignación
   * anterior al catálogo (plantilla escrita a mano).
   */
  @ApiProperty({ example: 'STD_IMAGING_V1', nullable: true, type: String })
  catalogCode!: string | null;

  /** Título de la plantilla. */
  @ApiProperty()
  title!: string;

  /** Plantilla propia del profesional. */
  @ApiProperty({ format: 'uuid' })
  templateId!: string;

  /** Versión publicada que se reparte. */
  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  /** Cuándo se asoció. */
  @ApiProperty({ format: 'date-time' })
  assignedAt!: string;
}

/** Un servicio del profesional con su encuesta. */
export class ServiceSurveyRowDto {
  /** `billing.service_catalog.id`. */
  @ApiProperty({ format: 'uuid' })
  serviceId!: string;

  /** Nombre del servicio. */
  @ApiProperty({ example: 'Ecografía abdominal' })
  serviceName!: string;

  /**
   * Tipo de servicio derivado en el servidor de su nombre (`service-kind.ts`):
   * orienta qué plantilla del catálogo sugerir. `OTHER` si no se reconoce.
   */
  @ApiProperty({ enum: SERVICE_KINDS, example: 'IMAGING' })
  serviceKind!: ServiceKind;

  /**
   * La encuesta activa, o `null`: el servicio usa la encuesta base de
   * servicio del sistema.
   */
  @ApiProperty({ type: ServiceSurveyAssignmentDto, nullable: true })
  assignment!: ServiceSurveyAssignmentDto | null;
}

/** Respuesta de `GET /surveys/service-assignments`. */
export class ServiceSurveyAssignmentsDto {
  /** La fila fija de la cita médica. */
  @ApiProperty({ type: ConsultationSurveyRowDto })
  consultation!: ConsultationSurveyRowDto;

  /** Los servicios activos del profesional en la organización. */
  @ApiProperty({ type: [ServiceSurveyRowDto] })
  services!: ServiceSurveyRowDto[];
}

/** Cuerpo de `PUT /surveys/service-assignments/:serviceId`. */
export class ImportServiceSurveyDto {
  /** Código de la plantilla del catálogo estándar. */
  @ApiProperty({ example: 'STD_IMAGING_V1', pattern: '^STD_[A-Z0-9_]+$' })
  @IsString()
  @MaxLength(64)
  @Matches(/^STD_[A-Z0-9_]+$/)
  catalogCode!: string;
}
