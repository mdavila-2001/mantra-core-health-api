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
 *   4. With v4.2.84, the public profile of a recipient in another tenant (the
 *      practitioner the patient searched for) is readable but not writable,
 *      and a private one stays invisible. Without it, opening the chat answered
 *      412 «La persona no está disponible».
 *   5. With `2026-11-06_conversaciones_directas_acotadas.sql`: a tenant-less
 *      conversation cannot be deleted, a tenant's conversation cannot be moved
 *      out of its tenant (it would become readable by everyone), and a
 *      tenant-less row must be a direct one (no group).
 *
 * Always on (since 2026-11-06): a policy change is proven against the runtime
 * role, so this suite never skips itself. It needs the base model applied
 * (`database/SQL/apply_all.sql`) and the `mantra_app` credentials
 * (`DB_APP_PASSWORD`, or `RLS_TEST_BOOTSTRAP_LOCAL_ROLE=1` on a disposable local
 * base); without them it fails saying so. Inserts and deletes only its own rows.
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

const TENANT_A = '11111111-1111-4111-8111-1111111187a1';
const TENANT_B = '22222222-2222-4222-8222-2222222287b2';
const DIRECT = 'c0a20000-0000-4000-8000-000000004287';
const OTHER_TENANT = 'c0a20000-0000-4000-8000-0000000042b2';
const OWN_TENANT = 'c0a20000-0000-4000-8000-0000000042a3';
const CONCEPT = 'c0a20000-0000-4000-8000-0000000042cc';
const IDS = [DIRECT, OTHER_TENANT, OWN_TENANT];
// Deterministic seed concepts (`deterministicId`) used by the v4.2.84 policy.
const PROFILE_PUBLIC = '0006f171-fd25-503d-906e-b77423a5f1d0';
const STATE_ACTIVE = '38a1d301-f40d-5b17-a695-5e6d605f8b19';
const PROFILE_B_PUBLIC = 'c0a20000-0000-4000-8000-0000000042d1';
const PROFILE_B_PRIVATE = 'c0a20000-0000-4000-8000-0000000042d2';
const PROFILES = [PROFILE_B_PUBLIC, PROFILE_B_PRIVATE];
/** Whether this suite inserted `CONCEPT` (the seed may not have it). */
let insertedConcept = false;

const insertConversation = (
  id: string,
  tenantId: string | null,
  groupId: string | null = null,
) => ({
  text: `INSERT INTO community.conversations
         (id, tenant_id, conversation_type_concept_id, group_id, message_count,
          status_concept_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, $3, now(), now())`,
  values: [id, tenantId, CONCEPT, groupId],
});

describe('RLS · conversaciones directas sin tenant (v4.2.87, DB real)', () => {
  let admin: pg.Client;
  let app: pg.Client;

  /** Runs `work` as `mantra_app` with tenant A set, in a transaction always rolled back. */
  async function asTenantA<T>(work: () => Promise<T>): Promise<T> {
    await app.query('BEGIN');
    try {
      await app.query("SELECT set_config('app.system_context', 'false', true)");
      await app.query("SELECT set_config('app.current_tenant_id', $1, true)", [
        TENANT_A,
      ]);
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
    await admin.query(
      'DELETE FROM community.public_profiles WHERE id = ANY($1)',
      [PROFILES],
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
      '2026-11-02_v4284_rls_community_public_read.sql',
      '2026-11-04_v4287_conversaciones_directas_rls.sql',
      '2026-11-06_conversaciones_directas_acotadas.sql',
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
    // A failed seed is rolled back so `afterAll` can still clean up.
    await admin.query('BEGIN');
    try {
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
      await admin.query(insertConversation(OWN_TENANT, TENANT_A));
      for (const [id, visibility] of [
        [PROFILE_B_PUBLIC, PROFILE_PUBLIC],
        [PROFILE_B_PRIVATE, CONCEPT],
      ]) {
        await admin.query(
          `INSERT INTO community.public_profiles
               (id, tenant_id, target_type_concept_id, target_id, slug,
                display_name, visibility_concept_id, status_concept_id,
                created_at, updated_at)
             VALUES ($1, $2, $3, $1, $1::uuid::text, 'v4287', $4, $5, now(), now())`,
          [id, TENANT_B, CONCEPT, visibility, STATE_ACTIVE],
        );
      }
      await admin.query('COMMIT');
    } catch (error) {
      await admin.query('ROLLBACK');
      insertedConcept = false;
      throw error;
    }
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
      // Since 2026-11-06 the owner-is-fixed trigger stops it before RLS does.
      await expect(
        app.query(
          'UPDATE community.conversations SET tenant_id = $2 WHERE id = $1',
          [DIRECT, TENANT_B],
        ),
      ).rejects.toThrow(/no se cambian/);
    });
  });

  it('no deja borrar una conversación directa sin tenant', async () => {
    await asTenantA(async () => {
      await app.query(insertConversation(DIRECT, null));
      const deleted = await app.query(
        'DELETE FROM community.conversations WHERE id = $1',
        [DIRECT],
      );
      expect(deleted.rowCount).toBe(0);
      const still = await app.query(
        'SELECT 1 FROM community.conversations WHERE id = $1',
        [DIRECT],
      );
      expect(still.rowCount).toBe(1);
    });
  });

  it('no deja sacar una conversación de su tenant para que la lean todos', async () => {
    await asTenantA(async () => {
      // Readable as tenant A: it is tenant A's own conversation.
      const own = await app.query(
        'SELECT 1 FROM community.conversations WHERE id = $1',
        [OWN_TENANT],
      );
      expect(own.rowCount).toBe(1);
      await expect(
        app.query(
          'UPDATE community.conversations SET tenant_id = NULL WHERE id = $1',
          [OWN_TENANT],
        ),
      ).rejects.toThrow(/no se cambian/);
    });
  });

  it('una conversación sin tenant tiene que ser directa: sin grupo', async () => {
    await asTenantA(async () => {
      await expect(
        app.query(insertConversation(DIRECT, null, CONCEPT)),
      ).rejects.toThrow(/row-level security/);
    });
  });

  it('lee la ficha pública de otro tenant, pero no la privada ni la modifica', async () => {
    await asTenantA(async () => {
      const visible = await app.query<{ id: string }>(
        'SELECT id FROM community.public_profiles WHERE id = ANY($1)',
        [PROFILES],
      );
      expect(visible.rows.map((row) => row.id)).toEqual([PROFILE_B_PUBLIC]);
      const updated = await app.query(
        'UPDATE community.public_profiles SET display_name = $2 WHERE id = $1',
        [PROFILE_B_PUBLIC, 'x'],
      );
      expect(updated.rowCount).toBe(0);
    });
  });
});
