import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { SurveysResponsesService } from './surveys-responses.service';
import { SURVEYS, ANSWER_TYPE_BY_CODE } from '../surveys.concepts';
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
  const invitationsRepo = {
    findById: mockFn(),
    listByPatient: mockFn().mockResolvedValue([]),
    listByBooking: mockFn().mockResolvedValue([]),
    listByVersions: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
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
  return { service, tx, invitationsRepo, responsesRepo, templatesRepo };
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

    it('rechaza a una sesión sin perfil de paciente', async () => {
      const d = build();
      await expect(
        d.service.listMyInvitations(practitionerActor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
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

    it('rechaza fuera de plazo y deja la invitación vencida', async () => {
      const d = build();
      const invitation = pendingInvitation({ expiresAt: PAST });
      d.invitationsRepo.findById.mockResolvedValue(invitation);

      await expect(
        withTenant(() =>
          d.service.submitResponse(
            'inv-1',
            { answers: [{ questionId: 'q-1', valueText: 'x' }] },
            patientActor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(invitation.statusConceptId).toBe(SURVEYS.INVITATION_EXPIRED);
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
          submittedAt: new Date(),
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
      expect(res[0].appointmentBookingId).toBe('bkg-1');
      expect(res[0].answers[0]).toEqual(
        expect.objectContaining({
          questionText: '¿Cómo fue la atención?',
          answerType: 'TEXT',
          valueText: 'Bien',
        }),
      );
    });
  });
});
