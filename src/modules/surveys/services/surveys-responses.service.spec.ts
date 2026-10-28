import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { TableNotFoundException } from '@mikro-orm/core';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { SurveysResponsesService } from './surveys-responses.service';
import { SurveysErrorReason } from '../surveys.error-reasons';
import { SURVEYS, ANSWER_TYPE_BY_CODE } from '../surveys.concepts';
import { DomainException } from '../../../common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';

const TENANT = 'ten-1';
const PATIENT = 'pat-1';
const OTHER_PATIENT = 'pat-2';
const OWNER = 'hp-1';

const patientActor = {
  id: 'usr-pac',
  roles: ['PATIENT'],
  patientProfileId: PATIENT,
} as any;

const practitionerActor = {
  id: 'usr-doc',
  roles: ['PRACTITIONER'],
  practitionerProfileId: OWNER,
} as any;

/** Dentro del plazo. */
const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
/** Fuera del plazo. */
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000);

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const invitationsRepo: Record<string, any> = {
    findById: mockFn(),
    listByPatient: mockFn().mockResolvedValue([]),
    listByBooking: mockFn().mockResolvedValue([]),
    listByVersions: mockFn().mockResolvedValue([]),
    listByExtensionVersions: mockFn().mockResolvedValue([]),
    // Contexto de tarjeta por defecto: una consulta sin más datos. Cada prueba
    // que lo necesite lo reemplaza.
    listCardContext: mockFn((_em: unknown, ids: string[]) =>
      Promise.resolve(
        new Map(
          ids.map((id) => [
            id,
            {
              invitationId: id,
              title: 'Cómo fue su consulta',
              description: null,
              kind: 'CONSULTATION',
              serviceName: null,
              practitionerDisplayName: null,
              attendedAt: null,
            },
          ]),
        ),
      ),
    ),
    create: mockFn(),
  };
  // El envío bloquea la fila; en el doble el bloqueo lee lo que lea `findById`.
  invitationsRepo.findByIdForUpdate = mockFn((em: unknown, id: string) =>
    invitationsRepo.findById(em, id),
  );
  const responsesRepo = {
    findByInvitation: mockFn().mockResolvedValue(null),
    listByInvitations: mockFn().mockResolvedValue([]),
    listAnswers: mockFn().mockResolvedValue([]),
    createResponse: mockFn().mockReturnValue({ id: 'res-1' }),
    createAnswer: mockFn(),
  };
  const templatesRepo = {
    findTemplateById: mockFn(),
    findVersionById: mockFn(),
    findLatestVersion: mockFn(),
    listQuestions: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SurveysResponsesService(
    em as any,
    invitationsRepo as any,
    responsesRepo as any,
    templatesRepo as any,
    logger as any,
  );
  // Las lecturas del paciente exigen el tenant activo: estas pruebas actúan
  // dentro del de TENANT. `raw` permite probar otro contexto.
  const raw = {
    listMyInvitations: service.listMyInvitations.bind(service),
    getMyQuestionnaire: service.getMyQuestionnaire.bind(service),
  };
  service.listMyInvitations = ((
    ...args: Parameters<typeof raw.listMyInvitations>
  ) =>
    runWithTenant(TENANT, () =>
      raw.listMyInvitations(...args),
    )) as typeof service.listMyInvitations;
  service.getMyQuestionnaire = ((
    ...args: Parameters<typeof raw.getMyQuestionnaire>
  ) =>
    runWithTenant(TENANT, () =>
      raw.getMyQuestionnaire(...args),
    )) as typeof service.getMyQuestionnaire;
  return {
    service,
    raw,
    em,
    tx,
    invitationsRepo,
    responsesRepo,
    templatesRepo,
    logger,
  };
}

/** Invitación pendiente del paciente de la prueba. */
function pendingInvitation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    surveyVersionId: 'ver-1',
    tenantId: TENANT,
    patientProfileId: PATIENT,
    appointmentBookingId: 'bkg-1',
    statusConceptId: SURVEYS.INVITATION_PENDING,
    issuedAt: new Date(),
    expiresAt: FUTURE,
    answeredAt: undefined as Date | undefined,
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Pregunta de texto obligatoria. */
function textQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'q-1',
    surveyVersionId: 'ver-1',
    position: 1,
    questionText: '¿Cómo fue la atención?',
    answerTypeConceptId: ANSWER_TYPE_BY_CODE.TEXT,
    required: true,
    ...overrides,
  };
}

/** Ejecuta dentro del contexto de tenant que exigen las escrituras. */
function withTenant<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(TENANT, fn);
}

