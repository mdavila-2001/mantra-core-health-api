import { ForbiddenException, Injectable } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  InvitationsRepository,
  ResponsesRepository,
  TemplatesRepository,
} from '../repositories';
import {
  AnswerDto,
  AnswerInputDto,
  IdResponseDto,
  PatientInvitationDto,
  PatientQuestionnaireDto,
  QuestionDto,
  SubmitResponseDto,
  SurveyResponseDto,
} from '../dto';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { ANSWER_TYPE_CODE_BY_ID, SURVEYS } from '../surveys.concepts';
import { SurveysErrorReason } from '../surveys.error-reasons';
import type {
  SurveyInvitations,
  SurveyQuestions,
  SurveyTemplates,
} from '../entities';
import type { AnswerTypeCode } from '../surveys.concepts';

/**
 * El lado de las respuestas: el paciente contesta, el profesional dueño lee.
 *
 * **La privacidad es el requisito central de este servicio**, no un añadido.
 * ALOVIDA lo fija en dos frases —«solo podrán ser consultadas por el profesional
 * o la organización autorizada» y «no deberán mostrarse públicamente»— y la
 * decisión D-08 del proyecto la confirma. Acá eso se traduce en dos reglas que
 * no tienen excepción: un paciente solo alcanza sus propias invitaciones, y una
 * respuesta solo la lee el profesional dueño del instrumento. No hay ninguna
 * lectura sin uno de esos dos filtros.
 *
 * El perfil de paciente es global (no lleva `tenant_id`), así que el autoservicio
 * se acota además al tenant activo: un paciente con atenciones en dos
 * organizaciones ve, en el contexto de una, solo los cuestionarios de esa.
 */
