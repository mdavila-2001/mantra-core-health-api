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
import type { InvitationCardContext } from '../repositories';
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
import {
  ANSWER_TYPE_CODE_BY_ID,
  isSystemOwnerType,
  SURVEYS,
  type QuestionSource,
} from '../surveys.concepts';
import { SurveysErrorReason } from '../surveys.error-reasons';
import { assertNotSystemTemplate } from '../surveys.system-guard';
import type {
  SurveyInvitations,
  SurveyQuestions,
  SurveyTemplates,
} from '../entities';
import type { AnswerTypeCode } from '../surveys.concepts';

/**
 * Una pregunta del cuestionario que ve el paciente, con quién la escribió y si
 * esta vez hay que contestarla.
 *
 * Una invitación se responde sobre la **unión** de la versión principal (la
 * base del sistema, cuando la hay) y la extensión del profesional: la
 * obligatoriedad de una pregunta de la extensión es siempre falsa, aunque una
 * versión anterior la guarde como obligatoria.
 */
interface QuestionnaireItem {
  /** La pregunta. */
  question: SurveyQuestions;
  /** Quién la escribió. */
  source: QuestionSource;
  /** Si hay que contestarla para poder enviar. */
  required: boolean;
}

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

    // Una sola consulta agregada trae título y contexto de la atención de todas
    // las tarjetas: la lista no hace una lectura por invitación.
    const context = await this.invitationsRepo.listCardContext(
      this.em,
      invitations.map((invitation) => invitation.id),
    );

    const now = new Date();
    const result: PatientInvitationDto[] = [];
    for (const invitation of invitations) {
      const card = context.get(invitation.id);
      if (!card) continue;
      result.push(this.toInvitationDto(invitation, card, now));
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
    const items = await this.loadQuestionnaire(
      this.em,
      invitation,
      isSystemOwnerType(template.ownerTypeConceptId)
        ? 'SYSTEM'
        : 'PRACTITIONER',
    );

    const card = (
      await this.invitationsRepo.listCardContext(this.em, [invitation.id])
    ).get(invitation.id);

    return {
      ...this.toInvitationDto(
        invitation,
        card ?? {
          invitationId: invitation.id,
          title: template.title,
          description: template.description ?? null,
          kind: 'CONSULTATION',
          serviceName: null,
          practitionerDisplayName: null,
          attendedAt: null,
        },
        new Date(),
      ),
      // Posiciones corridas sobre la unión: la base primero, el profesional después.
      questions: items.map((item, index) =>
        this.toQuestionDto(item, index + 1),
      ),
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

        const items = await this.loadQuestionnaire(
          tx,
          invitation,
          'PRACTITIONER',
        );
        const byId = new Map(items.map((item) => [item.question.id, item]));
        // Un texto en blanco en una pregunta opcional es «no contestó», no un
        // error: el comentario libre del final llega vacío cuando el paciente
        // no tiene nada que decir.
        const answers = this.withoutBlankOptionalText(dto.answers, byId);
        this.validateAnswers(answers, items, byId);

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

        for (const answer of answers) {
          const question = byId.get(answer.questionId)!.question;
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
            answers: answers.length,
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

    // Las invitaciones sueltas de la versión y las que la llevan detrás de la
    // base del sistema.
    const invitations = [
      ...(await this.invitationsRepo.listByVersions(this.em, [version.id])),
      ...(await this.invitationsRepo.listByExtensionVersions(this.em, [
        version.id,
      ])),
    ];
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

    // Sólo las respuestas a SUS preguntas. Cuando la invitación lleva la base
    // del sistema, esas respuestas no se leen una por una: el médico las ve
    // agregadas, sin paciente ni reserva. Y una respuesta en la que no contestó
    // ninguna pregunta suya no se lista: sólo diría que ese paciente respondió.
    return responses
      .map((response) => ({
        id: response.id,
        invitationId: response.surveyInvitationId,
        appointmentBookingId:
          invitationById.get(response.surveyInvitationId)
            ?.appointmentBookingId ?? '',
        submittedAt: response.submittedAt,
        answers: answers
          .filter(
            (a) =>
              a.surveyResponseId === response.id &&
              questionById.has(a.surveyQuestionId),
          )
          .map((a) => this.toAnswerDto(a, questionById.get(a.surveyQuestionId)))
          .sort((a, b) => a.questionText.localeCompare(b.questionText)),
      }))
      .filter((response) => response.answers.length > 0);
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
    if (template && template.tenantId === requireTenantId()) {
      // Las respuestas a la base del sistema se leen agregadas, no por plantilla.
      assertNotSystemTemplate(template, templateId);
    }
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
   * Las preguntas de una invitación: las de la versión principal y, detrás, las
   * de la extensión del profesional si la lleva. Las de la extensión nunca son
   * obligatorias.
   *
   * @param mainSource - Quién escribió la versión principal (la base del
   *   sistema, o el profesional en una invitación suelta). Si la invitación
   *   lleva extensión, la principal es siempre la base.
   */
  private async loadQuestionnaire(
    em: EntityManager,
    invitation: SurveyInvitations,
    mainSource: QuestionSource,
  ): Promise<QuestionnaireItem[]> {
    const main = await this.templatesRepo.listQuestions(
      em,
      invitation.surveyVersionId,
    );
    const hasExtension = Boolean(invitation.extensionSurveyVersionId);
    const items: QuestionnaireItem[] = main.map((question) => ({
      question,
      source: hasExtension ? 'SYSTEM' : mainSource,
      required: question.required,
    }));
    if (invitation.extensionSurveyVersionId) {
      const extension = await this.templatesRepo.listQuestions(
        em,
        invitation.extensionSurveyVersionId,
      );
      items.push(
        ...extension.map((question) => ({
          question,
          source: 'PRACTITIONER' as const,
          required: false,
        })),
      );
    }
    return items;
  }

  /**
   * Quita las respuestas de texto vacías o en blanco a preguntas NO obligatorias:
   * se tratan como ausentes (no se validan ni se guardan). En una obligatoria el
   * texto en blanco se deja pasar a la validación, que lo rechaza con 422.
   */
  private withoutBlankOptionalText(
    answers: AnswerInputDto[],
    byId: Map<string, QuestionnaireItem>,
  ): AnswerInputDto[] {
    return answers.filter((answer) => {
      const item = byId.get(answer.questionId);
      if (!item || item.required) return true;
      if (ANSWER_TYPE_CODE_BY_ID[item.question.answerTypeConceptId] !== 'TEXT')
        return true;
      return !(
        typeof answer.valueText === 'string' && answer.valueText.trim() === ''
      );
    });
  }

  /**
   * Comprueba que el envío sea contestable: obligatorias presentes, sin
   * preguntas ajenas, sin repetidas y con el valor del tipo correcto.
   */
  private validateAnswers(
    answers: AnswerInputDto[],
    items: QuestionnaireItem[],
    byId: Map<string, QuestionnaireItem>,
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

      const item = byId.get(answer.questionId);
      if (!item) {
        throw new PreconditionFailedException(
          'La respuesta no corresponde a una pregunta de este cuestionario',
          { questionId: answer.questionId },
        );
      }
      this.validateAnswerValue(answer, item.question);
    }

    const missing = items.filter((i) => i.required && !seen.has(i.question.id));
    if (missing.length > 0) {
      throw new PreconditionFailedException(
        'Faltan respuestas a preguntas obligatorias',
        { questionIds: missing.map((i) => i.question.id) },
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
    card: InvitationCardContext,
    now: Date,
  ): PatientInvitationDto {
    return {
      id: invitation.id,
      title: card.title,
      description: card.description ?? undefined,
      status: this.invitationStatus(invitation, now),
      issuedAt: invitation.issuedAt,
      expiresAt: invitation.expiresAt,
      kind: card.kind,
      serviceName: card.serviceName,
      practitionerDisplayName: card.practitionerDisplayName,
      attendedAt: card.attendedAt,
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

  /** Proyecta la pregunta del cuestionario al contrato HTTP del paciente. */
  private toQuestionDto(
    item: QuestionnaireItem,
    position: number,
  ): QuestionDto {
    const { question } = item;
    return {
      id: question.id,
      position,
      questionText: question.questionText,
      answerType: ANSWER_TYPE_CODE_BY_ID[question.answerTypeConceptId],
      required: item.required,
      source: item.source,
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
