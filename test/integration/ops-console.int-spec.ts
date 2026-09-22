import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import * as dataCatalogEntities from '../../src/modules/data_catalog/entities';
import { OpsConsoleRepository } from '../../src/modules/ops_console/ops-console.repository';
import { OpsConsoleService } from '../../src/modules/ops_console/ops-console.service';
import { SYSOPS } from '../../src/modules/system_ops/system_ops.concepts';
import { CONCEPTS } from '../../src/common';

/**
 * Consola de operación contra PostgreSQL real con el DDL canónico de los
 * módulos 11, 36 y 46 y los patches 67/68. El escenario sembrado tiene una
 * respuesta conocida: un incidente crítico abierto y una restauración que
 * excede su RTO deben dejar la plataforma NOT_READY, con la evidencia exacta.
 *
 * Opt-in con `DATA_CATALOG_IT_DB_URL` (base desechable).
 */
const DB_URL = process.env.DATA_CATALOG_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;
const root = process.cwd();
const ddl = (module: string, file: string) =>
  readFileSync(join(root, 'database/SQL', module, file), 'utf8');

describeIfDb('Consola de operación y readiness (integración real)', () => {
  let client: pg.Client;
  let orm: MikroORM;
  let service: OpsConsoleService;
  const ids = {
    component: randomUUID(),
    incident: randomUUID(),
    policy: randomUUID(),
    test: randomUUID(),
    slo: randomUUID(),
    sli: randomUUID(),
  };
  const sql = (text: string, values: unknown[] = []) =>
    client.query(text, values);
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

  beforeAll(async () => {
    client = new pg.Client({ connectionString: DB_URL });
    await client.connect();
    await sql(
      'DROP SCHEMA IF EXISTS platform_ops, system_ops, qa_execution, qa_lab, data_catalog CASCADE',
    );
    await sql(
      'CREATE SCHEMA IF NOT EXISTS iam; CREATE TABLE IF NOT EXISTS iam.users (id uuid PRIMARY KEY)',
    );
    for (const module of ['46_platform_ops', '11_system_ops', '36_qa_lab']) {
      for (const file of ['01_schema.sql', '02_tables.sql', '04_indexes.sql']) {
        await sql(ddl(module, file));
      }
    }
    await sql(
      readFileSync(
        join(root, 'database/SQL/patches/2026-09-18_v4219_data_catalog.sql'),
        'utf8',
      ),
    );
    await sql(
      readFileSync(
        join(root, 'database/SQL/patches/2026-09-18_v4220_qa_execution.sql'),
        'utf8',
      ),
    );

    await sql(
      `INSERT INTO platform_ops.service_components (id, code, name, component_type_concept_id, state_concept_id, created_at, updated_at, row_version)
       VALUES ($1, 'api', 'API de salud', $2, $3, now(), now(), 1)`,
      [ids.component, randomUUID(), CONCEPTS.STATE_ACTIVE],
    );
    // Un incidente crítico abierto y uno menor ya resuelto.
    await sql(
      `INSERT INTO platform_ops.health_incidents (id, service_component_id, incident_number, severity_concept_id,
         status_concept_id, title, opened_at, created_at, updated_at, row_version)
       VALUES ($1, $2, 'INC-0001', $3, $4, 'Latencia de la agenda', $5, now(), now(), 1),
              ($6, $2, 'INC-0002', $7, $8, 'Aviso resuelto', $5, now(), now(), 1)`,
      [
        ids.incident,
        ids.component,
        CONCEPTS.INCIDENT_SEV_CRITICAL,
        CONCEPTS.INCIDENT_ACKNOWLEDGED,
        hoursAgo(2),
        randomUUID(),
        CONCEPTS.INCIDENT_SEV_LOW,
        CONCEPTS.INCIDENT_RESOLVED,
      ],
    );
    await sql(
      `INSERT INTO platform_ops.incident_timeline_events (id, health_incident_id, occurred_at, event_type_concept_id, summary, created_at)
       VALUES ($1, $2, $3, $4, 'Incidente abierto por health check', now())`,
      [randomUUID(), ids.incident, hoursAgo(2), randomUUID()],
    );
    // Política de backup con restauración reciente pero fuera de RTO.
    await sql(
      `INSERT INTO system_ops.backup_policies (id, tenant_id, resource_scope_concept_id, backup_type_concept_id,
         rpo_seconds, rto_seconds, restore_test_frequency_days, status_concept_id, created_at, updated_at, row_version)
       VALUES ($1, $2, $3, $4, 900, 3600, 30, $5, now(), now(), 1)`,
      [
        ids.policy,
        randomUUID(),
        randomUUID(),
        randomUUID(),
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    await sql(
      `INSERT INTO system_ops.restore_test_runs (id, backup_policy_id, outcome_concept_id, measured_rpo_seconds,
         measured_rto_seconds, integrity_check_passed, started_at, finished_at)
       VALUES ($1, $2, $3, 600, 7200, true, $4, $5)`,
      [
        ids.test,
        ids.policy,
        SYSOPS.RESTORE_OUTCOME_PASS,
        hoursAgo(26),
        hoursAgo(24),
      ],
    );

    orm = await MikroORM.init({
      clientUrl: DB_URL,
      entities: Object.values(dataCatalogEntities),
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
      allowGlobalContext: true,
    });
    service = new OpsConsoleService(new OpsConsoleRepository(orm.em.fork()));
  }, 120_000);

  afterAll(async () => {
    await orm?.close(true);
    await client?.end();
  });

  it('incidentes: filtra los vivos, con título y códigos legibles', async () => {
    const open = await service.listIncidents({ open: true });
    expect(open).toEqual([
      expect.objectContaining({
        number: 'INC-0001',
        title: 'Latencia de la agenda',
        severity: 'INC_SEV1',
        status: 'INC_ACK',
        component: { code: 'api', name: 'API de salud' },
      }),
    ]);
    expect(await service.listIncidents({})).toHaveLength(2);
    const detail = await service.getIncident(ids.incident);
    expect(detail.timeline).toHaveLength(1);
  });

  it('backups: última restauración con sus mediciones', async () => {
    expect(await service.listBackups()).toEqual([
      expect.objectContaining({
        policyId: ids.policy,
        rtoSeconds: 3600,
        lastRestoreTest: expect.objectContaining({
          outcome: 'PASS',
          measuredRtoSeconds: 7200,
        }),
      }),
    ]);
  });

  it('readiness: NOT_READY con la evidencia exacta, sin promediar', async () => {
    const readiness = await service.readiness();
    const byCode = Object.fromEntries(
      readiness.controls.map((c) => [c.code, c]),
    );
    expect(readiness.status).toBe('NOT_READY');
    expect(readiness.blockingFailures.sort()).toEqual([
      'NO_OPEN_SEVERE_INCIDENTS',
      'RESTORE_TESTED',
    ]);
    expect(byCode.RESTORE_TESTED.reason).toContain('RTO excedido');
    expect(byCode.NO_OPEN_SEVERE_INCIDENTS.evidence[0].detail).toContain(
      'INC-0001',
    );
    // Sin SLO activos no se afirma nada: UNKNOWN, no PASS.
    expect(byCode.SLO_ATTAINED.status).toBe('UNKNOWN');
    expect(byCode.QA_GATE.status).toBe('NOT_APPLICABLE');
    expect(byCode.DATA_CATALOG_REVIEWED).toMatchObject({
      status: 'UNKNOWN',
      blocking: false,
    });
  });

  it('resolver el incidente y arreglar la restauración deja sólo lo desconocido', async () => {
    await sql(
      `UPDATE platform_ops.health_incidents SET status_concept_id = $1 WHERE id = $2`,
      [CONCEPTS.INCIDENT_RESOLVED, ids.incident],
    );
    await sql(
      `UPDATE system_ops.restore_test_runs SET measured_rto_seconds = 1800 WHERE id = $1`,
      [ids.test],
    );
    const readiness = await service.readiness();
    // SLO sigue sin medición: bloquea por desconocido, no aprueba.
    expect(readiness).toMatchObject({
      status: 'BLOCKED_BY_UNKNOWN',
      blockingFailures: [],
      blockingUnknown: ['SLO_ATTAINED'],
    });
  });

  it('con un SLO medido y cumplido, queda READY', async () => {
    await sql(
      `INSERT INTO platform_ops.service_level_indicators (id, service_component_id, code, name, indicator_type_concept_id, query_definition_json, unit_concept_id, state_concept_id, created_at, updated_at, row_version)
       VALUES ($1, $2, 'availability', 'Disponibilidad', $3, '{}', $4, $5, now(), now(), 1)`,
      [
        ids.sli,
        ids.component,
        randomUUID(),
        randomUUID(),
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    await sql(
      `INSERT INTO platform_ops.service_level_objectives (id, service_level_indicator_id, code, target_value, rolling_window_seconds,
         effective_from, state_concept_id, created_at, updated_at, row_version)
       VALUES ($1, $2, 'availability-30d', 0.999, 2592000, now() - interval '30 days', $3, now(), now(), 1)`,
      [ids.slo, ids.sli, CONCEPTS.STATE_ACTIVE],
    );
    await sql(
      `INSERT INTO platform_ops.slo_measurements (id, service_level_objective_id, measured_at, window_start, window_end,
         good_events, total_events, attained_value, status_concept_id, created_at)
       VALUES ($1, $2, $3, $4, $3, 99950, 100000, 0.9995, $5, now())`,
      [randomUUID(), ids.slo, hoursAgo(1), hoursAgo(721), CONCEPTS.SLO_PASS],
    );
    const slos = await service.listSlos();
    expect(slos[0].lastMeasurement).toMatchObject({
      status: 'SLO_PASS',
      goodEvents: 99950,
      totalEvents: 100000,
    });
    expect((await service.readiness()).status).toBe('READY');
  });
});
