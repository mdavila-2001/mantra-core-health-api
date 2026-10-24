import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ANSWER_TYPE_CODES, type AnswerTypeCode } from '../surveys.concepts';

/** Respuesta genérica con el id del recurso creado. */
export class IdResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

/** Resultado genérico de una operación de estado (publicar, desactivar). */
export class OkResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}

/** Alta de plantilla: la plantilla y su versión 1 en borrador. */
export class TemplateCreatedDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a version.
   */
  @ApiProperty({ format: 'uuid', description: 'Versión 1 (borrador) creada' })
  versionId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de la versión creada' })
  versionNumber!: number;
}

/** Una pregunta tal como la consumen el editor del profesional y el paciente. */
export class QuestionDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de position mantenido por la instancia.
   */
  @ApiProperty({ description: 'Posición dentro del cuestionario' })
  position!: number;

  /**
   * Valor de question text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Enunciado' })
  questionText!: string;

  /**
   * Valor de answer type mantenido por la instancia.
   */
  @ApiProperty({ enum: ANSWER_TYPE_CODES })
  answerType!: AnswerTypeCode;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiProperty({ description: 'Si es obligatoria' })
  required!: boolean;

  /**
   * Valor de options mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String], description: 'Opciones de elección' })
  options?: string[];

  /**
   * Valor de scale min mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Mínimo de la escala' })
  scaleMin?: number;

  /**
   * Valor de scale max mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Máximo de la escala' })
  scaleMax?: number;
}

/** Fila del listado de plantillas del profesional. */
export class TemplateSummaryDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ description: 'Título del instrumento' })
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Consigna para el paciente' })
  description?: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    enum: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    description: 'Estado de la plantilla',
  })
  status!: 'DRAFT' | 'ACTIVE' | 'INACTIVE';

  /**
   * Valor de latest version number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de la última versión' })
  latestVersionNumber!: number;

  /**
   * Valor de published mantenido por la instancia.
   */
  @ApiProperty({ description: 'Si tiene al menos una versión publicada' })
  published!: boolean;

  /**
   * Valor de question count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Preguntas de la última versión' })
  questionCount!: number;
}

/** Detalle de una plantilla con el cuestionario de su última versión. */
export class TemplateDetailDto extends TemplateSummaryDto {
  /**
   * Identificador asociado a latest version.
   */
  @ApiProperty({ format: 'uuid', description: 'Última versión' })
  latestVersionId!: string;

  /**
   * Valor de response window days mantenido por la instancia.
   */
  @ApiProperty({ description: 'Días de plazo para responder' })
  responseWindowDays!: number;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  effectiveFrom?: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  effectiveTo?: Date;

  /**
   * Valor de questions mantenido por la instancia.
   */
  @ApiProperty({ type: [QuestionDto] })
  questions!: QuestionDto[];
}

/** Resultado de emitir invitaciones para una reserva completada. */
export class InvitationsIssuedDto {
  /**
   * Valor de ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  ids!: string[];

  /**
   * Valor de already issued mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Invitaciones que ya existían para esa reserva y no se duplicaron',
  })
  alreadyIssued!: number;
}

/** Cuestionario pendiente o respondido, tal como lo ve el paciente. */
export class PatientInvitationDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ description: 'Título del cuestionario' })
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Consigna' })
  description?: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    enum: ['PENDING', 'ANSWERED', 'EXPIRED'],
    description: 'Estado de la invitación',
  })
  status!: 'PENDING' | 'ANSWERED' | 'EXPIRED';

  /**
   * Valor de issued at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  issuedAt!: Date;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  expiresAt!: Date;

  /**
   * Valor de answered at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  answeredAt?: Date;

  /**
   * Identificador asociado a appointment booking.
   */
  @ApiProperty({ format: 'uuid', description: 'Atención que la originó' })
  appointmentBookingId!: string;
}

/** El cuestionario a responder: la invitación más sus preguntas. */
export class PatientQuestionnaireDto extends PatientInvitationDto {
  /**
   * Valor de questions mantenido por la instancia.
   */
  @ApiProperty({ type: [QuestionDto] })
  questions!: QuestionDto[];
}

/** Una respuesta concreta a una pregunta, para la lectura del profesional. */
export class AnswerDto {
  /**
   * Identificador asociado a question.
   */
  @ApiProperty({ format: 'uuid' })
  questionId!: string;

  /**
   * Valor de question text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Enunciado, para no tener que reunirlo aparte' })
  questionText!: string;

  /**
   * Valor de answer type mantenido por la instancia.
   */
  @ApiProperty({ enum: ANSWER_TYPE_CODES })
  answerType!: AnswerTypeCode;

  /**
   * Valor de value text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  valueText?: string;

  /**
   * Valor de value number mantenido por la instancia.
   */
  @ApiPropertyOptional()
  valueNumber?: number;

  /**
   * Valor de value boolean mantenido por la instancia.
   */
  @ApiPropertyOptional()
  valueBoolean?: boolean;

  /**
   * Valor de value choices mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String] })
  valueChoices?: string[];
}

/**
 * Una respuesta completa, tal como la lee el profesional dueño.
 *
 * **Sin `patientProfileId` a propósito** (FT-29): la encuesta de satisfacción
 * es anónima para el profesional por diseño del negocio — puede leer lo que
 * respondió cada paciente, pero no quién lo respondió. Devolver acá el
 * identificador, aunque no sea el nombre, deshace esa anonimidad: alcanza con
 * cruzarlo contra `appointmentBookingId` para identificar al paciente.
 */
export class SurveyResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a invitation.
   */
  @ApiProperty({ format: 'uuid' })
  invitationId!: string;

  /**
   * Identificador asociado a appointment booking.
   */
  @ApiProperty({ format: 'uuid' })
  appointmentBookingId!: string;

  /**
   * Valor de submitted at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  submittedAt!: Date;

  /**
   * Valor de answers mantenido por la instancia.
   */
  @ApiProperty({ type: [AnswerDto] })
  answers!: AnswerDto[];
}
