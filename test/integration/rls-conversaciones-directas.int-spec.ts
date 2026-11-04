import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

/**
 * v4.2.87 — direct conversations (`tenant_id` NULL) under REAL RLS.
 *
 * Applies `2026-08-05_tenant_rls.sql` and `2026-11-04_v4287_conversaciones_
 * directas_rls.sql` and shows, connected AS `mantra_app` (no BYPASSRLS), with
 * the tenant of a request set:
 *   1. The direct conversation that `createDirectConversation` writes (no
 *      tenant) can be inserted, read back and updated. Before the patch the
 *      INSERT failed the WITH CHECK and the chat answered 500.
 *   2. A conversation of another tenant stays invisible and untouchable.
 *   3. A tenant-less conversation cannot be moved into another tenant.
 *
 * Opt-in (`RLS_TEST=1`), like `rls.int-spec.ts`. Needs the base model applied
 * (`database/SQL/apply_all.sql`). Inserts and deletes only its own rows.
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};
const BOOTSTRAP_LOCAL_ROLE = process.env.RLS_TEST_BOOTSTRAP_LOCAL_ROLE === '1';
const APP = {
  ...ADMIN,
  user: process.env.DB_APP_USER ?? 'mantra_app',
  password:
    process.env.DB_APP_PASSWORD ??
    (BOOTSTRAP_LOCAL_ROLE ? 'mantra_app_dev' : undefined),
};

const describeRls = process.env.RLS_TEST === '1' ? describe : describe.skip;

const TENANT_A = '11111111-1111-4111-8111-1111111187a1';
const TENANT_B = '22222222-2222-4222-8222-2222222287b2';
const DIRECT = 'c0a20000-0000-4000-8000-000000004287';
const OTHER_TENANT = 'c0a20000-0000-4000-8000-0000000042b2';
const CONCEPT = 'c0a20000-0000-4000-8000-0000000042cc';
const IDS = [DIRECT, OTHER_TENANT];
/** Whether this suite inserted `CONCEPT` (the seed may not have it). */
let insertedConcept = false;

const insertConversation = (id: string, tenantId: string | null) => ({
  text: `INSERT INTO community.conversations
         (id, tenant_id, conversation_type_concept_id, message_count,
          status_concept_id, created_at, updated_at)
       VALUES ($1, $2, $3, 0, $3, now(), now())`,
  values: [id, tenantId, CONCEPT],
});

describeRls(
  'RLS · conversaciones directas sin tenant (v4.2.87, DB real)',
  () => {
    let admin: pg.Client;
    let app: pg.Client;

    /** Runs `work` as `mantra_app` with tenant A set, in a transaction always rolled back. */
    async function asTenantA<T>(work: () => Promise<T>): Promise<T> {
      await app.query('BEGIN');
      try {
        await app.query(
          "SELECT set_config('app.system_context', 'false', true)",
        );
        await app.query(
          "SELECT set_config('app.current_tenant_id', $1, true)",
          [TENANT_A],
        );
        return await work();
      } finally {
        await app.query('ROLLBACK');
      }
    }

    async function cleanup(): Promise<void> {
      await admin.query(
        'DELETE FROM community.conversations WHERE id = ANY($1)',
        [IDS],
      );
      if (insertedConcept) {
        await admin.query(
          'DELETE FROM terminology.catalog_concepts WHERE id = $1',
          [CONCEPT],
        );
        insertedConcept = false;
      }
    }

    beforeAll(async () => {
      if (!APP.password) {
        throw new Error(
          'Defina DB_APP_PASSWORD o use RLS_TEST_BOOTSTRAP_LOCAL_ROLE=1 sólo en una base local desechable',
        );
      }
      admin = new pg.Client(ADMIN);
      await admin.connect();
      const patches = join(process.cwd(), 'database', 'SQL', 'patches');
      for (const patch of [
        '2026-08-05_tenant_rls.sql',
        '2026-11-04_v4287_conversaciones_directas_rls.sql',
      ]) {
        await admin.query(readFileSync(join(patches, patch), 'utf8'));
      }
      if (BOOTSTRAP_LOCAL_ROLE) {
        await admin.query(
          "ALTER ROLE mantra_app LOGIN PASSWORD 'mantra_app_dev'",
        );
      }
      await cleanup();
      // Superuser without FK triggers: no tenants or code systems to seed. The
      // concept must exist because `mantra_app` inserts with FK checks on.
      await admin.query('BEGIN');
      await admin.query("SET LOCAL session_replication_role = 'replica'");
      const seeded = await admin.query(
        `INSERT INTO terminology.catalog_concepts
         (id, code_system_version_id, code, display, created_at, updated_at)
       VALUES ($1, $1, 'community:V4287_PROBE', 'v4.2.87', now(), now())
       ON CONFLICT DO NOTHING`,
        [CONCEPT],
      );
      insertedConcept = seeded.rowCount === 1;
      await admin.query(insertConversation(OTHER_TENANT, TENANT_B));
      await admin.query('COMMIT');
      app = new pg.Client(APP);
      await app.connect();
    });

    afterAll(async () => {
      await app?.end();
      if (admin) {
        await cleanup();
        if (BOOTSTRAP_LOCAL_ROLE)
          await admin.query('ALTER ROLE mantra_app NOLOGIN');
        await admin.end();
      }
    });

    it('crea, lee y actualiza la conversación directa sin tenant', async () => {
      await asTenantA(async () => {
        await app.query(insertConversation(DIRECT, null));
        const read = await app.query(
          'SELECT id FROM community.conversations WHERE id = $1',
          [DIRECT],
        );
        expect(read.rowCount).toBe(1);
        const updated = await app.query(
          'UPDATE community.conversations SET message_count = 1 WHERE id = $1',
          [DIRECT],
        );
        expect(updated.rowCount).toBe(1);
      });
    });

    it('la conversación de otro tenant sigue invisible e intocable', async () => {
      await asTenantA(async () => {
        const where = 'WHERE id = $1';
        const params = [OTHER_TENANT];
        const read = await app.query(
          `SELECT 1 FROM community.conversations ${where}`,
          params,
        );
        const updated = await app.query(
          `UPDATE community.conversations SET message_count = 9 ${where}`,
          params,
        );
        const deleted = await app.query(
          `DELETE FROM community.conversations ${where}`,
          params,
        );
        expect([read.rowCount, updated.rowCount, deleted.rowCount]).toEqual([
          0, 0, 0,
        ]);
      });
    });

    it('no deja crear ni mover una conversación a otro tenant', async () => {
      await asTenantA(async () => {
        await expect(
          app.query(insertConversation(DIRECT, TENANT_B)),
        ).rejects.toThrow(/row-level security/);
      });
      await asTenantA(async () => {
        await app.query(insertConversation(DIRECT, null));
        await expect(
          app.query(
            'UPDATE community.conversations SET tenant_id = $2 WHERE id = $1',
            [DIRECT, TENANT_B],
          ),
        ).rejects.toThrow(/row-level security/);
      });
    });
  },
);
