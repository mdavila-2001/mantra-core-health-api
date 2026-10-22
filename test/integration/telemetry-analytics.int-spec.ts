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

const T0 = new Date('2026-09-10T10:00:00.000Z');
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);
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
    for (const path of paths) {
      const sessionId = randomUUID();
      const journeyId = randomUUID();
      journeys.push(journeyId);
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
        await q(
          `INSERT INTO telemetry.user_activity_events (id, event_schema_definition_id, session_id,
             portal_type_concept_id, event_name, event_idempotency_key, route_template,
             occurred_at, received_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
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
    }
    // LCP: 100..1000 ms (10 muestras) en /signup. p50 = 550, p75 = 775, p95 = 955.
    for (let i = 1; i <= 10; i++) {
      await q(
        `INSERT INTO telemetry.web_vitals (id, portal_type_concept_id, route_template, metric_concept_id,
           metric_value, rating_concept_id, measured_at, created_at)
         VALUES ($1, $2, '/signup', $3, $4, $5, $6, now())`,
        [
          randomUUID(),
          TELE.PORTAL_WEB,
          TELE.METRIC_LCP,
          i * 100,
          i <= 7 ? TELE.RATING_GOOD : TELE.RATING_POOR,
          at(i),
        ],
      );
    }
    // Un evento con reloj adelantado (occurred 10 min después de recibido).
    await q(
      `INSERT INTO telemetry.user_activity_events (id, event_schema_definition_id, portal_type_concept_id,
         event_name, event_idempotency_key, occurred_at, received_at, created_at)
       VALUES ($1, $2, $3, 'page_view', $4, $5, $6, now())`,
      [
        randomUUID(),
        schema.view,
        TELE.PORTAL_MOBILE,
        randomUUID(),
        at(70),
        at(60),
      ],
    );
    await q(
      `INSERT INTO telemetry.conversion_events (id, funnel_definition_id, analytics_subject_id, converted_at, created_at)
             VALUES ($1, $2, $3, $4, now())`,
      [randomUUID(), funnelId, randomUUID(), at(3)],
    );

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
    const report = await service.funnelReport(funnelId, WINDOW);
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
    const report = await service.funnelReport(funnelId, {
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-02T00:00:00.000Z',
    });
    expect(report.denominator).toBe(0);
    expect(report.overallConversion).toBeNull();
  });

  it('el resumen cuenta eventos, sesiones y vistas, y filtra por portal', async () => {
    const all = await service.overview(WINDOW);
    expect(all.totals).toMatchObject({ events: 11, sessions: 5, pageViews: 5 });
    expect(all.topRoutes[0]).toEqual({
      route: '/signup',
      events: 7,
      sessions: 4,
    });
    const mobile = await service.overview({ ...WINDOW, portal: 'MOBILE' });
    expect(mobile.totals).toMatchObject({ events: 1, sessions: 0 });
  });

  it('la serie por hora rellena los cubos vacíos', async () => {
    const series = await service.timeseries({ ...WINDOW, interval: 'hour' });
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
    const vitals = await service.webVitals({ ...WINDOW, metric: 'LCP' });
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
    const session = await service.getSession(journeys[0]);
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
    const first = await service.listSessions({ ...WINDOW, limit: 3 });
    const second = await service.listSessions({
      ...WINDOW,
      limit: 3,
      cursor: first.nextCursor!,
    });
    const ids = [...first.items, ...second.items].map((s) => s.id);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(second.nextCursor).toBeNull();
  });

  it('la salud del pipeline mide lo persistido y declara lo que no mide', async () => {
    const health = await service.pipelineHealth(WINDOW);
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
        service.overview({ from: '2026-01-01T00:00:00.000Z', to: WINDOW.to }),
      ),
    ).toBe(422);
  });
});