describe('SurveysResponsesService', () => {
  describe('privacidad de las invitaciones', () => {
    it('esconde con 404 la invitación de otro paciente', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(
        pendingInvitation({ patientProfileId: OTHER_PATIENT }),
      );

      await expect(
        d.service.getMyQuestionnaire('inv-1', patientActor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza con 403 a una sesión sin perfil de paciente', async () => {
      const d = build();
      await expect(
        d.service.listMyInvitations(practitionerActor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.invitationsRepo.listByPatient).not.toHaveBeenCalled();
    });

    it('no deja que otro paciente responda la invitación', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(
        pendingInvitation({ patientProfileId: OTHER_PATIENT }),
      );

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            { answers: [{ questionId: 'q-1', valueText: 'Bien' }] },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('listMyInvitations', () => {
    it('devuelve las invitaciones del paciente con el título de su encuesta', async () => {
      const d = build();
      d.invitationsRepo.listByPatient.mockResolvedValue([pendingInvitation()]);
      d.templatesRepo.findVersionById.mockResolvedValue({
        id: 'ver-1',
        surveyTemplateId: 'tpl-1',
      });
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        title: 'Cómo fue su consulta',
        description: 'Tres preguntas',
      });

      const result = await d.service.listMyInvitations(patientActor);

      expect(d.invitationsRepo.listByPatient).toHaveBeenCalledWith(
        expect.anything(),
        PATIENT,
        TENANT,
      );
      expect(result).toEqual([
        expect.objectContaining({
          id: 'inv-1',
          title: 'Cómo fue su consulta',
          status: 'PENDING',
        }),
      ]);
    });

    it('distingue consulta de servicio y trae profesional y fecha de la atención', async () => {
      const d = build();
      d.invitationsRepo.listByPatient.mockResolvedValue([
        pendingInvitation({ id: 'inv-c' }),
        pendingInvitation({ id: 'inv-s' }),
      ]);
      d.invitationsRepo.listCardContext.mockResolvedValue(
        new Map([
          [
            'inv-c',
            {
              invitationId: 'inv-c',
              title: 'Cómo fue su consulta',
              description: null,
              kind: 'CONSULTATION',
              serviceName: null,
              practitionerDisplayName: 'Dra. Ana Pérez',
              attendedAt: '2026-10-01T14:00:00.000Z',
            },
          ],
          [
            'inv-s',
            {
              invitationId: 'inv-s',
              title: 'Cómo fue su servicio',
              description: 'Una pregunta',
              kind: 'SERVICE',
              serviceName: 'Ecografía abdominal',
              practitionerDisplayName: 'Dr. Luis Gómez',
              attendedAt: '2026-10-02T09:30:00.000Z',
            },
          ],
        ]),
      );

      const result = await d.service.listMyInvitations(patientActor);

      expect(result).toEqual([
        expect.objectContaining({
          id: 'inv-c',
          kind: 'CONSULTATION',
          serviceName: null,
          practitionerDisplayName: 'Dra. Ana Pérez',
          attendedAt: '2026-10-01T14:00:00.000Z',
        }),
        expect.objectContaining({
          id: 'inv-s',
          kind: 'SERVICE',
          serviceName: 'Ecografía abdominal',
          description: 'Una pregunta',
        }),
      ]);
    });

    it('sin N+1: una sola lectura de contexto para toda la lista, sin leer plantillas una por una', async () => {
      const d = build();
      d.invitationsRepo.listByPatient.mockResolvedValue(
        ['a', 'b', 'c', 'd'].map((id) => pendingInvitation({ id })),
      );

      const result = await d.service.listMyInvitations(patientActor);

      expect(result).toHaveLength(4);
      expect(d.invitationsRepo.listCardContext).toHaveBeenCalledTimes(1);
      expect(d.invitationsRepo.listCardContext).toHaveBeenCalledWith(
        expect.anything(),
        ['a', 'b', 'c', 'd'],
      );
      expect(d.templatesRepo.findVersionById).not.toHaveBeenCalled();
      expect(d.templatesRepo.findTemplateById).not.toHaveBeenCalled();
    });

    it('una invitación cuya plantilla ya no existe no aparece en la lista', async () => {
      const d = build();
      d.invitationsRepo.listByPatient.mockResolvedValue([
        pendingInvitation({ id: 'inv-ok' }),
        pendingInvitation({ id: 'inv-huerfana' }),
      ]);
      d.invitationsRepo.listCardContext.mockResolvedValue(
        new Map([
          [
            'inv-ok',
            {
              invitationId: 'inv-ok',
              title: 'T',
              description: null,
              kind: 'CONSULTATION',
              serviceName: null,
              practitionerDisplayName: null,
              attendedAt: null,
            },
          ],
        ]),
      );

      const result = await d.service.listMyInvitations(patientActor);

      expect(result.map((i) => i.id)).toEqual(['inv-ok']);
    });

    it('un paciente sin invitaciones recibe una lista vacía, no un error', async () => {
      const d = build();

      await expect(d.service.listMyInvitations(patientActor)).resolves.toEqual(
        [],
      );
      expect(d.logger.warn).not.toHaveBeenCalled();
    });

    // Antes esto respondía `[]` con un aviso: el módulo había nacido sin DDL y
    // la primera pantalla del paciente reventaba con 500 (F-14). Con el
    // esquema ya promovido al modelo (módulo 65), una tabla ausente vuelve a
    // ser lo que es —un despliegue roto, un patch sin aplicar— y no un paciente
    // sin cuestionarios. Este test fija esa vuelta atrás para que el parche no
    // regrese silenciosamente.
    it('si la tabla no existe el error sube: es un despliegue roto, no una lista vacía', async () => {
      const d = build();
      d.invitationsRepo.listByPatient.mockRejectedValue(
        new TableNotFoundException(
          new Error('relation "surveys.survey_invitations" does not exist'),
        ),
      );

      await expect(d.service.listMyInvitations(patientActor)).rejects.toThrow(
        TableNotFoundException,
      );
    });

    it('cualquier otro fallo de la base sigue subiendo', async () => {
      const d = build();
      d.invitationsRepo.listByPatient.mockRejectedValue(
        new Error('connection refused'),
      );

      await expect(d.service.listMyInvitations(patientActor)).rejects.toThrow(
        'connection refused',
      );
    });
  });

  describe('submitResponse', () => {
    it('registra la respuesta y marca la invitación como respondida', async () => {
      const d = build();
      const invitation = pendingInvitation();
      d.invitationsRepo.findById.mockResolvedValue(invitation);
      d.templatesRepo.listQuestions.mockResolvedValue([textQuestion()]);

      const res = await withTenant(() =>
        d.service.submitResponse(
          'inv-1',
          { answers: [{ questionId: 'q-1', valueText: 'Muy buena' }] },
          patientActor,
        ),
      );

      expect(res).toEqual({ id: 'res-1' });
      expect(invitation.statusConceptId).toBe(SURVEYS.INVITATION_ANSWERED);
      expect(invitation.answeredAt).toBeInstanceOf(Date);
      expect(d.responsesRepo.createAnswer).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ valueText: 'Muy buena' }),
      );
    });

    it('no admite un segundo envío', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(
        pendingInvitation({ statusConceptId: SURVEYS.INVITATION_ANSWERED }),
      );

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            { answers: [{ questionId: 'q-1', valueText: 'x' }] },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza fuera de plazo y deja la invitación vencida en una transacción que SÍ confirma', async () => {
      const d = build();
      const invitation = pendingInvitation({ expiresAt: PAST });
      d.invitationsRepo.findById.mockResolvedValue(invitation);
      // `em.transactional` revierte ante cualquier excepción del callback: sólo
      // cuenta como guardado el estado que había cuando la transacción confirmó.
      const committedStatuses: string[] = [];
      d.em.transactional.mockImplementation(async (cb: any) => {
        const result = await cb(d.tx);
        committedStatuses.push(invitation.statusConceptId);
        return result;
      });

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            { answers: [{ questionId: 'q-1', valueText: 'x' }] },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(committedStatuses).toEqual([SURVEYS.INVITATION_EXPIRED]);
      expect(d.responsesRepo.createResponse).not.toHaveBeenCalled();
    });

    it('exige las preguntas obligatorias', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
      d.templatesRepo.listQuestions.mockResolvedValue([
        textQuestion(),
        textQuestion({ id: 'q-2', required: true }),
      ]);

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            { answers: [{ questionId: 'q-1', valueText: 'Bien' }] },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza una respuesta a una pregunta ajena al cuestionario', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
      d.templatesRepo.listQuestions.mockResolvedValue([textQuestion()]);

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            {
              answers: [
                { questionId: 'q-1', valueText: 'Bien' },
                { questionId: 'q-ajena', valueText: 'x' },
              ],
            },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza dos respuestas a la misma pregunta', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
      d.templatesRepo.listQuestions.mockResolvedValue([textQuestion()]);

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            {
              answers: [
                { questionId: 'q-1', valueText: 'Bien' },
                { questionId: 'q-1', valueText: 'Mal' },
              ],
            },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza un valor fuera de la escala', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
      d.templatesRepo.listQuestions.mockResolvedValue([
        textQuestion({
          answerTypeConceptId: ANSWER_TYPE_BY_CODE.SCALE,
          scaleMin: 1,
          scaleMax: 5,
        }),
      ]);

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            { answers: [{ questionId: 'q-1', valueNumber: 9 }] },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza una opción que la pregunta no ofrece', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
      d.templatesRepo.listQuestions.mockResolvedValue([
        textQuestion({
          answerTypeConceptId: ANSWER_TYPE_BY_CODE.SINGLE_CHOICE,
          options: ['Sí', 'No'],
        }),
      ]);

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            { answers: [{ questionId: 'q-1', valueChoices: ['Quizá'] }] },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza dos opciones en una pregunta de elección simple', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
      d.templatesRepo.listQuestions.mockResolvedValue([
        textQuestion({
          answerTypeConceptId: ANSWER_TYPE_BY_CODE.SINGLE_CHOICE,
          options: ['Sí', 'No'],
        }),
      ]);

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            { answers: [{ questionId: 'q-1', valueChoices: ['Sí', 'No'] }] },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('guarda solo la columna del tipo de la pregunta', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
      d.templatesRepo.listQuestions.mockResolvedValue([
        textQuestion({
          answerTypeConceptId: ANSWER_TYPE_BY_CODE.BOOLEAN,
          required: true,
        }),
      ]);

      await withTenant(() =>
        d.service.submitResponse(
          'inv-1',
          // El texto viaja en el cuerpo y no debe persistirse: la pregunta es
          // de sí/no.
          {
            answers: [
              { questionId: 'q-1', valueBoolean: true, valueText: 'colado' },
            ],
          },
          patientActor,
        ),
      );

      const [, data] = d.responsesRepo.createAnswer.mock.calls[0];
      expect(data.valueBoolean).toBe(true);
      expect(data.valueText).toBeUndefined();
    });
  });

  describe('listTemplateResponses', () => {
    it('esconde con 404 la plantilla de otro profesional', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        tenantId: TENANT,
        ownerPractitionerId: 'hp-otro',
      });

      await expect(
        withTenant(() =>
          d.service.listTemplateResponses('tpl-1', practitionerActor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('devuelve las respuestas de la plantilla propia', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        tenantId: TENANT,
        ownerPractitionerId: OWNER,
      });
      d.templatesRepo.findLatestVersion.mockResolvedValue({ id: 'ver-1' });
      d.invitationsRepo.listByVersions.mockResolvedValue([
        pendingInvitation({ statusConceptId: SURVEYS.INVITATION_ANSWERED }),
      ]);
      d.responsesRepo.listByInvitations.mockResolvedValue([
        {
          id: 'res-1',
          surveyInvitationId: 'inv-1',
          patientProfileId: PATIENT,
          submittedAt: new Date('2026-10-14T17:42:31.250Z'),
        },
      ]);
      d.responsesRepo.listAnswers.mockResolvedValue([
        {
          surveyResponseId: 'res-1',
          surveyQuestionId: 'q-1',
          valueText: 'Bien',
        },
      ]);
      d.templatesRepo.listQuestions.mockResolvedValue([textQuestion()]);

      const res = await withTenant(() =>
        d.service.listTemplateResponses('tpl-1', practitionerActor),
      );

      expect(res).toHaveLength(1);
      expect(res[0].submittedAt.toISOString()).toBe('2026-10-14T00:00:00.000Z');
      // Anónima para el profesional: la reserva no cruza al DTO (se cruzaría
      // con su agenda para saber quién es) y el envío sale por día.
      expect(res[0]).not.toHaveProperty('appointmentBookingId');
      expect(res[0].answers[0]).toEqual(
        expect.objectContaining({
          questionText: '¿Cómo fue la atención?',
          answerType: 'TEXT',
          valueText: 'Bien',
        }),
      );
      // FT-29: la encuesta de satisfacción es anónima para el profesional a
      // propósito — de quién es la respuesta no debe cruzar hacia el DTO,
      // aunque la fila de la base sí lo guarde para trazabilidad interna.
      expect(res[0]).not.toHaveProperty('patientProfileId');
    });
  });

  describe('alcance de tenant del autoservicio (SURV-01)', () => {
    const OTHER_TENANT = 'ten-2';

    /** Falla esperada: devuelve la excepción o lanza si no hubo. */
    async function failure(promise: Promise<unknown>) {
      try {
        await promise;
      } catch (error) {
        return error as ResourceNotFoundException;
      }
      throw new Error('debía rechazar');
    }

    it('Límite: el mismo paciente con invitaciones en dos tenants ve sólo las del tenant activo', async () => {
      const d = build();
      const all = [
        pendingInvitation({ id: 'inv-a', tenantId: TENANT }),
        pendingInvitation({ id: 'inv-b', tenantId: OTHER_TENANT }),
      ];
      d.invitationsRepo.listByPatient.mockImplementation(
        (_em: unknown, _patient: string, tenantId: string) =>
          Promise.resolve(all.filter((i) => i.tenantId === tenantId)),
      );
      d.templatesRepo.findVersionById.mockResolvedValue({
        id: 'ver-1',
        surveyTemplateId: 'tpl-1',
      });
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        title: 'Cómo fue su consulta',
      });

      const inA = await d.service.listMyInvitations(patientActor);
      const inB = await runWithTenant(OTHER_TENANT, () =>
        d.raw.listMyInvitations(patientActor),
      );

      expect(inA.map((i) => i.id)).toEqual(['inv-a']);
      expect(inB.map((i) => i.id)).toEqual(['inv-b']);
    });

    it('Error: abrir la invitación propia emitida por otro tenant responde 404 sin leer plantilla ni preguntas', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(
        pendingInvitation({ tenantId: OTHER_TENANT }),
      );

      const error = await failure(
        d.service.getMyQuestionnaire('inv-1', patientActor),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getStatus()).toBe(404);
      expect(error.details).toBeUndefined();
      expect(d.templatesRepo.findVersionById).not.toHaveBeenCalled();
      expect(d.templatesRepo.findTemplateById).not.toHaveBeenCalled();
      expect(d.templatesRepo.listQuestions).not.toHaveBeenCalled();
    });

    it('Falla catalogada: enviar con otro tenant activo responde 404/SURVEY_INVITATION_OUT_OF_SCOPE y no inserta nada', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());

      const error = await failure(
        runWithTenant(OTHER_TENANT, () =>
          d.service.submitResponse(
            'inv-1',
            { answers: [{ questionId: 'q-1', valueText: 'Bien' }] },
            patientActor,
          ),
        ),
      );

      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(SurveysErrorReason.INVITATION_OUT_OF_SCOPE);
      expect(d.responsesRepo.createResponse).not.toHaveBeenCalled();
      expect(d.responsesRepo.createAnswer).not.toHaveBeenCalled();
      expect(d.templatesRepo.listQuestions).not.toHaveBeenCalled();
    });

    it('la invitación ajena, la de otro tenant y la inexistente responden exactamente igual', async () => {
      const respond = async (invitation: unknown, activeTenant = TENANT) => {
        const d = build();
        d.invitationsRepo.findById.mockResolvedValue(invitation);
        const error = await failure(
          runWithTenant(activeTenant, () =>
            d.raw.getMyQuestionnaire('inv-1', patientActor),
          ),
        );
        return error.getResponse();
      };

      const inexistente = await respond(null);
      expect(
        await respond(pendingInvitation({ patientProfileId: OTHER_PATIENT })),
      ).toEqual(inexistente);
      expect(await respond(pendingInvitation(), OTHER_TENANT)).toEqual(
        inexistente,
      );
    });

    it('Correcto: la respuesta conserva el tenant de la invitación y bloquea la fila al enviar', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
      d.templatesRepo.listQuestions.mockResolvedValue([textQuestion()]);

      await withTenant(() =>
        d.service.submitResponse(
          'inv-1',
          { answers: [{ questionId: 'q-1', valueText: 'Bien' }] },
          patientActor,
        ),
      );

      expect(d.invitationsRepo.findByIdForUpdate).toHaveBeenCalledWith(
        d.tx,
        'inv-1',
      );
      expect(d.responsesRepo.createResponse).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: TENANT,
          patientProfileId: PATIENT,
        }),
      );
    });

    it('una violación de unicidad del modelo sale como 409/SURVEY_ANSWER_DUPLICATE', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
      d.templatesRepo.listQuestions.mockResolvedValue([textQuestion()]);
      d.tx.flush.mockRejectedValueOnce(
        new UniqueConstraintViolationException(
          new Error('duplicate key value violates unique constraint'),
        ),
      );

      const error = (await withTenant(() =>
        d.service.submitResponse(
          'inv-1',
          { answers: [{ questionId: 'q-1', valueText: 'Bien' }] },
          patientActor,
        ),
      ).catch((e) => e)) as ConflictException;

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getStatus()).toBe(409);
      expect(error.reason).toBe(SurveysErrorReason.ANSWER_DUPLICATE);
    });
  });
});

