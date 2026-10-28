import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { MikroORM, EntityManager, defineConfig } from '@mikro-orm/postgresql';
import { BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { SurveyInsightsDto } from '../../src/modules/surveys/dto/insights.dto';
import { runWithTenant } from '../../src/common';
import { InsightsRepository } from '../../src/modules/surveys/repositories/insights.repository';
import { SurveysInsightsService } from '../../src/modules/surveys/services/surveys-insights.service';
import {
  ANSWER_TYPE_BY_CODE,
  SURVEYS,
} from '../../src/modules/surveys/surveys.concepts';
import { isDisposableDatabaseName } from './disposable-database';

/**
 * `GET /surveys/insights` (el cálculo agregado) contra PostgreSQL real: las
 * consultas de `InsightsRepository` y el servicio, sin dobles.
 *
 * Opt-in (`SURVEYS_INSIGHTS_IT=1`) y sólo sobre una base descartable
 * (`DB_NAME` con `test`, `ci`, `tmp`, `scratch`, `smoke` o `disposable`). Inserta
 * filas propias con ids aleatorios en `surveys.*` y `scheduling.*` desactivando
 * las FK dentro de la transacción de carga (`session_replication_role =
 * replica`, exige superusuario) para no tener que fabricar medio modelo, y al
 * terminar borra exactamente lo que creó. Requiere el DDL de `surveys` y
 * `scheduling` aplicado.
 */
const enabled =
  process.env.SURVEYS_INSIGHTS_IT === '1' &&
  isDisposableDatabaseName(process.env.DB_NAME ?? '');
const maybe = enabled ? describe : describe.skip;

const T = {
  access:
    '¿Qué tan fácil le resultó tener esta consulta, desde pedir la cita hasta que comenzó la atención? (1 = Muy difícil, 5 = Muy fácil)',
  safety:
    'Durante esta consulta, ¿tuvo algún problema de seguridad o de trato que quiera reportar? (por ejemplo: falta de respeto, falta de privacidad, un posible error o una indicación que le pareció insegura)',
  global:
    'En general, ¿cómo calificaría su experiencia con esta consulta? (1 = Muy mala, 5 = Excelente)',
  nps: '¿Qué tan probable es que usted recomiende a este profesional a un familiar o a un amigo que necesite una atención parecida? (0 = Nada probable, 10 = Totalmente probable)',
  open: 'Si lo desea, cuéntenos qué podríamos hacer mejor.',
  own: '¿Le gustó el consultorio?',
};
const SAFETY_OPTIONS = [
  'No, no tuve ningún problema',
  'Sí, y deseo que ALOVIDA me contacte para dar seguimiento',
  'Sí, pero no deseo que me contacten',
];
const JSONB = new Set(['options', 'value_choices']);

maybe('GET /surveys/insights · cálculo agregado (PostgreSQL real)', () => {
  let orm: MikroORM;
  let em: EntityManager;
  let service: SurveysInsightsService;
  let queries = 0;

  const tenant = randomUUID();
  const otherTenant = randomUUID();
  const d1 = randomUUID();
  const d2 = randomUUID();
  const svcCatalog = randomUUID();
  const svcOther = randomUUID();
  const day = (d: number) => new Date(Date.UTC(2026, 9, d, 15, 30, 45, 123));
  const touched: Array<[string, string]> = [];

  const insert = async (
    tx: EntityManager,
    table: string,
    row: Record<string, unknown>,
  ) => {
    const cols = Object.keys(row);
    const values = cols.map((c) =>
      JSONB.has(c) && row[c] !== null && row[c] !== undefined
        ? JSON.stringify(row[c])
        : row[c],
    );
    await tx.execute(
      `insert into ${table} (${cols.map((c) => `"${c}"`).join(', ')}) values (${cols.map((c) => (JSONB.has(c) ? '?::jsonb' : '?')).join(', ')})`,
      values as never[],
    );
    touched.push([table, String(row.id)]);
  };
  const stamp = { created_at: new Date(), updated_at: new Date() };

  /** Plantilla + versión + preguntas. Devuelve ids de versión y de preguntas por clave. */
  const makeTemplate = async (
    tx: EntityManager,
    tenantId: string,
    ownerPractitioner: string | null,
    questions: Array<{
      key: string;
      text: string;
      type: keyof typeof ANSWER_TYPE_BY_CODE;
      min?: number;
      max?: number;
      options?: string[];
    }>,
  ) => {
    const templateId = randomUUID();
    const versionId = randomUUID();
    await insert(tx, 'surveys.survey_templates', {
      id: templateId,
      tenant_id: tenantId,
      owner_practitioner_id: ownerPractitioner,
      // La base de sistema no tiene dueño profesional: lo declara con el par
      // alterno (el CHECK `single_owner` exige uno u otro).
      owner_type_concept_id: ownerPractitioner ? null : randomUUID(),
      owner_id: ownerPractitioner ? null : randomUUID(),
      title: 'Plantilla de prueba',
      status_concept_id: SURVEYS.TEMPLATE_ACTIVE,
      ...stamp,
    });
    await insert(tx, 'surveys.survey_versions', {
      id: versionId,
      survey_template_id: templateId,
      version_number: 1,
      publication_status_concept_id: SURVEYS.VERSION_PUBLISHED,
      response_window_days: 30,
      ...stamp,
    });
    const assignmentId = randomUUID();
    await insert(tx, 'surveys.survey_assignments', {
      id: assignmentId,
      survey_version_id: versionId,
      tenant_id: tenantId,
      target_type_concept_id: SURVEYS.TARGET_CARE_TYPE,
      target_id: randomUUID(),
      active: true,
      ...stamp,
    });
    const q: Record<string, string> = {};
    let position = 1;
    for (const def of questions) {
      const id = randomUUID();
      q[def.key] = id;
      await insert(tx, 'surveys.survey_questions', {
        id,
        survey_version_id: versionId,
        position: position++,
        question_text: def.text,
        answer_type_concept_id: ANSWER_TYPE_BY_CODE[def.type],
        required: false,
        options: def.options ?? null,
        scale_min: def.min ?? null,
        scale_max: def.max ?? null,
        ...stamp,
      });
    }
    return { templateId, versionId, assignmentId, q };
  };

  /** Reserva en la agenda de un profesional. */
  const makeBooking = async (
    tx: EntityManager,
    tenantId: string,
    practitionerId: string,
    opts: { offeringId?: string } = {},
  ) => {
    const resourceId = randomUUID();
    const slotId = randomUUID();
    const bookingId = randomUUID();
    await insert(tx, 'scheduling.schedulable_resources', {
      id: resourceId,
      tenant_id: tenantId,
      resource_type_concept_id: randomUUID(),
      resource_ref_type: 'health_practitioner_profiles',
      resource_ref_id: practitionerId,
      name: 'Agenda',
      state_concept_id: randomUUID(),
      ...stamp,
    });
    await insert(tx, 'scheduling.bookable_slots', {
      id: slotId,
      resource_id: resourceId,
      start_at: day(1),
      end_at: day(1),
      capacity: 1,
      remaining_capacity: 0,
      status_concept_id: randomUUID(),
      ...stamp,
    });
    await insert(tx, 'scheduling.appointment_bookings', {
      id: bookingId,
      tenant_id: tenantId,
      patient_profile_id: randomUUID(),
      bookable_slot_id: slotId,
      booking_channel_concept_id: randomUUID(),
      status_concept_id: randomUUID(),
      practitioner_service_offering_id: opts.offeringId ?? null,
      ...stamp,
    });
    return bookingId;
  };

  /** Invitación y, si `answers` viene, su respuesta. */
  const makeInvitation = async (
    tx: EntityManager,
    t: { versionId: string; assignmentId: string; q: Record<string, string> },
    tenantId: string,
    bookingId: string | null,
    issuedDay: number | Date,
    answers?: Array<{
      key: string;
      text?: string;
      number?: number;
      choices?: string[];
    }>,
    assignmentId: string = t.assignmentId,
  ) => {
    const invitationId = randomUUID();
    const patientId = randomUUID();
    const issuedAt = typeof issuedDay === 'number' ? day(issuedDay) : issuedDay;
    const submittedAt = new Date(issuedAt.getTime() + 86_400_000);
    await insert(tx, 'surveys.survey_invitations', {
      id: invitationId,
      survey_version_id: t.versionId,
      survey_assignment_id: assignmentId,
      tenant_id: tenantId,
      patient_profile_id: patientId,
      appointment_booking_id: bookingId,
      // Sin reserva, el CHECK de ancla exige un sujeto alterno.
      subject_type_concept_id: bookingId ? null : randomUUID(),
      subject_id: bookingId ? null : randomUUID(),
      status_concept_id: answers
        ? SURVEYS.INVITATION_ANSWERED
        : SURVEYS.INVITATION_PENDING,
      issued_at: issuedAt,
      expires_at: new Date(issuedAt.getTime() + 20 * 86_400_000),
      answered_at: answers ? submittedAt : null,
      ...stamp,
    });
    if (!answers) return;
    const responseId = randomUUID();
    await insert(tx, 'surveys.survey_responses', {
      id: responseId,
      survey_invitation_id: invitationId,
      survey_version_id: t.versionId,
      tenant_id: tenantId,
      patient_profile_id: patientId,
      submitted_at: submittedAt,
      ...stamp,
    });
    for (const a of answers) {
      await insert(tx, 'surveys.survey_answers', {
        id: randomUUID(),
        survey_response_id: responseId,
        survey_question_id: t.q[a.key],
        value_text: a.text ?? null,
        value_number: a.number ?? null,
        value_choices: a.choices ?? null,
        ...stamp,
      });
    }
  };

  const baseQuestions = [
    { key: 'access', text: T.access, type: 'SCALE' as const, min: 1, max: 5 },
    {
      key: 'safety',
      text: T.safety,
      type: 'SINGLE_CHOICE' as const,
      options: SAFETY_OPTIONS,
    },
    { key: 'global', text: T.global, type: 'SCALE' as const, min: 1, max: 5 },
    { key: 'nps', text: T.nps, type: 'SCALE' as const, min: 0, max: 10 },
    { key: 'open', text: T.open, type: 'TEXT' as const },
  ];

  let ownTemplateId: string;
  let ownVersionId: string;
  let ownAssignmentId: string;
  let sysAssignmentId: string;

  beforeAll(async () => {
    orm = await MikroORM.init(
      defineConfig({
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        dbName: process.env.DB_NAME,
        entities: [],
        discovery: { warnWhenNoEntities: false },
        allowGlobalContext: true,
      }),
    );
    em = orm.em as EntityManager;

    // Cuenta cada ida a la base del servicio (la carga de datos usa otra `em`).
    const connection = em.getConnection();
    const execute = connection.execute.bind(connection);
    (connection as unknown as { execute: unknown }).execute = (
      ...args: Parameters<typeof execute>
    ) => {
      queries += 1;
      return execute(...args);
    };

    const logger = { setContext: () => undefined, info: () => undefined };
    service = new SurveysInsightsService(
      em,
      new InsightsRepository(),
      logger as unknown as PinoLogger,
    );

    await em.transactional(async (tx) => {
      await tx.execute('set local session_replication_role = replica');

      // --- Profesional 1: plantilla propia + encuesta de sistema -------------
      const own = await makeTemplate(tx, tenant, d1, [
        { key: 'own', text: T.own, type: 'SCALE', min: 1, max: 5 },
        ...baseQuestions,
      ]);
      ownTemplateId = own.templateId;
      ownVersionId = own.versionId;
      ownAssignmentId = own.assignmentId;
      const sys = await makeTemplate(tx, tenant, null, baseQuestions);
      sysAssignmentId = sys.assignmentId;
      const offering = randomUUID();
      await insert(tx, 'scheduling.practitioner_service_offerings', {
        id: offering,
        practitioner_profile_id: d1,
        service_catalog_id: svcCatalog,
        min_duration_minutes: 10,
        max_duration_minutes: 30,
        is_patient_bookable: true,
        requires_approval: false,
        status_concept_id: randomUUID(),
        ...stamp,
      });
      const bookingServiceD1 = await makeBooking(tx, tenant, d1, {
        offeringId: offering,
      });
      const bookingConsultD1 = await makeBooking(tx, tenant, d1);

      // Propia, respondida (dia 3): own=4, access=5, global=5, nps=10, comentario.
      await makeInvitation(tx, own, tenant, bookingConsultD1, 3, [
        { key: 'own', number: 4 },
        { key: 'access', number: 5 },
        { key: 'global', number: 5 },
        { key: 'nps', number: 10 },
        { key: 'safety', choices: [SAFETY_OPTIONS[0]] },
        { key: 'open', text: 'Muy amable, gracias' },
      ]);
      // Propias, respondidas (dias 6 y 7): hacen falta 5 respondidas para que
      // el resumen se muestre.
      await makeInvitation(
        tx,
        own,
        tenant,
        await makeBooking(tx, tenant, d1),
        6,
        [
          { key: 'own', number: 3 },
          { key: 'access', number: 4 },
          { key: 'global', number: 5 },
          { key: 'nps', number: 9 },
          { key: 'safety', choices: [SAFETY_OPTIONS[0]] },
          { key: 'open', text: 'Comentario seis' },
        ],
      );
      await makeInvitation(
        tx,
        own,
        tenant,
        await makeBooking(tx, tenant, d1),
        7,
        [
          { key: 'own', number: 5 },
          { key: 'access', number: 3 },
          { key: 'global', number: 4 },
          { key: 'nps', number: 10 },
          { key: 'safety', choices: [SAFETY_OPTIONS[0]] },
          { key: 'open', text: 'Comentario siete' },
        ],
      );
      // Propia, pendiente (dia 4).
      await makeInvitation(
        tx,
        own,
        tenant,
        await makeBooking(tx, tenant, d1),
        4,
      );
      // Sistema, respondida (dia 10), de una atención por servicio de D1:
      // access=2, seguridad = alerta, global=3, nps=3 (detractor).
      await makeInvitation(tx, sys, tenant, bookingServiceD1, 10, [
        { key: 'access', number: 2 },
        { key: 'safety', choices: [SAFETY_OPTIONS[1]] },
        { key: 'global', number: 3 },
        { key: 'nps', number: 3 },
        { key: 'open', text: 'Esperé demasiado' },
      ]);
      // Sistema, respondida (dia 12), de una consulta de D1: nps=8 (pasivo).
      await makeInvitation(tx, sys, tenant, bookingConsultD1, 12, [
        { key: 'access', number: 4 },
        { key: 'safety', choices: [SAFETY_OPTIONS[0]] },
        { key: 'global', number: 4 },
        { key: 'nps', number: 8 },
        { key: 'open', text: 'Comentario doce' },
      ]);
      // Septiembre: una respuesta suelta de otro mes, para probar ventanas.
      await makeInvitation(
        tx,
        own,
        tenant,
        await makeBooking(tx, tenant, d1),
        new Date(Date.UTC(2026, 8, 15, 10, 0, 0)),
        [{ key: 'global', number: 5 }],
      );
      // Propia con un destino de servicio por asignación (otro servicio), dia 20.
      const svcAssignment = randomUUID();
      await insert(tx, 'surveys.survey_assignments', {
        id: svcAssignment,
        survey_version_id: ownVersionId,
        tenant_id: tenant,
        target_type_concept_id: SURVEYS.TARGET_SERVICE,
        target_id: svcOther,
        active: true,
        ...stamp,
      });
      await makeInvitation(
        tx,
        own,
        tenant,
        null,
        20,
        [{ key: 'global', number: 1 }],
        svcAssignment,
      );

      // --- Profesional 2 (mismo tenant): NO deben aparecer en D1 --------------
      const other = await makeTemplate(tx, tenant, d2, baseQuestions);
      const bookingD2 = await makeBooking(tx, tenant, d2);
      await makeInvitation(tx, other, tenant, bookingD2, 5, [
        { key: 'global', number: 1 },
        { key: 'nps', number: 0 },
        { key: 'open', text: 'COMENTARIO-DE-OTRO-MEDICO' },
      ]);
      await makeInvitation(tx, sys, tenant, bookingD2, 6, [
        { key: 'global', number: 1 },
        { key: 'safety', choices: [SAFETY_OPTIONS[1]] },
        { key: 'open', text: 'SISTEMA-DE-OTRO-MEDICO' },
      ]);
      // Con tres más, D2 también supera la cohorte mínima.
      for (let day = 7; day <= 9; day += 1) {
        await makeInvitation(
          tx,
          other,
          tenant,
          await makeBooking(tx, tenant, d2),
          day,
          [
            { key: 'global', number: 2 },
            { key: 'open', text: `OTRO-MEDICO-${day}` },
          ],
        );
      }

      // --- Otro tenant, mismo profesional D1: tampoco ------------------------
      const foreign = await makeTemplate(tx, otherTenant, d1, baseQuestions);
      const foreignBooking = await makeBooking(tx, otherTenant, d1);
      await makeInvitation(tx, foreign, otherTenant, foreignBooking, 7, [
        { key: 'global', number: 1 },
        { key: 'open', text: 'COMENTARIO-DE-OTRO-TENANT' },
      ]);
    });
  });

  afterAll(async () => {
    if (!orm) return;
    await em.transactional(async (tx) => {
      await tx.execute('set local session_replication_role = replica');
      for (const [table, id] of touched.reverse()) {
        await tx.execute(`delete from ${table} where id = ?`, [id]);
      }
    });
    await orm.close(true);
  });

  const as = (practitioner: string, tenantId = tenant) => ({
    id: randomUUID(),
    roles: ['PRACTITIONER'],
    practitionerProfileId: practitioner,
    tenantId,
  });
  const full = (result: SurveyInsightsDto): Required<SurveyInsightsDto> => {
    expect(result.privacy.suppressed).toBe(false);
    return result as Required<SurveyInsightsDto>;
  };
  const insights = (
    query: { from?: string; to?: string; serviceId?: string },
    practitioner = d1,
    tenantId = tenant,
  ) =>
    runWithTenant(tenantId, () =>
      service.getInsights(query, as(practitioner, tenantId) as never),
    );

  it('suma las plantillas propias y las de sistema emitidas por las atenciones del médico', async () => {
    const result = full(
      await insights({ from: '2026-10-01', to: '2026-10-31' }),
    );

    // propias: dias 3, 6, 7 (resp), 4 (pend), 20 (resp, por asignación de servicio)
    // sistema: dias 10 y 12 (resp)  → 7 emitidos, 6 respondidos
    expect(result.totals).toEqual({
      issued: 7,
      answered: 6,
      responseRate: 0.8571,
    });
    expect(result.privacy).toEqual({ minCohort: 5, suppressed: false });

    // NPS: 10, 3, 8, 9, 10 → 3 promotores, 1 pasivo, 1 detractor
    expect(result.nps).toEqual({
      value: 40,
      promoters: 3,
      passives: 1,
      detractors: 1,
      n: 5,
    });
    expect(result.safetyAlerts).toEqual({ n: 1 });

    const global = result.byQuestion.find(
      (q) => q.dimension === 'satisfaccion_global',
    )!;
    // 5, 5, 4, 3, 4, 1 → n=6, promedio 3.67
    expect(global.n).toBe(6);
    expect(global.average).toBe(3.67);
    expect(global.distribution).toEqual([
      { value: 1, count: 1 },
      { value: 2, count: 0 },
      { value: 3, count: 1 },
      { value: 4, count: 2 },
      { value: 5, count: 2 },
    ]);

    // La misma dimensión de la plantilla propia y de la de sistema es UNA fila.
    const access = result.byQuestion.filter(
      (q) => q.dimension === 'esfuerzo_acceso',
    );
    expect(access).toHaveLength(1);
    expect(access[0].n).toBe(5);
    expect(access[0].average).toBe(3.6);

    // Pregunta propia con 3 respuestas (< 5): se cuenta pero no se desglosa.
    const own = result.byQuestion.find((q) => q.text === T.own)!;
    expect(own).toMatchObject({ dimension: null, n: 3, suppressed: true });
    expect(own.average).toBeUndefined();

    const safety = result.byQuestion.find(
      (q) => q.dimension === 'seguridad_percibida',
    )!;
    expect(safety.n).toBe(5);
    expect(safety.optionCounts).toEqual([
      { option: SAFETY_OPTIONS[0], count: 4 },
      { option: SAFETY_OPTIONS[1], count: 1 },
      { option: SAFETY_OPTIONS[2], count: 0 },
    ]);

    // Comentarios (5 en el alcance): sólo texto y mes, ninguno ajeno, sin
    // orden cronológico forzado.
    expect(result.comments).toHaveLength(5);
    expect(
      result.comments.map((c) => c.text).sort((a, b) => a.localeCompare(b)),
    ).toEqual([
      'Comentario doce',
      'Comentario seis',
      'Comentario siete',
      'Esperé demasiado',
      'Muy amable, gracias',
    ]);
    for (const comment of result.comments) {
      expect(Object.keys(comment).sort()).toEqual(['month', 'text']);
      expect(comment.month).toBe('2026-10');
    }
  });

  it('suprime todo con menos de 5 respondidas: un mes con una respuesta suelta', async () => {
    // Septiembre tiene una sola respuesta de D1.
    const september = await insights({ from: '2026-09-01', to: '2026-09-30' });
    expect(september).toEqual({
      totals: { issued: 1, answered: 1, responseRate: 1 },
      privacy: { minCohort: 5, suppressed: true },
    });
    expect(JSON.stringify(september)).not.toMatch(/Comentario|Muy amable/);
  });

  it('muestra el resumen cuando el alcance suma 5 o más respondidas', async () => {
    const both = full(await insights({ from: '2026-09-01', to: '2026-10-31' }));
    expect(both.totals).toEqual({
      issued: 8,
      answered: 7,
      responseRate: 0.875,
    });
    expect(both.byQuestion.length).toBeGreaterThan(0);
  });

  it('rechaza con 400 un periodo con hora, que no sea de meses enteros, invertido o de más de 12 meses', async () => {
    for (const query of [
      { from: '2026-10-01T10:00:00Z' },
      { to: '2026-10-31T23:59:59Z' },
      { from: '2026-10-02', to: '2026-10-31' },
      { from: '2026-10-01', to: '2026-10-30' },
      { from: '2026-10-01', to: '2026-08-31' },
      { from: '2025-10-01', to: '2026-10-31' },
    ]) {
      await expect(insights(query)).rejects.toBeInstanceOf(BadRequestException);
    }
  });

  it('aísla por médico: D2 no ve nada de D1 y D1 no ve nada de D2', async () => {
    const mine = await insights({ from: '2026-10-01', to: '2026-10-31' }, d1);
    const theirs = full(
      await insights({ from: '2026-10-01', to: '2026-10-31' }, d2),
    );

    // D2: su plantilla (dia 5 y 7..9) + la de sistema emitida por su atención (dia 6).
    expect(theirs.totals).toEqual({ issued: 5, answered: 5, responseRate: 1 });
    const theirTexts = theirs.comments.map((c) => c.text).sort();
    expect(theirTexts).toEqual([
      'COMENTARIO-DE-OTRO-MEDICO',
      'OTRO-MEDICO-7',
      'OTRO-MEDICO-8',
      'OTRO-MEDICO-9',
      'SISTEMA-DE-OTRO-MEDICO',
    ]);
    expect(JSON.stringify(mine)).not.toMatch(/OTRO-MEDICO|OTRO-TENANT/);
    expect(JSON.stringify(theirs)).not.toMatch(/Muy amable|Esperé demasiado/);
  });

  it('aísla por tenant: el mismo médico en otro tenant sólo ve lo de ese tenant', async () => {
    const result = await insights(
      { from: '2026-10-01', to: '2026-10-31' },
      d1,
      otherTenant,
    );
    // Una sola respuesta de ese tenant: se cuenta, pero no se desglosa.
    expect(result).toEqual({
      totals: { issued: 1, answered: 1, responseRate: 1 },
      privacy: { minCohort: 5, suppressed: true },
    });
    // Un tenant sin nada de este médico: vacío.
    const nothing = await insights({}, d1, randomUUID());
    expect(nothing.totals).toEqual({
      issued: 0,
      answered: 0,
      responseRate: null,
    });
    expect(nothing.privacy.suppressed).toBe(true);
  });

  it('filtra por servicio: por la oferta de la reserva y por la asignación de servicio', async () => {
    const byOffering = await insights({
      from: '2026-10-01',
      to: '2026-10-31',
      serviceId: svcCatalog,
    });
    // sólo la encuesta de sistema del dia 10 (atención con esa oferta)
    expect(byOffering.totals).toEqual({
      issued: 1,
      answered: 1,
      responseRate: 1,
    });
    expect(byOffering.privacy.suppressed).toBe(true);

    const byAssignment = await insights({
      from: '2026-10-01',
      to: '2026-10-31',
      serviceId: svcOther,
    });
    // sólo la propia del dia 20, asignada a ese servicio
    expect(byAssignment.totals).toEqual({
      issued: 1,
      answered: 1,
      responseRate: 1,
    });

    const unknown = await insights({
      from: '2026-10-01',
      to: '2026-10-31',
      serviceId: randomUUID(),
    });
    expect(unknown.totals.issued).toBe(0);
  });

  it('la tendencia agrupa por tramo y funde los tramos con menos de 5 respondidos', async () => {
    const result = full(
      await insights({ from: '2026-10-01', to: '2026-10-31' }),
    );
    expect(result.trendGranularity).toBe('DAY');
    // Por día: 3(1) 4(0) 6(1) 7(1) 10(1) 12(1) 20(1). Se funden hasta sumar 5
    // (dias 3..12) y el remanente (dia 20) se suma al punto anterior.
    expect(result.trend).toEqual([
      { period: '2026-10-03', answered: 6, average: 3.67 },
    ]);

    const weekly = full(
      await insights({ from: '2026-07-01', to: '2026-10-31' }),
    );
    expect(weekly.trendGranularity).toBe('WEEK');
    for (const point of weekly.trend) {
      expect(point.answered).toBeGreaterThanOrEqual(5);
    }
    // Semana ISO que empieza el lunes: el 15/9 (martes) cae en la del 14/9.
    expect(weekly.trend[0].period).toBe('2026-09-14');

    const monthly = full(
      await insights({ from: '2025-11-01', to: '2026-10-31' }),
    );
    expect(monthly.trendGranularity).toBe('MONTH');
    expect(monthly.trend.map((p) => p.period)).toEqual(['2026-09-01']);
    expect(monthly.trend[0].answered).toBe(7);
  });

  it('no devuelve nada que identifique al paciente o a la atención, ni la hora', async () => {
    const result = await insights({ from: '2026-10-01', to: '2026-10-31' });
    expect(result.privacy.suppressed).toBe(false);
    expect(result.comments!.length).toBeGreaterThan(0);
    const json = JSON.stringify(result);
    const rows = (await em.getConnection().execute(
      `select patient_profile_id::text as id from surveys.survey_invitations where tenant_id = ?
       union select appointment_booking_id::text from surveys.survey_invitations where tenant_id = ?
       union select id::text from surveys.survey_responses where tenant_id = ?`,
      [tenant, tenant, tenant],
    )) as Array<{ id: string | null }>;
    expect(rows.length).toBeGreaterThan(3);
    for (const row of rows) {
      if (row.id) expect(json).not.toContain(row.id);
    }
    expect(json).not.toMatch(/patient|appointment|booking|T15:30|15:30:45/i);
  });

  it('usa un número fijo de consultas, sin importar cuántas invitaciones haya (sin N+1)', async () => {
    queries = 0;
    await insights({ from: '2026-10-01', to: '2026-10-31' });
    const small = queries;

    // Cuatro invitaciones más de D1 → mismas consultas.
    await em.transactional(async (tx) => {
      await tx.execute('set local session_replication_role = replica');
      const t = {
        versionId: ownVersionId,
        assignmentId: ownAssignmentId,
        q: (
          (await tx.execute(
            'select id, question_text from surveys.survey_questions where survey_version_id = ?',
            [ownVersionId],
          )) as Array<{ id: string; question_text: string }>
        ).reduce<Record<string, string>>((acc, r) => {
          if (r.question_text === T.global) acc.global = r.id;
          return acc;
        }, {}),
      };
      for (let i = 0; i < 4; i += 1) {
        await makeInvitation(
          tx,
          t,
          tenant,
          await makeBooking(tx, tenant, d1),
          14 + i,
          [{ key: 'global', number: 5 }],
        );
      }
    });

    queries = 0;
    const result = await insights({ from: '2026-10-01', to: '2026-10-31' });
    expect(queries).toBe(small);
    expect(small).toBe(4);
    expect(result.totals.issued).toBe(11);
    expect(ownTemplateId).toBeDefined();
    expect(sysAssignmentId).toBeDefined();
  });
});
