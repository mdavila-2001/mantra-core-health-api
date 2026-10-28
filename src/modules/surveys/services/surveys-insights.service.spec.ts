import { jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { SurveyInsightsDto } from '../dto/insights.dto';
import { MIN_COHORT } from '../insights.constants';
import { SurveysInsightsService } from './surveys-insights.service';
import { ANSWER_TYPE_BY_CODE } from '../surveys.concepts';
import { runWithTenant } from '../../../common';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'ten-1';
const DOCTOR = 'hp-1';
const OTHER_DOCTOR = 'hp-2';

const doctor = {
  id: 'usr-doc',
  roles: ['PRACTITIONER'],
  practitionerProfileId: DOCTOR,
} as any;
const otherDoctor = {
  id: 'usr-doc-2',
  roles: ['CLINICIAN'],
  practitionerProfileId: OTHER_DOCTOR,
} as any;

/** Textos exactos de la encuesta base de consulta que el resumen reconoce. */
const T = {
  access:
    '¿Qué tan fácil le resultó tener esta consulta, desde pedir la cita hasta que comenzó la atención? (1 = Muy difícil, 5 = Muy fácil)',
  safety:
    'Durante esta consulta, ¿tuvo algún problema de seguridad o de trato que quiera reportar? (por ejemplo: falta de respeto, falta de privacidad, un posible error o una indicación que le pareció insegura)',
  global:
    'En general, ¿cómo calificaría su experiencia con esta consulta? (1 = Muy mala, 5 = Excelente)',
  nps: '¿Qué tan probable es que usted recomiende a este profesional a un familiar o a un amigo que necesite una atención parecida? (0 = Nada probable, 10 = Totalmente probable)',
  open: 'Si lo desea, cuéntenos qué podríamos hacer mejor.',
};
const SAFETY_OPTIONS = [
  'No, no tuve ningún problema',
  'Sí, y deseo que ALOVIDA me contacte para dar seguimiento',
  'Sí, pero no deseo que me contacten',
];

/** Comprueba que el resumen no quedó suprimido y devuelve todos sus campos. */
function full(result: SurveyInsightsDto): Required<SurveyInsightsDto> {
  expect(result.privacy).toEqual({ minCohort: MIN_COHORT, suppressed: false });
  return result as Required<SurveyInsightsDto>;
}

/** Tramo de invitaciones: `answered` respondidas de `issued`. */
const bucketRow = (bucket: string, issued: number, answered: number) => ({
  bucket,
  issued,
  answered,
});

/** Fila de pregunta del repositorio. */
function questionRow(overrides: Record<string, unknown>) {
  return {
    questionId: 'q-x',
    text: 'x',
    answerTypeId: ANSWER_TYPE_BY_CODE.SCALE,
    scaleMin: 1,
    scaleMax: 5,
    options: null,
    position: 1,
    createdAtEpoch: 1000,
    bucket: '2026-10-01',
    n: 0,
    ...overrides,
  };
}

/** Fila de valor del repositorio. */
function valueRow(overrides: Record<string, unknown>) {
  return {
    questionId: 'q-x',
    bucket: '2026-10-01',
    valueNumber: null,
    valueBoolean: null,
    choice: null,
    count: 0,
    ...overrides,
  };
}

/**
 * Construye el servicio con un repositorio controlado.
 * @returns Servicio, repositorio y doble de logger.
 */
function build() {
  const repo = {
    countInvitationsByBucket: mockFn().mockResolvedValue([]),
    countAnswersByQuestion: mockFn().mockResolvedValue([]),
    countAnswerValues: mockFn().mockResolvedValue([]),
    listRecentComments: mockFn().mockResolvedValue([]),
  };
  const em = { fork: mockFn().mockReturnValue({ fork: true }) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new SurveysInsightsService(
    em as any,
    repo as any,
    logger as any,
  );
  const run = (query: any, actor: any = doctor) =>
    runWithTenant(TENANT, () => service.getInsights(query, actor));
  return { service, repo, logger, run };
}

/** Un escenario base con todas las dimensiones respondidas. */
function seedBaseScenario(repo: ReturnType<typeof build>['repo']) {
  repo.countInvitationsByBucket.mockResolvedValue([
    { bucket: '2026-10-01', issued: 6, answered: 4 },
    { bucket: '2026-10-08', issued: 4, answered: 2 },
  ]);
  repo.countAnswersByQuestion.mockResolvedValue([
    questionRow({ questionId: 'q-access', text: T.access, position: 1, n: 6 }),
    questionRow({
      questionId: 'q-safety',
      text: T.safety,
      answerTypeId: ANSWER_TYPE_BY_CODE.SINGLE_CHOICE,
      scaleMin: null,
      scaleMax: null,
      options: SAFETY_OPTIONS,
      position: 6,
      n: 6,
    }),
    questionRow({
      questionId: 'q-global',
      text: T.global,
      position: 7,
      bucket: '2026-10-01',
      n: 4,
    }),
    questionRow({
      questionId: 'q-global',
      text: T.global,
      position: 7,
      bucket: '2026-10-08',
      n: 2,
    }),
    questionRow({
      questionId: 'q-nps',
      text: T.nps,
      scaleMin: 0,
      scaleMax: 10,
      position: 8,
      n: 6,
    }),
    questionRow({
      questionId: 'q-open',
      text: T.open,
      answerTypeId: ANSWER_TYPE_BY_CODE.TEXT,
      scaleMin: null,
      scaleMax: null,
      position: 9,
      n: 2,
    }),
  ]);
  repo.countAnswerValues.mockResolvedValue([
    // Acceso: 5,5,4,2,1,1 → promedio 3
    valueRow({ questionId: 'q-access', valueNumber: 5, count: 2 }),
    valueRow({ questionId: 'q-access', valueNumber: 4, count: 1 }),
    valueRow({ questionId: 'q-access', valueNumber: 2, count: 1 }),
    valueRow({ questionId: 'q-access', valueNumber: 1, count: 2 }),
    // Seguridad: 4 sin problema, 1 alerta, 1 sin contacto
    valueRow({ questionId: 'q-safety', choice: SAFETY_OPTIONS[0], count: 4 }),
    valueRow({ questionId: 'q-safety', choice: SAFETY_OPTIONS[1], count: 1 }),
    valueRow({ questionId: 'q-safety', choice: SAFETY_OPTIONS[2], count: 1 }),
    // Satisfacción global: bucket 1 → 5,5,4,2 (avg 4) ; bucket 2 → 3,3 (avg 3)
    valueRow({ questionId: 'q-global', valueNumber: 5, count: 2 }),
    valueRow({ questionId: 'q-global', valueNumber: 4, count: 1 }),
    valueRow({ questionId: 'q-global', valueNumber: 2, count: 1 }),
    valueRow({
      questionId: 'q-global',
      valueNumber: 3,
      count: 2,
      bucket: '2026-10-08',
    }),
    // NPS: 10,9,9 → promotores 3 ; 8,7 → pasivos 2 ; 3 → detractor 1
    valueRow({ questionId: 'q-nps', valueNumber: 10, count: 1 }),
    valueRow({ questionId: 'q-nps', valueNumber: 9, count: 2 }),
    valueRow({ questionId: 'q-nps', valueNumber: 8, count: 1 }),
    valueRow({ questionId: 'q-nps', valueNumber: 7, count: 1 }),
    valueRow({ questionId: 'q-nps', valueNumber: 3, count: 1 }),
  ]);
  repo.listRecentComments.mockResolvedValue([
    { text: 'Muy amable' },
    { text: 'Esperé mucho' },
    { text: 'Todo bien' },
    { text: 'Rápido' },
    { text: 'Puntual' },
  ]);
}

describe('SurveysInsightsService', () => {
  it('rechaza una sesión sin perfil profesional (403) y no consulta nada', async () => {
    const { repo, run } = build();
    await expect(
      run({}, { id: 'u', roles: ['PRACTITIONER'] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.countInvitationsByBucket).not.toHaveBeenCalled();
  });

  it('sin tenant activo no hay resumen', async () => {
    const { service } = build();
    await expect(service.getInsights({}, doctor)).rejects.toThrow();
  });

  describe('cohorte mínima', () => {
    it('MIN_COHORT vale 5', () => {
      expect(MIN_COHORT).toBe(5);
    });

    it('sin emisiones: sólo totales y privacy.suppressed, sin consultar respuestas', async () => {
      const { repo, run } = build();

      const result = await run({});

      expect(result).toEqual({
        totals: { issued: 0, answered: 0, responseRate: null },
        privacy: { minCohort: 5, suppressed: true },
      });
      expect(repo.countAnswersByQuestion).not.toHaveBeenCalled();
      expect(repo.countAnswerValues).not.toHaveBeenCalled();
      expect(repo.listRecentComments).not.toHaveBeenCalled();
    });

    it('con 4 respondidas se suprime todo menos los totales', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      repo.countInvitationsByBucket.mockResolvedValue([
        bucketRow('2026-10-01', 6, 4),
      ]);

      const result = await run({ from: '2026-10-01', to: '2026-10-31' });

      expect(result).toEqual({
        totals: { issued: 6, answered: 4, responseRate: 0.6667 },
        privacy: { minCohort: 5, suppressed: true },
      });
      // No se pidieron las respuestas ni los comentarios: nada para filtrar mal.
      expect(repo.countAnswersByQuestion).not.toHaveBeenCalled();
      expect(repo.countAnswerValues).not.toHaveBeenCalled();
      expect(repo.listRecentComments).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toMatch(
        /Muy amable|byQuestion|nps|trend|comments|safetyAlerts/,
      );
    });

    it('con 5 respondidas ya se muestra el resumen', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      repo.countInvitationsByBucket.mockResolvedValue([
        bucketRow('2026-10-01', 5, 5),
      ]);

      const result = await run({ from: '2026-10-01', to: '2026-10-31' });

      const r = full(result);
      expect(r.totals).toEqual({ issued: 5, answered: 5, responseRate: 1 });
      expect(r.byQuestion.length).toBeGreaterThan(0);
      expect(r.comments).toHaveLength(5);
    });

    it('un filtro por servicio con una respuesta suelta no devuelve nada de esa respuesta', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      repo.countInvitationsByBucket.mockResolvedValue([
        bucketRow('2026-10-10', 1, 1),
      ]);

      const result = await run({
        from: '2026-10-01',
        to: '2026-10-31',
        serviceId: 'svc-1',
      });

      expect(result).toEqual({
        totals: { issued: 1, answered: 1, responseRate: 1 },
        privacy: { minCohort: 5, suppressed: true },
      });
      expect(repo.listRecentComments).not.toHaveBeenCalled();
      const scope = repo.countInvitationsByBucket.mock.calls[0][1];
      expect(scope.serviceId).toBe('svc-1');
    });

    it('una pregunta con menos de 5 respuestas dentro de un alcance suficiente no se desglosa', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      // La de acceso sólo la contestaron 3 (era opcional).
      const rows = await repo.countAnswersByQuestion();
      repo.countAnswersByQuestion.mockResolvedValue(
        rows.map((row: any) =>
          row.questionId === 'q-access' ? { ...row, n: 3 } : row,
        ),
      );

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      const access = r.byQuestion.find(
        (q) => q.dimension === 'esfuerzo_acceso',
      )!;
      expect(access).toEqual({
        questionId: 'q-access',
        text: T.access,
        dimension: 'esfuerzo_acceso',
        answerType: 'SCALE',
        n: 3,
        suppressed: true,
        distribution: [],
      });
      // Las demás siguen completas.
      expect(
        r.byQuestion.find((q) => q.dimension === 'satisfaccion_global')!
          .average,
      ).toBeDefined();
    });

    it('si la pregunta de seguridad queda bajo el mínimo, tampoco se cuentan alertas', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      const rows = await repo.countAnswersByQuestion();
      repo.countAnswersByQuestion.mockResolvedValue(
        rows.map((row: any) =>
          row.questionId === 'q-safety' ? { ...row, n: 2 } : row,
        ),
      );

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.safetyAlerts).toEqual({ n: 0 });
      const safety = r.byQuestion.find(
        (q) => q.dimension === 'seguridad_percibida',
      )!;
      expect(safety.optionCounts).toBeUndefined();
      expect(safety.suppressed).toBe(true);
    });

    it('un NPS con menos de 5 respuestas no se calcula', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      const rows = await repo.countAnswersByQuestion();
      repo.countAnswersByQuestion.mockResolvedValue(
        rows.map((row: any) =>
          row.questionId === 'q-nps' ? { ...row, n: 3 } : row,
        ),
      );
      const values = await repo.countAnswerValues();
      repo.countAnswerValues.mockResolvedValue(
        values
          .filter((v: any) => v.questionId !== 'q-nps')
          .concat([
            valueRow({ questionId: 'q-nps', valueNumber: 10, count: 2 }),
            valueRow({ questionId: 'q-nps', valueNumber: 2, count: 1 }),
          ]),
      );

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.nps).toEqual({
        value: null,
        promoters: 0,
        passives: 0,
        detractors: 0,
        n: 0,
        suppressed: true,
      });
    });
  });

  it('calcula totales, NPS, promedio, distribución, alertas, tendencia y comentarios', async () => {
    const { repo, run } = build();
    seedBaseScenario(repo);

    const result = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

    expect(result.totals).toEqual({
      issued: 10,
      answered: 6,
      responseRate: 0.6,
    });
    // 3 promotores, 2 pasivos, 1 detractor de 6 → (3-1)/6 = 33.3
    expect(result.nps).toEqual({
      value: 33.3,
      promoters: 3,
      passives: 2,
      detractors: 1,
      n: 6,
    });
    expect(result.safetyAlerts).toEqual({ n: 1 });

    expect(result.byQuestion.map((q) => q.dimension)).toEqual([
      'esfuerzo_acceso',
      'seguridad_percibida',
      'satisfaccion_global',
      'recomendacion_nps',
      'comentario_abierto',
    ]);

    const access = result.byQuestion[0];
    expect(access.n).toBe(6);
    expect(access.average).toBe(3);
    expect(access.distribution).toEqual([
      { value: 1, count: 2 },
      { value: 2, count: 1 },
      { value: 3, count: 0 },
      { value: 4, count: 1 },
      { value: 5, count: 2 },
    ]);
    expect(access.optionCounts).toBeUndefined();
    expect(access.suppressed).toBeUndefined();

    const safety = result.byQuestion[1];
    expect(safety.optionCounts).toEqual([
      { option: SAFETY_OPTIONS[0], count: 4 },
      { option: SAFETY_OPTIONS[1], count: 1 },
      { option: SAFETY_OPTIONS[2], count: 1 },
    ]);
    expect(safety.average).toBeUndefined();
    expect(safety.distribution).toEqual([]);

    const nps = result.byQuestion[3];
    expect(nps.distribution).toHaveLength(11);
    expect(nps.average).toBe(7.67);

    expect(result.byQuestion[4]).toEqual({
      questionId: 'q-open',
      text: T.open,
      dimension: 'comentario_abierto',
      answerType: 'TEXT',
      n: 2,
      distribution: [],
    });

    // Tramos de 4 y 2 respondidos: ninguno llega a 5, se funden en uno solo.
    expect(result.trend).toEqual([
      { period: '2026-10-01', answered: 6, average: 3.67 },
    ]);
    expect(result.comments).toEqual([
      { text: 'Muy amable' },
      { text: 'Esperé mucho' },
      { text: 'Todo bien' },
      { text: 'Rápido' },
      { text: 'Puntual' },
    ]);
  });

  describe('tendencia', () => {
    const scenario = (
      repo: ReturnType<typeof build>['repo'],
      buckets: Array<[string, number]>,
      globalByBucket: Record<string, number[]>,
    ) => {
      repo.countInvitationsByBucket.mockResolvedValue(
        buckets.map(([b, n]) => bucketRow(b, n, n)),
      );
      repo.countAnswersByQuestion.mockResolvedValue([
        questionRow({ questionId: 'q-g', text: T.global, n: 20 }),
      ]);
      repo.countAnswerValues.mockResolvedValue(
        Object.entries(globalByBucket).flatMap(([bucket, values]) =>
          values.map((v) =>
            valueRow({ questionId: 'q-g', bucket, valueNumber: v, count: 1 }),
          ),
        ),
      );
    };

    it('un tramo con 5 o más respondidos queda solo; los chicos se funden con el siguiente', async () => {
      const { repo, run } = build();
      scenario(
        repo,
        [
          ['2026-10-01', 2],
          ['2026-10-02', 3], // 2 + 3 = 5 → primer punto
          ['2026-10-03', 6], // 6 → segundo punto
          ['2026-10-04', 1], // remanente → se absorbe en el anterior
        ],
        {
          '2026-10-01': [5, 5],
          '2026-10-02': [4, 4, 4],
          '2026-10-03': [1, 1, 1, 1, 1, 1],
          '2026-10-04': [5],
        },
      );

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.trend).toEqual([
        { period: '2026-10-01', answered: 5, average: 4.4 },
        { period: '2026-10-03', answered: 7, average: 1.57 },
      ]);
      for (const point of r.trend) {
        expect(point.answered).toBeGreaterThanOrEqual(MIN_COHORT);
      }
    });

    it('un punto cuyo promedio lo sostienen menos de 5 respuestas no muestra promedio', async () => {
      const { repo, run } = build();
      scenario(repo, [['2026-10-01', 6]], { '2026-10-01': [5, 4, 3] });

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.trend).toEqual([{ period: '2026-10-01', answered: 6 }]);
    });

    it('cae al promedio de las escalas 1-5 si no hay pregunta de satisfacción global', async () => {
      const { repo, run } = build();
      repo.countInvitationsByBucket.mockResolvedValue([
        bucketRow('2026-10-01', 5, 5),
      ]);
      repo.countAnswersByQuestion.mockResolvedValue([
        questionRow({ questionId: 'q-own', text: 'Mi pregunta', n: 5 }),
      ]);
      repo.countAnswerValues.mockResolvedValue([
        valueRow({ questionId: 'q-own', valueNumber: 5, count: 3 }),
        valueRow({ questionId: 'q-own', valueNumber: 4, count: 2 }),
      ]);

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.trend).toEqual([
        { period: '2026-10-01', answered: 5, average: 4.6 },
      ]);
    });
  });

  it('agrupa por dimensión las preguntas de versiones distintas y muestra la más reciente', async () => {
    const { repo, run } = build();
    repo.countInvitationsByBucket.mockResolvedValue([
      bucketRow('2026-10-01', 8, 8),
    ]);
    repo.countAnswersByQuestion.mockResolvedValue([
      questionRow({
        questionId: 'q-v1',
        text: T.global,
        createdAtEpoch: 100,
        n: 6,
      }),
      questionRow({
        questionId: 'q-v2',
        text: T.global,
        createdAtEpoch: 200,
        n: 2,
      }),
    ]);
    repo.countAnswerValues.mockResolvedValue([
      valueRow({ questionId: 'q-v1', valueNumber: 5, count: 6 }),
      valueRow({ questionId: 'q-v2', valueNumber: 1, count: 2 }),
    ]);

    const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

    expect(r.byQuestion).toHaveLength(1);
    expect(r.byQuestion[0].questionId).toBe('q-v2');
    expect(r.byQuestion[0].n).toBe(8);
    expect(r.byQuestion[0].average).toBe(4);
  });

  it('el texto de consulta y de servicio de una misma dimensión se juntan', async () => {
    const { repo, run } = build();
    repo.countInvitationsByBucket.mockResolvedValue([
      bucketRow('2026-10-01', 6, 6),
    ]);
    repo.countAnswersByQuestion.mockResolvedValue([
      questionRow({
        questionId: 'q-c',
        text: T.global,
        createdAtEpoch: 100,
        n: 3,
      }),
      questionRow({
        questionId: 'q-s',
        text: 'En general, ¿cómo calificaría su experiencia con este servicio? (1 = Muy mala, 5 = Excelente)',
        createdAtEpoch: 300,
        n: 3,
      }),
    ]);
    repo.countAnswerValues.mockResolvedValue([
      valueRow({ questionId: 'q-c', valueNumber: 4, count: 3 }),
      valueRow({ questionId: 'q-s', valueNumber: 2, count: 3 }),
    ]);

    const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

    expect(r.byQuestion).toHaveLength(1);
    expect(r.byQuestion[0].dimension).toBe('satisfaccion_global');
    expect(r.byQuestion[0].n).toBe(6);
    expect(r.byQuestion[0].average).toBe(3);
  });

  it('las preguntas propias se agrupan por texto, sin dimensión, y no tocan el NPS', async () => {
    const { repo, run } = build();
    repo.countInvitationsByBucket.mockResolvedValue([
      bucketRow('2026-10-01', 12, 12),
    ]);
    repo.countAnswersByQuestion.mockResolvedValue([
      questionRow({
        questionId: 'q-a1',
        text: '¿Le  gustó la sala?',
        createdAtEpoch: 10,
        n: 3,
      }),
      questionRow({
        questionId: 'q-a2',
        text: '¿le gustó la sala? (1 = Nada, 5 = Mucho)',
        createdAtEpoch: 20,
        n: 3,
      }),
      questionRow({
        questionId: 'q-dolor',
        text: 'Nivel de dolor',
        scaleMin: 0,
        scaleMax: 10,
        n: 6,
      }),
      questionRow({
        questionId: 'q-bool',
        text: '¿Volvería?',
        answerTypeId: ANSWER_TYPE_BY_CODE.BOOLEAN,
        scaleMin: null,
        scaleMax: null,
        n: 6,
      }),
    ]);
    repo.countAnswerValues.mockResolvedValue([
      valueRow({ questionId: 'q-a1', valueNumber: 4, count: 3 }),
      valueRow({ questionId: 'q-a2', valueNumber: 1, count: 3 }),
      valueRow({ questionId: 'q-dolor', valueNumber: 10, count: 6 }),
      valueRow({ questionId: 'q-bool', valueBoolean: true, count: 4 }),
      valueRow({ questionId: 'q-bool', valueBoolean: false, count: 2 }),
    ]);

    const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

    const sala = r.byQuestion.find((q) => q.questionId === 'q-a2');
    expect(sala).toMatchObject({ dimension: null, n: 6, average: 2.5 });
    expect(r.byQuestion.filter((q) => q.text.includes('sala'))).toHaveLength(1);
    // «Nivel de dolor» es 0-10 pero no habla de recomendar: no es NPS.
    expect(r.nps.n).toBe(0);
    expect(r.nps.value).toBeNull();
    expect(
      r.byQuestion.find((q) => q.questionId === 'q-bool')?.optionCounts,
    ).toEqual([
      { option: 'Sí', count: 4 },
      { option: 'No', count: 2 },
    ]);
  });

  it('una pregunta propia 0-10 que pide recomendar cuenta como NPS (plantillas del médico)', async () => {
    const { repo, run } = build();
    repo.countInvitationsByBucket.mockResolvedValue([
      bucketRow('2026-10-01', 6, 6),
    ]);
    repo.countAnswersByQuestion.mockResolvedValue([
      questionRow({
        questionId: 'q-rec',
        text: '¿Me recomendaría con un amigo?',
        scaleMin: 0,
        scaleMax: 10,
        n: 6,
      }),
    ]);
    repo.countAnswerValues.mockResolvedValue([
      valueRow({ questionId: 'q-rec', valueNumber: 10, count: 3 }),
      valueRow({ questionId: 'q-rec', valueNumber: 0, count: 3 }),
    ]);

    const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

    expect(r.nps).toEqual({
      value: 0,
      promoters: 3,
      passives: 0,
      detractors: 3,
      n: 6,
    });
  });

  describe('alcance: profesional, tenant y filtros', () => {
    it('acota cada consulta al tenant activo y al profesional de la sesión, nunca a un parámetro', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);

      await run({ from: '2026-10-01', to: '2026-10-31', serviceId: 'svc-1' });

      const scopes = [
        repo.countInvitationsByBucket.mock.calls[0][1],
        repo.countAnswersByQuestion.mock.calls[0][1],
        repo.countAnswerValues.mock.calls[0][1],
        repo.listRecentComments.mock.calls[0][1],
      ];
      for (const scope of scopes) {
        expect(scope.tenantId).toBe(TENANT);
        expect(scope.practitionerProfileId).toBe(DOCTOR);
        expect(scope.serviceId).toBe('svc-1');
      }
    });

    it('dos médicos del mismo tenant reciben alcances distintos y sus resultados no se mezclan', async () => {
      const { repo, run } = build();
      // El repositorio responde según el profesional del alcance.
      const issuedByDoctor: Record<string, number> = {
        [DOCTOR]: 7,
        [OTHER_DOCTOR]: 2,
      };
      repo.countInvitationsByBucket.mockImplementation(
        async (_em: unknown, scope: any) => [
          bucketRow(
            '2026-10-01',
            issuedByDoctor[scope.practitionerProfileId],
            0,
          ),
        ],
      );

      const mine = await run({ from: '2026-10-01', to: '2026-10-31' }, doctor);
      const theirs = await run(
        { from: '2026-10-01', to: '2026-10-31' },
        otherDoctor,
      );

      expect(mine.totals.issued).toBe(7);
      expect(theirs.totals.issued).toBe(2);
      expect(repo.countInvitationsByBucket.mock.calls[0][1]).toMatchObject({
        practitionerProfileId: DOCTOR,
      });
      expect(repo.countInvitationsByBucket.mock.calls[1][1]).toMatchObject({
        practitionerProfileId: OTHER_DOCTOR,
      });
    });

    it('usa el tenant de la petición: en otro tenant el alcance cambia', async () => {
      const { service, repo } = build();
      await runWithTenant('ten-2', () => service.getInsights({}, doctor));
      expect(repo.countInvitationsByBucket.mock.calls[0][1].tenantId).toBe(
        'ten-2',
      );
    });
  });

  describe('periodo: meses calendario', () => {
    it('`from` es el primer día del mes y `to` el último: la cota superior es la medianoche siguiente', async () => {
      const { repo, run } = build();
      await run({ from: '2026-10-01', to: '2026-10-31' });
      const scope = repo.countInvitationsByBucket.mock.calls[0][1];
      expect(scope.from).toEqual(new Date('2026-10-01T00:00:00.000Z'));
      expect(scope.toExclusive).toEqual(new Date('2026-11-01T00:00:00.000Z'));
    });

    it('acepta febrero (28 y 29 días) y diciembre como último día de mes', async () => {
      const { run } = build();
      await expect(
        run({ from: '2026-02-01', to: '2026-02-28' }),
      ).resolves.toBeDefined();
      await expect(
        run({ from: '2028-02-01', to: '2028-02-29' }),
      ).resolves.toBeDefined();
      await expect(
        run({ from: '2025-12-01', to: '2025-12-31' }),
      ).resolves.toBeDefined();
    });

    it('sin `from` vale una ventana de 12 meses que termina en el mes de `to`; sin `to`, el fin del mes en curso', async () => {
      const { repo, run } = build();
      await run({ to: '2026-10-31' });
      const scope = repo.countInvitationsByBucket.mock.calls[0][1];
      expect(scope.from).toEqual(new Date('2025-11-01T00:00:00.000Z'));
      expect(scope.toExclusive).toEqual(new Date('2026-11-01T00:00:00.000Z'));

      await run({});
      const open = repo.countInvitationsByBucket.mock.calls[1][1];
      expect(open.toExclusive.getUTCDate()).toBe(1);
      expect(open.from.getUTCDate()).toBe(1);
      const months =
        open.toExclusive.getUTCFullYear() * 12 +
        open.toExclusive.getUTCMonth() -
        (open.from.getUTCFullYear() * 12 + open.from.getUTCMonth());
      expect(months).toBe(12);
    });

    it.each([
      ['from con hora', { from: '2026-10-01T10:00:00Z', to: '2026-10-31' }],
      ['from con hora y offset', { from: '2026-10-01T00:00:00-04:00' }],
      ['to con hora', { from: '2026-10-01', to: '2026-10-31T12:00:00.000Z' }],
      ['to como instante', { to: '2026-10-31T00:00:00Z' }],
      ['fecha imposible', { from: '2026-13-45' }],
      ['día inexistente', { from: '2026-02-01', to: '2026-02-30' }],
      ['formato libre', { from: '1/10/2026' }],
      [
        'from que no es primer día de mes',
        { from: '2026-10-02', to: '2026-10-31' },
      ],
      [
        'to que no es último día de mes',
        { from: '2026-10-01', to: '2026-10-30' },
      ],
      ['to a mitad de mes', { from: '2026-10-01', to: '2026-10-15' }],
      ['febrero sin su último día', { from: '2026-02-01', to: '2026-02-27' }],
      ['from posterior a to', { from: '2026-10-01', to: '2026-08-31' }],
      ['más de 12 meses', { from: '2025-10-01', to: '2026-10-31' }],
    ])('rechaza con 400: %s', async (_name, query) => {
      const { repo, run } = build();
      await expect(run(query)).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.countInvitationsByBucket).not.toHaveBeenCalled();
    });

    it('acepta un solo mes y el máximo de 12 meses', async () => {
      const { run } = build();
      await expect(
        run({ from: '2026-10-01', to: '2026-10-31' }),
      ).resolves.toBeDefined();
      await expect(
        run({ from: '2025-11-01', to: '2026-10-31' }),
      ).resolves.toBeDefined();
    });

    it.each([
      ['2026-10-01', '2026-10-31', 'DAY', 'day'],
      ['2026-07-01', '2026-10-31', 'WEEK', 'week'],
      ['2025-11-01', '2026-10-31', 'MONTH', 'month'],
    ])('periodo %s → %s: tendencia %s', async (from, to, granularity, unit) => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      const result = full(await run({ from, to }));
      expect(result.trendGranularity).toBe(granularity);
      expect(repo.countInvitationsByBucket.mock.calls[0][2]).toBe(unit);
      expect(repo.countAnswersByQuestion.mock.calls[0][2]).toBe(unit);
      expect(repo.countAnswerValues.mock.calls[0][2]).toBe(unit);
    });
  });

  describe('lo suprimido no alimenta ningún total', () => {
    it('una pregunta suprimida no entra en la tendencia: el promedio sale sólo de las no suprimidas', async () => {
      const { repo, run } = build();
      repo.countInvitationsByBucket.mockResolvedValue([
        bucketRow('2026-10-01', 8, 8),
      ]);
      repo.countAnswersByQuestion.mockResolvedValue([
        // Satisfacción global: sólo 3 respuestas (suprimida) y todas 1.
        questionRow({ questionId: 'q-g', text: T.global, n: 3 }),
        // Una escala 1-5 propia con 6 respuestas todas 5.
        questionRow({ questionId: 'q-own', text: 'Mi pregunta', n: 6 }),
      ]);
      repo.countAnswerValues.mockResolvedValue([
        valueRow({ questionId: 'q-g', valueNumber: 1, count: 3 }),
        valueRow({ questionId: 'q-own', valueNumber: 5, count: 6 }),
      ]);

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.trend).toEqual([
        { period: '2026-10-01', answered: 8, average: 5 },
      ]);
      expect(JSON.stringify(r.trend)).not.toMatch(/"average":(1|[2-4])/);
    });

    it('si la pregunta de satisfacción es la única y está suprimida, la tendencia no trae promedio', async () => {
      const { repo, run } = build();
      repo.countInvitationsByBucket.mockResolvedValue([
        bucketRow('2026-10-01', 8, 8),
      ]);
      repo.countAnswersByQuestion.mockResolvedValue([
        questionRow({ questionId: 'q-g', text: T.global, n: 4 }),
      ]);
      repo.countAnswerValues.mockResolvedValue([
        valueRow({ questionId: 'q-g', valueNumber: 2, count: 4 }),
      ]);

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.trend).toEqual([{ period: '2026-10-01', answered: 8 }]);
    });

    it('un NPS suprimido no deja rastro: ni valor, ni conteos, ni n', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      const rows = await repo.countAnswersByQuestion();
      repo.countAnswersByQuestion.mockResolvedValue(
        rows.map((row: any) =>
          row.questionId === 'q-nps' ? { ...row, n: 4 } : row,
        ),
      );

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.nps).toEqual({
        value: null,
        promoters: 0,
        passives: 0,
        detractors: 0,
        n: 0,
        suppressed: true,
      });
      const q = r.byQuestion.find((x) => x.dimension === 'recomendacion_nps')!;
      expect(q.suppressed).toBe(true);
      expect(q.distribution).toEqual([]);
      expect(q.average).toBeUndefined();
    });

    it('la alerta de seguridad de una pregunta suprimida no se suma a ningún total', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      const rows = await repo.countAnswersByQuestion();
      repo.countAnswersByQuestion.mockResolvedValue(
        rows.map((row: any) =>
          row.questionId === 'q-safety' ? { ...row, n: 4 } : row,
        ),
      );

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.safetyAlerts).toEqual({ n: 0 });
    });
  });

  describe('comentarios', () => {
    it('con menos de 5 comentarios en el alcance no se devuelve ninguno', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      repo.listRecentComments.mockResolvedValue([
        { text: 'Uno' },
        { text: 'Dos' },
        { text: 'Tres' },
        { text: 'Cuatro' },
      ]);

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.comments).toEqual([]);
      expect(JSON.stringify(r)).not.toMatch(/Uno|Dos|Tres|Cuatro/);
    });

    it('con 5 o más se devuelven sólo con el texto: sin día, mes ni hora', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);

      const r = full(await run({ from: '2026-10-01', to: '2026-10-31' }));

      expect(r.comments).toHaveLength(5);
      expect(JSON.stringify(r.comments)).not.toMatch(
        /submittedAt|month|\d{4}-\d{2}/,
      );
    });
  });

  describe('privacidad', () => {
    it('no copia al resultado campos que el repositorio traiga de más: nada identifica al paciente ni a la atención', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);
      // Aun si una fila trajera columnas identificatorias, el resumen no las propaga.
      const leak = {
        patientProfileId: 'PACIENTE-SECRETO',
        appointmentBookingId: 'RESERVA-SECRETA',
        surveyResponseId: 'RESPUESTA-SECRETA',
        submittedAt: '2026-10-09T13:45:12.123Z',
      };
      for (const method of [
        'countInvitationsByBucket',
        'countAnswersByQuestion',
        'countAnswerValues',
        'listRecentComments',
      ] as const) {
        const rows = (await repo[method]()) as Record<string, unknown>[];
        repo[method].mockResolvedValue(
          rows.map((row) => ({ ...row, ...leak })),
        );
      }

      const result = full(await run({ from: '2026-10-01', to: '2026-10-31' }));
      const json = JSON.stringify(result);

      expect(json).not.toMatch(/SECRET/);
      expect(json).not.toMatch(/patient|appointment|booking|invitation/i);
      expect(json).not.toContain('13:45');
      for (const comment of result.comments) {
        expect(Object.keys(comment)).toEqual(['text']);
      }
    });

    it('no registra contenido de respuestas en el log: sólo conteos', async () => {
      const { repo, run, logger } = build();
      seedBaseScenario(repo);

      await run({ from: '2026-10-01', to: '2026-10-31' });

      const logged = JSON.stringify(logger.info.mock.calls);
      expect(logged).not.toContain('Muy amable');
      expect(logged).toContain('surveys.insights.read');
    });
  });
});