describe('SurveysResponsesService · invitación única: base del sistema + extensión del profesional (F3)', () => {
  /** Pregunta de la base del sistema (versión `ver-base`). */
  const baseQuestion = (id: string, position: number, required: boolean) =>
    textQuestion({
      id,
      surveyVersionId: 'ver-base',
      position,
      questionText: `Base ${id}`,
      required,
    });
  /** Pregunta del profesional (versión `ver-ext`), guardada como obligatoria a propósito. */
  const extQuestion = (id: string, position: number) =>
    textQuestion({
      id,
      surveyVersionId: 'ver-ext',
      position,
      questionText: `Médico ${id}`,
      required: true,
    });

  /** Una invitación base con la versión del profesional detrás. */
  function merged(d: ReturnType<typeof build>) {
    const invitation = pendingInvitation({
      surveyVersionId: 'ver-base',
      extensionSurveyVersionId: 'ver-ext',
    });
    d.invitationsRepo.findById.mockResolvedValue(invitation);
    d.templatesRepo.listQuestions.mockImplementation(
      async (_: unknown, versionId: string) =>
        versionId === 'ver-base'
          ? [baseQuestion('b-1', 1, true), baseQuestion('b-2', 2, false)]
          : [extQuestion('e-1', 1), extQuestion('e-2', 2)],
    );
    d.templatesRepo.findVersionById.mockResolvedValue({
      id: 'ver-base',
      surveyTemplateId: 'tpl-base',
    });
    d.templatesRepo.findTemplateById.mockResolvedValue({
      id: 'tpl-base',
      title: 'Encuesta de su consulta médica',
      ownerTypeConceptId: SURVEYS.SYSTEM_BASE_CONSULTATION,
    });
    return invitation;
  }

  describe('getMyQuestionnaire', () => {
    it('devuelve primero las preguntas del sistema y después las del médico, con su origen', async () => {
      const d = build();
      merged(d);

      const res = await d.service.getMyQuestionnaire('inv-1', patientActor);

      expect(res.questions.map((q) => [q.id, q.source])).toEqual([
        ['b-1', 'SYSTEM'],
        ['b-2', 'SYSTEM'],
        ['e-1', 'PRACTITIONER'],
        ['e-2', 'PRACTITIONER'],
      ]);
      // Posiciones corridas sobre la unión.
      expect(res.questions.map((q) => q.position)).toEqual([1, 2, 3, 4]);
    });

    it('la invitación abierta lleva el mismo contexto que la tarjeta de la lista', async () => {
      const d = build();
      merged(d);
      d.invitationsRepo.listCardContext.mockResolvedValue(
        new Map([
          [
            'inv-1',
            {
              invitationId: 'inv-1',
              title: 'Cómo fue su servicio',
              description: null,
              kind: 'SERVICE',
              serviceName: 'Ecografía abdominal',
              practitionerDisplayName: 'Dr. Luis Gómez',
              attendedAt: '2026-10-02T09:30:00.000Z',
            },
          ],
        ]),
      );

      const res = await d.service.getMyQuestionnaire('inv-1', patientActor);

      expect(res).toMatchObject({
        kind: 'SERVICE',
        serviceName: 'Ecografía abdominal',
        practitionerDisplayName: 'Dr. Luis Gómez',
        attendedAt: '2026-10-02T09:30:00.000Z',
      });
      expect(d.invitationsRepo.listCardContext).toHaveBeenCalledTimes(1);
    });

    it('las del médico son opcionales aunque su versión las guarde obligatorias; las del sistema conservan su obligatoriedad', async () => {
      const d = build();
      merged(d);

      const res = await d.service.getMyQuestionnaire('inv-1', patientActor);

      expect(res.questions.map((q) => q.required)).toEqual([
        true,
        false,
        false,
        false,
      ]);
    });

    it('una invitación sólo de la base marca todas como SYSTEM', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(
        pendingInvitation({ surveyVersionId: 'ver-base' }),
      );
      d.templatesRepo.listQuestions.mockResolvedValue([
        baseQuestion('b-1', 1, true),
      ]);
      d.templatesRepo.findVersionById.mockResolvedValue({
        id: 'ver-base',
        surveyTemplateId: 'tpl-base',
      });
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-base',
        title: 'Encuesta de su servicio de salud',
        ownerTypeConceptId: SURVEYS.SYSTEM_BASE_SERVICE,
      });

      const res = await d.service.getMyQuestionnaire('inv-1', patientActor);

      expect(res.questions.map((q) => q.source)).toEqual(['SYSTEM']);
      expect(d.templatesRepo.listQuestions).toHaveBeenCalledTimes(1);
    });

    it('una invitación suelta del profesional (anterior a la base) conserva su obligatoriedad y se marca PRACTITIONER', async () => {
      const d = build();
      d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
      d.templatesRepo.listQuestions.mockResolvedValue([textQuestion()]);
      d.templatesRepo.findVersionById.mockResolvedValue({
        id: 'ver-1',
        surveyTemplateId: 'tpl-1',
      });
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        title: 'Satisfacción',
        ownerPractitionerId: OWNER,
      });

      const res = await d.service.getMyQuestionnaire('inv-1', patientActor);

      expect(res.questions).toEqual([
        expect.objectContaining({
          id: 'q-1',
          source: 'PRACTITIONER',
          required: true,
          position: 1,
        }),
      ]);
    });
  });

  describe('submitResponse valida contra la unión', () => {
    it('acepta responder preguntas de la base y del médico en el mismo envío', async () => {
      const d = build();
      const invitation = merged(d);

      const res = await withTenant(() =>
        d.service.submitResponse(
          'inv-1',
          {
            answers: [
              { questionId: 'b-1', valueText: 'Bien' },
              { questionId: 'e-2', valueText: 'Sí' },
            ],
          },
          patientActor,
        ),
      );

      expect(res).toEqual({ id: 'res-1' });
      expect(d.responsesRepo.createAnswer).toHaveBeenCalledTimes(2);
      expect(invitation.statusConceptId).toBe(SURVEYS.INVITATION_ANSWERED);
      // La cabecera de la respuesta queda en la versión base.
      expect(d.responsesRepo.createResponse).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ surveyVersionId: 'ver-base' }),
      );
    });

    it('exige las obligatorias de la base', async () => {
      const d = build();
      merged(d);

      const error = await withTenant(() =>
        d.service.submitResponse(
          'inv-1',
          { answers: [{ questionId: 'e-1', valueText: 'Sí' }] },
          patientActor,
        ),
      ).catch((e) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.details.questionIds).toEqual(['b-1']);
    });

    it('no exige las del médico, aunque su versión las guarde obligatorias', async () => {
      const d = build();
      merged(d);

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            { answers: [{ questionId: 'b-1', valueText: 'Bien' }] },
            patientActor,
          ),
        ),
      ).resolves.toEqual({ id: 'res-1' });
    });

    it('rechaza una pregunta que no es de la base ni de la extensión', async () => {
      const d = build();
      merged(d);

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            {
              answers: [
                { questionId: 'b-1', valueText: 'Bien' },
                { questionId: 'q-de-otra-version', valueText: 'x' },
              ],
            },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('listTemplateResponses: el médico sólo recibe lo suyo', () => {
    /** Respuesta de la invitación `inv-1` con dos respuestas de la base y una del médico. */
    function withMergedResponse(d: ReturnType<typeof build>) {
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        tenantId: TENANT,
        ownerPractitionerId: OWNER,
      });
      d.templatesRepo.findLatestVersion.mockResolvedValue({ id: 'ver-ext' });
      d.invitationsRepo.listByVersions.mockResolvedValue([]);
      d.invitationsRepo.listByExtensionVersions.mockResolvedValue([
        pendingInvitation({
          statusConceptId: SURVEYS.INVITATION_ANSWERED,
          surveyVersionId: 'ver-base',
          extensionSurveyVersionId: 'ver-ext',
        }),
      ]);
      d.responsesRepo.listByInvitations.mockResolvedValue([
        {
          id: 'res-1',
          surveyInvitationId: 'inv-1',
          patientProfileId: PATIENT,
          submittedAt: new Date(),
        },
      ]);
      d.templatesRepo.listQuestions.mockResolvedValue([extQuestion('e-1', 1)]);
    }

    it('busca también las invitaciones que llevan su versión como extensión', async () => {
      const d = build();
      withMergedResponse(d);
      d.responsesRepo.listAnswers.mockResolvedValue([
        { surveyResponseId: 'res-1', surveyQuestionId: 'e-1', valueText: 'Sí' },
      ]);

      await withTenant(() =>
        d.service.listTemplateResponses('tpl-1', practitionerActor),
      );

      expect(d.invitationsRepo.listByExtensionVersions).toHaveBeenCalledWith(
        d.em,
        ['ver-ext'],
      );
    });

    it('descarta las respuestas a las preguntas del sistema: no las lee una por una', async () => {
      const d = build();
      withMergedResponse(d);
      d.responsesRepo.listAnswers.mockResolvedValue([
        {
          surveyResponseId: 'res-1',
          surveyQuestionId: 'b-1',
          valueText: 'Mal',
        },
        { surveyResponseId: 'res-1', surveyQuestionId: 'e-1', valueText: 'Sí' },
      ]);

      const res = await withTenant(() =>
        d.service.listTemplateResponses('tpl-1', practitionerActor),
      );

      expect(res).toHaveLength(1);
      expect(res[0].answers.map((a) => a.questionId)).toEqual(['e-1']);
      expect(JSON.stringify(res)).not.toContain('Mal');
    });

    it('no lista la respuesta en la que sólo contestó la base', async () => {
      const d = build();
      withMergedResponse(d);
      d.responsesRepo.listAnswers.mockResolvedValue([
        {
          surveyResponseId: 'res-1',
          surveyQuestionId: 'b-1',
          valueText: 'Mal',
        },
      ]);

      const res = await withTenant(() =>
        d.service.listTemplateResponses('tpl-1', practitionerActor),
      );

      expect(res).toEqual([]);
    });

    it('la plantilla de sistema no se lee por esta vía: 403 con su reason', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-base',
        tenantId: TENANT,
        ownerTypeConceptId: SURVEYS.SYSTEM_BASE_CONSULTATION,
      });

      const error = await withTenant(() =>
        d.service.listTemplateResponses('tpl-base', practitionerActor),
      ).catch((e) => e);

      expect(error).toBeInstanceOf(DomainException);
      expect(error.getStatus()).toBe(403);
      expect(error.reason).toBe(SurveysErrorReason.SYSTEM_TEMPLATE_IMMUTABLE);
      expect(d.invitationsRepo.listByVersions).not.toHaveBeenCalled();
    });
  });
});

