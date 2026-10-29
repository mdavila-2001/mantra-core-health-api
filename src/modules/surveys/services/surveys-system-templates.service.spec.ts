import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import {
  SurveysSystemTemplatesService,
  systemSurveyIds,
} from './surveys-system-templates.service';
import {
  SYSTEM_BASE_SURVEYS,
  SYSTEM_BASE_SURVEY_VERSION,
  SYSTEM_SURVEY_KINDS,
} from '../surveys.base-definitions';
import {
  ANSWER_TYPE_BY_CODE,
  SURVEYS,
  SYSTEM_OWNER_TYPE_BY_KIND,
} from '../surveys.concepts';

const TENANT = 'ten-1';
const ACTOR = 'usr-1';

/**
 * Construye el sistema bajo prueba. `store` simula lo que ya hay en la base:
 * vacío por omisión (tenant sin encuesta base).
 *
 * @returns Resultado de build.
 */
function build(store: { complete?: boolean; olderVersion?: any } = {}) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forked: any = {
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const em: any = { fork: mockFn(() => forked) };

  const ids = systemSurveyIds(TENANT, 'CONSULTATION');
  const complete = store.complete ?? false;
  const templatesRepo = {
    findVersionById: mockFn().mockResolvedValue(
      complete
        ? {
            id: ids.versionId,
            publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
            responseWindowDays: 30,
          }
        : null,
    ),
    countQuestions: mockFn().mockResolvedValue(
      complete ? SYSTEM_BASE_SURVEYS.CONSULTATION.questions.length : 0,
    ),
    findTemplateById: mockFn().mockResolvedValue(null),
    createTemplate: mockFn((_: unknown, data: any) => ({ ...data })),
    listVersions: mockFn().mockResolvedValue(
      store.olderVersion ? [store.olderVersion] : [],
    ),
    createVersion: mockFn((_: unknown, data: any) => ({ ...data })),
    findQuestionById: mockFn().mockResolvedValue(null),
    createQuestion: mockFn((_: unknown, data: any) => ({ ...data })),
  };
  const assignmentsRepo = {
    findById: mockFn().mockResolvedValue(
      complete ? { id: ids.assignmentId } : null,
    ),
    create: mockFn((_: unknown, data: any) => ({ ...data })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SurveysSystemTemplatesService(
    em,
    templatesRepo as any,
    assignmentsRepo as any,
    logger as any,
  );
  return { service, em, forked, tx, templatesRepo, assignmentsRepo, ids };
}

describe('systemSurveyIds', () => {
  it('son deterministas: el mismo tenant y tipo dan siempre los mismos ids', () => {
    expect(systemSurveyIds(TENANT, 'CONSULTATION')).toEqual(
      expect.objectContaining({
        templateId: systemSurveyIds(TENANT, 'CONSULTATION').templateId,
        versionId: systemSurveyIds(TENANT, 'CONSULTATION').versionId,
      }),
    );
    expect(systemSurveyIds(TENANT, 'CONSULTATION').questionId(3)).toBe(
      systemSurveyIds(TENANT, 'CONSULTATION').questionId(3),
    );
  });

  it('cambian con el tenant, el tipo, la versión del contenido y la posición', () => {
    const base = systemSurveyIds(TENANT, 'CONSULTATION');
    const all = new Set<string>([
      base.templateId,
      base.versionId,
      base.assignmentId,
      base.questionId(1),
      base.questionId(2),
      systemSurveyIds('ten-2', 'CONSULTATION').templateId,
      systemSurveyIds(TENANT, 'SERVICE').templateId,
      systemSurveyIds(TENANT, 'CONSULTATION', SYSTEM_BASE_SURVEY_VERSION + 1)
        .versionId,
    ]);
    expect(all.size).toBe(8);
  });
});

describe('contenido de la encuesta base (banco de preguntas 28/10/2026)', () => {
  it('consulta: 9 preguntas, las 8 primeras obligatorias y el comentario libre opcional', () => {
    const { questions } = SYSTEM_BASE_SURVEYS.CONSULTATION;
    expect(questions).toHaveLength(9);
    expect(questions.slice(0, 8).every((q) => q.required)).toBe(true);
    expect(questions[8]).toMatchObject({
      position: 9,
      answerType: 'TEXT',
      required: false,
      dimension: 'comentario_abierto',
    });
    expect(questions.map((q) => q.position)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('servicio: 7 preguntas, todas opcionales', () => {
    const { questions } = SYSTEM_BASE_SURVEYS.SERVICE;
    expect(questions).toHaveLength(7);
    expect(questions.every((q) => q.required === false)).toBe(true);
    expect(questions.map((q) => q.position)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('las escalas son 1-5 salvo la recomendación (NPS), que es 0-10', () => {
    for (const kind of SYSTEM_SURVEY_KINDS) {
      for (const q of SYSTEM_BASE_SURVEYS[kind].questions) {
        if (q.answerType !== 'SCALE') continue;
        if (q.dimension === 'recomendacion_nps') {
          expect([q.scaleMin, q.scaleMax]).toEqual([0, 10]);
        } else {
          expect([q.scaleMin, q.scaleMax]).toEqual([1, 5]);
        }
      }
    }
  });

  it('la pregunta de seguridad ofrece el seguimiento como segunda opción', () => {
    for (const kind of SYSTEM_SURVEY_KINDS) {
      const safety = SYSTEM_BASE_SURVEYS[kind].questions.find(
        (q) => q.dimension === 'seguridad_percibida',
      );
      expect(safety?.answerType).toBe('SINGLE_CHOICE');
      expect(safety?.options).toEqual([
        'No, no tuve ningún problema',
        'Sí, y deseo que ALOVIDA me contacte para dar seguimiento',
        'Sí, pero no deseo que me contacten',
      ]);
    }
  });

  it('el texto de las preguntas es el del banco, sin reescrituras', () => {
    const c = SYSTEM_BASE_SURVEYS.CONSULTATION;
    expect(c.title).toBe('Encuesta de su consulta médica');
    expect(c.questions[0].text).toBe(
      '¿Qué tan fácil le resultó tener esta consulta, desde pedir la cita hasta que comenzó la atención? (1 = Muy difícil, 5 = Muy fácil)',
    );
    expect(c.questions[7].text).toBe(
      '¿Qué tan probable es que usted recomiende a este profesional a un familiar o a un amigo que necesite una atención parecida? (0 = Nada probable, 10 = Totalmente probable)',
    );
    expect(c.questions[8].text).toBe(
      'Si lo desea, cuéntenos qué podríamos hacer mejor.',
    );
    const s = SYSTEM_BASE_SURVEYS.SERVICE;
    expect(s.title).toBe('Encuesta de su servicio de salud');
    expect(s.questions[0].options).toEqual([
      'Menos de 15 minutos',
      'De 15 a 30 minutos',
      'De 31 a 60 minutos',
      'Más de 1 hora',
      'No lo recuerdo',
    ]);
  });
});

describe('SurveysSystemTemplatesService.ensureSystemTemplate', () => {
  it('si la base ya está completa la devuelve sin escribir nada (idempotente)', async () => {
    const d = build({ complete: true });

    const res = await d.service.ensureSystemTemplate(
      TENANT,
      'CONSULTATION',
      ACTOR,
    );

    expect(res).toEqual({
      kind: 'CONSULTATION',
      templateId: d.ids.templateId,
      versionId: d.ids.versionId,
      assignmentId: d.ids.assignmentId,
      responseWindowDays: 30,
    });
    expect(d.forked.transactional).not.toHaveBeenCalled();
    expect(d.templatesRepo.createTemplate).not.toHaveBeenCalled();
  });

  it('en un tenant sin base crea plantilla de sistema, versión publicada, 9 preguntas y asignación', async () => {
    const d = build();
    // Tras materializar, la segunda lectura ya la ve completa.
    d.templatesRepo.findVersionById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({
        id: d.ids.versionId,
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        responseWindowDays: 30,
      });
    d.assignmentsRepo.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: d.ids.assignmentId });
    d.templatesRepo.countQuestions.mockResolvedValue(9);

    const res = await d.service.ensureSystemTemplate(
      TENANT,
      'CONSULTATION',
      ACTOR,
    );

    expect(res.versionId).toBe(d.ids.versionId);
    // Sin profesional dueño: el dueño es el par tipado (tipo de sistema + tenant).
    expect(d.templatesRepo.createTemplate).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        id: d.ids.templateId,
        tenantId: TENANT,
        ownerTypeConceptId: SYSTEM_OWNER_TYPE_BY_KIND.CONSULTATION,
        ownerId: TENANT,
        statusConceptId: SURVEYS.TEMPLATE_ACTIVE,
        title: 'Encuesta de su consulta médica',
      }),
    );
    const [, templateData] = d.templatesRepo.createTemplate.mock.calls[0];
    expect(templateData.ownerPractitionerId).toBeUndefined();

    expect(d.templatesRepo.createVersion).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        id: d.ids.versionId,
        surveyTemplateId: d.ids.templateId,
        versionNumber: SYSTEM_BASE_SURVEY_VERSION,
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
      }),
    );

    expect(d.templatesRepo.createQuestion).toHaveBeenCalledTimes(9);
    const questions = d.templatesRepo.createQuestion.mock.calls.map(
      ([, data]: [unknown, any]) => data,
    );
    expect(questions.map((q: any) => q.id)).toEqual(
      Array.from({ length: 9 }, (_, i) => d.ids.questionId(i + 1)),
    );
    expect(questions.map((q: any) => q.required)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
    ]);
    expect(questions[7]).toMatchObject({
      answerTypeConceptId: ANSWER_TYPE_BY_CODE.SCALE,
      scaleMin: 0,
      scaleMax: 10,
    });
    expect(questions[1]).toMatchObject({
      answerTypeConceptId: ANSWER_TYPE_BY_CODE.SINGLE_CHOICE,
      options: expect.arrayContaining(['No lo recuerdo']),
    });

    expect(d.assignmentsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        id: d.ids.assignmentId,
        surveyVersionId: d.ids.versionId,
        tenantId: TENANT,
        targetTypeConceptId: SURVEYS.TARGET_SYSTEM_BASE,
        active: true,
      }),
    );
  });

  it('la de servicio crea 7 preguntas, todas opcionales, con su propio tipo de dueño', async () => {
    const d = build();
    const ids = systemSurveyIds(TENANT, 'SERVICE');
    d.templatesRepo.findVersionById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({
        id: ids.versionId,
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        responseWindowDays: 30,
      });
    d.assignmentsRepo.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: ids.assignmentId });
    d.templatesRepo.countQuestions.mockResolvedValue(7);

    await d.service.ensureSystemTemplate(TENANT, 'SERVICE', ACTOR);

    expect(d.templatesRepo.createQuestion).toHaveBeenCalledTimes(7);
    expect(
      d.templatesRepo.createQuestion.mock.calls.every(
        ([, data]: [unknown, any]) => data.required === false,
      ),
    ).toBe(true);
    expect(d.templatesRepo.createTemplate).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        ownerTypeConceptId: SURVEYS.SYSTEM_BASE_SERVICE,
        title: 'Encuesta de su servicio de salud',
      }),
    );
  });

  it('no recrea lo que ya existe: una plantilla y preguntas previas se respetan', async () => {
    const d = build();
    d.templatesRepo.findTemplateById.mockResolvedValue({
      id: d.ids.templateId,
      title: 'x',
      description: 'x',
    });
    d.templatesRepo.findQuestionById.mockResolvedValue({ id: 'q' });
    d.templatesRepo.countQuestions.mockResolvedValue(9);
    d.templatesRepo.findVersionById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: d.ids.versionId })
      .mockResolvedValue({
        id: d.ids.versionId,
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        responseWindowDays: 30,
      });
    d.assignmentsRepo.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: d.ids.assignmentId })
      .mockResolvedValue({ id: d.ids.assignmentId });

    await d.service.ensureSystemTemplate(TENANT, 'CONSULTATION', ACTOR);

    expect(d.templatesRepo.createTemplate).not.toHaveBeenCalled();
    expect(d.templatesRepo.createVersion).not.toHaveBeenCalled();
    expect(d.templatesRepo.createQuestion).not.toHaveBeenCalled();
    expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
  });

  it('al subir la versión del contenido retira la anterior sin borrarla', async () => {
    const older: any = {
      id: 'ver-vieja',
      publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
      effectiveTo: undefined,
      updatedAt: new Date(0),
    };
    const d = build({ olderVersion: older });
    d.templatesRepo.findTemplateById.mockResolvedValue({
      id: d.ids.templateId,
    });
    d.templatesRepo.findVersionById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({
        id: d.ids.versionId,
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        responseWindowDays: 30,
      });
    d.assignmentsRepo.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: d.ids.assignmentId });
    d.templatesRepo.countQuestions.mockResolvedValue(9);

    await d.service.ensureSystemTemplate(TENANT, 'CONSULTATION', ACTOR);

    expect(older.publicationStatusConceptId).toBe(SURVEYS.VERSION_RETIRED);
    expect(older.effectiveTo).toBeInstanceOf(Date);
    expect(d.templatesRepo.createVersion).toHaveBeenCalledTimes(1);
  });

  it('si otra solicitud la materializó primero (violación de clave) relee y devuelve lo que ganó', async () => {
    const d = build();
    d.forked.transactional.mockRejectedValueOnce(
      new UniqueConstraintViolationException(new Error('duplicate key')),
    );
    // La lectura posterior al choque ya la ve completa.
    d.templatesRepo.findVersionById
      .mockResolvedValueOnce(null)
      .mockResolvedValue({
        id: d.ids.versionId,
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        responseWindowDays: 30,
      });
    d.assignmentsRepo.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: d.ids.assignmentId });
    d.templatesRepo.countQuestions.mockResolvedValue(9);

    const res = await d.service.ensureSystemTemplate(
      TENANT,
      'CONSULTATION',
      ACTOR,
    );

    expect(res.versionId).toBe(d.ids.versionId);
  });

  it('un error que no es de unicidad sigue subiendo', async () => {
    const d = build();
    d.forked.transactional.mockRejectedValueOnce(
      new Error('connection refused'),
    );

    await expect(
      d.service.ensureSystemTemplate(TENANT, 'CONSULTATION', ACTOR),
    ).rejects.toThrow('connection refused');
  });
});
