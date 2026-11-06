import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import * as entities from '../../src/modules/marketing/entities';
import { InsightsFactsRepository } from '../../src/modules/marketing/repositories/insights-facts.repository';
import { InsightsWorkflowRepository } from '../../src/modules/marketing/repositories/insights-workflow.repository';
import { InsightsWorkspaceRepository } from '../../src/modules/marketing/repositories/insights-workspace.repository';
import { InsightsFactsService } from '../../src/modules/marketing/services/insights-facts.service';
import { InsightsWorkflowService } from '../../src/modules/marketing/services/insights-workflow.service';
import { InsightsWorkspaceService } from '../../src/modules/marketing/services/insights-workspace.service';

/**
 * Flujo de trabajo de AloVida Insights (alertas, reglas, preferencias, vistas e
 * informes) contra PostgreSQL real, con el DDL canónico del módulo 50.
 *
 * Opt-in con `DATA_CATALOG_IT_DB_URL`. Recrea el schema `marketing` y un stub
 * mínimo de `terminology` (catalog_concepts, value_sets, value_set_versions,
 * value_set_members): la base debe ser DESECHABLE y sin la terminología real.
 * Nunca contra una base compartida. No se aplican `90_fk_deferred.sql` (FKs
 * hacia `iam` y `terminology`), así que los usuarios son uuid sueltos.
 */
const DB_URL = process.env.DATA_CATALOG_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;
const DDL = join(process.cwd(), 'database/SQL/50_marketing');

const id = () => randomUUID();
const NOW = '2026-10-29T23:00:00Z';

const STATUSES = ['NEW', 'SEEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'];
const SEVERITIES = ['CRITICAL', 'RISK', 'ANOMALY', 'OPPORTUNITY'];

const failure = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return null;
  } catch (error) {
    const e = error as { getStatus?: () => number; reason?: string };
    return { status: e.getStatus?.() ?? 'threw', reason: e.reason };
  }
};