describe('SurveysResponsesService · B-3: texto en blanco', () => {
  /** La base de consulta: una escala obligatoria y el comentario libre (P9) opcional. */
  function baseInvitation(d: ReturnType<typeof build>) {
    const invitation = pendingInvitation({ surveyVersionId: 'ver-base' });
    d.invitationsRepo.findById.mockResolvedValue(invitation);
    d.templatesRepo.listQuestions.mockResolvedValue([
      {
        id: 'p-1',
        surveyVersionId: 'ver-base',
        position: 1,
        questionText: 'Satisfacción',
        answerTypeConceptId: ANSWER_TYPE_BY_CODE.SCALE,
        required: true,
        scaleMin: 1,
        scaleMax: 5,
      },
      {
        id: 'p-9',
        surveyVersionId: 'ver-base',
        position: 9,
        questionText: 'Si lo desea, cuéntenos qué podríamos hacer mejor.',
        answerTypeConceptId: ANSWER_TYPE_BY_CODE.TEXT,
        required: false,
      },
    ]);
    return invitation;
  }

  it.each(['', '   ', '\n\t'])(
    'el comentario libre opcional (P9) en blanco (%j) se trata como ausente: se envía y no se guarda',
    async (blank) => {
      const d = build();
      const invitation = baseInvitation(d);

      const res = await withTenant(() =>
        d.service.submitResponse(
          'inv-1',
          {
            answers: [
              { questionId: 'p-1', valueNumber: 4 },
              { questionId: 'p-9', valueText: blank },
            ],
          },
          patientActor,
        ),
      );

      expect(res).toEqual({ id: 'res-1' });
      expect(invitation.statusConceptId).toBe(SURVEYS.INVITATION_ANSWERED);
      expect(d.responsesRepo.createAnswer).toHaveBeenCalledTimes(1);
      expect(d.responsesRepo.createAnswer).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ surveyQuestionId: 'p-1' }),
      );
    },
  );

  it('con texto real el comentario libre se guarda', async () => {
    const d = build();
    baseInvitation(d);

    await withTenant(() =>
      d.service.submitResponse(
        'inv-1',
        {
          answers: [
            { questionId: 'p-1', valueNumber: 4 },
            { questionId: 'p-9', valueText: 'Todo bien' },
          ],
        },
        patientActor,
      ),
    );

    expect(d.responsesRepo.createAnswer).toHaveBeenCalledTimes(2);
  });

  it('en una pregunta de texto OBLIGATORIA el texto en blanco sigue siendo 422', async () => {
    const d = build();
    d.invitationsRepo.findById.mockResolvedValue(pendingInvitation());
    d.templatesRepo.listQuestions.mockResolvedValue([textQuestion()]);

    await expect(
      withTenant(() =>
        d.service.submitResponse(
          'inv-1',
          { answers: [{ questionId: 'q-1', valueText: '  ' }] },
          patientActor,
        ),
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.responsesRepo.createAnswer).not.toHaveBeenCalled();
  });

  it('una pregunta del médico (siempre opcional) en blanco también se ignora', async () => {
    const d = build();
    d.invitationsRepo.findById.mockResolvedValue(
      pendingInvitation({
        surveyVersionId: 'ver-base',
        extensionSurveyVersionId: 'ver-ext',
      }),
    );
    d.templatesRepo.listQuestions.mockImplementation(
      async (_: unknown, versionId: string) =>
        versionId === 'ver-base'
          ? [
              textQuestion({
                id: 'b-1',
                surveyVersionId: 'ver-base',
                required: false,
              }),
            ]
          : [
              textQuestion({
                id: 'e-1',
                surveyVersionId: 'ver-ext',
                required: true,
              }),
            ],
    );

    await expect(
      withTenant(() =>
        d.service.submitResponse(
          'inv-1',
          {
            answers: [
              { questionId: 'b-1', valueText: 'ok' },
              { questionId: 'e-1', valueText: '' },
            ],
          },
          patientActor,
        ),
      ),
    ).resolves.toEqual({ id: 'res-1' });
    expect(d.responsesRepo.createAnswer).toHaveBeenCalledTimes(1);
  });
});
