import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import * as entities from '../../src/modules/telemetry/entities';
import { TelemetryAnalyticsRepository } from '../../src/modules/telemetry/repositories/telemetry-analytics.repository';
import { TelemetryAnalyticsService } from '../../src/modules/telemetry/services/telemetry-analytics.service';
import { TELE } from '../../src/modules/telemetry/telemetry.concepts';

/**
 * Lectura de analítica (`/admin/analytics`) contra PostgreSQL real, con el DDL
 * canónico del módulo 28 (tablas, índices y restricciones; sin FKs cruzadas).
 *
 * Opt-in con `DATA_CATALOG_IT_DB_URL` (misma base desechable que el catálogo):
 * recrea el schema `telemetry`. Nunca contra una base compartida.
 *
 * Los datos sembrados permiten calcular a mano cada resultado esperado.
 */
const DB_URL = process.env.DATA_CATALOG_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;
const DDL = join(process.cwd(), 'database/SQL/28_telemetry');

const TENANT_A = randomUUID();
const TENANT_B = randomUUID();
const T0 = new Date('2026-09-10T10:00:00.000Z');
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);
const DAY2 = new Date('2026-09-12T10:00:00.000Z');
const WINDOW2 = {
  from: '2026-09-12T00:00:00.000Z',
  to: '2026-09-13T00:00:00.000Z',
};
const WINDOW = {
  from: '2026-09-10T00:00:00.000Z',
  to: '2026-09-11T00:00:00.000Z',
};

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return (error as { getStatus?: () => number }).getStatus?.() ?? 'threw';
  }
}