describeIfDb(
  'AloVida Insights · flujo de trabajo (integración, PostgreSQL real)',
  () => {
    let client: pg.Client;
    let orm: MikroORM;
    let workflow: InsightsWorkflowService;
    let workspace: InsightsWorkspaceService;

    const A = { id: id(), roles: ['MARKETING_MANAGER'] } as any;
    const B = { id: id(), roles: ['MARKETING_MANAGER'] } as any;
    const q = (text: string, values: unknown[] = []) =>
      client.query(text, values);
    const count = async (
      table: string,
      where = 'true',
      values: unknown[] = [],
    ) =>
      Number(
        (
          await q(
            `SELECT count(*)::int AS n FROM marketing.${table} WHERE ${where}`,
            values,
          )
        ).rows[0].n,
      );

    const snapshot = {
      severity: 'critical' as const,
      title: 'El CAC subió',
      whatText: 'El costo por adquisición superó el umbral de la regla.',
      detectedOn: '2026-10-29',
      moduleCode: 'campaigns',
      priority: 2,
    };
    const workflowBody = (over: Record<string, unknown> = {}) =>
      ({
        status: 'in_progress',
        ownerTeam: 'marketing',
        snapshot,
        ...over,
      }) as any;
    const uuid = (n: number) =>
      `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
    const report = (n: number) =>
      ({
        title: `Informe ${n}`,
        type: 'executive',
        audience: 'direction',
        periodFrom: '2026-10-01',
        periodTo: '2026-10-29',
        campaignIds: ['c1'],
        channels: ['google'],
        sections: ['summary'],
      }) as any;

    beforeAll(async () => {
      client = new pg.Client({ connectionString: DB_URL });
      await client.connect();

      await client.query('CREATE SCHEMA IF NOT EXISTS terminology');
      const real = await client.query(
        `SELECT count(*)::int AS n FROM information_schema.columns
        WHERE table_schema = 'terminology' AND table_name = 'catalog_concepts'
          AND column_name NOT IN ('id', 'code')`,
      );
      if (real.rows[0].n > 0) {
        throw new Error(
          'terminology.catalog_concepts es la tabla real: use una base desechable sin ella.',
        );
      }
      await client.query(`
      DROP TABLE IF EXISTS terminology.value_set_members, terminology.value_set_versions,
                           terminology.value_sets, terminology.catalog_concepts;
      CREATE TABLE terminology.catalog_concepts (id uuid PRIMARY KEY, code varchar NOT NULL);
      CREATE TABLE terminology.value_sets (id uuid PRIMARY KEY, internal_code varchar NOT NULL);
      CREATE TABLE terminology.value_set_versions (id uuid PRIMARY KEY, value_set_id uuid NOT NULL);
      CREATE TABLE terminology.value_set_members (
        id uuid PRIMARY KEY, value_set_version_id uuid NOT NULL, concept_id uuid NOT NULL,
        included boolean NOT NULL);`);
      for (const [set, codes] of [
        ['VS_INSIGHTS_ALERT_STATUS', STATUSES],
        ['VS_INSIGHTS_ALERT_SEVERITY', SEVERITIES],
      ] as const) {
        const setId = id();
        const versionId = id();
        await q('INSERT INTO terminology.value_sets VALUES ($1, $2)', [
          setId,
          set,
        ]);
        await q('INSERT INTO terminology.value_set_versions VALUES ($1, $2)', [
          versionId,
          setId,
        ]);
        for (const code of codes) {
          const conceptId = id();
          await q('INSERT INTO terminology.catalog_concepts VALUES ($1, $2)', [
            conceptId,
            code,
          ]);
          await q(
            'INSERT INTO terminology.value_set_members VALUES ($1, $2, $3, true)',
            [id(), versionId, conceptId],
          );
        }
      }

      await client.query('DROP SCHEMA IF EXISTS marketing CASCADE');
      for (const file of [
        '01_schema.sql',
        '02_tables.sql',
        '03_fk_intra.sql',
        '04_indexes.sql',
      ]) {
        await client.query(readFileSync(join(DDL, file), 'utf8'));
      }

      const severity = async (code: string) =>
        (
          await q(
            'SELECT id FROM terminology.catalog_concepts WHERE code = $1',
            [code],
          )
        ).rows[0].id;
      for (const [code, sev, threshold] of [
        ['cac', 'CRITICAL', 100],
        ['ctrdrop', 'RISK', 20],
      ] as const) {
        await q(
          `INSERT INTO marketing.insights_alert_rules
           (id, code, name, severity_concept_id, unit, default_threshold, threshold, direction,
            enabled, created_at, updated_at, row_version)
         VALUES ($1, $2, $3, $4, '%', $5, $5, '+', true, $6, $6, 1)`,
          [id(), code, `Regla ${code}`, await severity(sev), threshold, NOW],
        );
      }

      orm = await MikroORM.init({
        clientUrl: DB_URL,
        entities: Object.values(entities),
        metadataProvider: TsMorphMetadataProvider,
        metadataCache: { enabled: false },
        allowGlobalContext: true,
      });
      const facts = new InsightsFactsService(
        new InsightsFactsRepository(orm.em.fork()),
      );
      workflow = new InsightsWorkflowService(
        new InsightsWorkflowRepository(orm.em.fork()),
        facts,
      );
      workspace = new InsightsWorkspaceService(
        new InsightsWorkspaceRepository(orm.em.fork()),
        facts,
      );
    }, 120_000);

    afterAll(async () => {
      await orm?.close(true);
      await client?.end();
    });

    describe('alertas', () => {
      const FP = 'cac:c1:2026-10-29';

      it('PUT crea la alerta desde el snapshot: 1 fila en insights_alerts y 1 transición new → in_progress', async () => {
        const { data, meta } = await workflow.putWorkflow(
          FP,
          workflowBody(),
          undefined,
          A,
        );
        expect(data).toMatchObject({
          fingerprint: FP,
          status: 'in_progress',
          ownerTeam: 'marketing',
          rowVersion: 1,
        });
        expect(meta.dataset).toBe('demo');

        const row = (
          await q(
            'SELECT * FROM marketing.insights_alerts WHERE fingerprint = $1',
            [FP],
          )
        ).rows[0];
        expect(row).toMatchObject({
          title: 'El CAC subió',
          module_code: 'campaigns',
          priority: 2,
          owner_team_code: 'marketing',
          row_version: 1,
          created_by_user_id: A.id,
        });
        expect(row.code).toMatch(/^A-[0-9A-F]{10}$/);
        expect(
          String(row.detected_on.toISOString?.() ?? row.detected_on),
        ).toContain('2026-10-2');
        expect(await count('insights_alerts')).toBe(1);

        const transitions = (
          await q(
            `SELECT lower(fs.code) AS f, lower(ts.code) AS t, t.from_owner_team_code AS fo,
                  t.to_owner_team_code AS "to", t.recorded_by_user_id AS by
             FROM marketing.insights_alert_transitions t
             LEFT JOIN terminology.catalog_concepts fs ON fs.id = t.from_status_concept_id
             JOIN terminology.catalog_concepts ts ON ts.id = t.to_status_concept_id
            WHERE t.alert_id = $1`,
            [row.id],
          )
        ).rows;
        expect(transitions).toEqual([
          { f: 'new', t: 'in_progress', fo: null, to: 'marketing', by: A.id },
        ]);
      });

      it('el mismo PUT repetido (sin cambio) NO suma transición ni sube la versión', async () => {
        const { data } = await workflow.putWorkflow(FP, workflowBody(), '1', A);
        expect(data.rowVersion).toBe(1);
        expect(await count('insights_alert_transitions')).toBe(1);
      });

      it('PUT con If-Match vigente sube a 2 y deja la 2.ª transición; con el If-Match viejo → 412 y nada cambia', async () => {
        const { data } = await workflow.putWorkflow(
          FP,
          workflowBody({ status: 'resolved', note: 'cerrada' }),
          '1',
          B,
        );
        expect(data).toMatchObject({ status: 'resolved', rowVersion: 2 });
        expect(
          data.transitions.map((t) => [t.fromStatus, t.toStatus, t.note]),
        ).toEqual([
          ['new', 'in_progress', null],
          ['in_progress', 'resolved', 'cerrada'],
        ]);
        expect(await count('insights_alert_transitions')).toBe(2);

        expect(
          await failure(
            workflow.putWorkflow(
              FP,
              workflowBody({ status: 'dismissed' }),
              '1',
              A,
            ),
          ),
        ).toEqual({
          status: 412,
          reason: 'MARKETING_INSIGHTS_VERSION_MISMATCH',
        });
        expect(
          await failure(
            workflow.putWorkflow(
              FP,
              workflowBody({ status: 'dismissed' }),
              undefined,
              A,
            ),
          ),
        ).toMatchObject({ status: 412 });
        const row = (
          await q(
            'SELECT row_version FROM marketing.insights_alerts WHERE fingerprint = $1',
            [FP],
          )
        ).rows[0];
        expect(row.row_version).toBe(2);
        expect(await count('insights_alert_transitions')).toBe(2);
      });

      it('«dismissed» se persiste y se lee de vuelta con todo el historial (recarga → UI)', async () => {
        await workflow.putWorkflow(
          FP,
          workflowBody({ status: 'dismissed', ownerTeam: null }),
          '2',
          A,
        );
        const { data } = await workflow.listWorkflow();
        expect(data).toHaveLength(1);
        expect(data[0]).toMatchObject({
          fingerprint: FP,
          status: 'dismissed',
          ownerTeam: null,
          rowVersion: 3,
        });
        expect(data[0].transitions).toHaveLength(3);
        expect(data[0].transitions[2]).toMatchObject({
          fromStatus: 'resolved',
          toStatus: 'dismissed',
          fromOwner: 'marketing',
          toOwner: null,
        });
      });

      it('dos altas simultáneas de la misma alerta: una gana (v1) y la otra recibe 412; una sola fila', async () => {
        const fp = 'carrera:1';
        const results = await Promise.allSettled([
          workflow.putWorkflow(fp, workflowBody(), undefined, A),
          workflow.putWorkflow(
            fp,
            workflowBody({ status: 'resolved' }),
            undefined,
            B,
          ),
        ]);
        const ok = results.filter((r) => r.status === 'fulfilled');
        const bad = results.filter(
          (r) => r.status === 'rejected',
        ) as PromiseRejectedResult[];
        expect(ok).toHaveLength(1);
        expect(bad).toHaveLength(1);
        expect(bad[0].reason.getStatus()).toBe(412);
        expect(await count('insights_alerts', 'fingerprint = $1', [fp])).toBe(
          1,
        );
      });
    });

    describe('reglas', () => {
      it('PATCH cambia umbral y versión; If-Match viejo → 412; umbral fuera de rango → 422; sin If-Match → 428', async () => {
        const { data } = await workflow.patchRule(
          'cac',
          { threshold: 150 },
          '1',
          A,
        );
        expect(data).toMatchObject({
          code: 'cac',
          threshold: 150,
          defaultThreshold: 100,
          rowVersion: 2,
          severity: 'critical',
        });
        expect(
          await failure(workflow.patchRule('cac', { enabled: false }, '1', A)),
        ).toEqual({
          status: 412,
          reason: 'MARKETING_INSIGHTS_VERSION_MISMATCH',
        });
        expect(
          await failure(workflow.patchRule('cac', { threshold: 501 }, '2', A)),
        ).toEqual({
          status: 422,
          reason: 'MARKETING_INSIGHTS_RULE_THRESHOLD_OUT_OF_RANGE',
        });
        expect(
          await failure(workflow.patchRule('cac', { threshold: 0 }, '2', A)),
        ).toMatchObject({ status: 422 });
        expect(
          await failure(
            workflow.patchRule('cac', { enabled: false }, undefined, A),
          ),
        ).toMatchObject({ status: 428 });
        const stored = (
          await q(
            `SELECT threshold::float8 AS threshold, enabled, row_version, updated_by_user_id FROM marketing.insights_alert_rules WHERE code = 'cac'`,
          )
        ).rows[0];
        expect(stored).toEqual({
          threshold: 150,
          enabled: true,
          row_version: 2,
          updated_by_user_id: A.id,
        });
      });

      it('lista las reglas guardadas', async () => {
        const { data } = await workflow.listRules();
        expect(data.map((r) => [r.code, r.threshold, r.enabled])).toEqual([
          ['cac', 150, true],
          ['ctrdrop', 20, true],
        ]);
      });
    });

    describe('vistas guardadas', () => {
      it('PUT dos veces con el mismo id = UNA fila; el nombre repetido en otro id → 409; DELETE idempotente', async () => {
        const view = {
          name: 'Mi vista',
          url: '/insights/campaigns?c=c1&p=30d',
        };
        const first = await workspace.putSavedView(uuid(1), view, A);
        const second = await workspace.putSavedView(uuid(1), view, A);
        expect(first.data).toEqual(second.data);
        expect(second.data).toMatchObject({
          id: uuid(1),
          url: view.url,
          rowVersion: 1,
        });
        expect(
          await count('insights_saved_views', 'user_id = $1', [A.id]),
        ).toBe(1);
        const row = (
          await q(
            'SELECT module_code, filters_json FROM marketing.insights_saved_views WHERE id = $1',
            [uuid(1)],
          )
        ).rows[0];
        expect(row).toEqual({
          module_code: 'campaigns',
          filters_json: { url: view.url },
        });

        expect(
          await failure(
            workspace.putSavedView(
              uuid(2),
              { ...view, url: '/insights/funnel' },
              A,
            ),
          ),
        ).toEqual({
          status: 409,
          reason: 'MARKETING_INSIGHTS_VIEW_NAME_TAKEN',
        });
        expect(await count('insights_saved_views')).toBe(1);

        const renamed = await workspace.putSavedView(
          uuid(1),
          { name: 'Renombrada', url: view.url },
          A,
        );
        expect(renamed.data.rowVersion).toBe(2);

        await workspace.deleteSavedView(uuid(1), A);
        await workspace.deleteSavedView(uuid(1), A);
        expect(await count('insights_saved_views')).toBe(0);
      });

      it('aislamiento: B no ve, no pisa (404) y no borra las vistas de A; el mismo nombre en B es válido', async () => {
        await workspace.putSavedView(
          uuid(10),
          { name: 'De A', url: '/insights' },
          A,
        );
        expect((await workspace.listSavedViews(B)).data).toEqual([]);
        expect(
          await failure(
            workspace.putSavedView(
              uuid(10),
              { name: 'Robada', url: '/insights' },
              B,
            ),
          ),
        ).toEqual({
          status: 404,
          reason: 'MARKETING_INSIGHTS_RESOURCE_NOT_AVAILABLE',
        });
        await workspace.deleteSavedView(uuid(10), B);
        expect(
          (await workspace.listSavedViews(A)).data.map((v) => v.name),
        ).toEqual(['De A']);
        await workspace.putSavedView(
          uuid(11),
          { name: 'De A', url: '/insights' },
          B,
        );
        expect(await count('insights_saved_views')).toBe(2);
      });
    });

    describe('informes', () => {
      it('el 13.º informe expulsa el 1.º: quedan 12, el más nuevo primero', async () => {
        for (let n = 1; n <= 12; n += 1)
          await workspace.putReport(uuid(100 + n), report(n), A);
        expect(await count('insights_reports', 'user_id = $1', [A.id])).toBe(
          12,
        );
        await workspace.putReport(uuid(113), report(13), A);
        const { data } = await workspace.listReports(A);
        expect(data).toHaveLength(12);
        expect(data.map((r) => r.id)).not.toContain(uuid(101));
        expect(data[0].id).toBe(uuid(113));
        expect(data[11].id).toBe(uuid(102));
        expect(data[0]).toMatchObject({
          title: 'Informe 13',
          channels: ['google'],
          periodFrom: '2026-10-01',
          rowVersion: 1,
        });
        expect(await count('insights_reports', 'id = $1', [uuid(101)])).toBe(0);
      });

      it('repetir un PUT no duplica; tres altas simultáneas con el usuario en el límite dejan exactamente 12', async () => {
        await workspace.putReport(uuid(113), report(13), A);
        expect(await count('insights_reports', 'user_id = $1', [A.id])).toBe(
          12,
        );
        await Promise.all(
          [114, 115, 116].map((n) =>
            workspace.putReport(uuid(n), report(n), A),
          ),
        );
        expect(await count('insights_reports', 'user_id = $1', [A.id])).toBe(
          12,
        );
        const ids = (await workspace.listReports(A)).data.map((r) => r.id);
        expect(ids.slice(0, 3).sort()).toEqual([
          uuid(114),
          uuid(115),
          uuid(116),
        ]);
      });

      it('aislamiento: los informes de B no cuentan para A, y B no puede pisar ni borrar los de A', async () => {
        await workspace.putReport(uuid(200), report(200), B);
        expect((await workspace.listReports(B)).data.map((r) => r.id)).toEqual([
          uuid(200),
        ]);
        expect(await count('insights_reports', 'user_id = $1', [A.id])).toBe(
          12,
        );
        expect(
          await failure(workspace.putReport(uuid(116), report(1), B)),
        ).toMatchObject({ status: 404 });
        await workspace.deleteReport(uuid(116), B);
        expect(await count('insights_reports', 'id = $1', [uuid(116)])).toBe(1);
        await workspace.deleteReport(uuid(116), A);
        expect(await count('insights_reports', 'id = $1', [uuid(116)])).toBe(0);
      });
    });

    describe('preferencias', () => {
      const prefs = {
        matrix: {
          critical: ['app', 'mail'],
          risk: ['app'],
          anomaly: [],
          opportunity: [],
        },
        frequency: 'daily_digest',
        digestHour: 9,
        quietFrom: '22:00',
        quietTo: '07:00',
        quietExemptCritical: false,
      } as any;

      it('sin fila: valores por defecto con rowVersion 0; alta sin If-Match; edición con If-Match; 412 con el viejo', async () => {
        expect(
          (await workspace.getNotificationPreferences(A)).data.rowVersion,
        ).toBe(0);
        const created = await workspace.putNotificationPreferences(
          prefs,
          undefined,
          A,
        );
        expect(created.data).toMatchObject({
          rowVersion: 1,
          frequency: 'daily_digest',
          digestHour: 9,
          quietFrom: '22:00',
          quietTo: '07:00',
          nothingIsSent: true,
        });
        expect(created.data.matrix.critical).toEqual(['app', 'mail']);
        const changed = await workspace.putNotificationPreferences(
          { ...prefs, digestHour: 10 },
          '1',
          A,
        );
        expect(changed.data).toMatchObject({ rowVersion: 2, digestHour: 10 });
        expect(
          await failure(workspace.putNotificationPreferences(prefs, '1', A)),
        ).toMatchObject({ status: 412 });
        expect(await count('insights_notification_preferences')).toBe(1);
      });

      it('aislamiento: B no ve las de A, parte de cero y crea su propia fila', async () => {
        expect(
          (await workspace.getNotificationPreferences(B)).data,
        ).toMatchObject({ rowVersion: 0, frequency: 'immediate' });
        await workspace.putNotificationPreferences(
          { ...prefs, frequency: 'immediate' },
          undefined,
          B,
        );
        expect(await count('insights_notification_preferences')).toBe(2);
        expect(
          (await workspace.getNotificationPreferences(A)).data.frequency,
        ).toBe('daily_digest');
      });

      it('preferencias de interfaz: alta, edición con versión y aislamiento', async () => {
        const ui = {
          density: 'compact',
          theme: 'dark',
          navCollapsed: true,
          timezone: 'America/La_Paz',
        } as any;
        expect((await workspace.getUserPreferences(A)).data).toMatchObject({
          rowVersion: 0,
          theme: 'system',
        });
        await workspace.putUserPreferences(ui, undefined, A);
        const next = await workspace.putUserPreferences(
          { ...ui, theme: 'light' },
          '1',
          A,
        );
        expect(next.data).toMatchObject({
          theme: 'light',
          density: 'compact',
          timezone: 'America/La_Paz',
          rowVersion: 2,
        });
        expect(
          await failure(workspace.putUserPreferences(ui, '1', A)),
        ).toMatchObject({ status: 412 });
        expect((await workspace.getUserPreferences(B)).data).toMatchObject({
          rowVersion: 0,
          density: 'comfortable',
        });
      });
    });
  },
);
