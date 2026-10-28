import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { SurveysInsightsService } from './surveys-insights.service';
import { ANSWER_TYPE_BY_CODE } from '../surveys.concepts';
import { PreconditionFailedException, runWithTenant } from '../../../common';

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
    findEarliestIssuedAt: mockFn().mockResolvedValue(new Date('2026-10-01')),
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
    { text: 'Muy amable', day: '2026-10-09' },
    { text: 'Esperé mucho', day: '2026-10-02' },
  ]);
}

describe('SurveysInsightsService', () => {
  it('rechaza una sesión sin perfil profesional (403) y no consulta nada', async () => {
    const { repo, run } = build();
    await expect(
      run({}, { id: 'u', roles: ['PRACTITIONER'] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.countInvitationsByBucket).not.toHaveBeenCalled();
    expect(repo.findEarliestIssuedAt).not.toHaveBeenCalled();
  });

  it('sin tenant activo no hay resumen', async () => {
    const { service } = build();
    await expect(service.getInsights({}, doctor)).rejects.toThrow();
  });

  it('sin emisiones devuelve el resumen vacío con la forma completa', async () => {
    const { repo, run } = build();
    repo.findEarliestIssuedAt.mockResolvedValue(null);

    const result = await run({});

    expect(result).toEqual({
      totals: { issued: 0, answered: 0, responseRate: null },
      nps: { value: null, promoters: 0, passives: 0, detractors: 0, n: 0 },
      byQuestion: [],
      trend: [],
      trendGranularity: 'DAY',
      safetyAlerts: { n: 0 },
      comments: [],
    });
    expect(repo.countInvitationsByBucket).not.toHaveBeenCalled();
  });

  it('calcula totales, NPS, promedio, distribución, alertas, tendencia y comentarios', async () => {
    const { repo, run } = build();
    seedBaseScenario(repo);

    const result = await run({ from: '2026-10-01', to: '2026-10-28' });

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

    const dims = result.byQuestion.map((q) => q.dimension);
    expect(dims).toEqual([
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

    const open = result.byQuestion[4];
    expect(open).toEqual({
      questionId: 'q-open',
      text: T.open,
      dimension: 'comentario_abierto',
      answerType: 'TEXT',
      n: 2,
      distribution: [],
    });

    // Satisfacción global por tramo de emisión.
    expect(result.trend).toEqual([
      { period: '2026-10-01', answered: 4, average: 4 },
      { period: '2026-10-08', answered: 2, average: 3 },
    ]);
    expect(result.comments).toEqual([
      { text: 'Muy amable', submittedAt: '2026-10-09' },
      { text: 'Esperé mucho', submittedAt: '2026-10-02' },
    ]);
  });

  it('agrupa por dimensión las preguntas de versiones distintas y muestra la más reciente', async () => {
    const { repo, run } = build();
    repo.countInvitationsByBucket.mockResolvedValue([
      { bucket: '2026-10-01', issued: 4, answered: 4 },
    ]);
    repo.countAnswersByQuestion.mockResolvedValue([
      // La misma pregunta de consulta en la v1 y la v2 de la plantilla de sistema.
      questionRow({
        questionId: 'q-v1',
        text: T.global,
        createdAtEpoch: 100,
        n: 3,
      }),
      questionRow({
        questionId: 'q-v2',
        text: T.global,
        createdAtEpoch: 200,
        n: 1,
      }),
    ]);
    repo.countAnswerValues.mockResolvedValue([
      valueRow({ questionId: 'q-v1', valueNumber: 5, count: 3 }),
      valueRow({ questionId: 'q-v2', valueNumber: 1, count: 1 }),
    ]);

    const result = await run({ from: '2026-10-01' });

    expect(result.byQuestion).toHaveLength(1);
    expect(result.byQuestion[0].questionId).toBe('q-v2');
    expect(result.byQuestion[0].n).toBe(4);
    expect(result.byQuestion[0].average).toBe(4);
  });

  it('el texto de consulta y de servicio de una misma dimensión se juntan', async () => {
    const { repo, run } = build();
    repo.countInvitationsByBucket.mockResolvedValue([
      { bucket: '2026-10-01', issued: 2, answered: 2 },
    ]);
    repo.countAnswersByQuestion.mockResolvedValue([
      questionRow({
        questionId: 'q-c',
        text: T.global,
        createdAtEpoch: 100,
        n: 1,
      }),
      questionRow({
        questionId: 'q-s',
        text: 'En general, ¿cómo calificaría su experiencia con este servicio? (1 = Muy mala, 5 = Excelente)',
        createdAtEpoch: 300,
        n: 1,
      }),
    ]);
    repo.countAnswerValues.mockResolvedValue([
      valueRow({ questionId: 'q-c', valueNumber: 4, count: 1 }),
      valueRow({ questionId: 'q-s', valueNumber: 2, count: 1 }),
    ]);

    const result = await run({ from: '2026-10-01' });

    expect(result.byQuestion).toHaveLength(1);
    expect(result.byQuestion[0].dimension).toBe('satisfaccion_global');
    expect(result.byQuestion[0].n).toBe(2);
    expect(result.byQuestion[0].average).toBe(3);
  });

  it('las preguntas propias se agrupan por texto, sin dimensión, y no tocan el NPS', async () => {
    const { repo, run } = build();
    repo.countInvitationsByBucket.mockResolvedValue([
      { bucket: '2026-10-01', issued: 3, answered: 3 },
    ]);
    repo.countAnswersByQuestion.mockResolvedValue([
      questionRow({
        questionId: 'q-a1',
        text: '¿Le  gustó la sala?',
        scaleMin: 1,
        scaleMax: 5,
        createdAtEpoch: 10,
        n: 2,
      }),
      questionRow({
        questionId: 'q-a2',
        text: '¿le gustó la sala? (1 = Nada, 5 = Mucho)',
        createdAtEpoch: 20,
        n: 1,
      }),
      questionRow({
        questionId: 'q-dolor',
        text: 'Nivel de dolor',
        scaleMin: 0,
        scaleMax: 10,
        n: 2,
      }),
      questionRow({
        questionId: 'q-bool',
        text: '¿Volvería?',
        answerTypeId: ANSWER_TYPE_BY_CODE.BOOLEAN,
        scaleMin: null,
        scaleMax: null,
        n: 3,
      }),
    ]);
    repo.countAnswerValues.mockResolvedValue([
      valueRow({ questionId: 'q-a1', valueNumber: 4, count: 2 }),
      valueRow({ questionId: 'q-a2', valueNumber: 1, count: 1 }),
      valueRow({ questionId: 'q-dolor', valueNumber: 10, count: 2 }),
      valueRow({ questionId: 'q-bool', valueBoolean: true, count: 2 }),
      valueRow({ questionId: 'q-bool', valueBoolean: false, count: 1 }),
    ]);

    const result = await run({ from: '2026-10-01' });

    const sala = result.byQuestion.find((q) => q.questionId === 'q-a2');
    expect(sala).toMatchObject({ dimension: null, n: 3, average: 3 });
    expect(
      result.byQuestion.filter((q) => q.text.includes('sala')),
    ).toHaveLength(1);
    // «Nivel de dolor» es 0-10 pero no habla de recomendar: no es NPS.
    expect(result.nps.n).toBe(0);
    expect(result.nps.value).toBeNull();
    const bool = result.byQuestion.find((q) => q.questionId === 'q-bool');
    expect(bool?.optionCounts).toEqual([
      { option: 'Sí', count: 2 },
      { option: 'No', count: 1 },
    ]);
  });

  it('una pregunta propia 0-10 que pide recomendar cuenta como NPS (plantillas del médico)', async () => {
    const { repo, run } = build();
    repo.countInvitationsByBucket.mockResolvedValue([
      { bucket: '2026-10-01', issued: 2, answered: 2 },
    ]);
    repo.countAnswersByQuestion.mockResolvedValue([
      questionRow({
        questionId: 'q-rec',
        text: '¿Me recomendaría con un amigo?',
        scaleMin: 0,
        scaleMax: 10,
        n: 2,
      }),
    ]);
    repo.countAnswerValues.mockResolvedValue([
      valueRow({ questionId: 'q-rec', valueNumber: 10, count: 1 }),
      valueRow({ questionId: 'q-rec', valueNumber: 0, count: 1 }),
    ]);

    const result = await run({ from: '2026-10-01' });

    expect(result.nps).toEqual({
      value: 0,
      promoters: 1,
      passives: 0,
      detractors: 1,
      n: 2,
    });
  });

  it('muestra las preguntas sin respuestas con n = 0 y sin promedio', async () => {
    const { repo, run } = build();
    repo.countInvitationsByBucket.mockResolvedValue([
      { bucket: '2026-10-01', issued: 1, answered: 0 },
    ]);
    repo.countAnswersByQuestion.mockResolvedValue([
      questionRow({ questionId: 'q-global', text: T.global, n: 0 }),
    ]);

    const result = await run({ from: '2026-10-01' });

    expect(result.totals).toEqual({ issued: 1, answered: 0, responseRate: 0 });
    expect(result.byQuestion[0].n).toBe(0);
    expect(result.byQuestion[0].average).toBeUndefined();
    expect(result.byQuestion[0].distribution).toHaveLength(5);
    expect(result.trend).toEqual([{ period: '2026-10-01', answered: 0 }]);
  });

  it('la tendencia cae al promedio de las escalas 1-5 si no hay pregunta de satisfacción global', async () => {
    const { repo, run } = build();
    repo.countInvitationsByBucket.mockResolvedValue([
      { bucket: '2026-10-01', issued: 2, answered: 2 },
    ]);
    repo.countAnswersByQuestion.mockResolvedValue([
      questionRow({ questionId: 'q-own', text: 'Mi pregunta', n: 2 }),
    ]);
    repo.countAnswerValues.mockResolvedValue([
      valueRow({ questionId: 'q-own', valueNumber: 5, count: 1 }),
      valueRow({ questionId: 'q-own', valueNumber: 4, count: 1 }),
    ]);

    const result = await run({ from: '2026-10-01' });

    expect(result.trend).toEqual([
      { period: '2026-10-01', answered: 2, average: 4.5 },
    ]);
  });

  describe('alcance: profesional, tenant y filtros', () => {
    it('acota cada consulta al tenant activo y al profesional de la sesión, nunca a un parámetro', async () => {
      const { repo, run } = build();
      seedBaseScenario(repo);

      await run({ from: '2026-10-01', serviceId: 'svc-1' });

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
          {
            bucket: '2026-10-01',
            issued: issuedByDoctor[scope.practitionerProfileId],
            answered: 0,
          },
        ],
      );

      const mine = await run({ from: '2026-10-01' }, doctor);
      const theirs = await run({ from: '2026-10-01' }, otherDoctor);

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
      expect(repo.findEarliestIssuedAt.mock.calls[0][1].tenantId).toBe('ten-2');
    });
  });

  describe('periodo y granularidad', () => {
    it('una fecha `to` sola incluye todo ese día', async () => {
      const { repo, run } = build();
      await run({ from: '2026-10-01', to: '2026-10-28' });
      const scope = repo.countInvitationsByBucket.mock.calls[0][1];
      expect(scope.from).toEqual(new Date('2026-10-01'));
      expect(scope.toExclusive).toEqual(new Date('2026-10-29T00:00:00.000Z'));
    });

    it('un `to` con hora es inclusivo hasta ese instante', async () => {
      const { repo, run } = build();
      await run({ from: '2026-10-01', to: '2026-10-28T12:00:00.000Z' });
      const scope = repo.countInvitationsByBucket.mock.calls[0][1];
      expect(scope.toExclusive).toEqual(new Date('2026-10-28T12:00:00.001Z'));
    });

    it('rechaza un periodo invertido con 412', async () => {
      const { repo, run } = build();
      await expect(
        run({ from: '2026-10-28', to: '2026-10-01' }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(repo.countInvitationsByBucket).not.toHaveBeenCalled();
    });

    it('rechaza una fecha imposible con 412', async () => {
      const { run } = build();
      await expect(run({ from: '2026-13-45' })).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it.each([
      ['2026-10-01', '2026-10-30', 'DAY', 'day'],
      ['2026-08-01', '2026-10-28', 'WEEK', 'week'],
      ['2025-11-01', '2026-10-28', 'MONTH', 'month'],
    ])('periodo %s → %s: tendencia %s', async (from, to, granularity, unit) => {
      const { repo, run } = build();
      const result = await run({ from, to });
      expect(result.trendGranularity).toBe(granularity);
      expect(repo.countInvitationsByBucket.mock.calls[0][2]).toBe(unit);
      expect(repo.countAnswersByQuestion.mock.calls[0][2]).toBe(unit);
      expect(repo.countAnswerValues.mock.calls[0][2]).toBe(unit);
      // Con `from` explícito no hace falta buscar la primera emisión.
      expect(repo.findEarliestIssuedAt).not.toHaveBeenCalled();
    });

    it('sin `from` la granularidad sale de la primera emisión', async () => {
      const { repo, run } = build();
      repo.findEarliestIssuedAt.mockResolvedValue(
        new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      );
      const result = await run({});
      expect(result.trendGranularity).toBe('MONTH');
      expect(repo.findEarliestIssuedAt).toHaveBeenCalledTimes(1);
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

      const result = await run({ from: '2026-10-01' });
      const json = JSON.stringify(result);

      expect(json).not.toMatch(/SECRET/);
      expect(json).not.toMatch(/patient|appointment|booking|invitation/i);
      expect(json).not.toContain('13:45');
      for (const comment of result.comments) {
        expect(Object.keys(comment).sort()).toEqual(['submittedAt', 'text']);
        expect(comment.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('no registra contenido de respuestas en el log: sólo conteos', async () => {
      const { repo, run, logger } = build();
      seedBaseScenario(repo);

      await run({ from: '2026-10-01' });

      const logged = JSON.stringify(logger.info.mock.calls);
      expect(logged).not.toContain('Muy amable');
      expect(logged).toContain('surveys.insights.read');
    });
  });
});