@Injectable()
export class SurveysResponsesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param invitationsRepo - Acceso a invitaciones.
   * @param responsesRepo - Acceso a respuestas y sus valores.
   * @param templatesRepo - Acceso a plantillas, versiones y preguntas.
   * @param logger - Registro estructurado del módulo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly invitationsRepo: InvitationsRepository,
    private readonly responsesRepo: ResponsesRepository,
    private readonly templatesRepo: TemplatesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SurveysResponsesService.name);
  }

  /** Los cuestionarios del paciente de la sesión. */
  async listMyInvitations(
    actor: AuthenticatedUser,
  ): Promise<PatientInvitationDto[]> {
    const patientProfileId = this.requirePatientProfile(actor);
    const tenantId = requireTenantId();
    const invitations = await this.listInvitationsOf(
      patientProfileId,
      tenantId,
    );

    const now = new Date();
    const result: PatientInvitationDto[] = [];
    for (const invitation of invitations) {
      const template = await this.loadTemplateOfInvitation(invitation);
      if (!template) continue;
      result.push(this.toInvitationDto(invitation, template, now));
    }
    return result;
  }

  /** El cuestionario a responder, con sus preguntas. */
  async getMyQuestionnaire(
    invitationId: string,
    actor: AuthenticatedUser,
  ): Promise<PatientQuestionnaireDto> {
    const patientProfileId = this.requirePatientProfile(actor);
    // Primero la invitación acotada a paciente y tenant: nada de plantilla ni
    // preguntas se lee antes de saber que es del contexto activo.
    const invitation = await this.loadOwnInvitation(
      invitationId,
      patientProfileId,
      requireTenantId(),
    );
    const template = await this.loadTemplateOfInvitation(invitation);
    if (!template) {
      throw new ResourceNotFoundException('Cuestionario no encontrado', {
        invitationId,
      });
    }
    const questions = await this.templatesRepo.listQuestions(
      this.em,
      invitation.surveyVersionId,
    );

    return {
      ...this.toInvitationDto(invitation, template, new Date()),
      questions: questions.map((q) => this.toQuestionDto(q)),
    };
  }

  /** Registra la respuesta del paciente. Envío único y atómico. */
  async submitResponse(
    invitationId: string,
    dto: SubmitResponseDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const patientProfileId = this.requirePatientProfile(actor);
    const tenantId = requireTenantId();

    const outcome = await this.em
      .transactional(async (tx) => {
        const invitation = await this.loadOwnInvitation(
          invitationId,
          patientProfileId,
          tenantId,
          tx,
          true,
        );

        if (invitation.statusConceptId === SURVEYS.INVITATION_ANSWERED) {
          throw new ConflictException(
            'Este cuestionario ya fue respondido',
            { invitationId },
            SurveysErrorReason.RESPONSE_ALREADY_SUBMITTED,
          );
        }
        const now = new Date();
        if (now > invitation.expiresAt) {
          // Se persiste el vencimiento en vez de solo rechazarlo: si no, la
          // invitación seguiría figurando como pendiente en la lista del
          // paciente para siempre. Por eso NO se lanza acá: `transactional`
          // revierte ante cualquier excepción y el vencimiento se perdería. La
          // transacción confirma y el rechazo sale después.
          invitation.statusConceptId = SURVEYS.INVITATION_EXPIRED;
          touch(invitation, actor.id);
          await tx.flush();
          return { expiredAt: invitation.expiresAt };
        }

        const questions = await this.templatesRepo.listQuestions(
          tx,
          invitation.surveyVersionId,
        );
        const byId = new Map(questions.map((q) => [q.id, q]));
        this.validateAnswers(dto.answers, questions, byId);

        const response = this.responsesRepo.createResponse(tx, {
          surveyInvitationId: invitation.id,
          surveyVersionId: invitation.surveyVersionId,
          // El tenant de la respuesta es el de la invitación ya comprobada, no
          // el que el cliente pueda sugerir.
          tenantId: invitation.tenantId,
          patientProfileId,
          submittedAt: now,
          actorUserId: actor.id,
        });
        await tx.flush();

        for (const answer of dto.answers) {
          const question = byId.get(answer.questionId)!;
          this.responsesRepo.createAnswer(tx, {
            surveyResponseId: response.id,
            surveyQuestionId: question.id,
            ...this.normalizeAnswerValue(answer, question),
            actorUserId: actor.id,
          });
        }

        invitation.statusConceptId = SURVEYS.INVITATION_ANSWERED;
        invitation.answeredAt = now;
        touch(invitation, actor.id);

        await tx.flush();

        this.logger.info(
          {
            operation: 'surveys.response.submit',
            invitationId,
            responseId: response.id,
            answers: dto.answers.length,
          },
          'Survey response submitted',
        );
        return { id: response.id };
      })
      .catch((error: unknown) => {
        // Si el modelo respalda la unicidad (una respuesta por invitación, una
        // por pregunta), la violación es un duplicado, no un error del servidor.
        if (error instanceof UniqueConstraintViolationException) {
          throw new ConflictException(
            'La respuesta ya fue registrada para este cuestionario',
            { invitationId },
            SurveysErrorReason.ANSWER_DUPLICATE,
          );
        }
        throw error;
      });

    if ('expiredAt' in outcome) {
      throw new PreconditionFailedException(
        'El plazo para responder este cuestionario venció',
        { invitationId, expiresAt: outcome.expiredAt },
      );
    }
    return outcome;
  }

  /** Las respuestas recibidas por una plantilla, para su profesional dueño. */
  async listTemplateResponses(
    templateId: string,
    actor: AuthenticatedUser,
  ): Promise<SurveyResponseDto[]> {
    const template = await this.loadOwnedTemplate(templateId, actor);

    const version = await this.templatesRepo.findLatestVersion(
      this.em,
      template.id,
    );
    if (!version) return [];

    const invitations = await this.invitationsRepo.listByVersions(this.em, [
      version.id,
    ]);
    if (invitations.length === 0) return [];

    const invitationById = new Map(invitations.map((i) => [i.id, i]));
    const responses = await this.responsesRepo.listByInvitations(
      this.em,
      invitations.map((i) => i.id),
    );
    if (responses.length === 0) return [];

    const answers = await this.responsesRepo.listAnswers(
      this.em,
      responses.map((r) => r.id),
    );
    const questions = await this.templatesRepo.listQuestions(
      this.em,
      version.id,
    );
    const questionById = new Map(questions.map((q) => [q.id, q]));

    return responses.map((response) => ({
      id: response.id,
      invitationId: response.surveyInvitationId,
      appointmentBookingId:
        invitationById.get(response.surveyInvitationId)?.appointmentBookingId ??
        '',
      submittedAt: response.submittedAt,
      answers: answers
        .filter((a) => a.surveyResponseId === response.id)
        .map((a) => this.toAnswerDto(a, questionById.get(a.surveyQuestionId)))
        .sort((a, b) => a.questionText.localeCompare(b.questionText)),
    }));
  }

  /**
   * Exige que la sesión tenga perfil de paciente.
   *
   * Es lo que impide que un profesional o un administrador entren por la puerta
   * del autoservicio: sin perfil de paciente no hay invitaciones que mirar, y
   * el identificador no se acepta por parámetro justamente para que nadie pida
   * las de otro.
   */
  private requirePatientProfile(actor: AuthenticatedUser): string {
    // 403 y no 422: no es una precondición que el cliente pueda cumplir
    // mandando otra cosa — es que esta sesión no es la de un paciente. Mismo
    // criterio que `community-reviews.service.ts` para calificar.
    if (!actor.patientProfileId) {
      throw new ForbiddenException(
        'Solo un paciente puede ver sus cuestionarios',
      );
    }
    return actor.patientProfileId;
  }

  /**
   * Las invitaciones del paciente.
   *
   * Tuvo un `catch` de `TableNotFoundException` que respondía «no hay
   * cuestionarios» cuando el esquema no existía: el módulo había nacido con las
   * entidades y sin DDL, y esta lectura reventaba con 500 en la primera
   * pantalla que abría un paciente recién registrado (F-14). Ese parche se
   * retira acá porque **el esquema ya está en el modelo**: el módulo 65 se
   * promovió por el camino canónico y sus 7 tablas se materializan en toda base
   * que el pipeline construya.
   *
   * Se retira y no se deja «por las dudas» a propósito: mientras estuviera, una
   * tabla que falte —un patch sin aplicar, un despliegue a medias— seguiría
   * pareciendo un paciente sin cuestionarios en vez de lo que es, y ese es
   * justamente el error que costó descubrir la primera vez.
   *
   * @param patientProfileId - Paciente de la sesión.
   * @param tenantId - Tenant activo de la petición.
   * @returns Sus invitaciones en ese tenant.
   */
  private async listInvitationsOf(
    patientProfileId: string,
    tenantId: string,
  ): Promise<SurveyInvitations[]> {
    return this.invitationsRepo.listByPatient(
      this.em,
      patientProfileId,
      tenantId,
    );
  }

  /**
   * Carga la invitación comprobando paciente **y tenant activo**.
   *
   * Una invitación inexistente, de otra persona o de otro tenant responde igual:
   * 404, mismo mensaje y mismo `reason`, sin `details`. Un 403, o un detalle que
   * nombre el UUID, le confirmaría a alguien que la invitación existe y que esa
   * persona tuvo una atención.
   *
   * @param lock - Bloquea la fila hasta el fin de la transacción (envío).
   */
  private async loadOwnInvitation(
    invitationId: string,
    patientProfileId: string,
    tenantId: string,
    em: EntityManager = this.em,
    lock = false,
  ): Promise<SurveyInvitations> {
    const found = lock
      ? await this.invitationsRepo.findByIdForUpdate(em, invitationId)
      : await this.invitationsRepo.findById(em, invitationId);
    const own = found?.patientProfileId === patientProfileId ? found : null;
    return assertResourceInTenant(own, own?.tenantId, tenantId, {
      message: 'Cuestionario no encontrado',
      reason: SurveysErrorReason.INVITATION_OUT_OF_SCOPE,
    });
  }

  /** Carga la plantilla comprobando organización y profesional dueño. */
  private async loadOwnedTemplate(
    templateId: string,
    actor: AuthenticatedUser,
  ): Promise<SurveyTemplates> {
    const template = await this.templatesRepo.findTemplateById(
      this.em,
      templateId,
    );
    if (
      !template ||
      template.tenantId !== requireTenantId() ||
      template.ownerPractitionerId !== actor.practitionerProfileId
    ) {
      throw new ResourceNotFoundException('Plantilla no encontrada', {
        templateId,
      });
    }
    return template;
  }

  /** La plantilla detrás de una invitación, vía su versión. */
  private async loadTemplateOfInvitation(
    invitation: SurveyInvitations,
  ): Promise<SurveyTemplates | null> {
    const version = await this.templatesRepo.findVersionById(
      this.em,
      invitation.surveyVersionId,
    );
    if (!version) return null;
    return this.templatesRepo.findTemplateById(
      this.em,
      version.surveyTemplateId,
    );
  }

  /**
   * Comprueba que el envío sea contestable: obligatorias presentes, sin
   * preguntas ajenas, sin repetidas y con el valor del tipo correcto.
   */
  private validateAnswers(
    answers: AnswerInputDto[],
    questions: SurveyQuestions[],
    byId: Map<string, SurveyQuestions>,
  ): void {
    const seen = new Set<string>();
    for (const answer of answers) {
      if (seen.has(answer.questionId)) {
        throw new PreconditionFailedException(
          'Hay más de una respuesta para la misma pregunta',
          { questionId: answer.questionId },
        );
      }
      seen.add(answer.questionId);

      const question = byId.get(answer.questionId);
      if (!question) {
        throw new PreconditionFailedException(
          'La respuesta no corresponde a una pregunta de este cuestionario',
          { questionId: answer.questionId },
        );
      }
      this.validateAnswerValue(answer, question);
    }

    const missing = questions.filter((q) => q.required && !seen.has(q.id));
    if (missing.length > 0) {
      throw new PreconditionFailedException(
        'Faltan respuestas a preguntas obligatorias',
        { questionIds: missing.map((q) => q.id) },
      );
    }
  }

  /** Valida el valor de una respuesta contra el tipo de su pregunta. */
  private validateAnswerValue(
    answer: AnswerInputDto,
    question: SurveyQuestions,
  ): void {
    const type = ANSWER_TYPE_CODE_BY_ID[question.answerTypeConceptId];
    const detail = { questionId: question.id, answerType: type };

    switch (type) {
      case 'TEXT': {
        if (
          typeof answer.valueText !== 'string' ||
          answer.valueText.trim() === ''
        )
          throw new PreconditionFailedException(
            'Esta pregunta espera una respuesta de texto',
            detail,
          );
        break;
      }
      case 'SCALE': {
        if (typeof answer.valueNumber !== 'number')
          throw new PreconditionFailedException(
            'Esta pregunta espera un valor numérico',
            detail,
          );
        const min = question.scaleMin ?? 1;
        const max = question.scaleMax ?? 5;
        if (answer.valueNumber < min || answer.valueNumber > max)
          throw new PreconditionFailedException(
            'El valor está fuera de la escala de la pregunta',
            { ...detail, scaleMin: min, scaleMax: max },
          );
        break;
      }
      case 'BOOLEAN': {
        if (typeof answer.valueBoolean !== 'boolean')
          throw new PreconditionFailedException(
            'Esta pregunta espera sí o no',
            detail,
          );
        break;
      }
      case 'SINGLE_CHOICE':
      case 'MULTIPLE_CHOICE': {
        const chosen = answer.valueChoices ?? [];
        if (chosen.length === 0)
          throw new PreconditionFailedException(
            'Esta pregunta espera al menos una opción',
            detail,
          );
        if (type === 'SINGLE_CHOICE' && chosen.length > 1)
          throw new PreconditionFailedException(
            'Esta pregunta admite una sola opción',
            detail,
          );
        const allowed = new Set(question.options ?? []);
        const invalid = chosen.filter((c) => !allowed.has(c));
        if (invalid.length > 0)
          throw new PreconditionFailedException(
            'Se eligieron opciones que la pregunta no ofrece',
            { ...detail, invalid },
          );
        if (new Set(chosen).size !== chosen.length)
          throw new PreconditionFailedException(
            'Hay opciones repetidas en la respuesta',
            detail,
          );
        break;
      }
      default:
        throw new PreconditionFailedException(
          'Tipo de pregunta desconocido',
          detail,
        );
    }
  }

  /**
   * Deja poblada **solo** la columna `value_*` que corresponde al tipo.
   *
   * Es el mismo criterio `value[x]` de `forms.field_values`: guardar los otros
   * campos aunque vengan en el cuerpo dejaría filas con dos valores y ninguna
   * forma de saber cuál es el bueno.
   */
  private normalizeAnswerValue(
    answer: AnswerInputDto,
    question: SurveyQuestions,
  ): {
    /**
     * Valor de value text mantenido por la instancia.
     */
    valueText?: string;
    /**
     * Valor de value number mantenido por la instancia.
     */
    valueNumber?: number;
    /**
     * Valor de value boolean mantenido por la instancia.
     */
    valueBoolean?: boolean;
    /**
     * Valor de value choices mantenido por la instancia.
     */
    valueChoices?: string[];
  } {
    const type = ANSWER_TYPE_CODE_BY_ID[question.answerTypeConceptId];
    switch (type) {
      case 'TEXT':
        return { valueText: answer.valueText };
      case 'SCALE':
        return { valueNumber: answer.valueNumber };
      case 'BOOLEAN':
        return { valueBoolean: answer.valueBoolean };
      default:
        return { valueChoices: answer.valueChoices };
    }
  }

  /** Proyecta la invitación al contrato del paciente. */
  private toInvitationDto(
    invitation: SurveyInvitations,
    template: SurveyTemplates,
    now: Date,
  ): PatientInvitationDto {
    return {
      id: invitation.id,
      title: template.title,
      description: template.description,
      status: this.invitationStatus(invitation, now),
      issuedAt: invitation.issuedAt,
      expiresAt: invitation.expiresAt,
      answeredAt: invitation.answeredAt,
      appointmentBookingId: invitation.appointmentBookingId ?? '',
    };
  }

  /**
   * Estado efectivo de la invitación.
   *
   * Una pendiente cuyo plazo ya pasó se reporta como vencida aunque la fila
   * todavía diga pendiente: el vencimiento se persiste recién cuando alguien
   * intenta responder, y hasta entonces la lista mentiría.
   */
  private invitationStatus(
    invitation: SurveyInvitations,
    now: Date,
  ): 'PENDING' | 'ANSWERED' | 'EXPIRED' {
    if (invitation.statusConceptId === SURVEYS.INVITATION_ANSWERED)
      return 'ANSWERED';
    if (invitation.statusConceptId === SURVEYS.INVITATION_EXPIRED)
      return 'EXPIRED';
    return now > invitation.expiresAt ? 'EXPIRED' : 'PENDING';
  }

  /** Proyecta la entidad de pregunta al contrato HTTP. */
  private toQuestionDto(question: SurveyQuestions): QuestionDto {
    return {
      id: question.id,
      position: question.position,
      questionText: question.questionText,
      answerType: ANSWER_TYPE_CODE_BY_ID[question.answerTypeConceptId],
      required: question.required,
      options: question.options,
      scaleMin: question.scaleMin,
      scaleMax: question.scaleMax,
    };
  }

  /** Proyecta una respuesta con el enunciado de su pregunta al lado. */
  private toAnswerDto(
    answer: {
      /**
       * Identificador asociado a survey question.
       */
      surveyQuestionId: string;
      /**
       * Valor de value text mantenido por la instancia.
       */
      valueText?: string;
      /**
       * Valor de value number mantenido por la instancia.
       */
      valueNumber?: number;
      /**
       * Valor de value boolean mantenido por la instancia.
       */
      valueBoolean?: boolean;
      /**
       * Valor de value choices mantenido por la instancia.
       */
      valueChoices?: string[];
    },
    question: SurveyQuestions | undefined,
  ): AnswerDto {
    const answerType: AnswerTypeCode = question
      ? ANSWER_TYPE_CODE_BY_ID[question.answerTypeConceptId]
      : 'TEXT';
    return {
      questionId: answer.surveyQuestionId,
      questionText: question?.questionText ?? '',
      answerType,
      valueText: answer.valueText,
      valueNumber: answer.valueNumber,
      valueBoolean: answer.valueBoolean,
      valueChoices: answer.valueChoices,
    };
  }
}