describeIfDb('Analítica web (integración, PostgreSQL real)', () => {
  let client: pg.Client;
  let orm: MikroORM;
  let service: TelemetryAnalyticsService;
  const schema = {
    view: randomUUID(),
    start: randomUUID(),
    submit: randomUUID(),
  };
  const funnelId = randomUUID();
  const journeys: string[] = [];
  let journeyB = '';
  let mixedJourney = '';

  beforeAll(async () => {
    client = new pg.Client({ connectionString: DB_URL });
    await client.connect();
    await client.query('DROP SCHEMA IF EXISTS telemetry CASCADE');
    for (const file of ['01_schema.sql', '02_tables.sql', '04_indexes.sql']) {
      await client.query(readFileSync(join(DDL, file), 'utf8'));
    }

    const q = (text: string, values: unknown[]) => client.query(text, values);
    const purpose = randomUUID();
    for (const [id, name] of [
      [schema.view, 'page_view'],
      [schema.start, 'form_started'],
      [schema.submit, 'form_submitted'],
    ]) {
      await q(
        `INSERT INTO telemetry.activity_event_schema_definitions
           (id, event_name, schema_version, purpose_definition_id, portal_type_concept_id,
            status_concept_id, effective_from, created_at)
         VALUES ($1, $2, 1, $3, $4, $5, now(), now())`,
        [id, name, purpose, TELE.PORTAL_WEB, randomUUID()],
      );
    }
    await q(
      `INSERT INTO telemetry.funnel_definitions (id, funnel_code, name, portal_type_concept_id,
         purpose_definition_id, version_number, status_concept_id, created_at, updated_at, row_version)
       VALUES ($1, 'signup', 'Alta', $2, $3, 1, $4, now(), now(), 1)`,
      [funnelId, TELE.PORTAL_WEB, purpose, randomUUID()],
    );
    for (const [n, sid] of [
      [1, schema.view],
      [2, schema.start],
      [3, schema.submit],
    ] as const) {
      await q(
        `INSERT INTO telemetry.funnel_steps (id, funnel_definition_id, step_number, event_schema_definition_id, created_at)
         VALUES ($1, $2, $3, $4, now())`,
        [randomUUID(), funnelId, n, sid],
      );
    }

    // Cinco sesiones con recorridos conocidos:
    //   A: view → start → submit           (completa)
    //   B: view → start                    (abandona en el paso 2)
    //   C: view                            (abandona en el paso 1)
    //   D: submit → view → start           (submit ANTES de view: no cuenta en el paso 3)
    //   E: start sin view                  (no entra al embudo)
    const paths: Array<Array<[string, number, string]>> = [
      [
        [schema.view, 0, '/signup'],
        [schema.start, 1, '/signup'],
        [schema.submit, 2, '/signup/done'],
      ],
      [
        [schema.view, 10, '/signup'],
        [schema.start, 11, '/signup'],
      ],
      [[schema.view, 20, '/home']],
      [
        [schema.submit, 30, '/signup/done'],
        [schema.view, 31, '/signup'],
        [schema.start, 32, '/signup'],
      ],
      [[schema.start, 40, '/signup']],
    ];
    const names = {
      [schema.view]: 'page_view',
      [schema.start]: 'form_started',
      [schema.submit]: 'form_submitted',
    };
    const seedPath = async (
      path: Array<[string, number, string]>,
      tenantId: string,
    ) => {
      const sessionId = randomUUID();
      const journeyId = randomUUID();
      let firstEventId = '';
      await q(
        `INSERT INTO telemetry.session_journeys (id, session_id, portal_type_concept_id, started_at, ended_at,
           event_count, journey_status_concept_id, created_at, updated_at, row_version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now(), 1)`,
        [
          journeyId,
          sessionId,
          TELE.PORTAL_WEB,
          at(path[0][1]),
          at(path[path.length - 1][1]),
          path.length,
          TELE.JOURNEY_CLOSED,
        ],
      );
      for (const [sid, minute, route] of path) {
        const eventId = randomUUID();
        firstEventId ||= eventId;
        await q(
          `INSERT INTO telemetry.user_activity_events (id, event_schema_definition_id, session_id,
             portal_type_concept_id, event_name, event_idempotency_key, route_template,
             occurred_at, received_at, created_at, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10)`,
          [
            eventId,
            sid,
            sessionId,
            TELE.PORTAL_WEB,
            names[sid],
            randomUUID(),
            route,
            at(minute),
            at(minute + 1),
            tenantId,
          ],
        );
        await q(
          `INSERT INTO telemetry.user_activity_event_properties (id, user_activity_event_id, property_name,
             value_type_concept_id, value_string, data_classification_concept_id, created_at)
           VALUES ($1, $2, 'email_hint', $3, 'persona@example.test', $4, now())`,
          [
            randomUUID(),
            eventId,
            TELE.VALUE_TYPE_STRING,
            TELE.DATA_CLASS_INTERNAL,
          ],
        );
      }
      return { sessionId, journeyId, firstEventId };
    };
    const seeded: Array<{
      sessionId: string;
      journeyId: string;
      firstEventId: string;
    }> = [];
    for (const path of paths) {
      const row = await seedPath(path, TENANT_A);
      seeded.push(row);
      journeys.push(row.journeyId);
    }
    // Tenant B: datos homónimos (mismos esquemas, rutas y nombres) en la misma
    // ventana. Ninguna lectura del tenant A puede verlos.
    const sessionB = await seedPath(
      [
        [schema.view, 5, '/signup'],
        [schema.start, 6, '/signup'],
        [schema.submit, 7, '/signup/done'],
      ],
      TENANT_B,
    );
    journeyB = sessionB.journeyId;
    await q(
      `INSERT INTO telemetry.client_contexts (id, session_journey_id, session_id, portal_type_concept_id,
         is_bot, data_classification_concept_id, created_at)
       VALUES ($1, $2, $3, $4, false, $5, $6), ($7, $8, $9, $4, true, $5, $6)`,
      [
        randomUUID(),
        seeded[0].journeyId,
        seeded[0].sessionId,
        TELE.PORTAL_WEB,
        TELE.DATA_CLASS_INTERNAL,
        at(0),
        randomUUID(),
        sessionB.journeyId,
        sessionB.sessionId,
      ],
    );
    // LCP: 100..1000 ms (10 muestras) en /signup. p50 = 550, p75 = 775, p95 = 955.
    for (let i = 1; i <= 10; i++) {
      await q(
        `INSERT INTO telemetry.web_vitals (id, portal_type_concept_id, route_template, metric_concept_id,
           metric_value, rating_concept_id, measured_at, created_at, user_activity_event_id)
         VALUES ($1, $2, '/signup', $3, $4, $5, $6, now(), $7)`,
        [
          randomUUID(),
          TELE.PORTAL_WEB,
          TELE.METRIC_LCP,
          i * 100,
          i <= 7 ? TELE.RATING_GOOD : TELE.RATING_POOR,
          at(i),
          seeded[0].firstEventId,
        ],
      );
    }
    // Tenant B: 4 muestras de LCP muy altas en la misma ruta.
    for (let i = 1; i <= 4; i++) {
      await q(
        `INSERT INTO telemetry.web_vitals (id, portal_type_concept_id, route_template, metric_concept_id,
           metric_value, rating_concept_id, measured_at, created_at, user_activity_event_id)
         VALUES ($1, $2, '/signup', $3, 9000, $4, $5, now(), $6)`,
        [
          randomUUID(),
          TELE.PORTAL_WEB,
          TELE.METRIC_LCP,
          TELE.RATING_POOR,
          at(i),
          sessionB.firstEventId,
        ],
      );
    }
    // Una muestra sin evento ni journey: no hay tenant demostrable, queda fuera.
    await q(
      `INSERT INTO telemetry.web_vitals (id, portal_type_concept_id, route_template, metric_concept_id,
         metric_value, rating_concept_id, measured_at, created_at)
       VALUES ($1, $2, '/signup', $3, 1, $4, $5, now())`,
      [randomUUID(), TELE.PORTAL_WEB, TELE.METRIC_LCP, TELE.RATING_GOOD, at(1)],
    );
    // Un evento con reloj adelantado (occurred 10 min después de recibido).
    await q(
      `INSERT INTO telemetry.user_activity_events (id, event_schema_definition_id, portal_type_concept_id,
         event_name, event_idempotency_key, occurred_at, received_at, created_at, tenant_id)
       VALUES ($1, $2, $3, 'page_view', $4, $5, $6, now(), $7)`,
      [
        randomUUID(),
        schema.view,
        TELE.PORTAL_MOBILE,
        randomUUID(),
        at(70),
        at(60),
        TENANT_A,
      ],
    );
    await q(
      `INSERT INTO telemetry.conversion_events (id, funnel_definition_id, analytics_subject_id, converted_at,
         created_at, session_journey_id)
             VALUES ($1, $2, $3, $4, now(), $5), ($6, $2, $7, $4, now(), $8)`,
      [
        randomUUID(),
        funnelId,
        randomUUID(),
        at(3),
        seeded[0].journeyId,
        randomUUID(),
        randomUUID(),
        sessionB.journeyId,
      ],
    );
    // Sesión que mezcla tenants (otro día): no se atribuye a ninguno.
    const mixedSession = randomUUID();
    mixedJourney = randomUUID();
    await q(
      `INSERT INTO telemetry.session_journeys (id, session_id, portal_type_concept_id, started_at, ended_at,
         event_count, journey_status_concept_id, created_at, updated_at, row_version)
       VALUES ($1, $2, $3, $4, $4, 2, $5, now(), now(), 1)`,
      [mixedJourney, mixedSession, TELE.PORTAL_WEB, DAY2, TELE.JOURNEY_CLOSED],
    );
    for (const tenantId of [TENANT_A, TENANT_B]) {
      await q(
        `INSERT INTO telemetry.user_activity_events (id, event_schema_definition_id, session_id,
           portal_type_concept_id, event_name, event_idempotency_key, route_template,
           occurred_at, received_at, created_at, tenant_id)
         VALUES ($1, $2, $3, $4, 'page_view', $5, '/mixed', $6, $6, now(), $7)`,
        [
          randomUUID(),
          schema.view,
          mixedSession,
          TELE.PORTAL_WEB,
          randomUUID(),
          DAY2,
          tenantId,
        ],
      );
    }

    orm = await MikroORM.init({
      clientUrl: DB_URL,
      entities: Object.values(entities),
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
      allowGlobalContext: true,
    });
    service = new TelemetryAnalyticsService(
      new TelemetryAnalyticsRepository(orm.em.fork()),
    );
  }, 120_000);

  afterAll(async () => {
    await orm?.close(true);
    await client?.end();
  });

  it('el embudo respeta el orden y usa la sesión como denominador', async () => {
    const report = await service.funnelReport(funnelId, WINDOW, TENANT_A);
    // Entran A, B, C, D (4). Paso 2: A, B, D (D hace start después de su view).
    // Paso 3: sólo A (el submit de D es anterior a su view).
    expect(report.denominator).toBe(4);
    expect(report.steps.map((s) => s.reached)).toEqual([4, 3, 1]);
    expect(report.steps.map((s) => s.conversionFromPrevious)).toEqual([
      null,
      0.75,
      0.3333,
    ]);
    expect(report.overallConversion).toBe(0.25);
    expect(report.serverConfirmedConversions).toBe(1);
  });

  it('fuera de la ventana el embudo es 0 con ratio null', async () => {
    const report = await service.funnelReport(
      funnelId,
      {
        from: '2026-08-01T00:00:00.000Z',
        to: '2026-08-02T00:00:00.000Z',
      },
      TENANT_A,
    );
    expect(report.denominator).toBe(0);
    expect(report.overallConversion).toBeNull();
  });

  it('el resumen cuenta eventos, sesiones y vistas, y filtra por portal', async () => {
    const all = await service.overview(WINDOW, TENANT_A);
    expect(all.totals).toMatchObject({ events: 11, sessions: 5, pageViews: 5 });
    expect(all.topRoutes[0]).toEqual({
      route: '/signup',
      events: 7,
      sessions: 4,
    });
    const mobile = await service.overview(
      { ...WINDOW, portal: 'MOBILE' },
      TENANT_A,
    );
    expect(mobile.totals).toMatchObject({ events: 1, sessions: 0 });
  });

  it('la serie por hora rellena los cubos vacíos', async () => {
    const series = await service.timeseries(
      { ...WINDOW, interval: 'hour' },
      TENANT_A,
    );
    expect(series.points).toHaveLength(24);
    expect(
      series.points.find((p) => p.bucket === '2026-09-10T10:00:00.000Z')!
        .events,
    ).toBe(10);
    expect(
      series.points.find((p) => p.bucket === '2026-09-10T11:00:00.000Z')!
        .events,
    ).toBe(1);
    expect(series.points.filter((p) => p.events > 0)).toHaveLength(2);
  });

  it('los percentiles salen de la distribución, con muestra y ratings', async () => {
    const vitals = await service.webVitals(
      { ...WINDOW, metric: 'LCP' },
      TENANT_A,
    );
    expect(vitals.metrics).toEqual([
      expect.objectContaining({
        metric: 'LCP',
        unit: 'ms',
        samples: 10,
        p50: 550,
        p75: 775,
        p95: 955,
        ratings: { GOOD: 7, POOR: 3 },
      }),
    ]);
    expect(vitals.byRoute!.routes).toEqual([
      { route: '/signup', samples: 10, p75: 775 },
    ]);
  });

  it('el timeline muestra nombres de propiedad pero nunca sus valores', async () => {
    const session = await service.getSession(journeys[0], TENANT_A);
    expect(session.events.map((e) => e.eventName)).toEqual([
      'page_view',
      'form_started',
      'form_submitted',
    ]);
    expect(session.events[0].propertyNames).toEqual(['email_hint']);
    expect(JSON.stringify(session)).not.toContain('persona@example.test');
    expect(session).not.toHaveProperty('sessionId');
  });

  it('pagina sesiones sin repetir', async () => {
    const first = await service.listSessions({ ...WINDOW, limit: 3 }, TENANT_A);
    const second = await service.listSessions(
      {
        ...WINDOW,
        limit: 3,
        cursor: first.nextCursor!,
      },
      TENANT_A,
    );
    const ids = [...first.items, ...second.items].map((s) => s.id);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(second.nextCursor).toBeNull();
  });

  it('la salud del pipeline mide lo persistido y declara lo que no mide', async () => {
    const health = await service.pipelineHealth(WINDOW, TENANT_A);
    expect(health.measured).toMatchObject({
      accepted: 11,
      clockSkewFuture: 1,
      withoutSession: 1,
    });
    expect(health.measured.ingestLagSeconds.p50).toBe(60);
    expect(health.notMeasured.map((m) => m.metric)).toEqual([
      'duplicates',
      'consentDropped',
      'rejected',
    ]);
  });

  it('una ventana de más de 92 días se rechaza con 422', async () => {
    expect(
      await statusOf(
        service.overview(
          { from: '2026-01-01T00:00:00.000Z', to: WINDOW.to },
          TENANT_A,
        ),
      ),
    ).toBe(422);
  });

  describe('aislamiento por tenant (TEL-04)', () => {
    it('Correcto: el resumen del tenant A no cuenta los datos homónimos de B', async () => {
      const a = await service.overview(WINDOW, TENANT_A);
      expect(a.totals).toMatchObject({ events: 11, sessions: 5 });
      const b = await service.overview(WINDOW, TENANT_B);
      expect(b.totals).toMatchObject({ events: 3, sessions: 1, pageViews: 1 });
      expect(b.topRoutes).toEqual([
        { route: '/signup', events: 2, sessions: 1 },
        { route: '/signup/done', events: 1, sessions: 1 },
      ]);
    });

    it('Límite: la serie de A incluye sólo sus eventos dentro de [from,to)', async () => {
      const series = await service.timeseries(
        { ...WINDOW, interval: 'hour' },
        TENANT_A,
      );
      const total = series.points.reduce((sum, p) => sum + p.events, 0);
      expect(total).toBe(11);
    });

    it('el embudo y las conversiones confirmadas son del tenant', async () => {
      const b = await service.funnelReport(funnelId, WINDOW, TENANT_B);
      expect(b.denominator).toBe(1);
      expect(b.steps.map((s) => s.reached)).toEqual([1, 1, 1]);
      expect(b.serverConfirmedConversions).toBe(1);
      const a = await service.funnelReport(funnelId, WINDOW, TENANT_A);
      expect(a.serverConfirmedConversions).toBe(1);
    });

    it('los vitales se atribuyen por su evento y los huérfanos quedan fuera', async () => {
      const a = await service.webVitals({ ...WINDOW, metric: 'LCP' }, TENANT_A);
      expect(a.metrics[0]).toMatchObject({ samples: 10, p95: 955 });
      const b = await service.webVitals({ ...WINDOW, metric: 'LCP' }, TENANT_B);
      expect(b.metrics[0]).toMatchObject({ samples: 4, p50: 9000, p95: 9000 });
    });

    it('la lista de sesiones de A no incluye la de B', async () => {
      const a = await service.listSessions({ ...WINDOW, limit: 50 }, TENANT_A);
      expect(a.items.map((i) => i.id)).not.toContain(journeyB);
      const b = await service.listSessions({ ...WINDOW, limit: 50 }, TENANT_B);
      expect(b.items.map((i) => i.id)).toEqual([journeyB]);
    });

    it('Error: A pide el timeline de la sesión de B y no obtiene timestamps, rutas ni propiedades', async () => {
      const error = await service.getSession(journeyB, TENANT_A).then(
        () => null,
        (e: { getStatus(): number; reason?: string; details?: unknown }) => e,
      );
      expect(error?.getStatus()).toBe(404);
      expect(error?.reason).toBe('TELEMETRY_SESSION_OUT_OF_SCOPE');
      expect(error?.details).toBeUndefined();
    });

    it('Falla catalogada: la sesión de B responde igual que un UUID inexistente', async () => {
      const pick = async (id: string) => {
        try {
          await service.getSession(id, TENANT_A);
        } catch (error) {
          return (error as { getResponse(): unknown }).getResponse();
        }
        throw new Error('debía rechazar');
      };
      expect(await pick(journeyB)).toEqual(await pick(randomUUID()));
    });

    it('la salud del pipeline cuenta sólo los contextos del tenant', async () => {
      const a = await service.pipelineHealth(WINDOW, TENANT_A);
      expect(a.measured).toMatchObject({
        accepted: 11,
        clientContexts: 1,
        bots: 0,
      });
      const b = await service.pipelineHealth(WINDOW, TENANT_B);
      expect(b.measured).toMatchObject({
        accepted: 3,
        clientContexts: 1,
        bots: 1,
      });
    });

    it('una sesión que mezcla tenants no se lista ni se lee para ninguno', async () => {
      for (const tenant of [TENANT_A, TENANT_B]) {
        const list = await service.listSessions(
          { ...WINDOW2, limit: 50 },
          tenant,
        );
        expect(list.items).toEqual([]);
        expect(await statusOf(service.getSession(mixedJourney, tenant))).toBe(
          404,
        );
      }
      // Los eventos sueltos sí son de su tenant: el agregado cuenta uno por cada uno.
      const a = await service.overview(WINDOW2, TENANT_A);
      expect(a.totals.events).toBe(1);
    });
  });
});
